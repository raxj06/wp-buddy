const express = require('express');
const router = express.Router();
const flowsController = require('../controllers/flowsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, flowsController.getAllFlows);
router.post('/', authenticateToken, flowsController.createFlow);
router.post('/simulate', authenticateToken, flowsController.simulateFlow);
router.get('/:id', authenticateToken, flowsController.getFlow);
router.put('/:id', authenticateToken, flowsController.updateFlow);
router.delete('/:id', authenticateToken, flowsController.deleteFlow);

module.exports = router;
