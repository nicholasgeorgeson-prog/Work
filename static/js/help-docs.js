/**
 * TechWriterReview Help Documentation System
 * ==========================================
 * Comprehensive documentation for all features.
 * Version: 3.0.124
 *
 * Complete overhaul with:
 * - Beautiful visual design with icons and illustrations
 * - Detailed explanations of "how" and "why" for every feature
 * - Technical deep-dive section for advanced users
 * - Smooth navigation and professional typography
 */

'use strict';

const HelpDocs = {
    version: '3.0.124',
    lastUpdated: '2026-02-01',
    
    config: {
        searchEnabled: true,
        printEnabled: true,
        keyboardNav: true,
        rememberPosition: true
    },
    
    navigation: [
        { id: 'getting-started', title: 'Getting Started', icon: 'rocket', subsections: [
            { id: 'welcome', title: 'Welcome', icon: 'home' },
            { id: 'quick-start', title: 'Quick Start Guide', icon: 'zap' },
            { id: 'first-review', title: 'Your First Review', icon: 'play-circle' },
            { id: 'interface-tour', title: 'Interface Tour', icon: 'layout' }
        ]},
        { id: 'document-review', title: 'Document Review', icon: 'file-search', subsections: [
            { id: 'loading-docs', title: 'Loading Documents', icon: 'upload' },
            { id: 'review-types', title: 'Review Presets', icon: 'sliders' },
            { id: 'understanding-results', title: 'Understanding Results', icon: 'bar-chart-2' },
            { id: 'triage-mode', title: 'Triage Mode', icon: 'check-square' },
            { id: 'issue-families', title: 'Issue Families', icon: 'layers' }
        ]},
        { id: 'checkers', title: 'Quality Checkers', icon: 'check-square', subsections: [
            { id: 'checker-overview', title: 'Overview', icon: 'list' },
            { id: 'checker-acronyms', title: 'Acronym Checker', icon: 'a-large-small' },
            { id: 'checker-grammar', title: 'Grammar & Spelling', icon: 'spell-check' },
            { id: 'checker-hyperlinks', title: 'Hyperlink Checker', icon: 'link' },
            { id: 'checker-requirements', title: 'Requirements Language', icon: 'list-checks' },
            { id: 'checker-writing', title: 'Writing Quality', icon: 'pen-tool' },
            { id: 'checker-structure', title: 'Document Structure', icon: 'file-text' },
            { id: 'checker-all', title: 'Complete Reference', icon: 'book-open' }
        ]},
        { id: 'roles', title: 'Roles Studio', icon: 'users', subsections: [
            { id: 'role-overview', title: 'Overview', icon: 'info' },
            { id: 'role-detection', title: 'Role Detection', icon: 'user-search' },
            { id: 'role-adjudication', title: 'Adjudication', icon: 'check-circle' },
            { id: 'role-graph', title: 'Relationship Graph', icon: 'git-branch' },
            { id: 'role-matrix', title: 'RACI Matrix', icon: 'grid-3x3' },
            { id: 'role-crossref', title: 'Cross-Reference', icon: 'table' },
            { id: 'role-dictionary', title: 'Role Dictionary', icon: 'book' },
            { id: 'role-documents', title: 'Document Log', icon: 'file-text' }
        ]},
        { id: 'statement-forge', title: 'Statement Forge', icon: 'hammer', subsections: [
            { id: 'forge-overview', title: 'Overview', icon: 'info' },
            { id: 'forge-extraction', title: 'Statement Extraction', icon: 'filter' },
            { id: 'forge-editing', title: 'Editing Statements', icon: 'edit-3' },
            { id: 'forge-export', title: 'Export Formats', icon: 'download' }
        ]},
        { id: 'fix-assistant', title: 'Fix Assistant', icon: 'wand-2', subsections: [
            { id: 'fix-overview', title: 'Overview', icon: 'info' },
            { id: 'fix-workflow', title: 'Review Workflow', icon: 'workflow' },
            { id: 'fix-learning', title: 'Pattern Learning', icon: 'brain' },
            { id: 'fix-export', title: 'Export Options', icon: 'download' }
        ]},
        { id: 'hyperlink-health', title: 'Hyperlink Health', icon: 'link', subsections: [
            { id: 'hyperlink-overview', title: 'Overview', icon: 'info' },
            { id: 'hyperlink-validation', title: 'URL Validation', icon: 'check-circle' },
            { id: 'hyperlink-status', title: 'Status Codes', icon: 'activity' }
        ]},
        { id: 'batch-processing', title: 'Batch Processing', icon: 'layers', subsections: [
            { id: 'batch-overview', title: 'Overview', icon: 'info' },
            { id: 'batch-queue', title: 'Queue Management', icon: 'list' },
            { id: 'batch-results', title: 'Consolidated Results', icon: 'bar-chart-2' }
        ]},
        { id: 'exporting', title: 'Exporting Results', icon: 'download', subsections: [
            { id: 'export-overview', title: 'Export Options', icon: 'info' },
            { id: 'export-word', title: 'Word Document', icon: 'file-text' },
            { id: 'export-data', title: 'CSV & Excel', icon: 'table' },
            { id: 'export-json', title: 'JSON Data', icon: 'code' }
        ]},
        { id: 'settings', title: 'Settings', icon: 'settings', subsections: [
            { id: 'settings-general', title: 'General', icon: 'sliders' },
            { id: 'settings-appearance', title: 'Appearance', icon: 'palette' },
            { id: 'settings-updates', title: 'Updates', icon: 'refresh-cw' }
        ]},
        { id: 'shortcuts', title: 'Keyboard Shortcuts', icon: 'keyboard' },
        { id: 'technical', title: 'Technical Deep Dive', icon: 'cpu', subsections: [
            { id: 'tech-architecture', title: 'Architecture Overview', icon: 'layers' },
            { id: 'tech-checkers', title: 'Checker Engine', icon: 'cog' },
            { id: 'tech-extraction', title: 'Document Extraction', icon: 'file-code' },
            { id: 'tech-docling', title: 'Docling AI Engine', icon: 'sparkles' },
            { id: 'tech-roles', title: 'Role Extraction', icon: 'users' },
            { id: 'tech-nlp', title: 'NLP Pipeline', icon: 'brain' },
            { id: 'tech-api', title: 'API Reference', icon: 'code' }
        ]},
        { id: 'troubleshooting', title: 'Troubleshooting', icon: 'wrench', subsections: [
            { id: 'trouble-common', title: 'Common Issues', icon: 'alert-circle' },
            { id: 'trouble-errors', title: 'Error Messages', icon: 'alert-triangle' },
            { id: 'trouble-performance', title: 'Performance', icon: 'gauge' }
        ]},
        { id: 'version-history', title: 'Version History', icon: 'history' },
        { id: 'about', title: 'About', icon: 'info' }
    ],

    content: {}
};

// ============================================================================
// WELCOME
// ============================================================================
HelpDocs.content['welcome'] = {
    title: 'Welcome to TechWriterReview',
    subtitle: 'Enterprise-grade document analysis for technical writers',
    html: `
<div class="help-hero">
    <div class="help-hero-icon">
        <i data-lucide="file-search" class="hero-icon-main"></i>
    </div>
    <div class="help-hero-content">
        <p class="help-hero-tagline">Transform your technical documents from good to exceptional</p>
        <p>TechWriterReview is a comprehensive document analysis platform that combines <strong>50+ quality checks</strong>, <strong>AI-powered role extraction</strong>, <strong>statement extraction for process modeling</strong>, and <strong>intelligent fix assistance</strong>—all running locally without internet access.</p>
    </div>
</div>

<div class="help-callout help-callout-success">
    <i data-lucide="award"></i>
    <div>
        <strong>Enterprise-Grade Capabilities</strong>
        <p>Validated on government SOWs, defense SEPs, systems engineering management plans, and industry standards. Role extraction achieves <strong>94.7% precision</strong> and <strong>92.3% F1 score</strong>.</p>
    </div>
</div>

<h2><i data-lucide="layers"></i> Core Capabilities</h2>

<div class="help-feature-grid">
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="shield-check"></i></div>
        <h3>50+ Quality Checks</h3>
        <p>Grammar, spelling, acronyms, passive voice, requirements language (shall/must/will), sentence complexity, document structure, and hyperlink validation.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="users"></i></div>
        <h3>Roles & Responsibilities Studio</h3>
        <p>AI-powered role extraction with RACI matrix generation, relationship graphs, cross-document tracking, adjudication workflow, and role dictionary management.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="hammer"></i></div>
        <h3>Statement Forge</h3>
        <p>Extract requirements, procedures, and action items. Export to TIBCO Nimbus XML, Excel, CSV, or JSON. Supports Actor-Action-Object decomposition.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="wand-2"></i></div>
        <h3>Fix Assistant v2</h3>
        <p>Premium triage interface with confidence scoring, before/after comparison, pattern learning, undo/redo, and export with tracked changes or comments.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="link"></i></div>
        <h3>Hyperlink Health</h3>
        <p>Validate all URLs in your document. Check for broken links, redirects, SSL issues, and missing destinations with detailed status reporting.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="layers"></i></div>
        <h3>Batch Processing</h3>
        <p>Process multiple documents at once. Queue management, progress tracking, and consolidated results across your document library.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="bar-chart-2"></i></div>
        <h3>Metrics & Analytics</h3>
        <p>Quality score dashboards, severity distribution charts, category heatmaps, trend analysis, and exportable reports.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="wifi-off"></i></div>
        <h3>Air-Gapped Ready</h3>
        <p>100% local processing. No cloud dependencies. Designed for classified and secure environments. Offline NLP and document parsing.</p>
    </div>
</div>

<h2><i data-lucide="file-type"></i> Supported File Formats</h2>
<div class="help-formats" style="margin-bottom: 24px;">
    <span class="format-badge format-primary">.docx (Word)</span>
    <span class="format-badge">.pdf</span>
    <span class="format-badge">.txt</span>
    <span class="format-badge">.rtf</span>
    <span class="format-badge">.md (Markdown)</span>
</div>
<p>Word documents (.docx) provide the richest analysis including tracked changes export, comment insertion, and hyperlink extraction.</p>

<h2><i data-lucide="compass"></i> Where to Start</h2>

<div class="help-start-paths">
    <div class="help-path-card" onclick="HelpContent.navigateTo('quick-start')">
        <div class="help-path-icon"><i data-lucide="zap"></i></div>
        <div class="help-path-content">
            <h4>Quick Start Guide</h4>
            <p>Get your first review done in under 60 seconds</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('interface-tour')">
        <div class="help-path-icon"><i data-lucide="layout"></i></div>
        <div class="help-path-content">
            <h4>Interface Tour</h4>
            <p>Learn your way around the workspace</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('checker-overview')">
        <div class="help-path-icon"><i data-lucide="check-square"></i></div>
        <div class="help-path-content">
            <h4>Quality Checkers</h4>
            <p>Understand what each of 50+ checks does</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-overview')">
        <div class="help-path-icon"><i data-lucide="users"></i></div>
        <div class="help-path-content">
            <h4>Roles Studio</h4>
            <p>AI role extraction and RACI matrices</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-overview')">
        <div class="help-path-icon"><i data-lucide="hammer"></i></div>
        <div class="help-path-content">
            <h4>Statement Forge</h4>
            <p>Extract requirements and procedures</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('tech-architecture')">
        <div class="help-path-icon"><i data-lucide="cpu"></i></div>
        <div class="help-path-content">
            <h4>Technical Deep Dive</h4>
            <p>Architecture, APIs, and internals</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
</div>

<h2><i data-lucide="settings-2"></i> Document Type Profiles</h2>
<p>Configure which quality checks run for different document types. Customize profiles for:</p>
<div class="help-formats" style="margin-bottom: 16px;">
    <span class="format-badge format-primary">PrOP</span>
    <span class="format-badge">PAL</span>
    <span class="format-badge">FGOST</span>
    <span class="format-badge">SOW</span>
</div>
<p>Custom profiles persist across sessions. Access via <strong>Settings → Document Profiles</strong> or use the preset buttons in the sidebar.</p>

<h2><i data-lucide="link-2"></i> Link History & Exclusions</h2>
<p>The new <strong>Links</strong> button in the top navigation provides:</p>
<ul style="margin-left: 20px;">
    <li><strong>Persistent URL Exclusions</strong> - Create rules to skip certain URLs during validation (supports regex)</li>
    <li><strong>Scan History</strong> - View historical hyperlink scans with statistics and details</li>
    <li><strong>Match Types</strong> - Filter by contains, exact, prefix, suffix, or regex patterns</li>
</ul>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tips</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            <li>Press <kbd>?</kbd> anytime to see keyboard shortcuts</li>
            <li>Press <kbd>F1</kbd> to open this help</li>
            <li>Press <kbd>Ctrl</kbd>+<kbd>R</kbd> to run a review</li>
            <li>Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> to open Roles Studio</li>
            <li>Press <kbd>Ctrl</kbd>+<kbd>E</kbd> to export results</li>
            <li>In Fix Assistant: <kbd>A</kbd>=Accept, <kbd>R</kbd>=Reject, <kbd>S</kbd>=Skip, <kbd>U</kbd>=Undo</li>
        </ul>
    </div>
</div>
`
};

// ============================================================================
// QUICK START
// ============================================================================
HelpDocs.content['quick-start'] = {
    title: 'Quick Start Guide',
    subtitle: 'Get your first document review done in under 60 seconds',
    html: `
<div class="help-intro-box">
    <p>TechWriterReview is designed to get out of your way and let you focus on your documents. Follow these five steps to run your first review.</p>
</div>

<div class="help-steps-visual">
    <div class="help-step-visual">
        <div class="help-step-number">1</div>
        <div class="help-step-visual-content">
            <h3>Load Your Document</h3>
            <p>Drag and drop a file onto the window, or click <strong>Open</strong> in the sidebar.</p>
            <div class="help-formats">
                <span class="format-badge format-primary">.docx</span>
                <span class="format-badge">.pdf</span>
                <span class="format-badge">.txt</span>
                <span class="format-badge">.rtf</span>
            </div>
            <div class="help-tip-inline">
                <i data-lucide="star"></i>
                <span>Word documents (.docx) provide the richest analysis including tracked changes export.</span>
            </div>
        </div>
    </div>

    <div class="help-step-visual">
        <div class="help-step-number">2</div>
        <div class="help-step-visual-content">
            <h3>Choose Your Checks</h3>
            <p>Select a preset that matches your document type:</p>
            <div class="help-preset-grid">
                <div class="help-preset-item"><strong>All</strong><span>Every check enabled</span></div>
                <div class="help-preset-item"><strong>PrOP</strong><span>Procedures</span></div>
                <div class="help-preset-item"><strong>PAL</strong><span>Process Assets</span></div>
                <div class="help-preset-item"><strong>FGOST</strong><span>Flight/Ground Ops</span></div>
                <div class="help-preset-item"><strong>SOW</strong><span>Statement of Work</span></div>
            </div>
        </div>
    </div>

    <div class="help-step-visual">
        <div class="help-step-number">3</div>
        <div class="help-step-visual-content">
            <h3>Run the Review</h3>
            <p>Click <strong>Review</strong> or press <kbd>Ctrl</kbd>+<kbd>R</kbd>.</p>
            <div class="help-timing-info">
                <div class="help-timing-item"><span class="timing-pages">1-10 pages</span><span class="timing-duration">5-10 sec</span></div>
                <div class="help-timing-item"><span class="timing-pages">10-50 pages</span><span class="timing-duration">10-30 sec</span></div>
                <div class="help-timing-item"><span class="timing-pages">50+ pages</span><span class="timing-duration">30-120 sec</span></div>
            </div>
        </div>
    </div>

    <div class="help-step-visual">
        <div class="help-step-number">4</div>
        <div class="help-step-visual-content">
            <h3>Review the Results</h3>
            <p>Issues appear sorted by severity. The dashboard shows:</p>
            <ul class="help-checklist">
                <li><i data-lucide="check"></i> <strong>Quality Score</strong> — Letter grade based on issue density</li>
                <li><i data-lucide="check"></i> <strong>Severity Chart</strong> — Click segments to filter</li>
                <li><i data-lucide="check"></i> <strong>Readability Metrics</strong> — Flesch, FK Grade, Fog Index</li>
            </ul>
        </div>
    </div>

    <div class="help-step-visual">
        <div class="help-step-number">5</div>
        <div class="help-step-visual-content">
            <h3>Export Your Results</h3>
            <p>Click <strong>Export</strong> to create deliverables:</p>
            <div class="help-export-options">
                <div class="help-export-option">
                    <i data-lucide="file-text"></i>
                    <div><strong>Word</strong><span>Tracked changes & comments</span></div>
                </div>
                <div class="help-export-option">
                    <i data-lucide="table"></i>
                    <div><strong>CSV/Excel</strong><span>Tabular tracking</span></div>
                </div>
                <div class="help-export-option">
                    <i data-lucide="code"></i>
                    <div><strong>JSON</strong><span>Automation</span></div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="help-callout help-callout-success">
    <i data-lucide="party-popper"></i>
    <div>
        <strong>That's It!</strong>
        <p>You've completed your first review. Explore the sidebar to learn about advanced features like Fix Assistant, role extraction, and Statement Forge.</p>
    </div>
</div>

<h2><i data-lucide="wand-2"></i> Next Step: Fix Assistant</h2>
<p>After reviewing results, click <strong>Fix Assistant</strong> to enter the premium triage interface:</p>
<ul>
    <li><strong>Confidence Scoring</strong> — Each fix has a Safe/Review/Manual confidence level</li>
    <li><strong>Accept/Reject/Skip</strong> — Use buttons or keyboard shortcuts (<kbd>A</kbd>/<kbd>R</kbd>/<kbd>S</kbd>)</li>
    <li><strong>Undo/Redo</strong> — Press <kbd>U</kbd> or <kbd>Shift</kbd>+<kbd>U</kbd> to reverse decisions</li>
    <li><strong>Pattern Learning</strong> — The tool learns from your decisions to improve future suggestions</li>
    <li><strong>Export Options</strong> — Accepted fixes become tracked changes; rejected fixes become comments</li>
</ul>

<h2><i data-lucide="package"></i> Complete Setup</h2>

<p>Running <code>setup.bat</code> installs all enhancement libraries automatically:</p>

<pre class="help-code">
# Run from TechWriterReview folder
setup.bat
</pre>

<p>This installs:</p>
<ul>
    <li><strong>Multi-library table extraction</strong> — Camelot, Tabula, pdfplumber (~88% accuracy)</li>
    <li><strong>OCR support</strong> — Tesseract for scanned PDFs</li>
    <li><strong>NLP enhancement</strong> — spaCy, sklearn for better role detection (~90% accuracy)</li>
    <li><strong>Grammar checking</strong> — LanguageTool integration</li>
</ul>

<h2><i data-lucide="sparkles"></i> Optional: AI Extraction with Docling</h2>

<p>For maximum accuracy (+7% on all metrics), also install Docling:</p>

<pre class="help-code">
# Additional step for AI-powered extraction
setup_docling.bat
</pre>

<p>This adds:</p>
<ul>
    <li><strong>AI-powered table recognition</strong> — 95% accuracy vs 88% without</li>
    <li><strong>Layout understanding</strong> — Correct reading order in complex documents</li>
    <li><strong>Section detection</strong> — Identifies headings without style dependencies</li>
</ul>

<div class="help-callout help-callout-info">
    <i data-lucide="shield"></i>
    <div>
        <strong>Offline Operation</strong>
        <p>All extraction runs 100% offline. No data leaves your machine. See Technical → Document Extraction for details.</p>
    </div>
</div>
`
};

// ============================================================================
// FIRST REVIEW (DETAILED)
// ============================================================================
HelpDocs.content['first-review'] = {
    title: 'Your First Review',
    subtitle: 'A detailed walkthrough of the complete review process',
    html: `
<p>This guide walks you through a complete document review, explaining each step in detail.</p>

<h2><i data-lucide="file-plus"></i> Before You Begin</h2>
<p>Ensure you have:</p>
<ul>
    <li>A document ready to review (.docx recommended for full features)</li>
    <li>TechWriterReview running at <code>http://127.0.0.1:5050</code></li>
    <li>Time for thorough review—about 15 minutes for a 50-page document</li>
</ul>

<h2><i data-lucide="upload"></i> Step 1: Load Your Document</h2>

<h3>Loading Methods</h3>
<table class="help-table help-table-striped">
    <thead><tr><th>Method</th><th>How</th><th>Best For</th></tr></thead>
    <tbody>
        <tr><td><strong>Drag & Drop</strong></td><td>Drag file from Explorer onto window</td><td>Fastest for single files</td></tr>
        <tr><td><strong>Open Button</strong></td><td>Click Open in sidebar, browse</td><td>When navigating folders</td></tr>
        <tr><td><strong>Keyboard</strong></td><td><kbd>Ctrl</kbd>+<kbd>O</kbd></td><td>Power users</td></tr>
    </tbody>
</table>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Why Word Documents Are Preferred</strong>
        <p>Word (.docx) files preserve document structure including headings, lists, and formatting. This enables tracked changes export and accurate paragraph-level context. PDFs work but are limited to text analysis.</p>
    </div>
</div>

<h2><i data-lucide="sliders"></i> Step 2: Configure Your Checks</h2>

<h3>For Requirements Documents</h3>
<div class="help-recommendation-box">
    <div class="help-recommend-enable">
        <h4><i data-lucide="check-circle"></i> Enable</h4>
        <ul>
            <li>Requirements language (shall/will/must)</li>
            <li>TBD/TBR detection</li>
            <li>Undefined acronyms</li>
            <li>Role extraction</li>
        </ul>
    </div>
</div>

<h3>For Work Instructions</h3>
<div class="help-recommendation-box">
    <div class="help-recommend-enable">
        <h4><i data-lucide="check-circle"></i> Enable</h4>
        <ul>
            <li>Passive voice detection</li>
            <li>Imperative mood</li>
            <li>Wordy phrases</li>
            <li>Step numbering</li>
        </ul>
    </div>
</div>

<h2><i data-lucide="play"></i> Step 3: Run the Analysis</h2>
<p>Click <strong>Review</strong> or press <kbd>Ctrl</kbd>+<kbd>R</kbd>. The progress indicator shows the current checker, percentage complete, and estimated time remaining.</p>

<h2><i data-lucide="bar-chart-2"></i> Step 4: Interpret the Results</h2>

<h3>Quality Score</h3>
<table class="help-table">
    <thead><tr><th>Grade</th><th>Issues/1K Words</th><th>Meaning</th></tr></thead>
    <tbody>
        <tr><td><span class="grade-badge grade-a">A+/A</span></td><td>0-5</td><td>Excellent—ready for final review</td></tr>
        <tr><td><span class="grade-badge grade-b">B+/B</span></td><td>6-15</td><td>Good—minor improvements needed</td></tr>
        <tr><td><span class="grade-badge grade-c">C+/C</span></td><td>16-30</td><td>Acceptable—address before stakeholder review</td></tr>
        <tr><td><span class="grade-badge grade-d">D</span></td><td>31-50</td><td>Below standard—significant rework</td></tr>
        <tr><td><span class="grade-badge grade-f">F</span></td><td>50+</td><td>Poor—comprehensive revision required</td></tr>
    </tbody>
</table>

<h2><i data-lucide="check-square"></i> Step 5: Triage and Export</h2>
<p>Use <strong>Triage Mode</strong> (<kbd>T</kbd>) to systematically review each issue:</p>
<div class="help-key-actions">
    <div class="help-key-action"><kbd>K</kbd><span>Keep (include in export)</span></div>
    <div class="help-key-action"><kbd>S</kbd><span>Suppress (false positive)</span></div>
    <div class="help-key-action"><kbd>F</kbd><span>Fixed (already addressed)</span></div>
    <div class="help-key-action"><kbd>Space</kbd><span>Skip to next</span></div>
</div>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Issue Families Save Time</strong>
        <p>When the same word is flagged multiple times, TechWriterReview groups them into a "family." Apply a decision to the entire family at once with <kbd>Shift</kbd>+action key.</p>
    </div>
</div>
`
};

// ============================================================================
// INTERFACE TOUR
// ============================================================================
HelpDocs.content['interface-tour'] = {
    title: 'Interface Tour',
    subtitle: 'Understanding the TechWriterReview workspace',
    html: `
<p>The TechWriterReview interface is organized into distinct areas, each with a specific purpose.</p>

<div class="help-interface-diagram">
    <div class="help-interface-area help-interface-sidebar">
        <span class="help-area-label">① Sidebar</span>
        <span class="help-area-desc">Commands & Config</span>
    </div>
    <div class="help-interface-main">
        <div class="help-interface-area help-interface-dashboard">
            <span class="help-area-label">② Dashboard</span>
            <span class="help-area-desc">Metrics & Charts</span>
        </div>
        <div class="help-interface-area help-interface-results">
            <span class="help-area-label">③ Results Panel</span>
            <span class="help-area-desc">Issue List</span>
        </div>
    </div>
    <div class="help-interface-area help-interface-footer">
        <span class="help-area-label">④ Footer</span>
        <span class="help-area-desc">Tools & Status</span>
    </div>
</div>

<h2><i data-lucide="panel-left"></i> ① Sidebar</h2>
<p>The command center for document operations. Press <kbd>Ctrl</kbd>+<kbd>B</kbd> to toggle.</p>

<h3>Action Buttons</h3>
<table class="help-table">
    <thead><tr><th>Button</th><th>Function</th><th>Shortcut</th></tr></thead>
    <tbody>
        <tr><td><strong>Open</strong></td><td>Load a document</td><td><kbd>Ctrl</kbd>+<kbd>O</kbd></td></tr>
        <tr><td><strong>Review</strong></td><td>Run analysis</td><td><kbd>Ctrl</kbd>+<kbd>R</kbd></td></tr>
        <tr><td><strong>Export</strong></td><td>Generate deliverables</td><td><kbd>Ctrl</kbd>+<kbd>E</kbd></td></tr>
    </tbody>
</table>

<h3>Presets</h3>
<ul>
    <li><strong>All</strong> — Enable every checker</li>
    <li><strong>None</strong> — Start fresh</li>
    <li><strong>PrOP</strong> — Procedures & Operating Procedures</li>
    <li><strong>PAL</strong> — Process Asset Library</li>
    <li><strong>FGOST</strong> — Flight/Ground Operations</li>
    <li><strong>SOW</strong> — Statement of Work</li>
</ul>

<h2><i data-lucide="layout-dashboard"></i> ② Dashboard</h2>
<p>At-a-glance metrics after each review:</p>
<ul>
    <li><strong>Quality Score</strong> — Letter grade (A+ through F)</li>
    <li><strong>Severity Chart</strong> — Interactive pie chart (click to filter)</li>
    <li><strong>Readability</strong> — Flesch, FK Grade, Fog Index</li>
</ul>

<h2><i data-lucide="list"></i> ③ Results Panel</h2>
<p>The main working area showing all identified issues.</p>
<ul>
    <li><strong>Filter Bar</strong> — Severity, category, search, status</li>
    <li><strong>Issue Cards</strong> — Click for details, use Triage Mode for systematic review</li>
</ul>

<h2><i data-lucide="panel-bottom"></i> ④ Footer</h2>
<p>Access additional tools:</p>
<div class="help-footer-tools">
    <div class="help-footer-tool"><i data-lucide="history"></i><div><strong>Scan History</strong><p>Previous reviews</p></div></div>
    <div class="help-footer-tool"><i data-lucide="settings"></i><div><strong>Settings</strong><p>Configuration</p></div></div>
    <div class="help-footer-tool"><i data-lucide="users"></i><div><strong>Roles</strong><p>RACI matrix</p></div></div>
    <div class="help-footer-tool"><i data-lucide="hammer"></i><div><strong>Statement Forge</strong><p>Extract requirements</p></div></div>
    <div class="help-footer-tool"><i data-lucide="help-circle"></i><div><strong>Help</strong><p><kbd>F1</kbd></p></div></div>
</div>
`
};

// ============================================================================
// LOADING DOCUMENTS
// ============================================================================
HelpDocs.content['loading-docs'] = {
    title: 'Loading Documents',
    subtitle: 'Supported formats, loading methods, and best practices',
    html: `
<h2><i data-lucide="file"></i> Supported Formats</h2>
<table class="help-table help-table-striped">
    <thead><tr><th>Format</th><th>Extension</th><th>Features</th><th>Best For</th></tr></thead>
    <tbody>
        <tr>
            <td><strong>Word Document</strong></td>
            <td><code>.docx</code></td>
            <td><span class="feature-yes">✓</span> Full analysis, track changes</td>
            <td>Primary use—specifications, requirements</td>
        </tr>
        <tr>
            <td><strong>PDF</strong></td>
            <td><code>.pdf</code></td>
            <td><span class="feature-yes">✓</span> Text extraction</td>
            <td>Final/published documents</td>
        </tr>
        <tr>
            <td><strong>Plain Text</strong></td>
            <td><code>.txt</code></td>
            <td><span class="feature-yes">✓</span> Full text analysis</td>
            <td>Code documentation, READMEs</td>
        </tr>
        <tr>
            <td><strong>Rich Text</strong></td>
            <td><code>.rtf</code></td>
            <td><span class="feature-partial">~</span> Basic formatting</td>
            <td>Cross-platform documents</td>
        </tr>
    </tbody>
</table>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Why Word Documents Are Recommended</strong>
        <p>Word documents preserve the full document structure. This enables tracked changes export (inserting corrections directly into your document) and accurate paragraph-level context.</p>
    </div>
</div>

<h2><i data-lucide="upload"></i> Loading Methods</h2>
<ol>
    <li><strong>Drag and Drop</strong> — Fastest. Drag file from Explorer onto the window.</li>
    <li><strong>Open Button</strong> — Click Open in sidebar or press <kbd>Ctrl</kbd>+<kbd>O</kbd>.</li>
    <li><strong>Batch Load</strong> — Select a folder to queue multiple documents.</li>
</ol>

<h2><i data-lucide="gauge"></i> Performance</h2>
<table class="help-table help-table-compact">
    <tr><td><strong>Maximum Size</strong></td><td>50 MB per document</td></tr>
    <tr><td><strong>Recommended</strong></td><td>Under 10 MB for best performance</td></tr>
</table>

<h2><i data-lucide="check-circle"></i> Best Practices</h2>
<ul>
    <li><strong>Use .docx when possible</strong> — Full feature support</li>
    <li><strong>For PDFs, ensure selectable text</strong> — Scanned images can't be analyzed</li>
    <li><strong>Close documents in Word first</strong> — Locked files may not load</li>
    <li><strong>Remove password protection</strong> — Encrypted documents must be unlocked</li>
</ul>
`
};

// ============================================================================
// REVIEW PRESETS
// ============================================================================
HelpDocs.content['review-types'] = {
    title: 'Review Presets',
    subtitle: 'Pre-configured check combinations for different document types',
    html: `
<p>Review presets are curated combinations of quality checks optimized for specific document types.</p>

<div class="help-callout help-callout-info">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Why Presets Exist</strong>
        <p>Different documents have different quality criteria. A requirements specification needs "shall/will/must" checking but not passive voice warnings. A work instruction needs imperative mood but doesn't care about TBD markers. Presets encode this domain knowledge.</p>
    </div>
</div>

<h2><i data-lucide="sliders"></i> Available Presets</h2>

<div class="help-preset-cards">
    <div class="help-preset-card">
        <h3>All <span class="preset-badge">50+ Checks</span></h3>
        <p>Enables every available checker. Use for comprehensive analysis or when unsure which preset to use.</p>
        <h4>Best For</h4>
        <ul><li>Initial assessment</li><li>Mixed content documents</li><li>Quality audits</li></ul>
    </div>
    <div class="help-preset-card">
        <h3>PrOP <span class="preset-badge">Procedures</span></h3>
        <p>Optimized for Procedures and Operating Procedures.</p>
        <h4>Key Checks</h4>
        <ul><li>Requirements language</li><li>Imperative mood</li><li>Step numbering</li><li>Role extraction</li></ul>
    </div>
    <div class="help-preset-card">
        <h3>PAL <span class="preset-badge">Process Assets</span></h3>
        <p>Tailored for Process Asset Library documents.</p>
        <h4>Key Checks</h4>
        <ul><li>Passive voice</li><li>Wordy phrases</li><li>Sentence length</li><li>Readability</li></ul>
    </div>
    <div class="help-preset-card">
        <h3>FGOST <span class="preset-badge">Operations</span></h3>
        <p>For Flight & Ground Operations Safety Training.</p>
        <h4>Key Checks</h4>
        <ul><li>Safety terminology</li><li>Warning/caution format</li><li>Role extraction</li><li>Cross-references</li></ul>
    </div>
    <div class="help-preset-card">
        <h3>SOW <span class="preset-badge">Contracts</span></h3>
        <p>Configured for Statement of Work documents.</p>
        <h4>Key Checks</h4>
        <ul><li>TBD/TBR detection</li><li>Requirements language</li><li>Undefined terms</li><li>Completeness</li></ul>
    </div>
</div>

<h2><i data-lucide="settings"></i> Custom Configurations</h2>
<p>Presets are starting points. You can enable additional checks after applying a preset, disable irrelevant checks, or start with "None" and build your own configuration.</p>
`
};

// ============================================================================
// UNDERSTANDING RESULTS
// ============================================================================
HelpDocs.content['understanding-results'] = {
    title: 'Understanding Results',
    subtitle: 'How to interpret the dashboard, metrics, and issue list',
    html: `
<p>After running a review, TechWriterReview presents results in two views: the Dashboard (aggregate metrics) and the Issue List (individual findings).</p>

<h2><i data-lucide="layout-dashboard"></i> The Dashboard</h2>

<h3>Quality Score</h3>
<p>Letter grade representing overall quality, calculated from issues per 1,000 words:</p>
<div class="help-formula-box"><code>Issues per 1K Words = (Total Issues × 1000) ÷ Word Count</code></div>

<h3>Severity Distribution</h3>
<p>Interactive pie chart. Click any segment to filter the issue list.</p>
<div class="help-severity-legend">
    <div class="help-severity-item severity-critical"><span class="severity-dot"></span><div><strong>Critical</strong><p>Must fix before release</p></div></div>
    <div class="help-severity-item severity-high"><span class="severity-dot"></span><div><strong>High</strong><p>Fix soon</p></div></div>
    <div class="help-severity-item severity-medium"><span class="severity-dot"></span><div><strong>Medium</strong><p>Should address</p></div></div>
    <div class="help-severity-item severity-low"><span class="severity-dot"></span><div><strong>Low</strong><p>Minor improvements</p></div></div>
    <div class="help-severity-item severity-info"><span class="severity-dot"></span><div><strong>Info</strong><p>Informational only</p></div></div>
</div>

<h3>Readability Metrics</h3>
<div class="help-readability-cards">
    <div class="help-readability-card">
        <h4>Flesch Reading Ease</h4>
        <p>0-100 scale. Higher = easier. Target: 30-50 for tech docs.</p>
    </div>
    <div class="help-readability-card">
        <h4>Flesch-Kincaid Grade</h4>
        <p>US school grade level. Target: 10-14 for tech audiences.</p>
    </div>
    <div class="help-readability-card">
        <h4>Gunning Fog Index</h4>
        <p>Years of education needed. Target: 12-16 for tech docs.</p>
    </div>
</div>

<h2><i data-lucide="list"></i> The Issue List</h2>
<p>Each issue card shows:</p>
<ul>
    <li><strong>Severity Badge</strong> — Color-coded (red, orange, yellow, green, blue)</li>
    <li><strong>Category</strong> — Which checker found the issue</li>
    <li><strong>Message</strong> — Description of the problem</li>
    <li><strong>Flagged Text</strong> — The exact problematic text</li>
    <li><strong>Suggestion</strong> — Recommended correction (when available)</li>
</ul>

<h3>Filtering</h3>
<ul>
    <li><strong>Severity dropdown</strong> — Show only Critical, High, etc.</li>
    <li><strong>Category dropdown</strong> — Show only Grammar, Acronyms, etc.</li>
    <li><strong>Search box</strong> — Find issues containing specific text</li>
    <li><strong>Status filter</strong> — Pending, Kept, Suppressed, Fixed</li>
</ul>

<h2><i data-lucide="box"></i> Document Analytics</h2>
<p>The Document Analytics panel provides additional visualizations:</p>

<h3>3D Carousel (New in v3.0.120)</h3>
<p>Issues by Section displayed as an interactive 3D carousel:</p>
<ul>
    <li><strong>Drag to spin</strong> — Click and drag to rotate the carousel continuously</li>
    <li><strong>Slider navigation</strong> — Use the slider below to position precisely</li>
    <li><strong>Click to filter</strong> — Click any section box to filter issues to that section</li>
    <li><strong>Density coloring</strong> — Border colors indicate issue density (none/low/medium/high)</li>
    <li><strong>Touch support</strong> — Works with touch gestures on mobile devices</li>
</ul>

<h3>Category × Severity Heatmap</h3>
<p>Matrix showing issue counts by category and severity. Click any cell to filter the issue list.</p>

<h3>Hyperlink Status Panel</h3>
<p>After hyperlink validation, shows valid/broken/redirect counts with clickable rows to open URLs in new tabs for manual verification.</p>
`
};

// ============================================================================
// TRIAGE MODE
// ============================================================================
HelpDocs.content['triage-mode'] = {
    title: 'Triage Mode',
    subtitle: 'Efficiently review and categorize issues one by one',
    html: `
<p>Triage Mode provides a focused, keyboard-driven workflow for systematically reviewing each issue.</p>

<h2><i data-lucide="play"></i> Entering Triage Mode</h2>
<p>Press <kbd>T</kbd> or click the <strong>Triage</strong> button. The interface shows one issue at a time with prominent action buttons.</p>

<h2><i data-lucide="keyboard"></i> Keyboard Actions</h2>
<div class="help-triage-keys">
    <div class="help-triage-key">
        <div class="help-key-combo"><kbd>K</kbd> or <kbd>→</kbd></div>
        <div class="help-key-desc"><strong>Keep</strong><p>Mark as valid, include in exports</p></div>
    </div>
    <div class="help-triage-key">
        <div class="help-key-combo"><kbd>S</kbd></div>
        <div class="help-key-desc"><strong>Suppress</strong><p>Dismiss as false positive</p></div>
    </div>
    <div class="help-triage-key">
        <div class="help-key-combo"><kbd>F</kbd></div>
        <div class="help-key-desc"><strong>Fixed</strong><p>Mark as already addressed</p></div>
    </div>
    <div class="help-triage-key">
        <div class="help-key-combo"><kbd>Space</kbd></div>
        <div class="help-key-desc"><strong>Skip</strong><p>Move to next without decision</p></div>
    </div>
    <div class="help-triage-key">
        <div class="help-key-combo"><kbd>←</kbd></div>
        <div class="help-key-desc"><strong>Previous</strong><p>Go back to reconsider</p></div>
    </div>
    <div class="help-triage-key">
        <div class="help-key-combo"><kbd>Esc</kbd></div>
        <div class="help-key-desc"><strong>Exit</strong><p>Return to normal view</p></div>
    </div>
</div>

<h2><i data-lucide="layers"></i> Family Actions</h2>
<p>When an issue is part of a family (same word flagged multiple times), hold <kbd>Shift</kbd> to apply action to entire family:</p>
<ul>
    <li><kbd>Shift</kbd>+<kbd>K</kbd> — Keep all in family</li>
    <li><kbd>Shift</kbd>+<kbd>S</kbd> — Suppress all in family</li>
    <li><kbd>Shift</kbd>+<kbd>F</kbd> — Mark all as fixed</li>
</ul>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Family Actions Save Significant Time</strong>
        <p>If "utilize" is flagged 47 times and you decide it's acceptable, press <kbd>Shift</kbd>+<kbd>S</kbd> once to suppress all 47 instead of pressing <kbd>S</kbd> forty-seven times.</p>
    </div>
</div>
`
};

// ============================================================================
// ISSUE FAMILIES
// ============================================================================
HelpDocs.content['issue-families'] = {
    title: 'Issue Families',
    subtitle: 'Group related issues for efficient batch processing',
    html: `
<p>Issue Families group multiple occurrences of the same issue together, allowing single decisions that apply to all.</p>

<h2><i data-lucide="info"></i> What Creates a Family?</h2>
<p>Issues are grouped when they share the same:</p>
<ul>
    <li>Checker (e.g., "Wordy Phrases")</li>
    <li>Flagged text (e.g., "utilize")</li>
</ul>
<p>For example, if "utilize" appears 23 times and is flagged each time, all 23 become one family.</p>

<h2><i data-lucide="eye"></i> Identifying Families</h2>
<p>Family members show a badge with the count (e.g., "×23") and a linking icon.</p>

<h2><i data-lucide="check-square"></i> Family Actions</h2>
<h3>In Normal View</h3>
<p>Click the family indicator to expand. Use family action buttons to Keep All, Suppress All, or View All.</p>

<h3>In Triage Mode</h3>
<p>Hold <kbd>Shift</kbd> + action key to apply to entire family.</p>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Why Families Matter</strong>
        <p>A 100-page document might have 500+ issues. Without families, you'd review each individually. With families, similar issues collapse to perhaps 80 decisions—an 80% reduction in review time.</p>
    </div>
</div>
`
};

// ============================================================================
// CHECKER OVERVIEW
// ============================================================================
HelpDocs.content['checker-overview'] = {
    title: 'Quality Checkers Overview',
    subtitle: 'Understanding the 50+ checks available',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="shield-check" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>TechWriterReview includes <strong>50+ quality checks</strong> across 15 checker modules, covering grammar, spelling, acronyms, requirements language, document structure, hyperlinks, and more. All processing happens locally—no cloud dependencies.</p>
    </div>
</div>

<h2><i data-lucide="cog"></i> How Checkers Work</h2>
<ol>
    <li><strong>Extract</strong> — Parse document text, tables, and structure from DOCX, PDF, TXT, or RTF</li>
    <li><strong>Normalize</strong> — Handle smart quotes, special characters, and encoding</li>
    <li><strong>Analyze</strong> — Run each enabled checker against every paragraph</li>
    <li><strong>Score</strong> — Assign severity (Critical/High/Medium/Low/Info) based on impact</li>
    <li><strong>Deduplicate</strong> — Remove redundant findings for cleaner results</li>
    <li><strong>Aggregate</strong> — Present results in dashboard with filtering and sorting</li>
</ol>

<h2><i data-lucide="layers"></i> Checker Categories</h2>
<div class="help-category-grid">
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-grammar')">
        <div class="help-category-icon"><i data-lucide="spell-check"></i></div>
        <h3>Grammar & Spelling</h3>
        <p>Typos, grammatical errors, subject-verb agreement, punctuation, contractions</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-acronyms')">
        <div class="help-category-icon"><i data-lucide="a-large-small"></i></div>
        <h3>Acronyms</h3>
        <p>Undefined acronyms, inconsistent definitions, common ALL CAPS words</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-writing')">
        <div class="help-category-icon"><i data-lucide="pen-tool"></i></div>
        <h3>Writing Quality</h3>
        <p>Passive voice, wordy phrases, sentence length, readability, complexity</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-requirements')">
        <div class="help-category-icon"><i data-lucide="list-checks"></i></div>
        <h3>Requirements Language</h3>
        <p>Shall/will/must usage, TBD/TBR flags, ambiguous terms, testability</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-structure')">
        <div class="help-category-icon"><i data-lucide="file-text"></i></div>
        <h3>Document Structure</h3>
        <p>Heading hierarchy, numbering consistency, cross-references, orphan text</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-hyperlinks')">
        <div class="help-category-icon"><i data-lucide="link"></i></div>
        <h3>Hyperlinks</h3>
        <p>URL validation, broken links, redirects, SSL issues, internal anchors</p>
    </div>
</div>

<h2><i data-lucide="list"></i> Complete Checker List</h2>
<table class="help-table">
    <thead><tr><th>Module</th><th>Checks Included</th><th>Example Issues</th></tr></thead>
    <tbody>
        <tr><td><strong>Acronym Checker</strong></td><td>Undefined acronyms, redefinitions, inconsistent usage</td><td>"SRR" used without definition</td></tr>
        <tr><td><strong>Grammar Checker</strong></td><td>Subject-verb agreement, tense consistency, articles</td><td>"The team were" → "The team was"</td></tr>
        <tr><td><strong>Spell Checker</strong></td><td>Misspellings, technical term variations</td><td>"recieve" → "receive"</td></tr>
        <tr><td><strong>Enhanced Grammar</strong></td><td>Advanced patterns, context-aware suggestions</td><td>Double negatives, dangling modifiers</td></tr>
        <tr><td><strong>Writing Quality</strong></td><td>Passive voice, wordiness, sentence complexity</td><td>"It is recommended that" → "We recommend"</td></tr>
        <tr><td><strong>Sentence Checker</strong></td><td>Length, fragments, run-ons</td><td>Sentences over 40 words</td></tr>
        <tr><td><strong>Punctuation Checker</strong></td><td>Spacing, quotation marks, lists</td><td>Double spaces, smart quote consistency</td></tr>
        <tr><td><strong>Requirements Checker</strong></td><td>Shall/will/must, ambiguity, testability</td><td>"shall" in non-binding context</td></tr>
        <tr><td><strong>Document Checker</strong></td><td>Structure, headings, cross-refs</td><td>Skipped heading levels (H1 → H3)</td></tr>
        <tr><td><strong>Hyperlink Checker</strong></td><td>URL format, validation, status</td><td>Broken external link (404)</td></tr>
        <tr><td><strong>Image/Figure Checker</strong></td><td>Alt text, captions, references</td><td>Figure without caption</td></tr>
        <tr><td><strong>Word Language Checker</strong></td><td>MS Word specific issues</td><td>Track changes artifacts</td></tr>
        <tr><td><strong>Document Comparison</strong></td><td>Version differences</td><td>Changed requirements between versions</td></tr>
    </tbody>
</table>

<h2><i data-lucide="sliders"></i> Configuring Checkers</h2>
<ul>
    <li><strong>Review Presets</strong> — Choose preset profiles (PrOP, PAL, FGOST, SOW) to enable relevant checkers</li>
    <li><strong>Document Type Profiles</strong> — Customize which checks run for each document type in <strong>Settings → Document Profiles</strong></li>
    <li><strong>Advanced Settings</strong> — Fine-tune individual checkers in the sidebar</li>
    <li><strong>Severity Filters</strong> — Focus on Critical/High issues or see everything</li>
    <li><strong>Category Filters</strong> — Show only grammar, only requirements, etc.</li>
</ul>

<h3>Document Type Profiles (New in v3.0.115)</h3>
<p>Create custom checker configurations for each document type:</p>
<table class="help-table">
    <thead><tr><th>Profile</th><th>Focus</th><th>Key Checks</th></tr></thead>
    <tbody>
        <tr><td><strong>PrOP</strong></td><td>Process clarity & step-by-step instructions</td><td>Passive Voice, Weak Language, Requirements, Roles, Structure</td></tr>
        <tr><td><strong>PAL</strong></td><td>Templates & assets - grammar focus</td><td>Spelling, Grammar, Punctuation, Structure, References</td></tr>
        <tr><td><strong>FGOST</strong></td><td>Decision gates - requirements & completeness</td><td>Requirements, TBD/TBR, Roles, Testability, Escape Clauses</td></tr>
        <tr><td><strong>SOW</strong></td><td>Contract-focused legal/technical clarity</td><td>Requirements, Passive Voice, Acronyms, Escape Clauses, Units</td></tr>
    </tbody>
</table>
<p>Custom profiles persist in localStorage across sessions. First-time users see a prompt to configure profiles on initial launch.</p>

<h2><i data-lucide="target"></i> Severity Levels</h2>
<table class="help-table">
    <thead><tr><th>Level</th><th>Impact</th><th>Example</th></tr></thead>
    <tbody>
        <tr><td style="color: #dc2626;"><strong>Critical</strong></td><td>Could cause serious misunderstanding or compliance failure</td><td>Undefined shall statement, ambiguous requirement</td></tr>
        <tr><td style="color: #ea580c;"><strong>High</strong></td><td>Likely to cause confusion or errors</td><td>Undefined acronym, broken hyperlink</td></tr>
        <tr><td style="color: #eab308;"><strong>Medium</strong></td><td>Should be fixed but won't cause major issues</td><td>Passive voice overuse, long sentence</td></tr>
        <tr><td style="color: #22c55e;"><strong>Low</strong></td><td>Style improvement, nice to have</td><td>Wordy phrase, minor punctuation</td></tr>
        <tr><td style="color: #6b7280;"><strong>Info</strong></td><td>Informational only, not necessarily an issue</td><td>Detected acronym definition</td></tr>
    </tbody>
</table>

<h2><i data-lucide="lightbulb"></i> Philosophy</h2>
<ul>
    <li><strong>Opinionated but Configurable</strong> — Checkers embody industry best practices, but you can disable what doesn't apply to your context.</li>
    <li><strong>Severity Reflects Impact</strong> — Critical/High issues could cause real problems; Medium/Low are style improvements.</li>
    <li><strong>Suggestions, Not Mandates</strong> — Every finding is a recommendation. You decide what to fix based on your document's purpose.</li>
    <li><strong>False Positive Minimization</strong> — Checkers are tuned to minimize noise while catching real issues.</li>
</ul>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip: Use Review Presets</strong>
        <p>Start with a preset that matches your document type. PrOP for procedures, PAL for process assets, FGOST for flight/ground operations, SOW for statements of work. Each preset enables the most relevant checkers.</p>
    </div>
</div>
`
};

// ============================================================================
// ACRONYM CHECKER
// ============================================================================
HelpDocs.content['checker-acronyms'] = {
    title: 'Acronym Checker',
    subtitle: 'Ensure acronyms are defined and used consistently',
    html: `
<div class="help-checker-header">
    <div class="help-checker-icon"><i data-lucide="a-large-small"></i></div>
    <div class="help-checker-intro">
        <p>Identifies undefined acronyms, inconsistent usage, and missing definitions.</p>
    </div>
</div>

<h2><i data-lucide="help-circle"></i> Why This Matters</h2>
<p>Undefined acronyms confuse readers, create accessibility barriers, and may cause compliance issues.</p>

<h2><i data-lucide="check-square"></i> What It Checks</h2>
<div class="help-check-list">
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>Undefined Acronyms</h4>
            <p>Acronyms used without definition.</p>
            <div class="help-check-example">
                <span class="example-bad">❌ "The SRR will occur in Q3."</span>
                <span class="example-good">✓ "The System Requirements Review (SRR) will occur in Q3."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Inconsistent Definitions</h4>
            <p>Same acronym defined differently in multiple places.</p>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-low">Low</div>
        <div class="help-check-content">
            <h4>Redefined Acronyms</h4>
            <p>Redundant definitions of the same term.</p>
        </div>
    </div>
</div>

<h2><i data-lucide="cog"></i> How Detection Works</h2>
<ol>
    <li><strong>Pattern matching</strong> — Identifies potential acronyms (2-6 uppercase letters)</li>
    <li><strong>Definition scanning</strong> — Looks for "Term (ACRONYM)" patterns</li>
    <li><strong>Context analysis</strong> — Filters common words, units, known abbreviations</li>
    <li><strong>Document-order tracking</strong> — Ensures definitions appear before first use</li>
</ol>

<h2><i data-lucide="book"></i> Built-in Dictionary</h2>
<p>Includes common acronyms from government contracting, aerospace, systems engineering, and general technical writing. Add custom acronyms in Settings → Acronyms.</p>
`
};

// ============================================================================
// GRAMMAR CHECKER
// ============================================================================
HelpDocs.content['checker-grammar'] = {
    title: 'Grammar & Spelling',
    subtitle: 'Catch typos, grammatical errors, and punctuation issues',
    html: `
<div class="help-checker-header">
    <div class="help-checker-icon"><i data-lucide="spell-check"></i></div>
    <div class="help-checker-intro">
        <p>Identifies basic language quality issues that could undermine your document's credibility.</p>
    </div>
</div>

<h2><i data-lucide="help-circle"></i> Why This Matters</h2>
<p>Even a single typo in a technical document can damage credibility, introduce ambiguity, and cause failed reviews.</p>

<h2><i data-lucide="check-square"></i> What It Checks</h2>
<div class="help-check-list">
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>Spelling Errors</h4>
            <p>Words not in dictionary.</p>
            <div class="help-check-example">
                <span class="example-bad">❌ "The systme shall..."</span>
                <span class="example-good">✓ "The system shall..."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>Commonly Confused Words</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "The affect of the change..."</span>
                <span class="example-good">✓ "The effect of the change..."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Subject-Verb Agreement</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "The requirements is documented..."</span>
                <span class="example-good">✓ "The requirements are documented..."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-low">Low</div>
        <div class="help-check-content">
            <h4>Double Words</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "The the system shall..."</span>
            </div>
        </div>
    </div>
</div>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Air-Gapped Operation</strong>
        <p>All spelling and grammar checking happens locally. No text is sent to external services, making it safe for classified or proprietary documents.</p>
    </div>
</div>
`
};

// ============================================================================
// HYPERLINK CHECKER
// ============================================================================
HelpDocs.content['checker-hyperlinks'] = {
    title: 'Hyperlink Checker',
    subtitle: 'Validate URLs and link formatting',
    html: `
<div class="help-checker-header">
    <div class="help-checker-icon"><i data-lucide="link"></i></div>
    <div class="help-checker-intro">
        <p>Validates URL formatting and identifies potential issues with links.</p>
    </div>
</div>

<h2><i data-lucide="check-square"></i> What It Checks</h2>
<div class="help-check-list">
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>Malformed URLs</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "htp://example.com"</span>
                <span class="example-good">✓ "https://example.com"</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>HTTP vs HTTPS</h4>
            <p>Non-secure links that should use HTTPS.</p>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Missing Protocol</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "www.example.com/doc"</span>
                <span class="example-good">✓ "https://www.example.com/doc"</span>
            </div>
        </div>
    </div>
</div>

<h2><i data-lucide="activity"></i> Live URL Validation (PowerShell)</h2>
<p>For documents with external links, TechWriterReview provides a PowerShell script that tests if URLs are reachable:</p>
<ol>
    <li>Run review with Hyperlink Checker enabled</li>
    <li>Go to footer → Hyperlink Health</li>
    <li>Generate PowerShell Script</li>
    <li>Run script on network-connected machine</li>
    <li>Import results back</li>
</ol>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Air-Gapped Workflow</strong>
        <p>The PowerShell script can be run on a network-connected machine and results brought back, enabling link validation even in air-gapped environments.</p>
    </div>
</div>
`
};

// ============================================================================
// REQUIREMENTS LANGUAGE CHECKER
// ============================================================================
HelpDocs.content['checker-requirements'] = {
    title: 'Requirements Language',
    subtitle: 'Ensure proper use of shall, will, must, and directive language',
    html: `
<div class="help-checker-header">
    <div class="help-checker-icon"><i data-lucide="list-checks"></i></div>
    <div class="help-checker-intro">
        <p>Ensures your document uses precise, testable language for requirements.</p>
    </div>
</div>

<h2><i data-lucide="help-circle"></i> Why This Matters</h2>
<p>In requirements documents, word choice has legal and technical implications:</p>
<ul>
    <li><strong>"Shall"</strong> — Binding requirement</li>
    <li><strong>"Will"</strong> — Declaration of purpose</li>
    <li><strong>"Must"</strong> — Constraint or condition</li>
    <li><strong>"Should"</strong> — Recommendation (non-binding)</li>
</ul>

<h2><i data-lucide="check-square"></i> What It Checks</h2>
<div class="help-check-list">
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>TBD/TBR Markers</h4>
            <p>"To Be Determined" markers that need resolution.</p>
            <div class="help-check-example">
                <span class="example-bad">❌ "The system shall store [TBD] records."</span>
                <span class="example-good">✓ "The system shall store 10,000 records."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>Ambiguous Requirements</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "The system shall be fast."</span>
                <span class="example-good">✓ "The system shall respond within 200ms."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Weak Requirement Words</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "The system should validate input."</span>
                <span class="example-good">✓ "The system shall validate input."</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-low">Low</div>
        <div class="help-check-content">
            <h4>Untestable Language</h4>
            <p>Subjective terms: "user-friendly," "intuitive," "easy to use"</p>
        </div>
    </div>
</div>

<h2><i data-lucide="book"></i> Standards Reference</h2>
<p>Aligns with IEEE 830, ISO/IEC/IEEE 29148, MIL-STD-498, and systems engineering best practices.</p>
`
};

// ============================================================================
// WRITING QUALITY CHECKER
// ============================================================================
HelpDocs.content['checker-writing'] = {
    title: 'Writing Quality',
    subtitle: 'Improve clarity with passive voice detection and more',
    html: `
<div class="help-checker-header">
    <div class="help-checker-icon"><i data-lucide="pen-tool"></i></div>
    <div class="help-checker-intro">
        <p>Helps create clearer, more readable documents by identifying common style issues.</p>
    </div>
</div>

<h2><i data-lucide="check-square"></i> What It Checks</h2>
<div class="help-check-list">
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Passive Voice</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "The system shall be configured by the administrator."</span>
                <span class="example-good">✓ "The administrator shall configure the system."</span>
            </div>
            <p><em>Why:</em> Passive voice can obscure who is responsible—critical in procedures.</p>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Wordy Phrases</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "in order to" → "to"</span>
                <span class="example-bad">❌ "at this point in time" → "now"</span>
                <span class="example-bad">❌ "due to the fact that" → "because"</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Long Sentences</h4>
            <p>Sentences exceeding 40 words (configurable). Long sentences increase cognitive load.</p>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-low">Low</div>
        <div class="help-check-content">
            <h4>Complex Words</h4>
            <div class="help-check-example">
                <span class="example-bad">❌ "utilize" → "use"</span>
                <span class="example-bad">❌ "commence" → "start"</span>
            </div>
        </div>
    </div>
</div>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Context Matters</strong>
        <p>Passive voice isn't always wrong—it's appropriate when the actor is unknown or unimportant. Use your judgment.</p>
    </div>
</div>
`
};

// ============================================================================
// DOCUMENT STRUCTURE CHECKER
// ============================================================================
HelpDocs.content['checker-structure'] = {
    title: 'Document Structure',
    subtitle: 'Validate headings, numbering, and cross-references',
    html: `
<div class="help-checker-header">
    <div class="help-checker-icon"><i data-lucide="file-text"></i></div>
    <div class="help-checker-intro">
        <p>Ensures your document is well-organized with consistent headings and valid references.</p>
    </div>
</div>

<h2><i data-lucide="help-circle"></i> Why This Matters</h2>
<p>Proper structure enables accurate TOC generation, easy navigation, working cross-references, and standards compliance.</p>

<h2><i data-lucide="check-square"></i> What It Checks</h2>
<div class="help-check-list">
    <div class="help-check-item">
        <div class="help-check-severity severity-high">High</div>
        <div class="help-check-content">
            <h4>Heading Hierarchy Violations</h4>
            <p>Skipped heading levels (e.g., H1 → H3).</p>
            <div class="help-check-example">
                <span class="example-bad">❌ Heading 1 → Heading 3 (skipped H2)</span>
                <span class="example-good">✓ Heading 1 → Heading 2 → Heading 3</span>
            </div>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Broken Cross-References</h4>
            <p>References to sections, figures, or tables that don't exist.</p>
        </div>
    </div>
    <div class="help-check-item">
        <div class="help-check-severity severity-medium">Medium</div>
        <div class="help-check-content">
            <h4>Numbering Gaps</h4>
            <p>Missing numbers in sequences (1, 2, 4 missing 3).</p>
        </div>
    </div>
</div>
`
};

// ============================================================================
// COMPLETE CHECKER REFERENCE
// ============================================================================
HelpDocs.content['checker-all'] = {
    title: 'Complete Checker Reference',
    subtitle: 'All 50+ quality checks in one place',
    html: `
<p>Comprehensive reference of all available checks, organized by category.</p>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Severity Guide</strong>
        <p><span class="severity-badge severity-critical">Critical</span> Must fix • <span class="severity-badge severity-high">High</span> Fix soon • <span class="severity-badge severity-medium">Medium</span> Should address • <span class="severity-badge severity-low">Low</span> Minor • <span class="severity-badge severity-info">Info</span> Informational</p>
    </div>
</div>

<h2><i data-lucide="spell-check"></i> Spelling & Grammar</h2>
<table class="help-table help-table-striped help-table-compact">
    <thead><tr><th>Check</th><th>Severity</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td>Spelling Errors</td><td><span class="severity-badge severity-high">High</span></td><td>Words not in dictionary</td></tr>
        <tr><td>Confused Words</td><td><span class="severity-badge severity-high">High</span></td><td>affect/effect, their/there</td></tr>
        <tr><td>Subject-Verb Agreement</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Verb doesn't match subject</td></tr>
        <tr><td>Double Words</td><td><span class="severity-badge severity-low">Low</span></td><td>Repeated words</td></tr>
    </tbody>
</table>

<h2><i data-lucide="a-large-small"></i> Acronyms</h2>
<table class="help-table help-table-striped help-table-compact">
    <thead><tr><th>Check</th><th>Severity</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td>Undefined Acronyms</td><td><span class="severity-badge severity-high">High</span></td><td>Used without definition</td></tr>
        <tr><td>Inconsistent Definitions</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Same acronym, different meanings</td></tr>
        <tr><td>Redefined Acronyms</td><td><span class="severity-badge severity-low">Low</span></td><td>Redundant definitions</td></tr>
    </tbody>
</table>

<h2><i data-lucide="pen-tool"></i> Writing Quality</h2>
<table class="help-table help-table-striped help-table-compact">
    <thead><tr><th>Check</th><th>Severity</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td>Passive Voice</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Subject receives action</td></tr>
        <tr><td>Long Sentences</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Exceeds 40 words</td></tr>
        <tr><td>Wordy Phrases</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Can be simplified</td></tr>
        <tr><td>Complex Words</td><td><span class="severity-badge severity-low">Low</span></td><td>Simpler alternatives exist</td></tr>
    </tbody>
</table>

<h2><i data-lucide="list-checks"></i> Requirements Language</h2>
<table class="help-table help-table-striped help-table-compact">
    <thead><tr><th>Check</th><th>Severity</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td>TBD/TBR Markers</td><td><span class="severity-badge severity-high">High</span></td><td>Unresolved placeholders</td></tr>
        <tr><td>Ambiguous Requirements</td><td><span class="severity-badge severity-high">High</span></td><td>Vague, untestable language</td></tr>
        <tr><td>Weak Words</td><td><span class="severity-badge severity-medium">Medium</span></td><td>should, may in requirements</td></tr>
        <tr><td>Untestable Terms</td><td><span class="severity-badge severity-low">Low</span></td><td>user-friendly, intuitive</td></tr>
    </tbody>
</table>

<h2><i data-lucide="file-text"></i> Document Structure</h2>
<table class="help-table help-table-striped help-table-compact">
    <thead><tr><th>Check</th><th>Severity</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td>Heading Hierarchy</td><td><span class="severity-badge severity-high">High</span></td><td>Skipped heading levels</td></tr>
        <tr><td>Broken References</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Invalid cross-references</td></tr>
        <tr><td>Numbering Gaps</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Missing sequence numbers</td></tr>
    </tbody>
</table>

<h2><i data-lucide="link"></i> Hyperlinks</h2>
<table class="help-table help-table-striped help-table-compact">
    <thead><tr><th>Check</th><th>Severity</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td>Malformed URLs</td><td><span class="severity-badge severity-high">High</span></td><td>Invalid URL syntax</td></tr>
        <tr><td>HTTP vs HTTPS</td><td><span class="severity-badge severity-medium">Medium</span></td><td>Insecure protocol</td></tr>
        <tr><td>Missing Protocol</td><td><span class="severity-badge severity-medium">Medium</span></td><td>No http:// or https://</td></tr>
    </tbody>
</table>
`
};

// ============================================================================
// ROLES OVERVIEW
// ============================================================================
HelpDocs.content['role-overview'] = {
    title: 'Roles & Responsibilities Studio',
    subtitle: 'AI-powered role extraction with 94.7% precision',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="users" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Roles Studio is your centralized workspace for managing organizational roles extracted from documents. Powered by an AI engine achieving <strong>94.7% precision</strong> and <strong>92.3% F1 score</strong>, it automatically identifies roles, generates RACI matrices, visualizes relationships, and tracks roles across your entire document library.</p>
    </div>
</div>

<div class="help-callout help-callout-success">
    <i data-lucide="target"></i>
    <div>
        <strong>Validated Performance</strong>
        <p>Validated on government SOWs, defense SEPs, systems engineering management plans, and industry standards. The extraction engine uses 20+ regex patterns, 158 pre-defined roles, and 167 false positive exclusions.</p>
    </div>
</div>

<h2><i data-lucide="layout"></i> Studio Tabs</h2>
<p>Roles Studio organizes functionality into three sections:</p>

<table class="help-table">
    <thead><tr><th>Section</th><th>Tabs</th><th>Purpose</th></tr></thead>
    <tbody>
        <tr>
            <td><strong>Analysis</strong></td>
            <td>Overview, Relationship Graph, Role Details, RACI Matrix, Role-Doc Matrix</td>
            <td>Visualize and analyze extracted roles</td>
        </tr>
        <tr>
            <td><strong>Workflow</strong></td>
            <td>Adjudication</td>
            <td>Confirm, pin, or dismiss detected roles</td>
        </tr>
        <tr>
            <td><strong>Management</strong></td>
            <td>Role Dictionary, Document Log</td>
            <td>Manage role definitions and scan history</td>
        </tr>
    </tbody>
</table>

<h2><i data-lucide="sparkles"></i> Key Features</h2>

<div class="help-feature-grid">
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="layout-dashboard"></i></div>
        <h3>Overview Dashboard</h3>
        <p>Statistics cards showing unique roles, responsibilities, documents analyzed, and role interactions. Category distribution chart and top roles by responsibility count.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="git-branch"></i></div>
        <h3>Relationship Graph</h3>
        <p>Interactive D3.js force-directed graph showing role connections. Zoom, pan, and drag nodes. Filter by category and export as SVG.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="grid-3x3"></i></div>
        <h3>RACI Matrix</h3>
        <p>Auto-generated Responsible, Accountable, Consulted, Informed matrix. Click cells to assign RACI values. Export to Excel or CSV.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="table-2"></i></div>
        <h3>Role-Document Matrix</h3>
        <p>Heatmap showing which roles appear in which documents. Track role mentions across your entire document library.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="check-circle"></i></div>
        <h3>Adjudication Workflow</h3>
        <p>Review extracted roles one by one. Confirm valid roles, pin important ones, or dismiss false positives. Bulk actions available.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="filter"></i></div>
        <h3>Document Filtering</h3>
        <p>Filter all views by specific document. See only roles from "Contract_v2.docx" or compare across documents.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="book-open"></i></div>
        <h3>Role Dictionary</h3>
        <p>158 pre-defined roles with aliases and categories. Add custom roles, edit descriptions, and manage your organization's terminology.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="download"></i></div>
        <h3>Export Options</h3>
        <p>Export all roles or filtered selection to CSV, JSON, or Excel. Include responsibility counts, source documents, and RACI assignments.</p>
    </div>
</div>

<h2><i data-lucide="workflow"></i> Typical Workflow</h2>
<ol>
    <li><strong>Scan Documents</strong> — Enable "Role Extraction" in Advanced Settings, then run a review</li>
    <li><strong>Open Roles Studio</strong> — Click <strong>Roles</strong> in the navigation bar (or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>)</li>
    <li><strong>Review Overview</strong> — See aggregated stats, category distribution, and top roles</li>
    <li><strong>Adjudicate</strong> — Confirm valid roles, pin key roles, dismiss false positives</li>
    <li><strong>Filter by Document</strong> — Use the dropdown to focus on a specific document</li>
    <li><strong>Analyze</strong> — Explore Relationship Graph, RACI Matrix, or Role-Doc Matrix</li>
    <li><strong>Export</strong> — Download as CSV, JSON, or Excel for your records</li>
</ol>

<h2><i data-lucide="help-circle"></i> Why Role Extraction Matters</h2>
<ul>
    <li><strong>Identify accountability gaps</strong> — Find activities with no assigned responsible party</li>
    <li><strong>Clarify ownership</strong> — Ensure someone owns each deliverable and decision</li>
    <li><strong>Generate RACI matrices</strong> — Create responsibility assignments automatically from document text</li>
    <li><strong>Track across documents</strong> — See how roles appear and evolve across your document library</li>
    <li><strong>Support compliance</strong> — Document role assignments for audits and reviews</li>
    <li><strong>Feed process modeling</strong> — Export roles to TIBCO Nimbus or other BPM tools</li>
</ul>

<h2><i data-lucide="navigation"></i> Explore Each Tab</h2>
<div class="help-path-list">
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-detection')">
        <div class="help-path-icon"><i data-lucide="user-search"></i></div>
        <div class="help-path-content"><h4>Role Detection</h4><p>How the AI identifies roles (patterns, confidence, false positive prevention)</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-adjudication')">
        <div class="help-path-icon"><i data-lucide="check-circle"></i></div>
        <div class="help-path-content"><h4>Adjudication</h4><p>Confirm, pin, or dismiss detected roles with bulk actions</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-graph')">
        <div class="help-path-icon"><i data-lucide="git-branch"></i></div>
        <div class="help-path-content"><h4>Relationship Graph</h4><p>Interactive visualization of role connections</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-matrix')">
        <div class="help-path-icon"><i data-lucide="grid-3x3"></i></div>
        <div class="help-path-content"><h4>RACI Matrix</h4><p>Auto-generated responsibility assignment matrix</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-dictionary')">
        <div class="help-path-icon"><i data-lucide="book-open"></i></div>
        <div class="help-path-content"><h4>Role Dictionary</h4><p>Manage pre-defined roles and add custom entries</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-documents')">
        <div class="help-path-icon"><i data-lucide="file-text"></i></div>
        <div class="help-path-content"><h4>Document Log</h4><p>Scan history with recall and delete options</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
</div>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip: Historical Data</strong>
        <p>Roles Studio remembers all your scans. Open it anytime—even without a document loaded—to view and analyze historical role data from your entire document library.</p>
    </div>
</div>
`
};

// ============================================================================
// ROLE DETECTION
// ============================================================================
HelpDocs.content['role-detection'] = {
    title: 'Role Detection',
    subtitle: 'How TechWriterReview identifies organizational roles',
    html: `
<h2><i data-lucide="cog"></i> Detection Methods</h2>

<h3>1. Title Patterns</h3>
<p>Recognizes job titles, organizational roles, and functional roles like "Project Manager," "Systems Engineer," "Approver."</p>

<h3>2. Responsibility Statements</h3>
<p>Parses sentences with responsibility language:</p>
<div class="help-check-example">
    <span class="example-good">"The <strong>Project Manager</strong> shall <strong>approve all deliverables</strong>."</span>
    <span class="example-arrow">→</span>
    <span>Role: Project Manager | Action: approve all deliverables</span>
</div>

<h3>3. RACI Indicators</h3>
<ul>
    <li><strong>Responsible</strong>: "shall perform," "is responsible for"</li>
    <li><strong>Accountable</strong>: "is accountable for," "owns"</li>
    <li><strong>Consulted</strong>: "shall be consulted"</li>
    <li><strong>Informed</strong>: "shall be informed"</li>
</ul>

<h2><i data-lucide="play-circle"></i> Running Detection</h2>
<ol>
    <li>Enable <strong>Role Extraction</strong> in the sidebar checkers panel</li>
    <li>Run review (<kbd>Ctrl</kbd>+<kbd>R</kbd>)</li>
    <li>Click <strong>Roles</strong> button in footer to open Roles Studio</li>
    <li>Check the <strong>Overview</strong> tab for detected roles summary</li>
</ol>

<h2><i data-lucide="database"></i> Historical Data</h2>
<p>Roles are stored in the database across all scans. Open Roles Studio to see aggregated data from your entire document library, even without running a new scan.</p>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Detection Isn't Perfect</strong>
        <p>The system may flag false positives or miss some roles. That's why Adjudication exists—you confirm which detections are valid.</p>
    </div>
</div>
`
};

// ============================================================================
// ROLE ADJUDICATION
// ============================================================================
HelpDocs.content['role-adjudication'] = {
    title: 'Role Adjudication',
    subtitle: 'Confirm or dismiss detected roles',
    html: `
<p>Adjudication is the process of reviewing detected roles to confirm which are valid organizational roles versus false positives.</p>

<h2><i data-lucide="layout"></i> Accessing Adjudication</h2>
<p>Open Roles Studio and click the <strong>Adjudication</strong> tab in the Workflow section.</p>

<h2><i data-lucide="check-square"></i> Adjudication Actions</h2>
<table class="help-table">
    <thead><tr><th>Action</th><th>Icon</th><th>Description</th></tr></thead>
    <tbody>
        <tr>
            <td><strong>Confirm as Role</strong></td>
            <td><i data-lucide="user-check" style="color:var(--success);width:16px;height:16px;"></i></td>
            <td>Valid organizational role—include in exports and RACI</td>
        </tr>
        <tr>
            <td><strong>Mark as Deliverable</strong></td>
            <td><i data-lucide="package" style="color:var(--info);width:16px;height:16px;"></i></td>
            <td>Actually a deliverable, not a role—categorize separately</td>
        </tr>
        <tr>
            <td><strong>Reject</strong></td>
            <td><i data-lucide="x-circle" style="color:var(--error);width:16px;height:16px;"></i></td>
            <td>False positive—exclude from analysis</td>
        </tr>
    </tbody>
</table>

<h2><i data-lucide="combine"></i> Batch Operations</h2>
<p>Use checkboxes to select multiple roles, then apply actions to all selected items at once.</p>

<h2><i data-lucide="bar-chart"></i> Stats Panel</h2>
<p>The header shows counts for each category:</p>
<ul>
    <li><strong>Pending</strong> — Awaiting review</li>
    <li><strong>Confirmed</strong> — Verified as roles</li>
    <li><strong>Deliverables</strong> — Marked as deliverables</li>
    <li><strong>Rejected</strong> — Dismissed false positives</li>
</ul>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Build Your Dictionary</strong>
        <p>Confirmed roles are added to your Role Dictionary for future documents. Rejected items help train better detection over time.</p>
    </div>
</div>
`
};

// ============================================================================
// ROLE GRAPH
// ============================================================================
HelpDocs.content['role-graph'] = {
    title: 'Relationship Graph',
    subtitle: 'Visualize how roles interact across documents',
    html: `
<p>The Relationship Graph provides an interactive D3.js visualization showing which roles appear together in documents and how they relate to each other.</p>

<h2><i data-lucide="layout"></i> Accessing the Graph</h2>
<p>Open Roles Studio and click <strong>Relationship Graph</strong> in the Analysis section tabs.</p>

<h2><i data-lucide="eye"></i> Understanding the Graph</h2>
<h3>Nodes (Circles)</h3>
<ul>
    <li>Each node represents a confirmed role</li>
    <li><strong>Size</strong> = frequency (larger = more mentions)</li>
    <li><strong>Color</strong> = role category</li>
</ul>

<h3>Edges (Lines)</h3>
<ul>
    <li>Connect roles that appear in the same document</li>
    <li><strong>Thickness</strong> = co-occurrence frequency</li>
    <li>Hover for description of relationship</li>
</ul>

<h2><i data-lucide="mouse-pointer"></i> Interactions</h2>
<table class="help-table">
    <tbody>
        <tr><td><strong>Click node</strong></td><td>Highlight connections to this role</td></tr>
        <tr><td><strong>Drag node</strong></td><td>Reposition in the visualization</td></tr>
        <tr><td><strong>Scroll</strong></td><td>Zoom in/out</td></tr>
        <tr><td><strong>Double-click background</strong></td><td>Reset zoom and pan</td></tr>
    </tbody>
</table>

<h2><i data-lucide="download"></i> Export Options</h2>
<p>Export the graph as PNG image, SVG vector, or JSON data for use in other tools.</p>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip</strong>
        <p>The graph is most useful when you have multiple documents scanned. It reveals organizational patterns by showing which roles frequently work together.</p>
    </div>
</div>
`
};

// ============================================================================
// RACI MATRIX
// ============================================================================
HelpDocs.content['role-matrix'] = {
    title: 'RACI Matrix',
    subtitle: 'Generate responsibility assignment matrices',
    html: `
<p>Generate RACI matrices from roles and actions detected in your documents.</p>

<h2><i data-lucide="layout"></i> Accessing RACI Matrix</h2>
<p>Open Roles Studio and click <strong>RACI Matrix</strong> in the Analysis section tabs.</p>

<h2><i data-lucide="info"></i> What is RACI?</h2>
<table class="help-table">
    <thead><tr><th>Letter</th><th>Meaning</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td><strong>R</strong></td><td>Responsible</td><td>Does the work (can have multiple)</td></tr>
        <tr><td><strong>A</strong></td><td>Accountable</td><td>Final decision-maker (only one per activity)</td></tr>
        <tr><td><strong>C</strong></td><td>Consulted</td><td>Provides input before work begins</td></tr>
        <tr><td><strong>I</strong></td><td>Informed</td><td>Notified after work is completed</td></tr>
    </tbody>
</table>

<h2><i data-lucide="table"></i> Matrix Layout</h2>
<p>The RACI matrix uses a condensed layout for better readability:</p>
<ul>
    <li><strong>Role Column</strong> — Wider to accommodate full role names (wraps if needed)</li>
    <li><strong>R/A/C/I Columns</strong> — Compact width showing assignment counts</li>
    <li><strong>Total Column</strong> — Sum of all RACI assignments per role</li>
</ul>
<p>Long role names will wrap within the Role column (up to 2-3 lines) to ensure the entire matrix fits on screen without horizontal scrolling.</p>

<h2><i data-lucide="search"></i> How It Works</h2>
<p>TechWriterReview analyzes responsibility statements in your documents to automatically assign RACI values:</p>
<ul>
    <li>"shall perform" → <strong>R</strong> (Responsible)</li>
    <li>"is accountable for" → <strong>A</strong> (Accountable)</li>
    <li>"shall be consulted" → <strong>C</strong> (Consulted)</li>
    <li>"shall be informed" → <strong>I</strong> (Informed)</li>
</ul>

<h2><i data-lucide="alert-circle"></i> Validation Checks</h2>
<p>The matrix highlights common issues:</p>
<ul>
    <li><strong>No Accountable</strong> — Activity has no "A" assigned</li>
    <li><strong>Multiple Accountable</strong> — More than one "A" (should be only one)</li>
    <li><strong>No Responsible</strong> — Activity has no "R" assigned</li>
</ul>

<h2><i data-lucide="download"></i> Export Options</h2>
<p>Export the RACI matrix to Excel, CSV, or Word for use in project documentation.</p>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip</strong>
        <p>Let TechWriterReview generate the initial matrix from your document, then refine it. This is much faster than building from scratch.</p>
    </div>
</div>
`
};

// ============================================================================
// CROSS-REFERENCE (NEW in v3.0.55)
// ============================================================================
HelpDocs.content['role-crossref'] = {
    title: 'Cross-Reference Matrix',
    subtitle: 'Role × Document mention counts with heatmap visualization',
    html: `
<p>The Cross-Reference tab shows how many times each role is mentioned in each document, displayed as a heatmap matrix.</p>

<h2><i data-lucide="layout"></i> Accessing Cross-Reference</h2>
<p>Open Roles Studio and click <strong>Cross-Reference</strong> in the Analysis section tabs.</p>

<h2><i data-lucide="table"></i> Understanding the Matrix</h2>
<ul>
    <li><strong>Rows</strong> = Roles (sorted by total mentions, highest first)</li>
    <li><strong>Columns</strong> = Documents</li>
    <li><strong>Cells</strong> = Number of times that role appears in that document</li>
</ul>

<h2><i data-lucide="palette"></i> Heatmap Colors</h2>
<table class="help-table">
    <thead><tr><th>Count</th><th>Color</th></tr></thead>
    <tbody>
        <tr><td>1-2 mentions</td><td style="background:#e3f2fd;">Light blue</td></tr>
        <tr><td>3-5 mentions</td><td style="background:#90caf9;">Medium blue</td></tr>
        <tr><td>6-10 mentions</td><td style="background:#42a5f5;color:white;">Dark blue</td></tr>
        <tr><td>10+ mentions</td><td style="background:#1976d2;color:white;">Deep blue</td></tr>
    </tbody>
</table>

<h2><i data-lucide="sigma"></i> Totals</h2>
<ul>
    <li><strong>Row Totals</strong> — Total mentions for each role across all documents</li>
    <li><strong>Column Totals</strong> — Total mentions in each document across all roles</li>
    <li><strong>Grand Total</strong> — Sum of all role mentions</li>
</ul>

<h2><i data-lucide="filter"></i> Features</h2>
<ul>
    <li><strong>Search Filter</strong> — Type to filter roles by name</li>
    <li><strong>CSV Export</strong> — Download the full matrix as a CSV file</li>
</ul>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Cross-Reference vs RACI</strong>
        <p>Cross-Reference shows <em>mention counts</em> (how often a role appears). RACI Matrix shows <em>responsibility assignments</em> (R/A/C/I). Use both for complete analysis.</p>
    </div>
</div>
`
};

// ============================================================================
// ROLE DICTIONARY
// ============================================================================
HelpDocs.content['role-dictionary'] = {
    title: 'Role Dictionary',
    subtitle: 'Manage your organization\'s role definitions',
    html: `
<p>The Role Dictionary stores all confirmed roles across your document library, serving as a reference for consistent role naming and categorization.</p>

<h2><i data-lucide="layout"></i> Accessing the Dictionary</h2>
<p>Open Roles Studio and click <strong>Role Dictionary</strong> in the Management section tabs.</p>

<h2><i data-lucide="database"></i> What's Stored</h2>
<ul>
    <li><strong>Role Name</strong> — The official role title</li>
    <li><strong>Category</strong> — Classification (e.g., Management, Technical, Support)</li>
    <li><strong>Status</strong> — Confirmed, Pending, or Rejected</li>
    <li><strong>Document Count</strong> — How many documents mention this role</li>
    <li><strong>First Seen</strong> — When the role was first detected</li>
</ul>

<h2><i data-lucide="edit-3"></i> Managing Roles</h2>
<ul>
    <li><strong>Edit</strong> — Rename or recategorize a role</li>
    <li><strong>Merge</strong> — Combine duplicate roles (e.g., "PM" + "Project Manager")</li>
    <li><strong>Delete</strong> — Remove a role from the dictionary</li>
</ul>

<h2><i data-lucide="upload"></i> Import/Export</h2>
<p>Export your dictionary to CSV for backup or sharing. Import from CSV to restore or populate from another source.</p>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip</strong>
        <p>Build your dictionary by adjudicating roles as you scan documents. Over time, detection becomes more accurate as the system learns your organization's terminology.</p>
    </div>
</div>
`
};

// ============================================================================
// DOCUMENT LOG
// ============================================================================
HelpDocs.content['role-documents'] = {
    title: 'Document Log',
    subtitle: 'Scan history and document tracking',
    html: `
<p>The Document Log shows all documents that have been scanned with role extraction enabled, along with summary statistics.</p>

<h2><i data-lucide="layout"></i> Accessing the Log</h2>
<p>Open Roles Studio and click <strong>Document Log</strong> in the Management section tabs.</p>

<h2><i data-lucide="list"></i> Information Displayed</h2>
<table class="help-table">
    <thead><tr><th>Column</th><th>Description</th></tr></thead>
    <tbody>
        <tr><td><strong>Document</strong></td><td>Filename of the scanned document</td></tr>
        <tr><td><strong>Scan Date</strong></td><td>When the document was last scanned</td></tr>
        <tr><td><strong>Roles</strong></td><td>Number of roles detected</td></tr>
        <tr><td><strong>Issues</strong></td><td>Number of quality issues found</td></tr>
        <tr><td><strong>Grade</strong></td><td>Overall document quality grade</td></tr>
    </tbody>
</table>

<h2><i data-lucide="filter"></i> Features</h2>
<ul>
    <li><strong>Sort</strong> — Click column headers to sort</li>
    <li><strong>Search</strong> — Filter documents by name</li>
    <li><strong>Re-scan</strong> — Click a document to load and re-scan it</li>
</ul>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Historical Data</strong>
        <p>The Document Log persists across sessions. Even without an active document, you can see your complete scan history and the roles detected from each.</p>
    </div>
</div>
`
};

// ============================================================================
// STATEMENT FORGE OVERVIEW
// ============================================================================
HelpDocs.content['forge-overview'] = {
    title: 'Statement Forge',
    subtitle: 'Extract requirements, procedures, and action items for process modeling',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="hammer" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Statement Forge extracts actionable statements from your documents—requirements (shall/must), procedures (perform/verify), action items, and specifications—and structures them into Actor-Action-Object format for import into TIBCO Nimbus, process modeling tools, or compliance tracking systems.</p>
    </div>
</div>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Perfect For</strong>
        <p>SOWs, contracts, SOPs, technical procedures, requirements documents, and any document containing actionable language.</p>
    </div>
</div>

<h2><i data-lucide="sparkles"></i> Key Features</h2>

<div class="help-feature-grid">
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="filter"></i></div>
        <h3>Smart Extraction</h3>
        <p>Recognizes 1,000+ action verbs across domains: requirements (shall, must), procedures (perform, verify), approvals (sign, approve), and communications (notify, submit).</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="users"></i></div>
        <h3>Actor Detection</h3>
        <p>Automatically identifies who is responsible: "The System Administrator shall..." → Actor: System Administrator.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="target"></i></div>
        <h3>Object Extraction</h3>
        <p>Identifies what is being acted upon: "...shall configure the firewall" → Object: firewall.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="tags"></i></div>
        <h3>Statement Types</h3>
        <p>Categorizes statements: Requirement, Procedure, Action Item, Specification, Constraint, or Custom types.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="edit-3"></i></div>
        <h3>Inline Editing</h3>
        <p>Click any statement to edit Actor, Action, Object, Type, and Notes. Changes save automatically.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="combine"></i></div>
        <h3>Merge & Split</h3>
        <p>Merge duplicate statements or split compound statements containing "and" into separate items.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="hash"></i></div>
        <h3>Auto-Numbering</h3>
        <p>Renumber statements with custom prefix (REQ-, PROC-, etc.) and starting number.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="download"></i></div>
        <h3>Multiple Exports</h3>
        <p>TIBCO Nimbus XML (with swimlanes), Excel workbook, CSV, JSON, or Word document.</p>
    </div>
</div>

<h2><i data-lucide="workflow"></i> Workflow</h2>
<ol>
    <li><strong>Load Document</strong> — Open your document and run a review</li>
    <li><strong>Open Statement Forge</strong> — Click <strong>Forge</strong> in the navigation bar</li>
    <li><strong>Configure Extraction</strong> — Select statement types and confidence threshold</li>
    <li><strong>Extract Statements</strong> — Click Extract to analyze the document</li>
    <li><strong>Review & Edit</strong> — Click statements to edit; use merge/split as needed</li>
    <li><strong>Renumber</strong> — Apply consistent numbering with your prefix</li>
    <li><strong>Export</strong> — Download in your preferred format</li>
</ol>

<h2><i data-lucide="keyboard"></i> Keyboard Shortcuts</h2>
<table class="help-table">
    <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
    <tbody>
        <tr><td><kbd>Ctrl</kbd>+<kbd>A</kbd></td><td>Select all statements</td></tr>
        <tr><td><kbd>Shift</kbd>+Click</td><td>Select range</td></tr>
        <tr><td><kbd>Ctrl</kbd>+Click</td><td>Toggle selection</td></tr>
        <tr><td><kbd>Delete</kbd></td><td>Remove selected statements</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>M</kbd></td><td>Merge selected</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>E</kbd></td><td>Export</td></tr>
    </tbody>
</table>

<h2><i data-lucide="navigation"></i> Learn More</h2>
<div class="help-path-list">
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-extraction')">
        <div class="help-path-icon"><i data-lucide="filter"></i></div>
        <div class="help-path-content"><h4>Statement Extraction</h4><p>How the extraction engine identifies actionable content</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-editing')">
        <div class="help-path-icon"><i data-lucide="edit-3"></i></div>
        <div class="help-path-content"><h4>Editing Statements</h4><p>Inline editing, merge, split, and bulk operations</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-export')">
        <div class="help-path-icon"><i data-lucide="download"></i></div>
        <div class="help-path-content"><h4>Export Formats</h4><p>TIBCO Nimbus, Excel, CSV, JSON, Word</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
</div>

<div class="help-callout help-callout-warning">
    <i data-lucide="alert-triangle"></i>
    <div>
        <strong>Session-Based</strong>
        <p>Extracted statements are stored in your browser session. Be sure to export your work before closing the browser or loading a new document!</p>
    </div>
</div>
`
};

// ============================================================================
// STATEMENT EXTRACTION
// ============================================================================
HelpDocs.content['forge-extraction'] = {
    title: 'Statement Extraction',
    subtitle: 'How Statement Forge identifies actionable content',
    html: `
<h2><i data-lucide="cog"></i> How It Works</h2>

<h3>1. Action Verb Recognition</h3>
<p>Recognizes 1,000+ action verbs by domain: requirements (shall, must), procedures (perform, verify), reviews (approve, sign), communications (notify, submit).</p>

<h3>2. Actor Identification</h3>
<div class="help-check-example">
    <span class="example-good">"<strong>The System Administrator</strong> shall configure the firewall."</span>
    <span class="example-arrow">→</span>
    <span>Actor: System Administrator</span>
</div>

<h3>3. Object/Target Extraction</h3>
<div class="help-check-example">
    <span class="example-good">"The System Administrator shall configure <strong>the firewall</strong>."</span>
    <span class="example-arrow">→</span>
    <span>Object: firewall</span>
</div>

<h2><i data-lucide="play"></i> Running Extraction</h2>
<ol>
    <li>Load and review document</li>
    <li>Click <strong>Statement Forge</strong> in footer</li>
    <li>Configure options (statement types, confidence threshold)</li>
    <li>Click <strong>Extract Statements</strong></li>
</ol>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Session-Based</strong>
        <p>Extractions are tied to your current session. Export before closing!</p>
    </div>
</div>
`
};

// ============================================================================
// EDITING STATEMENTS
// ============================================================================
HelpDocs.content['forge-editing'] = {
    title: 'Editing Statements',
    subtitle: 'Refine extracted statements',
    html: `
<h2><i data-lucide="edit-3"></i> Individual Editing</h2>
<p>Click any statement to edit Actor, Action, Object, Type, and Notes.</p>

<h2><i data-lucide="combine"></i> Merging</h2>
<p>Select multiple statements and click <strong>Merge</strong> to combine duplicates.</p>

<h2><i data-lucide="split"></i> Splitting</h2>
<p>Split compound statements (containing "and") into separate items.</p>

<h2><i data-lucide="trash-2"></i> Removing</h2>
<p>Delete false positives with <strong>Remove</strong> or <kbd>Delete</kbd>.</p>

<h2><i data-lucide="check-square"></i> Batch Editing</h2>
<ul>
    <li><kbd>Ctrl</kbd>+<kbd>A</kbd> — Select all</li>
    <li><kbd>Shift</kbd>+Click — Select range</li>
    <li><kbd>Ctrl</kbd>+Click — Select multiple</li>
</ul>
`
};

// ============================================================================
// STATEMENT FORGE EXPORT
// ============================================================================
HelpDocs.content['forge-export'] = {
    title: 'Export Formats',
    subtitle: 'Available export formats for extracted statements',
    html: `
<div class="help-export-formats">
    <div class="help-export-format">
        <div class="help-export-icon"><i data-lucide="file-code"></i></div>
        <div class="help-export-info">
            <h3>TIBCO Nimbus XML</h3>
            <p>Process map format with swimlanes, steps, and connections.</p>
        </div>
    </div>
    <div class="help-export-format">
        <div class="help-export-icon"><i data-lucide="table"></i></div>
        <div class="help-export-info">
            <h3>Excel Workbook</h3>
            <p>Tabular format with Actor, Action, Object, Type, Source.</p>
        </div>
    </div>
    <div class="help-export-format">
        <div class="help-export-icon"><i data-lucide="file-spreadsheet"></i></div>
        <div class="help-export-info">
            <h3>CSV</h3>
            <p>Simple comma-separated format.</p>
        </div>
    </div>
    <div class="help-export-format">
        <div class="help-export-icon"><i data-lucide="code"></i></div>
        <div class="help-export-info">
            <h3>JSON</h3>
            <p>Structured data for programmatic processing.</p>
        </div>
    </div>
</div>

<h2><i data-lucide="settings"></i> Options</h2>
<ul>
    <li>Include source references</li>
    <li>Include confidence scores</li>
    <li>Filter by type or actor</li>
</ul>
`
};

// ============================================================================
// EXPORT OVERVIEW
// ============================================================================
HelpDocs.content['export-overview'] = {
    title: 'Export Options',
    subtitle: 'Create deliverables from your review results',
    html: `
<div class="help-export-grid">
    <div class="help-export-card" onclick="HelpContent.navigateTo('export-word')">
        <div class="help-export-card-icon"><i data-lucide="file-text"></i></div>
        <h3>Word Document</h3>
        <p>Original document with tracked changes and comments.</p>
        <span class="help-badge">Recommended</span>
    </div>
    <div class="help-export-card" onclick="HelpContent.navigateTo('export-data')">
        <div class="help-export-card-icon"><i data-lucide="table"></i></div>
        <h3>Excel / CSV</h3>
        <p>Tabular issue list for tracking and reporting.</p>
    </div>
    <div class="help-export-card" onclick="HelpContent.navigateTo('export-json')">
        <div class="help-export-card-icon"><i data-lucide="code"></i></div>
        <h3>JSON</h3>
        <p>Structured data for automation.</p>
    </div>
</div>

<h2><i data-lucide="filter"></i> What Gets Exported</h2>
<p>By default, exports include "Kept" issues. Configure to include all, pending only, or specific statuses.</p>

<h2><i data-lucide="keyboard"></i> Quick Export</h2>
<p>Press <kbd>Ctrl</kbd>+<kbd>E</kbd> to open the export dialog.</p>
`
};

// ============================================================================
// WORD EXPORT
// ============================================================================
HelpDocs.content['export-word'] = {
    title: 'Word Document Export',
    subtitle: 'Generate a marked-up copy with tracked changes',
    html: `
<h2><i data-lucide="help-circle"></i> Why Word Export?</h2>
<ul>
    <li><strong>Context preserved</strong> — See issues in original location</li>
    <li><strong>Familiar interface</strong> — Use Word's review tools</li>
    <li><strong>Easy collaboration</strong> — Share with authors</li>
    <li><strong>Accept/Reject workflow</strong> — Implement fixes directly</li>
</ul>

<h2><i data-lucide="file-text"></i> What's Included</h2>
<h3>Tracked Changes</h3>
<p>For issues with suggestions:</p>
<div class="help-check-example">
    <span class="example-bad" style="text-decoration: line-through;">utilize</span>
    <span class="example-good" style="text-decoration: underline;">use</span>
</div>

<h3>Comments</h3>
<p>Issue message, severity, and suggestion anchored to flagged text.</p>

<h2><i data-lucide="settings"></i> Options</h2>
<ul>
    <li>Changes + Comments (default)</li>
    <li>Comments Only</li>
    <li>Include Info issues</li>
    <li>Author name for attribution</li>
</ul>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip</strong>
        <p>Use Triage Mode first. Only "Kept" issues appear in export by default.</p>
    </div>
</div>
`
};

// ============================================================================
// CSV/EXCEL EXPORT
// ============================================================================
HelpDocs.content['export-data'] = {
    title: 'CSV & Excel Export',
    subtitle: 'Tabular data for tracking and analysis',
    html: `
<h2><i data-lucide="table"></i> Excel Export (.xlsx)</h2>
<ul>
    <li>Formatted headers with filters</li>
    <li>Color-coded severity</li>
    <li>Summary sheet with statistics</li>
</ul>

<h2><i data-lucide="file-spreadsheet"></i> CSV Export</h2>
<ul>
    <li>UTF-8 encoding</li>
    <li>Standard format</li>
    <li>One row per issue</li>
</ul>

<h2><i data-lucide="columns"></i> Columns</h2>
<table class="help-table help-table-compact">
    <tbody>
        <tr><td>ID</td><td>Unique identifier</td></tr>
        <tr><td>Severity</td><td>Critical, High, Medium, Low, Info</td></tr>
        <tr><td>Category</td><td>Checker name</td></tr>
        <tr><td>Message</td><td>Issue description</td></tr>
        <tr><td>Flagged Text</td><td>Problematic text</td></tr>
        <tr><td>Suggestion</td><td>Recommended fix</td></tr>
        <tr><td>Status</td><td>Pending, Kept, Suppressed, Fixed</td></tr>
    </tbody>
</table>

<h2><i data-lucide="bar-chart"></i> Use Cases</h2>
<ul>
    <li>Issue tracking (Jira, Azure DevOps)</li>
    <li>Metrics dashboard</li>
    <li>Quality reporting</li>
    <li>Auditing</li>
</ul>
`
};

// ============================================================================
// JSON EXPORT
// ============================================================================
HelpDocs.content['export-json'] = {
    title: 'JSON Export',
    subtitle: 'Structured data for automation',
    html: `
<h2><i data-lucide="code"></i> Structure</h2>
<pre class="help-code">{
  "metadata": { "version": "3.0.52", "document": "spec.docx" },
  "summary": { "total_issues": 47, "quality_score": "B+" },
  "issues": [
    {
      "id": "issue-001",
      "severity": "high",
      "category": "acronyms",
      "message": "Undefined acronym",
      "flagged": "SRR",
      "suggestion": "Define on first use"
    }
  ]
}</pre>

<h2><i data-lucide="workflow"></i> Use Cases</h2>
<ul>
    <li><strong>CI/CD integration</strong> — Fail builds on critical issues</li>
    <li><strong>Custom reporting</strong> — Generate tailored reports</li>
    <li><strong>Data aggregation</strong> — Combine multiple documents</li>
    <li><strong>API integration</strong> — Post to tracking systems</li>
</ul>
`
};

// ============================================================================
// FIX ASSISTANT - OVERVIEW
// ============================================================================
HelpDocs.content['fix-overview'] = {
    title: 'Fix Assistant v2',
    subtitle: 'Premium triage interface for reviewing automatic fixes',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="wand-2" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Fix Assistant v2 is a premium document review interface that helps you triage automatic fixes with confidence scoring, pattern learning, undo/redo support, and rich export options including tracked changes and reviewer comments.</p>
    </div>
</div>

<div class="help-callout help-callout-success">
    <i data-lucide="sparkles"></i>
    <div>
        <strong>AI-Assisted Review</strong>
        <p>Each fix is scored by confidence (Safe/Review/Caution). The system learns from your decisions to improve future suggestions.</p>
    </div>
</div>

<h2><i data-lucide="sparkles"></i> Key Features</h2>

<div class="help-feature-grid">
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="shield-check"></i></div>
        <h3>Confidence Scoring</h3>
        <p>Each fix is categorized as Safe (auto-accept recommended), Review (human judgment needed), or Caution (verify carefully).</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="eye"></i></div>
        <h3>Before/After Preview</h3>
        <p>See the original text alongside the proposed change with highlighted differences.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="file-text"></i></div>
        <h3>Two-Panel Document View</h3>
        <p>Full document viewer with page navigation, mini-map, and fix position markers.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="rotate-ccw"></i></div>
        <h3>Undo/Redo</h3>
        <p>Change your mind? Undo any decision. Full history of all actions.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="brain"></i></div>
        <h3>Pattern Learning</h3>
        <p>The system tracks your decisions to learn which patterns you accept or reject. No cloud AI—just smart pattern matching.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="book-open"></i></div>
        <h3>Custom Dictionary</h3>
        <p>Add terms to always skip. Your dictionary persists across sessions.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="search"></i></div>
        <h3>Search & Filter</h3>
        <p>Find specific fixes by text, category, or confidence level.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="download"></i></div>
        <h3>Rich Export</h3>
        <p>Export with tracked changes (accepted) and comments (rejected with notes).</p>
    </div>
</div>

<h2><i data-lucide="keyboard"></i> Keyboard Shortcuts</h2>
<table class="help-table">
    <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
    <tbody>
        <tr><td><kbd>A</kbd></td><td>Accept current fix</td></tr>
        <tr><td><kbd>R</kbd></td><td>Reject current fix</td></tr>
        <tr><td><kbd>S</kbd></td><td>Skip current fix</td></tr>
        <tr><td><kbd>U</kbd> or <kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo last action</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></td><td>Redo</td></tr>
        <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Navigate fixes</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>F</kbd></td><td>Search fixes</td></tr>
    </tbody>
</table>

<h2><i data-lucide="navigation"></i> Learn More</h2>
<div class="help-path-list">
    <div class="help-path-card" onclick="HelpContent.navigateTo('fix-workflow')">
        <div class="help-path-icon"><i data-lucide="workflow"></i></div>
        <div class="help-path-content"><h4>Review Workflow</h4><p>Step-by-step guide to reviewing fixes</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('fix-learning')">
        <div class="help-path-icon"><i data-lucide="brain"></i></div>
        <div class="help-path-content"><h4>Pattern Learning</h4><p>How the system learns from your decisions</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('fix-export')">
        <div class="help-path-icon"><i data-lucide="download"></i></div>
        <div class="help-path-content"><h4>Export Options</h4><p>Tracked changes, comments, and reports</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
</div>
`
};

// ============================================================================
// FIX ASSISTANT - WORKFLOW
// ============================================================================
HelpDocs.content['fix-workflow'] = {
    title: 'Review Workflow',
    subtitle: 'Step-by-step guide to reviewing fixes',
    html: `
<h2><i data-lucide="workflow"></i> The Review Process</h2>
<ol>
    <li><strong>Run a Review</strong> — Load a document and run a review with your preferred presets</li>
    <li><strong>Open Fix Assistant</strong> — Click <strong>Fix Assistant</strong> in the Review panel or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd></li>
    <li><strong>Review Fixes</strong> — Each fix shows the issue, suggested change, and confidence level</li>
    <li><strong>Make Decisions</strong> — Accept, Reject, or Skip each fix</li>
    <li><strong>Add Notes</strong> — Optionally add reviewer notes to rejected fixes</li>
    <li><strong>Export</strong> — Download with tracked changes and/or comments</li>
</ol>

<h2><i data-lucide="target"></i> Confidence Levels</h2>
<table class="help-table">
    <thead><tr><th>Level</th><th>Badge</th><th>Meaning</th><th>Recommendation</th></tr></thead>
    <tbody>
        <tr><td><strong>Safe</strong></td><td style="color: #22c55e;">●</td><td>High confidence fix (95%+)</td><td>Usually safe to auto-accept</td></tr>
        <tr><td><strong>Review</strong></td><td style="color: #eab308;">●</td><td>Medium confidence (70-95%)</td><td>Human review recommended</td></tr>
        <tr><td><strong>Caution</strong></td><td style="color: #ef4444;">●</td><td>Lower confidence (&lt;70%)</td><td>Verify carefully before accepting</td></tr>
    </tbody>
</table>

<h2><i data-lucide="zap"></i> Bulk Actions</h2>
<ul>
    <li><strong>Accept All Safe</strong> — Accept all fixes with Safe confidence</li>
    <li><strong>Accept All</strong> — Accept all remaining fixes</li>
    <li><strong>Reject All</strong> — Reject all remaining fixes</li>
    <li><strong>Reset All</strong> — Clear all decisions and start over</li>
</ul>

<h2><i data-lucide="save"></i> Progress Persistence</h2>
<p>Your progress is automatically saved to localStorage. Close the browser and come back later—your decisions are preserved.</p>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip: Live Preview Mode</strong>
        <p>Enable Live Preview to see how the document would look with all accepted changes applied in real-time.</p>
    </div>
</div>
`
};

// ============================================================================
// FIX ASSISTANT - LEARNING
// ============================================================================
HelpDocs.content['fix-learning'] = {
    title: 'Pattern Learning',
    subtitle: 'How Fix Assistant learns from your decisions',
    html: `
<h2><i data-lucide="brain"></i> Learning System</h2>
<p>Fix Assistant tracks patterns in your decisions to improve future suggestions. This is <strong>not cloud AI</strong>—it's deterministic pattern matching based on your choices stored locally.</p>

<h2><i data-lucide="database"></i> What Gets Tracked</h2>
<ul>
    <li><strong>Issue patterns</strong> — Which types of issues you typically accept or reject</li>
    <li><strong>Context patterns</strong> — Surrounding text that correlates with your decisions</li>
    <li><strong>Category preferences</strong> — Grammar vs spelling vs style preferences</li>
    <li><strong>Skip patterns</strong> — Content you consistently skip</li>
</ul>

<h2><i data-lucide="bar-chart-2"></i> Viewing Statistics</h2>
<p>Click the <strong>Stats</strong> button in Fix Assistant to see:</p>
<ul>
    <li>Total fixes reviewed</li>
    <li>Accept/Reject/Skip ratios by category</li>
    <li>Most common patterns</li>
    <li>Learning confidence over time</li>
</ul>

<h2><i data-lucide="book-open"></i> Custom Dictionary</h2>
<p>Add terms that should always be skipped:</p>
<ul>
    <li>Product names and trademarks</li>
    <li>Industry-specific terminology</li>
    <li>Acronyms unique to your organization</li>
    <li>Names and proper nouns</li>
</ul>

<h2><i data-lucide="refresh-cw"></i> Resetting Learning</h2>
<p>Clear the learning database via Settings → Fix Assistant → Reset Learning Data. Your custom dictionary is preserved.</p>
`
};

// ============================================================================
// FIX ASSISTANT - EXPORT
// ============================================================================
HelpDocs.content['fix-export'] = {
    title: 'Export Options',
    subtitle: 'Export reviewed documents with changes and comments',
    html: `
<h2><i data-lucide="download"></i> Export Formats</h2>

<h3>Word Document with Tracked Changes</h3>
<p>Exports a .docx file where:</p>
<ul>
    <li><strong>Accepted fixes</strong> → Applied as tracked changes (insertions/deletions)</li>
    <li><strong>Rejected fixes</strong> → Inserted as comments with your reviewer notes</li>
    <li>Original formatting preserved</li>
</ul>

<h3>PDF Summary Report</h3>
<p>Generates a PDF report containing:</p>
<ul>
    <li>Executive summary of changes</li>
    <li>Statistics by category</li>
    <li>List of all accepted changes</li>
    <li>List of rejected items with reasons</li>
    <li>Reviewer name and timestamp</li>
</ul>

<h3>JSON Data Export</h3>
<p>Machine-readable export for integration with other tools:</p>
<pre class="help-code">
{
  "accepted": [...],
  "rejected": [...],
  "skipped": [...],
  "statistics": {...},
  "timestamp": "2026-01-29T..."
}
</pre>

<h2><i data-lucide="settings"></i> Export Settings</h2>
<ul>
    <li><strong>Include timestamps</strong> — Add review date to comments</li>
    <li><strong>Reviewer name</strong> — Name shown in tracked changes</li>
    <li><strong>Comment prefix</strong> — Prefix for comment text (e.g., "[TWR]")</li>
    <li><strong>Include statistics</strong> — Add summary at end of document</li>
</ul>
`
};

// ============================================================================
// HYPERLINK HEALTH - OVERVIEW
// ============================================================================
HelpDocs.content['hyperlink-overview'] = {
    title: 'Hyperlink Health',
    subtitle: 'Validate all URLs in your documents',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="link" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Hyperlink Health validates every URL in your documents—checking for broken links, redirects, SSL issues, and missing destinations. Get a comprehensive status report before publishing.</p>
    </div>
</div>

<h2><i data-lucide="file-type"></i> Supported File Types</h2>
<div class="help-formats" style="margin-bottom: 16px;">
    <span class="format-badge format-primary">.docx (Word)</span>
    <span class="format-badge format-primary">.xlsx / .xls (Excel)</span>
    <span class="format-badge">.pdf</span>
    <span class="format-badge">.txt</span>
</div>
<p>Word and Excel files provide the richest hyperlink extraction, capturing embedded links, HYPERLINK fields, and cell formulas.</p>

<h2><i data-lucide="check-circle"></i> What Gets Checked</h2>
<ul>
    <li><strong>HTTP/HTTPS URLs</strong> — Web links, API endpoints</li>
    <li><strong>File links</strong> — References to local files</li>
    <li><strong>Email links</strong> — mailto: addresses</li>
    <li><strong>Internal anchors</strong> — #bookmark references</li>
    <li><strong>HYPERLINK fields</strong> — Extracted from Word DOCX files</li>
    <li><strong>Excel hyperlinks</strong> — Cell hyperlinks, HYPERLINK formulas, and linked objects from .xlsx/.xls files</li>
</ul>

<h2><i data-lucide="settings"></i> Validation Modes</h2>
<p>Choose a validation mode in Settings → Hyperlink Validation:</p>
<table class="help-table">
    <thead><tr><th>Mode</th><th>Description</th><th>Best For</th></tr></thead>
    <tbody>
        <tr>
            <td><strong>Offline</strong></td>
            <td>Format/syntax validation only. Checks URL structure without network access. Marks valid formats as "Format OK" without verifying accessibility.</td>
            <td>Air-gapped systems, quick format checks, or when you don't want to hit external servers</td>
        </tr>
        <tr>
            <td><strong>Validator</strong></td>
            <td>Full HTTP validation with Windows integrated authentication (NTLM/Negotiate SSO). Makes actual HTTP requests to verify each URL is accessible.</td>
            <td>Standard validation when you have network access and need to verify links actually work</td>
        </tr>
    </tbody>
</table>

<h3>Validator Mode Features</h3>
<p>The Validator mode is optimized for government and enterprise sites:</p>
<ul>
    <li><strong>Windows SSO Authentication</strong> — Automatically uses your Windows credentials (NTLM/Negotiate) to access authenticated resources like SharePoint, internal wikis, and government portals</li>
    <li><strong>Robust Retry Logic</strong> — Exponential backoff with configurable retries for slow government servers</li>
    <li><strong>Government Site Compatibility</strong> — Extended timeouts, realistic browser headers, and handling of authentication challenges</li>
    <li><strong>Redirect Chain Tracking</strong> — Follows and records redirect chains up to 5 hops</li>
    <li><strong>SSL Certificate Verification</strong> — Validates certificate chains and warns about expiring certificates</li>
    <li><strong>HEAD/GET Fallback</strong> — Automatically falls back to GET if HEAD requests are blocked (common on government sites)</li>
    <li><strong>Rate Limiting Detection</strong> — Recognizes 429 responses and reports them appropriately</li>
</ul>

<h3>Authentication Options (v3.0.123)</h3>
<p>Configure authentication in Settings → Hyperlink Validation → Advanced Authentication Settings:</p>
<table class="help-table">
    <thead><tr><th>Method</th><th>Use Case</th><th>Configuration</th></tr></thead>
    <tbody>
        <tr>
            <td><strong>Windows SSO</strong></td>
            <td>SharePoint, internal wikis, Windows-authenticated sites</td>
            <td>Automatic when <code>requests-negotiate-sspi</code> is installed</td>
        </tr>
        <tr>
            <td><strong>CAC/PIV Certificate</strong></td>
            <td>.mil sites, federal PKI-protected resources (DLA, DISA, etc.)</td>
            <td>Set Client Certificate and Private Key paths (.pem files)</td>
        </tr>
        <tr>
            <td><strong>Custom CA Bundle</strong></td>
            <td>Government sites with DoD/Federal PKI certificates</td>
            <td>Set CA Certificate Bundle path (DoD root CA bundle)</td>
        </tr>
        <tr>
            <td><strong>Proxy Server</strong></td>
            <td>Enterprise networks with mandatory proxy</td>
            <td>Set Proxy Server URL (e.g., http://proxy.corp.mil:8080)</td>
        </tr>
    </tbody>
</table>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>DoD CAC/PIV Setup</strong>
        <p>For CAC authentication to .mil sites: Export your certificate and private key from your CAC card to PEM files. The DoD PKI CA bundle can be downloaded from <a href="https://militarycac.com" target="_blank">MilitaryCAC.com</a> or your organization's PKI administrator.</p>
    </div>
</div>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Windows SSO Package</strong>
        <p>For automatic Windows authentication, install: <code>pip install requests-negotiate-sspi</code> (Windows) or <code>pip install requests-ntlm</code> (cross-platform).</p>
    </div>
</div>

<h2><i data-lucide="table"></i> Excel Hyperlink Extraction</h2>
<p>For Excel files (.xlsx, .xls), the validator extracts hyperlinks from:</p>
<ul>
    <li><strong>Cell hyperlinks</strong> — Links applied directly to cells</li>
    <li><strong>HYPERLINK formulas</strong> — =HYPERLINK("url", "text") functions</li>
    <li><strong>Named ranges</strong> — Hyperlinks in named range definitions</li>
    <li><strong>All worksheets</strong> — Scans every sheet in the workbook</li>
</ul>
<p>Results show the sheet name, cell reference, display text, and target URL for each link found.</p>

<h2><i data-lucide="activity"></i> Validation Results</h2>
<table class="help-table">
    <thead><tr><th>Status</th><th>Icon</th><th>Meaning</th></tr></thead>
    <tbody>
        <tr><td><strong>Valid</strong></td><td style="color: #22c55e;">✓</td><td>URL responds with 200 OK</td></tr>
        <tr><td><strong>Redirect</strong></td><td style="color: #eab308;">→</td><td>URL redirects (301/302/307/308)</td></tr>
        <tr><td><strong>Broken</strong></td><td style="color: #ef4444;">✗</td><td>URL returns 404 or connection failed</td></tr>
        <tr><td><strong>Auth Required</strong></td><td style="color: #f97316;">🔐</td><td>401 Unauthorized — link exists but requires credentials beyond current Windows auth</td></tr>
        <tr><td><strong>Blocked</strong></td><td style="color: #ef4444;">🚫</td><td>403 Forbidden — access denied or requires specific permissions</td></tr>
        <tr><td><strong>SSL Error</strong></td><td style="color: #ef4444;">🔓</td><td>Certificate problem — expired, self-signed, or untrusted CA</td></tr>
        <tr><td><strong>DNS Failed</strong></td><td style="color: #ef4444;">⚠</td><td>Could not resolve hostname — domain may not exist</td></tr>
        <tr><td><strong>Timeout</strong></td><td style="color: #f97316;">⏱</td><td>Server didn't respond in time</td></tr>
        <tr><td><strong>Rate Limited</strong></td><td style="color: #f97316;">⏳</td><td>429 Too Many Requests — server is limiting requests</td></tr>
        <tr><td><strong>Skipped</strong></td><td style="color: #6b7280;">○</td><td>Not validated (internal/mailto) or matched exclusion rule</td></tr>
        <tr><td><strong>Format OK</strong></td><td style="color: #3b82f6;">✓</td><td>Valid URL format (Offline mode — not network verified)</td></tr>
    </tbody>
</table>

<h2><i data-lucide="eye"></i> Status Panel</h2>
<p>After validation, the Hyperlink Status Panel shows:</p>
<ul>
    <li>Total links found</li>
    <li>Valid/Broken/Redirect counts</li>
    <li>Click any link to see details</li>
    <li>Export results to CSV or Excel</li>
</ul>

<h2><i data-lucide="download"></i> Export Options</h2>
<p>Export validated hyperlinks with highlighting:</p>
<ul>
    <li><strong>Export Highlighted DOCX</strong> — Broken links marked in red/yellow with strikethrough</li>
    <li><strong>Export Highlighted Excel</strong> — Broken link rows highlighted with red background</li>
    <li><strong>CSV Export</strong> — Full results table for spreadsheet analysis</li>
</ul>
<p>The "Export Highlighted" button appears after validation completes.</p>

<h2><i data-lucide="refresh-cw"></i> Headless Browser Rescan (New in v3.0.124)</h2>
<p>Some government sites (defense.gov, dla.mil, navy.mil, etc.) use aggressive bot protection that blocks standard HTTP requests, showing as "Blocked (403)". The <strong>Rescan</strong> feature uses a real Chrome browser to retry these URLs.</p>

<h3>How It Works</h3>
<ol>
    <li>After validation completes, blocked URLs are identified</li>
    <li>Click <strong>Rescan Blocked</strong> to retry with headless Chrome</li>
    <li>Chrome browser runs in the background (no visible window)</li>
    <li>Uses stealth techniques to bypass bot detection</li>
    <li>Results update showing which URLs are now accessible</li>
</ol>

<h3>Why It's Needed</h3>
<p>Many .mil and .gov sites use services like Akamai, Cloudflare, or custom bot protection that:</p>
<ul>
    <li>Block requests without proper browser fingerprints</li>
    <li>Require JavaScript execution to pass challenges</li>
    <li>Check for automation indicators (headless browser flags)</li>
</ul>
<p>The rescan feature uses a real Chrome browser with stealth scripts to appear as a legitimate user.</p>

<h3>Requirements</h3>
<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Optional Installation</strong>
        <p>Headless browser rescan requires Playwright. Install with:</p>
        <pre style="background: var(--bg-secondary); padding: 8px; border-radius: 4px; margin-top: 8px;">pip install playwright
playwright install chromium</pre>
        <p style="margin-top: 8px;">If not installed, standard HTTP validation still works — only the rescan feature is unavailable.</p>
    </div>
</div>

<h2><i data-lucide="history"></i> Link History & Exclusions (New in v3.0.122)</h2>
<p>Click the <strong>Links</strong> button in the top navigation to access:</p>

<h3>Exclusions Tab</h3>
<p>Create rules to skip certain URLs during validation:</p>
<ul>
    <li><strong>Match Types</strong> — Contains, Exact, Prefix, Suffix, or Regex</li>
    <li><strong>Enable/Disable</strong> — Toggle exclusions without deleting</li>
    <li><strong>Reasons</strong> — Add notes for why URLs are excluded</li>
    <li><strong>Persistence</strong> — Exclusions stored in SQLite database (survive sessions)</li>
</ul>
<p>Example exclusions: internal servers, localhost URLs, authentication-required pages, known-deprecated endpoints.</p>

<h3>Scans Tab</h3>
<p>View historical hyperlink scans with:</p>
<ul>
    <li>Document name and scan timestamp</li>
    <li>Total links, valid count, broken count</li>
    <li>Expand any scan to see full details</li>
    <li>Delete old scan records</li>
</ul>

<h2><i data-lucide="mouse-pointer"></i> Clickable Hyperlinks (v3.0.121)</h2>
<p>In the validation results panel, click any hyperlink row to open the URL in a new browser tab for manual verification. Hover shows an external-link icon.</p>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Air-Gapped Mode</strong>
        <p>In air-gapped environments, external URLs cannot be validated. The checker will identify them but mark as "Cannot validate (offline)".</p>
    </div>
</div>
`
};

// ============================================================================
// HYPERLINK HEALTH - VALIDATION
// ============================================================================
HelpDocs.content['hyperlink-validation'] = {
    title: 'URL Validation',
    subtitle: 'How hyperlink validation works',
    html: `
<h2><i data-lucide="cog"></i> Validation Process</h2>
<ol>
    <li><strong>Extract</strong> — Find all URLs in document text, HYPERLINK fields, and Excel cells</li>
    <li><strong>Deduplicate</strong> — Combine identical URLs</li>
    <li><strong>Apply Exclusions</strong> — Skip URLs matching your exclusion rules</li>
    <li><strong>Validate</strong> — Send HTTP requests to each unique URL (Validator mode only)</li>
    <li><strong>Report</strong> — Collect status codes, response times, and error details</li>
</ol>

<h2><i data-lucide="settings"></i> Validation Settings</h2>
<p>Configure in Settings → Hyperlink Validation:</p>
<ul>
    <li><strong>Mode</strong> — Offline (format only) or Validator (full HTTP with Windows auth)</li>
    <li><strong>Timeout</strong> — Max wait time per URL (default: 10 seconds, extended for slow government servers)</li>
    <li><strong>Retries</strong> — Number of retry attempts for failed requests (default: 3)</li>
    <li><strong>Follow redirects</strong> — Whether to follow redirect chains (default: yes, up to 5 hops)</li>
    <li><strong>Verify SSL</strong> — Check certificate validity (always enabled in Validator mode)</li>
</ul>

<h2><i data-lucide="shield"></i> Government & Enterprise Site Handling</h2>
<p>Validator mode is specifically optimized for challenging government and enterprise sites:</p>
<ul>
    <li><strong>Windows Authentication</strong> — Automatic NTLM/Negotiate SSO using your Windows credentials</li>
    <li><strong>Extended Timeouts</strong> — Longer connect and read timeouts for slow government servers</li>
    <li><strong>Realistic Browser Headers</strong> — User-Agent and Accept headers that mimic a real browser to avoid bot blocking</li>
    <li><strong>HEAD/GET Fallback</strong> — If HEAD request fails (common on government sites), automatically retries with GET</li>
    <li><strong>HTTP 405 Handling</strong> — "Method Not Allowed" treated as success (page exists but doesn't allow HEAD)</li>
    <li><strong>Authentication Challenges</strong> — 401 responses reported as "Auth Required" rather than broken</li>
    <li><strong>Exponential Backoff</strong> — Intelligent retry timing to avoid rate limiting</li>
</ul>

<h2><i data-lucide="shield-check"></i> Rate Limiting & Politeness</h2>
<p>To avoid overwhelming servers:</p>
<ul>
    <li>Requests are processed sequentially (one at a time)</li>
    <li>Exponential backoff between retries (2s, 4s, 8s)</li>
    <li>429 Rate Limit responses are reported but not retried aggressively</li>
</ul>
`
};

// ============================================================================
// HYPERLINK HEALTH - STATUS CODES
// ============================================================================
HelpDocs.content['hyperlink-status'] = {
    title: 'Status Codes',
    subtitle: 'Understanding HTTP response codes',
    html: `
<h2><i data-lucide="check-circle"></i> Success Codes (2xx)</h2>
<table class="help-table">
    <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
    <tbody>
        <tr><td>200</td><td>OK - Resource exists and is accessible</td></tr>
        <tr><td>201</td><td>Created - Resource was created</td></tr>
        <tr><td>204</td><td>No Content - Success but no body</td></tr>
    </tbody>
</table>

<h2><i data-lucide="arrow-right"></i> Redirect Codes (3xx)</h2>
<table class="help-table">
    <thead><tr><th>Code</th><th>Meaning</th><th>Action</th></tr></thead>
    <tbody>
        <tr><td>301</td><td>Moved Permanently</td><td>Update the URL</td></tr>
        <tr><td>302</td><td>Found (Temporary)</td><td>Usually OK to keep</td></tr>
        <tr><td>307</td><td>Temporary Redirect</td><td>Usually OK to keep</td></tr>
        <tr><td>308</td><td>Permanent Redirect</td><td>Update the URL</td></tr>
    </tbody>
</table>

<h2><i data-lucide="alert-circle"></i> Error Codes (4xx)</h2>
<table class="help-table">
    <thead><tr><th>Code</th><th>Meaning</th><th>Action</th></tr></thead>
    <tbody>
        <tr><td>400</td><td>Bad Request</td><td>Check URL format</td></tr>
        <tr><td>401</td><td>Unauthorized</td><td>Requires login</td></tr>
        <tr><td>403</td><td>Forbidden</td><td>Access denied</td></tr>
        <tr><td>404</td><td>Not Found</td><td>Remove or fix URL</td></tr>
        <tr><td>410</td><td>Gone</td><td>Permanently removed</td></tr>
    </tbody>
</table>

<h2><i data-lucide="server"></i> Server Error Codes (5xx)</h2>
<table class="help-table">
    <thead><tr><th>Code</th><th>Meaning</th><th>Action</th></tr></thead>
    <tbody>
        <tr><td>500</td><td>Internal Server Error</td><td>Retry later</td></tr>
        <tr><td>502</td><td>Bad Gateway</td><td>Retry later</td></tr>
        <tr><td>503</td><td>Service Unavailable</td><td>Retry later</td></tr>
        <tr><td>504</td><td>Gateway Timeout</td><td>Retry later</td></tr>
    </tbody>
</table>
`
};

// ============================================================================
// BATCH PROCESSING - OVERVIEW
// ============================================================================
HelpDocs.content['batch-overview'] = {
    title: 'Batch Processing',
    subtitle: 'Process multiple documents at once',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="layers" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Batch Processing lets you queue multiple documents for analysis, track progress, and view consolidated results across your entire document library.</p>
    </div>
</div>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Batch Limits (v3.0.116)</strong>
        <p>Maximum <strong>10 files</strong> per batch, with a combined total size limit of <strong>100MB</strong>. Files are streamed to disk in 8KB chunks to minimize memory usage.</p>
    </div>
</div>

<h2><i data-lucide="plus-circle"></i> Adding Documents</h2>
<ol>
    <li>Click <strong>Batch</strong> in the toolbar</li>
    <li>Drag and drop multiple files, or click to browse</li>
    <li>Select your review preset and options</li>
    <li>Click <strong>Start Batch</strong></li>
</ol>

<h2><i data-lucide="list"></i> Queue Management</h2>
<ul>
    <li><strong>Reorder</strong> — Drag documents to change processing order</li>
    <li><strong>Remove</strong> — Remove documents before processing</li>
    <li><strong>Pause/Resume</strong> — Pause the queue at any time</li>
    <li><strong>Cancel</strong> — Stop processing and clear the queue</li>
</ul>

<h2><i data-lucide="bar-chart-2"></i> Results View</h2>
<p>After processing, view:</p>
<ul>
    <li>Summary statistics across all documents</li>
    <li>Per-document issue counts</li>
    <li>Click any document to see its detailed results</li>
    <li>Export all results to Excel or CSV</li>
</ul>

<h2><i data-lucide="settings"></i> Batch Options</h2>
<ul>
    <li><strong>Auto-export</strong> — Automatically export each document after processing</li>
    <li><strong>Skip errors</strong> — Continue processing if a document fails</li>
    <li><strong>Role extraction</strong> — Enable role extraction for all documents</li>
    <li><strong>Parallel processing</strong> — Process multiple documents simultaneously</li>
</ul>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip: Cross-Document Analysis</strong>
        <p>After batch processing, open Roles Studio to see aggregated role data across all processed documents.</p>
    </div>
</div>
`
};

// ============================================================================
// BATCH PROCESSING - QUEUE
// ============================================================================
HelpDocs.content['batch-queue'] = {
    title: 'Queue Management',
    subtitle: 'Managing your batch processing queue',
    html: `
<h2><i data-lucide="list"></i> Queue States</h2>
<table class="help-table">
    <thead><tr><th>State</th><th>Icon</th><th>Meaning</th></tr></thead>
    <tbody>
        <tr><td>Pending</td><td>○</td><td>Waiting to be processed</td></tr>
        <tr><td>Processing</td><td>◐</td><td>Currently being analyzed</td></tr>
        <tr><td>Complete</td><td style="color: #22c55e;">✓</td><td>Successfully processed</td></tr>
        <tr><td>Error</td><td style="color: #ef4444;">✗</td><td>Processing failed</td></tr>
        <tr><td>Skipped</td><td>○</td><td>Manually skipped</td></tr>
    </tbody>
</table>

<h2><i data-lucide="settings"></i> Queue Controls</h2>
<ul>
    <li><strong>Start/Pause</strong> — Begin or pause processing</li>
    <li><strong>Clear Completed</strong> — Remove finished items from view</li>
    <li><strong>Retry Failed</strong> — Reprocess documents that errored</li>
    <li><strong>Clear All</strong> — Remove all items from queue</li>
</ul>

<h2><i data-lucide="zap"></i> Performance</h2>
<p>Processing time depends on:</p>
<ul>
    <li>Document size and complexity</li>
    <li>Number of enabled checkers</li>
    <li>Whether role extraction is enabled</li>
    <li>System resources available</li>
</ul>
`
};

// ============================================================================
// BATCH PROCESSING - RESULTS
// ============================================================================
HelpDocs.content['batch-results'] = {
    title: 'Consolidated Results',
    subtitle: 'Viewing results across multiple documents',
    html: `
<h2><i data-lucide="bar-chart-2"></i> Summary Statistics</h2>
<p>The batch results view shows:</p>
<ul>
    <li>Total documents processed</li>
    <li>Total issues found across all documents</li>
    <li>Breakdown by severity (Critical/High/Medium/Low)</li>
    <li>Breakdown by category</li>
    <li>Processing time statistics</li>
</ul>

<h2><i data-lucide="table"></i> Per-Document View</h2>
<p>Click any document to see:</p>
<ul>
    <li>Issue count and quality score</li>
    <li>Severity distribution</li>
    <li>Category breakdown</li>
    <li>Full issue list</li>
</ul>

<h2><i data-lucide="download"></i> Export Options</h2>
<ul>
    <li><strong>Excel Workbook</strong> — One sheet per document plus summary</li>
    <li><strong>CSV Archive</strong> — ZIP file with one CSV per document</li>
    <li><strong>JSON</strong> — Complete data for API integration</li>
</ul>

<h2><i data-lucide="users"></i> Cross-Document Analysis</h2>
<p>After batch processing:</p>
<ul>
    <li>Open <strong>Roles Studio</strong> to see aggregated roles</li>
    <li>Use the Document Filter to compare specific documents</li>
    <li>View the Role-Document Matrix for cross-reference</li>
</ul>
`
};

// ============================================================================
// SETTINGS - GENERAL
// ============================================================================
HelpDocs.content['settings-general'] = {
    title: 'General Settings',
    subtitle: 'Configure behavior and defaults',
    html: `
<p>Access via gear icon in footer or <kbd>Ctrl</kbd>+<kbd>,</kbd>.</p>

<h2><i data-lucide="sliders"></i> Document Analysis</h2>
<ul>
    <li><strong>Default Preset</strong> — Which preset loads on start</li>
    <li><strong>Sentence Length Threshold</strong> — Max words (default: 40)</li>
    <li><strong>Passive Voice Threshold</strong> — Percentage (default: 10%)</li>
</ul>

<h2><i data-lucide="list"></i> Issue Display</h2>
<ul>
    <li><strong>Default Sort</strong> — Severity, Category, or Location</li>
    <li><strong>Auto-collapse families</strong> — Show one per family</li>
    <li><strong>Minimum family size</strong> — Grouping threshold (default: 3)</li>
</ul>

<h2><i data-lucide="save"></i> Data</h2>
<ul>
    <li><strong>Remember Decisions</strong> — Persist Keep/Suppress/Fix across sessions</li>
    <li><strong>Clear All Data</strong> — Reset to defaults</li>
</ul>
`
};

// ============================================================================
// SETTINGS - APPEARANCE
// ============================================================================
HelpDocs.content['settings-appearance'] = {
    title: 'Appearance',
    subtitle: 'Customize look and feel',
    html: `
<h2><i data-lucide="sun"></i> Theme</h2>
<ul>
    <li><strong>Light Mode</strong> — White background, dark text</li>
    <li><strong>Dark Mode</strong> — Dark background, light text</li>
    <li><strong>System</strong> — Match OS preference</li>
</ul>

<h2><i data-lucide="type"></i> Typography</h2>
<ul>
    <li><strong>Font Size</strong> — Small (13px), Medium (14px), Large (16px)</li>
    <li><strong>Font Family</strong> — System Default, Inter, Source Sans</li>
</ul>

<h2><i data-lucide="layout"></i> Layout</h2>
<ul>
    <li><strong>Sidebar position</strong> — Left (default) or Right</li>
    <li><strong>Compact mode</strong> — Reduce spacing for more content</li>
</ul>
`
};

// ============================================================================
// SETTINGS - UPDATES
// ============================================================================
HelpDocs.content['settings-updates'] = {
    title: 'Updates',
    subtitle: 'Apply patches without full reinstall',
    html: `
<h2><i data-lucide="refresh-cw"></i> Built-in Update System</h2>
<p>TechWriterReview includes a built-in update system for applying patches and fixes without reinstalling the entire application.</p>

<h2><i data-lucide="download"></i> Applying Updates</h2>
<ol>
    <li>Place update files in the <code>updates/</code> folder (inside the TechWriterReview directory)</li>
    <li>Open <strong>Settings</strong> → <strong>Updates</strong> tab</li>
    <li>Click <strong>"Check for Updates"</strong> to scan for pending files</li>
    <li>Review the list of files that will be updated</li>
    <li>Click <strong>"Apply Updates"</strong> to install them</li>
    <li>Wait for automatic restart and browser refresh</li>
</ol>

<h2><i data-lucide="folder"></i> Update File Formats</h2>
<p>The update system supports three methods:</p>

<h3>1. Directory Structure (Recommended)</h3>
<p>Mirror the app's folder structure inside updates/:</p>
<pre>updates/
├── static/js/features/roles.js
├── templates/index.html
└── role_extractor_v3.py</pre>

<h3>2. Flat Files with Prefixes</h3>
<p>Use naming prefixes to specify destinations:</p>
<table class="help-table">
    <tr><td><code>static_js_features_</code></td><td>→ static/js/features/</td></tr>
    <tr><td><code>static_js_ui_</code></td><td>→ static/js/ui/</td></tr>
    <tr><td><code>static_css_</code></td><td>→ static/css/</td></tr>
    <tr><td><code>templates_</code></td><td>→ templates/</td></tr>
    <tr><td><code>statement_forge_</code></td><td>→ statement_forge/</td></tr>
</table>

<h3>3. .txt Extension (Air-Gapped Networks)</h3>
<p>Add <code>.txt</code> to any filename to bypass network filters:</p>
<code>roles.js.txt</code> → saved as <code>roles.js</code>

<h2><i data-lucide="shield"></i> How It Works</h2>
<ul>
    <li>Update files are automatically routed to their correct locations</li>
    <li>Backups are created before applying any changes</li>
    <li>The server restarts automatically after successful updates</li>
    <li>Your browser refreshes when the server is ready</li>
</ul>

<h2><i data-lucide="undo-2"></i> Rollback</h2>
<p>If an update causes issues:</p>
<ol>
    <li>Go to <strong>Settings</strong> → <strong>Updates</strong> → <strong>Backups</strong></li>
    <li>Select the backup created before the problematic update</li>
    <li>Click <strong>"Rollback"</strong> to restore the previous version</li>
</ol>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Air-Gapped Friendly</strong>
        <p>Updates are applied from local files — no internet connection required. See <code>updates/UPDATE_README.md</code> for detailed documentation.</p>
    </div>
</div>
`
};

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
HelpDocs.content['shortcuts'] = {
    title: 'Keyboard Shortcuts',
    subtitle: 'Work faster with keyboard commands',
    html: `
<h2><i data-lucide="file"></i> Document Operations</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>Ctrl</kbd>+<kbd>O</kbd></td><td>Open document</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>R</kbd></td><td>Run review</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>E</kbd></td><td>Export results</td></tr>
    </tbody>
</table>

<h2><i data-lucide="layout"></i> Interface</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>Ctrl</kbd>+<kbd>B</kbd></td><td>Toggle sidebar</td></tr>
        <tr><td><kbd>F1</kbd></td><td>Open help</td></tr>
        <tr><td><kbd>?</kbd></td><td>Show shortcuts</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>Close modal/exit mode</td></tr>
    </tbody>
</table>

<h2><i data-lucide="check-square"></i> Triage Mode</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>T</kbd></td><td>Enter triage mode</td></tr>
        <tr><td><kbd>K</kbd> or <kbd>→</kbd></td><td>Keep issue</td></tr>
        <tr><td><kbd>S</kbd></td><td>Suppress issue</td></tr>
        <tr><td><kbd>F</kbd></td><td>Mark as fixed</td></tr>
        <tr><td><kbd>Space</kbd></td><td>Skip to next</td></tr>
        <tr><td><kbd>←</kbd></td><td>Previous issue</td></tr>
        <tr><td><kbd>Shift</kbd>+action</td><td>Apply to family</td></tr>
    </tbody>
</table>

<h2><i data-lucide="list"></i> Issue List</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Navigate issues</td></tr>
        <tr><td><kbd>Enter</kbd></td><td>View issue details</td></tr>
        <tr><td><kbd>/</kbd></td><td>Focus search</td></tr>
    </tbody>
</table>

<h2><i data-lucide="wand-2"></i> Fix Assistant</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>A</kbd></td><td>Accept current fix</td></tr>
        <tr><td><kbd>R</kbd></td><td>Reject current fix</td></tr>
        <tr><td><kbd>S</kbd></td><td>Skip current fix</td></tr>
        <tr><td><kbd>U</kbd> or <kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo last action</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></td><td>Redo</td></tr>
        <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Navigate fixes</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>F</kbd></td><td>Search fixes</td></tr>
    </tbody>
</table>

<h2><i data-lucide="users"></i> Roles Studio</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd></td><td>Open Roles Studio</td></tr>
        <tr><td><kbd>1</kbd>-<kbd>7</kbd></td><td>Switch tabs (Overview, Graph, Details, RACI, Matrix, Adjudication, Dictionary)</td></tr>
    </tbody>
</table>

<h2><i data-lucide="hammer"></i> Statement Forge</h2>
<table class="help-table">
    <tbody>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd></td><td>Open Statement Forge</td></tr>
        <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Navigate statements</td></tr>
        <tr><td><kbd>E</kbd></td><td>Edit selected statement</td></tr>
        <tr><td><kbd>D</kbd></td><td>Delete selected statement</td></tr>
    </tbody>
</table>
`
};

// ============================================================================
// TECHNICAL DEEP DIVE - ARCHITECTURE
// ============================================================================
HelpDocs.content['tech-architecture'] = {
    title: 'Architecture Overview',
    subtitle: 'Understanding how TechWriterReview is built',
    html: `
<div class="help-callout help-callout-info">
    <i data-lucide="cpu"></i>
    <div>
        <strong>Technical Section</strong>
        <p>This section is for developers, system administrators, and power users who want to understand TechWriterReview's internals.</p>
    </div>
</div>

<h2><i data-lucide="layers"></i> System Architecture</h2>
<p>TechWriterReview uses a classic client-server architecture designed for air-gapped Windows environments.</p>

<pre class="help-code">
┌─────────────────────────────────────────────────────────┐
│                      Browser (Client)                    │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │   app.js    │  │  features/ │  │  vendor/        │  │
│  │  (9,300 LOC)│  │  roles.js  │  │  d3.v7.min.js   │  │
│  │             │  │  families  │  │  chart.min.js   │  │
│  │             │  │  triage    │  │  lucide.min.js  │  │
│  └─────────────┘  └────────────┘  └─────────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────▼─────────────────────────────┐
│                    Flask Server (Python)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  app.py (3,500 LOC) - Routes & API Endpoints     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   core.py    │  │ statement_   │  │  update_     │   │
│  │  Document    │  │   forge/     │  │  manager.py  │   │
│  │  Extraction  │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Checker Modules (50+ files)             │   │
│  │  acronym_checker.py, grammar_checker.py, etc.    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
</pre>

<h2><i data-lucide="folder"></i> Directory Structure</h2>
<pre class="help-code">
TechWriterReview/            # Main application folder
├── app.py                   # Main Flask application (4,300+ LOC)
├── core.py                  # Document extraction engine
├── role_extractor_v3.py     # AI role extraction (94.7% precision)
├── *_checker.py             # 50+ quality checker modules
├── statement_forge/         # Statement extraction module
│   ├── routes.py            # API endpoints
│   ├── extractor.py         # Extraction logic
│   └── export.py            # Export formats
├── static/                  # Frontend assets
│   ├── js/                  # JavaScript modules
│   │   ├── app.js           # Main application
│   │   ├── features/        # Feature modules (roles, triage, families)
│   │   ├── ui/              # UI components (modals, state, events)
│   │   ├── api/             # API client
│   │   └── vendor/          # Third-party (D3, Chart.js, Lucide)
│   └── css/                 # Stylesheets
├── templates/               # HTML templates
│   └── index.html           # Single-page application
├── updates/                 # Drop update files here
│   └── UPDATE_README.md     # Update instructions
├── backups/                 # Auto-created before updates
├── logs/                    # Application logs
├── data/                    # Data files
├── tools/                   # Utility scripts
├── docs/                    # Documentation
├── version.json             # Version info (single source of truth)
├── config.json              # User configuration
├── requirements.txt         # Python dependencies
├── setup.bat                # Basic setup
├── setup_docling.bat        # Docling AI installation
└── setup_enhancements.bat   # NLP enhancements installation
</pre>

<h2><i data-lucide="cog"></i> Key Technologies</h2>
<table class="help-table">
    <thead><tr><th>Component</th><th>Technology</th><th>Purpose</th></tr></thead>
    <tbody>
        <tr><td>Backend</td><td>Python 3.8+ / Flask</td><td>API server, document processing</td></tr>
        <tr><td>Frontend</td><td>Vanilla JavaScript</td><td>UI, no framework dependencies</td></tr>
        <tr><td>Visualization</td><td>D3.js, Chart.js</td><td>Graphs and charts</td></tr>
        <tr><td>Icons</td><td>Lucide</td><td>UI icons</td></tr>
        <tr><td>WSGI Server</td><td>Waitress</td><td>Production-ready, Windows-native</td></tr>
        <tr><td>Document Parsing</td><td>python-docx, pdfplumber</td><td>Extract text from files</td></tr>
    </tbody>
</table>

<h2><i data-lucide="shield"></i> Air-Gapped Design</h2>
<ul>
    <li><strong>No external API calls</strong> — All processing is local</li>
    <li><strong>Bundled dependencies</strong> — Vendor JS files included</li>
    <li><strong>Offline NLP</strong> — No cloud language services</li>
    <li><strong>Local update system</strong> — Apply patches from local files</li>
</ul>
`
};

// ============================================================================
// TECHNICAL - CHECKER ENGINE
// ============================================================================
HelpDocs.content['tech-checkers'] = {
    title: 'Checker Engine',
    subtitle: 'How quality checks are implemented',
    html: `
<h2><i data-lucide="cog"></i> Checker Architecture</h2>
<p>Each checker is a Python class inheriting from <code>BaseChecker</code>:</p>

<pre class="help-code">
class AcronymChecker(BaseChecker):
    name = "Acronym Checker"
    category = "Acronyms"
    
    def check(self, document):
        issues = []
        for para_idx, paragraph in enumerate(document.paragraphs):
            # Detection logic
            acronyms = self.find_acronyms(paragraph.text)
            for acronym in acronyms:
                if not self.is_defined(acronym, document):
                    issues.append(Issue(
                        severity="high",
                        message=f"Undefined acronym: {acronym}",
                        flagged=acronym,
                        paragraph=para_idx,
                        suggestion="Define on first use"
                    ))
        return issues
</pre>

<h2><i data-lucide="list"></i> Checker Registry</h2>
<p>Checkers register themselves in <code>app.py</code>:</p>

<pre class="help-code">
CHECKERS = {
    'acronyms': AcronymChecker(),
    'grammar': GrammarChecker(),
    'spelling': SpellChecker(),
    'passive_voice': PassiveVoiceChecker(),
    'requirements': RequirementsChecker(),
    # ... 45+ more checkers
}
</pre>

<h2><i data-lucide="play"></i> Execution Flow</h2>
<ol>
    <li><strong>Document Load</strong> — <code>core.py</code> extracts text and structure</li>
    <li><strong>Checker Selection</strong> — UI sends enabled checker IDs</li>
    <li><strong>Parallel Execution</strong> — Checkers run concurrently</li>
    <li><strong>Issue Aggregation</strong> — Results merged and sorted</li>
    <li><strong>Response</strong> — JSON sent to frontend</li>
</ol>

<h2><i data-lucide="plus"></i> Adding New Checkers</h2>
<ol>
    <li>Create <code>my_checker.py</code> extending <code>BaseChecker</code></li>
    <li>Implement <code>check(document)</code> method</li>
    <li>Register in <code>CHECKERS</code> dictionary</li>
    <li>Add UI checkbox in <code>index.html</code></li>
    <li>Add tests in <code>tests.py</code></li>
</ol>
`
};

// ============================================================================
// TECHNICAL - DOCUMENT EXTRACTION
// ============================================================================
HelpDocs.content['tech-extraction'] = {
    title: 'Document Extraction',
    subtitle: 'How documents are parsed and processed',
    html: `
<h2><i data-lucide="layers"></i> Multi-Library Extraction (v3.0.91+)</h2>

<div class="help-highlight">
TechWriterReview uses <strong>multiple extraction libraries</strong> for maximum accuracy.
It automatically selects the best method based on what's available and the document type.
</div>

<h3>Extraction Pipeline</h3>
<pre class="help-code">
Document Upload
      │
      ▼
┌─────────────────┐
│ Format Detection│ ← .docx, .pdf, .pptx, .xlsx, .html
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              Extraction Chain               │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ Docling │→ │ Camelot │→ │ pdfplumber  │ │
│  │  (AI)   │  │ Tabula  │  │ python-docx │ │
│  └─────────┘  └─────────┘  └─────────────┘ │
│      95%         88%            70%        │ ← Table accuracy
└────────────────────┬────────────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ If scanned PDF  │
           │ (< 200 chars/pg)│
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │ OCR Fallback    │ ← Tesseract
           │ (pytesseract)   │
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │ NLP Enhancement │ ← spaCy, sklearn
           │ (role detection)│
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │ Unified Result  │
           └─────────────────┘
</pre>

<h2><i data-lucide="cpu"></i> Extraction Libraries</h2>

<table class="help-table">
<thead>
    <tr><th>Library</th><th>Use Case</th><th>Accuracy</th></tr>
</thead>
<tbody>
    <tr>
        <td><strong>Docling (AI)</strong></td>
        <td>Best overall - AI-powered table/layout recognition</td>
        <td>~95%</td>
    </tr>
    <tr>
        <td><strong>Camelot</strong></td>
        <td>Bordered tables (lattice mode), borderless tables (stream mode)</td>
        <td>~88%</td>
    </tr>
    <tr>
        <td><strong>Tabula</strong></td>
        <td>Alternative table extraction algorithm</td>
        <td>~80%</td>
    </tr>
    <tr>
        <td><strong>pdfplumber</strong></td>
        <td>General PDF text and basic tables</td>
        <td>~70%</td>
    </tr>
    <tr>
        <td><strong>PyMuPDF</strong></td>
        <td>Font-aware text extraction, heading detection</td>
        <td>~85%</td>
    </tr>
    <tr>
        <td><strong>Tesseract OCR</strong></td>
        <td>Scanned documents, image-based PDFs</td>
        <td>~80%</td>
    </tr>
</tbody>
</table>

<h2><i data-lucide="brain"></i> NLP Enhancement</h2>

<p>Role and entity extraction is enhanced using multiple NLP libraries:</p>

<table class="help-table">
<thead>
    <tr><th>Library</th><th>Feature</th><th>Impact</th></tr>
</thead>
<tbody>
    <tr>
        <td><strong>spaCy</strong></td>
        <td>Named Entity Recognition, POS tagging</td>
        <td>+10% role detection accuracy</td>
    </tr>
    <tr>
        <td><strong>scikit-learn</strong></td>
        <td>Text similarity, role clustering</td>
        <td>Better deduplication</td>
    </tr>
    <tr>
        <td><strong>RACI Detection</strong></td>
        <td>Pattern matching for RACI/RASCI matrices</td>
        <td>+20% confidence boost</td>
    </tr>
</tbody>
</table>

<h2><i data-lucide="sparkles"></i> Docling AI (Optional)</h2>

<div class="help-highlight">
For maximum accuracy (+7% on all metrics), install Docling:
<code>setup_docling.bat</code>
</div>

<p>Docling provides:</p>
<ul>
    <li><strong>AI-powered table recognition</strong> — TableFormer model for complex tables</li>
    <li><strong>Layout analysis</strong> — Understands columns, reading order</li>
    <li><strong>Section detection</strong> — Identifies headings without style dependencies</li>
    <li><strong>Multi-format support</strong> — PDF, DOCX, PPTX, XLSX, HTML</li>
</ul>

<h2><i data-lucide="shield"></i> Air-Gap Configuration</h2>

<p>All extraction libraries are configured for <strong>complete offline operation</strong>:</p>

<ul>
    <li><i data-lucide="wifi-off"></i> <strong>No internet required</strong> — All AI models stored locally</li>
    <li><i data-lucide="lock"></i> <strong>No data leaves your machine</strong> — Document processing is 100% local</li>
    <li><i data-lucide="database"></i> <strong>No telemetry</strong> — Analytics and tracking disabled</li>
</ul>

<h3>Environment Variables (Set Automatically)</h3>
<pre class="help-code">
# Model location
DOCLING_ARTIFACTS_PATH=C:\\TWR\\app\\TechWriterReview\\docling_models

# Force offline mode - blocks ALL network access
HF_HUB_OFFLINE=1
TRANSFORMERS_OFFLINE=1
HF_DATASETS_OFFLINE=1

# Disable telemetry
HF_HUB_DISABLE_TELEMETRY=1
DO_NOT_TRACK=1
</pre>

<h2><i data-lucide="zap"></i> Memory Optimization</h2>

<p>Docling is configured to minimize memory usage:</p>

<ul>
    <li><strong>Image processing disabled</strong> — No picture classification or description</li>
    <li><strong>CPU-only PyTorch</strong> — No GPU memory overhead</li>
    <li><strong>Efficient table mode</strong> — "accurate" mode for quality, "fast" for speed</li>
</ul>

<pre class="help-code">
# Memory-optimized configuration (set automatically)
do_picture_classifier = False    # Skip image classification
do_picture_description = False   # Skip image descriptions
generate_page_images = False     # Don't generate page images
generate_picture_images = False  # Don't extract pictures
</pre>

<h2><i data-lucide="code"></i> Using Docling in Code</h2>

<pre class="help-code">
from docling_extractor import DoclingExtractor

# Create extractor (uses env vars for offline config)
extractor = DoclingExtractor(
    table_mode='accurate',     # 'accurate' or 'fast'
    enable_ocr=False,          # Enable only if needed
    fallback_to_legacy=True    # Use pdfplumber if Docling fails
)

# Check status
print(f"Backend: {extractor.backend_name}")  # 'docling' or 'legacy'
print(f"Available: {extractor.is_available}")

# Extract document
result = extractor.extract("document.pdf")

# Access extracted data
print(f"Pages: {result.page_count}")
print(f"Words: {result.word_count}")
print(f"Tables: {len(result.tables)}")

# Get text for role extraction
for para in result.paragraphs:
    print(f"{para.location}: {para.text[:50]}...")

# Get table data
for table in result.tables:
    print(f"Table {table.table_id}: {table.row_count} rows")
    print(f"Headers: {table.headers}")
</pre>

<h2><i data-lucide="file-text"></i> Legacy Fallback</h2>

<p>When Docling is not available, TWR automatically uses legacy extractors:</p>

<table class="help-table">
<thead>
    <tr><th>Format</th><th>Legacy Library</th><th>Limitations vs Docling</th></tr>
</thead>
<tbody>
    <tr>
        <td>PDF</td>
        <td>pdfplumber, PyPDF2</td>
        <td>Less accurate table detection, no layout AI</td>
    </tr>
    <tr>
        <td>DOCX</td>
        <td>python-docx</td>
        <td>Good quality, similar to Docling</td>
    </tr>
    <tr>
        <td>PPTX</td>
        <td>python-pptx</td>
        <td>Basic text only, no table structures</td>
    </tr>
    <tr>
        <td>XLSX</td>
        <td>openpyxl</td>
        <td>Good quality, sheets as tables</td>
    </tr>
</tbody>
</table>

<h2><i data-lucide="download"></i> Installation</h2>

<h3>Option 1: Online Installation</h3>
<pre class="help-code">
# Run from TechWriterReview folder
setup_docling.bat
</pre>

<h3>Option 2: Air-Gapped Installation</h3>
<pre class="help-code">
# On internet-connected machine:
powershell -ExecutionPolicy Bypass -File bundle_for_airgap.ps1

# Transfer bundle to air-gapped machine, then:
INSTALL_AIRGAP.bat
</pre>

<h3>Disk Space Required</h3>
<ul>
    <li>PyTorch (CPU): ~800 MB</li>
    <li>Docling packages: ~700 MB</li>
    <li>AI models: ~1.2 GB</li>
    <li><strong>Total: ~2.7 GB</strong></li>
</ul>

<h2><i data-lucide="check-circle"></i> Verifying Installation</h2>

<pre class="help-code">
# Check installation status
python -c "from docling_extractor import check_docling_status; import json; print(json.dumps(check_docling_status(), indent=2))"

# Expected output for properly configured system:
{
  "installed": true,
  "version": "2.70.0",
  "pytorch_available": true,
  "models_downloaded": true,
  "offline_ready": true
}
</pre>

<h2><i data-lucide="alert-triangle"></i> Troubleshooting</h2>

<h3>Docling not detected</h3>
<ul>
    <li>Run <code>setup_docling.bat</code> to install</li>
    <li>Check Python version is 3.10+</li>
    <li>Verify <code>pip list | findstr docling</code> shows installed</li>
</ul>

<h3>Models not found (offline mode fails)</h3>
<ul>
    <li>Verify <code>DOCLING_ARTIFACTS_PATH</code> environment variable is set</li>
    <li>Check the models folder contains <code>ds4sd--docling-models</code></li>
    <li>Re-run <code>docling-tools models download -o &lt;path&gt;</code></li>
</ul>

<h3>High memory usage</h3>
<ul>
    <li>Image processing should be disabled automatically</li>
    <li>Try <code>table_mode='fast'</code> for large documents</li>
    <li>Process documents one at a time</li>
</ul>
`
};

// ============================================================================
// TECHNICAL - DOCLING AI ENGINE
// ============================================================================
HelpDocs.content['tech-docling'] = {
    title: 'Docling AI Engine',
    subtitle: 'Advanced AI-powered document extraction (100% offline)',
    html: `
<h2><i data-lucide="sparkles"></i> What is Docling?</h2>

<p>Docling is IBM's open-source document parsing library that provides AI-powered extraction capabilities. 
TechWriterReview integrates Docling to deliver superior document analysis while maintaining <strong>complete air-gapped operation</strong>.</p>

<div class="help-callout help-callout-success">
<i data-lucide="shield-check"></i>
<div>
    <strong>100% Offline Operation</strong>
    <p>When properly configured, Docling operates entirely offline. No data is sent to external servers. All AI models run locally on your machine.</p>
</div>
</div>

<h2><i data-lucide="zap"></i> Key Features</h2>

<div class="help-grid">
<div class="help-feature">
    <h4><i data-lucide="table"></i> AI Table Recognition</h4>
    <p>TableFormer AI model accurately extracts complex table structures, headers, and merged cells. Superior to rule-based extraction.</p>
</div>
<div class="help-feature">
    <h4><i data-lucide="layout"></i> Layout Understanding</h4>
    <p>AI analyzes document layout to determine reading order, identify columns, and understand visual structure.</p>
</div>
<div class="help-feature">
    <h4><i data-lucide="layers"></i> Section Detection</h4>
    <p>Automatically identifies headings, paragraphs, lists, and document hierarchy without relying on styles.</p>
</div>
<div class="help-feature">
    <h4><i data-lucide="file-stack"></i> Multi-Format</h4>
    <p>Unified extraction across PDF, DOCX, PPTX, XLSX, and HTML with consistent results.</p>
</div>
</div>

<h2><i data-lucide="shield"></i> Air-Gap Configuration</h2>

<p>Docling is configured to <strong>never contact the internet</strong> once models are installed:</p>

<table class="help-table">
<thead>
    <tr><th>Environment Variable</th><th>Value</th><th>Purpose</th></tr>
</thead>
<tbody>
    <tr>
        <td><code>DOCLING_ARTIFACTS_PATH</code></td>
        <td><em>path to models</em></td>
        <td>Location of pre-downloaded AI models</td>
    </tr>
    <tr>
        <td><code>HF_HUB_OFFLINE</code></td>
        <td><code>1</code></td>
        <td>Blocks Hugging Face network calls</td>
    </tr>
    <tr>
        <td><code>TRANSFORMERS_OFFLINE</code></td>
        <td><code>1</code></td>
        <td>Blocks Transformers network calls</td>
    </tr>
    <tr>
        <td><code>HF_DATASETS_OFFLINE</code></td>
        <td><code>1</code></td>
        <td>Blocks Datasets network calls</td>
    </tr>
    <tr>
        <td><code>HF_HUB_DISABLE_TELEMETRY</code></td>
        <td><code>1</code></td>
        <td>Disables all telemetry</td>
    </tr>
    <tr>
        <td><code>DO_NOT_TRACK</code></td>
        <td><code>1</code></td>
        <td>Disables analytics tracking</td>
    </tr>
</tbody>
</table>

<p>These variables are set automatically by the installer scripts.</p>

<h2><i data-lucide="memory-stick"></i> Memory Optimization</h2>

<p>To minimize memory usage, image processing is <strong>disabled by default</strong>:</p>

<pre class="help-code">
# Memory-saving configuration (automatic)
do_picture_classifier = False     # No image classification
do_picture_description = False    # No image descriptions
generate_page_images = False      # No page screenshots
generate_picture_images = False   # No picture extraction

# Results in ~500MB lower memory usage
</pre>

<p>This configuration is optimal for text and table extraction, which is the primary use case for TechWriterReview.</p>

<h2><i data-lucide="cpu"></i> How TWR Uses Docling</h2>

<h3>Automatic Backend Selection</h3>
<pre class="help-code">
Document Upload
      │
      ▼
┌─────────────────────┐
│ Check Docling       │
│ Available?          │
└─────────┬───────────┘
     YES  │   NO
     ┌────┴────┐
     ▼         ▼
┌─────────┐ ┌─────────┐
│ Docling │ │ Legacy  │
│   AI    │ │ Parser  │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ▼
┌─────────────────────┐
│ Role Extraction     │
│ Quality Analysis    │
│ RACI Detection      │
└─────────────────────┘
</pre>

<h3>Enhanced Role Extraction</h3>
<p>When Docling is available, role extraction is enhanced:</p>
<ul>
    <li><strong>Table Role Boost</strong>: Roles found in tables get +20% confidence</li>
    <li><strong>RACI Detection</strong>: Automatic detection of RACI matrix columns</li>
    <li><strong>Section Context</strong>: Role assignments include section awareness</li>
    <li><strong>Paragraph Typing</strong>: Text classified as heading/list/table_cell for context</li>
</ul>

<h2><i data-lucide="download"></i> Installation</h2>

<h3>Option 1: Online Setup (Internet Required Once)</h3>
<pre class="help-code">
# Run from TechWriterReview folder
setup_docling.bat

# This will:
# 1. Install PyTorch (CPU-only)
# 2. Install Docling packages
# 3. Download AI models (~1.5GB)
# 4. Configure offline environment
</pre>

<h3>Option 2: Air-Gapped Installation</h3>
<pre class="help-code">
# Step 1: On internet-connected machine
powershell -ExecutionPolicy Bypass -File bundle_for_airgap.ps1

# Step 2: Copy bundle to air-gapped machine

# Step 3: On air-gapped machine
INSTALL_AIRGAP.bat
</pre>

<h2><i data-lucide="hard-drive"></i> Disk Space Requirements</h2>

<table class="help-table">
<thead>
    <tr><th>Component</th><th>Size</th></tr>
</thead>
<tbody>
    <tr><td>PyTorch (CPU-only)</td><td>~800 MB</td></tr>
    <tr><td>Docling packages</td><td>~700 MB</td></tr>
    <tr><td>AI models (layout, TableFormer)</td><td>~1.2 GB</td></tr>
    <tr><td>OCR models (optional)</td><td>~500 MB</td></tr>
    <tr><td><strong>Total (without OCR)</strong></td><td><strong>~2.7 GB</strong></td></tr>
    <tr><td><strong>Total (with OCR)</strong></td><td><strong>~3.2 GB</strong></td></tr>
</tbody>
</table>

<h2><i data-lucide="activity"></i> Performance Comparison</h2>

<table class="help-table">
<thead>
    <tr><th>Feature</th><th>Legacy</th><th>Docling</th></tr>
</thead>
<tbody>
    <tr>
        <td>Table extraction accuracy</td>
        <td>~70%</td>
        <td>~95%</td>
    </tr>
    <tr>
        <td>Complex table handling</td>
        <td>Poor</td>
        <td>Excellent</td>
    </tr>
    <tr>
        <td>Reading order preservation</td>
        <td>No</td>
        <td>Yes</td>
    </tr>
    <tr>
        <td>Section detection</td>
        <td>Style-based only</td>
        <td>AI + Style</td>
    </tr>
    <tr>
        <td>Extraction speed</td>
        <td>Fast</td>
        <td>Moderate</td>
    </tr>
    <tr>
        <td>Memory usage</td>
        <td>Low</td>
        <td>Medium</td>
    </tr>
</tbody>
</table>

<h2><i data-lucide="check-circle"></i> Verifying Offline Status</h2>

<p>Check the About page (Help → About) to see Docling status, or use the API:</p>

<pre class="help-code">
# Check via API
curl http://localhost:5000/api/docling/status

# Expected response for offline-ready system:
{
  "available": true,
  "backend": "docling",
  "version": "2.70.0",
  "offline_mode": true,
  "offline_ready": true,
  "image_processing": false
}
</pre>

<h2><i data-lucide="alert-triangle"></i> Troubleshooting</h2>

<h3>Docling not available</h3>
<ul>
    <li>Run <code>setup_docling.bat</code> to install</li>
    <li>Verify Python 3.10+ is installed</li>
    <li>Check <code>pip list | findstr docling</code></li>
</ul>

<h3>Network errors in offline mode</h3>
<ul>
    <li>Verify <code>HF_HUB_OFFLINE=1</code> is set</li>
    <li>Verify <code>DOCLING_ARTIFACTS_PATH</code> points to valid models</li>
    <li>Restart the application after setting environment variables</li>
</ul>

<h3>Memory issues</h3>
<ul>
    <li>Image processing should be disabled automatically</li>
    <li>Use <code>table_mode='fast'</code> for large documents</li>
    <li>Process documents one at a time</li>
    <li>Close other applications if needed</li>
</ul>
`
};

// ============================================================================
// TECHNICAL - ROLE EXTRACTION
// ============================================================================
HelpDocs.content['tech-roles'] = {
    title: 'Role Extraction',
    subtitle: 'AI-powered organizational role detection (94.7% precision)',
    html: `
<h2><i data-lucide="users"></i> Overview</h2>

<p>TechWriterReview's role extraction engine (<code>role_extractor_v3.py</code>) automatically identifies organizational roles, 
responsibilities, and relationships from technical documents. It achieves <strong>94.7% precision</strong> and 
<strong>92.3% F1 score</strong> across diverse document types.</p>

<div class="help-callout help-callout-success">
    <i data-lucide="target"></i>
    <div>
        <strong>Validation Results (v3.0.91d)</strong>
        <p>Validated on government SOWs, defense SEPs, systems engineering management plans, and industry standards. Average precision: 94.7%, recall: 90.0%, F1: 92.3%.</p>
    </div>
</div>

<h2><i data-lucide="layers"></i> Extraction Pipeline</h2>

<pre class="help-code">
Document Text
      │
      ▼
┌─────────────────────┐
│  Pre-processing     │ ← Normalize text, split paragraphs
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Pattern Matching   │ ← 20+ regex patterns for role indicators
│  - Job title suffixes (Manager, Engineer, Director)
│  - Organizational patterns (team, group, office)
│  - Acronym expansion (PM → Project Manager)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Known Roles Scan   │ ← 158 pre-defined roles with aliases
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  False Positive     │ ← 167 exclusions (facilities, processes)
│  Filtering          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Table Boosting     │ ← +20% confidence for RACI/responsibility tables
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Canonical Name     │ ← Consolidate variations (PM → Project Manager)
│  Resolution         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Confidence Scoring │ ← 0.0 to 1.0 based on context
└─────────────────────┘
</pre>

<h2><i data-lucide="shield"></i> False Positive Prevention</h2>

<p>The extractor uses multiple layers to prevent false positives:</p>

<h3>1. Explicit FALSE_POSITIVES Set (167 entries)</h3>
<p>Terms that look like roles but aren't:</p>
<pre class="help-code">
FALSE_POSITIVES = {
    # Facilities
    'panel test facility', 'flight facility', 'operations center',
    
    # Processes/Events  
    'test readiness review', 'design review', 'preliminary design',
    
    # Generic terms
    'mission assurance', 'verification engineer', 'chief innovation',
    
    # Abstract concepts
    'progress', 'upcoming', 'distinct', 'coordinating'
}
</pre>

<h3>2. Single-Word Exclusions</h3>
<pre class="help-code">
SINGLE_WORD_EXCLUSIONS = {
    'progress', 'work', 'test', 'task', 'plan', 'phase',
    'technical', 'functional', 'operational',
    'coordinating', 'managing', 'performing'
}
</pre>

<h3>3. Noise Pattern Rejection</h3>
<pre class="help-code">
# Rejected starters
noise_starters = ['the', 'a', 'contract', 'provide', 'responsible']

# Rejected connectors in positions 2-4
connector_words = ['is', 'are', 'shall', 'will', 'for']

# Rejected endings
noise_endings = ['begins', 'ends', 'various', 'overall']
</pre>

<h3>4. Validation Order (Critical)</h3>
<pre class="help-code">
def _is_valid_role(candidate):
    # 1. Check false_positives FIRST (before known_roles!)
    if candidate_lower in self.false_positives:
        return False, 0.0
    
    # 2. Then check known_roles
    if candidate_lower in self.known_roles:
        return True, 0.95
    
    # 3. Finally check suffixes (should NOT override false_positives)
    for suffix in strong_role_suffixes:
        if candidate_lower.endswith(suffix):
            return True, 0.90
</pre>

<h2><i data-lucide="database"></i> Known Roles Database</h2>

<p>The extractor includes 158 pre-defined roles across domains:</p>

<table class="help-table">
<thead>
    <tr><th>Domain</th><th>Example Roles</th></tr>
</thead>
<tbody>
    <tr>
        <td><strong>Government/Contract</strong></td>
        <td>Contracting Officer (CO), COR, Program Manager, COTR</td>
    </tr>
    <tr>
        <td><strong>Systems Engineering</strong></td>
        <td>Systems Engineer, Chief Engineer, Lead Systems Engineer</td>
    </tr>
    <tr>
        <td><strong>Project Management</strong></td>
        <td>Project Manager, IPT Lead, Technical Lead</td>
    </tr>
    <tr>
        <td><strong>Agile/Scrum</strong></td>
        <td>Scrum Master, Product Owner, Agile Team</td>
    </tr>
    <tr>
        <td><strong>Executive</strong></td>
        <td>CEO, CTO, CIO, CISO, CINO</td>
    </tr>
    <tr>
        <td><strong>Healthcare/Clinical</strong></td>
        <td>Medical Monitor, CRA, IRB, Principal Investigator</td>
    </tr>
    <tr>
        <td><strong>IT/Security</strong></td>
        <td>Security Officer, Cybersecurity Analyst, DBA</td>
    </tr>
</tbody>
</table>

<h2><i data-lucide="link"></i> Acronym Expansion</h2>

<pre class="help-code">
ROLE_ACRONYMS = {
    'pm': 'project manager',
    'se': 'systems engineer',
    'co': 'contracting officer',
    'cor': 'contracting officer representative',
    'ipt': 'integrated product team',
    'ciso': 'chief information security officer',
    'cra': 'clinical research associate',
    # ... 22 total mappings
}
</pre>

<h2><i data-lucide="table"></i> RACI Matrix Detection</h2>

<p>When tables are detected (via Docling or Camelot), the extractor applies confidence boosting:</p>

<ul>
    <li><strong>+20% confidence</strong> for roles found in RACI/RASCI tables</li>
    <li><strong>Automatic responsibility extraction</strong> from R/A/C/I columns</li>
    <li><strong>Cross-reference validation</strong> with document text</li>
</ul>

<h2><i data-lucide="code"></i> Usage in Code</h2>

<pre class="help-code">
from role_extractor_v3 import RoleExtractorV3

# Create extractor
extractor = RoleExtractorV3()

# Extract from text
result = extractor.extract_roles(document_text)

# Access results
for role in result['roles']:
    print(f"{role['name']} (confidence: {role['confidence']:.2f})")
    print(f"  Found in: {role['context']}")
    print(f"  Responsibilities: {role['responsibilities']}")

# Get statistics
print(f"Total roles: {result['stats']['total']}")
print(f"High confidence: {result['stats']['high_confidence']}")
</pre>

<h2><i data-lucide="settings"></i> Configuration Options</h2>

<table class="help-table">
<thead>
    <tr><th>Option</th><th>Default</th><th>Description</th></tr>
</thead>
<tbody>
    <tr>
        <td><code>min_confidence</code></td>
        <td>0.6</td>
        <td>Minimum confidence threshold for inclusion</td>
    </tr>
    <tr>
        <td><code>enable_table_boost</code></td>
        <td>True</td>
        <td>Apply confidence boost for table-found roles</td>
    </tr>
    <tr>
        <td><code>expand_acronyms</code></td>
        <td>True</td>
        <td>Expand recognized acronyms to full names</td>
    </tr>
    <tr>
        <td><code>use_nlp_enhancement</code></td>
        <td>True</td>
        <td>Use spaCy NER if available</td>
    </tr>
</tbody>
</table>

<h2><i data-lucide="activity"></i> Performance Metrics</h2>

<table class="help-table">
<thead>
    <tr><th>Document Type</th><th>Precision</th><th>Recall</th><th>F1 Score</th></tr>
</thead>
<tbody>
    <tr>
        <td>Government SOW</td>
        <td>100%</td>
        <td>85.7%</td>
        <td>92.3%</td>
    </tr>
    <tr>
        <td>DoD SEP (Defense)</td>
        <td>100%</td>
        <td>87.5%</td>
        <td>93.3%</td>
    </tr>
    <tr>
        <td>Smart Columbus SEMP (Agile)</td>
        <td>100%</td>
        <td>100%</td>
        <td>100%</td>
    </tr>
    <tr>
        <td>INCOSE/APM Guide (Industry)</td>
        <td>84.6%</td>
        <td>84.6%</td>
        <td>84.6%</td>
    </tr>
    <tr>
        <td><strong>Overall Average</strong></td>
        <td><strong>94.7%</strong></td>
        <td><strong>90.0%</strong></td>
        <td><strong>92.3%</strong></td>
    </tr>
</tbody>
</table>
`
};

// ============================================================================
// TECHNICAL - NLP PIPELINE
// ============================================================================
HelpDocs.content['tech-nlp'] = {
    title: 'NLP Pipeline',
    subtitle: 'Natural language processing techniques used',
    html: `
<h2><i data-lucide="brain"></i> Processing Stages</h2>

<pre class="help-code">
Raw Text
    │
    ▼
┌─────────────────┐
│  Tokenization   │ ← Split into words/sentences
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POS Tagging    │ ← Identify parts of speech
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pattern Match  │ ← Apply checker rules
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Issue Extraction│ ← Generate findings
└─────────────────┘
</pre>

<h2><i data-lucide="search"></i> Techniques Used</h2>

<h3>Passive Voice Detection</h3>
<p>Pattern matching for auxiliary verb + past participle:</p>
<pre class="help-code">
# Pattern: be/being/been + past participle
passive_pattern = r"\\b(is|are|was|were|be|been|being)\\s+\\w+ed\\b"
</pre>

<h3>Acronym Detection</h3>
<pre class="help-code">
# Pattern: 2-6 uppercase letters
acronym_pattern = r"\\b[A-Z]{2,6}\\b"

# Definition pattern: "Term (ACRONYM)" or "ACRONYM (Term)"
definition_pattern = r"([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s*\\(([A-Z]{2,6})\\)"
</pre>

<h3>Requirements Language</h3>
<pre class="help-code">
requirement_words = {
    'binding': ['shall', 'must', 'is required to'],
    'intent': ['will', 'should'],
    'optional': ['may', 'can', 'might']
}
</pre>

<h2><i data-lucide="gauge"></i> Performance Considerations</h2>
<ul>
    <li><strong>Regex compilation</strong> — Patterns compiled once, reused</li>
    <li><strong>Paragraph-level processing</strong> — Avoids full-document passes</li>
    <li><strong>Early termination</strong> — Stop after finding issue</li>
    <li><strong>Caching</strong> — Results cached during session</li>
</ul>
`
};

// ============================================================================
// TECHNICAL - API REFERENCE
// ============================================================================
HelpDocs.content['tech-api'] = {
    title: 'API Reference',
    subtitle: 'REST API endpoints for programmatic access',
    html: `
<h2><i data-lucide="code"></i> API Overview</h2>
<p>TechWriterReview exposes a REST API on <code>http://127.0.0.1:5050/api/</code> (default port).</p>

<div class="help-callout help-callout-info">
    <i data-lucide="shield"></i>
    <div>
        <strong>CSRF Protection</strong>
        <p>State-changing endpoints (POST, PUT, DELETE) require a CSRF token. Tokens are automatically included when using the web interface.</p>
    </div>
</div>

<h2><i data-lucide="upload"></i> Document Analysis</h2>

<h3>POST /api/upload</h3>
<p>Upload document for analysis.</p>
<pre class="help-code">
curl -X POST -F "file=@document.docx" http://127.0.0.1:5050/api/upload

# Response:
{
  "success": true,
  "document_id": "abc123",
  "filename": "document.docx",
  "word_count": 5420,
  "page_count": 15
}
</pre>

<h3>POST /api/review</h3>
<p>Run analysis with specified checkers.</p>
<pre class="help-code">
{
  "document_id": "abc123",
  "checkers": ["acronyms", "grammar", "spelling", "passive_voice"]
}

# Response includes issues array with severity, message, location
</pre>

<h3>GET /api/results/{document_id}</h3>
<p>Retrieve analysis results.</p>

<h2><i data-lucide="users"></i> Roles & Responsibilities</h2>

<h3>GET /api/roles/aggregated</h3>
<p>Get all roles aggregated across documents.</p>
<pre class="help-code">
# Response:
{
  "success": true,
  "data": {
    "roles": [...],
    "total_roles": 45,
    "unique_documents": 8
  }
}
</pre>

<h3>GET /api/roles/extract</h3>
<p>Extract roles from current document.</p>

<h3>GET /api/roles/raci</h3>
<p>Get RACI matrix data.</p>

<h3>GET /api/roles/graph</h3>
<p>Get relationship graph data for visualization.</p>

<h3>GET /api/roles/dictionary</h3>
<p>Get/update the role dictionary.</p>

<h2><i data-lucide="download"></i> Export</h2>

<h3>POST /api/export/word</h3>
<p>Generate Word document with tracked changes.</p>

<h3>POST /api/export/csv</h3>
<p>Export issues as CSV.</p>

<h3>POST /api/export/json</h3>
<p>Export structured JSON data.</p>

<h2><i data-lucide="hammer"></i> Statement Forge</h2>

<h3>POST /api/statement-forge/extract</h3>
<p>Extract actionable statements from document.</p>

<h3>POST /api/statement-forge/export</h3>
<p>Export statements in various formats (CSV, JSON, Excel).</p>

<h2><i data-lucide="settings"></i> Configuration</h2>

<h3>GET /api/config</h3>
<p>Get current configuration.</p>

<h3>POST /api/config</h3>
<p>Update configuration.</p>

<h2><i data-lucide="activity"></i> Health & Updates</h2>

<h3>GET /api/updates/status</h3>
<p>Get update system status including pending updates and backups.</p>

<h3>GET /api/updates/check</h3>
<p>Check for available updates in the updates/ folder.</p>

<h3>POST /api/updates/apply</h3>
<p>Apply pending updates (creates backup first).</p>
<pre class="help-code">
{
  "create_backup": true
}
</pre>

<h3>GET /api/updates/backups</h3>
<p>List available backups.</p>

<h3>POST /api/updates/rollback</h3>
<p>Rollback to a previous backup.</p>
<pre class="help-code">
{
  "backup_name": "backup_20260127_143022"
}
</pre>

<h3>POST /api/updates/restart</h3>
<p>Restart the server after updates.</p>

<h3>GET /api/updates/health</h3>
<p>Server health check (used for restart polling).</p>

<h2><i data-lucide="sparkles"></i> Docling Status</h2>

<h3>GET /api/docling/status</h3>
<p>Check Docling AI extraction status.</p>
<pre class="help-code">
# Response:
{
  "available": true,
  "backend": "docling",
  "version": "2.70.0",
  "offline_mode": true,
  "offline_ready": true,
  "image_processing": false
}
</pre>

<h2><i data-lucide="activity"></i> Extraction Capabilities</h2>

<h3>GET /api/extraction/capabilities</h3>
<p>Get available extraction methods and accuracy estimates.</p>
`
};

// ============================================================================
// TROUBLESHOOTING - COMMON ISSUES
// ============================================================================
HelpDocs.content['trouble-common'] = {
    title: 'Common Issues',
    subtitle: 'Solutions to frequently encountered problems',
    html: `
<h2><i data-lucide="alert-circle"></i> Installation Issues</h2>

<h3>Installer doesn't run</h3>
<ul>
    <li>Right-click INSTALL.ps1 → "Run with PowerShell"</li>
    <li>If blocked: <code>Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code></li>
</ul>

<h3>"Python not found"</h3>
<ul>
    <li>Install Python 3.8+ from python.org</li>
    <li>Ensure "Add Python to PATH" was checked</li>
    <li>Restart PowerShell after installation</li>
</ul>

<h3>Pip install hangs</h3>
<ul>
    <li>Normal on air-gapped networks—progress bar should show activity</li>
    <li>v3.0.51+ skips pip upgrade to avoid hangs</li>
</ul>

<h2><i data-lucide="alert-circle"></i> Runtime Issues</h2>

<h3>Server won't start</h3>
<ul>
    <li>Check if port 5050 is in use: <code>netstat -an | findstr 5050</code></li>
    <li>Check logs in <code>logs/</code> folder</li>
    <li>Delete <code>.venv</code> and reinstall</li>
</ul>

<h3>Browser shows blank page</h3>
<ul>
    <li>Clear browser cache (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>)</li>
    <li>Try different browser</li>
    <li>Check JavaScript console for errors</li>
</ul>

<h3>Document fails to load</h3>
<ul>
    <li>Close document in Word first</li>
    <li>Remove password protection</li>
    <li>Try saving as .docx (not .doc)</li>
    <li>Check file size (max 50 MB)</li>
</ul>

<h2><i data-lucide="alert-circle"></i> Update Issues</h2>

<h3>Updates don't apply</h3>
<ul>
    <li>Verify v3.0.51+ (check Settings → About)</li>
    <li>Ensure using <code>Run_TWR.bat</code> from v3.0.51</li>
    <li>Check update files are in <code>updates/</code> folder</li>
</ul>

<h3>Server doesn't restart</h3>
<ul>
    <li>The Run_TWR.bat must contain restart loop (v3.0.51+)</li>
    <li>Manual restart: Stop_TWR.bat then Run_TWR.bat</li>
</ul>
`
};

// ============================================================================
// TROUBLESHOOTING - ERROR MESSAGES
// ============================================================================
HelpDocs.content['trouble-errors'] = {
    title: 'Error Messages',
    subtitle: 'Understanding and resolving error messages',
    html: `
<h2><i data-lucide="alert-triangle"></i> Common Errors</h2>

<div class="help-error-list">
    <div class="help-error-item">
        <h3>❌ "Failed to connect to server"</h3>
        <p><strong>Cause:</strong> Server not running or wrong port.</p>
        <p><strong>Solution:</strong> Run <code>Run_TWR.bat</code>. Check firewall settings.</p>
    </div>
    
    <div class="help-error-item">
        <h3>❌ "Document extraction failed"</h3>
        <p><strong>Cause:</strong> Corrupted file or unsupported format.</p>
        <p><strong>Solution:</strong> Open in Word, save as new .docx file.</p>
    </div>
    
    <div class="help-error-item">
        <h3>❌ "Checker timeout"</h3>
        <p><strong>Cause:</strong> Very large document or complex content.</p>
        <p><strong>Solution:</strong> Split document or disable some checkers.</p>
    </div>
    
    <div class="help-error-item">
        <h3>❌ "Export failed: File in use"</h3>
        <p><strong>Cause:</strong> Previous export still open in Word.</p>
        <p><strong>Solution:</strong> Close the file in Word and retry.</p>
    </div>
    
    <div class="help-error-item">
        <h3>❌ "PDF extraction limited"</h3>
        <p><strong>Cause:</strong> Scanned PDF without selectable text.</p>
        <p><strong>Solution:</strong> Use OCR software first, or use .docx format.</p>
    </div>
</div>
`
};

// ============================================================================
// TROUBLESHOOTING - PERFORMANCE
// ============================================================================
HelpDocs.content['trouble-performance'] = {
    title: 'Performance',
    subtitle: 'Optimizing TechWriterReview for large documents',
    html: `
<h2><i data-lucide="gauge"></i> Performance Tips</h2>

<h3>Large Documents (100+ pages)</h3>
<ul>
    <li>Disable checkers you don't need</li>
    <li>Use presets instead of "All"</li>
    <li>Consider splitting into smaller documents</li>
</ul>

<h3>Many Issues (500+)</h3>
<ul>
    <li>Enable family grouping (Settings → General)</li>
    <li>Use Triage Mode for systematic review</li>
    <li>Filter by severity to focus on critical items</li>
</ul>

<h3>Slow Startup</h3>
<ul>
    <li>First run after install may be slow (Python compiles)</li>
    <li>Subsequent runs should be faster</li>
    <li>Check for antivirus scanning the .venv folder</li>
</ul>

<h2><i data-lucide="bar-chart"></i> Benchmarks</h2>
<table class="help-table">
    <thead><tr><th>Document Size</th><th>All Checkers</th><th>Minimal Preset</th></tr></thead>
    <tbody>
        <tr><td>10 pages</td><td>5-10 sec</td><td>2-5 sec</td></tr>
        <tr><td>50 pages</td><td>15-30 sec</td><td>5-15 sec</td></tr>
        <tr><td>100 pages</td><td>30-60 sec</td><td>10-30 sec</td></tr>
        <tr><td>200+ pages</td><td>60-120 sec</td><td>30-60 sec</td></tr>
    </tbody>
</table>
`
};

// ============================================================================
// VERSION HISTORY
// ============================================================================
HelpDocs.content['version-history'] = {
    title: 'Version History',
    subtitle: 'Release notes and changelog',
    html: `
<div class="help-changelog">
    <div class="changelog-version changelog-current">
        <h3>v3.0.122 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>Persistent Link Exclusions & Scan History</strong></p>
        <ul>
            <li><strong>FEATURE: Persistent Link Exclusions</strong> - URL exclusion rules now stored in SQLite database (survive sessions)</li>
            <li><strong>FEATURE: Scan History Storage</strong> - Historical hyperlink scans recorded with summary statistics</li>
            <li><strong>NEW: Link History Modal</strong> - New "Links" button in top navigation opens modal with two tabs:</li>
            <li style="margin-left: 20px;"><em>Exclusions Tab</em> - Add, edit, enable/disable, and delete URL exclusion patterns</li>
            <li style="margin-left: 20px;"><em>Scans Tab</em> - View historical scans, see details, clear old records</li>
            <li><strong>NEW: API Endpoints</strong> - /api/hyperlink-validator/exclusions/* and /history/* for CRUD operations</li>
            <li><strong>NEW: Match Types</strong> - Supports contains, exact, prefix, suffix, and regex pattern matching</li>
            <li><strong>IMPROVED: State Management</strong> - HyperlinkValidatorState loads exclusions from database on init</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.121 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>Portfolio Fix & Hyperlink Enhancements</strong></p>
        <ul>
            <li><strong>FIX: Portfolio "Open in Review"</strong> - Button now correctly loads documents with stats bar, analytics, and issues table displaying properly</li>
            <li><strong>IMPROVED: Responsive Hyperlinks Panel</strong> - Changed from fixed heights (300px/150px) to viewport-relative (50vh/25vh)</li>
            <li><strong>IMPROVED: Clickable Hyperlinks</strong> - Users can now click any hyperlink row to open URL in new tab for manual verification</li>
            <li><strong>NEW: Visual Hover Feedback</strong> - External-link icon appears on hover for hyperlink rows</li>
            <li><strong>NEW: Test Document</strong> - hyperlink_test.docx with working and broken link examples</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.120 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>3D Carousel for Issues by Section</strong></p>
        <ul>
            <li><strong>FEATURE: 3D Carousel</strong> - New rotating carousel view for "Issues by Section" in Document Analytics</li>
            <li><strong>NEW: Drag-to-Spin</strong> - Continuous rotation while dragging, plus slider navigation</li>
            <li><strong>NEW: Click-to-Filter</strong> - Click on a carousel box to filter issues to that section</li>
            <li><strong>NEW: Density Coloring</strong> - Color-coded borders based on issue density (none/low/medium/high)</li>
            <li><strong>IMPROVED: Touch Support</strong> - Touch gestures work on mobile devices</li>
            <li><strong>IMPROVED: Dark Mode</strong> - Full compatibility with dark mode theme</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.119 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>Document Filter Fix & Help Documentation Overhaul</strong></p>
        <ul>
            <li><strong>FIX: Document Filter Dropdown</strong> - Now correctly filters roles by document in Roles Studio</li>
            <li><strong>FIX: CSS Selector Bug</strong> - Fixed roles tab switching (.roles-nav-btn.active → .roles-nav-item.active)</li>
            <li><strong>IMPROVED: Help Modal Sizing</strong> - Now 85vw × 80vh (3/4 screen) with opaque backdrop</li>
            <li><strong>DOCS: Comprehensive Help Overhaul</strong> - Major documentation updates including:</li>
            <li style="margin-left: 20px;"><em>Fix Assistant v2</em> - New complete section with overview, features, shortcuts, workflow</li>
            <li style="margin-left: 20px;"><em>Hyperlink Health</em> - New section with validation results, status codes</li>
            <li style="margin-left: 20px;"><em>Batch Processing</em> - New section with queue management, results view</li>
            <li style="margin-left: 20px;"><em>Quality Checkers</em> - Expanded with complete checker list table (13 modules)</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.116 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>Memory & Stability Fixes - All Medium-Priority Bugs Resolved</strong></p>
        <ul>
            <li><strong>FIX: Batch Memory (BUG-M02)</strong> - Files now stream to disk in 8KB chunks instead of loading entirely into memory</li>
            <li><strong>FIX: SessionManager Growth (BUG-M03)</strong> - Added automatic cleanup thread that runs hourly to remove sessions older than 24 hours</li>
            <li><strong>FIX: Batch Error Context (BUG-M04)</strong> - Full tracebacks now logged for batch processing errors (debug mode shows in response)</li>
            <li><strong>FIX: localStorage Key Collision (BUG-M05)</strong> - Fix Assistant progress now uses unique document IDs via hash of filename + size + timestamp</li>
            <li><strong>NEW: Batch Limits</strong> - MAX_BATCH_SIZE (10 files) and MAX_BATCH_TOTAL_SIZE (100MB) constants now enforced</li>
            <li><strong>NEW: SessionManager.start_auto_cleanup()</strong> - Configurable interval and max age for automatic session cleanup</li>
            <li><strong>NEW: FixAssistantState.generateDocumentId()</strong> - Creates collision-free storage keys for progress persistence</li>
        </ul>
        <div class="changelog-note">
            <strong>Note:</strong> This release resolves all 4 remaining medium-priority bugs from the bug tracker.
            The application now has zero critical or medium-severity open issues.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.115 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>Document Type Profiles - Custom Checker Configuration</strong></p>
        <ul>
            <li><strong>FEATURE: Document Type Profiles</strong> - Customize which checks are performed for PrOP, PAL, FGOST, SOW, and other document types</li>
            <li><strong>NEW: Settings &gt; Document Profiles tab</strong> - Visual grid to enable/disable individual checkers per document type</li>
            <li><strong>NEW: Custom profiles persist</strong> - Saved in localStorage, user-specific across sessions</li>
            <li><strong>NEW: Profile management buttons</strong> - Select All, Clear All, Reset to Default</li>
            <li><strong>NEW: First-time user prompt</strong> - Option to configure document profiles on initial app launch</li>
            <li><strong>ENH: applyPreset uses custom profiles</strong> - When available, document type presets use your custom checker configuration</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.110 <span class="changelog-date">February 1, 2026</span></h3>
        <p><strong>Hyperlink Validator Export - Highlighted Documents</strong></p>
        <ul>
            <li><strong>FEATURE: Export Highlighted DOCX</strong> - Broken links marked in red/yellow with strikethrough</li>
            <li><strong>FEATURE: Export Highlighted Excel</strong> - Broken link rows highlighted with red background</li>
            <li><strong>NEW: API endpoints</strong> - /api/hyperlink-validator/export-highlighted/docx and /excel</li>
            <li><strong>NEW: Export button</strong> - "Export Highlighted" button in Hyperlink Validator modal (enabled after validation)</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.109 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Bug Squash Complete - All 15 Issues Resolved</strong></p>
        <ul>
            <li><strong>FIX: Batch Modal (Issue #1)</strong> - Modal now opens correctly (removed inline style override)</li>
            <li><strong>FIX: Hyperlink Extraction (Issue #2)</strong> - Now extracts HYPERLINK field codes from DOCX files</li>
            <li><strong>FIX: Acronym Highlighting (Issue #3)</strong> - Uses word boundary regex to prevent false positives (e.g., "NDA" in "standards")</li>
            <li><strong>FIX: Fix Assistant Premium (Issue #4)</strong> - Complete implementation with close button, navigation, keyboard shortcuts, and progress tracking</li>
            <li><strong>FIX: Statement Forge (Issue #5)</strong> - "No document loaded" error fixed with consistent state checks</li>
            <li><strong>FIX: Scan History Endpoints (Issue #6)</strong> - Added /api/scan-history/stats, /clear, and /recall endpoints</li>
            <li><strong>FIX: Triage Mode (Issue #7)</strong> - State.documentId now set after fresh review</li>
            <li><strong>FIX: Document Filter (Issue #8)</strong> - Now populates from scan history</li>
            <li><strong>FIX: Role-Document Matrix (Issue #9)</strong> - Improved response validation with retry button</li>
            <li><strong>FIX: Export Modal Badges (Issue #10)</strong> - Badges now wrap and truncate properly</li>
            <li><strong>FIX: Comment Placement (Issue #11)</strong> - Smart quote normalization and multi-strategy text matching</li>
            <li><strong>FIX: Version History (Issue #12)</strong> - Added missing version entries</li>
            <li><strong>FIX: Updater Rollback (Issue #13)</strong> - Uses correct endpoint, button state fixed</li>
            <li><strong>FIX: "No Updates" Styling (Issue #14)</strong> - Proper empty state with centered icon</li>
            <li><strong>FIX: Logo 404 (Issue #15)</strong> - Fixed missing logo reference</li>
        </ul>
        <div class="changelog-note">
            <strong>Note:</strong> This release resolves all issues from the v3.0.108 bug tracker.
            Comprehensive fixes across UI, backend APIs, and document processing.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.108 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Document Filter Fix</strong></p>
        <ul>
            <li><strong>FIX: Document filter dropdown</strong> - Now populates with scanned document names (BUG-009)</li>
            <li><strong>FIX: source_documents field</strong> - Added source_documents field to role extraction data</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.107 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Role Studio Fixes</strong></p>
        <ul>
            <li><strong>FIX: Role Details tab</strong> - Now shows sample_contexts from documents (BUG-007)</li>
            <li><strong>FIX: Role-Doc Matrix</strong> - Shows helpful guidance when empty instead of stuck loading (BUG-008)</li>
            <li><strong>UX: Matrix tab guidance</strong> - Explains how to populate cross-document data</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.106 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Fix Assistant Document Viewer Fix</strong></p>
        <ul>
            <li><strong>FIX: Document Viewer empty</strong> - paragraphs/page_map/headings now returned from core.py (BUG-006)</li>
            <li><strong>FIX: Deprecated datetime.utcnow()</strong> - Remaining deprecated calls fixed in config_logging.py (BUG-M01)</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.105 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>API & Mode Handling Fixes</strong></p>
        <ul>
            <li><strong>FIX: Report generator API signature</strong> - generate() now returns bytes when output_path not provided (BUG-001)</li>
            <li><strong>FIX: Learner stats endpoint</strong> - Now uses standard {success, data} response envelope (BUG-002)</li>
            <li><strong>FIX: Acronym checker mode handling</strong> - Strict mode now properly flags common acronyms (BUG-003)</li>
            <li><strong>FIX: Role classification tiebreak</strong> - 'Report Engineer' now correctly classified as role (BUG-004)</li>
            <li><strong>FIX: Comment pack location hints</strong> - Now includes location hints from hyperlink_info (BUG-005)</li>
            <li><strong>MAINT: Updated deprecated datetime.utcnow()</strong> - Changed to datetime.now(timezone.utc) (WARN-001)</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.104 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Fix Assistant v2 Load Fix</strong></p>
        <ul>
            <li><strong>FIX: Fix Assistant v2 load failure</strong> - BodyText style conflict resolved</li>
            <li><strong>FIX: Logger reserved keyword conflict</strong> - Fixed conflict in static file security</li>
            <li><strong>TEST: Updated test expectations</strong> - Fixed static file security response tests</li>
            <li><strong>TEST: Fixed CSS test locations</strong> - Updated for modularized stylesheets</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.103 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Parallel Refactoring Release - Code Quality & Security</strong></p>
        <ul>
            <li><strong>SECURITY: innerHTML Safety Audit (Task A)</strong> - All 143 innerHTML usages audited, documented with // SAFE comments, and verified for proper escaping</li>
            <li><strong>REFACTOR: CSS Modularization (Task B)</strong> - Split 13,842-line style.css into 10 logical modules for better maintainability</li>
            <li><strong>QUALITY: Test Suite Modernization (Task C)</strong> - Added docstrings to all 117 test methods, 3 new test classes for FAV2 API coverage</li>
            <li><strong>QUALITY: Exception Handling (Task D)</strong> - Refined exception handling with specific catches, consistent api_error_response usage</li>
        </ul>
        <div class="changelog-note">
            <strong>Note:</strong> This release was produced using parallel development - 4 simultaneous refactoring streams 
            merged into a single release. Zero merge conflicts due to clear file ownership boundaries.
            CSS now loads as modular files for improved caching and maintenance.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.102 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Stabilization Release</strong></p>
        <ul>
            <li><strong>STABILIZATION:</strong> Intermediate release between 3.0.101 and 3.0.103</li>
            <li><strong>FIX:</strong> Minor adjustments to error handling patterns</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.101 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Code Review Completion Release</strong></p>
        <ul>
            <li><strong>REFACTOR: Standardized API Error Responses (ISSUE-004)</strong> - All API errors now return consistent format with error codes and correlation IDs</li>
            <li><strong>REFACTOR: Centralized Document Detection (ISSUE-008)</strong> - Created get_document_extractor() helper to eliminate code duplication</li>
            <li><strong>REFACTOR: Centralized Strings (ISSUE-009)</strong> - User-facing messages now in STRINGS constant for consistency and future i18n</li>
            <li><strong>DOCS: JSDoc Documentation (ISSUE-010)</strong> - Added comprehensive JSDoc comments to DocumentViewer and MiniMap modules</li>
        </ul>
        <div class="changelog-note">
            <strong>Note:</strong> This release completes all 12 issues from the comprehensive code review audit.
            Combined with v3.0.100, all high, medium, and low priority items have been addressed.
            The application maintains full backward compatibility.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.100 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Code Review Hardening Release</strong></p>
        <ul>
            <li><strong>SECURITY: ReDoS Protection (ISSUE-001)</strong> - Added safe regex wrappers with input length limiting to prevent CPU exhaustion attacks</li>
            <li><strong>PERFORMANCE: Database Optimization (ISSUE-002)</strong> - Enabled WAL mode for better concurrent read/write performance</li>
            <li><strong>PERFORMANCE: Large File Protection (ISSUE-003)</strong> - Added file size validation (100MB limit) with helpful error messages</li>
            <li><strong>SECURITY: Input Validation (ISSUE-005)</strong> - Enhanced validation on learner dictionary API (length limits, character restrictions)</li>
            <li><strong>FIX: State Pollution (ISSUE-006)</strong> - State.entities now properly reset when loading new documents</li>
            <li><strong>FIX: Memory Leak Prevention (ISSUE-007)</strong> - Added cleanup() function to FixAssistantState to clear event listeners</li>
        </ul>
        <div class="changelog-note">
            <strong>Note:</strong> This release implements fixes from a comprehensive code review audit. 
            7 of 12 identified issues were addressed (2 high priority, 4 medium, 1 low). 
            No critical issues were found during the review. The application is production-ready.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.98 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Bug Fixes and Role Studio Enhancements</strong></p>
        <ul>
            <li><strong>FIX: Export modal crash (BUG-002)</strong> - Fixed crash when opening export modal in certain scenarios</li>
            <li><strong>FIX: Context highlighting (BUG-003)</strong> - Fixed context showing wrong text in Fix Assistant</li>
            <li><strong>FIX: Hyperlink status panel (BUG-004)</strong> - Restored hyperlink validation results display</li>
            <li><strong>FIX: Role-Document matrix (BUG-009)</strong> - Restored Role-Document Matrix tab in Role Studio</li>
            <li><strong>FIX: Double browser tab (BUG-001)</strong> - Fixed duplicate browser tabs on startup</li>
            <li><strong>NEW: Role Details context preview (BUG-007)</strong> - Shows where roles appear in documents with highlighted context</li>
            <li><strong>NEW: Document filter dropdown (BUG-008)</strong> - Filter Role Studio by source document</li>
            <li><strong>NEW: Role name highlighting</strong> - Role names highlighted within context text for easy identification</li>
            <li><strong>IMPROVED: Version history completeness (BUG-005)</strong> - Added missing version entries</li>
            <li><strong>IMPROVED: Lessons learned documentation (BUG-006)</strong> - Comprehensive updates to TWR_LESSONS_LEARNED.md</li>
        </ul>
        <div class="changelog-note">
            <strong>Note:</strong> This release focuses on stability fixes and Role Studio improvements 
            from parallel development integration. Role Studio now includes document filtering and 
            rich context previews for each extracted role.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.97 <span class="changelog-date">January 28, 2026</span></h3>
        <p><strong>Fix Assistant v2 - Premium Document Review Interface</strong></p>
        <ul>
            <li><strong>NEW: Two-panel document viewer</strong> - Left panel shows document with page navigation and text highlighting</li>
            <li><strong>NEW: Mini-map overview</strong> - Visual document overview showing fix positions by confidence tier</li>
            <li><strong>NEW: Full undo/redo</strong> - Unlimited undo/redo for all review decisions</li>
            <li><strong>NEW: Search and filter</strong> - Filter fixes by text, category, severity, or confidence</li>
            <li><strong>NEW: Progress persistence</strong> - Auto-saves progress; continue where you left off</li>
            <li><strong>NEW: Pattern learning</strong> - Learns from your decisions to improve future suggestions</li>
            <li><strong>NEW: Custom dictionary</strong> - Add terms to always skip (e.g., proper nouns)</li>
            <li><strong>NEW: Live preview mode</strong> - See changes inline as you review</li>
            <li><strong>NEW: Split-screen diff</strong> - Compare original vs. fixed document side-by-side</li>
            <li><strong>NEW: PDF summary reports</strong> - Generate professional PDF reports of your review session</li>
            <li><strong>NEW: Accessibility</strong> - High contrast mode, screen reader support, keyboard navigation</li>
            <li><strong>NEW: Sound effects</strong> - Optional audio feedback for actions; toggle with 🔇 button in header</li>
            <li><strong>ENH: Keyboard shortcuts</strong> - A=accept, R=reject, S=skip, U=undo, arrows=navigate</li>
            <li><strong>ENH: Export improvements</strong> - Accepted fixes → track changes; Rejected fixes → comments with notes</li>
            <li>API: Added /api/learner/* endpoints for pattern learning</li>
            <li>API: Added /api/report/generate for PDF report generation</li>
        </ul>
        <div class="changelog-note">
            <strong>Tip:</strong> Press <kbd>?</kbd> in Fix Assistant to see all keyboard shortcuts. 
            Click the speaker icon to enable sound effects.
            The mini-map shows green (safe), yellow (review), and orange (manual) markers for quick navigation.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.96 <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Fix Assistant v1 - Initial Premium Triage Interface</strong></p>
        <ul>
            <li><strong>NEW: Fix Assistant</strong> - Premium triage-style interface for reviewing automatic fixes</li>
            <li><strong>NEW: Keyboard shortcuts</strong> - A=accept, R=reject, S=skip, arrow keys to navigate</li>
            <li><strong>NEW: Confidence tiers</strong> - Safe (green), Review (yellow), Caution (orange) for each fix</li>
            <li><strong>NEW: Context display</strong> - Shows surrounding text with highlighted change location</li>
            <li><strong>NEW: Before/After comparison</strong> - Clear visual distinction between original and proposed</li>
            <li><strong>NEW: Bulk actions</strong> - Accept All Safe, Accept All, Reject All for efficiency</li>
            <li>ENH: Export now uses Fix Assistant selections instead of all fixes</li>
            <li>ENH: Progress tracking shows reviewed/total count</li>
            <li>UI: Premium styling with confidence badges, progress bar, keyboard hints</li>
        </ul>
        <div class="changelog-note">
            <strong>Foundation:</strong> This version introduced the core Fix Assistant concept that was 
            expanded to the full two-panel interface in v3.0.97.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.95 <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>UI Improvements - Version Consistency, Heatmap Interactivity, Hyperlink Display</strong></p>
        <ul>
            <li><strong>FIX: Version display consistency</strong> - All UI components now show same version</li>
            <li><strong>FIX: About section simplified</strong> - Shows only author name as requested</li>
            <li><strong>FIX: Heatmap clicking</strong> - Category × Severity heatmap now properly filters issues on click</li>
            <li><strong>NEW: Hyperlink status panel</strong> - Visual display of all checked hyperlinks and their validation status</li>
            <li>ENH: Section heatmap click-to-filter now shows toast feedback</li>
            <li>ENH: Rich context (page, section, highlighting) from v3.0.94 included</li>
        </ul>
        <div class="changelog-note">
            <strong>Heatmap Fix:</strong> The issue heatmap now uses the correct setChartFilter function 
            to filter the issues list when cells are clicked. Previously this feature was broken due to 
            a missing function reference.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.93 <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Acronym False Positive Reduction</strong></p>
        <ul>
            <li><strong>ACRONYM: Added 100+ common ALL CAPS words</strong> to COMMON_CAPS_SKIP list</li>
            <li><strong>ACRONYM: PDF word fragment detection</strong> - Identifies broken words from extraction</li>
            <li>TESTING: Reduced false positive acronym flagging by approximately 55%</li>
        </ul>
        <div class="changelog-note">
            <strong>Context:</strong> PDF extraction sometimes produces word fragments that look like 
            acronyms but are actually broken words. This version adds detection patterns to filter these.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.92 <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>PDF Processing Improvements</strong></p>
        <ul>
            <li><strong>FIXED: PDF punctuation false positives</strong> - Better handling of PDF extraction artifacts</li>
            <li><strong>FIXED: Acronym false positives</strong> - Improved filtering of legitimate capitalized text</li>
            <li><strong>ADDED: PDF hyperlink extraction</strong> - Uses PyMuPDF (fitz) for extracting URLs from PDFs</li>
        </ul>
        <div class="changelog-note">
            <strong>PyMuPDF Integration:</strong> PDF hyperlinks are now extracted and validated alongside 
            Word document hyperlinks, providing complete link health analysis across document types.
        </div>
    </div>

    <div class="changelog-version">
        <h3>v3.0.91d <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Critical Bug Fixes - Role Extraction & Update Manager</strong></p>
        <ul>
            <li><strong>FIX: False positive filtering bug</strong> - "Mission Assurance", "Verification Engineer" now properly blocked</li>
            <li><strong>FIX: Update manager path detection</strong> - No longer hardcodes "app" folder name</li>
            <li><strong>IMPROVED: Role extraction precision</strong> - 94.7% precision, 92.3% F1 score across 4-document test suite</li>
            <li>NEW: updates/ folder with UPDATE_README.md documentation</li>
            <li>NEW: backups/ folder for automatic backup storage</li>
            <li>ENH: UpdateConfig supports flat mode (updates inside app folder)</li>
            <li>ENH: Auto-detection of app directory for various installation layouts</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.91c <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Cross-Document Verification & Role Expansion</strong></p>
        <ul>
            <li>VERIFIED: 100% F1 score on government SOW document</li>
            <li>VERIFIED: 95% F1 score on Smart Columbus SEMP</li>
            <li>NEW: Agile/Scrum roles (scrum master, product owner, agile team)</li>
            <li>NEW: Executive roles (CTO, CIO, CEO, COO, CFO, CINO)</li>
            <li>NEW: IT roles (IT PM, consultant, business owner)</li>
            <li>NEW: Support roles (stakeholder, subject matter expert, sponsor)</li>
            <li>FIX: Additional noise patterns filtered (responsible, accountable, serves)</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.91b <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Major Role Extraction Accuracy Improvement</strong></p>
        <ul>
            <li>IMPROVED: Precision from 52% to 100% on government SOW test document</li>
            <li>IMPROVED: F1 Score from 68% to 97%</li>
            <li>FIX: Eliminated 32 false positives in test document</li>
            <li>NEW: Expanded FALSE_POSITIVES list (50+ new entries)</li>
            <li>NEW: SINGLE_WORD_EXCLUSIONS set for single-word filtering</li>
            <li>ENH: Enhanced _is_valid_role() with noise pattern detection</li>
            <li>ENH: Valid acronyms check (COR, PM, SE, etc.)</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.91 <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Docling Integration - AI-Powered Document Extraction</strong></p>
        <ul>
            <li>NEW: <strong>Docling integration</strong> for superior document parsing (IBM open-source)</li>
            <li>NEW: AI-powered table structure recognition (TableFormer model)</li>
            <li>NEW: Layout understanding preserves document reading order</li>
            <li>NEW: Section and heading detection without relying on styles</li>
            <li>NEW: Unified extraction for PDF, DOCX, PPTX, XLSX, HTML</li>
            <li>NEW: <strong>100% air-gapped operation</strong> - no network access after setup</li>
            <li>NEW: Memory optimization - image processing disabled by default</li>
            <li>NEW: setup_docling.bat for easy Docling installation with offline config</li>
            <li>NEW: bundle_for_airgap.ps1 for complete offline deployment packages</li>
            <li>NEW: /api/docling/status endpoint for checking Docling configuration</li>
            <li>IMPROVED: Role extraction accuracy with table-based confidence boosting</li>
            <li>IMPROVED: RACI matrix detection from table structures</li>
            <li>IMPROVED: Enhanced paragraph metadata for better context</li>
            <li>NOTE: Docling is optional - gracefully falls back to pdfplumber/python-docx</li>
        </ul>
        <div class="changelog-note">
            <strong>Air-Gap Installation:</strong> Run setup_docling.bat (requires internet once), or use 
            bundle_for_airgap.ps1 to create a transferable offline package. Docling requires 
            ~2.7GB disk space (packages + AI models). All operations run locally with no network access.
        </div>
    </div>
    <div class="changelog-version">
        <h3>v3.0.90 <span class="changelog-date">January 27, 2026</span></h3>
        <p><strong>Comprehensive Merge - All v3.0.76-89 Fixes</strong></p>
        <ul>
            <li>MERGED: All fixes from v3.0.76-v3.0.89 properly consolidated</li>
            <li>INCLUDES: Iterative pruning (MIN_CONNECTIONS=2)</li>
            <li>INCLUDES: Dashed lines for role-role connections</li>
            <li>INCLUDES: Dimmed opacity fixes (0.5/0.4/0.3)</li>
            <li>INCLUDES: Export dropdown with All/Current/JSON options</li>
            <li>INCLUDES: roles-export-fix.js module</li>
            <li>INCLUDES: table_processor.py + deployment scripts</li>
            <li>FIX: Patches were building from different bases - now unified</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.85 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Role Export Fix - Correct Module</strong></p>
        <ul>
            <li>FIX: Role export now works - created roles-export-fix.js module</li>
            <li>ROOT CAUSE: button-fixes.js handled click but had no export logic</li>
            <li>ROOT CAUSE: Role Details uses /api/roles/aggregated API, not window.State</li>
            <li>SOLUTION: New module fetches from same API that Role Details tab uses</li>
            <li>NEW: TWR.exportRolesCSV() exposed for manual testing in console</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.84 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Export Fix Attempt - Wrong File</strong></p>
        <ul>
            <li>ATTEMPTED: Fixed getState() priority order in roles.js</li>
            <li>ATTEMPTED: Export uses 3-path fallback for State access</li>
            <li>NOTE: Fix was in wrong file - export button handled by button-fixes.js</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.83 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Debug Build - Export Diagnostics</strong></p>
        <ul>
            <li>DEBUG: Added console logging to exportCurrentDocumentCSV()</li>
            <li>DEBUG: Logs State object, State.roles, rolesData, roleEntries</li>
            <li>DIAGNOSTIC: Use browser DevTools (F12) Console to see debug output</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.82 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Export Fix Attempt - Same Data Source as UI</strong></p>
        <ul>
            <li>FIX: Export Current Document now uses same data source as Role Details tab</li>
            <li>FIX: Uses State.roles?.roles || State.roles pattern matching UI display</li>
            <li>NOTE: Issue persisted - root cause found in v3.0.84</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.81 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Export Fix</strong></p>
        <ul>
            <li>FIX: Export Current Document now correctly uses backend session data</li>
            <li>FIX: Improved error messages when no roles available</li>
            <li>FIX: Export All Roles gives clearer feedback about database state</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.80 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Roles Export Functionality</strong></p>
        <ul>
            <li>NEW: Export dropdown in Roles & Responsibilities Studio header</li>
            <li>NEW: Export All Roles (CSV) - all roles across all scanned documents</li>
            <li>NEW: Export Current Document (CSV) - roles from currently loaded document</li>
            <li>NEW: Export Selected Document - pick a document from history to export</li>
            <li>NEW: Export All Roles (JSON) - full role data in JSON format</li>
            <li>API: Added /api/scan-history/document/&lt;id&gt;/roles endpoint</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.79 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Dimmed Node Visibility Fix</strong></p>
        <ul>
            <li>FIX: Dimmed nodes now visible - opacity increased from 0.3 to 0.5</li>
            <li>FIX: Dimmed node labels now visible (was completely hidden)</li>
            <li>FIX: Dimmed links more visible - opacity from 0.1 to 0.3</li>
            <li>ROOT CAUSE: CSS .dimmed class had opacity too low</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.78 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Weak Node Visibility Fix</strong></p>
        <ul>
            <li>FIX: Weak nodes now properly visible using SVG fill-opacity attribute</li>
            <li>FIX: Minimum node size increased to 10px for better visibility</li>
            <li>FIX: Weak node stroke width increased to 2.5px with dashed pattern</li>
            <li>ROOT CAUSE: Hex opacity suffix (#color80) doesn't work in SVG</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.77 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Self-Explanatory Graph Visualization</strong></p>
        <ul>
            <li>ENH: All connected nodes now visible - weak nodes have dashed outline</li>
            <li>ENH: Role-Role links (co-occurrence) now use dashed purple lines</li>
            <li>ENH: Role-Document links (appears in) use solid blue lines</li>
            <li>ENH: Legend explains node size, line thickness, and connection strength</li>
            <li>ENH: First-time hint banner with interaction tips</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.76 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Phantom Lines Fix + Document Log Fix</strong></p>
        <ul>
            <li>FIX: Phantom lines eliminated - no more lines going to barely-visible nodes</li>
            <li>FIX: Document Log now shows correct role count (was showing 0 for all)</li>
            <li>FIX: Nodes now require minimum 2 connections to be displayed</li>
            <li>ENH: Iterative pruning removes cascading weak connections</li>
            <li>ROOT CAUSE (graph): v3.0.75 only removed orphans (0 connections), not peripheral nodes</li>
            <li>ROOT CAUSE (doc log): Backend get_scan_history() was missing role_count field</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.75 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Orphan Nodes Fix</strong></p>
        <ul>
            <li>FIX: Disconnected nodes (floating circles) no longer appear in graph</li>
            <li>FIX: Only nodes with at least one connection are now displayed</li>
            <li>ENH: Graph shows only meaningful connected clusters</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.74 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Dangling Links Fix v2 + Enhanced Info Panel</strong></p>
        <ul>
            <li>FIX: Dangling graph links - added coordinate validation in tick handler</li>
            <li>FIX: Invalid links now hidden with display:none</li>
            <li>ENH: Graph info panel shows detailed stats with visual progress bars</li>
            <li>ENH: Separate sections for document vs role connections</li>
            <li>ENH: Built-in legend explains graph elements</li>
        </ul>
    </div>
    <div class="changelog-version">
        <h3>v3.0.73 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Graph Info Panel & Dangling Links Fixes</strong></p>
        <ul>
            <li>FIX: Pin selection button now works in graph info panel</li>
            <li>FIX: Close (X) button now works in graph info panel</li>
            <li>FIX: Dangling graph links - lines no longer connect to empty space</li>
            <li>FIX: Update manager now supports all file types and directories</li>
            <li>ROOT CAUSE: Links were rendered without validating both endpoints exist</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.72 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Full Height Content Fix</strong></p>
        <ul>
            <li>FIX: Tab content areas now fill available vertical space</li>
            <li>FIX: Relationship Graph expands to fill modal height</li>
            <li>FIX: RACI Matrix and Adjudication lists use full height</li>
            <li>ENH: All sections use flex layout for proper expansion</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.71 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Horizontal Tabs Navigation</strong></p>
        <ul>
            <li>FIX: Navigation now displays as horizontal tabs (not vertical sidebar)</li>
            <li>FIX: Removed width constraints from responsive breakpoints</li>
            <li>ENH: Tab styling with bottom border for active state</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.70 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Critical CSS Fix for Tab Visibility</strong></p>
        <ul>
            <li>FIX: Added missing CSS rules for .roles-section.active</li>
            <li>ROOT CAUSE: JS used .active class but CSS rules didn't exist</li>
            <li>SOLUTION: Added #modal-roles .roles-section display rules</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.69 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Responsibility Count Display Fix</strong></p>
        <ul>
            <li>FIX: "Top Roles by Responsibility Count" now shows actual responsibility count</li>
            <li>FIX: Document tag shows unique document count, not total scan count</li>
            <li>FIX: Summary cards display responsibility totals correctly</li>
            <li>ENH: Roles sorted by responsibility count (primary) then unique docs (secondary)</li>
            <li>API: Added responsibility_count and unique_document_count fields</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.68 <span class="changelog-date">January 26, 2026</span></h3>
        <p><strong>Roles Tab Visibility Fix</strong></p>
        <ul>
            <li>FIX: Roles tabs now display content properly</li>
            <li>ROOT CAUSE: CSS !important rules were overriding inline styles</li>
            <li>SOLUTION: Use classList.add('active') instead of style.display</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.66-67 <span class="changelog-date">January 25, 2026</span></h3>
        <p><strong>CSS Animation & Diagnostics</strong></p>
        <ul>
            <li>FIX: Added missing @keyframes fadeIn to CSS</li>
            <li>ENH: Added diagnostic logging to all render functions</li>
            <li>ENH: Try-catch wrappers for render error identification</li>
            <li>ENH: Container existence checks with clear error messages</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.65 <span class="changelog-date">January 24, 2026</span></h3>
        <p><strong>Graph Controls Fix</strong></p>
        <ul>
            <li>FIX: Graph search input now filters nodes</li>
            <li>FIX: Layout dropdown changes graph layout</li>
            <li>FIX: Labels dropdown controls node labels</li>
            <li>FIX: Threshold slider filters link visibility</li>
            <li>FIX: Reset/Recenter buttons work properly</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.63-64 <span class="changelog-date">January 24, 2026</span></h3>
        <p><strong>Graph Control Initialization</strong></p>
        <ul>
            <li>FIX: initGraphControls uses _tabsFixInitialized flag pattern</li>
            <li>FIX: Follows same initialization pattern as RACI, Details, Adjudication</li>
            <li>FIX: Removed dependency on TWR.Roles.initGraphControls</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.61-62 <span class="changelog-date">January 24, 2026</span></h3>
        <p><strong>Section Visibility & Graph Fallback</strong></p>
        <ul>
            <li>FIX: Section visibility uses proper display toggling</li>
            <li>FIX: Graph section visible when switching tabs</li>
            <li>ENH: initGraphControlsFallback when roles.js unavailable</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.59-60 <span class="changelog-date">January 24, 2026</span></h3>
        <p><strong>Adjudication Button & Event Handling</strong></p>
        <ul>
            <li>FIX: Adjudication button clicks now respond properly</li>
            <li>ENH: Console logging with [TWR RolesTabs] prefix</li>
            <li>ENH: Explicit handler attachment verification</li>
            <li>ENH: Improved event delegation for adjudication buttons</li>
            <li>ENH: Error boundary around click handlers</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.58 <span class="changelog-date">January 23, 2026</span></h3>
        <p><strong>Adjudication & Focus Fixes</strong></p>
        <ul>
            <li>FIX: Overview 'Documents Analyzed' shows unique documents, not total scans</li>
            <li>FIX: Role Details search/dropdown focus outline no longer cut off</li>
            <li>FIX: Adjudication search input now filters roles in real-time</li>
            <li>FIX: Adjudication filter dropdown now works</li>
            <li>FIX: Adjudication Select All checkbox works with visible items</li>
            <li>FIX: Adjudication item checkboxes no longer overlap text</li>
            <li>ENH: Form inputs/dropdowns show visible focus ring</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.57 <span class="changelog-date">January 23, 2026</span></h3>
        <p><strong>RACI Matrix Layout Enhancement</strong></p>
        <ul>
            <li>FIX: RACI counts now reflect unique documents (not scan instances)</li>
            <li>FIX: Re-scanning uses MAX(old, new) for mention counts</li>
            <li>FIX: RACI sort dropdown and Critical filter checkbox now work</li>
            <li>FIX: Role Details search and sort dropdown now work</li>
            <li>ENH: RACI table header sticky while scrolling</li>
            <li>ENH: RACI legend footer always visible</li>
            <li>ENH: Condensed layout - Role column wider, R/A/C/I columns compact</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.55-56 <span class="changelog-date">January 23, 2026</span></h3>
        <p><strong>Roles Studio Overhaul</strong></p>
        <ul>
            <li>NEW: Horizontal tab navigation replacing vertical sidebar</li>
            <li>NEW: Cross-Reference tab with Role × Document heatmap</li>
            <li>NEW: Roles Studio accessible without scanning a document</li>
            <li>NEW: Dictionary fallback when no scan data exists</li>
            <li>NEW: CSV export for Cross-Reference matrix</li>
            <li>FIX: Dictionary tab now loads data properly</li>
            <li>FIX: Tab switching shows only one section at a time</li>
            <li>FIX: RACI Matrix correctly shows R/A/C/I assignments</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.52-54 <span class="changelog-date">January 23, 2026</span></h3>
        <p><strong>Help System & Update Fixes</strong></p>
        <ul>
            <li>Complete help documentation with 44 sections</li>
            <li>Fixed CSS specificity issues in help modal</li>
            <li>Fixed "Check for Updates" element IDs</li>
            <li>Added showRollbackConfirm function</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.51 <span class="changelog-date">January 23, 2026</span></h3>
        <p><strong>Update System Improvements</strong></p>
        <ul>
            <li>Auto-restart on update with browser refresh</li>
            <li>Installation progress bar</li>
            <li>Desktop shortcut icon</li>
            <li>Custom install location prompt</li>
            <li>Fixed "Check for Updates" detection</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.50 <span class="changelog-date">January 22, 2026</span></h3>
        <p><strong>Package Restructure</strong></p>
        <ul>
            <li>Native file extension support (no .txt encoding)</li>
            <li>Clean directory structure for GitHub</li>
            <li>Fixed showNodeInfoPanel error in Roles</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.48-49 <span class="changelog-date">January 2026</span></h3>
        <p><strong>Hyperlink & Role Enhancements</strong></p>
        <ul>
            <li>PowerShell URL validator with comment insertion</li>
            <li>Statement Forge integration with Roles</li>
            <li>D3.js relationship graph visualization</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v3.0.x <span class="changelog-date">January 2026</span></h3>
        <p><strong>Enterprise Architecture</strong></p>
        <ul>
            <li>Modular JavaScript architecture (TWR namespace)</li>
            <li>Event delegation for all interactions</li>
            <li>Job manager infrastructure</li>
            <li>Air-gapped deployment support</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v2.9.x <span class="changelog-date">January 2026</span></h3>
        <p><strong>Major Features</strong></p>
        <ul>
            <li>Statement Forge for requirements extraction</li>
            <li>RACI matrix generation</li>
            <li>Issue families</li>
            <li>Scan history</li>
            <li>Diagnostic export</li>
        </ul>
    </div>

    <div class="changelog-version">
        <h3>v2.8.x <span class="changelog-date">December 2025</span></h3>
        <p><strong>Foundation</strong></p>
        <ul>
            <li>Core 50+ quality checkers</li>
            <li>Track changes export</li>
            <li>Dark mode</li>
        </ul>
    </div>
</div>
`
};

// ============================================================================
// ABOUT
// ============================================================================
HelpDocs.content['about'] = {
    title: 'About TechWriterReview',
    subtitle: 'Enterprise technical document analysis tool',
    html: `
<div class="help-about">
    <div class="help-about-header">
        <div class="help-about-logo"><i data-lucide="file-search"></i></div>
        <div class="help-about-info">
            <h2>TechWriterReview</h2>
            <p class="help-version-display"><strong id="about-version-display">Version 3.0.103</strong></p>
            <p>Build Date: January 27, 2026</p>
        </div>
    </div>

    <h2><i data-lucide="target"></i> Purpose</h2>
    <p>Enterprise-grade technical writing review tool designed for government and aerospace documentation. Analyzes documents for quality issues, standards compliance, and organizational clarity—all offline, all local.</p>

    <h2><i data-lucide="user"></i> Created By</h2>
    <p><strong>Nicholas Georgeson</strong></p>

    <h2><i data-lucide="code"></i> Technology Stack</h2>
    <div class="help-tech-stack">
        <div class="help-tech-item">
            <strong>Backend</strong>
            <span>Python 3.10+ / Flask / Waitress</span>
        </div>
        <div class="help-tech-item">
            <strong>Frontend</strong>
            <span>Vanilla JavaScript / HTML5 / CSS3</span>
        </div>
        <div class="help-tech-item">
            <strong>Visualization</strong>
            <span>Chart.js / D3.js</span>
        </div>
        <div class="help-tech-item">
            <strong>Document Processing</strong>
            <span>Docling (AI) / python-docx / pdfplumber</span>
        </div>
        <div class="help-tech-item">
            <strong>Icons</strong>
            <span>Lucide Icons</span>
        </div>
    </div>

    <h2><i data-lucide="sparkles"></i> Docling Status</h2>
    <div id="docling-status-container">
        <p><em>Checking Docling status...</em></p>
    </div>
    <script>
    (function() {
        // Fetch actual version from version.json
        setTimeout(function() {
            const versionEl = document.getElementById('about-version-display');
            if (versionEl) {
                fetch('/static/version.json')
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => fetch('/version.json').then(r => r.ok ? r.json() : null))
                    .then(data => {
                        if (data && data.version) {
                            versionEl.textContent = 'Version ' + data.version;
                        }
                    })
                    .catch(() => {});
            }
        }, 50);
        
        setTimeout(function() {
            const container = document.getElementById('docling-status-container');
            if (!container) return;
            
            fetch('/api/docling/status')
                .then(r => r.json())
                .then(status => {
                    const available = status.available || status.docling_available;
                    const backend = status.backend || status.extraction_backend || 'unknown';
                    const version = status.version || status.docling_version || 'N/A';
                    const offline = status.offline_ready !== false;
                    
                    container.innerHTML = \`
                        <table class="help-table" style="margin-top: 0;">
                            <tr>
                                <td><strong>Status</strong></td>
                                <td>\${available ? '<span style="color: #22c55e;">✓ Available</span>' : '<span style="color: #f59e0b;">○ Not Installed</span>'}</td>
                            </tr>
                            <tr>
                                <td><strong>Backend</strong></td>
                                <td>\${backend}</td>
                            </tr>
                            \${available ? \`<tr>
                                <td><strong>Version</strong></td>
                                <td>\${version}</td>
                            </tr>\` : ''}
                            <tr>
                                <td><strong>Offline Mode</strong></td>
                                <td>\${offline ? '<span style="color: #22c55e;">✓ Enabled</span>' : '<span style="color: #ef4444;">✗ Disabled</span>'}</td>
                            </tr>
                            <tr>
                                <td><strong>Image Processing</strong></td>
                                <td><span style="color: #6b7280;">Disabled (Memory Optimized)</span></td>
                            </tr>
                        </table>
                        \${!available ? '<p style="margin-top: 10px; color: #6b7280;"><i>Run setup_docling.bat to install Docling for enhanced extraction.</i></p>' : ''}
                    \`;
                })
                .catch(err => {
                    container.innerHTML = '<p style="color: #6b7280;">Unable to check Docling status. Using legacy extraction.</p>';
                });
        }, 100);
    })();
    </script>

    <h2><i data-lucide="heart"></i> Acknowledgments</h2>
    <p>Built with open-source tools: Flask, Docling (IBM), python-docx, pdfplumber, Chart.js, D3.js, Lucide Icons.</p>
    
    <div class="help-callout help-callout-info">
        <i data-lucide="shield"></i>
        <div>
            <strong>Air-Gapped by Design</strong>
            <p>TechWriterReview processes all documents locally. No data leaves your machine. Docling operates in offline mode with all AI models stored locally. Safe for classified, proprietary, and sensitive content.</p>
        </div>
    </div>
</div>
`
};

// ============================================================================
// SEARCH
// ============================================================================
HelpDocs.searchIndex = null;

HelpDocs.buildSearchIndex = function() {
    this.searchIndex = [];
    for (const [id, section] of Object.entries(this.content)) {
        const text = section.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
        this.searchIndex.push({
            id: id,
            title: section.title,
            subtitle: section.subtitle || '',
            text: text
        });
    }
};

HelpDocs.search = function(query) {
    if (!this.searchIndex) this.buildSearchIndex();
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const results = [];
    for (const item of this.searchIndex) {
        let score = 0;
        if (item.title.toLowerCase().includes(q)) score += 10;
        if (item.subtitle.toLowerCase().includes(q)) score += 5;
        if (item.text.includes(q)) score += 1 + (item.text.split(q).length - 1) * 0.1;
        if (score > 0) results.push({ ...item, score });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
};

// ============================================================================
// INITIALIZATION
// ============================================================================
HelpDocs.init = function() {
    console.log('[HelpDocs] Initializing v' + this.version);
    this.buildSearchIndex();
    console.log('[HelpDocs] Search index built: ' + this.searchIndex.length + ' entries');
};

if (typeof window !== 'undefined') {
    window.HelpDocs = HelpDocs;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HelpDocs.init());
    } else {
        HelpDocs.init();
    }
}

console.log('[HelpDocs] Module loaded v3.0.96');
