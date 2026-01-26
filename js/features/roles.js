/**
 * TechWriterReview - Roles Feature Module
 * 
 * Extracted in v3.0.19 from app.js (~1,600 LOC)
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
        'role-role': { dashArray: 'none', label: 'Role-to-Role' },
        'role-document': { dashArray: 'none', label: 'Role-Document' },
        'role-deliverable': { dashArray: '8,4', label: 'Role-Deliverable' },
        'approval': { dashArray: '4,4', label: 'Approval' },
        'coordination': { dashArray: '2,4', label: 'Coordination' },
        'reports-to': { dashArray: '12,4,4,4', label: 'Reports To' },
        'supports': { dashArray: '4,2', label: 'Supports' },
        'default': { dashArray: 'none', label: 'Connection' }
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
            container.innerHTML = '<p class="text-muted">No roles detected</p>';
            return;
        }

        roleEntries.sort((a, b) => {
            const countA = typeof a[1] === 'object' ? (a[1].frequency || a[1].count || a[1].occurrence_count || 1) : 1;
            const countB = typeof b[1] === 'object' ? (b[1].frequency || b[1].count || b[1].occurrence_count || 1) : 1;
            return countB - countA;
        });

        const topRoles = roleEntries.slice(0, 6);

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
                
                document.querySelectorAll('.roles-section').forEach(s => s.style.display = 'none');
                document.getElementById(`roles-${tabName}`)?.style.setProperty('display', 'block');
                
                if (tabName === 'graph') renderRolesGraph();
                if (tabName === 'matrix') initRaciMatrixControls();
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
        const roleEntries = Object.entries(rolesData);

        if (roleEntries.length === 0) {
            container.innerHTML = '<p class="text-muted">No roles detected in document</p>';
            return;
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
                <div class="stat-card"><div class="stat-value">${roleEntries.length}</div><div class="stat-label">Unique Roles</div></div>
                <div class="stat-card"><div class="stat-value">${totalMentions}</div><div class="stat-label">Total Mentions</div></div>
                <div class="stat-card"><div class="stat-value">${(totalMentions / roleEntries.length).toFixed(1)}</div><div class="stat-label">Avg Mentions</div></div>
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
        const roleEntries = Object.entries(rolesData);

        if (roleEntries.length === 0) {
            container.innerHTML = '<p class="text-muted">No roles detected</p>';
            return;
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
            if (result.success) console.log(`[Adjudication] Added "${roleName}" to dictionary`);
        } catch (e) {
            console.warn(`[Adjudication] Could not add "${roleName}" to dictionary:`, e);
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
        
        console.log('[Graph] Updated with adjudication:', { confirmed: confirmed.length, deliverables: deliverables.length, rejected: rejected.length });
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
        
        GraphState.svg.selectAll('.graph-link').style('opacity', d => d.weight >= minWeight ? 0.6 : 0);
        
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
        const { nodes, links } = data;
        
        if (!nodes || nodes.length === 0) {
            svgElement.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#888">No graph data available</text>';
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
        
        const link = g.append('g').attr('class', 'links').selectAll('line').data(links).join('line')
            .attr('class', d => `graph-link link-${d.link_type || 'role-document'}`)
            .attr('stroke-width', d => { const w = d.weight || 1; const base = GraphState.performanceMode ? 1 : 1.5; return Math.max(base, Math.min(w / 2, 6)); })
            .attr('stroke-dasharray', d => { if (!GraphState.linkStylesEnabled || GraphState.performanceMode) return 'none'; const style = LINK_STYLES[d.link_type] || LINK_STYLES['default']; return style.dashArray; })
            .attr('data-weight', d => d.weight || 1).attr('data-link-type', d => d.link_type || 'role-document');
        
        const node = g.append('g').attr('class', 'nodes').selectAll('g').data(nodes).join('g')
            .attr('class', d => 'graph-node' + (GraphState.glowEnabled ? ' glow-enabled' : ''))
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
        
        node.append('circle')
            .attr('r', d => { const baseSize = d.type === 'role' ? 12 : 10; const mentions = d.total_mentions || d.role_count || 1; return Math.min(baseSize + Math.sqrt(mentions) * 2, 25); })
            .attr('fill', d => colorScale[d.type] || '#888').attr('class', 'node-circle');
        
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
        
        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
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
        
        title.textContent = truncate(d.label, 30);
        
        // Get connections for this node
        const connections = [];
        links.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const sourceLabel = typeof link.source === 'object' ? link.source.label : link.source;
            const targetLabel = typeof link.target === 'object' ? link.target.label : link.target;
            
            if (sourceId === d.id) {
                connections.push({ label: targetLabel, weight: link.weight || 1 });
            } else if (targetId === d.id) {
                connections.push({ label: sourceLabel, weight: link.weight || 1 });
            }
        });
        
        connections.sort((a, b) => b.weight - a.weight);
        
        let html = `<div class="info-section">
            <div class="info-label">Type</div>
            <div class="info-value">${escapeHtml(d.type)}</div>
        </div>`;
        
        if (d.type === 'role') {
            html += `<div class="info-section">
                <div class="info-label">Documents</div>
                <div class="info-value">${d.document_count || 0}</div>
            </div>
            <div class="info-section">
                <div class="info-label">Mentions</div>
                <div class="info-value">${d.total_mentions || 0}</div>
            </div>`;
        } else {
            html += `<div class="info-section">
                <div class="info-label">Roles</div>
                <div class="info-value">${d.role_count || 0}</div>
            </div>`;
        }
        
        if (connections.length > 0) {
            const displayConnections = connections.slice(0, 10);
            html += `<div class="info-section">
                <div class="info-label">Connections (${connections.length})</div>
                <div class="connections-list">
                    ${displayConnections.map(c => `<div class="connection-item"><span class="label">${escapeHtml(truncate(c.label, 20))}</span><span class="weight">${c.weight}</span></div>`).join('')}
                ${connections.length > 10 ? `<div class="connection-item"><em>...and ${connections.length - 10} more</em></div>` : ''}
            </div></div>`;
        }
        
        body.innerHTML = html;
        panel.style.display = 'block';
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
        if (!GraphState.svg || !GraphState.data) { console.warn('[Graph] Cannot highlight - svg or data not ready'); return; }
        
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
        console.log(`[Graph] Search "${query}": ${matchingIds.size} matches, ${connectedIds.size} connected`);
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
