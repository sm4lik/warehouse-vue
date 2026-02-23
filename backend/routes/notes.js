const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Получить все заметки текущего пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [notes] = await db.query(
            'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        
        // Преобразование is_pinned в boolean
        const notesWithBoolean = notes.map(note => ({
            ...note,
            is_pinned: Boolean(note.is_pinned)
        }));
        
        res.json({ notes: notesWithBoolean });
    } catch (error) {
        console.error('Ошибка получения заметок:', error);
        res.status(500).json({ error: 'Ошибка получения заметок' });
    }
});

// Создать заметку
router.post('/', authMiddleware, [
    body('title').notEmpty().withMessage('Укажите заголовок'),
    body('content').notEmpty().withMessage('Укажите содержание'),
    body('color').optional().isString(),
    body('is_pinned').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, color, is_pinned, category } = req.body;

        const [result] = await db.query(
            'INSERT INTO notes (user_id, title, content, color, is_pinned, category) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title, content, color || 'default', is_pinned || false, category || 'general']
        );

        res.status(201).json({
            message: 'Заметка создана',
            note_id: result.insertId
        });
    } catch (error) {
        console.error('Ошибка создания заметки:', error);
        res.status(500).json({ error: 'Ошибка создания заметки' });
    }
});

// Обновить заметку
router.put('/:id', authMiddleware, [
    body('title').optional().notEmpty().withMessage('Укажите заголовок'),
    body('content').optional().notEmpty().withMessage('Укажите содержание'),
    body('color').optional().isString(),
    body('is_pinned').optional().isBoolean()
], async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, color, is_pinned, category } = req.body;

        // Проверка принадлежности заметки
        const [existing] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Заметка не найдена' });
        }

        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (content !== undefined) { fields.push('content = ?'); values.push(content); }
        if (color !== undefined) { fields.push('color = ?'); values.push(color); }
        if (is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(is_pinned); }
        if (category !== undefined) { fields.push('category = ?'); values.push(category); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        values.push(id, req.user.id);

        await db.query(
            `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );

        res.json({ message: 'Заметка обновлена' });
    } catch (error) {
        console.error('Ошибка обновления заметки:', error);
        res.status(500).json({ error: 'Ошибка обновления заметки' });
    }
});

// Удалить заметку
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Заметка не найдена' });
        }

        res.json({ message: 'Заметка удалена' });
    } catch (error) {
        console.error('Ошибка удаления заметки:', error);
        res.status(500).json({ error: 'Ошибка удаления заметки' });
    }
});

// Закрепить/открепить заметку
router.patch('/:id/pin', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_pinned } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Заметка не найдена' });
        }

        await db.query(
            'UPDATE notes SET is_pinned = ? WHERE id = ? AND user_id = ?',
            [is_pinned ? 1 : 0, id, req.user.id]
        );

        res.json({ message: 'Статус закрепления обновлён' });
    } catch (error) {
        console.error('Ошибка обновления закрепления:', error);
        res.status(500).json({ error: 'Ошибка обновления закрепления' });
    }
});

module.exports = router;
