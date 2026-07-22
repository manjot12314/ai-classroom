from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Session as ClassSession, DailyReport
from ..services import report_generator
from ..auth.dependencies import require_role

router = APIRouter()


@router.post("/generate", dependencies=[Depends(require_role(["admin", "teacher"]))])
def generate(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassSession).get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return report_generator.generate_report(db, session)


@router.get("/session/{session_id}")
def get_reports(session_id: int, db: Session = Depends(get_db)):
    return db.query(DailyReport).filter(DailyReport.session_id == session_id).all()

