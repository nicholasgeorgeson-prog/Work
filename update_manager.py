"""
TechWriterReview Update Manager v1.4
====================================
Backend module for managing application updates from the UI.

v1.4 Changes (3.0.114):
- Added routing for document_compare/ module (Document Comparison feature)
- Added routing for portfolio/ module (Portfolio tile view feature)
- Added routing for static/css/features/ directory
- Added flat-file prefixes: document_compare_, portfolio_, static_css_features_

v1.3 Changes (3.0.91d):
- Fixed app_dir auto-detection (no longer hardcodes "app" folder name)
- Added support for flat mode (updates/backups inside app folder)
- UpdateConfig now accepts app_dir parameter directly
- Improved folder detection logic for various installation layouts

v1.2 Changes (3.0.73):
- Added .md and .ico to supported extensions
- Added routing for static/js subdirectories (ui, api, features, utils)
- Added routing for tools/ and data/ directories
- Fixed index.html to route to templates/ (not app root)
- Fixed style.css to route to static/css/ (not app root)
- Added skip for runtime directories (logs/, temp/, backups/)
- Added many new flat-file prefixes (see below)

Features:
- Monitors "updates" folder for new files
- Supports native file extensions (.py, .js, .css, .html, .json, .md, .ico, .ps1)
- Also supports legacy .txt wrapped files for backward compatibility
- Creates backups before applying updates
- Applies updates with verification
- Supports rollback to previous versions
- Provides API endpoints for UI integration

Folder Layout (Flat Mode - Default):
    TechWriterReview/               <- app_dir AND base_dir (same folder)
    ├── app.py                      <- Main application
    ├── updates/                    <- Drop update files here
    │   └── UPDATE_README.md        <- Instructions
    ├── backups/                    <- Auto-created backup storage
    └── logs/                       <- Application logs

Folder Layout (Nested Mode - Legacy):
    InstallRoot/                    <- base_dir
    ├── TechWriterReview/           <- app_dir (auto-detected)
    │   └── app.py
    ├── updates/                    <- Drop update files here
    └── backups/                    <- Auto-created backup storage

Update File Formats:

1. DIRECTORY STRUCTURE (Preferred - just mirror the app structure):
   updates/static/js/features/roles.js     -> app/static/js/features/roles.js
   updates/static/js/ui/modals.js          -> app/static/js/ui/modals.js
   updates/templates/index.html            -> app/templates/index.html
   updates/statement_forge/export.py       -> app/statement_forge/export.py
   updates/tools/HyperlinkValidator.ps1    -> app/tools/HyperlinkValidator.ps1

2. LEGACY .TXT EXTENSION (for air-gapped networks):
   updates/static/js/features/roles.js.txt -> app/static/js/features/roles.js
   (Same as above, just add .txt to bypass network filters)

3. FLAT FILES WITH PREFIX (for simple drag-and-drop):
   Prefix                      -> Destination
   -------------------------   -----------------------------------
   static_js_features_X        -> static/js/features/X
   static_js_ui_X              -> static/js/ui/X
   static_js_api_X             -> static/js/api/X
   static_js_utils_X           -> static/js/utils/X
   static_js_vendor_X          -> static/js/vendor/X
   static_js_X                 -> static/js/X
   static_css_features_X       -> static/css/features/X (v3.0.114)
   static_css_X                -> static/css/X
   static_vendor_X             -> static/vendor/X
   static_images_X             -> images/X
   templates_X                 -> templates/X
   statement_forge_X           -> statement_forge/X
   document_compare_X          -> document_compare/X (v3.0.114)
   portfolio_X                 -> portfolio/X (v3.0.114)
   tools_X                     -> tools/X
   data_X                      -> data/X
   images_X                    -> images/X
   vendor_X                    -> vendor/X
   
   Special cases:
   index.html                  -> templates/index.html
   style.css                   -> static/css/style.css
   *.py (no prefix)            -> app root
   *.json (no prefix)          -> app root
"""

import os
import sys
import json
import shutil
import hashlib
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum

# Setup logging
logger = logging.getLogger('update_manager')

# ============================================================
# CONFIGURATION
# ============================================================

class UpdateConfig:
    """Update system configuration."""
    
    def __init__(self, base_dir: Optional[Path] = None, app_dir: Optional[Path] = None):
        """
        Initialize update configuration.
        
        Supports two modes:
        1. Flat mode (recommended): base_dir IS the app folder
           - updates/ and backups/ are created inside the app folder
           
        2. Nested mode (legacy): base_dir contains app_dir as a subfolder
           - updates/ and backups/ are siblings to app_dir
        
        Args:
            base_dir: Root directory containing updates/backups folders
            app_dir: Directory containing app.py and other source files
                    If not provided, auto-detected from base_dir
        """
        # Determine app directory (where the code lives)
        if app_dir:
            self.app_dir = Path(app_dir)
        else:
            # Default: assume update_manager.py is in the app folder
            self.app_dir = Path(__file__).parent
        
        # Determine base directory (where updates/backups live)
        if base_dir:
            self.base_dir = Path(base_dir)
        else:
            # For flat mode: updates/backups are inside app folder
            # For nested mode: they're in the parent
            # We'll use flat mode by default (more intuitive)
            self.base_dir = self.app_dir
        
        # Auto-detect app_dir if base_dir was provided but app_dir wasn't
        if base_dir and not app_dir:
            self.app_dir = self._find_app_dir(self.base_dir)
        
        self.updates_dir = self.base_dir / "updates"
        self.backups_dir = self.base_dir / "backups"
        self.logs_dir = self.app_dir / "logs"  # Keep logs with the app
        self.manifest_file = self.updates_dir / "manifest.json"
        
        # Ensure directories exist
        for directory in [self.updates_dir, self.backups_dir, self.logs_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def _find_app_dir(self, base_dir: Path) -> Path:
        """
        Auto-detect the app directory within base_dir.
        
        Looks for common app folder names or folders containing app.py.
        """
        # Check if base_dir itself contains app.py (flat mode)
        if (base_dir / "app.py").exists():
            return base_dir
        
        # Look for known app folder names
        known_names = ["app", "TechWriterReview", "techwriterreview", "src"]
        for name in known_names:
            candidate = base_dir / name
            if candidate.exists() and (candidate / "app.py").exists():
                return candidate
        
        # Search for any folder containing app.py
        for item in base_dir.iterdir():
            if item.is_dir() and (item / "app.py").exists():
                return item
        
        # Fallback: assume base_dir is the app dir
        logger.warning(f"Could not find app directory, using base_dir: {base_dir}")
        return base_dir
    
    def to_dict(self) -> Dict:
        return {
            'base_dir': str(self.base_dir),
            'app_dir': str(self.app_dir),
            'updates_dir': str(self.updates_dir),
            'backups_dir': str(self.backups_dir),
            'logs_dir': str(self.logs_dir)
        }


# ============================================================
# DATA CLASSES
# ============================================================

class UpdateStatus(Enum):
    PENDING = "pending"
    APPLIED = "applied"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class UpdateFile:
    """Represents a single update file."""
    source_name: str
    source_path: str
    dest_path: str
    dest_name: str
    category: str
    is_new: bool
    size: int
    old_size: int = 0
    hash: str = ""
    status: str = "pending"
    error: str = ""
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class BackupInfo:
    """Information about a backup."""
    name: str
    path: str
    created_at: str
    file_count: int
    size_bytes: int
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UpdateResult:
    """Result of an update operation."""
    success: bool
    applied: int = 0
    failed: int = 0
    skipped: int = 0
    backup_path: str = ""
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
    
    def to_dict(self) -> Dict:
        return asdict(self)


# ============================================================
# FILE ROUTING
# ============================================================

class FileRouter:
    """Determines destination paths for update files."""
    
    def __init__(self, app_dir: Path):
        self.app_dir = app_dir
    
    def get_destination(self, filename: str, relative_path: str = None) -> Optional[Dict]:
        """
        Determine destination path for an update file.
        
        Supports multiple modes:
        1. Native extensions with directory structure (e.g., "static/js/ui/renderers.js")
        2. Legacy .txt with directory structure (e.g., "static/js/ui/renderers.js.txt")
        3. Flat files with prefix naming (e.g., "static_js_help-docs.js")
        4. Legacy flat .txt files (e.g., "static_js_help-docs.js.txt")
        
        Args:
            filename: Name of the update file (e.g., "app.py" or "app.py.txt")
            relative_path: Optional relative path from zip (e.g., "static/js/ui/renderers.js")
            
        Returns:
            Dict with path, category, and original name, or None if invalid
        """
        # Check if this is a .txt wrapped file (legacy mode)
        is_txt_wrapped = filename.endswith('.txt')
        
        # Get base name (strip .txt if present)
        if is_txt_wrapped:
            base_name = filename[:-4]
        else:
            base_name = filename
        
        # Skip installer/utility files
        skip_patterns = ['.ps1', '.bat', 'INSTALL', 'README', 'UPDATE_README']
        if any(pattern in base_name for pattern in skip_patterns):
            return None
        
        # Also skip if it's just a utility file at root
        if base_name in ['INSTALL.py', 'README.md', 'README.txt']:
            return None
        
        # Check if this is a directory-structured path (has path separators)
        # Use relative_path if provided, otherwise check filename for embedded paths
        path_to_check = relative_path if relative_path else filename
        
        if '/' in path_to_check or '\\' in path_to_check:
            # Directory-structured mode: path preserves directory structure
            return self._route_directory_path(path_to_check)
        
        # Flat file mode: use prefix-based routing
        return self._route_flat_file(base_name)
    
    def _route_directory_path(self, path: str) -> Optional[Dict]:
        """Route a file that has directory structure in its path."""
        # Remove .txt extension if present (legacy mode)
        if path.endswith('.txt'):
            path = path[:-4]
        
        # Normalize path separators
        path = path.replace('\\', '/')
        
        # Skip utility files
        if any(skip in path for skip in ['README', 'INSTALL', 'UPDATE_README', '__pycache__']):
            return None
        
        # Determine category from path
        parts = path.split('/')
        
        if path.startswith('static/js/'):
            # Modular JS: static/js/ui/renderers.js -> app/static/js/ui/renderers.js
            category = '/'.join(parts[:-1])  # e.g., "static/js/ui"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('static/css/features/'):
            # v3.0.114: static/css/features for feature-specific styles
            category = "static/css/features"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('static/css/'):
            category = "static/css"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('static/vendor/'):
            category = "static/vendor"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('static/images/'):
            # v3.0.114: static/images for static image assets
            category = "static/images"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('vendor/'):
            category = "vendor"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('statement_forge/'):
            category = "statement_forge"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('document_compare/'):
            # v3.0.114: document_compare module for scan comparison
            category = "document_compare"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('portfolio/'):
            # v3.0.114: portfolio module for tile view
            category = "portfolio"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('templates/'):
            category = "templates"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('images/'):
            category = "images"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('tools/'):
            # tools/HyperlinkValidator.ps1 -> app/tools/HyperlinkValidator.ps1
            category = "tools"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('data/'):
            # data/*.json -> app/data/*.json
            category = "data"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        elif path.startswith('logs/') or path.startswith('temp/') or path.startswith('backups/'):
            # Skip runtime directories - these should not be updated
            return None
        else:
            # Unknown directory structure - keep as-is
            category = parts[0] if len(parts) > 1 else "app"
            original_name = parts[-1]
            dest_path = self.app_dir / path
        
        return {
            'path': str(dest_path),
            'category': category,
            'original_name': original_name
        }
    
    def _route_flat_file(self, base_name: str) -> Optional[Dict]:
        """Route a flat file using prefix-based naming conventions."""
        dest_path = None
        category = "app"
        original_name = base_name
        
        if base_name.startswith('vendor_'):
            # vendor_chart.min.js -> vendor/chart.min.js
            real_name = base_name[7:]  # Remove 'vendor_'
            dest_path = self.app_dir / "vendor" / real_name
            category = "vendor"
            original_name = real_name
        
        # v3.0.30: static_js_vendor routing for offline-first vendor JS
        elif base_name.startswith('static_js_vendor_'):
            # static_js_vendor_lucide.min.js -> static/js/vendor/lucide.min.js
            real_name = base_name[17:]  # Remove 'static_js_vendor_'
            dest_path = self.app_dir / "static" / "js" / "vendor" / real_name
            category = "static/js/vendor"
            original_name = real_name
        
        # v3.0.73: static_js_ui routing for UI modules
        elif base_name.startswith('static_js_ui_'):
            # static_js_ui_modals.js -> static/js/ui/modals.js
            real_name = base_name[13:]  # Remove 'static_js_ui_'
            dest_path = self.app_dir / "static" / "js" / "ui" / real_name
            category = "static/js/ui"
            original_name = real_name
        
        # v3.0.73: static_js_api routing for API modules
        elif base_name.startswith('static_js_api_'):
            # static_js_api_client.js -> static/js/api/client.js
            real_name = base_name[14:]  # Remove 'static_js_api_'
            dest_path = self.app_dir / "static" / "js" / "api" / real_name
            category = "static/js/api"
            original_name = real_name
        
        # v3.0.73: static_js_features routing for feature modules
        elif base_name.startswith('static_js_features_'):
            # static_js_features_roles.js -> static/js/features/roles.js
            real_name = base_name[19:]  # Remove 'static_js_features_'
            dest_path = self.app_dir / "static" / "js" / "features" / real_name
            category = "static/js/features"
            original_name = real_name
        
        # v3.0.73: static_js_utils routing for utility modules
        elif base_name.startswith('static_js_utils_'):
            # static_js_utils_dom.js -> static/js/utils/dom.js
            real_name = base_name[16:]  # Remove 'static_js_utils_'
            dest_path = self.app_dir / "static" / "js" / "utils" / real_name
            category = "static/js/utils"
            original_name = real_name
            
        elif base_name.startswith('static_js_'):
            # static_js_help-docs.js -> static/js/help-docs.js
            real_name = base_name[10:]  # Remove 'static_js_'
            dest_path = self.app_dir / "static" / "js" / real_name
            category = "static/js"
            original_name = real_name
            
        # v3.0.114: static_css_features_ routing for feature-specific CSS
        elif base_name.startswith('static_css_features_'):
            # static_css_features_doc-compare.css -> static/css/features/doc-compare.css
            real_name = base_name[20:]  # Remove 'static_css_features_'
            dest_path = self.app_dir / "static" / "css" / "features" / real_name
            category = "static/css/features"
            original_name = real_name

        elif base_name.startswith('static_css_'):
            # static_css_style.css -> static/css/style.css
            real_name = base_name[11:]  # Remove 'static_css_'
            dest_path = self.app_dir / "static" / "css" / real_name
            category = "static/css"
            original_name = real_name
            
        elif base_name.startswith('static_vendor_'):
            # static_vendor_chart.min.js -> static/vendor/chart.min.js
            real_name = base_name[14:]  # Remove 'static_vendor_'
            dest_path = self.app_dir / "static" / "vendor" / real_name
            category = "static/vendor"
            original_name = real_name
            
        elif base_name.startswith('static_images_'):
            # static_images_logo.png -> images/logo.png
            real_name = base_name[14:]  # Remove 'static_images_'
            dest_path = self.app_dir / "images" / real_name
            category = "images"
            original_name = real_name
        
        # v3.0.73: tools_ routing for PowerShell/batch scripts
        elif base_name.startswith('tools_'):
            # tools_HyperlinkValidator.ps1 -> tools/HyperlinkValidator.ps1
            real_name = base_name[6:]  # Remove 'tools_'
            dest_path = self.app_dir / "tools" / real_name
            category = "tools"
            original_name = real_name
        
        # v3.0.73: templates_ routing for HTML templates
        elif base_name.startswith('templates_'):
            # templates_index.html -> templates/index.html
            real_name = base_name[10:]  # Remove 'templates_'
            dest_path = self.app_dir / "templates" / real_name
            category = "templates"
            original_name = real_name
        
        # v3.0.73: images_ routing for image files
        elif base_name.startswith('images_'):
            # images_twr_icon.ico -> images/twr_icon.ico
            real_name = base_name[7:]  # Remove 'images_'
            dest_path = self.app_dir / "images" / real_name
            category = "images"
            original_name = real_name
        
        # v3.0.73: statement_forge_ routing for Statement Forge module files
        elif base_name.startswith('statement_forge_'):
            # statement_forge_export.py -> statement_forge/export.py
            real_name = base_name[16:]  # Remove 'statement_forge_'
            dest_path = self.app_dir / "statement_forge" / real_name
            category = "statement_forge"
            original_name = real_name

        # v3.0.114: document_compare_ routing for Document Comparison module files
        elif base_name.startswith('document_compare_'):
            # document_compare_routes.py -> document_compare/routes.py
            real_name = base_name[17:]  # Remove 'document_compare_'
            dest_path = self.app_dir / "document_compare" / real_name
            category = "document_compare"
            original_name = real_name

        # v3.0.114: portfolio_ routing for Portfolio module files
        elif base_name.startswith('portfolio_'):
            # portfolio_routes.py -> portfolio/routes.py
            real_name = base_name[10:]  # Remove 'portfolio_'
            dest_path = self.app_dir / "portfolio" / real_name
            category = "portfolio"
            original_name = real_name

        # v3.0.73: data_ routing for data files
        elif base_name.startswith('data_'):
            # data_config.json -> data/config.json
            real_name = base_name[5:]  # Remove 'data_'
            dest_path = self.app_dir / "data" / real_name
            category = "data"
            original_name = real_name
        
        elif base_name.startswith('statement_forge__'):
            # v3.0.30: Flat mode - keep as flat file in app root
            # statement_forge__export.py -> app/statement_forge__export.py
            dest_path = self.app_dir / base_name
            category = "statement_forge"
            original_name = base_name
        
        elif base_name == 'style.css':
            # style.css -> static/css/style.css (proper location)
            dest_path = self.app_dir / "static" / "css" / "style.css"
            category = "static/css"
            original_name = "style.css"
        
        elif base_name == 'index.html':
            # index.html -> templates/index.html (Flask template location)
            dest_path = self.app_dir / "templates" / "index.html"
            category = "templates"
            original_name = "index.html"
            
        else:
            # Regular file - goes to app root
            dest_path = self.app_dir / base_name
            category = "app"
            original_name = base_name
        
        return {
            'path': str(dest_path),
            'category': category,
            'original_name': original_name
        }


# ============================================================
# UPDATE MANAGER
# ============================================================

class UpdateManager:
    """
    Manages application updates from the UI.
    
    Usage:
        manager = UpdateManager()
        
        # Check for updates
        updates = manager.check_for_updates()
        
        # Apply updates
        result = manager.apply_updates()
        
        # Rollback if needed
        manager.rollback()
    """
    
    def __init__(self, base_dir: Optional[Path] = None, app_dir: Optional[Path] = None):
        self.config = UpdateConfig(base_dir, app_dir)
        self.router = FileRouter(self.config.app_dir)
        self._pending_updates: List[UpdateFile] = []
        
        logger.info(f"UpdateManager initialized: {self.config.to_dict()}")
    
    # --------------------------------------------------------
    # CHECK FOR UPDATES
    # --------------------------------------------------------
    
    def check_for_updates(self) -> Dict[str, Any]:
        """
        Check the updates folder for pending updates.
        
        Supports both:
        - Flat .txt files in updates folder root
        - Directory-structured files (e.g., static/js/ui/renderers.js.txt)
        
        Returns:
            Dict with update information:
            {
                'has_updates': bool,
                'count': int,
                'updates': List[UpdateFile],
                'by_category': Dict[str, int],
                'total_size': int
            }
        """
        self._pending_updates = []
        
        if not self.config.updates_dir.exists():
            return {
                'has_updates': False,
                'count': 0,
                'updates': [],
                'by_category': {},
                'total_size': 0
            }
        
        # Scan for update files recursively (supports both .txt and native extensions)
        # Native extensions: .py, .js, .css, .html, .json, .ps1, .md, .ico
        # Legacy .txt extension still supported for backward compatibility
        supported_extensions = ['*.txt', '*.py', '*.js', '*.css', '*.html', '*.json', '*.ps1', '*.md', '*.ico']
        update_files = []
        for ext in supported_extensions:
            update_files.extend(self.config.updates_dir.rglob(ext))
        
        # Filter out README, manifest, and other non-update files
        skip_names = ['README.txt', 'README.md', 'manifest.json', 'UPDATE_README.txt', '__pycache__']
        skip_patterns = ['INSTALL', 'UPDATE_README']
        update_files = [
            f for f in update_files 
            if f.name not in skip_names 
            and not any(pattern in f.name for pattern in skip_patterns)
            and '__pycache__' not in str(f)
        ]
        
        by_category = {}
        total_size = 0
        
        for file_path in update_files:
            # Get relative path from updates dir for directory-structured routing
            try:
                relative_path = str(file_path.relative_to(self.config.updates_dir))
            except ValueError:
                relative_path = file_path.name
            
            # Pass relative path for proper routing of directory-structured files
            routing = self.router.get_destination(file_path.name, relative_path)
            
            if not routing:
                continue
            
            dest_path = Path(routing['path'])
            is_new = not dest_path.exists()
            old_size = dest_path.stat().st_size if dest_path.exists() else 0
            new_size = file_path.stat().st_size
            
            # Calculate hash
            file_hash = self._calculate_hash(file_path)
            
            update = UpdateFile(
                source_name=file_path.name,
                source_path=str(file_path),
                dest_path=routing['path'],
                dest_name=routing['original_name'],
                category=routing['category'],
                is_new=is_new,
                size=new_size,
                old_size=old_size,
                hash=file_hash
            )
            
            self._pending_updates.append(update)
            
            # Track by category
            cat = routing['category']
            by_category[cat] = by_category.get(cat, 0) + 1
            total_size += new_size
        
        return {
            'has_updates': len(self._pending_updates) > 0,
            'count': len(self._pending_updates),
            'updates': [u.to_dict() for u in self._pending_updates],
            'by_category': by_category,
            'total_size': total_size
        }
    
    def _calculate_hash(self, file_path: Path) -> str:
        """Calculate MD5 hash of a file."""
        hash_md5 = hashlib.md5()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    # --------------------------------------------------------
    # CREATE BACKUP
    # --------------------------------------------------------
    
    def create_backup(self, files_to_backup: List[str] = None) -> Optional[str]:
        """
        Create a backup of files that will be updated.
        
        Args:
            files_to_backup: Optional list of specific files to backup.
                           If None, backs up all files that will be updated.
        
        Returns:
            Path to backup folder, or None if backup failed
        """
        if files_to_backup is None:
            # Backup files that exist and will be updated
            files_to_backup = [
                u.dest_path for u in self._pending_updates 
                if not u.is_new and Path(u.dest_path).exists()
            ]
        
        if not files_to_backup:
            logger.info("No files to backup (all updates are new files)")
            return None
        
        # Create backup folder
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_name = f"backup_{timestamp}"
        backup_path = self.config.backups_dir / backup_name
        backup_path.mkdir(parents=True, exist_ok=True)
        
        manifest = []
        
        for file_path in files_to_backup:
            src = Path(file_path)
            if not src.exists():
                continue
            
            # Preserve relative path structure
            try:
                rel_path = src.relative_to(self.config.app_dir)
            except ValueError:
                rel_path = src.name
            
            dest = backup_path / rel_path
            dest.parent.mkdir(parents=True, exist_ok=True)
            
            shutil.copy2(src, dest)
            
            manifest.append({
                'relative_path': str(rel_path),
                'original_path': str(src),
                'hash': self._calculate_hash(src),
                'size': src.stat().st_size,
                'backed_up_at': datetime.now().isoformat()
            })
        
        # Save manifest
        manifest_path = backup_path / 'manifest.json'
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"Created backup: {backup_name} ({len(manifest)} files)")
        
        return str(backup_path)
    
    # --------------------------------------------------------
    # APPLY UPDATES
    # --------------------------------------------------------
    
    def apply_updates(self, create_backup: bool = True) -> UpdateResult:
        """
        Apply all pending updates.
        
        Args:
            create_backup: Whether to create a backup first (default: True)
        
        Returns:
            UpdateResult with success status and details
        """
        if not self._pending_updates:
            # Re-check for updates
            self.check_for_updates()
        
        if not self._pending_updates:
            return UpdateResult(success=True, applied=0)
        
        result = UpdateResult(success=True)
        
        # Create backup first
        if create_backup:
            try:
                backup_path = self.create_backup()
                result.backup_path = backup_path or ""
            except Exception as e:
                logger.error(f"Backup failed: {e}")
                result.errors.append(f"Backup failed: {e}")
                # Continue anyway - user can choose to abort
        
        # Apply each update
        for update in self._pending_updates:
            try:
                success = self._apply_single_update(update)
                if success:
                    update.status = UpdateStatus.APPLIED.value
                    result.applied += 1
                else:
                    update.status = UpdateStatus.FAILED.value
                    result.failed += 1
            except Exception as e:
                update.status = UpdateStatus.FAILED.value
                update.error = str(e)
                result.failed += 1
                result.errors.append(f"{update.dest_name}: {e}")
                logger.error(f"Failed to apply {update.source_name}: {e}")
        
        # Clear updates folder on success
        if result.failed == 0:
            self._clear_updates_folder()
        
        result.success = result.failed == 0
        
        logger.info(f"Update complete: {result.applied} applied, {result.failed} failed")
        
        return result
    
    def _apply_single_update(self, update: UpdateFile) -> bool:
        """Apply a single update file."""
        src = Path(update.source_path)
        dest = Path(update.dest_path)
        
        if not src.exists():
            raise FileNotFoundError(f"Source file not found: {src}")
        
        # Create destination directory if needed
        dest.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy file
        shutil.copy2(src, dest)
        
        # Verify copy
        if not dest.exists():
            raise IOError(f"Failed to copy file to {dest}")
        
        # Verify hash
        new_hash = self._calculate_hash(dest)
        if new_hash != update.hash:
            raise IOError("Hash mismatch after copy")
        
        logger.info(f"Applied: {update.dest_name}")
        return True
    
    def _clear_updates_folder(self):
        """Remove applied update files from the updates folder."""
        for update in self._pending_updates:
            if update.status == UpdateStatus.APPLIED.value:
                try:
                    Path(update.source_path).unlink()
                except Exception as e:
                    logger.warning(f"Could not remove {update.source_name}: {e}")
        
        self._pending_updates = []
        logger.info("Cleared updates folder")
    
    # --------------------------------------------------------
    # ROLLBACK
    # --------------------------------------------------------
    
    def get_backups(self) -> List[BackupInfo]:
        """Get list of available backups."""
        backups = []
        
        if not self.config.backups_dir.exists():
            return backups
        
        for backup_dir in sorted(self.config.backups_dir.iterdir(), reverse=True):
            if not backup_dir.is_dir() or not backup_dir.name.startswith('backup_'):
                continue
            
            manifest_path = backup_dir / 'manifest.json'
            file_count = 0
            
            if manifest_path.exists():
                with open(manifest_path, encoding='utf-8') as f:
                    manifest = json.load(f)
                    file_count = len(manifest)
            
            # Calculate total size
            total_size = sum(
                f.stat().st_size for f in backup_dir.rglob('*') if f.is_file()
            )
            
            backups.append(BackupInfo(
                name=backup_dir.name,
                path=str(backup_dir),
                created_at=datetime.fromtimestamp(
                    backup_dir.stat().st_mtime
                ).isoformat(),
                file_count=file_count,
                size_bytes=total_size
            ))
        
        return backups
    
    def rollback(self, backup_name: str = None) -> UpdateResult:
        """
        Rollback to a previous backup.
        
        Args:
            backup_name: Name of backup to restore. If None, uses latest.
        
        Returns:
            UpdateResult with success status
        """
        backups = self.get_backups()
        
        if not backups:
            return UpdateResult(
                success=False,
                errors=["No backups available"]
            )
        
        # Find the requested backup
        if backup_name:
            backup = next((b for b in backups if b.name == backup_name), None)
            if not backup:
                return UpdateResult(
                    success=False,
                    errors=[f"Backup not found: {backup_name}"]
                )
        else:
            backup = backups[0]  # Latest
        
        backup_path = Path(backup.path)
        manifest_path = backup_path / 'manifest.json'
        
        if not manifest_path.exists():
            return UpdateResult(
                success=False,
                errors=["Backup manifest not found"]
            )
        
        with open(manifest_path, encoding='utf-8') as f:
            manifest = json.load(f)

        result = UpdateResult(success=True)
        
        for entry in manifest:
            try:
                src = backup_path / entry['relative_path']
                dest = Path(entry['original_path'])
                
                if not src.exists():
                    result.skipped += 1
                    continue
                
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dest)
                
                # Verify hash
                new_hash = self._calculate_hash(dest)
                if new_hash != entry['hash']:
                    raise IOError("Hash mismatch after restore")
                
                result.applied += 1
                
            except Exception as e:
                result.failed += 1
                result.errors.append(f"{entry['relative_path']}: {e}")
        
        result.success = result.failed == 0
        logger.info(f"Rollback complete: {result.applied} restored, {result.failed} failed")
        
        return result
    
    def delete_backup(self, backup_name: str) -> bool:
        """Delete a specific backup."""
        backup_path = self.config.backups_dir / backup_name
        
        if backup_path.exists() and backup_path.is_dir():
            shutil.rmtree(backup_path)
            logger.info(f"Deleted backup: {backup_name}")
            return True
        
        return False
    
    # --------------------------------------------------------
    # STATUS INFO
    # --------------------------------------------------------
    
    def get_status(self) -> Dict[str, Any]:
        """Get current update system status."""
        updates = self.check_for_updates()
        backups = self.get_backups()
        
        return {
            'updates_available': updates['has_updates'],
            'update_count': updates['count'],
            'updates': updates['updates'],
            'by_category': updates['by_category'],
            'backup_count': len(backups),
            'backups': [b.to_dict() for b in backups[:5]],  # Last 5
            'config': self.config.to_dict()
        }


# ============================================================
# API ROUTES (Flask Blueprint)
# ============================================================

def register_update_routes(app, manager: UpdateManager = None):
    """
    Register update management API routes with a Flask app.
    
    Usage:
        from update_manager import UpdateManager, register_update_routes
        
        manager = UpdateManager()
        register_update_routes(app, manager)
    """
    from flask import Blueprint, jsonify, request
    
    update_bp = Blueprint('updates', __name__, url_prefix='/api/updates')
    
    if manager is None:
        manager = UpdateManager()
    
    @update_bp.route('/status', methods=['GET'])
    def get_status():
        """Get update system status."""
        try:
            status = manager.get_status()
            return jsonify({'success': True, 'data': status})
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/check', methods=['GET'])
    def check_updates():
        """Check for available updates."""
        try:
            updates = manager.check_for_updates()
            return jsonify({'success': True, 'data': updates})
        except Exception as e:
            logger.error(f"Update check failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/apply', methods=['POST'])
    def apply_updates():
        """Apply pending updates."""
        try:
            data = request.get_json() or {}
            create_backup = data.get('create_backup', True)
            
            result = manager.apply_updates(create_backup=create_backup)
            
            return jsonify({
                'success': result.success,
                'data': result.to_dict()
            })
        except Exception as e:
            logger.error(f"Update application failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/backups', methods=['GET'])
    def list_backups():
        """List available backups."""
        try:
            backups = manager.get_backups()
            return jsonify({
                'success': True,
                'data': [b.to_dict() for b in backups]
            })
        except Exception as e:
            logger.error(f"Backup listing failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/rollback', methods=['POST'])
    def rollback():
        """Rollback to a previous backup."""
        try:
            data = request.get_json() or {}
            backup_name = data.get('backup_name')
            
            result = manager.rollback(backup_name=backup_name)
            
            return jsonify({
                'success': result.success,
                'data': result.to_dict()
            })
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/backups/<backup_name>', methods=['DELETE'])
    def delete_backup(backup_name):
        """Delete a specific backup."""
        try:
            success = manager.delete_backup(backup_name)
            return jsonify({'success': success})
        except Exception as e:
            logger.error(f"Backup deletion failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/restart', methods=['POST'])
    def restart_server():
        """
        Restart the server after updates.
        
        This endpoint:
        1. Returns success response to the browser
        2. Schedules server shutdown with exit code 75
        3. Run_TWR.bat sees code 75 and restarts the server
        """
        import threading
        
        def delayed_exit():
            """Exit after a short delay to allow response to be sent."""
            import time
            time.sleep(0.5)  # Give time for response to be sent
            logger.info("Server restarting for updates (exit code 75)")
            os._exit(75)  # Special exit code signals restart to batch script
        
        try:
            # Schedule the exit
            threading.Thread(target=delayed_exit, daemon=True).start()
            
            return jsonify({
                'success': True,
                'message': 'Server is restarting. Please wait...'
            })
        except Exception as e:
            logger.error(f"Restart failed: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @update_bp.route('/health', methods=['GET'])
    def health_check():
        """Simple health check endpoint for restart polling."""
        return jsonify({'status': 'ok', 'version': manager.config.base_dir.name})
    
    app.register_blueprint(update_bp)
    logger.info("Update API routes registered")


# ============================================================
# CLI INTERFACE
# ============================================================

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='TechWriterReview Update Manager')
    parser.add_argument('--check', action='store_true', help='Check for updates')
    parser.add_argument('--apply', action='store_true', help='Apply updates')
    parser.add_argument('--rollback', action='store_true', help='Rollback to latest backup')
    parser.add_argument('--backups', action='store_true', help='List backups')
    parser.add_argument('--status', action='store_true', help='Show status')
    parser.add_argument('--base-dir', type=str, help='Base directory path')
    
    args = parser.parse_args()
    
    # Setup logging for CLI
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    manager = UpdateManager(Path(args.base_dir) if args.base_dir else None)
    
    if args.check:
        result = manager.check_for_updates()
        print(json.dumps(result, indent=2))
    
    elif args.apply:
        result = manager.apply_updates()
        print(json.dumps(result.to_dict(), indent=2))
    
    elif args.rollback:
        result = manager.rollback()
        print(json.dumps(result.to_dict(), indent=2))
    
    elif args.backups:
        backups = manager.get_backups()
        for b in backups:
            print(f"{b.name} - {b.file_count} files - {b.created_at}")
    
    elif args.status:
        status = manager.get_status()
        print(json.dumps(status, indent=2))
    
    else:
        parser.print_help()
