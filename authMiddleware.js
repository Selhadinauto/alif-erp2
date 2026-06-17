const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token signature missing.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ALIF_SUPER_SECRET_TOKEN_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or expired session token authentication.' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(432).json({ success: false, error: 'Administrative privilege clearance required.' });
        }
        next();
    };
};

module.exports = { verifyToken, restrictTo };