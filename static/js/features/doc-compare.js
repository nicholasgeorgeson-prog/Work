/**
 * Document Comparison UI Module
 * ==============================
 * Main UI module for document comparison feature.
 * Renders side-by-side diff view with synchronized scrolling
 * and change navigation.
 *
 * @version 1.0.0
 * @requires DocCompareState
 */

window.DocCompare = (function() {
    'use strict';

    // =========================================================================
    // DOM REFERENCES
    // =========================================================================

    let modal = null;
    let oldScanSelect = null;
    let newScanSelect = null;
    let compareBtn = null;
    let closeBtn = null;
    let prevBtn = null;
    let nextBtn = null;
    let firstBtn = null;
    let lastBtn = null;
    let filterSelect = null;
    let oldPanel = null;
    let newPanel = null;
    let minimapEl = null;
    let issuesPanel = null;

    // Stat elements
    let changeCurrentEl = null;
    let changeTotalEl = null;
    let statAddedEl = null;
    let statDeletedEl = null;
    let statModifiedEl = null;

    // Issue elements
    let scoreOldEl = null;
    let scoreNewEl = null;
    let scoreChangeEl = null;
    let issuesFixedEl = null;
    let issuesNewEl = null;

    // =========================================================================
    // UI STATE
    // =========================================================================

    let syncScrollEnabled = true;

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize the module.
     */
    function init() {
        modal = document.getElementById('modal-doc-compare');
        if (!modal) {
            console.warn('[DocCompare] Modal not found, skipping initialization');
            return;
        }

        // Cache DOM elements
        cacheDOMElements();

        // Setup event listeners
        setupEventListeners();
        setupKeyboardShortcuts();

        // Subscribe to state changes
        DocCompareState.onChange(handleStateChange);
        DocCompareState.onNavigate(handleNavigate);
        DocCompareState.onLoad(handleLoad);
        DocCompareState.onError(handleError);

        console.log('[DocCompare] Module initialized');
    }

    /**
     * Cache DOM element references.
     */
    function cacheDOMElements() {
        oldScanSelect = document.getElementById('dc-old-scan');
        newScanSelect = document.getElementById('dc-new-scan');
        compareBtn = document.getElementById('dc-btn-compare');
        closeBtn = document.getElementById('dc-btn-close');
        prevBtn = document.getElementById('dc-btn-prev');
        nextBtn = document.getElementById('dc-btn-next');
        firstBtn = document.getElementById('dc-btn-first');
        lastBtn = document.getElementById('dc-btn-last');
        filterSelect = document.getElementById('dc-filter');
        oldPanel = document.getElementById('dc-content-old');
        newPanel = document.getElementById('dc-content-new');
        minimapEl = document.getElementById('dc-minimap');
        issuesPanel = document.getElementById('dc-issues-panel');

        // Stats
        changeCurrentEl = document.getElementById('dc-change-current');
        changeTotalEl = document.getElementById('dc-change-total');
        statAddedEl = document.getElementById('dc-stat-added');
        statDeletedEl = document.getElementById('dc-stat-deleted');
        statModifiedEl = document.getElementById('dc-stat-modified');

        // Issues
        scoreOldEl = document.getElementById('dc-score-old');
        scoreNewEl = document.getElementById('dc-score-new');
        scoreChangeEl = document.getElementById('dc-score-change');
        issuesFixedEl = document.getElementById('dc-issues-fixed');
        issuesNewEl = document.getElementById('dc-issues-new');
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    /**
     * Setup DOM event listeners.
     */
    function setupEventListeners() {
        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }

        // Also close on modal backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                close();
            }
        });

        // Scan selection
        if (oldScanSelect) {
            oldScanSelect.addEventListener('change', () => {
                const scanId = parseInt(oldScanSelect.value, 10);
                if (scanId) {
                    DocCompareState.setOldScan(scanId);
                }
            });
        }

        if (newScanSelect) {
            newScanSelect.addEventListener('change', () => {
                const scanId = parseInt(newScanSelect.value, 10);
                if (scanId) {
                    DocCompareState.setNewScan(scanId);
                }
            });
        }

        // Compare button
        if (compareBtn) {
            compareBtn.addEventListener('click', loadComparison);
        }

        // Navigation
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                DocCompareState.goToPreviousChange();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                DocCompareState.goToNextChange();
            });
        }

        if (firstBtn) {
            firstBtn.addEventListener('click', () => {
                DocCompareState.goToFirstChange();
            });
        }

        if (lastBtn) {
            lastBtn.addEventListener('click', () => {
                DocCompareState.goToLastChange();
            });
        }

        // Filter
        if (filterSelect) {
            filterSelect.addEventListener('change', handleFilterChange);
        }

        // Issues panel toggle
        const toggleIssuesBtn = document.getElementById('dc-btn-toggle-issues');
        if (toggleIssuesBtn) {
            toggleIssuesBtn.addEventListener('click', () => {
                DocCompareState.toggleIssuesPanel();
            });
        }

        // Synchronized scrolling
        if (oldPanel && newPanel) {
            setupSyncScroll();
        }
    }

    /**
     * Setup keyboard shortcuts.
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!modal || !modal.classList.contains('active')) return;

            // Don't trigger if typing in input
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
                if (e.key === 'Escape') {
                    close();
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'j':
                case 'arrowdown':
                    e.preventDefault();
                    DocCompareState.goToNextChange();
                    break;

                case 'k':
                case 'arrowup':
                    e.preventDefault();
                    DocCompareState.goToPreviousChange();
                    break;

                case 'home':
                    e.preventDefault();
                    DocCompareState.goToFirstChange();
                    break;

                case 'end':
                    e.preventDefault();
                    DocCompareState.goToLastChange();
                    break;

                case 'escape':
                    close();
                    break;

                case 'f':
                    e.preventDefault();
                    if (filterSelect) {
                        filterSelect.focus();
                    }
                    break;

                case 'i':
                    e.preventDefault();
                    DocCompareState.toggleIssuesPanel();
                    break;

                default:
                    // Number keys 1-9 for quick jump
                    if (e.key >= '1' && e.key <= '9') {
                        const idx = parseInt(e.key, 10) - 1;
                        DocCompareState.goToChange(idx);
                    }
            }
        });
    }

    // =========================================================================
    // SYNCHRONIZED SCROLLING
    // =========================================================================

    /**
     * Setup synchronized scrolling between panels.
     * Uses a "scroll initiator" pattern to prevent feedback loops.
     */
    function setupSyncScroll() {
        let scrollInitiator = null;  // Track which panel started the scroll
        let scrollTimeout = null;

        function handleScroll(source, target, sourceName) {
            if (!syncScrollEnabled) return;

            // If another panel initiated the scroll, ignore this event
            if (scrollInitiator && scrollInitiator !== sourceName) {
                return;
            }

            // Mark this panel as the initiator
            scrollInitiator = sourceName;

            // Clear any pending timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            // Sync the target panel to match source
            const sourceMax = source.scrollHeight - source.clientHeight;
            const scrollPercent = sourceMax > 0 ? source.scrollTop / sourceMax : 0;

            const targetMax = target.scrollHeight - target.clientHeight;
            const targetScrollTop = Math.round(scrollPercent * targetMax);

            // Only update if there's a meaningful difference
            if (Math.abs(target.scrollTop - targetScrollTop) > 1) {
                target.scrollTop = targetScrollTop;
            }

            // Update minimap viewport
            updateMinimapViewport(scrollPercent);

            // Reset initiator after scrolling stops (150ms debounce)
            scrollTimeout = setTimeout(() => {
                scrollInitiator = null;
            }, 150);
        }

        oldPanel.addEventListener('scroll', () => handleScroll(oldPanel, newPanel, 'old'), { passive: true });
        newPanel.addEventListener('scroll', () => handleScroll(newPanel, oldPanel, 'new'), { passive: true });
    }

    // =========================================================================
    // STATE HANDLERS
    // =========================================================================

    /**
     * Handle state change events.
     */
    function handleStateChange(event) {
        switch (event.type) {
            case 'loading':
                setLoadingState(event.isLoading);
                break;

            case 'issuesPanel':
                updateIssuesPanelState(event.collapsed);
                break;

            case 'filter':
                updateNavigationUI();
                break;
        }
    }

    /**
     * Handle navigation events.
     */
    function handleNavigate(event) {
        updateNavigationUI();
        scrollToChange(event.rowIndex);
        highlightCurrentChange(event.rowIndex);
    }

    /**
     * Handle load events.
     */
    function handleLoad(event) {
        switch (event.type) {
            case 'scans':
                populateScanSelectors(event.scans, event.document);
                break;

            case 'diff':
                renderDiff(event.diff);
                updateStatsUI(event.diff.stats);
                updateNavigationUI();
                break;

            case 'issues':
                renderIssueComparison(event.comparison);
                break;
        }
    }

    /**
     * Handle error events.
     */
    function handleError(event) {
        console.error('[DocCompare] Error:', event.type, event.error);
        showToast(event.error, 'error');
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Open the comparison modal.
     * @param {number} docId - Document ID
     * @param {number} [initialOldScanId] - Initial old scan ID
     * @param {number} [initialNewScanId] - Initial new scan ID
     */
    async function open(docId, initialOldScanId = null, initialNewScanId = null) {
        if (!modal) {
            console.error('[DocCompare] Modal not initialized');
            return;
        }

        // Validate docId
        if (!docId) {
            console.error('[DocCompare] No document ID provided');
            showToast('No document selected for comparison. Please select a document first.', 'error');
            return;
        }

        console.log('[DocCompare] Opening comparison for document:', docId);

        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // Initialize state
        DocCompareState.init(docId);

        try {
            // Load scans for document
            const scans = await DocCompareState.loadScans(docId);

            // Auto-select scans
            if (initialOldScanId && initialNewScanId) {
                DocCompareState.setOldScan(initialOldScanId);
                DocCompareState.setNewScan(initialNewScanId);

                // Update selectors
                if (oldScanSelect) oldScanSelect.value = initialOldScanId;
                if (newScanSelect) newScanSelect.value = initialNewScanId;

                // Auto-load comparison
                await loadComparison();

            } else if (scans.length >= 2) {
                // Default: compare second-newest to newest
                DocCompareState.setOldScan(scans[1].id);
                DocCompareState.setNewScan(scans[0].id);

                if (oldScanSelect) oldScanSelect.value = scans[1].id;
                if (newScanSelect) newScanSelect.value = scans[0].id;
            }

        } catch (error) {
            showToast('Failed to load document scans: ' + error.message, 'error');
        }
    }

    /**
     * Close the comparison modal.
     */
    function close() {
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }

        // Clear panels
        if (oldPanel) oldPanel.innerHTML = '';
        if (newPanel) newPanel.innerHTML = '';
        if (minimapEl) minimapEl.innerHTML = '';

        // Reset state
        DocCompareState.cleanup();
    }

    /**
     * Load and display comparison.
     */
    async function loadComparison() {
        console.log('[DocCompare] loadComparison called');

        // Check if scans are selected
        const { oldScanId, newScanId } = DocCompareState.getSelectedScans();
        console.log('[DocCompare] Selected scans:', { oldScanId, newScanId });

        if (!oldScanId || !newScanId) {
            showToast('Please select both an old and new scan to compare', 'error');
            return;
        }

        try {
            setLoadingState(true);

            // Load diff
            console.log('[DocCompare] Loading diff...');
            await DocCompareState.loadDiff();
            console.log('[DocCompare] Diff loaded successfully');

            // Load issue comparison
            console.log('[DocCompare] Loading issue comparison...');
            await DocCompareState.loadIssueComparison();
            console.log('[DocCompare] Issue comparison loaded successfully');

            // Navigate to first change
            const changeCount = DocCompareState.getFilteredChangeCount();
            console.log('[DocCompare] Change count:', changeCount);
            if (changeCount > 0) {
                DocCompareState.goToChange(0);
            }

        } catch (error) {
            console.error('[DocCompare] loadComparison error:', error);
            showToast('Failed to load comparison: ' + error.message, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    /**
     * Populate scan selector dropdowns.
     */
    function populateScanSelectors(scans, docInfo) {
        console.log('[DocCompare] populateScanSelectors called:', {
            scanCount: scans?.length || 0,
            docInfo: docInfo,
            hasOldSelect: !!oldScanSelect,
            hasNewSelect: !!newScanSelect
        });

        if (!oldScanSelect || !newScanSelect) {
            console.error('[DocCompare] Scan selectors not found in DOM');
            return;
        }

        // Clear existing options
        oldScanSelect.innerHTML = '<option value="">Select older scan...</option>';
        newScanSelect.innerHTML = '<option value="">Select newer scan...</option>';

        if (!scans || scans.length === 0) {
            console.warn('[DocCompare] No scans available for dropdown population');
            return;
        }

        // Add scan options
        scans.forEach((scan, index) => {
            const dateStr = formatDate(scan.scan_time);
            const label = `${dateStr} (Score: ${scan.score}, Issues: ${scan.issue_count})`;

            const opt1 = document.createElement('option');
            opt1.value = scan.id;
            opt1.textContent = label;
            oldScanSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = scan.id;
            opt2.textContent = label;
            newScanSelect.appendChild(opt2);

            if (index === 0) {
                console.log('[DocCompare] First scan option:', { id: scan.id, label });
            }
        });

        console.log(`[DocCompare] Populated ${scans.length} scan options`);

        // Update document title
        const titleEl = modal.querySelector('.dc-doc-title');
        if (titleEl && docInfo) {
            titleEl.textContent = docInfo.filename;
        }
    }

    /**
     * Render the diff in both panels.
     */
    function renderDiff(diff) {
        if (!oldPanel || !newPanel || !diff) return;

        // Clear panels
        oldPanel.innerHTML = '';
        newPanel.innerHTML = '';

        // Render each row
        diff.rows.forEach((row, index) => {
            const oldRow = renderRow(row, 'old', index);
            const newRow = renderRow(row, 'new', index);

            oldPanel.appendChild(oldRow);
            newPanel.appendChild(newRow);
        });

        // Render minimap
        renderMinimap(diff);

        // Update panel headers
        updatePanelHeaders(diff);
    }

    /**
     * Render a single row for one panel.
     */
    function renderRow(row, side, index) {
        const div = document.createElement('div');
        div.className = `dc-row dc-row-${row.status}`;
        div.dataset.rowIndex = index;
        div.dataset.status = row.status;

        if (side === 'old') {
            if (row.status === 'added') {
                // Placeholder on old side for added content
                div.classList.add('dc-placeholder');
                div.innerHTML = '&nbsp;';
            } else {
                // Use pre-rendered HTML from backend
                div.innerHTML = row.old_html || escapeHtml(row.old_line);
            }
        } else {
            if (row.status === 'deleted') {
                // Placeholder on new side for deleted content
                div.classList.add('dc-placeholder');
                div.innerHTML = '&nbsp;';
            } else {
                div.innerHTML = row.new_html || escapeHtml(row.new_line);
            }
        }

        // Add click handler for navigation
        if (row.is_change) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                DocCompareState.goToRow(index);
            });
        }

        return div;
    }

    /**
     * Render the minimap.
     */
    function renderMinimap(diff) {
        if (!minimapEl || !diff) return;

        minimapEl.innerHTML = '';

        const totalRows = diff.rows.length;
        if (totalRows === 0) return;

        // Create markers for changes
        diff.rows.forEach((row, index) => {
            if (!row.is_change) return;

            const marker = document.createElement('div');
            marker.className = `dc-minimap-marker dc-marker-${row.status}`;
            marker.dataset.rowIndex = index;

            // Calculate position
            const topPercent = (index / totalRows) * 100;
            marker.style.top = `${topPercent}%`;

            // Click to navigate
            marker.addEventListener('click', () => {
                DocCompareState.goToRow(index);
            });

            // Tooltip
            marker.title = `${row.status}: Line ${index + 1}`;

            minimapEl.appendChild(marker);
        });

        // Create viewport indicator
        const viewport = document.createElement('div');
        viewport.className = 'dc-minimap-viewport';
        viewport.id = 'dc-minimap-viewport';
        minimapEl.appendChild(viewport);
    }

    /**
     * Update minimap viewport position.
     */
    function updateMinimapViewport(scrollPercent) {
        const viewport = document.getElementById('dc-minimap-viewport');
        if (!viewport || !minimapEl) return;

        const containerHeight = minimapEl.clientHeight;
        const viewportHeight = Math.max(20, containerHeight * 0.1);

        viewport.style.height = `${viewportHeight}px`;
        viewport.style.top = `${scrollPercent * (containerHeight - viewportHeight)}px`;
    }

    /**
     * Render issue comparison panel.
     */
    function renderIssueComparison(comparison) {
        if (!comparison) return;

        // Update scores
        if (scoreOldEl) scoreOldEl.textContent = comparison.old_score + '%';
        if (scoreNewEl) scoreNewEl.textContent = comparison.new_score + '%';

        if (scoreChangeEl) {
            const change = comparison.score_change;
            if (change > 0) {
                scoreChangeEl.textContent = `+${change}%`;
                scoreChangeEl.className = 'dc-score-change positive';
            } else if (change < 0) {
                scoreChangeEl.textContent = `${change}%`;
                scoreChangeEl.className = 'dc-score-change negative';
            } else {
                scoreChangeEl.textContent = '0%';
                scoreChangeEl.className = 'dc-score-change';
            }
        }

        // Update issue counts
        if (issuesFixedEl) issuesFixedEl.textContent = comparison.fixed_count;
        if (issuesNewEl) issuesNewEl.textContent = comparison.new_count;
    }

    /**
     * Update panel headers with scan dates.
     */
    function updatePanelHeaders(diff) {
        const oldLabel = document.getElementById('dc-old-label');
        const newLabel = document.getElementById('dc-new-label');

        if (oldLabel && diff.old_scan_time) {
            oldLabel.textContent = `Original (${formatDate(diff.old_scan_time)})`;
        }

        if (newLabel && diff.new_scan_time) {
            newLabel.textContent = `Current (${formatDate(diff.new_scan_time)})`;
        }
    }

    // =========================================================================
    // UI UPDATES
    // =========================================================================

    /**
     * Update statistics UI.
     */
    function updateStatsUI(stats) {
        if (!stats) return;

        if (statAddedEl) statAddedEl.textContent = stats.added;
        if (statDeletedEl) statDeletedEl.textContent = stats.deleted;
        if (statModifiedEl) statModifiedEl.textContent = stats.modified;
    }

    /**
     * Update navigation UI.
     */
    function updateNavigationUI() {
        const current = DocCompareState.getCurrentChangeIndex() + 1;
        const total = DocCompareState.getFilteredChangeCount();

        if (changeCurrentEl) changeCurrentEl.textContent = total > 0 ? current : 0;
        if (changeTotalEl) changeTotalEl.textContent = total;

        // Update button states
        const atFirst = current <= 1;
        const atLast = current >= total;

        if (prevBtn) prevBtn.disabled = atFirst;
        if (nextBtn) nextBtn.disabled = atLast;
        if (firstBtn) firstBtn.disabled = atFirst;
        if (lastBtn) lastBtn.disabled = atLast;
    }

    /**
     * Set loading state.
     */
    function setLoadingState(loading) {
        if (compareBtn) {
            compareBtn.disabled = loading;
            compareBtn.textContent = loading ? 'Loading...' : 'Compare';
        }

        if (loading) {
            modal.classList.add('dc-loading');
        } else {
            modal.classList.remove('dc-loading');
        }
    }

    /**
     * Update issues panel collapsed state.
     */
    function updateIssuesPanelState(collapsed) {
        if (issuesPanel) {
            issuesPanel.classList.toggle('collapsed', collapsed);
        }

        const toggleBtn = document.getElementById('dc-btn-toggle-issues');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', collapsed ? 'panel-right-open' : 'panel-right-close');
                // Re-render Lucide icons if available
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    /**
     * Scroll to a specific change row.
     */
    function scrollToChange(rowIndex) {
        if (rowIndex < 0) return;

        // Find rows in both panels
        const oldRow = oldPanel?.querySelector(`[data-row-index="${rowIndex}"]`);
        const newRow = newPanel?.querySelector(`[data-row-index="${rowIndex}"]`);

        if (oldRow) {
            oldRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (newRow) {
            newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Highlight the current change row.
     */
    function highlightCurrentChange(rowIndex) {
        // Remove existing highlights
        document.querySelectorAll('.dc-row-current').forEach(el => {
            el.classList.remove('dc-row-current');
        });

        // Add highlight to current row
        const oldRow = oldPanel?.querySelector(`[data-row-index="${rowIndex}"]`);
        const newRow = newPanel?.querySelector(`[data-row-index="${rowIndex}"]`);

        if (oldRow) oldRow.classList.add('dc-row-current');
        if (newRow) newRow.classList.add('dc-row-current');

        // Update minimap
        document.querySelectorAll('.dc-minimap-marker.dc-marker-active').forEach(el => {
            el.classList.remove('dc-marker-active');
        });

        const marker = minimapEl?.querySelector(`[data-row-index="${rowIndex}"]`);
        if (marker) {
            marker.classList.add('dc-marker-active');
        }
    }

    /**
     * Handle filter change.
     */
    function handleFilterChange() {
        const value = filterSelect.value;

        switch (value) {
            case 'all':
                DocCompareState.setFilters({
                    showAdded: true,
                    showDeleted: true,
                    showModified: true
                });
                break;
            case 'additions':
                DocCompareState.setFilters({
                    showAdded: true,
                    showDeleted: false,
                    showModified: false
                });
                break;
            case 'deletions':
                DocCompareState.setFilters({
                    showAdded: false,
                    showDeleted: true,
                    showModified: false
                });
                break;
            case 'modifications':
                DocCompareState.setFilters({
                    showAdded: false,
                    showDeleted: false,
                    showModified: true
                });
                break;
        }
    }

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Escape HTML entities.
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date string.
     */
    function formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }

    /**
     * Show toast notification.
     */
    function showToast(message, type = 'info') {
        // Use existing TWR toast if available
        if (typeof TWR !== 'undefined' && TWR.Modals && TWR.Modals.toast) {
            TWR.Modals.toast(message, type);
        } else if (typeof showToastNotification === 'function') {
            showToastNotification(message, type);
        } else {
            console.log(`[DocCompare] ${type}: ${message}`);
        }
    }

    // =========================================================================
    // AUTO-INITIALIZATION
    // =========================================================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // =========================================================================
    // PUBLIC INTERFACE
    // =========================================================================

    return {
        init,
        open,
        close
    };
})();

// Log module load
console.log('[DocCompare] Module loaded');
