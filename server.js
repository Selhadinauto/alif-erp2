const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { initializeSchema } = require('./models/schema');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Universal Data Mapping Standard Middleware Configuration
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicit Route Mapping Configurations
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Database File Export and JSON State Backup Routines System Endpoint
app.post('/api/backup/export', async (req, res) => {
    try {
        const sourcePath = path.resolve(__dirname, process.env.DB_PATH || 'alif_erp_prod.db');
        const backupFileName = `backup-alif-erp-${Date.now()}.db`;
        const destPath = path.join(__dirname, 'backups', backupFileName);
        
        if (!fs.existsSync(path.join(__dirname, 'backups'))){
            fs.mkdirSync(path.join(__dirname, 'backups'));
        }

        fs.copyFileSync(sourcePath, destPath);
        res.json({ success: true, message: `Encapsulated backup record stored safely: ${backupFileName}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fallback Route to serve SPA context frame wrapper shells
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

// Structural Schema Initialization Sequence Execution Matrix
initializeSchema().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 System Online. Listening via network interface matrix port: ${PORT}`);
    });
}).catch(err => {
    console.error("❌ Process halted due to persistent architectural initialization fault:", err);
});