from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session
from core.db import get_db
from models.users import User
from api.deps import get_current_active_user
from utils.chat_service import ChatService
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    response: str

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Send a message to the AI chatbot and get a RAG-powered response.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    chat_service = ChatService(db)
    ai_response = chat_service.generate_response(request.message, request.history)
    
    return ChatResponse(response=ai_response)
