const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');
const { authenticateToken } = require('../middleware/auth');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', authenticateToken, contactsController.getAllContacts);
router.post('/', authenticateToken, contactsController.createContact);
router.post('/upload', authenticateToken, upload.single('file'), contactsController.uploadContactsCSV);

module.exports = router;
