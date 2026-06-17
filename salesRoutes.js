const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, salesController.processSale);

module.exports = router;