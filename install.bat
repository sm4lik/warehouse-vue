@echo off
echo ╔═══════════════════════════════════════════════╗
echo ║     Warehouse Management System Launcher      ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Проверка Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js не установлен!
    pause
    exit /b 1
)

REM Проверка MySQL
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] MySQL CLI не найден. Убедитесь, что MySQL запущен.
)

echo.
echo [1/3] Установка зависимостей backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Ошибка установки зависимостей backend!
    pause
    exit /b 1
)

echo.
echo [2/3] Установка зависимостей frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Ошибка установки зависимостей frontend!
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║  Установка завершена!                         ║
echo ╠═══════════════════════════════════════════════╣
echo  Далее выполните следующие шаги:                ║
echo.
echo  1. Создайте базу данных:                       ║
echo     mysql -u root -p ^< backend\database\schema.sql║
echo.
echo  2. Настройте backend\.env файл                 ║
echo.
echo  3. Запустите серверы:                          ║
echo     start.bat                                   ║
echo ╚═══════════════════════════════════════════════╝
echo.
pause
