@echo off
echo Starting GroLab...
start "Backend" cmd /k "cd /d %~dp0 && uvicorn main:app --reload --port 8001"
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers starting. Backend: http://localhost:8001  Frontend: http://localhost:3000
