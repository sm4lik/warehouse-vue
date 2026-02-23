const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Регистрация
router.post('/register', [
    body('username').isLength({ min: 3, max: 50 }).withMessage('Логин от 3 до 50 символов'),
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
    body('full_name').notEmpty().withMessage('Укажите ФИО'),
    body('role_id').optional().isInt({ min: 1 }).withMessage('Некорректная роль')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, full_name, role_id } = req.body;

        // Проверка существования пользователя
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким логином или email уже существует' });
        }

        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        const roleId = role_id || 3; // По умолчанию пользователь

        const [result] = await db.query(
            'INSERT INTO users (username, email, password, full_name, role_id) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, roleId]
        );

        res.status(201).json({
            message: 'Пользователь зарегистрирован',
            user_id: result.insertId
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

// Вход
router.post('/login', [
    body('username').notEmpty().withMessage('Укажите логин'),
    body('password').notEmpty().withMessage('Укажите пароль')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        const [users] = await db.query(
            'SELECT u.id, u.username, u.email, u.password, u.full_name, u.role_id, u.is_active, r.name as role_name ' +
            'FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Аккаунт заблокирован' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Создание токена
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role_name,
                role_id: user.role_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role_name,
                role_id: user.role_id
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

// Получение текущего пользователя
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await db.query(
            'SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.is_active, r.name as role ' +
            'FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(401).json({ error: 'Неверный токен' });
    }
});

module.exports = router;
