const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const upload = require('../middleware/upload');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Получить все поставки
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [supplies] = await db.query(`
            SELECT s.*, u.username, u.full_name as creator_name
            FROM supplies s
            JOIN users u ON s.created_by = u.id
            ORDER BY s.created_at DESC
        `);

        // Получение файлов для каждой поставки
        for (const supply of supplies) {
            const [files] = await db.query(
                'SELECT * FROM supply_files WHERE supply_id = ?',
                [supply.id]
            );
            supply.files = files;
        }

        res.json({ supplies });
    } catch (error) {
        console.error('Ошибка получения поставок:', error);
        res.status(500).json({ error: 'Ошибка получения поставок' });
    }
});

// Получить поставку по ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [supplies] = await db.query(`
            SELECT s.*, u.username, u.full_name as creator_name
            FROM supplies s
            JOIN users u ON s.created_by = u.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (supplies.length === 0) {
            return res.status(404).json({ error: 'Поставка не найдена' });
        }

        const supply = supplies[0];

        // Получение файлов
        const [files] = await db.query(
            'SELECT * FROM supply_files WHERE supply_id = ?',
            [supply.id]
        );
        supply.files = files;

        // Получение позиций
        const [items] = await db.query(`
            SELECT si.*, m.name as material_name, mu.short_name as unit_short
            FROM supply_items si
            JOIN materials m ON si.material_id = m.id
            JOIN units mu ON m.unit_id = mu.id
            WHERE si.supply_id = ?
        `, [supply.id]);
        supply.items = items;

        res.json({ supply });
    } catch (error) {
        console.error('Ошибка получения поставки:', error);
        res.status(500).json({ error: 'Ошибка получения поставки' });
    }
});

// Создать поставку
router.post('/', authMiddleware, checkRole('admin', 'manager'), [
    body('document_number').notEmpty().withMessage('Укажите номер документа'),
    body('supplier').notEmpty().withMessage('Укажите поставщика'),
    body('buyer').notEmpty().withMessage('Укажите покупателя'),
    body('receiver').notEmpty().withMessage('Укажите получателя'),
    body('supply_date').isISO8601().withMessage('Некорректная дата'),
    body('comment').optional(),
    body('items').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { document_number, supplier, buyer, receiver, supply_date, comment, items } = req.body;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Создание поставки
            const [result] = await connection.query(
                'INSERT INTO supplies (document_number, supplier, buyer, receiver, supply_date, comment, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [document_number, supplier, buyer, receiver, supply_date, comment || '', req.user.id]
            );

            const supplyId = result.insertId;

            // Создание позиций и оприходование материалов
            if (items && items.length > 0) {
                for (const item of items) {
                    await connection.query(
                        'INSERT INTO supply_items (supply_id, material_id, quantity, price) VALUES (?, ?, ?, ?)',
                        [supplyId, item.material_id, item.quantity, item.price || 0]
                    );

                    // Оприходование на склад
                    await connection.query(
                        'UPDATE materials SET quantity = quantity + ? WHERE id = ?',
                        [item.quantity, item.material_id]
                    );

                    // Создание транзакции
                    await connection.query(
                        'INSERT INTO transactions (material_id, transaction_type, quantity, user_id, document_number, comment) VALUES (?, ?, ?, ?, ?, ?)',
                        [item.material_id, 'in', item.quantity, req.user.id, document_number, `Поставка #${supplyId}`]
                    );
                }
            }

            await connection.commit();
            
            // Создание уведомления для админов и менеджеров
            await connection.query(
                `INSERT INTO notifications (user_id, sender_id, title, message, type)
                 SELECT id, ?, ?, ?, 'supply' FROM users WHERE role_id IN (1, 2)`,
                [req.user.id, 'Новая поставка', `${req.user.full_name} создал поставку "${document_number}" от ${supply_date}`]
            );
            
            res.status(201).json({
                message: 'Поставка создана',
                supply_id: supplyId
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ошибка создания поставки:', error);
        res.status(500).json({ error: 'Ошибка создания поставки' });
    }
});

// Загрузка файлов для поставки
router.post('/:id/files', authMiddleware, checkRole('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;

        // Проверка существования поставки
        const [supplies] = await db.query('SELECT id FROM supplies WHERE id = ?', [id]);
        if (supplies.length === 0) {
            return res.status(404).json({ error: 'Поставка не найдена' });
        }

        upload.array('files', 10)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'Файлы не загружены' });
            }

            const uploadedFiles = [];

            for (const file of req.files) {
                const [result] = await db.query(
                    'INSERT INTO supply_files (supply_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)',
                    [id, file.originalname, file.filename, file.mimetype, file.size]
                );

                uploadedFiles.push({
                    id: result.insertId,
                    file_name: file.originalname,
                    file_path: file.filename,
                    file_type: file.mimetype,
                    file_size: file.size
                });
            }

            res.status(201).json({
                message: 'Файлы загружены',
                files: uploadedFiles
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
        res.status(500).json({ error: 'Ошибка загрузки файлов' });
    }
});

// Удаление файла
router.delete('/:supplyId/files/:fileId', authMiddleware, checkRole('admin', 'manager'), async (req, res) => {
    try {
        const { supplyId, fileId } = req.params;

        const [files] = await db.query('SELECT file_path FROM supply_files WHERE id = ? AND supply_id = ?', [fileId, supplyId]);
        if (files.length === 0) {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        const filePath = path.join(__dirname, '..', 'uploads', files[0].file_path);
        
        // Удаление файла с диска
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.query('DELETE FROM supply_files WHERE id = ?', [fileId]);

        res.json({ message: 'Файл удален' });
    } catch (error) {
        console.error('Ошибка удаления файла:', error);
        res.status(500).json({ error: 'Ошибка удаления файла' });
    }
});

// Обновить поставку
router.put('/:id', authMiddleware, checkRole('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { document_number, supplier, buyer, receiver, supply_date, comment } = req.body;

        const [existing] = await db.query('SELECT id FROM supplies WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Поставка не найдена' });
        }

        const fields = [];
        const values = [];

        if (document_number) { fields.push('document_number = ?'); values.push(document_number); }
        if (supplier) { fields.push('supplier = ?'); values.push(supplier); }
        if (buyer) { fields.push('buyer = ?'); values.push(buyer); }
        if (receiver) { fields.push('receiver = ?'); values.push(receiver); }
        if (supply_date) { fields.push('supply_date = ?'); values.push(supply_date); }
        if (comment !== undefined) { fields.push('comment = ?'); values.push(comment); }

        values.push(id);

        await db.query(
            `UPDATE supplies SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Поставка обновлена' });
    } catch (error) {
        console.error('Ошибка обновления поставки:', error);
        res.status(500).json({ error: 'Ошибка обновления поставки' });
    }
});

// Удалить поставку
router.delete('/:id', authMiddleware, checkRole('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;

        // Получение файлов для удаления
        const [files] = await db.query('SELECT file_path FROM supply_files WHERE supply_id = ?', [id]);

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Удаление файлов с диска
            for (const file of files) {
                const filePath = path.join(__dirname, '..', 'uploads', file.file_path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await connection.query('DELETE FROM supplies WHERE id = ?', [id]);

            await connection.commit();
            res.json({ message: 'Поставка удалена' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Ошибка удаления поставки:', error);
        res.status(500).json({ error: 'Ошибка удаления поставки' });
    }
});

// Скачать файл
router.get('/:id/files/:fileId/download', authMiddleware, async (req, res) => {
    try {
        const { fileId } = req.params;

        const [files] = await db.query('SELECT * FROM supply_files WHERE id = ?', [fileId]);
        if (files.length === 0) {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        const file = files[0];
        const filePath = path.join(__dirname, '..', 'uploads', file.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Файл не найден на диске' });
        }

        res.download(filePath, file.file_name);
    } catch (error) {
        console.error('Ошибка скачивания файла:', error);
        res.status(500).json({ error: 'Ошибка скачивания файла' });
    }
});

module.exports = router;
