const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/overview', authenticateToken, analyticsController.getOverview);

module.exports = router;
