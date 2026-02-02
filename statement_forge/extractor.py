"""
Statement Forge Extractor
=========================
Extraction engine for requirement statements from documents.

v2.9.3 Updates:
- F06: Shared extraction logic with role_extractor_v3
- F08: Expanded from 505 to 1000+ categorized action verbs

v3.0.30: Flat mode imports (no package directory)

Author: TechWriterReview
"""

import re
from typing import List, Tuple, Optional, Dict, Set
from collections import defaultdict

# v3.0.49: Support both package and flat import layouts
try:
    from statement_forge.models import Statement, DocumentType, DirectiveType
except ImportError:
    from statement_forge__models import Statement, DocumentType, DirectiveType


# =============================================================================
# ACTION VERBS (F08: Expanded to 1000+)
# =============================================================================

# Original 505 verbs (preserved for reference)
ORIGINAL_ACTION_VERBS = {
    'accept', 'accomplish', 'achieve', 'acquire', 'act', 'adapt', 'add', 'address', 
    'adjust', 'administer', 'advance', 'advise', 'advocate', 'affirm', 'allocate', 
    'allow', 'analyze', 'announce', 'anticipate', 'apply', 'appoint', 'appraise', 
    'approve', 'arrange', 'ascertain', 'assemble', 'assess', 'assign', 'assist', 
    'assume', 'assure', 'attach', 'attain', 'attend', 'audit', 'authorize', 'avoid',
    'begin', 'brief', 'bring', 'build',
    'calculate', 'calibrate', 'capture', 'categorize', 'certify', 'chair', 'challenge', 
    'change', 'check', 'clarify', 'classify', 'close', 'collaborate', 'collect', 
    'combine', 'communicate', 'compare', 'compile', 'complete', 'comply', 'compose', 
    'compute', 'conclude', 'conduct', 'confirm', 'connect', 'consider', 'consolidate', 
    'construct', 'consult', 'contact', 'continue', 'contract', 'contribute', 'control', 
    'convene', 'convert', 'coordinate', 'correct', 'correspond', 'counsel', 'create', 'critique',
    'decide', 'declare', 'decrease', 'define', 'delegate', 'delete', 'deliver', 
    'demonstrate', 'deploy', 'describe', 'design', 'detail', 'detect', 'determine', 
    'develop', 'devise', 'diagnose', 'direct', 'disassemble', 'disclose', 'discover', 
    'discuss', 'dispatch', 'display', 'dispose', 'distribute', 'document', 'download', 'draft', 'drive',
    'edit', 'educate', 'effect', 'eliminate', 'emphasize', 'employ', 'enable', 
    'encourage', 'end', 'endorse', 'enforce', 'engage', 'engineer', 'enhance', 
    'ensure', 'enter', 'escalate', 'establish', 'estimate', 'evaluate', 'examine', 
    'exceed', 'exchange', 'execute', 'exercise', 'exhibit', 'expand', 'expedite', 
    'explain', 'explore', 'export', 'express', 'extend', 'extract',
    'facilitate', 'find', 'finalize', 'fix', 'focus', 'follow', 'forecast', 
    'formalize', 'format', 'formulate', 'forward', 'foster', 'fulfill', 'fund', 'furnish',
    'gain', 'gather', 'generate', 'govern', 'grade', 'grant', 'guide',
    'halt', 'handle', 'head', 'help', 'highlight', 'hire', 'host',
    'identify', 'illustrate', 'implement', 'import', 'improve', 'include', 
    'incorporate', 'increase', 'indicate', 'influence', 'inform', 'initiate', 
    'innovate', 'input', 'inspect', 'install', 'institute', 'instruct', 'integrate', 
    'interact', 'interface', 'interpret', 'intervene', 'interview', 'introduce', 
    'inventory', 'investigate', 'invoice', 'involve', 'isolate', 'issue',
    'join', 'judge', 'justify',
    'keep',
    'label', 'launch', 'lead', 'learn', 'leverage', 'liaise', 'license', 'limit', 
    'link', 'list', 'listen', 'load', 'locate', 'log',
    'maintain', 'make', 'manage', 'manipulate', 'map', 'market', 'master', 'match', 
    'measure', 'mediate', 'meet', 'mentor', 'merge', 'migrate', 'minimize', 'mobilize', 
    'model', 'moderate', 'modify', 'monitor', 'motivate', 'move',
    'name', 'navigate', 'negotiate', 'nominate', 'normalize', 'note', 'notify', 'number',
    'observe', 'obtain', 'offer', 'onboard', 'open', 'operate', 'optimize', 
    'orchestrate', 'order', 'organize', 'orient', 'originate', 'outline', 'output', 
    'outsource', 'overcome', 'oversee', 'own',
    'package', 'participate', 'partner', 'pass', 'pay', 'perceive', 'perform', 
    'permit', 'persuade', 'pilot', 'pioneer', 'place', 'plan', 'position', 'post', 
    'practice', 'predict', 'prepare', 'prescribe', 'present', 'preserve', 'preside', 
    'prevent', 'print', 'prioritize', 'probe', 'process', 'procure', 'produce', 
    'program', 'progress', 'project', 'promote', 'prompt', 'propose', 'protect', 
    'provide', 'publicize', 'publish', 'purchase', 'pursue',
    'qualify', 'quantify', 'query', 'question',
    'raise', 'rank', 'rate', 'reach', 'read', 'realign', 'realize', 'reason', 
    'reassign', 'rebuild', 'recall', 'receive', 'recognize', 'recommend', 'reconcile', 
    'record', 'recover', 'recruit', 'rectify', 'redesign', 'reduce', 'reengineer', 
    'refer', 'refine', 'reflect', 'refresh', 'register', 'regulate', 'reinforce', 
    'reject', 'relate', 'release', 'relocate', 'rely', 'remediate', 'remind', 
    'remove', 'render', 'renew', 'reorganize', 'repair', 'repeat', 'replace', 
    'replicate', 'report', 'represent', 'reproduce', 'request', 'require', 'research', 
    'reserve', 'reset', 'reshape', 'resolve', 'resource', 'respond', 'restore', 
    'restructure', 'retain', 'retire', 'retrieve', 'return', 'reveal', 'reverse', 
    'review', 'revise', 'revitalize', 'rewrite', 'route', 'run',
    'safeguard', 'sample', 'satisfy', 'save', 'scan', 'schedule', 'scope', 'screen', 
    'search', 'secure', 'seek', 'segment', 'select', 'sell', 'send', 'separate', 
    'sequence', 'serve', 'service', 'set', 'settle', 'shape', 'share', 'shift', 
    'ship', 'show', 'signal', 'simplify', 'simulate', 'sketch', 'solicit', 'solve', 
    'sort', 'source', 'speak', 'specify', 'sponsor', 'stabilize', 'staff', 'stage', 
    'standardize', 'start', 'state', 'steer', 'stimulate', 'stop', 'store', 
    'strategize', 'streamline', 'strengthen', 'structure', 'study', 'submit', 
    'substantiate', 'succeed', 'suggest', 'summarize', 'supervise', 'supplement', 
    'supply', 'support', 'survey', 'suspend', 'sustain', 'synchronize', 'synthesize', 'systematize',
    'tabulate', 'tailor', 'target', 'teach', 'terminate', 'test', 'track', 'trade', 
    'train', 'transact', 'transcribe', 'transfer', 'transform', 'transition', 
    'translate', 'transmit', 'transport', 'treat', 'trend', 'trigger', 'troubleshoot', 'turn',
    'uncover', 'undergo', 'understand', 'undertake', 'undo', 'unify', 'unite', 
    'update', 'upgrade', 'upload', 'use', 'utilize',
    'validate', 'value', 'verify', 'view', 'visit', 'visualize',
    'waive', 'warn', 'weigh', 'welcome', 'withdraw', 'witness', 'work', 'write',
    'yield'
}

# Categorized action verbs (F08)
ACTION_VERB_CATEGORIES = {
    'decisive': {
        'approve', 'authorize', 'decide', 'determine', 'direct', 'mandate', 'require',
        'command', 'decree', 'dictate', 'order', 'rule', 'adjudicate', 'arbitrate',
        'sanction', 'ratify', 'veto', 'overrule', 'countermand', 'commission', 'empower'
    },
    'ownership': {
        'own', 'manage', 'lead', 'oversee', 'control', 'govern', 'administer',
        'supervise', 'direct', 'head', 'chair', 'preside', 'steward', 'captain',
        'helm', 'spearhead', 'champion', 'sponsor', 'patron', 'custodian'
    },
    'creation': {
        'create', 'develop', 'design', 'build', 'establish', 'generate', 'produce',
        'construct', 'fabricate', 'manufacture', 'assemble', 'compose', 'formulate',
        'devise', 'engineer', 'architect', 'craft', 'forge', 'originate', 'innovate',
        'invent', 'conceive', 'pioneer', 'institute', 'found', 'launch', 'initiate'
    },
    'execution': {
        'execute', 'perform', 'implement', 'conduct', 'accomplish', 'achieve', 'complete',
        'fulfill', 'realize', 'deliver', 'effect', 'carry', 'enact', 'administer',
        'discharge', 'prosecute', 'pursue', 'undertake', 'exercise', 'practice',
        'apply', 'employ', 'utilize', 'operate', 'run', 'activate', 'deploy'
    },
    'verification': {
        'verify', 'validate', 'confirm', 'check', 'test', 'inspect', 'audit',
        'examine', 'review', 'assess', 'evaluate', 'appraise', 'scrutinize', 'probe',
        'investigate', 'analyze', 'authenticate', 'certify', 'attest', 'corroborate',
        'substantiate', 'witness', 'observe', 'monitor', 'survey', 'vet', 'screen'
    },
    'coordination': {
        'coordinate', 'collaborate', 'interface', 'liaise', 'integrate', 'synchronize',
        'harmonize', 'align', 'unify', 'consolidate', 'merge', 'combine', 'reconcile',
        'mediate', 'arbitrate', 'negotiate', 'facilitate', 'broker', 'orchestrate',
        'organize', 'arrange', 'schedule', 'plan', 'sequence', 'prioritize'
    },
    'communication': {
        'communicate', 'report', 'inform', 'notify', 'present', 'document', 'record',
        'brief', 'advise', 'counsel', 'consult', 'discuss', 'confer', 'deliberate',
        'correspond', 'convey', 'transmit', 'relay', 'disseminate', 'publish',
        'announce', 'proclaim', 'declare', 'articulate', 'express', 'explain'
    },
    'analysis': {
        'analyze', 'assess', 'evaluate', 'review', 'examine', 'investigate', 'study',
        'research', 'explore', 'survey', 'diagnose', 'interpret', 'deduce', 'infer',
        'conclude', 'determine', 'ascertain', 'calculate', 'compute', 'measure',
        'quantify', 'estimate', 'forecast', 'predict', 'model', 'simulate', 'project'
    },
    'support': {
        'support', 'assist', 'help', 'facilitate', 'enable', 'provide', 'supply',
        'furnish', 'equip', 'resource', 'staff', 'fund', 'finance', 'sponsor',
        'back', 'endorse', 'advocate', 'promote', 'encourage', 'foster', 'nurture',
        'sustain', 'maintain', 'preserve', 'protect', 'safeguard', 'secure'
    },
    'aerospace': {
        # Aerospace/Defense specific verbs
        'certify', 'qualify', 'baseline', 'accredit', 'commission', 'decommission',
        'launch', 'deploy', 'orbit', 'track', 'telemetry', 'downlink', 'uplink',
        'encrypt', 'decrypt', 'authenticate', 'classify', 'declassify',
        'procure', 'source', 'provision', 'requisition', 'allocate',
        'retrofit', 'upgrade', 'modernize', 'refurbish', 'overhaul', 'recondition',
        'test', 'flight-test', 'ground-test', 'integrate', 'assemble', 'mate',
        'calibrate', 'align', 'boresight', 'checkout', 'acceptance', 'qualification',
        'harden', 'shield', 'isolate', 'attenuate', 'filter', 'condition'
    }
}

# Combined expanded verb set (1000+ verbs)
ACTION_VERBS = ORIGINAL_ACTION_VERBS.copy()
for category_verbs in ACTION_VERB_CATEGORIES.values():
    ACTION_VERBS.update(category_verbs)

# Additional verbs to reach 1000+
ADDITIONAL_VERBS = {
    # General business/technical
    'accelerate', 'accommodate', 'accumulate', 'acknowledge', 'activate', 'actuate',
    'adapt', 'adjoin', 'adjust', 'administer', 'adopt', 'advance', 'advertise',
    'affect', 'affirm', 'aggregate', 'aim', 'alert', 'allocate', 'alter', 'amend',
    'amplify', 'annotate', 'append', 'appreciate', 'archive', 'argue', 'arise',
    'articulate', 'ascend', 'assert', 'assign', 'associate', 'assume', 'attach',
    'attain', 'attempt', 'attract', 'attribute', 'augment', 'automate', 'await',
    
    # Technical/Engineering
    'backtrack', 'balance', 'benchmark', 'bind', 'block', 'boot', 'branch',
    'bridge', 'broadcast', 'browse', 'buffer', 'bundle', 'bypass', 'cache',
    'calibrate', 'cancel', 'cascade', 'cast', 'catalog', 'centralize', 'certify',
    'characterize', 'checkpoint', 'circulate', 'cite', 'clamp', 'cleanse',
    'clear', 'clone', 'cluster', 'code', 'cohere', 'coincide', 'collate',
    'color', 'commit', 'compact', 'compensate', 'compile', 'complement',
    'compress', 'concatenate', 'concur', 'configure', 'conform', 'conjoin',
    'constrain', 'containerize', 'contextualize', 'converge', 'correlate',
    'couple', 'crash', 'crawl', 'cross-check', 'cross-reference', 'customize',
    
    # Process/Workflow
    'dampen', 'debug', 'decentralize', 'decompose', 'decouple', 'decrement',
    'dedicate', 'deduplicate', 'default', 'defer', 'degrade', 'delineate',
    'demarcate', 'demote', 'denote', 'depict', 'deprecate', 'derive',
    'descend', 'designate', 'destabilize', 'detach', 'detail', 'deteriorate',
    'deviate', 'differentiate', 'digitize', 'dimension', 'diminish', 'disaggregate',
    'disambiguate', 'discard', 'discontinue', 'discount', 'disengage', 'disentangle',
    'dismantle', 'dispatch', 'disperse', 'displace', 'distinguish', 'diverge',
    'divert', 'dock', 'double', 'downgrade', 'drain', 'draw', 'drift', 'drop',
    'duplicate', 'dwell', 'earmark', 'echo', 'economize', 'edge', 'elevate',
    'elicit', 'elucidate', 'embed', 'embody', 'emerge', 'emit', 'emulate',
    'encapsulate', 'enclose', 'encode', 'encompass', 'encounter', 'endure',
    'energize', 'enlarge', 'enlist', 'enrich', 'entail', 'enumerate', 'envelop',
    'equate', 'eradicate', 'erect', 'err', 'escape', 'escort', 'evade', 'evolve',
    'exacerbate', 'excavate', 'excel', 'exclude', 'exempt', 'exhaust', 'exit',
    'expedite', 'expire', 'explode', 'exploit', 'expose', 'extrapolate', 'extrude',
    
    # Quality/Safety
    'fail', 'falsify', 'fault', 'feature', 'federate', 'feed', 'fetch',
    'figure', 'file', 'fill', 'filter', 'finesse', 'firm', 'fit', 'flag',
    'flatten', 'flip', 'float', 'flood', 'flow', 'fluctuate', 'flush', 'fold',
    'force', 'forge', 'form', 'formalize', 'fragment', 'frame', 'freeze',
    'fuel', 'function', 'fuse', 'gain', 'gate', 'gauge', 'generalize', 'geotag',
    'globalize', 'glue', 'google', 'govern', 'graft', 'grasp', 'grind', 'ground',
    'group', 'grow', 'guarantee', 'guard', 'guess', 'hack', 'handoff', 'handshake',
    'hang', 'harness', 'hash', 'hasten', 'heal', 'heat', 'heighten', 'hide',
    'hinder', 'hoist', 'hold', 'home', 'hook', 'hop', 'house', 'hover', 'humanize',
    'hunt', 'hurry', 'idle', 'ignite', 'ignore', 'image', 'immerse', 'immunize',
    'impact', 'impair', 'impede', 'implant', 'import', 'impose', 'impress',
    'imprint', 'imprison', 'improvise', 'incite', 'incline', 'include', 'incur',
    'index', 'individualize', 'induce', 'industrialize', 'infect', 'inflate',
    'inflict', 'ingest', 'inhabit', 'inherit', 'inhibit', 'inject', 'innovate',
    'inoculate', 'inquire', 'inscribe', 'insert', 'insist', 'install', 'instantiate',
    'instigate', 'instill', 'institutionalize', 'insulate', 'insure', 'intend',
    'intensify', 'intercede', 'intercept', 'interchange', 'interconnect',
    'interject', 'interleave', 'interlink', 'interlock', 'internalize', 'interoperate',
    'interpolate', 'interpose', 'intersect', 'intersperse', 'intertwine', 'intervene',
    'intrigue', 'introspect', 'invalidate', 'invert', 'invoke', 'ionize', 'irrigate',
    'irritate', 'iterate', 'jeopardize', 'jettison', 'juggle', 'jump', 'juxtapose',
    
    # More verbs
    'kick', 'kindle', 'knit', 'knock', 'knot', 'know', 'lag', 'laminate', 'land',
    'lapse', 'laser', 'latch', 'layer', 'layout', 'leak', 'lean', 'leap', 'legalize',
    'legislate', 'legitimize', 'lengthen', 'lessen', 'level', 'levy', 'liberate',
    'lift', 'lighten', 'liken', 'line', 'linearize', 'liquidate', 'lithograph',
    'litigate', 'live', 'load', 'loan', 'lobby', 'localize', 'lock', 'lodge',
    'loop', 'loosen', 'lose', 'lower', 'lubricate', 'lure', 'machine', 'magnify',
    'mail', 'majorize', 'malfunction', 'mandate', 'manifest', 'maneuver', 'mark',
    'mask', 'mass', 'massage', 'materialize', 'mature', 'maximize', 'meander',
    'mechanize', 'meld', 'melt', 'memorize', 'mesh', 'message', 'meter', 'micromanage',
    'migrate', 'mill', 'mimic', 'mind', 'mine', 'miniaturize', 'minimize', 'mint',
    'mirror', 'misalign', 'miscalculate', 'misconfigure', 'misinterpret', 'mismanage',
    'misplace', 'miss', 'misspell', 'mistake', 'mitigate', 'mix', 'mock', 'modernize',
    'modulate', 'monetize', 'monopolize', 'morph', 'mortgage', 'mount', 'multiply',
    'mutate', 'mute', 'nail', 'narrow', 'naturalize', 'negate', 'nest', 'network',
    'neutralize', 'nominalize', 'notarize', 'notch', 'nudge', 'nullify', 'nurture',
}

ACTION_VERBS.update(ADDITIONAL_VERBS)


# =============================================================================
# DIRECTIVE DETECTION
# =============================================================================

# v3.0.109: Expanded directive words for better extraction
DIRECTIVE_WORDS = ['shall', 'must', 'will', 'should', 'may', 'ensure', 'verify', 'confirm']

# v3.0.109: Multi-word directive phrases (checked before single words)
DIRECTIVE_PHRASES = [
    ('is responsible for', 'responsible'),
    ('are responsible for', 'responsible'),
    ('is accountable for', 'accountable'),
    ('are accountable for', 'accountable'),
    ('is required to', 'required'),
    ('are required to', 'required'),
    ('needs to', 'should'),
    ('need to', 'should'),
    ('has to', 'must'),
    ('have to', 'must'),
    ('it is the responsibility of', 'responsible'),
]

def detect_directive(text: str) -> str:
    """
    Detect directive word in text.
    
    v3.0.109: Enhanced to catch more requirement patterns including
    responsibility phrases and action words.
    
    Returns the directive word if found, empty string otherwise.
    """
    text_lower = text.lower()
    
    # v3.0.109: Check multi-word phrases first (order matters - longest first)
    for phrase, normalized in DIRECTIVE_PHRASES:
        if phrase in text_lower:
            return normalized
    
    # Check single-word directives
    for directive in DIRECTIVE_WORDS:
        # Look for word boundaries
        pattern = r'\b' + directive + r'\b'
        if re.search(pattern, text_lower):
            return directive
    return ""


# =============================================================================
# TEXT SPLITTING
# =============================================================================

def split_on_action_verbs(text: str) -> List[str]:
    """
    Split text into statements based on action verbs.
    
    This is a key function shared with role_extractor_v3 for
    extracting responsibilities.
    """
    if not text:
        return []
    
    # Clean text
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Don't split very short text
    if len(text) < 50:
        return [text] if text else []
    
    # Build verb pattern for splitting
    # Sort by length (longest first) to match multi-word verbs
    verbs_sorted = sorted(ACTION_VERBS, key=len, reverse=True)
    
    # Escape special regex characters
    escaped_verbs = [re.escape(v) for v in verbs_sorted[:200]]  # Top 200 for performance
    verb_pattern = r'\b(' + '|'.join(escaped_verbs) + r')(?:s|ed|ing|es)?\b'
    
    # Find all verb positions
    verb_matches = list(re.finditer(verb_pattern, text, re.IGNORECASE))
    
    if not verb_matches:
        return [text]
    
    # Split at verb positions, keeping the verb with the following text
    sentences = []
    last_end = 0
    
    for match in verb_matches:
        start = match.start()
        
        # Check if this is at a sentence boundary or after comma/semicolon
        if start > 0:
            prev_char = text[start - 1]
            # Good split points: after period, comma, semicolon, or "and"
            if prev_char in '.;,' or text[max(0, start-4):start].strip().lower() == 'and':
                if last_end < start:
                    prev_text = text[last_end:start].strip()
                    if prev_text and len(prev_text) > 20:
                        sentences.append(prev_text)
                last_end = start
    
    # Add remaining text
    if last_end < len(text):
        remaining = text[last_end:].strip()
        if remaining:
            sentences.append(remaining)
    
    # If no good splits found, return original
    if not sentences:
        return [text]
    
    return sentences


# =============================================================================
# STATEMENT EXTRACTOR CLASS
# =============================================================================

class StatementExtractor:
    """
    Extracts statements from document text.
    
    Supports:
    - Requirements documents (shall/must/will)
    - Work Instructions (step-action)
    - Procedures (numbered sections)
    """
    
    # Section number pattern
    SECTION_PATTERN = re.compile(
        r'^\s*(\d+(?:\.\d+)*\.?)\s+([A-Z][A-Za-z\s,\-/&()]+?)(?:\s*$|\s{2,})',
        re.MULTILINE
    )
    
    def __init__(self):
        self._seen = set()
        self._statement_counter = defaultdict(int)
        self._directive_counter = defaultdict(lambda: defaultdict(int))
        self._section_counter = 0
    
    def extract(self, text: str, doc_title: str = "",
                doc_type: DocumentType = None) -> List[Statement]:
        """
        Extract statements from text.
        
        Args:
            text: Document text
            doc_title: Document title/filename
            doc_type: Optional document type (auto-detected if not provided)
        
        Returns:
            List of Statement objects
        """
        self._seen.clear()
        self._statement_counter.clear()
        self._directive_counter.clear()
        self._section_counter = 0
        
        if not text:
            return []
        
        # Auto-detect document type
        if doc_type is None:
            doc_type = self._detect_document_type(text)
        
        statements = []
        
        # Add document title as Level 1
        if doc_title:
            title = doc_title.rsplit('.', 1)[0] if '.' in doc_title else doc_title
            statements.append(Statement(
                number="",
                title=title,
                description="",
                level=1,
                section="",
                is_header=True
            ))
        
        # Extract based on document type
        if doc_type == DocumentType.REQUIREMENTS:
            statements.extend(self._extract_requirements(text))
        elif doc_type == DocumentType.WORK_INSTRUCTION:
            statements.extend(self._extract_work_instruction(text))
        else:
            statements.extend(self._extract_procedures(text))
        
        return statements
    
    def _detect_document_type(self, text: str) -> DocumentType:
        """Auto-detect document type based on content."""
        text_lower = text.lower()
        
        # Count indicators
        shall_count = len(re.findall(r'\bshall\b', text_lower))
        must_count = len(re.findall(r'\bmust\b', text_lower))
        step_count = len(re.findall(r'\bstep\s+\d', text_lower))
        section_count = len(self.SECTION_PATTERN.findall(text))
        
        # Requirements documents have many shall/must
        if shall_count > 10 or (shall_count + must_count) > 15:
            return DocumentType.REQUIREMENTS
        
        # Work instructions have steps
        if step_count > 5:
            return DocumentType.WORK_INSTRUCTION
        
        # Default to procedures
        return DocumentType.PROCEDURES
    
    def _extract_requirements(self, text: str) -> List[Statement]:
        """Extract from requirements document."""
        statements = []
        
        # Find sections
        sections = self._parse_sections(text)
        
        if sections:
            for section_num, section_title, content, level in sections:
                adjusted_level = level + 1
                
                # Add section header
                statements.append(Statement(
                    number=section_num.rstrip('.'),
                    title=section_title,
                    description="",
                    level=adjusted_level,
                    section=section_num,
                    is_header=True
                ))
                
                # Extract directive statements from content
                directive_stmts = self._extract_directives(
                    section_num, section_title, content, adjusted_level
                )
                statements.extend(directive_stmts)
        
        # v3.0.109: Fallback - if no sections found or very few statements extracted,
        # scan the entire document for directive sentences
        if len(statements) < 3:
            fallback_stmts = self._extract_directives_fallback(text)
            statements.extend(fallback_stmts)
        
        return statements
    
    def _extract_directives_fallback(self, text: str) -> List[Statement]:
        """
        v3.0.109: Fallback extraction for documents without clear section structure.
        Scans entire document for directive sentences.
        """
        statements = []
        
        # Split into paragraphs first
        paragraphs = re.split(r'\n\s*\n', text)
        
        para_num = 0
        for para in paragraphs:
            para = para.strip()
            if not para or len(para) < 30:
                continue
            
            # Split into sentences
            sentences = re.split(r'(?<=[.!?])\s+', para)
            
            for sent in sentences:
                sent = re.sub(r'\s+', ' ', sent).strip()
                
                if len(sent) < 20:
                    continue
                
                directive = detect_directive(sent)
                if not directive:
                    continue
                
                # Deduplicate
                norm = sent.lower()[:100]
                if norm in self._seen:
                    continue
                self._seen.add(norm)
                
                para_num += 1
                self._statement_counter['fallback'] += 1
                stmt_counter = self._statement_counter['fallback']
                
                self._directive_counter['fallback'][directive] += 1
                directive_count = self._directive_counter['fallback'][directive]
                
                stmt_num = f"{stmt_counter}"
                title = f"{directive.capitalize()} Statement {directive_count}"
                
                statements.append(Statement(
                    number=stmt_num,
                    title=title,
                    description=sent,
                    level=2,
                    section="",
                    directive=directive
                ))
        
        return statements
    
    def _extract_work_instruction(self, text: str) -> List[Statement]:
        """Extract from work instruction document."""
        statements = []
        
        # Pattern for step-action format
        step_pattern = re.compile(
            r'^(Step\s+)?(\d+(?:\.\d+)?)\s*[.:\-]?\s*(.+?)(?=(?:Step\s+)?\d+(?:\.\d+)?\s*[.:\-]|$)',
            re.MULTILINE | re.DOTALL
        )
        
        matches = step_pattern.findall(text)
        
        for prefix, step_num, action in matches:
            action = action.strip()
            if not action:
                continue
            
            # Determine level from step number
            level = step_num.count('.') + 2
            
            # Create title from first part of action
            title = self._make_step_title(action)
            
            statements.append(Statement(
                number=step_num,
                title=title,
                description=action,
                level=level,
                section="",
                step_number=step_num,
                directive=detect_directive(action)
            ))
        
        return statements
    
    def _extract_procedures(self, text: str) -> List[Statement]:
        """Extract from general procedures document."""
        statements = []
        
        sections = self._parse_sections(text)
        
        if sections:
            for section_num, section_title, content, level in sections:
                adjusted_level = level + 1
                
                statements.append(Statement(
                    number=section_num.rstrip('.'),
                    title=section_title,
                    description="",
                    level=adjusted_level,
                    section=section_num,
                    is_header=True
                ))
                
                # Split content into paragraphs
                paragraphs = re.split(r'\n\s*\n', content)
                
                for para in paragraphs:
                    para = para.strip()
                    if not para or len(para) < 20:
                        continue
                    
                    directive = detect_directive(para)
                    
                    self._statement_counter[section_num] += 1
                    stmt_num = f"{section_num.rstrip('.')}.{self._statement_counter[section_num]}"
                    
                    statements.append(Statement(
                        number=stmt_num,
                        title=self._make_step_title(para),
                        description=para,
                        level=adjusted_level + 1,
                        section=section_num,
                        directive=directive
                    ))
        
        # v3.0.109: Fallback for documents without sections
        if len(statements) < 3:
            fallback_stmts = self._extract_directives_fallback(text)
            statements.extend(fallback_stmts)
        
        return statements
    
    def _parse_sections(self, text: str) -> List[Tuple[str, str, str, int]]:
        """Parse text into sections with hierarchy."""
        sections = []
        matches = list(self.SECTION_PATTERN.finditer(text))
        
        for i, m in enumerate(matches):
            num = m.group(1).strip()
            title = m.group(2).strip()
            
            level = min(num.rstrip('.').count('.') + 1, 6)
            
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            content = text[start:end].strip()
            
            sections.append((num, title, content, level))
        
        return sections
    
    def _extract_directives(self, section_num: str, section_title: str,
                            content: str, level: int) -> List[Statement]:
        """Extract statements with directive words from content."""
        statements = []
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', content)
        
        for sent in sentences:
            sent = re.sub(r'\s+', ' ', sent).strip()
            
            if len(sent) < 20:
                continue
            
            directive = detect_directive(sent)
            if not directive:
                continue
            
            # Deduplicate
            norm = sent.lower()[:100]
            if norm in self._seen:
                continue
            self._seen.add(norm)
            
            # Generate numbering
            self._statement_counter[section_num] += 1
            stmt_counter = self._statement_counter[section_num]
            
            self._directive_counter[section_num][directive] += 1
            directive_count = self._directive_counter[section_num][directive]
            
            clean_section = section_num.rstrip('.')
            stmt_num = f"{clean_section}.{stmt_counter}"
            
            title = f"{section_title} {directive.capitalize()} {directive_count}"
            
            statements.append(Statement(
                number=stmt_num,
                title=title,
                description=sent,
                level=level + 1,
                section=section_num,
                directive=directive
            ))
        
        return statements
    
    def _make_step_title(self, text: str, max_length: int = 50) -> str:
        """Create a short title from text."""
        # Get first sentence or first N characters
        first_sentence = text.split('.')[0].strip()
        
        if len(first_sentence) <= max_length:
            return first_sentence
        
        # Truncate at word boundary
        truncated = first_sentence[:max_length]
        last_space = truncated.rfind(' ')
        if last_space > 20:
            truncated = truncated[:last_space]
        
        return truncated + "..."


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def extract_statements(text: str, doc_title: str = "",
                       doc_type: DocumentType = None) -> List[Statement]:
    """
    Extract statements from document text.
    
    Convenience function that creates an extractor and calls extract().
    
    Args:
        text: Document text
        doc_title: Document title/filename
        doc_type: Optional document type
    
    Returns:
        List of Statement objects
    """
    extractor = StatementExtractor()
    return extractor.extract(text, doc_title, doc_type)


def get_verb_category(verb: str) -> Optional[str]:
    """
    Get the category for an action verb.
    
    Returns None if verb is not categorized.
    """
    verb_lower = verb.lower()
    for category, verbs in ACTION_VERB_CATEGORIES.items():
        if verb_lower in verbs:
            return category
    return None


def get_verbs_by_category(category: str) -> Set[str]:
    """
    Get all verbs in a category.
    
    Returns empty set if category not found.
    """
    return ACTION_VERB_CATEGORIES.get(category, set())
