/**
 * TechWriterReview - Roles Tabs Fix (Robust Version)
 * v3.0.119 - Document filter selector fix (.roles-nav-item not .roles-nav-btn)
 *
 * CHANGELOG v3.0.117:
 * - Fixed: Document filter dropdown now properly populates with documents
 * - Fixed: onModalOpen() is now async to await initDocumentFilterDropdown()
 * - Added: Multiple data sources for document filter (scan history + aggregated roles + State)
 * - Added: Enhanced logging for debugging document filter
 *
 * CHANGELOG v3.0.73:
 * - Fixed: Pin selection button now works (was missing from v3.0.63 takeover)
 * - Fixed: Close info panel (X) button now works (was missing from v3.0.63 takeover)
 * - Added: Proper GraphState.isPinned toggle with visual feedback
 * - Added: Clear selection on panel close when not pinned
 * 
 * CHANGELOG v3.0.72:
 * - Fixed: Tab content areas now fill available vertical space
 * - Fixed: Graph, Adjudication, RACI Matrix expand to fill modal
 * - Changed: .roles-section.active uses display: flex for expansion
 * - Removed: max-height constraints that caused white space
 * 
 * CHANGELOG v3.0.71:
 * - Fixed: Navigation now displays as horizontal tabs (not vertical sidebar)
 * - Changed: .roles-sidebar uses flex-direction: row
 * - Removed: width constraints from responsive breakpoints
 * 
 * CHANGELOG v3.0.70:
 * - CRITICAL: CSS rules were missing in style.css!
 * - Added to style.css: #modal-roles .roles-section { display: none !important; }
 * - Added to style.css: #modal-roles .roles-section.active { display: block !important; }
 * - This completes the v3.0.68 fix that was incomplete
 * 
 * CHANGELOG v3.0.69:
 * - Fixed: "Top Roles by Responsibility Count" now shows actual responsibility count
 * - Fixed: Document tag shows unique document count, not total scan count
 * - Fixed: Summary cards show responsibility count, not mention count
 * - Added: responsibility_count field from backend API
 * - Added: unique_document_count field from backend API
 * - Changed: Sorting now uses responsibility_count (primary) then unique docs (secondary)
 * 
 * CHANGELOG v3.0.68:
 * - ROOT CAUSE: CSS uses `#modal-roles .roles-section { display: none !important; }`
 * - ROOT CAUSE: Visibility requires `.active` class, not inline style
 * - Fixed: Now uses classList.add('active') / classList.remove('active')
 * - Removed: All the inline style.display manipulations that were being overridden
 * 
 * CHANGELOG v3.0.67:
 * - Added: Enhanced diagnostic logging to all render functions
 * - Added: Try-catch wrappers to identify render errors
 * - Added: Container existence checks with clear error messages
 * 
 * CHANGELOG v3.0.65:
 * - Fixed: Labels dropdown now sets GraphState.labelMode before calling update
 * 
 * CHANGELOG v3.0.64:
 * - Fixed: initGraphControls now in main export block (was being overwritten)
 * 
 * CHANGELOG v3.0.63:
 * - Fixed: Graph controls now use _tabsFixInitialized flag (same as RACI, Details, Adjudication)
 * - Fixed: initGraphControls follows exact same pattern as initRaciControls
 * - Removed: Dependency on TWR.Roles.initGraphControls - we handle it ourselves
 * 
 * CHANGELOG v3.0.62:
 * - Fixed: Section visibility now uses inline display:block/none (not CSS classes)
 * - This matches the original roles.js behavior and ensures graph renders properly
 * 
 * CHANGELOG v3.0.61:
 * - Fixed: Graph controls (search, dropdowns, buttons) not working
 * - Added: initGraphControlsFallback() for when roles.js function unavailable
 * 
 * CHANGELOG v3.0.60:
 * - Enhanced console logging with [TWR RolesTabs] prefix
 * - Added explicit handler attachment verification
 * - Improved event delegation for adjudication buttons
 * - Added error boundary around click handlers
 * 
 * ISSUES FIXED:
 * 1. Tabs not switching properly
 * 2. No data loading when State.roles is empty
 * 3. Missing empty states for tabs without data
 * 4. Adjudication button clicks not responding (v3.0.59-60)
 * 5. Graph controls not working (v3.0.61-63)
 * 6. Graph section not visible when switching tabs (v3.0.62)
 * 7. Responsibility count not displayed correctly (v3.0.69)
 */

(function() {
    'use strict';
    
    console.log('[TWR RolesTabs] Loading v3.0.119 (document filter selector fix)...');

    // Cache for API data
    const Cache = {
        aggregated: null,
        matrix: null,
        scanHistory: null,
        dictionary: null  // v3.0.56: fallback to dictionary when no scan data
    };

    // v3.0.118: Current document filter selection
    let currentDocumentFilter = 'all';
    
    /**
     * Escape HTML special characters
     */
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    
    /**
     * Show toast notification
     */
    function showToast(type, message) {
        if (typeof window.toast === 'function') {
            window.toast(type, message);
        } else if (window.TWR?.Modals?.toast) {
            window.TWR.Modals.toast(type, message);
        } else {
            console.log(`[TWR ${type}] ${message}`);
        }
    }
    
    /**
     * Fetch dictionary roles (fallback when no scan data)
     */
    async function fetchDictionary() {
        if (Cache.dictionary !== null) return Cache.dictionary;
        
        try {
            const response = await fetch('/api/roles/dictionary?include_inactive=false');
            const result = await response.json();
            
            if (result.success) {
                Cache.dictionary = result.data?.roles || [];
                console.log('[TWR RolesTabs] Loaded', Cache.dictionary.length, 'dictionary roles');
            } else {
                Cache.dictionary = [];
            }
        } catch (error) {
            console.error('[TWR RolesTabs] Dictionary fetch error:', error);
            Cache.dictionary = [];
        }
        
        return Cache.dictionary;
    }
    
    /**
     * Fetch aggregated roles from API
     */
    async function fetchAggregatedRoles() {
        if (Cache.aggregated !== null) return Cache.aggregated;
        
        try {
            const response = await fetch('/api/roles/aggregated?include_deliverables=true');
            const result = await response.json();
            
            if (result.success) {
                Cache.aggregated = result.data || [];
                console.log('[TWR RolesTabs] Loaded', Cache.aggregated.length, 'aggregated roles');
            } else {
                console.warn('[TWR RolesTabs] API returned error:', result.error);
                Cache.aggregated = [];
            }
        } catch (error) {
            console.error('[TWR RolesTabs] Fetch error:', error);
            Cache.aggregated = [];
        }
        
        return Cache.aggregated;
    }
    
    /**
     * Fetch role-document matrix from API
     */
    async function fetchMatrix() {
        if (Cache.matrix !== null) return Cache.matrix;
        
        try {
            const response = await fetch('/api/roles/matrix');
            const result = await response.json();
            
            if (result.success) {
                Cache.matrix = result.data || {};
                console.log('[TWR RolesTabs] Loaded matrix data');
            } else {
                Cache.matrix = {};
            }
        } catch (error) {
            console.error('[TWR RolesTabs] Matrix fetch error:', error);
            Cache.matrix = {};
        }
        
        return Cache.matrix;
    }
    
    /**
     * Fetch scan history from API
     */
    async function fetchScanHistory() {
        if (Cache.scanHistory !== null) return Cache.scanHistory;
        
        try {
            const response = await fetch('/api/scan-history?limit=50');
            const result = await response.json();
            
            if (result.success) {
                Cache.scanHistory = result.data || [];
                console.log('[TWR RolesTabs] Loaded', Cache.scanHistory.length, 'scan history items');
            } else {
                Cache.scanHistory = [];
            }
        } catch (error) {
            console.error('[TWR RolesTabs] Scan history fetch error:', error);
            Cache.scanHistory = [];
        }
        
        return Cache.scanHistory;
    }
    
    /**
     * Create empty state HTML
     */
    function emptyState(icon, title, message) {
        return `
            <div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;color:var(--text-muted);">
                <i data-lucide="${icon}" style="width:48px;height:48px;margin-bottom:16px;opacity:0.5;"></i>
                <h4 style="margin:0 0 8px 0;color:var(--text-secondary);">${title}</h4>
                <p style="margin:0;max-width:400px;">${message}</p>
            </div>
        `;
    }
    
    // =========================================================================
    // TAB RENDERERS
    // =========================================================================
    
    /**
     * Get category color for visualization
     */
    function getCategoryColor(category) {
        const colors = {
            'Management': '#1976d2',
            'Technical': '#388e3c',
            'Program': '#7b1fa2',
            'Engineering': '#f57c00',
            'Quality': '#c2185b',
            'Support': '#0097a7',
            'Operations': '#5d4037',
            'Custom': '#607d8b',
            'Role': '#9e9e9e'
        };
        return colors[category] || colors['Role'];
    }

    /**
     * v3.0.118: Populate document filter dropdown with scan history filenames
     * Called directly from renderOverview after fetching history
     */
    function populateDocumentFilter(history) {
        const filterSelect = document.getElementById('roles-document-filter');
        if (!filterSelect) {
            console.warn('[TWR RolesTabs] roles-document-filter element not found');
            return;
        }

        // Extract unique filenames from scan history
        const documents = new Set();
        if (history && history.length > 0) {
            history.forEach(scan => {
                if (scan.filename) {
                    documents.add(scan.filename);
                }
            });
        }

        // Also add current filename from State if available
        const State = window.State || window.TWR?.State?.State || {};
        const currentFilename = State.filename || State.currentFilename || '';
        if (currentFilename) {
            documents.add(currentFilename);
        }

        // Clear and populate options
        filterSelect.innerHTML = '<option value="all">All Documents</option>';

        const docArray = Array.from(documents).sort();
        console.log('[TWR RolesTabs] Populating document filter with:', docArray);

        docArray.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc;
            option.textContent = doc.length > 40 ? doc.substring(0, 37) + '...' : doc;
            option.title = doc;
            filterSelect.appendChild(option);
        });

        console.log('[TWR RolesTabs] Document filter populated with', documents.size, 'documents');

        // v3.0.118: Add change event listener for filtering
        if (!filterSelect._filterInitialized) {
            filterSelect._filterInitialized = true;
            filterSelect.addEventListener('change', (e) => {
                currentDocumentFilter = e.target.value;
                console.log('[TWR RolesTabs] Document filter changed to:', currentDocumentFilter);
                // Re-render the current tab with the new filter
                // v3.0.119: Fixed selector - use .roles-nav-item not .roles-nav-btn
                const activeTab = document.querySelector('.roles-nav-item.active');
                if (activeTab) {
                    const tabName = activeTab.dataset.tab;
                    console.log('[TWR RolesTabs] Re-rendering tab:', tabName);
                    switchToTab(tabName);
                } else {
                    // Fallback to overview
                    console.log('[TWR RolesTabs] No active tab found, defaulting to overview');
                    switchToTab('overview');
                }
            });
        }

        // Restore previous selection if it exists in the new list
        if (currentDocumentFilter !== 'all' && docArray.includes(currentDocumentFilter)) {
            filterSelect.value = currentDocumentFilter;
        } else {
            currentDocumentFilter = 'all';
            filterSelect.value = 'all';
        }
    }

    /**
     * v3.0.118: Filter roles by document
     * Returns roles that have the specified document in their sources
     */
    function filterRolesByDocument(roles, documentFilter) {
        if (!documentFilter || documentFilter === 'all') {
            return roles;
        }

        return roles.filter(role => {
            // Check sources array
            if (role.sources && Array.isArray(role.sources)) {
                if (role.sources.some(src => src.filename === documentFilter || src.document === documentFilter)) {
                    return true;
                }
            }
            // Check documents array
            if (role.documents && Array.isArray(role.documents)) {
                if (role.documents.some(doc =>
                    (typeof doc === 'string' && doc === documentFilter) ||
                    (doc.filename === documentFilter)
                )) {
                    return true;
                }
            }
            // Check source field
            if (role.source === documentFilter) {
                return true;
            }
            return false;
        });
    }

    /**
     * v3.0.118: Filter scan history by document
     */
    function filterHistoryByDocument(history, documentFilter) {
        if (!documentFilter || documentFilter === 'all') {
            return history;
        }
        return history.filter(scan => scan.filename === documentFilter);
    }

    /**
     * Render Overview tab
     */
    async function renderOverview() {
        console.log('[TWR RolesTabs] === renderOverview START ===');
        
        try {
            console.log('[TWR RolesTabs] Fetching aggregated roles...');
            let roles = await fetchAggregatedRoles();
            console.log('[TWR RolesTabs] Aggregated roles fetched:', roles?.length || 0);
            
            console.log('[TWR RolesTabs] Fetching scan history...');
            const history = await fetchScanHistory();
            console.log('[TWR RolesTabs] Scan history fetched:', history?.length || 0);
            let dataSource = 'scans';

            // v3.0.117: Populate document filter dropdown with scan history
            populateDocumentFilter(history);
        
        // Fallback to dictionary if no aggregated roles
        if (roles.length === 0) {
            console.log('[TWR RolesTabs] No aggregated roles, falling back to dictionary...');
            roles = await fetchDictionary();
            dataSource = 'dictionary';
            console.log('[TWR RolesTabs] Dictionary roles loaded:', roles?.length || 0);
        }

        // v3.0.118: Apply document filter
        const filteredRoles = filterRolesByDocument(roles, currentDocumentFilter);
        const filteredHistory = filterHistoryByDocument(history, currentDocumentFilter);
        console.log('[TWR RolesTabs] Filter applied:', currentDocumentFilter, '- roles:', filteredRoles.length, '/', roles.length);

        // Update stat cards (use filtered data)
        const totalRoles = filteredRoles.length;
        // v3.0.69: Sum actual responsibility counts, not mentions
        const totalResponsibilities = filteredRoles.reduce((sum, r) => sum + (r.responsibility_count || 0), 0);
        // v3.0.58: Count unique documents by filename, not total scan instances
        const totalDocs = new Set(filteredHistory.map(h => h.filename)).size || 0;

        // Get unique categories
        const categories = new Set(filteredRoles.map(r => r.category).filter(Boolean));
        
        console.log('[TWR RolesTabs] Stats computed: roles=', totalRoles, 'responsibilities=', totalResponsibilities, 'docs=', totalDocs, 'categories=', categories.size);
        
        // Update elements
        const els = {
            roles: document.getElementById('total-roles-count'),
            resp: document.getElementById('total-responsibilities-count'),
            docs: document.getElementById('total-documents-count'),
            interactions: document.getElementById('total-interactions-count'),
            sidebarRoles: document.getElementById('sidebar-roles-count'),
            sidebarResp: document.getElementById('sidebar-resp-count')
        };
        
        console.log('[TWR RolesTabs] DOM elements found:', 
            'roles=', !!els.roles, 
            'resp=', !!els.resp, 
            'docs=', !!els.docs, 
            'interactions=', !!els.interactions);
        
        if (els.roles) els.roles.textContent = totalRoles;
        if (els.resp) els.resp.textContent = totalResponsibilities;
        if (els.docs) els.docs.textContent = totalDocs;
        if (els.interactions) els.interactions.textContent = categories.size;
        if (els.sidebarRoles) els.sidebarRoles.textContent = totalRoles;
        if (els.sidebarResp) els.sidebarResp.textContent = totalResponsibilities;
        
        // Show data source indicator
        const topRolesList = document.getElementById('top-roles-list');
        console.log('[TWR RolesTabs] top-roles-list found:', !!topRolesList);
        if (topRolesList) {
            let sourceNote = '';
            if (dataSource === 'dictionary') {
                sourceNote = `
                    <div style="padding:12px;background:var(--bg-tertiary,#fff3cd);border-radius:6px;margin-bottom:12px;font-size:12px;border:1px solid #ffc107;">
                        <i data-lucide="info" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;color:#856404;"></i>
                        <strong>Showing dictionary roles.</strong> Scan documents with "Role Extraction" enabled to see extracted roles with context and RACI data.
                    </div>
                `;
            }
            
            if (filteredRoles.length > 0) {
                // v3.0.69: Sort by responsibility_count (primary) then unique_document_count (secondary)
                const sorted = [...filteredRoles].sort((a, b) => {
                    const respDiff = (b.responsibility_count || 0) - (a.responsibility_count || 0);
                    if (respDiff !== 0) return respDiff;
                    return (b.unique_document_count || b.documents?.length || b.document_count || 1) -
                           (a.unique_document_count || a.documents?.length || a.document_count || 1);
                });
                // v3.0.118: Show filter indicator if filtering
                let filterNote = '';
                if (currentDocumentFilter !== 'all') {
                    filterNote = `<div style="padding:8px 12px;background:rgba(77,171,247,0.1);border-radius:6px;margin-bottom:12px;font-size:12px;border:1px solid var(--accent-blue);">
                        <i data-lucide="filter" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;color:var(--accent-blue);"></i>
                        Filtered by: <strong>${escapeHtml(currentDocumentFilter)}</strong>
                    </div>`;
                }
                topRolesList.innerHTML = sourceNote + filterNote + sorted.slice(0, 10).map((role, i) => {
                    const catColor = getCategoryColor(role.category);
                    // v3.0.69: Show unique document count, not total scan count
                    const uniqueDocCount = role.unique_document_count || role.documents?.length || 0;
                    const docInfo = uniqueDocCount > 0 ? `${uniqueDocCount} doc${uniqueDocCount !== 1 ? 's' : ''}` : (role.source || 'dictionary');
                    // v3.0.69: Show responsibility count on far right
                    const respCount = role.responsibility_count || 0;
                    return `
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg-secondary);border-radius:6px;margin-bottom:8px;border-left:3px solid ${catColor};">
                        <span style="font-weight:bold;color:var(--accent);min-width:24px;">${i + 1}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(role.role_name)}</div>
                            <div style="font-size:11px;color:var(--text-muted);">
                                <span style="padding:1px 6px;background:${catColor}20;color:${catColor};border-radius:3px;margin-right:6px;">${role.category || 'Role'}</span>
                                ${docInfo}
                            </div>
                        </div>
                        <div style="font-size:14px;font-weight:600;color:var(--accent);" title="${respCount} responsibilities">${respCount}</div>
                    </div>
                `}).join('');
            } else {
                // v3.0.118: Different message for filtered vs unfiltered empty state
                const emptyMsg = currentDocumentFilter !== 'all'
                    ? `No roles found in document "${escapeHtml(currentDocumentFilter)}". Try selecting "All Documents" or a different document.`
                    : 'No roles found. Seed the dictionary or scan documents with "Role Extraction" enabled.';
                topRolesList.innerHTML = `<p class="text-muted" style="padding:20px;text-align:center;">${emptyMsg}</p>`;
            }
        }
        
        // Render distribution chart by category
        const chartContainer = document.getElementById('roles-distribution-chart');
        if (chartContainer && filteredRoles.length > 0) {
            // Group by category
            const categoryCount = {};
            filteredRoles.forEach(r => {
                const cat = r.category || 'Uncategorized';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
            
            const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
            const maxVal = Math.max(...sortedCategories.map(([, count]) => count));
            
            chartContainer.innerHTML = sortedCategories.map(([cat, count]) => {
                const pct = Math.max(5, (count / maxVal * 100));
                const color = getCategoryColor(cat);
                return `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="width:110px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(cat)}">${escapeHtml(cat)}</span>
                        <div style="flex:1;height:18px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;">
                            <div style="width:${pct}%;height:100%;background:${color};transition:width 0.3s;"></div>
                        </div>
                        <span style="width:40px;text-align:right;font-size:12px;color:var(--text-muted);">${count}</span>
                    </div>
                `;
            }).join('');
        } else if (chartContainer) {
            chartContainer.innerHTML = '<p class="text-muted text-center">No data for chart</p>';
        }
        
        console.log('[TWR RolesTabs] === renderOverview COMPLETE ===');
        refreshIcons();
        } catch (error) {
            console.error('[TWR RolesTabs] === renderOverview ERROR ===', error);
            throw error;
        }
    }
    
    /**
     * Render Details tab - shows rich role information
     */
    /**
     * Initialize Role Details controls (search input, sort dropdown)
     * v3.0.57: Ensures controls work when details tab is rendered
     */
    function initDetailsControls() {
        const State = window.State || window.TWR?.State?.get?.() || {};
        
        // Search input
        const searchInput = document.getElementById('roles-search');
        if (searchInput && !searchInput._tabsFixInitialized) {
            searchInput._tabsFixInitialized = true;
            searchInput.addEventListener('input', () => {
                filterDetailsRoles(searchInput.value);
            });
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('roles-sort');
        if (sortSelect && !sortSelect._tabsFixInitialized) {
            sortSelect._tabsFixInitialized = true;
            sortSelect.addEventListener('change', () => {
                State.detailsSort = sortSelect.value;
                console.log('[TWR RolesTabs] Details sort changed to:', sortSelect.value);
                renderDetails();
            });
        }
        
        console.log('[TWR RolesTabs] Details controls initialized');
    }
    
    /**
     * Filter role cards by search text
     */
    function filterDetailsRoles(searchText) {
        const filter = searchText.toLowerCase().trim();
        const cards = document.querySelectorAll('#roles-report-content > div[style*="border"]');
        
        cards.forEach(card => {
            const roleNameEl = card.querySelector('h4');
            const roleName = roleNameEl?.textContent?.toLowerCase() || '';
            const cardText = card.textContent?.toLowerCase() || '';
            
            if (!filter || roleName.includes(filter) || cardText.includes(filter)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
        
        console.log('[TWR RolesTabs] Filtered roles by:', filter || '(none)');
    }
    
    async function renderDetails() {
        console.log('[TWR RolesTabs] === renderDetails START ===');
        
        try {
            const container = document.getElementById('roles-report-content');
            console.log('[TWR RolesTabs] roles-report-content found:', !!container);
            if (!container) {
                console.error('[TWR RolesTabs] CRITICAL: roles-report-content container NOT FOUND');
                return;
            }
            
            // Initialize controls
            initDetailsControls();
            
            console.log('[TWR RolesTabs] Fetching roles for Details...');
            let roles = await fetchAggregatedRoles();
            let dataSource = 'scans';
            console.log('[TWR RolesTabs] Aggregated roles:', roles?.length || 0);
            
            // Fallback to dictionary if no aggregated roles
            if (roles.length === 0) {
                console.log('[TWR RolesTabs] Falling back to dictionary...');
                roles = await fetchDictionary();
                dataSource = 'dictionary';
                console.log('[TWR RolesTabs] Dictionary roles:', roles?.length || 0);
            }

            // v3.0.118: Apply document filter
            const filteredRoles = filterRolesByDocument(roles, currentDocumentFilter);
            console.log('[TWR RolesTabs] Details filter applied:', currentDocumentFilter, '- roles:', filteredRoles.length, '/', roles.length);

            if (filteredRoles.length === 0) {
                console.log('[TWR RolesTabs] No roles found, showing empty state');
                const emptyMsg = currentDocumentFilter !== 'all'
                    ? `No roles found in document "${escapeHtml(currentDocumentFilter)}". Try selecting "All Documents" or a different document.`
                    : 'Seed the Role Dictionary or scan documents with "Role Extraction" enabled to detect organizational roles.';
                container.innerHTML = emptyState('users', 'No Roles Found', emptyMsg);
                refreshIcons();
                return;
            }

        // Source indicator
        let sourceNote = '';
        if (dataSource === 'dictionary') {
            sourceNote = `
                <div style="padding:12px;background:var(--bg-tertiary,#fff3cd);border-radius:6px;margin-bottom:16px;font-size:12px;border:1px solid #ffc107;">
                    <i data-lucide="info" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;color:#856404;"></i>
                    <strong>Showing dictionary roles.</strong> Scan documents to see extracted context, responsibilities, and document associations.
                </div>
            `;
        }
        
        // Get sort preference
        const State = window.State || window.TWR?.State?.get?.() || {};
        const sortBy = State.detailsSort || document.getElementById('roles-sort')?.value || 'count-desc';
        
        // Sort roles based on selection (use filteredRoles)
        const sorted = [...filteredRoles].sort((a, b) => {
            switch (sortBy) {
                case 'count-asc':
                    return (a.document_count || a.total_mentions || 1) - (b.document_count || b.total_mentions || 1);
                case 'alpha':
                    return (a.role_name || '').localeCompare(b.role_name || '');
                case 'count-desc':
                default:
                    return (b.document_count || b.total_mentions || 1) - (a.document_count || a.total_mentions || 1);
            }
        });

        // v3.0.118: Show filter indicator
        let filterNote = '';
        if (currentDocumentFilter !== 'all') {
            filterNote = `<div style="padding:8px 12px;background:rgba(77,171,247,0.1);border-radius:6px;margin-bottom:12px;font-size:12px;border:1px solid var(--accent-blue);">
                <i data-lucide="filter" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;color:var(--accent-blue);"></i>
                Showing roles from: <strong>${escapeHtml(currentDocumentFilter)}</strong> (${filteredRoles.length} of ${roles.length} roles)
            </div>`;
        }

        container.innerHTML = sourceNote + filterNote + sorted.map(role => {
            const catColor = getCategoryColor(role.category);
            const aliases = role.aliases?.length > 0 ? role.aliases.join(', ') : null;
            const description = role.description || null;
            const documents = role.documents?.length > 0 ? role.documents : null;
            
            return `
            <div style="border:1px solid var(--border-default);border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${catColor};" data-role-name="${escapeHtml(role.role_name)}">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                    <div>
                        <h4 style="margin:0 0 6px 0;font-size:16px;">${escapeHtml(role.role_name)}</h4>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <span style="font-size:11px;padding:2px 8px;background:${catColor}20;color:${catColor};border-radius:4px;font-weight:500;">${escapeHtml(role.category || 'Role')}</span>
                            ${role.source ? `<span style="font-size:11px;padding:2px 8px;background:var(--bg-secondary);border-radius:4px;">Source: ${escapeHtml(role.source)}</span>` : ''}
                            ${role.is_deliverable ? '<span style="font-size:11px;padding:2px 8px;background:#e3f2fd;color:#1976d2;border-radius:4px;">Deliverable</span>' : ''}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:24px;font-weight:bold;color:var(--accent);">${role.document_count || role.total_mentions || 1}</div>
                        <div style="font-size:11px;color:var(--text-muted);">${role.document_count ? 'documents' : 'mentions'}</div>
                    </div>
                </div>
                
                ${description ? `
                <div style="margin-bottom:10px;padding:10px;background:var(--bg-secondary);border-radius:6px;">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Description</div>
                    <div style="font-size:13px;">${escapeHtml(description)}</div>
                </div>
                ` : ''}
                
                ${aliases ? `
                <div style="margin-bottom:10px;">
                    <span style="font-size:12px;color:var(--text-muted);margin-right:8px;">Also known as:</span>
                    <span style="font-size:12px;">${escapeHtml(aliases)}</span>
                </div>
                ` : ''}
                
                ${documents ? `
                <div style="font-size:12px;">
                    <span style="color:var(--text-muted);margin-right:8px;">Found in:</span>
                    <span>${documents.slice(0, 5).map(d => `<span style="padding:2px 6px;background:var(--bg-secondary);border-radius:3px;margin-right:4px;">${escapeHtml(d)}</span>`).join('')}${documents.length > 5 ? `<span style="color:var(--text-muted);">+${documents.length - 5} more</span>` : ''}</span>
                </div>
                ` : ''}
                
                <div style="font-size:13px;color:var(--text-secondary);margin-top:8px;">
                    <strong>${role.total_mentions || 1}</strong> total mentions
                </div>
            </div>
        `}).join('');
        
        // Re-apply any existing search filter
        const searchInput = document.getElementById('roles-search');
        if (searchInput?.value) {
            filterDetailsRoles(searchInput.value);
        }
        
        console.log('[TWR RolesTabs] === renderDetails COMPLETE ===');
        refreshIcons();
        } catch (error) {
            console.error('[TWR RolesTabs] === renderDetails ERROR ===', error);
            throw error;
        }
    }
    
    /**
     * Render Cross-Reference tab (Role × Document count matrix)
     * NOTE: This tab requires actual scan data - dictionary roles don't have document associations
     */
    async function renderCrossRef() {
        console.log('[TWR RolesTabs] Rendering Cross-Reference...');
        
        const container = document.getElementById('crossref-matrix');
        if (!container) return;
        
        const matrix = await fetchMatrix();
        
        if (!matrix || !matrix.roles || Object.keys(matrix.roles).length === 0) {
            // Check if dictionary has data to show helpful message
            const dictRoles = await fetchDictionary();
            const hasDict = dictRoles.length > 0;
            
            container.innerHTML = `
                <div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;color:var(--text-muted);">
                    <i data-lucide="table" style="width:48px;height:48px;margin-bottom:16px;opacity:0.5;"></i>
                    <h4 style="margin:0 0 8px 0;color:var(--text-secondary);">No Cross-Reference Data</h4>
                    <p style="margin:0 0 16px 0;max-width:450px;">
                        ${hasDict 
                            ? `You have <strong>${dictRoles.length} roles</strong> in your dictionary, but Cross-Reference requires scan data to show which roles appear in which documents.`
                            : 'Scan documents with "Role Extraction" enabled to see role distribution across documents.'
                        }
                    </p>
                    <div style="background:var(--bg-secondary);padding:16px;border-radius:8px;text-align:left;max-width:400px;">
                        <div style="font-weight:600;margin-bottom:8px;color:var(--text-primary);">To populate this tab:</div>
                        <ol style="margin:0;padding-left:20px;color:var(--text-secondary);font-size:13px;">
                            <li>Open a document (.docx or .pdf)</li>
                            <li>Enable "Role Extraction" in the sidebar</li>
                            <li>Click "Run Review"</li>
                            <li>Return here to see the matrix</li>
                        </ol>
                    </div>
                </div>
            `;
            refreshIcons();
            return;
        }
        
        const { documents = {}, roles = {}, connections = {} } = matrix;
        const docList = Object.entries(documents);
        const roleList = Object.entries(roles);
        
        if (roleList.length === 0 || docList.length === 0) {
            container.innerHTML = emptyState('table', 'Insufficient Data', 
                'Need at least one role and one document to display cross-reference.');
            refreshIcons();
            return;
        }
        
        // Sort roles by total mentions across all docs
        const roleTotals = {};
        roleList.forEach(([roleId, roleName]) => {
            let total = 0;
            if (connections[roleId]) {
                Object.values(connections[roleId]).forEach(count => total += count);
            }
            roleTotals[roleId] = total;
        });
        
        roleList.sort((a, b) => (roleTotals[b[0]] || 0) - (roleTotals[a[0]] || 0));
        
        // Calculate column totals for documents
        const docTotals = {};
        docList.forEach(([docId]) => {
            let total = 0;
            roleList.forEach(([roleId]) => {
                total += connections[roleId]?.[docId] || 0;
            });
            docTotals[docId] = total;
        });
        
        // Helper function for heatmap color
        function getHeatmapColor(count) {
            if (count === 0) return '';
            if (count <= 2) return 'background:#e3f2fd;';
            if (count <= 5) return 'background:#90caf9;';
            if (count <= 10) return 'background:#42a5f5;color:white;';
            return 'background:#1976d2;color:white;';
        }
        
        // Build table
        let html = `
            <table class="crossref-table" style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:10px;border-bottom:2px solid var(--border-default);background:var(--bg-surface);position:sticky;left:0;top:0;z-index:2;min-width:160px;">
                            Role
                        </th>
        `;
        
        // Document headers
        docList.forEach(([docId, docName]) => {
            const shortName = docName.length > 18 ? docName.slice(0, 15) + '...' : docName;
            html += `
                <th style="padding:10px;border-bottom:2px solid var(--border-default);background:var(--bg-surface);position:sticky;top:0;z-index:1;min-width:80px;max-width:120px;text-align:center;" 
                    title="${escapeHtml(docName)}">
                    ${escapeHtml(shortName)}
                </th>
            `;
        });
        
        // Total column header
        html += `
            <th style="padding:10px;border-bottom:2px solid var(--border-default);background:var(--bg-tertiary,#f5f5f5);position:sticky;top:0;z-index:1;min-width:60px;text-align:center;font-weight:bold;">
                Total
            </th>
        </tr></thead><tbody>`;
        
        // Role rows
        roleList.forEach(([roleId, roleName]) => {
            const rowTotal = roleTotals[roleId] || 0;
            html += `
                <tr class="crossref-row" data-role="${escapeHtml(roleName)}">
                    <td style="padding:10px;border-bottom:1px solid var(--border-default);background:var(--bg-surface);position:sticky;left:0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;" 
                        title="${escapeHtml(roleName)}">
                        ${escapeHtml(roleName)}
                    </td>
            `;
            
            // Cell for each document
            docList.forEach(([docId]) => {
                const count = connections[roleId]?.[docId] || 0;
                const colorStyle = getHeatmapColor(count);
                html += `
                    <td style="padding:10px;text-align:center;border-bottom:1px solid var(--border-default);${colorStyle}">
                        ${count || '-'}
                    </td>
                `;
            });
            
            // Row total
            html += `
                <td style="padding:10px;text-align:center;border-bottom:1px solid var(--border-default);background:var(--bg-tertiary,#f5f5f5);font-weight:bold;">
                    ${rowTotal}
                </td>
            </tr>`;
        });
        
        // Footer row with column totals
        html += `
            <tr class="crossref-totals" style="font-weight:bold;">
                <td style="padding:10px;border-top:2px solid var(--border-default);background:var(--bg-tertiary,#f5f5f5);position:sticky;left:0;">
                    Total
                </td>
        `;
        
        let grandTotal = 0;
        docList.forEach(([docId]) => {
            const colTotal = docTotals[docId] || 0;
            grandTotal += colTotal;
            html += `
                <td style="padding:10px;text-align:center;border-top:2px solid var(--border-default);background:var(--bg-tertiary,#f5f5f5);">
                    ${colTotal}
                </td>
            `;
        });
        
        html += `
            <td style="padding:10px;text-align:center;border-top:2px solid var(--border-default);background:var(--bg-tertiary,#f0f0f0);">
                ${grandTotal}
            </td>
        </tr></tbody></table>`;
        
        container.innerHTML = html;
        
        // Setup search filter
        const searchInput = document.getElementById('crossref-search');
        if (searchInput && !searchInput._filterInitialized) {
            searchInput._filterInitialized = true;
            searchInput.addEventListener('input', function() {
                const filter = this.value.toLowerCase();
                document.querySelectorAll('.crossref-row').forEach(row => {
                    const roleName = row.dataset.role?.toLowerCase() || '';
                    row.style.display = roleName.includes(filter) ? '' : 'none';
                });
            });
        }
        
        // Setup CSV export
        const exportBtn = document.getElementById('btn-crossref-export');
        if (exportBtn && !exportBtn._exportInitialized) {
            exportBtn._exportInitialized = true;
            exportBtn.addEventListener('click', function() {
                exportCrossRefCSV(roleList, docList, connections, roleTotals, docTotals);
            });
        }
        
        console.log('[TWR RolesTabs] Cross-Reference rendered with', roleList.length, 'roles ×', docList.length, 'documents');
    }
    
    /**
     * Export Cross-Reference as CSV
     */
    function exportCrossRefCSV(roleList, docList, connections, roleTotals, docTotals) {
        let csv = 'Role,' + docList.map(([, name]) => `"${name.replace(/"/g, '""')}"`).join(',') + ',Total\n';
        
        roleList.forEach(([roleId, roleName]) => {
            const row = [`"${roleName.replace(/"/g, '""')}"`];
            docList.forEach(([docId]) => {
                row.push(connections[roleId]?.[docId] || 0);
            });
            row.push(roleTotals[roleId] || 0);
            csv += row.join(',') + '\n';
        });
        
        // Totals row
        const totalsRow = ['Total'];
        let grandTotal = 0;
        docList.forEach(([docId]) => {
            totalsRow.push(docTotals[docId] || 0);
            grandTotal += docTotals[docId] || 0;
        });
        totalsRow.push(grandTotal);
        csv += totalsRow.join(',') + '\n';
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'role_crossref_' + new Date().toISOString().slice(0, 10) + '.csv';
        link.click();
        URL.revokeObjectURL(url);
        
        showToast('success', 'Cross-reference exported to CSV');
    }
    
    /**
     * Initialize RACI matrix controls (sort dropdown, filter checkbox)
     * v3.0.57: Ensures controls work when matrix is rendered via roles-tabs-fix.js
     */
    function initRaciControls() {
        const State = window.State || window.TWR?.State?.get?.() || {};
        
        // Sort dropdown
        const sortSelect = document.getElementById('matrix-sort');
        if (sortSelect && !sortSelect._tabsFixInitialized) {
            sortSelect._tabsFixInitialized = true;
            sortSelect.addEventListener('change', () => {
                State.matrixSort = sortSelect.value;
                console.log('[TWR RolesTabs] Sort changed to:', sortSelect.value);
                // Re-render the matrix
                if (typeof window.TWR?.Roles?.renderRolesMatrix === 'function') {
                    window.TWR.Roles.renderRolesMatrix();
                } else if (typeof window.renderRolesMatrix === 'function') {
                    window.renderRolesMatrix();
                }
            });
        }
        
        // Filter checkbox
        const filterCritical = document.getElementById('matrix-filter-critical');
        if (filterCritical && !filterCritical._tabsFixInitialized) {
            filterCritical._tabsFixInitialized = true;
            filterCritical.addEventListener('change', () => {
                State.matrixFilterCritical = filterCritical.checked;
                console.log('[TWR RolesTabs] Filter critical changed to:', filterCritical.checked);
                // Re-render the matrix
                if (typeof window.TWR?.Roles?.renderRolesMatrix === 'function') {
                    window.TWR.Roles.renderRolesMatrix();
                } else if (typeof window.renderRolesMatrix === 'function') {
                    window.renderRolesMatrix();
                }
            });
        }
        
        // Reset button
        const resetBtn = document.getElementById('btn-raci-reset');
        if (resetBtn && !resetBtn._tabsFixInitialized) {
            resetBtn._tabsFixInitialized = true;
            resetBtn.addEventListener('click', () => {
                State.raciEdits = {};
                showToast('success', 'RACI matrix reset to detected values');
                if (typeof window.TWR?.Roles?.renderRolesMatrix === 'function') {
                    window.TWR.Roles.renderRolesMatrix();
                } else if (typeof window.renderRolesMatrix === 'function') {
                    window.renderRolesMatrix();
                }
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('btn-raci-export');
        if (exportBtn && !exportBtn._tabsFixInitialized) {
            exportBtn._tabsFixInitialized = true;
            exportBtn.addEventListener('click', () => {
                if (typeof window.TWR?.Roles?.exportRaciMatrix === 'function') {
                    window.TWR.Roles.exportRaciMatrix();
                } else {
                    showToast('info', 'Export requires scan data');
                }
            });
        }
        
        console.log('[TWR RolesTabs] RACI controls initialized');
    }
    
    /**
     * Render Matrix tab - RACI assignments
     * RACI data requires actual document scans with action verb analysis.
     */
    async function renderMatrix() {
        console.log('[TWR RolesTabs] Rendering RACI Matrix...');
        
        const container = document.getElementById('responsibility-matrix');
        if (!container) {
            console.warn('[TWR RolesTabs] responsibility-matrix container not found');
            return;
        }
        
        // First try the original renderer if State.roles has data with action_types
        const State = window.State || window.TWR?.State?.get?.() || {};
        if (State.roles && Object.keys(State.roles).length > 0) {
            // Check if we have actual RACI data (action_types)
            const hasActionTypes = Object.values(State.roles).some(r => 
                r.action_types && Object.keys(r.action_types).length > 0
            );
            
            if (hasActionTypes) {
                // Original renderer uses 'matrix-container' but our HTML has 'responsibility-matrix'
                let matrixContainer = document.getElementById('matrix-container');
                if (!matrixContainer) {
                    container.innerHTML = '<div id="matrix-container"></div>';
                    matrixContainer = document.getElementById('matrix-container');
                }
                
                if (typeof window.TWR?.Roles?.renderRolesMatrix === 'function') {
                    window.TWR.Roles.renderRolesMatrix();
                    initRaciControls();  // v3.0.57: Initialize controls after render
                    return;
                } else if (typeof window.renderRolesMatrix === 'function') {
                    window.renderRolesMatrix();
                    initRaciControls();  // v3.0.57: Initialize controls after render
                    return;
                }
            }
        }
        
        // Initialize controls even when showing fallback (for when data loads later)
        initRaciControls();
        
        // Check for dictionary data to show helpful guidance
        let roles = await fetchAggregatedRoles();
        let dataSource = 'scans';
        
        if (roles.length === 0) {
            roles = await fetchDictionary();
            dataSource = 'dictionary';
        }
        
        if (roles.length === 0) {
            container.innerHTML = emptyState('grid-3x3', 'No RACI Data Available',
                'Scan a document with "Role Extraction" enabled to generate RACI assignments.');
            refreshIcons();
            return;
        }
        
        // Show explanation and role list without RACI assignments
        const catColors = {};
        roles.forEach(r => {
            if (r.category && !catColors[r.category]) {
                catColors[r.category] = getCategoryColor(r.category);
            }
        });
        
        let html = `
            <div style="padding:16px;background:var(--bg-tertiary,#fff3cd);border-radius:8px;margin-bottom:20px;border:1px solid #ffc107;">
                <div style="display:flex;align-items:start;gap:12px;">
                    <i data-lucide="alert-triangle" style="width:24px;height:24px;color:#856404;flex-shrink:0;margin-top:2px;"></i>
                    <div>
                        <div style="font-weight:600;color:#856404;margin-bottom:8px;">RACI Matrix Requires Document Scans</div>
                        <p style="margin:0 0 12px 0;font-size:13px;color:#856404;">
                            ${dataSource === 'dictionary' 
                                ? `You have <strong>${roles.length} roles</strong> in your dictionary, but RACI assignments (R/A/C/I) are computed by analyzing action verbs in documents.`
                                : 'RACI assignments are computed from action verbs like "shall perform", "approve", "review", "notify".'
                            }
                        </p>
                        <div style="font-size:12px;color:#856404;">
                            <strong>How RACI is detected:</strong>
                            <ul style="margin:8px 0 0 0;padding-left:20px;">
                                <li><strong>R</strong> (Responsible): "shall perform", "executes", "develops", "creates"</li>
                                <li><strong>A</strong> (Accountable): "approves", "authorizes", "owns", "certifies"</li>
                                <li><strong>C</strong> (Consulted): "reviews", "advises", "coordinates", "supports"</li>
                                <li><strong>I</strong> (Informed): "is notified", "receives reports", "monitors"</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <h4 style="margin:0 0 12px 0;color:var(--text-secondary);">
                ${dataSource === 'dictionary' ? 'Dictionary Roles' : 'Known Roles'} (${roles.length})
            </h4>
            
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
        `;
        
        // Show roles as chips grouped by category
        const byCategory = {};
        roles.forEach(r => {
            const cat = r.category || 'Uncategorized';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(r);
        });
        
        Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length).slice(0, 10).forEach(([cat, catRoles]) => {
            const color = getCategoryColor(cat);
            html += `
                <div style="margin-bottom:12px;width:100%;">
                    <div style="font-size:12px;font-weight:600;color:${color};margin-bottom:6px;">${escapeHtml(cat)} (${catRoles.length})</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        ${catRoles.slice(0, 15).map(r => `
                            <span style="padding:4px 10px;background:${color}15;border:1px solid ${color}40;border-radius:4px;font-size:12px;">${escapeHtml(r.role_name)}</span>
                        `).join('')}
                        ${catRoles.length > 15 ? `<span style="padding:4px 10px;color:var(--text-muted);font-size:12px;">+${catRoles.length - 15} more</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        if (Object.keys(byCategory).length > 10) {
            html += `<div style="width:100%;color:var(--text-muted);font-size:12px;margin-top:8px;">+${Object.keys(byCategory).length - 10} more categories</div>`;
        }
        
        html += '</div>';
        
        container.innerHTML = html;
        refreshIcons();
    }
    
    /**
     * v3.0.58: Initialize Adjudication tab controls
     * v3.0.59: Added edit mode and action button handlers with better logging
     */
    function initAdjudicationControls() {
        console.log('[TWR RolesTabs] Initializing adjudication controls v3.0.60...');
        
        // Filter dropdown
        const filterSelect = document.getElementById('adj-filter');
        if (filterSelect && !filterSelect._tabsFixInitialized) {
            filterSelect._tabsFixInitialized = true;
            filterSelect.addEventListener('change', () => {
                filterAdjudicationRoles();
                console.log('[TWR RolesTabs] Adjudication filter changed to:', filterSelect.value);
            });
            console.log('[TWR RolesTabs] ✓ Filter dropdown handler attached');
        }
        
        // Search input
        const searchInput = document.getElementById('adj-search');
        if (searchInput && !searchInput._tabsFixInitialized) {
            searchInput._tabsFixInitialized = true;
            searchInput.addEventListener('input', () => {
                filterAdjudicationRoles();
            });
            console.log('[TWR RolesTabs] ✓ Search input handler attached');
        }
        
        // Select All checkbox
        const selectAllCheckbox = document.getElementById('adj-select-all');
        if (selectAllCheckbox && !selectAllCheckbox._tabsFixInitialized) {
            selectAllCheckbox._tabsFixInitialized = true;
            selectAllCheckbox.addEventListener('change', () => {
                const items = document.querySelectorAll('.adjudication-item:not([style*="display: none"]) .adj-item-checkbox');
                items.forEach(cb => cb.checked = selectAllCheckbox.checked);
                updateAdjudicationSelectionCount();
            });
            console.log('[TWR RolesTabs] ✓ Select All checkbox handler attached');
        }
        
        // Item checkboxes and action buttons - use event delegation
        // v3.0.60: ALWAYS re-attach handlers, with enhanced error handling
        const container = document.getElementById('adjudication-list');
        if (container) {
            // Remove old listeners if exists
            if (container._adjClickHandler) {
                container.removeEventListener('click', container._adjClickHandler);
                console.log('[TWR RolesTabs] Removed old click handler');
            }
            if (container._adjChangeHandler) {
                container.removeEventListener('change', container._adjChangeHandler);
            }
            
            // Change handler for checkboxes
            container._adjChangeHandler = (e) => {
                if (e.target.classList.contains('adj-item-checkbox')) {
                    updateAdjudicationSelectionCount();
                }
            };
            container.addEventListener('change', container._adjChangeHandler);
            
            // Click handler for action buttons - v3.0.60: Enhanced with error boundary
            container._adjClickHandler = (e) => {
                try {
                    // Debug: Log all clicks in container
                    const clickedEl = e.target;
                    const clickedBtn = clickedEl.closest('button');
                    
                    if (clickedBtn) {
                        console.log('[TWR RolesTabs] Button clicked in adjudication-list:', 
                            clickedBtn.className, 
                            'Title:', clickedBtn.title);
                    }
                    
                    const item = e.target.closest('.adjudication-item');
                    if (!item) {
                        console.log('[TWR RolesTabs] Click not on .adjudication-item');
                        return;
                    }
                    
                    const roleName = item.dataset.role;
                    const roleId = item.dataset.roleId;
                    
                    // Edit button
                    if (e.target.closest('.adj-btn-edit')) {
                        console.log('[TWR RolesTabs] ★ Edit clicked for:', roleName);
                        e.preventDefault();
                        e.stopPropagation();
                        toggleAdjudicationEditMode(item, true);
                        return;
                    }
                    
                    // Save edit button
                    if (e.target.closest('.adj-btn-save-edit')) {
                        console.log('[TWR RolesTabs] ★ Save edit clicked for:', roleName);
                        e.preventDefault();
                        e.stopPropagation();
                        saveAdjudicationEdit(item);
                        return;
                    }
                    
                    // Cancel edit button
                    if (e.target.closest('.adj-btn-cancel-edit')) {
                        console.log('[TWR RolesTabs] ★ Cancel edit clicked for:', roleName);
                        e.preventDefault();
                        e.stopPropagation();
                        toggleAdjudicationEditMode(item, false);
                        return;
                    }
                    
                    // Confirm button
                    if (e.target.closest('.adj-btn-confirm')) {
                        console.log('[TWR RolesTabs] ★ Confirm clicked for:', roleName);
                        e.preventDefault();
                        e.stopPropagation();
                        setAdjudicationItemStatus(item, 'confirmed');
                        return;
                    }
                    
                    // Deliverable button
                    if (e.target.closest('.adj-btn-deliverable')) {
                        console.log('[TWR RolesTabs] ★ Deliverable clicked for:', roleName);
                        e.preventDefault();
                        e.stopPropagation();
                        setAdjudicationItemStatus(item, 'deliverable');
                        return;
                    }
                    
                    // Reject button
                    if (e.target.closest('.adj-btn-reject')) {
                        console.log('[TWR RolesTabs] ★ Reject clicked for:', roleName);
                        e.preventDefault();
                        e.stopPropagation();
                        setAdjudicationItemStatus(item, 'rejected');
                        return;
                    }
                } catch (error) {
                    console.error('[TWR RolesTabs] Error in click handler:', error);
                }
            };
            
            // Use capturing phase to ensure we get the events first
            container.addEventListener('click', container._adjClickHandler, true);
            
            console.log('[TWR RolesTabs] ✓ Adjudication click handlers attached (capturing phase)');
            console.log('[TWR RolesTabs] Container has', container.querySelectorAll('.adjudication-item').length, 'items');
        } else {
            console.warn('[TWR RolesTabs] ✗ adjudication-list container not found');
        }
        
        console.log('[TWR RolesTabs] Adjudication controls initialized v3.0.60');
    }
    
    /**
     * v3.0.59: Toggle edit mode for an adjudication item
     */
    function toggleAdjudicationEditMode(item, editMode) {
        const viewDiv = item.querySelector('.adj-item-view');
        const editDiv = item.querySelector('.adj-item-edit');
        const viewActions = item.querySelector('.adj-view-actions');
        const editActions = item.querySelector('.adj-edit-actions');
        
        if (editMode) {
            // Populate edit fields from current values
            const roleName = item.dataset.role || '';
            const categoryBadge = item.querySelector('.adj-category-badge');
            const descEl = item.querySelector('.adj-description');
            
            const currentCategory = categoryBadge?.dataset.category || 'Custom';
            const currentDesc = descEl?.dataset.description || '';
            
            const nameInput = item.querySelector('.adj-edit-name');
            const categorySelect = item.querySelector('.adj-edit-category');
            const descInput = item.querySelector('.adj-edit-description');
            
            if (nameInput) nameInput.value = roleName;
            if (categorySelect) categorySelect.value = currentCategory;
            if (descInput) descInput.value = currentDesc;
            
            if (viewDiv) viewDiv.style.display = 'none';
            if (editDiv) editDiv.style.display = 'block';
            if (viewActions) viewActions.style.display = 'none';
            if (editActions) editActions.style.display = 'flex';
            
            // Focus on name input
            setTimeout(() => nameInput?.focus(), 50);
        } else {
            if (viewDiv) viewDiv.style.display = 'block';
            if (editDiv) editDiv.style.display = 'none';
            if (viewActions) viewActions.style.display = 'flex';
            if (editActions) editActions.style.display = 'none';
        }
    }
    
    /**
     * v3.0.59: Save adjudication item edit
     */
    async function saveAdjudicationEdit(item) {
        const roleId = item.dataset.roleId;
        const nameInput = item.querySelector('.adj-edit-name');
        const categorySelect = item.querySelector('.adj-edit-category');
        const descInput = item.querySelector('.adj-edit-description');
        const statusSelect = item.querySelector('.adj-edit-status');
        
        const newName = nameInput?.value?.trim();
        const newCategory = categorySelect?.value || 'Custom';
        const newDesc = descInput?.value?.trim() || '';
        const newStatus = statusSelect?.value || 'pending';
        
        if (!newName) {
            showToast('error', 'Role name cannot be empty');
            return;
        }
        
        // Update UI immediately
        item.dataset.role = newName;
        const nameEl = item.querySelector('.adj-item-name');
        const categoryBadge = item.querySelector('.adj-category-badge');
        const descEl = item.querySelector('.adj-description');
        
        if (nameEl) nameEl.textContent = newName;
        if (categoryBadge) {
            categoryBadge.textContent = newCategory;
            categoryBadge.dataset.category = newCategory;
            categoryBadge.style.background = getCategoryColor(newCategory) + '20';
            categoryBadge.style.color = getCategoryColor(newCategory);
        }
        if (descEl) {
            descEl.textContent = newDesc ? `"${newDesc.length > 80 ? newDesc.slice(0, 77) + '...' : newDesc}"` : '';
            descEl.dataset.description = newDesc;
            descEl.style.display = newDesc ? '' : 'none';
        }
        
        // Apply status
        setAdjudicationItemStatus(item, newStatus, false);
        
        // Exit edit mode
        toggleAdjudicationEditMode(item, false);
        
        // Save to backend if we have a role ID
        if (roleId) {
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
                await fetch(`/api/roles/dictionary/${roleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({
                        role_name: newName,
                        category: newCategory,
                        description: newDesc
                    })
                });
            } catch (err) {
                console.warn('[TWR] Failed to save to backend:', err);
            }
        }
        
        showToast('success', 'Role updated');
    }
    
    /**
     * v3.0.59: Set adjudication item status with visual feedback
     */
    function setAdjudicationItemStatus(item, status, showNotification = true) {
        // Remove existing status classes
        item.classList.remove('status-pending', 'status-confirmed', 'status-deliverable', 'status-rejected');
        item.classList.add(`status-${status}`);
        
        // Update border color based on status
        const statusColors = {
            'pending': 'var(--text-muted)',
            'confirmed': 'var(--success, #22c55e)',
            'deliverable': 'var(--info, #3b82f6)',
            'rejected': 'var(--error, #ef4444)'
        };
        
        item.style.borderLeftColor = statusColors[status] || statusColors.pending;
        
        // Update status badge if exists
        const statusBadge = item.querySelector('.adj-status-badge');
        if (statusBadge) {
            statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusBadge.className = `adj-status-badge status-${status}`;
        }
        
        // Store decision
        const roleName = item.dataset.role;
        if (window.TWR?.Roles?.AdjudicationState?.decisions) {
            window.TWR.Roles.AdjudicationState.decisions.set(roleName, status);
        }
        
        if (showNotification) {
            showToast('success', `"${roleName}" marked as ${status}`);
        }
        
        // Update stats
        updateAdjudicationStats();
    }
    
    /**
     * v3.0.59: Update adjudication stats display
     */
    function updateAdjudicationStats() {
        const items = document.querySelectorAll('.adjudication-item');
        let pending = 0, confirmed = 0, deliverable = 0, rejected = 0;
        
        items.forEach(item => {
            if (item.classList.contains('status-confirmed')) confirmed++;
            else if (item.classList.contains('status-deliverable')) deliverable++;
            else if (item.classList.contains('status-rejected')) rejected++;
            else pending++;
        });
        
        const pendingEl = document.getElementById('adj-pending-count');
        const confirmedEl = document.getElementById('adj-confirmed-count');
        const deliverableEl = document.getElementById('adj-deliverable-count');
        const rejectedEl = document.getElementById('adj-rejected-count');
        
        if (pendingEl) pendingEl.textContent = pending;
        if (confirmedEl) confirmedEl.textContent = confirmed;
        if (deliverableEl) deliverableEl.textContent = deliverable;
        if (rejectedEl) rejectedEl.textContent = rejected;
    }
    
    /**
     * v3.0.58: Filter adjudication items by dropdown status and search text
     */
    function filterAdjudicationRoles() {
        const filterSelect = document.getElementById('adj-filter');
        const searchInput = document.getElementById('adj-search');
        
        const filterValue = filterSelect?.value || 'all';
        const searchText = searchInput?.value?.toLowerCase().trim() || '';
        
        const items = document.querySelectorAll('.adjudication-item');
        
        items.forEach(item => {
            const roleName = item.dataset.role?.toLowerCase() || '';
            const itemText = item.textContent?.toLowerCase() || '';
            const isDeliverable = item.querySelector('[style*="#1976d2"]') !== null;
            const statusEl = item.classList;
            
            // Determine item status
            let itemStatus = 'pending';
            if (statusEl.contains('status-confirmed')) itemStatus = 'confirmed';
            else if (statusEl.contains('status-deliverable')) itemStatus = 'deliverable';
            else if (statusEl.contains('status-rejected')) itemStatus = 'rejected';
            if (isDeliverable) itemStatus = 'deliverable';
            
            // Filter logic
            let showByFilter = true;
            if (filterValue === 'pending' && itemStatus !== 'pending') showByFilter = false;
            if (filterValue === 'confirmed' && itemStatus !== 'confirmed') showByFilter = false;
            if (filterValue === 'deliverable' && itemStatus !== 'deliverable') showByFilter = false;
            if (filterValue === 'rejected' && itemStatus !== 'rejected') showByFilter = false;
            
            // Search logic
            const showBySearch = !searchText || roleName.includes(searchText) || itemText.includes(searchText);
            
            // Apply visibility
            item.style.display = (showByFilter && showBySearch) ? '' : 'none';
        });
        
        console.log('[TWR RolesTabs] Filtered adjudication: filter=', filterValue, 'search=', searchText || '(none)');
    }
    
    /**
     * v3.0.58: Update the selection count display
     */
    function updateAdjudicationSelectionCount() {
        const checkedItems = document.querySelectorAll('.adjudication-item:not([style*="display: none"]) .adj-item-checkbox:checked');
        const countEl = document.getElementById('adj-selected-count');
        const infoEl = document.getElementById('adj-selection-info');
        const bulkActionsEl = document.getElementById('adj-bulk-actions');
        
        const count = checkedItems.length;
        
        if (countEl) countEl.textContent = count;
        if (infoEl) infoEl.style.display = count > 0 ? '' : 'none';
        if (bulkActionsEl) bulkActionsEl.style.display = count > 0 ? '' : 'none';
    }
    
    /**
     * Render Adjudication tab - shows roles for review with richer context
     * v3.0.59: Added inline edit mode with category, status, description fields
     */
    async function renderAdjudication() {
        console.log('[TWR RolesTabs] Rendering Adjudication...');
        
        const container = document.getElementById('adjudication-list');
        if (!container) return;
        
        let roles = await fetchAggregatedRoles();
        let dataSource = 'scans';
        
        // Fallback to dictionary
        if (roles.length === 0) {
            roles = await fetchDictionary();
            dataSource = 'dictionary';
        }
        
        // Update stats
        const pendingEl = document.getElementById('adj-pending-count');
        const confirmedEl = document.getElementById('adj-confirmed-count');
        const deliverableEl = document.getElementById('adj-deliverable-count');
        const rejectedEl = document.getElementById('adj-rejected-count');
        
        // Count by status if available
        const pending = roles.filter(r => !r.status || r.status === 'pending').length;
        const confirmed = roles.filter(r => r.status === 'confirmed' || r.is_active === true).length;
        const deliverables = roles.filter(r => r.is_deliverable).length;
        const rejected = roles.filter(r => r.status === 'rejected' || r.is_active === false).length;
        
        if (pendingEl) pendingEl.textContent = pending || roles.length;
        if (confirmedEl) confirmedEl.textContent = confirmed || '0';
        if (deliverableEl) deliverableEl.textContent = deliverables;
        if (rejectedEl) rejectedEl.textContent = rejected || '0';
        
        if (roles.length === 0) {
            container.innerHTML = emptyState('check-circle', 'No Roles to Adjudicate',
                'Seed the Role Dictionary or scan documents with "Role Extraction" enabled to detect roles for review.');
            refreshIcons();
            return;
        }
        
        // Category options for dropdown
        const categoryOptions = ['Engineering', 'Management', 'Leadership', 'Government', 'Technical', 'Program', 'Quality', 'Support', 'Operations', 'Board', 'Stakeholder', 'Custom']
            .map(c => `<option value="${c}">${c}</option>`).join('');
        
        // Status options
        const statusOptions = `
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="deliverable">Deliverable</option>
            <option value="rejected">Rejected</option>
        `;
        
        // Source indicator
        let sourceNote = '';
        if (dataSource === 'dictionary') {
            sourceNote = `
                <div style="padding:12px;background:var(--bg-tertiary,#e3f2fd);border-radius:6px;margin-bottom:16px;font-size:12px;border:1px solid #90caf9;">
                    <i data-lucide="info" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;color:#1976d2;"></i>
                    <strong>Showing dictionary roles.</strong> Scan documents to see extracted roles with document context and specific locations.
                </div>
            `;
        }
        
        container.innerHTML = sourceNote + roles.slice(0, 50).map(role => {
            const catColor = getCategoryColor(role.category);
            const documents = role.documents?.slice(0, 2).join(', ') || role.source_document || null;
            const description = role.description || '';
            const displayDesc = description ? (description.length > 80 ? description.slice(0, 77) + '...' : description) : '';
            const status = role.status || 'pending';
            
            return `
            <div class="adjudication-item status-${status}" data-role="${escapeHtml(role.role_name)}" data-role-id="${role.id || ''}"
                 style="display:flex;align-items:start;gap:12px;padding:14px 16px;border:1px solid var(--border-default);border-radius:8px;margin-bottom:10px;transition:all 0.15s;border-left:4px solid ${catColor};">
                <input type="checkbox" class="adj-item-checkbox" style="width:18px;height:18px;margin-top:2px;flex-shrink:0;">
                
                <!-- View Mode -->
                <div class="adj-item-view" style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span class="adj-item-name" style="font-weight:600;font-size:14px;">${escapeHtml(role.role_name)}</span>
                        <span class="adj-category-badge" data-category="${escapeHtml(role.category || 'Custom')}" style="font-size:10px;padding:2px 6px;background:${catColor}20;color:${catColor};border-radius:3px;font-weight:500;">${role.category || 'Custom'}</span>
                        ${role.is_deliverable ? '<span style="font-size:10px;padding:2px 6px;background:#e3f2fd;color:#1976d2;border-radius:3px;">Deliverable</span>' : ''}
                    </div>
                    
                    <div class="adj-description" data-description="${escapeHtml(description)}" style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;font-style:italic;${displayDesc ? '' : 'display:none;'}">
                        ${displayDesc ? `"${escapeHtml(displayDesc)}"` : ''}
                    </div>
                    
                    <div style="font-size:11px;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:8px;">
                        ${role.document_count ? `<span><strong>${role.document_count}</strong> documents</span>` : ''}
                        ${role.total_mentions ? `<span><strong>${role.total_mentions}</strong> mentions</span>` : ''}
                        ${role.source ? `<span>Source: <strong>${escapeHtml(role.source)}</strong></span>` : ''}
                        ${documents ? `<span>Found in: ${escapeHtml(documents)}${role.documents?.length > 2 ? '...' : ''}</span>` : ''}
                    </div>
                </div>
                
                <!-- Edit Mode (hidden by default) -->
                <div class="adj-item-edit" style="flex:1;min-width:0;display:none;">
                    <div style="display:grid;gap:8px;">
                        <div style="display:flex;gap:8px;">
                            <input type="text" class="adj-edit-name form-input" value="${escapeHtml(role.role_name)}" placeholder="Role name" style="flex:1;padding:6px 10px;font-size:13px;">
                            <select class="adj-edit-category form-select" style="width:130px;padding:6px 8px;font-size:12px;">
                                ${categoryOptions.replace(`value="${escapeHtml(role.category || 'Custom')}"`, `value="${escapeHtml(role.category || 'Custom')}" selected`)}
                            </select>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <input type="text" class="adj-edit-description form-input" value="${escapeHtml(description)}" placeholder="Description (optional)" style="flex:1;padding:6px 10px;font-size:13px;">
                            <select class="adj-edit-status form-select" style="width:120px;padding:6px 8px;font-size:12px;">
                                ${statusOptions.replace(`value="${status}"`, `value="${status}" selected`)}
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- View Mode Actions -->
                <div class="adj-view-actions" style="display:flex;gap:4px;flex-shrink:0;">
                    <button class="btn btn-ghost btn-sm adj-btn-edit" title="Edit details" style="color:var(--text-secondary);padding:6px 8px;">
                        <i data-lucide="edit-2" style="width:16px;height:16px;"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm adj-btn-confirm" title="Confirm as Role" style="color:var(--success);padding:6px 8px;">
                        <i data-lucide="user-check" style="width:16px;height:16px;"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm adj-btn-deliverable" title="Mark as Deliverable" style="color:var(--info);padding:6px 8px;">
                        <i data-lucide="package" style="width:16px;height:16px;"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm adj-btn-reject" title="Reject" style="color:var(--error);padding:6px 8px;">
                        <i data-lucide="x-circle" style="width:16px;height:16px;"></i>
                    </button>
                </div>
                
                <!-- Edit Mode Actions -->
                <div class="adj-edit-actions" style="display:none;flex-shrink:0;gap:4px;">
                    <button class="btn btn-success btn-sm adj-btn-save-edit" title="Save changes" style="padding:6px 10px;">
                        <i data-lucide="check" style="width:14px;height:14px;"></i> Save
                    </button>
                    <button class="btn btn-ghost btn-sm adj-btn-cancel-edit" title="Cancel" style="padding:6px 10px;">
                        Cancel
                    </button>
                </div>
            </div>
        `}).join('');
        
        if (roles.length > 50) {
            container.innerHTML += `<p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:12px;">Showing 50 of ${roles.length} roles</p>`;
        }
        
        refreshIcons();
        initAdjudicationControls();  // v3.0.58: Initialize filter/search controls
    }
    
    /**
     * Render Documents tab
     * v3.0.59: Fixed to show role_count from API, added action buttons
     */
    async function renderDocuments() {
        console.log('[TWR RolesTabs] === renderDocuments START ===');
        
        try {
            const tbody = document.getElementById('document-log-body');
            console.log('[TWR RolesTabs] document-log-body found:', !!tbody);
            if (!tbody) {
                console.error('[TWR RolesTabs] CRITICAL: document-log-body NOT FOUND');
                return;
            }
            
            console.log('[TWR RolesTabs] Fetching scan history...');
            const history = await fetchScanHistory();
            console.log('[TWR RolesTabs] History fetched:', history?.length || 0);
            
            if (history.length === 0) {
                console.log('[TWR RolesTabs] No history, showing empty state');
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
                    <i data-lucide="file-text" style="display:block;margin:0 auto 12px;width:32px;height:32px;opacity:0.5;"></i>
                    No scan history. Open and scan documents to see them here.
                </td></tr>`;
                refreshIcons();
                return;
            }
            
            console.log('[TWR RolesTabs] Rendering', history.length, 'history items...');
            tbody.innerHTML = history.map(scan => {
                const date = new Date(scan.scan_time || scan.scanned_at || scan.created_at);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const roleCount = scan.role_count ?? 0;
                const issueCount = scan.issue_count ?? 0;
                const grade = scan.grade || '-';
                const gradeClass = grade === 'A' ? 'text-success' : grade === 'B' ? 'text-info' : grade === 'C' ? 'text-warning' : grade === 'D' || grade === 'F' ? 'text-error' : '';
            
            return `<tr data-scan-id="${scan.scan_id}" data-doc-id="${scan.document_id || ''}">
                <td style="padding:10px;"><strong>${escapeHtml(scan.filename || 'Unknown')}</strong></td>
                <td style="padding:10px;">${dateStr}</td>
                <td style="padding:10px;text-align:center;">${roleCount}</td>
                <td style="padding:10px;text-align:center;">${issueCount}</td>
                <td style="padding:10px;text-align:center;"><span class="${gradeClass}" style="font-weight:600;">${grade}</span></td>
                <td style="padding:10px;text-align:center;">
                    <button class="btn btn-ghost btn-xs doc-log-view-roles" title="View roles from this document" data-filename="${escapeHtml(scan.filename || '')}">
                        <i data-lucide="users" style="width:14px;height:14px;"></i>
                    </button>
                    <button class="btn btn-ghost btn-xs doc-log-delete" title="Remove from history" data-scan-id="${scan.scan_id}">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        
        console.log('[TWR RolesTabs] === renderDocuments COMPLETE ===');
        refreshIcons();
        initDocumentLogActions();
        } catch (error) {
            console.error('[TWR RolesTabs] === renderDocuments ERROR ===', error);
            throw error;
        }
    }
    
    /**
     * Initialize Document Log action button handlers
     * v3.0.59: Added event delegation for view roles and delete buttons
     */
    function initDocumentLogActions() {
        const tbody = document.getElementById('document-log-body');
        if (!tbody || tbody._docLogInitialized) return;
        tbody._docLogInitialized = true;
        
        tbody.addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('.doc-log-view-roles');
            const deleteBtn = e.target.closest('.doc-log-delete');
            
            if (viewBtn) {
                const filename = viewBtn.dataset.filename;
                if (filename) {
                    // Switch to Details tab and filter by this document
                    showToast('info', `Filtering roles from: ${filename}`);
                    await switchToTab('details');
                    const searchInput = document.getElementById('details-search');
                    if (searchInput) {
                        searchInput.value = filename;
                        searchInput.dispatchEvent(new Event('input'));
                    }
                }
            }
            
            if (deleteBtn) {
                const scanId = deleteBtn.dataset.scanId;
                if (scanId && confirm('Remove this scan from history?')) {
                    try {
                        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
                        const response = await fetch(`/api/scan-history/${scanId}`, {
                            method: 'DELETE',
                            headers: { 'X-CSRF-Token': csrfToken }
                        });
                        const result = await response.json();
                        if (result.success) {
                            // Remove from cache and re-render
                            Cache.scanHistory = null;
                            await renderDocuments();
                            showToast('success', 'Scan removed from history');
                        } else {
                            showToast('error', 'Failed to delete: ' + (result.error || 'Unknown error'));
                        }
                    } catch (err) {
                        showToast('error', 'Error deleting scan: ' + err.message);
                    }
                }
            }
        });
    }
    
    /**
     * Refresh Lucide icons
     */
    function refreshIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            try { lucide.createIcons(); } catch(e) { console.warn('Icon refresh failed:', e); }
        }
    }
    
    // =========================================================================
    // TAB SWITCHING
    // =========================================================================
    
    /**
     * Switch to a tab and render its content
     * v3.0.68: FIXED - Use .active class instead of inline display (CSS uses !important)
     */
    async function switchToTab(tabName) {
        console.log('[TWR RolesTabs] === Switching to tab:', tabName, '===');
        
        // Update nav item active states
        const navItems = document.querySelectorAll('.roles-nav-item');
        console.log('[TWR RolesTabs] Updating', navItems.length, 'nav items');
        navItems.forEach(item => {
            const isActive = item.dataset.tab === tabName;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        
        // v3.0.68: Use .active CLASS instead of inline style
        // CSS has: #modal-roles .roles-section { display: none !important; }
        // CSS has: #modal-roles .roles-section.active { display: block !important; }
        const allSections = document.querySelectorAll('#modal-roles .roles-section');
        console.log('[TWR RolesTabs] Managing', allSections.length, 'sections via .active class');
        allSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show ONLY the target section by adding .active class
        const targetSection = document.getElementById(`roles-${tabName}`);
        if (!targetSection) {
            console.warn('[TWR RolesTabs] Section not found: roles-' + tabName);
            return;
        }
        
        targetSection.classList.add('active');
        console.log('[TWR RolesTabs] Activated section: roles-' + tabName);
        
        // Render tab content
        try {
            console.log('[TWR RolesTabs] Starting render for tab:', tabName);
            switch (tabName) {
                case 'overview':
                    await renderOverview();
                    break;
                case 'details':
                    await renderDetails();
                    break;
                case 'matrix':
                    await renderMatrix();
                    break;
                case 'adjudication':
                    await renderAdjudication();
                    break;
                case 'documents':
                    await renderDocuments();
                    break;
                case 'graph':
                    // v3.0.63: Use our own initGraphControls (same pattern as other tabs)
                    initGraphControls();
                    // Render the graph
                    if (typeof window.TWR?.Roles?.renderRolesGraph === 'function') {
                        window.TWR.Roles.renderRolesGraph();
                    } else if (typeof window.renderRolesGraph === 'function') {
                        window.renderRolesGraph();
                    } else {
                        console.warn('[TWR RolesTabs] renderRolesGraph not available');
                    }
                    break;
                case 'dictionary':
                    // Dictionary uses our other fix
                    if (typeof window.TWR?.DictFix?.loadDictionary === 'function') {
                        window.TWR.DictFix.loadDictionary();
                    }
                    break;
                case 'crossref':
                    await renderCrossRef();
                    break;
                case 'roledocmatrix':
                    // v3.0.116: Role-Document Matrix tab
                    if (typeof window.TWR?.Roles?.renderRoleDocMatrix === 'function') {
                        await window.TWR.Roles.renderRoleDocMatrix();
                    } else {
                        console.warn('[TWR RolesTabs] renderRoleDocMatrix not available');
                    }
                    break;
            }
            console.log('[TWR RolesTabs] Render complete for tab:', tabName);
        } catch (error) {
            console.error('[TWR RolesTabs] ERROR rendering tab:', tabName, error);
        }
        
        console.log('[TWR RolesTabs] === Tab switch complete ===');
    }
    
    /**
     * Initialize tab click handlers using event delegation
     * This is more robust than attaching to individual buttons
     */
    function initTabHandlers() {
        const modal = document.getElementById('modal-roles');
        if (!modal) {
            console.warn('[TWR RolesTabs] modal-roles not found for tab handlers');
            return;
        }
        
        // Count nav items for debugging
        const navItems = modal.querySelectorAll('.roles-nav-item');
        console.log('[TWR RolesTabs] Found', navItems.length, 'nav items');
        
        // Remove any existing delegation handler
        if (modal._tabDelegationHandler) {
            modal.removeEventListener('click', modal._tabDelegationHandler, true);
        }
        
        // Create delegation handler
        modal._tabDelegationHandler = async function(e) {
            // Find if we clicked on a nav item or inside one
            const navItem = e.target.closest('.roles-nav-item');
            if (!navItem) return;
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const tabName = navItem.dataset.tab;
            console.log('[TWR RolesTabs] Tab clicked:', tabName, 'element:', navItem);
            
            if (tabName) {
                await switchToTab(tabName);
            }
        };
        
        // Attach with capture phase to run before other handlers
        modal.addEventListener('click', modal._tabDelegationHandler, true);
        
        console.log('[TWR RolesTabs] Tab delegation handler attached to modal');
    }
    
    /**
     * Initialize when modal opens
     */
    function onModalOpen() {
        console.log('[TWR RolesTabs] Modal opened, loading initial data...');

        // Clear cache to get fresh data
        Cache.aggregated = null;
        Cache.dictionary = null;
        Cache.matrix = null;
        Cache.scanHistory = null;

        // Render the overview tab (default) - this also populates the document filter dropdown
        switchToTab('overview');
    }

    /**
     * Setup modal observer
     */
    function setupModalObserver() {
        const modal = document.getElementById('modal-roles');
        if (!modal) {
            console.warn('[TWR RolesTabs] modal-roles not found');
            return;
        }
        
        // Watch for modal visibility changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    const isVisible = modal.style.display !== 'none' && 
                                     !modal.classList.contains('hidden') &&
                                     modal.offsetParent !== null;
                    
                    if (isVisible && !modal._rolesTabsLoaded) {
                        modal._rolesTabsLoaded = true;
                        onModalOpen();
                    } else if (!isVisible) {
                        modal._rolesTabsLoaded = false;
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
        
        // Also check if already visible
        if (modal.style.display !== 'none' && modal.offsetParent !== null) {
            onModalOpen();
        }
    }
    
    /**
     * Setup modal close handlers
     */
    function setupCloseHandlers() {
        const modal = document.getElementById('modal-roles');
        if (!modal) return;
        
        // Close button
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                modal.style.display = 'none';
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            });
        });
        
        // Click outside to close (on the modal backdrop)
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                modal.style.display = 'none';
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    // =========================================================================
    // INIT
    // =========================================================================
    
    function init() {
        initTabHandlers();
        setupModalObserver();
        setupCloseHandlers();
        console.log('[TWR RolesTabs] Fully initialized');
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose API
    window.TWR = window.TWR || {};
    window.TWR.RolesTabs = {
        switchToTab,
        renderOverview,
        renderDetails,
        renderMatrix,
        renderCrossRef,
        renderAdjudication,
        renderDocuments,
        fetchAggregatedRoles,
        fetchMatrix,
        fetchScanHistory,
        fetchDictionary,
        getCategoryColor,
        exportCrossRefCSV,
        initRaciControls,
        initDetailsControls,
        filterDetailsRoles,
        // v3.0.58: Adjudication controls
        initAdjudicationControls,
        filterAdjudicationRoles,
        updateAdjudicationSelectionCount,
        // v3.0.59: Document Log and Adjudication edit
        initDocumentLogActions,
        toggleAdjudicationEditMode,
        saveAdjudicationEdit,
        setAdjudicationItemStatus,
        updateAdjudicationStats,
        // v3.0.63: Graph controls
        initGraphControls
    };
    
    // =========================================================================
    // GRAPH CONTROLS (v3.0.63)
    // Following the same pattern as initRaciControls/initDetailsControls
    // =========================================================================
    
    function initGraphControls() {
        console.log('[TWR RolesTabs] Initializing graph controls v3.0.63...');
        
        // Max nodes dropdown
        const maxNodesSelect = document.getElementById('graph-max-nodes');
        if (maxNodesSelect && !maxNodesSelect._tabsFixInitialized) {
            maxNodesSelect._tabsFixInitialized = true;
            maxNodesSelect.addEventListener('change', function() {
                console.log('[TWR RolesTabs] Max nodes changed to:', this.value);
                if (typeof window.TWR?.Roles?.renderRolesGraph === 'function') {
                    window.TWR.Roles.renderRolesGraph();
                } else if (typeof window.renderRolesGraph === 'function') {
                    window.renderRolesGraph();
                }
            });
            console.log('[TWR RolesTabs] ✓ Max nodes dropdown initialized');
        }
        
        // Layout dropdown
        const layoutSelect = document.getElementById('graph-layout');
        if (layoutSelect && !layoutSelect._tabsFixInitialized) {
            layoutSelect._tabsFixInitialized = true;
            layoutSelect.addEventListener('change', function() {
                console.log('[TWR RolesTabs] Layout changed to:', this.value);
                if (typeof window.TWR?.Roles?.renderRolesGraph === 'function') {
                    window.TWR.Roles.renderRolesGraph();
                } else if (typeof window.renderRolesGraph === 'function') {
                    window.renderRolesGraph();
                }
            });
            console.log('[TWR RolesTabs] ✓ Layout dropdown initialized');
        }
        
        // Labels dropdown
        const labelsSelect = document.getElementById('graph-labels');
        if (labelsSelect && !labelsSelect._tabsFixInitialized) {
            labelsSelect._tabsFixInitialized = true;
            labelsSelect.addEventListener('change', function() {
                console.log('[TWR RolesTabs] Labels changed to:', this.value);
                // Must set GraphState.labelMode before calling updateGraphLabelVisibility
                if (window.TWR?.Roles?.GraphState) {
                    window.TWR.Roles.GraphState.labelMode = this.value;
                }
                if (typeof window.TWR?.Roles?.updateGraphLabelVisibility === 'function') {
                    window.TWR.Roles.updateGraphLabelVisibility();
                }
            });
            console.log('[TWR RolesTabs] ✓ Labels dropdown initialized');
        }
        
        // Weight slider
        const weightSlider = document.getElementById('graph-weight-filter');
        const weightValue = document.getElementById('graph-weight-value');
        if (weightSlider && !weightSlider._tabsFixInitialized) {
            weightSlider._tabsFixInitialized = true;
            weightSlider.addEventListener('input', function() {
                if (weightValue) weightValue.textContent = this.value;
                console.log('[TWR RolesTabs] Weight slider:', this.value);
            });
            weightSlider.addEventListener('change', function() {
                console.log('[TWR RolesTabs] Weight filter applied:', this.value);
                if (typeof window.TWR?.Roles?.updateGraphVisibility === 'function') {
                    window.TWR.Roles.updateGraphVisibility();
                }
            });
            console.log('[TWR RolesTabs] ✓ Weight slider initialized');
        }
        
        // Search input
        const searchInput = document.getElementById('graph-search');
        if (searchInput && !searchInput._tabsFixInitialized) {
            searchInput._tabsFixInitialized = true;
            let searchTimeout = null;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const value = this.value;
                searchTimeout = setTimeout(() => {
                    console.log('[TWR RolesTabs] Graph search:', value);
                    if (typeof window.TWR?.Roles?.highlightSearchMatches === 'function') {
                        window.TWR.Roles.highlightSearchMatches(value);
                    }
                }, 300);
            });
            console.log('[TWR RolesTabs] ✓ Search input initialized');
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('btn-refresh-graph');
        if (refreshBtn && !refreshBtn._tabsFixInitialized) {
            refreshBtn._tabsFixInitialized = true;
            refreshBtn.addEventListener('click', function() {
                console.log('[TWR RolesTabs] Refresh graph clicked');
                if (typeof window.TWR?.Roles?.renderRolesGraph === 'function') {
                    window.TWR.Roles.renderRolesGraph(true);
                } else if (typeof window.renderRolesGraph === 'function') {
                    window.renderRolesGraph(true);
                }
            });
            console.log('[TWR RolesTabs] ✓ Refresh button initialized');
        }
        
        // Reset view button
        const resetBtn = document.getElementById('btn-reset-graph-view');
        if (resetBtn && !resetBtn._tabsFixInitialized) {
            resetBtn._tabsFixInitialized = true;
            resetBtn.addEventListener('click', function() {
                console.log('[TWR RolesTabs] Reset view clicked');
                if (typeof window.TWR?.Roles?.resetGraphView === 'function') {
                    window.TWR.Roles.resetGraphView();
                } else if (typeof window.resetGraphView === 'function') {
                    window.resetGraphView();
                }
            });
            console.log('[TWR RolesTabs] ✓ Reset view button initialized');
        }
        
        // Clear selection button
        const clearBtn = document.getElementById('btn-clear-graph-selection');
        if (clearBtn && !clearBtn._tabsFixInitialized) {
            clearBtn._tabsFixInitialized = true;
            clearBtn.addEventListener('click', function() {
                console.log('[TWR RolesTabs] Clear selection clicked');
                if (typeof window.TWR?.Roles?.clearNodeSelection === 'function') {
                    window.TWR.Roles.clearNodeSelection(true);
                } else if (typeof window.clearNodeSelection === 'function') {
                    window.clearNodeSelection(true);
                }
            });
            console.log('[TWR RolesTabs] ✓ Clear selection button initialized');
        }
        
        // Help button
        const helpBtn = document.getElementById('btn-graph-help');
        if (helpBtn && !helpBtn._tabsFixInitialized) {
            helpBtn._tabsFixInitialized = true;
            helpBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const popup = document.getElementById('graph-help-popup');
                if (popup) {
                    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
                }
                console.log('[TWR RolesTabs] Help toggled');
            });
            console.log('[TWR RolesTabs] ✓ Help button initialized');
        }
        
        // Close help button
        const closeHelpBtn = document.getElementById('btn-close-graph-help');
        if (closeHelpBtn && !closeHelpBtn._tabsFixInitialized) {
            closeHelpBtn._tabsFixInitialized = true;
            closeHelpBtn.addEventListener('click', function() {
                const popup = document.getElementById('graph-help-popup');
                if (popup) popup.style.display = 'none';
            });
        }
        
        // v3.0.73: Pin selection button (was missing from v3.0.63 takeover)
        const pinBtn = document.getElementById('btn-pin-selection');
        if (pinBtn && !pinBtn._tabsFixInitialized) {
            pinBtn._tabsFixInitialized = true;
            pinBtn.addEventListener('click', function() {
                console.log('[TWR RolesTabs] Pin selection clicked');
                const GraphState = window.TWR?.Roles?.GraphState;
                if (GraphState) {
                    GraphState.isPinned = !GraphState.isPinned;
                    // Update button appearance
                    if (typeof window.TWR?.Roles?.updatePinButton === 'function') {
                        window.TWR.Roles.updatePinButton();
                    } else {
                        // Fallback: update button directly
                        pinBtn.classList.toggle('pinned', GraphState.isPinned);
                        pinBtn.title = GraphState.isPinned ? 'Unpin selection' : 'Pin selection';
                    }
                    if (GraphState.isPinned && GraphState.selectedNode) {
                        showToast('info', 'Selection pinned');
                    }
                    console.log('[TWR RolesTabs] Pin state:', GraphState.isPinned);
                }
            });
            console.log('[TWR RolesTabs] ✓ Pin selection button initialized');
        }
        
        // v3.0.73: Close info panel button (was missing from v3.0.63 takeover)
        const closeInfoBtn = document.getElementById('btn-close-info-panel');
        if (closeInfoBtn && !closeInfoBtn._tabsFixInitialized) {
            closeInfoBtn._tabsFixInitialized = true;
            closeInfoBtn.addEventListener('click', function() {
                console.log('[TWR RolesTabs] Close info panel clicked');
                const panel = document.getElementById('graph-info-panel');
                if (panel) {
                    panel.style.display = 'none';
                }
                // Clear selection if not pinned
                const GraphState = window.TWR?.Roles?.GraphState;
                if (GraphState && !GraphState.isPinned) {
                    if (typeof window.TWR?.Roles?.clearNodeSelection === 'function') {
                        window.TWR.Roles.clearNodeSelection();
                    } else if (typeof window.clearNodeSelection === 'function') {
                        window.clearNodeSelection();
                    }
                }
            });
            console.log('[TWR RolesTabs] ✓ Close info panel button initialized');
        }
        
        console.log('[TWR RolesTabs] Graph controls initialization complete');
    }
    
    // =========================================================================
    // OVERRIDE: Allow opening Roles modal without a scan
    // The original showRolesModal() in roles.js blocks if State.roles is empty
    // =========================================================================
    
    /**
     * Show Roles modal - bypasses the "no roles detected" check
     */
    function showRolesModalOverride() {
        console.log('[TWR RolesTabs] Opening Roles modal (override)...');
        
        const modal = document.getElementById('modal-roles');
        if (!modal) {
            console.error('[TWR RolesTabs] modal-roles not found');
            return;
        }
        
        // Ensure tab handlers are attached
        initTabHandlers();
        
        // Show the modal
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Hide all sections initially using inline display:none
        modal.querySelectorAll('.roles-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Clear cache and trigger data load
        Cache.aggregated = null;
        Cache.dictionary = null;
        Cache.matrix = null;
        Cache.scanHistory = null;
        modal._rolesTabsLoaded = true;
        
        // Switch to overview tab and load data
        switchToTab('overview');
        
        // Refresh icons
        refreshIcons();
    }
    
    /**
     * Override the global showRolesModal function
     */
    function installShowModalOverride() {
        // Override the global function
        window.showRolesModal = showRolesModalOverride;
        
        // Also override in TWR.Roles if it exists
        if (window.TWR?.Roles) {
            window.TWR.Roles.showRolesModal = showRolesModalOverride;
        }
        
        // Re-attach click handler to nav-roles button
        const navRoles = document.getElementById('nav-roles');
        if (navRoles) {
            // Remove any existing listeners by cloning
            const newNavRoles = navRoles.cloneNode(true);
            navRoles.parentNode.replaceChild(newNavRoles, navRoles);
            
            newNavRoles.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showRolesModalOverride();
            });
            
            console.log('[TWR RolesTabs] nav-roles click handler installed');
        }
        
        // Also handle the footer button
        const btnRolesReport = document.getElementById('btn-roles-report');
        if (btnRolesReport) {
            // Enable the button
            btnRolesReport.disabled = false;
            btnRolesReport.removeAttribute('disabled');
            
            // Clone to remove existing handlers
            const newBtn = btnRolesReport.cloneNode(true);
            newBtn.disabled = false;
            btnRolesReport.parentNode.replaceChild(newBtn, btnRolesReport);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showRolesModalOverride();
            });
            
            console.log('[TWR RolesTabs] btn-roles-report enabled and handler installed');
        }
        
        console.log('[TWR RolesTabs] showRolesModal override installed');
    }
    
    // Install override after a short delay to ensure other scripts have loaded
    setTimeout(installShowModalOverride, 100);
    
    console.log('[TWR RolesTabs] Module loaded v3.0.72 (full height content) - exposed at window.TWR.RolesTabs');
    
})();
