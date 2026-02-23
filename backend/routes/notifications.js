const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Получить все уведомления пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [notifications] = await db.query(`
            SELECT n.*, 
                   u.username as sender_username, 
                   u.full_name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
        `, [req.user.id]);
        
        res.json({ notifications });
    } catch (error) {
        console.error('Ошибка получения уведомлений:', error);
        res.status(500).json({ error: 'Ошибка получения уведомлений' });
    }
});

// Получить непрочитанные уведомления
router.get('/unread', authMiddleware, async (req, res) => {
    try {
        const [notifications] = await db.query(`
            SELECT n.*, 
                   u.username as sender_username, 
                   u.full_name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = ? AND n.is_read = FALSE
            ORDER BY n.created_at DESC
            LIMIT 20
        `, [req.user.id]);
        
        const [count] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        
        res.json({ 
            notifications,
            unreadCount: count[0].count
        });
    } catch (error) {
        console.error('Ошибка получения непрочитанных уведомлений:', error);
        res.status(500).json({ error: 'Ошибка получения уведомлений' });
    }
});

// Отметить уведомление как прочитанное
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        res.json({ message: 'Уведомление отмечено как прочитанное' });
    } catch (error) {
        console.error('Ошибка обновления уведомления:', error);
        res.status(500).json({ error: 'Ошибка обновления уведомления' });
    }
});

// Отметить все уведомления как прочитанные
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        
        res.json({ message: 'Все уведомления отмечены как прочитанные' });
    } catch (error) {
        console.error('Ошибка обновления уведомлений:', error);
        res.status(500).json({ error: 'Ошибка обновления уведомлений' });
    }
});

// Удалить уведомление
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        
        res.json({ message: 'Уведомление удалено' });
    } catch (error) {
        console.error('Ошибка удаления уведомления:', error);
        res.status(500).json({ error: 'Ошибка удаления уведомления' });
    }
});

// Очистить все прочитанные уведомления
router.delete('/read/clear', authMiddleware, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
            [req.user.id]
        );
        
        res.json({ message: 'Прочитанные уведомления удалены' });
    } catch (error) {
        console.error('Ошибка очистки уведомлений:', error);
        res.status(500).json({ error: 'Ошибка очистки уведомлений' });
    }
});

// Админ: Отправить уведомление пользователю или всем
router.post('/send', authMiddleware, checkRole('admin'), [
    body('title').notEmpty().withMessage('Укажите заголовок'),
    body('message').notEmpty().withMessage('Укажите сообщение'),
    body('type').isIn(['supply', 'writeoff', 'material', 'admin', 'system']).withMessage('Некорректный тип'),
    body('user_id').optional().isInt({ min: 1 }).withMessage('Некорректный ID пользователя')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, message, type, user_id } = req.body;

        if (user_id) {
            // Отправить конкретному пользователю
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
                [user_id, req.user.id, title, message, type]
            );
        } else {
            // Отправить всем пользователям
            const [users] = await db.query('SELECT id FROM users');
            
            for (const user of users) {
                await db.query(
                    'INSERT INTO notifications (user_id, sender_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
                    [user.id, req.user.id, title, message, type]
                );
            }
        }

        res.json({ message: 'Уведомление отправлено' });
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
        res.status(500).json({ error: 'Ошибка отправки уведомления' });
    }
});

// Получить список пользователей для отправки уведомлений (для админа)
router.get('/users/list', authMiddleware, checkRole('admin'), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, full_name, email FROM users ORDER BY full_name'
        );
        
        res.json({ users });
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

module.exports = router;
