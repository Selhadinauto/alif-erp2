const { dbQuery, dbGet } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
    try {
        const sales = await dbGet("SELECT SUM(grand_total) as total FROM sales_orders WHERE order_type = 'SALE'", []);
        const lowStock = await dbGet("SELECT COUNT(*) as count FROM products WHERE current_stock <= minimum_stock", []);
        const productsCount = await dbGet("SELECT COUNT(*) as count FROM products", []);
        const customerDebts = await dbGet("SELECT SUM(outstanding_balance) as total FROM customers", []);

        res.json({
            today_sales: sales?.total || 0.0,
            low_stock_alerts: lowStock?.count || 0,
            total_products: productsCount?.count || 0,
            outstanding_debts: customerDebts?.total || 0.0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getProfitReport = async (req, res) => {
    try {
        // Strict analytical visibility bound checks
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, error: "Access to profit margin reporting restricted." });
        }

        const metrics = await dbQuery(`
            SELECT 
                so.invoice_number, so.grand_total, so.created_at,
                SUM(si.qty * si.unit_price) as gross_revenue,
                SUM(si.qty * si.purchase_cost) as total_cost,
                (SUM(si.qty * si.unit_price) - SUM(si.qty * si.purchase_cost)) as net_profit
            FROM sales_orders so
            JOIN sales_items si ON so.id = si.sales_order_id
            WHERE so.order_type = 'SALE'
            GROUP BY so.id ORDER BY so.id DESC
        `);

        res.json(metrics);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};