const express = require('express');
const ReactionController = require('../controllers/reactionController');
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

router.post('/story/:storyId', authenticateToken, checkPermission('react_to_stories'), ReactionController.reactToStory);
router.post('/comment/:commentId', authenticateToken, checkPermission('react_to_comments'), ReactionController.reactToComment);
router.get('/story/:storyId', optionalAuth, ReactionController.getStoryReactions);

module.exports = router;