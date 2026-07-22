#!/usr/bin/env python3
"""
Script to generate seed_data.sql file with proper bcrypt password hashes.
Run this script to generate the SQL file: python generate_seed_sql.py
"""

from passlib.context import CryptContext
from datetime import datetime, timedelta
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generate password hashes
admin_hash = pwd_context.hash("admin123")
teacher_hash = pwd_context.hash("teacher123")
student_hash = pwd_context.hash("student123")

# Get current timestamp
now = datetime.utcnow()
yesterday = now - timedelta(days=1)
week_ago = now - timedelta(days=7)

sql_content = f"""-- ClassVision AI Seed Data SQL Script
-- Generated on {now.strftime('%Y-%m-%d %H:%M:%S')}
-- 
-- Default passwords:
--   Admin: admin123
--   Teacher: teacher123
--   Student: student123
--
-- Run this script to populate the database with sample data.
-- Make sure to run this after creating the database schema.

-- Clear existing data (optional - uncomment if you want to reset)
-- DELETE FROM daily_reports;
-- DELETE FROM voice_analytics;
-- DELETE FROM performance_metrics;
-- DELETE FROM attentiveness;
-- DELETE FROM attendance;
-- DELETE FROM sessions;
-- DELETE FROM students;
-- DELETE FROM classes;
-- DELETE FROM users;

-- Insert Users
INSERT INTO users (id, email, password_hash, role, created_at) VALUES
(1, 'admin@classvision.ai', '{admin_hash}', 'admin', '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}'),
(2, 'teacher1@classvision.ai', '{teacher_hash}', 'teacher', '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}'),
(3, 'teacher2@classvision.ai', '{teacher_hash}', 'teacher', '{(week_ago + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")}'),
(4, 'student1@classvision.ai', '{student_hash}', 'student', '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(5, 'student2@classvision.ai', '{student_hash}', 'student', '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(6, 'student3@classvision.ai', '{student_hash}', 'student', '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(7, 'student4@classvision.ai', '{student_hash}', 'student', '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(8, 'student5@classvision.ai', '{student_hash}', 'student', '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}');

-- Insert Classes
INSERT INTO classes (id, name, teacher_id, schedule, created_at) VALUES
(1, 'Mathematics 101', 2, 'Monday, Wednesday, Friday 9:00 AM - 10:30 AM', '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}'),
(2, 'Computer Science 201', 2, 'Tuesday, Thursday 2:00 PM - 3:30 PM', '{(week_ago + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")}'),
(3, 'Physics 301', 3, 'Monday, Wednesday 11:00 AM - 12:30 PM', '{(week_ago + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")}');

-- Insert Students
INSERT INTO students (id, name, email, class_id, face_encoding, created_at) VALUES
(1, 'Alice Johnson', 'alice.johnson@student.edu', 1, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(2, 'Bob Smith', 'bob.smith@student.edu', 1, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(3, 'Charlie Brown', 'charlie.brown@student.edu', 1, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(4, 'Diana Prince', 'diana.prince@student.edu', 2, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(5, 'Eve Williams', 'eve.williams@student.edu', 2, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(6, 'Frank Miller', 'frank.miller@student.edu', 3, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}'),
(7, 'Grace Lee', 'grace.lee@student.edu', 3, NULL, '{(week_ago + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")}');

-- Insert Sessions
INSERT INTO sessions (id, class_id, start_time, end_time, status) VALUES
(1, 1, '{(yesterday - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")}', '{(yesterday - timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S")}', 'completed'),
(2, 1, '{yesterday.strftime("%Y-%m-%d %H:%M:%S")}', NULL, 'active'),
(3, 2, '{(yesterday - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S")}', '{(yesterday - timedelta(hours=3, minutes=30)).strftime("%Y-%m-%d %H:%M:%S")}', 'completed'),
(4, 2, '{now.strftime("%Y-%m-%d %H:%M:%S")}', NULL, 'active'),
(5, 3, '{(yesterday - timedelta(days=1, hours=3)).strftime("%Y-%m-%d %H:%M:%S")}', '{(yesterday - timedelta(days=1, hours=1, minutes=30)).strftime("%Y-%m-%d %H:%M:%S")}', 'completed');

-- Insert Attendance Records
INSERT INTO attendance (id, session_id, student_id, detected_at, confidence_score) VALUES
(1, 1, 1, '{(yesterday - timedelta(hours=2, minutes=5)).strftime("%Y-%m-%d %H:%M:%S")}', 0.95),
(2, 1, 2, '{(yesterday - timedelta(hours=2, minutes=3)).strftime("%Y-%m-%d %H:%M:%S")}', 0.92),
(3, 1, 3, '{(yesterday - timedelta(hours=2, minutes=7)).strftime("%Y-%m-%d %H:%M:%S")}', 0.88),
(4, 2, 1, '{(yesterday + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")}', 0.94),
(5, 2, 2, '{(yesterday + timedelta(minutes=3)).strftime("%Y-%m-%d %H:%M:%S")}', 0.91),
(6, 3, 4, '{(yesterday - timedelta(hours=5, minutes=2)).strftime("%Y-%m-%d %H:%M:%S")}', 0.96),
(7, 3, 5, '{(yesterday - timedelta(hours=5, minutes=4)).strftime("%Y-%m-%d %H:%M:%S")}', 0.89),
(8, 4, 4, '{(now - timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S")}', 0.93),
(9, 5, 6, '{(yesterday - timedelta(days=1, hours=3, minutes=2)).strftime("%Y-%m-%d %H:%M:%S")}', 0.97),
(10, 5, 7, '{(yesterday - timedelta(days=1, hours=3, minutes=4)).strftime("%Y-%m-%d %H:%M:%S")}', 0.90);

-- Insert Attentiveness Records
INSERT INTO attentiveness (id, session_id, student_id, timestamp, score, head_pose, eye_state) VALUES
(1, 1, 1, '{(yesterday - timedelta(hours=2, minutes=10)).strftime("%Y-%m-%d %H:%M:%S")}', 0.85, 'forward', 'open'),
(2, 1, 1, '{(yesterday - timedelta(hours=1, minutes=45)).strftime("%Y-%m-%d %H:%M:%S")}', 0.78, 'slightly_left', 'open'),
(3, 1, 2, '{(yesterday - timedelta(hours=2, minutes=8)).strftime("%Y-%m-%d %H:%M:%S")}', 0.92, 'forward', 'open'),
(4, 1, 2, '{(yesterday - timedelta(hours=1, minutes=40)).strftime("%Y-%m-%d %H:%M:%S")}', 0.88, 'forward', 'open'),
(5, 1, 3, '{(yesterday - timedelta(hours=2, minutes=12)).strftime("%Y-%m-%d %H:%M:%S")}', 0.65, 'down', 'half_closed'),
(6, 2, 1, '{(yesterday + timedelta(minutes=8)).strftime("%Y-%m-%d %H:%M:%S")}', 0.90, 'forward', 'open'),
(7, 2, 2, '{(yesterday + timedelta(minutes=6)).strftime("%Y-%m-%d %H:%M:%S")}', 0.82, 'forward', 'open'),
(8, 3, 4, '{(yesterday - timedelta(hours=5, minutes=5)).strftime("%Y-%m-%d %H:%M:%S")}', 0.95, 'forward', 'open'),
(9, 3, 5, '{(yesterday - timedelta(hours=5, minutes=7)).strftime("%Y-%m-%d %H:%M:%S")}', 0.88, 'slightly_right', 'open'),
(10, 4, 4, '{(now - timedelta(minutes=8)).strftime("%Y-%m-%d %H:%M:%S")}', 0.87, 'forward', 'open');

-- Insert Voice Analytics
INSERT INTO voice_analytics (id, session_id, timestamp, activity_level, clarity_score, speaking_pattern) VALUES
(1, 1, '{(yesterday - timedelta(hours=2, minutes=15)).strftime("%Y-%m-%d %H:%M:%S")}', 0.75, 0.82, 'moderate'),
(2, 1, '{(yesterday - timedelta(hours=1, minutes=30)).strftime("%Y-%m-%d %H:%M:%S")}', 0.68, 0.79, 'low'),
(3, 2, '{(yesterday + timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M:%S")}', 0.80, 0.85, 'moderate'),
(4, 3, '{(yesterday - timedelta(hours=5, minutes=10)).strftime("%Y-%m-%d %H:%M:%S")}', 0.72, 0.88, 'moderate'),
(5, 4, '{(now - timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")}', 0.78, 0.83, 'moderate'),
(6, 5, '{(yesterday - timedelta(days=1, hours=3, minutes=8)).strftime("%Y-%m-%d %H:%M:%S")}', 0.70, 0.81, 'low');

-- Insert Performance Metrics
INSERT INTO performance_metrics (id, student_id, period_start, period_end, attendance_rate, avg_attentiveness, overall_score) VALUES
(1, 1, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.95, 0.82, 0.88),
(2, 2, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.90, 0.85, 0.87),
(3, 3, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.75, 0.65, 0.70),
(4, 4, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.88, 0.92, 0.90),
(5, 5, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.85, 0.88, 0.86),
(6, 6, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.92, 0.90, 0.91),
(7, 7, '{week_ago.strftime("%Y-%m-%d %H:%M:%S")}', '{now.strftime("%Y-%m-%d %H:%M:%S")}', 0.80, 0.78, 0.79);

-- Insert Daily Reports
INSERT INTO daily_reports (id, session_id, generated_at, attendance_summary, engagement_metrics, report_data) VALUES
(1, 1, '{(yesterday - timedelta(minutes=20)).strftime("%Y-%m-%d %H:%M:%S")}', 
 '{{"total_students": 3, "present": 3, "absent": 0, "attendance_rate": 1.0}}',
 '{{"avg_attentiveness": 0.82, "high_engagement": 2, "low_engagement": 1}}',
 '{{"summary": "Good class participation with 100% attendance"}}'),
(2, 3, '{(yesterday - timedelta(hours=3, minutes=10)).strftime("%Y-%m-%d %H:%M:%S")}',
 '{{"total_students": 2, "present": 2, "absent": 0, "attendance_rate": 1.0}}',
 '{{"avg_attentiveness": 0.92, "high_engagement": 2, "low_engagement": 0}}',
 '{{"summary": "Excellent engagement throughout the session"}}'),
(3, 5, '{(yesterday - timedelta(days=1, hours=1, minutes=15)).strftime("%Y-%m-%d %H:%M:%S")}',
 '{{"total_students": 2, "present": 2, "absent": 0, "attendance_rate": 1.0}}',
 '{{"avg_attentiveness": 0.88, "high_engagement": 2, "low_engagement": 0}}',
 '{{"summary": "Strong student participation"}}');

-- Reset SQLite sequence numbers (if needed)
-- Note: SQLite doesn't use sequences, but we can update the sqlite_sequence table
-- DELETE FROM sqlite_sequence WHERE name IN ('users', 'classes', 'students', 'sessions', 'attendance', 'attentiveness', 'voice_analytics', 'performance_metrics', 'daily_reports');
"""

# Write to file
with open("seed_data.sql", "w") as f:
    f.write(sql_content)

print("✓ Generated seed_data.sql successfully!")
print("\nDefault passwords:")
print("  - Admin: admin123")
print("  - Teacher: teacher123")
print("  - Student: student123")
print("\nTo use this file:")
print("  sqlite3 classvision.db < seed_data.sql")
print("  OR")
print("  python -c \"from backend.database import engine; exec(open('backend/seed_data.sql').read())\"")

