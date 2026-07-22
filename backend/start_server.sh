#!/bin/bash
cd "$(dirname "$0")/.."
source backend/venv/bin/activate
export PYTHONUNBUFFERED=1
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload





