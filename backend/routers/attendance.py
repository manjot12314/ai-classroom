from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Session as ClassSession, Attendance
from ..services import attendance as attendance_service
from ..auth.dependencies import require_role

router = APIRouter()


@router.post(
    "/process-video",
    dependencies=[Depends(require_role(["admin", "teacher"]))],
)
async def process_video(
    session_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    session = db.query(ClassSession).get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not file:
        raise HTTPException(status_code=400, detail="File is required")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    result = attendance_service.process_frame(db, session, content, filename=file.filename, content_type=file.content_type)
    return result


@router.get("/session/{session_id}")
def session_attendance(session_id: int, db: Session = Depends(get_db)):
    return db.query(Attendance).filter(Attendance.session_id == session_id).all()

