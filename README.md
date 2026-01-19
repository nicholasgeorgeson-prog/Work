# File Import Metrics Dashboard

A beautiful, self-contained tool for importing CSV, JSON, and Excel files into a SQLite database with advanced graphical metrics visualization. Designed to work on restricted networks with no external dependencies.

## Features

- **Multi-format Support**: Import CSV, JSON, and Excel (.xlsx, .xls) files
- **SQLite Storage**: Lightweight, portable database with no server setup required
- **Advanced Metrics**: Real-time statistics and trend analysis
- **Beautiful Visualizations**: Custom SVG-based charts (no external CDN required)
  - Line charts with gradients for trends
  - Pie/donut charts for distributions
  - Bar charts for comparisons
  - Gauge charts for success rates
- **Column Statistics**: Automatic type detection, null counts, unique values, min/max analysis
- **Search & Filter**: Find imports by filename, type, date, or status
- **Responsive Design**: Works on desktop and tablet screens
- **Offline-Ready**: All assets embedded - works on air-gapped networks

## Quick Start

### Linux/Mac
```bash
./run.sh
```

### Windows
```cmd
run.bat
```

### Manual Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Then open http://localhost:5000 in your browser.

## Project Structure

```
├── app.py              # Main Flask application with embedded dashboard
├── database.py         # SQLite database models and queries
├── file_parsers.py     # CSV, JSON, Excel parsing with statistics
├── config.py           # Configuration settings
├── requirements.txt    # Python dependencies
├── run.sh             # Linux/Mac run script
├── run.bat            # Windows run script
├── data/              # SQLite database storage (auto-created)
└── uploads/           # Temporary file uploads (auto-created)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard UI |
| `/api/upload` | POST | Upload and import a file |
| `/api/metrics` | GET | Get dashboard metrics |
| `/api/imports` | GET | List/search imports |
| `/api/imports/<id>` | GET | Get import details |
| `/api/imports/<id>` | DELETE | Delete an import |

## Dashboard Metrics

- **Total Imports**: Count of all file imports
- **Total Rows**: Sum of all rows processed
- **Total Size**: Combined size of all imported files
- **Success Rate**: Percentage of successful imports

## Charts & Visualizations

1. **Import Trends**: 30-day line chart showing import activity
2. **File Type Distribution**: Donut chart of CSV/JSON/Excel imports
3. **Hourly Activity**: Bar chart showing imports by hour of day
4. **Size Distribution**: Bar chart of file size buckets

## Configuration

Edit `config.py` to customize:

```python
DATABASE_PATH = 'data/metrics.db'  # Database location
UPLOAD_FOLDER = 'uploads'          # Upload directory
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
ALLOWED_EXTENSIONS = {'csv', 'json', 'xlsx', 'xls'}
```

## Requirements

- Python 3.8+
- Flask
- Pandas
- openpyxl (for .xlsx files)
- xlrd (for .xls files)

## Network Compatibility

This dashboard is designed for restricted/air-gapped networks:
- All CSS is embedded inline
- All JavaScript is embedded inline
- Custom SVG-based charts (no Chart.js CDN)
- No external fonts or resources
- SQLite requires no network database connection
