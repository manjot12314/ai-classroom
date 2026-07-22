from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student
from ..auth.dependencies import get_current_user, require_role
from ..services import face_recognition as face_service

router = APIRouter()


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    class_id: int


@router.post("", dependencies=[Depends(require_role(["admin", "teacher"]))])
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(name=payload.name, email=payload.email, class_id=payload.class_id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", dependencies=[Depends(require_role(["admin", "teacher"]))])
def update_student(student_id: int, payload: StudentCreate, db: Session = Depends(get_db)):
    student = db.query(Student).get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.name = payload.name
    student.email = payload.email
    student.class_id = payload.class_id
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", dependencies=[Depends(require_role(["admin"]))])
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted", "id": student_id}


@router.get("")
def list_students(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role == "teacher":
        return (
            db.query(Student)
            .join(Student.classroom)
            .filter(Student.classroom.has(teacher_id=user.id))
            .all()
        )
    return db.query(Student).all()


@router.post("/{student_id}/face-encoding", dependencies=[Depends(require_role(["admin", "teacher"]))])
async def upload_face(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    student = db.query(Student).get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if not file:
        raise HTTPException(status_code=400, detail="File is required")
    content = await file.read()
    encodings = face_service.encode_faces(content)
    if not encodings:
        raise HTTPException(status_code=400, detail="No face detected")
    if len(encodings) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected; upload a single-face image")
    student.face_encoding = encodings[0]
    db.commit()
    db.refresh(student)
    return {"message": "Face encoding saved", "student_id": student.id}

