const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Получить все материалы
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [materials] = await db.query(`
            SELECT m.*, u.name as unit_name, u.short_name as unit_short 
            FROM materials m 
            JOIN units u ON m.unit_id = u.id 
            ORDER BY m.name
        `);
        res.json({ materials });
    } catch (error) {
        console.error('Ошибка получения материалов:', error);
        res.status(500).json({ error: 'Ошибка получения материалов' });
    }
});

// Получить материал по ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [materials] = await db.query(`
            SELECT m.*, u.name as unit_name, u.short_name as unit_short 
            FROM materials m 
            JOIN units u ON m.unit_id = u.id 
            WHERE m.id = ?
        `, [req.params.id]);

        if (materials.length === 0) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        res.json({ material: materials[0] });
    } catch (error) {
        console.error('Ошибка получения материала:', error);
        res.status(500).json({ error: 'Ошибка получения материала' });
    }
});

// Создать материал
router.post('/', authMiddleware, checkRole('admin', 'manager'), [
    body('name').notEmpty().withMessage('Укажите наименование'),
    body('unit_id').isInt({ min: 1 }).withMessage('Некорректная единица измерения'),
    body('quantity').optional().isDecimal().withMessage('Некорректное количество'),
    body('min_quantity').optional().isDecimal().withMessage('Некорректный мин. остаток'),
    body('comment').optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, quantity, unit_id, min_quantity, comment } = req.body;

        const [result] = await db.query(
            'INSERT INTO materials (name, quantity, unit_id, min_quantity, comment) VALUES (?, ?, ?, ?, ?)',
            [name, quantity || 0, unit_id, min_quantity || 0, comment || '']
        );

        // Создание уведомления для админов и менеджеров
        await db.query(
            `INSERT INTO notifications (user_id, sender_id, title, message, type)
             SELECT id, ?, ?, ?, 'material' FROM users WHERE role_id IN (1, 2)`,
            [req.user.id, 'Новый материал', `${req.user.full_name} добавил материал "${name}"`]
        );

        res.status(201).json({
            message: 'Материал создан',
            material_id: result.insertId
        });
    } catch (error) {
        console.error('Ошибка создания материала:', error);
        res.status(500).json({ error: 'Ошибка создания материала' });
    }
});

// Обновить материал
router.put('/:id', authMiddleware, checkRole('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, quantity, unit_id, min_quantity, comment } = req.body;

        const [existing] = await db.query('SELECT id FROM materials WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        const fields = [];
        const values = [];

        if (name) { fields.push('name = ?'); values.push(name); }
        if (quantity !== undefined) { fields.push('quantity = ?'); values.push(quantity); }
        if (unit_id) { fields.push('unit_id = ?'); values.push(unit_id); }
        if (min_quantity !== undefined) { fields.push('min_quantity = ?'); values.push(min_quantity); }
        if (comment !== undefined) { fields.push('comment = ?'); values.push(comment); }

        values.push(id);

        await db.query(
            `UPDATE materials SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Материал обновлен' });
    } catch (error) {
        console.error('Ошибка обновления материала:', error);
        res.status(500).json({ error: 'Ошибка обновления материала' });
    }
});

// Удалить материал
router.delete('/:id', authMiddleware, checkRole('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM materials WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        res.json({ message: 'Материал удален' });
    } catch (error) {
        console.error('Ошибка удаления материала:', error);
        res.status(500).json({ error: 'Ошибка удаления материала' });
    }
});

// Списание материала
router.post('/:id/writeoff', authMiddleware, [
    body('quantity').isFloat({ min: 0.001 }).withMessage('Некорректное количество'),
    body('recipient_name').optional().isString().withMessage('Некорректный получатель'),
    body('comment').optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { quantity, recipient_name, comment } = req.body;
        const qtyToWriteOff = parseFloat(quantity);

        // Проверка материала
        const [materials] = await db.query('SELECT quantity FROM materials WHERE id = ?', [id]);
        if (materials.length === 0) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        const availableQty = parseFloat(materials[0].quantity);
        if (availableQty < qtyToWriteOff) {
            return res.status(400).json({ error: 'Недостаточно материала на складе' });
        }

        // Транзакция
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Обновление количества
            await connection.query(
                'UPDATE materials SET quantity = quantity - ? WHERE id = ?',
                [quantity, id]
            );

            // Создание транзакции
            await connection.query(
                'INSERT INTO transactions (material_id, transaction_type, quantity, user_id, recipient_name, comment) VALUES (?, ?, ?, ?, ?, ?)',
                [id, 'out', quantity, req.user.id, recipient_name || null, comment || '']
            );

            // Создание уведомления для админов и менеджеров
            const materialName = (await connection.query('SELECT name FROM materials WHERE id = ?', [id]))[0][0]?.name;
            await connection.query(
                `INSERT INTO notifications (user_id, sender_id, title, message, type)
                 SELECT id, ?, ?, ?, 'writeoff' FROM users WHERE role_id IN (1, 2)`,
                [req.user.id, 'Списание материала', `${req.user.full_name} списал ${quantity} ${materialName || 'материала'}`]
            );

            await connection.commit();
            res.json({ message: 'Материал списан' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ошибка списания материала:', error);
        res.status(500).json({ error: 'Ошибка списания материала' });
    }
});

// Приход материала
router.post('/:id/add', authMiddleware, checkRole('admin', 'manager'), [
    body('quantity').isFloat({ min: 0.001 }).withMessage('Некорректное количество'),
    body('comment').optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { quantity, comment } = req.body;

        const [existing] = await db.query('SELECT id FROM materials WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                'UPDATE materials SET quantity = quantity + ? WHERE id = ?',
                [quantity, id]
            );

            await connection.query(
                'INSERT INTO transactions (material_id, transaction_type, quantity, user_id, comment) VALUES (?, ?, ?, ?, ?)',
                [id, 'in', quantity, req.user.id, comment || '']
            );

            await connection.commit();
            res.json({ message: 'Материал оприходован' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ошибка оприходования материала:', error);
        res.status(500).json({ error: 'Ошибка оприходования материала' });
    }
});

// Получить историю транзакций материала
router.get('/:id/transactions', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const [transactions] = await db.query(`
            SELECT t.*, u.username, u.full_name,
                   m.name as material_name, mu.short_name as unit_short
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN materials m ON t.material_id = m.id
            JOIN units mu ON m.unit_id = mu.id
            WHERE t.material_id = ?
            ORDER BY t.created_at DESC
            LIMIT 100
        `, [id]);

        res.json({ transactions });
    } catch (error) {
        console.error('Ошибка получения транзакций:', error);
        res.status(500).json({ error: 'Ошибка получения транзакций' });
    }
});

module.exports = router;
