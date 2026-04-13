import re
import fitz  # PyMuPDF
from typing import List, Dict, Optional


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    doc = fitz.open(file_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text


def parse_pyq_questions(text: str) -> List[Dict]:
    """
    Parse PYQ-style PDF text into structured questions.
    
    Expected format per question:
        Q.1
        <question text, possibly multi-line>
        Ans
        1. <option A>
        2. <option B>
        3. <option C>
        4. <option D>
    
    Returns a list of dicts with keys:
        text, option_a, option_b, option_c, option_d, correct_option
    """
    # Split into question blocks using Q.N pattern
    # This regex finds "Q." followed by a number at the start of a line
    question_pattern = re.compile(r'(?:^|\n)\s*Q\.\s*(\d+)\s*\n', re.MULTILINE)
    
    splits = list(question_pattern.finditer(text))
    if not splits:
        return []
    
    questions = []
    
    for i, match in enumerate(splits):
        q_num = int(match.group(1))
        start = match.end()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(text)
        block = text[start:end].strip()
        
        parsed = _parse_single_question_block(block, q_num)
        if parsed:
            questions.append(parsed)
    
    return questions


def _parse_single_question_block(block: str, q_num: int) -> Optional[Dict]:
    """Parse a single question block into structured data."""
    
    # Split at "Ans" to separate question text from options
    ans_split = re.split(r'\nAns\s*\n', block, maxsplit=1)
    
    if len(ans_split) < 2:
        # Try alternative split patterns
        ans_split = re.split(r'\nAns[:\s]*\n', block, maxsplit=1)
    
    if len(ans_split) < 2:
        # Fallback: try to find options directly
        question_text = ""
        options_text = block
    else:
        question_text = ans_split[0].strip()
        options_text = ans_split[1].strip()
    
    # Remove metadata lines (Test Date, Test Time, Subject, Note, Section)
    metadata_patterns = [
        r'Test Date\s*\n.*?\n',
        r'Test Time\s*\n.*?\n',
        r'Subject\s*\n.*?\n',
        r'\* Note\s*\n.*?(?=\n\d\.|\Z)',
        r'Correct Answer will carry.*?\n',
        r'Incorrect Answer will carry.*?\n',
        r'\d+\.\s*Options shown in green.*?\n',
        r'\d+\.\s*Chosen option.*?\n',
        r'Section\s*:.*?\n',
    ]
    for pattern in metadata_patterns:
        question_text = re.sub(pattern, '', question_text, flags=re.DOTALL)
        options_text = re.sub(pattern, '', options_text, flags=re.DOTALL)
    
    question_text = question_text.strip()
    
    # Extract 4 options using "1.", "2.", "3.", "4." pattern
    option_pattern = re.compile(
        r'(?:^|\n)\s*1\.\s*(.*?)(?:\n)\s*2\.\s*(.*?)(?:\n)\s*3\.\s*(.*?)(?:\n)\s*4\.\s*(.*?)(?:\n|$)',
        re.DOTALL
    )
    
    opt_match = option_pattern.search(options_text)
    
    if not opt_match:
        # Try alternative: options on same line with (a), (b), (c), (d) or A., B., C., D.
        alt_pattern = re.compile(
            r'(?:^|\n)\s*(?:\(?[aA]\)?\.?\s*)(.*?)(?:\n)\s*(?:\(?[bB]\)?\.?\s*)(.*?)(?:\n)\s*(?:\(?[cC]\)?\.?\s*)(.*?)(?:\n)\s*(?:\(?[dD]\)?\.?\s*)(.*?)(?:\n|$)',
            re.DOTALL
        )
        opt_match = alt_pattern.search(options_text)
    
    if not opt_match:
        return None
    
    option_a = opt_match.group(1).strip()
    option_b = opt_match.group(2).strip()
    option_c = opt_match.group(3).strip()
    option_d = opt_match.group(4).strip()
    
    # Skip questions with empty options (e.g., image-based questions)
    if not option_a and not option_b and not option_c and not option_d:
        return None
    
    # If question text is empty (image-based question), use a placeholder
    if not question_text:
        question_text = f"Question {q_num}"
    
    # Try to determine correct answer
    # In many PYQ PDFs, the correct option is shown in green (tick mark)
    # Since we can't detect color from text extraction, default to "A"
    # The admin can review and correct later
    correct_option = "A"
    
    # Try to detect correct answer markers in the block
    correct_patterns = [
        r'(?:correct|answer|ans)\s*[:=]\s*([ABCD1-4])',
        r'✓\s*(\d)',  # tick mark
        r'✔\s*(\d)',
    ]
    for cp in correct_patterns:
        cm = re.search(cp, f"{options_text}\n{question_text}", re.IGNORECASE)
        if cm:
            val = cm.group(1).upper()
            if val in ('1', 'A'):
                correct_option = "A"
            elif val in ('2', 'B'):
                correct_option = "B"
            elif val in ('3', 'C'):
                correct_option = "C"
            elif val in ('4', 'D'):
                correct_option = "D"
            break
    
    return {
        "text": question_text,
        "option_a": option_a or "Option A",
        "option_b": option_b or "Option B",
        "option_c": option_c or "Option C",
        "option_d": option_d or "Option D",
        "correct_option": correct_option,
        "explanation": "",
        "difficulty": "medium",
        "subject": "General",
        "topic": "PYQ",
    }


def chunk_text(text: str, max_tokens: int = 1500) -> List[str]:
    """Split text into chunks of approximately max_tokens tokens (~4 chars/token)."""
    max_chars = max_tokens * 4
    chunks = []
    words = text.split()
    current_chunk = ""

    for word in words:
        if len(current_chunk) + len(word) + 1 > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = word
        else:
            current_chunk += " " + word

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks
