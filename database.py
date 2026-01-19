"""
Database module for SQLite operations and metrics storage
"""
import sqlite3
import json
from datetime import datetime
from contextlib import contextmanager
from config import DATABASE_PATH


def get_connection():
    """Create a database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_db():
    """Initialize the database with required tables"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Import history table - tracks all file imports
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS import_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                row_count INTEGER NOT NULL,
                column_count INTEGER NOT NULL,
                import_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'success',
                error_message TEXT,
                processing_time_ms INTEGER,
                checksum TEXT
            )
        ''')

        # Imported data table - stores the actual imported records
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS imported_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                import_id INTEGER NOT NULL,
                row_index INTEGER NOT NULL,
                data JSON NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE
            )
        ''')

        # Column metadata table - stores schema information
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS column_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                import_id INTEGER NOT NULL,
                column_name TEXT NOT NULL,
                column_type TEXT NOT NULL,
                null_count INTEGER DEFAULT 0,
                unique_count INTEGER DEFAULT 0,
                min_value TEXT,
                max_value TEXT,
                avg_value REAL,
                FOREIGN KEY (import_id) REFERENCES import_history(id) ON DELETE CASCADE
            )
        ''')

        # Daily metrics aggregation table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL UNIQUE,
                total_imports INTEGER DEFAULT 0,
                total_rows INTEGER DEFAULT 0,
                total_files_size INTEGER DEFAULT 0,
                successful_imports INTEGER DEFAULT 0,
                failed_imports INTEGER DEFAULT 0,
                avg_processing_time_ms REAL DEFAULT 0
            )
        ''')

        # Create indexes for better query performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_import_timestamp ON import_history(import_timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_import_id ON imported_data(import_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_metrics(date)')

        conn.commit()


def record_import(filename, file_type, file_size, row_count, column_count,
                  processing_time_ms, status='success', error_message=None, checksum=None):
    """Record a file import in the history table"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO import_history
            (filename, file_type, file_size, row_count, column_count,
             processing_time_ms, status, error_message, checksum)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (filename, file_type, file_size, row_count, column_count,
              processing_time_ms, status, error_message, checksum))

        import_id = cursor.lastrowid

        # Update daily metrics
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            INSERT INTO daily_metrics (date, total_imports, total_rows, total_files_size,
                                        successful_imports, failed_imports, avg_processing_time_ms)
            VALUES (?, 1, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                total_imports = total_imports + 1,
                total_rows = total_rows + excluded.total_rows,
                total_files_size = total_files_size + excluded.total_files_size,
                successful_imports = successful_imports + excluded.successful_imports,
                failed_imports = failed_imports + excluded.failed_imports,
                avg_processing_time_ms = (avg_processing_time_ms * (total_imports - 1) + excluded.avg_processing_time_ms) / total_imports
        ''', (today, row_count, file_size,
              1 if status == 'success' else 0,
              1 if status != 'success' else 0,
              processing_time_ms))

        return import_id


def store_imported_data(import_id, data_rows):
    """Store imported data rows"""
    with get_db() as conn:
        cursor = conn.cursor()
        for idx, row in enumerate(data_rows):
            cursor.execute('''
                INSERT INTO imported_data (import_id, row_index, data)
                VALUES (?, ?, ?)
            ''', (import_id, idx, json.dumps(row, default=str)))


def store_column_metadata(import_id, column_stats):
    """Store column metadata and statistics"""
    with get_db() as conn:
        cursor = conn.cursor()
        for col_name, stats in column_stats.items():
            cursor.execute('''
                INSERT INTO column_metadata
                (import_id, column_name, column_type, null_count, unique_count, min_value, max_value, avg_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (import_id, col_name, stats.get('type', 'unknown'),
                  stats.get('null_count', 0), stats.get('unique_count', 0),
                  str(stats.get('min_value', '')) if stats.get('min_value') is not None else None,
                  str(stats.get('max_value', '')) if stats.get('max_value') is not None else None,
                  stats.get('avg_value')))


def get_dashboard_metrics():
    """Get comprehensive metrics for the dashboard"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Overall statistics
        cursor.execute('''
            SELECT
                COUNT(*) as total_imports,
                SUM(row_count) as total_rows,
                SUM(file_size) as total_size,
                AVG(processing_time_ms) as avg_processing_time,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_imports,
                SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as failed_imports
            FROM import_history
        ''')
        overall = dict(cursor.fetchone())

        # File type distribution
        cursor.execute('''
            SELECT file_type, COUNT(*) as count, SUM(row_count) as total_rows
            FROM import_history
            GROUP BY file_type
        ''')
        file_types = [dict(row) for row in cursor.fetchall()]

        # Recent imports (last 10)
        cursor.execute('''
            SELECT id, filename, file_type, file_size, row_count, column_count,
                   import_timestamp, status, processing_time_ms
            FROM import_history
            ORDER BY import_timestamp DESC
            LIMIT 10
        ''')
        recent_imports = [dict(row) for row in cursor.fetchall()]

        # Daily trends (last 30 days)
        cursor.execute('''
            SELECT date, total_imports, total_rows, total_files_size,
                   successful_imports, failed_imports, avg_processing_time_ms
            FROM daily_metrics
            ORDER BY date DESC
            LIMIT 30
        ''')
        daily_trends = [dict(row) for row in cursor.fetchall()]

        # Hourly distribution (imports by hour of day)
        cursor.execute('''
            SELECT strftime('%H', import_timestamp) as hour, COUNT(*) as count
            FROM import_history
            GROUP BY hour
            ORDER BY hour
        ''')
        hourly_dist = [dict(row) for row in cursor.fetchall()]

        # Size distribution buckets
        cursor.execute('''
            SELECT
                CASE
                    WHEN file_size < 1024 THEN '< 1KB'
                    WHEN file_size < 10240 THEN '1-10KB'
                    WHEN file_size < 102400 THEN '10-100KB'
                    WHEN file_size < 1048576 THEN '100KB-1MB'
                    WHEN file_size < 10485760 THEN '1-10MB'
                    ELSE '> 10MB'
                END as size_bucket,
                COUNT(*) as count
            FROM import_history
            GROUP BY size_bucket
        ''')
        size_dist = [dict(row) for row in cursor.fetchall()]

        return {
            'overall': overall,
            'file_types': file_types,
            'recent_imports': recent_imports,
            'daily_trends': daily_trends,
            'hourly_distribution': hourly_dist,
            'size_distribution': size_dist
        }


def get_import_details(import_id):
    """Get detailed information about a specific import"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get import info
        cursor.execute('SELECT * FROM import_history WHERE id = ?', (import_id,))
        import_info = dict(cursor.fetchone()) if cursor.fetchone() else None

        if not import_info:
            return None

        cursor.execute('SELECT * FROM import_history WHERE id = ?', (import_id,))
        import_info = dict(cursor.fetchone())

        # Get column metadata
        cursor.execute('SELECT * FROM column_metadata WHERE import_id = ?', (import_id,))
        columns = [dict(row) for row in cursor.fetchall()]

        # Get sample data (first 100 rows)
        cursor.execute('''
            SELECT row_index, data FROM imported_data
            WHERE import_id = ?
            ORDER BY row_index
            LIMIT 100
        ''', (import_id,))
        sample_data = [{'row_index': row['row_index'], 'data': json.loads(row['data'])}
                       for row in cursor.fetchall()]

        return {
            'import_info': import_info,
            'columns': columns,
            'sample_data': sample_data
        }


def search_imports(query=None, file_type=None, start_date=None, end_date=None,
                   status=None, limit=50, offset=0):
    """Search and filter imports"""
    with get_db() as conn:
        cursor = conn.cursor()

        conditions = []
        params = []

        if query:
            conditions.append('filename LIKE ?')
            params.append(f'%{query}%')
        if file_type:
            conditions.append('file_type = ?')
            params.append(file_type)
        if start_date:
            conditions.append('DATE(import_timestamp) >= ?')
            params.append(start_date)
        if end_date:
            conditions.append('DATE(import_timestamp) <= ?')
            params.append(end_date)
        if status:
            conditions.append('status = ?')
            params.append(status)

        where_clause = ' AND '.join(conditions) if conditions else '1=1'

        cursor.execute(f'''
            SELECT * FROM import_history
            WHERE {where_clause}
            ORDER BY import_timestamp DESC
            LIMIT ? OFFSET ?
        ''', params + [limit, offset])

        results = [dict(row) for row in cursor.fetchall()]

        # Get total count
        cursor.execute(f'SELECT COUNT(*) as count FROM import_history WHERE {where_clause}', params)
        total = cursor.fetchone()['count']

        return {'results': results, 'total': total, 'limit': limit, 'offset': offset}


def delete_import(import_id):
    """Delete an import and all associated data"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM imported_data WHERE import_id = ?', (import_id,))
        cursor.execute('DELETE FROM column_metadata WHERE import_id = ?', (import_id,))
        cursor.execute('DELETE FROM import_history WHERE id = ?', (import_id,))
        return cursor.rowcount > 0


# Initialize database on module import
init_db()
