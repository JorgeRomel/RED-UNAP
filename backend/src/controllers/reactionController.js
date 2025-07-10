const db = require('../config/database');
const Joi = require('joi');

const reactionSchema = Joi.object({
  reaction_type: Joi.string().valid('like', 'dislike').required()
});

class ReactionController {
  static async reactToStory(req, res, next) {
    try {
      const storyId = parseInt(req.params.storyId);

      if (!storyId || isNaN(storyId)) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const { error, value } = reactionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Tipo de reacción inválido. Use "like" o "dislike"'
        });
      }

      const { reaction_type } = value;
      const userId = req.user.id;
      const [story] = await db.execute(
        'SELECT id FROM stories WHERE id = ? AND is_published = 1',
        [storyId]
      );

      if (story.length === 0) {
        return res.status(404).json({
          error: 'Historia no encontrada'
        });
      }

      const [existingReaction] = await db.execute(
        'SELECT reaction_type FROM story_reactions WHERE story_id = ? AND user_id = ?',
        [storyId, userId]
      );

      let message;
      let action;

      if (existingReaction.length > 0) {
        const currentReaction = existingReaction[0].reaction_type;
        
        if (currentReaction === reaction_type) {
          await db.execute(
            'DELETE FROM story_reactions WHERE story_id = ? AND user_id = ?',
            [storyId, userId]
          );
          message = `${reaction_type === 'like' ? 'Like' : 'Dislike'} eliminado`;
          action = 'removed';
        } else {
          await db.execute(
            'UPDATE story_reactions SET reaction_type = ?, updated_at = NOW() WHERE story_id = ? AND user_id = ?',
            [reaction_type, storyId, userId]
          );
          message = `Cambiado a ${reaction_type === 'like' ? 'like' : 'dislike'}`;
          action = 'updated';
        }
      } else {
        await db.execute(
          'INSERT INTO story_reactions (story_id, user_id, reaction_type) VALUES (?, ?, ?)',
          [storyId, userId, reaction_type]
        );
        message = `${reaction_type === 'like' ? 'Like' : 'Dislike'} agregado`;
        action = 'added';
      }

      const [stats] = await db.execute(
        'SELECT likes_count, dislikes_count FROM stories WHERE id = ?',
        [storyId]
      );

      res.json({
        message,
        action,
        reaction_type: action === 'removed' ? null : reaction_type,
        stats: stats[0]
      });

    } catch (error) {
      console.error('Error en reactToStory:', error);
      next(error);
    }
  }

  static async reactToComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.commentId);

      if (!commentId || isNaN(commentId)) {
        return res.status(400).json({
          error: 'ID de comentario inválido'
        });
      }

      const { error, value } = reactionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Tipo de reacción inválido. Use "like" o "dislike"'
        });
      }

      const { reaction_type } = value;
      const userId = req.user.id;

      const [comment] = await db.execute(
        'SELECT id FROM story_comments WHERE id = ? AND is_active = TRUE',
        [commentId]
      );

      if (comment.length === 0) {
        return res.status(404).json({
          error: 'Comentario no encontrado'
        });
      }

      const [existingReaction] = await db.execute(
        'SELECT reaction_type FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );

      let message;
      let action;

      if (existingReaction.length > 0) {
        const currentReaction = existingReaction[0].reaction_type;
        
        if (currentReaction === reaction_type) {
          await db.execute(
            'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
          );
          message = `${reaction_type === 'like' ? 'Like' : 'Dislike'} eliminado`;
          action = 'removed';
        } else {
          await db.execute(
            'UPDATE comment_reactions SET reaction_type = ?, updated_at = NOW() WHERE comment_id = ? AND user_id = ?',
            [reaction_type, commentId, userId]
          );
          message = `Cambiado a ${reaction_type === 'like' ? 'like' : 'dislike'}`;
          action = 'updated';
        }
      } else {
        await db.execute(
          'INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (?, ?, ?)',
          [commentId, userId, reaction_type]
        );
        message = `${reaction_type === 'like' ? 'Like' : 'Dislike'} agregado`;
        action = 'added';
      }
      const [stats] = await db.execute(
        'SELECT likes_count, dislikes_count FROM story_comments WHERE id = ?',
        [commentId]
      );

      res.json({
        message,
        action,
        reaction_type: action === 'removed' ? null : reaction_type,
        stats: stats[0]
      });

    } catch (error) {
      console.error('Error en reactToComment:', error);
      next(error);
    }
  }

  static async getStoryReactions(req, res, next) {
    try {
      const storyId = parseInt(req.params.storyId);

      if (!storyId || isNaN(storyId)) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const [stats] = await db.execute(
        'SELECT likes_count, dislikes_count FROM stories WHERE id = ? AND is_published = 1',
        [storyId]
      );

      if (stats.length === 0) {
        return res.status(404).json({
          error: 'Historia no encontrada'
        });
      }
      
      let userReaction = null;
      if (req.user) {
        const [reaction] = await db.execute(
          'SELECT reaction_type FROM story_reactions WHERE story_id = ? AND user_id = ?',
          [storyId, req.user.id]
        );
        userReaction = reaction.length > 0 ? reaction[0].reaction_type : null;
      }

      res.json({
        story_id: storyId,
        likes_count: stats[0].likes_count,
        dislikes_count: stats[0].dislikes_count,
        user_reaction: userReaction
      });

    } catch (error) {
      console.error('Error en getStoryReactions:', error);
      next(error);
    }
  }
}

module.exports = ReactionController;