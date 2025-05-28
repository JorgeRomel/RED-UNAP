const express = require('express');
const HomeController = require('../controllers/homeController');
const { authenticateToken, guestAccess, checkPermission } = require('../middlewares/auth');

const router = express.Router();
router.get('/dashboard', authenticateToken, checkPermission('access_home'), HomeController.getDashboard);
router.get('/guest', guestAccess, HomeController.getGuestDashboard);

module.exports = router;