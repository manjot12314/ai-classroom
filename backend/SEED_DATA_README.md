# Database Seed Script

This script populates the database with sample data for development and testing purposes.

## Usage

Run the seed script from the project root directory:

```bash
python -m backend.seed_data
```

Or if you're in the backend directory:

```bash
python seed_data.py
```

## What Gets Created

The script creates the following sample data:

### Users
- **Admin**: `admin@classvision.ai` / `admin123`
- **Teacher 1**: `teacher1@classvision.ai` / `teacher123`
- **Teacher 2**: `teacher2@classvision.ai` / `teacher123`
- **Student 1**: `student1@classvision.ai` / `student123`
- **Student 2**: `student2@classvision.ai` / `student123`
- **Student 3**: `student3@classvision.ai` / `student123`

### Classrooms
- **Mathematics 101** (Teacher 1) - Monday, Wednesday, Friday 9:00 AM - 10:30 AM
- **Computer Science 201** (Teacher 1) - Tuesday, Thursday 2:00 PM - 3:30 PM
- **Physics 301** (Teacher 2) - Monday, Wednesday 11:00 AM - 12:30 PM

### Students
- Alice Johnson, Bob Smith, Charlie Brown → Mathematics 101
- Diana Prince, Eve Wilson → Computer Science 201
- Frank Miller → Physics 301

### Sessions
- 5 sessions for Mathematics 101 (4 completed, 1 active)
- 3 sessions for Computer Science 201 (2 completed, 1 active)

### Additional Data
- **Attendance Records**: ~80% attendance rate for each session
- **Attentiveness Records**: 3-5 records per student per session
- **Voice Analytics**: 2-4 records per session
- **Performance Metrics**: Calculated metrics for each student
- **Daily Reports**: Generated reports for completed sessions

## Notes

- The script is **idempotent** - it checks for existing records before creating new ones
- If a user/classroom/student already exists, it will skip creation and use the existing record
- All passwords are hashed using bcrypt before storage
- Dates are set relative to the current time (sessions in the past, some active)

## Resetting the Database

If you want to start fresh, you can delete the database file and run the seed script again:

```bash
# Delete the database (if using SQLite)
rm classvision.db

# Run the seed script
python -m backend.seed_data
```

**Note**: Make sure to backup any important data before deleting the database!
