const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const materialsRoutes = require('./routes/materials');
const suppliesRoutes = require('./routes/supplies');
const unitsRoutes = require('./routes/units');
const notesRoutes = require('./routes/notes');
const notificationsRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статика для загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/supplies', suppliesRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Warehouse API is running' });
});

// Обработка ошибок 404
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║     Warehouse Management System Backend       ║
╠═══════════════════════════════════════════════╣
║  Сервер запущен: http://localhost:${PORT}        ║
║  API: http://localhost:${PORT}/api/health        ║
╚═══════════════════════════════════════════════╝
    `);
});
