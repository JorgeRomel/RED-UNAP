const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/guest', AuthController.guestAccess);
router.get('/verify', authenticateToken, AuthController.verifyToken);
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

module.exports = router;