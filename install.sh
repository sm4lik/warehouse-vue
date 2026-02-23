#!/bin/bash

# Warehouse Management System - Install Script for Linux
# =====================================================

echo "╔═══════════════════════════════════════════════╗"
echo "║     Warehouse Management System Installer     ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js не найден. Установите Node.js 16+${NC}"
        echo "   https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        echo -e "${RED}❌ Требуется Node.js версии 16 или выше${NC}"
        echo "   Текущая версия: $(node -v)"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"
}

# Проверка наличия MySQL
check_mysql() {
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}❌ MySQL не найден. Установите MySQL${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ MySQL: $(mysql --version)${NC}"
}

# Установка зависимостей Backend
install_backend() {
    echo ""
    echo -e "${YELLOW}[1/4] Установка зависимостей Backend...${NC}"
    
    cd backend || exit 1
    
    if [ -f "package.json" ]; then
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Зависимости Backend установлены${NC}"
        else
            echo -e "${RED}❌ Ошибка установки зависимостей Backend${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ package.json не найден${NC}"
        exit 1
    fi
    
    cd ..
}

# Установка зависимостей Frontend
install_frontend() {
    echo ""
    echo -e "${YELLOW}[2/4] Установка зависимостей Frontend...${NC}"
    
    cd frontend || exit 1
    
    if [ -f "package.json" ]; then
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Зависимости Frontend установлены${NC}"
        else
            echo -e "${RED}❌ Ошибка установки зависимостей Frontend${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ package.json не найден${NC}"
        exit 1
    fi
    
    cd ..
}

# Настройка .env файла
setup_env() {
    echo ""
    echo -e "${YELLOW}[3/4] Настройка конфигурации...${NC}"
    
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env 2>/dev/null || {
            echo "PORT=5000" > backend/.env
            echo "DB_HOST=localhost" >> backend/.env
            echo "DB_USER=root" >> backend/.env
            echo "DB_PASSWORD=" >> backend/.env
            echo "DB_NAME=warehouse_db" >> backend/.env
            echo "JWT_SECRET=your-super-secret-jwt-key-change-in-production" >> backend/.env
            echo "UPLOAD_PATH=uploads" >> backend/.env
        }
        echo -e "${GREEN}✓ Файл .env создан${NC}"
    else
        echo -e "${GREEN}✓ Файл .env уже существует${NC}"
    fi
}

# Инициализация базы данных
init_database() {
    echo ""
    echo -e "${YELLOW}[4/4] Инициализация базы данных...${NC}"
    
    # Запрос данных для подключения к MySQL
    read -p "Введите имя пользователя MySQL [root]: " DB_USER
    DB_USER=${DB_USER:-root}
    
    read -sp "Введите пароль MySQL: " DB_PASSWORD
    echo ""
    
    read -p "Введите имя базы данных [warehouse_db]: " DB_NAME
    DB_NAME=${DB_NAME:-warehouse_db}
    
    # Выполнение миграции
    cd backend || exit 1
    
    # Обновление .env
    cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 16)
UPLOAD_PATH=uploads
EOF
    
    # Запуск миграций
    if [ -f "migrate_notifications.js" ]; then
        node migrate_notifications.js
        echo -e "${GREEN}✓ Миграции выполнены${NC}"
    fi
    
    if [ -f "migrate_notes.js" ]; then
        node migrate_notes.js
        echo -e "${GREEN}✓ Миграция заметок выполнена${NC}"
    fi
    
    cd ..
    
    echo -e "${GREEN}✓ База данных настроена${NC}"
}

# Завершение
finish() {
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║          Установка завершена!                 ║"
    echo "╠═══════════════════════════════════════════════╣"
    echo "║  Для запуска выполните:                       ║"
    echo "║    ./start.sh                                 ║"
    echo "║                                               ║"
    echo "║  Backend: http://localhost:5000               ║"
    echo "║  Frontend: http://localhost:3000              ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
}

# Основной процесс установки
main() {
    check_nodejs
    check_mysql
    install_backend
    install_frontend
    setup_env
    init_database
    finish
}

# Запуск
main
