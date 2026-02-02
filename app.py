#!/usr/bin/env python3
"""
TechWriterReview Flask Application v3.0.116
============================================
Enterprise-grade Technical Writing Review Tool

v3.0.116 - Memory & Stability Fixes:
- BUG-M02: Batch memory - streaming file uploads to reduce memory usage
- BUG-M03: SessionManager - automatic cleanup thread prevents memory growth
- BUG-M04: Batch errors - full tracebacks now logged for debugging
- BUG-M05: localStorage key collision - unique document IDs prevent overwriting
- BUG-L07: Batch limit constants defined (MAX_BATCH_SIZE=10, MAX_BATCH_TOTAL_SIZE=100MB)

Security Features:
- CSRF protection on all state-changing endpoints
- File size limits and type validation
- Rate limiting per IP
- Structured JSON logging
- Secure session handling
- Input sanitization
- Authentication support (trusted-header or API key)
- No debug mode by default

Created by Nicholas Georgeson
"""

import os
import sys
import time
import traceback
from pathlib import Path
from datetime import datetime, timezone

# =============================================================================
# STARTUP ERROR CAPTURE (v2.9.4.2)
# =============================================================================
# Captures errors that occur before logging is initialized

_APP_START_TIME = time.time()

def _capture_startup_error(error: Exception, context: str = ""):
    """Write startup errors to file since logging may not be initialized."""
    try:
        startup_log = Path(__file__).parent / 'startup_error.log'
        with open(startup_log, 'w', encoding='utf-8') as f:
            f.write("=" * 70 + "\n")
            f.write("TECHWRITERREVIEW STARTUP ERROR\n")
            f.write("=" * 70 + "\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\n")
            f.write(f"Context: {context}\n")
            f.write(f"Error Type: {type(error).__name__}\n")
            f.write(f"Error Message: {error}\n")
            f.write("\nFull Traceback:\n")
            f.write(traceback.format_exc())
            f.write("\n" + "=" * 70 + "\n")
            f.write("Use this file for troubleshooting\n")
            f.write("=" * 70 + "\n")
    except Exception:
        pass  # Last resort - can't even write the error file

# Try all imports with error capture
try:
    import io
    import json
    import re
    import uuid
    import webbrowser
    import threading
    from functools import wraps
    from typing import Optional, Dict, Any, Callable
except Exception as e:
    _capture_startup_error(e, "Standard library imports")
    raise

try:
    from flask import (
        Flask, request, jsonify, send_file, session,
        g, Response, make_response
    )
    from werkzeug.utils import secure_filename
except Exception as e:
    _capture_startup_error(e, "Flask imports - is Flask installed?")
    raise

# Import centralized config and logging
try:
    from config_logging import (
        get_config, get_logger, get_rate_limiter,
        VERSION, APP_NAME,
        TechWriterError, ValidationError, FileError, ProcessingError,
        RateLimitError,
        sanitize_filename, validate_file_extension,
        generate_csrf_token, verify_csrf_token,
        StructuredLogger
    )
except Exception as e:
    _capture_startup_error(e, "config_logging import failed")
    raise

try:
    from core import TechWriterReviewEngine, MODULE_VERSION
except Exception as e:
    _capture_startup_error(e, "core.py import failed")
    raise

# Import scan history for tracking
try:
    from scan_history import get_scan_history_db
    SCAN_HISTORY_AVAILABLE = True
except ImportError:
    SCAN_HISTORY_AVAILABLE = False

# Import diagnostic collector for error tracking
try:
    from diagnostic_export import (
        DiagnosticCollector,
        setup_flask_error_capture,
        register_diagnostic_routes,
        capture_errors,
        register_ai_troubleshoot_routes,  # v2.9.4.2: Enhanced troubleshooting
        log_user_action,  # v2.9.4.2: User action logging
        get_ai_troubleshoot  # v2.9.4.2: For health endpoint
    )
    DIAGNOSTICS_AVAILABLE = True
except ImportError:
    DIAGNOSTICS_AVAILABLE = False
    # Provide dummy functions if diagnostics not available
    def capture_errors(func):
        return func
    def log_user_action(action, details=None):
        pass
    def get_ai_troubleshoot():
        return None

# =============================================================================
# APPLICATION SETUP
# =============================================================================

config = get_config()
logger = get_logger('app')

app = Flask(__name__)

# Security configuration
app.config['SECRET_KEY'] = config.secret_key
app.config['MAX_CONTENT_LENGTH'] = config.max_content_length
app.config['SESSION_COOKIE_SECURE'] = not config.debug  # Secure in production
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Ensure directories exist
config.temp_dir.mkdir(exist_ok=True)
config.backup_dir.mkdir(exist_ok=True)

# Register API extensions (export, roles, history, etc.)
try:
    from api_extensions import register_api_extensions
    register_api_extensions(app)
    logger.info("API extensions loaded successfully")
except ImportError as e:
    logger.warning(f"API extensions not available: {e}")

# Register Update Manager API
try:
    from update_manager import UpdateManager, register_update_routes
    # Pass app_dir directly - updates/backups will be created inside the app folder
    update_manager = UpdateManager(base_dir=config.base_dir, app_dir=config.base_dir)
    register_update_routes(app, update_manager)
    logger.info("Update manager loaded successfully")
except ImportError as e:
    logger.warning(f"Update manager not available: {e}")
except Exception as e:
    logger.warning(f"Could not setup update manager: {e}")

# Setup diagnostic error capture
if DIAGNOSTICS_AVAILABLE:
    try:
        setup_flask_error_capture(app)
        register_diagnostic_routes(app)
        register_ai_troubleshoot_routes(app)  # v2.9.4.2: Enhanced troubleshooting
        logger.info("Diagnostic error capture enabled (with enhanced troubleshooting)")
    except Exception as e:
        logger.warning(f"Could not setup diagnostics: {e}")

# Register Statement Forge API routes (v3.0.49: supports both package and flat layouts)
# Package layout: statement_forge/routes.py (transport installer)
# Flat layout: statement_forge__routes.py (legacy)
STATEMENT_FORGE_AVAILABLE = False
sf_blueprint = None

try:
    # Try package import first (transport installer layout)
    from statement_forge.routes import sf_blueprint
    app.register_blueprint(sf_blueprint, url_prefix='/api/statement-forge')
    logger.info("Statement Forge routes loaded successfully (package mode)")
    STATEMENT_FORGE_AVAILABLE = True
except ImportError:
    try:
        # Fall back to flat import (legacy layout)
        from statement_forge__routes import sf_blueprint
        app.register_blueprint(sf_blueprint, url_prefix='/api/statement-forge')
        logger.info("Statement Forge routes loaded successfully (flat mode)")
        STATEMENT_FORGE_AVAILABLE = True
    except ImportError as e:
        # INFO level since Statement Forge is optional
        logger.info(f"Statement Forge module not installed (optional): {e}")
    except Exception as e:
        logger.error(f"Failed to load Statement Forge (flat): {e}")
except Exception as e:
    logger.error(f"Failed to load Statement Forge (package): {e}")

# Register Document Comparison routes (v3.0.110)
DOCUMENT_COMPARE_AVAILABLE = False
try:
    from document_compare import dc_blueprint
    app.register_blueprint(dc_blueprint, url_prefix='/api/compare')
    logger.info("Document Comparison routes loaded successfully")
    DOCUMENT_COMPARE_AVAILABLE = True
except ImportError as e:
    logger.info(f"Document Comparison module not available: {e}")
except Exception as e:
    logger.error(f"Failed to load Document Comparison: {e}")

# Register Portfolio routes (v3.0.114)
PORTFOLIO_AVAILABLE = False
try:
    from portfolio import portfolio_blueprint
    app.register_blueprint(portfolio_blueprint, url_prefix='/api/portfolio')
    logger.info("Portfolio routes loaded successfully")
    PORTFOLIO_AVAILABLE = True
except ImportError as e:
    logger.info(f"Portfolio module not available: {e}")
except Exception as e:
    logger.error(f"Failed to load Portfolio: {e}")

# Register Hyperlink Validator routes (v1.0.0)
HYPERLINK_VALIDATOR_AVAILABLE = False
try:
    from hyperlink_validator.routes import hv_blueprint
    app.register_blueprint(hv_blueprint, url_prefix='/api/hyperlink-validator')
    logger.info("Hyperlink Validator routes loaded successfully")
    HYPERLINK_VALIDATOR_AVAILABLE = True
except ImportError as e:
    logger.info(f"Hyperlink Validator module not available: {e}")
except Exception as e:
    logger.error(f"Failed to load Hyperlink Validator: {e}")

# Register Hyperlink Health routes (v3.0.31 Thread 5)
try:
    from hyperlink_health import (
        HyperlinkHealthValidator, HealthMode, validate_document_links,
        export_report_json, export_report_html, export_report_csv
    )
    HYPERLINK_HEALTH_AVAILABLE = True
    logger.info("Hyperlink Health module loaded successfully")
except ImportError as e:
    logger.info(f"Hyperlink Health module not available: {e}")
    HYPERLINK_HEALTH_AVAILABLE = False
except Exception as e:
    logger.error(f"Failed to load Hyperlink Health: {e}")
    HYPERLINK_HEALTH_AVAILABLE = False

# Import Job Manager (v3.0.32 Thread 8)
try:
    from job_manager import (
        get_job_manager, JobManager, Job, JobPhase, JobStatus,
        create_review_job, get_job_status, get_job_result
    )
    JOB_MANAGER_AVAILABLE = True
    logger.info("Job Manager module loaded successfully")
except ImportError as e:
    logger.info(f"Job Manager module not available: {e}")
    JOB_MANAGER_AVAILABLE = False
except Exception as e:
    logger.error(f"Failed to load Job Manager: {e}")
    JOB_MANAGER_AVAILABLE = False

# Import Fix Assistant v2 components (v3.0.97)
try:
    from fix_assistant_api import (
        build_document_content,
        group_similar_fixes,
        build_confidence_details,
        compute_fix_statistics,
        export_decision_log_csv,
        enhance_review_response
    )
    from decision_learner import DecisionLearner
    from report_generator import ReportGenerator
    
    # Initialize components
    decision_learner = DecisionLearner()
    report_generator = ReportGenerator()
    FIX_ASSISTANT_V2_AVAILABLE = True

    # v3.0.105: Register Fix Assistant routes (decision-log export)
    from fix_assistant_api import register_fix_assistant_routes
    register_fix_assistant_routes(app)

    logger.info("Fix Assistant v2 components loaded successfully")
except ImportError as e:
    logger.info(f"Fix Assistant v2 not available: {e}")
    FIX_ASSISTANT_V2_AVAILABLE = False
    decision_learner = None
    report_generator = None
except Exception as e:
    logger.error(f"Failed to load Fix Assistant v2: {e}")
    FIX_ASSISTANT_V2_AVAILABLE = False
    decision_learner = None
    report_generator = None


# =============================================================================
# TIMEOUT WRAPPER (v2.9.4 #26 - Export hang protection)
# =============================================================================

class TimeoutError(Exception):
    """Raised when an operation times out."""
    pass

def run_with_timeout(func, timeout_seconds=60, default=None):
    """
    Run a function with a timeout.
    
    v2.9.4 #26: Added to prevent export operations from hanging indefinitely.
    
    Args:
        func: Callable to execute
        timeout_seconds: Maximum time to wait
        default: Value to return if timeout occurs
        
    Returns:
        Result of func() or default if timeout
        
    Raises:
        TimeoutError if operation times out and no default provided
    """
    result = [default]
    error = [None]
    completed = [False]
    
    def target():
        try:
            result[0] = func()
            completed[0] = True
        except Exception as e:
            error[0] = e
            completed[0] = True
    
    thread = threading.Thread(target=target)
    thread.daemon = True
    thread.start()
    thread.join(timeout_seconds)
    
    if not completed[0]:
        logger.warning(f"Operation timed out after {timeout_seconds}s")
        if default is None:
            raise TimeoutError(f"Operation timed out after {timeout_seconds} seconds")
        return default
    
    if error[0]:
        raise error[0]
    
    return result[0]


# =============================================================================
# BATCH PROCESSING CONSTANTS (v3.0.116: BUG-M02/L07 fix)
# =============================================================================

MAX_BATCH_SIZE = 10  # Maximum number of files in a single batch
MAX_BATCH_TOTAL_SIZE = 100 * 1024 * 1024  # 100MB total across all batch files


# =============================================================================
# REQUEST-SCOPED STATE (Thread-Safe)
# =============================================================================

class SessionManager:
    """
    Manages document sessions in a thread-safe manner.

    v3.0.116 (BUG-M03): Added automatic background cleanup to prevent memory growth.
    Sessions are cleaned up every hour by default, removing sessions older than 24 hours.
    """

    _sessions: Dict[str, Dict] = {}
    _lock = threading.Lock()
    _cleanup_thread: Optional[threading.Thread] = None
    _cleanup_running = False
    _cleanup_interval = 3600  # 1 hour between cleanups
    _max_session_age_hours = 24

    @classmethod
    def create(cls, session_id: str = None) -> str:
        """Create a new session."""
        session_id = session_id or str(uuid.uuid4())
        with cls._lock:
            cls._sessions[session_id] = {
                'created': datetime.now().isoformat(),
                'current_file': None,
                'original_filename': None,
                'review_results': None,
                'filtered_issues': [],
                'selected_issues': set(),
            }
        return session_id

    @classmethod
    def get(cls, session_id: str) -> Optional[Dict]:
        """Get session data."""
        with cls._lock:
            return cls._sessions.get(session_id)

    @classmethod
    def update(cls, session_id: str, **kwargs):
        """Update session data."""
        with cls._lock:
            if session_id in cls._sessions:
                cls._sessions[session_id].update(kwargs)

    @classmethod
    def delete(cls, session_id: str):
        """Delete a session."""
        with cls._lock:
            cls._sessions.pop(session_id, None)

    @classmethod
    def cleanup_old(cls, max_age_hours: int = None):
        """Remove sessions older than max_age_hours."""
        from datetime import timedelta
        max_age = max_age_hours if max_age_hours is not None else cls._max_session_age_hours
        cutoff = datetime.now() - timedelta(hours=max_age)
        with cls._lock:
            to_delete = []
            for sid, data in cls._sessions.items():
                try:
                    created = datetime.fromisoformat(data['created'])
                    if created < cutoff:
                        to_delete.append(sid)
                except (KeyError, ValueError):
                    to_delete.append(sid)
            for sid in to_delete:
                del cls._sessions[sid]
        return len(to_delete)

    @classmethod
    def get_session_count(cls) -> int:
        """Return the current number of active sessions."""
        with cls._lock:
            return len(cls._sessions)

    @classmethod
    def start_auto_cleanup(cls, interval_seconds: int = 3600, max_age_hours: int = 24):
        """
        Start a background thread that periodically cleans up old sessions.

        v3.0.116 (BUG-M03): Prevents memory growth over long server runtime.

        Args:
            interval_seconds: How often to run cleanup (default: 1 hour)
            max_age_hours: Maximum session age before cleanup (default: 24 hours)
        """
        if cls._cleanup_running:
            return  # Already running

        cls._cleanup_interval = interval_seconds
        cls._max_session_age_hours = max_age_hours
        cls._cleanup_running = True

        def cleanup_loop():
            while cls._cleanup_running:
                time.sleep(cls._cleanup_interval)
                if not cls._cleanup_running:
                    break
                try:
                    count = cls.cleanup_old()
                    if count > 0:
                        logger.info(f"SessionManager auto-cleanup removed {count} expired sessions")
                except Exception as e:
                    logger.warning(f"SessionManager auto-cleanup error: {e}")

        cls._cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
        cls._cleanup_thread.start()
        logger.info(f"SessionManager auto-cleanup started (interval={interval_seconds}s, max_age={max_age_hours}h)")

    @classmethod
    def stop_auto_cleanup(cls):
        """Stop the background cleanup thread."""
        cls._cleanup_running = False
        if cls._cleanup_thread:
            cls._cleanup_thread = None
        logger.info("SessionManager auto-cleanup stopped")


# v3.0.35: Expose SessionManager to blueprints via Flask config
app.config['SESSION_MANAGER'] = SessionManager


# =============================================================================
# AUTHENTICATION MIDDLEWARE
# =============================================================================

def check_authentication() -> Optional[tuple]:
    """
    Check authentication if enabled. Returns None if OK, or (response, status_code) if denied.
    
    Supports two modes:
    - trusted_header: Requires X-Authenticated-User header (for use behind proxy/gateway)
    - api_key: Requires X-API-Key header matching TWR_API_KEY env var
    """
    if not config.auth_enabled:
        return None
    
    # Get auth provider mode
    auth_provider = config.auth_provider
    
    if auth_provider == 'trusted_header':
        # Trusted header mode - expect X-Authenticated-User from proxy
        user = request.headers.get('X-Authenticated-User')
        if not user:
            logger.warning("Authentication failed: missing X-Authenticated-User header",
                         client_ip=request.remote_addr,
                         path=request.path)
            return jsonify({
                'success': False,
                'error': {
                    'code': 'AUTH_REQUIRED',
                    'message': 'Authentication required. Missing X-Authenticated-User header.'
                }
            }), 401
        
        # Store user info in request context
        g.authenticated_user = user
        g.authenticated_groups = request.headers.get('X-Authenticated-Groups', '').split(',')
        return None
    
    elif auth_provider == 'api_key':
        # API key mode - check X-API-Key header
        api_key = request.headers.get('X-API-Key')
        expected_key = os.environ.get('TWR_API_KEY', '')
        
        if not expected_key:
            logger.error("TWR_API_KEY not configured but auth_provider=api_key")
            return jsonify({
                'success': False,
                'error': {
                    'code': 'CONFIG_ERROR',
                    'message': 'Server authentication not configured properly.'
                }
            }), 500
        
        if not api_key or api_key != expected_key:
            logger.warning("Authentication failed: invalid or missing API key",
                         client_ip=request.remote_addr,
                         path=request.path)
            return jsonify({
                'success': False,
                'error': {
                    'code': 'AUTH_REQUIRED',
                    'message': 'Authentication required. Invalid or missing X-API-Key header.'
                }
            }), 401
        
        g.authenticated_user = 'api_key_user'
        g.authenticated_groups = ['api']
        return None
    
    # Unknown provider or 'none' - allow through
    return None


def require_admin(f: Callable) -> Callable:
    """Decorator to require admin role for sensitive endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not config.auth_enabled:
            return f(*args, **kwargs)
        
        # Check if user is in admin group
        groups = getattr(g, 'authenticated_groups', [])
        if 'admin' not in groups and 'administrators' not in groups:
            # Also allow if auth mode is api_key (API keys are considered admin)
            if config.auth_provider != 'api_key':
                logger.warning("Admin access denied",
                             user=getattr(g, 'authenticated_user', 'unknown'),
                             path=request.path)
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'FORBIDDEN',
                        'message': 'Admin access required for this endpoint.'
                    }
                }), 403
        
        return f(*args, **kwargs)
    return decorated


# =============================================================================
# MIDDLEWARE & DECORATORS
# =============================================================================

@app.before_request
def before_request():
    """Setup request context."""
    # Generate correlation ID
    correlation_id = StructuredLogger.new_correlation_id()
    g.correlation_id = correlation_id
    g.request_start = datetime.now()
    
    # Get or create session
    session_id = request.cookies.get('twr_session') or session.get('session_id')
    if not session_id:
        session_id = SessionManager.create()
        session['session_id'] = session_id
    elif not SessionManager.get(session_id):
        # Session ID exists in cookie but not in SessionManager - recreate it
        SessionManager.create(session_id)
    g.session_id = session_id
    
    # Authentication check for /api/* routes (except health/ready/csrf-token/version)
    if request.path.startswith('/api/'):
        # Version endpoint exempt so UI can always show version label
        exempt_paths = ['/api/health', '/api/health/assets', '/api/ready', '/api/csrf-token', '/api/version']
        if request.path not in exempt_paths:
            auth_result = check_authentication()
            if auth_result is not None:
                return auth_result
    
    # Rate limiting for requests (with exemptions for high-frequency endpoints)
    if config.rate_limit_enabled:
        # Exempt paths that shouldn't count against rate limits
        rate_limit_exempt = (
            # Health/status endpoints (may be polled frequently)
            request.path in ['/api/health', '/api/health/assets', '/api/ready', '/api/version', '/api/csrf-token'],
            # Static assets
            request.path.startswith('/static/'),
            request.path.startswith('/vendor/'),
            request.path.startswith('/css/'),
            request.path.startswith('/js/'),
            request.path.startswith('/images/'),
            # Favicon and other root static files
            request.path in ['/favicon.ico', '/logo.png', '/style.css', '/app.js'],
        )
        
        if not any(rate_limit_exempt):
            client_ip = request.remote_addr or 'unknown'
            rate_limiter = get_rate_limiter()
            if not rate_limiter.is_allowed(client_ip):
                retry_after = rate_limiter.get_retry_after(client_ip)
                logger.warning("Rate limit exceeded", 
                              client_ip=client_ip, 
                              retry_after=retry_after)
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'RATE_LIMIT',
                        'message': 'Too many requests',
                        'retry_after': retry_after
                    }
                }), 429
    
    # Log request start
    logger.debug("Request started",
                method=request.method,
                path=request.path,
                client_ip=request.remote_addr)


@app.after_request
def after_request(response: Response) -> Response:
    """Add security headers, correlation ID, and log request completion."""
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # v2.9.4.2: Add correlation ID for frontend/backend error correlation
    correlation_id = StructuredLogger.get_correlation_id()
    response.headers['X-Correlation-ID'] = correlation_id
    
    # CSP - strict by default, allows CDN fallback if configured
    # Check config for CDN fallback allowance
    allow_cdn = False
    try:
        config_path = Path(__file__).parent / 'config.json'
        if config_path.exists():
            import json
            with open(config_path, encoding='utf-8') as f:
                cfg = json.load(f)
                allow_cdn = cfg.get('security', {}).get('allow_cdn_fallback', False)
    except (IOError, json.JSONDecodeError, KeyError) as e:
        # v2.9.4.1: Fix BUG-M01 - log config errors instead of silent catch
        logger.debug(f"Config load error (using defaults): {e}")
    
    if allow_cdn:
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://d3js.org; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
    else:
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
    
    # CSRF token in response header for JS access
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()
    response.headers['X-CSRF-Token'] = session['csrf_token']
    
    # Log request completion
    duration_ms = 0
    if hasattr(g, 'request_start'):
        duration_ms = (datetime.now() - g.request_start).total_seconds() * 1000
    
    logger.info("Request completed",
               method=request.method,
               path=request.path,
               status=response.status_code,
               duration_ms=round(duration_ms, 2),
               correlation_id=correlation_id)
    
    return response


def require_csrf(f: Callable) -> Callable:
    """Decorator to require CSRF token on state-changing requests."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not config.csrf_enabled:
            return f(*args, **kwargs)
        
        # Get token from header or form
        token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
        expected = session.get('csrf_token')
        
        if not token or not expected or not verify_csrf_token(token, expected):
            logger.warning("CSRF validation failed",
                          path=request.path,
                          client_ip=request.remote_addr)
            return jsonify({
                'success': False,
                'error': {
                    'code': 'CSRF_ERROR',
                    'message': 'Invalid or missing CSRF token'
                }
            }), 403
        
        return f(*args, **kwargs)
    return decorated


def handle_api_errors(f: Callable) -> Callable:
    """
    Decorator for standardized API error handling.
    
    v2.9.5 #54: Enhanced to GUARANTEE a response is always returned.
    This prevents Waitress queue blocking when routes hang or throw unexpected errors.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # v2.9.5 #54: Start timing to detect slow operations
        start_time = time.time()
        
        try:
            result = f(*args, **kwargs)
            
            # v2.9.5 #54: Log slow operations for diagnostics
            elapsed = time.time() - start_time
            if elapsed > 5.0:
                logger.warning(f"Slow API call: {f.__name__} took {elapsed:.1f}s")
            
            return result
            
        except TechWriterError as e:
            logger.error(f"API error: {e.message}",
                        code=e.code,
                        status=e.status_code,
                        details=e.details)
            return jsonify(e.to_dict()), e.status_code
        except FileNotFoundError as e:
            logger.exception(f"File not found: {e}")
            return jsonify({
                'success': False,
                'error': {'code': 'FILE_NOT_FOUND', 'message': str(e)}
            }), 404
        except PermissionError as e:
            logger.exception(f"Permission denied: {e}")
            return jsonify({
                'success': False,
                'error': {'code': 'PERMISSION_DENIED', 'message': str(e)}
            }), 403
        except ValueError as e:
            logger.exception(f"Validation error: {e}")
            return jsonify({
                'success': False,
                'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}
            }), 400
        except TimeoutError as e:
            # v2.9.5 #54: Handle timeout specifically
            logger.error(f"Operation timed out in {f.__name__}: {e}")
            return jsonify({
                'success': False,
                'error': {
                    'code': 'TIMEOUT',
                    'message': str(e) or 'Operation timed out',
                    'correlation_id': getattr(g, 'correlation_id', 'unknown')
                }
            }), 504  # Gateway Timeout
        except Exception as e:
            logger.exception(f"Unexpected error in {f.__name__}: {e}")
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An unexpected error occurred',
                    'correlation_id': getattr(g, 'correlation_id', 'unknown')
                }
            }), 500
    return decorated


# =============================================================================
# v3.0.101: STANDARDIZED API RESPONSE HELPERS (ISSUE-004)
# =============================================================================

def api_error_response(code: str, message: str, status_code: int = 400, details: Dict = None):
    """
    Create a standardized API error response.
    
    v3.0.101 (ISSUE-004): Standardizes all error responses to use a consistent format:
    {
        'success': False,
        'error': {
            'code': 'ERROR_CODE',
            'message': 'Human readable message',
            'correlation_id': 'uuid-from-request'
        }
    }
    
    Args:
        code: Error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
        message: Human-readable error message
        status_code: HTTP status code (default 400)
        details: Optional dict with additional error details
        
    Returns:
        tuple: (jsonify response, status_code)
    """
    error_data = {
        'code': code,
        'message': message,
        'correlation_id': getattr(g, 'correlation_id', 'unknown')
    }
    
    if details:
        error_data['details'] = details
    
    return jsonify({
        'success': False,
        'error': error_data
    }), status_code


def api_success_response(data: Any = None, message: str = None):
    """
    Create a standardized API success response.
    
    v3.0.101 (ISSUE-004): Ensures success responses are also consistent.
    
    Args:
        data: Response data (can be any JSON-serializable type)
        message: Optional success message
        
    Returns:
        Response: Flask jsonify response
    """
    response = {'success': True}
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    return jsonify(response)


# =============================================================================
# v3.0.101: DOCUMENT EXTRACTOR HELPER (ISSUE-008)
# =============================================================================

def get_document_extractor(filepath: Path, analyze_quality: bool = False):
    """
    Get the appropriate document extractor based on file extension.
    
    v3.0.101 (ISSUE-008): Centralizes document type detection logic that was
    previously duplicated in multiple upload handlers.
    
    Args:
        filepath: Path to the document file
        analyze_quality: For PDFs, whether to analyze extraction quality (default False)
        
    Returns:
        tuple: (extractor, file_type, quality_info)
            - extractor: Document extractor instance
            - file_type: 'pdf' or 'docx'
            - quality_info: PDF quality summary or None
            
    Raises:
        ImportError: If required extraction library is not available
    """
    suffix = filepath.suffix.lower()
    
    if suffix == '.pdf':
        quality_info = None
        try:
            from pdf_extractor_v2 import PDFExtractorV2
            extractor = PDFExtractorV2(str(filepath), analyze_quality=analyze_quality)
            if analyze_quality:
                quality_info = extractor.get_quality_summary()
        except ImportError:
            from pdf_extractor import PDFExtractor
            extractor = PDFExtractor(str(filepath))
        
        return extractor, 'pdf', quality_info
    else:
        from core import DocumentExtractor
        extractor = DocumentExtractor(str(filepath))
        return extractor, 'docx', None


# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(400)
def bad_request(e):
    logger.warning(f"Bad request: {e}")
    return jsonify({
        'success': False,
        'error': {'code': 'BAD_REQUEST', 'message': str(e)}
    }), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'success': False,
        'error': {'code': 'NOT_FOUND', 'message': 'Resource not found'}
    }), 404


@app.errorhandler(413)
def payload_too_large(e):
    max_mb = config.max_content_length / (1024 * 1024)
    logger.warning(f"File too large: max={max_mb}MB")
    return jsonify({
        'success': False,
        'error': {
            'code': 'FILE_TOO_LARGE',
            'message': f'File exceeds maximum size of {max_mb:.0f}MB'
        }
    }), 413


@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({
        'success': False,
        'error': {'code': 'RATE_LIMIT', 'message': 'Too many requests'}
    }), 429


@app.errorhandler(500)
def internal_error(e):
    logger.exception(f"Internal server error: {e}")
    return jsonify({
        'success': False,
        'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'An internal error occurred',
            'correlation_id': getattr(g, 'correlation_id', 'unknown')
        }
    }), 500


# =============================================================================
# ROUTES - UI
# =============================================================================

@app.route('/')
def index():
    """Serve the main application page.
    
    v3.0.49: Check templates/index.html first (transport layout), 
    then fall back to index.html (legacy flat layout).
    """
    # Check templates/ directory first (standard transport layout)
    index_path = config.base_dir / 'templates' / 'index.html'
    
    # Fall back to root for legacy flat layouts
    if not index_path.exists():
        index_path = config.base_dir / 'index.html'
    
    if not index_path.exists():
        logger.error("index.html not found", 
                    checked_paths=[
                        str(config.base_dir / 'templates' / 'index.html'),
                        str(config.base_dir / 'index.html')
                    ])
        return jsonify({
            'success': False,
            'error': {'code': 'CONFIG_ERROR', 'message': 'Application not properly installed'}
        }), 500
    
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except IOError as e:
        logger.exception(f"Failed to read index.html: {e}")
        return jsonify({
            'success': False,
            'error': {'code': 'IO_ERROR', 'message': 'Failed to load application'}
        }), 500
    
    # Inject CSRF token
    csrf_token = session.get('csrf_token') or generate_csrf_token()
    session['csrf_token'] = csrf_token
    
    csrf_meta = f'<meta name="csrf-token" content="{csrf_token}">'
    content = content.replace('<head>', f'<head>\n    {csrf_meta}')
    
    return content


def sanitize_static_path(filename: str, allowed_extensions: set = None) -> str:
    """Sanitize a relative file path while preserving directory structure.
    
    v3.0.49: Fix for nested static file serving (ui/state.js, features/roles.js).
    Unlike secure_filename() which flattens paths, this preserves directory
    structure while preventing path traversal attacks.
    
    Args:
        filename: Relative path like 'ui/state.js' or 'app.js'
        allowed_extensions: Set of allowed extensions like {'.js', '.css'}
        
    Returns:
        Sanitized relative path or None if invalid
    """
    if not filename:
        return None
    
    # Normalize path separators to forward slashes
    normalized = filename.replace('\\', '/')
    
    # Check for path traversal attempts
    if '..' in normalized or normalized.startswith('/'):
        logger.warning("Path traversal attempt blocked", file_name=filename)
        return None
    
    # Split into parts and validate each
    parts = normalized.split('/')
    safe_parts = []
    
    for part in parts:
        # Skip empty parts (from double slashes)
        if not part:
            continue
        # Each part should be a valid filename component
        # Allow alphanumeric, dash, underscore, dot (but not starting with dot)
        if part.startswith('.') or not all(c.isalnum() or c in '-_.' for c in part):
            # Fall back to secure_filename for this part
            safe_part = secure_filename(part)
            if not safe_part:
                return None
            safe_parts.append(safe_part)
        else:
            safe_parts.append(part)
    
    if not safe_parts:
        return None
    
    # Join back together
    safe_path = '/'.join(safe_parts)
    
    # Check extension if specified
    if allowed_extensions:
        ext = Path(safe_path).suffix.lower()
        if ext not in allowed_extensions:
            return None
    
    return safe_path


@app.route('/static/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files.
    
    v3.0.49: Uses sanitize_static_path for proper nested path handling.
    Checks multiple locations for compatibility with different
    installation layouts (flat vs structured).
    """
    safe_name = sanitize_static_path(filename, {'.css'})
    if not safe_name:
        return api_error_response('INVALID_PATH', 'Invalid path', 400)
    
    # Check multiple possible locations
    possible_paths = [
        config.base_dir / 'static' / 'css' / safe_name,   # static/css/ subdirectory
        config.base_dir / 'css' / safe_name,              # css/ subdirectory  
        config.base_dir / safe_name,                      # app root (style.css)
    ]
    
    for css_path in possible_paths:
        if css_path.exists():
            return send_file(css_path, mimetype='text/css')
    
    return api_error_response('NOT_FOUND', f'CSS file not found: {safe_name}', 404)


@app.route('/static/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files.
    
    v3.0.49: Uses sanitize_static_path to properly handle nested paths
    like ui/state.js, features/roles.js, api/client.js.
    """
    safe_name = sanitize_static_path(filename, {'.js'})
    if not safe_name:
        return api_error_response('INVALID_PATH', 'Invalid path', 400)
    
    # Check multiple possible locations, preserving nested structure
    possible_paths = [
        config.base_dir / 'static' / 'js' / safe_name,  # static/js/ subdirectory (primary)
        config.base_dir / 'js' / safe_name,             # js/ subdirectory
        config.base_dir / safe_name,                    # app root (legacy flat layout)
    ]
    
    for js_path in possible_paths:
        if js_path.exists():
            return send_file(js_path, mimetype='application/javascript')
    
    logger.debug("JS file not found", requested=filename, safe_name=safe_name,
                checked_paths=[str(p) for p in possible_paths])
    return api_error_response('NOT_FOUND', f'JavaScript file not found: {safe_name}', 404)


@app.route('/static/js/vendor/<path:filename>')
def serve_vendor_js(filename):
    """Serve vendored JavaScript libraries.
    
    v3.0.49: Uses sanitize_static_path for security.
    Checks multiple locations for compatibility with different
    installation layouts. Returns 404 for missing files so that
    onerror CDN fallback triggers properly.
    """
    safe_name = sanitize_static_path(filename, {'.js'})
    if not safe_name:
        return api_error_response('INVALID_PATH', 'Invalid path', 400)
    
    # Check multiple possible locations
    possible_paths = [
        config.base_dir / 'vendor' / safe_name,                      # vendor/ subdirectory
        config.base_dir / 'static' / 'js' / 'vendor' / safe_name,    # static/js/vendor/
        config.base_dir / 'js' / 'vendor' / safe_name,               # js/vendor/
    ]
    
    for vendor_path in possible_paths:
        if vendor_path.exists():
            return send_file(vendor_path, mimetype='application/javascript')
    
    # Return 404 to trigger onerror fallback to CDN
    return api_error_response('NOT_FOUND', f'Vendor file not found: {safe_name}', 404)


@app.route('/static/images/<path:filename>')
def serve_images(filename):
    """Serve image files.
    
    v3.0.49: Uses sanitize_static_path for consistency.
    SECURITY: Only serves allowed image extensions and restricts root fallback
    to a strict allowlist to prevent arbitrary file disclosure.
    """
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'}
    safe_name = sanitize_static_path(filename, allowed_extensions)
    
    if not safe_name:
        logger.warning("Blocked invalid image request to /static/images",
                      requested_file=filename)
        return api_error_response('NOT_FOUND', 'Image not found', 404)
    
    ext = Path(safe_name).suffix.lower()
    
    # SECURITY: Strict allowlist for root fallback (only known assets)
    root_allowed_files = {'logo.png', 'favicon.ico'}
    
    # Check /images subdirectory first (preferred location)
    img_path = config.base_dir / 'images' / safe_name
    
    # Fallback to app root ONLY for explicitly allowed files
    if not img_path.exists() and safe_name in root_allowed_files:
        img_path = config.base_dir / safe_name
    
    if img_path.exists():
        # Determine MIME type
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.webp': 'image/webp'
        }
        mime = mime_types.get(ext, 'image/png')  # Default to image/png, never octet-stream
        return send_file(img_path, mimetype=mime)
    return api_error_response('NOT_FOUND', f'Image not found: {safe_name}', 404)


# v2.9.3 B24: Add explicit favicon route
@app.route('/favicon.ico')
def serve_favicon():
    """Serve favicon with fallback to app root.
    
    Checks both /images subdirectory and app root for compatibility
    with different installation methods.
    """
    # Check /images subdirectory first (preferred location)
    favicon_path = config.base_dir / 'images' / 'favicon.ico'
    
    # Fallback to app root (where installer places files)
    if not favicon_path.exists():
        favicon_path = config.base_dir / 'favicon.ico'
    
    if favicon_path.exists():
        return send_file(favicon_path, mimetype='image/x-icon')
    
    # Return 204 No Content to avoid console errors for missing favicon
    return '', 204


# =============================================================================
# ROUTES - API
# =============================================================================

@app.route('/api/csrf-token', methods=['GET'])
@handle_api_errors
def get_csrf_token():
    """Get a fresh CSRF token."""
    token = generate_csrf_token()
    session['csrf_token'] = token
    return jsonify({'csrf_token': token})


@app.route('/api/upload', methods=['POST'])
@require_csrf
@handle_api_errors
def upload():
    """Upload and analyze document structure."""
    if 'file' not in request.files:
        raise ValidationError("No file provided", field='file')
    
    file = request.files['file']
    if not file.filename:
        raise ValidationError("No file selected", field='file')
    
    # Sanitize and validate filename
    original_name = sanitize_filename(file.filename)
    
    # Validate extension (supports PDF and DOCX)
    if not validate_file_extension(original_name, config.allowed_extensions):
        allowed = ', '.join(config.allowed_extensions)
        raise ValidationError(
            f"Invalid file type. Allowed: {allowed}",
            field='file',
            allowed_types=list(config.allowed_extensions)
        )
    
    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex[:8]}_{original_name}"
    filepath = config.temp_dir / unique_name
    
    # Save file
    file.save(str(filepath))
    
    file_size = filepath.stat().st_size
    logger.info("File uploaded",
               file_name=original_name,
               size=file_size,
               path=str(filepath))
    
    # Update session
    session_data = SessionManager.get(g.session_id)
    if session_data:
        SessionManager.update(g.session_id,
                             current_file=str(filepath),
                             original_filename=original_name,
                             review_results=None,
                             filtered_issues=[],
                             selected_issues=set())
    
    # Extract document info based on file type - v3.0.101 ISSUE-008: Use centralized helper
    try:
        extractor, file_type, pdf_quality = get_document_extractor(filepath, analyze_quality=True)
        
        doc_info = {
            'filename': original_name,
            'file_type': file_type,
            'word_count': extractor.word_count,
            'paragraph_count': len(extractor.paragraphs),
            'table_count': len(extractor.tables),
            'figure_count': len(extractor.figures),
            'heading_count': len(getattr(extractor, 'headings', [])),
            'has_toc': extractor.has_toc
        }
        
        # Add PDF-specific fields
        if file_type == 'pdf':
            doc_info['page_count'] = extractor.page_count
            doc_info['pdf_quality'] = pdf_quality
        else:
            # DOCX-specific fields
            doc_info['existing_comments'] = len(extractor.comments)
            doc_info['track_changes'] = len(extractor.track_changes)
        
        return jsonify({'success': True, 'data': doc_info})
    
    except ImportError as e:
        logger.exception(f"Missing dependency: {e}")
        raise ProcessingError(f"Missing required library: {e}", stage='extraction')


# v3.0.113: Development test endpoint for loading test files
@app.route('/api/dev/load-test-file', methods=['GET'])
@handle_api_errors
def dev_load_test_file():
    """Development endpoint to load a predefined test file for testing."""
    test_file = config.temp_dir / 'nasa_test.docx'
    if not test_file.exists():
        raise ValidationError("Test file not found", field='file')

    try:
        extractor, file_type, _ = get_document_extractor(test_file, analyze_quality=True)

        doc_info = {
            'filename': 'nasa_test.docx',
            'filepath': str(test_file),
            'file_type': file_type,
            'word_count': extractor.word_count,
            'paragraph_count': len(extractor.paragraphs),
            'table_count': len(extractor.tables),
            'figure_count': len(extractor.figures),
            'heading_count': len(getattr(extractor, 'headings', [])),
            'has_toc': extractor.has_toc
        }

        # Store in session for review
        session_data = SessionManager.get(g.session_id)
        if session_data:
            SessionManager.update(g.session_id,
                                 current_file=str(test_file),
                                 original_filename='nasa_test.docx',
                                 review_results=None)

        return jsonify({'success': True, 'data': doc_info})
    except Exception as e:
        logger.exception(f"Error loading test file: {e}")
        raise ProcessingError(f"Failed to load test file: {e}", stage='extraction')


# v3.0.114: Development endpoint to serve temp files for browser testing
@app.route('/api/dev/temp/<filename>', methods=['GET'])
@handle_api_errors
def dev_serve_temp_file(filename):
    """Serve a file from the temp directory for development testing."""
    from flask import send_from_directory
    # Sanitize filename to prevent path traversal
    safe_filename = Path(filename).name
    temp_path = config.temp_dir / safe_filename
    if not temp_path.exists():
        raise ValidationError(f"File not found: {safe_filename}", field='filename')
    return send_from_directory(config.temp_dir, safe_filename)


@app.route('/api/upload/batch', methods=['POST'])
@require_csrf
@handle_api_errors
def upload_batch():
    """
    Upload and process multiple documents at once.

    v3.0.116 (BUG-M02): Enforces batch limits to prevent memory issues.
    - MAX_BATCH_SIZE: Maximum number of files per batch
    - MAX_BATCH_TOTAL_SIZE: Maximum total size across all files

    Accepts multiple files and processes them sequentially.
    Returns summary of all processed files.
    """
    if 'files[]' not in request.files:
        raise ValidationError("No files provided", field='files[]')

    files = request.files.getlist('files[]')
    if not files or all(not f.filename for f in files):
        raise ValidationError("No files selected", field='files[]')

    # Filter valid files
    valid_files = [f for f in files if f.filename and
                   validate_file_extension(sanitize_filename(f.filename), config.allowed_extensions)]

    if not valid_files:
        allowed = ', '.join(config.allowed_extensions)
        raise ValidationError(f"No valid files found. Allowed types: {allowed}", field='files[]')

    # v3.0.116 (BUG-M02): Enforce batch file count limit
    if len(valid_files) > MAX_BATCH_SIZE:
        raise ValidationError(
            f"Too many files in batch. Maximum is {MAX_BATCH_SIZE}, got {len(valid_files)}.",
            field='files[]'
        )

    results = {
        'processed': [],
        'errors': [],
        'total_files': len(valid_files),
        'total_size': 0
    }

    # Process each file with streaming to reduce memory usage
    for file in valid_files:
        original_name = sanitize_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex[:8]}_{original_name}"
        filepath = config.temp_dir / unique_name

        try:
            # v3.0.116 (BUG-M02): Stream file to disk instead of loading entirely into memory
            # Use chunked writing to handle large files more efficiently
            file_size = 0
            with open(filepath, 'wb') as f:
                while True:
                    chunk = file.stream.read(8192)  # 8KB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                    file_size += len(chunk)

                    # Check total batch size limit while streaming
                    if results['total_size'] + file_size > MAX_BATCH_TOTAL_SIZE:
                        # Clean up partial file
                        f.close()
                        filepath.unlink(missing_ok=True)
                        raise ValidationError(
                            f"Batch total size exceeds {MAX_BATCH_TOTAL_SIZE // (1024*1024)}MB limit.",
                            field='files[]'
                        )

            results['total_size'] += file_size

            logger.info("Batch file saved",
                       file_name=original_name,
                       size=file_size)

            # Extract basic document info - v3.0.101 ISSUE-008: Use centralized helper
            extractor, file_type, pdf_quality = get_document_extractor(filepath, analyze_quality=True)

            doc_info = {
                'filename': original_name,
                'filepath': str(filepath),
                'file_type': file_type,
                'file_size': file_size,
                'word_count': extractor.word_count,
                'paragraph_count': len(extractor.paragraphs)
            }

            if file_type == 'pdf' and pdf_quality:
                doc_info['pdf_quality'] = pdf_quality

            results['processed'].append(doc_info)

        except ValidationError:
            # Re-raise validation errors (like size limit exceeded)
            raise
        except Exception as e:
            # v3.0.116 (BUG-M04): Include full traceback for debugging
            tb_str = traceback.format_exc()
            logger.error(f"Batch file error: {original_name} - {e}\n{tb_str}")
            results['errors'].append({
                'filename': original_name,
                'error': str(e),
                'traceback': tb_str if config.debug else None  # Only include traceback in debug mode
            })

    return jsonify({
        'success': True,
        'data': results
    })


@app.route('/api/review/batch', methods=['POST'])
@require_csrf
@handle_api_errors
def review_batch():
    """
    Review multiple documents and aggregate results.
    
    Expects JSON body with list of filepaths from batch upload.
    Returns aggregated review results.
    """
    data = request.get_json() or {}
    filepaths = data.get('filepaths', [])
    options = data.get('options', {})
    
    if not filepaths:
        raise ValidationError("No filepaths provided")
    
    results = {
        'documents': [],
        'summary': {
            'total_documents': len(filepaths),
            'total_issues': 0,
            'issues_by_severity': {'High': 0, 'Medium': 0, 'Low': 0},
            'issues_by_category': {}
        },
        'roles_found': {}
    }
    
    engine = TechWriterReviewEngine()
    
    for filepath in filepaths:
        filepath = Path(filepath)
        if not filepath.exists():
            results['documents'].append({
                'filename': filepath.name,
                'error': 'File not found'
            })
            continue
        
        try:
            doc_results = engine.review_document(str(filepath), options)
            
            # Count issues
            issues = doc_results.get('issues', [])
            issue_count = len(issues)
            results['summary']['total_issues'] += issue_count
            
            for issue in issues:
                sev = issue.get('severity', 'Low')
                results['summary']['issues_by_severity'][sev] = \
                    results['summary']['issues_by_severity'].get(sev, 0) + 1
                cat = issue.get('category', 'Unknown')
                results['summary']['issues_by_category'][cat] = \
                    results['summary']['issues_by_category'].get(cat, 0) + 1
            
            # Collect roles - v3.0.114: Ensure roles is a dict with actual role data
            doc_roles = doc_results.get('roles', {})
            if not isinstance(doc_roles, dict):
                doc_roles = {}
            # Filter out non-role keys like 'success'
            actual_roles = {k: v for k, v in doc_roles.items()
                          if isinstance(v, dict) and k not in ('success', 'error')}

            for role_name, role_data in actual_roles.items():
                if role_name not in results['roles_found']:
                    results['roles_found'][role_name] = {
                        'documents': [],
                        'total_mentions': 0
                    }
                results['roles_found'][role_name]['documents'].append(filepath.name)
                results['roles_found'][role_name]['total_mentions'] += \
                    role_data.get('count', 1) if isinstance(role_data, dict) else 1

            # v3.0.114: Safely get word_count with type checking
            doc_info = doc_results.get('document_info', {})
            word_count = 0
            if isinstance(doc_info, dict):
                word_count = doc_info.get('word_count', 0)

            # v3.0.114: Store filepath and scan_id for individual document access
            doc_entry = {
                'filename': filepath.name,
                'filepath': str(filepath),
                'issue_count': issue_count,
                'role_count': len(actual_roles),
                'word_count': word_count,
                'score': doc_results.get('score', 0),
                'grade': doc_results.get('grade', 'N/A'),
                'scan_id': None  # Will be set if scan history records successfully
            }

            # Record in scan history
            if SCAN_HISTORY_AVAILABLE:
                try:
                    db = get_scan_history_db()
                    scan_record = db.record_scan(
                        filename=filepath.name,
                        filepath=str(filepath),
                        results=doc_results,
                        options=options
                    )
                    # Get scan_id if returned
                    if scan_record and isinstance(scan_record, dict):
                        doc_entry['scan_id'] = scan_record.get('scan_id')
                except Exception as e:
                    logger.warning(f"Failed to record batch scan: {e}")

            results['documents'].append(doc_entry)
            
        except Exception as e:
            # v3.0.116 (BUG-M04): Include full traceback for debugging
            tb_str = traceback.format_exc()
            logger.error(f"Batch review error: {filepath.name} - {e}\n{tb_str}")
            results['documents'].append({
                'filename': filepath.name,
                'error': str(e),
                'traceback': tb_str if config.debug else None  # Only include traceback in debug mode
            })
    
    return jsonify({
        'success': True,
        'data': results
    })


@app.route('/api/review/single', methods=['POST'])
@require_csrf
@handle_api_errors
def review_single():
    """
    v3.0.114: Review a single document by filepath.
    Used for loading individual documents from batch results.

    Expects JSON body with filepath and optional filename.
    Returns full review results for display.
    """
    data = request.get_json() or {}
    filepath_str = data.get('filepath')
    filename = data.get('filename')
    options = data.get('options', {})

    if not filepath_str:
        raise ValidationError("No filepath provided")

    filepath = Path(filepath_str)
    if not filepath.exists():
        raise FileError(f"Document not found: {filepath.name}")

    # Security check: ensure filepath is within temp directory
    try:
        filepath.resolve().relative_to(config.temp_dir.resolve())
    except ValueError:
        raise ValidationError("Invalid filepath - document must be in temp directory")

    original_filename = filename or filepath.name
    # Strip UUID prefix if present (e.g., "abc123_document.docx" -> "document.docx")
    if '_' in original_filename and len(original_filename.split('_')[0]) == 8:
        original_filename = '_'.join(original_filename.split('_')[1:])

    # Run review
    engine = TechWriterReviewEngine()
    results = engine.review_document(str(filepath), options)

    # Update session to allow Fix Assistant access
    try:
        session_data = SessionManager.get(g.session_id) or {}
        session_data['current_file'] = str(filepath)
        session_data['original_filename'] = original_filename
        SessionManager.set(g.session_id, session_data)
    except Exception as e:
        # Log but don't fail - session update is non-critical
        import traceback
        traceback.print_exc()

    return jsonify({
        'success': True,
        'data': results
    })


@app.route('/api/review', methods=['POST'])
@require_csrf
@handle_api_errors
def review():
    """Run comprehensive document review."""
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded. Please upload a file first.")
    
    filepath = Path(session_data['current_file'])
    if not filepath.exists():
        raise FileError("Document file not found. Please re-upload.")
    
    data = request.get_json() or {}
    options = data.get('options', {})
    
    original_filename = session_data.get('original_filename', filepath.name)
    
    with logger.log_operation("document_review", file_name=original_filename):
        engine = TechWriterReviewEngine()
        results = engine.review_document(str(filepath), options)
    
    # Record in scan history
    # v2.9.4 #27: Enhanced logging to debug scan history issues
    scan_info = None
    if SCAN_HISTORY_AVAILABLE:
        try:
            db = get_scan_history_db()
            logger.info(f"Recording scan for: {original_filename}")
            scan_info = db.record_scan(
                filename=original_filename,
                filepath=str(filepath),
                results=results,
                options=options
            )
            if scan_info:
                logger.info(f"Scan recorded: scan_id={scan_info.get('scan_id')}, "
                           f"document_id={scan_info.get('document_id')}, "
                           f"is_rescan={scan_info.get('is_rescan')}")
            else:
                logger.warning(f"record_scan returned None for {original_filename}")
        except Exception as e:
            logger.error(f"Scan history error for {original_filename}: {e}", exc_info=True)
    else:
        logger.debug("Scan history not available - skipping record")
    
    # Update session with results
    SessionManager.update(g.session_id,
                         review_results=results,
                         filtered_issues=results.get('issues', []),
                         selected_issues=set())
    
    # v3.0.113: Extract document counts for Fix Assistant display
    doc_info = results.get('document_info', {})
    response_data = {
        'issues': results.get('issues', []),
        'issue_count': results.get('issue_count', 0),
        'score': results.get('score', 100),
        'grade': results.get('grade', 'A'),
        'by_severity': results.get('by_severity', {}),
        'by_category': results.get('by_category', {}),
        'readability': results.get('readability', {}),
        'document_info': doc_info,
        'roles': results.get('roles', {}),
        # v2.9.4: Include full text for Statement Forge
        'full_text': results.get('full_text', ''),
        # v3.0.95: Hyperlink validation results for status panel (BUG-004 fix)
        'hyperlink_results': results.get('hyperlink_results'),
        # v3.0.113: Add document counts at top level for frontend display
        'word_count': results.get('word_count', 0),
        'paragraph_count': results.get('paragraph_count', 0),
        'table_count': results.get('table_count', 0),
        'heading_count': doc_info.get('heading_count', 0),
    }

    # v3.0.97b: Add Fix Assistant v2 enhancement data
    try:
        issues = results.get('issues', [])
        response_data['document_content'] = build_document_content(results)
        response_data['fix_groups'] = group_similar_fixes(issues)
        response_data['confidence_details'] = build_confidence_details(issues)
        doc_content = response_data['document_content']
        response_data['fix_statistics'] = compute_fix_statistics(
            issues,
            response_data['fix_groups'],
            response_data['confidence_details'],
            doc_content.get('page_count', 1)
        )
        logger.debug(f"Fix Assistant v2 data: {len(response_data['fix_groups'])} groups, "
                    f"{len(response_data['confidence_details'])} confidence details")
    except Exception as e:
        logger.warning(f"Fix Assistant v2 enhancement failed: {e}")
        # Provide empty defaults so frontend doesn't break
        response_data['document_content'] = {'paragraphs': [], 'page_map': {}, 'headings': [], 'page_count': 1}
        response_data['fix_groups'] = []
        response_data['confidence_details'] = {}
        response_data['fix_statistics'] = {'total': 0, 'by_tier': {}, 'by_category': {}, 'by_page': {}}
    
    # v3.0.30: Auto-extract Statement Forge summary if module available and text exists
    # v3.0.33 Chunk C: Store extracted statements in session for immediate availability
    # v3.0.49: Support both package and flat import layouts
    if STATEMENT_FORGE_AVAILABLE and results.get('full_text'):
        try:
            # Try package imports first (transport layout)
            try:
                from statement_forge.extractor import extract_statements
                from statement_forge.export import get_export_stats
                from statement_forge.routes import _store_statements, _get_session_key
            except ImportError:
                # Fall back to flat imports (legacy layout)
                from statement_forge__extractor import extract_statements
                from statement_forge__export import get_export_stats
                from statement_forge__routes import _store_statements, _get_session_key
            
            full_text = results.get('full_text', '')
            title = original_filename
            
            # Run extraction (lightweight summary mode)
            statements = extract_statements(full_text, title)
            
            if statements:
                stats = get_export_stats(statements)
                
                # v3.0.33 Chunk C: Persist statements to session for auto-availability
                _store_statements(statements)
                
                response_data['statement_forge_summary'] = {
                    'available': True,
                    'statements_ready': True,  # v3.0.33: Flag indicating statements are pre-loaded
                    'total_statements': len(statements),
                    'directive_counts': stats.get('directive_counts', {}),
                    'top_roles': stats.get('roles', [])[:5],  # Top 5 roles
                    'section_count': stats.get('section_count', 0)
                }
                logger.debug(f"Statement Forge auto-extract: {len(statements)} statements found and persisted")
            else:
                response_data['statement_forge_summary'] = {
                    'available': True,
                    'statements_ready': False,
                    'total_statements': 0
                }
        except Exception as e:
            logger.warning(f"Statement Forge auto-extract failed: {e}")
            response_data['statement_forge_summary'] = {
                'available': False,
                'statements_ready': False,
                'error': str(e)
            }
    else:
        response_data['statement_forge_summary'] = {
            'available': STATEMENT_FORGE_AVAILABLE if 'STATEMENT_FORGE_AVAILABLE' in dir() else False,
            'statements_ready': False
        }
    
    # Add scan history info if available
    if scan_info:
        response_data['scan_info'] = scan_info
    
    return jsonify({
        'success': True,
        'data': response_data
    })


# =============================================================================
# JOB-BASED REVIEW (v3.0.39 Batch I)
# =============================================================================

def _run_review_job(job_id: str, session_id: str, filepath: str, original_filename: str, options: dict):
    """
    Background worker function for job-based document review.
    
    v3.0.39: Implements async review with real progress tracking.
    
    Args:
        job_id: The job ID to update
        session_id: Session ID for storing results
        filepath: Path to the document
        original_filename: Original filename for logging
        options: Review options
    """
    if not JOB_MANAGER_AVAILABLE:
        logger.error("Job manager not available in worker")
        return
    
    manager = get_job_manager()
    job = manager.get_job(job_id)
    
    if not job:
        logger.error(f"Job {job_id} not found in worker")
        return
    
    # Start the job
    manager.start_job(job_id)
    
    # Create progress callback that updates the job
    def progress_callback(phase: str, progress: float, message: str):
        """Update job progress from core.py."""
        phase_map = {
            'extracting': JobPhase.EXTRACTING,
            'parsing': JobPhase.PARSING,
            'checking': JobPhase.CHECKING,
            'postprocessing': JobPhase.POSTPROCESSING,
            'complete': JobPhase.COMPLETE,
        }
        job_phase = phase_map.get(phase, JobPhase.CHECKING)
        manager.update_phase(job_id, job_phase, message)
        manager.update_phase_progress(job_id, progress, message)
    
    # Create cancellation check function
    def cancellation_check() -> bool:
        """Check if job was cancelled."""
        job = manager.get_job(job_id)
        return job.is_cancelled if job else True
    
    try:
        # Run the review with progress callback
        engine = TechWriterReviewEngine()
        results = engine.review_document(
            str(filepath), 
            options,
            progress_callback=progress_callback,
            cancellation_check=cancellation_check
        )
        
        # Check if cancelled
        if results.get('cancelled'):
            logger.info(f"Review job {job_id} was cancelled")
            return
        
        # Record in scan history
        if SCAN_HISTORY_AVAILABLE:
            try:
                db = get_scan_history_db()
                scan_info = db.record_scan(
                    filename=original_filename,
                    filepath=str(filepath),
                    results=results,
                    options=options
                )
                results['scan_info'] = scan_info
            except Exception as e:
                logger.error(f"Scan history error for {original_filename}: {e}")
        
        # Auto-extract Statement Forge if available (v3.0.49: support both layouts)
        if STATEMENT_FORGE_AVAILABLE and results.get('full_text'):
            try:
                # Try package imports first (transport layout)
                try:
                    from statement_forge.extractor import extract_statements
                    from statement_forge.export import get_export_stats
                except ImportError:
                    # Fall back to flat imports (legacy layout)
                    from statement_forge__extractor import extract_statements
                    from statement_forge__export import get_export_stats
                
                statements = extract_statements(results.get('full_text', ''), original_filename)
                if statements:
                    stats = get_export_stats(statements)
                    results['statement_forge_summary'] = {
                        'available': True,
                        'statements_ready': True,
                        'total_statements': len(statements),
                        'directive_counts': stats.get('directive_counts', {}),
                        'top_roles': stats.get('roles', [])[:5],
                        'section_count': stats.get('section_count', 0)
                    }
            except Exception as e:
                logger.warning(f"Statement Forge auto-extract failed: {e}")
                results['statement_forge_summary'] = {'available': False, 'error': str(e)}
        
        # Update session with results
        SessionManager.update(session_id,
                             review_results=results,
                             filtered_issues=results.get('issues', []),
                             selected_issues=set())
        
        # Complete the job with results
        manager.complete_job(job_id, result=results)
        logger.info(f"Review job {job_id} completed: {len(results.get('issues', []))} issues")
        
    except Exception as e:
        logger.error(f"Review job {job_id} failed: {e}", exc_info=True)
        manager.fail_job(job_id, str(e))


@app.route('/api/review/start', methods=['POST'])
@require_csrf
@handle_api_errors
def review_start():
    """
    Start an async document review job.
    
    v3.0.39: New endpoint for job-based review with real progress polling.
    
    Returns job_id immediately. Client polls /api/job/<job_id> for progress.
    When status is 'complete', result is available via /api/job/<job_id>?include_result=true
    or session contains review_results.
    
    Request body:
        options: Review options (which checkers to run)
    
    Returns:
        job_id: Unique job identifier for polling
    """
    if not JOB_MANAGER_AVAILABLE:
        raise ProcessingError("Job manager not available", stage='review_start')
    
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded. Please upload a file first.")
    
    filepath = Path(session_data['current_file'])
    if not filepath.exists():
        raise FileError("Document file not found. Please re-upload.")
    
    data = request.get_json() or {}
    options = data.get('options', {})
    
    original_filename = session_data.get('original_filename', filepath.name)
    
    # Create the job
    manager = get_job_manager()
    job_id = manager.create_job('review', metadata={
        'filename': original_filename,
        'session_id': g.session_id,
        'options': options
    })
    
    logger.info(f"Created review job {job_id} for {original_filename}")
    
    # Start worker thread
    worker = threading.Thread(
        target=_run_review_job,
        args=(job_id, g.session_id, filepath, original_filename, options),
        daemon=True,
        name=f"review-worker-{job_id}"
    )
    worker.start()
    
    return jsonify({
        'success': True,
        'job_id': job_id,
        'message': 'Review started',
        'poll_url': f'/api/job/{job_id}'
    })


@app.route('/api/review/result/<job_id>', methods=['GET'])
@handle_api_errors
def review_result(job_id):
    """
    Get the result of a completed review job.
    
    v3.0.39: Convenience endpoint for getting full review results.
    
    Args:
        job_id: Job identifier
        
    Returns:
        Full review results (same format as /api/review)
    """
    if not JOB_MANAGER_AVAILABLE:
        raise ProcessingError("Job manager not available", stage='review_result')
    
    manager = get_job_manager()
    job = manager.get_job(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'error': f'Job not found: {job_id}'
        }), 404
    
    if job.status != JobStatus.COMPLETE:
        return jsonify({
            'success': False,
            'error': f'Job not complete. Status: {job.status.value}',
            'job': job.to_dict()
        }), 400
    
    if not job.result:
        return jsonify({
            'success': False,
            'error': 'Job complete but no result available'
        }), 500
    
    # Format response same as /api/review
    results = job.result
    # v3.0.113: Extract document counts for Fix Assistant display
    doc_info = results.get('document_info', {})
    response_data = {
        'issues': results.get('issues', []),
        'issue_count': results.get('issue_count', 0),
        'score': results.get('score', 100),
        'grade': results.get('grade', 'A'),
        'by_severity': results.get('by_severity', {}),
        'by_category': results.get('by_category', {}),
        'readability': results.get('readability', {}),
        'document_info': doc_info,
        'roles': results.get('roles', {}),
        'full_text': results.get('full_text', ''),
        'statement_forge_summary': results.get('statement_forge_summary', {'available': False}),
        'scan_info': results.get('scan_info'),
        # v3.0.95: Hyperlink validation results for status panel (BUG-004 fix)
        'hyperlink_results': results.get('hyperlink_results'),
        # v3.0.113: Add document counts at top level for frontend display
        'word_count': results.get('word_count', 0),
        'paragraph_count': results.get('paragraph_count', 0),
        'table_count': results.get('table_count', 0),
        'heading_count': doc_info.get('heading_count', 0),
    }
    
    # v3.0.97b: Add Fix Assistant v2 enhancement data
    try:
        issues = results.get('issues', [])
        response_data['document_content'] = build_document_content(results)
        response_data['fix_groups'] = group_similar_fixes(issues)
        response_data['confidence_details'] = build_confidence_details(issues)
        doc_content = response_data['document_content']
        response_data['fix_statistics'] = compute_fix_statistics(
            issues,
            response_data['fix_groups'],
            response_data['confidence_details'],
            doc_content.get('page_count', 1)
        )
    except Exception as e:
        logger.warning(f"Fix Assistant v2 enhancement failed for job {job_id}: {e}")
        response_data['document_content'] = {'paragraphs': [], 'page_map': {}, 'headings': [], 'page_count': 1}
        response_data['fix_groups'] = []
        response_data['confidence_details'] = {}
        response_data['fix_statistics'] = {'total': 0, 'by_tier': {}, 'by_category': {}, 'by_page': {}}
    
    return jsonify({
        'success': True,
        'data': response_data
    })
@require_csrf
@handle_api_errors
def filter_issues():
    """Filter issues by criteria."""
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('review_results'):
        raise ValidationError("No review results available")
    
    data = request.get_json() or {}
    severities = set(data.get('severities', ['Critical', 'High', 'Medium', 'Low', 'Info']))
    categories = set(data.get('categories', []))
    search = data.get('search', '').lower().strip()
    
    all_issues = session_data['review_results'].get('issues', [])
    
    filtered = []
    for issue in all_issues:
        if issue.get('severity') not in severities:
            continue
        if categories and issue.get('category') not in categories:
            continue
        if search:
            searchable = ' '.join([
                str(issue.get('category', '')),
                str(issue.get('severity', '')),
                str(issue.get('message', '')),
                str(issue.get('flagged_text', '')),
                str(issue.get('suggestion', ''))
            ]).lower()
            if search not in searchable:
                continue
        filtered.append(issue)
    
    SessionManager.update(g.session_id, filtered_issues=filtered)
    
    return jsonify({
        'success': True,
        'data': {'issues': filtered, 'count': len(filtered)}
    })


@app.route('/api/select', methods=['POST'])
@require_csrf
@handle_api_errors
def select_issues():
    """Update issue selection using stable issue IDs."""
    session_data = SessionManager.get(g.session_id)
    if not session_data:
        raise ValidationError("No active session")
    
    data = request.get_json() or {}
    action = data.get('action', 'toggle')
    
    # Support both legacy indices and new issue_ids
    issue_ids = data.get('issue_ids', [])
    indices = data.get('indices', [])  # Legacy support
    
    selected = session_data.get('selected_issues', set())
    if isinstance(selected, list):
        selected = set(selected)
    
    filtered_issues = session_data.get('filtered_issues', [])
    
    # Build ID lookup for filtered issues
    id_to_idx = {iss.get('issue_id'): i for i, iss in enumerate(filtered_issues) if iss.get('issue_id')}
    idx_to_id = {i: iss.get('issue_id') for i, iss in enumerate(filtered_issues) if iss.get('issue_id')}
    
    # Convert legacy indices to issue_ids if needed
    if indices and not issue_ids:
        issue_ids = [idx_to_id.get(idx) for idx in indices if idx in idx_to_id]
    
    # Ensure selected is a set of issue_ids (migrate from indices if needed)
    if selected and all(isinstance(x, int) for x in selected):
        selected = {idx_to_id.get(idx) for idx in selected if idx in idx_to_id}
        selected.discard(None)
    
    if action == 'toggle':
        for issue_id in issue_ids:
            if issue_id and issue_id in id_to_idx:
                if issue_id in selected:
                    selected.discard(issue_id)
                else:
                    selected.add(issue_id)
    elif action == 'select_all':
        selected = set(id_to_idx.keys())
    elif action == 'select_none':
        selected = set()
    elif action == 'add':
        selected.update(iid for iid in issue_ids if iid and iid in id_to_idx)
    elif action == 'remove':
        selected -= set(issue_ids)
    
    SessionManager.update(g.session_id, selected_issues=selected)
    
    # Return both IDs and indices for backward compatibility
    selected_indices = [id_to_idx[iid] for iid in selected if iid in id_to_idx]
    
    return jsonify({
        'success': True,
        'selected': list(selected),  # issue_ids
        'selected_indices': sorted(selected_indices),  # legacy support
        'count': len(selected)
    })


@app.route('/api/export', methods=['POST'])
@require_csrf
@handle_api_errors
def export_document():
    """
    Export marked document.
    
    v2.9.4 #26: Added timeout protection to prevent server hangs.
    v3.0.96: Added selected_fixes support for Fix Assistant integration.
    v3.0.97: Added comment_only_issues for rejected fixes from Fix Assistant v2.
    """
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded")
    if not session_data.get('review_results'):
        raise ValidationError("No review results available")
    
    original_filename = session_data.get('original_filename')
    if not original_filename:
        raise ValidationError("Document filename not found in session. Please re-upload the document.")
    
    filepath = Path(session_data['current_file'])
    if not filepath.exists():
        raise FileError("Source document not found")
    
    # Only DOCX export is supported
    if not original_filename.lower().endswith('.docx'):
        raise ValidationError("Export only supported for DOCX files. PDF documents are read-only.")
    
    data = request.get_json() or {}
    mode = data.get('mode', 'all')
    reviewer_name = sanitize_filename(data.get('reviewer_name', 'TechWriter Review'))
    apply_fixes = data.get('apply_fixes', False)
    selected_fixes = data.get('selected_fixes', [])  # v3.0.96: From Fix Assistant
    comment_only_issues = data.get('comment_only_issues', [])  # v3.0.97: Rejected fixes as comments
    
    # Get issues based on mode
    if mode == 'selected':
        selected = session_data.get('selected_issues', set())
        if isinstance(selected, list):
            selected = set(selected)
        filtered = session_data.get('filtered_issues', [])
        # v3.0.105: Support both issue_id strings and legacy integer indices
        if selected and all(isinstance(x, str) for x in selected):
            # New format: selected contains issue_ids
            issues = [iss for iss in filtered if iss.get('issue_id') in selected]
        else:
            # Legacy format: selected contains indices
            issues = [filtered[i] for i in sorted(selected) if isinstance(i, int) and i < len(filtered)]
    elif mode == 'filtered':
        issues = session_data.get('filtered_issues', [])
    else:
        issues = session_data['review_results'].get('issues', [])
    
    # v3.0.96: If selected_fixes provided from Fix Assistant, use those
    # Convert them to the format expected by markup_engine
    if apply_fixes and selected_fixes:
        # Transform Fix Assistant format to markup_engine format
        fix_issues = []
        for fix in selected_fixes:
            fix_issues.append({
                'original_text': fix.get('original_text', ''),
                'replacement_text': fix.get('replacement_text', ''),
                'category': fix.get('category', 'Auto-Fix'),
                'message': fix.get('message', 'Automatic correction'),
                'severity': 'Info',
                'paragraph_index': fix.get('paragraph_index', 0)
            })
        logger.info(f"Applying {len(fix_issues)} selected fixes from Fix Assistant")
    else:
        fix_issues = issues if apply_fixes else []
    
    # v3.0.97: Build list of rejected fixes to add as comments
    issues_to_comment = []
    if comment_only_issues:
        for rejected in comment_only_issues:
            reviewer_note = rejected.get('reviewer_note', '')
            note_suffix = f" Note: {reviewer_note}" if reviewer_note else ''
            issues_to_comment.append({
                'paragraph_index': rejected.get('paragraph_index', 0),
                'message': f"TWR flagged: \"{rejected.get('original_text', '')}\" → \"{rejected.get('suggestion', '')}\" - Reviewer chose not to change.{note_suffix}",
                'severity': 'Info',
                'category': rejected.get('category', 'Review'),
                'flagged_text': rejected.get('original_text', '')
            })
        logger.info(f"Adding {len(issues_to_comment)} rejected fixes as comments")
    
    if not issues and not fix_issues and not issues_to_comment:
        raise ValidationError("No issues to export")
    
    output_name = f"reviewed_{original_filename}"
    output_path = config.temp_dir / f"{uuid.uuid4().hex[:8]}_{output_name}"
    
    # v2.9.4 #26: Calculate timeout based on issue count (more issues = more time)
    # Base: 30s, plus 0.5s per issue, max 300s (5 minutes)
    total_items = len(issues) + len(fix_issues) + len(issues_to_comment)
    timeout_secs = min(300, 30 + total_items * 0.5)
    
    with logger.log_operation("export_document", issue_count=total_items):
        from markup_engine import MarkupEngine
        engine = MarkupEngine(reviewer_name)
        
        # v2.9.4 #26: Wrap COM operations in timeout protection
        def do_export():
            if apply_fixes and fix_issues:
                # v3.0.97: Pass rejected fixes as additional comments
                return engine.apply_fixes_with_track_changes(
                    str(filepath),
                    str(output_path),
                    fix_issues,  # v3.0.96: Use selected fixes
                    reviewer_name=reviewer_name,
                    also_add_comments=True,
                    additional_comments=issues_to_comment  # v3.0.97: Rejected fixes
                )
            else:
                # Combine regular issues with rejected fix comments
                all_comments = issues + issues_to_comment
                return engine.add_review_comments(
                    str(filepath),
                    str(output_path),
                    all_comments
                )
        
        try:
            result = run_with_timeout(do_export, timeout_seconds=int(timeout_secs))
        except TimeoutError:
            logger.error(f"Export timed out after {timeout_secs}s for {total_items} issues")
            raise ProcessingError(
                f"Export operation timed out after {int(timeout_secs)} seconds. "
                "Try exporting fewer issues at a time.",
                stage='export'
            )
    
    if not result.get('success'):
        raise ProcessingError(
            result.get('error', 'Failed to create marked document'),
            stage='export'
        )
    
    return send_file(
        str(output_path),
        as_attachment=True,
        download_name=output_name,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )


@app.route('/api/export/csv', methods=['POST'])
@require_csrf
@handle_api_errors
def export_csv():
    """Export issues as CSV."""
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('review_results'):
        raise ValidationError("No review results available")
    
    data = request.get_json() or {}
    mode = data.get('mode', 'all')
    
    if mode == 'selected':
        selected = session_data.get('selected_issues', set())
        if isinstance(selected, list):
            selected = set(selected)
        filtered = session_data.get('filtered_issues', [])
        issues = [filtered[i] for i in sorted(selected) if i < len(filtered)]
    elif mode == 'filtered':
        issues = session_data.get('filtered_issues', [])
    else:
        issues = session_data['review_results'].get('issues', [])
    
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Severity', 'Category', 'Message', 'Flagged Text', 'Suggestion', 'Paragraph'])
    
    for issue in issues:
        writer.writerow([
            issue.get('severity', ''),
            issue.get('category', ''),
            issue.get('message', ''),
            issue.get('flagged_text', issue.get('context', '')),
            issue.get('suggestion', ''),
            issue.get('paragraph_index', 0) + 1
        ])
    
    output.seek(0)
    original_name = session_data.get('original_filename') or 'document'
    csv_name = f"issues_{Path(original_name).stem}.csv"
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        as_attachment=True,
        download_name=csv_name,
        mimetype='text/csv'
    )


@app.route('/api/export/xlsx', methods=['POST'])
@require_csrf
@handle_api_errors
def export_xlsx():
    """Export issues as XLSX with enhanced features.
    
    v3.0.33 Chunk D: Enhanced XLSX export with:
    - Action Item column for reviewer notes
    - Timestamped filename
    - Document metadata header
    - Severity filtering support
    
    Request body (JSON):
        mode: 'all' | 'selected' | 'filtered' (default: 'all')
        severities: list of severities to include (optional, e.g., ['Critical', 'High'])
    
    Returns:
        XLSX file download with timestamp in filename
    """
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('review_results'):
        raise ValidationError("No review results available")
    
    data = request.get_json() or {}
    mode = data.get('mode', 'all')
    severities = data.get('severities', None)  # v3.0.33 Chunk D: Optional severity filter
    
    # v3.0.35: Normalize and validate severity values (case-insensitive)
    if severities:
        VALID_SEVERITIES = {'Critical', 'High', 'Medium', 'Low', 'Info'}
        normalized = []
        invalid = []
        
        for sev in severities:
            # Case-insensitive matching
            matched = next(
                (v for v in VALID_SEVERITIES if v.lower() == sev.lower()),
                None
            )
            if matched:
                normalized.append(matched)
            else:
                invalid.append(sev)
        
        # v3.0.35: Enterprise mode - reject unknown severities
        if invalid:
            raise ValidationError(
                f"Invalid severity filter(s): {', '.join(invalid)}. "
                f"Valid values: {', '.join(sorted(VALID_SEVERITIES))}"
            )
        
        severities = normalized if normalized else None
    
    # v3.0.35 Fix: Accept issues directly from request body (preferred)
    # This ensures selected/filtered exports work even without server-side sync
    issues = None
    
    # Priority 1: Use issues from request body if provided
    if data.get('issues'):
        issues = data['issues']
    elif data.get('results', {}).get('issues'):
        issues = data['results']['issues']
    
    # Priority 2: Fall back to session-based retrieval
    if not issues:
        if mode == 'selected':
            # v3.0.35 Fix: Use issue_id matching instead of index-based
            # v3.0.36: Fixed O(n²) index lookup - now O(n)
            selected = session_data.get('selected_issues', set())
            if isinstance(selected, list):
                selected = set(selected)
            # Get base issues to filter from
            base_issues = (session_data.get('filtered_issues', []) or 
                          session_data['review_results'].get('issues', []))
            # Filter by issue_id or index - O(n) using enumerate
            issues = []
            for idx, iss in enumerate(base_issues):
                issue_id = iss.get('issue_id')
                if (issue_id and issue_id in selected) or \
                   str(idx) in selected or \
                   idx in selected:
                    issues.append(iss)
        elif mode == 'filtered':
            issues = (session_data.get('filtered_issues', []) or 
                     session_data['review_results'].get('issues', []))
        else:
            issues = session_data['review_results'].get('issues', [])
    
    if not issues:
        raise ValidationError("No issues to export")
    
    # Prepare results for export - use provided results or session results
    review_results = data.get('results') or session_data['review_results']
    # Ensure issues in results match what we're exporting
    review_results = {**review_results, 'issues': issues}
    
    # v3.0.33 Chunk D: Prepare document metadata
    original_name = session_data.get('original_filename') or 'document'
    document_metadata = {
        'filename': original_name,
        'scan_date': session_data.get('scan_timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
        'score': review_results.get('score', 100)
    }
    
    # Create export
    from export_module import export_xlsx_enhanced
    filename, content = export_xlsx_enhanced(
        results=review_results,
        base_filename=f"review_{Path(original_name).stem}",
        severities=severities,
        document_metadata=document_metadata
    )
    
    return send_file(
        io.BytesIO(content),
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


@app.route('/api/config', methods=['GET', 'POST'])
@handle_api_errors
def api_config():
    """Get or update user configuration.
    
    Response envelope standardized to { success, data } for consistency.
    """
    config_file = config.base_dir / 'config.json'
    
    if request.method == 'GET':
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
            except (IOError, json.JSONDecodeError) as e:
                logger.exception(f"Failed to read config: {e}")
                user_config = _get_default_user_config()
        else:
            user_config = _get_default_user_config()
        return jsonify({'success': True, 'data': user_config})
    else:
        # POST - update config (requires CSRF and admin)
        if config.csrf_enabled:
            token = request.headers.get('X-CSRF-Token')
            if not token or not verify_csrf_token(token, session.get('csrf_token', '')):
                return jsonify({
                    'success': False,
                    'error': {'code': 'CSRF_ERROR', 'message': 'Invalid CSRF token'}
                }), 403
        
        # Admin check for config changes
        if config.auth_enabled:
            groups = getattr(g, 'authenticated_groups', [])
            if 'admin' not in groups and 'administrators' not in groups:
                if config.auth_provider != 'api_key':
                    return jsonify({
                        'success': False,
                        'error': {'code': 'FORBIDDEN', 'message': 'Admin access required'}
                    }), 403
        
        data = request.get_json() or {}
        current = _get_default_user_config()
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    current = json.load(f)
            except (IOError, json.JSONDecodeError):
                pass
        current.update(data)

        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(current, f, indent=2)
        except IOError as e:
            logger.exception(f"Failed to write config: {e}")
            raise ProcessingError("Failed to save configuration")
        
        return jsonify({'success': True})


@app.route('/api/config/acronyms', methods=['GET', 'POST'])
@handle_api_errors
def api_config_acronyms():
    """Get or update acronym checker settings.
    
    v3.0.33: Added for strict mode control and transparency.
    
    GET: Returns current acronym settings
    POST: Updates ignore_common_acronyms setting
    """
    config_file = config.base_dir / 'config.json'
    
    if request.method == 'GET':
        current_settings = {
            'ignore_common_acronyms': False,  # Default to strict mode
            'strict_mode': True
        }
        
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    acro_settings = user_config.get('acronym_settings', {})
                    ignore_common = acro_settings.get('ignore_common_acronyms', False)
                    current_settings = {
                        'ignore_common_acronyms': ignore_common,
                        'strict_mode': not ignore_common
                    }
            except (IOError, json.JSONDecodeError) as e:
                logger.warning(f"Failed to read acronym config: {e}")

        return jsonify({'success': True, 'data': current_settings})

    else:  # POST
        data = request.get_json() or {}

        # Load current config
        current = {}
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    current = json.load(f)
            except (IOError, json.JSONDecodeError):
                pass

        # Update acronym settings
        if 'acronym_settings' not in current:
            current['acronym_settings'] = {}

        if 'ignore_common_acronyms' in data:
            current['acronym_settings']['ignore_common_acronyms'] = bool(data['ignore_common_acronyms'])

        # Save updated config
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(current, f, indent=2)
        except IOError as e:
            logger.exception(f"Failed to write acronym config: {e}")
            raise ProcessingError("Failed to save acronym configuration")
        
        ignore_common = current['acronym_settings'].get('ignore_common_acronyms', False)
        return jsonify({
            'success': True,
            'data': {
                'ignore_common_acronyms': ignore_common,
                'strict_mode': not ignore_common
            }
        })


@app.route('/api/config/hyperlinks', methods=['GET', 'POST'])
@handle_api_errors
def api_config_hyperlinks():
    """Get or update hyperlink validator settings.
    
    v3.0.37: Added for PS1 validator mode control.
    
    GET: Returns current hyperlink settings including validator mode
    POST: Updates validation_mode setting
    
    Modes:
        - 'offline': Format validation only (default, safest)
        - 'validator': Network validation using Python requests
        - 'ps1_validator': PowerShell script validation (Windows)
    """
    config_file = config.base_dir / 'config.json'
    
    if request.method == 'GET':
        current_settings = {
            'validation_mode': 'offline',
            'ps1_available': False,
            'modes': ['offline', 'validator', 'ps1_validator']
        }
        
        # Check if PS1 validator is available
        if HYPERLINK_HEALTH_AVAILABLE:
            from hyperlink_health import HyperlinkHealthValidator
            validator = HyperlinkHealthValidator(mode='offline')
            ps1_path = validator._find_ps1_validator()
            current_settings['ps1_available'] = ps1_path is not None
            if ps1_path:
                current_settings['ps1_path'] = ps1_path
        
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    link_settings = user_config.get('hyperlink_settings', {})
                    current_settings['validation_mode'] = link_settings.get('validation_mode', 'offline')
            except (IOError, json.JSONDecodeError) as e:
                logger.warning(f"Failed to read hyperlink config: {e}")

        return jsonify({'success': True, 'data': current_settings})

    else:  # POST
        data = request.get_json() or {}

        # Load current config
        current = {}
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    current = json.load(f)
            except (IOError, json.JSONDecodeError):
                pass

        # Update hyperlink settings
        if 'hyperlink_settings' not in current:
            current['hyperlink_settings'] = {}

        if 'validation_mode' in data:
            mode = data['validation_mode']
            if mode in ('offline', 'validator', 'ps1_validator'):
                current['hyperlink_settings']['validation_mode'] = mode
            else:
                raise ValidationError(f"Invalid validation mode: {mode}. Use 'offline', 'validator', or 'ps1_validator'")

        # Save updated config
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(current, f, indent=2)
        except IOError as e:
            logger.exception(f"Failed to write hyperlink config: {e}")
            raise ProcessingError("Failed to save hyperlink configuration")
        
        return jsonify({
            'success': True,
            'data': {
                'validation_mode': current['hyperlink_settings'].get('validation_mode', 'offline')
            }
        })


# =============================================================================
# NLP API ENDPOINTS (v3.1.0)
# =============================================================================

@app.route('/api/nlp/status', methods=['GET'])
@handle_api_errors
def api_nlp_status():
    """
    Get status of NLP-enhanced checkers.

    Returns availability and version info for each NLP module.
    """
    try:
        engine = TechWriterReviewEngine()
        status = engine.get_nlp_status()
        return jsonify({'success': True, 'data': status})
    except Exception as e:
        logger.exception(f"Error getting NLP status: {e}")
        return jsonify({
            'success': False,
            'error': {'code': 'NLP_ERROR', 'message': str(e)}
        }), 500


@app.route('/api/nlp/checkers', methods=['GET'])
@handle_api_errors
def api_nlp_checkers():
    """
    Get list of available NLP checkers.

    Returns list of checker metadata including name, version, and enabled state.
    """
    try:
        engine = TechWriterReviewEngine()
        checkers = engine.get_nlp_checkers()
        return jsonify({'success': True, 'data': checkers})
    except Exception as e:
        logger.exception(f"Error getting NLP checkers: {e}")
        return jsonify({
            'success': False,
            'error': {'code': 'NLP_ERROR', 'message': str(e)}
        }), 500


@app.route('/api/nlp/config', methods=['GET', 'POST'])
@handle_api_errors
def api_nlp_config():
    """
    Get or update NLP configuration.

    GET: Returns current NLP settings
    POST: Updates NLP settings (requires CSRF token)
    """
    config_file = config.base_dir / 'config.json'

    if request.method == 'GET':
        nlp_settings = {
            'enabled': True,
            'checkers': {}
        }

        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    nlp_settings = user_config.get('nlp_settings', nlp_settings)
            except (IOError, json.JSONDecodeError) as e:
                logger.warning(f"Failed to read NLP config: {e}")

        return jsonify({'success': True, 'data': nlp_settings})

    else:
        # POST - update NLP config (requires CSRF)
        if config.csrf_enabled:
            token = request.headers.get('X-CSRF-Token')
            if not token or not verify_csrf_token(token, session.get('csrf_token', '')):
                return jsonify({
                    'success': False,
                    'error': {'code': 'CSRF_ERROR', 'message': 'Invalid CSRF token'}
                }), 403

        data = request.get_json() or {}

        # Load existing config
        current = {}
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    current = json.load(f)
            except (IOError, json.JSONDecodeError):
                pass

        # Update NLP settings
        current['nlp_settings'] = data

        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(current, f, indent=2)
        except IOError as e:
            logger.exception(f"Failed to write NLP config: {e}")
            raise ProcessingError("Failed to save NLP configuration")

        return jsonify({'success': True})


@app.route('/api/version', methods=['GET'])
@handle_api_errors
def version():
    """Get version information."""
    return jsonify({
        'app_name': APP_NAME,
        'app_version': VERSION,
        'core_version': MODULE_VERSION,
        'api_version': '2.0'
    })


@app.route('/api/health', methods=['GET'])
@handle_api_errors
def health():
    """
    Liveness check with diagnostic info (v2.9.4.2 enhanced).
    
    Returns basic health + error counts for quick status assessment.
    """
    health_data = {
        'status': 'healthy',
        'version': VERSION,
        'uptime_seconds': round(time.time() - _APP_START_TIME, 1),
        'timestamp': datetime.now(timezone.utc).isoformat() + 'Z'
    }
    
    # Add diagnostic info if available
    if DIAGNOSTICS_AVAILABLE:
        try:
            collector = DiagnosticCollector.get_instance()
            ai_pkg = get_ai_troubleshoot()
            
            health_data['diagnostics'] = {
                'error_count': len(collector.errors),
                'warning_count': len(collector.warnings),
                'request_count': len(collector.request_log),
                'console_error_count': len(ai_pkg.console_errors) if ai_pkg else 0,
                'user_action_count': len(ai_pkg.user_actions) if ai_pkg else 0,
                'session_id': collector.session_id
            }
            
            # Add last error timestamp if any errors
            if collector.errors:
                last_error = collector.errors[-1]
                health_data['diagnostics']['last_error_at'] = (
                    last_error.timestamp if hasattr(last_error, 'timestamp') 
                    else last_error.get('timestamp', 'unknown')
                )
        except Exception as e:
            health_data['diagnostics'] = {'error': str(e)}
    
    return jsonify(health_data)


@app.route('/api/ready', methods=['GET'])
@handle_api_errors
def ready():
    """Readiness check - is the application ready to serve requests?"""
    checks = {
        'temp_dir': config.temp_dir.exists(),
        'index_html': (config.base_dir / 'templates' / 'index.html').exists(),
        'core_module': True,
        'diagnostics': DIAGNOSTICS_AVAILABLE
    }
    
    # Check core module
    try:
        from core import TechWriterReviewEngine
        checks['core_module'] = True
    except ImportError:
        checks['core_module'] = False
    
    all_ready = all([checks['temp_dir'], checks['core_module']])
    
    return jsonify({
        'ready': all_ready,
        'checks': checks,
        'version': VERSION,
        'timestamp': datetime.now(timezone.utc).isoformat() + 'Z'
    }), 200 if all_ready else 503


@app.route('/api/docling/status', methods=['GET'])
@handle_api_errors
def docling_status():
    """
    Get Docling document extraction status (v3.0.91).
    
    Returns information about:
    - Whether Docling is available
    - Current extraction backend
    - Offline mode configuration
    - Model status
    """
    status = {
        'available': False,
        'backend': 'legacy',
        'version': None,
        'offline_mode': True,
        'offline_ready': False,
        'image_processing': False,  # Always disabled for memory optimization
        'models_path': None,
        'pytorch_available': False,
        'error': None
    }
    
    try:
        # Check if docling_extractor module is available
        from docling_extractor import DoclingExtractor, DoclingManager
        
        # Get detailed status from DoclingManager
        manager_status = DoclingManager.check_installation()
        
        status['pytorch_available'] = manager_status.get('pytorch_available', False)
        status['available'] = manager_status.get('installed', False)
        status['version'] = manager_status.get('version')
        status['models_path'] = manager_status.get('models_path')
        status['offline_ready'] = manager_status.get('offline_ready', False)
        
        # Create extractor to check actual backend
        if status['available']:
            try:
                extractor = DoclingExtractor(fallback_to_legacy=True)
                status['backend'] = extractor.backend_name
                status['available'] = extractor.is_available
                extractor_status = extractor.get_status()
                status['table_mode'] = extractor_status.get('table_mode', 'accurate')
                status['ocr_enabled'] = extractor_status.get('ocr_enabled', False)
            except Exception as e:
                status['error'] = f"Extractor init error: {str(e)}"
                status['backend'] = 'legacy'
        
    except ImportError as e:
        status['error'] = f"docling_extractor not available: {str(e)}"
        status['backend'] = 'legacy'
    except Exception as e:
        status['error'] = str(e)
    
    return jsonify(status)


@app.route('/api/extraction/capabilities', methods=['GET'])
@handle_api_errors
def extraction_capabilities():
    """
    Get comprehensive document extraction capabilities (v3.0.91+).
    
    Reports all available extraction methods:
    - PDF extraction (Docling, Camelot, Tabula, pdfplumber)
    - OCR support (Tesseract)
    - NLP enhancements (spaCy, sklearn)
    - Table extraction accuracy estimates
    """
    caps = {
        'version': '3.0.91',
        'pdf': {
            'docling': False,
            'camelot': False,
            'tabula': False,
            'pdfplumber': False,
            'pymupdf': False,
        },
        'ocr': {
            'tesseract': False,
            'pdf2image': False,
        },
        'nlp': {
            'spacy': False,
            'sklearn': False,
            'nltk': False,
            'textstat': False,
        },
        'estimated_accuracy': {
            'table_extraction': 0.70,
            'role_detection': 0.75,
            'text_extraction': 0.80,
        },
        'recommended_setup': [],
    }
    
    # Check PDF libraries
    try:
        from docling_extractor import DoclingManager
        if DoclingManager.check_installation().get('offline_ready'):
            caps['pdf']['docling'] = True
            caps['estimated_accuracy']['table_extraction'] = 0.95
    except Exception:
        pass  # Module not installed - expected in many environments
    
    try:
        import camelot
        caps['pdf']['camelot'] = True
        if not caps['pdf']['docling']:
            caps['estimated_accuracy']['table_extraction'] = max(caps['estimated_accuracy']['table_extraction'], 0.88)
    except Exception:
        pass  # Module not installed
    
    try:
        import tabula
        caps['pdf']['tabula'] = True
        if not caps['pdf']['docling'] and not caps['pdf']['camelot']:
            caps['estimated_accuracy']['table_extraction'] = max(caps['estimated_accuracy']['table_extraction'], 0.80)
    except Exception:
        pass  # Module not installed
    
    try:
        import pdfplumber
        caps['pdf']['pdfplumber'] = True
    except Exception:
        pass  # Module not installed
    
    try:
        import fitz
        caps['pdf']['pymupdf'] = True
        caps['estimated_accuracy']['text_extraction'] = 0.90
    except Exception:
        pass  # Module not installed
    
    # Check OCR
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        caps['ocr']['tesseract'] = True
    except Exception:
        pass  # Tesseract not installed
    
    try:
        from pdf2image import convert_from_path
        caps['ocr']['pdf2image'] = True
    except Exception:
        pass  # Module not installed
    
    # Check NLP
    try:
        import spacy
        spacy.load('en_core_web_sm')
        caps['nlp']['spacy'] = True
        caps['estimated_accuracy']['role_detection'] = min(caps['estimated_accuracy']['role_detection'] + 0.10, 0.95)
    except Exception:
        pass  # spaCy or model not installed
    
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        caps['nlp']['sklearn'] = True
        caps['estimated_accuracy']['role_detection'] = min(caps['estimated_accuracy']['role_detection'] + 0.05, 0.95)
    except Exception:
        pass  # Module not installed
    
    try:
        import nltk
        caps['nlp']['nltk'] = True
    except Exception:
        pass  # Module not installed
    
    try:
        import textstat
        caps['nlp']['textstat'] = True
    except Exception:
        pass  # Module not installed
    
    # Generate recommendations
    if not caps['pdf']['docling'] and not caps['pdf']['camelot']:
        caps['recommended_setup'].append('Install Camelot for better table extraction: pip install camelot-py')
    if not caps['ocr']['tesseract']:
        caps['recommended_setup'].append('Install Tesseract for scanned PDF support')
    if not caps['nlp']['spacy']:
        caps['recommended_setup'].append('Install spaCy for better role detection: pip install spacy && python -m spacy download en_core_web_sm')
    
    return jsonify(caps)


@app.route('/api/health/assets', methods=['GET'])
@handle_api_errors
def health_assets():
    """
    Verify critical frontend assets exist and are accessible.
    
    Used by installer smoke test to verify complete installation.
    Returns 200 if all critical assets exist, 503 otherwise.
    
    v3.0.30: Added vendor JS files for offline-first UI
    """
    # Critical assets that must exist for UI to function
    critical_assets = [
        # HTML template
        ('templates/index.html', 'index_html'),
        
        # Main CSS
        ('static/css/style.css', 'style_css'),
        
        # Core JS
        ('static/js/app.js', 'app_js'),
        ('static/js/twr-loader.js', 'twr_loader_js'),
        
        # Modular JS components
        ('static/js/utils/dom.js', 'utils_dom_js'),
        ('static/js/ui/state.js', 'ui_state_js'),
        ('static/js/ui/renderers.js', 'ui_renderers_js'),
        ('static/js/ui/events.js', 'ui_events_js'),
        ('static/js/ui/modals.js', 'ui_modals_js'),
        ('static/js/api/client.js', 'api_client_js'),
        ('static/js/features/roles.js', 'features_roles_js'),
        ('static/js/features/triage.js', 'features_triage_js'),
        ('static/js/features/families.js', 'features_families_js'),
        
        # v3.0.30: Vendor JS (offline-first)
        ('static/js/vendor/lucide.min.js', 'vendor_lucide_js'),
        ('static/js/vendor/chart.min.js', 'vendor_chart_js'),
        ('static/js/vendor/d3.v7.min.js', 'vendor_d3_js'),
    ]
    
    checks = {}
    missing = []
    
    for asset_path, check_name in critical_assets:
        full_path = config.base_dir / asset_path
        exists = full_path.exists()
        checks[check_name] = exists
        if not exists:
            missing.append(asset_path)
    
    all_present = len(missing) == 0
    
    response = {
        'status': 'ok' if all_present else 'missing_assets',
        'success': all_present,
        'checks': checks,
        'version': VERSION,
        'timestamp': datetime.now(timezone.utc).isoformat() + 'Z'
    }
    
    if missing:
        response['missing'] = missing
    
    return jsonify(response), 200 if all_present else 503


# =============================================================================
# HYPERLINK HEALTH API (v3.0.31 Thread 5)
# =============================================================================

@app.route('/api/hyperlink-health/status', methods=['GET'])
@handle_api_errors
def hyperlink_health_status():
    """
    Get hyperlink health module status.
    
    Returns availability and configuration info.
    
    v3.0.37: Added ps1_validator mode and availability check
    """
    ps1_available = False
    ps1_path = None
    configured_mode = 'offline'
    
    if HYPERLINK_HEALTH_AVAILABLE:
        # Check if PS1 validator is available
        from hyperlink_health import HyperlinkHealthValidator
        validator = HyperlinkHealthValidator(mode='offline')
        ps1_path = validator._find_ps1_validator()
        ps1_available = ps1_path is not None
        
        # Get configured mode
        config_file = config.base_dir / 'config.json'
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    configured_mode = user_config.get('hyperlink_settings', {}).get('validation_mode', 'offline')
            except (IOError, json.JSONDecodeError):
                pass
    
    return jsonify({
        'available': HYPERLINK_HEALTH_AVAILABLE,
        'version': '1.0.0' if HYPERLINK_HEALTH_AVAILABLE else None,
        'modes': ['offline', 'validator', 'ps1_validator'] if HYPERLINK_HEALTH_AVAILABLE else [],
        'default_mode': 'offline',
        'configured_mode': configured_mode,
        'ps1_validator': {
            'available': ps1_available,
            'path': ps1_path
        },
        'timestamp': datetime.now(timezone.utc).isoformat() + 'Z'
    })


@app.route('/api/hyperlink-health/validate', methods=['POST'])
@require_csrf
@handle_api_errors
def validate_hyperlinks():
    """
    Validate hyperlinks in the current document.
    
    Request body (optional):
        mode: 'offline' (default), 'validator', or 'ps1_validator'
              If not specified, reads from config.json hyperlink_settings.validation_mode
        
    Returns:
        Full hyperlink health report with all link statuses
        
    v3.0.33 Chunk B: Added ps1_validator mode for PowerShell-based validation
    v3.0.37: Mode now reads from config if not specified in request
    """
    if not HYPERLINK_HEALTH_AVAILABLE:
        raise ProcessingError(
            "Hyperlink Health module not available",
            stage='hyperlink_validation'
        )
    
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded")
    
    filepath = Path(session_data['current_file'])
    if not filepath.exists():
        raise FileError("Document file not found")
    
    # Get mode from request, fall back to config
    data = request.get_json(silent=True) or {}
    mode = data.get('mode')
    
    # v3.0.37: Read from config if not specified in request
    if not mode:
        config_file = config.base_dir / 'config.json'
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    mode = user_config.get('hyperlink_settings', {}).get('validation_mode', 'offline')
            except (IOError, json.JSONDecodeError):
                mode = 'offline'
        else:
            mode = 'offline'
    
    # Validate mode
    if mode not in ('offline', 'validator', 'ps1_validator'):
        mode = 'offline'
    
    logger.info(f"Hyperlink validation starting with mode: {mode}")
    
    try:
        # Validate document links
        report = validate_document_links(
            filepath=str(filepath),
            mode=mode,
            base_path=str(filepath.parent)
        )
        
        # v3.0.37 Batch G: Store report in session for comment insertion
        SessionManager.update(g.session_id, hyperlink_health_report=report)
        
        # v3.0.37: Include mode used in response
        return jsonify({
            'success': True,
            'mode_used': mode,
            'report': report
        })
    
    except Exception as e:
        logger.error(f"Hyperlink validation failed: {e}")
        raise ProcessingError(
            f"Hyperlink validation failed: {str(e)}",
            stage='hyperlink_validation'
        )


@app.route('/api/hyperlink-health/export/<format>', methods=['GET'])
@handle_api_errors
def export_hyperlink_report(format):
    """
    Export hyperlink health report in specified format.
    
    Formats: json, html, csv
    
    Must first run /api/hyperlink-health/validate to generate report.
    """
    if not HYPERLINK_HEALTH_AVAILABLE:
        raise ProcessingError(
            "Hyperlink Health module not available",
            stage='hyperlink_export'
        )
    
    if format not in ('json', 'html', 'csv'):
        raise ValidationError(f"Unsupported format: {format}. Use json, html, or csv.")
    
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded")
    
    filepath = Path(session_data['current_file'])
    
    # Re-run validation to get fresh report
    report_data = validate_document_links(
        filepath=str(filepath),
        mode='offline',
        base_path=str(filepath.parent)
    )
    
    # Create temporary export file
    export_filename = f"hyperlink_health_{filepath.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
    export_path = config.temp_dir / export_filename
    
    try:
        # Create report object from dict
        from hyperlink_health import HyperlinkHealthReport, LinkStatusRecord
        
        report = HyperlinkHealthReport(
            document_path=report_data.get('document_path', ''),
            document_name=report_data.get('document_name', ''),
            generated_at=report_data.get('generated_at', ''),
            validation_mode=report_data.get('validation_mode', 'offline'),
        )
        
        # Convert link dicts back to records
        for link_dict in report_data.get('links', []):
            record = LinkStatusRecord.from_dict(link_dict)
            report.links.append(record)
        
        report.calculate_summary()
        
        # Export based on format
        if format == 'json':
            export_report_json(report, str(export_path))
            mimetype = 'application/json'
        elif format == 'html':
            export_report_html(report, str(export_path))
            mimetype = 'text/html'
        elif format == 'csv':
            export_report_csv(report, str(export_path))
            mimetype = 'text/csv'
        
        # Send file
        return send_file(
            export_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=export_filename
        )
    
    except Exception as e:
        logger.error(f"Hyperlink export failed: {e}")
        raise ProcessingError(
            f"Export failed: {str(e)}",
            stage='hyperlink_export'
        )


@app.route('/api/hyperlink-health/comments', methods=['POST'])
@require_csrf
@handle_api_errors
def insert_hyperlink_comments():
    """
    Insert comments at broken hyperlink locations in the document.
    
    v3.0.37 Batch G: Hyperlink comment insertion feature.
    
    Request body:
        mode: 'insert' (DOCX comments) or 'pack' (text file for manual use)
        author: Comment author name (default: 'TechWriterReview')
        
    Returns:
        success: True if operation completed
        output_path: Path to generated file
        broken_count: Number of broken links found
        comments_inserted: Number of comments inserted (insert mode only)
        
    Note: Must run /api/hyperlink-health/validate first to generate report.
    """
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded")
    
    filepath = Path(session_data['current_file'])
    if not filepath.exists():
        raise FileError("Document file not found")
    
    # Only works with DOCX files
    if filepath.suffix.lower() != '.docx':
        raise ValidationError("Comment insertion only supported for DOCX files")
    
    # Check for hyperlink health report in session
    health_report = session_data.get('hyperlink_health_report')
    if not health_report:
        raise ValidationError(
            "No hyperlink health report found. Run /api/hyperlink-health/validate first."
        )
    
    # Get options from request
    data = request.get_json() or {}
    mode = data.get('mode', 'insert')
    author = data.get('author', 'TechWriterReview')
    
    if mode not in ('insert', 'pack'):
        raise ValidationError("mode must be 'insert' or 'pack'")
    
    try:
        from comment_inserter import process_hyperlink_health_results
        
        # Get temp directory for output
        temp_dir = Path(tempfile.gettempdir()) / 'twr_exports'
        temp_dir.mkdir(exist_ok=True)
        
        result = process_hyperlink_health_results(
            docx_path=str(filepath),
            health_report=health_report,
            mode=mode,
            author=author,
            output_dir=str(temp_dir)
        )
        
        if result.get('success'):
            # Store output path in session for download
            if result.get('output_path'):
                session_data['comment_export_path'] = result['output_path']
                SessionManager.update(g.session_id, comment_export_path=result['output_path'])
            
            return jsonify({
                'success': True,
                'mode': result['mode'],
                'message': result['message'],
                'broken_count': result['broken_count'],
                'comments_inserted': result.get('comments_inserted', 0),
                'output_available': bool(result.get('output_path'))
            })
        else:
            raise ProcessingError(result.get('error', 'Comment insertion failed'))
    
    except ImportError:
        raise ProcessingError("Comment inserter module not available")
    except Exception as e:
        logger.exception(f"Comment insertion failed: {e}")
        raise ProcessingError(f"Comment insertion failed: {str(e)}")


@app.route('/api/hyperlink-health/comments/download', methods=['GET'])
@handle_api_errors
def download_hyperlink_comments():
    """
    Download the generated comment file (DOCX or text pack).
    
    v3.0.37 Batch G: Download endpoint for comment files.
    
    Must run /api/hyperlink-health/comments first.
    """
    session_data = SessionManager.get(g.session_id)
    if not session_data:
        raise ValidationError("No active session")
    
    export_path = session_data.get('comment_export_path')
    if not export_path or not Path(export_path).exists():
        raise ValidationError(
            "No comment file available. Run /api/hyperlink-health/comments first."
        )
    
    export_path = Path(export_path)
    
    # Determine MIME type
    if export_path.suffix.lower() == '.docx':
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else:
        mimetype = 'text/plain'
    
    return send_file(
        export_path,
        mimetype=mimetype,
        as_attachment=True,
        download_name=export_path.name
    )


# =============================================================================
# JOB MANAGEMENT API (v3.0.32 Thread 8)
# =============================================================================

@app.route('/api/job/status', methods=['GET'])
@handle_api_errors
def job_manager_status():
    """
    Get job manager status and capabilities.
    
    Returns:
        available: Whether job manager is available
        version: Module version
        active_jobs: Count of running jobs
    """
    if not JOB_MANAGER_AVAILABLE:
        return jsonify({
            'available': False,
            'version': None,
            'active_jobs': 0
        })
    
    manager = get_job_manager()
    running = manager.list_jobs(status=JobStatus.RUNNING)
    
    return jsonify({
        'available': True,
        'version': '1.0.0',
        'active_jobs': len(running),
        'timestamp': datetime.now(timezone.utc).isoformat() + 'Z'
    })


@app.route('/api/job/<job_id>', methods=['GET'])
@handle_api_errors
def get_job(job_id):
    """
    Get status and progress of a specific job.
    
    Args:
        job_id: Job identifier
        
    Query params:
        include_result: If 'true', include full result data (for completed jobs)
        
    Returns:
        Job status, progress, elapsed time, ETA
    """
    if not JOB_MANAGER_AVAILABLE:
        raise ProcessingError("Job manager not available", stage='job_status')
    
    include_result = request.args.get('include_result', 'false').lower() == 'true'
    
    manager = get_job_manager()
    job = manager.get_job(job_id)
    
    if not job:
        return jsonify({
            'success': False,
            'error': f'Job not found: {job_id}'
        }), 404
    
    return jsonify({
        'success': True,
        'job': job.to_dict(include_result=include_result)
    })


@app.route('/api/job/<job_id>/cancel', methods=['POST'])
@require_csrf
@handle_api_errors
def cancel_job(job_id):
    """
    Cancel a running job.
    
    Args:
        job_id: Job identifier
        
    Returns:
        Success status
    """
    if not JOB_MANAGER_AVAILABLE:
        raise ProcessingError("Job manager not available", stage='job_cancel')
    
    manager = get_job_manager()
    success = manager.cancel_job(job_id)
    
    if not success:
        job = manager.get_job(job_id)
        if not job:
            return jsonify({
                'success': False,
                'error': f'Job not found: {job_id}'
            }), 404
        return jsonify({
            'success': False,
            'error': f'Cannot cancel job in state: {job.status.value}'
        }), 400
    
    return jsonify({
        'success': True,
        'message': f'Job {job_id} cancelled'
    })


@app.route('/api/job/list', methods=['GET'])
@handle_api_errors
def list_jobs():
    """
    List jobs with optional filtering.
    
    Query params:
        status: Filter by status (pending, running, complete, failed, cancelled)
        type: Filter by job type (review, export, etc.)
        limit: Maximum results (default 20)
        
    Returns:
        List of jobs
    """
    if not JOB_MANAGER_AVAILABLE:
        raise ProcessingError("Job manager not available", stage='job_list')
    
    status_filter = request.args.get('status')
    job_type = request.args.get('type')
    limit = min(int(request.args.get('limit', 20)), 100)
    
    status = None
    if status_filter:
        try:
            status = JobStatus(status_filter)
        except ValueError:
            pass
    
    manager = get_job_manager()
    jobs = manager.list_jobs(status=status, job_type=job_type, limit=limit)
    
    return jsonify({
        'success': True,
        'jobs': jobs,
        'count': len(jobs)
    })


# =============================================================================
# ROLE EXTRACTION API
# =============================================================================

@app.route('/api/roles/extract', methods=['POST'])
@require_csrf
@handle_api_errors
def extract_roles():
    """Extract roles from the current document."""
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('current_file'):
        raise ValidationError("No document loaded")
    
    filepath = Path(session_data['current_file'])
    if not filepath.exists():
        raise FileError("Document file not found")
    
    try:
        from role_integration import RoleIntegration
        integration = RoleIntegration()
        
        if not integration.is_available():
            raise ProcessingError(
                "Role extraction module not available",
                stage='role_extraction'
            )
        
        # Get document text - v3.0.101 ISSUE-008: Use centralized helper
        extractor, _, _ = get_document_extractor(filepath)
        
        result = integration.extract_roles(
            str(filepath),
            extractor.full_text,
            extractor.paragraphs
        )
        
        return jsonify(result)
    
    except ImportError as e:
        logger.exception(f"Role module import error: {e}")
        raise ProcessingError(f"Role module not installed: {e}", stage='role_extraction')


@app.route('/api/roles/export', methods=['GET'])
@handle_api_errors
def export_roles():
    """Export extracted roles as JSON."""
    session_data = SessionManager.get(g.session_id)
    if not session_data or not session_data.get('review_results'):
        raise ValidationError("No review results available")
    
    role_data = session_data['review_results'].get('roles')
    if not role_data or not role_data.get('success'):
        raise ValidationError("No role data available. Run review first.")
    
    export_data = {
        'export_date': datetime.now(timezone.utc).isoformat() + 'Z',
        'source_document': session_data.get('original_filename'),
        'roles': {}
    }
    
    for role_name, data in role_data.get('roles', {}).items():
        export_data['roles'][role_name] = {
            'role_name': role_name,
            'role_title': data.get('canonical_name', role_name),
            'frequency': data.get('frequency', 0),
            'confidence': data.get('confidence', 0),
            'responsibilities': [
                {'text': r, 'type': 'extracted'}
                for r in data.get('responsibilities', [])
            ],
            'action_types': data.get('action_types', {}),
            'variants': data.get('variants', [])
        }
    
    return jsonify(export_data)


# =============================================================================
# SCAN HISTORY & PROFILES API
# =============================================================================

@app.route('/api/scan-history', methods=['GET'])
@handle_api_errors
def get_scan_history():
    """Get document scan history."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    filename = request.args.get('filename')
    limit = int(request.args.get('limit', 50))
    
    db = get_scan_history_db()
    history = db.get_scan_history(filename, limit)
    
    return jsonify({
        'success': True,
        'data': history
    })

@app.route('/api/scan-history/<int:scan_id>', methods=['DELETE'])
@require_csrf
@handle_api_errors
def delete_scan_history(scan_id):
    """Delete a scan from history."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    db = get_scan_history_db()
    result = db.delete_scan(scan_id)
    
    return jsonify(result)


@app.route('/api/scan-history/document/<int:doc_id>/roles', methods=['GET'])
@handle_api_errors
def get_document_roles(doc_id):
    """Get roles for a specific document.
    
    v3.0.80: Added for per-document role export functionality.
    
    Args:
        doc_id: Document ID from scan history
        
    Returns:
        JSON with roles list including name, category, mentions, responsibilities
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    db = get_scan_history_db()
    roles = db.get_document_roles(doc_id)
    
    return jsonify({
        'success': True,
        'data': roles
    })


@app.route('/api/scan-history/stats', methods=['GET'])
@handle_api_errors
def api_scan_history_stats():
    """Get scan history statistics.
    
    v3.0.109: Added for scan history panel functionality.
    
    Returns:
        JSON with total_scans, unique_documents, last_scan timestamp
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    try:
        db = get_scan_history_db()
        history = db.get_scan_history(limit=1000)  # Get all for stats
        
        unique_docs = set(h.get('filename', '') for h in history if h.get('filename'))
        last_scan = history[0].get('timestamp') if history else None
        
        return jsonify({
            'success': True,
            'total_scans': len(history),
            'unique_documents': len(unique_docs),
            'last_scan': last_scan
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/scan-history/clear', methods=['POST'])
@require_csrf
@handle_api_errors
def api_scan_history_clear():
    """Clear all scan history.
    
    v3.0.109: Added for scan history management.
    
    Returns:
        JSON with success status and message
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    try:
        db = get_scan_history_db()
        # Get all scans and delete them
        history = db.get_scan_history(limit=10000)
        deleted_count = 0
        for scan in history:
            scan_id = scan.get('id')
            if scan_id:
                db.delete_scan(scan_id)
                deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'Cleared {deleted_count} scans from history'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/scan-history/<scan_id>/recall', methods=['POST'])
@require_csrf
@handle_api_errors
def api_scan_history_recall(scan_id):
    """Recall a specific scan from history.
    
    v3.0.109: Added for restoring previous scan results.
    
    Args:
        scan_id: The scan ID (can be string or int)
        
    Returns:
        JSON with scan data including results, roles, options
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    try:
        db = get_scan_history_db()
        # Convert scan_id to int if needed
        try:
            scan_id_int = int(scan_id)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid scan ID: {scan_id}")
        
        # Get scan history and find the matching one
        history = db.get_scan_history(limit=10000)
        scan = next((h for h in history if h.get('id') == scan_id_int), None)
        
        if not scan:
            raise ValidationError(f"Scan {scan_id} not found in history")
        
        return jsonify({
            'success': True,
            'scan': scan
        })
    except ValidationError:
        raise
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/score-trend', methods=['GET'])
@handle_api_errors
def get_score_trend():
    """Get quality score trend for a document.
    
    v3.0.33 Chunk E: Returns score history for sparkline visualization.
    v3.0.35: Added document_id as alternative to filename for reliability.
    
    Query params:
        filename: Document filename (optional if document_id provided)
        document_id: Document ID from scan history (optional if filename provided)
        limit: Max number of historical scores (default: 10)
    
    Returns:
        List of score data points (oldest to newest)
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan history not available'})
    
    filename = request.args.get('filename')
    document_id = request.args.get('document_id')
    
    if not filename and not document_id:
        raise ValidationError("filename or document_id parameter required")
    
    limit = int(request.args.get('limit', 10))
    
    db = get_scan_history_db()
    
    # v3.0.35: Try document_id first if provided (more reliable)
    if document_id:
        try:
            document_id = int(document_id)
            trend = db.get_score_trend_by_id(document_id, limit)
        except (ValueError, TypeError):
            raise ValidationError("document_id must be an integer")
    else:
        trend = db.get_score_trend(filename, limit)
    
    return jsonify({
        'success': True,
        'data': {
            'filename': filename,
            'document_id': document_id,
            'trend': trend,
            'count': len(trend)
        }
    })


# NOTE: History save endpoint is in api_extensions.py at /api/history/save
# which is what the UI calls via api('/history/save', ...). The blueprint-level
# before_request hook in api_extensions.py enforces CSRF on all POST/PUT/DELETE.


@app.route('/api/scan-profiles', methods=['GET'])
@handle_api_errors
def get_scan_profiles():
    """Get saved scan profiles."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan profiles not available'})
    
    db = get_scan_history_db()
    profiles = db.get_scan_profiles()
    
    return jsonify({
        'success': True,
        'data': profiles
    })


@app.route('/api/scan-profiles', methods=['POST'])
@require_csrf
@handle_api_errors
def save_scan_profile():
    """Save a scan profile."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan profiles not available'})
    
    data = request.get_json() or {}
    name = data.get('name')
    options = data.get('options', {})
    description = data.get('description', '')
    set_default = data.get('set_default', False)
    
    if not name:
        raise ValidationError("Profile name is required")
    
    db = get_scan_history_db()
    profile_id = db.save_scan_profile(name, options, description, set_default)
    
    return jsonify({
        'success': True,
        'data': {'id': profile_id, 'name': name}
    })


@app.route('/api/scan-profiles/<int:profile_id>', methods=['DELETE'])
@require_csrf
@handle_api_errors
def delete_scan_profile(profile_id):
    """Delete a scan profile."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan profiles not available'})
    
    db = get_scan_history_db()
    deleted = db.delete_scan_profile(profile_id)
    
    return jsonify({
        'success': deleted,
        'data': {'id': profile_id}
    })


@app.route('/api/scan-profiles/default', methods=['GET'])
@handle_api_errors
def get_default_profile():
    """Get the default scan profile."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Scan profiles not available'})
    
    db = get_scan_history_db()
    profile = db.get_default_profile()
    
    return jsonify({
        'success': True,
        'data': profile
    })


@app.route('/api/roles/aggregated', methods=['GET'])
@handle_api_errors
def get_aggregated_roles():
    """Get roles aggregated across all scanned documents."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role aggregation not available'})
    
    include_deliverables = request.args.get('include_deliverables', 'false').lower() == 'true'
    
    db = get_scan_history_db()
    roles = db.get_all_roles(include_deliverables)
    
    return jsonify({
        'success': True,
        'data': roles
    })


@app.route('/api/roles/matrix', methods=['GET'])
@handle_api_errors
def get_role_document_matrix():
    """Get role-document relationship matrix for visualization."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role matrix not available'})
    
    db = get_scan_history_db()
    matrix = db.get_role_document_matrix()
    
    return jsonify({
        'success': True,
        'data': matrix
    })


@app.route('/api/roles/graph', methods=['GET'])
@handle_api_errors
def get_role_graph():
    """
    Get graph data for D3.js visualization of role-document relationships.
    
    Query parameters:
    - max_nodes: Maximum nodes to return (default 100, max 500)
    - min_weight: Minimum edge weight to include (default 1)
    - use_cache: Whether to use cached data (default true)
    
    Returns:
    - nodes: Array of role and document nodes with stable IDs
    - links: Array of edges with weights
    - role_counts: Aggregate stats per role
    - doc_counts: Aggregate stats per document
    - meta: Query metadata
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({
            'success': False, 
            'error': 'Role graph not available',
            'data': {'nodes': [], 'links': [], 'role_counts': {}, 'doc_counts': {}}
        })
    
    # Parse query params with validation
    try:
        max_nodes = min(int(request.args.get('max_nodes', 100)), 500)
        min_weight = max(int(request.args.get('min_weight', 1)), 1)
        use_cache = request.args.get('use_cache', 'true').lower() != 'false'
    except ValueError:
        max_nodes = 100
        min_weight = 1
        use_cache = True
    
    db = get_scan_history_db()
    
    # Get session and file hash for caching
    session_id = session.get('session_id', 'default')
    sess_data = SessionManager.get(session_id)
    file_hash = ''
    if sess_data and sess_data.get('current_file'):
        import hashlib
        try:
            with open(sess_data['current_file'], 'rb') as f:
                file_hash = hashlib.md5(f.read()[:10000]).hexdigest()  # Hash first 10KB
        except Exception:
            pass
    
    if use_cache and file_hash:
        from scan_history import get_cached_graph
        graph_data = get_cached_graph(session_id, file_hash, db, max_nodes, min_weight)
    else:
        graph_data = db.get_role_graph_data(max_nodes, min_weight)
    
    return jsonify({
        'success': True,
        'data': graph_data
    })


# ============================================================
# ROLE DICTIONARY MANAGEMENT
# ============================================================

@app.route('/api/roles/dictionary', methods=['GET'])
@handle_api_errors
def get_role_dictionary():
    """
    Get all roles from the role dictionary.
    
    Query parameters:
    - include_inactive: Include deactivated roles (default false)
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    db = get_scan_history_db()
    roles = db.get_role_dictionary(include_inactive)
    
    return jsonify({
        'success': True,
        'data': {
            'roles': roles,
            'total': len(roles)
        }
    })


@app.route('/api/roles/dictionary', methods=['POST'])
@require_csrf
@handle_api_errors
def add_role_to_dictionary():
    """
    Add a new role to the dictionary.
    
    Request body:
    - role_name: Required
    - source: Source of role ('manual', 'adjudication', 'upload')
    - category: Optional category
    - aliases: Optional list of aliases
    - description: Optional description
    - is_deliverable: Optional boolean
    - notes: Optional notes
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    data = request.get_json() or {}
    
    role_name = data.get('role_name')
    if not role_name:
        raise ValidationError("role_name is required")
    
    source = data.get('source', 'manual')
    
    db = get_scan_history_db()
    result = db.add_role_to_dictionary(
        role_name=role_name,
        source=source,
        category=data.get('category'),
        aliases=data.get('aliases', []),
        description=data.get('description'),
        source_document=data.get('source_document'),
        is_deliverable=data.get('is_deliverable', False),
        created_by=data.get('created_by', 'user'),
        notes=data.get('notes')
    )
    
    return jsonify(result)


@app.route('/api/roles/dictionary/<int:role_id>', methods=['PUT'])
@require_csrf
@handle_api_errors
def update_role_in_dictionary(role_id):
    """Update an existing role in the dictionary."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    data = request.get_json() or {}
    updated_by = data.pop('updated_by', 'user')
    
    db = get_scan_history_db()
    result = db.update_role_in_dictionary(role_id, updated_by=updated_by, **data)
    
    return jsonify(result)


@app.route('/api/roles/dictionary/<int:role_id>', methods=['DELETE'])
@require_csrf
@handle_api_errors
def delete_role_from_dictionary(role_id):
    """Delete (deactivate) a role from the dictionary."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    # Check for hard delete flag
    hard_delete = request.args.get('hard', 'false').lower() == 'true'
    
    db = get_scan_history_db()
    result = db.delete_role_from_dictionary(role_id, soft_delete=not hard_delete)
    
    return jsonify(result)


@app.route('/api/roles/dictionary/import', methods=['POST'])
@require_csrf
@handle_api_errors
def import_roles_to_dictionary():
    """
    Bulk import roles to the dictionary.
    
    Accepts either:
    - JSON body with 'roles' array
    - File upload (CSV or JSON)
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    db = get_scan_history_db()
    
    # Check for file upload
    if 'file' in request.files:
        file = request.files['file']
        if not file.filename:
            raise ValidationError("No file selected")
        
        filename = sanitize_filename(file.filename)
        content = file.read().decode('utf-8')
        
        if filename.endswith('.json'):
            import json as json_module
            data = json_module.loads(content)
            roles = data if isinstance(data, list) else data.get('roles', [])
        elif filename.endswith('.csv'):
            import csv
            import io
            reader = csv.DictReader(io.StringIO(content))
            roles = list(reader)
        else:
            raise ValidationError("Unsupported file type. Use .json or .csv")
        
        source = 'upload'
        source_document = filename
        created_by = request.form.get('created_by', 'file_import')
    else:
        # JSON body
        data = request.get_json() or {}
        roles = data.get('roles', [])
        source = data.get('source', 'manual')
        source_document = data.get('source_document')
        created_by = data.get('created_by', 'user')
    
    if not roles:
        raise ValidationError("No roles provided")
    
    result = db.import_roles_to_dictionary(
        roles=roles,
        source=source,
        source_document=source_document,
        created_by=created_by
    )
    
    return jsonify({
        'success': True,
        'data': result
    })


@app.route('/api/roles/dictionary/seed', methods=['POST'])
@require_csrf
@handle_api_errors
def seed_role_dictionary():
    """Seed the dictionary with built-in known roles."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    db = get_scan_history_db()
    result = db.seed_builtin_roles()
    
    return jsonify({
        'success': True,
        'data': result
    })


@app.route('/api/roles/dictionary/import-excel', methods=['POST'])
@require_csrf
@handle_api_errors
def import_excel_to_dictionary():
    """
    v2.9.3 F01: Import roles from Excel file (process map export format).
    
    Parses Column J (Activity Resources) and Column L (Info 2/Description).
    Handles [S] prefix for Tools/Systems category.
    
    Returns preview data for user confirmation before actual import.
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    if 'file' not in request.files:
        raise ValidationError("No file provided")
    
    file = request.files['file']
    if not file.filename:
        raise ValidationError("No file selected")
    
    filename = sanitize_filename(file.filename)
    if not filename.endswith(('.xlsx', '.xls')):
        raise ValidationError("Please upload an Excel file (.xlsx or .xls)")
    
    # Check if this is preview mode or actual import
    preview_mode = request.form.get('preview', 'true').lower() == 'true'
    
    try:
        import openpyxl
    except ImportError:
        return jsonify({
            'success': False,
            'error': 'Excel support not available. Install openpyxl: pip install openpyxl'
        })
    
    try:
        # Save uploaded file temporarily
        temp_path = config.temp_dir / f"import_{uuid.uuid4().hex[:8]}_{filename}"
        file.save(str(temp_path))
        
        # Parse Excel file
        wb = openpyxl.load_workbook(str(temp_path), data_only=True)
        ws = wb.active
        
        roles_found = {}  # role_name -> {category, descriptions, sources}
        tools_found = {}  # tool_name -> {descriptions, sources}
        
        # Column indices (0-based): J=9, L=11
        col_j = 9  # Activity Resources
        col_l = 11  # Info 2 (descriptions)
        
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if len(row) <= col_j:
                continue
            
            resources_cell = row[col_j] if col_j < len(row) else None
            desc_cell = row[col_l] if col_l < len(row) else None
            
            if not resources_cell:
                continue
            
            # Split by semicolon and process each role
            resource_str = str(resources_cell)
            description = str(desc_cell) if desc_cell else ""
            
            for resource in resource_str.split(';'):
                resource = resource.strip()
                if not resource:
                    continue
                
                # Check for [S] prefix (Tool/System)
                if resource.startswith('[S]'):
                    tool_name = resource[3:].strip()
                    if tool_name:
                        if tool_name not in tools_found:
                            tools_found[tool_name] = {
                                'descriptions': set(),
                                'source_rows': []
                            }
                        if description:
                            tools_found[tool_name]['descriptions'].add(description)
                        tools_found[tool_name]['source_rows'].append(row_idx)
                else:
                    # Human role
                    if resource not in roles_found:
                        roles_found[resource] = {
                            'descriptions': set(),
                            'source_rows': []
                        }
                    if description:
                        roles_found[resource]['descriptions'].add(description)
                    roles_found[resource]['source_rows'].append(row_idx)
        
        # Clean up temp file
        temp_path.unlink(missing_ok=True)
        wb.close()
        
        # Prepare preview data
        human_roles = []
        for name, data in sorted(roles_found.items()):
            human_roles.append({
                'role_name': name,
                'category': 'Unknown',  # Will be categorized on import
                'description': '; '.join(sorted(data['descriptions']))[:500],
                'source_rows': data['source_rows'][:5],  # Limit for preview
                'occurrence_count': len(data['source_rows'])
            })
        
        tools_systems = []
        for name, data in sorted(tools_found.items()):
            tools_systems.append({
                'role_name': name,
                'category': 'Tools & Systems',
                'description': '; '.join(sorted(data['descriptions']))[:500],
                'source_rows': data['source_rows'][:5],
                'occurrence_count': len(data['source_rows'])
            })
        
        if preview_mode:
            return jsonify({
                'success': True,
                'preview': True,
                'data': {
                    'human_roles': human_roles,
                    'tools_systems': tools_systems,
                    'total_human_roles': len(human_roles),
                    'total_tools': len(tools_systems),
                    'source_file': filename
                }
            })
        
        # Actual import
        selected_roles = request.form.getlist('selected_roles[]')
        selected_tools = request.form.getlist('selected_tools[]')
        
        db = get_scan_history_db()
        
        # Prepare roles for import
        roles_to_import = []
        
        for role in human_roles:
            if not selected_roles or role['role_name'] in selected_roles:
                roles_to_import.append({
                    'role_name': role['role_name'],
                    'category': role.get('category', 'Unknown'),
                    'description': role.get('description', ''),
                    'aliases': []
                })
        
        for tool in tools_systems:
            if not selected_tools or tool['role_name'] in selected_tools:
                roles_to_import.append({
                    'role_name': tool['role_name'],
                    'category': 'Tools & Systems',
                    'description': tool.get('description', ''),
                    'aliases': []
                })
        
        result = db.import_roles_to_dictionary(
            roles=roles_to_import,
            source='excel_import',
            source_document=filename,
            created_by='excel_import'
        )
        
        return jsonify({
            'success': True,
            'preview': False,
            'data': result
        })
        
    except Exception as e:
        logger.exception(f"Error parsing Excel file: {e}")
        return jsonify({
            'success': False,
            'error': f"Error parsing Excel file: {str(e)}"
        })


@app.route('/api/roles/dictionary/export', methods=['GET'])
@handle_api_errors
def export_role_dictionary():
    """Export the role dictionary as JSON or CSV."""
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Role dictionary not available'})
    
    format_type = request.args.get('format', 'json')
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    db = get_scan_history_db()
    roles = db.get_role_dictionary(include_inactive)
    
    if format_type == 'csv':
        import csv
        import io
        output = io.StringIO()
        if roles:
            fieldnames = ['role_name', 'category', 'aliases', 'source', 'source_document',
                         'description', 'is_active', 'is_deliverable', 'created_at', 
                         'created_by', 'updated_at', 'notes']
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            for role in roles:
                row = {k: role.get(k) for k in fieldnames}
                row['aliases'] = ','.join(role.get('aliases', []))
                writer.writerow(row)
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=role_dictionary.csv'
        return response
    else:
        return jsonify({
            'success': True,
            'data': {
                'roles': roles,
                'exported_at': datetime.now().isoformat(),
                'total': len(roles)
            }
        })


# ============================================================
# SHAREABLE DICTIONARY ENDPOINTS
# ============================================================

@app.route('/api/roles/dictionary/status', methods=['GET'])
@handle_api_errors
def get_dictionary_status():
    """
    Get status of dictionary files and sync state.
    
    Shows:
    - Local database info
    - Master file info (if exists)
    - Shared folder configuration
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Dictionary not available'})
    
    db = get_scan_history_db()
    status = db.get_dictionary_status()
    
    return jsonify({
        'success': True,
        'data': status
    })


@app.route('/api/roles/dictionary/export-master', methods=['POST'])
@require_csrf
@handle_api_errors
def export_dictionary_master():
    """
    Export dictionary to a shareable master file.
    
    Creates role_dictionary_master.json that can be distributed to team.
    
    Request body (optional):
    - filepath: Custom output path
    - include_inactive: Include deactivated roles (default false)
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Dictionary not available'})
    
    data = request.get_json() or {}
    filepath = data.get('filepath')
    include_inactive = data.get('include_inactive', False)
    
    db = get_scan_history_db()
    result = db.export_to_master_file(filepath, include_inactive)
    
    return jsonify(result)


# v2.9.4: Alias for create-master to support frontend (#9)
@app.route('/api/roles/dictionary/create-master', methods=['POST'])
@require_csrf
@handle_api_errors
def create_dictionary_master():
    """
    Create a master dictionary file from current dictionary.
    This is an alias for export-master for clarity.
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Dictionary not available'})
    
    db = get_scan_history_db()
    result = db.export_to_master_file(include_inactive=False)
    
    return jsonify(result)


@app.route('/api/roles/dictionary/sync', methods=['POST'])
@require_csrf
@handle_api_errors
def sync_dictionary():
    """
    Sync dictionary from a master file or scan history.
    
    v2.9.1 D1: Added 'source' option for sync_from_history
    v2.9.3 B02: Added 'create_if_missing' option
    
    Request body:
    - source: 'file' (default) or 'history'
    - filepath: Path to master file (auto-detected if not provided) - for source='file'
    - merge_mode: 'add_new' (default), 'replace_all', or 'update_existing' - for source='file'
    - create_if_missing: If true and no master file exists, create one from current dictionary
    - min_occurrences: Minimum occurrences for history sync (default: 2)
    - min_confidence: Minimum confidence for history sync (default: 0.7)
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Dictionary not available'})
    
    data = request.get_json() or {}
    source = data.get('source', 'file')
    
    db = get_scan_history_db()
    
    # v2.9.1 D1: Support sync from history
    if source == 'history':
        min_occurrences = data.get('min_occurrences', 2)
        min_confidence = data.get('min_confidence', 0.7)
        result = db.sync_from_history(min_occurrences, min_confidence)
        return jsonify(result)
    
    # Original file-based sync
    filepath = data.get('filepath')
    merge_mode = data.get('merge_mode', 'add_new')
    # v2.9.3 B02: Support creating master file if missing
    create_if_missing = data.get('create_if_missing', False)
    
    if merge_mode not in ('add_new', 'replace_all', 'update_existing'):
        raise ValidationError(f"Invalid merge_mode: {merge_mode}")
    
    result = db.sync_from_master_file(filepath, merge_mode, create_if_missing)
    
    return jsonify(result)


@app.route('/api/roles/dictionary/download-master', methods=['GET'])
@handle_api_errors
def download_dictionary_master():
    """
    Download the dictionary as a shareable master JSON file.
    
    This returns the file for download (vs export which saves to server).
    """
    if not SCAN_HISTORY_AVAILABLE:
        return jsonify({'success': False, 'error': 'Dictionary not available'})
    
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    db = get_scan_history_db()
    roles = db.get_role_dictionary(include_inactive)
    
    # Format for shareable file
    export_data = {
        'format': 'twr_role_dictionary',
        'version': '1.0',
        'exported_at': datetime.now().isoformat(),
        'exported_by': 'TechWriterReview',
        'role_count': len(roles),
        'roles': []
    }
    
    for role in roles:
        export_role = {
            'role_name': role['role_name'],
            'aliases': role.get('aliases', []),
            'category': role.get('category', 'Custom'),
            'description': role.get('description'),
            'is_deliverable': role.get('is_deliverable', False),
            'notes': role.get('notes')
        }
        # Only include non-None values
        export_role = {k: v for k, v in export_role.items() if v is not None}
        export_data['roles'].append(export_role)
    
    response = make_response(json.dumps(export_data, indent=2))
    response.headers['Content-Type'] = 'application/json'
    response.headers['Content-Disposition'] = 'attachment; filename=role_dictionary_master.json'
    return response


# NOTE: /api/capabilities is now handled by api_extensions.py to avoid route collision
# The api_extensions version includes all capability data and matches the frontend schema


# =============================================================================
# CONFIGURATION API
# =============================================================================

@app.route('/api/config/sharing', methods=['GET'])
@handle_api_errors
def get_sharing_config():
    """Get current sharing configuration."""
    config_file = Path(__file__).parent / 'config.json'
    
    sharing_config = {
        'shared_dictionary_path': ''
    }
    
    if config_file.exists():
        try:
            with open(config_file, encoding='utf-8') as f:
                data = json.load(f)
                sharing = data.get('sharing', {})
                sharing_config['shared_dictionary_path'] = sharing.get('shared_dictionary_path', '')
        except Exception as e:
            logger.warning(f"Could not read config file: {e}")

    return jsonify({
        'success': True,
        'data': sharing_config
    })


@app.route('/api/config/sharing', methods=['POST'])
@require_csrf
@handle_api_errors
def save_sharing_config():
    """Save sharing configuration (shared dictionary path)."""
    data = request.get_json() or {}
    shared_path = data.get('shared_dictionary_path', '')
    
    config_file = Path(__file__).parent / 'config.json'
    
    # Load existing config or create new
    config_data = {}
    if config_file.exists():
        try:
            with open(config_file, encoding='utf-8') as f:
                config_data = json.load(f)
        except Exception:
            pass

    # Update sharing section
    if 'sharing' not in config_data:
        config_data['sharing'] = {}

    config_data['sharing']['shared_dictionary_path'] = shared_path

    # Save back
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Sharing configuration saved'
        })
    except Exception as e:
        logger.error(f"Failed to save config: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })


@app.route('/api/config/sharing/test', methods=['POST'])
@require_csrf
@handle_api_errors
def test_sharing_path():
    """Test if a shared path is accessible."""
    data = request.get_json() or {}
    test_path = data.get('path', '')
    
    if not test_path:
        return jsonify({
            'success': True,
            'data': {
                'accessible': False,
                'error': 'No path provided'
            }
        })
    
    test_path = Path(test_path)
    
    result = {
        'accessible': False,
        'has_master_file': False,
        'error': None
    }
    
    try:
        if test_path.exists():
            result['accessible'] = True
            
            # Check if master file exists
            master_file = test_path / 'role_dictionary_master.json'
            if master_file.exists():
                result['has_master_file'] = True
                # Try to count roles
                try:
                    with open(master_file, encoding='utf-8') as f:
                        data = json.load(f)
                        roles = data.get('roles', []) if isinstance(data, dict) else data
                        result['role_count'] = len(roles)
                except Exception:
                    pass
        else:
            result['error'] = 'Path does not exist'
    except PermissionError:
        result['error'] = 'Permission denied'
    except Exception as e:
        result['error'] = str(e)
    
    return jsonify({
        'success': True,
        'data': result
    })


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def _get_default_user_config() -> Dict:
    """Get default user configuration."""
    return {
        'reviewer_name': 'TechWriter Review',
        'default_checks': {
            'check_acronyms': True,
            'check_passive_voice': True,
            'check_weak_language': True,
            'check_wordy_phrases': True,
            'check_nominalization': True,
            'check_jargon': True,
            'check_ambiguous_pronouns': True,
            'check_requirements_language': True,
            'check_gender_language': True,
            'check_punctuation': True,
            'check_sentence_length': True,
            'check_repeated_words': True,
            'check_capitalization': True,
            'check_contractions': True,
            'check_references': True,
            'check_document_structure': True,
            'check_tables_figures': True,
            'check_track_changes': True,
            'check_consistency': True,
            'check_lists': True
        }
    }


def cleanup_temp_files(max_age_hours: int = 24):
    """Remove temporary files older than max_age_hours."""
    from datetime import timedelta
    cutoff = datetime.now() - timedelta(hours=max_age_hours)
    
    deleted = 0
    for f in config.temp_dir.iterdir():
        if f.is_file():
            try:
                mtime = datetime.fromtimestamp(f.stat().st_mtime)
                if mtime < cutoff:
                    f.unlink()
                    deleted += 1
            except OSError as e:
                logger.warning(f"Failed to delete temp file: {f}", error=str(e))
    
    if deleted > 0:
        logger.info(f"Cleaned up {deleted} temporary files")
    
    # Also cleanup old sessions
    sessions_cleaned = SessionManager.cleanup_old(max_age_hours)
    if sessions_cleaned > 0:
        logger.info(f"Cleaned up {sessions_cleaned} old sessions")


# =============================================================================
# FIX ASSISTANT v2 ROUTES (v3.0.97)
# =============================================================================

@app.route('/api/learner/record', methods=['POST'])
@require_csrf
@handle_api_errors
def learner_record():
    """Record a review decision for pattern learning."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return jsonify({'success': False, 'error': 'Fix Assistant v2 not available'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    fix = data.get('fix', {})
    decision = data.get('decision')
    note = data.get('note', '')
    doc_id = data.get('document_id')
    
    if not decision:
        return jsonify({'success': False, 'error': 'Decision required'}), 400
    
    # Normalize decision values: accept -> accepted, reject -> rejected
    decision_map = {'accept': 'accepted', 'reject': 'rejected'}
    normalized_decision = decision_map.get(decision, decision)
    
    result = decision_learner.record_decision(
        fix=fix,
        decision=normalized_decision,
        note=note,
        document_id=doc_id
    )
    
    return jsonify({'success': result})


@app.route('/api/learner/predict', methods=['POST'])
@handle_api_errors
def learner_predict():
    """Get prediction for a fix based on learned patterns."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    data = request.get_json()
    if not data:
        return api_error_response('NO_DATA', 'No data provided', 400)
    
    fix = data.get('fix', {})
    prediction = decision_learner.get_prediction(fix)
    
    return jsonify(prediction)


@app.route('/api/learner/patterns', methods=['GET'])
@handle_api_errors
def learner_patterns():
    """Get all learned patterns."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    category = request.args.get('category')
    if category:
        patterns = decision_learner.get_patterns_by_category(category)
    else:
        patterns = decision_learner.get_all_patterns()
    return jsonify({'patterns': patterns})


@app.route('/api/learner/patterns/clear', methods=['POST'])
@require_csrf
@handle_api_errors
def learner_clear_patterns():
    """Clear all learned patterns."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    decision_learner.clear_patterns()
    return jsonify({'success': True})


@app.route('/api/learner/dictionary', methods=['GET', 'POST', 'DELETE'])
@handle_api_errors
def learner_dictionary():
    """Manage custom dictionary terms."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    if request.method == 'GET':
        terms = decision_learner.get_dictionary()
        return jsonify({'dictionary': terms})
    
    elif request.method == 'POST':
        data = request.get_json()
        term = data.get('term', '').strip() if data else ''
        category = data.get('category', 'custom')
        notes = data.get('notes', '')
        
        # v3.0.100: Input validation (ISSUE-005)
        if not term:
            return api_error_response('VALIDATION_ERROR', 'Term required', 400)
        
        # Validate term length (max 200 characters)
        if len(term) > 200:
            return api_error_response('VALIDATION_ERROR', 'Term too long (max 200 characters)', 400)
        
        # Validate term contains only allowed characters
        # Allow alphanumeric, spaces, hyphens, periods, underscores, apostrophes
        if not re.match(r'^[\w\s\-\.\'\(\)]+$', term, re.UNICODE):
            return api_error_response(
                'VALIDATION_ERROR', 
                'Term contains invalid characters. Allowed: letters, numbers, spaces, hyphens, periods, apostrophes, parentheses',
                400
            )
        
        # Validate category length
        if category and len(category) > 50:
            return api_error_response('VALIDATION_ERROR', 'Category too long (max 50 characters)', 400)
        
        # Validate notes length
        if notes and len(notes) > 500:
            return api_error_response('VALIDATION_ERROR', 'Notes too long (max 500 characters)', 400)
        
        decision_learner.add_to_dictionary(term, category, notes)
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        data = request.get_json()
        term = data.get('term', '').strip() if data else ''
        
        if not term:
            return api_error_response('VALIDATION_ERROR', 'Term required', 400)
        
        decision_learner.remove_from_dictionary(term)
        return jsonify({'success': True})


@app.route('/api/learner/statistics', methods=['GET'])
@handle_api_errors
def learner_statistics():
    """Get learning statistics.
    
    v3.0.105: BUG-002 FIX - Now returns standard {success: true, data: {...}} envelope.
    """
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    stats = decision_learner.get_statistics()
    return jsonify({'success': True, 'data': stats})


@app.route('/api/learner/export', methods=['GET'])
@require_csrf  # v3.0.117 (BUG-L05): Added CSRF for consistency
@handle_api_errors
def learner_export():
    """Export all learning data."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)

    data = decision_learner.export_data()
    return jsonify(data)


@app.route('/api/learner/import', methods=['POST'])
@require_csrf
@handle_api_errors
def learner_import():
    """Import learning data."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not decision_learner:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    data = request.get_json()
    if not data:
        return api_error_response('NO_DATA', 'No data provided', 400)
    
    decision_learner.import_data(data)
    return jsonify({'success': True})


@app.route('/api/report/generate', methods=['POST'])
@require_csrf
@handle_api_errors
def generate_report():
    """Generate PDF summary report."""
    if not FIX_ASSISTANT_V2_AVAILABLE or not report_generator:
        return api_error_response('SERVICE_UNAVAILABLE', 'Fix Assistant v2 not available', 503)
    
    data = request.get_json()
    if not data:
        return api_error_response('NO_DATA', 'No data provided', 400)
    
    document_name = data.get('document_name', 'document')
    reviewer_name = data.get('reviewer_name', '')
    review_data = data.get('review_data', {})
    options = data.get('options', {})
    
    # Generate PDF
    pdf_bytes = report_generator.generate(
        document_name=document_name,
        reviewer_name=reviewer_name,
        review_data=review_data,
        **options
    )
    
    if not pdf_bytes:
        return api_error_response('GENERATION_FAILED', 'Failed to generate report', 500)
    
    # Return as file download
    return Response(
        pdf_bytes,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="TWR_Report_{document_name}.pdf"'
        }
    )


# v3.0.14: Periodic cleanup for long-running deployments
_cleanup_thread = None
_cleanup_stop_event = None

def start_periodic_cleanup(interval_hours: int = 6):
    """Start background thread for periodic temp/session cleanup.
    
    Args:
        interval_hours: How often to run cleanup (default: every 6 hours)
    """
    global _cleanup_thread, _cleanup_stop_event
    
    if _cleanup_thread is not None and _cleanup_thread.is_alive():
        return  # Already running
    
    _cleanup_stop_event = threading.Event()
    
    def cleanup_loop():
        interval_seconds = interval_hours * 3600
        while not _cleanup_stop_event.wait(interval_seconds):
            try:
                logger.info("Running periodic cleanup...")
                cleanup_temp_files(max_age_hours=24)
            except Exception as e:
                logger.error(f"Periodic cleanup failed: {e}")
    
    _cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True, name="PeriodicCleanup")
    _cleanup_thread.start()
    logger.info(f"Started periodic cleanup thread (every {interval_hours}h)")


def stop_periodic_cleanup():
    """Stop the periodic cleanup thread."""
    global _cleanup_thread, _cleanup_stop_event
    if _cleanup_stop_event:
        _cleanup_stop_event.set()
    if _cleanup_thread:
        _cleanup_thread.join(timeout=1)
        _cleanup_thread = None


def open_browser():
    """Open browser after short delay."""
    import time
    time.sleep(1.5)
    webbrowser.open(f'http://{config.host}:{config.port}')


# =============================================================================
# MAIN
# =============================================================================

def main():
    """Main entry point."""
    # Cleanup old temp files
    cleanup_temp_files()

    # v3.0.14: Start periodic cleanup thread
    start_periodic_cleanup()

    # v3.0.116 (BUG-M03): Start automatic session cleanup to prevent memory growth
    SessionManager.start_auto_cleanup(interval_seconds=3600, max_age_hours=24)
    
    # Parse command line arguments
    use_debug = '--debug' in sys.argv and os.environ.get('TWR_ENV') != 'production'
    no_browser = '--no-browser' in sys.argv
    
    # Environment check
    env = os.environ.get('TWR_ENV', 'development')
    if env == 'production':
        use_debug = False  # NEVER allow debug in production
    
    logger.info(f"Starting {APP_NAME}",
               version=VERSION,
               core_version=MODULE_VERSION,
               environment=env,
               debug=use_debug)
    
    print(f"\n{'='*60}")
    print(f"  {APP_NAME} v{VERSION}")
    print(f"  Core Engine v{MODULE_VERSION}")
    print(f"  Environment: {env}")
    print(f"{'='*60}")
    print(f"\n  Server: http://{config.host}:{config.port}")
    print(f"  CSRF Protection: {'Enabled' if config.csrf_enabled else 'Disabled'}")
    print(f"  Rate Limiting: {'Enabled' if config.rate_limit_enabled else 'Disabled'}")
    print(f"  Authentication: {'Enabled (' + config.auth_provider + ')' if config.auth_enabled else 'Disabled'}")
    print(f"  Max Upload: {config.max_content_length / (1024*1024):.0f}MB")
    print("\n  Press Ctrl+C to stop\n")
    
    # Open browser if not disabled
    if not no_browser and not use_debug:
        threading.Thread(target=open_browser, daemon=True).start()
    
    # Run server
    if use_debug:
        # Development mode - with explicit warning
        logger.warning("DEBUG MODE ENABLED - DO NOT USE IN PRODUCTION")
        print("  ⚠️  DEBUG MODE - NOT FOR PRODUCTION USE")
        # FIX: Pass debug flag from variable, not literal True
        app.run(host=config.host, port=config.port, debug=use_debug)
    else:
        # Production mode with Waitress if available
        try:
            from waitress import serve
            logger.info("Starting with Waitress WSGI server")
            serve(app, host=config.host, port=config.port, threads=4)
        except ImportError:
            logger.warning("Waitress not available, using Flask with threading")
            app.run(host=config.host, port=config.port, debug=False, threaded=True)


if __name__ == '__main__':
    main()
