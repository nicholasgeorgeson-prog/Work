"""
File Import Metrics Dashboard - Main Flask Application
A beautiful, self-contained tool for importing files and visualizing metrics
"""
import os
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template
from werkzeug.utils import secure_filename

from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, MAX_CONTENT_LENGTH
from database import (
    init_db, record_import, store_imported_data, store_column_metadata,
    get_dashboard_metrics, get_import_details, search_imports, delete_import
)
from file_parsers import parse_file, get_data_preview
from domain_analytics import analyze_dataset, detect_dataset_type, DiagramAnalyzer, ResourceGroupAnalyzer
import pandas as pd
import json

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
    return render_template('dashboard.html')


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

        # Detect dataset type for response
        df = pd.DataFrame(data_rows)
        dataset_type = detect_dataset_type(df)

        return jsonify({
            'success': True,
            'import_id': import_id,
            'filename': filename,
            'file_type': file_type,
            'dataset_type': dataset_type,
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


@app.route('/api/imports/<int:import_id>/analyze', methods=['GET'])
def analyze_import(import_id):
    """Perform domain-specific analysis on an import"""
    try:
        details = get_import_details(import_id)
        if details is None:
            return jsonify({'error': 'Import not found'}), 404

        # Reconstruct DataFrame from stored data
        sample_data = details.get('sample_data', [])
        if not sample_data:
            return jsonify({'error': 'No data available for analysis'}), 400

        data_rows = [row['data'] for row in sample_data]
        df = pd.DataFrame(data_rows)

        # Perform domain-specific analysis
        analysis = analyze_dataset(df)

        return jsonify({
            'import_id': import_id,
            'filename': details['import_info']['filename'],
            **analysis
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/diagrams', methods=['POST'])
def analyze_diagrams_data():
    """Analyze diagram metadata from uploaded file or JSON payload"""
    try:
        if request.is_json:
            data = request.get_json()
            df = pd.DataFrame(data.get('data', []))
        elif 'file' in request.files:
            file = request.files['file']
            filename = secure_filename(file.filename)
            file_type = get_file_type(filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f'temp_{filename}')
            file.save(filepath)
            data_rows, metadata, _ = parse_file(filepath, file_type)
            df = pd.DataFrame(data_rows)
            os.remove(filepath)
        else:
            return jsonify({'error': 'No data provided'}), 400

        analyzer = DiagramAnalyzer(df)
        analysis = analyzer.get_full_analysis()

        return jsonify({
            'dataset_type': 'diagrams',
            'row_count': len(df),
            'column_count': len(df.columns),
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/resources', methods=['POST'])
def analyze_resources_data():
    """Analyze resource group data from uploaded file or JSON payload"""
    try:
        if request.is_json:
            data = request.get_json()
            df = pd.DataFrame(data.get('data', []))
        elif 'file' in request.files:
            file = request.files['file']
            filename = secure_filename(file.filename)
            file_type = get_file_type(filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f'temp_{filename}')
            file.save(filepath)
            data_rows, metadata, _ = parse_file(filepath, file_type)
            df = pd.DataFrame(data_rows)
            os.remove(filepath)
        else:
            return jsonify({'error': 'No data provided'}), 400

        analyzer = ResourceGroupAnalyzer(df)
        analysis = analyzer.get_full_analysis()

        return jsonify({
            'dataset_type': 'resource_groups',
            'row_count': len(df),
            'column_count': len(df.columns),
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("  File Import Metrics Dashboard")
    print("  Starting server at http://localhost:5000")
    print("=" * 60)
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
