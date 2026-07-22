from datetime import datetime
from typing import Dict, Any

from sqlalchemy.orm import Session

from ..models import (
    DailyReport,
    Session as ClassSession,
    Attendance,
    Attentiveness,
    VoiceAnalytics,
)


def generate_report(db: Session, session: ClassSession) -> DailyReport:
    attendance_records = (
        db.query(Attendance).filter(Attendance.session_id == session.id).all()
    )
    attentiveness_records = (
        db.query(Attentiveness).filter(Attentiveness.session_id == session.id).all()
    )
    voice_records = db.query(VoiceAnalytics).filter(VoiceAnalytics.session_id == session.id).all()

    attendance_summary: Dict[str, Any] = {
        "present": len(attendance_records),
        "students": [r.student_id for r in attendance_records],
    }
    engagement_metrics = {
        "avg_attentiveness": (
            sum(r.score for r in attentiveness_records) / len(attentiveness_records)
            if attentiveness_records
            else 0.0
        ),
        "voice_activity": (
            sum(r.activity_level for r in voice_records) / len(voice_records)
            if voice_records
            else 0.0
        ),
    }
    report_data = {
        "session_id": session.id,
        "attendance_summary": attendance_summary,
        "engagement_metrics": engagement_metrics,
    }
    report = DailyReport(
        session_id=session.id,
        generated_at=datetime.utcnow(),
        attendance_summary=attendance_summary,
        engagement_metrics=engagement_metrics,
        report_data=report_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

