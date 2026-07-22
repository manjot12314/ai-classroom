from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Session as ClassSession, VoiceAnalytics
from ..services import voice_analytics as voice_service
from ..auth.dependencies import require_role

router = APIRouter()


@router.post("/process-audio", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def process_audio(session_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    session = db.query(ClassSession).get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    audio_bytes = await file.read()
    record = voice_service.record_voice_metrics(db, session, audio_bytes)
    return record


@router.get("/session/{session_id}")
def get_voice(session_id: int, db: Session = Depends(get_db)):
    return db.query(VoiceAnalytics).filter(VoiceAnalytics.session_id == session_id).all()

