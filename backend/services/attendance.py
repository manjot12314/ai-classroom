from datetime import datetime
from typing import List, Optional, Dict, Any, Set

from sqlalchemy.orm import Session

from ..models import Attendance, Session as ClassSession, Student
from ..utils import file_handlers
from . import face_recognition as face_service


def record_attendance(db: Session, session_id: int, student: Student, confidence: float) -> Attendance:
    entry = Attendance(
        session_id=session_id,
        student_id=student.id,
        detected_at=datetime.utcnow(),
        confidence_score=confidence,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def process_frame(
    db: Session,
    session: ClassSession,
    frame_bytes: bytes,
    tolerance: float = 0.6,
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Process a single uploaded frame (image or extracted video frame) and record attendance.
    Returns a structured response with the matched students and confidence scores.
    """
    if not face_service.is_available():
        return {"records_created": 0, "matches": [], "detail": "Face services unavailable"}

    saved_path: Optional[str] = None
    try:
        saved = file_handlers.save_bytes(frame_bytes, filename or "frame_upload", allowed_mime=content_type)
        saved_path = str(saved)
    except ValueError as exc:
        return {"records_created": 0, "matches": [], "detail": str(exc)}

    students = (
        db.query(Student)
        .filter(Student.class_id == session.class_id, Student.face_encoding.isnot(None))
        .all()
    )
    known = {s.id: s.face_encoding for s in students if s.face_encoding}
    if not known:
        return {"records_created": 0, "matches": [], "detail": "No enrolled faces for class"}

    encodings = face_service.encode_faces(frame_bytes)
    if not encodings:
        return {"records_created": 0, "matches": [], "detail": "No faces detected"}

    new_records: List[Attendance] = []
    matched_students: Set[int] = set()
    matches_detail: List[Dict[str, Any]] = []

    for encoding in encodings:
        matched_student_id, confidence = face_service.match_face(known, encoding, tolerance)
        if matched_student_id is None:
            continue
        if matched_student_id in matched_students:
            continue  # avoid duplicate records per upload
        student = next((s for s in students if s.id == matched_student_id), None)
        if not student:
            continue
        matched_students.add(matched_student_id)
        new_record = record_attendance(db, session.id, student, confidence)
        new_records.append(new_record)
        matches_detail.append({"student_id": student.id, "confidence": confidence})

    return {
        "records_created": len(new_records),
        "matches": matches_detail,
        "detail": "processed",
        "saved_path": saved_path,
    }

