# PowerShell Setup and Run Script for FastAPI Sandbox App

# Check if Python is installed
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    Exit 1
}

# Create virtual environment if it does not exist
if (-not (Test-Path ".venv")) {
    Write-Host "[INFO] Creating virtual environment (.venv)..." -ForegroundColor Cyan
    python -m venv .venv
}

# Define virtual environment binary path
$pip_path = ".venv\Scripts\pip.exe"
$python_path = ".venv\Scripts\python.exe"

# Install packages
Write-Host "[INFO] Installing Python dependencies from requirements.txt..." -ForegroundColor Cyan
& $pip_path install -r requirements.txt

# Launch web server
Write-Host "[SUCCESS] CyberGuard AI server is starting!" -ForegroundColor Green
Write-Host "[INFO] Please navigate to http://127.0.0.1:8000/ inside your browser." -ForegroundColor Green
& $python_path -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
