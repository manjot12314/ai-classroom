from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Classroom, User
from ..auth.dependencies import get_current_user, require_role

router = APIRouter()


class ClassCreate(BaseModel):
    name: str
    schedule: Optional[str] = None


@router.post("", dependencies=[Depends(require_role(["admin", "teacher"]))])
def create_class(payload: ClassCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    classroom = Classroom(name=payload.name, schedule=payload.schedule, teacher_id=user.id)
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


@router.get("")
def list_classes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "teacher":
        return db.query(Classroom).filter(Classroom.teacher_id == user.id).all()
    return db.query(Classroom).all()


@router.get("/{class_id}")
def get_class(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    classroom = db.query(Classroom).get(class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    if user.role == "teacher" and classroom.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return classroom

