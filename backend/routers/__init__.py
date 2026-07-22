from fastapi import APIRouter

from . import auth, classes, students, sessions, attendance, attentiveness, voice, reports, performance

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/api/auth", tags=["auth"])
api_router.include_router(classes.router, prefix="/api/classes", tags=["classes"])
api_router.include_router(students.router, prefix="/api/students", tags=["students"])
api_router.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
api_router.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
api_router.include_router(attentiveness.router, prefix="/api/attentiveness", tags=["attentiveness"])
api_router.include_router(voice.router, prefix="/api/voice", tags=["voice"])
api_router.include_router(reports.router, prefix="/api/reports", tags=["reports"])
api_router.include_router(performance.router, prefix="/api/performance", tags=["performance"])

