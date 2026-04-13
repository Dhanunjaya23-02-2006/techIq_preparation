from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form, BackgroundTasks
import os
import shutil
from sqlmodel import Session, select
from core.db import get_db, engine
from models.content import StudyMaterial, CurrentAffairs
from models.notifications import Notification
from models.users import User
from api.deps import get_current_active_user, get_current_active_superuser
from datetime import date

router = APIRouter()


@router.get("/study-materials/", response_model=List[StudyMaterial])
def read_study_materials(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    subject: Optional[str] = None,
    content_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    statement = select(StudyMaterial)
    if subject:
        statement = statement.where(StudyMaterial.subject == subject)
    if content_type:
        statement = statement.where(StudyMaterial.content_type == content_type)
    
    if not current_user.is_premium and not current_user.is_staff:
        statement = statement.where(StudyMaterial.is_premium == False)
        
    materials = db.exec(statement.offset(skip).limit(limit)).all()
    return materials


@router.post("/study-materials/")
async def create_study_material(
    db: Session = Depends(get_db),
    title: str = Form(...),
    content: Optional[str] = Form(None),
    content_type: str = Form("pdf"),
    subject: str = Form(...),
    topic: Optional[str] = Form(None),
    is_premium: bool = Form(False),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    file_url = None
    if file:
        os.makedirs("media/materials", exist_ok=True)
        file_path = f"media/materials/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/{file_path}"
        
    material = StudyMaterial(
        title=title,
        content=content,
        content_type=content_type,
        subject=subject,
        topic=topic,
        is_premium=is_premium,
        file=file_url,
        created_by_id=current_user.id
    )
    db.add(material)
    
    # Create broadcast notification
    notif_title = "New Study Material Available"
    if content_type == "pyq":
        notif_title = "New Previous Year Question Added"
    
    notification = Notification(
        title=notif_title,
        message=f"'{title}' for {subject} is now live!",
        type="material",
        link="/study-material" 
    )
    db.add(notification)
    
    db.commit()
    db.refresh(material)
    return material


@router.patch("/study-materials/{material_id}/")
async def update_study_material(
    material_id: int,
    db: Session = Depends(get_db),
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    content_type: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    is_premium: Optional[bool] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    material = db.get(StudyMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    if title is not None: material.title = title
    if content is not None: material.content = content
    if content_type is not None: material.content_type = content_type
    if subject is not None: material.subject = subject
    if topic is not None: material.topic = topic
    if is_premium is not None: material.is_premium = bool(is_premium)
    
    if file:
        os.makedirs("media/materials", exist_ok=True)
        file_path = f"media/materials/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        material.file = f"/{file_path}"

    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.delete("/study-materials/{material_id}/")
def delete_study_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    material = db.get(StudyMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    db.delete(material)
    db.commit()
    return {"message": "Material deleted successfully"}


@router.get("/current-affairs/", response_model=List[CurrentAffairs])
async def read_current_affairs(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    # 1. Check if we have news for today
    today = date.today()
    today_count = db.exec(
        select(CurrentAffairs).where(CurrentAffairs.date == today)
    ).first()
    
    # 2. If no news for today, trigger background generation
    if not today_count and not category: 
        background_tasks.add_task(automated_current_affairs_gen)
        
    statement = select(CurrentAffairs).order_by(CurrentAffairs.date.desc())
    if category:
        statement = statement.where(CurrentAffairs.category == category)
        
    articles = db.exec(statement.offset(skip).limit(limit)).all()
    return articles


async def automated_current_affairs_gen():
    from utils.ai_service import CurrentAffairsService
    from datetime import date
    from core.db import engine
    from sqlmodel import Session, select
    
    today = date.today()
    with Session(engine) as db:
        # Double check in case another worker already started it
        existing_today = db.exec(select(CurrentAffairs).where(CurrentAffairs.date == today)).first()
        if existing_today:
            return

        try:
            print("Starting automated current affairs generation...")
            news_items = CurrentAffairsService.fetch_latest_news()
            if not news_items:
                return
                
            summarized_items = CurrentAffairsService.generate_current_affairs_summary(news_items)
            if not summarized_items:
                return
                
            for item in summarized_items:
                # Check if already exists
                existing = db.exec(
                    select(CurrentAffairs).where(
                        CurrentAffairs.title == item["title"],
                        CurrentAffairs.date == today
                    )
                ).first()
                
                if not existing:
                    affair = CurrentAffairs(
                        title=item["title"],
                        content=item["content"],
                        category=item.get("category", "national"),
                        exam_insight=item.get("exam_insight"),
                        importance_score=item.get("importance_score", 5),
                        full_content=item.get("full_content"),
                        date=today
                    )
                    db.add(affair)
            
            db.commit()
            print(f"Successfully automated generation for {today}")
        except Exception as e:
            print(f"Failed automated generation: {e}")
