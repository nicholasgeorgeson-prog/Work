/**
 * TechWriterReview v3.0.46 - Enterprise Document Analysis Tool
 * 
 * v3.0.46 Changes:
 * - Unified localStorage management via TWR.Storage module
 * - Console cleanup with [TWR] prefix consistency
 * - Migrated theme, settings, filters to centralized storage
 * 
 * v3.0.45: Dynamic version labels, keyboard shortcuts modal
 * v3.0.44: Collapsible sidebar (Ctrl+B), migrated inline onclick
 * v3.0.43: Essentials Mode toggle, persistent run-state indicator
 * v3.0.32: Top horizontal primary nav, run state indicator
 * 
 * Features:
 * - CSRF protection
 * - PDF and DOCX file support
 * - Real-time issue filtering and search
 * - Export to Word (with tracked changes), CSV, JSON
 * - D3.js interactive roles graph visualization
 * - Role extraction with alias merging and confidence scores
 * - Responsibility matrix (RACI-style)
 * - Issue baselines and suppression
 * - Dashboard analytics
 * - Keyboard shortcuts
 * - Dark mode support
 * - Scan history and profiles
 * 
 * Created by Nicholas Georgeson
 */

/**
 * TechWriterReview v3.0.19 - Enterprise Document Analysis Tool
 * 
 * v3.0.19 Changes:
 * - Extracted roles functionality to TWR.Roles module (~1,800 LOC)
 * - Module includes: RACI matrix, adjudication, D3 graph, role exports
 * - All modules: TWR.Utils, TWR.State, TWR.API, TWR.Modals, TWR.Events, TWR.Renderers, TWR.Roles
 * - ~5,450 LOC now in 7 modules
 * - app.js reduced from ~11,500 to ~8,800 LOC
 * 
 * v3.0.18 Changes:
 * - Extracted rendering functions to TWR.Renderers module (~1,200 LOC)
 * - Module includes: renderIssuesList, renderCharts, updateStats, dashboard components
 * - All modules: TWR.Utils, TWR.State, TWR.API, TWR.Modals, TWR.Events, TWR.Renderers
 * - ~3,660 LOC now in 6 modules
 * 
 * v3.0.17 Changes:
 * - Extracted event handling to TWR.Events module (~560 LOC)
 * - Module includes: initEventListeners, initDragDrop, initKeyboardShortcuts
 * - Keyboard navigation for issue list moved to module
 * - All modules: TWR.Utils, TWR.State, TWR.API, TWR.Modals, TWR.Events
 * - ~2,460 LOC now in 5 modules
 * 
 * v3.0.15 Fixes:
 * - Migrated all 40 inline onclick handlers to addEventListener
 * - All event bindings centralized in initEventListeners()
 * 
 * v3.0.12-v3.0.14:
 * - Role/Deliverable separation: exports now contain only roles (not deliverables)
 * - Fixed Statement Forge overwriting main review results
 * - Consolidated settings to single localStorage key
 * 
 * Features:
 * - CSRF protection with automatic refresh
 * - PDF and DOCX file support
 * - Real-time issue filtering and search
 * - Export to Word (with tracked changes), CSV, JSON
 * - D3.js interactive roles graph visualization
 * - Role extraction with alias merging and confidence scores
 * - Responsibility matrix (RACI-style)
 * - Issue baselines and suppression
 * - Dashboard analytics
 * - Keyboard shortcuts (? for help)
 * - Dark mode support
 * - Scan history and profiles
 * 
 * Created by Nicholas Georgeson
 */

'use strict';

// ============================================================
// MODULE DETECTION & FALLBACK SETUP
// ============================================================
// Modules are loaded before app.js in index.html
// If modules loaded successfully, we use them; otherwise inline fallback

(function() {
    const modules = {
        utils: typeof window.TWR?.Utils === 'object',
        state: typeof window.TWR?.State === 'object',
        api: typeof window.TWR?.API === 'object',
        modals: typeof window.TWR?.Modals === 'object',
        events: typeof window.TWR?.Events === 'object',
        renderers: typeof window.TWR?.Renderers === 'object',
        roles: typeof window.TWR?.Roles === 'object',
        triage: typeof window.TWR?.Triage === 'object',
        families: typeof window.TWR?.Families === 'object'
    };
    
    const loadedCount = Object.values(modules).filter(Boolean).length;
    console.log(`[TWR] Module check: ${loadedCount}/9 modules loaded`, modules);
    
    if (loadedCount === 9) {
        console.log('[TWR] All modules loaded - using modular architecture');
    } else if (loadedCount > 0) {
        console.warn('[TWR] Partial modules loaded - hybrid mode');
    } else {
        console.log('[TWR] No modules loaded - using inline fallback definitions');
    }
})();

// Global guard to prevent duplicate file processing
window._TWR_fileProcessing = false;
window._TWR_lastFileTime = 0;

// ============================================================
// GLOBAL STATE - Use module or inline fallback
// ============================================================
const State = window.State || window.TWR?.State?.State || {
    filename: null,
    fileType: null,
    filepath: null,
    documentId: null,
    issues: [],
    filteredIssues: [],
    selectedIssues: new Set(),
    reviewResults: null,
    roles: {},
    entities: {
        roles: [],
        deliverables: [],
        unknown: []
    },
    roleNetwork: null,
    isLoading: false,
    csrfToken: null,
    currentPage: 1,
    pageSize: 50,
    sortColumn: 'severity',
    sortDirection: 'asc',
    capabilities: {},
    currentText: null,
    currentFilename: null,
    settings: {
        darkMode: false,
        compactMode: false,
        showCharts: false,
        autoReview: false,
        rememberChecks: true,
        pageSize: 50,
        essentialsMode: false
    },
    filters: {
        customFilter: null,
        customFilterLabel: null
    },
    workflow: {
        reviewLog: [],
        issueFamilies: new Map(),
        familyActions: new Map()
    }
};

// Expose State globally for module compatibility
if (!window.State) window.State = State;

// Severity constants - use module or define inline
const SEVERITY_ORDER = window.SEVERITY_ORDER || window.TWR?.State?.SEVERITY_ORDER || 
    { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Info': 4 };
const SEVERITY_COLORS = window.SEVERITY_COLORS || window.TWR?.State?.SEVERITY_COLORS || {
    'Critical': '#DC3545',
    'High': '#FD7E14', 
    'Medium': '#FFC107',
    'Low': '#28A745',
    'Info': '#17A2B8'
};

// ============================================================
// LOADING TRACKER - Use module or inline fallback
// ============================================================
const LoadingTracker = window.LoadingTracker || window.TWR?.State?.LoadingTracker || {
    startTime: null,
    totalItems: 0,
    processedItems: 0,
    operationType: null,
    abortController: null,
    
    start(operationType, totalItems = 0) {
        this.startTime = performance.now();
        this.totalItems = totalItems;
        this.processedItems = 0;
        this.operationType = operationType;
        this.abortController = new AbortController();
    },
    
    updateProgress(processed, total) {
        this.processedItems = processed;
        if (total) this.totalItems = total;
        this.updateETA();
        this.updateItemsDisplay();
    },
    
    updateETA() {
        if (!this.startTime || this.processedItems === 0) return;
        const elapsed = performance.now() - this.startTime;
        const avgTimePerItem = elapsed / this.processedItems;
        const remainingItems = this.totalItems - this.processedItems;
        const estimatedRemaining = avgTimePerItem * remainingItems;
        
        const etaEl = document.getElementById('loading-eta');
        const etaContainer = document.getElementById('loading-eta-container');
        
        if (etaEl && etaContainer && this.totalItems > 0) {
            etaContainer.style.display = 'flex';
            if (estimatedRemaining < 1000) {
                etaEl.textContent = 'almost done...';
            } else if (estimatedRemaining < 60000) {
                etaEl.textContent = `~${Math.ceil(estimatedRemaining / 1000)} seconds`;
            } else {
                const mins = Math.floor(estimatedRemaining / 60000);
                const secs = Math.ceil((estimatedRemaining % 60000) / 1000);
                etaEl.textContent = `~${mins}m ${secs}s`;
            }
        }
    },
    
    updateItemsDisplay() {
        const itemsEl = document.getElementById('loading-items');
        if (itemsEl && this.totalItems > 0) {
            itemsEl.style.display = 'block';
            itemsEl.textContent = `Processing item ${this.processedItems} of ${this.totalItems}...`;
        }
    },
    
    reset() {
        this.startTime = null;
        this.totalItems = 0;
        this.processedItems = 0;
        this.operationType = null;
        this.abortController = null;
        
        const etaContainer = document.getElementById('loading-eta-container');
        const itemsEl = document.getElementById('loading-items');
        const cancelBtn = document.getElementById('loading-cancel');
        
        if (etaContainer) etaContainer.style.display = 'none';
        if (itemsEl) itemsEl.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
    },
    
    getAbortSignal() {
        return this.abortController?.signal;
    },
    
    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
};

if (!window.LoadingTracker) window.LoadingTracker = LoadingTracker;

// Cancel current operation
function cancelCurrentOperation() {
    LoadingTracker.abort();
    hideLoading();
    toast('warning', 'Operation cancelled');
}
window.cancelCurrentOperation = cancelCurrentOperation;

// ============================================================
// LOADING FUNCTIONS - Module wrappers with fallback
// ============================================================
function showLoading(message, options = {}) {
    // Use module if available
    if (window.TWR?.Modals?.showLoading) {
        return TWR.Modals.showLoading(message, options);
    }
    
    // Inline fallback
    const progress = options.progress || 0;
    
    if (options.totalItems) {
        LoadingTracker.start(message, options.totalItems);
    }
    
    const cancelBtn = document.getElementById('loading-cancel');
    if (cancelBtn && options.showCancel) {
        cancelBtn.style.display = 'inline-flex';
    }
    
    if (typeof setLoading === 'function') {
        setLoading(true, message || 'Loading...', progress);
    } else {
        let overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const msgEl = overlay.querySelector('.loading-message, #loading-text');
            if (msgEl) msgEl.textContent = message || 'Loading...';
            const progressBar = overlay.querySelector('.loading-progress-bar, #loading-progress-bar');
            if (progressBar) progressBar.style.width = `${progress}%`;
        }
    }
    
    State.isLoading = true;
    console.log('[TWR] Loading:', message);
}

function updateLoadingMessage(message, options = {}) {
    if (window.TWR?.Modals?.updateLoadingMessage) {
        return TWR.Modals.updateLoadingMessage(message, options);
    }
    
    if (typeof updateProgress === 'function' && options.progress !== undefined) {
        updateProgress(options.progress, message);
    } else {
        const msgEl = document.querySelector('.loading-message, #loading-text');
        if (msgEl && message) msgEl.textContent = message;
        
        if (options.progress !== undefined) {
            const progressBar = document.querySelector('.loading-progress-bar, #loading-progress-bar');
            if (progressBar) progressBar.style.width = `${options.progress}%`;
        }
    }
    
    if (options.currentItem !== undefined && options.totalItems !== undefined) {
        LoadingTracker.updateProgress(options.currentItem, options.totalItems);
    }
    
    console.log('[TWR] Loading update:', message);
}

function hideLoading() {
    if (window.TWR?.Modals?.hideLoading) {
        return TWR.Modals.hideLoading();
    }
    
    if (typeof setLoading === 'function') {
        setLoading(false);
    } else {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }
    
    LoadingTracker.reset();
    State.isLoading = false;
    console.log('[TWR] Loading hidden');
}

// Make loading functions globally available
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.updateLoadingMessage = updateLoadingMessage;
// ============================================================
// v2.9.1 FIX C5: STATE RESET FOR NEW DOCUMENT
// ============================================================
/**
 * Reset application state when loading a new document.
 * This prevents app freeze/unresponsiveness on 2nd document scan.
 */
function resetStateForNewDocument() {
    console.log('[TWR] Resetting state for new document...');
    
    // Stop any running D3 simulation
    if (GraphState.simulation) {
        GraphState.simulation.stop();
        GraphState.simulation = null;
    }
    
    // Clear GraphState
    GraphState.data = null;
    GraphState.svg = null;
    GraphState.selectedNode = null;
    GraphState.highlightedNodes.clear();
    GraphState.isPinned = false;
    GraphState.fallbackRows = [];
    GraphState.fallbackData = null;
    
    // Clear main State (preserve settings and capabilities)
    State.filename = null;
    State.fileType = null;
    State.filepath = null;
    State.documentId = null;
    State.issues = [];
    State.filteredIssues = [];
    State.selectedIssues.clear();
    State.reviewResults = null;
    State.roles = {};
    State.roleNetwork = null;
    State.currentPage = 1;
    State.sortColumn = 'severity';
    State.sortDirection = 'asc';
    State.adjudicatedRoles = null;
    
    // Clear filters
    State.filters.customFilter = null;
    State.filters.customFilterLabel = null;
    
    // Clear workflow state
    State.workflow.reviewLog = [];
    State.workflow.issueFamilies.clear();
    State.workflow.familyActions.clear();
    
    // Clear FilterState chart filter
    if (typeof FilterState !== 'undefined' && FilterState.chartFilter !== undefined) {
        FilterState.chartFilter = null;
    }
    
    // Clear AdjudicationState if it exists
    if (typeof AdjudicationState !== 'undefined' && AdjudicationState.decisions) {
        AdjudicationState.decisions.clear();
    }
    
    // Clear any tooltips that might be lingering
    if (typeof d3 !== 'undefined' && d3) d3.selectAll('.graph-tooltip').remove();
    
    // Remove any existing graph content
    const graphSvg = document.getElementById('roles-graph-svg');
    if (graphSvg) {
        graphSvg.innerHTML = '';
    }
    
    console.log('[TWR] State reset complete');
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await initCSRF();
    await checkCapabilities();
    await loadVersionLabel();
    initUI();
    initDragDrop();
    initEventListeners();
    initTopNav();  // v3.0.32: Initialize top nav bar
    initSidebarState();  // v3.0.44: Restore sidebar collapse state
    initScanHistoryEventDelegation();
    initKeyboardShortcuts();
    initThemeToggle();
    loadSettings();
    
    // Try to restore previous session (for back button support)
    restoreSessionState();
    
    // Safely call lucide - it may not be loaded yet (CDN)
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try { if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} } } catch(e) { console.warn('[TWR] Lucide init deferred:', e); }
    }
});

// v3.0.32: Initialize top navigation bar
function initTopNav() {
    if (window.TWR?.Events?.initTopNav) {
        TWR.Events.initTopNav();
    }
}

// v3.0.44: Initialize sidebar state from localStorage
function initSidebarState() {
    if (window.TWR?.Events?.initSidebarState) {
        TWR.Events.initSidebarState();
    }
}

// Theme toggle functionality (v3.0.46: uses TWR.Storage)
function initThemeToggle() {
    // v3.0.46: Use unified storage if available, fallback to direct localStorage
    const savedTheme = window.TWR?.Storage?.ui 
        ? TWR.Storage.ui.getTheme()
        : localStorage.getItem('twr-theme');
    
    // Default to LIGHT mode - only use dark if explicitly saved as dark
    // (Ignores system preference per user request)
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcons(true);
    } else {
        // Ensure light mode (remove dark-mode if somehow present)
        document.body.classList.remove('dark-mode');
        updateThemeIcons(false);
    }
    
    // Toggle button handler
    document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    
    // v3.0.46: Use unified storage if available
    if (window.TWR?.Storage?.ui) {
        TWR.Storage.ui.setTheme(isDark ? 'dark' : 'light');
    } else {
        localStorage.setItem('twr-theme', isDark ? 'dark' : 'light');
    }
    
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    
    if (lightIcon && darkIcon) {
        lightIcon.style.display = isDark ? 'block' : 'none';
        darkIcon.style.display = isDark ? 'none' : 'block';
    }
}

async function initCSRF() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        State.csrfToken = meta.getAttribute('content');
        // Export to window for IIFE modules (Dictionary, etc.)
        window.CSRF_TOKEN = State.csrfToken;
    }
    await fetchCSRFToken();
}

async function fetchCSRFToken() {
    try {
        const r = await fetch('/api/csrf-token');
        const data = await r.json();
        if (data.csrf_token) {
            State.csrfToken = data.csrf_token;
            // Export to window for IIFE modules (Dictionary, etc.)
            window.CSRF_TOKEN = data.csrf_token;
        }
    } catch (e) {
        console.warn('[TWR] Failed to fetch CSRF token:', e);
    }
}

async function checkCapabilities() {
    try {
        const r = await fetch('/api/capabilities');
        const data = await r.json();
        if (data.success && data.data) {
            // Handle nested structure: { version, capabilities: {...} }
            // Flatten capabilities into State.capabilities for easier access
            State.capabilities = data.data.capabilities || data.data;
            // Also store version if available
            if (data.data.version) {
                State.serverVersion = data.data.version;
            }
            updateCapabilityUI();
        }
    } catch (e) {
        console.warn('[TWR] Failed to check capabilities:', e);
    }
}

async function loadVersionLabel() {
    try {
        const r = await fetch('/api/version');
        const data = await r.json();
        const versionLabel = document.getElementById('version-label');
        const footerVersion = document.getElementById('footer-version');
        const helpVersion = document.getElementById('help-version');  // v3.0.45
        
        // API returns { app_version: "x.y.z", ... } directly (not wrapped)
        const version = data.app_version || (data.data && data.data.version);
        
        if (version) {
            // Update header version label
            if (versionLabel) {
                versionLabel.textContent = `Enterprise v${version}`;
            }
            // Update footer version label (v3.0.8: keep both in sync)
            if (footerVersion) {
                footerVersion.textContent = `v${version}`;
            }
            // v3.0.45: Update help modal version
            if (helpVersion) {
                helpVersion.textContent = `v${version}`;
            }
        }
    } catch (e) {
        console.warn('[TWR] Failed to load version:', e);
    }
}

function updateCapabilityUI() {
    // Update export buttons based on capabilities
    const excelBtn = document.getElementById('btn-export-excel');
    const pdfBtn = document.getElementById('btn-export-pdf');
    
    if (excelBtn && !State.capabilities.excel_export) {
        excelBtn.disabled = true;
        excelBtn.title = 'Excel export not available (install openpyxl)';
    }
    if (pdfBtn && !State.capabilities.pdf_export) {
        pdfBtn.disabled = true;
        pdfBtn.title = 'PDF export not available (install reportlab)';
    }
}

function initUI() {
    show('empty-state');
    hide('loading-overlay');
    hide('analytics-accordion');  // v3.0.13
    hide('unified-filter-bar');   // v3.0.13
    hide('issues-container');
    hide('stats-bar');
    updateStats();
}

// ============================================================
// EVENT HANDLING - Delegated to TWR.Events module (v3.0.17)
// ============================================================

/**
 * Initialize all event listeners
 * Delegates to TWR.Events module if loaded, otherwise uses inline fallback
 */
function initEventListeners() {
    if (window.TWR?.Events?.initEventListeners) {
        TWR.Events.initEventListeners();
    } else {
        console.warn('[TWR] Events module not loaded - using inline fallback');
        // Inline fallback would go here, but module should always be loaded
        // For air-gapped deployment, ensure events.js is included in install
    }
}

/**
 * Initialize drag-and-drop handling
 */
function initDragDrop() {
    if (window.TWR?.Events?.initDragDrop) {
        TWR.Events.initDragDrop();
    } else {
        console.warn('[TWR] Events module not loaded for drag-drop');
    }
}

/**
 * Initialize global keyboard shortcuts
 */
function initKeyboardShortcuts() {
    if (window.TWR?.Events?.initKeyboardShortcuts) {
        TWR.Events.initKeyboardShortcuts();
    } else {
        console.warn('[TWR] Events module not loaded for keyboard shortcuts');
    }
}

// Category list filtering - delegate to module
function filterCategoryList() {
    if (window.TWR?.Events?.filterCategoryList) {
        TWR.Events.filterCategoryList();
    } else {
        // Inline fallback
        const search = (document.getElementById('category-search')?.value || '').toLowerCase().trim();
        const items = document.querySelectorAll('#category-list .checkbox-label');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = !search || text.includes(search) ? '' : 'none';
        });
    }
}

// Table density - delegate to module
function setTableDensity(density) {
    if (window.TWR?.Events?.setTableDensity) {
        TWR.Events.setTableDensity(density);
    } else {
        // Inline fallback
        const tableBody = document.getElementById('issues-list');
        if (!tableBody) return;
        tableBody.classList.remove('density-compact', 'density-comfortable');
        tableBody.classList.add(`density-${density}`);
        try { localStorage.setItem('twr_density', density); } catch (e) { /* ignore */ }
    }
}

// Keyboard navigation state - module handles this, but keep reference for compatibility
let keyboardSelectedIndex = -1;

function initIssueKeyboardNav() {
    if (window.TWR?.Events?.initIssueKeyboardNav) {
        TWR.Events.initIssueKeyboardNav();
    }
}

function updateKeyboardSelection(rows) {
    if (window.TWR?.Events?.updateKeyboardSelection) {
        TWR.Events.updateKeyboardSelection(rows);
    } else {
        // Inline fallback
        rows.forEach((row, i) => {
            row.classList.toggle('keyboard-selected', i === keyboardSelectedIndex);
            if (i === keyboardSelectedIndex) {
                row.scrollIntoView({ block: 'nearest' });
            }
        });
    }
}

// Modal focus trap - already in TWR.Modals, this is a legacy alias
function initModalFocusTrap() {
    if (window.TWR?.Modals?.initModalFocusTrap) {
        TWR.Modals.initModalFocusTrap();
    }
}

// ============================================================
// FILE HANDLING
// ============================================================
function isValidFileType(filename) {
    const ext = filename.toLowerCase();
    return ext.endsWith('.docx') || ext.endsWith('.pdf');
}

function getFileType(filename) {
    if (filename.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (filename.toLowerCase().endsWith('.docx')) return 'docx';
    return null;
}

async function handleFileUpload(file) {
    // Guard against duplicate uploads
    if (window._TWR_fileProcessing) {
        console.log('[TWR] File upload already in progress, ignoring');
        return;
    }
    
    if (!isValidFileType(file.name)) {
        toast('error', 'Invalid file type. Please upload a .docx or .pdf file.');
        return;
    }

    window._TWR_fileProcessing = true;
    console.log('[TWR] Starting file upload:', file.name);
    
    // v2.9.1 FIX C5: Reset state before processing new document
    // This prevents app freeze when scanning 2nd document
    resetStateForNewDocument();
    
    setLoading(true, 'Uploading document...', 10);
    setLoadingStep('upload', 'active'); // B9

    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await api('/upload', 'POST', formData);

        if (result.success) {
            setLoadingStep('upload', 'complete'); // B9
            State.filename = result.data.filename;
            State.fileType = result.data.file_type;
            State.filepath = result.data.filepath;

            updateDocumentInfo(result.data);
            
            hide('empty-state');
            show('stats-bar');

            document.getElementById('btn-review').disabled = false;
            
            setLoading(false);
            toast('success', `Loaded: ${result.data.filename}`);

            // Auto-review if enabled
            if (State.settings.autoReview) {
                runReview();
            }
        } else {
            setLoading(false);
            toast('error', result.error || 'Upload failed');
        }
    } finally {
        // Reset file input and processing flag after a delay
        setTimeout(() => {
            window._TWR_fileProcessing = false;
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';
        }, 500);
    }
}

function updateDocumentInfo(data) {
    const titleEl = document.getElementById('doc-title');
    const subtitleEl = document.getElementById('doc-subtitle');
    
    if (titleEl) titleEl.textContent = data.filename || 'Document';
    if (subtitleEl) {
        const fileType = data.file_type?.toUpperCase() || 'Document';
        subtitleEl.textContent = `${fileType} • ${(data.word_count || 0).toLocaleString()} words`;
    }

    // Update stats
    setStatValue('stat-words', data.word_count);
    setStatValue('stat-paragraphs', data.paragraph_count);
    setStatValue('stat-tables', data.table_count || 0);
    setStatValue('stat-headings', data.heading_count || '-');
}

// ============================================================
// REVIEW
// ============================================================
async function runReview() {
    if (!State.filename) {
        toast('error', 'Please upload a document first');
        return;
    }

    // v3.0.39: Check if job manager is available, use job-based review if so
    const jobStatus = await api('/job/status', 'GET');
    if (jobStatus.available) {
        return runReviewWithJobs();
    }
    
    // Fallback to synchronous review
    return runReviewSync();
}

/**
 * Run review using job-based async polling (v3.0.39 Batch I)
 * 
 * Shows real progress from backend phases:
 * - extracting: Document text extraction
 * - parsing: Structure parsing
 * - checking: Running quality checkers
 * - postprocessing: Finalizing results
 * - complete: Done
 */
async function runReviewWithJobs() {
    // v3.0.39: Job-based review with real progress polling
    LoadingTracker.start('review', 5);
    LoadingTracker.updateProgress(0, 5);
    
    setLoading(true, 'Starting document analysis...', 5);
    setLoadingStep('upload', 'complete'); // Already uploaded
    setLoadingStep('extract', 'active');
    const startTime = performance.now();

    // Show cancel button and wire it to job cancellation
    const cancelBtn = document.getElementById('loading-cancel');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-flex';
        cancelBtn.onclick = null; // Clear any existing handler
    }

    // Gather enabled checkers
    const options = {};
    document.querySelectorAll('[data-checker]').forEach(cb => {
        if (cb.checked !== undefined) {
            options[`check_${cb.dataset.checker}`] = cb.checked;
        }
    });

    // Start the async job
    const startResult = await api('/review/start', 'POST', { options });
    
    if (!startResult.success) {
        LoadingTracker.reset();
        setLoading(false);
        toast('error', startResult.error || 'Failed to start review');
        return;
    }
    
    const jobId = startResult.job_id;
    console.log(`[TWR] Review job started: ${jobId}`);
    
    // Wire cancel buttons to job cancellation (both overlay and persistent indicator)
    const cancelHandler = async () => {
        console.log(`[TWR] Cancelling job ${jobId}...`);
        const cancelResult = await api(`/job/${jobId}/cancel`, 'POST');
        if (cancelResult.success) {
            toast('info', 'Review cancelled');
            LoadingTracker.reset();
            setLoading(false);
        } else {
            toast('error', cancelResult.error || 'Failed to cancel');
        }
    };
    
    if (cancelBtn) {
        cancelBtn.onclick = cancelHandler;
    }
    
    // v3.0.43: Also wire up persistent run-state cancel button
    const runStateCancel = document.getElementById('run-state-cancel');
    if (runStateCancel) {
        runStateCancel.onclick = cancelHandler;
    }
    
    // Store job ID for potential external cancellation
    State.currentJobId = jobId;
    
    // Poll for job progress
    let pollCount = 0;
    const maxPolls = 600; // 5 minutes at 500ms intervals
    
    while (pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms polling interval
        pollCount++;
        
        const jobResult = await api(`/job/${jobId}`, 'GET');
        
        if (!jobResult.success) {
            console.error(`[TWR] Job poll error:`, jobResult.error);
            continue; // Keep trying
        }
        
        const job = jobResult.job;
        const progress = job.progress;
        
        // Map phase to loading steps and update UI
        const phaseToStep = {
            'queued': 'extract',
            'uploading': 'extract',
            'extracting': 'extract',
            'parsing': 'extract',
            'checking': 'analyze',
            'postprocessing': 'roles',
            'exporting': 'render',
            'complete': 'render'
        };
        
        const currentStep = phaseToStep[progress.phase] || 'analyze';
        setLoadingStep(currentStep, 'active');
        
        // Build progress message
        let message = progress.last_log || `Processing (${progress.phase})...`;
        if (progress.current_checker) {
            message = `Checking: ${progress.current_checker} (${progress.checkers_completed}/${progress.checkers_total})`;
        }
        
        // Update progress bar
        updateProgress(progress.overall_progress, message);
        
        // Update ETA display if available
        if (job.eta) {
            const etaContainer = document.getElementById('loading-eta-container');
            const etaValue = document.getElementById('loading-eta');
            if (etaContainer && etaValue) {
                etaContainer.style.display = 'block';
                etaValue.textContent = job.eta;
            }
        }
        
        console.log(`[TWR] Job ${jobId}: ${progress.phase} @ ${progress.overall_progress.toFixed(1)}% - ${message}`);
        
        // Check for completion states
        if (job.status === 'complete') {
            console.log(`[TWR] Job ${jobId} complete`);
            break;
        } else if (job.status === 'failed') {
            console.error(`[TWR] Job ${jobId} failed:`, job.error);
            LoadingTracker.reset();
            setLoading(false);
            toast('error', job.error || 'Review failed');
            State.currentJobId = null;
            return;
        } else if (job.status === 'cancelled') {
            console.log(`[TWR] Job ${jobId} cancelled`);
            LoadingTracker.reset();
            setLoading(false);
            State.currentJobId = null;
            return;
        }
    }
    
    // Get final results
    const resultResponse = await api(`/review/result/${jobId}`, 'GET');
    
    if (!resultResponse.success) {
        LoadingTracker.reset();
        setLoading(false);
        toast('error', resultResponse.error || 'Failed to get results');
        State.currentJobId = null;
        return;
    }
    
    // Process results (same as sync version)
    const result = { success: true, data: resultResponse.data };
    const duration = performance.now() - startTime;
    
    processReviewResults(result, duration);
    State.currentJobId = null;
}

/**
 * Process review results and update UI.
 * Shared by both sync and async review functions.
 */
function processReviewResults(result, duration) {
    if (!result.success) {
        LoadingTracker.reset();
        setLoading(false);
        toast('error', result.error || 'Review failed');
        return;
    }
    
    LoadingTracker.updateProgress(4, 5);
    setLoadingStep('render', 'active');
    updateProgress(90, 'Rendering results...');
    
    State.reviewResults = result.data;
    State.issues = result.data.issues || [];
    State.filteredIssues = [...State.issues];
    
    // v2.9.4: Store full text for Statement Forge (#2, #4)
    State.currentText = result.data.full_text || '';
    State.currentFilename = State.filename || 'Unknown Document';
    
    // Handle roles - could be in result.data.roles or result.data.roles.roles
    if (result.data.roles) {
        State.roles = result.data.roles.roles || result.data.roles;
        // v3.0.12: Populate separated entities for proper export
        if (result.data.roles.entities) {
            State.entities = {
                roles: result.data.roles.entities.roles || [],
                deliverables: result.data.roles.entities.deliverables || [],
                unknown: result.data.roles.entities.unknown || []  // v3.0.12b
            };
        } else {
            // Fallback: filter from main roles object by entity_kind
            // v3.0.12b: Only include explicit 'role' kind, not unknown
            const allRoles = Object.values(State.roles);
            State.entities = {
                roles: allRoles.filter(r => r.entity_kind === 'role'),
                deliverables: allRoles.filter(r => r.entity_kind === 'deliverable'),
                unknown: allRoles.filter(r => !r.entity_kind || r.entity_kind === 'unknown')
            };
        }
        
        // v3.0.12b: Log entity audit for debugging
        console.log(`[TWR] Entity audit: ${State.entities.roles.length} roles, ${State.entities.deliverables.length} deliverables, ${State.entities.unknown.length} unknown`);
    } else {
        State.roles = {};
        State.entities = { roles: [], deliverables: [], unknown: [] };
    }
    
    State.selectedIssues.clear();

    // Update UI
    updateResultsUI(result.data);
    updateSeverityCounts(result.data.by_severity || {});
    updateValidationCounts(); // v3.0.29: Update validation filter counts
    updateCategoryFilters(result.data.by_category || {});
    renderIssuesList();
    
    // v3.0.13: Show analytics accordion and unified filter bar
    showAnalyticsAccordion(result.data);
    showUnifiedFilterBar(result.data);
    show('issues-container');
    
    // Show inline families panel (Pareto view)
    showInlineFamiliesPanel();
    
    // Show roles if available
    if (Object.keys(State.roles).length > 0) {
        document.getElementById('roles-chart-card')?.style.setProperty('display', 'block');
        document.getElementById('btn-roles-report').disabled = false;
        renderRolesSummary();
    }

    document.getElementById('btn-export').disabled = false;

    LoadingTracker.updateProgress(5, 5);
    LoadingTracker.reset();
    setLoading(false);
    toast('success', `Analysis complete: ${State.issues.length} issues found in ${(duration/1000).toFixed(1)}s`);

    // v2.9.4: Auto-run Statement Forge extraction in background (#4)
    if (State.currentText && window.StatementForge) {
        setTimeout(() => {
            console.log('[TWR] Auto-extracting statements in background...');
            window.StatementForge.extractStatements(true); // silent mode
        }, 500);
    }

    // Save to history if database available
    if (State.capabilities.database) {
        saveToHistory(duration);
    }
    
    // Save state to sessionStorage for back button support
    saveSessionState();
}

/**
 * Synchronous review (fallback when job manager is unavailable)
 * v3.0.39: Refactored from original runReview
 */
async function runReviewSync() {
    // v2.9.9: Initialize LoadingTracker for ETA (#20)
    // Estimate ~5 steps: upload, extract, analyze, roles, render
    LoadingTracker.start('review', 5);
    LoadingTracker.updateProgress(0, 5);
    
    setLoading(true, 'Analyzing document...', 10);
    setLoadingStep('extract', 'active'); // B9
    const startTime = performance.now();

    // Show cancel button for long operations
    const cancelBtn = document.getElementById('loading-cancel');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    // Gather enabled checkers
    const options = {};
    document.querySelectorAll('[data-checker]').forEach(cb => {
        if (cb.checked !== undefined) {
            options[`check_${cb.dataset.checker}`] = cb.checked;
        }
    });

    LoadingTracker.updateProgress(1, 5);
    setLoadingStep('analyze', 'active'); // B9
    updateProgress(30, 'Running quality checks...');

    const result = await api('/review', 'POST', { options });

    if (result.success) {
        const duration = performance.now() - startTime;
        
        LoadingTracker.updateProgress(3, 5);
        setLoadingStep('roles', 'active'); // B9
        updateProgress(60, 'Processing roles...');
        
        processReviewResults(result, duration);
    } else {
        LoadingTracker.reset();
        setLoading(false);
        toast('error', result.error || 'Review failed');
    }
}

function updateResultsUI(data) {
    // Score
    const score = data.score ?? 100;
    const grade = data.grade || 'A';
    
    setStatValue('stat-issues', data.issue_count || 0);
    setStatValue('stat-score', score);
    setStatValue('stat-grade', grade);

    // Score ring animation
    const scoreRing = document.getElementById('score-ring-fill');
    if (scoreRing) {
        scoreRing.style.strokeDasharray = `${score}, 100`;
        scoreRing.style.stroke = getScoreColor(score);
    }

    // Grade styling
    const gradeEl = document.getElementById('stat-grade');
    if (gradeEl) {
        gradeEl.className = `stat-value grade grade-${grade.toLowerCase()}`;
    }

    // Readability
    const readability = data.readability || {};
    setStatValue('stat-flesch', readability.flesch_reading_ease?.toFixed(1) ?? '--');
    setStatValue('stat-fk-grade', readability.flesch_kincaid_grade?.toFixed(1) ?? '--');
    setStatValue('stat-fog', readability.gunning_fog_index?.toFixed(1) ?? '--');
    
    // PDF Quality Warning (v2.9.0 BATCH E1)
    displayPDFQualityWarning(data.pdf_quality);
    
    // v2.9.9: Removed renderHealthGauge call - gauge tile removed in v2.9.4.2, score shown in stats bar only (#14)
    // Section heatmap for issue density visualization
    renderSectionHeatmap(data.issues, data.paragraph_count || 0);
    
    // v2.9.2 E2-E5: Render enhanced statistics panel
    if (data.enhanced_stats) {
        renderEnhancedStats(data.enhanced_stats);
    }
    
    // v3.0.33: Render acronym transparency metrics
    if (data.acronym_metrics) {
        renderAcronymMetrics(data.acronym_metrics);
    }
    
    // v3.0.33 Chunk C: Update Statement Forge ready badge
    if (data.statement_forge_summary) {
        updateStatementForgeBadge(data.statement_forge_summary);
    }
    
    // v3.0.33 Chunk E: Render issue heatmap (category × severity)
    if (data.issues && data.issues.length > 0) {
        renderIssueHeatmap(data.issues);
    }
    
    // v3.0.33 Chunk E: Fetch and render score trend sparkline
    if (data.document_info && data.document_info.filename) {
        fetchAndRenderScoreTrend(data.document_info.filename);
    }
    
    // Only show recommendations if not previously dismissed this session
    if (!sessionStorage.getItem('twr_recommendations_dismissed')) {
        renderSmartRecommendations(data);
    }
}

/**
 * Display PDF quality warning banner if quality issues detected.
 * Part of BATCH E1: Smart PDF Handling (v2.9.0)
 * 
 * @param {Object|null} pdfQuality - Quality report from pdf_extractor_v2
 */
function displayPDFQualityWarning(pdfQuality) {
    // Remove any existing warning
    const existingWarning = document.getElementById('pdf-quality-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // No warning needed if not a PDF or quality is good
    if (!pdfQuality || pdfQuality.severity === 'good') {
        return;
    }
    
    // Build warning message based on quality
    let icon = 'alert-triangle';
    let title = 'PDF Quality Notice';
    let message = '';
    let cssClass = 'pdf-warning-info';
    
    if (pdfQuality.quality === 'scanned') {
        icon = 'alert-circle';
        title = 'Scanned PDF Detected';
        message = 'This PDF appears to be a scanned document with no text layer. ' +
                  'Text analysis may be limited or unavailable. Consider running OCR.';
        cssClass = 'pdf-warning-error';
    } else if (pdfQuality.quality === 'ocr_text') {
        icon = 'alert-triangle';
        title = 'OCR-Processed PDF';
        message = 'This PDF contains OCR-processed text. Some text may have ' +
                  'recognition errors that affect analysis accuracy.';
        cssClass = 'pdf-warning-warning';
    } else if (pdfQuality.quality === 'mixed') {
        icon = 'info';
        title = 'Mixed Content PDF';
        message = 'This PDF contains both text and image-based content. ' +
                  'Some sections may not be fully analyzed.';
        cssClass = 'pdf-warning-info';
    }
    
    // Add recommendations if available
    if (pdfQuality.recommendations && pdfQuality.recommendations.length > 0) {
        message += ' Recommendation: ' + pdfQuality.recommendations[0];
    }
    
    // Create warning banner
    const warningBanner = document.createElement('div');
    warningBanner.id = 'pdf-quality-warning';
    warningBanner.className = `pdf-quality-warning ${cssClass}`;
    warningBanner.innerHTML = `
        <i data-lucide="${icon}" class="warning-icon"></i>
        <div class="warning-content">
            <strong>${title}</strong>
            <span>${message}</span>
            <small>Quality confidence: ${pdfQuality.confidence || 0}% | ~${pdfQuality.chars_per_page || 0} chars/page</small>
        </div>
        <button class="warning-dismiss" onclick="this.parentElement.remove()" aria-label="Dismiss">
            <i data-lucide="x"></i>
        </button>
    `;
    
    // Insert at top of dashboard
    const dashboard = document.getElementById('dashboard-container');
    if (dashboard) {
        dashboard.insertBefore(warningBanner, dashboard.firstChild);
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }
}

// ============================================================
// BATCH E2: ANALYTICS DASHBOARD UPGRADE (v2.9.0)
// ============================================================

// v2.9.9: Removed renderHealthGauge() - gauge tile removed in v2.9.4.2 (#14)
// Score is now displayed only in stats bar (score-ring element)

/**
 * Render Section Heatmap showing issue density by document section.
 * Delegates to TWR.Renderers module if available.
 * 
 * @param {Array} issues - List of issues with paragraph_index
 * @param {number} totalParagraphs - Total number of paragraphs in document
 */
function renderSectionHeatmap(issues, totalParagraphs) {
    if (window.TWR?.Renderers?.renderSectionHeatmap) {
        return TWR.Renderers.renderSectionHeatmap(issues, totalParagraphs);
    }
    // Fallback: basic hide if module not loaded
    const wrapper = document.getElementById('section-heatmap-container');
    if (wrapper) wrapper.style.display = 'none';
}

/**
 * Filter issues to show only those in a specific paragraph range.
 * Delegates to TWR.Renderers module if available.
 */
function filterIssuesByParagraphRange(start, end) {
    if (window.TWR?.Renderers?.filterIssuesByParagraphRange) {
        return TWR.Renderers.filterIssuesByParagraphRange(start, end);
    }
    // Fallback if module not loaded
    State.filteredIssues = State.issues.filter(issue => {
        const paraIdx = (issue.paragraph_index || 0) + 1;
        return paraIdx >= start && paraIdx <= end;
    });
    renderIssuesList();
}

/**
 * Generate and display smart recommendations based on analysis results.
 * Delegates to TWR.Renderers module if available.
 * 
 * @param {Object} data - Full review results object
 */
function renderSmartRecommendations(data) {
    if (window.TWR?.Renderers?.renderSmartRecommendations) {
        return TWR.Renderers.renderSmartRecommendations(data);
    }
    // Fallback: hide if module not loaded
    const wrapper = document.getElementById('smart-recommendations');
    if (wrapper) wrapper.style.display = 'none';
}

/**
 * Generate prioritized recommendations based on analysis patterns.
 * Delegates to TWR.Renderers module if available.
 * @param {Object} data - Review data
 * @returns {Array} Array of recommendation objects
 */
function generateRecommendations(data) {
    if (window.TWR?.Renderers?.generateRecommendations) {
        return TWR.Renderers.generateRecommendations(data);
    }
    return []; // Fallback: no recommendations
}

/**
 * Initialize dashboard event handlers.
 * Called once on page load.
 */
function initDashboardHandlers() {
    // Dismiss recommendations handler is set up in renderSmartRecommendations
    
    // Heatmap cell hover effects handled by CSS
}

// ============================================================
// v2.9.2 E2-E5: ENHANCED DASHBOARD STATISTICS (Delegated)
// ============================================================

/**
 * Render enhanced statistics panel.
 * Delegates to TWR.Renderers module if available.
 */
function renderEnhancedStats(enhancedStats) {
    if (window.TWR?.Renderers?.renderEnhancedStats) {
        return TWR.Renderers.renderEnhancedStats(enhancedStats);
    }
    // No fallback - panel just won't appear
}

/**
 * Render acronym transparency metrics panel.
 * v3.0.33: Added for strict mode visibility.
 * 
 * @param {Object} metrics - Acronym metrics from checker
 */
function renderAcronymMetrics(metrics) {
    if (!metrics) return;
    
    const card = document.getElementById('acronym-metrics-card');
    if (!card) return;
    
    // Show the card
    card.style.display = 'block';
    
    // Update mode badge
    const modeBadge = document.getElementById('acronym-mode-badge');
    const modeLabel = document.getElementById('acronym-mode-label');
    if (modeBadge && modeLabel) {
        if (metrics.strict_mode) {
            modeBadge.className = 'acronym-mode-badge strict-mode';
            modeLabel.textContent = 'Strict Mode';
            modeBadge.title = 'All acronyms must be defined in document. Click to learn more.';
        } else {
            modeBadge.className = 'acronym-mode-badge permissive-mode';
            modeLabel.textContent = 'Permissive';
            modeBadge.title = 'Common acronyms (NASA, FBI, etc.) are suppressed. Click to learn more.';
        }
    }
    
    // Update metric values
    setStatValue('acronym-total-count', metrics.total_acronyms_found || 0);
    setStatValue('acronym-defined-count', metrics.defined_count || 0);
    setStatValue('acronym-suppressed-count', metrics.suppressed_by_allowlist_count || 0);
    setStatValue('acronym-flagged-count', metrics.flagged_count || 0);
    
    // Show suppressed list if any
    const suppressedList = document.getElementById('acronym-suppressed-list');
    const suppressedItems = document.getElementById('acronym-suppressed-items');
    if (suppressedList && suppressedItems) {
        if (metrics.allowlist_matches && metrics.allowlist_matches.length > 0) {
            suppressedList.style.display = 'block';
            // Limit to first 10 to avoid clutter
            const displayItems = metrics.allowlist_matches.slice(0, 10);
            let text = displayItems.join(', ');
            if (metrics.allowlist_matches.length > 10) {
                text += ` (+${metrics.allowlist_matches.length - 10} more)`;
            }
            suppressedItems.textContent = text;
        } else {
            suppressedList.style.display = 'none';
        }
    }
    
    // Refresh icons if needed
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Update Statement Forge ready badge based on review summary.
 * v3.0.33 Chunk C: Shows badge when statements are pre-extracted.
 * 
 * @param {Object} sfSummary - Statement Forge summary from review response
 */
function updateStatementForgeBadge(sfSummary) {
    const badge = document.getElementById('sf-ready-badge');
    const btn = document.getElementById('btn-statement-forge');
    
    if (!badge) return;
    
    if (sfSummary.statements_ready && sfSummary.total_statements > 0) {
        // Show badge with count
        badge.style.display = 'flex';
        badge.textContent = sfSummary.total_statements > 99 ? '99+' : sfSummary.total_statements;
        badge.title = `${sfSummary.total_statements} statements extracted and ready`;
        
        // Update button title
        if (btn) {
            btn.title = `Statement Forge (${sfSummary.total_statements} statements ready)`;
        }
        
        // Store summary for later use
        window.TWR = window.TWR || {};
        window.TWR.statementForgeSummary = sfSummary;
        
        console.log(`[SF] ${sfSummary.total_statements} statements pre-extracted and ready`);
    } else {
        // Hide badge
        badge.style.display = 'none';
        if (btn) {
            btn.title = 'Statement Forge';
        }
    }
}

/**
 * Render score trend sparkline.
 * v3.0.33 Chunk E: Shows quality score history as interactive sparkline.
 * 
 * @param {Array} trendData - Array of {scan_time, score, grade, issue_count}
 */
function renderScoreSparkline(trendData) {
    const card = document.getElementById('score-trend-card');
    const svg = document.getElementById('score-sparkline');
    const summaryEl = document.getElementById('trend-summary');
    
    if (!card || !svg || !trendData || trendData.length < 2) {
        if (card) card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    
    const width = svg.clientWidth || 280;
    const height = 60;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Compute scales
    const scores = trendData.map(d => d.score);
    const minScore = Math.min(...scores, 0);
    const maxScore = Math.max(...scores, 100);
    const scoreRange = maxScore - minScore || 1;
    
    const xScale = (i) => padding.left + (i / (trendData.length - 1)) * chartWidth;
    const yScale = (s) => padding.top + chartHeight - ((s - minScore) / scoreRange) * chartHeight;
    
    // Build path
    const linePath = trendData.map((d, i) => 
        `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.score)}`
    ).join(' ');
    
    const areaPath = linePath + 
        ` L ${xScale(trendData.length - 1)} ${yScale(minScore)}` +
        ` L ${xScale(0)} ${yScale(minScore)} Z`;
    
    // Generate points
    const points = trendData.map((d, i) => ({
        cx: xScale(i),
        cy: yScale(d.score),
        data: d
    }));
    
    // Build SVG content
    svg.innerHTML = `
        <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <path class="sparkline-area" d="${areaPath}"/>
        <path class="sparkline-line" d="${linePath}"/>
        ${points.map((p, i) => `
            <circle class="sparkline-point" 
                cx="${p.cx}" cy="${p.cy}" r="4"
                data-index="${i}"
                data-score="${p.data.score}"
                data-date="${p.data.scan_time}"
                data-grade="${p.data.grade}"/>
        `).join('')}
    `;
    
    // Add hover interactions
    const tooltip = document.getElementById('sparkline-tooltip');
    svg.querySelectorAll('.sparkline-point').forEach(point => {
        point.addEventListener('mouseenter', (e) => {
            const score = point.dataset.score;
            const date = new Date(point.dataset.date).toLocaleDateString();
            const grade = point.dataset.grade;
            tooltip.innerHTML = `
                <div class="tooltip-score">Score: ${score} (${grade})</div>
                <div class="tooltip-date">${date}</div>
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = `${point.cx.baseVal.value}px`;
            tooltip.style.top = `${point.cy.baseVal.value - 40}px`;
        });
        point.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
    
    // Update trend summary
    const first = trendData[0].score;
    const last = trendData[trendData.length - 1].score;
    const diff = last - first;
    
    if (diff > 5) {
        summaryEl.className = 'trend-summary trend-up';
        summaryEl.textContent = `↑ +${diff.toFixed(0)} pts`;
    } else if (diff < -5) {
        summaryEl.className = 'trend-summary trend-down';
        summaryEl.textContent = `↓ ${diff.toFixed(0)} pts`;
    } else {
        summaryEl.className = 'trend-summary trend-stable';
        summaryEl.textContent = `→ Stable`;
    }
    
    // Refresh icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Render issue heatmap by category × severity.
 * v3.0.33 Chunk E: Visual grid showing issue density.
 * 
 * @param {Array} issues - Array of issue objects with category and severity
 */
function renderIssueHeatmap(issues) {
    const container = document.getElementById('issue-heatmap-container');
    const grid = document.getElementById('issue-heatmap');
    
    if (!container || !grid || !issues || issues.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Build category × severity matrix
    const severities = ['Critical', 'High', 'Medium', 'Low', 'Info'];
    const categorySet = new Set();
    const matrix = {};
    
    issues.forEach(issue => {
        const cat = issue.category || 'Other';
        const sev = issue.severity || 'Info';
        categorySet.add(cat);
        
        if (!matrix[cat]) matrix[cat] = {};
        matrix[cat][sev] = (matrix[cat][sev] || 0) + 1;
    });
    
    // Sort categories by total issues
    const categories = Array.from(categorySet).sort((a, b) => {
        const aTotal = Object.values(matrix[a] || {}).reduce((s, v) => s + v, 0);
        const bTotal = Object.values(matrix[b] || {}).reduce((s, v) => s + v, 0);
        return bTotal - aTotal;
    }).slice(0, 10); // Limit to top 10 categories
    
    // Get intensity class based on count
    const getIntensity = (count) => {
        if (count === 0) return 'intensity-0';
        if (count <= 2) return 'intensity-1';
        if (count <= 5) return 'intensity-2';
        if (count <= 10) return 'intensity-3';
        return 'intensity-4';
    };
    
    // Build grid
    const cols = severities.length + 1;
    grid.style.gridTemplateColumns = `minmax(100px, 150px) repeat(${severities.length}, minmax(50px, 1fr))`;
    
    let html = '';
    
    // Header row
    html += `<div class="heatmap-row">`;
    html += `<div class="heatmap-cell header-cell">Category</div>`;
    severities.forEach(sev => {
        html += `<div class="heatmap-cell header-cell">${sev}</div>`;
    });
    html += `</div>`;
    
    // Data rows
    categories.forEach(cat => {
        html += `<div class="heatmap-row">`;
        html += `<div class="heatmap-cell category-label" title="${cat}">${cat}</div>`;
        severities.forEach(sev => {
            const count = (matrix[cat] && matrix[cat][sev]) || 0;
            const intensity = getIntensity(count);
            html += `<div class="heatmap-cell ${intensity}" 
                data-category="${cat}" 
                data-severity="${sev}" 
                data-count="${count}"
                title="${cat}: ${count} ${sev} issue(s)">
                ${count || '-'}
            </div>`;
        });
        html += `</div>`;
    });
    
    grid.innerHTML = html;
    
    // v3.0.35 POL-1: Use event delegation instead of per-cell handlers for scalability
    // Single click handler on container using event bubbling
    grid.onclick = (e) => {
        const cell = e.target.closest('.heatmap-cell:not(.header-cell):not(.category-label)');
        if (!cell) return;
        
        const cat = cell.dataset.category;
        const sev = cell.dataset.severity;
        const count = parseInt(cell.dataset.count);
        
        if (count > 0 && typeof window.applyChartFilter === 'function') {
            // Apply combined filter
            window.applyChartFilter('heatmap', { category: cat, severity: sev });
            
            // Visual feedback: highlight selected cell
            grid.querySelectorAll('.heatmap-cell').forEach(c => c.classList.remove('active'));
            cell.classList.add('active');
        }
    };
    
    // Setup export button
    const exportBtn = document.getElementById('btn-export-heatmap');
    if (exportBtn) {
        exportBtn.onclick = () => exportHeatmapAsPNG();
    }
}

/**
 * Export issue heatmap as PNG image.
 * v3.0.35: Proper canvas-based rendering without external dependencies.
 * Works offline in air-gapped environments.
 */
async function exportHeatmapAsPNG() {
    const container = document.getElementById('issue-heatmap-container');
    const grid = document.getElementById('issue-heatmap');
    
    if (!container || !grid) {
        if (typeof toast === 'function') toast('warning', 'Heatmap not available');
        return;
    }
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // v3.0.35: Canonical ordering for consistent export
        const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];
        
        // Extract heatmap data from DOM
        const rows = grid.querySelectorAll('.heatmap-row');
        const categories = [];
        const dataMap = {};
        
        rows.forEach((row, rowIdx) => {
            if (rowIdx === 0) return; // Skip header row
            
            const catLabel = row.querySelector('.category-label');
            if (!catLabel) return;
            
            const category = catLabel.textContent.trim();
            categories.push(category);
            dataMap[category] = {};
            
            row.querySelectorAll('.heatmap-cell:not(.category-label)').forEach((cell, colIdx) => {
                const severity = SEVERITY_ORDER[colIdx];
                const count = parseInt(cell.dataset.count) || 0;
                dataMap[category][severity] = count;
            });
        });
        
        if (categories.length === 0) {
            if (typeof toast === 'function') toast('warning', 'No heatmap data to export');
            return;
        }
        
        // Canvas dimensions
        const cellSize = 60;
        const labelWidth = 160;
        const headerHeight = 50;
        const padding = 25;
        const titleHeight = 35;
        
        const cols = SEVERITY_ORDER.length;
        const numRows = categories.length;
        
        canvas.width = labelWidth + (cols * cellSize) + (padding * 2);
        canvas.height = titleHeight + headerHeight + (numRows * cellSize) + (padding * 2);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#1e3a5f';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Issue Heatmap (Category × Severity)', padding, padding + 16);
        
        // Header row
        const headerY = padding + titleHeight;
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        
        // "Category" header
        ctx.textAlign = 'right';
        ctx.fillText('Category', labelWidth - 10 + padding, headerY + 18);
        
        // Severity headers
        ctx.textAlign = 'center';
        SEVERITY_ORDER.forEach((sev, i) => {
            const x = labelWidth + (i * cellSize) + (cellSize / 2) + padding;
            ctx.fillText(sev, x, headerY + 18);
        });
        
        // Draw header separator line
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, headerY + 28);
        ctx.lineTo(canvas.width - padding, headerY + 28);
        ctx.stroke();
        
        // Data rows
        const dataStartY = headerY + 35;
        
        // Color function based on count intensity
        const getColor = (count) => {
            if (count === 0) return '#f8f9fa';
            if (count <= 2) return '#ffeeba';  // Light yellow
            if (count <= 5) return '#fdba74';  // Orange
            if (count <= 10) return '#f87171'; // Light red
            return '#dc2626';  // Dark red
        };
        
        const getTextColor = (count) => {
            return count > 5 ? '#ffffff' : '#333333';
        };
        
        categories.forEach((category, rowIdx) => {
            const y = dataStartY + (rowIdx * cellSize);
            
            // Row label
            ctx.textAlign = 'right';
            ctx.fillStyle = '#333333';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            
            // Truncate long category names
            let catDisplay = category;
            const maxWidth = labelWidth - 20;
            while (ctx.measureText(catDisplay).width > maxWidth && catDisplay.length > 3) {
                catDisplay = catDisplay.slice(0, -4) + '...';
            }
            ctx.fillText(catDisplay, labelWidth - 10 + padding, y + (cellSize / 2) + 4);
            
            // Cells for this row
            SEVERITY_ORDER.forEach((severity, colIdx) => {
                const x = labelWidth + (colIdx * cellSize) + padding;
                const count = dataMap[category][severity] || 0;
                
                // Cell background
                ctx.fillStyle = getColor(count);
                ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Cell border
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Cell count
                ctx.textAlign = 'center';
                ctx.fillStyle = getTextColor(count);
                ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(count > 0 ? count.toString() : '-', x + (cellSize / 2), y + (cellSize / 2) + 5);
            });
        });
        
        // Add timestamp footer
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#999999';
        ctx.textAlign = 'left';
        ctx.fillText(`Exported: ${new Date().toLocaleString()}`, padding, canvas.height - 10);
        
        downloadCanvasAsPNG(canvas, 'issue-heatmap.png');
        console.log('[Analytics] Heatmap exported as PNG');
        if (typeof toast === 'function') toast('success', 'Heatmap exported as PNG');
        
    } catch (err) {
        console.error('[Analytics] Failed to export heatmap:', err);
        if (typeof showToast === 'function') {
            showToast('Failed to export heatmap: ' + err.message, 'error');
        } else if (typeof toast === 'function') {
            toast('error', 'Failed to export heatmap: ' + err.message);
        }
    }
}

/**
 * Helper to download canvas as PNG.
 */
function downloadCanvasAsPNG(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * Fetch and render score trend for current document.
 * v3.0.33 Chunk E: Called after review completes.
 * 
 * @param {string} filename - Document filename
 */
async function fetchAndRenderScoreTrend(filename) {
    if (!filename) return;
    
    try {
        const response = await api(`/score-trend?filename=${encodeURIComponent(filename)}&limit=10`);
        if (response.success && response.data && response.data.trend) {
            renderScoreSparkline(response.data.trend);
        }
    } catch (err) {
        console.warn('[Analytics] Could not fetch score trend:', err);
        // Hide sparkline card on error
        const card = document.getElementById('score-trend-card');
        if (card) card.style.display = 'none';
    }
}

function getScoreColor(score) {
    if (window.TWR?.Renderers?.getScoreColor) {
        return TWR.Renderers.getScoreColor(score);
    }
    // Inline fallback
    if (score >= 90) return '#28A745';
    if (score >= 80) return '#17A2B8';
    if (score >= 70) return '#FFC107';
    if (score >= 60) return '#FD7E14';
    return '#DC3545';
}

// ============================================================
// FILTERING & SORTING
// ============================================================

// Filter state for persistence
const FilterState = {
    chartFilter: null,      // { type: 'severity'|'category', value: string }
    categorySearch: '',
    
    save() {
        try {
            localStorage.setItem('twr_filters', JSON.stringify({
                severities: Array.from(document.querySelectorAll('.sev-filter input:checked')).map(cb => cb.id),
                categories: Array.from(document.querySelectorAll('#category-list input:checked')).map(cb => cb.dataset.category)
            }));
        } catch (e) { /* ignore */ }
    },
    
    restore() {
        try {
            const saved = JSON.parse(localStorage.getItem('twr_filters'));
            if (saved?.severities) {
                document.querySelectorAll('.sev-filter input').forEach(cb => {
                    cb.checked = saved.severities.includes(cb.id);
                });
            }
        } catch (e) { /* ignore */ }
    }
};

function applyFilters() {
    const search = document.getElementById('issue-search')?.value.toLowerCase().trim() || '';
    const severities = new Set();
    const categories = new Set();

    // v3.0.13: Get severities from unified filter bar (primary) or sidebar (fallback)
    const unifiedToggles = document.querySelectorAll('#unified-severity-toggles .sev-toggle.active');
    if (unifiedToggles.length > 0) {
        unifiedToggles.forEach(btn => {
            const sev = btn.dataset.severity;
            severities.add(sev.charAt(0).toUpperCase() + sev.slice(1));
        });
    } else {
        // Fallback to sidebar filters
        document.querySelectorAll('.sev-filter input:checked').forEach(cb => {
            const sev = cb.id.replace('filter-', '');
            severities.add(sev.charAt(0).toUpperCase() + sev.slice(1));
        });
    }

    // v3.0.13: Get categories from unified dropdown (primary) or sidebar (fallback)
    const unifiedCats = document.querySelectorAll('#unified-category-list input:checked');
    if (unifiedCats.length > 0) {
        unifiedCats.forEach(cb => categories.add(cb.dataset.category));
    } else {
        // Fallback to sidebar category filters
        document.querySelectorAll('#category-list input:checked, #category-pinned input:checked').forEach(cb => {
            categories.add(cb.dataset.category);
        });
    }

    // Apply chart filter if active
    if (FilterState.chartFilter) {
        if (FilterState.chartFilter.type === 'severity') {
            severities.clear();
            severities.add(FilterState.chartFilter.value);
        } else if (FilterState.chartFilter.type === 'category') {
            categories.clear();
            categories.add(FilterState.chartFilter.value);
        }
    }

    // Filter issues
    State.filteredIssues = State.issues.filter((issue, idx) => {
        // Custom filter (from family selection)
        if (State.filters?.customFilter && !State.filters.customFilter(issue, idx)) {
            return false;
        }
        
        // Severity filter
        if (severities.size > 0 && !severities.has(issue.severity)) return false;

        // Category filter (if any selected - empty means all)
        if (categories.size > 0 && !categories.has(issue.category)) return false;

        // v3.0.29: Validation filter
        if (FilterState.passesValidationFilter && !FilterState.passesValidationFilter(issue)) {
            return false;
        }

        // Search filter
        if (search) {
            const searchable = [
                issue.category,
                issue.severity,
                issue.message,
                issue.flagged_text,
                issue.suggestion
            ].join(' ').toLowerCase();
            if (!searchable.includes(search)) return false;
        }

        return true;
    });

    // Sort
    sortIssues();

    // Reset pagination
    State.currentPage = 1;

    // Update UI
    renderIssuesList();
    updateStats();
    updateUnifiedFilterChips();  // v3.0.13: Use unified chips
    updateChartFilterNotice();
    updateFilterResultSummary(); // v3.0.13: Update summary

    // Update clear search button
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = search ? 'block' : 'none';

    // Update filtered count
    const filteredCount = document.getElementById('filtered-count');
    if (filteredCount) {
        filteredCount.textContent = State.filteredIssues.length < State.issues.length
            ? `(${State.filteredIssues.length} of ${State.issues.length})`
            : '';
    }
    
    // Persist filters
    FilterState.save();
}

function updateFilterChips() {
    // v3.0.13: Delegate to unified filter chips
    updateUnifiedFilterChips();
}

function removeFilterChip(type, value) {
    if (type === 'severity') {
        const cb = document.getElementById(`filter-${value.toLowerCase()}`);
        if (cb) cb.checked = false;
    } else if (type === 'category') {
        document.querySelectorAll(`#category-list input[data-category="${value}"], #category-pinned input[data-category="${value}"]`).forEach(cb => {
            cb.checked = false;
        });
    } else if (type === 'chart') {
        FilterState.chartFilter = null;
    } else if (type === 'family') {
        clearFamilyFilter();
        return; // clearFamilyFilter already calls applyFilters
    }
    applyFilters();
}

function updateChartFilterNotice() {
    const notice = document.getElementById('chart-filter-notice');
    const valueSpan = document.getElementById('chart-filter-value');
    
    if (!notice) return;
    
    if (FilterState.chartFilter) {
        notice.style.display = 'flex';
        if (valueSpan) valueSpan.textContent = FilterState.chartFilter.value;
    } else {
        notice.style.display = 'none';
    }
}

function clearChartFilter() {
    FilterState.chartFilter = null;
    applyFilters();
}

function setChartFilter(type, value) {
    if (window.TWR?.Renderers?.setChartFilter) {
        return TWR.Renderers.setChartFilter(type, value);
    }
    // Fallback
    FilterState.chartFilter = { type, value };
    applyFilters();
}

function sortByColumn(column) {
    if (State.sortColumn === column) {
        State.sortDirection = State.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        State.sortColumn = column;
        State.sortDirection = 'asc';
    }

    // Update sort icons
    document.querySelectorAll('.sortable').forEach(col => {
        const icon = col.querySelector('.sort-icon');
        if (icon) {
            if (col.dataset.sort === column) {
                col.classList.add('sorted');
                icon.setAttribute('data-lucide', State.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down');
            } else {
                col.classList.remove('sorted');
            }
        }
    });
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }

    sortIssues();
    renderIssuesList();
}

function sortIssues() {
    const col = State.sortColumn;
    const dir = State.sortDirection === 'asc' ? 1 : -1;

    State.filteredIssues.sort((a, b) => {
        if (col === 'severity') {
            return dir * (SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
        }
        const aVal = (a[col] || '').toString().toLowerCase();
        const bVal = (b[col] || '').toString().toLowerCase();
        return dir * aVal.localeCompare(bVal);
    });
}

// ============================================================
// ISSUE RENDERING (Delegated to TWR.Renderers)
// ============================================================
function renderIssuesList() {
    if (window.TWR?.Renderers?.renderIssuesList) {
        return TWR.Renderers.renderIssuesList();
    }
    // Minimal fallback
    const container = document.getElementById('issues-list');
    if (container) container.innerHTML = '<div class="empty-issues"><p>Renderers module not loaded</p></div>';
}

function updatePagination(start, end, total) {
    if (window.TWR?.Renderers?.updatePagination) {
        return TWR.Renderers.updatePagination(start, end, total);
    }
}

function changePage(delta) {
    if (window.TWR?.Renderers?.changePage) {
        return TWR.Renderers.changePage(delta);
    }
}

function navigateIssues(direction) {
    if (window.TWR?.Renderers?.navigateIssues) {
        return TWR.Renderers.navigateIssues(direction);
    }
}

// ============================================================
// SELECTION (Delegated to TWR.Renderers)
// ============================================================
function toggleIssueSelection(index) {
    if (window.TWR?.Renderers?.toggleIssueSelection) {
        return TWR.Renderers.toggleIssueSelection(index);
    }
    // Fallback - v3.0.35: Use centralized key helper
    const issue = State.filteredIssues[index];
    const issueId = getIssueKey(issue, index);
    if (State.selectedIssues.has(issueId)) {
        State.selectedIssues.delete(issueId);
    } else {
        State.selectedIssues.add(issueId);
    }
    updateSelectionUI();
}

function selectIssues(mode) {
    if (window.TWR?.Renderers?.selectIssues) {
        return TWR.Renderers.selectIssues(mode);
    }
    // Fallback - v3.0.35: Use centralized key helper
    if (mode === 'all') {
        State.filteredIssues.forEach((issue, i) => {
            const issueId = getIssueKey(issue, i);
            State.selectedIssues.add(issueId);
        });
    } else {
        State.selectedIssues.clear();
    }
    updateSelectionUI();
    renderIssuesList();
}

function isIssueSelected(index) {
    if (window.TWR?.Renderers?.isIssueSelected) {
        return TWR.Renderers.isIssueSelected(index);
    }
    // Fallback - v3.0.35: Use centralized key helper
    const issue = State.filteredIssues[index];
    const issueId = getIssueKey(issue, index);
    return State.selectedIssues.has(issueId);
}

function updateSelectionUI() {
    if (window.TWR?.Renderers?.updateSelectionUI) {
        return TWR.Renderers.updateSelectionUI();
    }
    // Fallback
    const selCount = document.getElementById('selection-count');
    if (selCount) selCount.textContent = `${State.selectedIssues.size} selected`;
}

// ============================================================
// CHARTS (Delegated to TWR.Renderers)
// ============================================================
function renderCharts(data) {
    if (window.TWR?.Renderers?.renderCharts) {
        return TWR.Renderers.renderCharts(data);
    }
    // No fallback - charts just won't render
}

// ============================================================
// ROLES (Delegated to TWR.Roles module)
// ============================================================
// All roles functionality has been extracted to features/roles.js
// Functions are accessed via TWR.Roles.* or global aliases

function renderRolesSummary() {
    if (window.TWR?.Roles?.renderRolesSummary) {
        return TWR.Roles.renderRolesSummary();
    }
}

async function showRolesModal() {
    if (window.TWR?.Roles?.showRolesModal) {
        return TWR.Roles.showRolesModal();
    }
}

function initRolesTabs() {
    if (window.TWR?.Roles?.initRolesTabs) {
        return TWR.Roles.initRolesTabs();
    }
}

function renderRolesOverview() {
    if (window.TWR?.Roles?.renderRolesOverview) {
        return TWR.Roles.renderRolesOverview();
    }
}

function renderRolesDetails() {
    if (window.TWR?.Roles?.renderRolesDetails) {
        return TWR.Roles.renderRolesDetails();
    }
}

function renderRolesMatrix() {
    if (window.TWR?.Roles?.renderRolesMatrix) {
        return TWR.Roles.renderRolesMatrix();
    }
}

function renderDocumentLog() {
    if (window.TWR?.Roles?.renderDocumentLog) {
        return TWR.Roles.renderDocumentLog();
    }
}

function initAdjudication() {
    if (window.TWR?.Roles?.initAdjudication) {
        return TWR.Roles.initAdjudication();
    }
}

function loadAdjudication() {
    if (window.TWR?.Roles?.loadAdjudication) {
        return TWR.Roles.loadAdjudication();
    }
}

async function renderRolesGraph(forceRefresh = false) {
    if (window.TWR?.Roles?.renderRolesGraph) {
        return TWR.Roles.renderRolesGraph(forceRefresh);
    }
}

function initGraphControls() {
    if (window.TWR?.Roles?.initGraphControls) {
        return TWR.Roles.initGraphControls();
    }
}

function resetGraphView() {
    if (window.TWR?.Roles?.resetGraphView) {
        return TWR.Roles.resetGraphView();
    }
}

function clearNodeSelection(force = false) {
    if (window.TWR?.Roles?.clearNodeSelection) {
        return TWR.Roles.clearNodeSelection(force);
    }
}

function updateGraphWithAdjudication() {
    if (window.TWR?.Roles?.updateGraphWithAdjudication) {
        return TWR.Roles.updateGraphWithAdjudication();
    }
}

async function exportRoles(format = 'csv') {
    if (window.TWR?.Roles?.exportRoles) {
        return TWR.Roles.exportRoles(format);
    }
}

async function exportDeliverables(format = 'csv') {
    if (window.TWR?.Roles?.exportDeliverables) {
        return TWR.Roles.exportDeliverables(format);
    }
}

function downloadBlob(blob, filename) {
    if (window.TWR?.Roles?.downloadBlob) {
        return TWR.Roles.downloadBlob(blob, filename);
    }
    // Fallback implementation
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
    if (window.TWR?.Roles?.getTimestamp) {
        return TWR.Roles.getTimestamp();
    }
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

// EXPORT
// ============================================================
function showExportModal() {
    if (!State.reviewResults) {
        toast('warning', 'Please run a review first');
        return;
    }
    
    // Handle PDF vs DOCX export options
    const isPDF = State.fileType === 'pdf';
    const docxCard = document.getElementById('format-docx-card');
    const docxRadio = document.querySelector('input[name="export-format"][value="docx"]');
    const csvRadio = document.querySelector('input[name="export-format"][value="csv"]');
    const pdfNotice = document.getElementById('export-pdf-notice');
    const applyFixesGroup = document.getElementById('apply-fixes-group');
    
    if (isPDF) {
        // Disable DOCX export for PDF files
        if (docxCard) {
            docxCard.style.opacity = '0.5';
            docxCard.style.pointerEvents = 'none';
        }
        if (docxRadio) docxRadio.disabled = true;
        if (csvRadio) csvRadio.checked = true;
        if (pdfNotice) pdfNotice.style.display = 'block';
        if (applyFixesGroup) applyFixesGroup.style.display = 'none';
    } else {
        // Enable all options for DOCX files
        if (docxCard) {
            docxCard.style.opacity = '1';
            docxCard.style.pointerEvents = 'auto';
        }
        if (docxRadio) {
            docxRadio.disabled = false;
            docxRadio.checked = true;
        }
        if (pdfNotice) pdfNotice.style.display = 'none';
        if (applyFixesGroup) applyFixesGroup.style.display = 'block';
    }
    
    updateSelectionUI();
    updateExportOptions();
    showModal('modal-export');
}

/**
 * Open Export Review modal with issues based on current export mode selection
 * v2.9.4 #22: Bridge function between export modal and review modal
 */
function openExportReview() {
    const mode = document.querySelector('input[name="export-mode"]:checked')?.value || 'all';
    
    let issuesToReview;
    switch (mode) {
        case 'filtered':
            issuesToReview = State.filteredIssues;
            break;
        case 'selected':
            // v3.0.35 Fix: Use centralized getIssueKey for consistent matching
            issuesToReview = State.filteredIssues.filter((issue, i) => {
                const key = getIssueKey(issue, i);
                return State.selectedIssues.has(key);
            });
            break;
        default:
            issuesToReview = State.issues;
    }
    
    if (!issuesToReview || issuesToReview.length === 0) {
        toast('warning', 'No issues to review');
        return;
    }
    
    // Close export modal and open review modal
    closeModals();
    
    if (window.ExportReview) {
        ExportReview.open(issuesToReview);
    } else {
        toast('error', 'Export Review module not loaded');
    }
}
window.openExportReview = openExportReview;

function updateExportOptions() {
    const format = document.querySelector('input[name="export-format"]:checked')?.value || 'docx';
    const applyFixesGroup = document.getElementById('apply-fixes-group');
    
    // Hide apply fixes for non-docx formats
    if (applyFixesGroup) {
        applyFixesGroup.style.display = format === 'docx' ? 'block' : 'none';
    }
    
    // Update fixable preview with checkboxes
    populateFixPreview();
}

async function executeExport() {
    const format = document.querySelector('input[name="export-format"]:checked')?.value || 'docx';
    const mode = document.querySelector('input[name="export-mode"]:checked')?.value || 'all';
    const reviewerName = document.getElementById('export-reviewer-name')?.value || 'TechWriter Review';
    const applyFixes = document.getElementById('export-apply-fixes')?.checked || false;

    // Get issues based on mode
    let issuesToExport;
    switch (mode) {
        case 'filtered':
            issuesToExport = State.filteredIssues;
            break;
        case 'selected':
            // v3.0.35 Fix: Use centralized getIssueKey for consistent matching
            issuesToExport = State.filteredIssues.filter((issue, i) => {
                const key = getIssueKey(issue, i);
                return State.selectedIssues.has(key);
            });
            break;
        default:
            issuesToExport = State.issues;
    }

    if (issuesToExport.length === 0) {
        toast('warning', 'No issues to export');
        return;
    }

    closeModals();
    setLoading(true, `Exporting ${format.toUpperCase()}...`);

    try {
        let endpoint, body;

        switch (format) {
            case 'xlsx':
            case 'excel':
                // v3.0.35: Use enhanced XLSX endpoint
                // Send issues in body to support selected/filtered modes
                // (server session may not have current filter/selection state)
                endpoint = '/export/xlsx';
                body = {
                    mode: mode,
                    severities: null,  // Could be populated from UI severity filter
                    // v3.0.35 Fix: Include issues directly so export works
                    // regardless of server-side session state
                    issues: issuesToExport,
                    // v3.0.35: Send minimal results (score + document_info only)
                    // to reduce payload size for large documents
                    results: {
                        score: State.reviewResults?.score,
                        document_info: State.reviewResults?.document_info
                    }
                };
                break;
            case 'csv':
                endpoint = '/export/csv';
                body = { issues: issuesToExport, type: 'issues' };
                break;
            case 'pdf':
                endpoint = '/export/pdf';
                body = {
                    results: {
                        ...State.reviewResults,
                        issues: issuesToExport
                    }
                };
                break;
            case 'json':
                endpoint = '/export/json';
                body = {
                    results: {
                        ...State.reviewResults,
                        issues: issuesToExport
                    }
                };
                break;
            case 'docx':
            default:
                endpoint = '/export';
                body = {
                    issues: issuesToExport.map((issue, i) => ({ ...issue, index: i })),
                    reviewer_name: reviewerName,
                    apply_fixes: applyFixes,
                    export_type: 'docx'
                };
        }

        const response = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': State.csrfToken
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const blob = await response.blob();
            // v3.0.35: Get filename from Content-Disposition header if available
            const disposition = response.headers.get('Content-Disposition');
            let filename = `${State.filename}_review.${format === 'excel' ? 'xlsx' : format}`;
            if (disposition) {
                const match = disposition.match(/filename="?([^";\n]+)"?/);
                if (match) filename = match[1];
            }
            downloadBlob(blob, filename);
            toast('success', `Exported ${issuesToExport.length} issues to ${format.toUpperCase()}`);
        } else {
            const error = await response.json();
            toast('error', error.error || 'Export failed');
        }
    } catch (e) {
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

// ============================================================
// BASELINE
// ============================================================
async function toggleBaseline(index) {
    const issue = State.filteredIssues[index];
    if (!issue) return;

    if (!State.capabilities.database) {
        toast('info', 'Issue baseline requires database support. Enable the database in settings.');
        return;
    }

    if (!State.documentId) {
        toast('warning', 'Document must be saved to history before using baseline features');
        return;
    }

    try {
        // Create a hash of the issue for baseline matching
        const issueHash = btoa(JSON.stringify({
            category: issue.category,
            message: issue.message,
            flagged_text: issue.flagged_text?.substring(0, 100)
        })).substring(0, 32);

        const isBaselined = issue._baselined || false;
        
        if (isBaselined) {
            // Remove from baseline
            const result = await api('/baseline/remove', 'POST', {
                doc_id: State.documentId,
                issue_hash: issueHash
            });
            
            if (result.success) {
                issue._baselined = false;
                toast('success', 'Issue removed from baseline');
            }
        } else {
            // Add to baseline
            const result = await api('/baseline/add', 'POST', {
                doc_id: State.documentId,
                issue_hash: issueHash,
                issue_data: {
                    category: issue.category,
                    severity: issue.severity,
                    message: issue.message,
                    flagged_text: issue.flagged_text?.substring(0, 200)
                },
                reason: 'User accepted'
            });
            
            if (result.success) {
                issue._baselined = true;
                toast('success', 'Issue added to baseline - will be suppressed in future reviews');
            }
        }
        
        // Re-render the issue list to update the icon
        renderIssuesList();
        
    } catch (e) {
        toast('error', 'Failed to update baseline: ' + e.message);
    }
}

// ============================================================
// HISTORY
// ============================================================
async function saveToHistory(durationMs) {
    try {
        await api('/history/save', 'POST', {
            filepath: State.filepath,
            filename: State.filename,
            results: State.reviewResults,
            duration_ms: durationMs
        });
    } catch (e) {
        console.warn('[TWR] Failed to save to history:', e);
    }
}

// ============================================================
// SESSION STATE (Back Button Support)
// ============================================================
function saveSessionState() {
    try {
        const stateToSave = {
            filename: State.filename,
            filepath: State.filepath,
            reviewResults: State.reviewResults,
            issues: State.issues,
            roles: State.roles,
            documentId: State.documentId,
            timestamp: Date.now()
        };
        sessionStorage.setItem('twr_session_state', JSON.stringify(stateToSave));
        console.log('[TWR] Session state saved');
    } catch (e) {
        console.warn('[TWR] Could not save session state:', e);
    }
}

function restoreSessionState() {
    try {
        const saved = sessionStorage.getItem('twr_session_state');
        if (!saved) return false;
        
        const stateData = JSON.parse(saved);
        
        // Only restore if less than 30 minutes old
        if (Date.now() - stateData.timestamp > 30 * 60 * 1000) {
            sessionStorage.removeItem('twr_session_state');
            return false;
        }
        
        // Restore state
        State.filename = stateData.filename;
        State.filepath = stateData.filepath;
        State.reviewResults = stateData.reviewResults;
        State.issues = stateData.issues || [];
        State.filteredIssues = [...State.issues];
        State.roles = stateData.roles || {};
        State.documentId = stateData.documentId;
        
        // Restore UI
        if (State.reviewResults) {
            updateResultsUI(State.reviewResults);
            updateSeverityCounts(State.reviewResults.by_severity || {});
            updateValidationCounts(); // v3.0.29: Update validation filter counts
            updateCategoryFilters(State.reviewResults.by_category || {});
            renderIssuesList();
            
            // v3.0.13: Use analytics accordion and unified filter bar
            showAnalyticsAccordion(State.reviewResults);
            showUnifiedFilterBar(State.reviewResults);
            show('issues-container');
            
            if (Object.keys(State.roles).length > 0) {
                document.getElementById('roles-chart-card')?.style.setProperty('display', 'block');
                document.getElementById('btn-roles-report').disabled = false;
                renderRolesSummary();
            }
            
            document.getElementById('btn-export').disabled = false;
            
            // Update document info display
            const titleEl = document.getElementById('doc-title');
            if (titleEl) titleEl.textContent = State.filename || 'Document';
            
            toast('info', 'Previous session restored');
            console.log('[TWR] Session state restored');
            return true;
        }
    } catch (e) {
        console.warn('[TWR] Could not restore session state:', e);
    }
    return false;
}

function clearSessionState() {
    try {
        sessionStorage.removeItem('twr_session_state');
    } catch (e) { /* ignore */ }
}

// ============================================================
// SETTINGS (v3.0.46: Uses TWR.Storage for unified persistence)
// ============================================================
function loadSettings() {
    // v3.0.46: Try unified storage first, then fallback
    let saved = null;
    if (window.TWR?.Storage?.preferences) {
        saved = TWR.Storage.preferences.getAll();
    } else {
        const rawSaved = localStorage.getItem('twr_settings');
        if (rawSaved) {
            try {
                saved = JSON.parse(rawSaved);
            } catch (e) {
                console.warn('[TWR] Failed to parse settings:', e);
            }
        }
    }
    
    if (saved) {
        Object.assign(State.settings, saved);
        applySettings();
    }
}

function saveSettings() {
    // Gather all settings from form
    State.settings.autoReview = document.getElementById('settings-auto-review')?.checked || false;
    State.settings.reviewerName = document.getElementById('settings-reviewer')?.value || '';
    State.settings.rememberChecks = document.getElementById('settings-remember-checks')?.checked !== false;
    State.settings.diagnosticsEmail = document.getElementById('settings-diagnostics-email')?.value || '';
    State.settings.maxSentenceLength = parseInt(document.getElementById('settings-max-sentence')?.value) || 40;
    State.settings.passiveThreshold = document.getElementById('settings-passive-threshold')?.value || 'moderate';
    State.settings.extractRoles = document.getElementById('settings-extract-roles')?.checked !== false;
    State.settings.pageSize = document.getElementById('settings-page-size')?.value || '50';
    State.settings.showCharts = document.getElementById('settings-show-charts')?.checked || false;
    State.settings.compactMode = document.getElementById('settings-compact-mode')?.checked || false;
    State.settings.essentialsMode = document.getElementById('settings-essentials-mode')?.checked || false;
    
    // Sharing settings
    const dictLocation = document.querySelector('input[name="dict-location"]:checked')?.value || 'local';
    State.settings.dictLocation = dictLocation;
    State.settings.sharedDictPath = document.getElementById('settings-shared-path')?.value || '';
    
    // Save shared path to server config
    if (dictLocation === 'shared' && State.settings.sharedDictPath) {
        saveSharedPathToServer(State.settings.sharedDictPath);
    } else if (dictLocation === 'local') {
        saveSharedPathToServer('');
    }

    // v3.0.46: Use unified storage if available
    if (window.TWR?.Storage?.preferences) {
        TWR.Storage.preferences.setAll(State.settings);
    } else {
        localStorage.setItem('twr_settings', JSON.stringify(State.settings));
    }
    
    applySettings();
    closeModals();
    toast('success', 'Settings saved');
}

function applySettings() {
    document.body.classList.toggle('compact-mode', State.settings.compactMode);
    document.body.classList.toggle('dark-mode', State.settings.darkMode);
    document.body.classList.toggle('essentials-mode', State.settings.essentialsMode);
    
    // Update form values
    const autoReview = document.getElementById('settings-auto-review');
    if (autoReview) autoReview.checked = State.settings.autoReview;
    
    const showCharts = document.getElementById('settings-show-charts');
    if (showCharts) showCharts.checked = State.settings.showCharts;
    
    const compactMode = document.getElementById('settings-compact-mode');
    if (compactMode) compactMode.checked = State.settings.compactMode;
    
    const essentialsMode = document.getElementById('settings-essentials-mode');
    if (essentialsMode) essentialsMode.checked = State.settings.essentialsMode;
    
    const pageSize = document.getElementById('settings-page-size');
    if (pageSize) pageSize.value = State.settings.pageSize;
}

function showSettingsModal() {
    showModal('modal-settings');
}

function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-content').forEach(c => c.style.display = 'none');
    
    document.querySelector(`.settings-tab[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`settings-${tabName}`)?.style.setProperty('display', 'block');
}

// ============================================================
// HELP
// ============================================================
function showHelpModal() {
    showModal('modal-help');
}

function switchHelpTab(tabName) {
    document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.help-section').forEach(s => s.style.display = 'none');
    
    document.querySelector(`.help-tab[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`help-${tabName}`)?.style.setProperty('display', 'block');
}

// ============================================================
// PRESETS
// ============================================================
function applyPreset(preset) {
    const checkboxes = document.querySelectorAll('[data-checker]');
    
    const presets = {
        all: () => checkboxes.forEach(cb => cb.checked = true),
        none: () => checkboxes.forEach(cb => cb.checked = false),
        reqs: () => {
            checkboxes.forEach(cb => cb.checked = false);
            ['passive_voice', 'weak_language', 'ambiguous_pronouns', 'requirements_language', 
             'testability', 'atomicity', 'tbd', 'escape_clauses', 'acronyms'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        },
        grammar: () => {
            checkboxes.forEach(cb => cb.checked = false);
            ['spelling', 'grammar', 'punctuation', 'capitalization', 'contractions',
             'sentence_length', 'repeated_words'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        },
        technical: () => {
            checkboxes.forEach(cb => cb.checked = false);
            ['acronyms', 'requirements_language', 'units', 'terminology', 'references',
             'document_structure', 'tables_figures', 'mil_std', 'do178'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        },
        // v2.9.4: New document type presets (#18)
        prop: () => {
            // PrOP - Procedure Operational: Focus on process clarity and completeness
            checkboxes.forEach(cb => cb.checked = false);
            ['passive_voice', 'weak_language', 'requirements_language', 'roles',
             'document_structure', 'lists', 'orphan_headings', 'empty_sections',
             'ambiguous_pronouns', 'testability', 'atomicity'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        },
        pal: () => {
            // PAL - Process Asset Library: Standard templates and assets
            checkboxes.forEach(cb => cb.checked = false);
            ['spelling', 'grammar', 'punctuation', 'document_structure', 'references',
             'terminology', 'consistency', 'tables_figures', 'hyperlinks'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        },
        fgost: () => {
            // FGOST - Flow Gate/Stage Gate: Decision gates and milestones
            checkboxes.forEach(cb => cb.checked = false);
            ['requirements_language', 'tbd', 'roles', 'testability', 'atomicity',
             'escape_clauses', 'weak_language', 'ambiguous_pronouns', 'document_structure'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        },
        sow: () => {
            // SOW - Statement of Work: Contract-focused checks
            checkboxes.forEach(cb => cb.checked = false);
            ['requirements_language', 'passive_voice', 'weak_language', 'escape_clauses',
             'tbd', 'ambiguous_pronouns', 'testability', 'atomicity', 'roles',
             'acronyms', 'units', 'references'].forEach(c => {
                const el = document.querySelector(`[data-checker="${c}"]`);
                if (el) el.checked = true;
            });
        }
    };

    if (presets[preset]) presets[preset]();
}

// ============================================================
// SEVERITY / CATEGORY UI UPDATES
// ============================================================
function updateSeverityCounts(bySeverity) {
    Object.entries(bySeverity).forEach(([sev, count]) => {
        const el = document.getElementById(`count-${sev.toLowerCase()}`);
        if (el) el.textContent = count;
    });
}

/**
 * v3.0.29: Update validation filter counts
 * Called after review results are processed to show validated/unvalidated counts
 */
function updateValidationCounts() {
    let validated = 0;
    let unvalidated = 0;
    
    State.issues.forEach(issue => {
        if (issue?.source?.is_validated === true) {
            validated++;
        } else {
            unvalidated++;
        }
    });
    
    // Update count badges
    const validatedCountEl = document.getElementById('validation-count-validated');
    const unvalidatedCountEl = document.getElementById('validation-count-unvalidated');
    
    if (validatedCountEl) {
        validatedCountEl.textContent = validated;
        validatedCountEl.style.display = validated > 0 ? 'inline' : 'none';
    }
    if (unvalidatedCountEl) {
        unvalidatedCountEl.textContent = unvalidated;
        unvalidatedCountEl.style.display = unvalidated > 0 ? 'inline' : 'none';
    }
    
    // Update unified filter bar counts too
    const unifiedValidated = document.getElementById('unified-count-validated');
    const unifiedUnvalidated = document.getElementById('unified-count-unvalidated');
    if (unifiedValidated) unifiedValidated.textContent = validated;
    if (unifiedUnvalidated) unifiedUnvalidated.textContent = unvalidated;
    
    // Return counts for stats display
    return { validated, unvalidated, total: State.issues.length };
}

function updateCategoryFilters(byCategory) {
    const pinnedContainer = document.getElementById('category-pinned');
    const listContainer = document.getElementById('category-list');
    if (!pinnedContainer || !listContainer) return;

    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    
    // Top 5 categories are pinned
    const pinned = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    
    pinnedContainer.innerHTML = pinned.map(([cat, count]) => `
        <label class="checkbox-label">
            <input type="checkbox" data-category="${escapeHtml(cat)}" onchange="applyFilters()">
            <span>${escapeHtml(cat)}</span>
            <span class="cat-count">${count}</span>
        </label>
    `).join('');
    
    listContainer.innerHTML = rest.map(([cat, count]) => `
        <label class="checkbox-label">
            <input type="checkbox" data-category="${escapeHtml(cat)}" onchange="applyFilters()">
            <span>${escapeHtml(cat)}</span>
            <span class="cat-count">${count}</span>
        </label>
    `).join('');
    
    if (rest.length === 0 && pinned.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">No categories found</p>';
    }
}

// ============================================================
// v3.0.13: ANALYTICS ACCORDION
// ============================================================

function showAnalyticsAccordion(data) {
    const accordion = document.getElementById('analytics-accordion');
    if (!accordion) return;
    
    // Show the accordion
    accordion.style.display = 'block';
    
    // Update inline stats summary
    const inlineStats = document.getElementById('analytics-inline-stats');
    if (inlineStats && data.by_severity) {
        const chips = [];
        const sevOrder = ['Critical', 'High', 'Medium', 'Low', 'Info'];
        for (const sev of sevOrder) {
            const count = data.by_severity[sev] || 0;
            if (count > 0 && sev !== 'Info') {
                chips.push(`<span class="stat-chip ${sev.toLowerCase()}">${count} ${sev}</span>`);
            }
        }
        if (chips.length === 0) {
            chips.push('<span class="stat-chip">No critical issues</span>');
        }
        inlineStats.innerHTML = chips.join('');
    }
    
    // Set initial expanded state based on settings
    if (State.settings.showCharts) {
        expandAnalytics();
    } else {
        collapseAnalytics();
    }
    
    // Render charts (they'll be visible when expanded)
    renderCharts(data);
    
    // Show roles if available
    if (Object.keys(State.roles).length > 0) {
        document.getElementById('roles-chart-card')?.style.setProperty('display', 'block');
        document.getElementById('btn-roles-report').disabled = false;
        renderRolesSummary();
    }
}

function expandAnalytics() {
    const accordion = document.getElementById('analytics-accordion');
    const body = document.getElementById('analytics-body');
    if (!accordion || !body) return;
    
    accordion.classList.add('expanded');
    body.style.display = 'flex';
    
    // Re-render charts when expanding (canvas might have been hidden)
    if (State.reviewResults) {
        setTimeout(() => renderCharts(State.reviewResults), 50);
    }
}

function collapseAnalytics() {
    const accordion = document.getElementById('analytics-accordion');
    const body = document.getElementById('analytics-body');
    if (!accordion || !body) return;
    
    accordion.classList.remove('expanded');
    body.style.display = 'none';
}

function toggleAnalytics() {
    const accordion = document.getElementById('analytics-accordion');
    if (!accordion) return;
    
    if (accordion.classList.contains('expanded')) {
        collapseAnalytics();
    } else {
        expandAnalytics();
    }
}

// ============================================================
// v3.0.13: UNIFIED FILTER BAR
// ============================================================

function showUnifiedFilterBar(data) {
    const filterBar = document.getElementById('unified-filter-bar');
    if (!filterBar) return;
    
    filterBar.style.display = 'flex';
    
    // Update severity counts
    if (data.by_severity) {
        Object.entries(data.by_severity).forEach(([sev, count]) => {
            const el = document.getElementById(`unified-count-${sev.toLowerCase()}`);
            if (el) el.textContent = count;
        });
    }
    
    // Populate category dropdown
    updateUnifiedCategoryDropdown(data.by_category || {});
    
    // Update filter result summary
    updateFilterResultSummary();
}

function updateUnifiedCategoryDropdown(byCategory) {
    const list = document.getElementById('unified-category-list');
    if (!list) return;
    
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    
    list.innerHTML = sorted.map(([cat, count]) => `
        <label>
            <input type="checkbox" data-category="${escapeHtml(cat)}" checked>
            <span>${escapeHtml(cat)}</span>
            <span class="cat-count" style="margin-left:auto;color:var(--text-muted);font-size:11px;">${count}</span>
        </label>
    `).join('');
    
    // Add change handlers
    list.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', () => {
            applyUnifiedFilters();
        });
    });
}

// v3.0.13: Alias for backwards compatibility - all filtering now goes through applyFilters()
function applyUnifiedFilters() {
    applyFilters();
}

function updateUnifiedFilterChips() {
    const container = document.getElementById('filter-chips-inline');
    const clearBtn = document.getElementById('btn-clear-filters');
    if (!container) return;
    
    const chips = [];
    
    // Chart filter chip
    if (FilterState.chartFilter) {
        chips.push({
            type: 'chart',
            value: FilterState.chartFilter.value,
            label: `Chart: ${FilterState.chartFilter.value}`
        });
    }
    
    // Family filter chip
    if (State.filters?.customFilter && State.filters?.customFilterLabel) {
        chips.push({
            type: 'family',
            value: 'custom',
            label: `Pattern: ${truncate(State.filters.customFilterLabel, 20)}`
        });
    }
    
    // v3.0.29: Validation filter chip (only show when not "all")
    if (FilterState.validationFilter) {
        chips.push({
            type: 'validation',
            value: FilterState.validationFilter,
            label: `Validation: ${FilterState.validationFilter === 'validated' ? 'Validated only' : 'Unvalidated only'}`
        });
    }
    
    // Render chips
    if (chips.length === 0) {
        container.innerHTML = '';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    
    container.innerHTML = chips.map(chip => `
        <span class="filter-chip-inline" data-type="${chip.type}" data-value="${escapeHtml(chip.value)}">
            ${escapeHtml(chip.label)}
            <i data-lucide="x"></i>
        </span>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.filter-chip-inline').forEach(chip => {
        chip.addEventListener('click', () => {
            const type = chip.dataset.type;
            if (type === 'chart') {
                FilterState.chartFilter = null;
            } else if (type === 'family') {
                clearFamilyFilter();
                return;
            } else if (type === 'validation') {
                // v3.0.29: Clear validation filter and reset UI
                FilterState.setValidationFilter(null);
                // Reset toggle button state
                document.querySelectorAll('.validation-filter-toggle .validation-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.validation === 'all');
                });
            }
            applyUnifiedFilters();
        });
    });
    
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
}

function updateFilterResultSummary() {
    const summary = document.getElementById('filter-result-summary');
    if (!summary) return;
    
    if (State.filteredIssues.length < State.issues.length) {
        summary.textContent = `Showing ${State.filteredIssues.length} of ${State.issues.length}`;
    } else {
        summary.textContent = '';
    }
}

function updateCategoryActiveCount() {
    const countEl = document.getElementById('category-active-count');
    const totalCategories = document.querySelectorAll('#unified-category-list input').length;
    const checkedCategories = document.querySelectorAll('#unified-category-list input:checked').length;
    
    if (countEl) {
        if (checkedCategories < totalCategories) {
            countEl.textContent = checkedCategories;
            countEl.style.display = 'inline-flex';
        } else {
            countEl.style.display = 'none';
        }
    }
}

function clearAllUnifiedFilters() {
    // Reset severity toggles to all active
    document.querySelectorAll('#unified-severity-toggles .sev-toggle').forEach(btn => {
        btn.classList.add('active');
    });
    
    // Check all categories
    document.querySelectorAll('#unified-category-list input').forEach(cb => {
        cb.checked = true;
    });
    
    // Clear search
    const searchInput = document.getElementById('issue-search');
    if (searchInput) searchInput.value = '';
    
    // Clear chart filter
    FilterState.chartFilter = null;
    
    // v3.0.29: Clear validation filter
    FilterState.setValidationFilter(null);
    document.querySelectorAll('.validation-filter-toggle .validation-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.validation === 'all');
    });
    
    // Clear family filter
    if (State.filters) {
        State.filters.customFilter = null;
        State.filters.customFilterLabel = null;
    }
    
    applyUnifiedFilters();
}

function setView(viewType) {
    document.getElementById('btn-view-table')?.classList.toggle('active', viewType === 'table');
    document.getElementById('btn-view-cards')?.classList.toggle('active', viewType === 'cards');
    
    const issuesList = document.getElementById('issues-list');
    if (issuesList) {
        issuesList.classList.toggle('card-view', viewType === 'cards');
    }
}

// ============================================================
// MODAL HELPERS
// ============================================================

// Track which element opened the modal for focus restoration
let modalOpenerElement = null;

function closeModals() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.body.classList.remove('modal-open');
    
    // Restore focus to opener element
    if (modalOpenerElement && document.body.contains(modalOpenerElement)) {
        modalOpenerElement.focus();
        modalOpenerElement = null;
    }
}

function showModal(modalId) {
    // Store opener for focus restoration
    modalOpenerElement = document.activeElement;
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Focus first focusable element in modal
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            setTimeout(() => focusable.focus(), 50);
        }
    }
}

// ============================================================
// API HELPER
// ============================================================
async function api(endpoint, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {}
    };

    if (method !== 'GET' && State.csrfToken) {
        opts.headers['X-CSRF-Token'] = State.csrfToken;
    }

    if (body && !(body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    } else if (body) {
        if (State.csrfToken) {
            opts.headers['X-CSRF-Token'] = State.csrfToken;
        }
        opts.body = body;
    }

    try {
        const response = await fetch(`/api${endpoint}`, opts);

        const newToken = response.headers.get('X-CSRF-Token');
        if (newToken) State.csrfToken = newToken;

        if (response.status === 403) {
            await fetchCSRFToken();
            toast('warning', 'Security token refreshed. Please try again.');
            return { success: false, error: 'CSRF token expired' };
        }

        if (response.status === 413) {
            return { success: false, error: 'File is too large. Maximum size is 50MB.' };
        }

        if (response.status === 429) {
            return { success: false, error: 'Too many requests. Please wait a moment.' };
        }

        return await response.json();
    } catch (e) {
        console.error('[TWR] API error:', e);
        return { success: false, error: e.message };
    }
}

// ============================================================
// UI HELPERS
// ============================================================
function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}

function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function setLoading(loading, message = 'Loading...', progress = 0) {
    State.isLoading = loading;
    const overlay = document.getElementById('loading-overlay');
    const msgEl = document.getElementById('loading-text');
    const progressBar = document.getElementById('loading-progress-bar');
    const stepsContainer = document.getElementById('loading-steps');
    
    // v3.0.43: Persistent run-state indicator
    const runStateIndicator = document.getElementById('run-state-indicator');
    const runStateText = document.getElementById('run-state-text');

    if (overlay) overlay.style.display = loading ? 'flex' : 'none';
    if (msgEl) msgEl.textContent = message;
    if (progressBar) progressBar.style.width = `${progress}%`;
    
    // v3.0.43: Update run-state indicator
    if (runStateIndicator) {
        runStateIndicator.style.display = loading ? 'flex' : 'none';
    }
    if (runStateText && loading) {
        // Shorten message for indicator
        const shortMsg = message.length > 30 ? message.substring(0, 27) + '...' : message;
        runStateText.textContent = shortMsg;
    }
    
    // B9: Reset steps when loading starts/stops
    if (stepsContainer) {
        if (loading) {
            stepsContainer.style.display = 'flex';
            // Reset all steps
            stepsContainer.querySelectorAll('.loading-step').forEach(step => {
                step.classList.remove('active', 'complete');
                const icon = step.querySelector('.step-icon');
                if (icon) icon.setAttribute('data-lucide', 'circle');
            });
        } else {
            stepsContainer.style.display = 'none';
        }
        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    }
}

// B9: Update loading step status
function setLoadingStep(stepName, status = 'active') {
    const stepsContainer = document.getElementById('loading-steps');
    if (!stepsContainer) return;
    
    const step = stepsContainer.querySelector(`[data-step="${stepName}"]`);
    if (!step) return;
    
    const icon = step.querySelector('.step-icon');
    
    if (status === 'active') {
        // Mark previous steps as complete
        let found = false;
        stepsContainer.querySelectorAll('.loading-step').forEach(s => {
            if (s === step) {
                found = true;
                s.classList.add('active');
                s.classList.remove('complete');
                if (icon) icon.setAttribute('data-lucide', 'loader');
            } else if (!found) {
                s.classList.remove('active');
                s.classList.add('complete');
                const sIcon = s.querySelector('.step-icon');
                if (sIcon) sIcon.setAttribute('data-lucide', 'check-circle');
            }
        });
    } else if (status === 'complete') {
        step.classList.remove('active');
        step.classList.add('complete');
        if (icon) icon.setAttribute('data-lucide', 'check-circle');
    }
    
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
}

function updateProgress(progress, message) {
    const msgEl = document.getElementById('loading-text');
    const progressBar = document.getElementById('loading-progress-bar');
    
    if (msgEl && message) msgEl.textContent = message;
    if (progressBar) progressBar.style.width = `${progress}%`;
    
    // v3.0.43: Update run-state indicator text with progress percentage
    const runStateText = document.getElementById('run-state-text');
    if (runStateText && message) {
        // Show shortened message with progress
        const shortMsg = message.length > 20 ? message.substring(0, 17) + '...' : message;
        runStateText.textContent = `${Math.round(progress)}% - ${shortMsg}`;
    }
}

function setStatValue(id, value) {
    if (window.TWR?.Renderers?.setStatValue) {
        return TWR.Renderers.setStatValue(id, value);
    }
    // Fallback
    const el = document.getElementById(id);
    if (el) el.textContent = typeof value === 'number' ? value.toLocaleString() : value;
}

function updateStats() {
    if (window.TWR?.Renderers?.updateStats) {
        return TWR.Renderers.updateStats();
    }
    // Fallback
    setStatValue('total-issues', State.issues.length);
    setStatValue('filtered-issues', State.filteredIssues.length);
    updateSelectionUI();
}

function toggleSection(titleEl) {
    const targetId = titleEl.dataset.target;
    const target = document.getElementById(targetId);
    if (!target) return;

    const isCollapsed = target.classList.toggle('collapsed');
    titleEl.classList.toggle('active', !isCollapsed);
}

// v2.9.8: Super-section toggle (v3.0.46: uses TWR.Storage)
function toggleSuperSection(headerEl) {
    const targetId = headerEl.dataset.target;
    const target = document.getElementById(targetId);
    if (!target) return;

    const isCollapsed = target.classList.toggle('collapsed');
    headerEl.classList.toggle('active', !isCollapsed);
    
    // Save state via unified storage
    const superSectionId = headerEl.closest('.super-section')?.id;
    if (superSectionId) {
        if (window.TWR?.Storage?.ui) {
            TWR.Storage.ui.setPanelState(superSectionId, isCollapsed ? 'collapsed' : 'expanded');
        }
    }
}

// v2.9.8: Restore super-section collapse state (v3.0.46: uses TWR.Storage)
function restoreSuperSectionState() {
    document.querySelectorAll('.super-section').forEach(section => {
        const sectionId = section.id;
        const header = section.querySelector('.super-section-header');
        const content = section.querySelector('.super-section-content');
        
        if (!header || !content) return;
        
        // v3.0.46: Use unified storage if available
        const savedState = window.TWR?.Storage?.ui
            ? TWR.Storage.ui.getPanelState(sectionId)
            : null;
            
        if (savedState === 'collapsed') {
            content.classList.add('collapsed');
            header.classList.remove('active');
        } else if (savedState === 'expanded') {
            content.classList.remove('collapsed');
            header.classList.add('active');
        } else {
            // Default state: Document and Analysis expanded, Tools collapsed
            if (sectionId === 'super-analysis' || sectionId === 'super-document') {
                content.classList.remove('collapsed');
                header.classList.add('active');
            }
        }
    });
}

function toast(type, message, duration = 4000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" class="toast-icon"></i>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============================================================
// UTILITIES
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ============================================================
// SCAN HISTORY
// ============================================================
async function loadScanHistory() {
    try {
        const r = await api('/scan-history', 'GET');
        if (r.success && r.data) {
            renderScanHistory(r.data);
        } else {
            document.getElementById('scan-history-empty').style.display = 'block';
            document.querySelector('.scan-history-table').style.display = 'none';
        }
    } catch (e) {
        console.error('[TWR] Failed to load scan history:', e);
        document.getElementById('scan-history-empty').style.display = 'block';
    }
}

function renderScanHistory(history) {
    const tbody = document.getElementById('scan-history-body');
    const emptyMsg = document.getElementById('scan-history-empty');
    const table = document.querySelector('.scan-history-table');
    
    if (!history || history.length === 0) {
        emptyMsg.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    
    emptyMsg.style.display = 'none';
    table.style.display = 'block';
    
    tbody.innerHTML = history.map(scan => {
        const scanDate = new Date(scan.scan_time);
        const dateStr = scanDate.toLocaleDateString() + ' ' + scanDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let changeHtml = '<span class="change-indicator unchanged">First scan</span>';
        if (scan.issues_added > 0 || scan.issues_removed > 0) {
            changeHtml = `
                <span class="change-indicator added">+${scan.issues_added}</span>
                <span class="change-indicator removed">-${scan.issues_removed}</span>
            `;
        }
        
        return `
            <tr data-scan-id="${scan.id}">
                <td><strong>${escapeHtml(scan.filename)}</strong></td>
                <td>${dateStr}</td>
                <td>${scan.issue_count}</td>
                <td>${scan.score}</td>
                <td><span class="grade-badge grade-${scan.grade}">${scan.grade}</span></td>
                <td>${changeHtml}</td>
                <td>
                    <button class="btn btn-ghost btn-sm btn-delete-scan" 
                            data-action="delete-scan"
                            data-scan-id="${scan.id}"
                            data-filename="${escapeHtml(scan.filename)}"
                            title="Delete this scan">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Refresh icons for the new buttons
    if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
    }
}

async function deleteScanFromHistory(scanId, filename) {
    // Confirm deletion
    if (!confirm(`Delete scan record for "${filename}"?\n\nThis cannot be undone.`)) {
        return;
    }
    
    try {
        const result = await api(`/scan-history/${scanId}`, 'DELETE');
        
        if (result.success) {
            toast('success', 'Scan deleted successfully');
            // Refresh the history list
            await loadScanHistory();
        } else {
            toast('error', result.message || 'Failed to delete scan');
        }
    } catch (e) {
        console.error('[TWR] Error deleting scan:', e);
        toast('error', 'Failed to delete scan');
    }
}

// Event delegation for scan history table actions
// This avoids inline onclick handlers which are prone to quoting bugs
function initScanHistoryEventDelegation() {
    const tbody = document.getElementById('scan-history-body');
    if (!tbody) return;
    
    tbody.addEventListener('click', async (e) => {
        const button = e.target.closest('[data-action="delete-scan"]');
        if (button) {
            const scanId = parseInt(button.dataset.scanId, 10);
            const filename = button.dataset.filename;
            if (scanId && filename) {
                await deleteScanFromHistory(scanId, filename);
            }
        }
    });
}

function showScanHistoryModal() {
    loadScanHistory();
    showModal('modal-scan-history');
}

// ============================================================
// SCAN PROFILES
// ============================================================
async function loadScanProfiles() {
    try {
        const r = await api('/scan-profiles', 'GET');
        if (r.success && r.data) {
            renderProfileList(r.data);
            
            // Load default profile if exists
            const defaultProfile = r.data.find(p => p.is_default);
            if (defaultProfile && !State.reviewResults) {
                applyProfile(defaultProfile);
            }
        }
    } catch (e) {
        console.warn('[TWR] Failed to load scan profiles:', e);
    }
}

function renderProfileList(profiles) {
    const container = document.getElementById('profile-list');
    const emptyMsg = container.querySelector('.profile-empty');
    
    if (!profiles || profiles.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    
    emptyMsg.style.display = 'none';
    
    const profileHtml = profiles.map(p => `
        <div class="profile-item ${p.is_default ? 'default' : ''}" data-profile-id="${p.id}" onclick="applyProfileById(${p.id})">
            <span class="profile-item-name">${escapeHtml(p.name)}${p.is_default ? ' ★' : ''}</span>
            <div class="profile-item-actions">
                <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation(); deleteProfile(${p.id})" title="Delete">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = profileHtml + '<p class="profile-empty" style="display:none;">No saved profiles</p>';
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
}

function applyProfile(profile) {
    if (!profile || !profile.options) return;
    
    // Apply the saved options to checkboxes
    Object.entries(profile.options).forEach(([key, value]) => {
        const checkbox = document.querySelector(`[data-checker="${key.replace('check_', '')}"]`);
        if (checkbox) {
            checkbox.checked = value;
        }
    });
    
    toast('success', `Profile "${profile.name}" applied`);
}

async function applyProfileById(id) {
    try {
        const r = await api('/scan-profiles', 'GET');
        if (r.success && r.data) {
            const profile = r.data.find(p => p.id === id);
            if (profile) {
                applyProfile(profile);
            }
        }
    } catch (e) {
        toast('error', 'Failed to load profile');
    }
}

function showSaveProfileModal() {
    // Populate settings preview
    const options = gatherCurrentOptions();
    const enabledChecks = Object.entries(options)
        .filter(([k, v]) => v)
        .map(([k]) => k.replace('check_', '').replace(/_/g, ' '));
    
    const preview = document.getElementById('profile-settings-preview');
    preview.innerHTML = enabledChecks.map(c => `<li>${c}</li>`).join('');
    
    document.getElementById('profile-name').value = '';
    document.getElementById('profile-description').value = '';
    document.getElementById('profile-set-default').checked = false;
    
    showModal('modal-save-profile');
}

async function saveCurrentProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const description = document.getElementById('profile-description').value.trim();
    const setDefault = document.getElementById('profile-set-default').checked;
    
    if (!name) {
        toast('warning', 'Please enter a profile name');
        return;
    }
    
    const options = gatherCurrentOptions();
    
    try {
        const r = await api('/scan-profiles', 'POST', {
            name,
            description,
            options,
            set_default: setDefault
        });
        
        if (r.success) {
            toast('success', `Profile "${name}" saved`);
            closeModals();
            loadScanProfiles();
        } else {
            toast('error', 'Failed to save profile');
        }
    } catch (e) {
        toast('error', 'Failed to save profile');
    }
}

async function deleteProfile(id) {
    if (!confirm('Delete this profile?')) return;
    
    try {
        const r = await api(`/scan-profiles/${id}`, 'DELETE');
        if (r.success) {
            toast('success', 'Profile deleted');
            loadScanProfiles();
        }
    } catch (e) {
        toast('error', 'Failed to delete profile');
    }
}

function gatherCurrentOptions() {
    const options = {};
    document.querySelectorAll('[data-checker]').forEach(cb => {
        if (cb.checked !== undefined) {
            options[`check_${cb.dataset.checker}`] = cb.checked;
        }
    });
    return options;
}

// ============================================================
// FIX PREVIEW WITH APPROVAL
// ============================================================
// ============================================================
// BATCH 4: TIERED AUTO-FIX SYSTEM (F8, A11, E8)
// ============================================================

// Fix confidence tiers
const FixConfidenceTiers = {
    safe: {
        label: 'Safe Fixes',
        description: 'Low-risk changes that can be applied automatically',
        color: 'var(--success)',
        patterns: ['whitespace', 'double space', 'extra space', 'trailing space', 'punctuation spacing']
    },
    review: {
        label: 'Review Recommended', 
        description: 'Changes that should be reviewed before applying',
        color: 'var(--warning)',
        patterns: ['capitalize', 'passive voice', 'wordy', 'redundant', 'informal']
    },
    manual: {
        label: 'Manual Review Required',
        description: 'Complex changes requiring careful review',
        color: 'var(--error)',
        patterns: ['spelling', 'grammar', 'requirement', 'shall', 'will']
    }
};

// Classify a fix into a confidence tier
function classifyFixConfidence(issue) {
    const category = (issue.category || '').toLowerCase();
    const message = (issue.message || '').toLowerCase();
    
    for (const [tier, config] of Object.entries(FixConfidenceTiers)) {
        if (config.patterns.some(p => category.includes(p) || message.includes(p))) {
            return tier;
        }
    }
    return 'review'; // Default to review tier
}

// Group fixes by pattern for deduplication
function groupFixesByPattern(fixes) {
    const groups = new Map();
    
    fixes.forEach((fix, originalIdx) => {
        // Create a pattern key based on category + transformation type
        const category = fix.category || 'Other';
        const orig = (fix.flagged_text || '').toLowerCase().trim();
        const repl = (fix.suggestion || '').toLowerCase().trim();
        
        // Generalize the pattern (e.g., "extra space" type fixes)
        let patternKey;
        if (orig === repl.replace(/\s+/g, ' ')) {
            patternKey = `${category}|whitespace`;
        } else if (orig.length > 0 && repl.length === 0) {
            patternKey = `${category}|remove`;
        } else {
            // Use first 20 chars to group similar fixes
            patternKey = `${category}|${orig.substring(0, 20)}→${repl.substring(0, 20)}`;
        }
        
        if (!groups.has(patternKey)) {
            groups.set(patternKey, {
                category,
                representative: fix,
                fixes: [],
                indices: []
            });
        }
        groups.get(patternKey).fixes.push(fix);
        groups.get(patternKey).indices.push(originalIdx);
    });
    
    return groups;
}

// Render the tiered fix preview
function renderTieredFixPreview() {
    const fixable = State.issues.filter(i => i.suggestion && i.suggestion !== '-' && i.flagged_text);
    const container = document.getElementById('fixable-list');
    const countEl = document.getElementById('fixable-count');
    const totalEl = document.getElementById('total-fix-count');
    
    if (countEl) countEl.textContent = fixable.length;
    if (totalEl) totalEl.textContent = fixable.length;
    
    if (fixable.length === 0) {
        container.innerHTML = '<p class="fix-preview-empty">No auto-fixable issues found</p>';
        return;
    }
    
    // Store fixable issues and initialize selection
    State.fixableIssues = fixable;
    State.selectedFixes = new Set();
    
    // Classify fixes by tier
    const tiers = { safe: [], review: [], manual: [] };
    fixable.forEach((fix, idx) => {
        const tier = classifyFixConfidence(fix);
        tiers[tier].push({ fix, idx });
    });
    
    // Group fixes within each tier
    let html = '';
    
    for (const [tierName, tierConfig] of Object.entries(FixConfidenceTiers)) {
        const tierFixes = tiers[tierName];
        if (tierFixes.length === 0) continue;
        
        // Group similar fixes
        const groups = groupFixesByPattern(tierFixes.map(f => f.fix));
        
        // Select safe fixes by default
        if (tierName === 'safe') {
            tierFixes.forEach(f => State.selectedFixes.add(f.idx));
        }
        
        html += `
            <div class="fix-tier" data-tier="${tierName}">
                <div class="fix-tier-header" onclick="toggleFixTier('${tierName}')">
                    <div class="fix-tier-info">
                        <span class="fix-tier-indicator" style="background: ${tierConfig.color}"></span>
                        <span class="fix-tier-label">${tierConfig.label}</span>
                        <span class="fix-tier-count">${tierFixes.length}</span>
                    </div>
                    <div class="fix-tier-actions">
                        ${tierName === 'safe' ? `
                            <button class="btn btn-sm btn-success" onclick="selectTierFixes('${tierName}', true, event)">
                                <i data-lucide="check-circle"></i> Apply All Safe
                            </button>
                        ` : ''}
                        <i data-lucide="chevron-down" class="fix-tier-chevron"></i>
                    </div>
                </div>
                <div class="fix-tier-description">${tierConfig.description}</div>
                <div class="fix-tier-content">
        `;
        
        // Render grouped fixes
        let groupIdx = 0;
        for (const [patternKey, group] of groups) {
            const count = group.fixes.length;
            const rep = group.representative;
            const firstIdx = tierFixes.find(f => f.fix === rep)?.idx ?? 0;
            const allIndices = group.fixes.map(f => tierFixes.find(tf => tf.fix === f)?.idx).filter(i => i !== undefined);
            
            if (count > 1) {
                // Grouped display
                html += `
                    <div class="fix-group" data-indices="${allIndices.join(',')}">
                        <div class="fix-group-header">
                            <input type="checkbox" id="fix-group-${tierName}-${groupIdx}" 
                                   ${tierName === 'safe' ? 'checked' : ''} 
                                   onchange="toggleFixGroup(this, [${allIndices.join(',')}])">
                            <label for="fix-group-${tierName}-${groupIdx}">
                                <span class="fix-group-count">${count}×</span>
                                <span class="fix-group-category">${escapeHtml(group.category)}</span>
                            </label>
                        </div>
                        <div class="fix-group-example">
                            <span class="fix-from">${escapeHtml(truncate(rep.flagged_text, 25))}</span>
                            <span class="fix-arrow">→</span>
                            <span class="fix-to">${escapeHtml(truncate(rep.suggestion, 25))}</span>
                        </div>
                    </div>
                `;
            } else {
                // Single fix
                html += `
                    <div class="fix-preview-item">
                        <input type="checkbox" id="fix-${firstIdx}" 
                               ${tierName === 'safe' ? 'checked' : ''} 
                               onchange="toggleFix(${firstIdx})">
                        <label for="fix-${firstIdx}" class="fix-preview-item-text">
                            <span class="fix-from">${escapeHtml(truncate(rep.flagged_text, 30))}</span>
                            <span class="fix-arrow">→</span>
                            <span class="fix-to">${escapeHtml(truncate(rep.suggestion, 30))}</span>
                        </label>
                    </div>
                `;
            }
            groupIdx++;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    updateSelectedFixCount();
}

// Toggle tier collapse/expand
function toggleFixTier(tierName) {
    const tier = document.querySelector(`.fix-tier[data-tier="${tierName}"]`);
    if (tier) {
        tier.classList.toggle('collapsed');
    }
}

// Select/deselect all fixes in a tier
function selectTierFixes(tierName, select, event) {
    if (event) event.stopPropagation();
    
    const tier = document.querySelector(`.fix-tier[data-tier="${tierName}"]`);
    if (!tier) return;
    
    tier.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = select;
        // Extract indices from the checkbox
        const match = cb.id.match(/fix-(\d+)/);
        if (match) {
            const idx = parseInt(match[1]);
            if (select) State.selectedFixes.add(idx);
            else State.selectedFixes.delete(idx);
        }
    });
    
    // Also handle group checkboxes
    tier.querySelectorAll('.fix-group').forEach(group => {
        const indices = group.dataset.indices?.split(',').map(i => parseInt(i)) || [];
        indices.forEach(idx => {
            if (select) State.selectedFixes.add(idx);
            else State.selectedFixes.delete(idx);
        });
    });
    
    updateSelectedFixCount();
}

// Toggle a group of fixes
function toggleFixGroup(checkbox, indices) {
    indices.forEach(idx => {
        if (checkbox.checked) {
            State.selectedFixes.add(idx);
        } else {
            State.selectedFixes.delete(idx);
        }
    });
    updateSelectedFixCount();
}

// Legacy function - now calls tiered version
function populateFixPreview() {
    renderTieredFixPreview();
}

function toggleFix(idx) {
    if (State.selectedFixes.has(idx)) {
        State.selectedFixes.delete(idx);
    } else {
        State.selectedFixes.add(idx);
    }
    updateSelectedFixCount();
}

function selectAllFixes(select) {
    if (!State.fixableIssues) return;
    
    State.fixableIssues.forEach((_, idx) => {
        const checkbox = document.getElementById(`fix-${idx}`);
        if (checkbox) {
            checkbox.checked = select;
        }
        if (select) {
            State.selectedFixes.add(idx);
        } else {
            State.selectedFixes.delete(idx);
        }
    });
    
    // Also update group checkboxes
    document.querySelectorAll('.fix-group input[type="checkbox"]').forEach(cb => {
        cb.checked = select;
    });
    
    updateSelectedFixCount();
}

function updateSelectedFixCount() {
    const selectedEl = document.getElementById('selected-fix-count');
    if (selectedEl) {
        selectedEl.textContent = State.selectedFixes?.size || 0;
    }
}

// ============================================================
// v2.9.9: SCORE BREAKDOWN MODAL (#47 - Actionable Quality Score)
// ============================================================

/**
 * Show the score breakdown modal with component details and improvement suggestions.
 */
function showScoreBreakdown() {
    if (!State.reviewResults) {
        toast('info', 'Scan a document first to see score breakdown');
        return;
    }
    
    const healthScore = State.reviewResults.enhanced_stats?.health_score || 
                       State.reviewResults.health_score || 
                       { total: State.reviewResults.score || 0, breakdown: {}, grade: State.reviewResults.grade || 'N/A' };
    
    const score = healthScore.total ?? State.reviewResults.score ?? 0;
    const grade = healthScore.grade ?? State.reviewResults.grade ?? '--';
    const breakdown = healthScore.breakdown || {};
    
    // Update main score display
    const scoreEl = document.getElementById('score-breakdown-value');
    const gradeEl = document.getElementById('score-breakdown-grade');
    if (scoreEl) {
        scoreEl.textContent = Math.round(score);
        scoreEl.style.color = getScoreColor(score);
    }
    if (gradeEl) {
        gradeEl.textContent = `Grade: ${grade}`;
        gradeEl.style.color = getScoreColor(score);
    }
    
    // Update component bars
    const components = [
        { id: 'severity', max: 50, value: breakdown.severity_impact ?? 25 },
        { id: 'readability', max: 15, value: breakdown.readability ?? 10 },
        { id: 'structure', max: 20, value: breakdown.structure ?? 10 },
        { id: 'completeness', max: 15, value: breakdown.completeness ?? 10 }
    ];
    
    components.forEach(comp => {
        const valueEl = document.getElementById(`score-comp-${comp.id}`);
        const barEl = document.getElementById(`score-bar-${comp.id}`);
        if (valueEl) valueEl.textContent = `${Math.round(comp.value)}/${comp.max}`;
        if (barEl) barEl.style.width = `${(comp.value / comp.max) * 100}%`;
    });
    
    // Generate improvement suggestions based on data
    const suggestions = generateImprovementSuggestions(State.reviewResults, breakdown);
    const listEl = document.getElementById('score-improvements-list');
    if (listEl) {
        listEl.innerHTML = suggestions.map(s => `
            <li style="display: flex; align-items: flex-start; gap: var(--space-2); padding: var(--space-2); background: var(--bg-secondary); border-radius: var(--radius-md);">
                <i data-lucide="${s.icon}" style="width: 16px; height: 16px; flex-shrink: 0; color: ${s.color};"></i>
                <div>
                    <strong style="font-size: var(--font-size-sm);">${s.title}</strong>
                    <p style="font-size: var(--font-size-xs); color: var(--text-muted); margin: 0;">${s.desc}</p>
                </div>
            </li>
        `).join('');
    }
    
    showModal('modal-score-breakdown');
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
}

/**
 * Generate actionable improvement suggestions based on review data.
 */
function generateImprovementSuggestions(data, breakdown) {
    const suggestions = [];
    const bySeverity = data.by_severity || {};
    const byCategory = data.by_category || {};
    
    // Priority 1: Critical and High severity issues
    const criticalCount = bySeverity['Critical'] || 0;
    const highCount = bySeverity['High'] || 0;
    
    if (criticalCount > 0) {
        suggestions.push({
            icon: 'alert-octagon',
            color: 'var(--danger)',
            title: `Fix ${criticalCount} Critical issue${criticalCount > 1 ? 's' : ''}`,
            desc: 'Critical issues have the highest impact on your score. Address these first.'
        });
    }
    
    if (highCount > 0) {
        suggestions.push({
            icon: 'alert-triangle',
            color: 'var(--warning)',
            title: `Address ${highCount} High severity issue${highCount > 1 ? 's' : ''}`,
            desc: 'High severity issues should be resolved before publication.'
        });
    }
    
    // Priority 2: Top category
    const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (topCategories.length > 0 && topCategories[0][1] > 3) {
        suggestions.push({
            icon: 'layers',
            color: 'var(--info)',
            title: `Focus on ${topCategories[0][0]} (${topCategories[0][1]} issues)`,
            desc: 'This category has the most issues. Consider a targeted review.'
        });
    }
    
    // Priority 3: Structure suggestions
    if (breakdown.structure !== undefined && breakdown.structure < 15) {
        suggestions.push({
            icon: 'layout',
            color: 'var(--accent)',
            title: 'Improve document structure',
            desc: 'Add a table of contents, clear headings, and organize into sections.'
        });
    }
    
    // Priority 4: Readability
    const readability = data.readability || {};
    if (readability.flesch_kincaid_grade > 18) {
        suggestions.push({
            icon: 'book-open',
            color: 'var(--warning)',
            title: 'Simplify complex sentences',
            desc: `Current grade level (${readability.flesch_kincaid_grade?.toFixed(1)}) may be too complex. Aim for grade 12-16.`
        });
    }
    
    // Default if no specific suggestions
    if (suggestions.length === 0) {
        suggestions.push({
            icon: 'check-circle',
            color: 'var(--success)',
            title: 'Great job!',
            desc: 'Your document is in good shape. Continue reviewing medium and low severity issues.'
        });
    }
    
    return suggestions.slice(0, 4); // Max 4 suggestions
}

window.showScoreBreakdown = showScoreBreakdown;

// ============================================================
// TRIAGE MODE - Now in TWR.Triage module (features/triage.js)
// ============================================================

// ============================================================
// ISSUE FAMILIES - Now in TWR.Families module (features/families.js)
// ============================================================
// Functions moved to module:
// - buildIssueFamilies()
// - extractMessagePattern()
// - showInlineFamiliesPanel()
// - renderInlineFamilyList()
// - getFamilyDisplayName()
// - filterByFamily()
// - clearFamilyFilter()
// - initFamiliesPanel()
// - showIssueFamilies()
// - renderFamilyList()
// - familyAction()
// - selectFamily()
// - createFamiliesModal()

// updateTriageFamilyInfo - Now in TWR.Triage module (features/triage.js)

// ============================================================
// REVIEW LOG / AUDIT TRAIL
// ============================================================

/**
 * Log a review decision for audit trail
 */
function logReviewDecision(issueId, action, note = '', reviewer = 'Reviewer') {
    const entry = {
        issue_id: issueId,
        action,
        note,
        reviewer,
        timestamp: new Date().toISOString()
    };
    
    // Remove any existing entry for this issue (update, don't duplicate)
    State.workflow.reviewLog = State.workflow.reviewLog.filter(e => e.issue_id !== issueId);
    State.workflow.reviewLog.push(entry);
    
    // Update review log count in UI
    updateReviewLogBadge();
}

/**
 * Update the review log badge count
 */
function updateReviewLogBadge() {
    const badge = document.getElementById('review-log-badge');
    if (badge) {
        const count = State.workflow.reviewLog.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

/**
 * Show the review log modal
 */
function showReviewLog() {
    const container = document.getElementById('review-log-list');
    if (!container) return;
    
    if (State.workflow.reviewLog.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="clipboard-list"></i>
                <p>No review decisions logged yet.</p>
                <p class="text-muted">Use Triage Mode or Family Actions to log decisions.</p>
            </div>
        `;
    } else {
        // Group by action for summary
        const summary = { keep: 0, suppress: 0, fixed: 0 };
        State.workflow.reviewLog.forEach(e => {
            if (summary[e.action] !== undefined) summary[e.action]++;
        });
        
        container.innerHTML = `
            <div class="review-log-summary">
                <span class="log-stat keep"><i data-lucide="check"></i> ${summary.keep} kept</span>
                <span class="log-stat suppress"><i data-lucide="eye-off"></i> ${summary.suppress} suppressed</span>
                <span class="log-stat fixed"><i data-lucide="check-circle"></i> ${summary.fixed} fixed</span>
            </div>
            <div class="review-log-entries">
                ${State.workflow.reviewLog.slice().reverse().map(entry => {
                    const issue = State.issues.find(i => i.issue_id === entry.issue_id);
                    return `
                        <div class="log-entry log-${entry.action}">
                            <div class="log-action-badge ${entry.action}">${entry.action}</div>
                            <div class="log-details">
                                <div class="log-message">${escapeHtml(truncate(issue?.message || `Issue ${entry.issue_id}`, 60))}</div>
                                ${entry.note ? `<div class="log-note text-muted">${escapeHtml(entry.note)}</div>` : ''}
                                <div class="log-meta text-muted">${formatTimestamp(entry.timestamp)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    showModal('modal-review-log');
}

/**
 * Export review log as CSV
 */
function exportReviewLog() {
    if (State.workflow.reviewLog.length === 0) {
        toast('warning', 'No review decisions to export');
        return;
    }
    
    const headers = ['Timestamp', 'Issue ID', 'Action', 'Message', 'Category', 'Severity', 'Note', 'Reviewer'];
    const rows = State.workflow.reviewLog.map(entry => {
        const issue = State.issues.find(i => i.issue_id === entry.issue_id) || {};
        return [
            entry.timestamp,
            entry.issue_id,
            entry.action,
            `"${(issue.message || '').replace(/"/g, '""')}"`,
            issue.category || '',
            issue.severity || '',
            `"${(entry.note || '').replace(/"/g, '""')}"`,
            entry.reviewer
        ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `review_log_${State.filename || 'document'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast('success', `Exported ${State.workflow.reviewLog.length} review decisions`);
}

/**
 * Clear the review log
 */
function clearReviewLog() {
    if (confirm('Clear all review decisions? This cannot be undone.')) {
        State.workflow.reviewLog = [];
        updateReviewLogBadge();
        showReviewLog();
        toast('info', 'Review log cleared');
    }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// createFamiliesModal - Now in TWR.Families module (features/families.js)

/**
 * Create the review log modal dynamically if needed
 */
function createReviewLogModal() {
    if (document.getElementById('modal-review-log')) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal modal-lg';
    modal.id = 'modal-review-log';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i data-lucide="clipboard-list"></i> Review Log (Audit Trail)</h3>
                <button class="btn btn-ghost modal-close" aria-label="Close"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <div id="review-log-list"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="clearReviewLog()">
                    <i data-lucide="trash-2"></i> Clear
                </button>
                <button class="btn btn-primary" onclick="exportReviewLog()">
                    <i data-lucide="download"></i> Export CSV
                </button>
                <button class="btn btn-ghost modal-close">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Initialize workflow modals (families modal now handled by TWR.Families module)
document.addEventListener('DOMContentLoaded', () => {
    // createFamiliesModal() - handled by TWR.Families.init()
    createReviewLogModal();
});

// triageAction review logging - Now integrated in TWR.Triage module (features/triage.js)

// Export workflow functions (families functions now exported by TWR.Families module)
// window.showIssueFamilies = handled by TWR.Families
// window.familyAction = handled by TWR.Families
// window.selectFamily = handled by TWR.Families
window.showReviewLog = showReviewLog;
window.exportReviewLog = exportReviewLog;
window.clearReviewLog = clearReviewLog;

// ============================================================
// ENHANCED SELECTION CONTROLS
// ============================================================
function initSelectionDropdown() {
    const menuBtn = document.getElementById('btn-select-menu');
    const dropdown = document.getElementById('select-dropdown');
    
    if (!menuBtn || !dropdown) return;
    
    // Toggle dropdown
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close on outside click
    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });
    
    // Selection actions
    document.getElementById('btn-select-page')?.addEventListener('click', () => {
        selectIssuesOnPage();
        dropdown.style.display = 'none';
    });
    
    document.getElementById('btn-select-filtered')?.addEventListener('click', () => {
        selectAllFiltered();
        dropdown.style.display = 'none';
    });
    
    document.getElementById('btn-select-none-menu')?.addEventListener('click', () => {
        selectIssues('none');
        dropdown.style.display = 'none';
    });
}

function selectIssuesOnPage() {
    const pageSize = State.settings.pageSize === 'all' ? State.filteredIssues.length : State.settings.pageSize;
    const start = (State.currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, State.filteredIssues.length);
    
    for (let i = start; i < end; i++) {
        const issue = State.filteredIssues[i];
        // v3.0.35 Fix: Use same key format as toggleIssueSelection
        const key = getIssueKey(issue, i);
        State.selectedIssues.add(key);
    }
    
    renderIssuesList();
    updateSelectionCount();
}

function selectAllFiltered() {
    const count = State.filteredIssues.length;
    
    // Show confirmation for large selections
    if (count > 500) {
        document.getElementById('bulk-count').textContent = count;
        showModal('modal-bulk-confirm');
        
        // Set up confirmation handler
        document.getElementById('btn-confirm-bulk').onclick = () => {
            doSelectAllFiltered();
            closeModals();
        };
    } else {
        doSelectAllFiltered();
    }
}

function doSelectAllFiltered() {
    State.filteredIssues.forEach((issue, i) => {
        // v3.0.35 Fix: Use same key format as toggleIssueSelection
        const key = getIssueKey(issue, i);
        State.selectedIssues.add(key);
    });
    
    renderIssuesList();
    updateSelectionCount();
}

/**
 * Get canonical selection key for an issue.
 * v3.0.35: Centralized to prevent key mismatch bugs.
 * 
 * @param {Object} issue - The issue object
 * @param {number} filteredIndex - Index in State.filteredIssues
 * @returns {string|number} - The canonical key for selection tracking
 */
function getIssueKey(issue, filteredIndex) {
    return issue?.issue_id ?? filteredIndex;
}

function updateSelectionCount() {
    const countEl = document.getElementById('selection-count');
    if (countEl) {
        countEl.textContent = `${State.selectedIssues.size} selected`;
    }
    
    const filteredTotal = document.getElementById('filtered-total');
    if (filteredTotal) {
        filteredTotal.textContent = State.filteredIssues.length;
    }
}

// ============================================================
// EXPANDABLE ISSUE ROWS (Delegated to TWR.Renderers)
// ============================================================
function toggleIssueExpand(index, event) {
    if (window.TWR?.Renderers?.toggleIssueExpand) {
        return TWR.Renderers.toggleIssueExpand(index, event);
    }
    // No fallback - expansion just won't work
}

/**
 * Get "Why it matters" explanation based on issue category and severity
 * Delegated to TWR.Renderers module.
 */
function getWhyItMatters(issue) {
    if (window.TWR?.Renderers?.getWhyItMatters) {
        return TWR.Renderers.getWhyItMatters(issue);
    }
    return null;
}

// ============================================================
// INIT EVENT LISTENERS FOR NEW FEATURES
// ============================================================
function initNewFeatureListeners() {
    // Scan History
    document.getElementById('btn-scan-history')?.addEventListener('click', showScanHistoryModal);
    document.getElementById('btn-refresh-history')?.addEventListener('click', loadScanHistory);
    
    // Scan Profiles
    document.getElementById('btn-save-profile')?.addEventListener('click', showSaveProfileModal);
    document.getElementById('btn-confirm-save-profile')?.addEventListener('click', saveCurrentProfile);
    
    // Fix preview controls
    document.getElementById('btn-select-all-fixes')?.addEventListener('click', () => selectAllFixes(true));
    document.getElementById('btn-deselect-all-fixes')?.addEventListener('click', () => selectAllFixes(false));
    
    // Triage mode buttons
    document.getElementById('btn-triage-mode')?.addEventListener('click', showTriageMode);
    document.getElementById('btn-triage-prev')?.addEventListener('click', () => navigateTriage(-1));
    document.getElementById('btn-triage-next')?.addEventListener('click', () => navigateTriage(1));
    document.getElementById('btn-triage-keep')?.addEventListener('click', () => triageAction('keep'));
    document.getElementById('btn-triage-suppress')?.addEventListener('click', () => triageAction('suppress'));
    document.getElementById('btn-triage-fixed')?.addEventListener('click', () => triageAction('fixed'));
    
    // Triage keyboard shortcuts handled by TWR.Triage module
    
    // Selection dropdown
    initSelectionDropdown();
    
    // Load profiles on startup
    loadScanProfiles();
}

// handleTriageKeyboard - Now in TWR.Triage module (features/triage.js)

// Call init for new features after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initNewFeatureListeners, 100);
});

// ============================================================
// GLOBAL EXPORTS
// ============================================================
window.toggleIssueSelection = toggleIssueSelection;
window.selectIssues = selectIssues;
// v3.0.35: getIssueKey exposed via TWR namespace for debug visibility only
window.TWR = window.TWR || {};
window.TWR.getIssueKey = getIssueKey;
window.applyPreset = applyPreset;
window.runReview = runReview;
window.showExportModal = showExportModal;
window.executeExport = executeExport;
window.applyFilters = applyFilters;
window.toggleBaseline = toggleBaseline;
// v3.0.49 FIX: Role functions are exported by TWR.Roles module in roles.js
// Removed broken references: showRoleDetails, exportRoles, viewDocumentRoles,
// showRolesModal, toggleMatrixCriticalFilter, changeMatrixSort, exportRaciMatrix,
// renderRolesGraph, clearNodeSelection, resetGraphView, filterFallbackTable, sortFallbackTable
window.applyProfileById = applyProfileById;
window.deleteProfile = deleteProfile;
window.toggleFix = toggleFix;
// toggleRoleCard removed - not defined
window.clearChartFilter = clearChartFilter;
window.setChartFilter = setChartFilter;
window.toggleIssueExpand = toggleIssueExpand;
// showTriageMode, closeTriageMode - Now exported by TWR.Triage module

// ============================================================
// DIAGNOSTIC EXPORT SYSTEM
// ============================================================

/**
 * Frontend error tracking - mirrors backend DiagnosticCollector
 */
const FrontendDiagnostics = {
    errors: [],
    warnings: [],
    maxErrors: 100,
    sessionStart: new Date().toISOString(),
    
    captureError(error, context = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            error_type: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack || '',
            context: {
                ...context,
                url: window.location.href,
                userAgent: navigator.userAgent,
            },
            severity: 'ERROR'
        };
        
        this.errors.push(entry);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Also send to backend if available
        this.sendToBackend(entry);
        
        return entry;
    },
    
    captureWarning(message, context = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            message,
            context,
            severity: 'WARNING'
        };
        this.warnings.push(entry);
        if (this.warnings.length > this.maxErrors) {
            this.warnings.shift();
        }
    },
    
    async sendToBackend(entry) {
        try {
            await fetch('/api/diagnostics/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': State.csrfToken
                },
                body: JSON.stringify(entry)
            });
        } catch (e) {
            // Silently fail - don't cause more errors
            console.debug('Could not send diagnostic to backend:', e);
        }
    },
    
    getState() {
        return {
            // App state (sanitized)
            filename: State.filename,
            fileType: State.fileType,
            issueCount: State.issues?.length || 0,
            filteredCount: State.filteredIssues?.length || 0,
            selectedCount: State.selectedIssues?.size || 0,
            currentPage: State.currentPage,
            sortColumn: State.sortColumn,
            sortDirection: State.sortDirection,
            settings: State.settings,
            
            // Workflow state
            reviewLogCount: State.workflow?.reviewLog?.length || 0,
            familyCount: State.workflow?.issueFamilies?.size || 0,
            
            // UI state
            activeModals: [...document.querySelectorAll('.modal.show')].map(m => m.id),
            activeTab: document.querySelector('.tab-btn.active')?.dataset?.tab || 'none',
            
            // Browser info
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            
            // Session
            sessionStart: this.sessionStart,
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
        };
    }
};

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    FrontendDiagnostics.captureError(error || new Error(message), {
        source,
        lineno,
        colno,
        type: 'uncaught'
    });
    return false; // Let default handler also run
};

// Promise rejection handler
window.onunhandledrejection = function(event) {
    FrontendDiagnostics.captureError(event.reason || new Error('Unhandled promise rejection'), {
        type: 'unhandled_rejection'
    });
};

/**
 * Show the diagnostics modal and load summary
 */
async function showDiagnosticsModal() {
    showModal('modal-diagnostics');
    
    // Load summary from backend
    try {
        const response = await fetch('/api/diagnostics/summary');
        if (response.ok) {
            const data = await response.json();
            document.getElementById('diag-session-id').textContent = data.session_id || '-';
            document.getElementById('diag-error-count').textContent = data.error_count || 0;
            document.getElementById('diag-warning-count').textContent = data.warning_count || 0;
            document.getElementById('diag-request-count').textContent = data.request_count || 0;
        }
    } catch (e) {
        // Use frontend counts if backend unavailable
        document.getElementById('diag-session-id').textContent = 'frontend-only';
        document.getElementById('diag-error-count').textContent = FrontendDiagnostics.errors.length;
        document.getElementById('diag-warning-count').textContent = FrontendDiagnostics.warnings.length;
        document.getElementById('diag-request-count').textContent = '-';
    }
    
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
}

/**
 * Capture current frontend state (button in modal)
 */
function captureFrontendState() {
    const state = FrontendDiagnostics.getState();
    FrontendDiagnostics.captureWarning('Manual state capture', state);
    toast('success', 'Current state captured for diagnostics');
    
    // Update count
    document.getElementById('diag-warning-count').textContent = 
        parseInt(document.getElementById('diag-warning-count').textContent || 0) + 1;
}

/**
 * Export diagnostics file
 */
async function exportDiagnostics() {
    const format = document.getElementById('diag-format').value;
    const includeSystem = document.getElementById('diag-include-system').checked;
    const includeRequests = document.getElementById('diag-include-requests').checked;
    
    try {
        const response = await fetch('/api/diagnostics/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': State.csrfToken
            },
            body: JSON.stringify({
                format,
                include_system_info: includeSystem,
                include_request_log: includeRequests
            })
        });
        
        if (response.ok) {
            // Download the file
            const blob = await response.blob();
            const filename = response.headers.get('Content-Disposition')?.match(/filename="?(.+)"?/)?.[1] 
                || `diagnostic_export.${format}`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            toast('success', 'Diagnostic export downloaded');
            closeModals();
        } else {
            throw new Error(`Export failed: ${response.status}`);
        }
    } catch (e) {
        // Fallback: export frontend-only diagnostics
        console.error('[TWR] Backend export failed, using frontend fallback:', e);
        exportFrontendDiagnostics(format);
    }
}

/**
 * Fallback: export frontend-only diagnostics if backend unavailable
 */
function exportFrontendDiagnostics(format = 'json') {
    const data = {
        diagnostic_export: {
            version: '2.8.2',
            export_timestamp: new Date().toISOString(),
            source: 'frontend_only',
            note: 'Backend diagnostic endpoint unavailable, frontend data only'
        },
        frontend_state: FrontendDiagnostics.getState(),
        frontend_errors: FrontendDiagnostics.errors,
        frontend_warnings: FrontendDiagnostics.warnings,
        browser_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookiesEnabled: navigator.cookieEnabled,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }
    };
    
    let content, mimeType, extension;
    
    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
    } else {
        // Text format
        content = formatFrontendDiagnosticReport(data);
        mimeType = 'text/plain';
        extension = 'txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic_export_frontend_${new Date().toISOString().slice(0,10)}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast('info', 'Frontend diagnostics exported (backend unavailable)');
    closeModals();
}

/**
 * Format frontend diagnostics as text report
 */
function formatFrontendDiagnosticReport(data) {
    const lines = [
        '=' .repeat(70),
        'TECHWRITERREVIEW FRONTEND DIAGNOSTIC REPORT',
        '=' .repeat(70),
        '',
        `Export Time: ${data.diagnostic_export.export_timestamp}`,
        `Source: ${data.diagnostic_export.source}`,
        '',
        '-'.repeat(70),
        'FRONTEND STATE',
        '-'.repeat(70),
        `File: ${data.frontend_state.filename || 'none'}`,
        `Issues: ${data.frontend_state.issueCount}`,
        `Filtered: ${data.frontend_state.filteredCount}`,
        `Selected: ${data.frontend_state.selectedCount}`,
        `Page: ${data.frontend_state.currentPage}`,
        `Errors captured: ${data.frontend_state.errorCount}`,
        `Warnings captured: ${data.frontend_state.warningCount}`,
        '',
        '-'.repeat(70),
        'BROWSER INFO',
        '-'.repeat(70),
        `User Agent: ${data.browser_info.userAgent}`,
        `Platform: ${data.browser_info.platform}`,
        `Viewport: ${data.browser_info.viewport.width}x${data.browser_info.viewport.height}`,
        '',
    ];
    
    if (data.frontend_errors.length > 0) {
        lines.push('-'.repeat(70));
        lines.push(`ERRORS (${data.frontend_errors.length})`);
        lines.push('-'.repeat(70));
        
        data.frontend_errors.slice(-20).forEach((err, i) => {
            lines.push(`[${i+1}] ${err.timestamp}`);
            lines.push(`    Type: ${err.error_type}`);
            lines.push(`    Message: ${err.message}`);
            if (err.stack) {
                lines.push(`    Stack: ${err.stack.split('\n').slice(0, 5).join('\n           ')}`);
            }
            lines.push('');
        });
    }
    
    lines.push('='.repeat(70));
    lines.push('END OF REPORT');
    lines.push('='.repeat(70));
    
    return lines.join('\n');
}

// Export diagnostic functions
window.showDiagnosticsModal = showDiagnosticsModal;
window.captureFrontendState = captureFrontendState;
window.exportDiagnostics = exportDiagnostics;
window.FrontendDiagnostics = FrontendDiagnostics;

// ============================================================
// UI FIXES v2.8.5-patch1 - Override toast function
// ============================================================

// Store original toast if it exists
if (typeof window._originalToast === 'undefined' && typeof toast === 'function') {
    window._originalToast = toast;
}

// Fixed toast function with close button and guaranteed removal
function toast(type, message, duration = 4000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    // Limit max toasts to prevent stacking
    const existingToasts = container.querySelectorAll('.toast:not(.toast-exit)');
    if (existingToasts.length >= 5) {
        // Remove oldest toast
        const oldest = existingToasts[0];
        oldest.classList.add('toast-exit');
        setTimeout(() => oldest.remove(), 300);
    }
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    toastEl.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" class="toast-icon"></i>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">&times;</button>
    `;

    container.appendChild(toastEl);
    
    // Initialize lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    }

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
        if (toastEl.parentElement) {
            toastEl.classList.add('toast-exit');
            setTimeout(() => {
                if (toastEl.parentElement) {
                    toastEl.remove();
                }
            }, 300);
        }
    }, duration);
    
    // Clear timer if manually closed
    toastEl.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(dismissTimer);
    });
}

function createToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// v3.0.11: Simplified - settings now loaded via single loadSettings() call
// This handler just syncs UI checkboxes after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Sync checkbox states with loaded settings after DOM ready
    setTimeout(() => {
        if (typeof State !== 'undefined' && State.settings) {
            const autoReviewCb = document.getElementById('settings-auto-review');
            if (autoReviewCb) autoReviewCb.checked = State.settings.autoReview || false;
            
            const rememberChecksCb = document.getElementById('settings-remember-checks');
            if (rememberChecksCb) rememberChecksCb.checked = State.settings.rememberChecks !== false;
            
            const showChartsCb = document.getElementById('settings-show-charts');
            if (showChartsCb) showChartsCb.checked = State.settings.showCharts !== false;
            
            const compactModeCb = document.getElementById('settings-compact-mode');
            if (compactModeCb) compactModeCb.checked = State.settings.compactMode || false;
            
            const diagEmail = document.getElementById('settings-diagnostics-email');
            if (diagEmail && State.settings.diagnosticsEmail) {
                diagEmail.value = State.settings.diagnosticsEmail;
            }
        }
    }, 100);
});

// v3.0.11: Removed duplicate saveSettings - now defined once in SETTINGS section above

// v3.0.11: Removed legacy patch banner

// ============================================================
// DIAGNOSTICS MODAL FIXES v2.8.5-patch2
// ============================================================

// Ensure showDiagnosticsModal is globally available and works
window.showDiagnosticsModal = async function() {
    const modal = document.getElementById('modal-diagnostics');
    if (!modal) {
        console.error('[TWR] Diagnostics modal not found');
        toast('error', 'Diagnostics modal not found');
        return;
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Load summary from backend
    try {
        const response = await fetch('/api/diagnostics/summary');
        if (response.ok) {
            const data = await response.json();
            const sessionEl = document.getElementById('diag-session-id');
            const errorEl = document.getElementById('diag-error-count');
            const warnEl = document.getElementById('diag-warning-count');
            const reqEl = document.getElementById('diag-request-count');
            
            if (sessionEl) sessionEl.textContent = data.session_id || '-';
            if (errorEl) errorEl.textContent = data.error_count || 0;
            if (warnEl) warnEl.textContent = data.warning_count || 0;
            if (reqEl) reqEl.textContent = data.request_count || 0;
        }
    } catch (e) {
        console.warn('[TWR] Could not load diagnostics summary:', e);
        // Use frontend counts if backend unavailable
        const sessionEl = document.getElementById('diag-session-id');
        if (sessionEl) sessionEl.textContent = 'frontend-only';
    }
    
    // Initialize icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    }
};

// Ensure exportDiagnostics works
// v2.9.3 B20: Fixed export not working - improved error handling and response processing
window.exportDiagnostics = async function() {
    const formatEl = document.getElementById('diag-format');
    const systemEl = document.getElementById('diag-include-system');
    const requestsEl = document.getElementById('diag-include-requests');
    
    const format = formatEl?.value || 'json';
    const includeSystem = systemEl?.checked !== false;
    const includeRequests = requestsEl?.checked !== false;
    
    // Show loading indicator
    if (typeof showLoading === 'function') {
        showLoading('Exporting diagnostics...');
    }
    
    try {
        console.log('[TWR] Exporting diagnostics, format:', format);
        
        const response = await fetch('/api/diagnostics/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': (typeof State !== 'undefined' && State.csrfToken) || 
                               document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({
                format,
                include_system_info: includeSystem,
                include_request_log: includeRequests
            })
        });
        
        console.log('[TWR] Export response status:', response.status);
        
        if (!response.ok) {
            // Try to get error message from JSON response
            const errorText = await response.text();
            let errorMsg = `Export failed: HTTP ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    errorMsg = errorJson.error;
                }
            } catch (e) {
                // Not JSON, use text
                if (errorText) errorMsg = errorText;
            }
            throw new Error(errorMsg);
        }
        
        // Check content type - v2.9.4 #20: Fixed double body consumption bug
        const contentType = response.headers.get('Content-Type') || '';
        
        // Clone response before checking JSON to avoid consuming body twice
        const responseClone = response.clone();
        
        // If JSON response, it might be an error
        if (contentType.includes('application/json')) {
            try {
                const jsonResp = await response.json();
                // If it's a JSON error response, throw
                if (jsonResp && !jsonResp.success && jsonResp.error) {
                    throw new Error(jsonResp.error);
                }
                // If JSON but success, it might be a filepath response from GET
                // Fall through to use clone for blob
            } catch (parseErr) {
                // Not valid JSON, continue with blob
            }
        }
        
        // Get as blob for file download (use clone to avoid consumed body issue)
        const blob = await responseClone.blob();
        
        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `diagnostic_export_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.${format}`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
            }
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('[TWR] Export downloaded:', filename);
        toast('success', 'Diagnostic export downloaded: ' + filename);
        closeModals();
    } catch (e) {
        console.error('[TWR] Backend export failed:', e);
        toast('error', 'Export failed: ' + e.message);
        // Try frontend-only fallback
        if (typeof exportFrontendDiagnostics === 'function') {
            console.log('[TWR] Trying frontend fallback export...');
            exportFrontendDiagnostics(format);
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
};

// Ensure captureFrontendState works
window.captureFrontendState = function() {
    toast('success', 'Current state captured for diagnostics');
    const warnEl = document.getElementById('diag-warning-count');
    if (warnEl) {
        warnEl.textContent = (parseInt(warnEl.textContent) || 0) + 1;
    }
};

// Re-attach close handlers to all modal-close buttons on page load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure all modal-close buttons work
    document.querySelectorAll('.modal-close').forEach(btn => {
        // Remove any existing listeners and add new one
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            document.body.classList.remove('modal-open');
        };
    });
    
    // Also close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        });
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            document.body.classList.remove('modal-open');
        }
    });
});

// v3.0.11: Removed legacy patch banner

// ============================================================
// EMAIL DIAGNOSTICS VIA OUTLOOK v2.8.5-patch3
// ============================================================

// Get diagnostics email from settings
function getDiagnosticsEmail() {
    // Try from State first
    if (typeof State !== 'undefined' && State.settings && State.settings.diagnosticsEmail) {
        return State.settings.diagnosticsEmail;
    }
    // Try from localStorage
    try {
        const saved = localStorage.getItem('twr_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.diagnosticsEmail) {
                return settings.diagnosticsEmail;
            }
        }
    } catch (e) {}
    // Try from DOM
    const emailInput = document.getElementById('settings-diagnostics-email');
    if (emailInput && emailInput.value) {
        return emailInput.value;
    }
    // Default
    return 'Nicholas.georgeson@gmail.com';
}

// Collect diagnostic data for email
async function collectDiagnosticData() {
    const data = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
    
    // Try to get backend diagnostics
    try {
        const response = await fetch('/api/diagnostics/summary');
        if (response.ok) {
            const summary = await response.json();
            data.backend = summary;
        }
    } catch (e) {
        data.backend = { error: 'Could not fetch backend diagnostics' };
    }
    
    // Add frontend state
    if (typeof State !== 'undefined') {
        data.frontend = {
            filename: State.filename || null,
            issueCount: State.issues?.length || 0,
            hasDocument: !!State.filename
        };
    }
    
    // Add any console errors if FrontendDiagnostics exists
    if (typeof FrontendDiagnostics !== 'undefined') {
        data.frontendErrors = FrontendDiagnostics.errors || [];
        data.frontendWarnings = FrontendDiagnostics.warnings || [];
    }
    
    return data;
}

// Format diagnostic data for email body
function formatDiagnosticsForEmail(data) {
    let body = `TechWriterReview Diagnostic Report
================================

Generated: ${data.timestamp}

SYSTEM INFORMATION
------------------
User Agent: ${data.userAgent}
URL: ${data.url}
Viewport: ${data.viewport.width}x${data.viewport.height}

`;

    if (data.backend && !data.backend.error) {
        body += `BACKEND STATUS
--------------
Session ID: ${data.backend.session_id || 'N/A'}
Errors: ${data.backend.error_count || 0}
Warnings: ${data.backend.warning_count || 0}
Requests: ${data.backend.request_count || 0}

`;
    }

    if (data.frontend) {
        body += `FRONTEND STATUS
---------------
Document Loaded: ${data.frontend.hasDocument ? 'Yes' : 'No'}
Filename: ${data.frontend.filename || 'None'}
Issues Found: ${data.frontend.issueCount}

`;
    }

    if (data.frontendErrors && data.frontendErrors.length > 0) {
        body += `FRONTEND ERRORS (${data.frontendErrors.length})
----------------
`;
        data.frontendErrors.slice(0, 10).forEach((err, i) => {
            body += `${i + 1}. ${err.message || err}\n`;
        });
        body += '\n';
    }

    if (data.frontendWarnings && data.frontendWarnings.length > 0) {
        body += `FRONTEND WARNINGS (${data.frontendWarnings.length})
-----------------
`;
        data.frontendWarnings.slice(0, 10).forEach((warn, i) => {
            body += `${i + 1}. ${warn.message || warn}\n`;
        });
        body += '\n';
    }

    body += `
================================
Please describe the issue you encountered:

[Describe the problem here]

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:

Actual behavior:

`;

    return body;
}

// Email diagnostics via Outlook (mailto: link)
// v2.9.1 D3: Export file first and provide clear path for attachment
// v2.9.3 B21: Fixed email not working - improved error handling and file path display
window.emailDiagnosticsViaOutlook = async function() {
    const toEmail = getDiagnosticsEmail();
    
    toast('info', 'Preparing diagnostic report...');
    
    // Show loading indicator
    if (typeof showLoading === 'function') {
        showLoading('Preparing email with diagnostics...');
    }
    
    try {
        // v2.9.1 D3: First export the file to get a proper attachment
        let exportedFilePath = null;
        try {
            console.log('[TWR] Exporting diagnostic file for email attachment...');
            const response = await fetch('/api/diagnostics/export?format=json', {
                method: 'GET',
                headers: {
                    'X-CSRF-Token': (typeof State !== 'undefined' && State.csrfToken) || 
                                   document.querySelector('meta[name="csrf-token"]')?.content || ''
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.filepath) {
                    exportedFilePath = result.filepath;
                    console.log('[TWR] Diagnostic file exported to:', exportedFilePath);
                }
            }
        } catch (exportErr) {
            console.warn('[TWR] Could not export diagnostic file:', exportErr);
        }
        
        // Collect diagnostic data for email body
        const data = await collectDiagnosticData();
        const body = formatDiagnosticsForEmail(data);
        
        // Create subject with timestamp
        const subject = `TechWriterReview Diagnostic Report - ${new Date().toLocaleDateString()}`;
        
        // v2.9.1 D3: Add clear instructions about the exported file
        let emailBody = body;
        if (exportedFilePath) {
            emailBody = `[ATTACHMENT REQUIRED]\n\nPlease attach the diagnostic file from:\n${exportedFilePath}\n\n---\n\nSUMMARY:\n${body}`;
        }
        
        // Encode for mailto
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(emailBody);
        
        // Build mailto URL
        const mailtoUrl = `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        
        // Check if body is too long (mailto has ~2000 char limit in some clients)
        if (mailtoUrl.length > 2000) {
            // Truncate body and add note
            let truncatedBody = '';
            if (exportedFilePath) {
                truncatedBody = `[ATTACHMENT REQUIRED]\n\nPlease attach the diagnostic file from:\n${exportedFilePath}\n\n[Report truncated - see attached file for full details]`;
            } else {
                truncatedBody = body.substring(0, 1500) + '\n\n[Report truncated - please export and attach full diagnostic file]';
            }
            const truncatedMailto = `mailto:${toEmail}?subject=${encodedSubject}&body=${encodeURIComponent(truncatedBody)}`;
            window.location.href = truncatedMailto;
            
            if (exportedFilePath) {
                toast('success', `Diagnostic file exported to: ${exportedFilePath}`, 8000);
            } else {
                toast('warning', 'Report truncated. Please also export and attach the full diagnostic file.');
            }
        } else {
            window.location.href = mailtoUrl;
            if (exportedFilePath) {
                toast('success', `Opening email. Attach file from: ${exportedFilePath}`, 8000);
            } else {
                toast('success', 'Opening Outlook...');
            }
        }
        
        // v2.9.3 B21: Always show file path modal if file was exported (more reliable than mailto)
        if (exportedFilePath) {
            setTimeout(() => {
                showDiagnosticFilePathModal(exportedFilePath);
            }, 500);
        }
        
        // Close modal after short delay
        setTimeout(() => {
            closeModals();
        }, 1000);
        
    } catch (e) {
        console.error('[TWR] Error preparing email:', e);
        toast('error', 'Failed to prepare email: ' + e.message);
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
};

// v2.9.1 D3: Show modal with file path for easy copying
function showDiagnosticFilePathModal(filepath) {
    const existingModal = document.getElementById('diagnostic-filepath-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'diagnostic-filepath-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
    
    modal.innerHTML = `
        <div style="background:var(--bg-primary, white);border-radius:8px;padding:24px;max-width:600px;margin:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 16px 0;color:var(--text-primary, #1a1a2e);">
                <i data-lucide="file-text" style="width:20px;height:20px;margin-right:8px;"></i>
                Diagnostic File Exported
            </h3>
            <p style="margin:0 0 12px 0;color:var(--text-secondary, #666);">
                Attach this file to your email:
            </p>
            <div style="background:var(--bg-secondary, #f5f5f5);padding:12px;border-radius:4px;font-family:monospace;font-size:12px;word-break:break-all;margin-bottom:16px;">
                ${escapeHtml(filepath)}
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button onclick="navigator.clipboard.writeText('${escapeHtml(filepath).replace(/'/g, "\\'")}');toast('success','Path copied!');this.textContent='Copied!'" 
                        class="btn btn-primary" style="padding:8px 16px;">
                    <i data-lucide="copy" style="width:14px;height:14px;margin-right:4px;"></i>
                    Copy Path
                </button>
                <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
}

// v3.0.11: Removed duplicate window.saveSettings override - now using single saveSettings() in SETTINGS section

// Save shared dictionary path to server config
async function saveSharedPathToServer(path) {
    try {
        const response = await fetch('/api/config/sharing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({ shared_dictionary_path: path })
        });
        const result = await response.json();
        if (!result.success) {
            console.warn('[TWR] Failed to save shared path to server:', result.error);
        }
    } catch (e) {
        console.warn('[TWR] Error saving shared path:', e);
    }
}

// Load diagnostics email setting on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved diagnostics email
    try {
        const saved = localStorage.getItem('twr_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            const emailInput = document.getElementById('settings-diagnostics-email');
            if (emailInput && settings.diagnosticsEmail) {
                emailInput.value = settings.diagnosticsEmail;
            }
            // Also update State if available
            if (typeof State !== 'undefined' && State.settings) {
                State.settings.diagnosticsEmail = settings.diagnosticsEmail || '';
            }
            
            // Load sharing settings
            if (settings.dictLocation) {
                const radio = document.getElementById(`dict-location-${settings.dictLocation}`);
                if (radio) radio.checked = true;
                toggleSharedPathGroup(settings.dictLocation === 'shared');
            }
            if (settings.sharedDictPath) {
                const pathInput = document.getElementById('settings-shared-path');
                if (pathInput) pathInput.value = settings.sharedDictPath;
            }
        }
    } catch (e) {
        console.warn('[TWR] Could not load settings:', e);
    }
    
    // Initialize sharing settings UI
    initSharingSettings();
});

// Initialize sharing settings UI
function initSharingSettings() {
    // Radio button toggle for shared path visibility
    document.querySelectorAll('input[name="dict-location"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleSharedPathGroup(e.target.value === 'shared');
        });
    });
    
    // Test connection button
    document.getElementById('btn-test-shared')?.addEventListener('click', testSharedConnection);
    
    // Settings tab change - load status when Sharing tab shown
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (e.target.dataset?.tab === 'sharing') {
                loadSharingSettingsStatus();
            }
        });
    });
}

function toggleSharedPathGroup(show) {
    const group = document.getElementById('shared-path-group');
    if (group) {
        group.style.display = show ? 'block' : 'none';
    }
}

async function testSharedConnection() {
    const pathInput = document.getElementById('settings-shared-path');
    const statusEl = document.getElementById('shared-path-status');
    const statusText = document.getElementById('shared-path-status-text');
    const testBtn = document.getElementById('btn-test-shared');
    
    if (!pathInput?.value) {
        if (statusEl) {
            statusEl.style.display = 'flex';
            statusEl.className = 'path-status error';
            statusText.textContent = 'Please enter a path first';
        }
        return;
    }
    
    // Show loading
    if (testBtn) testBtn.disabled = true;
    if (statusEl) {
        statusEl.style.display = 'flex';
        statusEl.className = 'path-status checking';
        statusText.textContent = 'Testing connection...';
    }
    
    try {
        const response = await fetch('/api/config/sharing/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({ path: pathInput.value })
        });
        const result = await response.json();
        
        if (result.success && result.data?.accessible) {
            statusEl.className = 'path-status success';
            statusText.textContent = `Connected! ${result.data.has_master_file ? 'Master file found.' : 'No master file yet.'}`;
        } else {
            statusEl.className = 'path-status error';
            statusText.textContent = result.data?.error || 'Path not accessible';
        }
    } catch (e) {
        statusEl.className = 'path-status error';
        statusText.textContent = 'Connection test failed: ' + e.message;
    } finally {
        if (testBtn) testBtn.disabled = false;
    }
}

async function loadSharingSettingsStatus() {
    try {
        const response = await fetch('/api/roles/dictionary/status');
        const result = await response.json();
        
        if (result.success) {
            const status = result.data;
            
            // Update local DB status
            const localEl = document.getElementById('status-local-db');
            if (localEl) {
                localEl.textContent = status.database?.exists 
                    ? `${status.database.role_count} roles` 
                    : 'Not created';
            }
            
            // Update master file status
            const masterEl = document.getElementById('status-master-file');
            if (masterEl) {
                masterEl.textContent = status.master_file?.exists
                    ? `${status.master_file.role_count} roles`
                    : 'Not found';
            }
            
            // Update shared location status
            const sharedEl = document.getElementById('status-shared-location');
            if (sharedEl) {
                if (status.shared_folder?.configured) {
                    sharedEl.textContent = status.shared_folder.exists
                        ? `Connected (${status.shared_folder.role_count} roles)`
                        : 'Configured but not accessible';
                } else {
                    sharedEl.textContent = 'Not configured';
                }
            }
        }
    } catch (e) {
        console.warn('[TWR] Error loading sharing status:', e);
    }
}

// v3.0.11: Removed legacy patch banner


// ============================================================
// TECHWRITERREVIEW v2.8.6 - COMPREHENSIVE FIXES
// All fixes properly integrated - replaces previous patch attempts
// ============================================================

(function() {
    'use strict';
    
    console.log('[TWR] Loading comprehensive fixes v2.8.6...');
    
    // ============================================================
    // GLOBAL FIX STATE
    // ============================================================
    const FixState = {
        fileSelectInProgress: false,
        lucideLoaded: false,
        chartJsLoaded: false,
        initialized: false
    };
    
    // ============================================================
    // FIX 1: LUCIDE ICONS - Load from CDN with proper handling
    // ============================================================
    function loadLucideIcons() {
        return new Promise((resolve) => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                console.log('[TWR] Lucide already available');
                FixState.lucideLoaded = true;
                resolve(true);
                return;
            }
            
            console.log('[TWR] Loading Lucide from CDN...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js';
            script.onload = function() {
                console.log('[TWR] Lucide loaded successfully');
                FixState.lucideLoaded = true;
                if (typeof lucide !== 'undefined') {
                    try {
                        if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
                    } catch (e) {
                        console.warn('[TWR] Lucide createIcons error:', e);
                    }
                }
                resolve(true);
            };
            script.onerror = function() {
                console.error('[TWR] Failed to load Lucide');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }
    
    // ============================================================
    // FIX 2: CHART.JS - Load from CDN with proper handling
    // ============================================================
    function loadChartJs() {
        return new Promise((resolve) => {
            if (typeof Chart !== 'undefined') {
                console.log('[TWR] Chart.js already available');
                FixState.chartJsLoaded = true;
                resolve(true);
                return;
            }
            
            console.log('[TWR] Loading Chart.js from CDN...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
            script.onload = function() {
                console.log('[TWR] Chart.js loaded successfully');
                FixState.chartJsLoaded = true;
                window.dispatchEvent(new Event('chartjs-ready'));
                resolve(true);
            };
            script.onerror = function() {
                console.error('[TWR] Failed to load Chart.js');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }
    
    // ============================================================
    // FIX 3: FILE SELECTION - Use global guards (main handler already fixed)
    // ============================================================
    function fixFileSelection() {
        // The main initEventListeners already has guards now via window._TWR_fileProcessing
        // This function just ensures the btn-open has proper guards too
        
        const btnOpen = document.getElementById('btn-open');
        if (!btnOpen) {
            console.warn('[TWR] Open button not found');
            return;
        }
        
        // Add a guard wrapper to the existing click behavior
        btnOpen.addEventListener('click', function(e) {
            if (window._TWR_fileProcessing) {
                console.log('[TWR] File processing in progress, ignoring open click');
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }, true); // Use capture phase to run first
        
        console.log('[TWR] File selection guards applied');
    }
    
    // ============================================================
    // FIX 4: CHARTS - Proper rendering with Chart.js
    // ============================================================
    window.renderCharts = function(data) {
        if (!data) {
            console.warn('[TWR] No data for charts');
            return;
        }
        
        console.log('[TWR] Rendering charts...');
        
        // Wait for Chart.js if not loaded
        if (typeof Chart === 'undefined') {
            console.log('[TWR] Chart.js not ready, waiting...');
            loadChartJs().then(() => {
                setTimeout(() => window.renderCharts(data), 100);
            });
            return;
        }
        
        renderSeverityChart(data.by_severity);
        renderCategoryChart(data.by_category);
    };
    
    function renderSeverityChart(severityData) {
        const canvas = document.getElementById('chart-severity');
        if (!canvas || !severityData) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing
        if (window.severityChartInstance) {
            window.severityChartInstance.destroy();
        }
        
        const labels = Object.keys(severityData);
        const values = Object.values(severityData);
        
        if (labels.length === 0 || values.every(v => v === 0)) {
            console.log('[TWR] No severity data to chart');
            return;
        }
        
        const colors = {
            'Critical': '#ef4444',
            'High': '#f97316',
            'Medium': '#eab308',
            'Low': '#22c55e',
            'Info': '#6366f1'
        };
        
        try {
            window.severityChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: labels.map(l => colors[l] || '#64748b'),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#94a3b8',
                                padding: 8,
                                usePointStyle: true,
                                font: { size: 11 }
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const label = labels[index];
                            if (typeof setChartFilter === 'function') {
                                setChartFilter('severity', label);
                            }
                        }
                    }
                }
            });
            console.log('[TWR] Severity chart rendered');
        } catch (e) {
            console.error('[TWR] Severity chart error:', e);
        }
    }
    
    function renderCategoryChart(categoryData) {
        const canvas = document.getElementById('chart-categories');
        if (!canvas || !categoryData) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing
        if (window.categoryChartInstance) {
            window.categoryChartInstance.destroy();
        }
        
        // Sort and take top 8
        const sorted = Object.entries(categoryData)
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        if (sorted.length === 0) {
            console.log('[TWR] No category data to chart');
            return;
        }
        
        const fullLabels = sorted.map(([k]) => k); // Keep full labels for filtering
        const displayLabels = sorted.map(([k]) => k.length > 12 ? k.substring(0, 12) + '...' : k);
        const values = sorted.map(([, v]) => v);
        
        try {
            window.categoryChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: displayLabels,
                    datasets: [{
                        label: 'Issues',
                        data: values,
                        backgroundColor: 'rgba(99, 102, 241, 0.7)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#94a3b8' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 10 } }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const label = fullLabels[index]; // Use full label for filtering
                            if (typeof setChartFilter === 'function') {
                                setChartFilter('category', label);
                            }
                        }
                    }
                }
            });
            console.log('[TWR] Category chart rendered');
        } catch (e) {
            console.error('[TWR] Category chart error:', e);
        }
    }
    
    // ============================================================
    // FIX 5: ROLES BUTTON - Enable after review completes
    // ============================================================
    function enableRolesButton() {
        const btnRoles = document.getElementById('btn-roles');
        if (btnRoles) {
            btnRoles.disabled = false;
            btnRoles.classList.remove('disabled');
            console.log('[TWR] Roles button enabled');
        }
    }
    
    // ============================================================
    // FIX 6: HISTORY BUTTON - Use existing modal system
    // v3.0.0: Improved refresh button handling, proper icon refresh
    // ============================================================
    function fixHistoryButton() {
        // The main btn-scan-history already has a handler via initNewFeatureListeners
        // We just need to ensure btn-refresh-history inside the modal works
        const btnRefresh = document.getElementById('btn-refresh-history');
        if (btnRefresh && !btnRefresh._refreshFixed) {
            btnRefresh._refreshFixed = true;
            
            // v3.0.0: Don't clone - just add the handler directly
            // Cloning can break Lucide icons
            btnRefresh.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[TWR] Refresh history clicked');
                
                // Show loading state
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Loading...';
                this.disabled = true;
                
                try {
                    if (typeof loadScanHistory === 'function') {
                        await loadScanHistory();
                        toast('success', 'Scan history refreshed');
                    }
                } catch (err) {
                    console.error('[TWR] Refresh failed:', err);
                    toast('error', 'Failed to refresh history');
                } finally {
                    // Restore button
                    this.innerHTML = originalHTML;
                    this.disabled = false;
                    // Refresh icons
                    if (typeof lucide !== 'undefined') {
                        try { lucide.createIcons(); } catch(e) {}
                    }
                }
            });
            
            // Fix the cursor style
            btnRefresh.style.cursor = 'pointer';
        }
        
        // Also ensure the main scan history button works
        const btnScanHistory = document.getElementById('btn-scan-history');
        if (btnScanHistory && !btnScanHistory._historyFixed) {
            btnScanHistory._historyFixed = true;
            btnScanHistory.disabled = false;
        }
        
        console.log('[TWR] History buttons fixed');
    }
    
    // NOTE: Removed duplicate showScanHistory() - using existing loadScanHistory() from main code
    
    // ============================================================
    // FIX 7: DIAGNOSTICS EXPORT - Use existing function, just ensure button works
    // ============================================================
    // The exportDiagnostics function is already defined elsewhere and works correctly.
    // We just need to ensure the button triggers it.
    (function ensureDiagnosticsButton() {
        const btn = document.querySelector('#modal-diagnostics .btn-primary');
        if (btn && !btn._diagnosticsFixed) {
            btn._diagnosticsFixed = true;
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof window.exportDiagnostics === 'function') {
                    window.exportDiagnostics();
                }
            });
        }
    })();
    
    // ============================================================
    // FIX 8: EMAIL DIAGNOSTICS - Include actual data
    // ============================================================
    window.emailDiagnostics = function() {
        console.log('[TWR] Creating diagnostic email...');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            session_id: window.sessionId || 'unknown',
            version: '2.8.6',
            browser: navigator.userAgent,
            url: window.location.href,
            filename: typeof State !== 'undefined' ? State.filename : 'No document',
            issues_count: typeof State !== 'undefined' ? (State.issues?.length || 0) : 0,
            errors: (window.capturedErrors || []).slice(-10)
        };
        
        const body = `
DIAGNOSTIC SUMMARY
==================
Timestamp: ${diagnostics.timestamp}
Session ID: ${diagnostics.session_id}
Version: ${diagnostics.version}

FRONTEND STATE
==============
Document: ${diagnostics.filename}
Issues Found: ${diagnostics.issues_count}

BROWSER INFO
============
${diagnostics.browser}
URL: ${diagnostics.url}

RECENT ERRORS
=============
${diagnostics.errors.map(e => `- ${e.message || e}`).join('\n') || 'No errors captured'}

ISSUE DESCRIPTION
================
[Please describe the issue you encountered]

STEPS TO REPRODUCE
==================
1. 
2. 
3. 
        `.trim();
        
        const subject = encodeURIComponent(`TechWriterReview Bug Report - ${new Date().toLocaleDateString()}`);
        const encodedBody = encodeURIComponent(body);
        const email = 'nicholas.georgeson@gmail.com';
        
        window.location.href = `mailto:${email}?subject=${subject}&body=${encodedBody}`;
    };
    
    // ============================================================
    // FIX 9: UPDATE BUTTON IN UI - Add to settings modal
    // ============================================================
    function addUpdateButtonToSettings() {
        const settingsModal = document.getElementById('modal-settings');
        if (!settingsModal) return;
        
        // Check if updates tab already exists (check both possible IDs)
        if (document.getElementById('settings-tab-updates')) return;
        if (settingsModal.querySelector('[data-tab="updates"]')) return;
        
        // Add updates tab
        const tabList = settingsModal.querySelector('.settings-tabs');
        if (tabList) {
            const updateTab = document.createElement('button');
            updateTab.className = 'settings-tab';
            updateTab.id = 'settings-tab-updates';
            updateTab.textContent = 'Updates';
            updateTab.onclick = () => {
                showSettingsModal();
                setTimeout(() => switchSettingsTab('updates'), 100);
            };
            tabList.appendChild(updateTab);
        }
        
        // Add updates panel
        const tabContent = settingsModal.querySelector('.settings-content');
        if (tabContent) {
            const updatePanel = document.createElement('div');
            updatePanel.className = 'settings-panel';
            updatePanel.id = 'settings-panel-updates';
            updatePanel.style.display = 'none';
            updatePanel.innerHTML = `
                <h4>Software Updates</h4>
                <p>Check for and apply updates to TechWriterReview.</p>
                <div class="update-actions" style="margin-top: 16px;">
                    <button class="btn btn-primary" onclick="checkForUpdates()">
                        Check for Updates
                    </button>
                </div>
                <div id="update-status" style="margin-top: 16px;"></div>
                <div id="update-list" style="margin-top: 16px;"></div>
            `;
            tabContent.appendChild(updatePanel);
        }
        
        console.log('[TWR] Update button added to settings');
    }
    
    // ============================================================
    // FIX 9: UPDATE AND BACKUP FUNCTIONS
    // ============================================================
    window.checkForUpdates = async function() {
        const statusDiv = document.getElementById('update-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<p><i data-lucide="loader" class="spin"></i> Checking for updates...</p>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        
        try {
            const result = await api('/updates/check', 'GET');
            if (result && result.success) {
                const data = result.data || {};
                // Check has_updates boolean and updates array (backend property names)
                if (data.has_updates && data.updates && data.updates.length > 0) {
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <div class="update-available" style="padding: 12px; background: var(--success-emphasis); border-radius: 8px; color: white;">
                                <strong>${data.count || data.updates.length} update(s) available</strong>
                                <button class="btn btn-sm" onclick="applyUpdates()" style="margin-left: 12px;">Apply Updates</button>
                            </div>
                        `;
                    }
                } else {
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px; color: var(--success);">
                                <i data-lucide="check-circle"></i>
                                <span>No updates available. Last checked: ${new Date().toLocaleString()}</span>
                            </div>
                        `;
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }
                }
            } else {
                if (statusDiv) {
                    statusDiv.innerHTML = '<p style="color: var(--warning);">Could not check for updates. Server may not support this feature.</p>';
                }
            }
        } catch (e) {
            console.warn('[TWR] Update check failed:', e);
            if (statusDiv) {
                statusDiv.innerHTML = '<p style="color: var(--warning);">Could not check for updates.</p>';
            }
        }
    };
    
    window.loadBackups = async function() {
        const backupList = document.getElementById('backup-list');
        if (!backupList) return;
        
        backupList.innerHTML = '<p class="help-text">Loading backups...</p>';
        
        try {
            const result = await api('/updates/backups', 'GET');
            if (result && result.success && result.data) {
                const backups = result.data;
                if (backups.length === 0) {
                    backupList.innerHTML = '<p class="help-text">No backups available.</p>';
                } else {
                    backupList.innerHTML = backups.map(b => `
                        <div class="backup-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-muted);">
                            <div>
                                <strong>${b.name || 'Backup'}</strong>
                                <span class="help-text" style="margin-left: 8px;">${b.created_at || ''}</span>
                            </div>
                            <button class="btn btn-xs btn-secondary" onclick="restoreBackup('${b.name}')">Restore</button>
                        </div>
                    `).join('');
                }
            } else {
                backupList.innerHTML = '<p class="help-text">No backups available.</p>';
            }
        } catch (e) {
            console.warn('[TWR] Failed to load backups:', e);
            backupList.innerHTML = '<p class="help-text">No backups available.</p>';
        }
    };
    
    window.restoreBackup = async function(backupName) {
        if (!confirm('Are you sure you want to restore this backup? Current files will be overwritten.')) {
            return;
        }
        
        try {
            const result = await api('/updates/restore', 'POST', { backup_name: backupName });
            if (result && result.success) {
                toast('success', 'Backup restored successfully. Please refresh the page.');
            } else {
                toast('error', result.error || 'Failed to restore backup');
            }
        } catch (e) {
            toast('error', 'Failed to restore backup');
        }
    };
    
    window.applyUpdates = async function() {
        if (!confirm('Apply all available updates? The server will restart automatically.')) return;
        
        const statusDiv = document.getElementById('update-status');
        
        try {
            // Step 1: Apply the updates
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
                        <p><i data-lucide="loader" class="spin"></i> Applying updates...</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            
            const result = await api('/updates/apply', 'POST');
            if (!result || !result.success) {
                toast('error', result?.error || 'Failed to apply updates');
                if (statusDiv) statusDiv.innerHTML = '<p style="color: var(--danger);">Update failed. Please try again.</p>';
                return;
            }
            
            // Step 2: Trigger server restart
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
                        <p><i data-lucide="loader" class="spin"></i> Updates applied. Restarting server...</p>
                        <p class="help-text" style="margin-top: 8px;">Please wait, this will take a few seconds.</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            
            // Call restart endpoint (will return before server exits)
            try {
                await api('/updates/restart', 'POST');
            } catch (e) {
                // Expected - server may close connection during restart
            }
            
            // Step 3: Poll until server is back
            await pollForServerRestart();
            
        } catch (e) {
            console.error('[TWR] Update error:', e);
            toast('error', 'Failed to apply updates');
            if (statusDiv) statusDiv.innerHTML = '<p style="color: var(--danger);">Update failed.</p>';
        }
    };
    
    /**
     * Poll the server health endpoint until it responds, then refresh the page.
     */
    async function pollForServerRestart(maxAttempts = 30, intervalMs = 1000) {
        const statusDiv = document.getElementById('update-status');
        let attempts = 0;
        
        // Wait a moment for server to actually stop
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        while (attempts < maxAttempts) {
            attempts++;
            
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
                        <p><i data-lucide="loader" class="spin"></i> Waiting for server to restart...</p>
                        <p class="help-text" style="margin-top: 8px;">Attempt ${attempts}/${maxAttempts}</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            
            try {
                const response = await fetch('/api/updates/health', { 
                    method: 'GET',
                    cache: 'no-store'
                });
                
                if (response.ok) {
                    // Server is back! Show success and refresh
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <div style="padding: 16px; background: var(--success-emphasis); border-radius: 8px; color: white;">
                                <p><i data-lucide="check-circle"></i> Server restarted successfully!</p>
                                <p style="margin-top: 8px;">Refreshing page...</p>
                            </div>
                        `;
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }
                    
                    // Brief pause to show success message, then hard refresh
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    window.location.reload(true);
                    return;
                }
            } catch (e) {
                // Server not ready yet, continue polling
            }
            
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
        // Max attempts reached
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div style="padding: 16px; background: var(--warning-emphasis); border-radius: 8px;">
                    <p><i data-lucide="alert-triangle"></i> Server is taking longer than expected.</p>
                    <p style="margin-top: 8px;">Please manually refresh the page or restart the server.</p>
                    <button class="btn btn-sm" onclick="location.reload(true)" style="margin-top: 12px;">Refresh Now</button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
    
    // Load backups when updates tab is shown
    const existingUpdateTab = document.querySelector('[data-tab="updates"]');
    if (existingUpdateTab) {
        existingUpdateTab.addEventListener('click', () => {
            setTimeout(loadBackups, 100);
        });
    }
    
    // ============================================================
    // FIX 10: LOADING STATE - Better handling
    // ============================================================
    window.setLoading = function(loading, message) {
        if (typeof State !== 'undefined') {
            State.isLoading = loading;
        }
        
        const btnReview = document.getElementById('btn-review');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (btnReview) {
            btnReview.disabled = loading;
            btnReview.innerHTML = loading 
                ? '<span class="spinner"></span> Analyzing...'
                : '<span data-lucide="play" class="icon"></span> Run Review';
            
            // Refresh icons
            if (!loading && typeof lucide !== 'undefined') {
                setTimeout(() => lucide.createIcons(), 100);
            }
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = loading ? 'flex' : 'none';
            if (message) {
                const msgEl = loadingOverlay.querySelector('.loading-message');
                if (msgEl) msgEl.textContent = message;
            }
        }
    };
    
    // ============================================================
    // FIX 11: ERROR CAPTURE - Store errors for diagnostics
    // ============================================================
    window.capturedErrors = [];
    window.consoleLog = [];
    
    const originalConsoleError = console.error;
    console.error = function(...args) {
        window.capturedErrors.push({
            timestamp: new Date().toISOString(),
            message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        });
        // Keep only last 50
        if (window.capturedErrors.length > 50) {
            window.capturedErrors.shift();
        }
        originalConsoleError.apply(console, args);
    };
    
    // ============================================================
    // FIX 12: REVIEW COMPLETION - Enable buttons and render data
    // ============================================================
    const originalRunReview = window.runReview;
    window.runReview = async function() {
        // Check if lucide is available
        if (typeof lucide === 'undefined') {
            console.error('[TWR] Lucide not loaded, loading now...');
            await loadLucideIcons();
        }
        
        // Call original if exists, otherwise do our own
        if (typeof originalRunReview === 'function') {
            return originalRunReview();
        }
    };
    
    // Hook into review completion
    function onReviewComplete(data) {
        console.log('[TWR] Review complete, enabling features...');
        
        // Enable roles button
        enableRolesButton();
        
        // Render charts
        if (data) {
            window.renderCharts(data);
        }
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 100);
        }
    }
    
    // ============================================================
    // INITIALIZATION
    // ============================================================
    async function initFixes() {
        if (FixState.initialized) return;
        FixState.initialized = true;
        
        console.log('[TWR] Initializing comprehensive fixes...');
        
        // Load required libraries
        await loadLucideIcons();
        await loadChartJs();
        
        // Fix file selection (must wait for DOM)
        fixFileSelection();
        
        // Fix history button
        fixHistoryButton();
        
        // Add update button
        addUpdateButtonToSettings();
        
        // Fix search input (ensure it triggers applyFilters)
        fixSearchInput();
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            try {
                if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
            } catch (e) {
                console.warn('[TWR] Initial icon creation failed:', e);
            }
        }
        
        console.log('[TWR] Comprehensive fixes initialized');
    }
    
    // Fix search input to ensure it works
    function fixSearchInput() {
        const searchInput = document.getElementById('issue-search');
        if (!searchInput) return;
        
        // Remove existing listeners by cloning
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        // Add fresh listener with debounce
        let searchTimeout;
        newInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (typeof applyFilters === 'function') {
                    applyFilters();
                }
            }, 300);
        });
        
        // Also handle Enter key
        newInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                if (typeof applyFilters === 'function') {
                    applyFilters();
                }
            }
        });
        
        console.log('[TWR] Search input fixed');
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFixes);
    } else {
        // DOM already loaded, run after short delay to let other scripts run
        setTimeout(initFixes, 100);
    }
    
    // Also expose for manual triggering
    window.TWR_InitFixes = initFixes;
    window.TWR_OnReviewComplete = onReviewComplete;
    
})();

// v3.0.11: Initialization complete

// ============================================================
// BATCH UPLOAD FUNCTIONALITY
// ============================================================

(function() {
    'use strict';
    
    const BatchState = {
        files: [],
        processing: false,
        results: null
    };
    
    function initBatchUpload() {
        // Single file upload button
        document.getElementById('btn-upload-single')?.addEventListener('click', () => {
            document.getElementById('file-input')?.click();
        });
        
        // Batch upload button
        document.getElementById('btn-upload-batch')?.addEventListener('click', openBatchModal);
        
        // Close modal
        document.getElementById('btn-close-batch-modal')?.addEventListener('click', closeBatchModal);
        document.getElementById('btn-cancel-batch')?.addEventListener('click', closeBatchModal);
        
        // Batch dropzone
        const batchDropzone = document.getElementById('batch-dropzone');
        const batchInput = document.getElementById('batch-file-input');
        
        if (batchDropzone) {
            batchDropzone.addEventListener('click', () => batchInput?.click());
            batchDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                batchDropzone.classList.add('drag-over');
            });
            batchDropzone.addEventListener('dragleave', () => {
                batchDropzone.classList.remove('drag-over');
            });
            batchDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                batchDropzone.classList.remove('drag-over');
                handleBatchFiles(e.dataTransfer.files);
            });
        }
        
        if (batchInput) {
            batchInput.addEventListener('change', (e) => {
                handleBatchFiles(e.target.files);
            });
        }
        
        // Start batch processing
        document.getElementById('btn-start-batch')?.addEventListener('click', startBatchProcessing);
        
        // Back from results
        document.getElementById('btn-back-from-batch')?.addEventListener('click', () => {
            document.getElementById('batch-results').style.display = 'none';
            document.getElementById('empty-state').style.display = 'flex';
        });
        
        // Modal overlay click to close
        document.querySelector('#batch-upload-modal .modal-overlay')?.addEventListener('click', closeBatchModal);
    }
    
    function openBatchModal() {
        BatchState.files = [];
        document.getElementById('batch-file-list').innerHTML = '';
        document.getElementById('btn-start-batch').disabled = true;
        document.getElementById('batch-progress').style.display = 'none';
        document.getElementById('batch-upload-modal').style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    function closeBatchModal() {
        document.getElementById('batch-upload-modal').style.display = 'none';
        BatchState.files = [];
    }
    
    function handleBatchFiles(fileList) {
        const validExtensions = ['.docx', '.pdf'];
        
        Array.from(fileList).forEach(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (validExtensions.includes(ext)) {
                // Avoid duplicates
                if (!BatchState.files.some(f => f.name === file.name)) {
                    BatchState.files.push(file);
                }
            }
        });
        
        renderBatchFileList();
    }
    
    function renderBatchFileList() {
        const container = document.getElementById('batch-file-list');
        if (!container) return;
        
        if (BatchState.files.length === 0) {
            container.innerHTML = '<p class="text-muted">No files selected</p>';
            document.getElementById('btn-start-batch').disabled = true;
            return;
        }
        
        container.innerHTML = BatchState.files.map((file, idx) => `
            <div class="batch-file-item">
                <span class="batch-file-icon"><i data-lucide="${file.name.endsWith('.pdf') ? 'file-text' : 'file'}"></i></span>
                <span class="batch-file-name">${escapeHtml(file.name)}</span>
                <span class="batch-file-size">${formatFileSize(file.size)}</span>
                <button class="btn btn-ghost btn-xs" onclick="window.removeBatchFile(${idx})">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `).join('');
        
        document.getElementById('btn-start-batch').disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    window.removeBatchFile = function(idx) {
        BatchState.files.splice(idx, 1);
        renderBatchFileList();
    };
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    async function startBatchProcessing() {
        if (BatchState.files.length === 0 || BatchState.processing) return;
        
        BatchState.processing = true;
        const progressEl = document.getElementById('batch-progress');
        const progressFill = document.getElementById('batch-progress-fill');
        const progressText = document.getElementById('batch-progress-text');
        const startBtn = document.getElementById('btn-start-batch');
        
        progressEl.style.display = 'block';
        startBtn.disabled = true;
        
        try {
            // Step 1: Upload all files
            progressText.textContent = 'Uploading files...';
            progressFill.style.width = '20%';
            
            const formData = new FormData();
            BatchState.files.forEach(file => {
                formData.append('files[]', file);
            });
            
            const uploadResponse = await fetch('/api/upload/batch', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': window.CSRF_TOKEN || ''
                },
                body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
            }
            
            // Step 2: Process/review all files
            progressText.textContent = 'Analyzing documents...';
            progressFill.style.width = '50%';
            
            const filepaths = uploadResult.data.processed.map(f => f.filepath);
            
            const reviewResponse = await fetch('/api/review/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.CSRF_TOKEN || ''
                },
                body: JSON.stringify({ filepaths })
            });
            
            const reviewResult = await reviewResponse.json();
            
            if (!reviewResult.success) {
                throw new Error(reviewResult.error || 'Review failed');
            }
            
            progressFill.style.width = '100%';
            progressText.textContent = 'Complete!';
            
            // Store results and display
            BatchState.results = reviewResult.data;
            displayBatchResults(reviewResult.data);
            
            closeBatchModal();
            
        } catch (error) {
            console.error('[TWR] Batch processing error:', error);
            progressText.textContent = 'Error: ' + error.message;
            progressFill.style.backgroundColor = 'var(--error)';
        } finally {
            BatchState.processing = false;
            startBtn.disabled = false;
        }
    }
    
    function displayBatchResults(data) {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('batch-results').style.display = 'block';
        
        // Summary cards
        const summaryEl = document.getElementById('batch-summary');
        summaryEl.innerHTML = `
            <div class="batch-summary-cards">
                <div class="stat-card">
                    <span class="stat-value">${data.summary.total_documents}</span>
                    <span class="stat-label">Documents</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${data.summary.total_issues}</span>
                    <span class="stat-label">Issues Found</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${Object.keys(data.roles_found || {}).length}</span>
                    <span class="stat-label">Unique Roles</span>
                </div>
                <div class="stat-card severity-high">
                    <span class="stat-value">${data.summary.issues_by_severity.High || 0}</span>
                    <span class="stat-label">High Severity</span>
                </div>
            </div>
        `;
        
        // Document list
        const docsEl = document.getElementById('batch-documents');
        docsEl.innerHTML = `
            <h4>Documents Processed</h4>
            <table class="batch-table">
                <thead>
                    <tr>
                        <th>Document</th>
                        <th>Issues</th>
                        <th>Roles</th>
                        <th>Words</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.documents.map(doc => `
                        <tr class="${doc.error ? 'error-row' : ''}">
                            <td>${escapeHtml(doc.filename)}</td>
                            <td>${doc.error ? '-' : doc.issue_count}</td>
                            <td>${doc.error ? '-' : doc.role_count}</td>
                            <td>${doc.error ? '-' : (doc.word_count || 0).toLocaleString()}</td>
                            <td>${doc.error ? `<span class="badge badge-error">Error</span>` : '<span class="badge badge-success">OK</span>'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    // Helper - escape HTML (may already exist)
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');
    }
    
    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBatchUpload);
    } else {
        initBatchUpload();
    }
    
})();

console.log('[TWR] Batch upload functionality loaded');

// ============================================================
// ROLE DICTIONARY MANAGEMENT
// ============================================================

(function() {
    'use strict';
    
    const DictState = {
        roles: [],
        filteredRoles: [],
        editingId: null,
        sharingStatus: null
    };
    
    function initRoleDictionary() {
        // Tab activation
        document.querySelectorAll('.roles-tab[data-tab="dictionary"]').forEach(tab => {
            tab.addEventListener('click', () => {
                loadRoleDictionary();
                loadSharingStatus();
            });
        });
        
        // Search and filters
        document.getElementById('dict-search')?.addEventListener('input', debounce(filterDictionary, 300));
        document.getElementById('dict-filter-source')?.addEventListener('change', filterDictionary);
        document.getElementById('dict-filter-category')?.addEventListener('change', filterDictionary);
        
        // Action buttons
        document.getElementById('btn-seed-dictionary')?.addEventListener('click', seedDictionary);
        document.getElementById('btn-add-role')?.addEventListener('click', () => openRoleModal());
        document.getElementById('btn-export-dictionary')?.addEventListener('click', exportDictionary);
        document.getElementById('btn-import-dictionary')?.addEventListener('click', openImportModal);
        
        // SHARING buttons
        document.getElementById('btn-sync-dictionary')?.addEventListener('click', syncDictionary);
        document.getElementById('btn-download-master')?.addEventListener('click', downloadMasterFile);
        
        // Edit modal
        document.getElementById('btn-close-role-modal')?.addEventListener('click', closeRoleModal);
        document.getElementById('btn-cancel-role')?.addEventListener('click', closeRoleModal);
        document.getElementById('btn-save-role')?.addEventListener('click', saveRole);
        
        // Import modal
        document.getElementById('btn-close-import-modal')?.addEventListener('click', closeImportModal);
        const importDropzone = document.getElementById('dict-import-dropzone');
        const importInput = document.getElementById('dict-import-file');
        
        if (importDropzone && importInput) {
            importDropzone.addEventListener('click', () => importInput.click());
            importDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                importDropzone.classList.add('drag-over');
            });
            importDropzone.addEventListener('dragleave', () => {
                importDropzone.classList.remove('drag-over');
            });
            importDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                importDropzone.classList.remove('drag-over');
                if (e.dataTransfer.files.length) {
                    importDictionaryFile(e.dataTransfer.files[0]);
                }
            });
            importInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    importDictionaryFile(e.target.files[0]);
                }
            });
        }
        
        // Modal overlays
        document.querySelector('#edit-role-modal .modal-overlay')?.addEventListener('click', closeRoleModal);
        document.querySelector('#import-dict-modal .modal-overlay')?.addEventListener('click', closeImportModal);
    }
    
    async function loadRoleDictionary() {
        try {
            const response = await fetch('/api/roles/dictionary?include_inactive=true');
            const result = await response.json();
            
            if (result.success) {
                DictState.roles = result.data.roles || [];
                filterDictionary();
                updateDictStats();
            } else {
                console.error('[TWR] Failed to load dictionary:', result.error);
            }
        } catch (error) {
            console.error('[TWR] Error loading dictionary:', error);
        }
    }
    
    function filterDictionary() {
        const searchTerm = (document.getElementById('dict-search')?.value || '').toLowerCase();
        const sourceFilter = document.getElementById('dict-filter-source')?.value || '';
        const categoryFilter = document.getElementById('dict-filter-category')?.value || '';
        
        DictState.filteredRoles = DictState.roles.filter(role => {
            // Search
            if (searchTerm) {
                const searchFields = [
                    role.role_name,
                    role.category,
                    role.description,
                    ...(role.aliases || [])
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!searchFields.includes(searchTerm)) return false;
            }
            
            // Source filter
            if (sourceFilter && role.source !== sourceFilter) return false;
            
            // Category filter
            if (categoryFilter && role.category !== categoryFilter) return false;
            
            return true;
        });
        
        renderDictionary();
    }
    
    function renderDictionary() {
        const tbody = document.getElementById('dictionary-body');
        const emptyEl = document.getElementById('dict-empty');
        
        if (!tbody) return;
        
        if (DictState.filteredRoles.length === 0) {
            tbody.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'flex';
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        tbody.innerHTML = DictState.filteredRoles.map(role => {
            const aliases = (role.aliases || []).join(', ') || '-';
            const updatedAt = role.updated_at || role.created_at;
            const updatedBy = role.updated_by || role.created_by;
            const dateStr = updatedAt ? new Date(updatedAt).toLocaleDateString() : '-';
            
            return `
                <tr class="${!role.is_active ? 'inactive-row' : ''}" data-id="${role.id}">
                    <td>
                        <strong>${escapeHtml(role.role_name)}</strong>
                        ${aliases !== '-' ? `<br><small class="text-muted">aka: ${escapeHtml(aliases)}</small>` : ''}
                    </td>
                    <td><span class="category-badge category-${(role.category || '').toLowerCase()}">${escapeHtml(role.category || 'Unknown')}</span></td>
                    <td>
                        <span class="source-badge source-${role.source}">${escapeHtml(role.source)}</span>
                        ${role.source_document ? `<br><small class="text-muted">${escapeHtml(role.source_document)}</small>` : ''}
                    </td>
                    <td>
                        ${dateStr}
                        ${updatedBy ? `<br><small class="text-muted">by ${escapeHtml(updatedBy)}</small>` : ''}
                    </td>
                    <td>
                        ${role.is_active 
                            ? '<span class="status-badge active">Active</span>' 
                            : '<span class="status-badge inactive">Inactive</span>'}
                        ${role.is_deliverable ? '<br><small class="text-muted">(deliverable)</small>' : ''}
                    </td>
                    <td>
                        <button class="btn btn-ghost btn-xs" onclick="window.editDictRole(${role.id})" title="Edit">
                            <i data-lucide="edit-2"></i>
                        </button>
                        ${role.is_active 
                            ? `<button class="btn btn-ghost btn-xs" onclick="window.toggleDictRole(${role.id}, false)" title="Deactivate">
                                <i data-lucide="eye-off"></i>
                               </button>`
                            : `<button class="btn btn-ghost btn-xs" onclick="window.toggleDictRole(${role.id}, true)" title="Activate">
                                <i data-lucide="eye"></i>
                               </button>`
                        }
                        <button class="btn btn-ghost btn-xs btn-danger" onclick="window.deleteDictRole(${role.id})" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    function updateDictStats() {
        const total = DictState.roles.length;
        const active = DictState.roles.filter(r => r.is_active).length;
        const builtin = DictState.roles.filter(r => r.source === 'builtin').length;
        
        const totalEl = document.getElementById('dict-total');
        const activeEl = document.getElementById('dict-active');
        const builtinEl = document.getElementById('dict-builtin');
        
        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (builtinEl) builtinEl.textContent = builtin;
    }
    
    async function seedDictionary() {
        if (!confirm('Add built-in roles to the dictionary? This will not overwrite existing roles.')) return;
        
        try {
            const response = await fetch('/api/roles/dictionary/seed', {
                method: 'POST',
                headers: { 'X-CSRF-Token': window.CSRF_TOKEN || '' }
            });
            const result = await response.json();
            
            if (result.success) {
                toast('success', `Added ${result.data.added} roles, ${result.data.skipped} already existed`);
                await loadRoleDictionary();
            } else {
                toast('error', result.error || 'Failed to seed dictionary');
            }
        } catch (error) {
            toast('error', 'Error seeding dictionary: ' + error.message);
        }
    }
    
    function openRoleModal(roleId = null) {
        DictState.editingId = roleId;
        const modal = document.getElementById('edit-role-modal');
        const title = document.getElementById('edit-role-title');
        
        // Clear form
        document.getElementById('edit-role-id').value = roleId || '';
        document.getElementById('edit-role-name').value = '';
        document.getElementById('edit-role-category').value = 'Custom';
        document.getElementById('edit-role-aliases').value = '';
        document.getElementById('edit-role-description').value = '';
        document.getElementById('edit-role-deliverable').checked = false;
        document.getElementById('edit-role-notes').value = '';
        
        if (roleId) {
            // Edit mode - populate form
            const role = DictState.roles.find(r => r.id === roleId);
            if (role) {
                title.textContent = 'Edit Role';
                document.getElementById('edit-role-name').value = role.role_name;
                document.getElementById('edit-role-category').value = role.category || 'Custom';
                document.getElementById('edit-role-aliases').value = (role.aliases || []).join(', ');
                document.getElementById('edit-role-description').value = role.description || '';
                document.getElementById('edit-role-deliverable').checked = role.is_deliverable;
                document.getElementById('edit-role-notes').value = role.notes || '';
            }
        } else {
            title.textContent = 'Add Role';
        }
        
        modal.style.display = 'flex';
        document.getElementById('edit-role-name').focus();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    function closeRoleModal() {
        document.getElementById('edit-role-modal').style.display = 'none';
        DictState.editingId = null;
    }
    
    async function saveRole() {
        const roleId = DictState.editingId;
        const roleName = document.getElementById('edit-role-name').value.trim();
        
        if (!roleName) {
            toast('error', 'Role name is required');
            return;
        }
        
        const aliasesStr = document.getElementById('edit-role-aliases').value;
        const aliases = aliasesStr ? aliasesStr.split(',').map(a => a.trim()).filter(Boolean) : [];
        
        const data = {
            role_name: roleName,
            category: document.getElementById('edit-role-category').value,
            aliases: aliases,
            description: document.getElementById('edit-role-description').value.trim(),
            is_deliverable: document.getElementById('edit-role-deliverable').checked,
            notes: document.getElementById('edit-role-notes').value.trim(),
            source: 'manual',
            updated_by: 'user'
        };
        
        try {
            let response;
            if (roleId) {
                // Update
                response = await fetch(`/api/roles/dictionary/${roleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': window.CSRF_TOKEN || ''
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Create
                response = await fetch('/api/roles/dictionary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': window.CSRF_TOKEN || ''
                    },
                    body: JSON.stringify(data)
                });
            }
            
            const result = await response.json();
            
            if (result.success) {
                toast('success', roleId ? 'Role updated' : 'Role added');
                closeRoleModal();
                await loadRoleDictionary();
            } else {
                toast('error', result.error || 'Failed to save role');
            }
        } catch (error) {
            toast('error', 'Error saving role: ' + error.message);
        }
    }
    
    window.editDictRole = function(roleId) {
        openRoleModal(roleId);
    };
    
    window.toggleDictRole = async function(roleId, activate) {
        try {
            const response = await fetch(`/api/roles/dictionary/${roleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.CSRF_TOKEN || ''
                },
                body: JSON.stringify({ is_active: activate, updated_by: 'user' })
            });
            
            const result = await response.json();
            if (result.success) {
                toast('success', activate ? 'Role activated' : 'Role deactivated');
                await loadRoleDictionary();
            }
        } catch (error) {
            toast('error', 'Error: ' + error.message);
        }
    };
    
    window.deleteDictRole = async function(roleId) {
        if (!confirm('Delete this role from the dictionary?')) return;
        
        try {
            const response = await fetch(`/api/roles/dictionary/${roleId}?hard=true`, {
                method: 'DELETE',
                headers: { 'X-CSRF-Token': window.CSRF_TOKEN || '' }
            });
            
            const result = await response.json();
            if (result.success) {
                toast('success', 'Role deleted');
                await loadRoleDictionary();
            }
        } catch (error) {
            toast('error', 'Error: ' + error.message);
        }
    };
    
    // ================================================================
    // v2.9.1 D2: SMART IMPORT WIZARD
    // ================================================================
    
    const ImportWizard = {
        step: 1,
        file: null,
        data: null,
        mapping: {},
        roles: []
    };
    
    function openImportModal() {
        ImportWizard.step = 1;
        ImportWizard.file = null;
        ImportWizard.data = null;
        ImportWizard.mapping = {};
        ImportWizard.roles = [];
        
        document.getElementById('import-dict-modal').style.display = 'flex';
        showImportWizardStep(1);
        document.getElementById('import-wizard-next').disabled = true;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    function closeImportModal() {
        document.getElementById('import-dict-modal').style.display = 'none';
    }
    
    function showImportWizardStep(step) {
        ImportWizard.step = step;
        
        // Hide all steps, show current
        for (let i = 1; i <= 5; i++) {
            const el = document.getElementById(`import-step-${i}`);
            if (el) el.style.display = i === step ? 'block' : 'none';
        }
        
        // Update progress
        document.querySelectorAll('.progress-step').forEach((el, i) => {
            el.classList.toggle('active', i + 1 <= step);
        });
        
        // Update title & buttons
        const titles = ['Select File', 'Analyze', 'Map Columns', 'Preview', 'Complete'];
        document.getElementById('import-wizard-title').textContent = `Import Roles - ${titles[step - 1]}`;
        document.getElementById('import-wizard-back').style.display = step > 1 && step < 5 ? 'inline-flex' : 'none';
        document.getElementById('import-wizard-next').style.display = step < 5 ? 'inline-flex' : 'none';
        document.getElementById('import-wizard-cancel').textContent = step === 5 ? 'Close' : 'Cancel';
        document.getElementById('import-wizard-next').innerHTML = step === 4 ? 
            '<i data-lucide="check"></i> Import' : 'Next <i data-lucide="arrow-right"></i>';
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    async function handleImportFile(file) {
        ImportWizard.file = file;
        const ext = file.name.split('.').pop().toLowerCase();
        
        try {
            // v2.9.4: Added Excel/xlsx support (#7)
            if (ext === 'xlsx' || ext === 'xls') {
                // Use SheetJS to parse Excel
                if (typeof XLSX === 'undefined') {
                    toast('error', 'Excel support not loaded. Please use CSV or JSON format.');
                    return;
                }
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    toast('error', 'Excel file appears empty or has no data rows');
                    return;
                }
                
                const headers = jsonData[0].map(h => String(h || '').trim());
                const rows = jsonData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = row[i] || '');
                    return obj;
                }).filter(r => Object.values(r).some(v => v)); // Filter empty rows
                
                ImportWizard.data = { rows, columns: headers };
            } else if (ext === 'json') {
                const text = await file.text();
                const parsed = JSON.parse(text);
                ImportWizard.data = {
                    rows: parsed.roles || (Array.isArray(parsed) ? parsed : []),
                    columns: Object.keys((parsed.roles || parsed)[0] || {})
                };
            } else if (ext === 'csv') {
                const text = await file.text();
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const rows = lines.slice(1).map(line => {
                    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    const row = {};
                    headers.forEach((h, i) => row[h] = vals[i] || '');
                    return row;
                });
                ImportWizard.data = { rows, columns: headers };
            } else if (ext === 'txt') {
                const text = await file.text();
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                ImportWizard.data = {
                    rows: lines.map(l => ({ role_name: l.trim() })),
                    columns: ['role_name']
                };
            } else {
                toast('error', `Unsupported file format: .${ext}. Use .xlsx, .csv, .json, or .txt`);
                return;
            }
            
            document.getElementById('import-wizard-next').disabled = false;
            showImportWizardStep(2);
            renderImportAnalysis();
        } catch (e) {
            console.error('[TWR] Import error:', e);
            toast('error', 'Failed to parse file: ' + e.message);
        }
    }
    
    function renderImportAnalysis() {
        const { rows, columns } = ImportWizard.data;
        document.getElementById('import-analysis-stats').innerHTML = `
            <p><strong>Rows:</strong> ${rows.length} | <strong>Columns:</strong> ${columns.join(', ')}</p>
        `;
        
        let preview = '<table class="data-table" style="font-size:11px;"><thead><tr>';
        columns.slice(0, 4).forEach(c => preview += `<th>${escapeHtml(c)}</th>`);
        preview += '</tr></thead><tbody>';
        rows.slice(0, 3).forEach(r => {
            preview += '<tr>';
            columns.slice(0, 4).forEach(c => preview += `<td>${escapeHtml(String(r[c] || '').slice(0, 25))}</td>`);
            preview += '</tr>';
        });
        preview += '</tbody></table>';
        document.getElementById('import-analysis-preview').innerHTML = preview;
    }
    
    function renderColumnMapping() {
        const { columns } = ImportWizard.data;
        const fields = ['role_name', 'category', 'aliases', 'description'];
        
        // Auto-detect
        const auto = {};
        columns.forEach(c => {
            const lc = c.toLowerCase();
            if (lc.includes('role') || lc.includes('name')) auto.role_name = c;
            else if (lc.includes('category') || lc.includes('type')) auto.category = c;
            else if (lc.includes('alias')) auto.aliases = c;
            else if (lc.includes('desc') || lc.includes('note')) auto.description = c;
        });
        if (columns.length === 1) auto.role_name = columns[0];
        ImportWizard.mapping = auto;
        
        let html = '';
        fields.forEach(f => {
            html += `<div style="margin-bottom:10px;display:flex;align-items:center;gap:10px;">
                <label style="width:100px;">${f.replace('_', ' ')}${f === 'role_name' ? ' *' : ''}:</label>
                <select class="form-select" data-field="${f}" onchange="ImportWizard.mapping['${f}']=this.value">
                    <option value="">-- Skip --</option>
                    ${columns.map(c => `<option value="${c}" ${auto[f] === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                </select>
            </div>`;
        });
        document.getElementById('import-column-mapping').innerHTML = html;
    }
    
    function renderImportPreview() {
        const { rows } = ImportWizard.data;
        const { mapping } = ImportWizard;
        const roleCol = mapping.role_name;
        
        if (!roleCol) {
            document.getElementById('import-preview-summary').innerHTML = '<p class="text-danger">Please select a Role Name column</p>';
            ImportWizard.roles = [];
            return;
        }
        
        // Build roles list
        ImportWizard.roles = rows.map(r => ({
            role_name: r[roleCol] || '',
            category: r[mapping.category] || 'Imported',
            aliases: r[mapping.aliases] ? r[mapping.aliases].split(/[;,]/).map(a => a.trim()).filter(Boolean) : [],
            description: r[mapping.description] || ''
        })).filter(r => r.role_name.trim());
        
        document.getElementById('import-preview-summary').innerHTML = `
            <p><strong>${ImportWizard.roles.length}</strong> roles ready to import</p>
        `;
        
        let list = '<div style="font-size:12px;">';
        ImportWizard.roles.slice(0, 10).forEach(r => {
            list += `<div style="padding:4px 0;border-bottom:1px solid var(--border-color);">
                <strong>${escapeHtml(r.role_name)}</strong>
                <span class="text-muted" style="margin-left:8px;">${escapeHtml(r.category)}</span>
            </div>`;
        });
        if (ImportWizard.roles.length > 10) {
            list += `<p class="text-muted">...and ${ImportWizard.roles.length - 10} more</p>`;
        }
        list += '</div>';
        document.getElementById('import-preview-list').innerHTML = list;
    }
    
    async function executeImport() {
        if (ImportWizard.roles.length === 0) {
            toast('error', 'No roles to import');
            return;
        }
        
        try {
            const response = await fetch('/api/roles/dictionary/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.CSRF_TOKEN || ''
                },
                body: JSON.stringify({
                    roles: ImportWizard.roles,
                    source: 'wizard_import',
                    skip_duplicates: document.getElementById('import-skip-duplicates')?.checked !== false
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('import-complete-stats').innerHTML = `
                    <p><strong>${result.data?.added || 0}</strong> roles added</p>
                    <p><strong>${result.data?.skipped || 0}</strong> skipped (duplicates)</p>
                `;
                showImportWizardStep(5);
                await loadRoleDictionary();
            } else {
                toast('error', result.error || 'Import failed');
            }
        } catch (e) {
            toast('error', 'Import error: ' + e.message);
        }
    }
    
    // Wire up wizard navigation
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('import-wizard-next')?.addEventListener('click', function() {
            if (ImportWizard.step === 2) {
                showImportWizardStep(3);
                renderColumnMapping();
            } else if (ImportWizard.step === 3) {
                showImportWizardStep(4);
                renderImportPreview();
            } else if (ImportWizard.step === 4) {
                executeImport();
            }
        });
        
        document.getElementById('import-wizard-back')?.addEventListener('click', function() {
            if (ImportWizard.step > 1) showImportWizardStep(ImportWizard.step - 1);
        });
        
        document.getElementById('import-wizard-cancel')?.addEventListener('click', closeImportModal);
        document.getElementById('btn-close-import-modal')?.addEventListener('click', closeImportModal);
        
        // File input handler
        const dropzone = document.getElementById('dict-import-dropzone');
        const fileInput = document.getElementById('dict-import-file');
        
        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
            dropzone.addEventListener('drop', e => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files[0]) handleImportFile(e.dataTransfer.files[0]);
            });
            fileInput.addEventListener('change', () => {
                if (fileInput.files[0]) handleImportFile(fileInput.files[0]);
            });
        }
    });
    
    // Legacy function for backwards compatibility
    async function importDictionaryFile(file) {
        handleImportFile(file);
    }
    
    async function exportDictionary() {
        window.location.href = '/api/roles/dictionary/export?format=csv&include_inactive=true';
    }
    
    // ================================================================
    // SHARING FUNCTIONS
    // ================================================================
    
    async function loadSharingStatus() {
        try {
            const response = await fetch('/api/roles/dictionary/status');
            const result = await response.json();
            
            if (result.success) {
                DictState.sharingStatus = result.data;
                updateSharingStatusUI(result.data);
            }
        } catch (error) {
            console.error('[TWR] Error loading sharing status:', error);
        }
    }
    
    function updateSharingStatusUI(status) {
        const statusText = document.getElementById('dict-status-text');
        const statusInfo = document.getElementById('dict-sharing-info');
        
        if (!statusText || !statusInfo) return;
        
        const dbCount = status.database?.role_count || 0;
        const masterExists = status.master_file?.exists;
        const masterCount = status.master_file?.role_count || 0;
        const sharedConfigured = status.shared_folder?.configured;
        const sharedExists = status.shared_folder?.exists;
        
        let statusMsg = `${dbCount} roles in local database`;
        
        if (masterExists) {
            statusMsg += ` • Master file: ${masterCount} roles`;
        }
        
        if (sharedConfigured) {
            if (sharedExists) {
                statusMsg += ` • Shared folder connected`;
            } else {
                statusMsg += ` • Shared folder configured but not accessible`;
            }
        }
        
        statusText.textContent = statusMsg;
        statusInfo.style.display = 'flex';
    }
    
    async function syncDictionary() {
        const mergeMode = await showSyncDialog();
        if (!mergeMode) return;
        
        try {
            // v2.9.4: Add create_if_missing option to fix #9
            const response = await fetch('/api/roles/dictionary/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.CSRF_TOKEN || ''
                },
                body: JSON.stringify({ 
                    merge_mode: mergeMode,
                    create_if_missing: true  // v2.9.4: Auto-create master if not found
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // v2.9.4: Handle case where master was created
                if (result.created_new) {
                    toast('success', result.message || 'Created new master dictionary file');
                } else {
                    const msg = `Sync complete: ${result.added || 0} added, ${result.updated || 0} updated, ${result.skipped || 0} skipped`;
                    toast('success', msg);
                }
                await loadRoleDictionary();
                await loadSharingStatus();
            } else {
                // v2.9.4: Offer to create master if not found
                if (result.can_create) {
                    const createIt = confirm(
                        'No master dictionary file found.\n\n' +
                        'Would you like to create one from your current dictionary?\n' +
                        `Suggested location: ${result.suggested_path || 'role_dictionary_master.json'}`
                    );
                    if (createIt) {
                        await createMasterFromCurrent();
                    }
                } else {
                    toast('error', result.error || 'Sync failed');
                }
            }
        } catch (error) {
            toast('error', 'Sync error: ' + error.message);
        }
    }
    
    // v2.9.4: New function to create master from current dictionary (#9)
    async function createMasterFromCurrent() {
        try {
            showLoading('Creating master dictionary file...');
            
            const response = await fetch('/api/roles/dictionary/create-master', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.CSRF_TOKEN || ''
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                toast('success', `Master dictionary created with ${result.count || 0} roles`);
                await loadSharingStatus();
            } else {
                toast('error', result.error || 'Failed to create master file');
            }
        } catch (error) {
            toast('error', 'Error creating master: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    function showSyncDialog() {
        return new Promise((resolve) => {
            const choice = confirm(
                'Sync from master dictionary file?\n\n' +
                'Options:\n' +
                '• OK = Add new roles only (keeps your existing roles)\n' +
                '• Cancel = Abort sync\n\n' +
                'For advanced options (replace all, update existing), use the API directly.'
            );
            
            resolve(choice ? 'add_new' : null);
        });
    }
    
    function downloadMasterFile() {
        // Download the shareable master file
        window.location.href = '/api/roles/dictionary/download-master?include_inactive=false';
        toast('success', 'Downloading role_dictionary_master.json - share this with your team!');
    }
    
    // Helper
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    function toast(type, message) {
        if (window.toast) {
            window.toast(type, message);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRoleDictionary);
    } else {
        initRoleDictionary();
    }
    
})();

console.log('[TWR] Role dictionary functionality loaded');

// =============================================================================
// STATEMENT FORGE MODULE (v2.9.3 F06/F07)
// =============================================================================
// Extracts work statements for TIBCO Nimbus import

const StatementForge = (function() {
    'use strict';
    
    // Module state
    let statements = [];
    let selectedIds = new Set();
    let currentDocument = null;
    
    // API base URL
    const API_BASE = '/api/statement-forge';
    
    // Initialize module
    function init() {
        // Set up event listeners for embedded SF (roles modal - removed in v2.9.8)
        const selectAll = document.getElementById('sf-select-all');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('#sf-statements-list input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = this.checked;
                    const id = cb.dataset.id;
                    if (this.checked) {
                        selectedIds.add(id);
                    } else {
                        selectedIds.delete(id);
                    }
                });
                updateSelectionButtons();
            });
        }
        
        const searchInput = document.getElementById('sf-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterStatements, 300));
        }
        
        const roleFilter = document.getElementById('sf-filter-role');
        if (roleFilter) {
            roleFilter.addEventListener('change', filterStatements);
        }
        
        // Export dropdown toggle
        const exportBtn = document.getElementById('sf-export-btn');
        const exportMenu = document.getElementById('sf-export-menu');
        if (exportBtn && exportMenu) {
            exportBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', function() {
                exportMenu.style.display = 'none';
            });
        }
        
        // v2.9.8: Set up event listeners for SF modal (modal-statement-forge)
        initModalListeners();
        
        console.log('[TWR] Statement Forge initialized');
    }
    
    // v2.9.8: Initialize listeners for the standalone SF modal (#5)
    function initModalListeners() {
        // Modal select all checkbox
        const modalSelectAll = document.getElementById('sf-modal-select-all');
        if (modalSelectAll) {
            modalSelectAll.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('#sf-modal-statements-list input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = this.checked;
                    const id = cb.dataset.id;
                    if (this.checked) {
                        selectedIds.add(id);
                    } else {
                        selectedIds.delete(id);
                    }
                });
                updateSelectionButtons();
            });
        }
        
        // Modal search
        const modalSearch = document.getElementById('sf-search-modal');
        if (modalSearch) {
            modalSearch.addEventListener('input', debounce(filterStatements, 300));
        }
        
        // Modal role filter
        const modalRoleFilter = document.getElementById('sf-filter-role-modal');
        if (modalRoleFilter) {
            modalRoleFilter.addEventListener('change', filterStatements);
        }
        
        // Update document status when modal opens via button click
        document.getElementById('btn-statement-forge')?.addEventListener('click', () => {
            setTimeout(updateDocumentStatus, 100);
        });
    }
    
    // v2.9.8: Update document status banner in SF modal (#6)
    function updateDocumentStatus() {
        const statusEl = document.getElementById('sf-doc-status');
        const nameEl = document.getElementById('sf-doc-name');
        const statsEl = document.getElementById('sf-doc-stats');
        
        if (!statusEl || !nameEl) return;
        
        const hasDoc = window.State && (window.State.currentText || window.State.reviewResults);
        const filename = window.State?.currentFilename || window.State?.filename;
        
        if (hasDoc && filename) {
            nameEl.textContent = filename;
            statusEl.classList.remove('no-document');
            statusEl.classList.add('has-document');
            
            // Show stats if available
            if (statsEl) {
                const wordCount = window.State.reviewResults?.document_info?.word_count || 
                    (window.State.currentText?.split(/\s+/).length || 0);
                statsEl.textContent = wordCount > 0 ? `(~${wordCount.toLocaleString()} words)` : '';
            }
        } else {
            nameEl.textContent = 'No document loaded';
            statusEl.classList.add('no-document');
            statusEl.classList.remove('has-document');
            if (statsEl) statsEl.textContent = '';
        }
        
        // Update lucide icons if needed
        if (typeof lucide !== 'undefined') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }
    
    // Extract statements from current document
    // v2.9.4: Added silent parameter for auto-extraction (#4)
    // v3.0.35: Added session-based extraction (works before review)
    async function extractStatements(silent = false) {
        // v3.0.35: Check for document using ACTUAL State properties
        // Primary: State.filename (set after upload)
        // Secondary: State.reviewResults.document_info.filename (set after review)
        const hasDoc = window.State && (
            window.State.filename || 
            window.State.reviewResults?.document_info?.filename
        );
        const hasText = window.State && (
            window.State.currentText || 
            window.State.reviewResults
        );
        
        if (!hasDoc && !hasText) {
            if (!silent) {
                toast('error', 'No document loaded. Please upload a document first.');
            }
            return;
        }
        
        if (!silent) {
            showLoading('Extracting statements...');
        }
        
        try {
            let response;
            
            // v3.0.35: Prefer session-based extraction (works without review)
            // Use this path when we have a filename but no text yet
            if (hasDoc && !hasText) {
                console.log('[SF] Using session-based extraction (no review yet)');
                response = await fetch(`${API_BASE}/extract-from-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': window.State?.csrfToken || ''
                    },
                    body: JSON.stringify({})
                });
            } else {
                // Fall back to text-based extraction (after review completed)
                const documentText = window.State.currentText || 
                    (window.State.reviewResults?.document_info?.paragraphs || [])
                        .map(p => p[1] || p).join('\n');
                
                if (!documentText || documentText.trim().length === 0) {
                    // Try session-based as fallback
                    console.log('[SF] No text available, trying session-based extraction');
                    response = await fetch(`${API_BASE}/extract-from-session`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.State?.csrfToken || ''
                        },
                        body: JSON.stringify({})
                    });
                } else {
                    // Get document name from available sources
                    const docName = window.State.filename || 
                        window.State.reviewResults?.document_info?.filename ||
                        'Unknown Document';
                    
                    response = await fetch(`${API_BASE}/extract`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.State?.csrfToken || ''
                        },
                        body: JSON.stringify({
                            text: documentText,
                            document_name: docName,
                            options: {
                                include_context: true,
                                detect_directives: true
                            }
                        })
                    });
                }
            }
            
            const result = await response.json();
            
            if (result.success) {
                // v3.0.35: Handle both response formats (data wrapper or direct)
                const data = result.data || result;
                statements = data.statements || [];
                updateStats(data);
                renderStatements();
                updateRoleFilter();
                if (!silent) {
                    toast('success', `Extracted ${statements.length} statements`);
                } else {
                    console.log(`[SF] Auto-extracted ${statements.length} statements`);
                }
            } else {
                throw new Error(result.error || 'Extraction failed');
            }
        } catch (error) {
            console.error('[SF] Extraction error:', error);
            if (!silent) {
                toast('error', `Extraction failed: ${error.message}`);
            }
        } finally {
            if (!silent) {
                hideLoading();
            }
        }
    }
    
    // Update statistics display
    function updateStats(data) {
        const el = (id) => document.getElementById(id);
        
        // Update embedded SF stats (deprecated in v2.9.8)
        if (el('sf-total-count')) el('sf-total-count').textContent = data.total || statements.length;
        if (el('sf-action-count')) el('sf-action-count').textContent = data.action_count || 0;
        if (el('sf-directive-count')) el('sf-directive-count').textContent = data.directive_count || 0;
        if (el('sf-roles-count')) el('sf-roles-count').textContent = data.unique_roles || 0;
        
        // v2.9.8: Update modal SF stats
        if (el('sf-modal-total-count')) el('sf-modal-total-count').textContent = data.total || statements.length;
        if (el('sf-modal-action-count')) el('sf-modal-action-count').textContent = data.action_count || 0;
        if (el('sf-modal-directive-count')) el('sf-modal-directive-count').textContent = data.directive_count || 0;
        if (el('sf-modal-roles-count')) el('sf-modal-roles-count').textContent = data.unique_roles || 0;
    }
    
    // Render statements table
    function renderStatements(filteredStatements = null) {
        // Render to both embedded (deprecated) and modal tables
        const tbodies = [
            document.getElementById('sf-statements-list'),
            document.getElementById('sf-modal-statements-list')
        ].filter(Boolean);
        
        if (tbodies.length === 0) return;
        
        const displayStatements = filteredStatements || statements;
        
        tbodies.forEach(tbody => {
            if (displayStatements.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:40px;">No statements to display.</td></tr>';
                return;
            }
            
            tbody.innerHTML = displayStatements.map((stmt, idx) => `
                <tr data-id="${stmt.id || idx}">
                    <td><input type="checkbox" data-id="${stmt.id || idx}" ${selectedIds.has(String(stmt.id || idx)) ? 'checked' : ''}></td>
                    <td class="text-muted">${stmt.id || idx + 1}</td>
                    <td><span class="role-badge">${escapeHtml(stmt.role || 'Unknown')}</span></td>
                    <td>
                        <div class="stmt-text" contenteditable="true" data-id="${stmt.id || idx}" onblur="StatementForge.updateStatement(this)">${escapeHtml(stmt.statement)}</div>
                        ${stmt.context ? `<div class="stmt-context text-muted" style="font-size:11px;margin-top:4px;"><i data-lucide="info" style="width:10px;height:10px;"></i> ${escapeHtml(truncate(stmt.context, 100))}</div>` : ''}
                    </td>
                    <td>
                        <span class="type-badge type-${(stmt.type || 'action').toLowerCase()}">${stmt.type || 'Action'}</span>
                        ${stmt.is_directive ? '<span class="directive-indicator" title="Directive (shall/must/will)">D</span>' : ''}
                    </td>
                    <td>
                        <button class="btn btn-ghost btn-xs" onclick="StatementForge.splitStatement('${stmt.id || idx}')" title="Split">
                            <i data-lucide="scissors"></i>
                        </button>
                        <button class="btn btn-ghost btn-xs" onclick="StatementForge.deleteStatement('${stmt.id || idx}')" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Add checkbox event listeners
            tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', function() {
                    const id = this.dataset.id;
                    if (this.checked) {
                        selectedIds.add(id);
                    } else {
                        selectedIds.delete(id);
                    }
                    updateSelectionButtons();
                });
            });
        });
        
        // Re-initialize lucide icons for new elements
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    // Update role filter dropdown
    function updateRoleFilter() {
        // Update both embedded (deprecated) and modal dropdowns
        const selects = [
            document.getElementById('sf-filter-role'),
            document.getElementById('sf-filter-role-modal')
        ].filter(Boolean);
        
        const roles = [...new Set(statements.map(s => s.role).filter(Boolean))].sort();
        const optionsHtml = '<option value="">All Roles</option>' + 
            roles.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
        
        selects.forEach(select => {
            select.innerHTML = optionsHtml;
        });
    }
    
    // Filter statements by search and role
    function filterStatements() {
        // Check both embedded and modal inputs
        const searchTerm = (
            document.getElementById('sf-search')?.value || 
            document.getElementById('sf-search-modal')?.value || 
            ''
        ).toLowerCase();
        const roleFilter = 
            document.getElementById('sf-filter-role')?.value || 
            document.getElementById('sf-filter-role-modal')?.value || 
            '';
        
        const filtered = statements.filter(stmt => {
            const matchesSearch = !searchTerm || 
                (stmt.statement || '').toLowerCase().includes(searchTerm) ||
                (stmt.role || '').toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || stmt.role === roleFilter;
            return matchesSearch && matchesRole;
        });
        
        renderStatements(filtered);
    }
    
    // Update selection action buttons
    function updateSelectionButtons() {
        // Update both embedded (deprecated) and modal buttons
        const mergeBtn = document.getElementById('sf-merge-btn');
        const deleteBtn = document.getElementById('sf-delete-btn');
        const modalMergeBtn = document.getElementById('sf-modal-merge-btn');
        const modalDeleteBtn = document.getElementById('sf-modal-delete-btn');
        
        const hasSelection = selectedIds.size > 0;
        const canMerge = selectedIds.size > 1;
        
        if (mergeBtn) mergeBtn.disabled = !canMerge;
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
        if (modalMergeBtn) modalMergeBtn.disabled = !canMerge;
        if (modalDeleteBtn) modalDeleteBtn.disabled = !hasSelection;
    }
    
    // Add manual statement
    function addStatement() {
        const role = prompt('Enter role name:', 'Program Manager');
        if (!role) return;
        
        const statement = prompt('Enter work statement:', 'shall review and approve...');
        if (!statement) return;
        
        const newStmt = {
            id: `manual-${Date.now()}`,
            role: role,
            statement: statement,
            type: 'Action',
            is_directive: /\b(shall|must|will)\b/i.test(statement),
            source: 'manual'
        };
        
        statements.push(newStmt);
        renderStatements();
        updateRoleFilter();
        toast('success', 'Statement added');
    }
    
    // Update statement text
    function updateStatement(element) {
        const id = element.dataset.id;
        const newText = element.textContent.trim();
        
        const stmt = statements.find(s => String(s.id) === id);
        if (stmt) {
            stmt.statement = newText;
            stmt.is_directive = /\b(shall|must|will)\b/i.test(newText);
            toast('info', 'Statement updated');
        }
    }
    
    // Merge selected statements
    async function mergeSelected() {
        if (selectedIds.size < 2) {
            toast('error', 'Select at least 2 statements to merge');
            return;
        }
        
        const ids = Array.from(selectedIds);
        const toMerge = statements.filter(s => ids.includes(String(s.id)));
        const merged = toMerge.map(s => s.statement).join('; ');
        
        const confirmed = confirm(`Merge ${ids.length} statements into:\n\n"${truncate(merged, 200)}"\n\nContinue?`);
        if (!confirmed) return;
        
        // Create merged statement
        const newStmt = {
            id: `merged-${Date.now()}`,
            role: toMerge[0].role,
            statement: merged,
            type: 'Action',
            is_directive: toMerge.some(s => s.is_directive),
            source: 'merged'
        };
        
        // Remove merged statements and add new
        statements = statements.filter(s => !ids.includes(String(s.id)));
        statements.push(newStmt);
        selectedIds.clear();
        
        renderStatements();
        updateSelectionButtons();
        toast('success', 'Statements merged');
    }
    
    // Split statement
    function splitStatement(id) {
        const stmt = statements.find(s => String(s.id) === String(id));
        if (!stmt) return;
        
        const parts = prompt('Enter split delimiter (e.g., ";", "and", ",")', ';');
        if (!parts) return;
        
        const splits = stmt.statement.split(parts).map(s => s.trim()).filter(Boolean);
        if (splits.length < 2) {
            toast('error', 'No split possible with that delimiter');
            return;
        }
        
        // Remove original and add splits
        const idx = statements.indexOf(stmt);
        statements.splice(idx, 1);
        
        splits.forEach((text, i) => {
            statements.splice(idx + i, 0, {
                id: `split-${Date.now()}-${i}`,
                role: stmt.role,
                statement: text,
                type: stmt.type,
                is_directive: /\b(shall|must|will)\b/i.test(text),
                source: 'split'
            });
        });
        
        renderStatements();
        toast('success', `Split into ${splits.length} statements`);
    }
    
    // Delete statement
    function deleteStatement(id) {
        if (!confirm('Delete this statement?')) return;
        statements = statements.filter(s => String(s.id) !== String(id));
        selectedIds.delete(id);
        renderStatements();
        updateSelectionButtons();
        toast('success', 'Statement deleted');
    }
    
    // Delete selected statements
    function deleteSelected() {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected statements?`)) return;
        
        const ids = Array.from(selectedIds);
        statements = statements.filter(s => !ids.includes(String(s.id)));
        selectedIds.clear();
        renderStatements();
        updateSelectionButtons();
        toast('success', 'Statements deleted');
    }
    
    // Export statements
    async function exportAs(format) {
        if (statements.length === 0) {
            toast('error', 'No statements to export');
            return;
        }
        
        showLoading(`Exporting to ${format.toUpperCase()}...`);
        
        try {
            const response = await fetch(`${API_BASE}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.State?.csrfToken || ''
                },
                body: JSON.stringify({
                    statements: statements,
                    format: format,
                    document_name: window.State?.currentFilename || 'statements'
                })
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Export failed');
            }
            
            // Download the file
            const blob = await response.blob();
            const filename = `statements_export.${format === 'excel' ? 'xlsx' : format === 'word' ? 'docx' : format}`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast('success', `Exported ${statements.length} statements to ${filename}`);
        } catch (error) {
            console.error('[SF] Export error:', error);
            toast('error', `Export failed: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
    
    // Helper functions
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    function truncate(str, maxLen) {
        if (!str || str.length <= maxLen) return str;
        return str.substring(0, maxLen) + '...';
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    function toast(type, message) {
        if (window.toast) {
            window.toast(type, message);
        } else {
            console.log(`[SF ${type}] ${message}`);
        }
    }
    
    function showLoading(msg) {
        if (window.showLoading) window.showLoading(msg);
    }
    
    function hideLoading() {
        if (window.hideLoading) window.hideLoading();
    }
    
    // v2.9.4 #3: Handle file upload directly in Statement Forge
    async function handleFileUpload(inputElement) {
        const file = inputElement?.files?.[0];
        if (!file) {
            toast('error', 'No file selected');
            return;
        }
        
        // Check file type
        const validTypes = ['.docx', '.pdf'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validTypes.includes(ext)) {
            toast('error', 'Please upload a .docx or .pdf file');
            inputElement.value = '';
            return;
        }
        
        showLoading(`Loading ${file.name}...`);
        
        try {
            // Upload the file
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': window.State?.csrfToken || ''
                },
                body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
            }
            
            // Update global state
            if (window.State) {
                window.State.currentFilename = file.name;
                window.State.filename = file.name;
            }
            
            toast('success', `Loaded: ${file.name}`);
            
            // Now run a quick scan to get the text
            showLoading('Scanning document for statements...');
            
            const reviewResponse = await fetch('/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.State?.csrfToken || ''
                },
                body: JSON.stringify({
                    options: {
                        // Minimal options for quick scan
                        check_grammar: false,
                        check_spelling: false,
                        check_acronyms: false,
                        extract_roles: false
                    }
                })
            });
            
            const reviewResult = await reviewResponse.json();
            
            if (reviewResult.success && reviewResult.data) {
                // Store text for extraction only - do NOT overwrite main review results
                // v3.0.11: Removed State.reviewResults assignment that was breaking acronym detection
                if (window.State) {
                    window.State.currentText = reviewResult.data.document_info?.text || 
                        (reviewResult.data.document_info?.paragraphs || []).map(p => p[1] || p).join('\n');
                    // Store SF-specific results separately if needed
                    window.State.sfQuickScanResults = reviewResult.data;
                }
                
                // Auto-extract statements
                await extractStatements(false);
            } else {
                toast('warning', 'Document loaded but text extraction limited');
            }
            
        } catch (error) {
            console.error('[SF] File upload error:', error);
            toast('error', `Upload failed: ${error.message}`);
        } finally {
            hideLoading();
            inputElement.value = ''; // Clear input for next upload
        }
    }
    
    // ==========================================================================
    // v3.0.41: Statement Forge → Role Mapping (Batch H)
    // ==========================================================================
    
    /**
     * Map extracted statements to detected roles.
     * Creates a bidirectional mapping showing which statements relate to which roles.
     */
    async function mapToRoles() {
        try {
            showLoading('Mapping statements to roles...');
            
            // Check prerequisites
            const statusResponse = await fetch(`${API_BASE}/role-mapping-status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const status = await statusResponse.json();
            
            if (!status.can_map) {
                let msg = 'Cannot map statements to roles: ';
                if (!status.statements_available) msg += 'No statements extracted. ';
                if (!status.roles_available) msg += 'No roles detected (run document review first).';
                toast('warning', msg);
                hideLoading();
                return null;
            }
            
            // Perform mapping
            const response = await fetch(`${API_BASE}/map-to-roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.State?.csrfToken || ''
                }
            });
            
            const result = await response.json();
            
            if (!result.success) {
                toast('error', result.error || 'Mapping failed');
                hideLoading();
                return null;
            }
            
            // Display the mapping
            displayRoleMapping(result);
            
            toast('success', `Mapped ${result.stats.mapped_statements}/${result.stats.total_statements} statements (${result.stats.coverage_percent}% coverage)`);
            hideLoading();
            
            return result;
            
        } catch (error) {
            console.error('[SF] Role mapping error:', error);
            toast('error', `Mapping failed: ${error.message}`);
            hideLoading();
            return null;
        }
    }
    
    /**
     * Display role mapping results in the UI.
     * @param {Object} mapping - Mapping result from API
     */
    function displayRoleMapping(mapping) {
        const container = document.getElementById('sf-role-mapping-container');
        if (!container) {
            console.warn('[SF] Role mapping container not found');
            return;
        }
        
        const roleToStatements = mapping.role_to_statements || {};
        const stats = mapping.stats || {};
        
        // Build HTML
        let html = `
            <div class="sf-role-mapping-header">
                <h4>Role → Statement Mapping</h4>
                <span class="sf-mapping-stats">
                    ${stats.mapped_statements || 0}/${stats.total_statements || 0} statements mapped 
                    (${stats.coverage_percent || 0}% coverage)
                </span>
            </div>
            <div class="sf-role-mapping-list">
        `;
        
        const roleNames = Object.keys(roleToStatements).sort();
        
        if (roleNames.length === 0) {
            html += '<p class="sf-no-mapping">No role mappings found.</p>';
        } else {
            for (const roleName of roleNames) {
                const stmts = roleToStatements[roleName];
                const count = stmts.length;
                
                html += `
                    <div class="sf-role-mapping-item">
                        <div class="sf-role-header" onclick="this.parentElement.classList.toggle('expanded')">
                            <span class="sf-role-expand">▶</span>
                            <span class="sf-role-name">${escapeHtml(roleName)}</span>
                            <span class="sf-role-count">${count} statement${count !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="sf-role-statements">
                `;
                
                if (count === 0) {
                    html += '<p class="sf-no-statements">No statements reference this role.</p>';
                } else {
                    for (const stmt of stmts) {
                        const directive = stmt.directive ? `<span class="sf-directive sf-directive-${stmt.directive}">${stmt.directive}</span>` : '';
                        html += `
                            <div class="sf-mapped-statement">
                                <span class="sf-stmt-number">${escapeHtml(stmt.number || '')}</span>
                                ${directive}
                                <span class="sf-stmt-desc">${escapeHtml(stmt.description || '')}</span>
                            </div>
                        `;
                    }
                }
                
                html += `
                        </div>
                    </div>
                `;
            }
        }
        
        // Show unmapped count
        const unmappedCount = (mapping.unmapped_statements || []).length;
        if (unmappedCount > 0) {
            html += `
                <div class="sf-unmapped-note">
                    <em>${unmappedCount} statement${unmappedCount !== 1 ? 's' : ''} not mapped to any role</em>
                </div>
            `;
        }
        
        html += '</div>';
        
        container.innerHTML = html;
        container.style.display = 'block';
    }
    
    // Helper for escaping HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Toggle export menu helper
    function toggleExportMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Public API
    return {
        extractStatements,
        addStatement,
        updateStatement,
        mergeSelected,
        splitStatement,
        deleteStatement,
        deleteSelected,
        exportAs,
        handleFileUpload,
        toggleExportMenu,
        updateDocumentStatus,  // v2.9.8: expose for external calls
        mapToRoles,  // v3.0.41: Statement → Role mapping
        displayRoleMapping,  // v3.0.41: Display mapping UI
        getStatements: () => statements,
        setStatements: (stmts) => { statements = stmts; renderStatements(); }
    };
})();

// Make globally available
window.StatementForge = StatementForge;

console.log('[TWR] Statement Forge module loaded');

// =============================================================================
// EXPORT REVIEW MODULE (v2.9.4 #22)
// =============================================================================

const ExportReview = (function() {
    'use strict';
    
    // Module state
    let issues = [];
    let reviewStatus = new Map(); // issue_id -> 'pending' | 'approved' | 'rejected'
    let filteredIndices = [];
    
    /**
     * Open the Export Review modal with issues to review
     */
    function open(issuesToReview) {
        issues = issuesToReview || [];
        reviewStatus.clear();
        
        // Initialize all as pending
        issues.forEach((issue, idx) => {
            const id = issue.issue_id || idx;
            reviewStatus.set(id, 'pending');
        });
        
        // Populate category filter
        populateCategoryFilter();
        
        // Render the list
        filterAndRender();
        
        // Update progress
        updateProgress();
        
        // Show modal
        showModal('modal-export-review');
    }
    
    /**
     * Populate the category dropdown filter
     */
    function populateCategoryFilter() {
        const select = document.getElementById('export-review-filter-category');
        if (!select) return;
        
        // Get unique categories
        const categories = [...new Set(issues.map(i => i.category).filter(Boolean))].sort();
        
        select.innerHTML = '<option value="">All</option>' +
            categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
    }
    
    /**
     * Filter and render issues based on current filter selections
     */
    function filterAndRender() {
        const severityFilter = document.getElementById('export-review-filter-severity')?.value || '';
        const categoryFilter = document.getElementById('export-review-filter-category')?.value || '';
        const statusFilter = document.getElementById('export-review-filter-status')?.value || '';
        
        filteredIndices = [];
        
        issues.forEach((issue, idx) => {
            const id = issue.issue_id || idx;
            const status = reviewStatus.get(id) || 'pending';
            
            // Apply filters
            if (severityFilter && issue.severity !== severityFilter) return;
            if (categoryFilter && issue.category !== categoryFilter) return;
            if (statusFilter && status !== statusFilter) return;
            
            filteredIndices.push(idx);
        });
        
        renderList();
    }
    
    /**
     * Render the issues list
     */
    function renderList() {
        const container = document.getElementById('export-review-list');
        if (!container) return;
        
        if (filteredIndices.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No issues match the current filters.</p></div>';
            return;
        }
        
        container.innerHTML = filteredIndices.map((idx, renderIdx) => {
            const issue = issues[idx];
            const id = issue.issue_id || idx;
            const status = reviewStatus.get(id) || 'pending';
            
            const severityClass = (issue.severity || 'info').toLowerCase();
            
            // v2.9.4.1: Add tabindex for keyboard navigation
            return `
                <div class="export-review-item ${status}" data-id="${id}" data-idx="${idx}" tabindex="0" role="listitem">
                    <div class="export-review-item-header">
                        <span class="severity-badge sev-${severityClass}">${escapeHtml(issue.severity || 'Info')}</span>
                        <span class="category">${escapeHtml(issue.category || 'General')}</span>
                        <div class="actions">
                            <button class="btn btn-sm ${status === 'approved' ? 'btn-success' : 'btn-ghost'}" 
                                    onclick="ExportReview.approve(${typeof id === 'string' ? `'${id}'` : id})" title="Approve (a)">
                                <i data-lucide="check"></i>
                            </button>
                            <button class="btn btn-sm ${status === 'rejected' ? 'btn-danger' : 'btn-ghost'}" 
                                    onclick="ExportReview.reject(${typeof id === 'string' ? `'${id}'` : id})" title="Reject (r)">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    </div>
                    <div class="export-review-item-body">
                        <div class="message">${escapeHtml(issue.message || '')}</div>
                        ${issue.flagged_text || issue.suggestion ? `
                            <div class="context">
                                ${issue.flagged_text ? `
                                    <div>
                                        <div class="context-label">Original Text</div>
                                        <div class="context-box original">${escapeHtml(issue.flagged_text)}</div>
                                    </div>
                                ` : ''}
                                ${issue.suggestion ? `
                                    <div>
                                        <div class="context-label">Suggested Fix</div>
                                        <div class="context-box suggestion">${escapeHtml(issue.suggestion)}</div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    /**
     * Approve an issue
     */
    function approve(id) {
        const current = reviewStatus.get(id);
        reviewStatus.set(id, current === 'approved' ? 'pending' : 'approved');
        updateItemUI(id);
        updateProgress();
    }
    
    /**
     * Reject an issue
     */
    function reject(id) {
        const current = reviewStatus.get(id);
        reviewStatus.set(id, current === 'rejected' ? 'pending' : 'rejected');
        updateItemUI(id);
        updateProgress();
    }
    
    /**
     * Update a single item's UI without re-rendering all
     */
    function updateItemUI(id) {
        const item = document.querySelector(`.export-review-item[data-id="${id}"]`);
        if (!item) return;
        
        const status = reviewStatus.get(id) || 'pending';
        item.className = `export-review-item ${status}`;
        
        // Update buttons
        const approveBtn = item.querySelector('button[title="Approve"]');
        const rejectBtn = item.querySelector('button[title="Reject"]');
        
        if (approveBtn) {
            approveBtn.className = `btn btn-sm ${status === 'approved' ? 'btn-success' : 'btn-ghost'}`;
        }
        if (rejectBtn) {
            rejectBtn.className = `btn btn-sm ${status === 'rejected' ? 'btn-danger' : 'btn-ghost'}`;
        }
    }
    
    /**
     * Approve all visible (filtered) issues
     */
    function approveAllVisible() {
        filteredIndices.forEach(idx => {
            const id = issues[idx].issue_id || idx;
            reviewStatus.set(id, 'approved');
        });
        renderList();
        updateProgress();
    }
    
    /**
     * Reject all visible (filtered) issues
     */
    function rejectAllVisible() {
        filteredIndices.forEach(idx => {
            const id = issues[idx].issue_id || idx;
            reviewStatus.set(id, 'rejected');
        });
        renderList();
        updateProgress();
    }
    
    /**
     * Update progress indicators
     */
    function updateProgress() {
        let approved = 0, rejected = 0, pending = 0;
        
        reviewStatus.forEach(status => {
            if (status === 'approved') approved++;
            else if (status === 'rejected') rejected++;
            else pending++;
        });
        
        const reviewed = approved + rejected;
        const total = issues.length;
        const percent = total > 0 ? (reviewed / total * 100) : 0;
        
        // Update progress text and bar
        const progressText = document.getElementById('export-review-progress-text');
        if (progressText) progressText.textContent = `${reviewed} of ${total} reviewed`;
        
        const progressBar = document.getElementById('export-review-progress-bar');
        if (progressBar) progressBar.style.width = `${percent}%`;
        
        // Update summary counts
        const el = (id) => document.getElementById(id);
        if (el('export-review-approved')) el('export-review-approved').textContent = approved;
        if (el('export-review-rejected')) el('export-review-rejected').textContent = rejected;
        if (el('export-review-pending')) el('export-review-pending').textContent = pending;
        if (el('export-review-approved-count')) el('export-review-approved-count').textContent = approved;
    }
    
    /**
     * Export only approved issues
     */
    async function exportApproved() {
        const approvedIssues = issues.filter((issue, idx) => {
            const id = issue.issue_id || idx;
            return reviewStatus.get(id) === 'approved';
        });
        
        if (approvedIssues.length === 0) {
            toast('warning', 'No approved issues to export');
            return;
        }
        
        closeModals();
        
        // Use the standard export flow with approved issues
        const reviewerName = document.getElementById('export-reviewer-name')?.value || 'TechWriter Review';
        
        setLoading(true, `Exporting ${approvedIssues.length} approved issues...`);
        
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': State.csrfToken
                },
                body: JSON.stringify({
                    issues: approvedIssues.map((issue, i) => ({ ...issue, index: i })),
                    reviewer_name: reviewerName,
                    apply_fixes: false,
                    export_type: 'docx'
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                downloadBlob(blob, `${State.filename}_review.docx`);
                toast('success', `Exported ${approvedIssues.length} approved issues`);
            } else {
                // v2.9.4.1: Fix BUG-H02 - safe JSON parsing for error response
                try {
                    const error = await response.json();
                    toast('error', error.error || 'Export failed');
                } catch (parseErr) {
                    toast('error', `Export failed (HTTP ${response.status})`);
                }
            }
        } catch (e) {
            toast('error', 'Export failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Helper functions
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    function showModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            // v2.9.4.1: Add keyboard handler when modal opens
            document.addEventListener('keydown', handleKeyboard);
        }
    }
    
    function closeModals() {
        // v2.9.4.1: Remove keyboard handler when modal closes
        document.removeEventListener('keydown', handleKeyboard);
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
    
    // v2.9.4.1: Keyboard shortcut handler for Export Review
    function handleKeyboard(e) {
        const modal = document.getElementById('modal-export-review');
        if (!modal || !modal.classList.contains('active')) return;
        
        // Get focused item
        const focused = document.activeElement;
        const item = focused?.closest('.export-review-item');
        
        if (item) {
            const id = item.dataset.id;
            const idNum = isNaN(parseInt(id)) ? id : parseInt(id);
            
            switch (e.key) {
                case 'Enter':
                case 'a':  // Approve
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        approve(idNum);
                        const next = item.nextElementSibling;
                        if (next && next.classList.contains('export-review-item')) {
                            next.focus();
                            next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                case 'r':  // Reject
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        reject(idNum);
                        const nextItem = item.nextElementSibling;
                        if (nextItem && nextItem.classList.contains('export-review-item')) {
                            nextItem.focus();
                            nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    const down = item.nextElementSibling;
                    if (down && down.classList.contains('export-review-item')) {
                        down.focus();
                        down.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const up = item.previousElementSibling;
                    if (up && up.classList.contains('export-review-item')) {
                        up.focus();
                        up.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    break;
            }
        }
        
        // Global shortcuts (Ctrl/Cmd)
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'a':  // Ctrl+A = Approve all visible
                    e.preventDefault();
                    approveAllVisible();
                    break;
                case 'Enter':  // Ctrl+Enter = Export
                    e.preventDefault();
                    exportApproved();
                    break;
            }
        }
        
        // Escape to close
        if (e.key === 'Escape') {
            closeModals();
        }
    }
    
    function toast(type, message) {
        if (window.toast) window.toast(type, message);
    }
    
    function setLoading(show, msg) {
        if (window.setLoading) window.setLoading(show, msg);
    }
    
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Set up filter listeners
    document.addEventListener('DOMContentLoaded', function() {
        ['export-review-filter-severity', 'export-review-filter-category', 'export-review-filter-status'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', filterAndRender);
        });
    });
    
    // Public API
    return {
        open,
        approve,
        reject,
        approveAllVisible,
        rejectAllVisible,
        exportApproved,
        close: closeModals  // v2.9.4.1: Expose close for cleanup
    };
})();

window.ExportReview = ExportReview;

console.log('[TWR] Export Review module loaded');

// =============================================================================
// AI TROUBLESHOOTING SUPPORT (v2.9.4.2)
// =============================================================================
// Captures errors and user actions to create self-contained diagnostic packages
// that can be uploaded to Claude for troubleshooting without additional context.

const AITroubleshoot = (function() {
    'use strict';
    
    let isCapturing = true;
    
    // Capture all console errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
        // Call original
        originalConsoleError.apply(console, args);
        
        // Send to backend (if capturing enabled)
        if (isCapturing) {
            captureConsoleError({
                type: 'console.error',
                message: args.map(a => {
                    try {
                        return typeof a === 'object' ? JSON.stringify(a) : String(a);
                    } catch {
                        return String(a);
                    }
                }).join(' '),
                timestamp: new Date().toISOString()
            });
        }
    };
    
    // Capture unhandled errors
    window.addEventListener('error', function(event) {
        if (!isCapturing) return;
        
        captureConsoleError({
            type: 'window.error',
            message: event.message || 'Unknown error',
            source: event.filename || '',
            lineno: event.lineno || 0,
            colno: event.colno || 0,
            stack: event.error?.stack || '',
            timestamp: new Date().toISOString(),
            correlationId: window._lastCorrelationId || null
        });
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        if (!isCapturing) return;
        
        captureConsoleError({
            type: 'unhandledrejection',
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack || '',
            timestamp: new Date().toISOString(),
            correlationId: window._lastCorrelationId || null
        });
    });
    
    // Send console error to backend
    function captureConsoleError(error) {
        // Include last correlation ID for backend correlation
        error.correlationId = error.correlationId || window._lastCorrelationId || null;
        
        try {
            fetch('/api/diagnostics/capture-console', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.State?.csrfToken || window.CSRF_TOKEN || ''
                },
                body: JSON.stringify(error)
            }).catch(() => {}); // Silently fail - don't cause more errors
        } catch (e) {
            // Don't let diagnostic capture cause more errors
        }
    }
    
    // Log user action (call before operations that might fail)
    function logAction(action, details = {}) {
        // Include correlation ID
        details.correlationId = window._lastCorrelationId || null;
        
        try {
            // Also log locally for immediate access
            console.log(`[TWR Action] ${action}`, details);
            
            fetch('/api/diagnostics/user-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.State?.csrfToken || window.CSRF_TOKEN || ''
                },
                body: JSON.stringify({ action, details })
            }).catch(() => {}); // Silent fail
        } catch (e) {
            // Silent fail
        }
    }
    
    // Export AI troubleshooting package
    async function exportPackage(format = 'json') {
        try {
            if (window.showLoading) showLoading('Generating diagnostic package...');
            
            const response = await fetch(`/api/diagnostics/ai-export?format=${format}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': window.State?.csrfToken || window.CSRF_TOKEN || ''
                }
            });
            
            if (!response.ok) {
                throw new Error(`Export failed: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1] 
                || `TWR_DIAG_${Date.now()}.${format}`;
            
            // Download file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (window.hideLoading) hideLoading();
            
            if (window.toast) {
                toast('success', 'Diagnostic package exported. Upload to a new Claude chat for troubleshooting.');
            }
            
            return filename;
        } catch (error) {
            if (window.hideLoading) hideLoading();
            console.error('[TWR] Failed to export diagnostic package:', error);
            if (window.toast) {
                toast('error', 'Failed to export diagnostics: ' + error.message);
            }
            throw error;
        }
    }
    
    // Enable/disable capturing (useful if causing issues)
    function setCapturing(enabled) {
        isCapturing = enabled;
        console.log(`[TWR] AI Troubleshoot capturing ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    // Public API
    return {
        logAction,
        exportPackage,
        captureError: captureConsoleError,
        setCapturing
    };
})();

// Make globally available
window.AITroubleshoot = AITroubleshoot;

// =============================================================================
// FETCH INTERCEPTOR FOR CORRELATION ID CAPTURE (v2.9.4.2)
// =============================================================================
// Wraps fetch to capture X-Correlation-ID from responses for error correlation

(function() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch.apply(this, args);
            
            // Capture correlation ID from response headers
            const correlationId = response.headers.get('X-Correlation-ID');
            if (correlationId) {
                window._lastCorrelationId = correlationId;
            }
            
            return response;
        } catch (error) {
            // Still capture errors even if fetch fails
            AITroubleshoot.captureError({
                type: 'fetch_error',
                message: error.message,
                url: typeof args[0] === 'string' ? args[0] : args[0]?.url,
                correlationId: window._lastCorrelationId
            });
            throw error;
        }
    };
    
    console.log('[TWR] Fetch interceptor installed for correlation ID tracking');
})();

// =============================================================================
// INSTRUMENT KEY OPERATIONS WITH USER ACTION LOGGING
// =============================================================================

// Wrap the global handleFileUpload if it exists
(function() {
    const originalHandleFileUpload = window.handleFileUpload;
    if (typeof originalHandleFileUpload === 'function') {
        window.handleFileUpload = async function(file) {
            AITroubleshoot.logAction('file_upload_start', { 
                filename: file?.name, 
                size: file?.size,
                type: file?.type 
            });
            try {
                const result = await originalHandleFileUpload.apply(this, arguments);
                AITroubleshoot.logAction('file_upload_complete', { filename: file?.name });
                return result;
            } catch (error) {
                AITroubleshoot.logAction('file_upload_error', { 
                    filename: file?.name, 
                    error: error.message 
                });
                throw error;
            }
        };
    }
})();

// Add action logging on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Log when review button is clicked
    const reviewBtn = document.getElementById('btn-review');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', function() {
            const checkers = [];
            document.querySelectorAll('[data-checker]').forEach(cb => {
                if (cb.checked) checkers.push(cb.dataset.checker);
            });
            AITroubleshoot.logAction('run_review', {
                filename: window.State?.filename,
                checkers_enabled: checkers
            });
        }, true); // Use capture phase to run before the actual handler
    }
    
    // Log when export is clicked
    const exportBtn = document.getElementById('btn-do-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            AITroubleshoot.logAction('export_document', {
                format: document.querySelector('input[name="export-format"]:checked')?.value,
                mode: document.querySelector('input[name="export-mode"]:checked')?.value,
                issue_count: window.State?.issues?.length || 0
            });
        }, true);
    }
    
    // Log settings changes
    document.querySelectorAll('#modal-settings input, #modal-settings select').forEach(el => {
        el.addEventListener('change', function() {
            AITroubleshoot.logAction('settings_change', {
                setting: this.id || this.name,
                value: this.type === 'checkbox' ? this.checked : this.value
            });
        });
    });
    
    // Log modal opens
    document.querySelectorAll('[onclick*="showModal"]').forEach(el => {
        el.addEventListener('click', function() {
            const match = this.getAttribute('onclick')?.match(/showModal\(['"]([^'"]+)['"]\)/);
            if (match) {
                AITroubleshoot.logAction('modal_open', { modal: match[1] });
            }
        });
    });
});

console.log('[TWR] AI Troubleshooting support loaded');
