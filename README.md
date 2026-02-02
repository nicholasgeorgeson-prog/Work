# TechWriterReview v3.0.91d

Enterprise-grade document analysis and review tool for technical writers in aerospace, defense, and government contracting.

## Quick Start

### Basic Setup (With Internet)

```batch
1. Unzip this package
2. Double-click: setup.bat
3. Double-click: start_twr.bat  (or Run_TWR.bat)
4. Open browser to: http://localhost:5050
```

That's it! `setup.bat` installs all dependencies automatically.

### Optional: Enhanced Features

**NLP Enhancement** (recommended for better role detection):
```batch
setup_enhancements.bat
```
Installs spaCy, scikit-learn for ~90% role detection accuracy.

**Docling AI** (for superior document parsing):
```batch
setup_docling.bat
```
Installs Docling (~2.7GB) with:
- AI table structure recognition (95% vs 70% accuracy)
- Layout understanding and reading order preservation
- Section/heading detection without style dependencies
- 100% offline operation after setup

### Air-Gapped Deployment (No Internet)

For machines without internet access:

```batch
# On a machine WITH internet:
1. Run: powershell -ExecutionPolicy Bypass -File bundle_for_airgap.ps1
2. Wait for downloads (~3GB with Docling, ~500MB without)
3. Copy the bundle folder to target machine

# On the AIR-GAPPED machine:
1. Run: INSTALL_AIRGAP.bat
2. Follow prompts
```

## Features

### Document Analysis
- **50+ Quality Checks**: Grammar, spelling, acronyms, passive voice, requirements language
- **Readability Metrics**: Flesch, Flesch-Kincaid, Fog Index
- **Issue Triage**: Systematic review with Keep/Suppress/Fixed workflow
- **Issue Families**: Batch-process similar issues together

### Roles & Responsibilities Studio
- **Role Extraction**: AI-powered identification (94.7% precision)
- **RACI Matrix**: Auto-generate from extracted data
- **Relationship Graph**: D3.js visualization of role connections
- **Cross-Reference**: Role × Document heatmap
- **Role Dictionary**: Centralized role database

### Statement Forge
- **Statement Extraction**: Pull actionable requirements and procedures
- **Export Formats**: CSV, Excel, JSON for import into other tools
- **Compliance Checking**: Verify requirement statement structure

### Enterprise Features
- **100% Offline**: Operates on air-gapped networks
- **Local Processing**: No data leaves your machine
- **Built-in Updates**: Apply patches without reinstalling
- **Scan History**: Track document reviews over time

## File Structure

```
TechWriterReview/
├── app.py                    # Main Flask application (4,300+ LOC)
├── core.py                   # Document extraction engine
├── role_extractor_v3.py      # AI role extraction (94.7% precision)
├── docling_extractor.py      # Docling AI integration
├── *_checker.py              # Quality checker modules (30+)
├── statement_forge/          # Statement extraction module
│   ├── routes.py             # API endpoints
│   ├── extractor.py          # Extraction logic
│   └── export.py             # Export formats
├── static/                   # Frontend assets
│   ├── js/                   # JavaScript modules
│   │   ├── app.js            # Main application
│   │   ├── features/         # Feature modules (roles, triage)
│   │   ├── ui/               # UI components
│   │   └── vendor/           # D3.js, Chart.js, Lucide
│   └── css/                  # Stylesheets
├── templates/                # HTML templates
├── updates/                  # Drop update files here
├── backups/                  # Auto-created before updates
├── logs/                     # Application logs
├── setup.bat                 # Basic setup script
├── setup_docling.bat         # Docling installation
├── setup_enhancements.bat    # NLP enhancement installation
├── bundle_for_airgap.ps1     # Air-gap deployment packaging
├── version.json              # Version info (single source of truth)
└── TWR_LESSONS_LEARNED.md    # Development patterns & fixes
```

## Requirements

- Python 3.10+ (3.12 recommended)
- Windows 10/11 (for batch scripts)
- ~200 MB disk space (base installation)
- ~500 MB additional (with NLP enhancements)
- ~2.7 GB additional (with Docling AI)

## Air-Gap Security

TechWriterReview is designed for sensitive environments:

- **No network calls** during document processing
- **Docling offline mode**: Environment variables block all network access
- **Local AI models**: All AI runs on your machine
- **No telemetry**: Analytics and tracking disabled

## API Reference

TechWriterReview exposes a REST API on `http://localhost:5050/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload document for analysis |
| `/api/review` | POST | Run analysis with checkers |
| `/api/roles/extract` | GET | Extract roles from document |
| `/api/roles/raci` | GET | Get RACI matrix data |
| `/api/export/word` | POST | Export with tracked changes |
| `/api/export/csv` | POST | Export as CSV |
| `/api/updates/check` | GET | Check for pending updates |
| `/api/updates/apply` | POST | Apply pending updates |
| `/api/docling/status` | GET | Check Docling AI status |

See Help → Technical → API Reference for full documentation.

## Version History

See `version.json` for complete changelog.

### v3.0.91d (2026-01-27)
- FIXED: Role extraction false positive filtering (94.7% precision)
- FIXED: Update manager path detection
- NEW: updates/ and backups/ folders added to repository
- DOC: Comprehensive help documentation overhaul

### v3.0.91c (2026-01-27)
- VERIFIED: Cross-document role extraction testing
- NEW: Agile/Scrum roles, Executive roles, IT roles

### v3.0.91b (2026-01-27)
- IMPROVED: Role extraction precision from 52% to 100%
- NEW: Expanded FALSE_POSITIVES list

### v3.0.91 (2026-01-27)
- NEW: Docling AI integration for superior document extraction
- NEW: Air-gapped deployment with bundle_for_airgap.ps1
- NEW: Memory optimization (image processing disabled)
- NEW: /api/docling/status endpoint
- IMPROVED: Role extraction with table confidence boosting

### v3.0.90 (2026-01-27)
- MERGED: All fixes from v3.0.76-v3.0.89 consolidated
- INCLUDES: Graph visualization improvements
- INCLUDES: Export dropdown with All/Current/JSON options

## Support

- **In-App Help**: Press F1 or click Help → Documentation
- **Development Notes**: See `TWR_LESSONS_LEARNED.md` for patterns and fixes
- **Updates**: Check Settings → Updates for available patches
