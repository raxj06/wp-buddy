const express = require('express');
const router = express.Router();
const campaignsController = require('../controllers/campaignsController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', authenticateToken, campaignsController.getCampaigns);
router.post('/', authenticateToken, campaignsController.createCampaign); // Template creation
router.post('/broadcast', authenticateToken, upload.single('file'), campaignsController.broadcastCampaign); // Blast template to CSV list

module.exports = router;
