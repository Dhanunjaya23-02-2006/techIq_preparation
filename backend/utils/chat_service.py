from typing import List, Optional
from sqlmodel import Session, select, or_
from groq import Groq
from core.config import settings
from models.content import StudyMaterial, CurrentAffairs
from models.questions import Question

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

    def get_relevant_context(self, query: str, limit: int = 5) -> str:
        """
        Retrieves relevant snippets from StudyMaterial, CurrentAffairs, and Questions.
        """
        context_parts = []
        
        # Enhanced keyword extraction
        # Ignore common stop words and focus on subject/topic/term
        stop_words = {'what', 'is', 'the', 'how', 'to', 'in', 'of', 'for', 'with', 'on', 'at', 'from'}
        keywords = [word.lower() for word in query.split() if len(word) > 2 and word.lower() not in stop_words]
        
        if not keywords:
            keywords = [query]

        # 1. Search StudyMaterial
        material_stmt = select(StudyMaterial)
        filters = []
        for kw in keywords[:4]:
            filters.append(StudyMaterial.title.ilike(f"%{kw}%"))
            filters.append(StudyMaterial.content.ilike(f"%{kw}%"))
            filters.append(StudyMaterial.topic.ilike(f"%{kw}%"))
        
        if filters:
            material_stmt = material_stmt.where(or_(*filters))
        
        materials = self.db.exec(material_stmt.limit(3)).all()
        for m in materials:
            snippet = f"MATERIAL [{m.subject}]: {m.title}\n{m.content[:600]}"
            context_parts.append(snippet)

        # 2. Search CurrentAffairs
        affairs_stmt = select(CurrentAffairs).order_by(CurrentAffairs.date.desc())
        filters = []
        for kw in keywords[:4]:
            filters.append(CurrentAffairs.title.ilike(f"%{kw}%"))
            filters.append(CurrentAffairs.content.ilike(f"%{kw}%"))
        
        if filters:
            affairs_stmt = affairs_stmt.where(or_(*filters))
            
        affairs = self.db.exec(affairs_stmt.limit(3)).all()
        for a in affairs:
            snippet = f"NEWS ({a.date}): {a.title}\n{a.content[:500]}"
            context_parts.append(snippet)

        # 3. Search Questions (for examples and explanations)
        if len(context_parts) < limit:
            q_stmt = select(Question)
            filters = []
            for kw in keywords[:3]:
                filters.append(Question.text.ilike(f"%{kw}%"))
                filters.append(Question.explanation.ilike(f"%{kw}%"))
                filters.append(Question.topic.ilike(f"%{kw}%"))
            
            if filters:
                q_stmt = q_stmt.where(or_(*filters))
            
            questions = self.db.exec(q_stmt.limit(2)).all()
            for q in questions:
                snippet = f"EXAMPLE QUESTION: {q.text}\nCorrect Answer: {q.correct_option}\nExplanation: {q.explanation}"
                context_parts.append(snippet)

        return "\n\n---\n\n".join(context_parts)

    def generate_response(self, message: str, chat_history: List[dict] = None) -> str:
        if not self.client:
            return "AI service is not configured."

        context = self.get_relevant_context(message)
        
        # Specialized knowledge integration (like Blood Relations)
        blood_relation_tips = (
            "Blood Relations Tips:\n"
            "- Use Family Trees to visualize relations.\n"
            "- Common terms: Father's Mother = Grandmother, Brother's Wife = Sister-in-law, etc.\n"
            "- Descriptive relations require careful logical steps."
        )

        system_prompt = (
            "You are 'TrackIQ AI', a friendly and knowledgeable HUMAN MENTOR for Indian Railway Exam aspirants. "
            "IMPORTANT STYLE RULES:\n"
            "1. NEVER use '***' or '**' for bolding. Use plain text or CAPITAL LETTERS for emphasis.\n"
            "2. DO NOT look like an AI. Do not use generic AI phrases like 'I am an AI' or 'as an AI'.\n"
            "3. Use a conversational, helpful, and natural tone like a real teacher.\n"
            "4. For reasoning topics like Blood Relations, use these specialized tips: " + blood_relation_tips + "\n\n"
            "RELEVANT KNOWLEDGE FROM DATABASE:\n"
            f"{context if context else 'No specific data found. Help based on your expertise in RRB exams.'}"
        )

        messages = [{"role": "system", "content": system_prompt}]
        if chat_history:
            messages.extend(chat_history[-6:])
        messages.append({"role": "user", "content": message})

        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=settings.AI_MODEL,
                temperature=0.8, # Slightly higher for more natural variety
                max_tokens=1000,
            )
            response = chat_completion.choices[0].message.content
            
            # Post-processing: Forcefully remove AI-style bolding markers
            # This ensures that even if the AI ignores the prompt, the user sees clean text
            import re
            clean_response = re.sub(r'\*\*\*|\*\*', '', response)
            return clean_response.strip()
            
        except Exception as e:
            print(f"Chat error: {e}")
            return "I'm sorry, I'm having a technical issue. Please try again in a bit!"
