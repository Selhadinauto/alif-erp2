const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.get('/', verifyToken, productController.getProducts);
router.post('/', verifyToken, restrictTo('Admin'), productController.createProduct);
router.get('/next-sku', verifyToken, productController.getNextSku);

module.exports = router;