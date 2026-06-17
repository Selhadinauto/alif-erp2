const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

const initializeSchema = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                // 1. User Management Table
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT CHECK(role IN ('Admin', 'Cashier')) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // 2. System Settings Table
                db.run(`CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_name TEXT DEFAULT 'Alif Lubricants & Auto Spare Parts',
                    tin TEXT DEFAULT '0012345678',
                    phone TEXT DEFAULT '+251911234567',
                    address TEXT DEFAULT 'Addis Ababa, Ethiopia',
                    receipt_footer TEXT DEFAULT 'Thank you for your business! አመሰግናለሁ!',
                    vat_rate REAL DEFAULT 15.0,
                    fs_prefix TEXT DEFAULT 'FS-'
                )`);

                // 3. Customers Directory Table
                db.run(`CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT,
                    type TEXT CHECK(type IN ('Retail', 'Wholesale', 'Credit')) NOT NULL,
                    credit_limit REAL DEFAULT 0.0,
                    outstanding_balance REAL DEFAULT 0.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // 4. Inventory Core Table (With Non-Negative Guardrail Constraint)
                db.run(`CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sku TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    brand TEXT,
                    buying_price REAL NOT NULL,
                    selling_price REAL NOT NULL,
                    minimum_stock INTEGER DEFAULT 5,
                    current_stock INTEGER CHECK(current_stock >= 0) DEFAULT 0,
                    barcode TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                // 5. Transaction Ledger Master Table
                db.run(`CREATE TABLE IF NOT EXISTS sales_orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_number TEXT UNIQUE NOT NULL,
                    customer_id INTEGER,
                    user_id INTEGER,
                    order_type TEXT CHECK(order_type IN ('SALE', 'PROFORMA', 'VOID')) NOT NULL,
                    payment_method TEXT NOT NULL,
                    subtotal REAL NOT NULL,
                    vat_amount REAL NOT NULL,
                    grand_total REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(customer_id) REFERENCES customers(id),
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`);

                // 6. Transaction Line Items Detail Table
                db.run(`CREATE TABLE IF NOT EXISTS sales_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sales_order_id INTEGER,
                    product_id INTEGER,
                    qty INTEGER NOT NULL,
                    unit_price REAL NOT NULL,
                    purchase_cost REAL NOT NULL,
                    total_price REAL NOT NULL,
                    FOREIGN KEY(sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
                    FOREIGN KEY(product_id) REFERENCES products(id)
                )`);

                // 7. Comprehensive Activity System Logs Table
                db.run(`CREATE TABLE IF NOT EXISTS audit_trail (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    details TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`);

                // Insert Default System Entities & Sample Administrative User Configuration
                db.get("SELECT count(*) as count FROM users", [], async (err, row) => {
                    if (row && row.count === 0) {
                        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
                        const hashedCashierPassword = await bcrypt.hash('cashier123', 10);
                        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin', hashedAdminPassword, 'Admin']);
                        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['cashier', hashedCashierPassword, 'Cashier']);
                        db.run("INSERT INTO settings DEFAULT VALUES");
                        
                        // Seed basic customer index
                        db.run("INSERT INTO customers (name, phone, type) VALUES (?, ?, ?)", ['Walk-In Customer', '0000000000', 'Retail']);
                    }
                });

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
};

module.exports = { initializeSchema };