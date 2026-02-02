/**
 * Hyperlink Validator State Management
 * ====================================
 * State management module for the standalone hyperlink validator feature.
 * Handles API communication, job polling, and result caching.
 *
 * @version 1.0.0
 */

window.HyperlinkValidatorState = (function() {
    'use strict';

    // ==========================================================================
    // STATE
    // ==========================================================================

    let state = {
        // Current job
        jobId: null,
        runId: null,
        status: 'idle', // idle, running, complete, failed, cancelled

        // Progress tracking
        progress: {
            phase: '',
            overallProgress: 0,
            urlsCompleted: 0,
            urlsTotal: 0,
            currentUrl: '',
            eta: null
        },

        // Results
        results: [],
        summary: null,

        // Filtering
        filters: {
            status: 'all',
            search: ''
        },

        // Sorting
        sort: {
            column: 'status',
            direction: 'asc'
        },

        // History
        history: [],

        // Capabilities
        capabilities: null,

        // Polling
        pollInterval: null,
        pollIntervalMs: 1000,

        // Exclusions
        exclusions: []
    };

    // Event callbacks
    const callbacks = {
        onChange: [],
        onProgress: [],
        onComplete: [],
        onError: []
    };

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    function getCSRFToken() {
        // Try to get from global State first
        if (window.State && window.State.csrfToken) {
            return window.State.csrfToken;
        }
        // Fallback to meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.content : null;
    }

    async function apiRequest(endpoint, options = {}) {
        const csrfToken = getCSRFToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`/api/hyperlink-validator${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const error = data.error || { message: 'Unknown error' };
            throw new Error(error.message || 'Request failed');
        }

        return data;
    }

    function emit(event, data) {
        const eventCallbacks = callbacks[event] || [];
        eventCallbacks.forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error(`[TWR HVState] Error in ${event} callback:`, e);
            }
        });
    }

    function setState(updates) {
        Object.assign(state, updates);
        emit('onChange', { ...state });
    }

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    async function init() {
        console.log('[TWR HVState] Initializing...');

        try {
            // Load exclusions from persistent storage first, then localStorage as fallback
            await loadExclusionsFromDatabase();

            // Load capabilities
            const capsData = await apiRequest('/capabilities');
            state.capabilities = capsData.capabilities;

            // Load history
            await loadHistory();

            console.log('[TWR HVState] Initialized', state.capabilities);
            emit('onChange', { ...state });
            return true;
        } catch (e) {
            console.error('[TWR HVState] Initialization failed:', e);
            // Fallback to localStorage exclusions
            loadExclusionsFromStorage();
            return false;
        }
    }

    /**
     * Load exclusions from the persistent database via LinkHistory module.
     */
    async function loadExclusionsFromDatabase() {
        try {
            // Try using LinkHistory module if available
            if (window.LinkHistory && typeof window.LinkHistory.loadAndSyncExclusions === 'function') {
                const exclusions = await window.LinkHistory.loadAndSyncExclusions();
                if (exclusions && exclusions.length > 0) {
                    state.exclusions = exclusions.map(e => ({
                        pattern: e.pattern,
                        match_type: e.match_type,
                        reason: e.reason,
                        treat_as_valid: e.treat_as_valid
                    }));
                    console.log('[TWR HVState] Loaded', state.exclusions.length, 'exclusions from database');
                    return;
                }
            }

            // Direct API call fallback
            const response = await fetch('/api/hyperlink-validator/exclusions?active_only=true');
            const data = await response.json();

            if (data.success && data.exclusions) {
                state.exclusions = data.exclusions.map(e => ({
                    pattern: e.pattern,
                    match_type: e.match_type,
                    reason: e.reason,
                    treat_as_valid: e.treat_as_valid
                }));
                console.log('[TWR HVState] Loaded', state.exclusions.length, 'exclusions from API');
            }
        } catch (e) {
            console.warn('[TWR HVState] Failed to load exclusions from database, using localStorage:', e);
            loadExclusionsFromStorage();
        }
    }

    function reset() {
        // Stop any polling
        stopPolling();

        // Reset state
        state.jobId = null;
        state.runId = null;
        state.status = 'idle';
        state.progress = {
            phase: '',
            overallProgress: 0,
            urlsCompleted: 0,
            urlsTotal: 0,
            currentUrl: '',
            eta: null
        };
        state.results = [];
        state.summary = null;
        state.filters = { status: 'all', search: '' };
        state.sort = { column: 'status', direction: 'asc' };

        emit('onChange', { ...state });
    }

    function isInitialized() {
        return state.capabilities !== null;
    }

    // ==========================================================================
    // VALIDATION
    // ==========================================================================

    async function startValidation(urls, mode = 'validator', options = {}) {
        console.log(`[TWR HVState] Starting validation: ${urls.length} URLs, mode=${mode}`);

        // Reset previous results
        state.results = [];
        state.summary = null;
        state.status = 'running';
        state.progress = {
            phase: 'starting',
            overallProgress: 0,
            urlsCompleted: 0,
            urlsTotal: urls.length,
            currentUrl: '',
            eta: null
        };

        emit('onChange', { ...state });

        try {
            const data = await apiRequest('/validate', {
                method: 'POST',
                body: JSON.stringify({
                    urls: urls,
                    mode: mode,
                    options: options,
                    async: true
                })
            });

            state.jobId = data.job_id;
            emit('onChange', { ...state });

            // Start polling
            startPolling();

            return data.job_id;
        } catch (e) {
            state.status = 'failed';
            emit('onError', { message: e.message });
            emit('onChange', { ...state });
            throw e;
        }
    }

    async function cancelValidation() {
        if (!state.jobId) {
            console.warn('[TWR HVState] No job to cancel');
            return false;
        }

        console.log(`[TWR HVState] Cancelling job ${state.jobId}`);

        try {
            await apiRequest(`/cancel/${state.jobId}`, { method: 'POST' });

            stopPolling();
            state.status = 'cancelled';
            emit('onChange', { ...state });

            return true;
        } catch (e) {
            console.error('[TWR HVState] Cancel failed:', e);
            return false;
        }
    }

    // ==========================================================================
    // POLLING
    // ==========================================================================

    function startPolling() {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
        }

        state.pollInterval = setInterval(pollJobStatus, state.pollIntervalMs);
        // Also poll immediately
        pollJobStatus();
    }

    function stopPolling() {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = null;
        }
    }

    async function pollJobStatus() {
        if (!state.jobId) {
            stopPolling();
            return;
        }

        try {
            // Include results if complete
            const includeResults = state.status !== 'running';
            const data = await apiRequest(`/job/${state.jobId}?include_results=${includeResults}`);

            const job = data.job;

            // Update progress
            if (job.progress) {
                state.progress = {
                    phase: job.progress.phase || '',
                    overallProgress: job.progress.overall_progress || 0,
                    urlsCompleted: job.progress.checkers_completed || 0,
                    urlsTotal: state.progress.urlsTotal,
                    currentUrl: job.progress.last_log || '',
                    eta: job.eta
                };
            }

            emit('onProgress', { ...state.progress });

            // Check status
            if (job.status === 'complete') {
                stopPolling();

                state.status = 'complete';
                state.runId = job.run_id;
                state.summary = job.summary;

                // Fetch full results
                if (job.results) {
                    state.results = job.results;
                } else {
                    // Need to fetch results separately
                    const resultsData = await apiRequest(`/job/${state.jobId}?include_results=true`);
                    state.results = resultsData.job.results || [];
                }

                emit('onComplete', {
                    results: state.results,
                    summary: state.summary
                });

                // Record scan to persistent history
                recordScanToHistory('paste', '', state.results, state.summary);

                // Refresh history
                await loadHistory();

            } else if (job.status === 'failed') {
                stopPolling();
                state.status = 'failed';
                emit('onError', { message: job.error || 'Validation failed' });

            } else if (job.status === 'cancelled') {
                stopPolling();
                state.status = 'cancelled';
            }

            emit('onChange', { ...state });

        } catch (e) {
            console.error('[TWR HVState] Poll error:', e);
            // Don't stop polling on transient errors
        }
    }

    // ==========================================================================
    // FILTERING & SORTING
    // ==========================================================================

    function setFilter(type, value) {
        state.filters[type] = value;
        emit('onChange', { ...state });
    }

    function getFilters() {
        return { ...state.filters };
    }

    function setSortColumn(column, direction = 'asc') {
        state.sort = { column, direction };
        emit('onChange', { ...state });
    }

    function getFilteredResults() {
        let filtered = [...state.results];

        // Filter by status
        if (state.filters.status && state.filters.status !== 'all') {
            if (state.filters.status === 'issues') {
                // All non-working statuses
                filtered = filtered.filter(r =>
                    !['WORKING', 'REDIRECT'].includes(r.status.toUpperCase())
                );
            } else {
                filtered = filtered.filter(r =>
                    r.status.toUpperCase() === state.filters.status.toUpperCase()
                );
            }
        }

        // Filter by search
        if (state.filters.search) {
            const search = state.filters.search.toLowerCase();
            filtered = filtered.filter(r =>
                r.url.toLowerCase().includes(search) ||
                (r.message && r.message.toLowerCase().includes(search))
            );
        }

        // Sort
        const { column, direction } = state.sort;
        filtered.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // Handle null/undefined
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            // Handle numbers
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Handle strings
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }

    // ==========================================================================
    // HISTORY
    // ==========================================================================

    async function loadHistory() {
        try {
            const data = await apiRequest('/history?limit=20');
            state.history = data.history || [];
            emit('onChange', { ...state });
        } catch (e) {
            console.error('[TWR HVState] Failed to load history:', e);
        }
    }

    async function loadHistoricalRun(jobId) {
        console.log(`[TWR HVState] Loading historical run: ${jobId}`);

        try {
            const data = await apiRequest(`/job/${jobId}?include_results=true`);
            const job = data.job;

            state.jobId = jobId;
            state.runId = job.run_id;
            state.status = job.status;
            state.results = job.results || [];
            state.summary = job.summary;
            state.progress = {
                phase: 'complete',
                overallProgress: 100,
                urlsCompleted: state.results.length,
                urlsTotal: state.results.length,
                currentUrl: '',
                eta: null
            };

            emit('onChange', { ...state });

            return true;
        } catch (e) {
            console.error('[TWR HVState] Failed to load historical run:', e);
            emit('onError', { message: `Failed to load run: ${e.message}` });
            return false;
        }
    }

    // ==========================================================================
    // EXPORT
    // ==========================================================================

    function getExportUrl(format = 'csv') {
        if (!state.jobId) return null;
        return `/api/hyperlink-validator/export/${state.jobId}?format=${format}`;
    }

    /**
     * Generate client-side export for local results (Excel/DOCX).
     * @param {string} format - csv, json, or html
     * @returns {Blob|null} - Downloadable blob or null if no results
     */
    function exportLocalResults(format = 'csv') {
        if (!state.results || state.results.length === 0) return null;

        const results = state.results;
        const summary = state.summary || generateLocalSummary(results);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        let content = '';
        let mimeType = '';
        let filename = '';

        if (format === 'csv') {
            // CSV export
            const headers = ['URL', 'Status', 'Status Code', 'Message', 'Response Time (ms)', 'Link Type', 'Location'];
            const rows = results.map(r => [
                r.url || '',
                r.status || '',
                r.status_code || '',
                (r.message || '').replace(/"/g, '""'),
                r.response_time_ms || '',
                r.link_type || r.link_source || '',
                r.sheet_name ? `${r.sheet_name}:${r.cell_address}` : (r.location || '')
            ]);

            content = [headers.join(','), ...rows.map(row =>
                row.map(cell => `"${cell}"`).join(',')
            )].join('\n');

            mimeType = 'text/csv';
            filename = `hyperlink_validation_${timestamp}.csv`;

        } else if (format === 'json') {
            // JSON export
            content = JSON.stringify({
                exported_at: new Date().toISOString(),
                summary: summary,
                results: results
            }, null, 2);

            mimeType = 'application/json';
            filename = `hyperlink_validation_${timestamp}.json`;

        } else if (format === 'html') {
            // HTML report export
            content = generateHtmlReport(results, summary, timestamp);
            mimeType = 'text/html';
            filename = `hyperlink_validation_${timestamp}.html`;
        }

        if (!content) return null;

        const blob = new Blob([content], { type: mimeType });
        return { blob, filename, mimeType };
    }

    function generateLocalSummary(results) {
        const summary = {
            total: results.length,
            working: 0,
            broken: 0,
            redirect: 0,
            timeout: 0,
            blocked: 0,
            unknown: 0,
            mailto: 0
        };

        results.forEach(r => {
            const status = (r.status || '').toUpperCase();
            if (status === 'WORKING') summary.working++;
            else if (status === 'BROKEN' || status === 'INVALID') summary.broken++;
            else if (status === 'REDIRECT') summary.redirect++;
            else if (status === 'TIMEOUT') summary.timeout++;
            else if (status === 'BLOCKED') summary.blocked++;
            else if (status === 'MAILTO') summary.mailto++;
            else summary.unknown++;
        });

        return summary;
    }

    function generateHtmlReport(results, summary, timestamp) {
        const statusColors = {
            'WORKING': '#22c55e',
            'BROKEN': '#ef4444',
            'INVALID': '#ef4444',
            'REDIRECT': '#3b82f6',
            'TIMEOUT': '#f59e0b',
            'BLOCKED': '#8b5cf6',
            'MAILTO': '#3b82f6',
            'EXTRACTED': '#6b7280'
        };

        const rows = results.map(r => {
            const status = (r.status || 'UNKNOWN').toUpperCase();
            const color = statusColors[status] || '#6b7280';
            const location = r.sheet_name ? `${r.sheet_name}:${r.cell_address}` : (r.location || '-');

            return `<tr>
                <td><span style="background:${color}20;color:${color};padding:2px 8px;border-radius:4px;font-weight:600;font-size:12px">${status}</span></td>
                <td style="word-break:break-all"><a href="${escapeHtmlAttr(r.url)}" target="_blank">${escapeHtmlContent(r.url)}</a></td>
                <td>${r.status_code || '-'}</td>
                <td>${escapeHtmlContent(r.message || '')}</td>
                <td>${r.response_time_ms ? Math.round(r.response_time_ms) + 'ms' : '-'}</td>
                <td>${escapeHtmlContent(location)}</td>
            </tr>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hyperlink Validation Report - ${timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #333; }
        h1 { color: #1e40af; }
        .summary { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
        .stat { background: #f3f4f6; padding: 12px 20px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .stat-working .stat-value { color: #22c55e; }
        .stat-broken .stat-value { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        tr:hover { background: #f9fafb; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <h1>Hyperlink Validation Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
        <div class="stat stat-total"><div class="stat-value">${summary.total}</div><div class="stat-label">Total Links</div></div>
        <div class="stat stat-working"><div class="stat-value">${summary.working}</div><div class="stat-label">Working</div></div>
        <div class="stat stat-broken"><div class="stat-value">${summary.broken}</div><div class="stat-label">Broken</div></div>
        <div class="stat"><div class="stat-value">${summary.redirect || 0}</div><div class="stat-label">Redirects</div></div>
        <div class="stat"><div class="stat-value">${summary.timeout || 0}</div><div class="stat-label">Timeouts</div></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th>URL</th>
                <th>Code</th>
                <th>Message</th>
                <th>Time</th>
                <th>Location</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

    <div class="footer">
        Generated by TechWriterReview Hyperlink Validator
    </div>
</body>
</html>`;
    }

    function escapeHtmlContent(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeHtmlAttr(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /**
     * Set results directly (for Excel/DOCX local processing).
     * @param {Array} results - Array of result objects
     * @param {Object} summary - Optional summary object
     */
    function setLocalResults(results, summary = null) {
        state.results = results;
        state.summary = summary || generateLocalSummary(results);
        state.status = 'complete';
        state.jobId = null; // No server job for local results
        emit('onChange', { ...state });
    }

    // ==========================================================================
    // GETTERS
    // ==========================================================================

    function getJobId() { return state.jobId; }
    function getStatus() { return state.status; }
    function getProgress() { return { ...state.progress }; }
    function getResults() { return [...state.results]; }
    function getSummary() { return state.summary ? { ...state.summary } : null; }
    function getHistory() { return [...state.history]; }
    function getCapabilities() { return state.capabilities; }

    // ==========================================================================
    // EVENTS
    // ==========================================================================

    function onChange(callback) {
        callbacks.onChange.push(callback);
        return () => {
            const idx = callbacks.onChange.indexOf(callback);
            if (idx > -1) callbacks.onChange.splice(idx, 1);
        };
    }

    function onProgress(callback) {
        callbacks.onProgress.push(callback);
        return () => {
            const idx = callbacks.onProgress.indexOf(callback);
            if (idx > -1) callbacks.onProgress.splice(idx, 1);
        };
    }

    function onComplete(callback) {
        callbacks.onComplete.push(callback);
        return () => {
            const idx = callbacks.onComplete.indexOf(callback);
            if (idx > -1) callbacks.onComplete.splice(idx, 1);
        };
    }

    function onError(callback) {
        callbacks.onError.push(callback);
        return () => {
            const idx = callbacks.onError.indexOf(callback);
            if (idx > -1) callbacks.onError.splice(idx, 1);
        };
    }

    // ==========================================================================
    // EXCLUSIONS
    // ==========================================================================

    function getExclusions() {
        return [...state.exclusions];
    }

    function addExclusion(exclusion) {
        state.exclusions.push({
            pattern: exclusion.pattern,
            match_type: exclusion.match_type || 'contains',
            reason: exclusion.reason || '',
            treat_as_valid: exclusion.treat_as_valid !== false,
            created_at: new Date().toISOString()
        });
        saveExclusionsToStorage();
        emit('onChange', { ...state });
    }

    function removeExclusion(index) {
        if (index >= 0 && index < state.exclusions.length) {
            state.exclusions.splice(index, 1);
            saveExclusionsToStorage();
            emit('onChange', { ...state });
        }
    }

    function clearExclusions() {
        state.exclusions = [];
        saveExclusionsToStorage();
        emit('onChange', { ...state });
    }

    function saveExclusionsToStorage() {
        try {
            localStorage.setItem('hv_exclusions', JSON.stringify(state.exclusions));
        } catch (e) {
            console.warn('[TWR HVState] Failed to save exclusions to localStorage:', e);
        }
    }

    function loadExclusionsFromStorage() {
        try {
            const saved = localStorage.getItem('hv_exclusions');
            if (saved) {
                state.exclusions = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('[TWR HVState] Failed to load exclusions from localStorage:', e);
        }
    }

    /**
     * Set exclusions from external source (e.g., LinkHistory module sync).
     * @param {Array} exclusions - Array of exclusion objects
     */
    function setExclusions(exclusions) {
        if (!Array.isArray(exclusions)) return;

        state.exclusions = exclusions.map(e => ({
            pattern: e.pattern,
            match_type: e.match_type || 'contains',
            reason: e.reason || '',
            treat_as_valid: e.treat_as_valid !== false
        }));

        // Also save to localStorage as backup
        saveExclusionsToStorage();
        emit('onChange', { ...state });
        console.log('[TWR HVState] Exclusions synced:', state.exclusions.length, 'rules');
    }

    /**
     * Record a completed scan to persistent history via the API.
     * @param {string} sourceType - 'paste', 'file', 'excel', 'docx'
     * @param {string} sourceName - Optional filename or description
     * @param {Array} results - Array of result objects
     * @param {Object} summary - Summary statistics
     */
    async function recordScanToHistory(sourceType, sourceName, results, summary) {
        if (!results || results.length === 0) return;

        try {
            const scanSummary = summary || generateLocalSummary(results);

            // Prepare result URLs for storage (just the essential data)
            const resultUrls = results.map(r => ({
                url: r.url,
                status: r.status,
                status_code: r.status_code,
                message: r.message,
                response_time_ms: r.response_time_ms
            }));

            await apiRequest('/history/record', {
                method: 'POST',
                body: JSON.stringify({
                    source_type: sourceType || 'paste',
                    source_name: sourceName || '',
                    total_urls: results.length,
                    summary: {
                        working: scanSummary.working || 0,
                        broken: scanSummary.broken || 0,
                        redirect: scanSummary.redirect || 0,
                        timeout: scanSummary.timeout || 0,
                        blocked: scanSummary.blocked || 0,
                        unknown: scanSummary.unknown || 0
                    },
                    results: resultUrls
                })
            });

            console.log('[TWR HVState] Scan recorded to history');

            // Notify LinkHistory if available to refresh its display
            if (window.LinkHistory && typeof window.LinkHistory.refreshScans === 'function') {
                window.LinkHistory.refreshScans();
            }
        } catch (e) {
            console.warn('[TWR HVState] Failed to record scan to history:', e);
            // Non-critical failure, don't throw
        }
    }

    // ==========================================================================
    // CLEANUP
    // ==========================================================================

    function cleanup() {
        stopPolling();
        callbacks.onChange = [];
        callbacks.onProgress = [];
        callbacks.onComplete = [];
        callbacks.onError = [];
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    return {
        // Initialization
        init,
        reset,
        isInitialized,

        // Validation
        startValidation,
        cancelValidation,
        pollJobStatus,

        // Getters
        getJobId,
        getStatus,
        getProgress,
        getResults,
        getSummary,
        getFilteredResults,
        getHistory,
        getCapabilities,
        getExportUrl,
        exportLocalResults,
        setLocalResults,

        // Filtering & Sorting
        setFilter,
        getFilters,
        setSortColumn,

        // History
        loadHistory,
        loadHistoricalRun,

        // Exclusions
        getExclusions,
        addExclusion,
        removeExclusion,
        clearExclusions,
        setExclusions,

        // Scan History
        recordScanToHistory,

        // Events
        onChange,
        onProgress,
        onComplete,
        onError,

        // Cleanup
        cleanup
    };

})();
