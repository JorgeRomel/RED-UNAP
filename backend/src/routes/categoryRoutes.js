const express = require('express');
const CategoryController = require('../controllers/categoryController');
const { authenticateToken, guestAccess } = require('../middlewares/auth');

const router = express.Router();
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.split(' ')[1] !== 'null' && authHeader.split(' ')[1] !== 'undefined') {
    authenticateToken(req, res, next);
  } else {
    guestAccess(req, res, next);
  }
};
router.get('/', optionalAuth, CategoryController.getAllCategories);

module.exports = router;