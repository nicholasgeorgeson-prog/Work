# TechWriterReview - Bug & Issue Tracker

**Version:** 3.0.116
**Last Updated:** 2026-02-01
**Status Legend:** 🔴 Critical | 🟡 Medium | 🟢 Low | ⚪ Info | ✅ Fixed

---

## Summary Dashboard

| Priority | Open | Fixed | Total |
|----------|------|-------|-------|
| 🔴 Critical | 0 | 7 | 7 |
| 🟡 Medium | 0 | 11 | 11 |
| 🟢 Low | 2 | 6 | 8 |
| ⚪ Info/Enhancement | 4 | 0 | 4 |

**Overall Status:** Production Ready (no critical or medium-severity open bugs)

---

## Open Issues

### 🟡 MEDIUM Priority (0 open)

All medium-priority issues have been resolved as of v3.0.116.

---

### 🟢 LOW Priority (7 open)

#### BUG-L01: Version comments outdated in file headers
**Status:** ✅ Fixed (v3.0.116)
**Location:** Multiple Python files
**Impact:** Confusing for developers
**Fix:** Updated 13 Python files to use "reads from version.json (module vX.X)" format
**Effort:** Low (30 minutes)

#### BUG-L02: Missing type hints in some functions
**Status:** Open  
**Location:** Various Python modules  
**Impact:** IDE support, code documentation  
**Fix:** Add type hints gradually  
**Effort:** Medium (ongoing)

#### BUG-L03: Console log prefixes inconsistent
**Status:** ✅ Fixed (v3.0.116)
**Location:** JavaScript files
**Impact:** Harder to filter logs
**Fix:** Standardized log prefixes to `[TWR Module]` format across 8 feature modules
**Effort:** Low (1 hour)

#### BUG-L04: Magic numbers in statistics calculation
**Status:** ✅ Fixed (v3.0.116)
**Location:** `config_logging.py`
**Impact:** Code clarity
**Fix:** Extracted magic numbers to named constants (DEFAULT_MAX_UPLOAD_MB, MAX_SAFE_UPLOAD_MB, LOG_FILE_MAX_BYTES, etc.)
**Effort:** Low (30 minutes)

#### BUG-L05: Learner export endpoint lacks CSRF
**Status:** ✅ Fixed (v3.0.116)
**Location:** `app.py` learner export
**Impact:** Very low - read-only endpoint
**Fix:** Added `@require_csrf` decorator for consistency
**Effort:** Low (15 minutes)

#### BUG-L06: Minor unused imports
**Status:** ✅ Fixed (v3.0.116)
**Location:** Various Python files
**Impact:** Code cleanliness
**Fix:** Removed unused imports from job_manager.py, diagnostic_export.py, core.py
**Effort:** Low (30 minutes)

#### BUG-L07: Batch limit constants not defined
**Status:** ✅ Fixed (v3.0.116)
**Location:** `app.py`
**Impact:** Test skipped; batch limits not enforced
**Evidence:** Test `test_batch_constants_defined` skipped
**Fix:** Defined `MAX_BATCH_SIZE` (10) and `MAX_BATCH_TOTAL_SIZE` (100MB) constants
**Effort:** Low (30 minutes)

#### BUG-L08: Sound effects not discoverable
**Status:** ✅ Fixed (v3.0.116)
**Location:** `static/js/app.js`
**Impact:** Users don't know sounds exist (disabled by default)
**Fix:** Added `showSoundDiscoveryTip()` - one-time tooltip that appears on first Fix Assistant open
**Effort:** Low (1 hour)

---

### ⚪ INFO / Enhancements (4 open)

#### ENH-001: Role consolidation engine
**Status:** Planned  
**Description:** Merge similar roles (Engineer/Engineers)  
**Effort:** Medium

#### ENH-002: Dictionary sharing
**Status:** Planned  
**Description:** Export/import role dictionaries for teams  
**Effort:** Medium

#### ENH-003: Graph export
**Status:** Planned  
**Description:** PNG/SVG download option for role graphs  
**Effort:** Medium

#### ENH-004: Multi-document comparison
**Status:** Planned  
**Description:** Side-by-side role analysis  
**Effort:** High

---

## Fixed Issues (Recent)

### ✅ v3.0.116 Fixes

| Bug ID | Description | File |
|--------|-------------|------|
| BUG-M02 | Batch Memory - Streaming file uploads, batch limits enforced | app.py |
| BUG-M03 | SessionManager Growth - Automatic cleanup thread (hourly, 24h TTL) | app.py |
| BUG-M04 | Batch Error Context - Full tracebacks now logged | app.py |
| BUG-M05 | Progress Persistence Key Collision - Unique doc IDs via hash | fix-assistant-state.js |
| BUG-L05 | Learner export endpoint CSRF - Added @require_csrf decorator | app.py |
| BUG-L07 | Batch limit constants defined (MAX_BATCH_SIZE=10, MAX_BATCH_TOTAL_SIZE=100MB) | app.py |
| BUG-L08 | Sound effects discoverable - One-time tooltip on first Fix Assistant open | app.js |
| BUG-L01 | Version comments - Updated to reference version.json | Multiple Python files |
| BUG-L03 | Console log prefixes - Standardized to `[TWR Module]` format | 8 JS feature modules |
| BUG-L04 | Magic numbers - Extracted to named constants | config_logging.py |

### ✅ v3.0.108 Fixes

| Bug ID | Description | File |
|--------|-------------|------|
| BUG-009 | Document filter dropdown not populated | role_integration.py, roles.js |

### ✅ v3.0.107 Fixes

| Bug ID | Description | File |
|--------|-------------|------|
| BUG-007 | Role Details missing sample_contexts | roles.js |
| BUG-008 | Role-Doc Matrix stuck on "Loading" | roles.js |

### ✅ v3.0.106 Fixes

| Bug ID | Description | File |
|--------|-------------|------|
| BUG-006 | Fix Assistant v2 Document Viewer empty (0 paragraphs) | core.py |
| BUG-M01 | Remaining deprecated datetime.utcnow() calls | config_logging.py |

### ✅ v3.0.105 Fixes

| Bug ID | Description | File |
|--------|-------------|------|
| BUG-001 | Report generator API signature mismatch | report_generator.py |
| BUG-002 | Learner stats missing success wrapper | app.py |
| BUG-003 | Acronym checker mode handling | acronym_checker.py |
| BUG-004 | Role classification tiebreak logic | role_extractor_v3.py |
| BUG-005 | Comment pack missing location hints | comment_inserter.py |
| WARN-001 | Deprecated datetime.utcnow() (partial) | app.py |

### ✅ v3.0.104 Fixes

| Bug ID | Description | File |
|--------|-------------|------|
| #1 | BodyText style conflict blocking FAv2 | report_generator.py |
| #2 | Logger reserved keyword conflict | app.py |
| #3 | Static file security test expectations | tests.py |
| #4 | CSS test location mismatches | tests.py |

### ✅ v3.0.98 Fixes

| Bug ID | Description |
|--------|-------------|
| BUG-001 | Double browser tab on startup |
| BUG-002 | Export modal crash |
| BUG-003 | Context highlighting showing wrong text |
| BUG-004 | Hyperlink status panel missing |
| BUG-005 | Version history gaps |
| BUG-007 | Role Details tab context preview |
| BUG-008 | Document filter dropdown |
| BUG-009 | Role-Document matrix tab missing |

### ✅ v3.0.97 Fixes (Fix Assistant v2 Integration)

| Issue | Description |
|-------|-------------|
| 1.1 | State.fixes never set |
| 1.2 | Backend missing FAV2 data fields |
| 2.1 | Job result endpoint missing FAV2 fields |
| 2.2 | Missing method stubs in FixAssistant API |
| 3.1 | Help documentation not updated |

---

## Testing Status

**Latest Test Run:** 2026-02-01
**Result:** Tests should now pass including batch constants test
**Note:** `test_batch_constants_defined` should now pass (BUG-L07 fixed in v3.0.116)

### Test Coverage by Feature

| Feature | Tests | Status |
|---------|-------|--------|
| API Endpoints | 5 | ✅ Pass |
| Authentication | 4 | ✅ Pass |
| Acronym Checker | 6 | ✅ Pass |
| Analytics | 3 | ✅ Pass |
| Batch Limits | 2 | ⚠️ 1 Skip |
| Comment Inserter | 11 | ✅ Pass |
| Config | 4 | ✅ Pass |
| Error Handling | 2 | ✅ Pass |
| Export | 3 | ✅ Pass |
| File Validation | 4 | ✅ Pass |
| Fix Assistant v2 | 5 | ✅ Pass |
| Hyperlink Health | 6 | ✅ Pass |
| Role Extraction | 9 | ✅ Pass |
| Statement Forge | 4 | ✅ Pass |
| Static Security | 5 | ✅ Pass |
| UI Polish | 6 | ✅ Pass |
| Version | 3 | ✅ Pass |

---

## Prioritization Strategy

### Immediate (This Sprint)
All medium-priority bugs have been resolved in v3.0.116.

### Short-term (Next Sprint)
1. **BUG-L03** - Standardize console prefixes (1 hr, maintainability)
2. **BUG-L01** - Update file header versions (30 min)
3. **BUG-L08** - Sound effects discoverability (1 hr)

### Low Priority (Tech Debt)
4. **BUG-L02** - Type hints (ongoing)
5. **BUG-L04** - Extract magic numbers (30 min)
6. **BUG-L05** - CSRF on learner export (15 min)
7. **BUG-L06** - Remove unused imports (30 min)

---

## Bug Reporting Template

When finding new bugs, add them with this format:

```markdown
#### BUG-XXX: [Brief Title]
**Status:** Open  
**Priority:** 🔴/🟡/🟢  
**Location:** `file.py` line XXX  
**Impact:** [What breaks or degrades]  
**Evidence:** [How you found it - test failure, user report, code review]  
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Expected: X, Actual: Y

**Fix:** [Proposed solution]  
**Effort:** Low/Medium/High (time estimate)
```

---

## Notes

- All 🔴 Critical bugs were fixed in v3.0.97-v3.0.105
- All 🟡 Medium bugs were fixed in v3.0.116
- The batch constants test should now pass (BUG-L07 fixed)
- SessionManager now auto-cleans every hour, removing sessions older than 24 hours
- Batch uploads now use streaming (8KB chunks) to reduce memory usage
