const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warehouse_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Проверка подключения
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err.message);
        return;
    }
    console.log('✓ Подключение к MySQL установлено');
    connection.release();
});

const promisePool = pool.promise();
module.exports = promisePool;
