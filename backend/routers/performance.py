from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Classroom
from ..services import performance as performance_service

router = APIRouter()


@router.get("/student/{student_id}")
def student_performance(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return performance_service.calculate_for_student(db, student)


@router.get("/class/{class_id}")
def class_performance(class_id: int, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).get(class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    metrics = [performance_service.calculate_for_student(db, s) for s in classroom.students]
    return metrics

