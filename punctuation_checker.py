#!/usr/bin/env python3
"""
Punctuation Checker v2.6.0
==========================
Detects punctuation and spacing issues.

v2.6.0 CHANGES:
- Migrated to provenance tracking for extra space and comma splice detection
- Uses create_validated_issue() for PUN001 and PUN002 rules
- Validates flagged text exists in original document

v2.1.0 CHANGES:
- Report each extra space issue INDIVIDUALLY (not consolidated)
- This allows users to select/deselect individual fixes
- Provides context for each occurrence

v2.0.0 (Hardened):
- Validates all inputs
- Catches all exceptions
- Provides fixable issues with replacement text
"""

import re
from typing import List, Tuple, Optional

try:
    from base_checker import BaseChecker, ReviewIssue
except ImportError:
    try:
        from .base_checker import BaseChecker, ReviewIssue
    except ImportError:
        # Minimal fallback
        class BaseChecker:
            CHECKER_NAME = "Unknown"
            def __init__(self, enabled=True):
                self.enabled = enabled
                self._errors = []
            def create_issue(self, **kwargs):
                kwargs['category'] = getattr(self, 'CHECKER_NAME', 'Unknown')
                return kwargs
            def create_validated_issue(self, **kwargs):
                return self.create_issue(**kwargs)
            def clear_errors(self):
                self._errors = []
        class ReviewIssue:
            pass

__version__ = "2.6.0"


class PunctuationChecker(BaseChecker):
    """
    Detects punctuation and spacing issues.
    
    Thread-safe and stateless.
    
    v2.6.0: Uses provenance tracking for issue validation
    """
    
    CHECKER_NAME = "Punctuation"
    CHECKER_VERSION = "2.6.0"
    
    def __init__(
        self,
        enabled: bool = True,
        min_paragraph_length: int = 10,
        check_double_spaces: bool = True,
        check_comma_splices: bool = True
    ):
        super().__init__(enabled)
        self.min_paragraph_length = min_paragraph_length
        self.check_double_spaces = check_double_spaces
        self.check_comma_splices = check_comma_splices
    
    def check(
        self,
        paragraphs: List[Tuple[int, str]],
        **kwargs
    ) -> List[ReviewIssue]:
        """
        Check for punctuation issues.
        
        Returns:
            List of ReviewIssue for issues found
        """
        issues = []
        
        if not paragraphs:
            return issues
        
        try:
            for idx, text in paragraphs:
                if not text or not isinstance(text, str):
                    continue
                
                if len(text.strip()) < self.min_paragraph_length:
                    continue
                
                # Check for double/extra spaces - report EACH occurrence individually
                if self.check_double_spaces:
                    space_issues = self._find_extra_spaces(idx, text)
                    issues.extend(space_issues)
                
                # Check comma splices (individual) with provenance tracking
                if self.check_comma_splices:
                    splice_issue = self._check_comma_splice(idx, text)
                    if splice_issue:
                        issues.append(splice_issue)
        
        except Exception as e:
            self._errors.append(f"Punctuation check error: {e}")
        
        return issues
    
    def _find_extra_spaces(self, para_idx: int, text: str) -> List[dict]:
        """
        Find all extra space occurrences in a paragraph.
        Uses provenance tracking to validate each match.
        
        Returns list of validated issues.
        """
        issues = []
        
        # Find all double+ space occurrences
        # Pattern matches 2 or more spaces
        pattern = re.compile(r'  +')
        matches = list(pattern.finditer(text))
        
        if not matches:
            return issues
        
        total_occurrences = len(matches)
        
        # Report each occurrence with provenance tracking
        for i, match in enumerate(matches):
            space_count = match.end() - match.start()
            
            # Get context chunk around the match
            chunk_start = max(0, match.start() - 15)
            chunk_end = min(len(text), match.end() + 15)
            original_chunk = text[chunk_start:chunk_end]
            fixed_chunk = re.sub(r'  +', ' ', original_chunk)
            
            # Only add if this chunk is fixable (has actual extra spaces)
            if original_chunk != fixed_chunk:
                # Use provenance tracking to validate
                issue = self.create_validated_issue(
                    severity='Low',
                    message=f'Extra space ({space_count} spaces instead of 1)' + (f' [{i+1}/{total_occurrences}]' if total_occurrences > 1 else ''),
                    paragraph_index=para_idx,
                    original_paragraph=text,
                    normalized_paragraph=text,  # No normalization for space detection
                    match_text=match.group(),
                    match_start=match.start(),
                    match_end=match.end(),
                    context=f'...{original_chunk.strip()}...',
                    suggestion='Remove extra space',
                    original_text=original_chunk,
                    replacement_text=fixed_chunk,
                    rule_id='PUN001'
                )
                
                if issue:
                    issues.append(issue)
        
        return issues
    
    def _check_comma_splice(self, para_idx: int, text: str) -> Optional[dict]:
        """
        Find potential comma splice and create validated issue.
        
        Uses provenance tracking to validate the flagged text.
        
        Args:
            para_idx: Paragraph index
            text: Paragraph text
            
        Returns:
            Issue dict if comma splice found and validated, None otherwise
        """
        # Pattern: comma + pronoun/conjunctive adverb + verb
        patterns = [
            (r',\s+(he|she|it|they|we|I)\s+\w+s?\b', 'pronoun'),
            (r',\s+(however|therefore|thus|hence|moreover)\b', 'conjunctive adverb'),
        ]
        
        for pattern, pattern_type in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Use provenance tracking to validate
                issue = self.create_validated_issue(
                    severity='Low',
                    message=f'Possible comma splice ({pattern_type})',
                    paragraph_index=para_idx,
                    original_paragraph=text,
                    normalized_paragraph=text,  # No normalization
                    match_text=match.group(),
                    match_start=match.start(),
                    match_end=match.end(),
                    context=self._get_splice_context(text, match),
                    suggestion='Use semicolon, period, or conjunction',
                    rule_id='PUN002'
                )
                
                if issue:
                    return issue
        
        return None
    
    def _get_splice_context(self, text: str, match: re.Match) -> str:
        """Get context around a comma splice match."""
        start = max(0, match.start() - 10)
        end = min(len(text), match.end() + 10)
        return text[start:end].strip()
    
    def safe_check(self, *args, **kwargs) -> List['ReviewIssue']:
        """Safely run check with exception handling."""
        try:
            return self.check(*args, **kwargs)
        except Exception as e:
            self._errors.append(f"Safe check error: {e}")
            return []
