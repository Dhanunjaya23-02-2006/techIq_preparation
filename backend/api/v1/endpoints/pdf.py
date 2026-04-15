from typing import Any, List, Optional
import os
import json
import pdfplumber
from groq import Groq
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from core.db import get_db
from core.config import settings
from models.pdf import PDF
from models.questions import Question
from models.users import User
from pydantic import BaseModel
from api.deps import get_current_active_user, get_current_active_superuser
from models.tests import MockTest, MockTestQuestionLink

router = APIRouter()

class QuestionGenerationRequest(BaseModel):
    exam_type: str = "ntpc"
    subject: str = "General Awareness"
    topic: str = ""
    difficulty: str = "medium"
    count: int = 10
    language: str = "en"


def extract_questions_with_groq(text: str) -> list:
    """
    Use Groq AI (openai/gpt-oss-120b) to extract MCQ questions from PDF text.
    Returns a list of dicts with text, option_a-d, correct_option, subject, topic.
    """
    if not settings.GROQ_API_KEY:
        return []

    client = Groq(api_key=settings.GROQ_API_KEY)

    # Split text into chunks if too long (Groq has token limits)
    max_chars = 6000
    chunks = []
    for i in range(0, len(text), max_chars):
        chunks.append(text[i:i + max_chars])

    all_questions = []

    for chunk in chunks:
        if len(chunk.strip()) < 50:
            continue

        prompt = f"""You are an expert RRB (Railway Recruitment Board) exam question extractor and enhancer.

Extract ALL multiple choice questions (MCQs) from the following text. For each question:
1. Extract the question text, all 4 options, and identify the correct answer.
2. Classify the subject and topic based on the RRB exam syllabus.
3. If the correct answer is marked in the text, use it. Otherwise, determine the correct answer using your knowledge.
4. Provide a brief explanation for each correct answer.
5. DO NOT include any questions related to Probability or Statistics probability.

For EACH question, return a JSON object with these exact keys:
- "text": the question text (clean, no numbering like Q1, 1., etc)
- "option_a": option A text (clean, no prefix like A., (A) etc)
- "option_b": option B text
- "option_c": option C text
- "option_d": option D text
- "correct_option": the correct answer letter (A, B, C, or D)
- "explanation": brief explanation of the correct answer
- "subject": subject category (Mathematics, Reasoning, General Awareness, General Science)
- "topic": specific topic (e.g. Percentage, Syllogism, Indian History)

RULES:
1. Return ONLY a valid JSON array. No markdown, no code blocks, no other text.
2. If no questions are found, return: []
3. Skip any probability-related questions entirely.

TEXT:
{chunk}

Return ONLY the JSON array:"""

        try:
            response = client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a precise MCQ extractor. Return only valid JSON arrays of question objects. Never include markdown formatting or code blocks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2048,
            )

            result = response.choices[0].message.content.strip()

            # Clean up response - remove markdown code blocks if present
            if result.startswith("```"):
                result = result.split("\n", 1)[1] if "\n" in result else result[3:]
                if result.endswith("```"):
                    result = result[:-3]
                result = result.strip()

            questions = json.loads(result)
            if isinstance(questions, list):
                all_questions.extend(questions)

        except (json.JSONDecodeError, Exception):
            # If Groq fails for this chunk, skip it
            continue

    return all_questions


@router.post("/upload/")
async def upload_pdf(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    title: str = Form(...),
    exam_type: str = Form("ntpc"),
    subject: Optional[str] = Form(None),
    time_limit: int = Form(60),
    negative_marking: float = Form(0.25),
    marks_per_question: float = Form(1.0),
    is_grand_test: bool = Form(False),
    is_pyq: bool = Form(True),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Upload a PDF and extract questions using Groq AI.
    """
    # Ensure media directory exists
    os.makedirs("media/pdfs", exist_ok=True)

    file_path = f"media/pdfs/{file.filename}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    pdf = PDF(
        title=title,
        file=file_path,
        uploaded_by_id=current_user.id,
        status="processing"
    )
    db.add(pdf)
    db.commit()
    db.refresh(pdf)

    # Create MockTest
    test = MockTest(
        title=title,
        exam_type=exam_type.lower(),
        subject=subject or "General Awareness",
        time_limit=time_limit,
        negative_marking=negative_marking,
        marks_per_question=marks_per_question,
        is_grand_test=is_grand_test,
        is_pyq=is_pyq,
        is_active=True,
        created_by_id=current_user.id,
        pdf_file=file_path
    )
    db.add(test)
    db.commit()
    db.refresh(test)

    # Extract text from PDF
    try:
        full_text = extract_text_from_pdf(file_path)

        if not full_text.strip():
            pdf.status = "done"
            pdf.questions_generated = 0
            pdf.error_message = "No readable text found in PDF"
            db.add(pdf)
            db.commit()
            return {"id": pdf.id, "status": "done", "questions_generated": 0,
                    "message": "PDF contained no readable text."}

        # Use Groq AI to extract questions
        extracted = extract_questions_with_groq(full_text)

        # Save questions to database
        count = 0
        for q in extracted:
            # Validate required fields
            if not q.get("text") or not q.get("option_a"):
                continue

            question = Question(
                text=q.get("text", ""),
                option_a=q.get("option_a", ""),
                option_b=q.get("option_b", ""),
                option_c=q.get("option_c", ""),
                option_d=q.get("option_d", ""),
                correct_option=q.get("correct_option", "A").upper(),
                explanation=q.get("explanation", ""),
                subject=q.get("subject", "General Awareness"),
                topic=q.get("topic", title),
                difficulty="medium",
                source="pdf_extract",
                source_pdf_id=pdf.id,
                exam_type=exam_type.lower(),
                language="en",
                status="approved",
                created_by_id=current_user.id,
            )
            db.add(question)
            db.commit()
            db.refresh(question)

            # Link question to test
            link = MockTestQuestionLink(mock_test_id=test.id, question_id=question.id)
            db.add(link)
            count += 1

        test.total_questions = count
        pdf.status = "done"
        pdf.questions_generated = count
        db.add(pdf)
        db.add(test)
        db.commit()

        return {
            "id": pdf.id,
            "status": "done",
            "questions_generated": count,
            "message": f"Successfully extracted {count} questions from PDF using AI."
        }

    except Exception as e:
        pdf.status = "failed"
        pdf.error_message = str(e)
        db.add(pdf)
        db.commit()
        return {"id": pdf.id, "status": "failed", "error": str(e)}


def extract_text_from_pdf(file_path: str) -> str:
    """Helper to extract text from PDF using pdfplumber."""
    full_text = ""
    with pdfplumber.open(file_path) as pdf_doc:
        for page in pdf_doc.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
    return full_text


@router.post("/generate-from-pyq/")
async def generate_from_pyq(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    title: str = Form(...),
    exam_type: str = Form("ntpc"),
    count: int = Form(10),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Upload a PDF, analyze topics/style, and generate NEW questions using AI.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # Ensure media directory exists
    os.makedirs("media/pdfs", exist_ok=True)
    file_path = f"media/pdfs/gen_{file.filename}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # 1. Extract Text
    full_text = extract_text_from_pdf(file_path)
    if not full_text.strip():
        raise HTTPException(status_code=400, detail="PDF contained no readable text.")

    # 2. Analyze Topics and Style (sample first 4000 chars for analysis)
    analysis_chunk = full_text[:4000]
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    analysis_prompt = f"""Analyze the following RRB exam paper text.
    Determine:
    1. The predominant subject (Mathematics, Reasoning, General Awareness, or General Science).
    2. The key topics covered.
    3. The typical difficulty level.
    4. The language style.

    TEXT: {analysis_chunk}

    Return ONLY a JSON object with: "subject", "topics" (list), "difficulty", "language".
    """
    
    try:
        analysis_resp = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[{"role": "user", "content": analysis_prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        analysis = json.loads(analysis_resp.choices[0].message.content)
    except Exception:
        analysis = {"subject": "General Awareness", "topics": ["Mixed"], "difficulty": "medium", "language": "en"}

    # 3. Generate New Questions
    subject = analysis.get("subject", "General Awareness")
    topics_str = ", ".join(analysis.get("topics", ["Mixed"]))
    difficulty = analysis.get("difficulty", "medium")

    generation_prompt = f"""You are an RRB exam paper setter. 
    Based on the analyzed topics ({topics_str}) and style of a previous year paper, 
    generate {count} BRAND NEW multiple choice questions.
    
    Subject: {subject}
    Difficulty: {difficulty}
    
    CRITICAL: 
    - Questions must be NEW, not direct copies from the source.
    - Match the complexity and pattern of RRB {exam_type} exams.
    - Each question must have 4 options and 1 correct answer.
    - Provide a brief explanation.
    - Return ONLY a JSON array of question objects.
    
    JSON Keys: "text", "option_a", "option_b", "option_c", "option_d", "correct_option" (A/B/C/D), "explanation", "subject", "topic".
    """

    try:
        gen_resp = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[{"role": "user", "content": generation_prompt}],
            temperature=0.4,
            max_tokens=3000,
        )
        
        result_text = gen_resp.choices[0].message.content.strip()
        # Clean potential markdown
        if "[" in result_text:
            result_text = result_text[result_text.find("[") : result_text.rfind("]") + 1]
        
        new_questions = json.loads(result_text)
        
        # 4. Save to DB
        test = MockTest(
            title=f"AI Generated: {title}",
            exam_type=exam_type.lower(),
            subject=subject,
            time_limit=max(15, count * 1.5), # heuristic
            is_pyq=True,
            is_active=True,
            created_by_id=current_user.id
        )
        db.add(test)
        db.commit()
        db.refresh(test)

        saved_count = 0
        for q in new_questions:
            if not q.get("text") or not q.get("option_a"): continue
            
            question = Question(
                text=q.get("text"),
                option_a=q.get("option_a"),
                option_b=q.get("option_b"),
                option_c=q.get("option_c"),
                option_d=q.get("option_d"),
                correct_option=q.get("correct_option", "A").upper(),
                explanation=q.get("explanation", ""),
                subject=q.get("subject", subject),
                topic=q.get("topic", "Mixed"),
                difficulty=difficulty,
                source="ai_generated_pyq",
                exam_type=exam_type.lower(),
                status="approved",
                created_by_id=current_user.id
            )
            db.add(question)
            db.commit()
            db.refresh(question)

            link = MockTestQuestionLink(mock_test_id=test.id, question_id=question.id)
            db.add(link)
            saved_count += 1

        test.total_questions = saved_count
        db.add(test)
        db.commit()

        return {
            "success": True, 
            "test_id": test.id, 
            "questions_generated": saved_count,
            "message": f"Successfully generated {saved_count} AI questions based on the PDF."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/generate/")
async def generate_questions_standalone(
    *,
    db: Session = Depends(get_db),
    data: QuestionGenerationRequest,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Generate RRB exam-relevant MCQ questions using Groq AI.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    exam_type = data.exam_type.upper()
    subject = data.subject
    topic = data.topic
    difficulty = data.difficulty
    language = data.language
    count = min(data.count, 50)  # Cap at 50

    exam_names = {
        "NTPC": "RRB NTPC (Non-Technical Popular Categories)",
        "GROUP_D": "RRB Group D (Level 1)",
        "JE": "RRB Junior Engineer",
        "ALP": "RRB Assistant Loco Pilot",
    }
    exam_full = exam_names.get(exam_type, f"RRB {exam_type}")

    difficulty_guidance = {
        "easy": "Basic level - direct factual recall, simple calculations, straightforward questions that test fundamental knowledge.",
        "medium": "Moderate level - requires application of concepts, multi-step problems, analysis of given data. This is the standard difficulty of actual RRB exams.",
        "hard": "Advanced level - complex reasoning, tricky calculations, questions requiring deep understanding and ability to eliminate distractors."
    }

    lang_instruction = ""
    if language == "hi":
        lang_instruction = "Generate the questions and options in Hindi (Devanagari script)."

    prompt = f"""You are an expert RRB (Railway Recruitment Board) exam question paper setter for Indian Railways.

Generate exactly {count} high-quality MCQ questions for the **{exam_full}** examination.

Subject: **{subject}**
Topic: **{topic}**
Difficulty: **{difficulty}** — {difficulty_guidance.get(difficulty, '')}
{lang_instruction}

CRITICAL REQUIREMENTS:
1. Questions MUST match the actual pattern and difficulty of recent RRB {exam_type} exams (2022-2025).
2. Questions should be the type that have a HIGH probability of appearing in upcoming RRB exams.
3. DO NOT generate any questions related to Probability or Statistics probability topics.
4. Each question must have exactly 4 options with only ONE correct answer.
5. Correct answers should be distributed — don't make all answers option A.
6. Include explanations for each answer.
7. For Mathematics: Use realistic numerical values seen in actual RRB papers.
8. For General Awareness: Focus on current affairs, Indian history, geography, polity, economy, and science that are frequently tested in RRB exams.
9. For Reasoning: Use patterns actually seen in RRB CBT papers.
10. For General Science: Focus on physics, chemistry, and biology topics from the RRB syllabus.

Return ONLY a valid JSON array of objects with these keys:
- "text": the question text (clean, no numbering)
- "option_a": option A text
- "option_b": option B text
- "option_c": option C text
- "option_d": option D text
- "correct_option": the correct answer letter (A, B, C, or D)
- "explanation": brief explanation of why the answer is correct
- "subject": "{subject}"
- "topic": specific sub-topic within {topic}

Return ONLY the JSON array, no markdown, no code blocks:"""

    remaining_count = count
    all_generated_questions = []
    
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Batch generation to avoid token limits (max 10 questions per call)
        while remaining_count > 0:
            current_batch_size = min(remaining_count, 10)
            
            # Adjust prompt for batching
            batch_prompt = f"""You are an expert RRB (Railway Recruitment Board) exam question paper setter for Indian Railways.

Generate exactly {current_batch_size} high-quality MCQ questions for the **{exam_full}** examination.

Subject: **{subject}**
Topic: **{topic}**
Difficulty: **{difficulty}** — {difficulty_guidance.get(difficulty, '')}
{lang_instruction}

CRITICAL REQUIREMENTS:
1. Questions MUST match the actual pattern and difficulty of recent RRB {exam_type} exams (2022-2025).
2. Questions should be the type that have a HIGH probability of appearing in upcoming RRB exams.
3. DO NOT generate any questions related to Probability or Statistics probability topics.
4. Each question must have exactly 4 options with only ONE correct answer.
5. Correct answers should be distributed — don't make all answers option A.
6. Include explanations for each answer.
7. For Mathematics: Use realistic numerical values seen in actual RRB papers.
8. For General Awareness: Focus on current affairs, Indian history, geography, polity, economy, and science that are frequently tested in RRB exams.
9. For Reasoning: Use patterns actually seen in RRB CBT papers.
10. For General Science: Focus on physics, chemistry, and biology topics from the RRB syllabus.

Return ONLY a valid JSON array of objects with these keys:
- "text": the question text (clean, no numbering)
- "option_a": option A text
- "option_b": option B text
- "option_c": option C text
- "option_d": option D text
- "correct_option": the correct answer letter (A, B, C, or D)
- "explanation": brief explanation of why the answer is correct
- "subject": "{subject}"
- "topic": specific sub-topic within {topic}

Return ONLY the JSON array, no markdown, no code blocks:"""

            response = client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert RRB exam question paper setter. You create questions that match real RRB exam patterns. Return only valid JSON arrays. Never use markdown formatting or code blocks."},
                    {"role": "user", "content": batch_prompt}
                ],
                temperature=0.4,
                max_tokens=4096,
            )

            result = response.choices[0].message.content.strip()

            # Robust JSON extraction
            try:
                start_idx = result.find('[')
                end_idx = result.rfind(']')
                if start_idx != -1 and end_idx != -1:
                    result = result[start_idx : end_idx + 1]
                
                questions_data = json.loads(result)
                if isinstance(questions_data, list):
                    all_generated_questions.extend(questions_data)
            except json.JSONDecodeError:
                # Fallback cleanup
                if "```" in result:
                    result = result.split("```")[1]
                    if result.startswith("json"):
                        result = result[4:]
                    questions_data = json.loads(result.strip())
                    if isinstance(questions_data, list):
                        all_generated_questions.extend(questions_data)
            
            remaining_count -= current_batch_size

        # Save to database
        saved_count = 0
        for q in all_generated_questions:
            if not q.get("text") or not q.get("option_a"):
                continue

            question = Question(
                text=q.get("text", ""),
                option_a=q.get("option_a", ""),
                option_b=q.get("option_b", ""),
                option_c=q.get("option_c", ""),
                option_d=q.get("option_d", ""),
                correct_option=q.get("correct_option", "A").upper().strip(),
                explanation=q.get("explanation", ""),
                subject=q.get("subject", subject),
                topic=q.get("topic", topic),
                difficulty=difficulty,
                source="ai_generated",
                exam_type=exam_type.lower(),
                language=language,
                status="approved",
                created_by_id=current_user.id,
            )
            db.add(question)
            saved_count += 1

        if saved_count > 0:
            db.commit()

        return {
            "success": True,
            "questions_generated": saved_count,
            "message": f"Successfully generated {saved_count} {difficulty} {subject} questions for {exam_full}."
        }

    except Exception as e:
        print(f"ERROR: Question generation failed: {str(e)}")
        # Check for token limit errors specifically and return a friendly message
        if "rate_limit_exceeded" in str(e) or "413" in str(e):
            raise HTTPException(
                status_code=413, 
                detail="The request was too large for the AI model. Try reducing the number of questions or simplifying the topic."
            )
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")



@router.delete("/clear-history/")
def clear_pdf_history(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Delete all PDF upload records and physical files.
    """
    pdfs = db.exec(select(PDF)).all()
    
    # Delete physical files
    for pdf in pdfs:
        if pdf.file and os.path.exists(pdf.file):
            try:
                os.remove(pdf.file)
            except Exception:
                pass
                
    # Delete all records
    for pdf in pdfs:
        db.delete(pdf)
        
    db.commit()
    
    return {"success": True, "message": f"Successfully cleared {len(pdfs)} upload records and files."}


@router.get("/list/", response_model=List[PDF])

def read_pdfs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    statement = select(PDF)
    if not current_user.is_staff:
        statement = statement.where(PDF.uploaded_by_id == current_user.id)
    pdfs = db.exec(statement).all()
    return pdfs

