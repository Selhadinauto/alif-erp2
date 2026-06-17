const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, 
        [username, hashedPassword, role], function(err) {
            if (err) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
            if (err || !user) {
                return res.status(400).json({ message: 'Invalid username or password' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid username or password' });
            }
            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                process.env.JWT_SECRET || 'alif_secret_key', 
                { expiresIn: '12h' }
            );
            res.json({ token, role: user.role, username: user.username });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login };