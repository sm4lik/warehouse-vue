const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Получить все единицы измерения
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [units] = await db.query('SELECT * FROM units ORDER BY name');
        res.json({ units });
    } catch (error) {
        console.error('Ошибка получения единиц измерения:', error);
        res.status(500).json({ error: 'Ошибка получения единиц измерения' });
    }
});

module.exports = router;
