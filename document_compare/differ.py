"""
Document Differ v1.0.1
======================
Line-level alignment with word-level diff highlighting.

Uses diff-match-patch for accurate word-level comparisons
and difflib.SequenceMatcher for line alignment.

v1.0.1 (v3.0.114): Added comprehensive logging for diagnostics
Author: TechWriterReview
"""

import re
import html
import difflib
import logging
from typing import List, Tuple, Optional
from dataclasses import dataclass

# Setup logger
try:
    from config_logging import get_logger
    logger = get_logger('document_compare.differ')
except ImportError:
    logger = logging.getLogger('document_compare.differ')

# Try to import diff_match_patch
try:
    import diff_match_patch as dmp_module
    DMP_AVAILABLE = True
    logger.debug("diff-match-patch library loaded successfully")
except ImportError:
    DMP_AVAILABLE = False
    logger.warning("diff-match-patch not available - word-level diff will be limited")

from .models import WordChange, AlignedRow, DiffResult


class DocumentDiffer:
    """
    Document comparison engine with line-level alignment
    and word-level diff highlighting.
    """

    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize the differ.

        Args:
            similarity_threshold: Minimum similarity ratio to consider
                                  lines as modified vs added/deleted (0.0 to 1.0)
        """
        self.similarity_threshold = similarity_threshold
        self._change_counter = 0

        # Initialize diff-match-patch if available
        if DMP_AVAILABLE:
            self.dmp = dmp_module.diff_match_patch()
            self.dmp.Diff_Timeout = 2.0  # Max 2 seconds per diff
            self.dmp.Diff_EditCost = 4
        else:
            self.dmp = None

    def align_and_diff(
        self,
        old_text: str,
        new_text: str,
        old_scan_id: int = 0,
        new_scan_id: int = 0,
        document_id: int = 0,
        old_scan_time: str = "",
        new_scan_time: str = "",
        filename: str = ""
    ) -> DiffResult:
        """
        Perform full document comparison.

        Args:
            old_text: Original document text
            new_text: New document text
            old_scan_id: ID of older scan
            new_scan_id: ID of newer scan
            document_id: Document ID
            old_scan_time: Timestamp of older scan
            new_scan_time: Timestamp of newer scan
            filename: Document filename

        Returns:
            DiffResult with aligned rows and statistics
        """
        self._change_counter = 0

        logger.info(f"Starting diff: old_scan={old_scan_id}, new_scan={new_scan_id}, doc={document_id}")
        logger.debug(f"Text lengths: old={len(old_text or '')}, new={len(new_text or '')}")

        # Split into lines
        old_lines = self._split_into_lines(old_text)
        new_lines = self._split_into_lines(new_text)
        logger.debug(f"Line counts: old={len(old_lines)}, new={len(new_lines)}")

        # Align lines and compute diffs
        try:
            aligned_rows = self._align_lines(old_lines, new_lines)
        except Exception as e:
            logger.error(f"Line alignment failed: {e}", exc_info=True)
            raise

        # Collect all changes for navigation
        all_changes = []
        for row in aligned_rows:
            all_changes.extend(row.word_changes)

        # Compute statistics
        stats = {
            'total_rows': len(aligned_rows),
            'unchanged': sum(1 for r in aligned_rows if r.status == 'unchanged'),
            'added': sum(1 for r in aligned_rows if r.status == 'added'),
            'deleted': sum(1 for r in aligned_rows if r.status == 'deleted'),
            'modified': sum(1 for r in aligned_rows if r.status == 'modified'),
            'total_changes': len(all_changes)
        }

        logger.info(f"Diff complete: {stats['total_rows']} rows, {stats['total_changes']} changes "
                   f"(+{stats['added']}, -{stats['deleted']}, ~{stats['modified']})")

        return DiffResult(
            old_scan_id=old_scan_id,
            new_scan_id=new_scan_id,
            document_id=document_id,
            old_scan_time=old_scan_time,
            new_scan_time=new_scan_time,
            filename=filename,
            rows=aligned_rows,
            changes=all_changes,
            stats=stats
        )

    def _split_into_lines(self, text: str) -> List[str]:
        """
        Split text into lines for comparison.

        Splits on newlines, preserving the structure of the document.
        Empty lines are preserved to maintain document structure.

        Args:
            text: Document text

        Returns:
            List of lines (may include empty strings for blank lines)
        """
        if not text:
            return []

        # Split on newlines
        lines = text.split('\n')

        # Strip trailing whitespace from each line but preserve leading
        # (for indentation-sensitive content)
        lines = [line.rstrip() for line in lines]

        return lines

    def _align_lines(
        self,
        old_lines: List[str],
        new_lines: List[str]
    ) -> List[AlignedRow]:
        """
        Align old and new lines using sequence matching.

        Creates aligned rows where:
        - Unchanged lines appear in both panels
        - Added lines have empty placeholder in old panel
        - Deleted lines have empty placeholder in new panel
        - Modified lines show word-level diffs

        Args:
            old_lines: Lines from original document
            new_lines: Lines from new document

        Returns:
            List of AlignedRow objects
        """
        rows = []
        row_index = 0

        # Use difflib for intelligent sequence matching
        matcher = difflib.SequenceMatcher(None, old_lines, new_lines)

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                # Unchanged lines
                for idx in range(i2 - i1):
                    old_line = old_lines[i1 + idx]
                    rows.append(AlignedRow(
                        row_index=row_index,
                        status='unchanged',
                        old_line=old_line,
                        new_line=old_line,
                        old_html=self._escape_html(old_line),
                        new_html=self._escape_html(old_line),
                        word_changes=[]
                    ))
                    row_index += 1

            elif tag == 'delete':
                # Lines removed in new version
                for idx in range(i2 - i1):
                    old_line = old_lines[i1 + idx]
                    change = self._create_change(
                        'deleted', old_line, '', row_index
                    )
                    rows.append(AlignedRow(
                        row_index=row_index,
                        status='deleted',
                        old_line=old_line,
                        new_line='',
                        old_html=self._generate_deleted_html(old_line),
                        new_html='',  # Placeholder
                        word_changes=[change]
                    ))
                    row_index += 1

            elif tag == 'insert':
                # Lines added in new version
                for idx in range(j2 - j1):
                    new_line = new_lines[j1 + idx]
                    change = self._create_change(
                        'added', '', new_line, row_index
                    )
                    rows.append(AlignedRow(
                        row_index=row_index,
                        status='added',
                        old_line='',
                        new_line=new_line,
                        old_html='',  # Placeholder
                        new_html=self._generate_added_html(new_line),
                        word_changes=[change]
                    ))
                    row_index += 1

            elif tag == 'replace':
                # Lines modified - need to match them
                old_section = old_lines[i1:i2]
                new_section = new_lines[j1:j2]
                matched_rows = self._match_modified_lines(
                    old_section, new_section, row_index
                )
                rows.extend(matched_rows)
                row_index += len(matched_rows)

        return rows

    def _match_modified_lines(
        self,
        old_section: List[str],
        new_section: List[str],
        start_row_index: int
    ) -> List[AlignedRow]:
        """
        Match modified lines between sections using similarity scoring.

        Args:
            old_section: Lines from old document section
            new_section: Lines from new document section
            start_row_index: Starting row index for this section

        Returns:
            List of AlignedRow objects
        """
        rows = []
        row_index = start_row_index
        matched_new = set()

        # For each old line, find best matching new line
        for old_idx, old_line in enumerate(old_section):
            best_match = None
            best_ratio = 0.0
            best_new_idx = -1

            for new_idx, new_line in enumerate(new_section):
                if new_idx in matched_new:
                    continue

                ratio = difflib.SequenceMatcher(
                    None, old_line, new_line
                ).ratio()

                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = new_line
                    best_new_idx = new_idx

            if best_ratio >= self.similarity_threshold:
                # Found a match - it's a modification
                matched_new.add(best_new_idx)

                # Compute word-level diff
                word_changes, old_html, new_html = self._diff_words(
                    old_line, best_match, row_index
                )

                rows.append(AlignedRow(
                    row_index=row_index,
                    status='modified',
                    old_line=old_line,
                    new_line=best_match,
                    old_html=old_html,
                    new_html=new_html,
                    word_changes=word_changes
                ))
            else:
                # No good match - it's a deletion
                change = self._create_change(
                    'deleted', old_line, '', row_index
                )
                rows.append(AlignedRow(
                    row_index=row_index,
                    status='deleted',
                    old_line=old_line,
                    new_line='',
                    old_html=self._generate_deleted_html(old_line),
                    new_html='',
                    word_changes=[change]
                ))

            row_index += 1

        # Any unmatched new lines are additions
        for new_idx, new_line in enumerate(new_section):
            if new_idx not in matched_new:
                change = self._create_change(
                    'added', '', new_line, row_index
                )
                rows.append(AlignedRow(
                    row_index=row_index,
                    status='added',
                    old_line='',
                    new_line=new_line,
                    old_html='',
                    new_html=self._generate_added_html(new_line),
                    word_changes=[change]
                ))
                row_index += 1

        return rows

    def _diff_words(
        self,
        old_line: str,
        new_line: str,
        row_index: int
    ) -> Tuple[List[WordChange], str, str]:
        """
        Compute word-level diff between two lines.

        Uses diff-match-patch if available, falls back to
        character-based difflib otherwise.

        Args:
            old_line: Original line
            new_line: New line
            row_index: Row index for change tracking

        Returns:
            Tuple of (word_changes, old_html, new_html)
        """
        if self.dmp:
            return self._diff_words_dmp(old_line, new_line, row_index)
        else:
            return self._diff_words_difflib(old_line, new_line, row_index)

    def _diff_words_dmp(
        self,
        old_line: str,
        new_line: str,
        row_index: int
    ) -> Tuple[List[WordChange], str, str]:
        """
        Word-level diff using diff-match-patch.

        Args:
            old_line: Original line
            new_line: New line
            row_index: Row index

        Returns:
            Tuple of (word_changes, old_html, new_html)
        """
        # Compute diff
        diffs = self.dmp.diff_main(old_line, new_line)
        self.dmp.diff_cleanupSemantic(diffs)

        word_changes = []
        old_html_parts = []
        new_html_parts = []

        for op, text in diffs:
            escaped_text = html.escape(text)

            if op == 0:  # Equal
                old_html_parts.append(escaped_text)
                new_html_parts.append(escaped_text)

            elif op == -1:  # Deletion
                old_html_parts.append(
                    f'<span class="dc-word-deleted">{escaped_text}</span>'
                )
                # Create change for navigation
                change = self._create_change(
                    'modified', text, '', row_index
                )
                word_changes.append(change)

            elif op == 1:  # Insertion
                new_html_parts.append(
                    f'<span class="dc-word-added">{escaped_text}</span>'
                )
                # Create change for navigation (if not paired with deletion)
                if not word_changes or word_changes[-1].old_text:
                    change = self._create_change(
                        'modified', '', text, row_index
                    )
                    word_changes.append(change)
                else:
                    # Pair with previous deletion
                    word_changes[-1].new_text = text

        return (
            word_changes,
            ''.join(old_html_parts),
            ''.join(new_html_parts)
        )

    def _diff_words_difflib(
        self,
        old_line: str,
        new_line: str,
        row_index: int
    ) -> Tuple[List[WordChange], str, str]:
        """
        Word-level diff using difflib (fallback).

        Tokenizes into words and compares word sequences.

        Args:
            old_line: Original line
            new_line: New line
            row_index: Row index

        Returns:
            Tuple of (word_changes, old_html, new_html)
        """
        # Tokenize preserving whitespace
        old_tokens = self._tokenize(old_line)
        new_tokens = self._tokenize(new_line)

        word_changes = []
        old_html_parts = []
        new_html_parts = []

        matcher = difflib.SequenceMatcher(None, old_tokens, new_tokens)

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                text = ''.join(old_tokens[i1:i2])
                escaped = html.escape(text)
                old_html_parts.append(escaped)
                new_html_parts.append(escaped)

            elif tag == 'delete':
                text = ''.join(old_tokens[i1:i2])
                escaped = html.escape(text)
                old_html_parts.append(
                    f'<span class="dc-word-deleted">{escaped}</span>'
                )
                change = self._create_change('modified', text, '', row_index)
                word_changes.append(change)

            elif tag == 'insert':
                text = ''.join(new_tokens[j1:j2])
                escaped = html.escape(text)
                new_html_parts.append(
                    f'<span class="dc-word-added">{escaped}</span>'
                )
                change = self._create_change('modified', '', text, row_index)
                word_changes.append(change)

            elif tag == 'replace':
                old_text = ''.join(old_tokens[i1:i2])
                new_text = ''.join(new_tokens[j1:j2])
                old_html_parts.append(
                    f'<span class="dc-word-deleted">{html.escape(old_text)}</span>'
                )
                new_html_parts.append(
                    f'<span class="dc-word-added">{html.escape(new_text)}</span>'
                )
                change = self._create_change(
                    'modified', old_text, new_text, row_index
                )
                word_changes.append(change)

        return (
            word_changes,
            ''.join(old_html_parts),
            ''.join(new_html_parts)
        )

    def _tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words and whitespace.

        Args:
            text: Text to tokenize

        Returns:
            List of tokens (words and whitespace)
        """
        # Split on word boundaries while preserving separators
        return re.findall(r'\S+|\s+', text)

    def _create_change(
        self,
        change_type: str,
        old_text: str,
        new_text: str,
        row_index: int
    ) -> WordChange:
        """
        Create a WordChange object with unique ID.

        Args:
            change_type: Type of change
            old_text: Original text
            new_text: New text
            row_index: Row index

        Returns:
            WordChange object
        """
        change_id = f"change-{self._change_counter}"
        self._change_counter += 1

        # Extract context (first 30 chars)
        context = old_text or new_text
        context_before = context[:30] if len(context) > 30 else context

        return WordChange(
            id=change_id,
            change_type=change_type,
            old_text=old_text,
            new_text=new_text,
            row_index=row_index,
            context_before=context_before,
            context_after=""
        )

    def _escape_html(self, text: str) -> str:
        """Escape text for safe HTML display."""
        return html.escape(text) if text else ""

    def _generate_added_html(self, text: str) -> str:
        """Generate HTML for an added line."""
        escaped = html.escape(text)
        return f'<span class="dc-line-added">{escaped}</span>'

    def _generate_deleted_html(self, text: str) -> str:
        """Generate HTML for a deleted line."""
        escaped = html.escape(text)
        return f'<span class="dc-line-deleted">{escaped}</span>'


# Convenience function
def compute_diff(
    old_text: str,
    new_text: str,
    **kwargs
) -> DiffResult:
    """
    Compute diff between two texts.

    Args:
        old_text: Original text
        new_text: New text
        **kwargs: Additional arguments passed to DiffResult

    Returns:
        DiffResult with aligned rows
    """
    differ = DocumentDiffer()
    return differ.align_and_diff(old_text, new_text, **kwargs)


if __name__ == '__main__':
    # Demo/test
    print(f"Document Differ - DMP Available: {DMP_AVAILABLE}")
    print("=" * 50)

    old_text = """1.0 INTRODUCTION
This document describes the system.
The system shall meet all requirements.

2.0 REQUIREMENTS
- Requirement 1
- Requirement 2
- Requirement 3

3.0 CONCLUSION
The system is complete."""

    new_text = """1.0 INTRODUCTION
This document describes the system architecture.
The system shall meet all requirements.

2.0 REQUIREMENTS
- Requirement 1
- Requirement 2 (updated)
- NEW REQUIREMENT
- Requirement 3

3.0 SUMMARY
The system is ready for deployment."""

    differ = DocumentDiffer()
    result = differ.align_and_diff(old_text, new_text)

    print(f"\nStatistics:")
    print(f"  Total rows: {result.stats['total_rows']}")
    print(f"  Unchanged: {result.stats['unchanged']}")
    print(f"  Added: {result.stats['added']}")
    print(f"  Deleted: {result.stats['deleted']}")
    print(f"  Modified: {result.stats['modified']}")
    print(f"  Total changes: {result.stats['total_changes']}")

    print(f"\nRows:")
    for row in result.rows:
        if row.status != 'unchanged':
            print(f"  [{row.row_index}] {row.status}: "
                  f"'{row.old_line[:30]}...' -> '{row.new_line[:30]}...'")
