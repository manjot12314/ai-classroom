# AI Classroom (ClassVision)

Intelligent classroom management system that uses face recognition, attentiveness analysis, and voice analytics to automate attendance and give teachers actionable engagement insights.

## Features

- **Face-recognition attendance** — mark presence from classroom images
- **Attentiveness tracking** — score engagement from head pose and eye state (0–100)
- **Voice analytics** — upload session audio and estimate activity level / speaking pattern
- **Role-based dashboards** — admin, teacher, and student views
- **Session reports & performance metrics** — daily summaries and student trends
- **Mobile app** — Expo/React Native client for attendance and performance

## Tech Stack

| Layer | Stack |
| --- | --- |
| Backend | FastAPI, SQLAlchemy, SQLite, JWT auth |
| AI / CV | `face_recognition`, OpenCV, librosa |
| Web | Next.js 16, React 19, Tailwind CSS, Recharts |
| Mobile | Expo (React Native), Expo Router |

## Project Structure

```
AI Classroom/
├── backend/          # FastAPI API, models, services, seed data
├── frontend/         # Next.js web dashboard
├── app/              # Expo mobile app
├── uploads/          # Uploaded media (faces, audio)
├── diagrams/         # Architecture / DFD Mermaid sources
├── classvision.db    # SQLite database (created at runtime)
└── requirements.txt  # Full Python dependency pin set
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm (or yarn / pnpm)
- For face recognition: system packages often needed by `dlib` / `face_recognition` (e.g. CMake, build tools)

## Quick Start

### 1. Backend

From the project root:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate   # Windows: backend\venv\Scripts\activate
pip install -r requirements.txt    # or: pip install -r backend/requirements.txt
```

Optional environment (create `backend/.env`):

```env
ENVIRONMENT=development
JWT_SECRET_KEY=change-me
SQLITE_PATH=classvision.db
CORS_ORIGINS=["*"]
FILE_UPLOAD_DIR=uploads
```

Start the API (port **8000**):

```bash
# from project root, with venv active
./backend/start_server.sh
# or
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Seed demo data:

```bash
python -m backend.seed_data
```

### 2. Web frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Mobile app (optional)

```bash
cd app
npm install
npx expo start
```

Point the app at your backend URL (local IP + port `8000` when testing on a device).

## Demo Accounts

After seeding (`python -m backend.seed_data`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@classvision.ai` | `admin123` |
| Teacher | `teacher1@classvision.ai` | `teacher123` |
| Student | `student1@classvision.ai` | `student123` |

## API Overview

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Register / login / JWT |
| `/api/classes` | Classrooms |
| `/api/students` | Student CRUD |
| `/api/sessions` | Class sessions |
| `/api/attendance` | Face-based attendance |
| `/api/attentiveness` | Engagement checks |
| `/api/voice` | Voice upload & analytics |
| `/api/reports` | Session / daily reports |
| `/api/performance` | Student performance metrics |

## How Core Metrics Work

- **Attentiveness**: base 50 + 25 if head forward + 25 if eyes open → score 0–100. High engagement ≥ 75.
- **Voice**: RMS energy via librosa → activity level 0.0–1.0; pattern `active` if &gt; 0.3, else `calm`.
- **Engagement in reports**: averages attentiveness and voice activity over the session.

More detail: [`details.md`](./details.md).

## Documentation

- [`synopsis.md`](./synopsis.md) — project synopsis
- [`report.md`](./report.md) — full academic report
- [`details.md`](./details.md) — voice / engagement / attentiveness notes
- [`backend/SEED_DATA_README.md`](./backend/SEED_DATA_README.md) — seed script details
- [`diagrams/`](./diagrams/) — architecture and flow diagrams

## License

Academic / educational project. Use and modify as needed for coursework and demos.
