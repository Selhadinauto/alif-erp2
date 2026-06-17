const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../config/database');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
        if (!user) return res.status(404).json({ success: false, error: 'User directory identity mismatch.' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ success: false, error: 'Invalid authentication credentials provided.' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'ALIF_SUPER_SECRET_TOKEN_2026',
            { expiresIn: '12h' }
        );

        await dbRun("INSERT INTO audit_trail (user_id, action, details) VALUES (?, ?, ?)", [user.id, 'LOGIN', `User session explicitly initiated for role: ${user.role}`]);

        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        await dbRun("INSERT INTO audit_trail (user_id, action, details) VALUES (?, ?, ?)", [req.user.id, 'LOGOUT', `User session gracefully terminated.`]);
        res.json({ success: true, message: "Logged out context cleared successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};