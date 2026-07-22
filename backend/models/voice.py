from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float, String
from sqlalchemy.orm import relationship

from ..database import Base


class VoiceAnalytics(Base):
    __tablename__ = "voice_analytics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    activity_level = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    speaking_pattern = Column(String, nullable=True)

    session = relationship("Session", back_populates="voice_records")

