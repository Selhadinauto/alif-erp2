const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeSchema } = require('./schema'); // ወደ መጫኛህ ቦታ ተስተካከለ

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// የኤችቲኤምኤል ፋይሎችህን ቀጥታ እንዲያነብ
app.use(express.static(__dirname));

// Routes (የመንገዶች ጥሪ)
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const salesRoutes = require('./salesRoutes');
const reportRoutes = require('./reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

// ዋና ገጽ መክፈቻ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// ዳታቤዝ አስጀምሮ ሰርቨሩን ማንሳት
initializeSchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Alif ERP Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to initialize database schema:', err);
    });