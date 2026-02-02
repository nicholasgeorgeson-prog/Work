"""
Hyperlink Validator Core Engine
===============================
Core validation logic for standalone hyperlink validation.

This module orchestrates URL validation across two modes:
- offline: Format validation only (no network access)
- validator: Full HTTP validation with Windows integrated authentication,
             optimized for government and enterprise sites

Features:
- Windows integrated authentication (NTLM/Negotiate SSO)
- Robust retry logic with exponential backoff
- Government site compatibility (handling auth challenges, redirects)
- SSL certificate validation
- Soft-404 detection
- DNS resolution checks
- Suspicious URL detection

Integrates with existing TechWriterReview infrastructure:
- JobManager for async progress tracking
- comprehensive_hyperlink_checker for Windows SSO support
"""

import os
import time
import threading
import socket
import ssl
from datetime import datetime
from typing import List, Dict, Optional, Any, Callable
from urllib.parse import urlparse
import logging

# Import models from this package
from .models import (
    ValidationRequest,
    ValidationResult,
    ValidationSummary,
    ValidationRun,
    ValidationStatus,
    ValidationMode,
    ScanDepth,
    LinkType,
    ExclusionRule,
    parse_url_list,
    validate_url_format,
    categorize_domain,
    # New validation functions
    classify_link_type,
    validate_mailto,
    validate_file_path,
    validate_network_path,
    detect_url_typos,
    detect_tld_typos,
    validate_cross_reference,
    validate_internal_bookmark,
    parse_cross_reference
)

# Import DOCX extractor
try:
    from .docx_extractor import DocxExtractor, extract_docx_links, get_urls_from_docx
    DOCX_EXTRACTION_AVAILABLE = True
except ImportError:
    DOCX_EXTRACTION_AVAILABLE = False

# Set up logging
logger = logging.getLogger(__name__)

# Optional imports for connected mode
REQUESTS_AVAILABLE = False
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    pass

# Windows SSO authentication support
WINDOWS_AUTH_AVAILABLE = False
HttpNegotiateAuth = None
try:
    from requests_negotiate_sspi import HttpNegotiateAuth
    WINDOWS_AUTH_AVAILABLE = True
except ImportError:
    try:
        from requests_ntlm import HttpNtlmAuth

        class HttpNegotiateAuth:
            """Wrapper for NTLM auth that uses current Windows user."""
            def __init__(self):
                import getpass
                username = os.environ.get('USERNAME', getpass.getuser())
                domain = os.environ.get('USERDOMAIN', '')
                if domain:
                    self.auth = HttpNtlmAuth(f'{domain}\\{username}', None)
                else:
                    self.auth = HttpNtlmAuth(username, None)

            def __call__(self, r):
                return self.auth(r)

        WINDOWS_AUTH_AVAILABLE = True
    except ImportError:
        pass

# Try to import JobManager
JobManager = None
try:
    from job_manager import JobManager, JobPhase, JobStatus
except ImportError:
    # Create minimal stub if not available
    class JobPhase:
        CHECKING = "checking"
        COMPLETE = "complete"
        FAILED = "failed"

    class JobStatus:
        RUNNING = "running"
        COMPLETE = "complete"


class StandaloneHyperlinkValidator:
    """
    Main validator orchestrator for standalone URL validation.

    This class provides a unified interface for validating URLs across
    different modes (offline, validator) with progress tracking and
    result aggregation.

    Authentication Support:
    - Windows SSO (NTLM/Negotiate) - automatic with requests-negotiate-sspi
    - Client Certificates (mTLS) - for CAC/PIV and PKI-authenticated sites
    - Proxy authentication - for enterprise networks

    Usage:
        validator = StandaloneHyperlinkValidator()

        # Synchronous validation
        results = validator.validate_urls_sync(urls, mode='validator')

        # With client certificate (CAC/PIV)
        validator = StandaloneHyperlinkValidator(
            client_cert=('/path/to/cert.pem', '/path/to/key.pem')
        )

        # With proxy
        validator = StandaloneHyperlinkValidator(
            proxy='http://proxy.corp.mil:8080'
        )

        # Async validation with job tracking
        job_id = validator.start_validation_job(urls, mode='validator', options={})
        status = validator.get_job_status(job_id)
    """

    # Class-level job manager and result storage
    _job_manager = None
    _validation_runs: Dict[str, 'ValidationRun'] = {}
    _lock = threading.RLock()

    def __init__(
        self,
        timeout: int = 10,
        retries: int = 3,
        use_windows_auth: bool = True,
        follow_redirects: bool = True,
        batch_size: int = 50,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        # New: Client certificate for CAC/PIV authentication
        client_cert: Optional[tuple] = None,
        # New: CA bundle for custom certificate authorities
        ca_bundle: Optional[str] = None,
        # New: Proxy server URL
        proxy: Optional[str] = None,
        # New: Skip SSL verification (use with caution)
        verify_ssl: bool = True
    ):
        """
        Initialize the validator.

        Args:
            timeout: Request timeout in seconds
            retries: Number of retry attempts
            use_windows_auth: Whether to use Windows SSO (NTLM/Negotiate)
            follow_redirects: Whether to follow redirects
            batch_size: URLs to process per batch
            progress_callback: Optional callback(completed, total, current_url)
            client_cert: Tuple of (cert_path, key_path) for client certificate auth (CAC/PIV)
                         Can also be a single path to a combined PEM file
            ca_bundle: Path to custom CA certificate bundle (for .mil/.gov PKI)
            proxy: Proxy server URL (e.g., 'http://proxy.corp.mil:8080')
            verify_ssl: Whether to verify SSL certificates (default True)
        """
        self.timeout = timeout
        self.retries = retries
        self.use_windows_auth = use_windows_auth
        self.follow_redirects = follow_redirects
        self.batch_size = batch_size
        self.progress_callback = progress_callback

        # Client certificate authentication (CAC/PIV/PKI)
        self.client_cert = client_cert
        self.ca_bundle = ca_bundle
        self.proxy = proxy
        self.verify_ssl = verify_ssl

        # Initialize job manager if available
        if JobManager and StandaloneHyperlinkValidator._job_manager is None:
            StandaloneHyperlinkValidator._job_manager = JobManager(max_jobs=50, job_ttl=3600)

    @classmethod
    def get_capabilities(cls) -> Dict[str, Any]:
        """
        Get current validation capabilities.

        Returns:
            Dictionary describing available modes and features
        """
        return {
            'modes': {
                'offline': {
                    'available': True,
                    'description': 'Format validation only — checks URL syntax without network access. '
                                   'Use in air-gapped environments or for quick format checks.'
                },
                'validator': {
                    'available': REQUESTS_AVAILABLE,
                    'description': 'Full HTTP validation with multiple authentication options. '
                                   'Optimized for government (.mil/.gov) and enterprise sites.',
                    'windows_auth': WINDOWS_AUTH_AVAILABLE,
                    'features': [
                        'Windows SSO (NTLM/Negotiate)',
                        'Client Certificate auth (CAC/PIV/PKI)',
                        'Custom CA bundle support',
                        'Proxy server support',
                        'Automatic retry with exponential backoff',
                        'Government site compatibility',
                        'SSL certificate validation',
                        'Redirect chain tracking',
                        'Soft-404 detection',
                        'DNS resolution checks'
                    ]
                }
            },
            'authentication': {
                'windows_sso': {
                    'available': WINDOWS_AUTH_AVAILABLE,
                    'description': 'Windows integrated authentication (NTLM/Negotiate)',
                    'install': 'pip install requests-negotiate-sspi (Windows) or requests-ntlm'
                },
                'client_cert': {
                    'available': True,
                    'description': 'Client certificate authentication for CAC/PIV/PKI sites',
                    'usage': 'Provide cert and key paths, or path to combined PEM file',
                    'common_use': '.mil sites, federal PKI-protected resources'
                },
                'proxy': {
                    'available': True,
                    'description': 'HTTP/HTTPS proxy support for enterprise networks',
                    'usage': 'Set proxy URL (e.g., http://proxy.corp.mil:8080)'
                }
            },
            'scan_depths': {
                'quick': {
                    'description': 'Format validation only (fastest)',
                    'features': ['format_check']
                },
                'standard': {
                    'description': 'Basic HTTP validation (default)',
                    'features': ['format_check', 'http_check', 'redirect_follow', 'windows_auth', 'client_cert']
                },
                'thorough': {
                    'description': 'Full validation with DNS, SSL, soft-404 detection',
                    'features': ['format_check', 'http_check', 'redirect_follow', 'windows_auth', 'client_cert',
                                'dns_check', 'ssl_check', 'soft_404_detection',
                                'suspicious_url_detection']
                }
            },
            'features': {
                'windows_sso': WINDOWS_AUTH_AVAILABLE,
                'client_cert_auth': True,
                'proxy_support': True,
                'custom_ca_bundle': True,
                'async_jobs': JobManager is not None,
                'requests_available': REQUESTS_AVAILABLE,
                'exclusions': True,
                'domain_categorization': True,
                'docx_extraction': DOCX_EXTRACTION_AVAILABLE,
                'mailto_validation': True,
                'file_path_validation': True,
                'network_path_validation': True,
                'url_typo_detection': True,
                'cross_reference_validation': True,
                'bookmark_validation': True
            },
            'link_types': [lt.value for lt in LinkType]
        }


    def validate_urls_sync(
        self,
        urls: List[str],
        mode: str = 'validator',
        options: Optional[Dict[str, Any]] = None
    ) -> ValidationRun:
        """
        Validate URLs synchronously (blocking).

        Args:
            urls: List of URLs to validate
            mode: Validation mode (offline, validator, ps1_validator)
            options: Additional options (timeout, retries, etc.)

        Returns:
            ValidationRun with results
        """
        import uuid

        # Merge options with defaults
        opts = {
            'timeout': self.timeout,
            'retries': self.retries,
            'use_windows_auth': self.use_windows_auth,
            'follow_redirects': self.follow_redirects
        }
        if options:
            opts.update(options)

        # Create run record
        run = ValidationRun(
            run_id=str(uuid.uuid4())[:8],
            mode=mode,
            status='running',
            request=ValidationRequest(urls=urls, mode=mode, **{k: v for k, v in opts.items()
                                                               if k in ValidationRequest.__dataclass_fields__})
        )

        start_time = time.time()

        try:
            # Route to appropriate validator
            # Two modes: 'offline' (format only) or 'validator' (full HTTP with Windows auth)
            if mode == 'offline':
                results = self._validate_offline(urls)
            else:  # 'validator' - default, full HTTP validation with Windows auth
                results = self._validate_with_requests(urls, opts)

            total_time = time.time() - start_time
            run.complete(results, total_time)

        except Exception as e:
            logger.exception(f"Validation failed: {e}")
            run.fail(str(e))

        return run

    def start_validation_job(
        self,
        urls: List[str],
        mode: str = 'validator',
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Start asynchronous validation job.

        Args:
            urls: List of URLs to validate
            mode: Validation mode
            options: Additional options

        Returns:
            Job ID for tracking progress
        """
        import uuid

        if not self._job_manager:
            # Fallback: run synchronously and store result
            run = self.validate_urls_sync(urls, mode, options)
            with self._lock:
                self._validation_runs[run.run_id] = run
            return run.run_id

        # Create job
        job_id = self._job_manager.create_job(
            'hyperlink_validation',
            metadata={
                'url_count': len(urls),
                'mode': mode,
                'options': options or {}
            }
        )

        # Create run record
        run = ValidationRun(
            run_id=str(uuid.uuid4())[:8],
            job_id=job_id,
            mode=mode,
            status='pending',
            request=ValidationRequest(urls=urls, mode=mode)
        )

        with self._lock:
            self._validation_runs[job_id] = run

        # Start worker thread
        worker = threading.Thread(
            target=self._run_validation_job,
            args=(job_id, urls, mode, options or {}),
            daemon=True,
            name=f"hv-worker-{job_id}"
        )
        worker.start()

        return job_id

    def _run_validation_job(
        self,
        job_id: str,
        urls: List[str],
        mode: str,
        options: Dict[str, Any]
    ):
        """
        Worker thread for async validation.

        Args:
            job_id: Job ID for progress tracking
            urls: URLs to validate
            mode: Validation mode
            options: Validation options
        """
        start_time = time.time()

        try:
            # Start job
            if self._job_manager:
                self._job_manager.start_job(job_id)
                self._job_manager.update_phase(job_id, JobPhase.CHECKING, "Starting URL validation")

            # Update run status
            with self._lock:
                if job_id in self._validation_runs:
                    self._validation_runs[job_id].status = 'running'

            # Create progress callback for job manager updates
            total_urls = len(urls)

            def update_progress(completed: int, current_url: str = ''):
                if self._job_manager:
                    progress = (completed / total_urls * 100) if total_urls > 0 else 100
                    self._job_manager.update_phase_progress(
                        job_id, progress,
                        f"Validating: {current_url[:50]}..." if current_url else None
                    )

            # Store original callback
            original_callback = self.progress_callback
            self.progress_callback = lambda c, t, u: update_progress(c, u)

            try:
                # Route to appropriate validator
                # Two modes: 'offline' (format only) or 'validator' (full HTTP with Windows auth)
                if mode == 'offline':
                    results = self._validate_offline(urls)
                else:  # 'validator' - default
                    results = self._validate_with_requests(urls, options)
            finally:
                self.progress_callback = original_callback

            total_time = time.time() - start_time

            # Complete job
            with self._lock:
                if job_id in self._validation_runs:
                    run = self._validation_runs[job_id]
                    run.complete(results, total_time)

            if self._job_manager:
                self._job_manager.complete_job(job_id, {
                    'run_id': self._validation_runs.get(job_id, {}).run_id if job_id in self._validation_runs else job_id,
                    'results_count': len(results),
                    'total_time': total_time
                })

        except Exception as e:
            logger.exception(f"Validation job {job_id} failed: {e}")

            with self._lock:
                if job_id in self._validation_runs:
                    self._validation_runs[job_id].fail(str(e))

            if self._job_manager:
                self._job_manager.fail_job(job_id, str(e))

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a validation job.

        Args:
            job_id: Job ID

        Returns:
            Job status dictionary or None if not found
        """
        with self._lock:
            run = self._validation_runs.get(job_id)

        if not run:
            return None

        result = {
            'job_id': job_id,
            'run_id': run.run_id,
            'status': run.status,
            'mode': run.mode,
            'created_at': run.created_at,
            'completed_at': run.completed_at
        }

        # Add job manager info if available
        if self._job_manager:
            job = self._job_manager.get_job(job_id)
            if job:
                result['progress'] = job.progress.to_dict()
                result['elapsed'] = job.elapsed_formatted
                result['eta'] = job.eta_formatted

        # Add summary if complete
        if run.status == 'complete' and run.summary:
            result['summary'] = run.summary.to_dict()

        if run.error:
            result['error'] = run.error

        return result

    def get_job_results(self, job_id: str) -> Optional[ValidationRun]:
        """
        Get full results of a validation job.

        Args:
            job_id: Job ID

        Returns:
            ValidationRun with full results or None
        """
        with self._lock:
            return self._validation_runs.get(job_id)

    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a running validation job.

        Args:
            job_id: Job ID to cancel

        Returns:
            True if cancelled, False if not found or already complete
        """
        with self._lock:
            run = self._validation_runs.get(job_id)
            if run and run.status == 'running':
                run.cancel()

        if self._job_manager:
            job = self._job_manager.get_job(job_id)
            if job:
                job.cancel()
                return True

        return run is not None and run.status == 'cancelled'

    # =========================================================================
    # VALIDATION METHODS
    # =========================================================================

    def _validate_offline(self, urls: List[str]) -> List[ValidationResult]:
        """
        Validate URLs in offline mode (format only).

        Args:
            urls: URLs to validate

        Returns:
            List of ValidationResult objects
        """
        results = []

        for i, url in enumerate(urls):
            is_valid, error = validate_url_format(url)

            if is_valid:
                result = ValidationResult(
                    url=url,
                    status='WORKING',  # Format is valid
                    message='Format valid (offline mode - not verified)',
                    checked_at=datetime.utcnow().isoformat() + "Z"
                )
            else:
                result = ValidationResult(
                    url=url,
                    status='INVALID',
                    message=error,
                    checked_at=datetime.utcnow().isoformat() + "Z"
                )

            results.append(result)

            # Progress callback
            if self.progress_callback:
                self.progress_callback(i + 1, len(urls), url)

        return results

    def _validate_with_requests(
        self,
        urls: List[str],
        options: Dict[str, Any]
    ) -> List[ValidationResult]:
        """
        Validate URLs using Python requests library with multiple auth options.

        Optimized for government (.mil/.gov) and enterprise sites with:
        - Windows integrated authentication (NTLM/Negotiate SSO)
        - Client certificate authentication (CAC/PIV/PKI)
        - Custom CA bundle support for federal PKI
        - Proxy server support for enterprise networks
        - Robust retry logic with exponential backoff
        - Handling of auth challenges and redirects
        - SSL certificate verification
        - Configurable timeouts for slow government servers

        Args:
            urls: URLs to validate
            options: Validation options including:
                - client_cert: (cert_path, key_path) or combined PEM path
                - ca_bundle: Path to custom CA bundle
                - proxy: Proxy server URL
                - verify_ssl: Whether to verify SSL (default True)

        Returns:
            List of ValidationResult objects
        """
        if not REQUESTS_AVAILABLE:
            # Fallback to offline mode
            logger.warning("requests library not available, falling back to offline mode")
            return self._validate_offline(urls)

        results = []
        timeout = options.get('timeout', self.timeout)
        retries = options.get('retries', self.retries)
        follow_redirects = options.get('follow_redirects', self.follow_redirects)

        # Authentication options
        client_cert = options.get('client_cert', self.client_cert)
        ca_bundle = options.get('ca_bundle', self.ca_bundle)
        proxy = options.get('proxy', self.proxy)
        verify_ssl = options.get('verify_ssl', self.verify_ssl)

        # Scan depth settings
        scan_depth = options.get('scan_depth', 'standard')

        # Quick mode = format validation only (no HTTP requests)
        if scan_depth == 'quick':
            logger.info("Quick scan mode: performing format validation only")
            return self._validate_offline(urls)

        check_dns = options.get('check_dns', scan_depth == 'thorough')
        check_ssl = options.get('check_ssl', scan_depth == 'thorough')
        detect_soft_404_flag = options.get('detect_soft_404', scan_depth == 'thorough')
        check_suspicious = options.get('check_suspicious', scan_depth == 'thorough')

        # Exclusion rules
        exclusion_dicts = options.get('exclusions', [])
        exclusions = []
        for exc in exclusion_dicts:
            if isinstance(exc, dict):
                exclusions.append(ExclusionRule.from_dict(exc))
            elif isinstance(exc, ExclusionRule):
                exclusions.append(exc)

        # Set up session with authentication
        session = requests.Session()
        auth_methods = []

        # 1. Configure client certificate authentication (CAC/PIV/PKI)
        if client_cert:
            session.cert = client_cert
            auth_methods.append('client_cert')
            logger.info(f"Client certificate authentication configured")

        # 2. Configure custom CA bundle (for .mil/.gov PKI)
        if ca_bundle:
            session.verify = ca_bundle
            logger.info(f"Custom CA bundle configured: {ca_bundle}")
        elif verify_ssl:
            session.verify = True
        else:
            session.verify = False
            logger.warning("SSL verification disabled - use with caution")

        # 3. Configure proxy server
        if proxy:
            session.proxies = {
                'http': proxy,
                'https': proxy
            }
            auth_methods.append('proxy')
            logger.info(f"Proxy configured: {proxy}")

        # 4. Configure Windows SSO (NTLM/Negotiate) if available and no client cert
        # Note: Windows auth and client cert can conflict, client cert takes precedence
        if WINDOWS_AUTH_AVAILABLE and HttpNegotiateAuth and not client_cert:
            try:
                session.auth = HttpNegotiateAuth()
                auth_methods.append('windows_sso')
                logger.debug("Windows SSO authentication configured")
            except Exception as e:
                logger.warning(f"Windows SSO setup failed: {e}")

        # Determine auth description for results
        if auth_methods:
            auth_used = '+'.join(auth_methods)
        else:
            auth_used = 'none'
            logger.info("No authentication configured - using anonymous requests")

        # Headers optimized for government/enterprise sites
        # - Realistic browser User-Agent to avoid bot blocking
        # - Accept headers that government sites expect
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TechWriterReview/4.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        }

        for i, url in enumerate(urls):
            start_time = time.time()
            result = ValidationResult(url=url, auth_used=auth_used)

            # Set domain category
            result.domain_category = categorize_domain(url)

            # Check exclusions first
            matched_exclusion = None
            for exc in exclusions:
                if exc.matches(url):
                    matched_exclusion = exc
                    break

            if matched_exclusion:
                result.excluded = True
                result.exclusion_reason = matched_exclusion.reason or f"Matched pattern: {matched_exclusion.pattern}"
                if matched_exclusion.treat_as_valid:
                    result.status = 'WORKING'
                    result.message = f'Excluded (treated as OK): {result.exclusion_reason}'
                else:
                    result.status = 'SKIPPED'
                    result.message = f'Excluded: {result.exclusion_reason}'
                result.response_time_ms = (time.time() - start_time) * 1000
                results.append(result)
                if self.progress_callback:
                    self.progress_callback(i + 1, len(urls), url)
                continue

            # Check for suspicious URL (thorough mode)
            if check_suspicious:
                suspicious = detect_suspicious_url(url)
                if suspicious['suspicious']:
                    result.is_suspicious = True
                    result.suspicious_reasons = suspicious['reasons']

            # Format validation first
            is_valid, error = validate_url_format(url)
            if not is_valid:
                result.status = 'INVALID'
                result.message = error
                result.response_time_ms = (time.time() - start_time) * 1000
                results.append(result)
                if self.progress_callback:
                    self.progress_callback(i + 1, len(urls), url)
                continue

            # Try to validate with retries
            # Government sites often need more patience - use longer connect timeout
            connect_timeout = min(timeout, 15)  # Connect timeout
            read_timeout = timeout * 2  # Read timeout (gov sites can be slow)
            last_error = None
            head_failed = False

            for attempt in range(retries + 1):
                try:
                    # First try HEAD request (faster, less server load)
                    if not head_failed:
                        try:
                            response = session.head(
                                url,
                                timeout=(connect_timeout, read_timeout),
                                allow_redirects=follow_redirects,
                                headers=headers,
                                verify=True  # Verify SSL certificates
                            )
                            # Check if HEAD returned an error - many gov sites block HEAD
                            # but work fine with GET (returns 404/405/403 for HEAD only)
                            if response.status_code in [404, 405, 403, 501]:
                                head_failed = True
                                # Don't count this as a real attempt - retry with GET
                                continue
                        except requests.exceptions.RequestException:
                            # Some government sites block HEAD requests - fall back to GET
                            head_failed = True
                            continue  # Retry with GET instead of re-raising

                    # Fall back to GET if HEAD failed or returned error
                    if head_failed:
                        response = session.get(
                            url,
                            timeout=(connect_timeout, read_timeout),
                            allow_redirects=follow_redirects,
                            headers=headers,
                            verify=True,
                            stream=True  # Don't download full content
                        )
                        # Close the response body without reading it
                        response.close()

                    result.status_code = response.status_code
                    result.response_time_ms = (time.time() - start_time) * 1000
                    result.attempts = attempt + 1
                    result.dns_resolved = True

                    # Check for redirects
                    if response.history:
                        result.redirect_count = len(response.history)
                        result.redirect_url = response.url

                    # Map status code to status
                    # Special handling for government/enterprise authentication
                    if 200 <= response.status_code < 300:
                        result.status = 'WORKING'
                        result.message = f'HTTP {response.status_code} OK'

                        # Thorough mode: check for soft 404
                        if detect_soft_404_flag and response.status_code == 200:
                            try:
                                # Need GET to check content
                                get_response = session.get(url, timeout=(connect_timeout, read_timeout), headers=headers)
                                if detect_soft_404(get_response.text):
                                    result.is_soft_404 = True
                                    result.status = 'BROKEN'
                                    result.message = 'Soft 404 detected (page exists but shows error)'
                            except Exception:
                                pass  # Couldn't check, keep WORKING status

                    elif 300 <= response.status_code < 400:
                        result.status = 'REDIRECT'
                        result.message = f'Redirect to {response.headers.get("Location", "unknown")}'

                    elif response.status_code == 401:
                        # 401 Unauthorized - Windows auth may have failed or site requires different auth
                        # For government sites, this often means the link exists but needs auth
                        result.status = 'AUTH_REQUIRED'
                        result.message = 'Authentication required (401) - link exists but requires credentials'

                    elif response.status_code == 403:
                        # 403 can mean blocked OR requires specific permissions
                        # Check if this looks like a real page vs a block page
                        result.status = 'BLOCKED'
                        result.message = 'Access forbidden (403) - may require specific permissions'

                    elif response.status_code == 404:
                        result.status = 'BROKEN'
                        result.message = 'Page not found (404)'

                    elif response.status_code == 405:
                        # Method Not Allowed - HEAD blocked, but page likely exists
                        # Retry with GET
                        if not head_failed:
                            head_failed = True
                            continue  # Retry with GET
                        result.status = 'WORKING'
                        result.message = 'HTTP 405 - page exists (HEAD not allowed)'

                    elif response.status_code == 429:
                        # Rate limited - don't mark as broken
                        result.status = 'RATE_LIMITED'
                        result.message = 'Rate limited (429) - too many requests'

                    elif 400 <= response.status_code < 500:
                        result.status = 'BROKEN'
                        result.message = f'Client error: HTTP {response.status_code}'

                    elif response.status_code >= 500:
                        # Server errors might be temporary - retry
                        if attempt < retries:
                            continue
                        result.status = 'BROKEN'
                        result.message = f'Server error: HTTP {response.status_code}'
                    else:
                        result.status = 'UNKNOWN'
                        result.message = f'HTTP {response.status_code}'

                    # Thorough mode: DNS check
                    if check_dns and result.status == 'WORKING':
                        try:
                            hostname = urlparse(url).netloc
                            dns_result = check_dns_resolution(hostname)
                            result.dns_resolved = dns_result['resolved']
                            result.dns_ip_addresses = dns_result.get('ip_addresses', [])
                            result.dns_response_time_ms = dns_result.get('response_time_ms', 0)
                        except Exception:
                            pass

                    # Thorough mode: SSL check
                    if check_ssl and url.startswith('https://') and result.status == 'WORKING':
                        try:
                            hostname = urlparse(url).netloc
                            ssl_result = check_ssl_certificate(hostname)
                            result.ssl_valid = ssl_result.get('valid', False)
                            result.ssl_issuer = ssl_result.get('issuer', '')
                            result.ssl_expires = ssl_result.get('expires')
                            result.ssl_days_until_expiry = ssl_result.get('days_until_expiry', 0)
                            result.ssl_warning = ssl_result.get('warning')
                        except Exception:
                            pass

                    break  # Success, no retry needed

                except requests.exceptions.SSLError as e:
                    result.status = 'SSLERROR'
                    result.message = f'SSL certificate error: {str(e)[:50]}'
                    result.ssl_valid = False
                    last_error = e
                    break  # Don't retry SSL errors

                except requests.exceptions.Timeout:
                    last_error = 'timeout'
                    if attempt == retries:
                        result.status = 'TIMEOUT'
                        result.message = f'Connection timed out after {timeout}s'

                except requests.exceptions.ConnectionError as e:
                    error_str = str(e).lower()
                    if 'name or service not known' in error_str or 'getaddrinfo failed' in error_str:
                        result.status = 'DNSFAILED'
                        result.message = 'Could not resolve hostname'
                        result.dns_resolved = False
                        break  # Don't retry DNS failures
                    elif 'connection refused' in error_str:
                        result.status = 'BLOCKED'
                        result.message = 'Connection refused'
                        last_error = e
                        break
                    else:
                        last_error = e
                        if attempt == retries:
                            result.status = 'BROKEN'
                            result.message = f'Connection error: {str(e)[:50]}'

                except requests.RequestException as e:
                    last_error = e
                    if attempt == retries:
                        result.status = 'BROKEN'
                        result.message = f'Request error: {str(e)[:50]}'

                # Exponential backoff before retry
                if attempt < retries:
                    import random
                    wait_time = (2 ** attempt) + (random.random() * 0.1)
                    time.sleep(wait_time)

            result.response_time_ms = (time.time() - start_time) * 1000
            result.attempts = min(attempt + 1, retries + 1) if 'attempt' in dir() else 1
            results.append(result)

            # Progress callback
            if self.progress_callback:
                self.progress_callback(i + 1, len(urls), url)

        session.close()
        return results

    # =========================================================================
    # HISTORY MANAGEMENT
    # =========================================================================

    @classmethod
    def get_history(cls, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent validation run history.

        Args:
            limit: Maximum number of runs to return

        Returns:
            List of run summaries (most recent first)
        """
        with cls._lock:
            runs = list(cls._validation_runs.values())

        # Sort by created_at descending
        runs.sort(key=lambda r: r.created_at, reverse=True)

        # Return summaries only
        history = []
        for run in runs[:limit]:
            entry = {
                'run_id': run.run_id,
                'job_id': run.job_id,
                'created_at': run.created_at,
                'completed_at': run.completed_at,
                'mode': run.mode,
                'status': run.status,
                'url_count': len(run.results) if run.results else 0
            }
            if run.summary:
                entry['summary'] = {
                    'working': run.summary.working,
                    'broken': run.summary.broken,
                    'total': run.summary.total
                }
            history.append(entry)

        return history

    @classmethod
    def clear_history(cls):
        """Clear all validation history."""
        with cls._lock:
            cls._validation_runs.clear()


# =============================================================================
# THOROUGH VALIDATION FUNCTIONS
# =============================================================================

def check_dns_resolution(hostname: str, timeout: int = 5) -> Dict[str, Any]:
    """
    Check if hostname resolves to an IP address.

    Args:
        hostname: The hostname to resolve
        timeout: Socket timeout in seconds

    Returns:
        dict with 'resolved', 'ip_addresses', 'response_time_ms'
    """
    start = time.time()
    try:
        socket.setdefaulttimeout(timeout)
        ip_addresses = socket.gethostbyname_ex(hostname)[2]
        return {
            'resolved': True,
            'ip_addresses': ip_addresses,
            'response_time_ms': round((time.time() - start) * 1000, 2)
        }
    except socket.gaierror as e:
        return {
            'resolved': False,
            'ip_addresses': [],
            'response_time_ms': round((time.time() - start) * 1000, 2),
            'error': str(e)
        }
    except Exception as e:
        return {
            'resolved': False,
            'ip_addresses': [],
            'response_time_ms': round((time.time() - start) * 1000, 2),
            'error': str(e)
        }


def check_ssl_certificate(hostname: str, port: int = 443, timeout: int = 10) -> Dict[str, Any]:
    """
    Check SSL certificate validity and expiration.

    Args:
        hostname: The hostname to check
        port: SSL port (default 443)
        timeout: Connection timeout

    Returns:
        dict with 'valid', 'issuer', 'expires', 'days_until_expiry', 'warning'
    """
    context = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                expires_str = cert.get('notAfter', '')

                # Parse expiration date
                try:
                    expires = datetime.strptime(expires_str, '%b %d %H:%M:%S %Y %Z')
                except ValueError:
                    expires = datetime.now()

                days_until = (expires - datetime.now()).days

                # Extract issuer info
                issuer_info = cert.get('issuer', ())
                issuer_name = 'Unknown'
                for item in issuer_info:
                    for key, value in item:
                        if key == 'organizationName':
                            issuer_name = value
                            break

                warning = None
                if days_until < 30:
                    warning = f'Certificate expires in {days_until} days'
                elif days_until < 0:
                    warning = 'Certificate has expired!'

                return {
                    'valid': True,
                    'issuer': issuer_name,
                    'expires': expires.strftime('%Y-%m-%d'),
                    'days_until_expiry': days_until,
                    'warning': warning
                }
    except ssl.SSLError as e:
        return {
            'valid': False,
            'error': f'SSL Error: {str(e)}'
        }
    except socket.timeout:
        return {
            'valid': False,
            'error': 'Connection timeout'
        }
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }


def detect_soft_404(response_text: str) -> bool:
    """
    Detect soft 404 pages that return 200 but are actually error pages.

    Args:
        response_text: HTML content of the page

    Returns:
        True if this appears to be a soft 404 page
    """
    import re
    text_lower = response_text.lower()

    # Title check
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', text_lower)
    if title_match:
        title = title_match.group(1)
        error_indicators = ['not found', '404', 'error', 'page missing', 'unavailable']
        if any(phrase in title for phrase in error_indicators):
            return True

    # Body phrases indicating error pages
    soft_404_phrases = [
        'page not found',
        'page you requested could not be found',
        "this page doesn't exist",
        'this page does not exist',
        "we couldn't find",
        'we could not find',
        'no longer available',
        'has been removed',
        'has been deleted',
        'page has moved',
        'content is unavailable',
        'content not available',
        "sorry, we can't find",
        'the requested url was not found',
        'oops! page not found',
        '404 error',
        'error 404'
    ]

    return any(phrase in text_lower for phrase in soft_404_phrases)


def detect_suspicious_url(url: str) -> Dict[str, Any]:
    """
    Detect potentially suspicious URLs.

    Args:
        url: The URL to analyze

    Returns:
        dict with 'suspicious' (bool) and 'reasons' (list)
    """
    import re
    reasons = []

    try:
        parsed = urlparse(url)
        domain = parsed.netloc
    except Exception:
        return {'suspicious': True, 'reasons': ['Invalid URL format']}

    # IP address instead of domain
    if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', domain):
        reasons.append('Uses IP address instead of domain name')

    # URL shorteners
    shorteners = [
        'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
        'is.gd', 'buff.ly', 'j.mp', 'tiny.cc', 'rb.gy'
    ]
    if any(s in domain.lower() for s in shorteners):
        reasons.append('URL shortener - destination unknown')

    # @ symbol in URL (potential credential harvesting)
    if '@' in url.split('?')[0]:  # Before query string
        reasons.append('Contains @ symbol (potential phishing)')

    # Very long subdomain chains
    subdomain_count = domain.count('.')
    if subdomain_count > 4:
        reasons.append(f'Unusual subdomain depth ({subdomain_count} levels)')

    # Numeric-heavy domain
    domain_without_tld = '.'.join(domain.split('.')[:-1])
    if domain_without_tld:
        digit_ratio = sum(c.isdigit() for c in domain_without_tld) / len(domain_without_tld)
        if digit_ratio > 0.5:
            reasons.append('Domain is mostly numeric')

    # Very long domain name
    if len(domain) > 50:
        reasons.append('Unusually long domain name')

    # Port in URL (often suspicious for http/https)
    if parsed.port and parsed.port not in (80, 443, None):
        reasons.append(f'Non-standard port ({parsed.port})')

    return {
        'suspicious': len(reasons) > 0,
        'reasons': reasons
    }


# =============================================================================
# COMPREHENSIVE LINK VALIDATION
# =============================================================================

def validate_any_link(
    link: str,
    check_typos: bool = True,
    check_exists: bool = False,
    document_structure: Optional[Dict] = None,
    available_bookmarks: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Validate any type of link (URL, mailto, file path, UNC, bookmark, cross-ref).

    Args:
        link: The link to validate
        check_typos: Whether to check for common typos
        check_exists: Whether to verify file/network paths exist
        document_structure: Document structure for cross-reference validation
        available_bookmarks: List of valid bookmarks for bookmark validation

    Returns:
        Dictionary with validation results
    """
    result = {
        'link': link,
        'link_type': classify_link_type(link),
        'is_valid': False,
        'message': '',
        'warnings': [],
        'suggestions': []
    }

    link_type = result['link_type']

    # Check for typos first (for web URLs)
    if check_typos and link_type == LinkType.WEB_URL.value:
        has_typos, typo_issues = detect_url_typos(link)
        if has_typos:
            result['warnings'].extend(typo_issues)

    # Validate based on type
    if link_type == LinkType.WEB_URL.value:
        is_valid, error = validate_url_format(link)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid URL format'

    elif link_type == LinkType.MAILTO.value:
        is_valid, error = validate_mailto(link)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid mailto link'

    elif link_type == LinkType.FILE_PATH.value:
        is_valid, error = validate_file_path(link, check_exists=check_exists)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid file path'

    elif link_type == LinkType.NETWORK_PATH.value:
        is_valid, error = validate_network_path(link, check_accessible=check_exists)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid network path'

    elif link_type == LinkType.BOOKMARK.value:
        is_valid, error = validate_internal_bookmark(link, available_bookmarks)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid bookmark'

    elif link_type == LinkType.CROSS_REFERENCE.value:
        is_valid, error = validate_cross_reference(link, document_structure)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid cross-reference'

    elif link_type == LinkType.FTP.value:
        # Basic FTP URL validation
        is_valid, error = validate_url_format(link)
        result['is_valid'] = is_valid
        result['message'] = error if error else 'Valid FTP URL (not network verified)'

    else:
        result['message'] = 'Unknown link type'

    return result


def validate_docx_links(
    file_path: str,
    validate_web_urls: bool = True,
    check_bookmarks: bool = True,
    check_cross_refs: bool = True
) -> Dict[str, Any]:
    """
    Extract and validate all hyperlinks from a DOCX file.

    Args:
        file_path: Path to the DOCX file
        validate_web_urls: Whether to validate web URLs (requires network)
        check_bookmarks: Whether to validate internal bookmarks
        check_cross_refs: Whether to validate cross-references

    Returns:
        Dictionary with extraction results, validation results, and summary
    """
    if not DOCX_EXTRACTION_AVAILABLE:
        return {
            'error': 'DOCX extraction not available',
            'links': [],
            'structure': {},
            'validation_results': []
        }

    # Extract links and structure
    extractor = DocxExtractor()
    extraction = extractor.extract(file_path)

    if extraction.errors:
        return {
            'error': '; '.join(extraction.errors),
            'links': [],
            'structure': {},
            'validation_results': []
        }

    # Prepare document structure for validation
    doc_structure = extraction.structure.to_dict()
    available_bookmarks = extraction.structure.bookmarks

    # Validate each link
    validation_results = []
    web_urls = []  # Collect for batch web validation

    for link in extraction.links:
        link_type = link.link_type

        if link_type == 'web_url' and validate_web_urls:
            web_urls.append(link.url)
            # Will validate later in batch
            continue

        elif link_type == 'bookmark' and check_bookmarks:
            result = validate_any_link(
                link.url,
                check_typos=False,
                available_bookmarks=available_bookmarks
            )

        elif link_type == 'cross_ref' and check_cross_refs:
            result = validate_any_link(
                link.url,
                check_typos=False,
                document_structure=doc_structure
            )

        else:
            result = validate_any_link(link.url, check_typos=True)

        validation_results.append({
            'link': link.to_dict(),
            'validation': result
        })

    # Batch validate web URLs
    if web_urls and validate_web_urls:
        validator = StandaloneHyperlinkValidator()
        run = validator.validate_urls_sync(web_urls, mode='validator')

        for vr in run.results:
            # Find matching link
            matching_link = next(
                (l for l in extraction.links if l.url == vr.url),
                None
            )
            validation_results.append({
                'link': matching_link.to_dict() if matching_link else {'url': vr.url},
                'validation': {
                    'link': vr.url,
                    'link_type': 'web_url',
                    'is_valid': vr.is_valid,
                    'message': vr.message,
                    'status': vr.status,
                    'status_code': vr.status_code,
                    'warnings': []
                }
            })

    # Generate summary
    total = len(validation_results)
    valid = sum(1 for r in validation_results if r['validation'].get('is_valid', False))
    invalid = total - valid

    return {
        'file_path': file_path,
        'links': [link.to_dict() for link in extraction.links],
        'structure': doc_structure,
        'metadata': extraction.metadata,
        'validation_results': validation_results,
        'summary': {
            'total_links': total,
            'valid': valid,
            'invalid': invalid,
            'by_type': {}
        }
    }


# Convenience function for simple validation
def validate_urls(
    urls: List[str],
    mode: str = 'validator',
    scan_depth: str = 'standard',
    timeout: int = 10,
    use_windows_auth: bool = True,
    exclusions: Optional[List[Dict]] = None
) -> ValidationRun:
    """
    Convenience function for simple URL validation.

    Args:
        urls: List of URLs to validate
        mode: Validation mode (offline, validator, ps1_validator)
        scan_depth: Scan depth (quick, standard, thorough)
        timeout: Request timeout in seconds
        use_windows_auth: Whether to use Windows SSO
        exclusions: List of exclusion rule dicts

    Returns:
        ValidationRun with results
    """
    validator = StandaloneHyperlinkValidator(
        timeout=timeout,
        use_windows_auth=use_windows_auth
    )

    options = {
        'scan_depth': scan_depth,
        'exclusions': exclusions or []
    }

    return validator.validate_urls_sync(urls, mode=mode, options=options)
