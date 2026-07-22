from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float, String
from sqlalchemy.orm import relationship

from ..database import Base


class Attentiveness(Base):
    __tablename__ = "attentiveness"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, default=0.0)
    head_pose = Column(String, nullable=True)
    eye_state = Column(String, nullable=True)

    session = relationship("Session", back_populates="attentiveness_records")
    student = relationship("Student", back_populates="attentiveness_records")

