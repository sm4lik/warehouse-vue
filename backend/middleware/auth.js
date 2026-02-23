const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Ошибка авторизации:', error.message);
        return res.status(401).json({ error: 'Неверный токен авторизации' });
    }
};

// Middleware для проверки роли
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        
        next();
    };
};

module.exports = { authMiddleware, checkRole };
