const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

// Embedded signup onboarding
router.post('/complete-onboarding-v4', authenticateToken, whatsappController.completeOnboarding);

// Webhooks
router.get('/whatsapp-webhooks', whatsappController.verifyWebhook);
router.post('/whatsapp-webhooks', whatsappController.handleWebhook);

// Pull Method for customer messages
router.get('/api/v1/messages/:wabaId', whatsappController.pullMessages);

// WhatsApp Accounts
router.get('/api/whatsapp/accounts', authenticateToken, whatsappController.getAccounts);
router.post('/api/whatsapp/accounts', authenticateToken, whatsappController.addManualAccount);
router.get('/api/whatsapp/accounts/:wabaId', authenticateToken, whatsappController.getAccountDetails);
router.delete('/api/whatsapp/accounts/:wabaId', authenticateToken, whatsappController.removeAccount);

module.exports = router;
