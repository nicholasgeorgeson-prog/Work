#!/usr/bin/env python3
"""
TechWriterReview Core Engine
============================
Comprehensive Technical Writing Review Engine
Created by Nicholas Georgeson

Orchestrates all document checkers and provides unified review interface.
Version is read from version.json via config_logging module.
"""

import re
import zipfile
from typing import List, Dict, Tuple, Optional, Callable
from pathlib import Path
from dataclasses import dataclass

# Import version from centralized config
try:
    from config_logging import VERSION as __version__, get_logger
    _logger = get_logger('core')
except ImportError:
    __version__ = "2.5.0"
    _logger = None

MODULE_VERSION = __version__


def _log(message: str, level: str = 'debug', **kwargs):
    """Internal logging helper."""
    if _logger:
        getattr(_logger, level)(message, **kwargs)
    elif level in ('warning', 'error', 'critical'):
        _log(f" {message}")


@dataclass
class ReadabilityMetrics:
    """Document readability statistics."""
    word_count: int = 0
    sentence_count: int = 0
    syllable_count: int = 0
    complex_word_count: int = 0
    avg_words_per_sentence: float = 0.0
    avg_syllables_per_word: float = 0.0
    flesch_reading_ease: float = 0.0
    flesch_kincaid_grade: float = 0.0
    gunning_fog_index: float = 0.0


class DocumentExtractor:
    """Extracts content from Word documents using XML parsing."""
    
    WORD_NS = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    }
    
    # v3.0.100: Large file handling (ISSUE-003)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
    LARGE_FILE_WARNING = 50 * 1024 * 1024  # 50MB warning threshold
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.paragraphs: List[Tuple[int, str]] = []
        self.tables: List[Dict] = []
        self.figures: List[Dict] = []
        self.comments: List[Dict] = []
        self.track_changes: List[Dict] = []
        self.headings: List[Dict] = []
        self.full_text: str = ""
        self.word_count: int = 0
        self.has_toc: bool = False
        self.sections: Dict[str, int] = {}
        self._file_size: int = 0
        self._is_large_file: bool = False
        self._extract()
    
    def _check_file_size(self) -> bool:
        """
        Check file size before extraction. 
        Returns True if file can be processed, raises if too large.
        """
        try:
            self._file_size = Path(self.filepath).stat().st_size
            
            if self._file_size > self.MAX_FILE_SIZE:
                raise ValueError(
                    f"File too large: {self._file_size / (1024*1024):.1f}MB exceeds "
                    f"{self.MAX_FILE_SIZE / (1024*1024):.0f}MB limit. "
                    "Consider splitting the document."
                )
            
            if self._file_size > self.LARGE_FILE_WARNING:
                self._is_large_file = True
                _log(
                    f"Large file detected: {self._file_size / (1024*1024):.1f}MB - "
                    "processing may be slower", 
                    level='warning'
                )
            
            return True
        except OSError as e:
            _log(f"Could not check file size: {e}", level='warning')
            return True  # Proceed anyway
    
    def _extract(self):
        """Extract all content from the docx file."""
        # v3.0.100: Check file size before extraction (ISSUE-003)
        self._check_file_size()
        
        try:
            with zipfile.ZipFile(self.filepath, 'r') as zf:
                if 'word/document.xml' in zf.namelist():
                    doc_xml = zf.read('word/document.xml').decode('utf-8')
                    self._parse_document(doc_xml)
                    self._detect_track_changes(doc_xml)
                if 'word/comments.xml' in zf.namelist():
                    self._parse_comments(zf.read('word/comments.xml').decode('utf-8'))
        except Exception as e:
            raise ValueError(f"Failed to extract document: {e}")
    
    def _parse_document(self, xml_content: str):
        """Parse document.xml to extract paragraphs, tables, and structure."""
        para_idx = 0
        all_text = []
        table_count = 0
        figure_count = 0

        # Extract text from paragraphs
        text_pattern = re.compile(r'<w:p\b[^>]*>(.*?)</w:p>', re.DOTALL)
        text_extract = re.compile(r'<w:t[^>]*>([^<]*)</w:t>')
        style_pattern = re.compile(r'<w:pStyle\s+w:val="([^"]*)"')

        # v3.0.113: Enhanced patterns for heading detection
        # Pattern for numbered sections: "1.0", "2.1", "3.2.1", "A.1", etc.
        section_number_pattern = re.compile(
            r'^([A-Z]?\d+(?:\.\d+)*\.?)\s+[A-Z]',  # "1.0 Introduction" or "A.1 Scope"
            re.IGNORECASE
        )
        # Pattern for bold text detection in XML
        bold_pattern = re.compile(r'<w:b(?:\s|/|>)')
        # Pattern for centered alignment
        center_pattern = re.compile(r'<w:jc\s+w:val="center"')

        for para_match in text_pattern.finditer(xml_content):
            para_content = para_match.group(1)

            # Extract text
            texts = text_extract.findall(para_content)
            text = ''.join(texts)

            # Get style
            style_match = style_pattern.search(para_content)
            style = style_match.group(1) if style_match else ''

            # v3.0.113: Enhanced heading detection with multiple heuristics
            is_heading = False
            detected_level = 0
            detection_source = ''

            # Method 1: Style-based detection (existing, most reliable)
            if 'heading' in style.lower() or 'title' in style.lower():
                is_heading = True
                detection_source = 'style'
                level_match = re.search(r'(\d+)', style)
                if level_match:
                    detected_level = int(level_match.group(1))
                elif 'title' in style.lower():
                    detected_level = 0  # Title is level 0

            # Method 2: Numbered section pattern detection
            text_stripped = text.strip()
            if not is_heading and text_stripped and len(text_stripped) < 200:
                section_match = section_number_pattern.match(text_stripped)
                if section_match:
                    # Determine level from numbering depth (1.0 = level 1, 1.1.1 = level 3)
                    section_num = section_match.group(1).rstrip('.')
                    level_depth = section_num.count('.') + 1
                    is_heading = True
                    detected_level = min(level_depth, 6)  # Cap at h6
                    detection_source = 'numbered'
                    self.sections[section_num] = para_idx

            # Method 3: ALL CAPS short paragraph (likely a header)
            if not is_heading and text_stripped:
                # Check if short, mostly uppercase, and not a sentence
                words = text_stripped.split()
                if (3 <= len(words) <= 10 and  # 3-10 words
                    text_stripped.isupper() and  # All caps
                    not text_stripped.endswith('.') and  # Not a sentence
                    len(text_stripped) < 100):  # Not too long
                    is_heading = True
                    detected_level = 2  # Default to level 2 for ALL CAPS
                    detection_source = 'allcaps'

            # Method 4: Bold + centered short text (likely header)
            if not is_heading and text_stripped and len(text_stripped) < 100:
                is_bold = bool(bold_pattern.search(para_content))
                is_centered = bool(center_pattern.search(para_content))
                words = text_stripped.split()
                if is_bold and is_centered and 1 <= len(words) <= 8:
                    is_heading = True
                    detected_level = 2  # Default to level 2
                    detection_source = 'bold_centered'

            if 'TOC' in style:
                self.has_toc = True

            # Add to headings list if detected
            if is_heading and text_stripped:
                # Also capture section numbers for section tracking
                section_match = re.match(r'^([A-Z]?\d+(?:\.\d+)*)', text_stripped)
                if section_match and section_match.group(1) not in self.sections:
                    self.sections[section_match.group(1)] = para_idx

                self.headings.append({
                    'index': para_idx,
                    'text': text,
                    'style': style or f'detected_{detection_source}',
                    'level': detected_level
                })
            
            # Check for figures
            if '<w:drawing' in para_content or '<w:pict' in para_content:
                figure_count += 1
                self.figures.append({
                    'index': para_idx,
                    'number': figure_count,
                    'has_caption': False
                })
            
            if text.strip():
                self.paragraphs.append((para_idx, text))
                all_text.append(text)
                para_idx += 1
        
        # Extract tables
        table_pattern = re.compile(r'<w:tbl\b[^>]*>(.*?)</w:tbl>', re.DOTALL)
        row_pattern = re.compile(r'<w:tr\b[^>]*>(.*?)</w:tr>', re.DOTALL)
        cell_pattern = re.compile(r'<w:tc\b[^>]*>(.*?)</w:tc>', re.DOTALL)
        
        for tbl_match in table_pattern.finditer(xml_content):
            table_count += 1
            tbl_content = tbl_match.group(1)
            
            rows = []
            for row_match in row_pattern.finditer(tbl_content):
                row = []
                row_content = row_match.group(1)
                
                for cell_match in cell_pattern.finditer(row_content):
                    cell_content = cell_match.group(1)
                    cell_texts = text_extract.findall(cell_content)
                    cell_text = ' '.join(cell_texts)
                    row.append(cell_text)
                
                rows.append(row)
            
            # Check if acronym table
            is_acronym = False
            if rows:
                header = ' '.join(rows[0]).lower()
                is_acronym = any(kw in header for kw in ['acronym', 'abbreviation', 'definition', 'meaning'])
            
            # Count empty cells
            empty_cells = sum(1 for row in rows for cell in row if not cell.strip())
            
            self.tables.append({
                'start_para': para_idx,
                'number': table_count,
                'rows': rows,
                'is_acronym_table': is_acronym,
                'has_caption': False,
                'empty_cells': empty_cells
            })
            
            # Add table cell text to paragraphs
            for row in rows:
                for cell in row:
                    if cell.strip():
                        self.paragraphs.append((para_idx, cell))
                        all_text.append(cell)
                        para_idx += 1
        
        self.full_text = '\n'.join(all_text)
        self.word_count = len(self.full_text.split())
    
    def _parse_comments(self, xml_content: str):
        """Parse comments from comments.xml."""
        comment_pattern = re.compile(
            r'<w:comment[^>]*w:author="([^"]*)"[^>]*>(.*?)</w:comment>',
            re.DOTALL
        )
        text_pattern = re.compile(r'<w:t[^>]*>([^<]*)</w:t>')
        
        for match in comment_pattern.finditer(xml_content):
            author = match.group(1)
            content = match.group(2)
            texts = text_pattern.findall(content)
            text = ' '.join(texts)
            
            self.comments.append({
                'author': author,
                'text': text
            })
    
    def _detect_track_changes(self, xml_content: str):
        """Detect track changes in document."""
        for match in re.finditer(r'<w:ins\s[^>]*w:author="([^"]*)"', xml_content):
            self.track_changes.append({'type': 'insertion', 'author': match.group(1)})
        
        for match in re.finditer(r'<w:del\s[^>]*w:author="([^"]*)"', xml_content):
            self.track_changes.append({'type': 'deletion', 'author': match.group(1)})


class ReadabilityCalculator:
    """Calculates readability metrics."""
    
    def calculate(self, text: str) -> ReadabilityMetrics:
        """Calculate all readability metrics for text."""
        metrics = ReadabilityMetrics()
        
        clean_text = re.sub(r'[^\w\s\.\!\?]', '', text)
        words = [w for w in clean_text.split() if w.strip()]
        metrics.word_count = len(words)
        
        if metrics.word_count == 0:
            return metrics
        
        sentences = [s for s in re.split(r'[.!?]+', clean_text) if s.strip()]
        metrics.sentence_count = max(1, len(sentences))
        
        metrics.syllable_count = sum(self._count_syllables(w) for w in words)
        metrics.complex_word_count = sum(1 for w in words if self._count_syllables(w) >= 3)
        
        metrics.avg_words_per_sentence = metrics.word_count / metrics.sentence_count
        metrics.avg_syllables_per_word = metrics.syllable_count / metrics.word_count
        
        # Flesch Reading Ease
        metrics.flesch_reading_ease = max(0, min(100,
            206.835 - 1.015 * metrics.avg_words_per_sentence - 84.6 * metrics.avg_syllables_per_word
        ))
        
        # Flesch-Kincaid Grade Level
        metrics.flesch_kincaid_grade = max(0,
            0.39 * metrics.avg_words_per_sentence + 11.8 * metrics.avg_syllables_per_word - 15.59
        )
        
        # Gunning Fog Index
        complex_ratio = metrics.complex_word_count / metrics.word_count if metrics.word_count > 0 else 0
        metrics.gunning_fog_index = 0.4 * (metrics.avg_words_per_sentence + 100 * complex_ratio)
        
        return metrics
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word."""
        word = word.lower().strip()
        if len(word) <= 2:
            return 1
        
        if word.endswith('e') and len(word) > 2:
            word = word[:-1]
        
        count = 0
        prev_vowel = False
        for char in word:
            is_vowel = char in 'aeiouy'
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        
        return max(1, count)


class TechWriterReviewEngine:
    """
    Comprehensive technical writing review engine.
    Orchestrates all checkers and provides unified review interface.
    """
    
    def __init__(self):
        self.issues: List[Dict] = []
        self.readability: ReadabilityMetrics = ReadabilityMetrics()
        self.readability_calc = ReadabilityCalculator()
        self.checkers = {}
        self._init_checkers()
    
    def _init_checkers(self):
        """Initialize all checkers with lazy loading."""
        try:
            from writing_quality_checker import (
                WeakLanguageChecker, WordyPhrasesChecker, NominalizationChecker,
                JargonChecker, GenderLanguageChecker
            )
            self.checkers['weak_language'] = WeakLanguageChecker()
            self.checkers['wordy_phrases'] = WordyPhrasesChecker()
            self.checkers['nominalization'] = NominalizationChecker()
            self.checkers['jargon'] = JargonChecker()
            self.checkers['gender_language'] = GenderLanguageChecker()
        except ImportError as e:
            _log(f" Writing quality checkers not available: {e}")
        
        try:
            from requirements_checker import RequirementsLanguageChecker, AmbiguousPronounsChecker
            self.checkers['requirements_language'] = RequirementsLanguageChecker()
            self.checkers['ambiguous_pronouns'] = AmbiguousPronounsChecker()
        except ImportError as e:
            _log(f" Requirements checkers not available: {e}")
        
        try:
            from grammar_checker import (
                PassiveVoiceChecker, ContractionsChecker, RepeatedWordsChecker, CapitalizationChecker
            )
            self.checkers['passive_voice'] = PassiveVoiceChecker()
            self.checkers['contractions'] = ContractionsChecker()
            self.checkers['repeated_words'] = RepeatedWordsChecker()
            self.checkers['capitalization'] = CapitalizationChecker()
        except ImportError as e:
            _log(f" Grammar checkers not available: {e}")
        
        try:
            from document_checker import (
                ReferenceChecker, DocumentStructureChecker, TableFigureChecker,
                TrackChangesChecker, ConsistencyChecker, ListFormattingChecker
            )
            self.checkers['references'] = ReferenceChecker()
            self.checkers['document_structure'] = DocumentStructureChecker()
            self.checkers['tables_figures'] = TableFigureChecker()
            self.checkers['track_changes'] = TrackChangesChecker()
            self.checkers['consistency'] = ConsistencyChecker()
            self.checkers['lists'] = ListFormattingChecker()
        except ImportError as e:
            _log(f" Document checkers not available: {e}")
        
        try:
            from acronym_checker import AcronymChecker
            self.checkers['acronyms'] = AcronymChecker()
        except ImportError as e:
            _log(f" Acronym checker not available: {e}")
        
        try:
            from sentence_checker import SentenceChecker
            self.checkers['sentence_length'] = SentenceChecker()
        except ImportError as e:
            _log(f" Sentence checker not available: {e}")
        
        try:
            from punctuation_checker import PunctuationChecker
            self.checkers['punctuation'] = PunctuationChecker()
        except ImportError as e:
            _log(f" Punctuation checker not available: {e}")
        
        # =====================================================================
        # v2.4.0 ENHANCED CHECKERS (Executive-Ready)
        # =====================================================================
        
        # Comprehensive Hyperlink Checker (all verification types)
        try:
            from comprehensive_hyperlink_checker import ComprehensiveHyperlinkChecker
            self.checkers['hyperlinks'] = ComprehensiveHyperlinkChecker()
            _log(" Loaded comprehensive hyperlink checker v3.0")
        except ImportError:
            try:
                from hyperlink_checker import HyperlinkChecker
                self.checkers['hyperlinks'] = HyperlinkChecker()
                _log(" Loaded hyperlink checker (fallback)")
            except ImportError as e:
                _log(f" Hyperlink checker not available: {e}")
        
        # Word-Integrated Language Checker (spell + grammar)
        try:
            from word_language_checker import WordLanguageChecker
            self.checkers['language'] = WordLanguageChecker()
            _log(" Loaded Word-integrated language checker")
        except ImportError:
            # Fallback to separate checkers
            try:
                from spell_checker import EnhancedSpellChecker
                self.checkers['spelling'] = EnhancedSpellChecker()
                _log(" Loaded enhanced spell checker (fallback)")
            except ImportError as e:
                _log(f" Spell checker not available: {e}")
            
            try:
                from enhanced_grammar_checker import EnhancedGrammarChecker
                self.checkers['grammar'] = EnhancedGrammarChecker()
                _log(" Loaded enhanced grammar checker (fallback)")
            except ImportError as e:
                _log(f" Grammar checker not available: {e}")
        
        # Document Comparison Checker
        try:
            from document_comparison_checker import DocumentComparisonChecker
            self.checkers['comparison'] = DocumentComparisonChecker()
            _log(" Loaded document comparison checker")
        except ImportError as e:
            _log(f" Document comparison checker not available: {e}")
        
        # Image/Figure Checker
        try:
            from image_figure_checker import ImageFigureChecker
            self.checkers['images'] = ImageFigureChecker()
            _log(" Loaded image/figure checker")
        except ImportError as e:
            _log(f" Image/figure checker not available: {e}")
        
        # =====================================================================
        # END v2.4.0 ENHANCED CHECKERS
        # =====================================================================
        
        # v2.2 Extended Checkers (consolidated module)
        try:
            from extended_checkers import get_all_v22_checkers
            v22_checkers = get_all_v22_checkers()
            self.checkers.update(v22_checkers)
            _log(f" Loaded {len(v22_checkers)} extended v2.2 checkers")
        except ImportError as e:
            _log(f" Extended v2.2 checkers not available: {e}")

        # v3.0.114: Load ComprehensiveHyperlinkChecker AFTER extended_checkers
        # to override the basic HyperlinkChecker with the enhanced version
        # that supports get_validation_results() for the Hyperlink Status Panel
        try:
            from comprehensive_hyperlink_checker import ComprehensiveHyperlinkChecker
            self.checkers['hyperlinks'] = ComprehensiveHyperlinkChecker()
            _log(" Loaded comprehensive hyperlink checker v3.0 (override)")
        except ImportError:
            _log(" ComprehensiveHyperlinkChecker not available, using basic")

        # =====================================================================
        # ROLE EXTRACTION INTEGRATION (v1.0.0)
        # =====================================================================
        try:
            from role_integration import RoleChecker
            self.checkers['roles'] = RoleChecker()
            _log(f" Loaded RoleChecker for role/responsibility extraction")
        except ImportError as e:
            _log(f" RoleChecker not available: {e}")

        # =====================================================================
        # NLP ENHANCED CHECKERS (v3.1.0)
        # =====================================================================
        # Load NLP-enhanced checkers if available
        # These provide advanced linguistic analysis beyond pattern matching
        self._nlp_checkers = {}
        self._nlp_available = False
        try:
            import nlp
            self._nlp_available = True
            nlp_checker_classes = nlp.get_available_checkers()
            for checker_class in nlp_checker_classes:
                try:
                    checker = checker_class()
                    checker_name = f"nlp_{checker.CHECKER_NAME.lower().replace(' ', '_').replace('/', '_')}"
                    self._nlp_checkers[checker_name] = checker
                    _log(f" Loaded NLP checker: {checker.CHECKER_NAME}")
                except Exception as e:
                    _log(f" Failed to load NLP checker {checker_class}: {e}")
            _log(f" Loaded {len(self._nlp_checkers)} NLP-enhanced checkers")
        except ImportError:
            _log(" NLP package not available - enhanced checks disabled")
        except Exception as e:
            _log(f" NLP initialization error: {e}")
    
    # Boilerplate patterns to filter out
    BOILERPLATE_PATTERNS = [
        r'^\s*Copyright\s*[©®]?\s*\d{4}',
        r'^\s*All rights reserved',
        r'^\s*No part of this publication',
        r'^\s*Page\s*\d+\s*(of|/)\s*\d+',
        r'^\s*EFFECTIVE\s*DATE\s*[:=]',
        r'^\s*REVIEW\s*DATE\s*[:=]',
        r'^\s*Issued\s+\d{4}',
        r'^\s*Revised\s+\d{4}',
        r'^\s*Superseding\s+',
        r'^\s*Licensee\s*=',
        r'^\s*No reproduction',
        r'^\s*Not for Resale',
        r'^\s*TO PLACE.*ORDER',
        r'^\s*Tel:\s*[\d\-\(\)\s\+]+$',
        r'^\s*Fax:\s*[\d\-\(\)\s\+]+$',
        r'^\s*Email:\s*\S+@\S+',
        r'^\s*Document Owner',
        r'^\s*Applies To:',
        r'^\s*Prepared by.*Committee',
        r'www\.\w+\.(com|org|gov)',
        r'https?://\S+',
        r'^\s*SAE\s+(INTERNATIONAL|International)',
        r'provided by IHS',
        r'without license from',
        r'^\s*--[`,\-]+--',  # PDF artifacts
        r'^\s*NOTE\s*\d+\s*:',  # Note sections often have intentional vague language
        r'^\s*RATIONALE\s*$',
        r'^\s*TABLE OF CONTENTS',
        r'^\.\.\.\.*\d+$',  # TOC page numbers
        r'^\s*\d+\.\d+\s*\.\.\.',  # TOC entries
    ]
    
    # Section headers that indicate special content (acronyms, definitions, etc.)
    SPECIAL_SECTION_HEADERS = [
        r'^\s*\d*\.?\d*\s*(ACRONYMS?|ABBREVIATIONS?)\s*$',
        r'^\s*\d*\.?\d*\s*(DEFINITIONS?|GLOSSARY)\s*$',
        r'^\s*\d*\.?\d*\s*(TERMS?\s+AND\s+DEFINITIONS?)\s*$',
        r'^\s*\d*\.?\d*\s*(APPLICABLE\s+DOCUMENTS?|REFERENCES?)\s*$',
    ]
    
    def _detect_special_sections(self, paragraphs: List[Tuple[int, str]]) -> Dict[str, List[int]]:
        """
        Detect special sections like Acronyms, Definitions, References.
        Returns dict mapping section type to list of paragraph indices in that section.
        """
        special_sections = {
            'acronyms': [],
            'definitions': [],
            'references': [],
        }
        
        header_patterns = [re.compile(p, re.IGNORECASE) for p in self.SPECIAL_SECTION_HEADERS]
        
        # Pattern to detect any major section header
        major_section_pattern = re.compile(r'^\s*(\d+(?:\.\d+)?)\s+[A-Z][A-Za-z\s]+$')
        
        current_section = None
        current_section_num = None
        
        for idx, text in paragraphs:
            text_stripped = text.strip()
            
            # Check if this is a special section header
            is_special_header = False
            for pattern in header_patterns:
                if pattern.match(text_stripped):
                    is_special_header = True
                    text_lower = text_stripped.lower()
                    if 'acronym' in text_lower or 'abbreviation' in text_lower:
                        current_section = 'acronyms'
                    elif 'definition' in text_lower or 'glossary' in text_lower or 'terms' in text_lower:
                        current_section = 'definitions'
                    elif 'reference' in text_lower or 'document' in text_lower:
                        current_section = 'references'
                    
                    # Get section number
                    num_match = re.match(r'^\s*(\d+(?:\.\d+)?)', text_stripped)
                    if num_match:
                        current_section_num = num_match.group(1)
                    break
            
            # Check if we've hit a new major section (exits special section)
            if not is_special_header and current_section:
                new_section_match = major_section_pattern.match(text_stripped)
                if new_section_match:
                    new_num = new_section_match.group(1)
                    # If new section is at same or higher level, exit current special section
                    if current_section_num:
                        curr_level = current_section_num.count('.') + 1
                        new_level = new_num.count('.') + 1
                        if new_level <= curr_level:
                            current_section = None
                            current_section_num = None
            
            # Add paragraph to current special section
            if current_section and current_section in special_sections:
                special_sections[current_section].append(idx)
        
        return special_sections
    
    def _filter_boilerplate(self, paragraphs: List[Tuple[int, str]]) -> List[Tuple[int, str]]:
        """Filter out boilerplate/disclaimer paragraphs."""
        compiled = [re.compile(p, re.IGNORECASE) for p in self.BOILERPLATE_PATTERNS]
        
        filtered = []
        for idx, text in paragraphs:
            if not text or len(text.strip()) < 5:
                continue
            
            is_boilerplate = False
            for pattern in compiled:
                if pattern.search(text):
                    is_boilerplate = True
                    break
            
            if not is_boilerplate:
                filtered.append((idx, text))
        
        return filtered
    
    def review_document(self, filepath: str, options: Dict = None, 
                        progress_callback: Callable = None,
                        cancellation_check: Callable = None) -> Dict:
        """
        Perform comprehensive review of a document.
        
        Args:
            filepath: Path to the document file (.docx or .pdf)
            options: Dictionary of review options (which checks to run)
            progress_callback: Optional callback for progress updates.
                               Signature: callback(phase: str, progress: float, message: str)
                               Phases: 'extracting', 'parsing', 'checking', 'postprocessing', 'complete'
            cancellation_check: Optional callback to check if job was cancelled.
                                Signature: check() -> bool (returns True if cancelled)
        
        Returns:
            Dictionary with review results
            
        v3.0.39: Added progress_callback and cancellation_check for job-based review.
        """
        options = options or {}
        self.issues = []
        
        # Helper to report progress
        def report_progress(phase: str, progress: float, message: str):
            if progress_callback:
                try:
                    progress_callback(phase, progress, message)
                except Exception as e:
                    _log(f" Progress callback error: {e}")
        
        # Helper to check cancellation
        def is_cancelled() -> bool:
            if cancellation_check:
                try:
                    return cancellation_check()
                except Exception:
                    return False
            return False
        
        # Initialize PDF quality info (will be populated for PDF files)
        pdf_quality_info = None
        
        # Report: Starting extraction phase
        report_progress('extracting', 0, 'Starting document extraction...')
        
        # Check for cancellation before expensive operations
        if is_cancelled():
            return {'success': False, 'error': 'Operation cancelled', 'cancelled': True}
        
        # Determine file type and use appropriate extractor
        filepath_lower = filepath.lower()
        extractor = None
        docling_used = False
        
        # =====================================================================
        # TRY DOCLING FIRST (v3.0.91+) - Superior AI-powered extraction
        # Falls back to legacy extractors if Docling unavailable
        # =====================================================================
        if filepath_lower.endswith(('.pdf', '.docx', '.pptx', '.xlsx', '.html', '.htm')):
            try:
                from docling_extractor import DoclingExtractor
                docling = DoclingExtractor(fallback_to_legacy=False)
                
                if docling.is_available:
                    _log(f"Using Docling ({docling.backend_name}) for extraction...")
                    doc_result = docling.extract(filepath)
                    
                    # Create adapter to match legacy extractor interface
                    class DoclingAdapter:
                        def __init__(self, result):
                            # v3.0.113: Fixed paragraph format - should be (idx, text) tuples
                            self.paragraphs = [(i, p.text) for i, p in enumerate(result.paragraphs)]

                            # v3.0.113: Enhanced table format with all expected keys
                            self.tables = [
                                {
                                    'start_para': 0,
                                    'number': i + 1,
                                    'rows': [t.headers] + t.rows if t.headers else t.rows,
                                    'is_acronym_table': any(
                                        kw in ' '.join(t.headers).lower()
                                        for kw in ['acronym', 'abbreviation', 'definition']
                                    ) if t.headers else False,
                                    'has_caption': bool(t.caption),
                                    'empty_cells': sum(1 for row in t.rows for cell in row if not cell.strip())
                                }
                                for i, t in enumerate(result.tables)
                            ]

                            self.figures = []  # Docling images disabled for memory
                            self.full_text = result.full_text

                            # v3.0.113: Fixed headings format - must be dicts, not tuples
                            # Format: {'index': para_idx, 'text': title, 'style': 'Heading N', 'level': N}
                            self.headings = [
                                {
                                    'index': i,
                                    'text': s.title,
                                    'style': f'Heading {s.level}',
                                    'level': s.level
                                }
                                for i, s in enumerate(result.sections)
                            ]

                            self.page_count = result.page_count
                            self.track_changes = []
                            self.comments = []

                            # v3.0.113: Added missing attributes for compatibility
                            self.has_toc = any('contents' in s.title.lower() for s in result.sections)
                            self.sections = {s.title: i for i, s in enumerate(result.sections)}
                            self.word_count = result.word_count

                            # v3.0.113: Build page_map from paragraph page numbers
                            self.page_map = {
                                i: p.page_number for i, p in enumerate(result.paragraphs)
                            }
                    
                    extractor = DoclingAdapter(doc_result)
                    docling_used = True
                    _log(f"Docling extracted: {doc_result.page_count} pages, "
                         f"{len(doc_result.paragraphs)} paragraphs, "
                         f"{len(doc_result.tables)} tables ({doc_result.extraction_time_ms:.0f}ms)")
                    
            except Exception as e:
                _log(f"Docling extraction failed, using legacy: {e}", level='debug')
                extractor = None
        
        # =====================================================================
        # LEGACY EXTRACTION (fallback)
        # =====================================================================
        if extractor is None:
            if filepath_lower.endswith('.pdf'):
                # Use PDF extractor (v2 preferred, v1 fallback)
                try:
                    # Try v2 first for enhanced features
                    try:
                        from pdf_extractor_v2 import PDFExtractorV2, is_pdf_available, get_pdf_capabilities
                        if not is_pdf_available():
                            raise ImportError("No PDF library available")
                        extractor = PDFExtractorV2(filepath, analyze_quality=True)
                        pdf_quality_info = extractor.get_quality_summary()
                        _log(f" Extracted PDF (v2): {extractor.page_count} pages, {len(extractor.paragraphs)} paragraphs, quality={pdf_quality_info.get('quality', 'unknown')}")
                    except ImportError:
                        # Fall back to v1
                        from pdf_extractor import PDFExtractor, is_pdf_available
                        if not is_pdf_available():
                            raise ImportError("No PDF library available")
                        extractor = PDFExtractor(filepath)
                        _log(f" Extracted PDF (v1): {extractor.page_count} pages, {len(extractor.paragraphs)} paragraphs")
                except ImportError as e:
                    raise ValueError(f"PDF support not available: {e}. Install pymupdf, pdfplumber, or pypdf.")
            elif filepath_lower.endswith('.docx'):
                # Use Word document extractor
                extractor = DocumentExtractor(filepath)
            else:
                # Try to detect file type by content
                try:
                    with open(filepath, 'rb') as f:
                        header = f.read(8)
                        if header.startswith(b'%PDF'):
                            # Try v2 first, fall back to v1
                            try:
                                from pdf_extractor_v2 import PDFExtractorV2
                                extractor = PDFExtractorV2(filepath, analyze_quality=True)
                                pdf_quality_info = extractor.get_quality_summary()
                            except ImportError:
                                from pdf_extractor import PDFExtractor
                                extractor = PDFExtractor(filepath)
                        elif header.startswith(b'PK'):  # ZIP header (docx)
                            extractor = DocumentExtractor(filepath)
                        else:
                            raise ValueError(f"Unsupported file type: {filepath}")
                except Exception as e:
                    raise ValueError(f"Could not determine file type: {e}")
        
        # Filter out boilerplate paragraphs
        filtered_paragraphs = self._filter_boilerplate(extractor.paragraphs)
        
        # Report: Extraction complete, starting parsing
        report_progress('extracting', 100, 'Document extracted successfully')
        report_progress('parsing', 0, 'Parsing document structure...')
        
        # Check for cancellation
        if is_cancelled():
            return {'success': False, 'error': 'Operation cancelled', 'cancelled': True}
        
        # Detect special sections (acronyms, definitions, references)
        special_sections = self._detect_special_sections(extractor.paragraphs)
        
        # Calculate readability metrics
        self.readability = self.readability_calc.calculate(extractor.full_text)
        
        # Report: Parsing complete
        report_progress('parsing', 100, 'Document structure parsed')
        
        # v3.0.109: Read hyperlink validation mode from config
        hyperlink_validation_mode = 'validator'  # Default to online/connected mode
        try:
            import json
            from pathlib import Path
            config_file = Path(__file__).parent / 'config.json'
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    hyperlink_validation_mode = user_config.get('hyperlink_settings', {}).get('validation_mode', 'validator')
                    _log(f" [v3.0.109] Hyperlink validation mode from config: {hyperlink_validation_mode}")
        except Exception as e:
            _log(f" Could not read hyperlink config: {e}")

        # Build common kwargs for all checkers
        common_kwargs = {
            'paragraphs': filtered_paragraphs,  # Use filtered paragraphs
            'tables': extractor.tables,
            'figures': extractor.figures,
            'full_text': extractor.full_text,
            'filepath': filepath,
            'headings': extractor.headings,
            'track_changes': getattr(extractor, 'track_changes', []),
            'comments': getattr(extractor, 'comments', []),
            'raw_paragraphs': extractor.paragraphs,  # Keep original for reference
            'special_sections': special_sections,  # For checkers to skip definition sections
            # v3.0.94: Add page_map for rich context generation
            'page_map': getattr(extractor, 'page_map', {}),
            # v3.0.109: Pass hyperlink validation mode to checkers
            'validation_mode': 'connected' if hyperlink_validation_mode == 'validator' else 'restricted',
        }
        _log(f" [v3.0.109] Passing validation_mode='{common_kwargs['validation_mode']}' to checkers")
        
        # Map option names to checker names
        option_mapping = {
            'check_spelling': None,  # Handled separately if Word COM available
            'check_grammar': 'grammar',
            'check_acronyms': 'acronyms',
            'check_passive_voice': 'passive_voice',
            'check_weak_language': 'weak_language',
            'check_wordy_phrases': 'wordy_phrases',
            'check_nominalization': 'nominalization',
            'check_jargon': 'jargon',
            'check_ambiguous_pronouns': 'ambiguous_pronouns',
            'check_requirements_language': 'requirements_language',
            'check_gender_language': 'gender_language',
            'check_punctuation': 'punctuation',
            'check_sentence_length': 'sentence_length',
            'check_repeated_words': 'repeated_words',
            'check_capitalization': 'capitalization',
            'check_contractions': 'contractions',
            'check_references': 'references',
            'check_document_structure': 'document_structure',
            'check_tables_figures': 'tables_figures',
            'check_track_changes': 'track_changes',
            'check_consistency': 'consistency',
            'check_lists': 'lists',
            # NEW: Add v2.2 checkers to option mapping so they respect checkboxes
            'check_tbd': 'tbd',
            'check_testability': 'testability',
            'check_atomicity': 'atomicity',
            'check_escape_clauses': 'escape_clauses',
            'check_hyperlinks': 'hyperlinks',
            'check_orphan_headings': 'orphan_headings',
            'check_empty_sections': 'empty_sections',
        }
        
        # Build list of enabled checkers first for progress tracking
        enabled_checkers = []
        for option_name, checker_name in option_mapping.items():
            if checker_name is None:
                continue
            if not options.get(option_name, True):
                continue
            if self.checkers.get(checker_name):
                enabled_checkers.append(checker_name)
        
        # Add additional checkers that exist
        additional_checkers = [
            'units', 'number_format', 'terminology',
            'redundancy', 'hyphenation', 'serial_comma', 'enhanced_references',
            'hedging', 'weasel_words', 'cliches', 'dangling_modifiers',
            'run_on_sentences', 'sentence_fragments', 'parallel_structure',
            'mil_std', 'do178', 'accessibility'
        ]
        already_handled = set(option_mapping.values()) - {None}
        for checker_name in additional_checkers:
            if checker_name in already_handled:
                continue
            if self.checkers.get(checker_name):
                enabled_checkers.append(checker_name)
        
        total_checkers = len(enabled_checkers)
        checkers_completed = 0
        
        # Report: Starting checker phase
        report_progress('checking', 0, f'Running quality checks (0/{total_checkers})...')
        
        # Run each enabled checker with progress tracking
        for checker_name in enabled_checkers:
            # Check for cancellation before each checker
            if is_cancelled():
                return {'success': False, 'error': 'Operation cancelled', 'cancelled': True}
            
            checker = self.checkers.get(checker_name)
            if checker:
                try:
                    checker_issues = checker.safe_check(**common_kwargs)
                    self.issues.extend(checker_issues)
                except Exception as e:
                    _log(f" Error in {checker_name}: {e}")
            
            checkers_completed += 1
            progress_pct = (checkers_completed / max(1, total_checkers)) * 100
            report_progress('checking', progress_pct, f'Running {checker_name}... ({checkers_completed}/{total_checkers})')
        
        # Report: Checker phase complete
        report_progress('checking', 100, f'Quality checks complete ({total_checkers} checkers)')

        # =====================================================================
        # NLP ENHANCED CHECKS (v3.1.0)
        # =====================================================================
        # Run NLP-enhanced checkers if available and enabled
        nlp_metrics = {}
        if self._nlp_available and options.get('check_nlp', True):
            nlp_checker_count = len(self._nlp_checkers)
            nlp_completed = 0

            report_progress('checking', 0, f'Running NLP checks (0/{nlp_checker_count})...')

            for checker_name, checker in self._nlp_checkers.items():
                # Check for cancellation
                if is_cancelled():
                    return {'success': False, 'error': 'Operation cancelled', 'cancelled': True}

                try:
                    # Run the NLP checker
                    result = checker.check(filtered_paragraphs, full_text=extractor.full_text)

                    # Collect metrics from the checker
                    if result.metrics:
                        nlp_metrics[checker_name] = result.metrics

                    # Convert NLP issues to legacy format and add to issues
                    if result.success and result.issues:
                        from nlp.base import convert_to_legacy_issue
                        for nlp_issue in result.issues:
                            legacy_issue = convert_to_legacy_issue(nlp_issue)
                            self.issues.append(legacy_issue)
                        _log(f" NLP checker {checker_name}: {len(result.issues)} issues")
                    elif not result.success:
                        _log(f" NLP checker {checker_name} failed: {result.error}")

                except Exception as e:
                    _log(f" Error in NLP checker {checker_name}: {e}")

                nlp_completed += 1
                progress_pct = (nlp_completed / max(1, nlp_checker_count)) * 100
                report_progress('checking', progress_pct, f'Running NLP: {checker_name}... ({nlp_completed}/{nlp_checker_count})')

            _log(f" NLP checks complete: {nlp_checker_count} checkers, {len(nlp_metrics)} metrics")

        # v3.0.95: Capture hyperlink validation results if hyperlink checker was run
        hyperlink_results = None
        try:
            hyperlink_checker = self.checkers.get('hyperlinks')
            if hyperlink_checker and hasattr(hyperlink_checker, 'get_validation_results'):
                validation_results = hyperlink_checker.get_validation_results()
                if validation_results:
                    hyperlink_results = {
                        'total': len(validation_results),
                        'valid': sum(1 for r in validation_results if r.is_valid),
                        'invalid': sum(1 for r in validation_results if not r.is_valid),
                        'links': [
                            {
                                'url': r.url,
                                'link_text': r.link_text,
                                'is_valid': r.is_valid,
                                'status_code': r.status_code,
                                'error': r.error_message,
                                'link_type': r.link_type.value if hasattr(r.link_type, 'value') else str(r.link_type),
                                'response_time_ms': r.response_time_ms
                            }
                            for r in validation_results[:100]  # Limit to 100 for UI performance
                        ]
                    }
                    _log(f" Captured {hyperlink_results['total']} hyperlink validation results")
        except Exception as e:
            _log(f" Error capturing hyperlink results: {e}")
        
        # Check for cancellation before postprocessing
        if is_cancelled():
            return {'success': False, 'error': 'Operation cancelled', 'cancelled': True}
        
        # Report: Starting postprocessing phase
        report_progress('postprocessing', 0, 'Post-processing results...')
        
        # Deduplicate issues (same paragraph + same message = duplicate)
        self.issues = self._deduplicate_issues(self.issues)
        
        # Generate stable issue IDs based on content hash
        self._assign_issue_ids()
        
        # v3.0.94: Enhance issues with rich context (page, section, full sentence)
        try:
            from context_utils import ContextBuilder, enhance_issue_context
            context_builder = ContextBuilder(
                paragraphs=filtered_paragraphs,
                page_map=getattr(extractor, 'page_map', {}),
                headings=extractor.headings,
                full_text=extractor.full_text
            )
            for issue in self.issues:
                try:
                    enhance_issue_context(issue, context_builder)
                except Exception as ctx_err:
                    _log(f" Context enhancement error for issue: {ctx_err}")
        except ImportError:
            _log(" context_utils not available, skipping context enhancement")
        except Exception as e:
            _log(f" Context enhancement error: {e}")
        
        report_progress('postprocessing', 30, 'Calculating metrics...')
        
        # v3.0.33: Capture acronym metrics if available
        acronym_metrics = None
        try:
            acronym_checker = self.checkers.get('acronyms')
            if acronym_checker and hasattr(acronym_checker, 'get_metrics'):
                acronym_metrics = acronym_checker.get_metrics()
        except Exception as e:
            _log(f" Error getting acronym metrics: {e}")
        
        # Calculate score and grade
        score = self._calculate_score()
        grade = self._calculate_grade(score)
        
        report_progress('postprocessing', 50, 'Extracting roles...')
        
        # =====================================================================
        # ROLE EXTRACTION (Optional - adds role data to results)
        # =====================================================================
        role_data = None
        try:
            from role_integration import RoleIntegration
            role_integration = RoleIntegration()
            if role_integration.is_available():
                role_data = role_integration.extract_roles(
                    filepath, 
                    extractor.full_text, 
                    filtered_paragraphs,
                    store_in_database=False  # Set True to use shared database
                )
                # Add role issues to main issues list
                if role_data.get('success') and role_data.get('issues'):
                    self.issues.extend(role_data['issues'])
                    # Recalculate after adding role issues
                    self.issues = self._deduplicate_issues(self.issues)
                    score = self._calculate_score()
                    grade = self._calculate_grade(score)
        except ImportError:
            pass  # Role extraction not available
        except Exception as e:
            _log(f" Role extraction error: {e}")
        
        report_progress('postprocessing', 80, 'Finalizing statistics...')
        
        # v2.9.2 E2-E5: Enhanced dashboard statistics
        enhanced_stats = self._calculate_enhanced_stats(extractor)
        
        # Report: Complete
        report_progress('postprocessing', 100, 'Post-processing complete')
        report_progress('complete', 100, f'Review complete: {len(self.issues)} issues found')
        
        return {
            'success': True,
            'filepath': filepath,
            'word_count': extractor.word_count,
            'paragraph_count': len(extractor.paragraphs),
            'table_count': len(extractor.tables),
            'figure_count': len(extractor.figures),
            'existing_comments': len(extractor.comments),
            'track_changes_count': len(extractor.track_changes),
            'issues': self.issues,
            'issue_count': len(self.issues),
            'score': score,
            'grade': grade,
            'by_severity': self._count_by_severity(),
            'by_category': self._count_by_category(),
            'readability': {
                'flesch_reading_ease': round(self.readability.flesch_reading_ease, 1),
                'flesch_kincaid_grade': round(self.readability.flesch_kincaid_grade, 1),
                'gunning_fog_index': round(self.readability.gunning_fog_index, 1),
                'avg_words_per_sentence': round(self.readability.avg_words_per_sentence, 1),
                'avg_syllables_per_word': round(self.readability.avg_syllables_per_word, 2),
                'complex_word_percentage': round(
                    100 * self.readability.complex_word_count / max(1, self.readability.word_count), 1
                )
            },
            'document_info': {
                'has_toc': extractor.has_toc,
                'heading_count': len(extractor.headings),
                'section_count': len(extractor.sections)
            },
            'pdf_quality': pdf_quality_info,  # NEW: PDF quality assessment (null for DOCX)
            'roles': role_data,  # Role extraction results
            'enhanced_stats': enhanced_stats,  # v2.9.2: Dashboard supercharge data
            'acronym_metrics': acronym_metrics,  # v3.0.33: Acronym checker transparency metrics
            'hyperlink_results': hyperlink_results,  # v3.0.95: Hyperlink validation results
            'nlp_metrics': nlp_metrics if nlp_metrics else None,  # v3.1.0: NLP checker metrics
            # v3.0.106: Add paragraph data for Fix Assistant v2 Document Viewer
            'paragraphs': filtered_paragraphs,  # List of (idx, text) tuples
            'page_map': getattr(extractor, 'page_map', {}),  # {para_idx: page_num}
            'headings': extractor.headings,  # List of heading dicts
            # v3.0.110: Add full_text for Document Comparison feature
            'full_text': extractor.full_text,
        }
    
    def _calculate_score(self) -> int:
        """
        Calculate document quality score.
        
        v2.9.4: Rebalanced scoring algorithm to be more realistic and useful.
        Previous algorithm was too harsh, giving nearly 0 scores to most documents.
        
        New scoring philosophy:
        - 90-100: Excellent (very few minor issues)
        - 70-89:  Good (some issues, nothing critical)
        - 50-69:  Needs Work (multiple issues, some high severity)
        - 30-49:  Poor (many issues, critical items present)
        - 0-29:   Critical (severe problems throughout)
        """
        if not self.issues:
            return 100
        
        # Reduced severity weights for more forgiving scores
        weights = {
            'Critical': 15,  # Was 25
            'High': 5,       # Was 10
            'Medium': 2,     # Was 5
            'Low': 0.5,      # Was 2
            'Info': 0.1      # Was 0.5
        }
        
        total_deduction = sum(weights.get(issue.get('severity', 'Low'), 0.5) for issue in self.issues)
        
        # Logarithmic scale for gradual decrease
        # This prevents scores from immediately dropping to 0
        import math
        
        # Normalize by issue count to prevent large documents from being unfairly penalized
        # More issues = larger denominator = less impact per issue
        issue_count = len(self.issues)
        if issue_count > 20:
            # Large docs: use diminishing returns
            normalized_deduction = total_deduction / math.log10(issue_count + 1)
        else:
            normalized_deduction = total_deduction
        
        # Cap maximum deduction and apply gradual scaling
        # Every 20 points of normalized deduction = -10 score
        # Max deduction capped at 80 (minimum score of 20 unless truly terrible)
        deduction = min(80, normalized_deduction / 2)
        
        score = max(0, min(100, int(100 - deduction)))
        
        return score
    
    def _deduplicate_issues(self, issues: List[Dict]) -> List[Dict]:
        """Remove duplicate issues based on paragraph index and message."""
        seen = set()
        unique = []
        
        for issue in issues:
            # Create a unique key from paragraph index, category, and core message
            para_idx = issue.get('paragraph_index', 0)
            category = issue.get('category', '')
            flagged = issue.get('flagged_text', '')[:50]  # First 50 chars
            message = issue.get('message', '')[:50]
            
            key = (para_idx, category, flagged, message)
            
            if key not in seen:
                seen.add(key)
                unique.append(issue)
        
        return unique
    
    def _assign_issue_ids(self):
        """
        Assign stable unique IDs to issues based on content hash.
        
        IDs are deterministic: same issue content = same ID, even after
        sort/filter operations. This enables reliable selection tracking.
        """
        import hashlib
        
        for i, issue in enumerate(self.issues):
            # Create deterministic ID from issue content
            id_parts = [
                str(issue.get('paragraph_index', 0)),
                issue.get('category', ''),
                issue.get('severity', ''),
                issue.get('message', '')[:100],
                issue.get('flagged_text', '')[:50]
            ]
            content_hash = hashlib.md5('|'.join(id_parts).encode()).hexdigest()[:12]
            issue['issue_id'] = f"ISS-{content_hash}"
    
    def _calculate_grade(self, score: int) -> str:
        """Convert score to letter grade."""
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
    
    def _count_by_severity(self) -> Dict[str, int]:
        """Count issues by severity."""
        counts = {}
        for issue in self.issues:
            sev = issue.get('severity', 'Unknown')
            counts[sev] = counts.get(sev, 0) + 1
        return counts
    
    def _count_by_category(self) -> Dict[str, int]:
        """Count issues by category."""
        counts = {}
        for issue in self.issues:
            cat = issue.get('category', 'Unknown')
            counts[cat] = counts.get(cat, 0) + 1
        return counts
    
    def _calculate_enhanced_stats(self, extractor) -> Dict:
        """
        v2.9.2 E2-E5: Calculate enhanced statistics for dashboard supercharge.
        
        Returns comprehensive data for:
        - E2: Enhanced severity distribution with trends
        - E3: Roles detected summary with confidence
        - E4: Auto-detected document type
        - E5: Document health weighted scoring
        """
        from collections import Counter
        
        # E2: Severity distribution with additional metrics
        severity_dist = self._count_by_severity()
        severity_weights = {'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Info': 0.5}
        weighted_severity = sum(
            count * severity_weights.get(sev, 1) 
            for sev, count in severity_dist.items()
        )
        
        # E3: Role summary from extracted roles
        role_summary = {
            'total_unique': 0,
            'high_confidence': 0,
            'low_confidence': 0,
            'top_roles': []
        }
        if hasattr(self, '_role_data') and self._role_data:
            roles = self._role_data.get('roles', {})
            role_summary['total_unique'] = len(roles)
            for role_name, role_info in roles.items():
                conf = role_info.get('avg_confidence', 0.5) if isinstance(role_info, dict) else 0.5
                if conf >= 0.7:
                    role_summary['high_confidence'] += 1
                else:
                    role_summary['low_confidence'] += 1
            # Top 5 roles by frequency
            if roles:
                sorted_roles = sorted(
                    roles.items(), 
                    key=lambda x: x[1].get('frequency', 1) if isinstance(x[1], dict) else 1,
                    reverse=True
                )[:5]
                role_summary['top_roles'] = [
                    {'name': r[0], 'count': r[1].get('frequency', 1) if isinstance(r[1], dict) else 1}
                    for r in sorted_roles
                ]
        
        # E4: Auto-detect document type based on content patterns
        doc_type = self._detect_document_type(extractor)
        
        # E5: Weighted document health score
        health_score = self._calculate_health_score(extractor, weighted_severity)
        
        # Category hotspots (top 3 categories by issue count)
        category_counts = self._count_by_category()
        top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Issue density (issues per 1000 words)
        word_count = extractor.word_count or 1
        issue_density = round((len(self.issues) / word_count) * 1000, 2)
        
        return {
            'severity_weighted_total': round(weighted_severity, 1),
            'issue_density_per_1k_words': issue_density,
            'top_categories': [{'name': c[0], 'count': c[1]} for c in top_categories],
            'role_summary': role_summary,
            'detected_doc_type': doc_type,
            'health_score': health_score,
            'critical_count': severity_dist.get('Critical', 0),
            'fixable_count': sum(1 for i in self.issues if i.get('suggestion') and i.get('suggestion') != '-'),
            'paragraphs_with_issues': len(set(i.get('paragraph_index', 0) for i in self.issues)),
            'clean_paragraphs': len(extractor.paragraphs) - len(set(i.get('paragraph_index', 0) for i in self.issues))
        }
    
    def _detect_document_type(self, extractor) -> Dict:
        """
        v2.9.2 E4: Auto-detect document type based on content patterns.
        """
        full_text = ' '.join(p[1] for p in extractor.paragraphs[:50]).lower()  # First 50 paragraphs
        
        doc_types = {
            'requirements': {
                'patterns': ['shall', 'requirement', 'specification', 'traceability', 'compliance'],
                'weight': 0
            },
            'design': {
                'patterns': ['architecture', 'design', 'interface', 'component', 'module', 'diagram'],
                'weight': 0
            },
            'test': {
                'patterns': ['test case', 'test procedure', 'verification', 'validation', 'pass/fail'],
                'weight': 0
            },
            'plan': {
                'patterns': ['schedule', 'milestone', 'resource', 'risk', 'budget', 'objective'],
                'weight': 0
            },
            'report': {
                'patterns': ['analysis', 'findings', 'conclusion', 'recommendation', 'summary'],
                'weight': 0
            },
            'procedure': {
                'patterns': ['step', 'procedure', 'instruction', 'process', 'workflow'],
                'weight': 0
            }
        }
        
        for doc_type, info in doc_types.items():
            for pattern in info['patterns']:
                if pattern in full_text:
                    info['weight'] += 1
        
        # Find best match
        best_match = max(doc_types.items(), key=lambda x: x[1]['weight'])
        confidence = min(1.0, best_match[1]['weight'] / 3)  # 3+ matches = 100% confidence
        
        return {
            'type': best_match[0] if best_match[1]['weight'] > 0 else 'general',
            'confidence': round(confidence, 2),
            'indicators': best_match[1]['weight']
        }
    
    def _calculate_health_score(self, extractor, weighted_severity: float) -> Dict:
        """
        v2.9.9: Rebalanced document health score for technical documentation (#15).
        
        Components (rebalanced):
        - Issue severity impact (50%) - Primary driver, but with logarithmic scaling
        - Readability score (15%) - Adjusted for technical docs (FK 12-16 is normal)
        - Structure score (20%) - Reasonable structure expectations
        - Completeness score (15%) - Basic document completeness
        
        Technical documents typically have higher FK grades (12-16) which is
        appropriate and should not be penalized.
        """
        # Base: Start at 50, deduct based on issues with logarithmic scaling
        # This prevents small issue counts from tanking the score
        max_severity_impact = 50
        # Logarithmic scaling: ln(1 + weighted/20) * 25
        # 0 issues = 50, 20 weighted = ~41, 100 weighted = ~26, 400 weighted = ~0
        import math
        if weighted_severity > 0:
            severity_deduction = min(max_severity_impact, math.log1p(weighted_severity / 20) * 25)
        else:
            severity_deduction = 0
        severity_score = max(0, max_severity_impact - severity_deduction)
        
        # Readability: 0-15 points - Adjusted for technical documentation
        # Technical docs typically score FK 12-16, which is appropriate
        readability_score = 15
        if self.readability:
            fk_grade = self.readability.flesch_kincaid_grade
            if fk_grade > 20:  # Extremely complex - likely extraction issues
                readability_score = 5
            elif fk_grade > 18:  # Graduate+ level - may be too complex
                readability_score = 8
            elif fk_grade > 16:  # Advanced technical - acceptable
                readability_score = 12
            elif fk_grade >= 10:  # Standard technical (10-16) - ideal range
                readability_score = 15
            else:  # Below 10 - may be too simple for technical content
                readability_score = 12
        
        # Structure: 0-20 points based on headings, TOC, sections
        structure_score = 0
        if extractor.has_toc:
            structure_score += 7
        heading_count = len(extractor.headings) if hasattr(extractor, 'headings') else 0
        if heading_count >= 5:
            structure_score += 7
        elif heading_count >= 2:
            structure_score += 4
        section_count = len(extractor.sections) if hasattr(extractor, 'sections') else 0
        if section_count >= 3:
            structure_score += 6
        elif section_count >= 1:
            structure_score += 3
        structure_score = min(20, structure_score)
        
        # Completeness: 0-15 points based on document elements
        completeness_score = 0
        table_count = len(extractor.tables) if hasattr(extractor, 'tables') else 0
        figure_count = len(extractor.figures) if hasattr(extractor, 'figures') else 0
        word_count = extractor.word_count if hasattr(extractor, 'word_count') else 0
        para_count = len(extractor.paragraphs) if hasattr(extractor, 'paragraphs') else 0
        
        # Tables and figures are bonuses, not requirements
        if table_count > 0:
            completeness_score += 3
        if figure_count > 0:
            completeness_score += 3
        # Word count tiers
        if word_count > 1000:
            completeness_score += 5
        elif word_count > 300:
            completeness_score += 3
        # Paragraph structure
        if para_count > 5:
            completeness_score += 4
        elif para_count > 2:
            completeness_score += 2
        completeness_score = min(15, completeness_score)
        
        total = severity_score + readability_score + structure_score + completeness_score
        
        # Grade thresholds adjusted for rebalanced scoring
        if total >= 90:
            grade = 'A'
        elif total >= 80:
            grade = 'B'
        elif total >= 65:
            grade = 'C'
        elif total >= 50:
            grade = 'D'
        else:
            grade = 'F'
        
        return {
            'total': round(total, 1),
            'breakdown': {
                'severity_impact': round(severity_score, 1),
                'readability': round(readability_score, 1),
                'structure': round(structure_score, 1),
                'completeness': round(completeness_score, 1)
            },
            'grade': grade
        }

    def get_nlp_status(self) -> Dict:
        """
        v3.1.0: Get status of NLP-enhanced checkers.

        Returns dict with availability and version info for each NLP module.
        """
        if not self._nlp_available:
            return {
                'available': False,
                'error': 'NLP package not installed',
                'checkers': []
            }

        try:
            import nlp
            status = nlp.get_status()
            status['checkers'] = list(self._nlp_checkers.keys())
            status['checker_count'] = len(self._nlp_checkers)
            return status
        except Exception as e:
            return {
                'available': False,
                'error': str(e),
                'checkers': []
            }

    def get_nlp_checkers(self) -> List[Dict]:
        """
        v3.1.0: Get list of available NLP checkers with their info.

        Returns list of checker metadata dicts.
        """
        checkers = []
        for name, checker in self._nlp_checkers.items():
            checkers.append({
                'name': name,
                'display_name': getattr(checker, 'CHECKER_NAME', name),
                'version': getattr(checker, 'CHECKER_VERSION', '1.0.0'),
                'enabled': getattr(checker, 'enabled', True)
            })
        return checkers


class DocumentMarker:
    """Wrapper for markup_engine.MarkupEngine for backwards compatibility."""
    
    def __init__(self, input_path: str, output_path: str, reviewer_name: str = "TechWriter Review"):
        from markup_engine import MarkupEngine
        self.engine = MarkupEngine(author=reviewer_name)
        self.input_path = input_path
        self.output_path = output_path
        self.reviewer_name = reviewer_name
    
    def apply_review(self, issues: List[Dict]) -> Dict:
        """Apply review issues as comments to the document."""
        success = self.engine.create_marked_copy(
            self.input_path,
            self.output_path,
            issues,
            self.reviewer_name
        )
        
        stats = self.engine.get_statistics()
        
        return {
            'success': success,
            'output_path': self.output_path,
            'comments_added': stats.get('comments_added', 0),
            'reviewer': self.reviewer_name
        }


if __name__ == "__main__":
    print(f"TechWriterReview Core Engine v{MODULE_VERSION}")
    print("=" * 50)
    print("Comprehensive Technical Writing Review")
    print("=" * 50)
    print("\nAvailable Checks:")
    checks = [
        "Undefined Acronyms", "Passive Voice Detection", "Weak/Vague Language",
        "Wordy Phrases", "Nominalization Detection", "Jargon Simplification",
        "Ambiguous Pronouns", "Requirements Language", "Gender-Neutral Language",
        "Punctuation Issues", "Sentence Length", "Repeated Words",
        "Capitalization", "Contractions", "Reference Validation",
        "Document Structure", "Table/Figure Validation", "Unresolved Track Changes",
        "Consistency Checks", "List Formatting"
    ]
    for check in checks:
        print(f"  - {check}")
    print("=" * 50)
