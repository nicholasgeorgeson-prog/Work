#!/usr/bin/env python3
"""
Scan History & Role Aggregation System v1.0
============================================
Tracks document scans over time and aggregates roles across documents.

Features:
- Document scan history with change detection
- Role aggregation across all scanned documents
- Custom scan profiles (saved check configurations)
- Document-Role relationship tracking
- SHAREABLE ROLE DICTIONARIES for team distribution

Author: TechWriterReview
"""

import os
import json
import sqlite3
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

# Import version from centralized config
try:
    from config_logging import VERSION, get_logger
    __version__ = VERSION
    _logger = get_logger('scan_history')
except ImportError:
    __version__ = "2.6.0"
    _logger = None


def _log(msg: str, level: str = 'info'):
    if _logger:
        getattr(_logger, level)(msg)
    else:
        print(f"[ScanHistory] {msg}")


# ============================================================
# SHAREABLE DICTIONARY FILE SUPPORT
# ============================================================

MASTER_DICT_FILENAME = "role_dictionary_master.json"
LOCAL_DICT_FILENAME = "role_dictionary_local.json"

def get_dictionary_paths() -> Dict[str, Path]:
    """
    Get paths for dictionary files.
    
    Returns dict with:
    - master: Shared/team dictionary file (read-only baseline)
    - local: User's local additions
    - shared: Network/shared folder location (if configured)
    """
    app_dir = Path(__file__).parent
    
    paths = {
        'master': app_dir / MASTER_DICT_FILENAME,
        'local': app_dir / LOCAL_DICT_FILENAME,
        'shared': None
    }
    
    # Check for shared folder configuration
    config_file = app_dir / 'config.json'
    if config_file.exists():
        try:
            with open(config_file, encoding='utf-8') as f:
                config = json.load(f)
                shared_path = config.get('shared_dictionary_path')
                if shared_path:
                    shared_path = Path(shared_path)
                    # Check if path is accessible (handles network paths better)
                    try:
                        # For network paths, check if parent directory is accessible
                        if str(shared_path).startswith('\\\\') or str(shared_path).startswith('//'):
                            # UNC path - try to access it
                            if shared_path.exists():
                                paths['shared'] = shared_path / MASTER_DICT_FILENAME
                            elif shared_path.parent.exists():
                                paths['shared'] = shared_path / MASTER_DICT_FILENAME
                            else:
                                _log(f"Network path not accessible: {shared_path}. "
                                     "Ensure you have network access and proper credentials.", 'warning')
                        else:
                            # Local path
                            if shared_path.exists() or shared_path.parent.exists():
                                paths['shared'] = shared_path / MASTER_DICT_FILENAME
                    except PermissionError:
                        _log(f"Permission denied accessing: {shared_path}. "
                             "Check network credentials or run 'net use' to authenticate.", 'warning')
                    except OSError as e:
                        _log(f"Cannot access network path {shared_path}: {e}. "
                             "Ensure network drive is mapped or use 'net use' command.", 'warning')
        except Exception as e:
            _log(f"Could not read config for shared path: {e}", 'warning')
    
    return paths


def export_dictionary_to_file(roles: List[Dict], filepath: str, 
                               include_metadata: bool = True) -> Dict:
    """
    Export roles to a shareable JSON file.
    
    Args:
        roles: List of role dictionaries
        filepath: Output file path
        include_metadata: Include export timestamp and version
    
    Returns:
        Dict with success status
    """
    try:
        export_data = {
            'roles': roles,
            'version': '1.0',
            'format': 'twr_role_dictionary'
        }
        
        if include_metadata:
            export_data['exported_at'] = datetime.now().isoformat()
            export_data['exported_by'] = os.environ.get('USERNAME', os.environ.get('USER', 'unknown'))
            export_data['role_count'] = len(roles)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        return {'success': True, 'path': filepath, 'count': len(roles)}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def load_dictionary_from_file(filepath: str) -> Dict:
    """
    Load roles from a dictionary file.
    
    Args:
        filepath: Path to JSON dictionary file
    
    Returns:
        Dict with roles list and metadata
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both formats: raw list or wrapped object
        if isinstance(data, list):
            roles = data
            metadata = {}
        else:
            roles = data.get('roles', [])
            metadata = {k: v for k, v in data.items() if k != 'roles'}
        
        return {
            'success': True,
            'roles': roles,
            'metadata': metadata,
            'count': len(roles)
        }
    except FileNotFoundError:
        return {'success': False, 'error': 'File not found', 'roles': []}
    except json.JSONDecodeError as e:
        return {'success': False, 'error': f'Invalid JSON: {e}', 'roles': []}
    except Exception as e:
        return {'success': False, 'error': str(e), 'roles': []}


class ScanHistoryDB:
    """Database for tracking document scans and roles."""
    
    def __init__(self, db_path: str = None):
        """Initialize the database."""
        if db_path is None:
            # Default to app directory
            app_dir = Path(__file__).parent
            db_path = str(app_dir / "scan_history.db")
        
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize database tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Documents table - tracks each unique document
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                filepath TEXT,
                file_hash TEXT,
                first_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                scan_count INTEGER DEFAULT 1,
                word_count INTEGER,
                paragraph_count INTEGER,
                UNIQUE(filename, file_hash)
            )
        ''')
        
        # Scans table - each individual scan
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                options_json TEXT,
                issue_count INTEGER,
                score INTEGER,
                grade TEXT,
                word_count INTEGER,
                paragraph_count INTEGER,
                results_json TEXT,
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )
        ''')
        
        # Roles table - all roles found across documents
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_name TEXT UNIQUE,
                normalized_name TEXT,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                document_count INTEGER DEFAULT 1,
                total_mentions INTEGER DEFAULT 1,
                description TEXT,
                is_deliverable INTEGER DEFAULT 0,
                category TEXT
            )
        ''')
        
        # Role Dictionary - user-managed known roles for extraction
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS role_dictionary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_name TEXT NOT NULL,
                normalized_name TEXT NOT NULL,
                aliases TEXT,
                category TEXT DEFAULT 'Custom',
                source TEXT NOT NULL,
                source_document TEXT,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                is_deliverable INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'user',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by TEXT,
                notes TEXT,
                UNIQUE(normalized_name)
            )
        ''')
        
        # Create index for faster lookups
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_role_dict_normalized 
            ON role_dictionary(normalized_name)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_role_dict_active 
            ON role_dictionary(is_active)
        ''')
        
        # Document-Role relationships
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS document_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                role_id INTEGER,
                mention_count INTEGER DEFAULT 1,
                responsibilities_json TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id),
                FOREIGN KEY (role_id) REFERENCES roles(id),
                UNIQUE(document_id, role_id)
            )
        ''')
        
        # Scan profiles (saved check configurations)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scan_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                options_json TEXT NOT NULL,
                is_default INTEGER DEFAULT 0,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP
            )
        ''')
        
        # Issue changes between scans
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS issue_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                scan_id INTEGER,
                previous_scan_id INTEGER,
                issues_added INTEGER DEFAULT 0,
                issues_removed INTEGER DEFAULT 0,
                issues_unchanged INTEGER DEFAULT 0,
                change_summary_json TEXT,
                FOREIGN KEY (document_id) REFERENCES documents(id),
                FOREIGN KEY (scan_id) REFERENCES scans(id)
            )
        ''')
        
        conn.commit()
        conn.close()
        _log("Database initialized")
    
    def _get_file_hash(self, filepath: str) -> str:
        """Get MD5 hash of file for change detection."""
        try:
            with open(filepath, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""
    
    def record_scan(self, filename: str, filepath: str, results: Dict, options: Dict) -> Dict:
        """
        Record a document scan and detect changes from previous scans.
        
        Returns:
            Dict with scan_id, document_id, is_rescan, changes (if rescan)
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        file_hash = self._get_file_hash(filepath)
        
        # Check if document exists
        cursor.execute('''
            SELECT id, file_hash FROM documents 
            WHERE filename = ?
            ORDER BY last_scan DESC LIMIT 1
        ''', (filename,))
        existing = cursor.fetchone()
        
        word_count = results.get('word_count', 0)
        paragraph_count = results.get('paragraph_count', 0)
        issue_count = results.get('issue_count', 0)
        score = results.get('score', 0)
        grade = results.get('grade', 'N/A')
        
        is_rescan = False
        changes = None
        document_id = None
        
        if existing:
            document_id = existing[0]
            old_hash = existing[1]
            is_rescan = True
            
            # Update document record
            cursor.execute('''
                UPDATE documents 
                SET last_scan = CURRENT_TIMESTAMP,
                    scan_count = scan_count + 1,
                    word_count = ?,
                    paragraph_count = ?,
                    file_hash = ?
                WHERE id = ?
            ''', (word_count, paragraph_count, file_hash, document_id))
            
            # Get previous scan for comparison
            cursor.execute('''
                SELECT id, issue_count, results_json FROM scans
                WHERE document_id = ?
                ORDER BY scan_time DESC LIMIT 1
            ''', (document_id,))
            prev_scan = cursor.fetchone()
            
            if prev_scan:
                prev_scan_id = prev_scan[0]
                prev_issue_count = prev_scan[1]
                prev_results = json.loads(prev_scan[2]) if prev_scan[2] else {}
                
                # Calculate changes
                changes = self._calculate_changes(
                    prev_results.get('issues', []),
                    results.get('issues', [])
                )
                changes['file_changed'] = (file_hash != old_hash)
        else:
            # Insert new document
            cursor.execute('''
                INSERT INTO documents (filename, filepath, file_hash, word_count, paragraph_count)
                VALUES (?, ?, ?, ?, ?)
            ''', (filename, filepath, file_hash, word_count, paragraph_count))
            document_id = cursor.lastrowid
        
        # Record the scan
        cursor.execute('''
            INSERT INTO scans (document_id, options_json, issue_count, score, grade, 
                              word_count, paragraph_count, results_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            document_id, 
            json.dumps(options),
            issue_count,
            score,
            grade,
            word_count,
            paragraph_count,
            json.dumps(results)
        ))
        scan_id = cursor.lastrowid
        
        # Record changes if rescan
        if is_rescan and changes:
            cursor.execute('''
                INSERT INTO issue_changes (document_id, scan_id, previous_scan_id,
                                          issues_added, issues_removed, issues_unchanged,
                                          change_summary_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                document_id, scan_id, prev_scan_id if prev_scan else None,
                changes['added'], changes['removed'], changes['unchanged'],
                json.dumps(changes)
            ))
        
        # Process roles from results
        if results.get('roles'):
            self._process_roles(cursor, document_id, results['roles'])
        
        # v2.9.4.1: Fix BUG-L01 - Optimized commit with verification using same connection
        try:
            conn.commit()
            
            # Verify the scan was recorded (same connection, no overhead)
            cursor.execute('SELECT id FROM scans WHERE id = ?', (scan_id,))
            if cursor.fetchone() is None:
                import logging
                logging.getLogger('scan_history').warning(f"Scan {scan_id} not found after commit")
                
        except Exception as commit_err:
            import logging
            logging.getLogger('scan_history').error(f"Commit error: {commit_err}")
        finally:
            conn.close()
        
        return {
            'scan_id': scan_id,
            'document_id': document_id,
            'is_rescan': is_rescan,
            'scan_count': existing[0] if existing else 1,
            'changes': changes
        }
    
    def _calculate_changes(self, old_issues: List[Dict], new_issues: List[Dict]) -> Dict:
        """Calculate differences between two issue lists."""
        # Create fingerprints for comparison
        def fingerprint(issue):
            return (
                issue.get('category', ''),
                issue.get('message', '')[:50],
                issue.get('paragraph_index', 0)
            )
        
        old_fps = set(fingerprint(i) for i in old_issues)
        new_fps = set(fingerprint(i) for i in new_issues)
        
        added = new_fps - old_fps
        removed = old_fps - new_fps
        unchanged = old_fps & new_fps
        
        return {
            'added': len(added),
            'removed': len(removed),
            'unchanged': len(unchanged),
            'added_categories': self._categorize_changes(new_issues, added),
            'removed_categories': self._categorize_changes(old_issues, removed)
        }
    
    def _categorize_changes(self, issues: List[Dict], fingerprints: set) -> Dict[str, int]:
        """Group changes by category."""
        def fingerprint(issue):
            return (
                issue.get('category', ''),
                issue.get('message', '')[:50],
                issue.get('paragraph_index', 0)
            )
        
        categories = {}
        for issue in issues:
            if fingerprint(issue) in fingerprints:
                cat = issue.get('category', 'Unknown')
                categories[cat] = categories.get(cat, 0) + 1
        
        return categories
    
    def _process_roles(self, cursor, document_id: int, roles_data: Dict):
        """Process and store role data from scan results."""
        if not roles_data:
            return
        
        # Handle both formats: {role_name: data} or {'roles': {role_name: data}}
        roles = roles_data.get('roles', roles_data)
        if not isinstance(roles, dict):
            return
        
        # Deliverables list (common document types, not roles)
        deliverables = {
            'verification cross reference matrix', 'vcr', 'verification matrix',
            'requirements document', 'specification', 'test plan', 'test report',
            'design document', 'interface control document', 'icd', 'sow',
            'statement of work', 'proposal', 'report', 'analysis', 'study',
            'plan', 'procedure', 'instruction', 'manual', 'guide'
        }
        
        for role_name, role_data in roles.items():
            if not role_name or not isinstance(role_data, dict):
                continue
            
            # Normalize role name
            normalized = role_name.lower().strip()
            
            # Check if this is likely a deliverable, not a role
            is_deliverable = any(d in normalized for d in deliverables)
            
            # Determine category
            category = 'Role'
            if is_deliverable:
                category = 'Deliverable'
            elif 'manager' in normalized or 'lead' in normalized:
                category = 'Management'
            elif 'engineer' in normalized or 'analyst' in normalized:
                category = 'Technical'
            
            # Check if role exists
            cursor.execute('SELECT id, document_count, total_mentions FROM roles WHERE normalized_name = ?',
                          (normalized,))
            existing = cursor.fetchone()
            
            mention_count = len(role_data.get('mentions', [])) or 1
            
            if existing:
                role_id = existing[0]
                cursor.execute('''
                    UPDATE roles SET 
                        document_count = document_count + 1,
                        total_mentions = total_mentions + ?
                    WHERE id = ?
                ''', (mention_count, role_id))
            else:
                cursor.execute('''
                    INSERT INTO roles (role_name, normalized_name, total_mentions, 
                                      is_deliverable, category, description)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    role_name, normalized, mention_count, 
                    1 if is_deliverable else 0, category,
                    role_data.get('description', '')
                ))
                role_id = cursor.lastrowid
            
            # Update document-role relationship
            responsibilities = role_data.get('responsibilities', [])
            cursor.execute('''
                INSERT INTO document_roles (document_id, role_id, mention_count, responsibilities_json)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(document_id, role_id) DO UPDATE SET
                    mention_count = mention_count + excluded.mention_count,
                    responsibilities_json = excluded.responsibilities_json,
                    last_updated = CURRENT_TIMESTAMP
            ''', (document_id, role_id, mention_count, json.dumps(responsibilities)))
    
    def get_scan_history(self, filename: str = None, limit: int = 50) -> List[Dict]:
        """Get scan history, optionally filtered by filename.

        v3.0.76: Added role_count to results for Document Log display.
        v3.0.110: Added document_id for document comparison feature.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if filename:
            cursor.execute('''
                SELECT s.id, d.filename, s.scan_time, s.issue_count, s.score, s.grade,
                       s.word_count, ic.issues_added, ic.issues_removed,
                       (SELECT COUNT(*) FROM document_roles dr WHERE dr.document_id = d.id) as role_count,
                       d.id as document_id
                FROM scans s
                JOIN documents d ON s.document_id = d.id
                LEFT JOIN issue_changes ic ON s.id = ic.scan_id
                WHERE d.filename = ?
                ORDER BY s.scan_time DESC LIMIT ?
            ''', (filename, limit))
        else:
            cursor.execute('''
                SELECT s.id, d.filename, s.scan_time, s.issue_count, s.score, s.grade,
                       s.word_count, ic.issues_added, ic.issues_removed,
                       (SELECT COUNT(*) FROM document_roles dr WHERE dr.document_id = d.id) as role_count,
                       d.id as document_id
                FROM scans s
                JOIN documents d ON s.document_id = d.id
                LEFT JOIN issue_changes ic ON s.id = ic.scan_id
                ORDER BY s.scan_time DESC LIMIT ?
            ''', (limit,))

        results = []
        for row in cursor.fetchall():
            results.append({
                'scan_id': row[0],
                'filename': row[1],
                'scan_time': row[2],
                'issue_count': row[3],
                'score': row[4],
                'grade': row[5],
                'word_count': row[6],
                'issues_added': row[7] or 0,
                'issues_removed': row[8] or 0,
                'role_count': row[9] or 0,
                'document_id': row[10]
            })
        
        conn.close()
        return results
    
    def get_score_trend(self, filename: str, limit: int = 10) -> List[Dict]:
        """Get quality score trend for a specific document.
        
        v3.0.33 Chunk E: Returns score history for sparkline visualization.
        
        Args:
            filename: Document filename to get trend for
            limit: Maximum number of historical scores (default: 10)
        
        Returns:
            List of dicts with scan_time, score, grade, issue_count
            Ordered oldest to newest for sparkline display
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.scan_time, s.score, s.grade, s.issue_count
            FROM scans s
            JOIN documents d ON s.document_id = d.id
            WHERE d.filename = ?
            ORDER BY s.scan_time DESC
            LIMIT ?
        ''', (filename, limit))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'scan_time': row[0],
                'score': row[1],
                'grade': row[2],
                'issue_count': row[3]
            })
        
        conn.close()
        
        # Reverse to oldest-first for sparkline display
        return list(reversed(results))
    
    def get_score_trend_by_id(self, document_id: int, limit: int = 10) -> List[Dict]:
        """Get quality score trend for a document by its ID.
        
        v3.0.35: More reliable than filename matching for edge cases.
        
        Args:
            document_id: Document ID from database
            limit: Maximum number of historical scores (default: 10)
        
        Returns:
            List of dicts with scan_time, score, grade, issue_count
            Ordered oldest to newest for sparkline display
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.scan_time, s.score, s.grade, s.issue_count
            FROM scans s
            WHERE s.document_id = ?
            ORDER BY s.scan_time DESC
            LIMIT ?
        ''', (document_id, limit))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'scan_time': row[0],
                'score': row[1],
                'grade': row[2],
                'issue_count': row[3]
            })
        
        conn.close()
        
        # Reverse to oldest-first for sparkline display
        return list(reversed(results))
    
    def get_all_roles(self, include_deliverables: bool = False) -> List[Dict]:
        """Get aggregated roles across all documents.
        
        v3.0.69: Added responsibility_count and unique_document_count fields.
        - responsibility_count: Total responsibilities extracted for this role
        - unique_document_count: Count of unique documents (not re-scans)
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT r.id, r.role_name, r.normalized_name, r.document_count, 
                   r.total_mentions, r.category, r.is_deliverable,
                   GROUP_CONCAT(DISTINCT d.filename) as documents,
                   GROUP_CONCAT(dr.responsibilities_json, '|||') as all_responsibilities
            FROM roles r
            LEFT JOIN document_roles dr ON r.id = dr.role_id
            LEFT JOIN documents d ON dr.document_id = d.id
        '''
        
        if not include_deliverables:
            query += ' WHERE r.is_deliverable = 0'
        
        query += ' GROUP BY r.id ORDER BY r.document_count DESC, r.total_mentions DESC'
        
        cursor.execute(query)
        
        results = []
        for row in cursor.fetchall():
            documents = row[7].split(',') if row[7] else []
            unique_docs = list(set(documents))  # Dedupe
            
            # v3.0.69: Count responsibilities from all document_roles entries
            responsibility_count = 0
            if row[8]:  # all_responsibilities concatenated with |||
                resp_chunks = row[8].split('|||')
                for chunk in resp_chunks:
                    if chunk and chunk.strip():
                        try:
                            resp_list = json.loads(chunk)
                            if isinstance(resp_list, list):
                                responsibility_count += len(resp_list)
                        except (json.JSONDecodeError, TypeError):
                            pass
            
            results.append({
                'id': row[0],
                'role_name': row[1],
                'normalized_name': row[2],
                'document_count': row[3],  # Legacy: total scan count
                'unique_document_count': len(unique_docs),  # v3.0.69: Unique docs
                'total_mentions': row[4],
                'responsibility_count': responsibility_count,  # v3.0.69: Total responsibilities
                'category': row[5],
                'is_deliverable': bool(row[6]),
                'documents': unique_docs
            })
        
        conn.close()
        return results
    
    def get_document_roles(self, document_id: int) -> List[Dict]:
        """Get roles for a specific document.
        
        v3.0.80: Added for per-document role export functionality.
        
        Args:
            document_id: The ID of the document to get roles for
            
        Returns:
            List of role dictionaries with name, category, mentions, responsibilities
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT r.id, r.role_name, r.normalized_name, r.category, r.is_deliverable,
                   dr.mention_count, dr.responsibilities_json
            FROM document_roles dr
            JOIN roles r ON dr.role_id = r.id
            WHERE dr.document_id = ?
            ORDER BY dr.mention_count DESC, r.role_name
        ''', (document_id,))
        
        results = []
        for row in cursor.fetchall():
            responsibilities = []
            if row[6]:
                try:
                    responsibilities = json.loads(row[6])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            results.append({
                'id': row[0],
                'role_name': row[1],
                'normalized_name': row[2],
                'category': row[3] or 'unknown',
                'is_deliverable': bool(row[4]),
                'mention_count': row[5] or 0,
                'responsibilities': responsibilities if isinstance(responsibilities, list) else []
            })
        
        conn.close()
        return results
    
    def get_role_document_matrix(self) -> Dict:
        """Get a matrix of roles vs documents for visualization."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get all documents
        cursor.execute('SELECT id, filename FROM documents ORDER BY filename')
        documents = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Get all roles (excluding deliverables)
        cursor.execute('SELECT id, role_name FROM roles WHERE is_deliverable = 0 ORDER BY role_name')
        roles = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Get relationships
        cursor.execute('''
            SELECT document_id, role_id, mention_count 
            FROM document_roles
        ''')
        
        matrix = {}
        for row in cursor.fetchall():
            doc_id, role_id, count = row
            if doc_id in documents and role_id in roles:
                if role_id not in matrix:
                    matrix[role_id] = {}
                matrix[role_id][doc_id] = count
        
        conn.close()
        
        return {
            'documents': documents,
            'roles': roles,
            'connections': matrix
        }
    
    # Scan Profile Methods
    def save_scan_profile(self, name: str, options: Dict, description: str = "", 
                          set_default: bool = False) -> int:
        """Save a scan profile (check configuration)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if set_default:
            # Clear other defaults
            cursor.execute('UPDATE scan_profiles SET is_default = 0')
        
        cursor.execute('''
            INSERT INTO scan_profiles (name, description, options_json, is_default)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                description = excluded.description,
                options_json = excluded.options_json,
                is_default = excluded.is_default
        ''', (name, description, json.dumps(options), 1 if set_default else 0))
        
        profile_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return profile_id
    
    def get_scan_profiles(self) -> List[Dict]:
        """Get all saved scan profiles."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, description, options_json, is_default, created, last_used
            FROM scan_profiles ORDER BY is_default DESC, name
        ''')
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'options': json.loads(row[3]),
                'is_default': bool(row[4]),
                'created': row[5],
                'last_used': row[6]
            })
        
        conn.close()
        return results
    
    def get_default_profile(self) -> Optional[Dict]:
        """Get the default scan profile."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, options_json FROM scan_profiles 
            WHERE is_default = 1 LIMIT 1
        ''')
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row[0],
                'name': row[1],
                'options': json.loads(row[2])
            }
        return None
    
    def delete_scan_profile(self, profile_id: int) -> bool:
        """Delete a scan profile."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM scan_profiles WHERE id = ?', (profile_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted
    
    def delete_scan(self, scan_id: int) -> Dict:
        """
        Delete a scan record and clean up related data.
        
        Args:
            scan_id: The ID of the scan to delete
            
        Returns:
            Dict with success status and message
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # First, get the document_id for this scan
            cursor.execute('SELECT document_id FROM scans WHERE id = ?', (scan_id,))
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                return {'success': False, 'message': 'Scan not found'}
            
            document_id = row[0]
            
            # Delete issue_changes for this scan
            cursor.execute('DELETE FROM issue_changes WHERE scan_id = ?', (scan_id,))
            
            # Delete the scan itself
            cursor.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
            scan_deleted = cursor.rowcount > 0
            
            # Check if document has any remaining scans
            cursor.execute('SELECT COUNT(*) FROM scans WHERE document_id = ?', (document_id,))
            remaining_scans = cursor.fetchone()[0]
            
            document_deleted = False
            if remaining_scans == 0:
                # No more scans for this document - clean up
                cursor.execute('DELETE FROM document_roles WHERE document_id = ?', (document_id,))
                cursor.execute('DELETE FROM documents WHERE id = ?', (document_id,))
                document_deleted = True
                _log(f"Deleted document {document_id} (no remaining scans)")
            
            conn.commit()
            conn.close()
            
            return {
                'success': scan_deleted,
                'message': 'Scan deleted successfully',
                'document_deleted': document_deleted
            }
            
        except Exception as e:
            conn.rollback()
            conn.close()
            _log(f"Error deleting scan {scan_id}: {e}", 'error')
            return {'success': False, 'message': str(e)}
    
    def use_profile(self, profile_id: int):
        """Mark a profile as used (update last_used timestamp)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE scan_profiles SET last_used = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (profile_id,))
        conn.commit()
        conn.close()
    
    def get_role_graph_data(self, max_nodes: int = 100, min_weight: int = 1) -> Dict:
        """
        Get graph data for D3.js visualization of role-document relationships.
        
        Returns a compact graph model with:
        - nodes: roles and documents with stable IDs
        - links: role-document connections with weights
        - aggregates: counts and top terms
        
        Args:
            max_nodes: Maximum number of nodes to return (for performance)
            min_weight: Minimum edge weight to include
            
        Returns:
            Dict with nodes, links, role_counts, doc_counts
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get documents with their stats
        cursor.execute('''
            SELECT d.id, d.filename, COUNT(dr.id) as role_count, 
                   COALESCE(SUM(dr.mention_count), 0) as total_mentions
            FROM documents d
            LEFT JOIN document_roles dr ON d.id = dr.document_id
            GROUP BY d.id
            ORDER BY role_count DESC
            LIMIT ?
        ''', (max_nodes // 2,))
        
        documents = []
        doc_id_map = {}
        for row in cursor.fetchall():
            stable_id = f"doc_{row[0]}"
            doc_id_map[row[0]] = stable_id
            documents.append({
                'id': stable_id,
                'db_id': row[0],
                'label': row[1],
                'type': 'document',
                'role_count': row[2],
                'total_mentions': row[3]
            })
        
        # Get roles with their stats (excluding deliverables)
        cursor.execute('''
            SELECT r.id, r.role_name, r.normalized_name, r.category,
                   r.document_count, r.total_mentions
            FROM roles r
            WHERE r.is_deliverable = 0
            ORDER BY r.document_count DESC, r.total_mentions DESC
            LIMIT ?
        ''', (max_nodes // 2,))
        
        roles = []
        role_id_map = {}
        for row in cursor.fetchall():
            stable_id = f"role_{row[0]}"
            role_id_map[row[0]] = stable_id
            roles.append({
                'id': stable_id,
                'db_id': row[0],
                'label': row[2] or row[1],  # Prefer normalized name
                'original_name': row[1],
                'type': 'role',
                'category': row[3] or 'Unknown',
                'document_count': row[4],
                'total_mentions': row[5]
            })
        
        # Get edges (document-role relationships)
        doc_ids = list(doc_id_map.keys())
        role_ids = list(role_id_map.keys())
        
        if doc_ids and role_ids:
            placeholders_docs = ','.join('?' * len(doc_ids))
            placeholders_roles = ','.join('?' * len(role_ids))
            
            cursor.execute(f'''
                SELECT document_id, role_id, mention_count, responsibilities_json
                FROM document_roles
                WHERE document_id IN ({placeholders_docs})
                  AND role_id IN ({placeholders_roles})
                  AND mention_count >= ?
                ORDER BY mention_count DESC
            ''', doc_ids + role_ids + [min_weight])
            
            links = []
            for row in cursor.fetchall():
                doc_stable_id = doc_id_map.get(row[0])
                role_stable_id = role_id_map.get(row[1])
                if doc_stable_id and role_stable_id:
                    # Parse responsibilities for top terms
                    top_terms = []
                    if row[3]:
                        try:
                            resp_data = json.loads(row[3])
                            if isinstance(resp_data, list):
                                for r in resp_data[:3]:
                                    if isinstance(r, dict) and 'verb' in r:
                                        top_terms.append(r['verb'])
                                    elif isinstance(r, str):
                                        words = r.split()[:2]
                                        top_terms.append(' '.join(words))
                        except (json.JSONDecodeError, TypeError):
                            pass
                    
                    links.append({
                        'source': role_stable_id,
                        'target': doc_stable_id,
                        'weight': row[2],
                        'top_terms': top_terms[:3],
                        'link_type': 'role-document'
                    })
        else:
            links = []
        
        # Add role-to-role links based on co-occurrence in documents
        # This shows which roles work together
        if len(role_ids) >= 2:
            # Find roles that appear together in the same documents
            cursor.execute(f'''
                SELECT dr1.role_id, dr2.role_id, COUNT(DISTINCT dr1.document_id) as shared_docs
                FROM document_roles dr1
                JOIN document_roles dr2 ON dr1.document_id = dr2.document_id 
                    AND dr1.role_id < dr2.role_id
                WHERE dr1.role_id IN ({placeholders_roles})
                  AND dr2.role_id IN ({placeholders_roles})
                GROUP BY dr1.role_id, dr2.role_id
                HAVING shared_docs >= ?
                ORDER BY shared_docs DESC
                LIMIT 50
            ''', role_ids + role_ids + [min_weight])
            
            for row in cursor.fetchall():
                role1_stable_id = role_id_map.get(row[0])
                role2_stable_id = role_id_map.get(row[1])
                if role1_stable_id and role2_stable_id:
                    links.append({
                        'source': role1_stable_id,
                        'target': role2_stable_id,
                        'weight': row[2],
                        'link_type': 'role-role',
                        'shared_documents': row[2]
                    })
        
        conn.close()
        
        # Combine nodes
        nodes = roles + documents
        
        # Create aggregates
        role_counts = {
            r['id']: {
                'mentions': r['total_mentions'],
                'docs': r['document_count'],
                'category': r['category']
            } for r in roles
        }
        
        doc_counts = {
            d['id']: {
                'roles_count': d['role_count'],
                'mentions_total': d['total_mentions']
            } for d in documents
        }
        
        # Count link types
        role_doc_links = sum(1 for l in links if l.get('link_type') == 'role-document')
        role_role_links = sum(1 for l in links if l.get('link_type') == 'role-role')
        
        return {
            'nodes': nodes,
            'links': links,
            'role_counts': role_counts,
            'doc_counts': doc_counts,
            'meta': {
                'total_roles': len(roles),
                'total_documents': len(documents),
                'total_links': len(links),
                'role_doc_links': role_doc_links,
                'role_role_links': role_role_links,
                'max_nodes': max_nodes,
                'min_weight': min_weight
            }
        }
    
    # ================================================================
    # ROLE DICTIONARY MANAGEMENT
    # ================================================================
    
    def get_role_dictionary(self, include_inactive: bool = False) -> List[Dict]:
        """Get all roles from the role dictionary."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT id, role_name, normalized_name, aliases, category, source,
                   source_document, description, is_active, is_deliverable,
                   created_at, created_by, updated_at, updated_by, notes
            FROM role_dictionary
        '''
        if not include_inactive:
            query += ' WHERE is_active = 1'
        query += ' ORDER BY role_name'
        
        cursor.execute(query)
        
        roles = []
        for row in cursor.fetchall():
            aliases = []
            if row[3]:
                try:
                    aliases = json.loads(row[3])
                except Exception:
                    aliases = [a.strip() for a in row[3].split(',') if a.strip()]
            
            roles.append({
                'id': row[0],
                'role_name': row[1],
                'normalized_name': row[2],
                'aliases': aliases,
                'category': row[4],
                'source': row[5],
                'source_document': row[6],
                'description': row[7],
                'is_active': bool(row[8]),
                'is_deliverable': bool(row[9]),
                'created_at': row[10],
                'created_by': row[11],
                'updated_at': row[12],
                'updated_by': row[13],
                'notes': row[14]
            })
        
        conn.close()
        return roles
    
    def add_role_to_dictionary(self, role_name: str, source: str, **kwargs) -> Dict:
        """
        Add a new role to the dictionary.
        
        Args:
            role_name: The role name to add
            source: Where it came from ('builtin', 'upload', 'adjudication', 'manual')
            **kwargs: Optional fields like category, aliases, description, etc.
        
        Returns:
            Dict with success status and role data or error
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        normalized = role_name.lower().strip()
        aliases = kwargs.get('aliases', [])
        if isinstance(aliases, list):
            aliases_json = json.dumps(aliases)
        else:
            aliases_json = aliases
        
        try:
            cursor.execute('''
                INSERT INTO role_dictionary 
                (role_name, normalized_name, aliases, category, source, source_document,
                 description, is_active, is_deliverable, created_by, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                role_name,
                normalized,
                aliases_json,
                kwargs.get('category', 'Custom'),
                source,
                kwargs.get('source_document'),
                kwargs.get('description'),
                1 if kwargs.get('is_active', True) else 0,
                1 if kwargs.get('is_deliverable', False) else 0,
                kwargs.get('created_by', 'user'),
                kwargs.get('notes')
            ))
            conn.commit()
            role_id = cursor.lastrowid
            
            conn.close()
            return {
                'success': True,
                'id': role_id,
                'role_name': role_name,
                'normalized_name': normalized
            }
        except sqlite3.IntegrityError:
            conn.close()
            return {
                'success': False,
                'error': f'Role "{role_name}" already exists in dictionary'
            }
        except Exception as e:
            conn.close()
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_role_in_dictionary(self, role_id: int, updated_by: str = 'user', **kwargs) -> Dict:
        """Update an existing role in the dictionary."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build update query dynamically based on provided fields
        allowed_fields = ['role_name', 'aliases', 'category', 'description', 
                         'is_active', 'is_deliverable', 'notes']
        
        updates = []
        values = []
        
        for field in allowed_fields:
            if field in kwargs:
                value = kwargs[field]
                if field == 'aliases' and isinstance(value, list):
                    value = json.dumps(value)
                elif field in ('is_active', 'is_deliverable'):
                    value = 1 if value else 0
                updates.append(f'{field} = ?')
                values.append(value)
        
        if 'role_name' in kwargs:
            updates.append('normalized_name = ?')
            values.append(kwargs['role_name'].lower().strip())
        
        updates.append('updated_at = CURRENT_TIMESTAMP')
        updates.append('updated_by = ?')
        values.append(updated_by)
        
        values.append(role_id)
        
        try:
            cursor.execute(f'''
                UPDATE role_dictionary
                SET {', '.join(updates)}
                WHERE id = ?
            ''', values)
            conn.commit()
            
            success = cursor.rowcount > 0
            conn.close()
            
            return {
                'success': success,
                'updated': success
            }
        except Exception as e:
            conn.close()
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_role_from_dictionary(self, role_id: int, soft_delete: bool = True) -> Dict:
        """Delete or deactivate a role from the dictionary."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            if soft_delete:
                cursor.execute('''
                    UPDATE role_dictionary
                    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (role_id,))
            else:
                cursor.execute('DELETE FROM role_dictionary WHERE id = ?', (role_id,))
            
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            
            return {'success': success, 'deleted': success}
        except Exception as e:
            conn.close()
            return {'success': False, 'error': str(e)}
    
    def import_roles_to_dictionary(self, roles: List[Dict], source: str, 
                                   source_document: str = None,
                                   created_by: str = 'import') -> Dict:
        """
        Bulk import roles to the dictionary.
        
        Args:
            roles: List of role dicts with at least 'role_name'
            source: Source identifier ('upload', 'adjudication', 'builtin')
            source_document: Document name if from upload
            created_by: User identifier
        
        Returns:
            Dict with counts of added, skipped, errors
        """
        results = {
            'added': 0,
            'skipped': 0,
            'errors': [],
            'total': len(roles)
        }
        
        for role in roles:
            role_name = role.get('role_name') or role.get('name')
            if not role_name:
                results['errors'].append('Missing role_name')
                continue
            
            result = self.add_role_to_dictionary(
                role_name=role_name,
                source=source,
                source_document=source_document,
                category=role.get('category', 'Imported'),
                aliases=role.get('aliases', []),
                description=role.get('description'),
                is_deliverable=role.get('is_deliverable', False),
                created_by=created_by,
                notes=role.get('notes')
            )
            
            if result['success']:
                results['added'] += 1
            else:
                if 'already exists' in result.get('error', ''):
                    results['skipped'] += 1
                else:
                    results['errors'].append(result.get('error'))
        
        return results
    
    def get_active_role_names(self) -> List[str]:
        """Get list of active role names for use in extraction."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT role_name, aliases FROM role_dictionary
            WHERE is_active = 1 AND is_deliverable = 0
        ''')
        
        role_names = []
        for row in cursor.fetchall():
            role_names.append(row[0])
            # Also add aliases
            if row[1]:
                try:
                    aliases = json.loads(row[1])
                    role_names.extend(aliases)
                except Exception:
                    pass
        
        conn.close()
        return role_names
    
    def seed_builtin_roles(self) -> Dict:
        """
        Seed the dictionary with built-in known roles.
        v2.9.1 E1: Expanded from 27 to 175 aerospace/defense roles.
        """
        builtin_roles = [
            # ================================================================
            # PROGRAM MANAGEMENT (15 roles)
            # ================================================================
            {'role_name': 'Program Manager', 'category': 'Program Management',
             'aliases': ['PM', 'Program Mgr', 'Programme Manager']},
            {'role_name': 'Deputy Program Manager', 'category': 'Program Management',
             'aliases': ['Deputy PM', 'DPM', 'Asst Program Manager']},
            {'role_name': 'Project Manager', 'category': 'Program Management',
             'aliases': ['Project Mgr', 'Project Lead']},
            {'role_name': 'IPT Lead', 'category': 'Program Management',
             'aliases': ['IPT Leader', 'Integrated Product Team Lead']},
            {'role_name': 'CAM', 'category': 'Program Management',
             'aliases': ['Control Account Manager', 'CAMs']},
            {'role_name': 'EVMS Analyst', 'category': 'Program Management',
             'aliases': ['Earned Value Analyst', 'EVM Analyst']},
            {'role_name': 'Program Control Analyst', 'category': 'Program Management',
             'aliases': ['Program Controls', 'PC Analyst']},
            {'role_name': 'Scheduler', 'category': 'Program Management',
             'aliases': ['Program Scheduler', 'Master Scheduler', 'IMS Manager']},
            {'role_name': 'Risk Manager', 'category': 'Program Management',
             'aliases': ['Risk Analyst', 'Program Risk Manager']},
            {'role_name': 'Technical Program Manager', 'category': 'Program Management',
             'aliases': ['TPM', 'Tech PM']},
            {'role_name': 'Business Manager', 'category': 'Program Management',
             'aliases': ['Business Operations Manager', 'Program Business Manager']},
            {'role_name': 'Cost Analyst', 'category': 'Program Management',
             'aliases': ['Cost Estimator', 'Pricing Analyst']},
            {'role_name': 'Resource Manager', 'category': 'Program Management',
             'aliases': ['Resource Coordinator', 'Staff Manager']},
            {'role_name': 'Program Integrator', 'category': 'Program Management',
             'aliases': ['Integration Lead', 'Program Integration Lead']},
            {'role_name': 'Transition Manager', 'category': 'Program Management',
             'aliases': ['Transition Lead', 'Program Transition Manager']},
            
            # ================================================================
            # SYSTEMS ENGINEERING (20 roles)
            # ================================================================
            {'role_name': 'Chief Systems Engineer', 'category': 'Systems Engineering',
             'aliases': ['CSE', 'Chief SE', 'Lead Systems Engineer']},
            {'role_name': 'Systems Engineer', 'category': 'Systems Engineering',
             'aliases': ['SE', 'System Engineer', 'Systems Engineers']},
            {'role_name': 'Lead Systems Engineer', 'category': 'Systems Engineering',
             'aliases': ['LSE', 'Lead SE', 'Senior SE']},
            {'role_name': 'Requirements Engineer', 'category': 'Systems Engineering',
             'aliases': ['Requirements Analyst', 'Req Engineer', 'Requirements Manager']},
            {'role_name': 'Interface Engineer', 'category': 'Systems Engineering',
             'aliases': ['Interface Control Engineer', 'ICE', 'I&I Engineer']},
            {'role_name': 'MBSE Lead', 'category': 'Systems Engineering',
             'aliases': ['Model-Based SE Lead', 'MBSE Engineer', 'Digital Engineer']},
            {'role_name': 'V&V Engineer', 'category': 'Systems Engineering',
             'aliases': ['Verification Engineer', 'Validation Engineer', 'V&V Lead']},
            {'role_name': 'Systems Architect', 'category': 'Systems Engineering',
             'aliases': ['System Architect', 'Architecture Lead', 'Technical Architect']},
            {'role_name': 'Design Engineer', 'category': 'Systems Engineering',
             'aliases': ['Designer', 'Design Engineers', 'Design Lead']},
            {'role_name': 'Integration Engineer', 'category': 'Systems Engineering',
             'aliases': ['Integrator', 'System Integrator', 'I&T Engineer']},
            {'role_name': 'Technical Lead', 'category': 'Systems Engineering',
             'aliases': ['Tech Lead', 'Technical Leads', 'Engineering Lead']},
            {'role_name': 'Chief Engineer', 'category': 'Systems Engineering',
             'aliases': ['CE', 'Chief Engineers', 'Engineering Director']},
            {'role_name': 'Systems Engineering Manager', 'category': 'Systems Engineering',
             'aliases': ['SE Manager', 'SEM', 'Systems Engineering Lead']},
            {'role_name': 'Trade Study Lead', 'category': 'Systems Engineering',
             'aliases': ['Trade Study Engineer', 'Analysis Lead']},
            {'role_name': 'Modeling & Simulation Engineer', 'category': 'Systems Engineering',
             'aliases': ['M&S Engineer', 'Simulation Engineer', 'Modeling Engineer']},
            {'role_name': 'Performance Engineer', 'category': 'Systems Engineering',
             'aliases': ['Performance Analyst', 'System Performance Engineer']},
            {'role_name': 'Specialty Engineering Lead', 'category': 'Systems Engineering',
             'aliases': ['Specialty Lead', 'Specialty Disciplines Lead']},
            {'role_name': 'Technical Data Lead', 'category': 'Systems Engineering',
             'aliases': ['TDP Lead', 'Technical Data Package Lead']},
            {'role_name': 'SETR Lead', 'category': 'Systems Engineering',
             'aliases': ['SE Technical Review Lead', 'Review Lead']},
            {'role_name': 'Deputy Chief Engineer', 'category': 'Systems Engineering',
             'aliases': ['DCE', 'Asst Chief Engineer']},
            
            # ================================================================
            # HARDWARE ENGINEERING (15 roles)
            # ================================================================
            {'role_name': 'Electrical Engineer', 'category': 'Hardware Engineering',
             'aliases': ['EE', 'Electrical Design Engineer', 'Electronics Engineer']},
            {'role_name': 'Mechanical Engineer', 'category': 'Hardware Engineering',
             'aliases': ['ME', 'Mechanical Design Engineer', 'Mech Engineer']},
            {'role_name': 'Structural Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Structures Engineer', 'Stress Engineer', 'Structural Analyst']},
            {'role_name': 'Thermal Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Thermal Analyst', 'Thermal Design Engineer']},
            {'role_name': 'RF Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Radio Frequency Engineer', 'RF Design Engineer', 'Microwave Engineer']},
            {'role_name': 'Antenna Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Antenna Design Engineer', 'Aperture Engineer']},
            {'role_name': 'Power Systems Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Power Engineer', 'EPS Engineer', 'Electrical Power Engineer']},
            {'role_name': 'Avionics Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Avionics Design Engineer', 'Avionics Systems Engineer']},
            {'role_name': 'Propulsion Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Propulsion Systems Engineer', 'Rocket Engineer']},
            {'role_name': 'GNC Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Guidance Engineer', 'Navigation Engineer', 'Control Systems Engineer']},
            {'role_name': 'Optics Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Optical Engineer', 'Electro-Optical Engineer', 'EO Engineer']},
            {'role_name': 'Hardware Lead', 'category': 'Hardware Engineering',
             'aliases': ['HW Lead', 'Hardware Engineering Lead']},
            {'role_name': 'CAD Designer', 'category': 'Hardware Engineering',
             'aliases': ['CAD Engineer', 'Design Drafter', '3D Modeler']},
            {'role_name': 'Packaging Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Mechanical Packaging Engineer', 'Electronic Packaging Engineer']},
            {'role_name': 'Materials Engineer', 'category': 'Hardware Engineering',
             'aliases': ['Materials Scientist', 'M&P Engineer', 'Materials & Processes']},
            
            # ================================================================
            # SOFTWARE ENGINEERING (12 roles)
            # ================================================================
            {'role_name': 'Software Lead', 'category': 'Software Engineering',
             'aliases': ['SW Lead', 'Software Engineering Lead', 'Software Manager']},
            {'role_name': 'Software Engineer', 'category': 'Software Engineering',
             'aliases': ['SW Engineer', 'Software Developer', 'Programmer']},
            {'role_name': 'DevSecOps Engineer', 'category': 'Software Engineering',
             'aliases': ['DevOps Engineer', 'CI/CD Engineer', 'Pipeline Engineer']},
            {'role_name': 'Flight Software Engineer', 'category': 'Software Engineering',
             'aliases': ['FSW Engineer', 'Flight SW Engineer', 'Embedded Flight SW']},
            {'role_name': 'Embedded Software Engineer', 'category': 'Software Engineering',
             'aliases': ['Embedded SW Engineer', 'Firmware Engineer']},
            {'role_name': 'Software Architect', 'category': 'Software Engineering',
             'aliases': ['SW Architect', 'Application Architect']},
            {'role_name': 'Software Test Engineer', 'category': 'Software Engineering',
             'aliases': ['SW Test Engineer', 'Software QA', 'SW Tester']},
            {'role_name': 'Software Safety Engineer', 'category': 'Software Engineering',
             'aliases': ['SW Safety Engineer', 'Software Assurance']},
            {'role_name': 'Algorithm Engineer', 'category': 'Software Engineering',
             'aliases': ['Algorithm Developer', 'DSP Engineer']},
            {'role_name': 'Data Engineer', 'category': 'Software Engineering',
             'aliases': ['Data Architect', 'Database Engineer']},
            {'role_name': 'AI/ML Engineer', 'category': 'Software Engineering',
             'aliases': ['Machine Learning Engineer', 'AI Engineer']},
            {'role_name': 'Ground Software Engineer', 'category': 'Software Engineering',
             'aliases': ['GSW Engineer', 'Ground System Software Engineer']},
            
            # ================================================================
            # TEST & EVALUATION (15 roles)
            # ================================================================
            {'role_name': 'Test Engineer', 'category': 'Test & Evaluation',
             'aliases': ['Test Engineers', 'Testing Engineer', 'T&E Engineer']},
            {'role_name': 'T&E Lead', 'category': 'Test & Evaluation',
             'aliases': ['Test Lead', 'Test & Evaluation Lead', 'Test Manager']},
            {'role_name': 'Integration & Test Engineer', 'category': 'Test & Evaluation',
             'aliases': ['I&T Engineer', 'Integration Engineer', 'System Integrator']},
            {'role_name': 'Environmental Test Engineer', 'category': 'Test & Evaluation',
             'aliases': ['Environmental Engineer', 'Env Test Engineer', 'Qual Test Engineer']},
            {'role_name': 'DT&E Lead', 'category': 'Test & Evaluation',
             'aliases': ['Developmental Test Lead', 'DT Lead', 'Development Test Engineer']},
            {'role_name': 'OT&E Lead', 'category': 'Test & Evaluation',
             'aliases': ['Operational Test Lead', 'OT Lead', 'Operational Test Engineer']},
            {'role_name': 'Flight Test Engineer', 'category': 'Test & Evaluation',
             'aliases': ['FTE', 'Flight Test Engineers', 'Flight Test Lead']},
            {'role_name': 'Test Conductor', 'category': 'Test & Evaluation',
             'aliases': ['Test Director', 'Test Operations Lead']},
            {'role_name': 'Test Readiness Review Lead', 'category': 'Test & Evaluation',
             'aliases': ['TRR Lead', 'Test Readiness Lead']},
            {'role_name': 'Verification Lead', 'category': 'Test & Evaluation',
             'aliases': ['Verification Engineer', 'Verification Manager']},
            {'role_name': 'Qualification Engineer', 'category': 'Test & Evaluation',
             'aliases': ['Qual Engineer', 'Qualification Test Engineer']},
            {'role_name': 'Acceptance Test Engineer', 'category': 'Test & Evaluation',
             'aliases': ['ATP Engineer', 'Acceptance Engineer']},
            {'role_name': 'Range Safety Officer', 'category': 'Test & Evaluation',
             'aliases': ['RSO', 'Range Safety']},
            {'role_name': 'Test Facility Manager', 'category': 'Test & Evaluation',
             'aliases': ['Lab Manager', 'Test Lab Manager']},
            {'role_name': 'Instrumentation Engineer', 'category': 'Test & Evaluation',
             'aliases': ['Instrumentation Specialist', 'Test Instrumentation']},
            
            # ================================================================
            # QUALITY & MISSION ASSURANCE (12 roles)
            # ================================================================
            {'role_name': 'Quality Engineer', 'category': 'Quality & Mission Assurance',
             'aliases': ['QE', 'Quality Assurance Engineer', 'QA Engineer']},
            {'role_name': 'QA Manager', 'category': 'Quality & Mission Assurance',
             'aliases': ['Quality Manager', 'Quality Assurance Manager']},
            {'role_name': 'Mission Assurance Engineer', 'category': 'Quality & Mission Assurance',
             'aliases': ['MA Engineer', 'Mission Assurance', 'MA']},
            {'role_name': 'Supplier Quality Engineer', 'category': 'Quality & Mission Assurance',
             'aliases': ['SQE', 'Supplier Quality', 'Vendor Quality']},
            {'role_name': 'MRB Chair', 'category': 'Quality & Mission Assurance',
             'aliases': ['Material Review Board Chair', 'MRB Lead']},
            {'role_name': 'Quality Assurance', 'category': 'Quality & Mission Assurance',
             'aliases': ['QA', 'Quality Assurance Representative']},
            {'role_name': 'Quality Inspector', 'category': 'Quality & Mission Assurance',
             'aliases': ['QC Inspector', 'Quality Control Inspector']},
            {'role_name': 'Process Auditor', 'category': 'Quality & Mission Assurance',
             'aliases': ['Quality Auditor', 'AS9100 Auditor']},
            {'role_name': 'Nonconformance Engineer', 'category': 'Quality & Mission Assurance',
             'aliases': ['NCR Engineer', 'Discrepancy Engineer']},
            {'role_name': 'Root Cause Analyst', 'category': 'Quality & Mission Assurance',
             'aliases': ['Failure Analyst', 'RCCA Lead']},
            {'role_name': 'Six Sigma Black Belt', 'category': 'Quality & Mission Assurance',
             'aliases': ['Black Belt', 'Lean Six Sigma']},
            {'role_name': 'Mission Assurance Manager', 'category': 'Quality & Mission Assurance',
             'aliases': ['MA Manager', 'Mission Assurance Lead']},
            
            # ================================================================
            # MANUFACTURING & PRODUCTION (10 roles)
            # ================================================================
            {'role_name': 'Manufacturing Engineer', 'category': 'Manufacturing',
             'aliases': ['Mfg Engineer', 'Production Engineer', 'Manufacturing Engineers']},
            {'role_name': 'Production Manager', 'category': 'Manufacturing',
             'aliases': ['Production Lead', 'Manufacturing Manager', 'Factory Manager']},
            {'role_name': 'Process Engineer', 'category': 'Manufacturing',
             'aliases': ['Process Development Engineer', 'Manufacturing Process Engineer']},
            {'role_name': 'Tooling Engineer', 'category': 'Manufacturing',
             'aliases': ['Tool Engineer', 'Tool Designer', 'Fixtures Engineer']},
            {'role_name': 'Assembly Technician', 'category': 'Manufacturing',
             'aliases': ['Assembler', 'Production Technician', 'Build Technician']},
            {'role_name': 'Test Technician', 'category': 'Manufacturing',
             'aliases': ['Lab Technician', 'Test Tech', 'QA Technician']},
            {'role_name': 'Production Planner', 'category': 'Manufacturing',
             'aliases': ['Manufacturing Planner', 'Production Scheduler']},
            {'role_name': 'Industrial Engineer', 'category': 'Manufacturing',
             'aliases': ['IE', 'Industrial Engineers', 'Methods Engineer']},
            {'role_name': 'Lean Manufacturing Engineer', 'category': 'Manufacturing',
             'aliases': ['Lean Engineer', 'Continuous Improvement Engineer']},
            {'role_name': 'NPI Engineer', 'category': 'Manufacturing',
             'aliases': ['New Product Introduction', 'Transition Engineer']},
            
            # ================================================================
            # LOGISTICS & SUSTAINMENT (10 roles)
            # ================================================================
            {'role_name': 'Logistics Engineer', 'category': 'Logistics & Sustainment',
             'aliases': ['Logistics Engineers', 'Log Engineer', 'Logistics Analyst']},
            {'role_name': 'ILS Manager', 'category': 'Logistics & Sustainment',
             'aliases': ['Integrated Logistics Support Manager', 'ILS Lead']},
            {'role_name': 'Reliability Engineer', 'category': 'Logistics & Sustainment',
             'aliases': ['Reliability Engineers', 'R&M Engineer', 'RAM Engineer']},
            {'role_name': 'Maintainability Engineer', 'category': 'Logistics & Sustainment',
             'aliases': ['Maintainability Analyst', 'M&R Engineer']},
            {'role_name': 'Supportability Engineer', 'category': 'Logistics & Sustainment',
             'aliases': ['Support Engineer', 'Sustainment Engineer']},
            {'role_name': 'Supply Chain Manager', 'category': 'Logistics & Sustainment',
             'aliases': ['SCM', 'Supply Chain Lead', 'Procurement Manager']},
            {'role_name': 'Spares Analyst', 'category': 'Logistics & Sustainment',
             'aliases': ['Provisioning Analyst', 'Parts Analyst']},
            {'role_name': 'Technical Writer', 'category': 'Logistics & Sustainment',
             'aliases': ['Tech Writer', 'Documentation Specialist', 'Technical Author']},
            {'role_name': 'Training Developer', 'category': 'Logistics & Sustainment',
             'aliases': ['Training Specialist', 'ISD', 'Instructional Designer']},
            {'role_name': 'Field Service Engineer', 'category': 'Logistics & Sustainment',
             'aliases': ['FSR', 'Field Engineer', 'Field Support Representative']},
            
            # ================================================================
            # SAFETY & SPECIALTY ENGINEERING (12 roles)
            # ================================================================
            {'role_name': 'Safety Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Safety Engineers', 'System Safety']},
            {'role_name': 'System Safety Lead', 'category': 'Safety & Specialty',
             'aliases': ['System Safety Engineer', 'Safety Lead', 'System Safety Manager']},
            {'role_name': 'Human Factors Engineer', 'category': 'Safety & Specialty',
             'aliases': ['HFE', 'Human Systems Integration', 'Ergonomics Engineer']},
            {'role_name': 'EMI/EMC Engineer', 'category': 'Safety & Specialty',
             'aliases': ['EMC Engineer', 'EMI Engineer', 'Electromagnetic Compatibility']},
            {'role_name': 'Parts Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Parts Analyst', 'Component Engineer', 'EEE Parts Engineer']},
            {'role_name': 'RHA Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Radiation Hardness Assurance', 'Radiation Effects Engineer']},
            {'role_name': 'Contamination Control Engineer', 'category': 'Safety & Specialty',
             'aliases': ['CCE', 'Cleanliness Engineer']},
            {'role_name': 'Survivability Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Survivability Analyst', 'Vulnerability Engineer']},
            {'role_name': 'Producibility Engineer', 'category': 'Safety & Specialty',
             'aliases': ['DFM Engineer', 'Design for Manufacturing']},
            {'role_name': 'Corrosion Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Corrosion Control Engineer', 'Corrosion Prevention']},
            {'role_name': 'Loads Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Loads Analyst', 'Dynamic Loads Engineer']},
            {'role_name': 'Mass Properties Engineer', 'category': 'Safety & Specialty',
             'aliases': ['Mass Properties Analyst', 'Weight Engineer']},
            
            # ================================================================
            # CONFIGURATION & DATA MANAGEMENT (8 roles)
            # ================================================================
            {'role_name': 'Configuration Manager', 'category': 'Configuration & Data',
             'aliases': ['CM', 'Config Manager', 'Configuration Management']},
            {'role_name': 'Data Manager', 'category': 'Configuration & Data',
             'aliases': ['Data Management', 'DM', 'Information Manager']},
            {'role_name': 'Document Control', 'category': 'Configuration & Data',
             'aliases': ['Document Controller', 'Records Manager', 'Document Management']},
            {'role_name': 'CDRL Manager', 'category': 'Configuration & Data',
             'aliases': ['CDRL Administrator', 'Deliverables Manager']},
            {'role_name': 'Configuration Analyst', 'category': 'Configuration & Data',
             'aliases': ['CM Analyst', 'Configuration Specialist']},
            {'role_name': 'Baseline Manager', 'category': 'Configuration & Data',
             'aliases': ['Baseline Administrator', 'Configuration Baseline Lead']},
            {'role_name': 'Change Control Administrator', 'category': 'Configuration & Data',
             'aliases': ['CCB Administrator', 'Change Administrator']},
            {'role_name': 'Product Data Manager', 'category': 'Configuration & Data',
             'aliases': ['PDM Administrator', 'PLM Administrator']},
            
            # ================================================================
            # CONTRACTS & BUSINESS (10 roles)
            # ================================================================
            {'role_name': 'Contracts Manager', 'category': 'Contracts & Business',
             'aliases': ['Contract Manager', 'Contracts Lead', 'Contract Administrator']},
            {'role_name': 'Subcontracts Manager', 'category': 'Contracts & Business',
             'aliases': ['Subcontracts Administrator', 'Subcontract Manager']},
            {'role_name': 'Proposal Manager', 'category': 'Contracts & Business',
             'aliases': ['Proposal Lead', 'Proposal Coordinator', 'Bid Manager']},
            {'role_name': 'Capture Manager', 'category': 'Contracts & Business',
             'aliases': ['Capture Lead', 'BD Manager', 'Business Development Manager']},
            {'role_name': 'Pricing Manager', 'category': 'Contracts & Business',
             'aliases': ['Pricing Analyst', 'Cost Volume Manager']},
            {'role_name': 'Contracts Administrator', 'category': 'Contracts & Business',
             'aliases': ['Contract Admin', 'CA']},
            {'role_name': 'Procurement Specialist', 'category': 'Contracts & Business',
             'aliases': ['Buyer', 'Purchasing Agent', 'Procurement Agent']},
            {'role_name': 'Export Compliance Officer', 'category': 'Contracts & Business',
             'aliases': ['ITAR Compliance', 'Export Control', 'Trade Compliance']},
            {'role_name': 'Finance Manager', 'category': 'Contracts & Business',
             'aliases': ['Financial Analyst', 'Program Finance']},
            {'role_name': 'Legal Counsel', 'category': 'Contracts & Business',
             'aliases': ['Attorney', 'Legal Advisor', 'General Counsel']},
            
            # ================================================================
            # SECURITY (8 roles)
            # ================================================================
            {'role_name': 'Security Manager', 'category': 'Security',
             'aliases': ['Security Lead', 'Industrial Security Manager']},
            {'role_name': 'FSO', 'category': 'Security',
             'aliases': ['Facility Security Officer', 'Security Officer']},
            {'role_name': 'ISSM', 'category': 'Security',
             'aliases': ['Information System Security Manager', 'IT Security Manager']},
            {'role_name': 'ISSO', 'category': 'Security',
             'aliases': ['Information System Security Officer', 'IT Security Officer']},
            {'role_name': 'Cybersecurity Engineer', 'category': 'Security',
             'aliases': ['Cyber Engineer', 'Information Security Engineer', 'IA Engineer']},
            {'role_name': 'COMSEC Manager', 'category': 'Security',
             'aliases': ['Communications Security', 'COMSEC Custodian']},
            {'role_name': 'Classification Management Officer', 'category': 'Security',
             'aliases': ['CMO', 'Classification Officer']},
            {'role_name': 'OPSEC Officer', 'category': 'Security',
             'aliases': ['Operations Security', 'OPSEC Manager']},
            
            # ================================================================
            # CUSTOMER/GOVERNMENT (12 roles)
            # ================================================================
            {'role_name': 'COR', 'category': 'Customer/Government',
             'aliases': ['Contracting Officer Representative', 'CORs', 'COTR']},
            {'role_name': 'COTR', 'category': 'Customer/Government',
             'aliases': ['Contracting Officer Technical Representative', 'Technical COR']},
            {'role_name': 'ACO', 'category': 'Customer/Government',
             'aliases': ['Administrative Contracting Officer', 'ACOs']},
            {'role_name': 'PCO', 'category': 'Customer/Government',
             'aliases': ['Procuring Contracting Officer', 'PCOs']},
            {'role_name': 'DCMA Representative', 'category': 'Customer/Government',
             'aliases': ['DCMA', 'Government QAR', 'DCMA QAR']},
            {'role_name': 'Government PM', 'category': 'Customer/Government',
             'aliases': ['Government Program Manager', 'Govt PM']},
            {'role_name': 'Contracting Officer', 'category': 'Customer/Government',
             'aliases': ['CO', 'Contracting Officers', 'KO']},
            {'role_name': 'Government Technical Representative', 'category': 'Customer/Government',
             'aliases': ['GTR', 'Technical Monitor', 'TPOC']},
            {'role_name': 'Customer', 'category': 'Customer/Government',
             'aliases': ['Client', 'End User', 'User']},
            {'role_name': 'Government Engineer', 'category': 'Customer/Government',
             'aliases': ['Govt Engineer', 'Government Technical Staff']},
            {'role_name': 'Source Selection Authority', 'category': 'Customer/Government',
             'aliases': ['SSA', 'Selection Authority']},
            {'role_name': 'Milestone Decision Authority', 'category': 'Customer/Government',
             'aliases': ['MDA', 'Decision Authority']},
            
            # ================================================================
            # BOARDS & TEAMS (10 roles)
            # ================================================================
            {'role_name': 'Configuration Control Board', 'category': 'Boards & Teams',
             'aliases': ['CCB', 'Change Control Board', 'CCB Chair']},
            {'role_name': 'Engineering Review Board', 'category': 'Boards & Teams',
             'aliases': ['ERB', 'Technical Review Board', 'ERB Chair']},
            {'role_name': 'Integrated Product Team', 'category': 'Boards & Teams',
             'aliases': ['IPT', 'Product Team']},
            {'role_name': 'Material Review Board', 'category': 'Boards & Teams',
             'aliases': ['MRB', 'Material Review']},
            {'role_name': 'Gate Review Chair', 'category': 'Boards & Teams',
             'aliases': ['Gate Review Lead', 'Phase Gate Chair']},
            {'role_name': 'IRB Member', 'category': 'Boards & Teams',
             'aliases': ['Independent Review Board', 'IRB Chair']},
            {'role_name': 'Red Team Lead', 'category': 'Boards & Teams',
             'aliases': ['Red Team Chair', 'Red Team Member']},
            {'role_name': 'Tiger Team Lead', 'category': 'Boards & Teams',
             'aliases': ['Tiger Team Member', 'Special Team Lead']},
            {'role_name': 'Working Group Lead', 'category': 'Boards & Teams',
             'aliases': ['WG Lead', 'Technical Working Group']},
            {'role_name': 'Failure Review Board', 'category': 'Boards & Teams',
             'aliases': ['FRB', 'FRB Chair', 'Anomaly Review Board']},
            
            # ================================================================
            # STAKEHOLDERS & ORGANIZATIONS (6 roles)
            # ================================================================
            {'role_name': 'Contractor', 'category': 'Stakeholders',
             'aliases': ['Prime Contractor', 'Contractors', 'Prime']},
            {'role_name': 'Subcontractor', 'category': 'Stakeholders',
             'aliases': ['Sub-Contractor', 'Subcontractors', 'Sub', 'Supplier']},
            {'role_name': 'Sector VP', 'category': 'Stakeholders',
             'aliases': ['Sector Vice President', 'SVP', 'Division VP']},
            {'role_name': 'Division Director', 'category': 'Stakeholders',
             'aliases': ['Division Manager', 'Director']},
            {'role_name': 'Technical Fellow', 'category': 'Stakeholders',
             'aliases': ['Fellow', 'Distinguished Engineer', 'Chief Scientist']},
            {'role_name': 'Subject Matter Expert', 'category': 'Stakeholders',
             'aliases': ['SME', 'Domain Expert', 'Technical Expert']},
            
            # ================================================================
            # F05: TOOLS & SYSTEMS (v2.9.3)
            # For identifying system/tool references marked with [S] prefix
            # ================================================================
            {'role_name': 'Windchill', 'category': 'Tools & Systems',
             'aliases': ['PTC Windchill', 'Windchill PDMLink'],
             'description': 'Product lifecycle management system for engineering data'},
            {'role_name': 'Teamcenter', 'category': 'Tools & Systems',
             'aliases': ['Siemens Teamcenter', 'TC'],
             'description': 'PLM software for product data management'},
            {'role_name': 'DOORS', 'category': 'Tools & Systems',
             'aliases': ['IBM DOORS', 'Rational DOORS', 'DOORS Next'],
             'description': 'Requirements management and traceability tool'},
            {'role_name': 'Jama Connect', 'category': 'Tools & Systems',
             'aliases': ['Jama', 'Jama Software'],
             'description': 'Requirements management platform'},
            {'role_name': 'Cameo Systems Modeler', 'category': 'Tools & Systems',
             'aliases': ['Cameo', 'MagicDraw', 'Catia Magic'],
             'description': 'Model-based systems engineering tool using SysML'},
            {'role_name': 'Enterprise Architect', 'category': 'Tools & Systems',
             'aliases': ['EA', 'Sparx EA', 'Sparx Systems'],
             'description': 'UML/SysML modeling and design tool'},
            {'role_name': 'CATIA', 'category': 'Tools & Systems',
             'aliases': ['Dassault CATIA', 'CATIA V5', 'CATIA V6'],
             'description': 'CAD software for aerospace and automotive design'},
            {'role_name': 'NX', 'category': 'Tools & Systems',
             'aliases': ['Siemens NX', 'Unigraphics', 'UG NX'],
             'description': 'CAD/CAM/CAE software for product development'},
            {'role_name': 'SolidWorks', 'category': 'Tools & Systems',
             'aliases': ['SW', 'Solidworks'],
             'description': 'CAD software for mechanical design'},
            {'role_name': 'Creo', 'category': 'Tools & Systems',
             'aliases': ['PTC Creo', 'Pro/Engineer', 'ProE'],
             'description': 'CAD software for product design'},
            {'role_name': 'MATLAB', 'category': 'Tools & Systems',
             'aliases': ['MathWorks MATLAB'],
             'description': 'Technical computing environment for algorithm development'},
            {'role_name': 'Simulink', 'category': 'Tools & Systems',
             'aliases': ['MathWorks Simulink'],
             'description': 'Simulation and model-based design platform'},
            {'role_name': 'ANSYS', 'category': 'Tools & Systems',
             'aliases': ['Ansys Workbench'],
             'description': 'Engineering simulation software for FEA, CFD'},
            {'role_name': 'NASTRAN', 'category': 'Tools & Systems',
             'aliases': ['MSC NASTRAN', 'NX NASTRAN'],
             'description': 'Finite element analysis software'},
            {'role_name': 'Primavera P6', 'category': 'Tools & Systems',
             'aliases': ['P6', 'Oracle Primavera'],
             'description': 'Enterprise project portfolio management software'},
            {'role_name': 'Microsoft Project', 'category': 'Tools & Systems',
             'aliases': ['MS Project', 'MSP'],
             'description': 'Project management software'},
            {'role_name': 'SAP', 'category': 'Tools & Systems',
             'aliases': ['SAP ERP', 'SAP S/4HANA'],
             'description': 'Enterprise resource planning system'},
            {'role_name': 'Deltek Costpoint', 'category': 'Tools & Systems',
             'aliases': ['Costpoint'],
             'description': 'Government contractor accounting and ERP system'},
            {'role_name': 'Deltek Cobra', 'category': 'Tools & Systems',
             'aliases': ['Cobra'],
             'description': 'Earned value management software'},
            {'role_name': 'SharePoint', 'category': 'Tools & Systems',
             'aliases': ['Microsoft SharePoint', 'SPO'],
             'description': 'Document management and collaboration platform'},
            {'role_name': 'Confluence', 'category': 'Tools & Systems',
             'aliases': ['Atlassian Confluence'],
             'description': 'Team collaboration and documentation platform'},
            {'role_name': 'Jira', 'category': 'Tools & Systems',
             'aliases': ['Atlassian Jira'],
             'description': 'Issue tracking and project management tool'},
            {'role_name': 'Git', 'category': 'Tools & Systems',
             'aliases': ['GitHub', 'GitLab', 'Bitbucket'],
             'description': 'Version control system for code and documents'},
            {'role_name': 'Tableau', 'category': 'Tools & Systems',
             'aliases': [],
             'description': 'Data visualization and business intelligence platform'},
            {'role_name': 'Power BI', 'category': 'Tools & Systems',
             'aliases': ['Microsoft Power BI'],
             'description': 'Business analytics and visualization tool'},
            
            # ================================================================
            # v2.9.4 #8: EXPANDED GOVERNMENT/DEFENSE ROLES
            # ================================================================
            {'role_name': 'Contracting Officer', 'category': 'Government',
             'aliases': ['CO', 'KO', 'Contracting Officers']},
            {'role_name': 'Contracting Officer Representative', 'category': 'Government',
             'aliases': ['COR', 'COTR', 'Contracting Technical Representative']},
            {'role_name': 'Program Executive Officer', 'category': 'Government',
             'aliases': ['PEO', 'PEOs']},
            {'role_name': 'Milestone Decision Authority', 'category': 'Government',
             'aliases': ['MDA', 'Decision Authority']},
            {'role_name': 'Technical Authority', 'category': 'Government',
             'aliases': ['TA', 'Technical Authorities']},
            {'role_name': 'Acquisition Executive', 'category': 'Government',
             'aliases': ['SAE', 'Service Acquisition Executive']},
            {'role_name': 'Defense Contract Audit Agency', 'category': 'Government',
             'aliases': ['DCAA', 'Auditor']},
            {'role_name': 'Defense Contract Management Agency', 'category': 'Government',
             'aliases': ['DCMA', 'Contract Administrator']},
            {'role_name': 'Government Property Administrator', 'category': 'Government',
             'aliases': ['GPA', 'Property Administrator']},
            {'role_name': 'Administrative Contracting Officer', 'category': 'Government',
             'aliases': ['ACO']},
            {'role_name': 'Quality Assurance Representative', 'category': 'Government',
             'aliases': ['QAR', 'Government Inspector']},
            {'role_name': 'Facility Security Officer', 'category': 'Government',
             'aliases': ['FSO', 'Industrial Security']},
            {'role_name': 'Information System Security Officer', 'category': 'Government',
             'aliases': ['ISSO', 'Cybersecurity Officer']},
            {'role_name': 'Information System Security Manager', 'category': 'Government',
             'aliases': ['ISSM', 'Cyber Manager']},
            {'role_name': 'Authorizing Official', 'category': 'Government',
             'aliases': ['AO', 'Designated Approving Authority', 'DAA']},
            
            # ================================================================
            # v2.9.4 #8: EXPANDED IT/TECHNICAL ROLES
            # ================================================================
            {'role_name': 'Network Engineer', 'category': 'IT/Technical',
             'aliases': ['Network Admin', 'Network Administrator']},
            {'role_name': 'Cloud Engineer', 'category': 'IT/Technical',
             'aliases': ['Cloud Architect', 'AWS Engineer', 'Azure Engineer']},
            {'role_name': 'Cybersecurity Engineer', 'category': 'IT/Technical',
             'aliases': ['Security Engineer', 'InfoSec Engineer']},
            {'role_name': 'Database Administrator', 'category': 'IT/Technical',
             'aliases': ['DBA', 'Database Engineer']},
            {'role_name': 'System Administrator', 'category': 'IT/Technical',
             'aliases': ['Sysadmin', 'Server Administrator']},
            {'role_name': 'IT Manager', 'category': 'IT/Technical',
             'aliases': ['IT Director', 'Information Technology Manager']},
            {'role_name': 'Solutions Architect', 'category': 'IT/Technical',
             'aliases': ['Technical Solutions Architect', 'Enterprise Architect']},
            {'role_name': 'Site Reliability Engineer', 'category': 'IT/Technical',
             'aliases': ['SRE', 'Reliability Engineer']},
            {'role_name': 'Scrum Master', 'category': 'IT/Technical',
             'aliases': ['Agile Coach', 'Agile Lead']},
            {'role_name': 'Product Owner', 'category': 'IT/Technical',
             'aliases': ['PO', 'Product Manager']},
            {'role_name': 'Technical Writer', 'category': 'IT/Technical',
             'aliases': ['Documentation Specialist', 'Tech Writer']},
            {'role_name': 'Business Analyst', 'category': 'IT/Technical',
             'aliases': ['BA', 'Systems Analyst']},
            {'role_name': 'UX Designer', 'category': 'IT/Technical',
             'aliases': ['User Experience Designer', 'UI/UX Designer']},
            
            # ================================================================
            # v2.9.4 #8: EXPANDED BUSINESS/MANAGEMENT ROLES
            # ================================================================
            {'role_name': 'Executive Director', 'category': 'Management',
             'aliases': ['ED', 'Managing Director']},
            {'role_name': 'Vice President', 'category': 'Management',
             'aliases': ['VP', 'Vice Pres']},
            {'role_name': 'General Manager', 'category': 'Management',
             'aliases': ['GM', 'General Mgr']},
            {'role_name': 'Operations Manager', 'category': 'Management',
             'aliases': ['Ops Manager', 'Operations Director']},
            {'role_name': 'Finance Manager', 'category': 'Management',
             'aliases': ['Financial Manager', 'Finance Director']},
            {'role_name': 'HR Manager', 'category': 'Management',
             'aliases': ['Human Resources Manager', 'People Manager']},
            {'role_name': 'Proposal Manager', 'category': 'Management',
             'aliases': ['Capture Manager', 'BD Manager']},
            {'role_name': 'Contracts Manager', 'category': 'Management',
             'aliases': ['Contract Administrator', 'Contracts Administrator']},
            {'role_name': 'Procurement Manager', 'category': 'Management',
             'aliases': ['Purchasing Manager', 'Supply Chain Manager']},
            {'role_name': 'Training Manager', 'category': 'Management',
             'aliases': ['Training Coordinator', 'Learning Manager']},
            
            # ================================================================
            # v2.9.4 #8: EXPANDED COMPLIANCE/QUALITY ROLES
            # ================================================================
            {'role_name': 'Compliance Officer', 'category': 'Compliance',
             'aliases': ['Compliance Manager', 'Regulatory Compliance']},
            {'role_name': 'Ethics Officer', 'category': 'Compliance',
             'aliases': ['Ethics Manager', 'Corporate Ethics']},
            {'role_name': 'Export Control Officer', 'category': 'Compliance',
             'aliases': ['ITAR Officer', 'Export Compliance']},
            {'role_name': 'Privacy Officer', 'category': 'Compliance',
             'aliases': ['Data Protection Officer', 'DPO']},
            {'role_name': 'Internal Auditor', 'category': 'Compliance',
             'aliases': ['Audit Manager', 'Quality Auditor']},
            {'role_name': 'Environmental Health Safety', 'category': 'Compliance',
             'aliases': ['EHS', 'Safety Officer', 'HSE Manager']},
            {'role_name': 'Regulatory Affairs Manager', 'category': 'Compliance',
             'aliases': ['Regulatory Manager', 'RA Manager']},
            
            # ================================================================
            # v2.9.10 #24: ADDITIONAL AEROSPACE/DEFENSE ROLES (200+ new roles)
            # ================================================================
            
            # --- AIRCRAFT/AEROSPACE SPECIFIC ---
            {'role_name': 'Aircraft Systems Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['ASE', 'Aircraft Engineer']},
            {'role_name': 'Aerodynamics Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Aero Engineer', 'Aerodynamicist']},
            {'role_name': 'Structures Analyst', 'category': 'Aerospace Engineering',
             'aliases': ['Structural Analyst', 'Stress Analyst']},
            {'role_name': 'Flight Dynamics Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Stability Engineer', 'Dynamics Engineer']},
            {'role_name': 'Payload Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Payload Systems Engineer', 'Payload Integration']},
            {'role_name': 'Launch Vehicle Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['LV Engineer', 'Launch Systems Engineer']},
            {'role_name': 'Satellite Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Spacecraft Engineer', 'Bus Engineer']},
            {'role_name': 'Ground Systems Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['GSE Engineer', 'Ground Support Equipment']},
            {'role_name': 'Mission Operations Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Ops Engineer', 'Mission Ops']},
            {'role_name': 'Command & Control Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['C2 Engineer', 'C4ISR Engineer']},
            {'role_name': 'Radar Systems Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Radar Engineer', 'AESA Engineer']},
            {'role_name': 'EW Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Electronic Warfare Engineer', 'EW Systems']},
            {'role_name': 'Countermeasures Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['CM Engineer', 'ECM Engineer']},
            {'role_name': 'Targeting Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Target Acquisition', 'Targeting Systems']},
            {'role_name': 'Weapons Systems Engineer', 'category': 'Aerospace Engineering',
             'aliases': ['Weapons Engineer', 'WSO']},
            
            # --- SPACECRAFT/SATELLITE SPECIFIC ---
            {'role_name': 'Attitude Control Engineer', 'category': 'Spacecraft Engineering',
             'aliases': ['ADCS Engineer', 'ACS Engineer']},
            {'role_name': 'Orbit Analyst', 'category': 'Spacecraft Engineering',
             'aliases': ['Orbital Mechanics', 'Astrodynamics']},
            {'role_name': 'Solar Array Engineer', 'category': 'Spacecraft Engineering',
             'aliases': ['Power Generation', 'Solar Panel Engineer']},
            {'role_name': 'Thermal Control Engineer', 'category': 'Spacecraft Engineering',
             'aliases': ['TCS Engineer', 'Thermal Systems']},
            {'role_name': 'Cryogenics Engineer', 'category': 'Spacecraft Engineering',
             'aliases': ['Cryo Engineer', 'Cryogenic Systems']},
            {'role_name': 'Mechanisms Engineer', 'category': 'Spacecraft Engineering',
             'aliases': ['Deployment Engineer', 'Mechanical Systems']},
            {'role_name': 'Space Vehicle Operator', 'category': 'Spacecraft Engineering',
             'aliases': ['SVO', 'Spacecraft Operator']},
            {'role_name': 'Constellation Manager', 'category': 'Spacecraft Engineering',
             'aliases': ['Fleet Manager', 'Constellation Ops']},
            {'role_name': 'Ground Station Manager', 'category': 'Spacecraft Engineering',
             'aliases': ['Ground Station Ops', 'GSM']},
            {'role_name': 'Link Budget Analyst', 'category': 'Spacecraft Engineering',
             'aliases': ['RF Link Analyst', 'Communications Analyst']},
            
            # --- DEFENSE/MILITARY SPECIFIC ---
            {'role_name': 'Program Executive Officer', 'category': 'Defense Management',
             'aliases': ['PEO', 'Acquisition Executive']},
            {'role_name': 'Contracting Officer', 'category': 'Defense Management',
             'aliases': ['CO', 'PCO', 'ACO']},
            {'role_name': 'Contracting Officer Representative', 'category': 'Defense Management',
             'aliases': ['COR', 'COTR']},
            {'role_name': 'Technical Representative', 'category': 'Defense Management',
             'aliases': ['DCMA Representative', 'Government Rep']},
            {'role_name': 'Program Analyst', 'category': 'Defense Management',
             'aliases': ['PA', 'Defense Analyst']},
            {'role_name': 'DCMA QA', 'category': 'Defense Management',
             'aliases': ['Government QA', 'Customer QA']},
            {'role_name': 'Security Manager', 'category': 'Defense Management',
             'aliases': ['FSO', 'Facility Security Officer']},
            {'role_name': 'COMSEC Custodian', 'category': 'Defense Management',
             'aliases': ['Communications Security', 'Crypto Custodian']},
            {'role_name': 'TEMPEST Engineer', 'category': 'Defense Management',
             'aliases': ['EMSEC Engineer', 'Emanations Security']},
            {'role_name': 'Logistics Manager', 'category': 'Defense Management',
             'aliases': ['ILS Manager', 'Integrated Logistics Support']},
            {'role_name': 'Depot Manager', 'category': 'Defense Management',
             'aliases': ['Depot Operations', 'Maintenance Manager']},
            {'role_name': 'Field Service Engineer', 'category': 'Defense Management',
             'aliases': ['FSE', 'Field Engineer', 'Field Rep']},
            
            # --- NUCLEAR/CRITICAL SYSTEMS ---
            {'role_name': 'Nuclear Safety Officer', 'category': 'Nuclear Engineering',
             'aliases': ['NSO', 'Reactor Safety']},
            {'role_name': 'Criticality Safety Engineer', 'category': 'Nuclear Engineering',
             'aliases': ['Nuclear Criticality', 'CSE']},
            {'role_name': 'Radiation Protection Engineer', 'category': 'Nuclear Engineering',
             'aliases': ['Health Physics', 'RP Engineer']},
            {'role_name': 'Nuclear Quality Engineer', 'category': 'Nuclear Engineering',
             'aliases': ['NQE', 'Nuclear QA']},
            {'role_name': 'Reactor Engineer', 'category': 'Nuclear Engineering',
             'aliases': ['Nuclear Engineer', 'Core Engineer']},
            
            # --- CYBERSECURITY ---
            {'role_name': 'Cybersecurity Engineer', 'category': 'Cybersecurity',
             'aliases': ['Cyber Engineer', 'InfoSec Engineer']},
            {'role_name': 'ISSO', 'category': 'Cybersecurity',
             'aliases': ['Information System Security Officer']},
            {'role_name': 'ISSM', 'category': 'Cybersecurity',
             'aliases': ['Information System Security Manager']},
            {'role_name': 'Security Control Assessor', 'category': 'Cybersecurity',
             'aliases': ['SCA', 'RMF Assessor']},
            {'role_name': 'Penetration Tester', 'category': 'Cybersecurity',
             'aliases': ['Pen Tester', 'Red Team']},
            {'role_name': 'SOC Analyst', 'category': 'Cybersecurity',
             'aliases': ['Security Operations', 'Blue Team']},
            {'role_name': 'Incident Response Lead', 'category': 'Cybersecurity',
             'aliases': ['IR Lead', 'CERT Lead']},
            {'role_name': 'Threat Intelligence Analyst', 'category': 'Cybersecurity',
             'aliases': ['CTI Analyst', 'Threat Analyst']},
            {'role_name': 'Vulnerability Analyst', 'category': 'Cybersecurity',
             'aliases': ['Vuln Analyst', 'Security Researcher']},
            {'role_name': 'Security Architect', 'category': 'Cybersecurity',
             'aliases': ['Cybersecurity Architect', 'InfoSec Architect']},
            
            # --- MANUFACTURING & PRODUCTION ---
            {'role_name': 'Manufacturing Engineer', 'category': 'Manufacturing',
             'aliases': ['Mfg Engineer', 'Production Engineer']},
            {'role_name': 'Process Engineer', 'category': 'Manufacturing',
             'aliases': ['MPE', 'Manufacturing Process Engineer']},
            {'role_name': 'Industrial Engineer', 'category': 'Manufacturing',
             'aliases': ['IE', 'Methods Engineer']},
            {'role_name': 'Tool Designer', 'category': 'Manufacturing',
             'aliases': ['Tooling Engineer', 'Fixture Designer']},
            {'role_name': 'NC Programmer', 'category': 'Manufacturing',
             'aliases': ['CNC Programmer', 'Numerical Control']},
            {'role_name': 'Production Planner', 'category': 'Manufacturing',
             'aliases': ['Production Control', 'MRP Analyst']},
            {'role_name': 'Assembly Technician', 'category': 'Manufacturing',
             'aliases': ['Assembler', 'Production Technician']},
            {'role_name': 'Weld Engineer', 'category': 'Manufacturing',
             'aliases': ['Welding Engineer', 'Weld Inspector']},
            {'role_name': 'NDT Technician', 'category': 'Manufacturing',
             'aliases': ['NDE Technician', 'Nondestructive Testing']},
            {'role_name': 'Clean Room Technician', 'category': 'Manufacturing',
             'aliases': ['Cleanroom Operator', 'Contamination Control']},
            {'role_name': 'Composite Technician', 'category': 'Manufacturing',
             'aliases': ['Composites Engineer', 'Layup Technician']},
            {'role_name': 'Bonding Technician', 'category': 'Manufacturing',
             'aliases': ['Adhesive Specialist', 'Bond Tech']},
            {'role_name': 'Paint Technician', 'category': 'Manufacturing',
             'aliases': ['Coatings Specialist', 'Finish Tech']},
            {'role_name': 'Final Assembly Lead', 'category': 'Manufacturing',
             'aliases': ['Final Assembly', 'FAL Lead']},
            
            # --- RELIABILITY & SAFETY ---
            {'role_name': 'Reliability Engineer', 'category': 'Reliability & Safety',
             'aliases': ['R&M Engineer', 'RAMS Engineer']},
            {'role_name': 'Safety Engineer', 'category': 'Reliability & Safety',
             'aliases': ['System Safety', 'SSE']},
            {'role_name': 'FMEA Lead', 'category': 'Reliability & Safety',
             'aliases': ['FMECA Lead', 'Failure Modes']},
            {'role_name': 'FTA Analyst', 'category': 'Reliability & Safety',
             'aliases': ['Fault Tree Analysis', 'FTA Engineer']},
            {'role_name': 'Hazard Analyst', 'category': 'Reliability & Safety',
             'aliases': ['PHA Lead', 'Safety Analyst']},
            {'role_name': 'Human Factors Engineer', 'category': 'Reliability & Safety',
             'aliases': ['Ergonomics Engineer', 'HFE']},
            {'role_name': 'Maintainability Engineer', 'category': 'Reliability & Safety',
             'aliases': ['M&R Engineer', 'Supportability']},
            {'role_name': 'Availability Engineer', 'category': 'Reliability & Safety',
             'aliases': ['Ao Analyst', 'Operational Availability']},
            {'role_name': 'Sneak Circuit Analyst', 'category': 'Reliability & Safety',
             'aliases': ['SCA', 'Circuit Safety']},
            {'role_name': 'Parts Engineer', 'category': 'Reliability & Safety',
             'aliases': ['Parts Management', 'Component Engineer']},
            {'role_name': 'Derating Analyst', 'category': 'Reliability & Safety',
             'aliases': ['Parts Derating', 'Reliability Parts']},
            {'role_name': 'Radiation Effects Engineer', 'category': 'Reliability & Safety',
             'aliases': ['Rad Hard Engineer', 'SEE Analyst']},
            
            # --- DATA & DOCUMENTATION ---
            {'role_name': 'Technical Writer', 'category': 'Documentation',
             'aliases': ['Tech Writer', 'Documentation Specialist']},
            {'role_name': 'Technical Editor', 'category': 'Documentation',
             'aliases': ['Editor', 'Publications Editor']},
            {'role_name': 'Illustrator', 'category': 'Documentation',
             'aliases': ['Technical Illustrator', 'Graphics Artist']},
            {'role_name': 'Publications Manager', 'category': 'Documentation',
             'aliases': ['Pubs Manager', 'Documentation Manager']},
            {'role_name': 'Data Manager', 'category': 'Documentation',
             'aliases': ['Data Management', 'TDM']},
            {'role_name': 'Records Manager', 'category': 'Documentation',
             'aliases': ['Records Management', 'Document Control']},
            {'role_name': 'Configuration Analyst', 'category': 'Documentation',
             'aliases': ['CM Analyst', 'Config Specialist']},
            {'role_name': 'Baseline Manager', 'category': 'Documentation',
             'aliases': ['Configuration Baseline', 'Baseline Control']},
            {'role_name': 'Drawing Checker', 'category': 'Documentation',
             'aliases': ['Drawing Control', 'Drawing Release']},
            {'role_name': 'Standards Engineer', 'category': 'Documentation',
             'aliases': ['Standards Manager', 'Standardization']},
            
            # --- SUPPLY CHAIN ---
            {'role_name': 'Supply Chain Manager', 'category': 'Supply Chain',
             'aliases': ['SCM', 'Supply Chain Lead']},
            {'role_name': 'Buyer', 'category': 'Supply Chain',
             'aliases': ['Procurement Specialist', 'Purchasing Agent']},
            {'role_name': 'Subcontracts Manager', 'category': 'Supply Chain',
             'aliases': ['Subcontracts Admin', 'Subk Manager']},
            {'role_name': 'Supplier Manager', 'category': 'Supply Chain',
             'aliases': ['Vendor Manager', 'Supplier Development']},
            {'role_name': 'Source Inspector', 'category': 'Supply Chain',
             'aliases': ['Supplier Inspector', 'SQI']},
            {'role_name': 'Material Planner', 'category': 'Supply Chain',
             'aliases': ['MRP Planner', 'Materials Manager']},
            {'role_name': 'Inventory Manager', 'category': 'Supply Chain',
             'aliases': ['Inventory Control', 'Stock Manager']},
            {'role_name': 'Shipping Coordinator', 'category': 'Supply Chain',
             'aliases': ['Traffic Manager', 'Logistics Coordinator']},
            {'role_name': 'Receiving Inspector', 'category': 'Supply Chain',
             'aliases': ['Incoming QC', 'Receiving QA']},
            {'role_name': 'Counterfeit Prevention', 'category': 'Supply Chain',
             'aliases': ['DFARS Compliance', 'Parts Authentication']},
            
            # --- PROGRAM CONTROLS ---
            {'role_name': 'Earned Value Analyst', 'category': 'Program Controls',
             'aliases': ['EVM Manager', 'EVMS Lead']},
            {'role_name': 'Baseline Change Manager', 'category': 'Program Controls',
             'aliases': ['CCB Secretary', 'Change Control']},
            {'role_name': 'Schedule Analyst', 'category': 'Program Controls',
             'aliases': ['IMS Analyst', 'Schedule Lead']},
            {'role_name': 'Budget Analyst', 'category': 'Program Controls',
             'aliases': ['Financial Analyst', 'Cost Account Lead']},
            {'role_name': 'Variance Analyst', 'category': 'Program Controls',
             'aliases': ['VR Lead', 'Variance Reporting']},
            {'role_name': 'Rate Analyst', 'category': 'Program Controls',
             'aliases': ['Indirect Rate', 'Rate Development']},
            {'role_name': 'EAC Analyst', 'category': 'Program Controls',
             'aliases': ['Estimate at Completion', 'Forecasting']},
            {'role_name': 'Data Rights Analyst', 'category': 'Program Controls',
             'aliases': ['IP Manager', 'Technical Data Rights']},
            {'role_name': 'CDRL Manager', 'category': 'Program Controls',
             'aliases': ['Data Deliverables', 'DID Manager']},
            {'role_name': 'Metrics Manager', 'category': 'Program Controls',
             'aliases': ['KPI Manager', 'Performance Metrics']},
            
            # --- SPECIALIZED ENGINEERING ---
            {'role_name': 'Survivability Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Vulnerability Engineer', 'Platform Survivability']},
            {'role_name': 'Signature Engineer', 'category': 'Specialized Engineering',
             'aliases': ['RCS Engineer', 'Stealth Engineer']},
            {'role_name': 'Acoustics Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Noise Engineer', 'Vibration Engineer']},
            {'role_name': 'EMC Engineer', 'category': 'Specialized Engineering',
             'aliases': ['EMI Engineer', 'Electromagnetic Compatibility']},
            {'role_name': 'ESD Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Electrostatic Discharge', 'Static Control']},
            {'role_name': 'Lightning Engineer', 'category': 'Specialized Engineering',
             'aliases': ['HIRF Engineer', 'Atmospheric Hazards']},
            {'role_name': 'Corrosion Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Corrosion Control', 'Materials Protection']},
            {'role_name': 'Fatigue Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Damage Tolerance', 'Structural Fatigue']},
            {'role_name': 'Loads Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Structural Loads', 'Loads Analysis']},
            {'role_name': 'Mass Properties Engineer', 'category': 'Specialized Engineering',
             'aliases': ['Weight Engineer', 'CG Engineer']},
            {'role_name': 'Producibility Engineer', 'category': 'Specialized Engineering',
             'aliases': ['DFM Engineer', 'Design for Manufacturing']},
            {'role_name': 'Simulation Engineer', 'category': 'Specialized Engineering',
             'aliases': ['HWIL Engineer', 'Sim Engineer']},
            {'role_name': 'Certification Engineer', 'category': 'Specialized Engineering',
             'aliases': ['DER', 'Airworthiness']},
            
            # --- GOVERNMENT/CUSTOMER ---
            {'role_name': 'Government Customer', 'category': 'Customer',
             'aliases': ['Government', 'DoD Customer']},
            {'role_name': 'Prime Contractor', 'category': 'Customer',
             'aliases': ['Prime', 'OEM']},
            {'role_name': 'End User', 'category': 'Customer',
             'aliases': ['Operator', 'User']},
            {'role_name': 'Warfighter', 'category': 'Customer',
             'aliases': ['Service Member', 'Military User']},
            {'role_name': 'Program Office', 'category': 'Customer',
             'aliases': ['PMO', 'PO']},
            {'role_name': 'Stakeholder', 'category': 'Customer',
             'aliases': ['Key Stakeholder', 'External Stakeholder']},
            
            # --- ADDITIONAL ORGANIZATIONAL ROLES ---
            {'role_name': 'Board of Directors', 'category': 'Organization',
             'aliases': ['Board', 'Directors']},
            {'role_name': 'Chief Executive Officer', 'category': 'Organization',
             'aliases': ['CEO', 'Chief Executive']},
            {'role_name': 'Chief Operating Officer', 'category': 'Organization',
             'aliases': ['COO', 'Operations Executive']},
            {'role_name': 'Chief Financial Officer', 'category': 'Organization',
             'aliases': ['CFO', 'Finance Executive']},
            {'role_name': 'Chief Technology Officer', 'category': 'Organization',
             'aliases': ['CTO', 'Tech Executive']},
            {'role_name': 'Chief Information Officer', 'category': 'Organization',
             'aliases': ['CIO', 'IT Executive']},
            {'role_name': 'Chief Security Officer', 'category': 'Organization',
             'aliases': ['CSO', 'Security Executive']},
            {'role_name': 'Sector Lead', 'category': 'Organization',
             'aliases': ['Sector VP', 'Division Lead']},
            {'role_name': 'Business Unit Manager', 'category': 'Organization',
             'aliases': ['BU Manager', 'Unit Lead']},
            {'role_name': 'Functional Manager', 'category': 'Organization',
             'aliases': ['Department Manager', 'Functional Lead']},
            
            # --- REVIEW/APPROVAL AUTHORITIES ---
            {'role_name': 'Approval Authority', 'category': 'Approval',
             'aliases': ['Approver', 'Signatory']},
            {'role_name': 'Design Authority', 'category': 'Approval',
             'aliases': ['DA', 'Design Approval']},
            {'role_name': 'Technical Authority', 'category': 'Approval',
             'aliases': ['TA', 'Engineering Authority']},
            {'role_name': 'Quality Authority', 'category': 'Approval',
             'aliases': ['QA Authority', 'Quality Approval']},
            {'role_name': 'Safety Authority', 'category': 'Approval',
             'aliases': ['Safety Approval', 'Safety Concurrence']},
            {'role_name': 'Reliability Authority', 'category': 'Approval',
             'aliases': ['R&M Authority', 'Reliability Approval']},
            {'role_name': 'Review Board', 'category': 'Approval',
             'aliases': ['Board', 'Review Panel']},
            {'role_name': 'CCB Chair', 'category': 'Approval',
             'aliases': ['Configuration Control Board', 'CCB Lead']},
            {'role_name': 'MRB Chair', 'category': 'Approval',
             'aliases': ['Material Review Board', 'MRB Lead']},
            {'role_name': 'TRB Chair', 'category': 'Approval',
             'aliases': ['Technical Review Board', 'TRB Lead']},
            {'role_name': 'ERB Chair', 'category': 'Approval',
             'aliases': ['Engineering Review Board', 'ERB Lead']},
            {'role_name': 'PRB Chair', 'category': 'Approval',
             'aliases': ['Program Review Board', 'PRB Lead']},
            
            # --- TRAINING/SUPPORT ---
            {'role_name': 'Training Developer', 'category': 'Training & Support',
             'aliases': ['Instructional Designer', 'Course Developer']},
            {'role_name': 'Instructor', 'category': 'Training & Support',
             'aliases': ['Trainer', 'Subject Matter Expert']},
            {'role_name': 'Simulator Developer', 'category': 'Training & Support',
             'aliases': ['Training Device', 'Sim Developer']},
            {'role_name': 'Technical Support Engineer', 'category': 'Training & Support',
             'aliases': ['TSE', 'Product Support']},
            {'role_name': 'Help Desk', 'category': 'Training & Support',
             'aliases': ['IT Support', 'Service Desk']},
            {'role_name': 'On-Site Support', 'category': 'Training & Support',
             'aliases': ['Customer Site Rep', 'Field Support']},
            
            # --- LEGAL/CONTRACTS ---
            {'role_name': 'Legal Counsel', 'category': 'Legal',
             'aliases': ['Attorney', 'Corporate Counsel']},
            {'role_name': 'Contract Administrator', 'category': 'Legal',
             'aliases': ['Contracts Admin', 'Contract Specialist']},
            {'role_name': 'Intellectual Property Counsel', 'category': 'Legal',
             'aliases': ['IP Attorney', 'Patent Counsel']},
            {'role_name': 'Export Counsel', 'category': 'Legal',
             'aliases': ['ITAR Counsel', 'Trade Compliance']},
            {'role_name': 'Labor Relations', 'category': 'Legal',
             'aliases': ['Employee Relations', 'Union Relations']},
        ]
        
        # ================================================================
        # COMMON DELIVERABLES (as roles for detection)
        # v2.9.10: Expanded to 100+ deliverables (#24)
        # ================================================================
        deliverables = [
            # --- REQUIREMENTS DOCUMENTS ---
            {'role_name': 'SRS', 'category': 'Deliverable',
             'aliases': ['Software Requirements Specification', 'System Requirements Specification']},
            {'role_name': 'SRD', 'category': 'Deliverable',
             'aliases': ['System Requirements Document', 'Requirements Document']},
            {'role_name': 'PRD', 'category': 'Deliverable',
             'aliases': ['Product Requirements Document', 'Program Requirements']},
            {'role_name': 'IRS', 'category': 'Deliverable',
             'aliases': ['Interface Requirements Specification', 'Interface Requirements']},
            {'role_name': 'CRS', 'category': 'Deliverable',
             'aliases': ['Customer Requirements Specification', 'Customer Spec']},
            {'role_name': 'DRS', 'category': 'Deliverable',
             'aliases': ['Derived Requirements Specification', 'Derived Spec']},
            {'role_name': 'HRS', 'category': 'Deliverable',
             'aliases': ['Hardware Requirements Specification', 'HW Spec']},
            {'role_name': 'SWReqS', 'category': 'Deliverable',
             'aliases': ['Software Requirements Specification', 'SW Requirements']},
            {'role_name': 'ERS', 'category': 'Deliverable',
             'aliases': ['Environmental Requirements Specification', 'Env Spec']},
            {'role_name': 'PRS', 'category': 'Deliverable',
             'aliases': ['Performance Requirements Specification', 'Perf Spec']},
            
            # --- DESIGN DOCUMENTS ---
            {'role_name': 'SDD', 'category': 'Deliverable',
             'aliases': ['Software Design Document', 'System Design Document']},
            {'role_name': 'ICD', 'category': 'Deliverable',
             'aliases': ['Interface Control Document', 'Interface Control Drawing']},
            {'role_name': 'ADD', 'category': 'Deliverable',
             'aliases': ['Architecture Design Document', 'Architectural Description']},
            {'role_name': 'HDD', 'category': 'Deliverable',
             'aliases': ['Hardware Design Document', 'HW Design']},
            {'role_name': 'DBDD', 'category': 'Deliverable',
             'aliases': ['Database Design Document', 'Data Dictionary']},
            {'role_name': 'DDD', 'category': 'Deliverable',
             'aliases': ['Detailed Design Document', 'Detail Design']},
            {'role_name': 'PDD', 'category': 'Deliverable',
             'aliases': ['Preliminary Design Document', 'Prelim Design']},
            
            # --- PLANS ---
            {'role_name': 'SEMP', 'category': 'Deliverable',
             'aliases': ['Systems Engineering Management Plan', 'SE Management Plan']},
            {'role_name': 'TEMP', 'category': 'Deliverable',
             'aliases': ['Test & Evaluation Master Plan', 'Test Master Plan']},
            {'role_name': 'PMP', 'category': 'Deliverable',
             'aliases': ['Program Management Plan', 'Project Management Plan']},
            {'role_name': 'RMP', 'category': 'Deliverable',
             'aliases': ['Risk Management Plan', 'Risk Mitigation Plan']},
            {'role_name': 'CMP', 'category': 'Deliverable',
             'aliases': ['Configuration Management Plan', 'CM Plan']},
            {'role_name': 'QAP', 'category': 'Deliverable',
             'aliases': ['Quality Assurance Plan', 'QA Plan']},
            {'role_name': 'SQAP', 'category': 'Deliverable',
             'aliases': ['Software Quality Assurance Plan', 'SW QA Plan']},
            {'role_name': 'SDP', 'category': 'Deliverable',
             'aliases': ['Software Development Plan', 'SW Dev Plan']},
            {'role_name': 'STP', 'category': 'Deliverable',
             'aliases': ['Software Test Plan', 'System Test Plan']},
            {'role_name': 'SVVP', 'category': 'Deliverable',
             'aliases': ['Software Verification Validation Plan', 'V&V Plan']},
            {'role_name': 'SCMP', 'category': 'Deliverable',
             'aliases': ['Software Configuration Management Plan', 'SW CM Plan']},
            {'role_name': 'SSP', 'category': 'Deliverable',
             'aliases': ['System Security Plan', 'Security Plan']},
            {'role_name': 'SSPP', 'category': 'Deliverable',
             'aliases': ['System Safety Program Plan', 'Safety Plan']},
            {'role_name': 'ITP', 'category': 'Deliverable',
             'aliases': ['Integration Test Plan', 'I&T Plan']},
            {'role_name': 'ATP', 'category': 'Deliverable',
             'aliases': ['Acceptance Test Plan', 'Acceptance Procedures']},
            {'role_name': 'OTP', 'category': 'Deliverable',
             'aliases': ['Operational Test Plan', 'OT&E Plan']},
            {'role_name': 'ILSP', 'category': 'Deliverable',
             'aliases': ['Integrated Logistics Support Plan', 'Logistics Plan']},
            {'role_name': 'TMP', 'category': 'Deliverable',
             'aliases': ['Training Management Plan', 'Training Plan']},
            {'role_name': 'TRP', 'category': 'Deliverable',
             'aliases': ['Transition Plan', 'Deployment Plan']},
            {'role_name': 'DMP', 'category': 'Deliverable',
             'aliases': ['Data Management Plan', 'Data Plan']},
            {'role_name': 'CyberSP', 'category': 'Deliverable',
             'aliases': ['Cybersecurity Plan', 'Cyber Plan']},
            {'role_name': 'RAP', 'category': 'Deliverable',
             'aliases': ['Reliability Allocation Plan', 'R&M Plan']},
            {'role_name': 'MAP', 'category': 'Deliverable',
             'aliases': ['Mission Assurance Plan', 'MA Plan']},
            
            # --- SCHEDULES ---
            {'role_name': 'IMS', 'category': 'Deliverable',
             'aliases': ['Integrated Master Schedule', 'Master Schedule']},
            {'role_name': 'IMP', 'category': 'Deliverable',
             'aliases': ['Integrated Master Plan', 'Master Plan']},
            {'role_name': 'MPS', 'category': 'Deliverable',
             'aliases': ['Master Program Schedule', 'Program Schedule']},
            {'role_name': 'DTS', 'category': 'Deliverable',
             'aliases': ['Development Test Schedule', 'Test Schedule']},
            
            # --- REVIEWS ---
            {'role_name': 'SRR', 'category': 'Deliverable',
             'aliases': ['System Requirements Review', 'SRR Package']},
            {'role_name': 'SDR', 'category': 'Deliverable',
             'aliases': ['System Design Review', 'SDR Package']},
            {'role_name': 'PDR', 'category': 'Deliverable',
             'aliases': ['Preliminary Design Review', 'PDR Package']},
            {'role_name': 'CDR', 'category': 'Deliverable',
             'aliases': ['Critical Design Review', 'CDR Package']},
            {'role_name': 'TRR', 'category': 'Deliverable',
             'aliases': ['Test Readiness Review', 'TRR Package']},
            {'role_name': 'PRR', 'category': 'Deliverable',
             'aliases': ['Production Readiness Review', 'PRR Package']},
            {'role_name': 'FRR', 'category': 'Deliverable',
             'aliases': ['Flight Readiness Review', 'FRR Package']},
            {'role_name': 'ORR', 'category': 'Deliverable',
             'aliases': ['Operational Readiness Review', 'ORR Package']},
            {'role_name': 'FQR', 'category': 'Deliverable',
             'aliases': ['Formal Qualification Review', 'FQR Package']},
            {'role_name': 'SVR', 'category': 'Deliverable',
             'aliases': ['Software Version Review', 'SW Review']},
            {'role_name': 'MRR', 'category': 'Deliverable',
             'aliases': ['Mission Readiness Review', 'Launch Readiness']},
            {'role_name': 'PSR', 'category': 'Deliverable',
             'aliases': ['Program Status Review', 'Status Review']},
            
            # --- AUDITS ---
            {'role_name': 'FCA', 'category': 'Deliverable',
             'aliases': ['Functional Configuration Audit']},
            {'role_name': 'PCA', 'category': 'Deliverable',
             'aliases': ['Physical Configuration Audit']},
            {'role_name': 'SVA', 'category': 'Deliverable',
             'aliases': ['Software Version Audit', 'Code Audit']},
            
            # --- TECHNICAL DATA ---
            {'role_name': 'TDP', 'category': 'Deliverable',
             'aliases': ['Technical Data Package', 'Tech Data Package']},
            {'role_name': 'IETM', 'category': 'Deliverable',
             'aliases': ['Interactive Electronic Technical Manual', 'Electronic Manual']},
            {'role_name': 'TM', 'category': 'Deliverable',
             'aliases': ['Technical Manual', 'Tech Manual']},
            {'role_name': 'OM', 'category': 'Deliverable',
             'aliases': ['Operators Manual', 'Operations Manual']},
            {'role_name': 'MM', 'category': 'Deliverable',
             'aliases': ['Maintenance Manual', 'Service Manual']},
            {'role_name': 'IPC', 'category': 'Deliverable',
             'aliases': ['Illustrated Parts Catalog', 'Parts Catalog']},
            {'role_name': 'IPB', 'category': 'Deliverable',
             'aliases': ['Illustrated Parts Breakdown', 'Parts Breakdown']},
            {'role_name': 'SIR', 'category': 'Deliverable',
             'aliases': ['System Installation Requirements', 'Installation Doc']},
            
            # --- CONTRACT/BUSINESS ---
            {'role_name': 'SOW', 'category': 'Deliverable',
             'aliases': ['Statement of Work', 'Scope of Work']},
            {'role_name': 'WBS', 'category': 'Deliverable',
             'aliases': ['Work Breakdown Structure']},
            {'role_name': 'CWBS', 'category': 'Deliverable',
             'aliases': ['Contract Work Breakdown Structure']},
            {'role_name': 'CDRL', 'category': 'Deliverable',
             'aliases': ['Contract Data Requirements List', 'Data Item']},
            {'role_name': 'DID', 'category': 'Deliverable',
             'aliases': ['Data Item Description']},
            {'role_name': 'CPR', 'category': 'Deliverable',
             'aliases': ['Contract Performance Report', 'Cost Report']},
            {'role_name': 'CFSR', 'category': 'Deliverable',
             'aliases': ['Contract Funds Status Report', 'Funds Report']},
            {'role_name': 'EAC', 'category': 'Deliverable',
             'aliases': ['Estimate at Completion', 'Cost Estimate']},
            {'role_name': 'IBR', 'category': 'Deliverable',
             'aliases': ['Integrated Baseline Review', 'Baseline Review']},
            
            # --- ANALYSIS REPORTS ---
            {'role_name': 'FMEA', 'category': 'Deliverable',
             'aliases': ['Failure Modes Effects Analysis', 'FMECA']},
            {'role_name': 'FTA', 'category': 'Deliverable',
             'aliases': ['Fault Tree Analysis', 'Fault Tree']},
            {'role_name': 'PHA', 'category': 'Deliverable',
             'aliases': ['Preliminary Hazard Analysis', 'Hazard Analysis']},
            {'role_name': 'SHA', 'category': 'Deliverable',
             'aliases': ['System Hazard Analysis', 'Safety Analysis']},
            {'role_name': 'SSA', 'category': 'Deliverable',
             'aliases': ['System Safety Assessment', 'Safety Assessment']},
            {'role_name': 'SSHA', 'category': 'Deliverable',
             'aliases': ['Subsystem Hazard Analysis', 'SubHA']},
            {'role_name': 'OSHA', 'category': 'Deliverable',
             'aliases': ['Operating System Hazard Analysis', 'Ops Hazard']},
            {'role_name': 'RCM', 'category': 'Deliverable',
             'aliases': ['Reliability Centered Maintenance', 'Reliability Analysis']},
            {'role_name': 'LSAR', 'category': 'Deliverable',
             'aliases': ['Logistics Support Analysis Record', 'LSA Record']},
            {'role_name': 'LCC', 'category': 'Deliverable',
             'aliases': ['Life Cycle Cost', 'Cost Analysis']},
            {'role_name': 'TLCSM', 'category': 'Deliverable',
             'aliases': ['Total Life Cycle Systems Management', 'Life Cycle Analysis']},
            {'role_name': 'TCR', 'category': 'Deliverable',
             'aliases': ['Trade Study Report', 'Trade Analysis']},
            {'role_name': 'EMI/EMC', 'category': 'Deliverable',
             'aliases': ['EMI EMC Analysis', 'Electromagnetic Analysis']},
            {'role_name': 'TIR', 'category': 'Deliverable',
             'aliases': ['Test Incident Report', 'Anomaly Report']},
            
            # --- TEST DOCUMENTS ---
            {'role_name': 'STD', 'category': 'Deliverable',
             'aliases': ['Software Test Description', 'Test Description']},
            {'role_name': 'STR', 'category': 'Deliverable',
             'aliases': ['Software Test Report', 'Test Report']},
            {'role_name': 'STPR', 'category': 'Deliverable',
             'aliases': ['Software Test Procedure', 'Test Procedure']},
            {'role_name': 'QTP', 'category': 'Deliverable',
             'aliases': ['Qualification Test Procedure', 'Qual Procedure']},
            {'role_name': 'QTR', 'category': 'Deliverable',
             'aliases': ['Qualification Test Report', 'Qual Report']},
            {'role_name': 'FAT', 'category': 'Deliverable',
             'aliases': ['Factory Acceptance Test', 'FAT Procedure']},
            {'role_name': 'SAT', 'category': 'Deliverable',
             'aliases': ['Site Acceptance Test', 'SAT Procedure']},
            {'role_name': 'VCR', 'category': 'Deliverable',
             'aliases': ['Verification Cross Reference', 'VCRD']},
            {'role_name': 'RTM', 'category': 'Deliverable',
             'aliases': ['Requirements Traceability Matrix', 'Trace Matrix']},
        ]
        
        # Combine roles and deliverables
        all_roles = builtin_roles + deliverables
        
        return self.import_roles_to_dictionary(
            all_roles, 
            source='builtin',
            created_by='system'
        )
    
    # ================================================================
    # SHAREABLE DICTIONARY METHODS
    # ================================================================
    
    def export_to_master_file(self, filepath: str = None, 
                              include_inactive: bool = False) -> Dict:
        """
        Export the dictionary to a shareable master file.
        
        This creates a JSON file that can be distributed to team members.
        They can place it in their app folder or a shared network location.
        
        Args:
            filepath: Output path (defaults to app_dir/role_dictionary_master.json)
            include_inactive: Include deactivated roles
        
        Returns:
            Dict with success status and file path
        """
        if filepath is None:
            paths = get_dictionary_paths()
            filepath = str(paths['master'])
        
        roles = self.get_role_dictionary(include_inactive)
        
        # Clean up for export (remove IDs, normalize dates)
        export_roles = []
        for role in roles:
            export_role = {
                'role_name': role['role_name'],
                'normalized_name': role['normalized_name'],
                'aliases': role.get('aliases', []),
                'category': role.get('category', 'Custom'),
                'description': role.get('description'),
                'is_deliverable': role.get('is_deliverable', False),
                'source': role.get('source', 'exported'),
                'source_document': role.get('source_document'),
                'notes': role.get('notes')
            }
            # Only include non-None values
            export_role = {k: v for k, v in export_role.items() if v is not None}
            export_roles.append(export_role)
        
        return export_dictionary_to_file(export_roles, filepath)
    
    def sync_from_master_file(self, filepath: str = None, 
                               merge_mode: str = 'add_new',
                               create_if_missing: bool = False) -> Dict:
        """
        Sync the dictionary from a master file.
        
        v2.9.3 B02: Added create_if_missing option to create master file from current dictionary.
        
        Args:
            filepath: Path to master file (auto-detected if None)
            merge_mode: How to handle conflicts
                - 'add_new': Only add roles not already present (default)
                - 'replace_all': Clear and replace entire dictionary
                - 'update_existing': Update existing roles from file
            create_if_missing: If True and no master file found, create one from current dictionary
        
        Returns:
            Dict with counts of added, updated, skipped
        """
        # Find master file
        if filepath is None:
            paths = get_dictionary_paths()
            # Check shared location first, then local
            if paths['shared'] and paths['shared'].exists():
                filepath = str(paths['shared'])
            elif paths['master'].exists():
                filepath = str(paths['master'])
            else:
                # v2.9.3 B02: Create master file if requested
                if create_if_missing:
                    try:
                        # Export current dictionary to master file
                        export_result = self.export_to_master_file(str(paths['master']))
                        if export_result.get('success'):
                            return {
                                'success': True,
                                'created_new': True,
                                'filepath': str(paths['master']),
                                'message': f"Created new master dictionary with {export_result.get('count', 0)} roles"
                            }
                        else:
                            return {
                                'success': False,
                                'error': f"Failed to create master file: {export_result.get('error', 'Unknown error')}"
                            }
                    except Exception as e:
                        return {
                            'success': False,
                            'error': f"Error creating master file: {str(e)}"
                        }
                else:
                    return {
                        'success': False,
                        'error': 'No master dictionary file found',
                        'can_create': True,
                        'suggested_path': str(paths['master'])
                    }
        
        result = load_dictionary_from_file(filepath)
        if not result['success']:
            return result
        
        roles = result['roles']
        metadata = result.get('metadata', {})
        
        results = {
            'added': 0,
            'updated': 0,
            'skipped': 0,
            'errors': [],
            'source_file': filepath,
            'source_metadata': metadata
        }
        
        if merge_mode == 'replace_all':
            # Clear existing and import all
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM role_dictionary')
            conn.commit()
            conn.close()
            
            import_result = self.import_roles_to_dictionary(
                roles,
                source='master_sync',
                source_document=Path(filepath).name,
                created_by='sync'
            )
            results['added'] = import_result.get('added', 0)
            results['errors'] = import_result.get('errors', [])
        
        elif merge_mode == 'update_existing':
            # Update existing, add new
            for role in roles:
                role_name = role.get('role_name') or role.get('name')
                if not role_name:
                    continue
                
                normalized = role_name.lower().strip()
                
                # Check if exists
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute(
                    'SELECT id FROM role_dictionary WHERE normalized_name = ?',
                    (normalized,)
                )
                existing = cursor.fetchone()
                conn.close()
                
                if existing:
                    # Update
                    update_result = self.update_role_in_dictionary(
                        existing[0],
                        updated_by='sync',
                        category=role.get('category'),
                        aliases=role.get('aliases', []),
                        description=role.get('description'),
                        notes=role.get('notes')
                    )
                    if update_result.get('success'):
                        results['updated'] += 1
                else:
                    # Add new
                    add_result = self.add_role_to_dictionary(
                        role_name=role_name,
                        source='master_sync',
                        source_document=Path(filepath).name,
                        category=role.get('category', 'Imported'),
                        aliases=role.get('aliases', []),
                        description=role.get('description'),
                        is_deliverable=role.get('is_deliverable', False),
                        created_by='sync',
                        notes=role.get('notes')
                    )
                    if add_result.get('success'):
                        results['added'] += 1
        
        else:  # add_new (default)
            import_result = self.import_roles_to_dictionary(
                roles,
                source='master_sync',
                source_document=Path(filepath).name,
                created_by='sync'
            )
            results['added'] = import_result.get('added', 0)
            results['skipped'] = import_result.get('skipped', 0)
            results['errors'] = import_result.get('errors', [])
        
        results['success'] = True
        return results
    
    def get_dictionary_status(self) -> Dict:
        """
        Get status of dictionary files and sync state.
        
        Returns info about:
        - Local database role count
        - Master file existence and role count
        - Shared folder configuration
        - Last sync time
        """
        paths = get_dictionary_paths()
        
        status = {
            'database': {
                'path': self.db_path,
                'exists': Path(self.db_path).exists(),
                'role_count': 0
            },
            'master_file': {
                'path': str(paths['master']),
                'exists': paths['master'].exists(),
                'role_count': 0,
                'metadata': {}
            },
            'shared_folder': {
                'configured': paths['shared'] is not None,
                'path': str(paths['shared']) if paths['shared'] else None,
                'exists': paths['shared'].exists() if paths['shared'] else False,
                'role_count': 0
            }
        }
        
        # Count roles in database
        try:
            roles = self.get_role_dictionary(include_inactive=True)
            status['database']['role_count'] = len(roles)
        except Exception:
            pass
        
        # Check master file
        if paths['master'].exists():
            result = load_dictionary_from_file(str(paths['master']))
            if result['success']:
                status['master_file']['role_count'] = result['count']
                status['master_file']['metadata'] = result.get('metadata', {})
        
        # Check shared folder
        if paths['shared'] and paths['shared'].exists():
            result = load_dictionary_from_file(str(paths['shared']))
            if result['success']:
                status['shared_folder']['role_count'] = result['count']
        
        return status
    
    # ================================================================
    # v2.9.1 D1: SYNC FROM HISTORY
    # ================================================================
    
    def sync_from_history(self, min_occurrences: int = 2, 
                          min_confidence: float = 0.7) -> Dict:
        """
        Sync dictionary from roles found in scan history.
        
        This is useful when no master file exists but you have
        historical scan data with extracted roles.
        
        v2.9.1 D1: Added as alternative to sync_from_master_file
        
        Args:
            min_occurrences: Minimum times role must appear across scans
            min_confidence: Minimum confidence score threshold
        
        Returns:
            Dict with success status and counts
        """
        results = {
            'success': False,
            'added': 0,
            'skipped': 0,
            'total_found': 0,
            'errors': []
        }
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all roles from role_occurrences with their counts
            cursor.execute('''
                SELECT role_name, COUNT(*) as occurrence_count, 
                       AVG(confidence) as avg_confidence,
                       GROUP_CONCAT(DISTINCT category) as categories
                FROM role_occurrences
                GROUP BY LOWER(role_name)
                HAVING COUNT(*) >= ? AND AVG(confidence) >= ?
                ORDER BY occurrence_count DESC
            ''', (min_occurrences, min_confidence))
            
            history_roles = cursor.fetchall()
            conn.close()
            
            results['total_found'] = len(history_roles)
            
            if not history_roles:
                results['error'] = 'No roles found in scan history meeting criteria'
                return results
            
            # Convert to role dicts for import
            roles_to_import = []
            for role_name, count, avg_conf, categories in history_roles:
                # Determine best category
                category = 'From History'
                if categories:
                    cat_list = categories.split(',')
                    # Pick most specific category (not 'Unknown' or 'Other')
                    for cat in cat_list:
                        cat = cat.strip()
                        if cat and cat not in ['Unknown', 'Other', '']:
                            category = cat
                            break
                
                roles_to_import.append({
                    'role_name': role_name,
                    'category': category,
                    'source': 'history_sync',
                    'notes': f'Auto-imported from scan history. Found {count} times with {avg_conf:.0%} avg confidence.'
                })
            
            # Import to dictionary
            import_result = self.import_roles_to_dictionary(
                roles_to_import,
                source='history_sync',
                created_by='sync'
            )
            
            results['added'] = import_result.get('added', 0)
            results['skipped'] = import_result.get('skipped', 0)
            results['errors'] = import_result.get('errors', [])
            results['success'] = True
            
        except Exception as e:
            results['error'] = str(e)
            results['errors'].append(str(e))
        
        return results


# Graph cache for performance
_graph_cache = {}
_graph_cache_max_age = 300  # 5 minutes

def get_cached_graph(session_id: str, file_hash: str, db: 'ScanHistoryDB', 
                     max_nodes: int = 100, min_weight: int = 1) -> Dict:
    """Get graph data with caching based on session and file hash."""
    import time
    
    cache_key = f"{session_id}:{file_hash}:{max_nodes}:{min_weight}"
    now = time.time()
    
    if cache_key in _graph_cache:
        cached_time, cached_data = _graph_cache[cache_key]
        if now - cached_time < _graph_cache_max_age:
            return cached_data
    
    # Generate fresh data
    data = db.get_role_graph_data(max_nodes, min_weight)
    _graph_cache[cache_key] = (now, data)
    
    # Cleanup old cache entries
    expired_keys = [k for k, (t, _) in _graph_cache.items() if now - t > _graph_cache_max_age * 2]
    for k in expired_keys:
        del _graph_cache[k]
    
    return data


# Singleton instance
_db_instance = None

def get_scan_history_db() -> ScanHistoryDB:
    """Get singleton instance of scan history database."""
    global _db_instance
    if _db_instance is None:
        _db_instance = ScanHistoryDB()
    return _db_instance
