@echo off
echo Starting GroLab...

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Installing/checking dependencies...
call venv\Scripts\activate.bat && pip install -r requirements.txt -q

start "Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn main:app --port 8001"
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers starting. Backend: http://localhost:8001  Frontend: http://localhost:3000
