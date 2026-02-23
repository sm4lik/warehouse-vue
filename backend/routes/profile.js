const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

// Настройка multer для аватара
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Недопустимый тип файла'), false);
        }
    }
});

// Получить профиль текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, full_name, role_id, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const [settings] = await db.query(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ 
            user: users[0],
            settings: settings[0] || {
                theme: 'light',
                notify_supply: true,
                notify_writeoff: true,
                notify_material: true,
                notify_admin: true,
                avatar_path: null
            }
        });
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Ошибка получения профиля' });
    }
});

// Обновить профиль (username, email, full_name)
router.put('/me', authMiddleware, [
    body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Логин от 3 до 50 символов'),
    body('email').optional().isEmail().withMessage('Некорректный email'),
    body('full_name').optional().notEmpty().withMessage('Укажите ФИО')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, full_name } = req.body;
        const fields = [];
        const values = [];

        if (username) {
            // Проверка на дубликат
            const [existing] = await db.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, req.user.id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Такой логин уже занят' });
            }
            fields.push('username = ?');
            values.push(username);
        }

        if (email) {
            // Проверка на дубликат
            const [existing] = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, req.user.id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Такой email уже занят' });
            }
            fields.push('email = ?');
            values.push(email);
        }

        if (full_name) {
            fields.push('full_name = ?');
            values.push(full_name);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        values.push(req.user.id);

        await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Профиль обновлён' });
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
});

// Изменить пароль
router.put('/me/password', authMiddleware, [
    body('current_password').notEmpty().withMessage('Укажите текущий пароль'),
    body('new_password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { current_password, new_password } = req.body;

        const [users] = await db.query(
            'SELECT password FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isValidPassword = await bcrypt.compare(current_password, users[0].password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный текущий пароль' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Пароль изменён' });
    } catch (error) {
        console.error('Ошибка изменения пароля:', error);
        res.status(500).json({ error: 'Ошибка изменения пароля' });
    }
});

// Загрузить аватар
router.post('/me/avatar', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        // Удаление старого аватара
        const [oldSettings] = await db.query(
            'SELECT avatar_path FROM user_settings WHERE user_id = ?',
            [req.user.id]
        );

        if (oldSettings[0] && oldSettings[0].avatar_path) {
            const oldPath = path.join(__dirname, '..', 'uploads', 'avatars', oldSettings[0].avatar_path);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Обновление в БД
        const filename = req.file.filename;
        await db.query(`
            INSERT INTO user_settings (user_id, avatar_path) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE avatar_path = ?
        `, [req.user.id, filename, filename]);

        res.json({ 
            message: 'Аватар загружен',
            avatar_path: `/uploads/avatars/${filename}`
        });
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Файл больше 5MB' });
            }
        }
        res.status(500).json({ error: 'Ошибка загрузки аватара' });
    }
});

// Удалить аватар
router.delete('/me/avatar', authMiddleware, async (req, res) => {
    try {
        const [settings] = await db.query(
            'SELECT avatar_path FROM user_settings WHERE user_id = ?',
            [req.user.id]
        );

        if (settings[0] && settings[0].avatar_path) {
            const avatarPath = path.join(__dirname, '..', 'uploads', 'avatars', settings[0].avatar_path);
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }

        await db.query(
            'UPDATE user_settings SET avatar_path = NULL WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ message: 'Аватар удалён' });
    } catch (error) {
        console.error('Ошибка удаления аватара:', error);
        res.status(500).json({ error: 'Ошибка удаления аватара' });
    }
});

// Обновить настройки (тема, уведомления)
router.put('/me/settings', authMiddleware, [
    body('theme').optional().isIn(['light', 'dark']).withMessage('Некорректная тема'),
    body('notify_supply').optional().isBoolean(),
    body('notify_writeoff').optional().isBoolean(),
    body('notify_material').optional().isBoolean(),
    body('notify_admin').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { theme, notify_supply, notify_writeoff, notify_material, notify_admin } = req.body;

        const fields = [];
        const values = [];

        if (theme !== undefined) {
            fields.push('theme = ?');
            values.push(theme);
        }
        if (notify_supply !== undefined) {
            fields.push('notify_supply = ?');
            values.push(notify_supply ? 1 : 0);
        }
        if (notify_writeoff !== undefined) {
            fields.push('notify_writeoff = ?');
            values.push(notify_writeoff ? 1 : 0);
        }
        if (notify_material !== undefined) {
            fields.push('notify_material = ?');
            values.push(notify_material ? 1 : 0);
        }
        if (notify_admin !== undefined) {
            fields.push('notify_admin = ?');
            values.push(notify_admin ? 1 : 0);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        values.push(req.user.id);

        await db.query(`
            INSERT INTO user_settings (user_id, ${fields.map(f => f.replace(' = ?', '')).join(', ')}) 
            VALUES (?, ${values.slice(0, -1).map(() => '?').join(', ')})
            ON DUPLICATE KEY UPDATE ${fields.join(', ')}`,
            [req.user.id, ...values.slice(0, -1), req.user.id, ...values.slice(0, -1)]
        );

        res.json({ message: 'Настройки обновлены' });
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        res.status(500).json({ error: 'Ошибка обновления настроек' });
    }
});

// Получить настройки
router.get('/me/settings', authMiddleware, async (req, res) => {
    try {
        const [settings] = await db.query(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ 
            settings: settings[0] || {
                theme: 'light',
                notify_supply: true,
                notify_writeoff: true,
                notify_material: true,
                notify_admin: true,
                avatar_path: null
            }
        });
    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ error: 'Ошибка получения настроек' });
    }
});

module.exports = router;
