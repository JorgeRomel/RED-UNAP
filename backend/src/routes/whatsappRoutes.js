const express = require('express');
const WhatsAppController = require('../controllers/whatsappController');
const { authenticateToken, checkPermission } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authenticateToken, WhatsAppController.registerPhoneNumber);
router.post('/verify', authenticateToken, WhatsAppController.verifyPhoneNumber);
router.get('/status', authenticateToken, WhatsAppController.getNotificationStatus);
router.put('/preferences', authenticateToken, WhatsAppController.updateNotificationPreferences);
router.delete('/remove', authenticateToken, WhatsAppController.removePhoneNumber);

module.exports = router;