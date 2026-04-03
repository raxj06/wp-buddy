const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/:contactId', authenticateToken, messagesController.getMessages);
router.post('/send', authenticateToken, messagesController.sendMessage);
router.post('/media', authenticateToken, upload.single('file'), messagesController.sendMedia);

module.exports = router;
