const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'warehouse_db'
    });

    try {
        console.log('Выполнение миграции: уведомления и настройки...');

        // Таблица уведомлений
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                sender_id INT,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('supply', 'writeoff', 'material', 'admin', 'system') NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Таблица настроек пользователей
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                theme VARCHAR(20) DEFAULT 'light',
                notify_supply BOOLEAN DEFAULT TRUE,
                notify_writeoff BOOLEAN DEFAULT TRUE,
                notify_material BOOLEAN DEFAULT TRUE,
                notify_admin BOOLEAN DEFAULT TRUE,
                avatar_path VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Создать настройки по умолчанию для существующих пользователей
        await connection.query(`
            INSERT INTO user_settings (user_id)
            SELECT id FROM users
            WHERE id NOT IN (SELECT user_id FROM user_settings)
        `);

        console.log('✓ Таблицы notifications и user_settings успешно созданы!');
    } catch (error) {
        console.error('Ошибка миграции:', error);
    } finally {
        await connection.end();
    }
}

migrate();
