/**
 * Hyperlink Validator UI Module
 * =============================
 * UI module for the standalone hyperlink validator feature.
 * Handles modal rendering, user interactions, and result display.
 *
 * @version 1.0.0
 */

window.HyperlinkValidator = (function() {
    'use strict';

    // ==========================================================================
    // STATE
    // ==========================================================================

    let initialized = false;
    let isOpen = false;

    // DOM element cache
    const el = {
        modal: null,
        closeBtn: null,
        urlInput: null,
        urlCount: null,
        modeSelect: null,
        scanDepthSelect: null,
        validateBtn: null,
        clearBtn: null,
        progressSection: null,
        progressFill: null,
        progressText: null,
        progressStats: null,
        progressEta: null,
        cancelBtn: null,
        resultsSection: null,
        summarySection: null,
        resultsBody: null,
        filterStatus: null,
        filterSearch: null,
        exportCsv: null,
        exportJson: null,
        exportHtml: null,
        exportHighlighted: null, // v3.0.110: Export with broken links highlighted
        historyList: null,
        settingsToggle: null,
        settingsContent: null,
        tabPaste: null,
        tabUpload: null,
        tabContentPaste: null,
        tabContentUpload: null,
        dropzone: null,
        fileInput: null,
        // Exclusions
        exclusionsList: null,
        exclusionPattern: null,
        exclusionMatchType: null,
        exclusionReason: null,
        exclusionTreatAsValid: null,
        addExclusionBtn: null,
        // Extended metrics
        extendedMetrics: null,
        sslWarningsCount: null,
        soft404Count: null,
        suspiciousCount: null,
        avgResponseTime: null,
        minResponseTime: null,
        maxResponseTime: null
    };

    // v3.0.110: Track the source file for highlighted export
    let sourceFile = null;
    let sourceFileType = null; // 'docx' or 'excel'

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    async function init() {
        if (initialized) return true;

        console.log('[TWR HyperlinkValidator] Initializing...');

        // Cache DOM elements
        cacheElements();

        if (!el.modal) {
            console.error('[TWR HyperlinkValidator] Modal element not found');
            return false;
        }

        // Initialize state module
        const stateReady = await HyperlinkValidatorState.init();
        if (!stateReady) {
            console.warn('[TWR HyperlinkValidator] State initialization failed, some features may be limited');
        }

        // Bind events
        bindEvents();

        // Subscribe to state changes
        HyperlinkValidatorState.onChange(handleStateChange);
        HyperlinkValidatorState.onProgress(handleProgress);
        HyperlinkValidatorState.onComplete(handleComplete);
        HyperlinkValidatorState.onError(handleError);

        initialized = true;
        console.log('[TWR HyperlinkValidator] Initialized');

        return true;
    }

    function cacheElements() {
        el.modal = document.getElementById('modal-hyperlink-validator');
        el.closeBtn = document.getElementById('hv-btn-close');
        el.urlInput = document.getElementById('hv-url-input');
        el.urlCount = document.querySelector('.hv-url-count');
        el.modeSelect = document.getElementById('hv-mode');
        el.validateBtn = document.getElementById('hv-btn-validate');
        el.clearBtn = document.getElementById('hv-btn-clear');
        el.progressSection = document.getElementById('hv-progress');
        el.progressFill = document.getElementById('hv-progress-fill');
        el.progressText = document.getElementById('hv-progress-text');
        el.progressStats = document.getElementById('hv-progress-stats');
        el.progressEta = document.getElementById('hv-progress-eta');
        el.cancelBtn = document.getElementById('hv-btn-cancel');
        el.resultsSection = document.getElementById('hv-results');
        el.summarySection = document.getElementById('hv-summary');
        el.resultsBody = document.getElementById('hv-results-body');
        el.filterStatus = document.getElementById('hv-filter-status');
        el.filterSearch = document.getElementById('hv-filter-search');
        el.exportCsv = document.getElementById('hv-btn-export-csv');
        el.exportJson = document.getElementById('hv-btn-export-json');
        el.exportHtml = document.getElementById('hv-btn-export-html');
        el.exportHighlighted = document.getElementById('hv-btn-export-highlighted'); // v3.0.110
        el.historyList = document.getElementById('hv-history-list');
        el.historyPanel = document.getElementById('hv-history-panel');
        el.historyToggle = document.getElementById('hv-btn-toggle-history');
        el.settingsToggle = document.getElementById('hv-settings-toggle');
        el.settingsContent = document.querySelector('.hv-settings-content');
        el.tabPaste = document.querySelector('[data-tab="paste"]');
        el.tabUpload = document.querySelector('[data-tab="upload"]');
        el.tabContentPaste = document.getElementById('hv-tab-paste');
        el.tabContentUpload = document.getElementById('hv-tab-upload');
        el.dropzone = document.getElementById('hv-dropzone');
        el.fileInput = document.getElementById('hv-file-input');

        // Scan depth
        el.scanDepthSelect = document.getElementById('hv-scan-depth');

        // Exclusions
        el.exclusionsList = document.getElementById('hv-exclusions-list');
        el.exclusionPattern = document.getElementById('hv-exclusion-pattern');
        el.exclusionMatchType = document.getElementById('hv-exclusion-type');
        el.exclusionReason = document.getElementById('hv-exclusion-reason');
        el.exclusionTreatAsValid = document.getElementById('hv-exclusion-valid');
        el.addExclusionBtn = document.getElementById('hv-btn-add-exclusion');
        el.exclusionForm = document.getElementById('hv-exclusion-form');

        // Extended metrics
        el.extendedMetrics = document.getElementById('hv-extended-metrics');
        el.sslWarningsCount = document.getElementById('hv-count-ssl-warnings');
        el.soft404Count = document.getElementById('hv-count-soft-404');
        el.suspiciousCount = document.getElementById('hv-count-suspicious');
        el.avgResponseTime = document.getElementById('hv-avg-response');
        el.minResponseTime = document.getElementById('hv-min-response');
        el.maxResponseTime = document.getElementById('hv-max-response');
    }

    function bindEvents() {
        // Close button
        el.closeBtn?.addEventListener('click', close);

        // URL input
        el.urlInput?.addEventListener('input', handleUrlInputChange);

        // Validate button
        el.validateBtn?.addEventListener('click', handleValidate);

        // Clear button
        el.clearBtn?.addEventListener('click', handleClear);

        // Cancel button
        el.cancelBtn?.addEventListener('click', handleCancel);

        // Filter events
        el.filterStatus?.addEventListener('change', handleFilterChange);
        el.filterSearch?.addEventListener('input', debounce(handleSearchChange, 300));

        // Export buttons
        el.exportCsv?.addEventListener('click', () => handleExport('csv'));
        el.exportJson?.addEventListener('click', () => handleExport('json'));
        el.exportHtml?.addEventListener('click', () => handleExport('html'));
        el.exportHighlighted?.addEventListener('click', handleExportHighlighted); // v3.0.110

        // Settings toggle
        el.settingsToggle?.addEventListener('click', toggleSettings);

        // Tab switching
        el.tabPaste?.addEventListener('click', () => switchTab('paste'));
        el.tabUpload?.addEventListener('click', () => switchTab('upload'));

        // File upload
        el.dropzone?.addEventListener('click', () => el.fileInput?.click());
        el.fileInput?.addEventListener('change', handleFileSelect);
        el.dropzone?.addEventListener('dragover', handleDragOver);
        el.dropzone?.addEventListener('drop', handleFileDrop);

        // Table header sorting
        document.querySelectorAll('.hv-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => handleSort(th.dataset.sort));
        });

        // Modal close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        });

        // Modal close on backdrop click
        el.modal?.addEventListener('click', (e) => {
            if (e.target === el.modal) {
                close();
            }
        });

        // Exclusions
        el.addExclusionBtn?.addEventListener('click', showExclusionForm);
        document.getElementById('hv-btn-save-exclusion')?.addEventListener('click', handleSaveExclusion);
        document.getElementById('hv-btn-cancel-exclusion')?.addEventListener('click', hideExclusionForm);
        el.exclusionsList?.addEventListener('click', handleExclusionAction);

        // v3.0.125: History panel toggle
        el.historyToggle?.addEventListener('click', toggleHistoryPanel);

        // v3.0.125: Show history button (when panel is closed)
        document.getElementById('hv-btn-show-history')?.addEventListener('click', showHistoryPanel);
    }

    // ==========================================================================
    // HISTORY PANEL TOGGLE (v3.0.125)
    // ==========================================================================

    function toggleHistoryPanel() {
        if (!el.historyPanel) return;

        const isOpen = el.historyPanel.classList.contains('open');

        if (isOpen) {
            el.historyPanel.classList.remove('open');
            // Update icon
            const icon = el.historyToggle?.querySelector('i, svg');
            if (icon) {
                icon.setAttribute('data-lucide', 'panel-right-open');
                lucide?.createIcons({ nodes: [icon] });
            }
        } else {
            showHistoryPanel();
        }
    }

    function showHistoryPanel() {
        if (!el.historyPanel) return;

        el.historyPanel.classList.add('open');
        // Update icon
        const icon = el.historyToggle?.querySelector('i, svg');
        if (icon) {
            icon.setAttribute('data-lucide', 'panel-right-close');
            lucide?.createIcons({ nodes: [icon] });
        }
    }

    // ==========================================================================
    // MODAL MANAGEMENT
    // ==========================================================================

    function open() {
        if (!initialized) {
            init().then(() => open());
            return;
        }

        console.log('[TWR HyperlinkValidator] Opening modal');

        el.modal?.classList.add('active');
        document.body.classList.add('modal-open');
        isOpen = true;

        // Focus URL input
        setTimeout(() => el.urlInput?.focus(), 100);

        // Refresh history
        HyperlinkValidatorState.loadHistory();

        // Update capabilities display
        updateCapabilitiesDisplay();
    }

    function close() {
        console.log('[TWR HyperlinkValidator] Closing modal');

        el.modal?.classList.remove('active');
        document.body.classList.remove('modal-open');
        isOpen = false;
    }

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    function handleUrlInputChange() {
        const urls = parseUrls(el.urlInput.value);
        if (el.urlCount) {
            el.urlCount.textContent = `${urls.length} URL${urls.length !== 1 ? 's' : ''} detected`;
        }
    }

    async function handleValidate() {
        const urls = parseUrls(el.urlInput.value);

        if (urls.length === 0) {
            showToast('error', 'Please enter at least one URL');
            return;
        }

        const mode = el.modeSelect?.value || 'validator';
        const options = getValidationOptions();

        // Show progress section
        showProgress();

        try {
            await HyperlinkValidatorState.startValidation(urls, mode, options);
        } catch (e) {
            showToast('error', `Validation failed: ${e.message}`);
            hideProgress();
        }
    }

    function handleClear() {
        if (el.urlInput) {
            el.urlInput.value = '';
            handleUrlInputChange();
        }
        HyperlinkValidatorState.reset();
        hideProgress();
        hideResults();
    }

    async function handleCancel() {
        await HyperlinkValidatorState.cancelValidation();
        hideProgress();
        showToast('info', 'Validation cancelled');
    }

    function handleFilterChange() {
        const value = el.filterStatus?.value || 'all';
        HyperlinkValidatorState.setFilter('status', value);
        renderResults(HyperlinkValidatorState.getFilteredResults());
    }

    function handleSearchChange() {
        const value = el.filterSearch?.value || '';
        HyperlinkValidatorState.setFilter('search', value);
        renderResults(HyperlinkValidatorState.getFilteredResults());
    }

    function handleSort(column) {
        const current = HyperlinkValidatorState.getFilters();
        // Toggle direction if same column
        const newDir = current.sort?.column === column && current.sort?.direction === 'asc' ? 'desc' : 'asc';
        HyperlinkValidatorState.setSortColumn(column, newDir);
        renderResults(HyperlinkValidatorState.getFilteredResults());
    }

    function handleExport(format) {
        // First try server-side export (for job-based results)
        const url = HyperlinkValidatorState.getExportUrl(format);
        if (url) {
            window.location.href = url;
            return;
        }

        // Fall back to client-side export (for Excel/DOCX results)
        const exportData = HyperlinkValidatorState.exportLocalResults(format);
        if (exportData) {
            const { blob, filename } = exportData;
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            showToast('success', `Exported to ${filename}`);
        } else {
            showToast('error', 'No results to export');
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file) {
            loadUrlsFromFile(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        el.dropzone?.classList.add('dragover');
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        el.dropzone?.classList.remove('dragover');

        const file = e.dataTransfer?.files?.[0];
        if (file) {
            loadUrlsFromFile(file);
        }
    }

    async function loadUrlsFromFile(file) {
        const filename = file.name.toLowerCase();

        // Check if it's a DOCX file - handle differently
        if (filename.endsWith('.docx')) {
            await handleDocxFile(file);
            return;
        }

        // Check if it's an Excel file - handle differently
        if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
            await handleExcelFile(file);
            return;
        }

        const text = await file.text();
        const urls = parseUrls(text);

        if (el.urlInput) {
            el.urlInput.value = urls.join('\n');
            handleUrlInputChange();
        }

        // Switch to paste tab to show the URLs
        switchTab('paste');

        showToast('success', `Loaded ${urls.length} URLs from file`);
    }

    async function handleDocxFile(file) {
        showToast('info', 'Extracting links from DOCX file...');
        showProgress();

        // v3.0.110: Store the source file for highlighted export
        sourceFile = file;
        sourceFileType = 'docx';

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('validate_web_urls', 'true');
            formData.append('check_bookmarks', 'true');
            formData.append('check_cross_refs', 'true');

            // Get CSRF token
            const csrfToken = window.State?.csrfToken ||
                document.querySelector('meta[name="csrf-token"]')?.content;

            const response = await fetch('/api/hyperlink-validator/validate-docx', {
                method: 'POST',
                body: formData,
                headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to process DOCX file');
            }

            // Display results
            hideProgress();
            showResults();

            // Render DOCX-specific summary
            renderDocxSummary(data);

            // Convert validation results to standard format for rendering
            const results = data.validation_results.map(vr => ({
                url: vr.link?.url || vr.validation.link,
                status: vr.validation.is_valid ? 'WORKING' : 'INVALID',
                message: vr.validation.message,
                link_type: vr.validation.link_type || vr.link?.link_type,
                display_text: vr.link?.display_text,
                location: vr.link?.location || '',
                warnings: vr.validation.warnings || []
            }));

            // Store results in state for export functionality
            HyperlinkValidatorState.setLocalResults(results, data.summary);

            renderDocxResults(results);

            // v3.0.110: Enable highlighted export if there are broken links
            updateHighlightedExportButton(results);

            showToast('success', `Validated ${data.links.length} links from ${file.name}`);

        } catch (e) {
            hideProgress();
            showToast('error', `DOCX processing failed: ${e.message}`);
        }
    }

    async function handleExcelFile(file) {
        showToast('info', 'Extracting links from Excel file...');
        showProgress();

        // v3.0.110: Store the source file for highlighted export
        sourceFile = file;
        sourceFileType = 'excel';

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('validate_web_urls', 'true');
            formData.append('extract_from_values', 'true');
            formData.append('extract_from_formulas', 'true');

            // Get CSRF token
            const csrfToken = window.State?.csrfToken ||
                document.querySelector('meta[name="csrf-token"]')?.content;

            const response = await fetch('/api/hyperlink-validator/validate-excel', {
                method: 'POST',
                body: formData,
                headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to process Excel file');
            }

            // Display results
            hideProgress();
            showResults();

            // Render Excel-specific summary
            renderExcelSummary(data);

            // Convert links to standard format for rendering
            const results = data.links.map(link => ({
                url: link.url,
                status: link.validation?.status || (link.url.startsWith('mailto:') ? 'MAILTO' : 'EXTRACTED'),
                message: link.validation?.message || `Found in ${link.sheet_name} (${link.cell_address})`,
                status_code: link.validation?.status_code,
                response_time_ms: link.validation?.response_time_ms,
                link_source: link.source,
                sheet_name: link.sheet_name,
                cell_address: link.cell_address,
                display_text: link.display_text,
                context: link.context
            }));

            // Store results in state for export functionality
            HyperlinkValidatorState.setLocalResults(results, data.validation_summary);

            renderExcelResults(results);

            // v3.0.110: Enable highlighted export if there are broken links
            updateHighlightedExportButton(results);

            showToast('success', `Extracted ${data.total_links} links from ${file.name}`);

        } catch (e) {
            hideProgress();
            showToast('error', `Excel processing failed: ${e.message}`);
        }
    }

    // =========================================================================
    // v3.0.110: HIGHLIGHTED EXPORT FUNCTIONS
    // =========================================================================

    /**
     * Check if there are broken links and enable/disable the highlighted export button.
     */
    function updateHighlightedExportButton(results) {
        if (!el.exportHighlighted) return;

        const brokenStatuses = ['BROKEN', 'INVALID', 'TIMEOUT', 'DNSFAILED', 'SSLERROR', 'BLOCKED'];
        const hasBrokenLinks = results.some(r =>
            brokenStatuses.includes(r.status?.toUpperCase())
        );

        const hasSourceFile = sourceFile !== null;

        if (hasSourceFile && hasBrokenLinks) {
            el.exportHighlighted.disabled = false;
            el.exportHighlighted.title = `Export ${sourceFileType === 'docx' ? 'DOCX' : 'Excel'} with broken links highlighted`;
        } else if (hasSourceFile && !hasBrokenLinks) {
            el.exportHighlighted.disabled = true;
            el.exportHighlighted.title = 'No broken links to highlight';
        } else {
            el.exportHighlighted.disabled = true;
            el.exportHighlighted.title = 'Upload a DOCX or Excel file first';
        }
    }

    /**
     * Handle the Export Highlighted button click.
     * Sends the source file and validation results to the server for highlighting.
     */
    async function handleExportHighlighted() {
        if (!sourceFile || !sourceFileType) {
            showToast('error', 'No source file available. Upload a DOCX or Excel file first.');
            return;
        }

        const results = HyperlinkValidatorState.getResults();
        if (!results || results.length === 0) {
            showToast('error', 'No validation results available.');
            return;
        }

        showToast('info', `Creating highlighted ${sourceFileType.toUpperCase()} file...`);

        try {
            const formData = new FormData();
            formData.append('file', sourceFile);
            formData.append('results', JSON.stringify(results));

            // Get CSRF token
            const csrfToken = window.State?.csrfToken ||
                document.querySelector('meta[name="csrf-token"]')?.content;

            const endpoint = sourceFileType === 'docx'
                ? '/api/hyperlink-validator/export-highlighted/docx'
                : '/api/hyperlink-validator/export-highlighted/excel';

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Server error: ${response.status}`);
            }

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `highlighted_${sourceFile.name}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }

            // Download the file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Get highlight count from header if available
            const highlightCount = response.headers.get('X-Highlight-Count') || '';
            showToast('success', highlightCount || `Exported highlighted ${sourceFileType.toUpperCase()} file`);

        } catch (e) {
            showToast('error', `Highlighted export failed: ${e.message}`);
        }
    }

    function renderExcelSummary(data) {
        // Count by validation status
        let valid = 0, invalid = 0, mailto = 0;
        data.links.forEach(link => {
            if (link.url.startsWith('mailto:')) {
                mailto++;
            } else if (link.validation) {
                if (link.validation.status === 'WORKING') {
                    valid++;
                } else {
                    invalid++;
                }
            }
        });

        // Update summary counts
        const workingEl = document.getElementById('hv-count-working');
        const brokenEl = document.getElementById('hv-count-broken');
        if (workingEl) workingEl.textContent = valid;
        if (brokenEl) brokenEl.textContent = invalid;

        // Use redirect count for mailto display
        const redirectEl = document.getElementById('hv-count-redirect');
        if (redirectEl) {
            redirectEl.textContent = mailto;
            // Update label if we can
            const label = redirectEl.closest('.hv-stat')?.querySelector('.hv-stat-label');
            if (label) label.textContent = 'Email';
        }

        // Show sheet breakdown
        if (data.sheet_summaries && data.sheet_summaries.length > 0) {
            const summaryHtml = data.sheet_summaries.map(s =>
                `<span class="hv-sheet-stat">${escapeHtml(s.name)}: ${s.total_links}</span>`
            ).join('');

            // Add sheet breakdown to summary if element exists
            const sheetBreakdown = document.getElementById('hv-sheet-breakdown');
            if (sheetBreakdown) {
                sheetBreakdown.innerHTML = summaryHtml;
            }
        }

        // Hide other counts that don't apply
        ['hv-count-timeout', 'hv-count-blocked', 'hv-count-unknown'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });
    }

    function renderExcelResults(results) {
        if (!el.resultsBody) return;

        el.resultsBody.innerHTML = '';

        results.forEach((result, index) => {
            const row = document.createElement('tr');
            const statusClass = getExcelStatusClass(result.status);
            const sourceLabel = formatLinkSource(result.link_source);
            const isExcluded = isUrlExcluded(result.url);

            if (isExcluded) {
                row.classList.add('hv-row-excluded');
            }

            row.innerHTML = `
                <td>
                    <span class="hv-status-badge hv-status-${statusClass}">${isExcluded ? 'EXCLUDED' : result.status}</span>
                    <span class="hv-link-source-badge">${sourceLabel}</span>
                </td>
                <td class="hv-url-cell">
                    ${result.display_text && result.display_text !== result.url ?
                        `<span class="hv-display-text">${escapeHtml(result.display_text)}</span><br>` : ''}
                    <a href="${escapeHtml(result.url)}" target="_blank" rel="noopener">${escapeHtml(result.url)}</a>
                    <div class="hv-cell-location">
                        <span class="hv-sheet-name">${escapeHtml(result.sheet_name || '')}</span>
                        <span class="hv-cell-address">${escapeHtml(result.cell_address || '')}</span>
                        ${result.context ? `<span class="hv-cell-context">${escapeHtml(result.context)}</span>` : ''}
                    </div>
                </td>
                <td>${result.status_code || '-'}</td>
                <td>${escapeHtml(result.message || '')}</td>
                <td>${result.response_time_ms ? Math.round(result.response_time_ms) + 'ms' : '-'}</td>
                <td class="hv-col-actions">
                    ${isExcluded ?
                        `<button class="hv-btn-include" data-url="${escapeHtml(result.url)}" title="Remove from exclusions">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>` :
                        `<button class="hv-btn-exclude" data-url="${escapeHtml(result.url)}" title="Exclude this URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </button>`
                    }
                </td>
            `;
            el.resultsBody.appendChild(row);
        });

        if (results.length === 0) {
            el.resultsBody.innerHTML = `
                <tr><td colspan="6" class="hv-no-results">No links found in Excel file</td></tr>
            `;
        }

        // Bind action buttons
        bindResultActionButtons();
    }

    function getExcelStatusClass(status) {
        const statusMap = {
            'WORKING': 'working',
            'BROKEN': 'broken',
            'MAILTO': 'mailto',
            'EXTRACTED': 'unknown',
            'TIMEOUT': 'timeout',
            'REDIRECT': 'redirect'
        };
        return statusMap[status] || 'unknown';
    }

    function formatLinkSource(source) {
        const labels = {
            'hyperlink': 'Link',
            'formula': 'Formula',
            'cell_value': 'Cell Text',
            'comment': 'Comment'
        };
        return labels[source] || source || '';
    }

    function renderDocxSummary(data) {
        // Count by type
        const byType = {};
        data.links.forEach(link => {
            const type = link.link_type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
        });

        // Count valid/invalid
        const valid = data.validation_results.filter(r => r.validation.is_valid).length;
        const invalid = data.validation_results.length - valid;

        // Update summary counts (reuse existing elements)
        const workingEl = document.getElementById('hv-count-working');
        const brokenEl = document.getElementById('hv-count-broken');
        if (workingEl) workingEl.textContent = valid;
        if (brokenEl) brokenEl.textContent = invalid;

        // Hide other counts that don't apply
        ['hv-count-redirect', 'hv-count-timeout', 'hv-count-blocked', 'hv-count-unknown'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });
    }

    function renderDocxResults(results) {
        if (!el.resultsBody) return;

        el.resultsBody.innerHTML = '';

        results.forEach((result, index) => {
            const row = document.createElement('tr');
            const isExcluded = isUrlExcluded(result.url);
            const statusClass = isExcluded ? 'excluded' : (result.status === 'WORKING' ? 'working' : 'broken');
            const linkTypeLabel = formatLinkType(result.link_type);

            if (isExcluded) {
                row.classList.add('hv-row-excluded');
            }

            row.innerHTML = `
                <td>
                    <span class="hv-status-badge hv-status-${statusClass}">${isExcluded ? 'EXCLUDED' : result.status}</span>
                    <span class="hv-link-type-badge">${linkTypeLabel}</span>
                </td>
                <td class="hv-url-cell">
                    ${result.display_text ? `<span class="hv-display-text">${escapeHtml(result.display_text)}</span><br>` : ''}
                    <a href="${escapeHtml(result.url)}" target="_blank" rel="noopener">${escapeHtml(result.url)}</a>
                    ${result.warnings?.length ? `<div class="hv-warnings">${result.warnings.map(w => `<span class="hv-warning">\u26A0 ${escapeHtml(w)}</span>`).join('')}</div>` : ''}
                </td>
                <td>-</td>
                <td>${escapeHtml(result.message || '')}</td>
                <td>-</td>
                <td class="hv-col-actions">
                    ${isExcluded ?
                        `<button class="hv-btn-include" data-url="${escapeHtml(result.url)}" title="Remove from exclusions">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>` :
                        `<button class="hv-btn-exclude" data-url="${escapeHtml(result.url)}" title="Exclude this URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </button>`
                    }
                </td>
            `;
            el.resultsBody.appendChild(row);
        });

        // Bind action buttons
        bindResultActionButtons();

        if (results.length === 0) {
            el.resultsBody.innerHTML = `
                <tr><td colspan="5" class="hv-no-results">No links found in document</td></tr>
            `;
        }
    }

    function formatLinkType(type) {
        const labels = {
            'web_url': 'Web',
            'mailto': 'Email',
            'file_path': 'File',
            'network_path': 'UNC',
            'bookmark': 'Bookmark',
            'cross_ref': 'Reference',
            'ftp': 'FTP',
            'unknown': '?'
        };
        return labels[type] || type;
    }

    function showExclusionForm() {
        if (el.exclusionForm) {
            el.exclusionForm.style.display = 'flex';
        }
        if (el.exclusionPattern) {
            el.exclusionPattern.focus();
        }
    }

    function hideExclusionForm() {
        if (el.exclusionForm) {
            el.exclusionForm.style.display = 'none';
        }
        // Clear form
        if (el.exclusionPattern) el.exclusionPattern.value = '';
        if (el.exclusionReason) el.exclusionReason.value = '';
        if (el.exclusionMatchType) el.exclusionMatchType.value = 'contains';
        if (el.exclusionTreatAsValid) el.exclusionTreatAsValid.checked = true;
    }

    function handleSaveExclusion() {
        const pattern = el.exclusionPattern?.value?.trim();
        if (!pattern) {
            showToast('error', 'Please enter a pattern');
            return;
        }

        const exclusion = {
            pattern: pattern,
            match_type: el.exclusionMatchType?.value || 'contains',
            reason: el.exclusionReason?.value || '',
            treat_as_valid: el.exclusionTreatAsValid?.checked ?? true
        };

        HyperlinkValidatorState.addExclusion(exclusion);

        // Hide and clear form
        hideExclusionForm();

        // Update exclusion count
        updateExclusionCount();

        renderExclusions(HyperlinkValidatorState.getExclusions());
        showToast('success', 'Exclusion added');
    }

    function updateExclusionCount() {
        const countEl = document.querySelector('.hv-exclusion-count');
        if (countEl) {
            const count = HyperlinkValidatorState.getExclusions().length;
            countEl.textContent = `(${count})`;
        }
    }

    function handleExclusionAction(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const index = parseInt(target.dataset.index, 10);

        if (action === 'delete') {
            HyperlinkValidatorState.removeExclusion(index);
            renderExclusions(HyperlinkValidatorState.getExclusions());
            showToast('info', 'Exclusion removed');
        }
    }

    // ==========================================================================
    // STATE CHANGE HANDLERS
    // ==========================================================================

    function handleStateChange(state) {
        // Update history
        renderHistory(state.history);
    }

    function handleProgress(progress) {
        updateProgress(progress);
    }

    function handleComplete(data) {
        hideProgress();
        showResults();
        renderSummary(data.summary);
        renderResults(HyperlinkValidatorState.getFilteredResults());
        showToast('success', `Validation complete: ${data.results.length} URLs checked`);
    }

    function handleError(error) {
        hideProgress();
        showToast('error', error.message || 'An error occurred');
    }

    // ==========================================================================
    // UI UPDATES
    // ==========================================================================

    function showProgress() {
        if (el.progressSection) {
            el.progressSection.style.display = 'flex';
        }
        if (el.validateBtn) {
            el.validateBtn.disabled = true;
        }
    }

    function hideProgress() {
        if (el.progressSection) {
            el.progressSection.style.display = 'none';
        }
        if (el.validateBtn) {
            el.validateBtn.disabled = false;
        }
    }

    function updateProgress(progress) {
        if (el.progressFill) {
            el.progressFill.style.width = `${progress.overallProgress}%`;
        }
        if (el.progressText) {
            el.progressText.textContent = progress.phase || 'Validating...';
        }
        if (el.progressStats) {
            el.progressStats.textContent = `${progress.urlsCompleted} / ${progress.urlsTotal} URLs`;
        }
        if (el.progressEta && progress.eta) {
            el.progressEta.textContent = progress.eta;
        }
    }

    function showResults() {
        if (el.resultsSection) {
            el.resultsSection.style.display = 'block';
        }
    }

    function hideResults() {
        if (el.resultsSection) {
            el.resultsSection.style.display = 'none';
        }
    }

    function renderSummary(summary) {
        if (!summary) return;

        // Update summary counts
        const counts = {
            'hv-count-working': summary.working,
            'hv-count-broken': summary.broken,
            'hv-count-redirect': summary.redirect,
            'hv-count-timeout': summary.timeout,
            'hv-count-blocked': summary.blocked,
            'hv-count-unknown': (summary.unknown || 0) + (summary.dns_failed || 0) + (summary.ssl_error || 0) + (summary.invalid || 0)
        };

        Object.entries(counts).forEach(([id, count]) => {
            const elem = document.getElementById(id);
            if (elem) {
                // Animate the count
                animateCount(elem, count || 0);
            }
        });

        // Update extended metrics (for thorough mode)
        const scanDepth = el.scanDepthSelect?.value || 'standard';
        if (scanDepth === 'thorough' && el.extendedMetrics) {
            el.extendedMetrics.style.display = 'block';

            if (el.sslWarningsCount) el.sslWarningsCount.textContent = summary.ssl_warnings || 0;
            if (el.soft404Count) el.soft404Count.textContent = summary.soft_404_count || 0;
            if (el.suspiciousCount) el.suspiciousCount.textContent = summary.suspicious_count || 0;
            if (el.avgResponseTime) el.avgResponseTime.textContent = `${Math.round(summary.average_response_ms || 0)}ms`;
            if (el.minResponseTime) el.minResponseTime.textContent = `${Math.round(summary.min_response_ms || 0)}ms`;
            if (el.maxResponseTime) el.maxResponseTime.textContent = `${Math.round(summary.max_response_ms || 0)}ms`;
        } else if (el.extendedMetrics) {
            el.extendedMetrics.style.display = 'none';
        }

        // Render enhanced visualizations if available
        renderVisualizations(summary);
    }

    /**
     * Animate a number counting up.
     */
    function animateCount(element, target) {
        const duration = 600;
        const start = parseInt(element.textContent) || 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * easeOut);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Render enhanced visualizations (donut chart, histogram, heatmap).
     */
    function renderVisualizations(summary) {
        // Check if visualization module is loaded
        if (typeof HyperlinkVisualization === 'undefined') return;

        const results = HyperlinkValidatorState.getResults() || [];
        const total = Object.values(summary).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);

        // Only show visualizations if we have enough data
        if (total < 5) return;

        // Show chart section
        const chartSection = document.getElementById('hv-chart-section');
        if (chartSection) {
            chartSection.style.display = 'grid';

            // Donut chart
            const donutContainer = document.getElementById('hv-donut-chart');
            if (donutContainer) {
                HyperlinkVisualization.createDonutChart(donutContainer, {
                    working: summary.working || 0,
                    broken: summary.broken || 0,
                    redirect: summary.redirect || 0,
                    timeout: summary.timeout || 0,
                    blocked: summary.blocked || 0,
                    unknown: (summary.unknown || 0) + (summary.dns_failed || 0) + (summary.ssl_error || 0)
                });
            }

            // Response time histogram
            const histogramContainer = document.getElementById('hv-response-histogram');
            if (histogramContainer && results.length > 0) {
                HyperlinkVisualization.createResponseHistogram(histogramContainer, results);
            }
        }

        // Domain health visualization (only if >= 3 domains)
        const domains = new Set();
        results.forEach(r => {
            try { domains.add(new URL(r.url).hostname); } catch {}
        });

        if (domains.size >= 3) {
            // v3.0.125: Show 3D carousel for domain health (more impressive!)
            const carouselSection = document.getElementById('hv-domain-carousel-section');
            const carouselContainer = document.getElementById('hv-domain-carousel');
            if (carouselSection && carouselContainer) {
                carouselSection.style.display = 'block';
                HyperlinkVisualization.createDomainHealthCarousel(carouselContainer, results);
            }

            // Also show heatmap as an alternate compact view (for large datasets)
            if (domains.size > 10) {
                const heatmapSection = document.getElementById('hv-domain-heatmap-section');
                const heatmapContainer = document.getElementById('hv-domain-heatmap');
                if (heatmapSection && heatmapContainer) {
                    heatmapSection.style.display = 'block';
                    HyperlinkVisualization.createDomainHeatmap(heatmapContainer, results);
                }
            }
        }

        // Show rescan button if there are blocked URLs
        const blockedCount = (summary.blocked || 0) + (summary.dns_failed || 0);
        const rescanSection = document.getElementById('hv-rescan-section');
        if (rescanSection && blockedCount > 0) {
            rescanSection.style.display = 'block';
            const blockedCountEl = document.getElementById('hv-blocked-count');
            if (blockedCountEl) blockedCountEl.textContent = blockedCount;

            // Bind rescan button if not already bound
            const rescanBtn = document.getElementById('hv-btn-rescan');
            if (rescanBtn && !rescanBtn.dataset.bound) {
                rescanBtn.dataset.bound = 'true';
                rescanBtn.addEventListener('click', handleRescan);
            }
        } else if (rescanSection) {
            rescanSection.style.display = 'none';
        }
    }

    /**
     * Handle rescan button click for bot-protected sites.
     */
    async function handleRescan() {
        const rescanBtn = document.getElementById('hv-btn-rescan');
        if (!rescanBtn) return;

        // Get failed URLs
        const results = HyperlinkValidatorState.getResults() || [];
        const failedUrls = results
            .filter(r => ['BLOCKED', 'TIMEOUT', 'DNSFAILED'].includes((r.status || '').toUpperCase()))
            .map(r => r.url);

        if (failedUrls.length === 0) {
            showToast('info', 'No URLs to rescan');
            return;
        }

        // Show loading state
        rescanBtn.disabled = true;
        rescanBtn.classList.add('loading');
        const originalText = rescanBtn.innerHTML;
        rescanBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Rescanning...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const csrfToken = window.State?.csrfToken ||
                document.querySelector('meta[name="csrf-token"]')?.content;

            const response = await fetch('/api/hyperlink-validator/rescan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
                },
                body: JSON.stringify({ urls: failedUrls.slice(0, 50) }) // Limit to 50
            });

            const data = await response.json();

            if (data.success) {
                const recovered = data.results?.filter(r => r.status === 'WORKING').length || 0;
                showToast('success', `Rescan complete: ${recovered} URLs recovered`);

                // Update results with recovered URLs
                if (data.results && data.results.length > 0) {
                    // TODO: Merge results back into state
                }
            } else {
                throw new Error(data.error?.message || 'Rescan failed');
            }
        } catch (e) {
            showToast('error', `Rescan failed: ${e.message}`);
        } finally {
            rescanBtn.disabled = false;
            rescanBtn.classList.remove('loading');
            rescanBtn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    function renderExclusions(exclusions) {
        if (!el.exclusionsList) return;

        el.exclusionsList.innerHTML = '';

        if (!exclusions || exclusions.length === 0) {
            el.exclusionsList.innerHTML = '<div class="hv-exclusion-empty">No exclusions defined</div>';
            return;
        }

        exclusions.forEach((exc, index) => {
            const item = document.createElement('div');
            item.className = 'hv-exclusion-item';
            item.innerHTML = `
                <div class="hv-exclusion-info">
                    <span class="hv-exclusion-pattern">${escapeHtml(exc.pattern)}</span>
                    <span class="hv-exclusion-type">${exc.match_type}</span>
                    ${exc.treat_as_valid ? '<span class="hv-exclusion-valid">Show as OK</span>' : '<span class="hv-exclusion-skip">Skip</span>'}
                    ${exc.reason ? `<span class="hv-exclusion-reason">${escapeHtml(exc.reason)}</span>` : ''}
                </div>
                <button class="hv-exclusion-delete" data-action="delete" data-index="${index}" title="Remove">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;
            el.exclusionsList.appendChild(item);
        });
    }

    function renderResults(results) {
        if (!el.resultsBody) return;

        el.resultsBody.innerHTML = '';

        results.forEach((result, index) => {
            const row = document.createElement('tr');
            const isExcluded = isUrlExcluded(result.url);
            const statusClass = isExcluded ? 'excluded' : result.status.toLowerCase();

            if (isExcluded) {
                row.classList.add('hv-row-excluded');
            }

            row.innerHTML = `
                <td><span class="hv-status-badge hv-status-${statusClass}">${isExcluded ? 'EXCLUDED' : result.status}</span></td>
                <td class="hv-url-cell">
                    <a href="${escapeHtml(result.url)}" target="_blank" rel="noopener">${escapeHtml(result.url)}</a>
                </td>
                <td>${result.status_code || '-'}</td>
                <td>${escapeHtml(result.message || '')}</td>
                <td>${result.response_time_ms ? Math.round(result.response_time_ms) + 'ms' : '-'}</td>
                <td class="hv-col-actions">
                    ${isExcluded ?
                        `<button class="hv-btn-include" data-url="${escapeHtml(result.url)}" title="Remove from exclusions">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>` :
                        `<button class="hv-btn-exclude" data-url="${escapeHtml(result.url)}" title="Exclude this URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </button>`
                    }
                </td>
            `;
            el.resultsBody.appendChild(row);
        });

        // Show message if no results
        if (results.length === 0) {
            el.resultsBody.innerHTML = `
                <tr><td colspan="6" class="hv-no-results">No results match the current filters</td></tr>
            `;
        }

        // Bind action buttons
        bindResultActionButtons();
    }

    function renderHistory(history) {
        if (!el.historyList) return;

        el.historyList.innerHTML = '';

        if (!history || history.length === 0) {
            el.historyList.innerHTML = '<div class="hv-history-empty">No validation history</div>';
            return;
        }

        history.forEach(run => {
            const item = document.createElement('div');
            item.className = 'hv-history-item';
            item.innerHTML = `
                <div class="hv-history-info">
                    <span class="hv-history-date">${formatDate(run.created_at)}</span>
                    <span class="hv-history-count">${run.url_count || 0} URLs</span>
                </div>
                <div class="hv-history-summary">
                    ${run.summary ? `
                        <span class="hv-mini-stat working">${run.summary.working}</span>
                        <span class="hv-mini-stat broken">${run.summary.broken}</span>
                    ` : ''}
                </div>
            `;
            item.addEventListener('click', () => loadHistoricalRun(run.job_id));
            el.historyList.appendChild(item);
        });
    }

    async function loadHistoricalRun(jobId) {
        const success = await HyperlinkValidatorState.loadHistoricalRun(jobId);
        if (success) {
            showResults();
            renderSummary(HyperlinkValidatorState.getSummary());
            renderResults(HyperlinkValidatorState.getFilteredResults());
        }
    }

    function updateCapabilitiesDisplay() {
        const caps = HyperlinkValidatorState.getCapabilities();
        if (!caps) return;

        // Disable unavailable modes in select
        if (el.modeSelect) {
            Array.from(el.modeSelect.options).forEach(opt => {
                const mode = caps.modes[opt.value];
                if (mode && !mode.available) {
                    opt.disabled = true;
                    opt.textContent += ' (unavailable)';
                }
            });
        }
    }

    function toggleSettings() {
        const settings = document.getElementById('hv-settings');
        settings?.classList.toggle('collapsed');
    }

    function switchTab(tab) {
        // Update tab buttons
        el.tabPaste?.classList.toggle('active', tab === 'paste');
        el.tabUpload?.classList.toggle('active', tab === 'upload');

        // Update tab content
        if (el.tabContentPaste) {
            el.tabContentPaste.style.display = tab === 'paste' ? 'block' : 'none';
        }
        if (el.tabContentUpload) {
            el.tabContentUpload.style.display = tab === 'upload' ? 'block' : 'none';
        }
    }

    // ==========================================================================
    // UTILITIES
    // ==========================================================================

    function parseUrls(text) {
        if (!text) return [];

        const lines = text.replace(/,/g, '\n').replace(/;/g, '\n').split('\n');
        const urls = [];

        lines.forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;

            // Add https:// if missing scheme
            if (line.match(/^[a-zA-Z0-9]/) && line.includes('.') && !line.includes('://')) {
                line = 'https://' + line;
            }

            if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('ftp://')) {
                urls.push(line);
            }
        });

        // Remove duplicates
        return [...new Set(urls)];
    }

    function getValidationOptions() {
        return {
            timeout: parseInt(document.getElementById('hv-timeout')?.value) || 10,
            retries: parseInt(document.getElementById('hv-retries')?.value) || 3,
            use_windows_auth: document.getElementById('hv-windows-auth')?.checked ?? true,
            follow_redirects: document.getElementById('hv-follow-redirects')?.checked ?? true,
            scan_depth: el.scanDepthSelect?.value || 'standard',
            exclusions: HyperlinkValidatorState.getExclusions()
        };
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function debounce(fn, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function showToast(type, message) {
        // Use TWR.Modals if available
        if (typeof TWR !== 'undefined' && TWR.Modals?.toast) {
            TWR.Modals.toast(type, message);
        } else {
            console.log(`[TWR HyperlinkValidator] ${type}: ${message}`);
        }
    }

    // ==========================================================================
    // EXCLUSION HELPERS
    // ==========================================================================

    /**
     * Check if a URL matches any exclusion rule.
     */
    function isUrlExcluded(url) {
        const exclusions = HyperlinkValidatorState.getExclusions();
        if (!exclusions || exclusions.length === 0) return false;

        for (const exc of exclusions) {
            if (matchesExclusion(url, exc)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a URL matches a specific exclusion rule.
     */
    function matchesExclusion(url, exclusion) {
        const pattern = exclusion.pattern;
        const matchType = exclusion.match_type || 'contains';

        switch (matchType) {
            case 'exact':
                return url === pattern;
            case 'prefix':
                return url.startsWith(pattern);
            case 'suffix':
                return url.endsWith(pattern);
            case 'contains':
                return url.includes(pattern);
            case 'regex':
                try {
                    const regex = new RegExp(pattern, 'i');
                    return regex.test(url);
                } catch {
                    return false;
                }
            default:
                return url.includes(pattern);
        }
    }

    /**
     * Bind click handlers for exclude/include buttons in results table.
     */
    function bindResultActionButtons() {
        // Exclude buttons - show menu on click
        el.resultsBody?.querySelectorAll('.hv-btn-exclude').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                if (url) {
                    showExcludeMenu(btn, url);
                }
            });
        });

        // Include buttons (remove exclusion)
        el.resultsBody?.querySelectorAll('.hv-btn-include').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                if (url) {
                    removeExclusionByUrl(url);
                }
            });
        });
    }

    /**
     * Show exclude menu with options for URL vs domain exclusion.
     */
    function showExcludeMenu(btn, url) {
        // Remove any existing menu
        document.querySelectorAll('.hv-exclude-menu').forEach(m => m.remove());

        // Extract domain info
        let hostname = null;
        let baseDomain = null;
        try {
            const parsed = new URL(url);
            hostname = parsed.hostname;
            // Get base domain (e.g., example.com from sub.example.com)
            const parts = hostname.split('.');
            if (parts.length >= 2) {
                baseDomain = parts.slice(-2).join('.');
            }
        } catch {
            // Non-URL, just offer exact match
        }

        // Count how many results would be affected by domain exclusion
        const results = HyperlinkValidatorState.getResults() || [];
        let domainCount = 0;
        if (hostname) {
            domainCount = results.filter(r => {
                try {
                    return new URL(r.url).hostname === hostname;
                } catch { return false; }
            }).length;
        }

        // Build menu
        const menu = document.createElement('div');
        menu.className = 'hv-exclude-menu';

        let menuHtml = `
            <div class="hv-exclude-menu-item" data-action="url" data-url="${escapeHtml(url)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>Exclude this URL only</span>
            </div>
        `;

        if (hostname) {
            menuHtml += `
                <div class="hv-exclude-menu-item" data-action="domain" data-pattern="${escapeHtml(hostname)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span>Exclude all from <strong>${escapeHtml(hostname)}</strong></span>
                    ${domainCount > 1 ? `<span class="hv-menu-count">${domainCount} URLs</span>` : ''}
                </div>
            `;

            // If there's a subdomain, offer base domain option
            if (baseDomain && baseDomain !== hostname) {
                const baseDomainCount = results.filter(r => {
                    try {
                        return new URL(r.url).hostname.endsWith(baseDomain);
                    } catch { return false; }
                }).length;

                menuHtml += `
                    <div class="hv-exclude-menu-item" data-action="basedomain" data-pattern="${escapeHtml(baseDomain)}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <span>Exclude all *.${escapeHtml(baseDomain)}</span>
                        ${baseDomainCount > 1 ? `<span class="hv-menu-count">${baseDomainCount} URLs</span>` : ''}
                    </div>
                `;
            }
        }

        menu.innerHTML = menuHtml;

        // Add to body first so we can measure it
        document.body.appendChild(menu);

        // Position menu below button using fixed positioning
        const rect = btn.getBoundingClientRect();
        const menuWidth = 280; // Use min-width from CSS
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate left position - align right edge of menu with right edge of button
        let leftPos = rect.right - menuWidth;

        // Keep within viewport bounds
        if (leftPos < 10) {
            leftPos = 10;
        } else if (leftPos + menuWidth > viewportWidth - 10) {
            leftPos = viewportWidth - menuWidth - 10;
        }

        // Calculate top position - below button, or above if not enough space below
        let topPos = rect.bottom + 4;
        if (topPos + 200 > viewportHeight) {
            // Not enough space below, show above
            topPos = rect.top - 200;
            if (topPos < 10) topPos = 10;
        }

        menu.style.top = `${topPos}px`;
        menu.style.left = `${leftPos}px`;

        // Handle menu item clicks
        menu.querySelectorAll('.hv-exclude-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;

                if (action === 'url') {
                    excludeExactUrl(item.dataset.url);
                } else if (action === 'domain') {
                    excludeDomain(item.dataset.pattern, 'exact');
                } else if (action === 'basedomain') {
                    excludeDomain(item.dataset.pattern, 'suffix');
                }

                menu.remove();
            });
        });

        // Close menu on outside click
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Exclude a single exact URL.
     */
    function excludeExactUrl(url) {
        HyperlinkValidatorState.addExclusion({
            pattern: url,
            match_type: 'exact',
            reason: 'Excluded URL',
            treat_as_valid: true
        });

        updateExclusionCount();
        renderExclusions(HyperlinkValidatorState.getExclusions());
        refreshCurrentResults();
        showToast('success', `Excluded URL`);
    }

    /**
     * Exclude by domain pattern.
     */
    function excludeDomain(domain, matchType = 'exact') {
        // For suffix matching on base domain, we match the hostname ending
        const pattern = matchType === 'suffix' ? `.${domain}` : domain;

        HyperlinkValidatorState.addExclusion({
            pattern: matchType === 'suffix' ? domain : domain,
            match_type: matchType === 'suffix' ? 'suffix' : 'contains',
            reason: `Excluded domain: ${domain}`,
            treat_as_valid: true
        });

        updateExclusionCount();
        renderExclusions(HyperlinkValidatorState.getExclusions());
        refreshCurrentResults();

        const count = countExcludedUrls();
        showToast('success', `Excluded ${domain} (${count} URLs affected)`);
    }

    /**
     * Count how many URLs are now excluded.
     */
    function countExcludedUrls() {
        const results = HyperlinkValidatorState.getResults() || [];
        return results.filter(r => isUrlExcluded(r.url)).length;
    }

    /**
     * Legacy function - now shows menu instead.
     */
    function quickExcludeUrl(url) {
        // Default to domain exclusion for backwards compatibility
        let pattern = url;
        try {
            const parsed = new URL(url);
            pattern = parsed.hostname;
        } catch {
            // Use full URL if parsing fails
        }

        HyperlinkValidatorState.addExclusion({
            pattern: pattern,
            match_type: 'contains',
            reason: 'Excluded from results',
            treat_as_valid: true
        });

        updateExclusionCount();
        renderExclusions(HyperlinkValidatorState.getExclusions());

        // Re-render current results to reflect exclusion
        refreshCurrentResults();

        showToast('success', `Excluded: ${pattern}`);
    }

    /**
     * Remove exclusion that matches a URL.
     */
    function removeExclusionByUrl(url) {
        const exclusions = HyperlinkValidatorState.getExclusions();
        const index = exclusions.findIndex(exc => matchesExclusion(url, exc));

        if (index >= 0) {
            HyperlinkValidatorState.removeExclusion(index);
            updateExclusionCount();
            renderExclusions(HyperlinkValidatorState.getExclusions());
            refreshCurrentResults();
            showToast('info', 'Exclusion removed');
        }
    }

    /**
     * Refresh the current results display.
     */
    function refreshCurrentResults() {
        const results = HyperlinkValidatorState.getResults();
        if (results && results.length > 0) {
            // Check if these are Excel/DOCX results (have sheet_name or link_type)
            if (results[0].sheet_name) {
                renderExcelResults(results);
            } else if (results[0].link_type) {
                renderDocxResults(results);
            } else {
                renderResults(HyperlinkValidatorState.getFilteredResults());
            }
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    return {
        init,
        open,
        close,
        _parseUrls: parseUrls,
        _renderResults: renderResults,
        _updateProgress: updateProgress
    };

})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Don't auto-init, wait for first open
});
