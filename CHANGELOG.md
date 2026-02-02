# TechWriterReview Changelog

All notable changes to TechWriterReview are documented in this file.

## [3.0.126] - 2026-02-01

### Added
- **3D Animated Progress Bar** - Stunning new progress bar for Hyperlink Validator with:
  - Dark cosmic purple/blue gradient background with animated starfield
  - Flowing purple-blue animated gradient fill with glow effects
  - Floating particle system (orbs and sparkles) with smooth animations
  - Glowing edge effect at progress bar tip
  - Pulsing green status indicator
  - 3D depth with shadows and layered effects
- **3D Animated Loading Overlay** - Matching visual treatment for main review page loading:
  - Glass-effect card with blur backdrop
  - Same animated starfield background
  - 3D progress bar with particles
  - Glowing orb accents creating depth
- **Domain Health Carousel in Review Tab** - The 3D domain carousel now also appears in the review tab's hyperlinks panel when documents contain validated links
- **Light/Dark Mode Support** - Both progress bars fully adapt to selected theme:
  - Light mode: Clean white/blue theme with subtle particles
  - Dark mode: Cosmic purple/blue theme with intense glows

### Changed
- **Upload File Now Default Tab** - Hyperlink Validator now opens with "Upload File" as the default tab, with "Paste URLs" as secondary option
- Reorganized tab order in Hyperlink Validator input section

### Improved
- **Windows Compatibility** - File upload handling uses standard Web APIs (FileReader, FormData) with no platform-specific path manipulations
- Progress bar height fixed to 28px with proper min-height to prevent CSS flex shrinking issues
- Enhanced particle animations with varied delays for more organic movement

### Technical
- Updated `templates/index.html` - New 3D progress bar HTML structure with particles, orbs, and streaks
- Updated `static/css/features/hyperlink-validator.css` - Complete progress section rewrite with 3D effects and theme support
- Updated `static/css/components.css` - New 3D loading overlay styles with light/dark mode variants
- Updated `static/js/app.js` - Domain health carousel rendering in review tab hyperlinks panel

## [3.0.122] - 2026-02-01

### Added
- **Persistent Link Exclusions** - URL exclusion rules now stored in SQLite database (survive sessions)
- **Scan History Storage** - Historical hyperlink scans recorded with summary statistics
- **Link History Modal** - New "Links" button in top navigation opens history modal with two tabs:
  - **Exclusions Tab** - Add, edit, enable/disable, delete URL exclusion patterns
  - **Scans Tab** - View historical scans, see details, clear old records
- New API endpoints: `/api/hyperlink-validator/exclusions/*` and `/history/*`
- `HyperlinkValidatorStorage` class for database operations
- `LinkHistory` JavaScript module for UI management
- Match types: contains, exact, prefix, suffix, regex

### Changed
- `HyperlinkValidatorState` now loads exclusions from database on init (falls back to localStorage)
- Completed scans automatically recorded to database via `recordScanToHistory()`

## [3.0.121] - 2026-02-01

### Fixed
- **Portfolio "Open in Review"** - Button now correctly loads documents with stats bar, analytics, and issues table displaying properly (was showing empty state placeholder)
- Added missing calls to hide empty-state and show stats-bar in `openDocument()` function

### Improved
- **Responsive Hyperlinks Panel** - Changed from fixed heights (300px/150px) to viewport-relative (50vh/25vh)
- **Clickable Hyperlinks** - Users can now click any hyperlink row to open URL in new tab for manual verification
- Added visual hover feedback with external-link icon appearing on hover
- Hyperlink text and error columns now properly flex and shrink

### Added
- Test document `hyperlink_test.docx` with working and broken link examples

## [3.0.120] - 2026-02-01

### Added
- **3D Carousel for Issues by Section** - New rotating carousel view in Document Analytics
- Boxes arranged in horizontal arc with 3D perspective
- Drag-to-spin (continuous rotation while dragging) and slider navigation
- Click on box to filter issues to that section
- Color-coded borders based on issue density (none/low/medium/high)

### Improved
- Visual design: white background, 75x80px boxes, section labels, issue counts
- Touch support for mobile devices
- Dark mode compatibility

## [3.0.119] - 2026-02-01

### Fixed
- **Document Filter Dropdown** - Now correctly filters roles by document in Roles Studio
- Fixed CSS selector bug: `.roles-nav-btn.active` → `.roles-nav-item.active`
- Filter updates Overview stats, Responsibility Distribution chart, and Top Roles list

### Added
- Filter indicator shows "Filtered by: [document]" when active
- Restores previous filter selection when re-opening modal

### Improved
- **Help Modal Sizing** - Now 85vw × 80vh (3/4 screen) with opaque backdrop
- **Statement Forge Help Modal** - Now 80vw × 75vh with matching styling

### Documentation
- **Comprehensive Help Documentation Overhaul** - Major content updates:
  - **Welcome Section** - Enterprise-grade capabilities callout, 8 Core Capabilities cards, file formats, 6 "Where to Start" navigation cards
  - **Roles Studio** - Performance stats (94.7% precision), 8 Key Features cards, Studio Tabs table, Workflow guide
  - **Statement Forge** - 8 Key Features, Workflow guide, Keyboard shortcuts table
  - **Fix Assistant v2** (NEW) - Complete section with Overview, 8 Key Features, Shortcuts, Workflow, Bulk Actions, Pattern Learning, Export Options
  - **Hyperlink Health** (NEW) - What Gets Checked, Validation Results table, HTTP Status Codes reference
  - **Batch Processing** (NEW) - Queue Management, Queue States table, Results View, Export Options
  - **Quality Checkers** - Complete Checker List table (13 modules), Severity Levels, Configuration guide

## [3.0.116] - 2026-02-01

### Fixed
- **BUG-M02**: Batch memory - Files now stream to disk in 8KB chunks instead of loading entirely into memory
- **BUG-M03**: SessionManager growth - Added automatic cleanup thread that runs hourly to remove sessions older than 24 hours
- **BUG-M04**: Batch error context - Full tracebacks now logged for batch processing errors (debug mode shows in response)
- **BUG-M05**: localStorage key collision - Fix Assistant progress now uses unique document IDs via hash of filename + size + timestamp
- **BUG-L07**: Batch limit constants - Defined `MAX_BATCH_SIZE` (10) and `MAX_BATCH_TOTAL_SIZE` (100MB) constants

### Added
- `SessionManager.start_auto_cleanup()` method for configurable automatic session cleanup
- `SessionManager.stop_auto_cleanup()` method to halt the cleanup thread
- `SessionManager.get_session_count()` method to check active session count
- `FixAssistantState.generateDocumentId()` function to create collision-free storage keys

### Changed
- Batch upload endpoint now enforces file count and total size limits
- Batch upload/review errors now include full traceback in debug mode

## [3.0.115] - 2026-02-01

### Added
- **Document Type Profiles** - Customize which quality checks are performed for PrOP, PAL, FGOST, SOW, and other document types
- Settings > Document Profiles tab with visual checker grid for each document type
- Custom profiles persist in localStorage (user-specific)
- Select All, Clear All, Reset to Default buttons for profile management
- First-time user prompt to configure document profiles on initial app launch

### Changed
- `applyPreset()` now uses custom profiles when available for document type presets

## [3.0.110] - 2026-02-01

### Added
- **Hyperlink Validator Export** - Export highlighted DOCX with broken links marked in red/yellow/strikethrough
- **Hyperlink Validator Export** - Export highlighted Excel with broken link rows in red background
- API endpoint `/api/hyperlink-validator/export-highlighted/docx`
- API endpoint `/api/hyperlink-validator/export-highlighted/excel`
- "Export Highlighted" button in Hyperlink Validator modal (enabled after file validation)

## [3.0.109] - 2026-01-28

### Fixed
- **Issue #1**: Batch Modal - Now opens correctly (removed inline style override from template)
- **Issue #2**: Hyperlinks - Now extracts HYPERLINK field codes (`<w:fldSimple>`, `<w:instrText>`) in addition to standard `<w:hyperlink>` elements from DOCX files
- **Issue #3**: Acronym Highlighting - Uses word boundary regex (`\b`) to prevent false positives like "NDA" inside "staNDArds"
- **Issue #4**: Fix Assistant Premium - Complete implementation with close button, navigation, keyboard shortcuts, progress tracking, and all action buttons working
- **Issue #5**: Statement Forge - "No document loaded" error fixed with consistent state checks matching `extractStatements()` logic
- **Issue #6**: Scan History - Added missing `/api/scan-history/stats`, `/clear`, `/recall` endpoints
- **Issue #7**: Triage Mode - `State.documentId` now set after fresh review, fixing "Document must be saved to history" error
- **Issue #8**: Document Filter - Now properly populates from scan history
- **Issue #9**: Role-Document Matrix - Improved response validation, handles null/undefined data gracefully
- **Issue #10**: Export Modal Badge Overflow - Badges now wrap and truncate with ellipsis when too long
- **Issue #11**: Comment Placement - Smart quote normalization and multi-strategy text matching (exact → normalized → fuzzy)
- **Issue #12**: Version History - Added missing version entries to help documentation
- **Issue #13**: Updater Rollback - `restoreBackup()` now uses correct `/api/updates/rollback` endpoint, button enable/disable based on backup availability
- **Issue #14**: "No Updates Available" - Proper empty state styling with centered text and checkmark icon
- **Issue #15**: Logo 404 - Fixed missing logo reference (changed from .png to .svg)

### Improved
- Statement extraction patterns expanded with responsibility/accountability/required-to phrases
- Fallback extraction for documents without clear section structure (scans all paragraphs)
- Role-Document Matrix error display with retry button
- Statement Forge modal opens with pre-extracted statements if available
- Fix Assistant keyboard shortcuts with visual feedback (A=accept, R=reject, S=skip, arrows, Escape)

### Added
- `generateGlobalDocumentId()` function for consistent document ID generation
- `/api/scan-history/stats` endpoint for scan history panel
- `/api/scan-history/clear` endpoint for clearing scan history  
- `/api/scan-history/<id>/recall` endpoint for restoring previous scans
- `_parse_field_code_hyperlink()` method for parsing HYPERLINK field codes
- `normalize_quotes()` and `normalize_whitespace()` functions in comment_inserter.py
- `escapeRegex()` helper in renderers.js for safe regex construction
- Fix Assistant Premium CSS enhancements for modal, buttons, progress bar

## [3.0.108] - 2026-01-28

### Fixed
- **BUG-009**: Document filter dropdown now populates with scanned document names
- Added `source_documents` field to role extraction data for proper filtering

## [3.0.107] - 2026-01-28

### Fixed
- **BUG-007**: Role Details tab now shows `sample_contexts` from documents
- **BUG-008**: Role-Doc Matrix shows helpful guidance when empty instead of stuck on "Loading"

### Improved
- Matrix tab explains how to populate cross-document data
- Better empty state messaging throughout Role Studio

## [3.0.106] - 2026-01-28

### Fixed
- **BUG-006**: Fix Assistant v2 Document Viewer was empty (0 paragraphs) - `paragraphs`, `page_map`, and `headings` now returned from `core.py` review results
- **BUG-M01**: Remaining deprecated `datetime.utcnow()` calls in `config_logging.py` replaced with `datetime.now(timezone.utc)`

## [3.0.105] - 2026-01-28

### Fixed
- **BUG-001**: Report generator API signature mismatch - `generate()` now returns bytes when `output_path` not provided
- **BUG-002**: Learner stats endpoint now uses standard `{success, data}` response envelope
- **BUG-003**: Acronym checker mode handling - strict mode now properly flags common acronyms
- **BUG-004**: Role classification tiebreak - "Report Engineer" now correctly classified as role
- **BUG-005**: Comment pack now includes location hints from `hyperlink_info`

### Maintenance
- Updated deprecated `datetime.utcnow()` calls to `datetime.now(timezone.utc)` (partial - completed in 3.0.106)

## [3.0.104] - 2026-01-28

### Fixed
- Fix Assistant v2 load failure - BodyText style conflict resolved
- Logger reserved keyword conflict in static file security endpoint

### Tests
- Updated test expectations for static file security responses
- Fixed CSS test locations for modularized stylesheets

## [3.0.103] - 2026-01-28

### Security
- innerHTML safety audit - all 143 usages documented and verified (Task A)

### Refactored
- CSS modularized into 10 logical files for maintainability (Task B)

### Quality
- Test suite modernized with docstrings (Task C)
- Exception handling refined with specific catches (Task D)
- Added comprehensive code comments throughout JavaScript

### Tests
- Added `TestFixAssistantV2API` class
- Added `TestBatchLimits` class  
- Added `TestSessionCleanup` class

## [3.0.102] - 2026-01-28 *(reconstructed)*

### Added
- Intermediate stabilization release between 3.0.101 and 3.0.103

## [3.0.101] - 2026-01-28

### Refactored
- Standardized API error responses with correlation IDs (ISSUE-004)
- Centralized document type detection into `get_document_extractor()` helper (ISSUE-008)
- Centralized user-facing strings into `STRINGS` constant (ISSUE-009)

### Documentation
- Added comprehensive JSDoc comments to feature modules (ISSUE-010)
- Completed remaining 4 of 12 issues from comprehensive code review audit

## [3.0.100] - 2026-01-28

### Security
- Added ReDoS protection with safe regex wrappers (ISSUE-001)
- Enhanced input validation on learner dictionary API (ISSUE-005)

### Performance
- Enabled WAL mode for SQLite with `busy_timeout` for concurrent access (ISSUE-002)
- Added file size validation for large document protection (ISSUE-003)

### Fixed
- `State.entities` now properly reset on new document load (ISSUE-006)
- Added `cleanup()` function to `FixAssistantState` to prevent memory leaks (ISSUE-007)
- Addressed 7 of 12 issues from comprehensive code review audit

## [3.0.99] - 2026-01-28 *(reconstructed)*

### Added
- Intermediate release with bug fixes between 3.0.98 and 3.0.100

## [3.0.98] - 2026-01-28

### Fixed
- **BUG-001**: Double browser tab on startup
- **BUG-002**: Export modal crash
- **BUG-003**: Context highlighting showing wrong text
- **BUG-004**: Restored hyperlink status panel
- **BUG-005**: Version history gaps in Help modal
- **BUG-009**: Restored Role-Document matrix tab

### Improved
- **BUG-006**: Comprehensive `TWR_LESSONS_LEARNED.md` updates
- **BUG-007**: Role Details tab with context preview
- **BUG-008**: Document filter dropdown in Role Studio

## [3.0.97] - 2026-01-28

### Added - Fix Assistant v2 (Major Feature)
- Two-panel document viewer with page navigation and highlighting
- Mini-map showing document overview with fix position markers
- Undo/redo capability for all review decisions
- Search and filter fixes by text, category, or confidence
- Save progress and continue later (localStorage persistence)
- Learning from user decisions (pattern tracking, no AI)
- Custom dictionary for terms to always skip
- Live preview mode showing changes inline
- Split-screen view (original vs fixed document)
- PDF summary report generation
- Accessibility features (high contrast, screen reader support)
- Enhanced keyboard shortcuts (A=accept, R=reject, S=skip, U=undo)
- Optional sound effects for actions (Web Audio API)
- Rejected fixes exported as document comments with reviewer notes

### Improved
- Export now handles both accepted fixes (track changes) and rejected fixes (comments)

### API
- Added `/api/learner/*` endpoints for pattern learning
- Added `/api/report/generate` endpoint for PDF reports

## [3.0.96] - 2026-01-27

### Added - Fix Assistant v1
- Premium triage-style interface for reviewing automatic fixes
- Keyboard shortcuts (A=accept, R=reject, S=skip, arrows=nav)
- Confidence tiers (Safe/Review/Caution) for each proposed fix
- Context display showing surrounding text with highlighted change
- Before/After comparison with clear visual distinction
- Bulk actions (Accept All Safe, Accept All, Reject All)

### Improved
- Export now uses Fix Assistant selections instead of all fixes
- Progress tracking shows reviewed/total count

### UI
- Premium styling with confidence badges, progress bar, keyboard hints

## [3.0.95] - 2026-01-27

### Fixed
- Version display consistency - all UI components now show same version
- About section simplified - shows only author name
- Heatmap clicking - Category × Severity heatmap now filters issues on click

### Added
- Hyperlink status panel - visual display of checked hyperlinks and validation status

### Improved
- Section heatmap click feedback with toast messages

## [3.0.94] - 2026-01-27 *(reconstructed)*

### Added
- Intermediate release with improvements between 3.0.93 and 3.0.95

## [3.0.93] - 2026-01-27

### Improved - Acronym Detection
- Added 100+ common ALL CAPS words to `COMMON_CAPS_SKIP`
- Added PDF word fragment detection

### Testing
- Reduced false positive acronym flagging by ~55%

## [3.0.92] - 2026-01-27

### Fixed
- PDF punctuation false positives
- Acronym false positives

### Added
- PDF hyperlink extraction via PyMuPDF

---

## Version Numbering

TechWriterReview uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (3): Major architectural changes
- **MINOR** (0): Feature additions
- **PATCH** (92-108): Bug fixes and improvements

---

## Links

- [Bug Tracker](TWR_BUG_TRACKER.md)
- [Project State](docs/TWR_PROJECT_STATE.md)
- [Lessons Learned](TWR_LESSONS_LEARNED.md)
