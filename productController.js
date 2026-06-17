const { dbQuery, dbRun, dbGet } = require('../config/database');

exports.getProducts = async (req, res) => {
    const search = req.query.search || '';
    try {
        let query = "SELECT id, sku, name, category, brand, selling_price, minimum_stock, current_stock, barcode FROM products";
        let params = [];
        
        if (req.user.role === 'Admin') {
            query = "SELECT * FROM products"; // Admin captures historical purchase costs
        }
        
        if (search) {
            query += " WHERE name LIKE ? OR sku LIKE ? OR barcode = ?";
            params = [`%${search}%`, `%${search}%`, search];
        }
        
        const products = await dbQuery(query, params);
        res.json(products);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    const { name, category, brand, buying_price, selling_price, minimum_stock, current_stock, barcode } = req.body;
    try {
        const totalRows = await dbGet("SELECT count(*) as count FROM products");
        const nextId = (totalRows ? totalRows.count : 0) + 1;
        const sku = `PRD-${String(nextId).padStart(6, '0')}`;

        const result = await dbRun(
            `INSERT INTO products (sku, name, category, brand, buying_price, selling_price, minimum_stock, current_stock, barcode) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku, name, category, brand, buying_price, selling_price, minimum_stock, current_stock, barcode]
        );

        await dbRun("INSERT INTO audit_trail (user_id, action, details) VALUES (?, ?, ?)", [req.user.id, 'PRODUCT_CREATE', `Created item SKU ${sku}: ${name}`]);
        res.json({ success: true, id: result.id, sku });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getNextSku = async (req, res) => {
    try {
        const row = await dbGet("SELECT id FROM products ORDER BY id DESC LIMIT 1");
        const nextId = row ? row.id + 1 : 1;
        res.json({ nextSku: `PRD-${String(nextId).padStart(6, '0')}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};