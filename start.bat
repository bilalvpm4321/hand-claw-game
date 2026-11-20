@echo off
REM Starts a tiny local web server and opens the game (Windows).
cd /d "%~dp0"
echo Claw Catch is running at http://localhost:8000  (close this window to stop)
start "" http://localhost:8000
python -m http.server 8000 || py -m http.server 8000
