const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken, checkPermission } = require('../middlewares/auth');

const router = express.Router();

router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);
router.get('/', authenticateToken, checkPermission('manage_users'), UserController.getAllUsers);

module.exports = router;