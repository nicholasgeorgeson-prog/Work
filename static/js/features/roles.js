/**
 * TechWriterReview - Roles Feature Module
 * 
 * Extracted in v3.0.19 from app.js (~1,600 LOC)
 * 
 * v3.0.80: Added comprehensive roles export - All/Current/Selected document CSV/JSON export
 * v3.0.77: Self-explanatory graph - visible weak nodes, distinct link types, enhanced legend
 * v3.0.76: Iterative peripheral node pruning - removes nodes with <2 connections to eliminate phantom lines
 * v3.0.73: Fixed dangling graph links - now filters links to ensure both endpoints exist
 * 
 * Contains:
 * - Role summary and modal UI
 * - RACI matrix functionality
 * - Role adjudication system
 * - D3.js interactive graph visualization
 * - Role export functionality
 * 
 * Dependencies:
 * - TWR.Utils (escapeHtml, truncate, debounce)
 * - TWR.State (State object)
 * - TWR.API (api function)
 * - TWR.Modals (toast, showModal)
 * - D3.js (optional, for graph visualization)
 */

'use strict';

window.TWR = window.TWR || {};

TWR.Roles = (function() {
    // ============================================================
    // GRAPH STATE & CONSTANTS
    // ============================================================
    
    const GraphState = {
        data: null,
        simulation: null,
        svg: null,
        selectedNode: null,
        highlightedNodes: new Set(),
        isD3Available: false,
        isPinned: false,
        labelMode: 'selected',
        fallbackRows: [],
        fallbackData: null,
        performanceMode: false,
        animationsEnabled: true,
        linkStylesEnabled: true,
        glowEnabled: true,
        isLoading: false
    };
    
    const LINK_STYLES = {
        'role-role': { dashArray: '6,3', label: 'Roles Co-occur', color: '#7c3aed' },
        'role-document': { dashArray: 'none', label: 'Role in Document', color: '#4A90D9' },
        'role-deliverable': { dashArray: '8,4', label: 'Role-Deliverable', color: '#F59E0B' },
        'approval': { dashArray: '4,4', label: 'Approval', color: '#EC4899' },
        'coordination': { dashArray: '2,4', label: 'Coordination', color: '#06b6d4' },
        'reports-to': { dashArray: '12,4,4,4', label: 'Reports To', color: '#6366f1' },
        'supports': { dashArray: '4,2', label: 'Supports', color: '#22c55e' },
        'default': { dashArray: 'none', label: 'Connection', color: '#888' }
    };
    
    const GRAPH_PERFORMANCE = {
        nodeThreshold: 50,
        linkThreshold: 100,
        animationThreshold: 30,
        glowThreshold: 40
    };
    
    const AdjudicationState = {
        decisions: new Map(),
        filter: 'pending',
        search: ''
    };
    
    let activeRaciDropdown = null;
    
    // ============================================================
    // UTILITY IMPORTS
    // ============================================================
    
    function getEscapeHtml() {
        return window.TWR?.Utils?.escapeHtml || window.escapeHtml || function(str) {
            if (str == null) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        };
    }
    
    function getTruncate() {
        return window.TWR?.Utils?.truncate || window.truncate || function(str, len) {
            if (!str) return '';
            return str.length > len ? str.substring(0, len - 3) + '...' : str;
        };
    }
    
    function getDebounce() {
        return window.TWR?.Utils?.debounce || window.debounce || function(fn, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, args), wait);
            };
        };
    }
    
    function getApi() { return window.TWR?.API?.api || window.api; }
    function getToast() { return window.TWR?.Modals?.toast || window.toast || function(t, m) { console.log(`[${t}] ${m}`); }; }
    function getShowModal() { return window.TWR?.Modals?.showModal || window.showModal; }
    function getState() { return window.TWR?.State?.State || window.State || {}; }
    function getSetLoading() { return window.TWR?.Modals?.showLoading || window.setLoading || function() {}; }

    // ============================================================
    // ROLES SUMMARY & MODAL
    // ============================================================
    
    function renderRolesSummary() {
        const escapeHtml = getEscapeHtml();
        const State = getState();
        const container = document.getElementById('roles-summary');
        if (!container || !State.roles) return;

        let rolesData = State.roles;
        if (State.roles.roles) rolesData = State.roles.roles;

        const roleEntries = Object.entries(rolesData);
        if (roleEntries.length === 0) {
            container.innerHTML = '<p class="text-muted">No roles detected</p>'; // SAFE: static HTML
            return;
        }

        roleEntries.sort((a, b) => {
            const countA = typeof a[1] === 'object' ? (a[1].frequency || a[1].count || a[1].occurrence_count || 1) : 1;
            const countB = typeof b[1] === 'object' ? (b[1].frequency || b[1].count || b[1].occurrence_count || 1) : 1;
            return countB - countA;
        });

        const topRoles = roleEntries.slice(0, 6);

        // SAFE: displayName, truncatedName escaped via escapeHtml(); count is numeric
        container.innerHTML = topRoles.map(([name, data]) => {
            const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
            const count = typeof data === 'object' ? (data.frequency || data.count || data.occurrence_count || 1) : 1;
            const truncatedName = displayName.length > 30 ? displayName.substring(0, 27) + '...' : displayName;
            const needsTooltip = displayName.length > 30;
            return `<div class="role-item" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-default);">
                <span class="role-name" style="font-size:13px;${needsTooltip ? 'cursor:help;' : ''}" ${needsTooltip ? `title="${escapeHtml(displayName)}"` : ''}>${escapeHtml(truncatedName)}</span>
                <span class="role-count" style="background:var(--bg-secondary);padding:2px 8px;border-radius:10px;font-size:11px;">${count}</span>
            </div>`;
        }).join('');

        if (roleEntries.length > 6) {
            container.innerHTML += `<div style="text-align:center;padding-top:10px;">
                <button class="btn btn-sm btn-ghost" onclick="TWR.Roles.showRolesModal()">View all ${roleEntries.length} roles</button>
            </div>`;
        }
    }

    async function showRolesModal() {
        const State = getState();
        const toast = getToast();
        const showModal = getShowModal();
        
        if (!State.roles || Object.keys(State.roles).length === 0) {
            toast('warning', 'No roles detected in document');
            return;
        }

        showModal('modal-roles');
        initRolesTabs();
        initDocumentFilter(); // v3.0.98: Initialize document filter dropdown
        initExportDropdown(); // v3.0.80: Initialize export dropdown
        renderRolesOverview();
        renderRolesDetails();
        renderRolesMatrix();
        renderDocumentLog();
        loadAdjudication();
        initAdjudication();
        
        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    }

    function initRolesTabs() {
        const navItems = document.querySelectorAll('.roles-nav-item, .roles-tab');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.dataset.tab;
                
                document.querySelectorAll('.roles-nav-item, .roles-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                item.classList.add('active');
                item.setAttribute('aria-selected', 'true');
                
                // v3.0.116: Use .active class instead of inline styles (CSS has !important rules)
                document.querySelectorAll('.roles-section').forEach(s => s.classList.remove('active'));
                document.getElementById(`roles-${tabName}`)?.classList.add('active');
                
                if (tabName === 'graph') renderRolesGraph();
                if (tabName === 'matrix') initRaciMatrixControls();
                if (tabName === 'roledocmatrix') renderRoleDocMatrix();
                if (tabName === 'adjudication') initBulkAdjudication();
            });
        });
        
        initGraphControls();
        updateRolesSidebarStats();
    }

    function updateRolesSidebarStats() {
        const State = getState();
        const rolesData = State.roles?.roles || State.roles || {};
        const roleEntries = Object.entries(rolesData);
        const totalRoles = roleEntries.length;
        let totalResp = 0;
        roleEntries.forEach(([name, data]) => {
            if (typeof data === 'object') totalResp += data.responsibilities?.length || data.count || 1;
        });
        
        const rolesCountEl = document.getElementById('sidebar-roles-count');
        const respCountEl = document.getElementById('sidebar-resp-count');
        if (rolesCountEl) rolesCountEl.textContent = totalRoles;
        if (respCountEl) respCountEl.textContent = totalResp;
    }

    // ============================================================
    // RACI MATRIX
    // ============================================================
    
    function initRaciMatrixControls() {
        const State = getState();
        
        const filterCritical = document.getElementById('matrix-filter-critical');
        if (filterCritical && !filterCritical._initialized) {
            filterCritical.addEventListener('change', () => {
                State.matrixFilterCritical = filterCritical.checked;
                renderRolesMatrix();
            });
            filterCritical._initialized = true;
        }
        
        const sortSelect = document.getElementById('matrix-sort');
        if (sortSelect && !sortSelect._initialized) {
            sortSelect.addEventListener('change', () => {
                State.matrixSort = sortSelect.value;
                renderRolesMatrix();
            });
            sortSelect._initialized = true;
        }
        
        const resetBtn = document.getElementById('btn-raci-reset');
        if (resetBtn && !resetBtn._initialized) {
            resetBtn.addEventListener('click', resetRaciEdits);
            resetBtn._initialized = true;
        }
        
        const exportBtn = document.getElementById('btn-raci-export');
        if (exportBtn && !exportBtn._initialized) {
            exportBtn.addEventListener('click', exportRaciMatrix);
            exportBtn._initialized = true;
        }
    }

    function resetRaciEdits() {
        const State = getState();
        const toast = getToast();
        State.raciEdits = {};
        renderRolesMatrix();
        toast('success', 'RACI matrix reset to detected values');
    }

    function initBulkAdjudication() {
        const selectAll = document.getElementById('adj-select-all');
        if (selectAll && !selectAll._initialized) {
            selectAll.addEventListener('change', () => {
                const items = document.querySelectorAll('.adjudication-item');
                items.forEach(item => {
                    const checkbox = item.querySelector('.adj-item-checkbox');
                    if (checkbox) checkbox.checked = selectAll.checked;
                    item.classList.toggle('selected', selectAll.checked);
                });
                updateBulkActionVisibility();
            });
            selectAll._initialized = true;
        }
    }

    function updateBulkActionVisibility() {
        const selectedItems = document.querySelectorAll('.adjudication-item.selected');
        const bulkActions = document.getElementById('adj-bulk-actions');
        const selectionInfo = document.getElementById('adj-selection-info');
        if (bulkActions) bulkActions.style.display = selectedItems.length > 0 ? 'flex' : 'none';
        if (selectionInfo) selectionInfo.textContent = `${selectedItems.length} selected`;
    }

    function bulkAdjudicate(status) {
        const toast = getToast();
        const selectedItems = document.querySelectorAll('.adjudication-item.selected');
        let count = 0;
        
        selectedItems.forEach(item => {
            const roleName = item.dataset.role;
            if (roleName) {
                const decision = AdjudicationState.decisions.get(roleName);
                if (decision) {
                    decision.status = status;
                    count++;
                }
            }
        });
        
        if (count > 0) {
            renderAdjudicationList();
            updateAdjudicationStats();
            toast('success', `Updated ${count} items to ${status}`);
        }
    }

    // ============================================================
    // ROLES VIEWS
    // ============================================================
    
    function renderRolesOverview() {
        const escapeHtml = getEscapeHtml();
        const State = getState();
        const container = document.getElementById('roles-overview-content');
        if (!container) return;

        const rolesData = State.roles?.roles || State.roles || {};
        let roleEntries = Object.entries(rolesData);

        if (roleEntries.length === 0) {
            container.innerHTML = '<p class="text-muted">No roles detected in document</p>';
            return;
        }

        // v3.0.98: Apply document filter
        const docFilter = document.getElementById('roles-document-filter')?.value || 'all';
        if (docFilter !== 'all') {
            roleEntries = roleEntries.filter(([name, data]) => {
                const sourceDocs = data.source_documents || [];
                return sourceDocs.some(doc => doc === docFilter || doc.includes(docFilter));
            });
        }

        roleEntries.sort((a, b) => {
            const countA = typeof a[1] === 'object' ? (a[1].frequency || a[1].count || 1) : 1;
            const countB = typeof b[1] === 'object' ? (b[1].frequency || b[1].count || 1) : 1;
            return countB - countA;
        });

        const totalMentions = roleEntries.reduce((sum, [, data]) => {
            return sum + (typeof data === 'object' ? (data.frequency || data.count || 1) : 1);
        }, 0);

        container.innerHTML = `
            <div class="roles-overview-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
                <div class="stat-card"><div class="stat-value">${roleEntries.length}</div><div class="stat-label">Unique Roles${docFilter !== 'all' ? ' (Filtered)' : ''}</div></div>
                <div class="stat-card"><div class="stat-value">${totalMentions}</div><div class="stat-label">Total Mentions</div></div>
                <div class="stat-card"><div class="stat-value">${(totalMentions / Math.max(1, roleEntries.length)).toFixed(1)}</div><div class="stat-label">Avg Mentions</div></div>
            </div>
            <div class="roles-chart-container" style="height:300px;margin-bottom:24px;"><canvas id="roles-distribution-chart"></canvas></div>
            <div class="roles-top-list"><h4>Top Roles by Frequency</h4>
                <div class="top-roles-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    ${roleEntries.slice(0, 10).map(([name, data], i) => {
                        const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
                        const count = typeof data === 'object' ? (data.frequency || data.count || 1) : 1;
                        const pct = ((count / totalMentions) * 100).toFixed(1);
                        return `<div class="top-role-item" style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg-secondary);border-radius:6px;">
                            <span class="rank" style="font-weight:bold;color:var(--accent);width:24px;">${i + 1}</span>
                            <span class="name" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span>
                            <span class="count" style="font-size:12px;color:var(--text-muted);">${count} (${pct}%)</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;

        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('roles-distribution-chart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: roleEntries.slice(0, 15).map(([name, data]) => {
                            const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
                            return displayName.length > 20 ? displayName.substring(0, 17) + '...' : displayName;
                        }),
                        datasets: [{
                            label: 'Mentions',
                            data: roleEntries.slice(0, 15).map(([, data]) => typeof data === 'object' ? (data.frequency || data.count || 1) : 1),
                            backgroundColor: 'rgba(74, 144, 217, 0.7)',
                            borderColor: 'rgba(74, 144, 217, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            }
        }
    }

    function renderRolesDetails() {
        const escapeHtml = getEscapeHtml();
        const truncate = getTruncate();
        const debounce = getDebounce();
        const State = getState();
        const container = document.getElementById('roles-details-content');
        if (!container) return;

        const rolesData = State.roles?.roles || State.roles || {};
        let roleEntries = Object.entries(rolesData);

        if (roleEntries.length === 0) {
            container.innerHTML = '<p class="text-muted">No roles detected</p>';
            return;
        }

        // v3.0.98: Apply document filter
        const docFilter = document.getElementById('roles-document-filter')?.value || 'all';
        if (docFilter !== 'all') {
            roleEntries = roleEntries.filter(([name, data]) => {
                const sourceDocs = data.source_documents || [];
                return sourceDocs.some(doc => doc === docFilter || doc.includes(docFilter));
            });
        }

        roleEntries.sort((a, b) => {
            const countA = typeof a[1] === 'object' ? (a[1].frequency || a[1].count || 1) : 1;
            const countB = typeof b[1] === 'object' ? (b[1].frequency || b[1].count || 1) : 1;
            return countB - countA;
        });

        container.innerHTML = `
            <div class="roles-search" style="margin-bottom:16px;">
                <input type="text" id="roles-detail-search" class="form-input" placeholder="Search roles..." style="width:100%;">
            </div>
            <div class="roles-detail-list" id="roles-detail-list">
                ${roleEntries.map(([name, data]) => {
                    const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
                    const count = typeof data === 'object' ? (data.frequency || data.count || 1) : 1;
                    const responsibilities = typeof data === 'object' ? (data.responsibilities || []) : [];
                    const actionTypes = typeof data === 'object' ? (data.action_types || {}) : {};
                    const sampleContexts = typeof data === 'object' ? (data.sample_contexts || []) : [];
                    const category = getCategoryForRole(displayName);
                    const color = getCategoryColorForRole(category);

                    return `<div class="role-detail-card" data-role="${escapeHtml(name)}" style="border-left:4px solid ${color};padding:16px;margin-bottom:12px;background:var(--bg-secondary);border-radius:0 8px 8px 0;">
                        <div class="role-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <h4 style="margin:0;">${escapeHtml(displayName)}</h4>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <span class="badge" style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">${category}</span>
                                <span class="count-badge">${count} mentions</span>
                            </div>
                        </div>
                        ${sampleContexts.length > 0 ? `<div class="sample-contexts" style="margin-top:12px;">
                            <strong style="font-size:12px;color:var(--text-muted);">Context from document:</strong>
                            <div style="margin-top:8px;font-size:13px;line-height:1.5;">
                                ${sampleContexts.slice(0, 3).map(ctx => 
                                    `<div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:4px;margin-bottom:6px;border-left:2px solid ${color};">
                                        ${highlightRoleInContext(ctx, displayName)}
                                    </div>`
                                ).join('')}
                            </div>
                        </div>` : ''}
                        ${responsibilities.length > 0 ? `<div class="responsibilities" style="margin-top:12px;">
                            <strong style="font-size:12px;color:var(--text-muted);">Responsibilities:</strong>
                            <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
                                ${responsibilities.slice(0, 5).map(r => `<li>${escapeHtml(truncate(String(r), 100))}</li>`).join('')}
                                ${responsibilities.length > 5 ? `<li style="color:var(--text-muted);">...and ${responsibilities.length - 5} more</li>` : ''}
                            </ul>
                        </div>` : ''}
                        ${Object.keys(actionTypes).length > 0 ? `<div class="action-types" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">
                            ${Object.entries(actionTypes).slice(0, 6).map(([action, cnt]) =>
                                `<span class="action-badge" style="background:var(--bg-tertiary);padding:2px 8px;border-radius:4px;font-size:11px;">${action}: ${cnt}</span>`
                            ).join('')}
                        </div>` : ''}
                        ${renderMappedStatements(data, displayName, escapeHtml, truncate)}
                    </div>`;
                }).join('')}
            </div>`;

        const searchInput = document.getElementById('roles-detail-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function() {
                const query = this.value.toLowerCase();
                document.querySelectorAll('.role-detail-card').forEach(card => {
                    const roleName = card.dataset.role.toLowerCase();
                    card.style.display = roleName.includes(query) ? 'block' : 'none';
                });
            }, 300));
        }
    }
    
    /**
     * v3.0.98: Highlight role name within context text
     */
    function highlightRoleInContext(context, roleName) {
        const escapeHtml = getEscapeHtml();
        if (!context || !roleName) return escapeHtml(context);

        // Escape the context first
        const safeContext = escapeHtml(context);
        const safeRoleName = escapeHtml(roleName);

        // Create regex to find role name (case insensitive)
        try {
            const regex = new RegExp(`(${safeRoleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return safeContext.replace(regex, '<mark class="role-highlight" style="background:rgba(74,144,217,0.3);padding:1px 2px;border-radius:2px;">$1</mark>');
        } catch (e) {
            return safeContext;
        }
    }

    /**
     * v3.0.114: Render mapped statements for a role from Statement Forge
     */
    function renderMappedStatements(roleData, roleName, escapeHtml, truncate) {
        // Check for mapped statements from auto-mapping
        const mappedStatements = roleData.mapped_statements || [];

        // Also check global State for mapping
        const State = getState();
        const globalMapping = State.roleStatementMapping?.role_to_statements || {};
        const globalStmts = globalMapping[roleName] || [];

        // Combine (prefer roleData.mapped_statements if available)
        const statements = mappedStatements.length > 0 ? mappedStatements : globalStmts;

        if (statements.length === 0) {
            return '';
        }

        // Color mapping for directive badges
        const directiveColors = {
            'shall': '#ef4444',
            'must': '#f97316',
            'will': '#3b82f6',
            'should': '#eab308',
            'may': '#22c55e'
        };

        return `
            <div class="mapped-statements" style="margin-top:16px;border-top:1px solid var(--border-default);padding-top:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <strong style="font-size:12px;color:var(--text-muted);">
                        <i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                        Extracted Statements (${statements.length})
                    </strong>
                    <button class="btn btn-ghost btn-xs toggle-statements-btn" onclick="this.closest('.mapped-statements').classList.toggle('collapsed')" style="font-size:11px;">
                        <span class="show-text">Show</span>
                        <span class="hide-text" style="display:none;">Hide</span>
                    </button>
                </div>
                <div class="statements-list" style="display:none;">
                    ${statements.slice(0, 10).map(stmt => {
                        const directive = (stmt.directive || '').toLowerCase();
                        const color = directiveColors[directive] || 'var(--text-muted)';
                        return `
                            <div class="statement-item" style="background:var(--bg-tertiary);padding:8px 12px;border-radius:4px;margin-bottom:6px;font-size:13px;border-left:3px solid ${color};">
                                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                                    <span style="flex:1;">${escapeHtml(truncate(stmt.description || '', 200))}</span>
                                    ${directive ? `<span style="background:${color};color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;text-transform:uppercase;white-space:nowrap;">${directive}</span>` : ''}
                                </div>
                                ${stmt.number ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">§ ${escapeHtml(stmt.number)}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                    ${statements.length > 10 ? `<div style="color:var(--text-muted);font-size:12px;padding:4px;">...and ${statements.length - 10} more statements</div>` : ''}
                </div>
            </div>
            <style>
                .mapped-statements .statements-list { display: none; }
                .mapped-statements:not(.collapsed) .statements-list { display: block; }
                .mapped-statements:not(.collapsed) .show-text { display: none; }
                .mapped-statements:not(.collapsed) .hide-text { display: inline !important; }
            </style>
        `;
    }

    /**
     * v3.0.98: Initialize document filter dropdown
     * v3.0.107: Fixed to populate from source_documents or current filename
     * v3.0.116: Also fetch from scan history API for complete document list
     */
    async function initDocumentFilter() {
        const State = getState();
        const api = getApi();
        const filterSelect = document.getElementById('roles-document-filter');
        if (!filterSelect) return;

        // Build list of unique documents
        const rolesData = State.roles?.roles || State.roles || {};
        const documents = new Set();

        // v3.0.107: Get current filename as fallback
        const currentFilename = State.filename || State.currentFilename || '';

        // Get documents from roles source_documents
        Object.values(rolesData).forEach(data => {
            const sourceDocs = data.source_documents || [];
            if (sourceDocs.length > 0) {
                sourceDocs.forEach(doc => documents.add(doc));
            }
        });

        // v3.0.116: Also fetch from scan history API
        try {
            console.log('[TWR Roles] Fetching scan history for document filter...');
            const response = await fetch('/api/scan-history?limit=50');
            const result = await response.json();
            console.log('[TWR Roles] Scan history response:', result);
            if (result.success && result.data) {
                result.data.forEach(scan => {
                    if (scan.filename) {
                        documents.add(scan.filename);
                        console.log('[TWR Roles] Added document from scan history:', scan.filename);
                    }
                });
            }
        } catch (e) {
            console.warn('[TWR Roles] Could not fetch scan history for document filter:', e);
        }

        console.log('[TWR Roles] Total documents for filter:', documents.size, Array.from(documents));

        // Add current filename if we have one
        if (currentFilename) {
            documents.add(currentFilename);
        }

        // Clear and populate options
        filterSelect.innerHTML = '<option value="all">All Documents</option>';

        Array.from(documents).sort().forEach(doc => {
            const option = document.createElement('option');
            option.value = doc;
            option.textContent = doc.length > 40 ? doc.substring(0, 37) + '...' : doc;
            option.title = doc;
            filterSelect.appendChild(option);
        });

        // Add change handler
        if (!filterSelect._initialized) {
            filterSelect.addEventListener('change', () => {
                // Re-render all tabs with filter applied
                renderRolesOverview();
                renderRolesDetails();
                renderRolesMatrix();
            });
            filterSelect._initialized = true;
        }
    }

    function renderRolesMatrix() {
        const escapeHtml = getEscapeHtml();
        const State = getState();
        const container = document.getElementById('matrix-container');
        if (!container) return;

        const rolesData = State.roles?.roles || State.roles || {};
        const roleEntries = Object.entries(rolesData);

        if (roleEntries.length === 0) {
            container.innerHTML = '<p class="text-muted">No roles to display in matrix</p>';
            return;
        }

        const raciMatrix = {};
        const filterCritical = State.matrixFilterCritical || false;
        const sortBy = State.matrixSort || 'total';

        roleEntries.forEach(([name, data]) => {
            const responsibilities = typeof data === 'object' ? (data.responsibilities || []) : [];
            const actionTypes = typeof data === 'object' ? (data.action_types || {}) : {};

            raciMatrix[name] = { R: 0, A: 0, C: 0, I: 0 };

            Object.entries(actionTypes).forEach(([action, count]) => {
                const actionLower = action.toLowerCase();
                if (/shall|must|perform|execute|implement|develop|create|prepare|conduct/.test(actionLower)) {
                    raciMatrix[name].R += count;
                } else if (/approve|authorize|sign|certify|accept/.test(actionLower)) {
                    raciMatrix[name].A += count;
                } else if (/review|comment|advise|consult|coordinate|support/.test(actionLower)) {
                    raciMatrix[name].C += count;
                } else if (/inform|notify|receive|report|monitor/.test(actionLower)) {
                    raciMatrix[name].I += count;
                } else {
                    raciMatrix[name].R += count;
                }
            });

            if (State.raciEdits && State.raciEdits[name]) {
                Object.entries(State.raciEdits[name]).forEach(([type, value]) => {
                    raciMatrix[name][type] = value;
                });
            }
        });

        State.raciMatrix = raciMatrix;

        let roleNames = Object.keys(raciMatrix);

        if (filterCritical) {
            roleNames = roleNames.filter(name => {
                const raci = raciMatrix[name];
                return raci.R > 0 || raci.A > 0;
            });
        }

        roleNames.sort((a, b) => {
            const raciA = raciMatrix[a];
            const raciB = raciMatrix[b];
            const totalA = raciA.R + raciA.A + raciA.C + raciA.I;
            const totalB = raciB.R + raciB.A + raciB.C + raciB.I;

            switch (sortBy) {
                case 'name': return a.localeCompare(b);
                case 'responsible': return raciB.R - raciA.R;
                case 'accountable': return raciB.A - raciA.A;
                default: return totalB - totalA;
            }
        });

        State.matrixRoleNames = roleNames;

        let html = `<table class="raci-matrix-table"><thead><tr>
            <th>Role</th>
            <th class="raci-header raci-r" title="Responsible - performs the work">R</th>
            <th class="raci-header raci-a" title="Accountable - approves the work">A</th>
            <th class="raci-header raci-c" title="Consulted - provides input">C</th>
            <th class="raci-header raci-i" title="Informed - kept in the loop">I</th>
            <th>Total</th>
        </tr></thead><tbody>`;

        roleNames.forEach(roleName => {
            const raci = raciMatrix[roleName];
            const displayName = typeof rolesData[roleName] === 'object' ? (rolesData[roleName].canonical_name || roleName) : roleName;
            const total = raci.R + raci.A + raci.C + raci.I;
            const hasREdit = State.raciEdits?.[roleName]?.R !== undefined;
            const hasAEdit = State.raciEdits?.[roleName]?.A !== undefined;
            const hasCEdit = State.raciEdits?.[roleName]?.C !== undefined;
            const hasIEdit = State.raciEdits?.[roleName]?.I !== undefined;

            html += `<tr data-role="${escapeHtml(roleName)}">
                <td class="role-name" title="${escapeHtml(roleName)}">${escapeHtml(displayName)}</td>
                <td class="raci-cell ${raci.R > 0 ? 'raci-r' : ''} ${hasREdit ? 'edited' : ''}" onclick="TWR.Roles.editRaciCell('${escapeHtml(roleName)}', 'R', this)" title="Click to edit">${raci.R || '-'}</td>
                <td class="raci-cell ${raci.A > 0 ? 'raci-a' : ''} ${hasAEdit ? 'edited' : ''}" onclick="TWR.Roles.editRaciCell('${escapeHtml(roleName)}', 'A', this)" title="Click to edit">${raci.A || '-'}</td>
                <td class="raci-cell ${raci.C > 0 ? 'raci-c' : ''} ${hasCEdit ? 'edited' : ''}" onclick="TWR.Roles.editRaciCell('${escapeHtml(roleName)}', 'C', this)" title="Click to edit">${raci.C || '-'}</td>
                <td class="raci-cell ${raci.I > 0 ? 'raci-i' : ''} ${hasIEdit ? 'edited' : ''}" onclick="TWR.Roles.editRaciCell('${escapeHtml(roleName)}', 'I', this)" title="Click to edit">${raci.I || '-'}</td>
                <td class="raci-total">${total}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function editRaciCell(roleName, raciType, cellElement) {
        const escapeHtml = getEscapeHtml();
        closeRaciDropdown();
        cellElement.classList.add('editing');
        
        const dropdown = document.createElement('div');
        dropdown.className = 'raci-edit-dropdown';
        dropdown.innerHTML = `
            <button class="raci-edit-btn raci-btn-r" onclick="TWR.Roles.setRaciValue('${escapeHtml(roleName)}', '${raciType}', 1)" title="Set as Responsible">R</button>
            <button class="raci-edit-btn raci-btn-a" onclick="TWR.Roles.setRaciValue('${escapeHtml(roleName)}', '${raciType}', 1, 'A')" title="Set as Accountable">A</button>
            <button class="raci-edit-btn raci-btn-c" onclick="TWR.Roles.setRaciValue('${escapeHtml(roleName)}', '${raciType}', 1, 'C')" title="Set as Consulted">C</button>
            <button class="raci-edit-btn raci-btn-i" onclick="TWR.Roles.setRaciValue('${escapeHtml(roleName)}', '${raciType}', 1, 'I')" title="Set as Informed">I</button>
            <button class="raci-edit-btn raci-btn-clear" onclick="TWR.Roles.setRaciValue('${escapeHtml(roleName)}', '${raciType}', 0)" title="Clear">×</button>`;
        
        cellElement.appendChild(dropdown);
        activeRaciDropdown = { element: dropdown, cell: cellElement };
        
        setTimeout(() => { document.addEventListener('click', closeRaciDropdownOnClickOutside); }, 10);
    }

    function closeRaciDropdown() {
        if (activeRaciDropdown) {
            activeRaciDropdown.element.remove();
            activeRaciDropdown.cell.classList.remove('editing');
            activeRaciDropdown = null;
            document.removeEventListener('click', closeRaciDropdownOnClickOutside);
        }
    }

    function closeRaciDropdownOnClickOutside(e) {
        if (activeRaciDropdown && !activeRaciDropdown.element.contains(e.target)) closeRaciDropdown();
    }

    function setRaciValue(roleName, originalType, value, newType) {
        const State = getState();
        if (!State.raciEdits) State.raciEdits = {};
        if (!State.raciEdits[roleName]) State.raciEdits[roleName] = {};
        
        const targetType = newType || originalType;
        if (newType && newType !== originalType) {
            State.raciEdits[roleName][originalType] = 0;
            State.raciEdits[roleName][targetType] = value;
        } else {
            State.raciEdits[roleName][targetType] = value;
        }
        
        closeRaciDropdown();
        renderRolesMatrix();
    }

    function toggleMatrixCriticalFilter() {
        const State = getState();
        State.matrixFilterCritical = document.getElementById('matrix-filter-critical')?.checked || false;
        renderRolesMatrix();
    }

    function changeMatrixSort(value) {
        const State = getState();
        State.matrixSort = value;
        renderRolesMatrix();
    }

    async function exportRaciMatrix() {
        const State = getState();
        const toast = getToast();
        
        if (!State.raciMatrix || !State.matrixRoleNames) {
            toast('warning', 'No matrix data to export');
            return;
        }
        
        const rolesData = State.roles.roles || State.roles;
        let csv = 'Role,Responsible (R),Accountable (A),Consulted (C),Informed (I),Total,Primary Type\n';
        
        State.matrixRoleNames.forEach(roleName => {
            const raci = State.raciMatrix[roleName];
            const displayName = typeof rolesData[roleName] === 'object' ? (rolesData[roleName].canonical_name || roleName) : roleName;
            const total = raci.R + raci.A + raci.C + raci.I;
            let primaryType = '-';
            const max = Math.max(raci.R, raci.A, raci.C, raci.I);
            if (max > 0) {
                if (raci.R === max) primaryType = 'R';
                else if (raci.A === max) primaryType = 'A';
                else if (raci.C === max) primaryType = 'C';
                else if (raci.I === max) primaryType = 'I';
            }
            csv += `"${displayName}",${raci.R},${raci.A},${raci.C},${raci.I},${total},${primaryType}\n`;
        });
        
        csv += '\nLegend:,R=Responsible (shall/must/performs),A=Accountable (approves),C=Consulted (reviews),I=Informed (notified)\n';
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RACI_Matrix_${State.filename || 'roles'}_${getTimestamp()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast('success', 'RACI matrix exported');
    }

    async function renderDocumentLog() {
        const escapeHtml = getEscapeHtml();
        const State = getState();
        const api = getApi();
        const tbody = document.getElementById('document-log-body');
        const emptyMsg = document.getElementById('document-log-empty');
        
        if (!State.roleDocuments || State.roleDocuments.length === 0) {
            try {
                const response = await api('/scan-history?limit=20', 'GET');
                if (response && response.success && response.data && response.data.length > 0) {
                    State.roleDocuments = response.data.map(scan => ({
                        filename: scan.filename,
                        analyzed: scan.scanned_at || scan.timestamp,
                        roles: scan.role_count || 0,
                        responsibilities: scan.responsibility_count || scan.issue_count || 0,
                        score: scan.score,
                        grade: scan.grade
                    }));
                    const countEl = document.getElementById('total-documents-count');
                    if (countEl) countEl.textContent = State.roleDocuments.length;
                }
            } catch (e) {
                console.warn('[TWR Roles] Could not load scan history:', e);
            }
        }
        
        const documents = State.roleDocuments || [{
            filename: State.filename || 'Current Document',
            analyzed: new Date().toISOString(),
            roles: Object.keys(State.roles.roles || State.roles).length,
            responsibilities: Object.values(State.roles.roles || State.roles).reduce((sum, r) => sum + (r.responsibilities?.length || r.count || 1), 0)
        }];
        
        if (documents.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (tbody) tbody.innerHTML = '';
            return;
        }
        
        if (emptyMsg) emptyMsg.style.display = 'none';
        
        if (tbody) {
            tbody.innerHTML = documents.map(doc => {
                const date = new Date(doc.analyzed);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                return `<tr>
                    <td><strong>${escapeHtml(doc.filename)}</strong></td>
                    <td>${dateStr}</td>
                    <td>${doc.roles}</td>
                    <td>${doc.responsibilities}</td>
                    <td><button class="btn btn-xs btn-ghost" onclick="TWR.Roles.viewDocumentRoles('${escapeHtml(doc.filename)}')" title="View roles"><i data-lucide="eye"></i></button></td>
                </tr>`;
            }).join('');
        }
    }

    function viewDocumentRoles(filename) {
        const toast = getToast();
        toast('info', `Viewing roles from: ${filename}`);
        document.querySelector('.roles-tab[data-tab="details"]')?.click();
    }

    // ============================================================
    // ROLE-DOCUMENT MATRIX (v3.0.97)
    // ============================================================
    
    let roleDocMatrixData = null;
    
    async function renderRoleDocMatrix() {
        const escapeHtml = getEscapeHtml();
        const api = getApi();
        const toast = getToast();
        const State = getState();
        const container = document.getElementById('roledoc-matrix-container');
        const emptyMsg = document.getElementById('roledoc-empty');
        
        if (!container) return;
        
        container.innerHTML = '<p class="text-muted"><i data-lucide="loader" class="spin"></i> Loading matrix data...</p>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        try {
            const response = await api('/roles/matrix', 'GET');
            
            console.log('[TWR Roles] Matrix API response:', response);
            
            // v3.0.109: Improved response validation - check for actual data content
            if (!response.success) {
                container.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center;">
                    <p><i data-lucide="database" style="width:32px;height:32px;opacity:0.5;"></i></p>
                    <p><strong>Role-Document Matrix Not Available</strong></p>
                    <p style="font-size:13px;">${escapeHtml(response.error || 'Unable to load matrix data')}</p>
                </div>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            // v3.0.109: Handle case where response.data might be null/undefined
            const data = response.data || {};
            roleDocMatrixData = data;
            
            const documents = data.documents || {};
            const roles = data.roles || {};
            const connections = data.connections || {};
            
            const docIds = Object.keys(documents);
            const roleIds = Object.keys(roles);
            
            console.log('[TWR Roles] Matrix data:', { 
                docCount: docIds.length, 
                roleCount: roleIds.length,
                connectionCount: Object.keys(connections).length 
            });
            
            if (roleIds.length === 0 || docIds.length < 1) {
                // v3.0.106: Show current session roles if matrix is empty but we have session data
                const sessionRoles = State.roles?.roles || State.roles || {};
                const sessionRoleCount = Object.keys(sessionRoles).length;
                
                if (sessionRoleCount > 0) {
                    container.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center;">
                        <p><i data-lucide="file-search" style="width:32px;height:32px;opacity:0.5;"></i></p>
                        <p><strong>No Cross-Document Data Yet</strong></p>
                        <p style="font-size:13px;">Found <strong>${sessionRoleCount} roles</strong> in current document.</p>
                        <p style="font-size:12px;margin-top:8px;">Review more documents to build the cross-document matrix.<br>
                        Use the <strong>Details</strong> tab to see roles from the current document.</p>
                    </div>`;
                } else {
                    container.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center;">
                        <p><i data-lucide="database" style="width:32px;height:32px;opacity:0.5;"></i></p>
                        <p><strong>Role-Document Matrix Not Available</strong></p>
                        <p style="font-size:13px;">The matrix requires scan history data from multiple document reviews.</p>
                        <p style="font-size:12px;margin-top:12px;">To populate this matrix:<br>
                        1. Review documents using the main review feature<br>
                        2. Scan history will automatically record roles found<br>
                        3. Return here to see cross-document role analysis</p>
                    </div>`;
                    if (emptyMsg) emptyMsg.style.display = 'block';
                }
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            if (emptyMsg) emptyMsg.style.display = 'none';
            
            const showCounts = document.getElementById('roledoc-show-counts')?.checked || false;
            
            // Build header row
            let html = '<div class="roledoc-table-wrapper"><table class="roledoc-matrix-table"><thead><tr>';
            html += '<th class="roledoc-role-header">Role</th>';
            
            docIds.forEach(docId => {
                const docName = documents[docId] || 'Unknown';
                const shortName = docName.length > 20 ? docName.substring(0, 17) + '...' : docName;
                html += `<th class="roledoc-doc-header" title="${escapeHtml(docName)}">${escapeHtml(shortName)}</th>`;
            });
            
            html += '<th class="roledoc-total-header">Total</th></tr></thead><tbody>';
            
            // Sort roles alphabetically
            const sortedRoleIds = roleIds.sort((a, b) => {
                return (roles[a] || '').localeCompare(roles[b] || '');
            });
            
            // Build data rows
            sortedRoleIds.forEach(roleId => {
                const roleName = roles[roleId] || 'Unknown';
                const roleConnections = connections[roleId] || {};
                let totalDocs = 0;
                
                html += `<tr data-role-id="${escapeHtml(roleId)}">`;
                html += `<td class="roledoc-role-name" title="${escapeHtml(roleName)}">${escapeHtml(roleName)}</td>`;
                
                docIds.forEach(docId => {
                    const count = roleConnections[docId] || 0;
                    if (count > 0) {
                        totalDocs++;
                        if (showCounts) {
                            html += `<td class="roledoc-cell roledoc-present" title="${count} mentions">${count}</td>`;
                        } else {
                            html += `<td class="roledoc-cell roledoc-present" title="${count} mentions">✓</td>`;
                        }
                    } else {
                        html += `<td class="roledoc-cell roledoc-absent">-</td>`;
                    }
                });
                
                html += `<td class="roledoc-total">${totalDocs}</td>`;
                html += '</tr>';
            });
            
            html += '</tbody></table></div>';
            
            // Summary stats
            html += `<div class="roledoc-summary">
                <span><strong>${roleIds.length}</strong> roles</span>
                <span><strong>${docIds.length}</strong> documents</span>
            </div>`;
            
            container.innerHTML = html;
            
            // Initialize controls
            initRoleDocMatrixControls();
            
        } catch (e) {
            console.error('[TWR Roles] Failed to load role-document matrix:', e);
            // v3.0.109: Better error display with retry button
            container.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center;">
                <p><i data-lucide="alert-circle" style="width:32px;height:32px;opacity:0.5;color:var(--danger);"></i></p>
                <p class="text-error"><strong>Error Loading Matrix</strong></p>
                <p style="font-size:13px;">${getEscapeHtml()(e.message || 'Unknown error')}</p>
                <p style="margin-top:12px;">
                    <button class="btn btn-sm btn-secondary" onclick="TWR.Roles.renderRoleDocMatrix()">
                        <i data-lucide="refresh-cw"></i> Retry
                    </button>
                </p>
            </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
    
    function initRoleDocMatrixControls() {
        const showCountsCheckbox = document.getElementById('roledoc-show-counts');
        const refreshBtn = document.getElementById('btn-roledoc-refresh');
        const exportCsvBtn = document.getElementById('btn-roledoc-export-csv');
        const exportExcelBtn = document.getElementById('btn-roledoc-export-excel');
        
        if (showCountsCheckbox && !showCountsCheckbox._initialized) {
            showCountsCheckbox._initialized = true;
            showCountsCheckbox.addEventListener('change', () => {
                renderRoleDocMatrix();
            });
        }
        
        if (refreshBtn && !refreshBtn._initialized) {
            refreshBtn._initialized = true;
            refreshBtn.addEventListener('click', () => {
                roleDocMatrixData = null;
                renderRoleDocMatrix();
            });
        }
        
        if (exportCsvBtn && !exportCsvBtn._initialized) {
            exportCsvBtn._initialized = true;
            exportCsvBtn.addEventListener('click', exportRoleDocMatrixCSV);
        }
        
        if (exportExcelBtn && !exportExcelBtn._initialized) {
            exportExcelBtn._initialized = true;
            exportExcelBtn.addEventListener('click', exportRoleDocMatrixExcel);
        }
    }
    
    function exportRoleDocMatrixCSV() {
        const toast = getToast();
        
        if (!roleDocMatrixData) {
            toast('warning', 'No matrix data to export. Refresh the matrix first.');
            return;
        }
        
        const { documents, roles, connections } = roleDocMatrixData;
        const docIds = Object.keys(documents);
        const roleIds = Object.keys(roles);
        
        if (roleIds.length === 0) {
            toast('warning', 'No roles to export');
            return;
        }
        
        // Build CSV
        let csv = 'Role';
        docIds.forEach(docId => {
            const docName = (documents[docId] || 'Unknown').replace(/"/g, '""');
            csv += `,"${docName}"`;
        });
        csv += ',Total Documents\n';
        
        roleIds.sort((a, b) => (roles[a] || '').localeCompare(roles[b] || '')).forEach(roleId => {
            const roleName = (roles[roleId] || 'Unknown').replace(/"/g, '""');
            csv += `"${roleName}"`;
            
            let totalDocs = 0;
            const roleConnections = connections[roleId] || {};
            
            docIds.forEach(docId => {
                const count = roleConnections[docId] || 0;
                csv += `,${count > 0 ? count : ''}`;
                if (count > 0) totalDocs++;
            });
            
            csv += `,${totalDocs}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `Role_Document_Matrix_${getTimestamp()}.csv`);
        
        toast('success', 'Role-Document Matrix exported to CSV');
    }
    
    async function exportRoleDocMatrixExcel() {
        const toast = getToast();
        const api = getApi();
        const setLoading = getSetLoading();
        
        if (!roleDocMatrixData) {
            toast('warning', 'No matrix data to export. Refresh the matrix first.');
            return;
        }
        
        const State = getState();
        if (!State.capabilities?.excel_export) {
            // Fallback to CSV if Excel not available
            toast('info', 'Excel export not available, exporting as CSV instead');
            exportRoleDocMatrixCSV();
            return;
        }
        
        setLoading(true, 'Generating Excel file...');
        
        try {
            const response = await fetch('/api/roles/matrix/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': State.csrfToken || document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ format: 'xlsx' })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                downloadBlob(blob, `Role_Document_Matrix_${getTimestamp()}.xlsx`);
                toast('success', 'Role-Document Matrix exported to Excel');
            } else {
                // Fallback to CSV
                toast('info', 'Excel export failed, exporting as CSV instead');
                exportRoleDocMatrixCSV();
            }
        } catch (e) {
            console.error('[TWR Roles] Excel export failed:', e);
            toast('info', 'Excel export not available, exporting as CSV instead');
            exportRoleDocMatrixCSV();
        }
        
        setLoading(false);
    }

    // ============================================================
    // ADJUDICATION
    // ============================================================
    
    function initAdjudication() {
        const State = getState();
        const debounce = getDebounce();
        const rolesData = State.roles?.roles || State.roles || {};
        
        Object.keys(rolesData).forEach(roleName => {
            if (!AdjudicationState.decisions.has(roleName)) {
                const data = rolesData[roleName];
                const confidence = typeof data === 'object' ? (data.avg_confidence || data.confidence || 0.8) : 0.8;
                
                AdjudicationState.decisions.set(roleName, {
                    status: 'pending',
                    confidence: confidence,
                    notes: '',
                    isDeliverable: detectDeliverable(roleName, data),
                    suggestedType: suggestRoleType(roleName, data)
                });
            }
        });
        
        document.getElementById('adj-filter')?.addEventListener('change', renderAdjudicationList);
        document.getElementById('adj-search')?.addEventListener('input', debounce(renderAdjudicationList, 300));
        
        renderAdjudicationList();
        updateAdjudicationStats();
    }

    function detectDeliverable(roleName, data) {
        const deliverablePatterns = [
            /\b(document|report|plan|specification|analysis|review|audit|assessment)\b/i,
            /\b(drawing|schematic|diagram|model|prototype)\b/i,
            /\b(database|repository|archive|library)\b/i,
            /\b(schedule|timeline|roadmap|milestone)\b/i,
            /\b(budget|estimate|proposal|contract)\b/i,
            /\b(test|verification|validation)\s+(report|results|data)\b/i,
            /\b(requirements|interface|design)\s+(document|spec)/i,
            /\bICD\b|\bSRS\b|\bSDD\b|\bCDRL\b|\bDID\b/i
        ];
        const name = roleName.toLowerCase();
        return deliverablePatterns.some(p => p.test(name));
    }

    function suggestRoleType(roleName, data) {
        const name = roleName.toLowerCase();
        const rolePatterns = [
            /\b(engineer|manager|lead|director|officer|specialist|analyst)\b/i,
            /\b(coordinator|administrator|supervisor|inspector|reviewer)\b/i,
            /\b(team|group|committee|board|panel|council)\b/i
        ];
        
        if (rolePatterns.some(p => p.test(name))) return 'role';
        if (detectDeliverable(roleName, data)) return 'deliverable';
        
        const actionTypes = typeof data === 'object' ? (data.action_types || {}) : {};
        const hasActions = Object.values(actionTypes).some(v => v > 0);
        return hasActions ? 'role' : 'unknown';
    }

    function renderAdjudicationList() {
        const escapeHtml = getEscapeHtml();
        const State = getState();
        const container = document.getElementById('adjudication-list');
        if (!container) return;
        
        const rolesData = State.roles?.roles || State.roles || {};
        const filter = document.getElementById('adj-filter')?.value || 'pending';
        const search = (document.getElementById('adj-search')?.value || '').toLowerCase();
        
        AdjudicationState.filter = filter;
        AdjudicationState.search = search;
        
        let roleEntries = Object.entries(rolesData).filter(([name, data]) => {
            const decision = AdjudicationState.decisions.get(name) || { status: 'pending', confidence: 0.8 };
            if (filter === 'pending' && decision.status !== 'pending') return false;
            if (filter === 'confirmed' && decision.status !== 'confirmed') return false;
            if (filter === 'deliverable' && decision.status !== 'deliverable') return false;
            if (filter === 'rejected' && decision.status !== 'rejected') return false;
            if (filter === 'low-confidence' && decision.confidence >= 0.7) return false;
            if (search && !name.toLowerCase().includes(search)) return false;
            return true;
        });
        
        roleEntries.sort((a, b) => {
            const confA = AdjudicationState.decisions.get(a[0])?.confidence || 0.8;
            const confB = AdjudicationState.decisions.get(b[0])?.confidence || 0.8;
            return confA - confB;
        });
        
        if (roleEntries.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:40px;text-align:center;">
                <i data-lucide="check-circle" style="width:48px;height:48px;color:var(--success);margin-bottom:16px;"></i>
                <p>No items match the current filter.</p>
            </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        container.innerHTML = roleEntries.map(([name, data]) => {
            const decision = AdjudicationState.decisions.get(name) || { status: 'pending', confidence: 0.8 };
            const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
            const count = typeof data === 'object' ? (data.frequency || data.count || 1) : 1;
            const confidence = (decision.confidence * 100).toFixed(0);
            const suggestedType = decision.suggestedType || 'unknown';
            
            const statusClass = { 'pending': 'status-pending', 'confirmed': 'status-confirmed', 'deliverable': 'status-deliverable', 'rejected': 'status-rejected' }[decision.status] || 'status-pending';
            const statusIcon = { 'pending': 'clock', 'confirmed': 'check-circle', 'deliverable': 'file-text', 'rejected': 'x-circle' }[decision.status] || 'clock';
            
            return `<div class="adjudication-item selectable ${statusClass}" data-role="${escapeHtml(name)}">
                <input type="checkbox" class="adj-item-checkbox" onchange="TWR.Roles.toggleAdjItemSelection(this)">
                <div class="adj-item-main">
                    <div class="adj-item-header">
                        <span class="adj-item-name" title="${escapeHtml(name)}" data-original="${escapeHtml(name)}">${escapeHtml(displayName)}</span>
                        <button class="btn btn-xs btn-ghost adj-edit-btn" onclick="TWR.Roles.editRoleName('${escapeHtml(name)}')" title="Edit role name"><i data-lucide="edit-2"></i></button>
                    </div>
                    <div class="adj-item-meta">
                        <span class="confidence-badge ${confidence < 70 ? 'low' : ''}">${confidence}%</span>
                        <span class="count-badge">${count} occurrences</span>
                        ${suggestedType === 'deliverable' ? '<span class="suggested-badge deliverable">Likely Deliverable</span>' : ''}
                    </div>
                    <div class="adj-item-status"><i data-lucide="${statusIcon}"></i><span>${decision.status.charAt(0).toUpperCase() + decision.status.slice(1)}</span></div>
                </div>
                <div class="adj-item-actions">
                    <button class="btn btn-xs ${decision.status === 'confirmed' ? 'btn-success' : 'btn-ghost'}" onclick="TWR.Roles.setAdjudicationStatus('${escapeHtml(name)}', 'confirmed')" title="Confirm as Role"><i data-lucide="user-check"></i><span class="btn-label">Role</span></button>
                    <button class="btn btn-xs ${decision.status === 'deliverable' ? 'btn-info' : 'btn-ghost'}" onclick="TWR.Roles.setAdjudicationStatus('${escapeHtml(name)}', 'deliverable')" title="Mark as Deliverable"><i data-lucide="file-text"></i><span class="btn-label">Doc</span></button>
                    <button class="btn btn-xs ${decision.status === 'rejected' ? 'btn-error' : 'btn-ghost'}" onclick="TWR.Roles.setAdjudicationStatus('${escapeHtml(name)}', 'rejected')" title="Reject (False Positive)"><i data-lucide="x-circle"></i><span class="btn-label">Reject</span></button>
                </div>
                ${(typeof data === 'object' && data.sample_contexts && data.sample_contexts.length > 0) ? `
                <div class="adj-item-contexts">
                    <button class="btn btn-xs btn-ghost adj-context-toggle" onclick="TWR.Roles.toggleAdjContext(this)" title="Show context sentences"><i data-lucide="chevron-down"></i> Show context</button>
                    <div class="adj-context-list" style="display:none;">${data.sample_contexts.map(ctx => `<div class="adj-context-sentence">"${escapeHtml(ctx)}"</div>`).join('')}</div>
                </div>` : ''}
            </div>`;
        }).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        updateAdjudicationStats();
        
        const selectAll = document.getElementById('adj-select-all');
        if (selectAll) selectAll.checked = false;
        updateBulkActionVisibility();
    }

    function toggleAdjItemSelection(checkbox) {
        const item = checkbox.closest('.adjudication-item');
        if (item) item.classList.toggle('selected', checkbox.checked);
        updateBulkActionVisibility();
        
        const allCheckboxes = document.querySelectorAll('.adj-item-checkbox');
        const checkedCount = document.querySelectorAll('.adj-item-checkbox:checked').length;
        const selectAll = document.getElementById('adj-select-all');
        if (selectAll) {
            selectAll.checked = checkedCount === allCheckboxes.length && allCheckboxes.length > 0;
            selectAll.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
        }
    }

    function toggleAdjContext(btn) {
        const contextList = btn.nextElementSibling;
        if (contextList) {
            const isHidden = contextList.style.display === 'none';
            contextList.style.display = isHidden ? 'block' : 'none';
            btn.innerHTML = isHidden ? '<i data-lucide="chevron-up"></i> Hide context' : '<i data-lucide="chevron-down"></i> Show context';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    function editRoleName(originalName) {
        const toast = getToast();
        const item = document.querySelector(`.adjudication-item[data-role="${CSS.escape(originalName)}"]`);
        if (!item) return;
        
        const nameSpan = item.querySelector('.adj-item-name');
        if (!nameSpan) return;
        
        const currentName = nameSpan.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'adj-edit-input form-input';
        input.value = currentName;
        input.style.width = '200px';
        
        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== originalName) {
                const decision = AdjudicationState.decisions.get(originalName);
                if (decision) {
                    AdjudicationState.decisions.delete(originalName);
                    decision.editedName = newName;
                    decision.originalName = originalName;
                    AdjudicationState.decisions.set(newName, decision);
                    item.setAttribute('data-role', newName);
                    nameSpan.textContent = newName;
                    nameSpan.setAttribute('data-original', originalName);
                    nameSpan.title = `${newName} (originally: ${originalName})`;
                    toast('success', `Renamed "${originalName}" to "${newName}"`);
                }
            }
            input.remove();
            nameSpan.style.display = '';
        };
        
        const cancelEdit = () => { input.remove(); nameSpan.style.display = ''; };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
        });
    }

    function setAdjudicationStatus(roleName, status) {
        const State = getState();
        const decision = AdjudicationState.decisions.get(roleName);
        if (decision) {
            decision.status = decision.status === status ? 'pending' : status;
            renderAdjudicationList();
            updateAdjudicationStats();
            
            if (GraphState.svg && GraphState.data) {
                const confirmed = [], deliverables = [], rejected = [];
                AdjudicationState.decisions.forEach((dec, name) => {
                    switch (dec.status) {
                        case 'confirmed': confirmed.push(name); break;
                        case 'deliverable': deliverables.push(name); break;
                        case 'rejected': rejected.push(name); break;
                    }
                });
                State.adjudicatedRoles = { confirmed, deliverables, rejected, timestamp: new Date().toISOString() };
                updateGraphWithAdjudication();
            }
            
            if (status === 'confirmed' || status === 'deliverable') {
                addAdjudicatedRoleToDictionary(roleName, status === 'deliverable');
            }
        }
    }

    async function addAdjudicatedRoleToDictionary(roleName, isDeliverable) {
        const State = getState();
        try {
            const response = await fetch('/api/roles/dictionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': window.CSRF_TOKEN || State.csrfToken || '' },
                body: JSON.stringify({
                    role_name: roleName,
                    source: 'adjudication',
                    source_document: State.filename || '',
                    is_deliverable: isDeliverable,
                    category: isDeliverable ? 'Deliverable' : 'Custom',
                    notes: `Added via adjudication on ${new Date().toLocaleDateString()}`
                })
            });
            const result = await response.json();
            if (result.success) console.log(`[TWR Roles] Added "${roleName}" to dictionary`);
        } catch (e) {
            console.warn(`[TWR Roles] Could not add "${roleName}" to dictionary:`, e);
        }
    }

    function updateAdjudicationStats() {
        let pending = 0, confirmed = 0, deliverable = 0, rejected = 0;
        AdjudicationState.decisions.forEach(decision => {
            switch (decision.status) {
                case 'pending': pending++; break;
                case 'confirmed': confirmed++; break;
                case 'deliverable': deliverable++; break;
                case 'rejected': rejected++; break;
            }
        });
        const el = (id) => document.getElementById(id);
        if (el('adj-pending-count')) el('adj-pending-count').textContent = pending;
        if (el('adj-confirmed-count')) el('adj-confirmed-count').textContent = confirmed;
        if (el('adj-deliverable-count')) el('adj-deliverable-count').textContent = deliverable;
        if (el('adj-rejected-count')) el('adj-rejected-count').textContent = rejected;
    }

    function saveAdjudication() {
        const State = getState();
        const toast = getToast();
        const decisions = {};
        AdjudicationState.decisions.forEach((value, key) => { decisions[key] = value; });
        
        const saveData = { filename: State.filename, timestamp: new Date().toISOString(), decisions: decisions };
        
        try {
            const key = `twr_adjudication_${State.filename || 'default'}`;
            localStorage.setItem(key, JSON.stringify(saveData));
            const masterKey = 'twr_adjudication_master';
            const master = JSON.parse(localStorage.getItem(masterKey) || '{}');
            Object.assign(master, decisions);
            localStorage.setItem(masterKey, JSON.stringify(master));
            toast('success', 'Adjudication decisions saved');
        } catch (e) {
            console.error('[TWR Roles] Failed to save adjudication:', e);
            toast('error', 'Failed to save decisions');
        }
    }

    function loadAdjudication() {
        const State = getState();
        const toast = getToast();
        try {
            const key = `twr_adjudication_${State.filename || 'default'}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                const data = JSON.parse(saved);
                Object.entries(data.decisions || {}).forEach(([name, decision]) => {
                    AdjudicationState.decisions.set(name, decision);
                });
                toast('info', 'Loaded previous adjudication decisions');
            }
        } catch (e) {
            console.warn('[TWR Roles] Could not load adjudication:', e);
        }
    }

    function resetAdjudication() {
        const toast = getToast();
        if (!confirm('Reset all adjudication decisions to pending?')) return;
        AdjudicationState.decisions.forEach((decision, key) => { decision.status = 'pending'; });
        renderAdjudicationList();
        toast('info', 'All decisions reset to pending');
    }

    function exportAdjudication() {
        const State = getState();
        const toast = getToast();
        const rolesData = State.roles?.roles || State.roles || {};
        
        let csv = 'Role Name,Status,Confidence,Occurrences,Suggested Type,Notes\n';
        AdjudicationState.decisions.forEach((decision, roleName) => {
            const data = rolesData[roleName] || {};
            const displayName = typeof data === 'object' ? (data.canonical_name || roleName) : roleName;
            const count = typeof data === 'object' ? (data.frequency || data.count || 1) : 1;
            csv += `"${displayName}",${decision.status},${(decision.confidence * 100).toFixed(0)}%,${count},${decision.suggestedType || 'unknown'},"${decision.notes || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `role_adjudication_${State.filename || 'roles'}_${getTimestamp()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast('success', 'Adjudication exported to CSV');
    }

    function applyAdjudicationToDocument() {
        const State = getState();
        const toast = getToast();
        const confirmed = [], deliverables = [], rejected = [];
        
        AdjudicationState.decisions.forEach((decision, roleName) => {
            switch (decision.status) {
                case 'confirmed': confirmed.push(roleName); break;
                case 'deliverable': deliverables.push(roleName); break;
                case 'rejected': rejected.push(roleName); break;
            }
        });
        
        State.adjudicatedRoles = { confirmed, deliverables, rejected, timestamp: new Date().toISOString() };
        if (GraphState.data && GraphState.svg) updateGraphWithAdjudication();
        toast('success', `Applied: ${confirmed.length} roles, ${deliverables.length} deliverables, ${rejected.length} rejected`);
    }

    function updateGraphWithAdjudication() {
        const State = getState();
        if (!GraphState.svg) return;
        
        if (!State.adjudicatedRoles && AdjudicationState.decisions && AdjudicationState.decisions.size > 0) {
            const confirmed = [], deliverables = [], rejected = [];
            AdjudicationState.decisions.forEach((dec, name) => {
                switch (dec.status) {
                    case 'confirmed': confirmed.push(name); break;
                    case 'deliverable': deliverables.push(name); break;
                    case 'rejected': rejected.push(name); break;
                }
            });
            State.adjudicatedRoles = { confirmed, deliverables, rejected, timestamp: new Date().toISOString() };
        }
        
        if (!State.adjudicatedRoles) return;
        
        const { confirmed, deliverables, rejected } = State.adjudicatedRoles;
        const confirmedSet = new Set(confirmed.map(r => r.toLowerCase()));
        const deliverableSet = new Set(deliverables.map(r => r.toLowerCase()));
        const rejectedSet = new Set(rejected.map(r => r.toLowerCase()));
        
        const ADJUDICATION_COLORS = { confirmed: '#10B981', deliverable: '#F59E0B', rejected: '#95A5A6', role: '#4A90D9', document: '#27AE60' };
        
        GraphState.svg.selectAll('.graph-node')
            .classed('role-confirmed', d => d.type === 'role' && confirmedSet.has((d.label || '').toLowerCase()))
            .classed('role-deliverable', d => d.type === 'role' && deliverableSet.has((d.label || '').toLowerCase()))
            .classed('role-rejected', d => d.type === 'role' && rejectedSet.has((d.label || '').toLowerCase()));
        
        GraphState.svg.selectAll('.graph-node circle')
            .attr('fill', d => {
                if (d.type !== 'role') return ADJUDICATION_COLORS.document;
                const label = (d.label || '').toLowerCase();
                if (confirmedSet.has(label)) return ADJUDICATION_COLORS.confirmed;
                if (deliverableSet.has(label)) return ADJUDICATION_COLORS.deliverable;
                if (rejectedSet.has(label)) return ADJUDICATION_COLORS.rejected;
                return ADJUDICATION_COLORS.role;
            })
            .attr('stroke', d => d.type === 'role' && confirmedSet.has((d.label || '').toLowerCase()) ? '#fff' : null)
            .attr('stroke-width', d => d.type === 'role' && confirmedSet.has((d.label || '').toLowerCase()) ? 2 : 0);
        
        const hideRejected = document.getElementById('graph-hide-rejected')?.checked;
        if (hideRejected) {
            GraphState.svg.selectAll('.graph-node.role-rejected').style('display', 'none');
            GraphState.svg.selectAll('.graph-link').style('display', d => {
                const sourceLabel = (typeof d.source === 'object' ? d.source.label : d.source || '').toLowerCase();
                const targetLabel = (typeof d.target === 'object' ? d.target.label : d.target || '').toLowerCase();
                return rejectedSet.has(sourceLabel) || rejectedSet.has(targetLabel) ? 'none' : null;
            });
        } else {
            GraphState.svg.selectAll('.graph-node.role-rejected').style('display', null);
            GraphState.svg.selectAll('.graph-link').style('display', null);
        }
        
        console.log('[TWR Graph] Updated with adjudication:', { confirmed: confirmed.length, deliverables: deliverables.length, rejected: rejected.length });
    }

    // ============================================================
    // D3 GRAPH VISUALIZATION
    // ============================================================
    
    function initGraphControls() {
        const debounce = getDebounce();
        const toast = getToast();
        
        const weightSlider = document.getElementById('graph-weight-filter');
        const weightValue = document.getElementById('graph-weight-value');
        if (weightSlider && weightValue) {
            weightSlider.addEventListener('input', function() { weightValue.textContent = this.value; updateGraphStats(); });
            weightSlider.addEventListener('change', function() { updateGraphVisibility(); });
        }
        
        document.getElementById('graph-max-nodes')?.addEventListener('change', () => renderRolesGraph());
        document.getElementById('graph-layout')?.addEventListener('change', () => renderRolesGraph());
        document.getElementById('graph-labels')?.addEventListener('change', function() { GraphState.labelMode = this.value; updateGraphLabelVisibility(); });
        
        const searchInput = document.getElementById('graph-search');
        if (searchInput) searchInput.addEventListener('input', debounce(function() { highlightSearchMatches(this.value); }, 300));
        
        document.getElementById('btn-refresh-graph')?.addEventListener('click', function() { renderRolesGraph(true); });
        document.getElementById('btn-reset-graph-view')?.addEventListener('click', resetGraphView);
        document.getElementById('btn-clear-graph-selection')?.addEventListener('click', function() { GraphState.isPinned = false; updatePinButton(); clearNodeSelection(true); });
        document.getElementById('btn-pin-selection')?.addEventListener('click', function() {
            GraphState.isPinned = !GraphState.isPinned;
            updatePinButton();
            if (GraphState.isPinned && GraphState.selectedNode) toast('info', 'Selection pinned');
        });
        document.getElementById('btn-close-info-panel')?.addEventListener('click', function() {
            document.getElementById('graph-info-panel').style.display = 'none';
            if (!GraphState.isPinned) clearNodeSelection();
        });
        document.getElementById('btn-graph-help')?.addEventListener('click', function(e) {
            e.stopPropagation();
            const popup = document.getElementById('graph-help-popup');
            if (popup) popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });
        document.getElementById('btn-close-graph-help')?.addEventListener('click', function() { document.getElementById('graph-help-popup').style.display = 'none'; });
        
        document.getElementById('fallback-role-search')?.addEventListener('input', debounce(renderFallbackRows, 300));
        document.getElementById('fallback-doc-search')?.addEventListener('input', debounce(renderFallbackRows, 300));
        document.getElementById('fallback-sort')?.addEventListener('change', renderFallbackRows);
        document.getElementById('fallback-match-selection')?.addEventListener('change', renderFallbackRows);
    }

    function updatePinButton() {
        const btn = document.getElementById('btn-pin-selection');
        if (btn) { btn.classList.toggle('pinned', GraphState.isPinned); btn.title = GraphState.isPinned ? 'Unpin selection' : 'Pin selection'; }
    }

    function updateGraphLabelVisibility() {
        const container = document.getElementById('roles-graph-container');
        if (!container) return;
        container.classList.remove('labels-all', 'labels-hover', 'labels-selected', 'labels-none');
        container.classList.add(`labels-${GraphState.labelMode}`);
    }

    function resetGraphView() {
        const toast = getToast();
        if (!GraphState.svg) return;
        GraphState.svg.transition().duration(750).call(d3.zoom().transform, d3.zoomIdentity);
        if (GraphState.simulation) GraphState.simulation.alpha(0.3).restart();
        toast('info', 'Graph view reset');
    }

    function updateGraphStats() {
        if (!GraphState.data) return;
        const minWeight = parseInt(document.getElementById('graph-weight-filter')?.value || '1');
        const visibleLinks = GraphState.data.links.filter(l => l.weight >= minWeight).length;
        
        const nodeCount = document.getElementById('graph-node-count');
        const linkCount = document.getElementById('graph-link-count');
        const visibleCount = document.getElementById('graph-visible-links');
        const threshold = document.getElementById('graph-threshold');
        
        if (nodeCount) nodeCount.textContent = GraphState.data.nodes.length;
        if (linkCount) linkCount.textContent = GraphState.data.links.length;
        if (visibleCount) visibleCount.textContent = visibleLinks;
        if (threshold) threshold.textContent = minWeight;
    }

    function updateGraphVisibility() {
        if (!GraphState.svg || !GraphState.data) return;
        const minWeight = parseInt(document.getElementById('graph-weight-filter')?.value || '1');
        
        // v3.0.73: Only change opacity for links that are not hidden (display != none)
        GraphState.svg.selectAll('.graph-link').each(function(d) {
            const el = d3.select(this);
            // Don't change links that were hidden due to invalid endpoints
            if (el.style('display') !== 'none') {
                el.style('opacity', d.weight >= minWeight ? 0.6 : 0);
            }
        });
        
        const connectedNodes = new Set();
        GraphState.data.links.forEach(link => {
            if (link.weight >= minWeight) {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                connectedNodes.add(sourceId);
                connectedNodes.add(targetId);
            }
        });
        
        GraphState.svg.selectAll('.graph-node').classed('dimmed', d => !connectedNodes.has(d.id) && minWeight > 1);
        updateGraphStats();
    }

    async function renderRolesGraph(forceRefresh = false) {
        const api = getApi();
        const toast = getToast();
        
        if (GraphState.isLoading) { console.log('[TWR] Graph already loading, skipping duplicate call'); return; }
        GraphState.isLoading = true;
        
        const container = document.getElementById('roles-graph-container');
        const svgElement = document.getElementById('roles-graph-svg');
        const loading = document.getElementById('graph-loading');
        const fallback = document.getElementById('graph-fallback');
        const weightSlider = document.getElementById('graph-weight-filter');
        const maxWeightDisplay = document.getElementById('graph-max-weight');
        
        if (!container || !svgElement) { GraphState.isLoading = false; return; }
        if (weightSlider) weightSlider.disabled = true;
        
        GraphState.isD3Available = typeof d3 !== 'undefined';
        
        if (!GraphState.isD3Available) {
            console.warn('[TWR Roles] D3.js not available, showing fallback table');
            container.style.display = 'none';
            fallback.style.display = 'block';
            await renderGraphFallbackTable();
            GraphState.isLoading = false;
            return;
        }
        
        loading.style.display = 'flex';
        fallback.style.display = 'none';
        container.style.display = 'block';
        
        try {
            const maxNodes = parseInt(document.getElementById('graph-max-nodes')?.value || '100');
            const minWeight = parseInt(weightSlider?.value || '1');
            const layout = document.getElementById('graph-layout')?.value || 'force';
            
            const useCache = !forceRefresh;
            const response = await api(`/roles/graph?max_nodes=${maxNodes}&min_weight=${minWeight}&use_cache=${useCache}`);
            
            if (!response.success || !response.data) throw new Error(response.error || 'Failed to load graph data');
            
            GraphState.data = response.data;
            
            const maxEdgeWeight = Math.max(...response.data.links.map(l => l.weight), 1);
            if (weightSlider) { weightSlider.max = Math.min(maxEdgeWeight, 100); weightSlider.disabled = false; }
            if (maxWeightDisplay) maxWeightDisplay.textContent = maxEdgeWeight;
            
            updateGraphStats();
            updateGraphLabelVisibility();
            renderD3Graph(svgElement, response.data, layout);
            
            if (loading) loading.style.display = 'none';
            setTimeout(() => updateGraphWithAdjudication(), 100);
        } catch (error) {
            console.error('[TWR Roles] Graph rendering error:', error);
            toast('error', 'Failed to render graph: ' + error.message);
            if (weightSlider) weightSlider.disabled = false;
            container.style.display = 'none';
            fallback.style.display = 'block';
            await renderGraphFallbackTable();
        } finally {
            if (loading) loading.style.display = 'none';
            if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
            GraphState.isLoading = false;
        }
    }

    function renderD3Graph(svgElement, data, layout = 'force') {
        const escapeHtml = getEscapeHtml();
        const truncate = getTruncate();
        let { nodes } = data;
        
        if (!nodes || nodes.length === 0) {
            svgElement.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#888">No graph data available</text>';
            return;
        }
        
        // v3.0.73: Filter links to ensure both endpoints exist in nodes array
        const nodeIds = new Set(nodes.map(n => n.id));
        const originalLinkCount = (data.links || []).length;
        let links = (data.links || []).filter(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return nodeIds.has(sourceId) && nodeIds.has(targetId);
        });
        
        // v3.0.76: Iterative peripheral node pruning
        // Remove nodes with insufficient connections (not just orphans)
        // This eliminates "phantom lines" going to barely-connected peripheral nodes
        const MIN_CONNECTIONS = 2; // Nodes need at least 2 connections to be shown
        const originalNodeCount = nodes.length;
        
        // Iteratively prune until stable
        let pruneIterations = 0;
        let nodesRemoved = true;
        while (nodesRemoved && pruneIterations < 10) {
            pruneIterations++;
            nodesRemoved = false;
            
            // Count connections per node
            const connectionCount = new Map();
            nodes.forEach(n => connectionCount.set(n.id, 0));
            
            links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                if (connectionCount.has(sourceId)) {
                    connectionCount.set(sourceId, connectionCount.get(sourceId) + 1);
                }
                if (connectionCount.has(targetId)) {
                    connectionCount.set(targetId, connectionCount.get(targetId) + 1);
                }
            });
            
            // Store connection counts on nodes for styling (v3.0.77)
            nodes.forEach(n => {
                n.connectionCount = connectionCount.get(n.id) || 0;
            });
            
            // Filter nodes with insufficient connections
            const prevNodeCount = nodes.length;
            nodes = nodes.filter(n => connectionCount.get(n.id) >= MIN_CONNECTIONS);
            
            if (nodes.length < prevNodeCount) {
                nodesRemoved = true;
                // Re-filter links to only include those between remaining nodes
                const remainingNodeIds = new Set(nodes.map(n => n.id));
                links = links.filter(link => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    return remainingNodeIds.has(sourceId) && remainingNodeIds.has(targetId);
                });
            }
        }
        
        const filteredLinkCount = originalLinkCount - links.length;
        const filteredNodeCount = originalNodeCount - nodes.length;
        
        if (filteredLinkCount > 0 || filteredNodeCount > 0) {
            console.log(`[TWR Graph] Pruned in ${pruneIterations} iterations: ${filteredNodeCount} peripheral nodes, ${filteredLinkCount} links (MIN_CONNECTIONS=${MIN_CONNECTIONS})`);
        }
        console.log(`[TWR Graph] Rendering ${nodes.length} nodes, ${links.length} links`);
        
        // Check if we have anything to render after filtering
        if (nodes.length === 0) {
            svgElement.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#888">No connected nodes to display</text>';
            return;
        }
        
        d3.select(svgElement).selectAll('*').remove();
        
        const container = svgElement.parentElement;
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 500;
        
        const svg = d3.select(svgElement).attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);
        GraphState.svg = svg;
        
        const g = svg.append('g');
        const zoom = d3.zoom().scaleExtent([0.2, 4]).on('zoom', (event) => { g.attr('transform', event.transform); });
        svg.call(zoom);
        
        const colorScale = { 'role': '#4A90D9', 'document': '#27AE60', 'deliverable': '#F59E0B', 'system': '#8B5CF6', 'tool': '#8B5CF6', 'organization': '#EC4899', 'org': '#EC4899' };
        
        let simulation;
        if (layout === 'bipartite') {
            const roles = nodes.filter(n => n.type === 'role');
            const docs = nodes.filter(n => n.type === 'document');
            roles.forEach((n, i) => { n.fx = width * 0.25; n.y = (height / (roles.length + 1)) * (i + 1); });
            docs.forEach((n, i) => { n.fx = width * 0.75; n.y = (height / (docs.length + 1)) * (i + 1); });
            simulation = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id(d => d.id).strength(0.1)).force('y', d3.forceY(d => d.y).strength(0.5)).force('collision', d3.forceCollide().radius(20));
        } else {
            simulation = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id(d => d.id).distance(100).strength(d => Math.min(d.weight / 10, 1))).force('charge', d3.forceManyBody().strength(-200)).force('center', d3.forceCenter(width / 2, height / 2)).force('collision', d3.forceCollide().radius(30));
        }
        GraphState.simulation = simulation;
        
        const nodeCount = nodes.length;
        const linkCount = links.length;
        GraphState.performanceMode = nodeCount > GRAPH_PERFORMANCE.nodeThreshold || linkCount > GRAPH_PERFORMANCE.linkThreshold;
        GraphState.glowEnabled = nodeCount <= GRAPH_PERFORMANCE.glowThreshold;
        
        const graphContainer = document.getElementById('roles-graph-container');
        if (graphContainer) {
            graphContainer.classList.toggle('performance-mode', GraphState.performanceMode);
            graphContainer.classList.toggle('glow-enabled', GraphState.glowEnabled);
        }
        
        // v3.0.77: Links with distinct colors for different relationship types
        const link = g.append('g').attr('class', 'links').selectAll('line').data(links).join('line')
            .attr('class', d => `graph-link link-${d.link_type || 'role-document'}`)
            .attr('stroke', d => { const style = LINK_STYLES[d.link_type] || LINK_STYLES['default']; return style.color || '#888'; })
            .attr('stroke-width', d => { const w = d.weight || 1; const base = GraphState.performanceMode ? 1 : 1.5; return Math.max(base, Math.min(w / 2, 6)); })
            .attr('stroke-dasharray', d => { if (!GraphState.linkStylesEnabled || GraphState.performanceMode) return 'none'; const style = LINK_STYLES[d.link_type] || LINK_STYLES['default']; return style.dashArray; })
            .attr('data-weight', d => d.weight || 1).attr('data-link-type', d => d.link_type || 'role-document');
        
        const node = g.append('g').attr('class', 'nodes').selectAll('g').data(nodes).join('g')
            .attr('class', d => {
                let classes = 'graph-node';
                if (GraphState.glowEnabled) classes += ' glow-enabled';
                // v3.0.77: Mark weakly-connected nodes for visual distinction
                if (d.connectionCount <= 2) classes += ' weak-connection';
                return classes;
            })
            .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));
        
        if (GraphState.glowEnabled && !svg.select('defs').node()) {
            const defs = svg.append('defs');
            const glowFilter = defs.append('filter').attr('id', 'node-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
            glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
            const feMerge = glowFilter.append('feMerge'); feMerge.append('feMergeNode').attr('in', 'coloredBlur'); feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
            const highlightFilter = defs.append('filter').attr('id', 'node-highlight-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
            highlightFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
            const highlightMerge = highlightFilter.append('feMerge'); highlightMerge.append('feMergeNode').attr('in', 'coloredBlur'); highlightMerge.append('feMergeNode').attr('in', 'SourceGraphic');
        }
        
        // v3.0.77: Node circles with minimum size and proper visibility for weak nodes
        node.append('circle')
            .attr('r', d => { 
                const baseSize = d.type === 'role' ? 12 : 10; 
                const mentions = d.total_mentions || d.role_count || 1; 
                const calculatedSize = baseSize + Math.sqrt(mentions) * 2;
                // Minimum size of 10px ensures all nodes are clearly visible
                return Math.max(10, Math.min(calculatedSize, 25)); 
            })
            .attr('fill', d => colorScale[d.type] || '#888')
            .attr('fill-opacity', d => d.connectionCount <= 2 ? 0.5 : 1)
            .attr('stroke', d => {
                // Weak nodes get darker stroke for visibility
                if (d.connectionCount <= 2) {
                    const baseColor = colorScale[d.type] || '#888';
                    // Return a darker version or just use the base color
                    return baseColor;
                }
                return colorScale[d.type] || '#888';
            })
            .attr('stroke-width', d => d.connectionCount <= 2 ? 2.5 : 1)
            .attr('stroke-opacity', 1)
            .attr('stroke-dasharray', d => d.connectionCount <= 2 ? '4,2' : 'none')
            .attr('class', 'node-circle');
        
        node.append('text').attr('class', 'graph-node-label').attr('dy', d => (d.type === 'role' ? 12 : 10) + 12).text(d => truncate(d.label, 15));
        
        const tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip').style('opacity', 0).style('position', 'absolute').style('pointer-events', 'none');
        
        link.on('mouseover', function(event, d) {
            d3.select(this).attr('stroke', '#4dabf7').attr('stroke-width', function() { return (parseFloat(d3.select(this).attr('stroke-width')) || 2) + 2; });
            const sourceLabel = typeof d.source === 'object' ? d.source.label : d.source;
            const targetLabel = typeof d.target === 'object' ? d.target.label : d.target;
            const linkStyle = LINK_STYLES[d.link_type] || LINK_STYLES['default'];
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`<div class="tooltip-title">Connection</div><div class="tooltip-connection"><span class="tooltip-role">${escapeHtml(sourceLabel)}</span><span class="tooltip-arrow">↔</span><span class="tooltip-role">${escapeHtml(targetLabel)}</span></div><div class="tooltip-stats">Type: ${linkStyle.label}<br>Co-occurrences: ${d.weight || 1}${d.shared_paragraphs ? `<br>Shared paragraphs: ${d.shared_paragraphs}` : ''}</div>`).style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px');
        }).on('mouseout', function(event, d) {
            d3.select(this).attr('stroke', null).attr('stroke-width', function() { const w = d.weight || 1; const base = GraphState.performanceMode ? 1 : 1.5; return Math.max(base, Math.min(w / 2, 6)); });
            tooltip.transition().duration(500).style('opacity', 0);
        });
        
        node.on('mouseover', function(event, d) {
            tooltip.transition().duration(200).style('opacity', 1);
            let stats = d.type === 'role' ? `Documents: ${d.document_count || 0}<br>Mentions: ${d.total_mentions || 0}` : `Roles: ${d.role_count || 0}<br>Mentions: ${d.total_mentions || 0}`;
            tooltip.html(`<div class="tooltip-title">${escapeHtml(d.label)}</div><div class="tooltip-type">${d.type}</div><div class="tooltip-stats">${stats}</div>`).style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px');
        }).on('mouseout', function() { tooltip.transition().duration(500).style('opacity', 0); }).on('click', function(event, d) { event.stopPropagation(); selectNode(d, links); });
        
        svg.on('click', function() { clearNodeSelection(); });
        
        // v3.0.73: Enhanced tick handler with safety checks for invalid coordinates
        simulation.on('tick', () => {
            link.each(function(d) {
                const el = d3.select(this);
                // Check if source and target are resolved node objects with valid coordinates
                const sourceValid = d.source && typeof d.source === 'object' && 
                                   isFinite(d.source.x) && isFinite(d.source.y);
                const targetValid = d.target && typeof d.target === 'object' && 
                                   isFinite(d.target.x) && isFinite(d.target.y);
                
                if (sourceValid && targetValid) {
                    el.attr('x1', d.source.x)
                      .attr('y1', d.source.y)
                      .attr('x2', d.target.x)
                      .attr('y2', d.target.y)
                      .style('display', null);  // Show valid links
                } else {
                    // Hide links with invalid endpoints (dangling links)
                    el.style('display', 'none');
                }
            });
            node.attr('transform', d => {
                // Safety check for node positions
                const x = isFinite(d.x) ? d.x : 0;
                const y = isFinite(d.y) ? d.y : 0;
                return `translate(${x},${y})`;
            });
        });
        
        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); if (layout !== 'bipartite') d.fx = null; d.fy = null; }
    }

    function selectNode(d, links) {
        const escapeHtml = getEscapeHtml();
        const truncate = getTruncate();
        const toast = getToast();
        
        GraphState.selectedNode = d;
        
        // Highlight the selected node and its connections
        const connectedIds = new Set();
        connectedIds.add(d.id);
        
        links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            if (sourceId === d.id) connectedIds.add(targetId);
            if (targetId === d.id) connectedIds.add(sourceId);
        });
        
        GraphState.svg.selectAll('.graph-node')
            .classed('selected', node => node.id === d.id)
            .classed('connected', node => node.id !== d.id && connectedIds.has(node.id))
            .classed('dimmed', node => !connectedIds.has(node.id));
        
        GraphState.svg.selectAll('.graph-link')
            .classed('highlighted', link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                return sourceId === d.id || targetId === d.id;
            })
            .classed('dimmed', link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                return sourceId !== d.id && targetId !== d.id;
            });
        
        // Build info panel content
        const panel = document.getElementById('graph-info-panel');
        const title = document.getElementById('info-panel-title');
        const body = document.getElementById('info-panel-body');
        
        if (!panel || !body) return;
        
        // v3.0.73: Enhanced info panel with better explanations
        const isRole = d.type === 'role';
        const typeIcon = isRole ? 'user' : 'file-text';
        const typeColor = isRole ? '#4A90D9' : '#27AE60';
        const typeLabel = isRole ? 'Role / Entity' : 'Document';
        
        // Separate connections by type
        const docConnections = [];
        const roleConnections = [];
        let maxWeight = 1;
        
        links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const sourceNode = typeof link.source === 'object' ? link.source : null;
            const targetNode = typeof link.target === 'object' ? link.target : null;
            const sourceLabel = sourceNode ? sourceNode.label : link.source;
            const targetLabel = targetNode ? targetNode.label : link.target;
            const sourceType = sourceNode ? sourceNode.type : (String(sourceId).startsWith('role_') ? 'role' : 'document');
            const targetType = targetNode ? targetNode.type : (String(targetId).startsWith('role_') ? 'role' : 'document');
            
            if (sourceId === d.id || targetId === d.id) {
                const connectedId = sourceId === d.id ? targetId : sourceId;
                const connectedLabel = sourceId === d.id ? targetLabel : sourceLabel;
                const connectedType = sourceId === d.id ? targetType : sourceType;
                const weight = link.weight || 1;
                maxWeight = Math.max(maxWeight, weight);
                
                const conn = {
                    id: connectedId,
                    label: connectedLabel,
                    weight: weight,
                    type: connectedType,
                    topTerms: link.top_terms || [],
                    linkType: link.link_type || 'role-document'
                };
                
                if (connectedType === 'document') {
                    docConnections.push(conn);
                } else {
                    roleConnections.push(conn);
                }
            }
        });
        
        // Sort by weight
        docConnections.sort((a, b) => b.weight - a.weight);
        roleConnections.sort((a, b) => b.weight - a.weight);
        
        // Build HTML
        let html = `
            <div class="info-type-badge" style="background: ${typeColor}15; color: ${typeColor}; border: 1px solid ${typeColor}40;">
                <i data-lucide="${typeIcon}" style="width:14px;height:14px;"></i>
                <span>${typeLabel}</span>
            </div>
        `;
        
        // Title with full name
        title.innerHTML = `<span style="color: ${typeColor};">●</span> ${escapeHtml(truncate(d.label, 25))}`;
        
        if (isRole) {
            // Role-specific info
            const category = d.category || 'Unknown';
            const categoryColors = {
                'Organization': '#EC4899',
                'System': '#8B5CF6',
                'Process': '#F59E0B',
                'Human': '#4A90D9',
                'Unknown': '#6B7280'
            };
            const catColor = categoryColors[category] || categoryColors['Unknown'];
            
            html += `
                <div class="info-stats-grid">
                    <div class="info-stat">
                        <div class="info-stat-value">${d.document_count || 0}</div>
                        <div class="info-stat-label">Documents</div>
                    </div>
                    <div class="info-stat">
                        <div class="info-stat-value">${d.total_mentions || 0}</div>
                        <div class="info-stat-label">Mentions</div>
                    </div>
                </div>
                
                <div class="info-category" style="color: ${catColor};">
                    <i data-lucide="tag" style="width:12px;height:12px;"></i>
                    Category: <strong>${escapeHtml(category)}</strong>
                </div>
            `;
            
            // Explanation
            html += `
                <div class="info-explanation">
                    <i data-lucide="info" style="width:12px;height:12px;"></i>
                    This ${category.toLowerCase() === 'organization' ? 'organization/team' : category.toLowerCase()} appears in <strong>${d.document_count || 0} document${(d.document_count || 0) !== 1 ? 's' : ''}</strong> 
                    with a total of <strong>${d.total_mentions || 0} mention${(d.total_mentions || 0) !== 1 ? 's' : ''}</strong>.
                </div>
            `;
            
            // Connected Documents
            if (docConnections.length > 0) {
                html += `
                    <div class="info-section-header">
                        <i data-lucide="file-text" style="width:14px;height:14px;color:#27AE60;"></i>
                        Found In Documents (${docConnections.length})
                    </div>
                    <div class="info-connections-list">
                `;
                docConnections.slice(0, 8).forEach(c => {
                    const pct = Math.round((c.weight / maxWeight) * 100);
                    const terms = c.topTerms.length > 0 ? c.topTerms.slice(0, 2).join(', ') : '';
                    html += `
                        <div class="info-connection-item">
                            <div class="info-conn-main">
                                <span class="info-conn-label" title="${escapeHtml(c.label)}">${escapeHtml(truncate(c.label, 22))}</span>
                                <span class="info-conn-weight">${c.weight}×</span>
                            </div>
                            <div class="info-conn-bar-bg"><div class="info-conn-bar" style="width:${pct}%;background:#27AE60;"></div></div>
                            ${terms ? `<div class="info-conn-terms">${escapeHtml(terms)}</div>` : ''}
                        </div>
                    `;
                });
                if (docConnections.length > 8) {
                    html += `<div class="info-conn-more">+${docConnections.length - 8} more documents</div>`;
                }
                html += `</div>`;
            }
            
            // Connected Roles (co-occurrence)
            if (roleConnections.length > 0) {
                html += `
                    <div class="info-section-header">
                        <i data-lucide="users" style="width:14px;height:14px;color:#4A90D9;"></i>
                        Works With (${roleConnections.length})
                    </div>
                    <div class="info-explanation" style="margin-bottom:8px;">
                        These roles appear in the same documents.
                    </div>
                    <div class="info-connections-list">
                `;
                roleConnections.slice(0, 5).forEach(c => {
                    const pct = Math.round((c.weight / maxWeight) * 100);
                    html += `
                        <div class="info-connection-item">
                            <div class="info-conn-main">
                                <span class="info-conn-label" title="${escapeHtml(c.label)}">${escapeHtml(truncate(c.label, 22))}</span>
                                <span class="info-conn-weight">${c.weight} shared</span>
                            </div>
                            <div class="info-conn-bar-bg"><div class="info-conn-bar" style="width:${pct}%;background:#4A90D9;"></div></div>
                        </div>
                    `;
                });
                if (roleConnections.length > 5) {
                    html += `<div class="info-conn-more">+${roleConnections.length - 5} more roles</div>`;
                }
                html += `</div>`;
            }
            
        } else {
            // Document-specific info
            html += `
                <div class="info-stats-grid">
                    <div class="info-stat">
                        <div class="info-stat-value">${d.role_count || 0}</div>
                        <div class="info-stat-label">Roles Found</div>
                    </div>
                    <div class="info-stat">
                        <div class="info-stat-value">${d.total_mentions || 0}</div>
                        <div class="info-stat-label">Total Mentions</div>
                    </div>
                </div>
            `;
            
            // Explanation
            html += `
                <div class="info-explanation">
                    <i data-lucide="info" style="width:12px;height:12px;"></i>
                    This document contains <strong>${d.role_count || 0} unique role${(d.role_count || 0) !== 1 ? 's' : ''}</strong> 
                    mentioned a total of <strong>${d.total_mentions || 0} time${(d.total_mentions || 0) !== 1 ? 's' : ''}</strong>.
                </div>
            `;
            
            // Roles in this document
            if (roleConnections.length > 0) {
                html += `
                    <div class="info-section-header">
                        <i data-lucide="users" style="width:14px;height:14px;color:#4A90D9;"></i>
                        Roles In Document (${roleConnections.length})
                    </div>
                    <div class="info-connections-list">
                `;
                roleConnections.slice(0, 10).forEach(c => {
                    const pct = Math.round((c.weight / maxWeight) * 100);
                    const terms = c.topTerms.length > 0 ? c.topTerms.slice(0, 2).join(', ') : '';
                    html += `
                        <div class="info-connection-item">
                            <div class="info-conn-main">
                                <span class="info-conn-label" title="${escapeHtml(c.label)}">${escapeHtml(truncate(c.label, 22))}</span>
                                <span class="info-conn-weight">${c.weight}×</span>
                            </div>
                            <div class="info-conn-bar-bg"><div class="info-conn-bar" style="width:${pct}%;background:#4A90D9;"></div></div>
                            ${terms ? `<div class="info-conn-terms">${escapeHtml(terms)}</div>` : ''}
                        </div>
                    `;
                });
                if (roleConnections.length > 10) {
                    html += `<div class="info-conn-more">+${roleConnections.length - 10} more roles</div>`;
                }
                html += `</div>`;
            }
        }
        
        // Legend footer
        html += `
            <div class="info-legend">
                <div class="info-legend-title">Understanding This Graph</div>
                <div class="info-legend-item"><span class="info-legend-dot" style="background:#4A90D9;"></span> Roles/Entities</div>
                <div class="info-legend-item"><span class="info-legend-dot" style="background:#27AE60;"></span> Documents</div>
                <div class="info-legend-item"><span class="info-legend-line"></span> Line thickness = connection strength</div>
            </div>
        `;
        
        body.innerHTML = html;
        panel.style.display = 'block';
        
        // Refresh Lucide icons in the panel
        if (typeof lucide !== 'undefined') {
            try { lucide.createIcons({ icons: lucide.icons, attrs: { class: '' } }); } catch(e) {}
        }
    }

    function clearNodeSelection(force = false) {
        if (GraphState.isPinned && !force) return;
        
        GraphState.selectedNode = null;
        
        if (GraphState.svg) {
            GraphState.svg.selectAll('.graph-node')
                .classed('selected', false)
                .classed('connected', false)
                .classed('dimmed', false);
            
            GraphState.svg.selectAll('.graph-link')
                .classed('highlighted', false)
                .classed('dimmed', false);
        }
        
        const panel = document.getElementById('graph-info-panel');
        if (panel) panel.style.display = 'none';
    }

    function highlightSearchMatches(searchText) {
        if (!GraphState.svg || !GraphState.data) { console.warn('[TWR Graph] Cannot highlight - svg or data not ready'); return; }
        
        const query = searchText.toLowerCase().trim();
        
        if (!query) {
            GraphState.svg.selectAll('.graph-node').classed('highlighted', false).classed('dimmed', false);
            GraphState.svg.selectAll('.graph-link').classed('highlighted', false).classed('dimmed', false);
            GraphState.highlightedNodes.clear();
            const countEl = document.getElementById('graph-search-count');
            if (countEl) countEl.textContent = '';
            return;
        }
        
        GraphState.highlightedNodes.clear();
        const matchingIds = new Set();
        
        GraphState.data.nodes.forEach(node => {
            const label = (node.label || '').toLowerCase();
            const nodeType = (node.type || '').toLowerCase();
            if (label.includes(query) || nodeType.includes(query)) {
                matchingIds.add(node.id);
                GraphState.highlightedNodes.add(node.id);
            }
        });
        
        const connectedIds = new Set();
        if (matchingIds.size > 0) {
            GraphState.data.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                if (matchingIds.has(sourceId)) connectedIds.add(targetId);
                if (matchingIds.has(targetId)) connectedIds.add(sourceId);
            });
        }
        
        GraphState.svg.selectAll('.graph-node')
            .classed('highlighted', d => matchingIds.has(d.id))
            .classed('dimmed', d => matchingIds.size > 0 && !matchingIds.has(d.id) && !connectedIds.has(d.id));
        
        GraphState.svg.selectAll('.graph-link')
            .classed('highlighted', d => {
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                return matchingIds.has(sourceId) || matchingIds.has(targetId);
            })
            .classed('dimmed', d => {
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                return matchingIds.size > 0 && !matchingIds.has(sourceId) && !matchingIds.has(targetId);
            });
        
        const countEl = document.getElementById('graph-search-count');
        if (countEl) countEl.textContent = matchingIds.size > 0 ? `${matchingIds.size} found` : 'No matches';
        console.log(`[TWR Graph] Search "${query}": ${matchingIds.size} matches, ${connectedIds.size} connected`);
    }

    async function renderGraphFallbackTable() {
        const escapeHtml = getEscapeHtml();
        const api = getApi();
        const tbody = document.getElementById('graph-fallback-body');
        if (!tbody) return;
        
        try {
            const response = await api('/roles/graph?max_nodes=200&min_weight=1');
            if (!response.success || !response.data) { tbody.innerHTML = '<tr><td colspan="4">Failed to load data</td></tr>'; return; }
            
            const { nodes, links } = response.data;
            GraphState.fallbackData = { nodes, links };
            
            const nodeMap = {};
            nodes.forEach(n => nodeMap[n.id] = n);
            
            GraphState.fallbackRows = links.map(link => {
                const source = nodeMap[link.source] || { label: link.source };
                const target = nodeMap[link.target] || { label: link.target };
                const role = source.type === 'role' ? source : target;
                const doc = source.type === 'document' ? source : target;
                return { role: role.label || 'Unknown', doc: doc.label || 'Unknown', weight: link.weight, terms: (link.top_terms || []).join(', ') || '-' };
            });
            
            renderFallbackRows();
        } catch (error) {
            console.error('[TWR Roles] Fallback table error:', error);
            tbody.innerHTML = '<tr><td colspan="4">Error loading data</td></tr>';
        }
    }

    function renderFallbackRows() {
        const escapeHtml = getEscapeHtml();
        const tbody = document.getElementById('graph-fallback-body');
        if (!tbody || !GraphState.fallbackRows) return;
        
        let rows = [...GraphState.fallbackRows];
        
        const roleSearch = (document.getElementById('fallback-role-search')?.value || '').toLowerCase().trim();
        if (roleSearch) rows = rows.filter(r => r.role.toLowerCase().includes(roleSearch));
        
        const docSearch = (document.getElementById('fallback-doc-search')?.value || '').toLowerCase().trim();
        if (docSearch) rows = rows.filter(r => r.doc.toLowerCase().includes(docSearch));
        
        const matchSelection = document.getElementById('fallback-match-selection')?.checked;
        if (matchSelection && GraphState.selectedNode) {
            const selectedLabel = GraphState.selectedNode.label?.toLowerCase();
            if (selectedLabel) rows = rows.filter(r => r.role.toLowerCase() === selectedLabel || r.doc.toLowerCase() === selectedLabel);
        }
        
        const sortValue = document.getElementById('fallback-sort')?.value || 'weight-desc';
        const [sortKey, sortDir] = sortValue.split('-');
        rows.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'weight') cmp = a.weight - b.weight;
            else if (sortKey === 'role') cmp = a.role.localeCompare(b.role);
            else if (sortKey === 'doc') cmp = a.doc.localeCompare(b.doc);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        
        tbody.innerHTML = rows.slice(0, 100).map(row => `<tr><td>${escapeHtml(row.role)}</td><td>${escapeHtml(row.doc)}</td><td>${row.weight}</td><td>${escapeHtml(row.terms)}</td></tr>`).join('');
        
        if (rows.length > 100) tbody.innerHTML += `<tr><td colspan="4" style="text-align:center;font-style:italic;">Showing top 100 of ${rows.length} connections</td></tr>`;
        if (rows.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No matching connections</td></tr>';
    }

    function filterFallbackTable() { renderFallbackRows(); }
    function sortFallbackTable() { renderFallbackRows(); }

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    
    function getCategoryForRole(roleName) {
        const name = (roleName || '').toLowerCase();
        if (/manager|director|lead|chief|head|supervisor|executive|officer/.test(name)) return 'Management';
        if (/engineer|developer|architect|designer|analyst|technical/.test(name)) return 'Engineering';
        if (/quality|qa|inspector|auditor|test|verification|validation/.test(name)) return 'Quality';
        if (/supplier|vendor|contractor|subcontractor|provider/.test(name)) return 'Supplier';
        if (/customer|client|user|operator|government|buyer/.test(name)) return 'Customer';
        if (/production|manufacturing|assembly|fabrication|operations/.test(name)) return 'Production';
        return 'General';
    }

    function getCategoryColorForRole(category) {
        const colors = { 'Management': '#E74C3C', 'Engineering': '#3498DB', 'Quality': '#9B59B6', 'Supplier': '#F39C12', 'Customer': '#27AE60', 'Production': '#1ABC9C', 'General': '#7F8C8D' };
        return colors[category] || colors['General'];
    }

    function showRoleDetails(node) {
        const escapeHtml = getEscapeHtml();
        const truncate = getTruncate();
        const State = getState();
        const panel = document.getElementById('role-details');
        if (!panel) return;

        const roleData = State.roles[node.id] || State.roles[node.label] || {};
        const responsibilities = roleData.responsibilities || [];
        const actionTypes = roleData.action_types || {};

        panel.innerHTML = `<h4>${escapeHtml(node.label || node.id)}</h4>
            <div class="role-detail-section"><strong>Occurrences:</strong> ${node.count || 1}</div>
            ${responsibilities.length > 0 ? `<div class="role-detail-section"><strong>Responsibilities:</strong><ul>${responsibilities.slice(0, 5).map(r => `<li>${escapeHtml(truncate(String(r), 80))}</li>`).join('')}</ul></div>` : ''}
            ${Object.keys(actionTypes).length > 0 ? `<div class="role-detail-section"><strong>Action Types:</strong><div class="action-types">${Object.entries(actionTypes).slice(0, 5).map(([action, count]) => `<span class="action-badge">${action}: ${count}</span>`).join('')}</div></div>` : ''}`;
    }

    async function exportRoles(format = 'csv') {
        const State = getState();
        const toast = getToast();
        const setLoading = getSetLoading();
        
        const rolesList = State.entities?.roles || [];
        let rolesData;
        
        if (rolesList.length > 0) {
            rolesData = rolesList.map(role => ({
                name: role.canonical_name || role.name,
                count: role.frequency || role.occurrence_count || 1,
                category: getCategoryForRole(role.canonical_name || role.name),
                responsibilities: (role.responsibilities || []).join('; '),
                confidence: (role.kind_confidence || 0).toFixed(2)
            }));
        } else if (State.roles && Object.keys(State.roles).length > 0) {
            const roles = Object.entries(State.roles).filter(([name, data]) => {
                if (typeof data === 'object') {
                    if (data.entity_kind === 'deliverable' || data.entity_kind === 'unknown' || !data.entity_kind) return false;
                }
                return true;
            });
            rolesData = roles.map(([name, data]) => {
                const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
                const count = typeof data === 'object' ? (data.frequency || data.count || 1) : 1;
                const responsibilities = typeof data === 'object' ? (data.responsibilities || []).join('; ') : '';
                return { name: displayName, count: count, category: getCategoryForRole(displayName), responsibilities: responsibilities, confidence: typeof data === 'object' ? (data.kind_confidence || 0).toFixed(2) : '0.00' };
            });
        } else {
            toast('warning', 'No roles to export');
            return;
        }
        
        if (rolesData.length === 0) { toast('warning', 'No roles to export (only deliverables/unknown found)'); return; }

        setLoading(true, 'Exporting roles...');

        try {
            if (format === 'csv') {
                const headers = ['Role Name', 'Occurrences', 'Category', 'Responsibilities', 'Confidence'];
                const rows = rolesData.map(r => [`"${r.name.replace(/"/g, '""')}"`, r.count, r.category, `"${r.responsibilities.replace(/"/g, '""')}"`, r.confidence]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                downloadBlob(blob, `${State.filename || 'document'}_roles_${getTimestamp()}.csv`);
                toast('success', `Exported ${rolesData.length} roles to CSV`);
            } else if (format === 'json') {
                const json = JSON.stringify(rolesData, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                downloadBlob(blob, `${State.filename || 'document'}_roles_${getTimestamp()}.json`);
                toast('success', `Exported ${rolesData.length} roles to JSON`);
            }
        } catch (e) {
            console.error('[TWR Roles] Export failed:', e);
            toast('error', 'Export failed: ' + e.message);
        }

        setLoading(false);
    }

    async function exportDeliverables(format = 'csv') {
        const State = getState();
        const toast = getToast();
        const setLoading = getSetLoading();
        const deliverablesList = State.entities?.deliverables || [];
        
        if (deliverablesList.length === 0) { toast('warning', 'No deliverables to export'); return; }

        setLoading(true, 'Exporting deliverables...');

        try {
            const data = deliverablesList.map(d => ({ name: d.canonical_name || d.name, count: d.frequency || d.occurrence_count || 1, confidence: (d.kind_confidence || 0).toFixed(2), variants: (d.variants || []).join('; ') }));

            if (format === 'csv') {
                const headers = ['Deliverable Name', 'Occurrences', 'Confidence', 'Variants'];
                const rows = data.map(d => [`"${d.name.replace(/"/g, '""')}"`, d.count, d.confidence, `"${d.variants.replace(/"/g, '""')}"`]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                downloadBlob(blob, `${State.filename || 'document'}_deliverables_${getTimestamp()}.csv`);
                toast('success', `Exported ${data.length} deliverables to CSV`);
            } else if (format === 'json') {
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                downloadBlob(blob, `${State.filename || 'document'}_deliverables_${getTimestamp()}.json`);
                toast('success', `Exported ${data.length} deliverables to JSON`);
            }
        } catch (e) {
            console.error('[TWR Roles] Export failed:', e);
            toast('error', 'Export failed: ' + e.message);
        }

        setLoading(false);
    }

    // ============================================================
    // v3.0.80: ROLES EXPORT FUNCTIONALITY
    // ============================================================
    
    function initExportDropdown() {
        const dropdownBtn = document.getElementById('btn-export-roles-report');
        const dropdownMenu = document.getElementById('roles-export-menu');
        
        if (!dropdownBtn || !dropdownMenu) return;
        
        // Toggle dropdown on button click
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#roles-export-dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Export All Roles (CSV)
        document.getElementById('btn-export-all-csv')?.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
            exportAllRolesCSV();
        });
        
        // Export Current Document (CSV)
        document.getElementById('btn-export-current-csv')?.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
            exportCurrentDocumentCSV();
        });
        
        // Export All Roles (JSON)
        document.getElementById('btn-export-all-json')?.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
            exportAllRolesJSON();
        });
        
        // Export Selected Document
        document.getElementById('btn-export-selected-doc-csv')?.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
            showDocumentExportPicker();
        });
        
        console.log('[TWR Roles] Export dropdown initialized');
    }
    
    async function exportAllRolesCSV() {
        const toast = getToast();
        const setLoading = getSetLoading();
        
        setLoading(true, 'Fetching all roles from database...');
        
        try {
            const response = await fetch('/api/roles/aggregated?include_deliverables=false');
            const result = await response.json();
            
            if (!result.success) {
                toast('error', result.error || 'Failed to fetch roles');
                setLoading(false);
                return;
            }
            
            if (!result.data || result.data.length === 0) {
                toast('warning', 'No roles found in database. Scan some documents first and ensure they are saved to history.');
                setLoading(false);
                return;
            }
            
            const roles = result.data;
            
            // Build CSV with comprehensive data
            const headers = ['Role Name', 'Normalized Name', 'Category', 'Document Count', 'Total Mentions', 'Responsibility Count', 'Documents'];
            const rows = roles.map(r => [
                `"${(r.role_name || '').replace(/"/g, '""')}"`,
                `"${(r.normalized_name || '').replace(/"/g, '""')}"`,
                r.category || 'unknown',
                r.unique_document_count || r.document_count || 0,
                r.total_mentions || 0,
                r.responsibility_count || 0,
                `"${(r.documents || []).join('; ').replace(/"/g, '""')}"`
            ]);
            
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, `TWR_All_Roles_${getTimestamp()}.csv`);
            
            toast('success', `Exported ${roles.length} roles to CSV`);
        } catch (e) {
            console.error('[TWR Roles] Export all roles failed:', e);
            toast('error', 'Export failed: ' + e.message);
        }
        
        setLoading(false);
    }
    
    async function exportAllRolesJSON() {
        const toast = getToast();
        const setLoading = getSetLoading();
        
        setLoading(true, 'Fetching all roles...');
        
        try {
            const response = await fetch('/api/roles/aggregated?include_deliverables=false');
            const result = await response.json();
            
            if (!result.success || !result.data || result.data.length === 0) {
                toast('warning', 'No roles found in database. Scan some documents first.');
                setLoading(false);
                return;
            }
            
            const exportData = {
                export_date: new Date().toISOString(),
                total_roles: result.data.length,
                roles: result.data
            };
            
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            downloadBlob(blob, `TWR_All_Roles_${getTimestamp()}.json`);
            
            toast('success', `Exported ${result.data.length} roles to JSON`);
        } catch (e) {
            console.error('[TWR Roles] Export all roles JSON failed:', e);
            toast('error', 'Export failed: ' + e.message);
        }
        
        setLoading(false);
    }
    
    function exportCurrentDocumentCSV() {
        const State = getState();
        const toast = getToast();
        
        // Use the SAME data source as renderRolesDetails (line 399)
        const rolesData = State.roles?.roles || State.roles || {};
        const roleEntries = Object.entries(rolesData);
        
        if (roleEntries.length === 0) {
            toast('warning', 'No roles found. Run a review first.');
            return;
        }
        
        // Build CSV from the role entries
        const headers = ['Role Name', 'Category', 'Frequency', 'Responsibilities', 'Action Types'];
        const rows = roleEntries.map(([name, data]) => {
            const displayName = typeof data === 'object' ? (data.canonical_name || name) : name;
            const count = typeof data === 'object' ? (data.frequency || data.count || 1) : 1;
            const responsibilities = typeof data === 'object' ? (data.responsibilities || []) : [];
            const actionTypes = typeof data === 'object' ? (data.action_types || {}) : {};
            const category = getCategoryForRole(displayName);
            
            return [
                `"${displayName.replace(/"/g, '""')}"`,
                category,
                count,
                `"${responsibilities.map(r => String(r)).join('; ').replace(/"/g, '""')}"`,
                `"${Object.keys(actionTypes).join(', ')}"`
            ];
        });
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const filename = State.filename || State.original_filename || 'document';
        const safeFilename = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
        downloadBlob(blob, `${safeFilename}_roles_${getTimestamp()}.csv`);
        
        toast('success', `Exported ${roleEntries.length} roles to CSV`);
    }
    
    async function showDocumentExportPicker() {
        const toast = getToast();
        const setLoading = getSetLoading();
        
        setLoading(true, 'Loading document list...');
        
        try {
            // Fetch scan history to get document list
            const response = await fetch('/api/scan-history?limit=100');
            const result = await response.json();
            
            if (!result.success || !result.data || result.data.length === 0) {
                toast('warning', 'No scanned documents found.');
                setLoading(false);
                return;
            }
            
            // Get unique documents
            const docs = result.data;
            const uniqueDocs = [];
            const seenFilenames = new Set();
            for (const doc of docs) {
                if (!seenFilenames.has(doc.filename)) {
                    seenFilenames.add(doc.filename);
                    uniqueDocs.push(doc);
                }
            }
            
            // Create picker modal
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'doc-export-picker-modal';
            modal.innerHTML = `
                <div class="modal-container" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>Select Document to Export</h3>
                        <button class="btn btn-ghost modal-close" aria-label="Close">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                        <div class="document-picker-list">
                            ${uniqueDocs.map(doc => `
                                <div class="document-picker-item" data-doc-id="${doc.id}" data-filename="${escapeHtml(doc.filename)}">
                                    <i data-lucide="file-text"></i>
                                    <div class="doc-info">
                                        <div class="doc-name">${escapeHtml(doc.filename)}</div>
                                        <div class="doc-meta">${doc.role_count || 0} roles • Scanned ${new Date(doc.scan_time).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            // Add click handlers
            modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
            modal.querySelectorAll('.document-picker-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const docId = item.dataset.docId;
                    const filename = item.dataset.filename;
                    modal.remove();
                    await exportDocumentRolesById(docId, filename);
                });
            });
            
        } catch (e) {
            console.error('[TWR Roles] Document picker failed:', e);
            toast('error', 'Failed to load documents: ' + e.message);
        }
        
        setLoading(false);
    }
    
    async function exportDocumentRolesById(docId, filename) {
        const toast = getToast();
        const setLoading = getSetLoading();
        
        setLoading(true, `Exporting roles from ${filename}...`);
        
        try {
            // Fetch roles for specific document
            const response = await fetch(`/api/scan-history/document/${docId}/roles`);
            const result = await response.json();
            
            if (!result.success || !result.data || result.data.length === 0) {
                toast('warning', `No roles found in ${filename}`);
                setLoading(false);
                return;
            }
            
            const roles = result.data;
            
            const headers = ['Role Name', 'Normalized Name', 'Category', 'Mention Count', 'Responsibilities'];
            const rows = roles.map(r => [
                `"${(r.role_name || '').replace(/"/g, '""')}"`,
                `"${(r.normalized_name || '').replace(/"/g, '""')}"`,
                r.category || 'unknown',
                r.mention_count || 0,
                `"${(r.responsibilities || []).join('; ').replace(/"/g, '""')}"`
            ]);
            
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            downloadBlob(blob, `${safeFilename}_roles_${getTimestamp()}.csv`);
            
            toast('success', `Exported ${roles.length} roles from ${filename}`);
        } catch (e) {
            console.error('[TWR Roles] Export document roles failed:', e);
            toast('error', 'Export failed: ' + e.message);
        }
        
        setLoading(false);
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getTimestamp() {
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }

    // ============================================================
    // MODULE EXPORTS
    // ============================================================
    
    return {
        // State access
        GraphState: GraphState,
        AdjudicationState: AdjudicationState,
        
        // Roles Summary & Modal
        renderRolesSummary: renderRolesSummary,
        showRolesModal: showRolesModal,
        initRolesTabs: initRolesTabs,
        updateRolesSidebarStats: updateRolesSidebarStats,
        
        // Roles Views
        renderRolesOverview: renderRolesOverview,
        renderRolesDetails: renderRolesDetails,
        renderRolesMatrix: renderRolesMatrix,
        renderDocumentLog: renderDocumentLog,
        viewDocumentRoles: viewDocumentRoles,
        
        // v3.0.98: Document Filter
        initDocumentFilter: initDocumentFilter,
        highlightRoleInContext: highlightRoleInContext,
        
        // Role-Document Matrix (v3.0.97)
        renderRoleDocMatrix: renderRoleDocMatrix,
        initRoleDocMatrixControls: initRoleDocMatrixControls,
        exportRoleDocMatrixCSV: exportRoleDocMatrixCSV,
        exportRoleDocMatrixExcel: exportRoleDocMatrixExcel,
        
        // RACI Matrix
        initRaciMatrixControls: initRaciMatrixControls,
        resetRaciEdits: resetRaciEdits,
        editRaciCell: editRaciCell,
        closeRaciDropdown: closeRaciDropdown,
        setRaciValue: setRaciValue,
        toggleMatrixCriticalFilter: toggleMatrixCriticalFilter,
        changeMatrixSort: changeMatrixSort,
        exportRaciMatrix: exportRaciMatrix,
        
        // Adjudication
        initAdjudication: initAdjudication,
        initBulkAdjudication: initBulkAdjudication,
        updateBulkActionVisibility: updateBulkActionVisibility,
        bulkAdjudicate: bulkAdjudicate,
        renderAdjudicationList: renderAdjudicationList,
        toggleAdjItemSelection: toggleAdjItemSelection,
        toggleAdjContext: toggleAdjContext,
        editRoleName: editRoleName,
        setAdjudicationStatus: setAdjudicationStatus,
        updateAdjudicationStats: updateAdjudicationStats,
        saveAdjudication: saveAdjudication,
        loadAdjudication: loadAdjudication,
        resetAdjudication: resetAdjudication,
        exportAdjudication: exportAdjudication,
        applyAdjudicationToDocument: applyAdjudicationToDocument,
        updateGraphWithAdjudication: updateGraphWithAdjudication,
        
        // Graph Visualization
        initGraphControls: initGraphControls,
        updatePinButton: updatePinButton,
        updateGraphLabelVisibility: updateGraphLabelVisibility,
        resetGraphView: resetGraphView,
        updateGraphStats: updateGraphStats,
        updateGraphVisibility: updateGraphVisibility,
        renderRolesGraph: renderRolesGraph,
        renderD3Graph: renderD3Graph,
        selectNode: selectNode,
        clearNodeSelection: clearNodeSelection,
        highlightSearchMatches: highlightSearchMatches,
        renderGraphFallbackTable: renderGraphFallbackTable,
        renderFallbackRows: renderFallbackRows,
        filterFallbackTable: filterFallbackTable,
        sortFallbackTable: sortFallbackTable,
        
        // Utilities
        getCategoryForRole: getCategoryForRole,
        getCategoryColorForRole: getCategoryColorForRole,
        showRoleDetails: showRoleDetails,
        exportRoles: exportRoles,
        exportDeliverables: exportDeliverables,
        downloadBlob: downloadBlob,
        getTimestamp: getTimestamp
    };
})();

// ============================================================
// GLOBAL ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================

// Roles Summary & Modal
window.renderRolesSummary = TWR.Roles.renderRolesSummary;
window.showRolesModal = TWR.Roles.showRolesModal;

// RACI Matrix
window.editRaciCell = TWR.Roles.editRaciCell;
window.setRaciValue = TWR.Roles.setRaciValue;
window.toggleMatrixCriticalFilter = TWR.Roles.toggleMatrixCriticalFilter;
window.changeMatrixSort = TWR.Roles.changeMatrixSort;
window.exportRaciMatrix = TWR.Roles.exportRaciMatrix;

// Adjudication
window.toggleAdjItemSelection = TWR.Roles.toggleAdjItemSelection;
window.toggleAdjContext = TWR.Roles.toggleAdjContext;
window.bulkAdjudicate = TWR.Roles.bulkAdjudicate;

// Graph
window.renderRolesGraph = TWR.Roles.renderRolesGraph;
window.clearNodeSelection = TWR.Roles.clearNodeSelection;
window.resetGraphView = TWR.Roles.resetGraphView;
window.filterFallbackTable = TWR.Roles.filterFallbackTable;
window.sortFallbackTable = TWR.Roles.sortFallbackTable;

// Utilities
window.viewDocumentRoles = TWR.Roles.viewDocumentRoles;
window.showRoleDetails = TWR.Roles.showRoleDetails;
window.exportRoles = TWR.Roles.exportRoles;
window.exportDeliverables = TWR.Roles.exportDeliverables;

console.log('[TWR] Roles module loaded');
