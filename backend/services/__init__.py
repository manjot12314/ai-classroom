# Convenience re-exports
from .face_recognition import encode_faces, match_face, is_available
from .attendance import record_attendance, process_frame
from .attentiveness import record_attentiveness, bulk_record
from .voice_analytics import record_voice_metrics, analyze_audio, is_available as voice_available
from .report_generator import generate_report
from .performance import calculate_for_student

__all__ = [
    "encode_faces",
    "match_face",
    "is_available",
    "record_attendance",
    "process_frame",
    "record_attentiveness",
    "bulk_record",
    "record_voice_metrics",
    "analyze_audio",
    "voice_available",
    "generate_report",
    "calculate_for_student",
]

