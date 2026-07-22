from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from ..database import Base


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    attendance_summary = Column(JSON, nullable=True)
    engagement_metrics = Column(JSON, nullable=True)
    report_data = Column(JSON, nullable=True)

    session = relationship("Session", back_populates="reports")

