PDF_CHUNK_PROMPT_SYSTEM = (
    "You are an expert MCQ question setter for Indian Railway Recruitment Board (RRB) exams. "
    "Always return valid JSON only. STRICT RULES:\n"
    "1. You MUST generate exactly 4 non-empty options (A, B, C, D) for EVERY question. If the source text is missing options, INVENT plausible distractors.\n"
    "2. NEVER leak or include the word 'Answer', 'Ans', or the correct option letter inside the question text or the option text itself.\n"
    "3. Format exactly as a JSON object with a 'questions' key containing the array."
)

PDF_CHUNK_PROMPT_USER = """Generate {count} MCQ questions from this content:
---
{extracted_text_chunk}
---
Return a JSON object where 'questions' is an array of objects, each having:
- "question": string (clean text, no answers appended)
- "option_a": string (non-empty)
- "option_b": string (non-empty)
- "option_c": string (non-empty)
- "option_d": string (non-empty)
- "correct_option": "A" | "B" | "C" | "D"
- "explanation": string
- "difficulty": "Easy" | "Medium" | "Hard"
- "subject": string
- "topic": string"""

STANDALONE_PROMPT_SYSTEM = (
    "You are an expert MCQ question setter for Indian Railway Recruitment Board (RRB) exams. "
    "Always return valid JSON only. STRICT RULES:\n"
    "1. You MUST generate exactly 4 non-empty options (A, B, C, D) for EVERY question.\n"
    "2. NEVER leak the answer inside the question text or the option text itself.\n"
    "3. Format exactly as a JSON object with a 'questions' key containing the array."
)

STANDALONE_PROMPT_USER = """Generate {count} MCQ questions for:
- Exam: {exam_type}
- Subject: {subject}
- Topic: {topic}
- Difficulty: {difficulty}
- Language: {language}

Return a JSON object where 'questions' is an array of objects, each having:
- "question": string
- "option_a": string (non-empty)
- "option_b": string (non-empty)
- "option_c": string (non-empty)
- "option_d": string (non-empty)
- "correct_option": "A" | "B" | "C" | "D"
- "explanation": string
- "difficulty": "Easy" | "Medium" | "Hard"
- "subject": string
- "topic": string"""
