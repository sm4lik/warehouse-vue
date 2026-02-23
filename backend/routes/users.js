const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Получить всех пользователей (только админ)
router.get('/', authMiddleware, checkRole('admin'), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.is_active, u.created_at, r.name as role_name ' +
            'FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
        );
        res.json({ users });
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// Получить все роли
router.get('/roles', authMiddleware, async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY id');
        res.json({ roles });
    } catch (error) {
        console.error('Ошибка получения ролей:', error);
        res.status(500).json({ error: 'Ошибка получения ролей' });
    }
});

// Создать пользователя (только админ)
router.post('/', authMiddleware, checkRole('admin'), [
    body('username').isLength({ min: 3, max: 50 }).withMessage('Логин от 3 до 50 символов'),
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
    body('full_name').notEmpty().withMessage('Укажите ФИО'),
    body('role_id').isInt({ min: 1 }).withMessage('Некорректная роль')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, full_name, role_id } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (username, email, password, full_name, role_id) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, role_id]
        );

        res.status(201).json({
            message: 'Пользователь создан',
            user_id: result.insertId
        });
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
        res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
});

// Обновить пользователя (только админ)
router.put('/:id', authMiddleware, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, full_name, role_id, is_active } = req.body;

        // Проверка существования
        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Проверка уникальности
        if (username || email) {
            const [duplicates] = await db.query(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username, email, id]
            );
            if (duplicates.length > 0) {
                return res.status(400).json({ error: 'Логин или email уже занят' });
            }
        }

        const fields = [];
        const values = [];

        if (username) { fields.push('username = ?'); values.push(username); }
        if (email) { fields.push('email = ?'); values.push(email); }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            values.push(hashedPassword);
        }
        if (full_name) { fields.push('full_name = ?'); values.push(full_name); }
        if (role_id) { fields.push('role_id = ?'); values.push(role_id); }
        if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

        values.push(id);

        const [result] = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Пользователь обновлен' });
    } catch (error) {
        console.error('Ошибка обновления пользователя:', error);
        res.status(500).json({ error: 'Ошибка обновления пользователя' });
    }
});

// Удалить пользователя (только админ)
router.delete('/:id', authMiddleware, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Нельзя удалить самого себя
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Нельзя удалить самого себя' });
        }

        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ message: 'Пользователь удален' });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

module.exports = router;
