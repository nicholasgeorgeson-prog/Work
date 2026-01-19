"""
File Import Metrics Dashboard - Main Flask Application
A beautiful, self-contained tool for importing files and visualizing metrics
"""
import os
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from werkzeug.utils import secure_filename

from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, MAX_CONTENT_LENGTH
from database import (
    init_db, record_import, store_imported_data, store_column_metadata,
    get_dashboard_metrics, get_import_details, search_imports, delete_import
)
from file_parsers import parse_file, get_data_preview

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_type(filename):
    """Get file type from filename"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else None


@app.route('/')
def index():
    """Serve the main dashboard"""
    return render_template_string(DASHBOARD_HTML)


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and import"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Supported: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    filename = secure_filename(file.filename)
    file_type = get_file_type(filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    try:
        # Save the file
        file.save(filepath)
        file_size = os.path.getsize(filepath)

        # Parse and import the file
        start_time = time.time()
        data_rows, metadata, column_stats = parse_file(filepath, file_type)
        processing_time = int((time.time() - start_time) * 1000)

        # Record the import
        import_id = record_import(
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            row_count=metadata['row_count'],
            column_count=metadata['column_count'],
            processing_time_ms=processing_time,
            status='success',
            checksum=metadata.get('checksum')
        )

        # Store the data and column metadata
        store_imported_data(import_id, data_rows)
        store_column_metadata(import_id, column_stats)

        # Clean up uploaded file (optional - keep for reference)
        # os.remove(filepath)

        return jsonify({
            'success': True,
            'import_id': import_id,
            'filename': filename,
            'file_type': file_type,
            'row_count': metadata['row_count'],
            'column_count': metadata['column_count'],
            'processing_time_ms': processing_time,
            'preview': get_data_preview(data_rows, 5)
        })

    except Exception as e:
        # Record failed import
        record_import(
            filename=filename,
            file_type=file_type,
            file_size=os.path.getsize(filepath) if os.path.exists(filepath) else 0,
            row_count=0,
            column_count=0,
            processing_time_ms=0,
            status='failed',
            error_message=str(e)
        )

        return jsonify({'error': str(e)}), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get dashboard metrics"""
    try:
        metrics = get_dashboard_metrics()
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/imports', methods=['GET'])
def list_imports():
    """List and search imports"""
    query = request.args.get('query')
    file_type = request.args.get('file_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))

    try:
        results = search_imports(
            query=query, file_type=file_type,
            start_date=start_date, end_date=end_date,
            status=status, limit=limit, offset=offset
        )
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/imports/<int:import_id>', methods=['GET'])
def get_import(import_id):
    """Get details of a specific import"""
    try:
        details = get_import_details(import_id)
        if details is None:
            return jsonify({'error': 'Import not found'}), 404
        return jsonify(details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/imports/<int:import_id>', methods=['DELETE'])
def remove_import(import_id):
    """Delete an import"""
    try:
        if delete_import(import_id):
            return jsonify({'success': True})
        return jsonify({'error': 'Import not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Self-contained HTML Dashboard with embedded CSS and JavaScript
DASHBOARD_HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Import Metrics Dashboard</title>
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #ec4899;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --dark: #1e293b;
            --darker: #0f172a;
            --light: #f8fafc;
            --gray: #64748b;
            --border: #334155;
            --card-bg: #1e293b;
            --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            --gradient-4: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--darker);
            color: var(--light);
            min-height: 100vh;
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header */
        header {
            background: var(--dark);
            padding: 20px 0;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--border);
        }

        header .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: var(--gradient-1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .logo h1 {
            font-size: 24px;
            font-weight: 700;
            background: var(--gradient-1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header-actions {
            display: flex;
            gap: 15px;
        }

        /* Buttons */
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: var(--gradient-1);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: var(--card-bg);
            color: var(--light);
            border: 1px solid var(--border);
        }

        .btn-secondary:hover {
            background: var(--border);
        }

        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 24px;
            border: 1px solid var(--border);
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
        }

        .stat-card:nth-child(1)::before { background: var(--gradient-1); }
        .stat-card:nth-child(2)::before { background: var(--gradient-2); }
        .stat-card:nth-child(3)::before { background: var(--gradient-3); }
        .stat-card:nth-child(4)::before { background: var(--gradient-4); }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 16px;
        }

        .stat-card:nth-child(1) .stat-icon { background: rgba(102, 126, 234, 0.2); }
        .stat-card:nth-child(2) .stat-icon { background: rgba(236, 72, 153, 0.2); }
        .stat-card:nth-child(3) .stat-icon { background: rgba(79, 172, 254, 0.2); }
        .stat-card:nth-child(4) .stat-icon { background: rgba(67, 233, 123, 0.2); }

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .stat-label {
            color: var(--gray);
            font-size: 14px;
        }

        /* Charts Grid */
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .chart-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 24px;
            border: 1px solid var(--border);
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .chart-title {
            font-size: 18px;
            font-weight: 600;
        }

        .chart-container {
            height: 300px;
            position: relative;
        }

        /* Upload Area */
        .upload-section {
            margin-bottom: 30px;
        }

        .upload-area {
            background: var(--card-bg);
            border: 2px dashed var(--border);
            border-radius: 16px;
            padding: 60px 40px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .upload-area:hover, .upload-area.dragover {
            border-color: var(--primary);
            background: rgba(99, 102, 241, 0.1);
        }

        .upload-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: var(--gradient-1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
        }

        .upload-text h3 {
            font-size: 20px;
            margin-bottom: 8px;
        }

        .upload-text p {
            color: var(--gray);
        }

        .upload-input {
            display: none;
        }

        /* Progress Bar */
        .progress-container {
            display: none;
            margin-top: 20px;
        }

        .progress-bar {
            height: 8px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: var(--gradient-1);
            width: 0%;
            transition: width 0.3s ease;
        }

        .progress-text {
            margin-top: 10px;
            font-size: 14px;
            color: var(--gray);
        }

        /* Recent Imports Table */
        .table-section {
            background: var(--card-bg);
            border-radius: 16px;
            border: 1px solid var(--border);
            overflow: hidden;
        }

        .table-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .table-title {
            font-size: 18px;
            font-weight: 600;
        }

        .search-box {
            display: flex;
            gap: 10px;
        }

        .search-input {
            padding: 8px 16px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--darker);
            color: var(--light);
            font-size: 14px;
            width: 250px;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--primary);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 16px 24px;
            text-align: left;
        }

        th {
            background: var(--darker);
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--gray);
        }

        tr {
            border-bottom: 1px solid var(--border);
        }

        tr:hover {
            background: rgba(255, 255, 255, 0.02);
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-success {
            background: rgba(16, 185, 129, 0.2);
            color: var(--success);
        }

        .status-failed {
            background: rgba(239, 68, 68, 0.2);
            color: var(--danger);
        }

        .file-type-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .file-type-csv { background: rgba(79, 172, 254, 0.2); color: #4facfe; }
        .file-type-json { background: rgba(245, 87, 108, 0.2); color: #f5576c; }
        .file-type-xlsx, .file-type-xls { background: rgba(67, 233, 123, 0.2); color: #43e97b; }

        /* Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal {
            background: var(--card-bg);
            border-radius: 16px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: auto;
            border: 1px solid var(--border);
        }

        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-close {
            background: none;
            border: none;
            color: var(--gray);
            font-size: 24px;
            cursor: pointer;
        }

        .modal-body {
            padding: 24px;
        }

        /* Toast Notifications */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
        }

        .toast {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease;
            min-width: 300px;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .toast-success { border-left: 4px solid var(--success); }
        .toast-error { border-left: 4px solid var(--danger); }
        .toast-info { border-left: 4px solid var(--primary); }

        /* Loading Spinner */
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }

            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .table-header {
                flex-direction: column;
                gap: 15px;
            }

            .search-box {
                width: 100%;
            }

            .search-input {
                flex: 1;
            }
        }

        /* SVG Chart Styles */
        .chart-svg {
            width: 100%;
            height: 100%;
        }

        .chart-bar {
            transition: all 0.3s ease;
        }

        .chart-bar:hover {
            filter: brightness(1.2);
        }

        .chart-line {
            fill: none;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .chart-area {
            opacity: 0.3;
        }

        .chart-dot {
            transition: all 0.3s ease;
        }

        .chart-dot:hover {
            r: 8;
        }

        .pie-slice {
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .pie-slice:hover {
            filter: brightness(1.1);
            transform: scale(1.02);
            transform-origin: center;
        }

        .chart-label {
            font-size: 11px;
            fill: var(--gray);
        }

        .chart-value {
            font-size: 12px;
            font-weight: 600;
            fill: var(--light);
        }

        .legend {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: 16px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
        }

        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 3px;
        }

        /* Gauge Chart */
        .gauge-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
        }

        .gauge-value {
            font-size: 48px;
            font-weight: 700;
            margin-top: -40px;
        }

        .gauge-label {
            color: var(--gray);
            font-size: 14px;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--gray);
        }

        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">
                <div class="logo-icon">📊</div>
                <h1>Import Metrics Dashboard</h1>
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" onclick="refreshMetrics()">
                    🔄 Refresh
                </button>
                <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                    ⬆️ Import File
                </button>
            </div>
        </div>
    </header>

    <main class="container">
        <!-- Upload Section -->
        <section class="upload-section">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                    <h3>Drop files here or click to upload</h3>
                    <p>Supports CSV, JSON, and Excel files (max 50MB)</p>
                </div>
                <input type="file" id="fileInput" class="upload-input" accept=".csv,.json,.xlsx,.xls" multiple>
                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Uploading...</div>
                </div>
            </div>
        </section>

        <!-- Stats Cards -->
        <section class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <div class="stat-icon">📥</div>
                <div class="stat-value" id="totalImports">0</div>
                <div class="stat-label">Total Imports</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-value" id="totalRows">0</div>
                <div class="stat-label">Total Rows Processed</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-value" id="totalSize">0 B</div>
                <div class="stat-label">Total Data Size</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value" id="successRate">0%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </section>

        <!-- Charts Grid -->
        <section class="charts-grid">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Import Trends (Last 30 Days)</div>
                </div>
                <div class="chart-container" id="trendsChart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">File Type Distribution</div>
                </div>
                <div class="chart-container" id="fileTypeChart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Hourly Activity</div>
                </div>
                <div class="chart-container" id="hourlyChart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">File Size Distribution</div>
                </div>
                <div class="chart-container" id="sizeChart"></div>
            </div>
        </section>

        <!-- Recent Imports Table -->
        <section class="table-section">
            <div class="table-header">
                <div class="table-title">Recent Imports</div>
                <div class="search-box">
                    <input type="text" class="search-input" id="searchInput" placeholder="Search files...">
                    <button class="btn btn-secondary" onclick="searchImports()">Search</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Filename</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Rows</th>
                        <th>Columns</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="importsTable">
                    <tr>
                        <td colspan="8" class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <p>No imports yet. Upload a file to get started!</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </main>

    <!-- Import Details Modal -->
    <div class="modal-overlay" id="detailsModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Import Details</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- Content loaded dynamically -->
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <script>
        // ===== CHART RENDERING LIBRARY (SVG-based, no external dependencies) =====

        const COLORS = {
            primary: '#6366f1',
            secondary: '#ec4899',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#4facfe',
            purple: '#764ba2',
            teal: '#38f9d7',
            palette: ['#6366f1', '#ec4899', '#4facfe', '#43e97b', '#f59e0b', '#ef4444', '#764ba2', '#38f9d7']
        };

        class Chart {
            constructor(container, options = {}) {
                this.container = typeof container === 'string' ? document.getElementById(container) : container;
                this.options = options;
                this.width = this.container.clientWidth || 400;
                this.height = this.container.clientHeight || 300;
                this.padding = options.padding || { top: 20, right: 20, bottom: 40, left: 50 };
            }

            clear() {
                this.container.innerHTML = '';
            }

            createSVG() {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
                svg.setAttribute('class', 'chart-svg');
                return svg;
            }
        }

        class LineChart extends Chart {
            render(data, options = {}) {
                this.clear();
                if (!data || data.length === 0) {
                    this.container.innerHTML = '<div class="empty-state">No data available</div>';
                    return;
                }

                const svg = this.createSVG();
                const chartWidth = this.width - this.padding.left - this.padding.right;
                const chartHeight = this.height - this.padding.top - this.padding.bottom;

                const maxValue = Math.max(...data.map(d => d.value)) || 1;
                const xStep = chartWidth / (data.length - 1 || 1);

                // Create gradient
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.setAttribute('id', 'lineGradient');
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '0%');
                gradient.setAttribute('y2', '100%');

                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%');
                stop1.setAttribute('stop-color', COLORS.primary);
                stop1.setAttribute('stop-opacity', '0.5');

                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%');
                stop2.setAttribute('stop-color', COLORS.primary);
                stop2.setAttribute('stop-opacity', '0');

                gradient.appendChild(stop1);
                gradient.appendChild(stop2);
                defs.appendChild(gradient);
                svg.appendChild(defs);

                // Create area path
                let areaPath = `M ${this.padding.left} ${this.padding.top + chartHeight}`;
                let linePath = '';

                data.forEach((d, i) => {
                    const x = this.padding.left + (i * xStep);
                    const y = this.padding.top + chartHeight - (d.value / maxValue * chartHeight);

                    if (i === 0) {
                        linePath = `M ${x} ${y}`;
                        areaPath += ` L ${x} ${y}`;
                    } else {
                        linePath += ` L ${x} ${y}`;
                        areaPath += ` L ${x} ${y}`;
                    }
                });

                areaPath += ` L ${this.padding.left + (data.length - 1) * xStep} ${this.padding.top + chartHeight} Z`;

                // Draw area
                const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                area.setAttribute('d', areaPath);
                area.setAttribute('fill', 'url(#lineGradient)');
                area.setAttribute('class', 'chart-area');
                svg.appendChild(area);

                // Draw line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                line.setAttribute('d', linePath);
                line.setAttribute('stroke', COLORS.primary);
                line.setAttribute('class', 'chart-line');
                svg.appendChild(line);

                // Draw dots and labels
                data.forEach((d, i) => {
                    const x = this.padding.left + (i * xStep);
                    const y = this.padding.top + chartHeight - (d.value / maxValue * chartHeight);

                    // Dot
                    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    dot.setAttribute('cx', x);
                    dot.setAttribute('cy', y);
                    dot.setAttribute('r', 5);
                    dot.setAttribute('fill', COLORS.primary);
                    dot.setAttribute('class', 'chart-dot');
                    svg.appendChild(dot);

                    // X-axis label (every 5th or if few data points)
                    if (i % Math.max(1, Math.floor(data.length / 7)) === 0 || data.length <= 7) {
                        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        label.setAttribute('x', x);
                        label.setAttribute('y', this.height - 10);
                        label.setAttribute('text-anchor', 'middle');
                        label.setAttribute('class', 'chart-label');
                        label.textContent = d.label || '';
                        svg.appendChild(label);
                    }
                });

                // Y-axis labels
                for (let i = 0; i <= 4; i++) {
                    const value = Math.round(maxValue * (4 - i) / 4);
                    const y = this.padding.top + (chartHeight * i / 4);

                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', this.padding.left - 10);
                    label.setAttribute('y', y + 4);
                    label.setAttribute('text-anchor', 'end');
                    label.setAttribute('class', 'chart-label');
                    label.textContent = formatNumber(value);
                    svg.appendChild(label);

                    // Grid line
                    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    gridLine.setAttribute('x1', this.padding.left);
                    gridLine.setAttribute('y1', y);
                    gridLine.setAttribute('x2', this.width - this.padding.right);
                    gridLine.setAttribute('y2', y);
                    gridLine.setAttribute('stroke', '#334155');
                    gridLine.setAttribute('stroke-dasharray', '4');
                    svg.appendChild(gridLine);
                }

                this.container.appendChild(svg);
            }
        }

        class BarChart extends Chart {
            render(data, options = {}) {
                this.clear();
                if (!data || data.length === 0) {
                    this.container.innerHTML = '<div class="empty-state">No data available</div>';
                    return;
                }

                const svg = this.createSVG();
                const chartWidth = this.width - this.padding.left - this.padding.right;
                const chartHeight = this.height - this.padding.top - this.padding.bottom;

                const maxValue = Math.max(...data.map(d => d.value)) || 1;
                const barWidth = (chartWidth / data.length) * 0.7;
                const barGap = (chartWidth / data.length) * 0.3;

                // Create gradient definitions
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                COLORS.palette.forEach((color, i) => {
                    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                    gradient.setAttribute('id', `barGradient${i}`);
                    gradient.setAttribute('x1', '0%');
                    gradient.setAttribute('y1', '0%');
                    gradient.setAttribute('x2', '0%');
                    gradient.setAttribute('y2', '100%');

                    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                    stop1.setAttribute('offset', '0%');
                    stop1.setAttribute('stop-color', color);

                    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                    stop2.setAttribute('offset', '100%');
                    stop2.setAttribute('stop-color', color);
                    stop2.setAttribute('stop-opacity', '0.6');

                    gradient.appendChild(stop1);
                    gradient.appendChild(stop2);
                    defs.appendChild(gradient);
                });
                svg.appendChild(defs);

                // Draw bars
                data.forEach((d, i) => {
                    const x = this.padding.left + (i * (barWidth + barGap)) + barGap / 2;
                    const barHeight = (d.value / maxValue) * chartHeight;
                    const y = this.padding.top + chartHeight - barHeight;

                    // Bar
                    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    bar.setAttribute('x', x);
                    bar.setAttribute('y', y);
                    bar.setAttribute('width', barWidth);
                    bar.setAttribute('height', barHeight);
                    bar.setAttribute('rx', 4);
                    bar.setAttribute('fill', `url(#barGradient${i % COLORS.palette.length})`);
                    bar.setAttribute('class', 'chart-bar');
                    svg.appendChild(bar);

                    // Value label
                    const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    valueLabel.setAttribute('x', x + barWidth / 2);
                    valueLabel.setAttribute('y', y - 8);
                    valueLabel.setAttribute('text-anchor', 'middle');
                    valueLabel.setAttribute('class', 'chart-value');
                    valueLabel.textContent = formatNumber(d.value);
                    svg.appendChild(valueLabel);

                    // X-axis label
                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', x + barWidth / 2);
                    label.setAttribute('y', this.height - 10);
                    label.setAttribute('text-anchor', 'middle');
                    label.setAttribute('class', 'chart-label');
                    label.textContent = d.label || '';
                    svg.appendChild(label);
                });

                this.container.appendChild(svg);
            }
        }

        class PieChart extends Chart {
            render(data, options = {}) {
                this.clear();
                if (!data || data.length === 0) {
                    this.container.innerHTML = '<div class="empty-state">No data available</div>';
                    return;
                }

                const svg = this.createSVG();
                const centerX = this.width / 2;
                const centerY = (this.height - 60) / 2 + 10;
                const radius = Math.min(centerX, centerY) - 20;
                const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

                let currentAngle = -Math.PI / 2;

                // Draw slices
                data.forEach((d, i) => {
                    const sliceAngle = (d.value / total) * Math.PI * 2;
                    const endAngle = currentAngle + sliceAngle;

                    const x1 = centerX + radius * Math.cos(currentAngle);
                    const y1 = centerY + radius * Math.sin(currentAngle);
                    const x2 = centerX + radius * Math.cos(endAngle);
                    const y2 = centerY + radius * Math.sin(endAngle);

                    const largeArc = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                        'Z'
                    ].join(' ');

                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', pathData);
                    path.setAttribute('fill', COLORS.palette[i % COLORS.palette.length]);
                    path.setAttribute('class', 'pie-slice');
                    path.setAttribute('data-value', d.value);
                    path.setAttribute('data-label', d.label);
                    svg.appendChild(path);

                    currentAngle = endAngle;
                });

                // Add donut hole
                const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                innerCircle.setAttribute('cx', centerX);
                innerCircle.setAttribute('cy', centerY);
                innerCircle.setAttribute('r', radius * 0.5);
                innerCircle.setAttribute('fill', '#1e293b');
                svg.appendChild(innerCircle);

                // Center text
                const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                totalText.setAttribute('x', centerX);
                totalText.setAttribute('y', centerY);
                totalText.setAttribute('text-anchor', 'middle');
                totalText.setAttribute('dominant-baseline', 'middle');
                totalText.setAttribute('class', 'chart-value');
                totalText.setAttribute('font-size', '24');
                totalText.textContent = formatNumber(total);
                svg.appendChild(totalText);

                this.container.appendChild(svg);

                // Add legend
                const legend = document.createElement('div');
                legend.className = 'legend';
                data.forEach((d, i) => {
                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    item.innerHTML = `
                        <div class="legend-color" style="background: ${COLORS.palette[i % COLORS.palette.length]}"></div>
                        <span>${d.label}: ${formatNumber(d.value)} (${((d.value / total) * 100).toFixed(1)}%)</span>
                    `;
                    legend.appendChild(item);
                });
                this.container.appendChild(legend);
            }
        }

        class GaugeChart extends Chart {
            render(value, max = 100, options = {}) {
                this.clear();

                const container = document.createElement('div');
                container.className = 'gauge-container';

                const svg = this.createSVG();
                svg.setAttribute('viewBox', '0 0 200 120');

                const centerX = 100;
                const centerY = 100;
                const radius = 80;
                const percentage = Math.min(value / max, 1);

                // Background arc
                const bgArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                bgArc.setAttribute('d', this.describeArc(centerX, centerY, radius, -180, 0));
                bgArc.setAttribute('fill', 'none');
                bgArc.setAttribute('stroke', '#334155');
                bgArc.setAttribute('stroke-width', '12');
                bgArc.setAttribute('stroke-linecap', 'round');
                svg.appendChild(bgArc);

                // Value arc
                const valueArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                valueArc.setAttribute('d', this.describeArc(centerX, centerY, radius, -180, -180 + (180 * percentage)));
                valueArc.setAttribute('fill', 'none');

                const gradient = percentage >= 0.7 ? COLORS.success :
                                percentage >= 0.4 ? COLORS.warning : COLORS.danger;
                valueArc.setAttribute('stroke', gradient);
                valueArc.setAttribute('stroke-width', '12');
                valueArc.setAttribute('stroke-linecap', 'round');
                svg.appendChild(valueArc);

                container.appendChild(svg);

                const valueDiv = document.createElement('div');
                valueDiv.className = 'gauge-value';
                valueDiv.style.color = gradient;
                valueDiv.textContent = `${Math.round(value)}%`;
                container.appendChild(valueDiv);

                const labelDiv = document.createElement('div');
                labelDiv.className = 'gauge-label';
                labelDiv.textContent = options.label || 'Success Rate';
                container.appendChild(labelDiv);

                this.container.appendChild(container);
            }

            describeArc(x, y, radius, startAngle, endAngle) {
                const start = this.polarToCartesian(x, y, radius, endAngle);
                const end = this.polarToCartesian(x, y, radius, startAngle);
                const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                return [
                    "M", start.x, start.y,
                    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
                ].join(" ");
            }

            polarToCartesian(centerX, centerY, radius, angleInDegrees) {
                const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
                return {
                    x: centerX + (radius * Math.cos(angleInRadians)),
                    y: centerY + (radius * Math.sin(angleInRadians))
                };
            }
        }

        // ===== UTILITY FUNCTIONS =====

        function formatNumber(num) {
            if (num === null || num === undefined) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }

        function formatBytes(bytes) {
            if (bytes === 0 || bytes === null) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        }

        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
            `;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }

        // ===== API FUNCTIONS =====

        async function fetchMetrics() {
            try {
                const response = await fetch('/api/metrics');
                return await response.json();
            } catch (error) {
                console.error('Error fetching metrics:', error);
                return null;
            }
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                return await response.json();
            } catch (error) {
                console.error('Error uploading file:', error);
                throw error;
            }
        }

        async function fetchImportDetails(importId) {
            try {
                const response = await fetch(`/api/imports/${importId}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching import details:', error);
                return null;
            }
        }

        async function deleteImport(importId) {
            try {
                const response = await fetch(`/api/imports/${importId}`, { method: 'DELETE' });
                return await response.json();
            } catch (error) {
                console.error('Error deleting import:', error);
                throw error;
            }
        }

        // ===== UI FUNCTIONS =====

        function updateStats(metrics) {
            const overall = metrics.overall || {};
            document.getElementById('totalImports').textContent = formatNumber(overall.total_imports || 0);
            document.getElementById('totalRows').textContent = formatNumber(overall.total_rows || 0);
            document.getElementById('totalSize').textContent = formatBytes(overall.total_size || 0);

            const successRate = overall.total_imports > 0
                ? ((overall.successful_imports || 0) / overall.total_imports * 100)
                : 0;
            document.getElementById('successRate').textContent = successRate.toFixed(1) + '%';
        }

        function updateCharts(metrics) {
            // Trends Chart
            const trendsData = (metrics.daily_trends || []).reverse().map(d => ({
                label: d.date ? d.date.substring(5) : '',
                value: d.total_imports || 0
            }));
            new LineChart('trendsChart').render(trendsData);

            // File Type Pie Chart
            const fileTypeData = (metrics.file_types || []).map(d => ({
                label: (d.file_type || 'unknown').toUpperCase(),
                value: d.count || 0
            }));
            new PieChart('fileTypeChart').render(fileTypeData);

            // Hourly Bar Chart
            const hourlyData = (metrics.hourly_distribution || []).map(d => ({
                label: `${d.hour || 0}h`,
                value: d.count || 0
            }));
            new BarChart('hourlyChart').render(hourlyData);

            // Size Distribution Bar Chart
            const sizeData = (metrics.size_distribution || []).map(d => ({
                label: d.size_bucket || '',
                value: d.count || 0
            }));
            new BarChart('sizeChart').render(sizeData);
        }

        function updateImportsTable(imports) {
            const tbody = document.getElementById('importsTable');

            if (!imports || imports.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <p>No imports yet. Upload a file to get started!</p>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = imports.map(imp => `
                <tr>
                    <td><strong>${imp.filename}</strong></td>
                    <td><span class="file-type-badge file-type-${imp.file_type}">${imp.file_type}</span></td>
                    <td>${formatBytes(imp.file_size)}</td>
                    <td>${formatNumber(imp.row_count)}</td>
                    <td>${imp.column_count}</td>
                    <td><span class="status-badge status-${imp.status}">${imp.status}</span></td>
                    <td>${formatDate(imp.import_timestamp)}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="viewImportDetails(${imp.id})" style="padding: 6px 12px; font-size: 12px;">
                            👁️ View
                        </button>
                        <button class="btn btn-secondary" onclick="confirmDelete(${imp.id})" style="padding: 6px 12px; font-size: 12px; margin-left: 4px;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        async function refreshMetrics() {
            const metrics = await fetchMetrics();
            if (metrics) {
                updateStats(metrics);
                updateCharts(metrics);
                updateImportsTable(metrics.recent_imports);
            }
        }

        async function searchImports() {
            const query = document.getElementById('searchInput').value;
            try {
                const response = await fetch(`/api/imports?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                updateImportsTable(data.results);
            } catch (error) {
                showToast('Search failed', 'error');
            }
        }

        async function viewImportDetails(importId) {
            const details = await fetchImportDetails(importId);
            if (!details) {
                showToast('Failed to load import details', 'error');
                return;
            }

            const modal = document.getElementById('detailsModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');

            modalTitle.textContent = details.import_info.filename;

            const columns = details.columns || [];
            const sampleData = details.sample_data || [];

            modalBody.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px;">Import Information</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                        <div>
                            <div style="color: var(--gray); font-size: 12px;">File Type</div>
                            <div style="font-weight: 600;">${details.import_info.file_type.toUpperCase()}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 12px;">Size</div>
                            <div style="font-weight: 600;">${formatBytes(details.import_info.file_size)}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 12px;">Rows</div>
                            <div style="font-weight: 600;">${formatNumber(details.import_info.row_count)}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 12px;">Columns</div>
                            <div style="font-weight: 600;">${details.import_info.column_count}</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 12px;">Processing Time</div>
                            <div style="font-weight: 600;">${details.import_info.processing_time_ms}ms</div>
                        </div>
                        <div>
                            <div style="color: var(--gray); font-size: 12px;">Status</div>
                            <div style="font-weight: 600;">${details.import_info.status}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px;">Column Statistics</h4>
                    <div style="overflow-x: auto;">
                        <table style="font-size: 13px;">
                            <thead>
                                <tr>
                                    <th>Column</th>
                                    <th>Type</th>
                                    <th>Unique</th>
                                    <th>Nulls</th>
                                    <th>Min</th>
                                    <th>Max</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${columns.map(col => `
                                    <tr>
                                        <td><strong>${col.column_name}</strong></td>
                                        <td>${col.column_type}</td>
                                        <td>${formatNumber(col.unique_count)}</td>
                                        <td>${formatNumber(col.null_count)}</td>
                                        <td>${col.min_value || '-'}</td>
                                        <td>${col.max_value || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h4 style="margin-bottom: 12px;">Sample Data (First ${sampleData.length} rows)</h4>
                    <div style="overflow-x: auto; max-height: 300px; overflow-y: auto;">
                        <table style="font-size: 12px;">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    ${columns.map(col => `<th>${col.column_name}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${sampleData.map((row, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        ${columns.map(col => `<td>${row.data[col.column_name] ?? '-'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            modal.classList.add('active');
        }

        function closeModal() {
            document.getElementById('detailsModal').classList.remove('active');
        }

        async function confirmDelete(importId) {
            if (confirm('Are you sure you want to delete this import? This action cannot be undone.')) {
                try {
                    await deleteImport(importId);
                    showToast('Import deleted successfully', 'success');
                    refreshMetrics();
                } catch (error) {
                    showToast('Failed to delete import', 'error');
                }
            }
        }

        // ===== FILE UPLOAD HANDLING =====

        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        async function handleFiles(files) {
            for (const file of files) {
                await processFile(file);
            }
            fileInput.value = '';
        }

        async function processFile(file) {
            progressContainer.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = `Uploading ${file.name}...`;

            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                progressFill.style.width = progress + '%';
            }, 200);

            try {
                const result = await uploadFile(file);
                clearInterval(progressInterval);

                if (result.success) {
                    progressFill.style.width = '100%';
                    progressText.textContent = `✅ Successfully imported ${result.row_count} rows from ${file.name}`;
                    showToast(`Imported ${file.name}: ${result.row_count} rows`, 'success');
                    refreshMetrics();
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                progressFill.style.background = 'var(--danger)';
                progressText.textContent = `❌ Failed to import ${file.name}: ${error.message}`;
                showToast(`Failed to import ${file.name}`, 'error');
            }

            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
                progressFill.style.background = 'var(--gradient-1)';
            }, 3000);
        }

        // Close modal on outside click
        document.getElementById('detailsModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });

        // Search on Enter key
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchImports();
            }
        });

        // ===== INITIALIZATION =====

        document.addEventListener('DOMContentLoaded', () => {
            refreshMetrics();
            // Auto-refresh every 30 seconds
            setInterval(refreshMetrics, 30000);
        });
    </script>
</body>
</html>
'''


if __name__ == '__main__':
    print("=" * 60)
    print("  File Import Metrics Dashboard")
    print("  Starting server at http://localhost:5000")
    print("=" * 60)
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
