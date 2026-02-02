"""
Document Comparison Models v1.0.0
=================================
Data classes for document comparison results.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any


@dataclass
class WordChange:
    """
    Represents a word-level change within a line.

    Attributes:
        id: Unique identifier for navigation (e.g., "change-0")
        change_type: Type of change ('added', 'deleted', 'modified')
        old_text: Original text (empty string for additions)
        new_text: New text (empty string for deletions)
        row_index: Which row this change belongs to
        word_start: Character offset within the line
        word_end: Character end offset within the line
        context_before: ~30 chars before for context display
        context_after: ~30 chars after for context display
    """
    id: str
    change_type: str  # 'added', 'deleted', 'modified'
    old_text: str
    new_text: str
    row_index: int
    word_start: int = 0
    word_end: int = 0
    context_before: str = ""
    context_after: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'change_type': self.change_type,
            'old_text': self.old_text,
            'new_text': self.new_text,
            'row_index': self.row_index,
            'word_start': self.word_start,
            'word_end': self.word_end,
            'context_before': self.context_before,
            'context_after': self.context_after
        }


@dataclass
class AlignedRow:
    """
    A single row in the side-by-side view.

    Rows are perfectly aligned between panels - when a line is added,
    the old panel shows a placeholder; when deleted, the new panel
    shows a placeholder.

    Attributes:
        row_index: Sequential index of this row
        status: Row status ('unchanged', 'modified', 'added', 'deleted')
        old_line: Original text (empty string if this is an addition)
        new_line: New text (empty string if this is a deletion)
        old_html: Pre-rendered HTML for old panel (with diff markup)
        new_html: Pre-rendered HTML for new panel (with diff markup)
        word_changes: List of word-level changes within this row
        is_change: Whether this row represents a change (for navigation)
    """
    row_index: int
    status: str  # 'unchanged', 'modified', 'added', 'deleted'
    old_line: str
    new_line: str
    old_html: str = ""
    new_html: str = ""
    word_changes: List[WordChange] = field(default_factory=list)
    is_change: bool = False

    def __post_init__(self):
        """Set is_change based on status."""
        self.is_change = self.status != 'unchanged'

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'row_index': self.row_index,
            'status': self.status,
            'old_line': self.old_line,
            'new_line': self.new_line,
            'old_html': self.old_html,
            'new_html': self.new_html,
            'word_changes': [c.to_dict() for c in self.word_changes],
            'is_change': self.is_change
        }


@dataclass
class DiffResult:
    """
    Complete diff result for comparing two scans.

    Attributes:
        old_scan_id: ID of the older scan
        new_scan_id: ID of the newer scan
        document_id: ID of the document being compared
        old_scan_time: Timestamp of older scan (ISO format)
        new_scan_time: Timestamp of newer scan (ISO format)
        filename: Document filename
        rows: List of aligned rows for side-by-side rendering
        changes: Flat list of all word changes for navigation
        stats: Statistics dictionary with counts
    """
    old_scan_id: int
    new_scan_id: int
    document_id: int
    old_scan_time: str
    new_scan_time: str
    filename: str
    rows: List[AlignedRow] = field(default_factory=list)
    changes: List[WordChange] = field(default_factory=list)
    stats: Dict[str, int] = field(default_factory=dict)

    def __post_init__(self):
        """Initialize stats if not provided."""
        if not self.stats:
            self.stats = {
                'total_rows': 0,
                'unchanged': 0,
                'added': 0,
                'deleted': 0,
                'modified': 0,
                'total_changes': 0
            }

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'old_scan_id': self.old_scan_id,
            'new_scan_id': self.new_scan_id,
            'document_id': self.document_id,
            'old_scan_time': self.old_scan_time,
            'new_scan_time': self.new_scan_time,
            'filename': self.filename,
            'rows': [r.to_dict() for r in self.rows],
            'changes': [c.to_dict() for c in self.changes],
            'stats': self.stats
        }


@dataclass
class IssueComparison:
    """
    Comparison of issues between two scans.

    Attributes:
        fixed: Issues present in old scan but not in new (fixed issues)
        new_issues: Issues present in new scan but not in old
        unchanged: Issues present in both scans
        old_score: Quality score from old scan (0-100)
        new_score: Quality score from new scan (0-100)
        old_issue_count: Total issues in old scan
        new_issue_count: Total issues in new scan
    """
    fixed: List[Dict[str, Any]] = field(default_factory=list)
    new_issues: List[Dict[str, Any]] = field(default_factory=list)
    unchanged: List[Dict[str, Any]] = field(default_factory=list)
    old_score: int = 0
    new_score: int = 0
    old_issue_count: int = 0
    new_issue_count: int = 0

    @property
    def score_change(self) -> int:
        """Calculate the score improvement."""
        return self.new_score - self.old_score

    @property
    def fixed_count(self) -> int:
        """Number of fixed issues."""
        return len(self.fixed)

    @property
    def new_count(self) -> int:
        """Number of new issues."""
        return len(self.new_issues)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'fixed': self.fixed,
            'new_issues': self.new_issues,
            'unchanged': self.unchanged,
            'old_score': self.old_score,
            'new_score': self.new_score,
            'score_change': self.score_change,
            'old_issue_count': self.old_issue_count,
            'new_issue_count': self.new_issue_count,
            'fixed_count': self.fixed_count,
            'new_count': self.new_count
        }
