const express = require('express');
const CommentController = require('../controllers/commentController');
const { authenticateToken, guestAccess, checkPermission } = require('../middlewares/auth');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.split(' ')[1] !== 'null' && authHeader.split(' ')[1] !== 'undefined') {
    authenticateToken(req, res, next);
  } else {
    guestAccess(req, res, next);
  }
};

router.get('/story/:storyId', optionalAuth, CommentController.getCommentsByStory);
router.post('/story/:storyId', authenticateToken, checkPermission('create_comments'), CommentController.createComment);
router.put('/:commentId', authenticateToken, checkPermission('edit_comments'), CommentController.updateComment);
router.delete('/:commentId', authenticateToken, checkPermission('delete_comments'), CommentController.deleteComment);

module.exports = router;