from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="scheduled")

    classroom = relationship("Classroom", back_populates="sessions")
    attendance_records = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")
    attentiveness_records = relationship("Attentiveness", back_populates="session", cascade="all, delete-orphan")
    voice_records = relationship("VoiceAnalytics", back_populates="session", cascade="all, delete-orphan")
    reports = relationship("DailyReport", back_populates="session", cascade="all, delete-orphan")

