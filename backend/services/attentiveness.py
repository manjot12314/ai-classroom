from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import Attentiveness, Session as ClassSession, Student


def calculate_attentiveness_score(head_pose: Optional[str], eye_state: Optional[str]) -> float:
    score = 50.0
    if head_pose == "forward":
        score += 25
    if eye_state == "open":
        score += 25
    return max(0.0, min(100.0, score))


def record_attentiveness(
    db: Session,
    session: ClassSession,
    student: Student,
    head_pose: Optional[str] = None,
    eye_state: Optional[str] = None,
) -> Attentiveness:
    score = calculate_attentiveness_score(head_pose, eye_state)
    entry = Attentiveness(
        session_id=session.id,
        student_id=student.id,
        timestamp=datetime.utcnow(),
        score=score,
        head_pose=head_pose,
        eye_state=eye_state,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def bulk_record(
    db: Session,
    session: ClassSession,
    students: List[Student],
    head_pose: Optional[str] = None,
    eye_state: Optional[str] = None,
) -> List[Attentiveness]:
    results: List[Attentiveness] = []
    for student in students:
        results.append(record_attentiveness(db, session, student, head_pose, eye_state))
    return results

