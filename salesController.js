const { db, dbRun, dbGet, dbQuery } = require('../config/database');

exports.processSale = async (req, res) => {
    const { cart, payment_method, order_type, customer_id } = req.body;
    const userId = req.user.id;
    const targetCustomerId = customer_id || 1; // Fallback to walk-in customer

    if (!cart || cart.length === 0) {
        return res.status(400).json({ success: false, error: "Cannot process checkout for an empty cart." });
    }

    try {
        // Fetch operational settings configuration 
        const settings = await dbGet("SELECT * FROM settings ORDER BY id DESC LIMIT 1");
        const vatRate = settings ? settings.vat_rate : 15.0;

        // Perform programmatic subtotal calculations
        let calcSubtotal = 0;
        const verifiedItems = [];

        for (let item of cart) {
            const product = await dbGet("SELECT * FROM products WHERE id = ?", [item.id]);
            if (!product) {
                return res.status(404).json({ success: false, error: `Product ID reference parsing fault: ${item.id}` });
            }

            // Verify live warehouse constraints
            if (order_type !== 'PROFORMA' && product.current_stock < item.qty) {
                return res.status(400).json({ success: false, error: `Insufficient inventory allocation metrics for item: ${product.name}` });
            }

            // Enforce price controls based on role clearance thresholds
            const baselinePrice = product.selling_price;
            const absoluteDiscountPercent = ((baselinePrice - item.custom_price) / baselinePrice) * 100;
            
            if (req.user.role !== 'Admin' && absoluteDiscountPercent > 10.0) {
                return res.status(403).json({ success: false, error: `Discount on item ${product.name} exceeds allowed Cashier ceiling thresholds (10%). Requires admin clearance.` });
            }

            const itemTotal = item.custom_price * item.qty;
            calcSubtotal += itemTotal;

            verifiedItems.push({
                product_id: product.id,
                qty: item.qty,
                unit_price: item.custom_price,
                purchase_cost: product.buying_price, // Track baseline metrics for precise financial analytics
                total_price: itemTotal
            });
        }

        // Apply institutional taxation mappings
        const calcVat = calcSubtotal * (vatRate / 100);
        const calcGrandTotal = calcSubtotal + calcVat;

        // Check customer configuration bounds if processing credit metrics
        if (payment_method === 'Credit') {
            const customer = await dbGet("SELECT * FROM customers WHERE id = ?", [targetCustomerId]);
            if (!customer || customer.type !== 'Credit') {
                return res.status(400).json({ success: false, error: "Selected client demographic does not support credit terms." });
            }
            if ((customer.outstanding_balance + calcGrandTotal) > customer.credit_limit) {
                return res.status(403).json({ success: false, error: "The requested transaction terms exceed structural credit ceilings." });
            }
        }

        // Generate serial structural invoice index tracking codes
        const stamp = Date.now();
        const invoiceNumber = `ALIF-${order_type === 'PROFORMA' ? 'PROF' : 'INV'}-${stamp}`;

        // Initialize Atomic Database Transaction Routine Flow
        await new Promise((resolve, reject) => {
            db.serialize(async () => {
                try {
                    db.run("BEGIN TRANSACTION;");

                    const salesOrderQuery = `
                        INSERT INTO sales_orders (invoice_number, customer_id, user_id, order_type, payment_method, subtotal, vat_amount, grand_total)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    db.run(salesOrderQuery, [invoiceNumber, targetCustomerId, userId, order_type, payment_method, calcSubtotal, calcVat, calcGrandTotal], function(err) {
                        if (err) return reject(err);
                        const orderId = this.lastID;

                        // Map nested relational order item logs
                        for (let element of verifiedItems) {
                            db.run(
                                `INSERT INTO sales_items (sales_order_id, product_id, qty, unit_price, purchase_cost, total_price) VALUES (?, ?, ?, ?, ?, ?)`
                                ,[orderId, element.product_id, element.qty, element.unit_price, element.purchase_cost, element.total_price]
                            );

                            // Process inventory reductions for confirmed orders
                            if (order_type !== 'PROFORMA') {
                                db.run(`UPDATE products SET current_stock = current_stock - ? WHERE id = ?`, [element.qty, element.product_id]);
                            }
                        }

                        // Adjust accounts receivable metrics for credit accounts
                        if (payment_method === 'Credit' && order_type !== 'PROFORMA') {
                            db.run(`UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?`, [calcGrandTotal, targetCustomerId]);
                        }

                        // Commit explicit activity logs
                        db.run(`INSERT INTO audit_trail (user_id, action, details) VALUES (?, ?, ?)`
                            ,[userId, 'TRANSACTION_COMMIT', `Processed ${order_type} transaction: ${invoiceNumber}`]);

                        db.run("COMMIT;", (err) => {
                            if (err) reject(err);
                            else resolve(orderId);
                        });
                    });
                } catch (transactionFail) {
                    db.run("ROLLBACK;");
                    reject(transactionFail);
                }
            });
        });

        res.json({
            success: true,
            invoice_number: invoiceNumber,
            subtotal: calcSubtotal,
            vat_amount: calcVat,
            grand_total: calcGrandTotal,
            payment_method,
            type: order_type,
            created_at: new Date().toISOString()
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};