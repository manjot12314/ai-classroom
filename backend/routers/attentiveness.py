from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Session as ClassSession, Student, Attentiveness
from ..services import attentiveness as attentiveness_service
from ..auth.dependencies import require_role

router = APIRouter()


class AttentivenessPayload(BaseModel):
    session_id: int
    student_id: int
    head_pose: Optional[str] = None
    eye_state: Optional[str] = None


@router.post("", dependencies=[Depends(require_role(["admin", "teacher"]))])
def record(payload: AttentivenessPayload, db: Session = Depends(get_db)):
    session = db.query(ClassSession).get(payload.session_id)
    student = db.query(Student).get(payload.student_id)
    if not session or not student:
        raise HTTPException(status_code=404, detail="Session or student not found")
    return attentiveness_service.record_attentiveness(
        db,
        session=session,
        student=student,
        head_pose=payload.head_pose,
        eye_state=payload.eye_state,
    )


@router.get("/session/{session_id}")
def get_session_attentiveness(session_id: int, db: Session = Depends(get_db)):
    return db.query(Attentiveness).filter(Attentiveness.session_id == session_id).all()

