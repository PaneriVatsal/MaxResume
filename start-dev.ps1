# start-dev.ps1
# This script starts both the FastAPI backend and Next.js frontend

$ProjectRoot = Get-Location

# 1. Start Backend
Write-Host "Starting Backend on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\v\Scripts\activate; uvicorn app.main:app --reload --port 8000"

# 2. Start Frontend
Write-Host "Starting Frontend on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Max Resume is launching!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend API: http://localhost:8000/docs"
