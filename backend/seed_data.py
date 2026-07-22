"""
Seed script to populate the database with sample data for development and testing.
Run this script to create initial data: python -m backend.seed_data
"""

import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .database import SessionLocal, engine, Base
from .models import (
    User, Classroom, Student, Session as ClassSession,
    Attendance, Attentiveness, PerformanceMetric,
    VoiceAnalytics, DailyReport
)
from .auth.jwt import get_password_hash


def create_users(db: Session):
    """Create sample users (admin, teachers, students)"""
    users = [
        {
            "email": "admin@classvision.ai",
            "password": "admin123",
            "role": "admin"
        },
        {
            "email": "teacher1@classvision.ai",
            "password": "teacher123",
            "role": "teacher"
        },
        {
            "email": "teacher2@classvision.ai",
            "password": "teacher123",
            "role": "teacher"
        },
        {
            "email": "student1@classvision.ai",
            "password": "student123",
            "role": "student"
        },
        {
            "email": "student2@classvision.ai",
            "password": "student123",
            "role": "student"
        },
        {
            "email": "student3@classvision.ai",
            "password": "student123",
            "role": "student"
        },
    ]
    
    created_users = {}
    for user_data in users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.flush()
            created_users[user_data["email"]] = user
            print(f"Created user: {user_data['email']} ({user_data['role']})")
        else:
            created_users[user_data["email"]] = existing
            print(f"User already exists: {user_data['email']}")
    
    db.commit()
    return created_users


def create_classrooms(db: Session, users: dict):
    """Create sample classrooms"""
    teacher1 = users.get("teacher1@classvision.ai")
    teacher2 = users.get("teacher2@classvision.ai")
    
    if not teacher1 or not teacher2:
        print("Teachers not found, skipping classroom creation")
        return {}
    
    classrooms = [
        {
            "name": "Mathematics 101",
            "teacher_id": teacher1.id,
            "schedule": "Monday, Wednesday, Friday 9:00 AM - 10:30 AM"
        },
        {
            "name": "Computer Science 201",
            "teacher_id": teacher1.id,
            "schedule": "Tuesday, Thursday 2:00 PM - 3:30 PM"
        },
        {
            "name": "Physics 301",
            "teacher_id": teacher2.id,
            "schedule": "Monday, Wednesday 11:00 AM - 12:30 PM"
        },
    ]
    
    created_classrooms = {}
    for class_data in classrooms:
        existing = db.query(Classroom).filter(
            Classroom.name == class_data["name"]
        ).filter(
            Classroom.teacher_id == class_data["teacher_id"]
        ).first()
        if not existing:
            classroom = Classroom(**class_data, created_at=datetime.utcnow())
            db.add(classroom)
            db.flush()
            created_classrooms[class_data["name"]] = classroom
            print(f"Created classroom: {class_data['name']}")
        else:
            created_classrooms[class_data["name"]] = existing
            print(f"Classroom already exists: {class_data['name']}")
    
    db.commit()
    return created_classrooms


def create_students(db: Session, classrooms: dict, users: dict):
    """Create sample students and assign them to classrooms"""
    # Use the same emails as the student users created in create_users
    # This ensures students can login and see their own performance
    students_data = [
        {
            "name": "Alice Johnson",
            "email": "student1@classvision.ai",
            "class_name": "Mathematics 101"
        },
        {
            "name": "Bob Smith",
            "email": "student2@classvision.ai",
            "class_name": "Mathematics 101"
        },
        {
            "name": "Charlie Brown",
            "email": "student3@classvision.ai",
            "class_name": "Computer Science 201"
        },
    ]
    
    created_students = {}
    for student_data in students_data:
        existing = db.query(Student).filter(Student.email == student_data["email"]).first()
        if not existing:
            classroom = classrooms.get(student_data["class_name"])
            if classroom:
                # Verify that a User with this email exists (for students)
                user = users.get(student_data["email"])
                if not user:
                    print(f"Warning: No user found for {student_data['email']}, student record will be created but may not be able to login")
                
                student = Student(
                    name=student_data["name"],
                    email=student_data["email"],
                    class_id=classroom.id,
                    created_at=datetime.utcnow()
                )
                db.add(student)
                db.flush()
                created_students[student_data["email"]] = student
                print(f"Created student: {student_data['name']} ({student_data['email']}) in {student_data['class_name']}")
            else:
                print(f"Classroom not found: {student_data['class_name']}")
        else:
            created_students[student_data["email"]] = existing
            print(f"Student already exists: {student_data['email']}")
    
    db.commit()
    return created_students


def create_sessions(db: Session, classrooms: dict):
    """Create sample sessions"""
    sessions = []
    
    # Create sessions for Mathematics 101
    math_class = classrooms.get("Mathematics 101")
    if math_class:
        for i in range(5):
            start_time = datetime.utcnow() - timedelta(days=5-i)
            end_time = start_time + timedelta(hours=1, minutes=30)
            status = "completed" if i < 4 else "active"
            
            session = ClassSession(
                class_id=math_class.id,
                start_time=start_time,
                end_time=end_time if status == "completed" else None,
                status=status
            )
            db.add(session)
            db.flush()
            sessions.append(session)
            print(f"Created session for {math_class.name}: {start_time.strftime('%Y-%m-%d %H:%M')}")
    
    # Create sessions for Computer Science 201
    cs_class = classrooms.get("Computer Science 201")
    if cs_class:
        for i in range(3):
            start_time = datetime.utcnow() - timedelta(days=3-i)
            end_time = start_time + timedelta(hours=1, minutes=30)
            status = "completed" if i < 2 else "active"
            
            session = ClassSession(
                class_id=cs_class.id,
                start_time=start_time,
                end_time=end_time if status == "completed" else None,
                status=status
            )
            db.add(session)
            db.flush()
            sessions.append(session)
            print(f"Created session for {cs_class.name}: {start_time.strftime('%Y-%m-%d %H:%M')}")
    
    db.commit()
    return sessions


def create_attendance(db: Session, sessions: list, students: dict):
    """Create sample attendance records"""
    attendance_count = 0
    
    for session in sessions:
        # Get students for this session's class
        class_students = db.query(Student).filter(Student.class_id == session.class_id).all()
        
        for student in class_students:
            # 80% attendance rate
            if random.random() < 0.8:
                attendance = Attendance(
                    session_id=session.id,
                    student_id=student.id,
                    detected_at=session.start_time + timedelta(minutes=random.randint(0, 10)),
                    confidence_score=round(random.uniform(0.85, 0.99), 2)
                )
                db.add(attendance)
                attendance_count += 1
    
    db.commit()
    print(f"Created {attendance_count} attendance records")
    return attendance_count


def create_attentiveness(db: Session, sessions: list, students: dict):
    """Create sample attentiveness records"""
    attentiveness_count = 0
    
    for session in sessions:
        class_students = db.query(Student).filter(Student.class_id == session.class_id).all()
        
        for student in class_students:
            # Create 3-5 attentiveness records per student per session
            num_records = random.randint(3, 5)
            for i in range(num_records):
                timestamp = session.start_time + timedelta(minutes=i * 20)
                head_pose = random.choice(["forward", "left", "right", "down"])
                eye_state = random.choice(["open", "open", "open", "closed"])  # Mostly open
                score = round(random.uniform(0.6, 0.95), 2) if eye_state == "open" else round(random.uniform(0.3, 0.6), 2)
                
                attentiveness = Attentiveness(
                    session_id=session.id,
                    student_id=student.id,
                    timestamp=timestamp,
                    score=score,
                    head_pose=head_pose,
                    eye_state=eye_state
                )
                db.add(attentiveness)
                attentiveness_count += 1
    
    db.commit()
    print(f"Created {attentiveness_count} attentiveness records")
    return attentiveness_count


def create_voice_analytics(db: Session, sessions: list):
    """Create sample voice analytics records"""
    voice_count = 0
    
    for session in sessions:
        # Create 2-4 voice analytics records per session
        num_records = random.randint(2, 4)
        for i in range(num_records):
            timestamp = session.start_time + timedelta(minutes=i * 25)
            voice = VoiceAnalytics(
                session_id=session.id,
                timestamp=timestamp,
                activity_level=round(random.uniform(0.5, 0.9), 2),
                clarity_score=round(random.uniform(0.7, 0.95), 2),
                speaking_pattern=random.choice(["normal", "fast", "slow", "interactive"])
            )
            db.add(voice)
            voice_count += 1
    
    db.commit()
    print(f"Created {voice_count} voice analytics records")
    return voice_count


def create_performance_metrics(db: Session, students: dict):
    """Create sample performance metrics for students"""
    metrics_count = 0
    
    for student in students.values():
        # Create a performance metric for the last 30 days
        period_start = datetime.utcnow() - timedelta(days=30)
        period_end = datetime.utcnow()
        
        # Calculate attendance rate (based on actual attendance if exists)
        attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        total_sessions = db.query(ClassSession).filter(ClassSession.class_id == student.class_id).count()
        attendance_rate = (len(attendance_records) / total_sessions * 100) if total_sessions > 0 else round(random.uniform(70, 95), 2)
        
        # Calculate average attentiveness
        attentiveness_records = db.query(Attentiveness).filter(Attentiveness.student_id == student.id).all()
        avg_attentiveness = sum(r.score for r in attentiveness_records) / len(attentiveness_records) * 100 if attentiveness_records else round(random.uniform(65, 90), 2)
        
        # Overall score (weighted average)
        overall_score = (attendance_rate * 0.4 + avg_attentiveness * 0.6)
        
        metric = PerformanceMetric(
            student_id=student.id,
            period_start=period_start,
            period_end=period_end,
            attendance_rate=round(attendance_rate, 2),
            avg_attentiveness=round(avg_attentiveness, 2),
            overall_score=round(overall_score, 2)
        )
        db.add(metric)
        metrics_count += 1
        print(f"Created performance metric for {student.name}: {overall_score:.1f}%")
    
    db.commit()
    print(f"Created {metrics_count} performance metrics")
    return metrics_count


def create_daily_reports(db: Session, sessions: list):
    """Create sample daily reports for completed sessions"""
    reports_count = 0
    
    for session in sessions:
        if session.status == "completed":
            # Get attendance summary
            attendance_records = db.query(Attendance).filter(Attendance.session_id == session.id).all()
            total_students = db.query(Student).filter(Student.class_id == session.class_id).count()
            present_count = len(attendance_records)
            
            attendance_summary = {
                "total_students": total_students,
                "present": present_count,
                "absent": total_students - present_count,
                "attendance_rate": round((present_count / total_students * 100) if total_students > 0 else 0, 2)
            }
            
            # Get engagement metrics
            attentiveness_records = db.query(Attentiveness).filter(Attentiveness.session_id == session.id).all()
            avg_score = sum(r.score for r in attentiveness_records) / len(attentiveness_records) if attentiveness_records else 0.75
            
            engagement_metrics = {
                "avg_attentiveness": round(avg_score * 100, 2),
                "total_checks": len(attentiveness_records),
                "high_engagement": len([r for r in attentiveness_records if r.score > 0.8]),
                "low_engagement": len([r for r in attentiveness_records if r.score < 0.5])
            }
            
            report_data = {
                "summary": f"Session completed on {session.start_time.strftime('%Y-%m-%d')}",
                "duration_minutes": int((session.end_time - session.start_time).total_seconds() / 60) if session.end_time else 90,
                "class_name": session.classroom.name if session.classroom else "Unknown"
            }
            
            report = DailyReport(
                session_id=session.id,
                generated_at=session.end_time or datetime.utcnow(),
                attendance_summary=attendance_summary,
                engagement_metrics=engagement_metrics,
                report_data=report_data
            )
            db.add(report)
            reports_count += 1
            print(f"Created daily report for session {session.id}")
    
    db.commit()
    print(f"Created {reports_count} daily reports")
    return reports_count


def main():
    """Main function to seed the database"""
    print("=" * 60)
    print("Starting database seeding...")
    print("=" * 60)
    
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create data in order
        print("\n1. Creating users...")
        users = create_users(db)
        
        print("\n2. Creating classrooms...")
        classrooms = create_classrooms(db, users)
        
        print("\n3. Creating students...")
        students = create_students(db, classrooms, users)
        
        print("\n4. Creating sessions...")
        sessions = create_sessions(db, classrooms)
        
        print("\n5. Creating attendance records...")
        create_attendance(db, sessions, students)
        
        print("\n6. Creating attentiveness records...")
        create_attentiveness(db, sessions, students)
        
        print("\n7. Creating voice analytics...")
        create_voice_analytics(db, sessions)
        
        print("\n8. Creating performance metrics...")
        create_performance_metrics(db, students)
        
        print("\n9. Creating daily reports...")
        create_daily_reports(db, sessions)
        
        print("\n" + "=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print("\nSample login credentials:")
        print("  Admin:    admin@classvision.ai / admin123")
        print("  Teacher1: teacher1@classvision.ai / teacher123")
        print("  Teacher2: teacher2@classvision.ai / teacher123")
        print("  Student1: student1@classvision.ai / student123")
        print("\n")
        
    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
   