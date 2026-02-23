@echo off
echo ╔═══════════════════════════════════════════════╗
echo ║     Warehouse Management System Startup       ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Запуск backend в фоновом режиме
echo [1/2] Запуск backend сервера...
start "Warehouse Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Запуск frontend
echo [2/2] Запуск frontend сервера...
start "Warehouse Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║  Серверы запущены!                            ║
echo ╠═══════════════════════════════════════════════╣
echo  Backend:  http://localhost:5000                ║
echo  Frontend: http://localhost:3000                ║
echo.
echo  Для остановки закройте окна консоли            ║
echo ╚═══════════════════════════════════════════════╝
echo.
