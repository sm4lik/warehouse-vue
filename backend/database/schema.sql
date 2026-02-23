-- База данных для системы управления складом
CREATE DATABASE IF NOT EXISTS warehouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warehouse_db;

-- Таблица ролей
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Таблица единиц измерения
CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    short_name VARCHAR(10) NOT NULL
);

-- Таблица материалов
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(15,3) DEFAULT 0,
    unit_id INT NOT NULL,
    min_quantity DECIMAL(15,3) DEFAULT 0,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT
);

-- Таблица транзакций (списание/приход)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    transaction_type ENUM('in', 'out') NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    user_id INT NOT NULL,
    recipient_id INT,
    recipient_name VARCHAR(200),
    comment TEXT,
    document_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица поставок
CREATE TABLE IF NOT EXISTS supplies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_number VARCHAR(100) NOT NULL,
    supplier VARCHAR(200) NOT NULL,
    buyer VARCHAR(200) NOT NULL,
    receiver VARCHAR(200) NOT NULL,
    supply_date DATE NOT NULL,
    comment TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Таблица файлов поставок
CREATE TABLE IF NOT EXISTS supply_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supply_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
);

-- Таблица позиций поставок
CREATE TABLE IF NOT EXISTS supply_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supply_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    price DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT
);

-- Таблица заметок пользователей
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    color VARCHAR(20) DEFAULT 'default',
    category VARCHAR(50) DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Заполнение ролей
INSERT INTO roles (name, description) VALUES 
('admin', 'Администратор системы'),
('manager', 'Менеджер склада'),
('user', 'Обычный пользователь');

-- Заполнение единиц измерения
INSERT INTO units (name, short_name) VALUES 
('штука', 'шт'),
('килограмм', 'кг'),
('метр', 'м'),
('литр', 'л'),
('упаковка', 'уп'),
('коробка', 'кор'),
('паллет', 'пал'),
('комплект', 'комп');

-- Создание администратора по умолчанию (пароль: admin123)
INSERT INTO users (username, email, password, full_name, role_id) VALUES 
('admin', 'admin@warehouse.local', '$2a$10$rH9zqX8FQ7N.Pz3kGKZtqO1vYxH5nVz8qL9mJ2wK3pR4tU5vW6xYz', 'Администратор', 1);
