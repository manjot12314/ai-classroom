from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from ..models import PerformanceMetric, Student, Attendance, Attentiveness


def calculate_for_student(db: Session, student: Student, days: int = 30) -> PerformanceMetric:
    window_start = datetime.utcnow() - timedelta(days=days)
    attendance_records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student.id, Attendance.detected_at >= window_start)
        .all()
    )
    attentiveness_records = (
        db.query(Attentiveness)
        .filter(Attentiveness.student_id == student.id, Attentiveness.timestamp >= window_start)
        .all()
    )
    attendance_rate = len(attendance_records) / max(1, days)
    avg_attentiveness = (
        sum(r.score for r in attentiveness_records) / len(attentiveness_records)
        if attentiveness_records
        else 0.0
    )
    overall_score = (attendance_rate * 50) + (avg_attentiveness * 0.5)
    metric = PerformanceMetric(
        student_id=student.id,
        period_start=window_start,
        period_end=datetime.utcnow(),
        attendance_rate=attendance_rate,
        avg_attentiveness=avg_attentiveness,
        overall_score=overall_score,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

