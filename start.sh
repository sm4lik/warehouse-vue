#!/bin/bash

# Warehouse Management System - Start Script for Linux
# ====================================================

echo "╔═══════════════════════════════════════════════╗"
echo "║     Warehouse Management System Startup       ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Переход в директорию проекта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не найден${NC}"
    exit 1
fi

# Функция для остановки серверов
cleanup() {
    echo ""
    echo -e "${YELLOW}Остановка серверов...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Backend остановлен${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Frontend остановлен${NC}"
    fi
    
    exit 0
}

# Обработка сигнала завершения
trap cleanup SIGINT SIGTERM

# Запуск Backend
echo -e "${YELLOW}[1/2] Запуск backend сервера...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Зависимости backend не найдены. Установка...${NC}"
    npm install
fi

# Запуск в фоне
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!

# Ожидание запуска backend
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend запущен (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Ошибка запуска backend${NC}"
    exit 1
fi

cd ..

# Запуск Frontend
echo -e "${YELLOW}[2/2] Запуск frontend сервера...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Зависимости frontend не найдены. Установка...${NC}"
    npm install
fi

# Запуск в фоне
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Ожидание запуска frontend
sleep 3

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend запущен (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Ошибка запуска frontend${NC}"
    # Остановка backend
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

# Вывод информации
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Серверы запущены!                            ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  ${GREEN}Backend:${NC}  http://localhost:5000/api/health   ${BLUE}║${NC}"
echo -e "${BLUE}║  ${GREEN}Frontend:${NC} http://localhost:3000                 ${BLUE}║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Для остановки нажмите ${YELLOW}Ctrl+C${BLUE}                   ${Blue}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Ожидание завершения работы
wait
