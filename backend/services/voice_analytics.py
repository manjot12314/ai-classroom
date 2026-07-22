from datetime import datetime
from typing import Optional

import numpy as np

try:
    import librosa
except Exception:  # pragma: no cover
    librosa = None

from sqlalchemy.orm import Session

from ..models import VoiceAnalytics, Session as ClassSession


def is_available() -> bool:
    return librosa is not None


def analyze_audio(audio_bytes: bytes, sr: int = 22050) -> tuple[float, float, str]:
    if not is_available():
        return 0.0, 0.0, "unsupported"
    audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(float)
    if audio_np.size == 0:
        return 0.0, 0.0, "silence"
    rms = float(np.sqrt(np.mean(audio_np**2)))
    activity_level = min(1.0, rms / 10000.0)
    clarity_score = activity_level
    speaking_pattern = "active" if activity_level > 0.3 else "calm"
    return activity_level, clarity_score, speaking_pattern


def record_voice_metrics(db: Session, session: ClassSession, audio_bytes: bytes) -> VoiceAnalytics:
    activity_level, clarity_score, speaking_pattern = analyze_audio(audio_bytes)
    entry = VoiceAnalytics(
        session_id=session.id,
        timestamp=datetime.utcnow(),
        activity_level=activity_level,
        clarity_score=clarity_score,
        speaking_pattern=speaking_pattern,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

