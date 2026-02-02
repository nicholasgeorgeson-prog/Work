# TechWriterReview - Project State

## Version: 3.0.108 (January 28, 2026)

---

## Project Overview

**TechWriterReview (TWR)** is a Flask-based document analysis tool for technical writers working in government contracting, defense, and aerospace documentation environments. It's designed for **air-gapped Windows networks** with no internet access after initial setup.

### Core Capabilities
- **Document Analysis**: 50+ quality checks for grammar, compliance, spelling, punctuation, requirements language
- **Role Extraction**: AI-powered identification with 94.7% precision across document types
- **RACI Matrix Generation**: Automatically generates RACI matrices from document content
- **Relationship Graph**: D3.js visualization showing role-document relationships
- **Statement Forge**: Extract actionable requirements and procedures
- **Scan History**: Tracks document scans and aggregates roles across documents
- **Fix Assistant v2**: Premium document review interface with progress tracking, learning, and export
- **Built-in Update System**: Apply patches from local files without reinstalling

### Technology Stack
- **Backend**: Python 3.10+, Flask, Waitress (WSGI)
- **Frontend**: Vanilla JS (ES6+), D3.js, Chart.js, Lucide icons
- **Database**: SQLite (scan_history.db, roles.db)
- **Document Processing**: python-docx, pdfplumber, PyMuPDF, Camelot, Tabula
- **Reports**: ReportLab (PDF generation)

---

## Current Version Features (v3.0.108)

### Fix Assistant v2 (v3.0.97+)
| Feature | Status | Notes |
|---------|--------|-------|
| Document Viewer | ✅ | Two-panel view with page navigation |
| Mini-map | ✅ | Document overview with fix markers |
| Undo/Redo | ✅ | Full history for all decisions |
| Progress Persistence | ✅ | localStorage saves progress |
| Pattern Learning | ✅ | Tracks user decisions for patterns |
| Custom Dictionary | ✅ | Skip terms user adds |
| PDF Reports | ✅ | Summary report generation |
| Accessibility | ✅ | High contrast, screen reader support |
| Sound Effects | ✅ | Optional audio feedback |

### Role Extraction (v3.0.108)
| Feature | Status | Notes |
|---------|--------|-------|
| Pattern-based extraction | ✅ | 20+ regex patterns for job titles |
| Known roles database | ✅ | 158 pre-defined roles with aliases |
| False positive filtering | ✅ | 167 exclusions (facilities, processes) |
| Acronym expansion | ✅ | 22 role acronyms (PM, SE, COR, etc.) |
| Table confidence boost | ✅ | +20% for RACI table roles |
| Cross-document validation | ✅ | 94.7% precision, 92.3% F1 score |
| Source document tracking | ✅ | v3.0.108: Added source_documents field |
| Sample contexts | ✅ | v3.0.107: Shows document context |

### Backend APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload document for analysis |
| `/api/review` | POST | Run analysis with checkers |
| `/api/export/xlsx` | POST | Enhanced Excel export |
| `/api/roles/matrix` | GET | Cross-document role matrix |
| `/api/roles/graph` | GET | D3.js graph data |
| `/api/learner/*` | Various | Pattern learning endpoints |
| `/api/report/generate` | POST | PDF report generation |
| `/api/fix-assistant/*` | Various | Fix Assistant v2 APIs |

---

## Recent Development History

| Version | Date | Key Changes |
|---------|------|-------------|
| 3.0.108 | Jan 28 | Document filter populated with scanned docs |
| 3.0.107 | Jan 28 | Role details shows context, matrix guidance |
| 3.0.106 | Jan 28 | Fix Assistant Document Viewer populated |
| 3.0.105 | Jan 28 | Report generator, learner stats, acronym fixes |
| 3.0.104 | Jan 28 | Fix Assistant v2 load fix, CSS tests |
| 3.0.103 | Jan 28 | Security audit, CSS modularization, test suite |
| 3.0.100 | Jan 28 | ReDoS protection, WAL mode, code review |
| 3.0.98 | Jan 28 | Major bug fixes, Role Studio improvements |
| 3.0.97 | Jan 28 | Fix Assistant v2 complete feature |
| 3.0.96 | Jan 27 | Fix Assistant v1 |
| 3.0.95 | Jan 27 | Hyperlink panel, heatmap clicking |

---

## Test Coverage

| Test Suite | Tests | Status |
|------------|-------|--------|
| Total | 117 | ✅ All passing |
| Skipped | 1 | Batch constants (not implemented) |

### Test Categories
- API Endpoints (health, upload, review, export)
- Configuration (hyperlinks, acronyms, settings)
- Security (path traversal, CSRF, static files)
- Fix Assistant v2 (API, state management)
- Role Extraction (parsing, classification)
- Session Management (cleanup, state)

---

## Open Issues

| Priority | Count | Description |
|----------|-------|-------------|
| Critical | 0 | None |
| High | 0 | None |
| Medium | 4 | Batch memory, session cleanup, error context, localStorage key |
| Low | 8 | Tech debt items |

See [TWR_BUG_TRACKER.md](../TWR_BUG_TRACKER.md) for details.

---

## File Structure

```
TechWriterReview/
├── app.py                 # Main Flask application
├── core.py                # Document extraction and review engine
├── config.json            # User configuration
├── version.json           # Version info with changelog
├── tests.py               # Unit tests (117 tests)
├── CHANGELOG.md           # Version history
├── TWR_BUG_TRACKER.md     # Issue tracking
├── fix_assistant_api.py   # Fix Assistant v2 backend
├── role_integration.py    # Role extraction integration
├── scan_history.py        # Scan history database
├── static/
│   ├── js/
│   │   ├── app.js         # Main frontend
│   │   ├── features/      # Modular feature code
│   │   │   ├── roles.js
│   │   │   ├── fix-assistant.js
│   │   │   └── ...
│   │   └── vendor/        # d3, chart.js, lucide
│   └── css/
│       ├── style.css      # Main styles
│       ├── layout.css     # Layout styles
│       ├── components.css # Component styles
│       └── ...            # Modularized CSS
├── templates/
│   └── index.html         # Main template
├── tools/
│   ├── INSTALL.ps1        # Installer
│   ├── Run_TWR.bat        # Start server
│   └── Stop_TWR.bat       # Stop server
└── docs/
    ├── TWR_PROJECT_STATE.md
    ├── TWR_SESSION_HANDOFF.md
    └── NEXT_SESSION_PROMPT.md
```

---

## Quick Start

1. Extract `TechWriterReview_v3.0.108.zip`
2. Run `setup.bat` or create venv manually:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run `python app.py` or `Run_TWR.bat`
4. Open `http://localhost:5050` in browser

---

## Testing

```bash
# Run all tests
python -m unittest tests -q

# Run specific test class
python -m unittest tests.TestFixAssistantV2API -v

# Run single test
python -m unittest tests.TestAPIEndpoints.test_health_endpoint -v
```

---

## Contact / Support

- **In-App Help**: Press F1 or click Help → Documentation
- **Development Notes**: See `TWR_LESSONS_LEARNED.md` for patterns and fixes
- **Bug Reports**: See `TWR_BUG_TRACKER.md`
