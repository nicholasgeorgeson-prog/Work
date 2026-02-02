#!/usr/bin/env python3
"""
TechWriterReview Configuration & Logging Module
================================================
Centralized configuration, structured logging, and security utilities.

Version: reads from version.json (module v2.5)
"""

import os
import sys
import json
import logging
import uuid
import time
import functools
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Callable
from pathlib import Path
from dataclasses import dataclass, field
from contextlib import contextmanager
import threading

# =============================================================================
# CONFIGURATION CONSTANTS (v3.0.116: BUG-L04 - extract magic numbers)
# =============================================================================
DEFAULT_MAX_UPLOAD_MB = 50          # Default max upload size in megabytes
MAX_SAFE_UPLOAD_MB = 500            # Maximum safe upload limit in megabytes
DEFAULT_RATE_LIMIT_REQUESTS = 100   # Default requests per window
DEFAULT_RATE_LIMIT_WINDOW = 60      # Default window in seconds
MIN_SECRET_KEY_LENGTH = 32          # Minimum secret key length
LOG_FILE_MAX_BYTES = 5 * 1024 * 1024  # 5MB max per log file
LOG_BACKUP_COUNT = 5                # Number of log backup files to keep

# Convert MB to bytes
DEFAULT_MAX_UPLOAD_BYTES = DEFAULT_MAX_UPLOAD_MB * 1024 * 1024
MAX_SAFE_UPLOAD_BYTES = MAX_SAFE_UPLOAD_MB * 1024 * 1024

# =============================================================================
# VERSION - Read from version.json (Single Source of Truth)
# =============================================================================
def _load_version():
    """Load version from version.json file."""
    try:
        version_file = Path(__file__).parent / 'version.json'
        if version_file.exists():
            import json
            with open(version_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('version', '2.9.3')
    except Exception:
        pass
    return '2.9.3'  # Fallback version

__version__ = _load_version()
VERSION = __version__
APP_NAME = "TechWriterReview"

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

@dataclass
class AppConfig:
    """Application configuration with secure defaults."""
    
    # Server settings
    host: str = "127.0.0.1"  # Localhost only by default (secure)
    port: int = 5050
    debug: bool = False  # NEVER True in production
    
    # Security settings
    secret_key: str = field(default_factory=lambda: os.environ.get('TWR_SECRET_KEY', ''))
    csrf_enabled: bool = True
    max_content_length: int = DEFAULT_MAX_UPLOAD_BYTES  # Default 50MB max upload
    allowed_extensions: tuple = ('.docx', '.pdf')
    
    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = DEFAULT_RATE_LIMIT_REQUESTS
    rate_limit_window: int = DEFAULT_RATE_LIMIT_WINDOW  # seconds
    
    # Authentication (disabled by default for local use)
    # Set TWR_AUTH=true and TWR_AUTH_PROVIDER=trusted_header or TWR_AUTH_PROVIDER=api_key
    auth_enabled: bool = False
    auth_provider: str = "none"  # Options: none, trusted_header, api_key
    
    # Paths
    base_dir: Path = field(default_factory=lambda: Path(__file__).parent)
    temp_dir: Path = field(default_factory=lambda: Path(__file__).parent / 'temp')
    backup_dir: Path = field(default_factory=lambda: Path(__file__).parent / 'backups')
    log_dir: Path = field(default_factory=lambda: Path(__file__).parent / 'logs')
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"  # Options: json, text
    log_to_file: bool = True
    log_to_console: bool = True
    
    def __post_init__(self):
        """Validate and secure configuration."""
        # Ensure directories exist
        self.temp_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        self.log_dir.mkdir(exist_ok=True)
        
        # Generate secret key if not provided
        if not self.secret_key:
            self.secret_key = self._generate_secret_key()
        
        # Force debug=False in production environment
        if os.environ.get('TWR_ENV', 'development').lower() == 'production':
            self.debug = False
            self.log_level = "WARNING"
    
    @staticmethod
    def _generate_secret_key() -> str:
        """Generate a secure secret key."""
        import secrets
        return secrets.token_hex(32)
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        """Load configuration from environment variables."""
        return cls(
            host=os.environ.get('TWR_HOST', '127.0.0.1'),
            port=int(os.environ.get('TWR_PORT', '5050')),
            debug=os.environ.get('TWR_DEBUG', 'false').lower() == 'true',
            secret_key=os.environ.get('TWR_SECRET_KEY', ''),
            csrf_enabled=os.environ.get('TWR_CSRF', 'true').lower() == 'true',
            max_content_length=int(os.environ.get('TWR_MAX_UPLOAD', str(DEFAULT_MAX_UPLOAD_BYTES))),
            rate_limit_enabled=os.environ.get('TWR_RATE_LIMIT', 'true').lower() == 'true',
            rate_limit_requests=int(os.environ.get('TWR_RATE_LIMIT_REQUESTS', str(DEFAULT_RATE_LIMIT_REQUESTS))),
            rate_limit_window=int(os.environ.get('TWR_RATE_LIMIT_WINDOW', str(DEFAULT_RATE_LIMIT_WINDOW))),
            auth_enabled=os.environ.get('TWR_AUTH', 'false').lower() == 'true',
            auth_provider=os.environ.get('TWR_AUTH_PROVIDER', 'none'),
            log_level=os.environ.get('TWR_LOG_LEVEL', 'INFO'),
            log_format=os.environ.get('TWR_LOG_FORMAT', 'json'),
        )
    
    def validate(self) -> tuple:
        """Validate configuration and return (is_valid, errors)."""
        errors = []
        
        if self.debug and os.environ.get('TWR_ENV') == 'production':
            errors.append("Debug mode cannot be enabled in production")
        
        if len(self.secret_key) < MIN_SECRET_KEY_LENGTH:
            errors.append(f"Secret key must be at least {MIN_SECRET_KEY_LENGTH} characters")

        if self.max_content_length > MAX_SAFE_UPLOAD_BYTES:
            errors.append(f"Max content length exceeds safe limit ({MAX_SAFE_UPLOAD_MB}MB)")
        
        if self.auth_enabled and self.auth_provider not in ('trusted_header', 'api_key'):
            errors.append(f"Invalid auth_provider: {self.auth_provider}. Must be 'trusted_header' or 'api_key'")
        
        if self.auth_enabled and self.auth_provider == 'api_key':
            if not os.environ.get('TWR_API_KEY'):
                errors.append("TWR_API_KEY must be set when using api_key authentication")
        
        return (len(errors) == 0, errors)


# Global config instance
_config: Optional[AppConfig] = None

def get_config() -> AppConfig:
    """Get or create the global configuration."""
    global _config
    if _config is None:
        _config = AppConfig.from_env()
    return _config


def reset_config():
    """Reset the global configuration (for testing)."""
    global _config
    _config = None


# =============================================================================
# STRUCTURED LOGGING
# =============================================================================

class StructuredLogger:
    """Thread-safe structured JSON logger with correlation IDs."""
    
    _local = threading.local()
    
    def __init__(self, name: str, config: Optional[AppConfig] = None):
        self.name = name
        self.config = config or get_config()
        self._setup_logger()
    
    def _setup_logger(self):
        """Configure the underlying Python logger."""
        self.logger = logging.getLogger(self.name)
        self.logger.setLevel(getattr(logging, self.config.log_level.upper()))
        self.logger.handlers.clear()
        
        # JSON formatter
        if self.config.log_format == 'json':
            formatter = JsonFormatter()
        else:
            formatter = logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s - %(message)s'
            )
        
        # Console handler
        if self.config.log_to_console:
            console_handler = logging.StreamHandler(sys.stderr)
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)
        
        # File handler with rotation (v2.9.4.2: prevents disk fill)
        if self.config.log_to_file:
            from logging.handlers import RotatingFileHandler
            log_file = self.config.log_dir / f"{self.name.lower()}.log"
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=LOG_FILE_MAX_BYTES,
                backupCount=LOG_BACKUP_COUNT,
                encoding='utf-8'
            )
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
    
    @classmethod
    def set_correlation_id(cls, correlation_id: str):
        """Set correlation ID for current thread."""
        cls._local.correlation_id = correlation_id
    
    @classmethod
    def get_correlation_id(cls) -> str:
        """Get correlation ID for current thread."""
        return getattr(cls._local, 'correlation_id', None) or str(uuid.uuid4())[:8]
    
    @classmethod
    def new_correlation_id(cls) -> str:
        """Generate and set a new correlation ID."""
        correlation_id = str(uuid.uuid4())[:12]
        cls.set_correlation_id(correlation_id)
        return correlation_id
    
    def _build_log_record(self, level: str, message: str, **kwargs) -> Dict[str, Any]:
        """Build a structured log record."""
        return {
            'timestamp': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'level': level,
            'logger': self.name,
            'correlation_id': self.get_correlation_id(),
            'message': message,
            **kwargs
        }
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        record = self._build_log_record('DEBUG', message, **kwargs)
        self.logger.debug(json.dumps(record) if self.config.log_format == 'json' else message, extra=kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        record = self._build_log_record('INFO', message, **kwargs)
        self.logger.info(json.dumps(record) if self.config.log_format == 'json' else message, extra=kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        record = self._build_log_record('WARNING', message, **kwargs)
        self.logger.warning(json.dumps(record) if self.config.log_format == 'json' else message, extra=kwargs)
    
    def error(self, message: str, exc_info: bool = False, **kwargs):
        """Log error message with optional exception info."""
        record = self._build_log_record('ERROR', message, **kwargs)
        if exc_info:
            import traceback
            record['traceback'] = traceback.format_exc()
        self.logger.error(json.dumps(record) if self.config.log_format == 'json' else message, exc_info=exc_info, extra=kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log exception with full traceback."""
        self.error(message, exc_info=True, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log critical message."""
        record = self._build_log_record('CRITICAL', message, **kwargs)
        self.logger.critical(json.dumps(record) if self.config.log_format == 'json' else message, extra=kwargs)
    
    @contextmanager
    def log_operation(self, operation: str, **context):
        """Context manager for logging operation start/end with timing."""
        start_time = time.time()
        self.info(f"{operation} started", operation=operation, status='started', **context)
        try:
            yield
            duration_ms = (time.time() - start_time) * 1000
            self.info(f"{operation} completed", operation=operation, status='completed', 
                     duration_ms=round(duration_ms, 2), **context)
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.error(f"{operation} failed: {e}", operation=operation, status='failed',
                      duration_ms=round(duration_ms, 2), exc_info=True, **context)
            raise


class JsonFormatter(logging.Formatter):
    """JSON log formatter."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        
        if record.exc_info:
            log_data['traceback'] = self.formatException(record.exc_info)
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ('name', 'msg', 'args', 'created', 'filename', 'funcName',
                          'levelname', 'levelno', 'lineno', 'module', 'msecs',
                          'pathname', 'process', 'processName', 'relativeCreated',
                          'stack_info', 'thread', 'threadName', 'exc_info', 'exc_text',
                          'message', 'taskName'):
                log_data[key] = value
        
        return json.dumps(log_data)


# Factory function for getting loggers
def get_logger(name: str) -> StructuredLogger:
    """Get a structured logger instance."""
    return StructuredLogger(name, get_config())


# =============================================================================
# ERROR HANDLING UTILITIES
# =============================================================================

class TechWriterError(Exception):
    """Base exception for TechWriterReview."""
    
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR", 
                 status_code: int = 500, details: Optional[Dict] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to API response dict."""
        return {
            'success': False,
            'error': {
                'code': self.code,
                'message': self.message,
                'details': self.details
            }
        }


class ValidationError(TechWriterError):
    """Input validation error."""
    def __init__(self, message: str, field: Optional[str] = None, **kwargs):
        super().__init__(message, code="VALIDATION_ERROR", status_code=400, 
                        details={'field': field, **kwargs})


class FileError(TechWriterError):
    """File handling error."""
    def __init__(self, message: str, filename: Optional[str] = None, **kwargs):
        super().__init__(message, code="FILE_ERROR", status_code=400,
                        details={'filename': filename, **kwargs})


class ProcessingError(TechWriterError):
    """Document processing error."""
    def __init__(self, message: str, stage: Optional[str] = None, **kwargs):
        super().__init__(message, code="PROCESSING_ERROR", status_code=500,
                        details={'stage': stage, **kwargs})


class AuthenticationError(TechWriterError):
    """Authentication error."""
    def __init__(self, message: str = "Authentication required", **kwargs):
        super().__init__(message, code="AUTH_ERROR", status_code=401, details=kwargs)


class AuthorizationError(TechWriterError):
    """Authorization error."""
    def __init__(self, message: str = "Permission denied", **kwargs):
        super().__init__(message, code="FORBIDDEN", status_code=403, details=kwargs)


class RateLimitError(TechWriterError):
    """Rate limit exceeded."""
    def __init__(self, retry_after: int = 60, **kwargs):
        super().__init__("Rate limit exceeded", code="RATE_LIMIT", status_code=429,
                        details={'retry_after': retry_after, **kwargs})


def handle_errors(logger: Optional[StructuredLogger] = None):
    """Decorator for standardized error handling."""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            _logger = logger or get_logger(func.__module__)
            try:
                return func(*args, **kwargs)
            except TechWriterError:
                raise  # Re-raise our custom errors
            except FileNotFoundError as e:
                _logger.error(f"File not found: {e}", exc_info=True)
                raise FileError(f"File not found: {e}")
            except PermissionError as e:
                _logger.error(f"Permission denied: {e}", exc_info=True)
                raise FileError(f"Permission denied: {e}")
            except ValueError as e:
                _logger.error(f"Validation error: {e}", exc_info=True)
                raise ValidationError(str(e))
            except Exception as e:
                _logger.exception(f"Unexpected error in {func.__name__}: {e}")
                raise ProcessingError(f"An unexpected error occurred: {type(e).__name__}")
        return wrapper
    return decorator


# =============================================================================
# SECURITY UTILITIES
# =============================================================================

def sanitize_filename(filename: str) -> str:
    """Sanitize a filename to prevent path traversal attacks."""
    import re
    # Remove path separators and null bytes
    filename = filename.replace('/', '').replace('\\', '').replace('\x00', '')
    # Remove leading dots (hidden files)
    filename = filename.lstrip('.')
    # Keep only safe characters
    filename = re.sub(r'[^\w\-_\. ]', '_', filename)
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    return filename or 'unnamed'


def validate_file_extension(filename: str, allowed: tuple = ('.docx', '.pdf')) -> bool:
    """Validate file extension."""
    return filename.lower().endswith(allowed)


def generate_csrf_token() -> str:
    """Generate a CSRF token."""
    import secrets
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, expected: str) -> bool:
    """Verify CSRF token with constant-time comparison."""
    import hmac
    return hmac.compare_digest(token, expected)


# =============================================================================
# RATE LIMITING
# =============================================================================

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, list] = {}
        self._lock = threading.Lock()
    
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed."""
        now = time.time()
        
        with self._lock:
            if key not in self._requests:
                self._requests[key] = []
            
            # Clean old requests
            self._requests[key] = [
                t for t in self._requests[key] 
                if now - t < self.window_seconds
            ]
            
            if len(self._requests[key]) >= self.max_requests:
                return False
            
            self._requests[key].append(now)
            return True
    
    def get_retry_after(self, key: str) -> int:
        """Get seconds until rate limit resets."""
        if key not in self._requests or not self._requests[key]:
            return 0
        oldest = min(self._requests[key])
        return max(0, int(self.window_seconds - (time.time() - oldest)))
    
    def reset(self, key: str = None):
        """Reset rate limit for a key or all keys."""
        with self._lock:
            if key:
                self._requests.pop(key, None)
            else:
                self._requests.clear()


# Global rate limiter
_rate_limiter: Optional[RateLimiter] = None

def get_rate_limiter() -> RateLimiter:
    """Get or create global rate limiter."""
    global _rate_limiter
    if _rate_limiter is None:
        config = get_config()
        _rate_limiter = RateLimiter(
            config.rate_limit_requests,
            config.rate_limit_window
        )
    return _rate_limiter


def reset_rate_limiter():
    """Reset the global rate limiter (for testing)."""
    global _rate_limiter
    if _rate_limiter:
        _rate_limiter.reset()
