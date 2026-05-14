@echo off
echo Stopping any existing server...
taskkill /F /IM node.exe /T 2>nul
timeout /t 1 /nobreak >nul
echo Starting Hockey App local server...
echo Open http://localhost:3000 in your browser.
echo Press Ctrl+C to stop.
node server.js
pause
