from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import DocumentationGuide
from app.schemas.ticket import DocumentationRead

router = APIRouter(tags=["documentation"])


@router.get("/documentation", response_model=list[DocumentationRead])
def list_documentation(db: Session = Depends(get_db)):
    return list(db.scalars(select(DocumentationGuide).order_by(DocumentationGuide.title)).all())


@router.get("/documentation/{guide_id}", response_model=DocumentationRead)
def get_documentation(guide_id: str, db: Session = Depends(get_db)):
    guide = db.get(DocumentationGuide, guide_id)
    if guide is None:
        raise HTTPException(status_code=404, detail="Troubleshooting guide not found")
    return guide
