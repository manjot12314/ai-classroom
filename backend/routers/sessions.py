from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Session as ClassSession, Classroom
from ..auth.dependencies import get_current_user, require_role

router = APIRouter()


class SessionCreate(BaseModel):
    class_id: int
    start_time: Optional[datetime] = None


@router.post("", dependencies=[Depends(require_role(["admin", "teacher"]))])
def create_session(payload: SessionCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    classroom = db.query(Classroom).get(payload.class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    if user.role == "teacher" and classroom.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    session = ClassSession(class_id=payload.class_id, start_time=payload.start_time or datetime.utcnow(), status="active")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/end", dependencies=[Depends(require_role(["admin", "teacher"]))])
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassSession).get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.end_time = datetime.utcnow()
    session.status = "completed"
    db.commit()
    db.refresh(session)
    return session


@router.get("")
def list_sessions(db: Session = Depends(get_db)):
    return db.query(ClassSession).all()

