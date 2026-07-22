from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship

from ..database import Base


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    period_start = Column(DateTime, default=datetime.utcnow)
    period_end = Column(DateTime, default=datetime.utcnow)
    attendance_rate = Column(Float, default=0.0)
    avg_attentiveness = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)

    student = relationship("Student", back_populates="performance_metrics")

