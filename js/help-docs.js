/**
 * TechWriterReview Help Documentation System
 * ==========================================
 * Comprehensive documentation for all features.
 * Version: 3.0.52
 * 
 * Complete overhaul with:
 * - Beautiful visual design with icons and illustrations
 * - Detailed explanations of "how" and "why" for every feature
 * - Technical deep-dive section for advanced users
 * - Smooth navigation and professional typography
 */

'use strict';

const HelpDocs = {
    version: '3.0.58',
    lastUpdated: '2026-01-23',
    
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
        <p>TechWriterReview analyzes your documents for quality issues, standards compliance, organizational clarity, and readability—all without requiring an internet connection.</p>
    </div>
</div>

<div class="help-feature-grid">
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="shield-check"></i></div>
        <h3>50+ Quality Checks</h3>
        <p>Comprehensive analysis covering grammar, spelling, acronyms, passive voice, requirements language, and more.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="users"></i></div>
        <h3>Role Extraction</h3>
        <p>Automatically identify organizational roles and generate RACI matrices from your documents.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="hammer"></i></div>
        <h3>Statement Forge</h3>
        <p>Extract actionable requirements and procedures for import into TIBCO Nimbus or other tools.</p>
    </div>
    <div class="help-feature-card">
        <div class="help-feature-icon"><i data-lucide="wifi-off"></i></div>
        <h3>Air-Gapped Ready</h3>
        <p>Designed for secure environments—all processing happens locally on your machine.</p>
    </div>
</div>

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
            <p>Understand what each check does and why</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('tech-architecture')">
        <div class="help-path-icon"><i data-lucide="cpu"></i></div>
        <div class="help-path-content">
            <h4>Technical Deep Dive</h4>
            <p>For developers and power users</p>
        </div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
</div>

<div class="help-callout help-callout-tip">
    <i data-lucide="lightbulb"></i>
    <div>
        <strong>Pro Tip: Keyboard Shortcuts</strong>
        <p>Press <kbd>?</kbd> anytime to see available keyboard shortcuts. Press <kbd>F1</kbd> to open this help.</p>
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
        <p>You've completed your first review. Explore the sidebar to learn about advanced features like role extraction, triage mode, and Statement Forge.</p>
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
<p>TechWriterReview includes over 50 quality checks organized into categories.</p>

<h2><i data-lucide="info"></i> How Checkers Work</h2>
<ol>
    <li><strong>Extract</strong> text and structure from your document</li>
    <li><strong>Analyze</strong> each paragraph against enabled checkers</li>
    <li><strong>Flag</strong> issues with severity, location, and suggestions</li>
    <li><strong>Aggregate</strong> results into the dashboard and issue list</li>
</ol>

<h2><i data-lucide="layers"></i> Checker Categories</h2>
<div class="help-category-grid">
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-grammar')">
        <div class="help-category-icon"><i data-lucide="spell-check"></i></div>
        <h3>Spelling & Grammar</h3>
        <p>Typos, grammatical errors, punctuation</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-acronyms')">
        <div class="help-category-icon"><i data-lucide="a-large-small"></i></div>
        <h3>Acronyms</h3>
        <p>Undefined acronyms, inconsistent usage</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-writing')">
        <div class="help-category-icon"><i data-lucide="pen-tool"></i></div>
        <h3>Writing Quality</h3>
        <p>Passive voice, wordy phrases, sentence length</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-requirements')">
        <div class="help-category-icon"><i data-lucide="list-checks"></i></div>
        <h3>Requirements</h3>
        <p>Shall/will/must, TBD/TBR, testability</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-structure')">
        <div class="help-category-icon"><i data-lucide="file-text"></i></div>
        <h3>Document Structure</h3>
        <p>Headings, numbering, cross-references</p>
    </div>
    <div class="help-category-card" onclick="HelpContent.navigateTo('checker-hyperlinks')">
        <div class="help-category-icon"><i data-lucide="link"></i></div>
        <h3>Hyperlinks</h3>
        <p>URL validation, format consistency</p>
    </div>
</div>

<h2><i data-lucide="sliders"></i> Philosophy</h2>
<ul>
    <li><strong>Opinionated but Configurable</strong> — Checkers embody best practices, but disable what doesn't apply.</li>
    <li><strong>Severity Reflects Impact</strong> — Critical/High could cause misunderstandings; Medium/Low are style improvements.</li>
    <li><strong>Suggestions, Not Mandates</strong> — You decide what to fix.</li>
</ul>
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
<p>Aligns with IEEE 830, ISO/IEC/IEEE 29148, MIL-STD-498, NASA NPR 7123.1.</p>
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
    title: 'Roles Studio',
    subtitle: 'Centralized role management and RACI matrix generation',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="users" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Roles Studio is your centralized workspace for managing organizational roles extracted from documents. Generate RACI matrices, view role relationships, and track roles across your entire document library.</p>
    </div>
</div>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Always Accessible</strong>
        <p>Roles Studio can be opened anytime—even without scanning a document first. View historical role data from all your previous scans.</p>
    </div>
</div>

<h2><i data-lucide="layout"></i> Studio Layout</h2>
<p>Roles Studio uses horizontal tabs organized into three sections:</p>

<table class="help-table">
    <thead><tr><th>Section</th><th>Tabs</th><th>Purpose</th></tr></thead>
    <tbody>
        <tr>
            <td><strong>Analysis</strong></td>
            <td>Overview, Relationship Graph, Role Details, RACI Matrix, Cross-Reference</td>
            <td>View and analyze roles</td>
        </tr>
        <tr>
            <td><strong>Workflow</strong></td>
            <td>Adjudication</td>
            <td>Confirm or dismiss detected roles</td>
        </tr>
        <tr>
            <td><strong>Management</strong></td>
            <td>Role Dictionary, Document Log</td>
            <td>Manage role definitions and scan history</td>
        </tr>
    </tbody>
</table>

<h2><i data-lucide="help-circle"></i> Why Role Extraction Matters</h2>
<ul>
    <li><strong>Identify gaps</strong> — Find activities with no assigned responsible party</li>
    <li><strong>Clarify accountability</strong> — Ensure someone owns each deliverable</li>
    <li><strong>Generate RACI matrices</strong> — Create responsibility assignments automatically</li>
    <li><strong>Track across documents</strong> — See how roles appear across your document library</li>
    <li><strong>Support TIBCO Nimbus</strong> — Export roles for process modeling</li>
</ul>

<h2><i data-lucide="workflow"></i> Typical Workflow</h2>
<ol>
    <li><strong>Scan Documents</strong> — Enable "Role Extraction" in the sidebar, then run a review</li>
    <li><strong>Open Roles Studio</strong> — Click the Roles button in footer (or use <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>)</li>
    <li><strong>Review Overview</strong> — See aggregated stats and top roles</li>
    <li><strong>Adjudicate</strong> — Confirm valid roles, dismiss false positives</li>
    <li><strong>Analyze</strong> — Use Cross-Reference, Relationship Graph, or RACI Matrix</li>
    <li><strong>Export</strong> — Download as CSV, Excel, or Word</li>
</ol>

<h2><i data-lucide="navigation"></i> Explore Each Tab</h2>
<div class="help-path-list">
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-detection')">
        <div class="help-path-icon"><i data-lucide="user-search"></i></div>
        <div class="help-path-content"><h4>Role Detection</h4><p>How the system identifies roles</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-adjudication')">
        <div class="help-path-icon"><i data-lucide="check-circle"></i></div>
        <div class="help-path-content"><h4>Adjudication</h4><p>Confirm or dismiss detected roles</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-crossref')">
        <div class="help-path-icon"><i data-lucide="table"></i></div>
        <div class="help-path-content"><h4>Cross-Reference</h4><p>Role × Document heatmap matrix</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('role-matrix')">
        <div class="help-path-icon"><i data-lucide="grid-3x3"></i></div>
        <div class="help-path-content"><h4>RACI Matrix</h4><p>Responsibility assignment matrices</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
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
    subtitle: 'Extract actionable statements for process modeling',
    html: `
<div class="help-hero help-hero-compact">
    <div class="help-hero-icon"><i data-lucide="hammer" class="hero-icon-main"></i></div>
    <div class="help-hero-content">
        <p>Extract actionable statements (requirements, procedures) from documents and format them for TIBCO Nimbus or other tools.</p>
    </div>
</div>

<h2><i data-lucide="help-circle"></i> Why Use Statement Forge?</h2>
<ul>
    <li><strong>Extract</strong> requirements and procedures automatically</li>
    <li><strong>Structure</strong> into Actor-Action-Object format</li>
    <li><strong>Export</strong> to process modeling tools</li>
    <li><strong>Reduce</strong> manual transcription errors</li>
</ul>

<h2><i data-lucide="workflow"></i> Workflow</h2>
<ol>
    <li><strong>Load Document</strong> — Review as normal</li>
    <li><strong>Extract</strong> — Statement Forge identifies actionable content</li>
    <li><strong>Edit</strong> — Refine statements and actors</li>
    <li><strong>Export</strong> — TIBCO Nimbus, CSV, or JSON</li>
</ol>

<div class="help-path-list">
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-extraction')">
        <div class="help-path-icon"><i data-lucide="filter"></i></div>
        <div class="help-path-content"><h4>Statement Extraction</h4><p>How extraction works</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-editing')">
        <div class="help-path-icon"><i data-lucide="edit-3"></i></div>
        <div class="help-path-content"><h4>Editing Statements</h4><p>Refine extracted content</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
    </div>
    <div class="help-path-card" onclick="HelpContent.navigateTo('forge-export')">
        <div class="help-path-icon"><i data-lucide="download"></i></div>
        <div class="help-path-content"><h4>Export Formats</h4><p>TIBCO Nimbus, CSV, JSON</p></div>
        <i data-lucide="chevron-right" class="help-path-arrow"></i>
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
<p>TechWriterReview includes an update system for applying fixes to existing installations.</p>

<h2><i data-lucide="download"></i> Applying Updates</h2>
<ol>
    <li>Extract update files to <code>C:\\TWR\\updates\\</code></li>
    <li>Open Settings → Updates tab</li>
    <li>Click "Check for Updates"</li>
    <li>Click "Apply Updates"</li>
    <li>Wait for automatic restart and browser refresh</li>
</ol>

<h2><i data-lucide="shield"></i> How It Works</h2>
<ul>
    <li>Update files are routed to correct locations</li>
    <li>Backups created before applying changes</li>
    <li>Server restarts automatically after update</li>
    <li>Browser refreshes when server is ready</li>
</ul>

<div class="help-callout help-callout-info">
    <i data-lucide="info"></i>
    <div>
        <strong>Air-Gapped Friendly</strong>
        <p>Updates are applied from local files, no internet required.</p>
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
C:\\TWR\\
├── Run_TWR.bat          # Start server (restart loop)
├── Stop_TWR.bat         # Stop server
├── .venv/               # Python virtual environment
├── app/                 # Application files
│   ├── app.py           # Main Flask app
│   ├── core.py          # Document extraction
│   ├── *_checker.py     # Checker modules
│   ├── statement_forge/ # Statement extraction
│   ├── static/          # Frontend assets
│   │   ├── js/          # JavaScript
│   │   └── css/         # Stylesheets
│   └── templates/       # HTML templates
├── updates/             # Update files go here
├── backups/             # Auto-created before updates
└── logs/                # Application logs
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
<h2><i data-lucide="file-code"></i> Extraction Pipeline</h2>

<pre class="help-code">
Document Upload
      │
      ▼
┌─────────────────┐
│ Format Detection│ ← .docx, .pdf, .txt, .rtf
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│ DOCX  │  │  PDF  │
│Parser │  │Parser │
└───┬───┘  └───┬───┘
    │          │
    ▼          ▼
┌─────────────────┐
│ Unified Document│ ← Paragraphs, headings, tables
│     Model       │
└─────────────────┘
</pre>

<h2><i data-lucide="file-text"></i> Word Document Extraction</h2>
<p>Uses <code>python-docx</code> library:</p>

<pre class="help-code">
from docx import Document

def extract_docx(file_path):
    doc = Document(file_path)
    result = {
        'paragraphs': [],
        'headings': [],
        'tables': [],
        'hyperlinks': [],
        'metadata': {}
    }
    
    for para in doc.paragraphs:
        result['paragraphs'].append({
            'text': para.text,
            'style': para.style.name,
            'runs': [r.text for r in para.runs]
        })
    
    return result
</pre>

<h2><i data-lucide="file"></i> PDF Extraction</h2>
<p>Uses <code>pdfplumber</code>:</p>

<pre class="help-code">
import pdfplumber

def extract_pdf(file_path):
    with pdfplumber.open(file_path) as pdf:
        text = []
        for page in pdf.pages:
            text.append(page.extract_text())
    return {'paragraphs': split_paragraphs(text)}
</pre>

<h2><i data-lucide="alert-triangle"></i> Limitations</h2>
<ul>
    <li><strong>Scanned PDFs</strong> — No OCR; images can't be analyzed</li>
    <li><strong>Complex tables</strong> — May not preserve structure perfectly</li>
    <li><strong>Embedded objects</strong> — OLE objects not extracted</li>
    <li><strong>Password-protected</strong> — Must be unlocked first</li>
</ul>
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
<p>TechWriterReview exposes a REST API on <code>http://127.0.0.1:5050/api/</code>.</p>

<h2><i data-lucide="upload"></i> Document Analysis</h2>

<h3>POST /api/upload</h3>
<p>Upload document for analysis.</p>
<pre class="help-code">
curl -X POST -F "file=@document.docx" http://127.0.0.1:5050/api/upload
</pre>

<h3>POST /api/review</h3>
<p>Run analysis with specified checkers.</p>
<pre class="help-code">
{
  "document_id": "abc123",
  "checkers": ["acronyms", "grammar", "spelling"]
}
</pre>

<h3>GET /api/results/{document_id}</h3>
<p>Retrieve analysis results.</p>

<h2><i data-lucide="download"></i> Export</h2>

<h3>POST /api/export/word</h3>
<p>Generate Word document with tracked changes.</p>

<h3>POST /api/export/csv</h3>
<p>Export issues as CSV.</p>

<h3>POST /api/export/json</h3>
<p>Export structured JSON data.</p>

<h2><i data-lucide="settings"></i> Configuration</h2>

<h3>GET /api/config</h3>
<p>Get current configuration.</p>

<h3>POST /api/config</h3>
<p>Update configuration.</p>

<h2><i data-lucide="activity"></i> Health & Updates</h2>

<h3>GET /api/updates/health</h3>
<p>Server health check (used for restart polling).</p>

<h3>POST /api/updates/check</h3>
<p>Check for available updates.</p>

<h3>POST /api/updates/apply</h3>
<p>Apply pending updates.</p>
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
    <li>Check logs in <code>app/logs/</code></li>
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
            <p class="help-version-display"><strong>Version 3.0.58</strong></p>
            <p>Build Date: January 23, 2026</p>
        </div>
    </div>

    <h2><i data-lucide="target"></i> Purpose</h2>
    <p>Enterprise-grade technical writing review tool designed for government and aerospace documentation. Analyzes documents for quality issues, standards compliance, and organizational clarity—all offline, all local.</p>

    <h2><i data-lucide="user"></i> Created By</h2>
    <p><strong>Nicholas Georgeson</strong><br>
    Systems Engineer, SAIC<br>
    MS Systems Engineering, Stevens Institute of Technology</p>

    <h2><i data-lucide="code"></i> Technology Stack</h2>
    <div class="help-tech-stack">
        <div class="help-tech-item">
            <strong>Backend</strong>
            <span>Python 3.8+ / Flask / Waitress</span>
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
            <span>python-docx / pdfplumber</span>
        </div>
        <div class="help-tech-item">
            <strong>Icons</strong>
            <span>Lucide Icons</span>
        </div>
    </div>

    <h2><i data-lucide="heart"></i> Acknowledgments</h2>
    <p>Built with open-source tools: Flask, python-docx, pdfplumber, Chart.js, D3.js, Lucide Icons.</p>
    
    <div class="help-callout help-callout-info">
        <i data-lucide="shield"></i>
        <div>
            <strong>Air-Gapped by Design</strong>
            <p>TechWriterReview processes all documents locally. No data leaves your machine. Safe for classified, proprietary, and sensitive content.</p>
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

console.log('[HelpDocs] Module loaded v3.0.55');
