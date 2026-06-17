const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

router.get('/dashboard', verifyToken, reportController.getDashboardStats);
router.get('/profit', verifyToken, restrictTo('Admin'), reportController.getProfitReport);

module.exports = router;