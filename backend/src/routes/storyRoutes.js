const express = require('express');
const StoryController = require('../controllers/storyController');
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

router.get('/', optionalAuth, checkPermission('access_stories'), StoryController.getAllStories);
router.get('/:id', optionalAuth, checkPermission('access_stories'), StoryController.getStoryById);
router.post('/', authenticateToken, checkPermission('create_stories'), StoryController.createStory);
router.put('/:id', authenticateToken, checkPermission('edit_stories'), StoryController.updateStory);
router.delete('/:id', authenticateToken, checkPermission('delete_stories'), StoryController.deleteStory);

module.exports = router;