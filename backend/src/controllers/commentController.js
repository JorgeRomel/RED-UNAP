const db = require('../config/database');
const Joi = require('joi');

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'El comentario no puede estar vacío',
    'string.max': 'El comentario no puede exceder 2000 caracteres',
    'any.required': 'El contenido del comentario es requerido'
  }),
  parent_comment_id: Joi.number().integer().positive().optional()
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required()
});

class CommentController {
  static async getCommentsByStory(req, res, next) {
    try {
      const storyId = parseInt(req.params.storyId);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 20));
      const sortBy = req.query.sort || 'newest';
      const offset = (page - 1) * limit;

      if (!storyId || isNaN(storyId)) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const [story] = await db.execute(
        'SELECT id FROM stories WHERE id = ? AND is_published = 1',
        [storyId]
      );

      if (story.length === 0) {
        return res.status(404).json({
          error: 'Historia no encontrada'
        });
      }

      let orderBy = 'sc.created_at DESC';
      switch (sortBy) {
        case 'oldest':
          orderBy = 'sc.created_at ASC';
          break;
        case 'most_liked':
          orderBy = 'sc.likes_count DESC, sc.created_at DESC';
          break;
        default:
          orderBy = 'sc.created_at DESC';
          break;
      }

      const commentsQuery = `
        SELECT 
          sc.id,
          sc.content,
          sc.likes_count,
          sc.dislikes_count,
          sc.replies_count,
          sc.created_at,
          sc.updated_at,
          u.id as author_id,
          u.username as author_name,
          ${req.user ? `
            (SELECT reaction_type FROM comment_reactions cr 
             WHERE cr.comment_id = sc.id AND cr.user_id = ?) as user_reaction
          ` : 'NULL as user_reaction'}
        FROM story_comments sc
        JOIN users u ON sc.user_id = u.id
        WHERE sc.story_id = ? 
          AND sc.parent_comment_id IS NULL 
          AND sc.is_active = TRUE
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      const queryParams = req.user ? 
        [req.user.id, storyId, limit, offset] : 
        [storyId, limit, offset];

      const [comments] = await db.execute(commentsQuery, queryParams);
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const repliesQuery = `
            SELECT 
              sc.id,
              sc.content,
              sc.likes_count,
              sc.dislikes_count,
              sc.created_at,
              sc.updated_at,
              u.id as author_id,
              u.username as author_name,
              ${req.user ? `
                (SELECT reaction_type FROM comment_reactions cr 
                 WHERE cr.comment_id = sc.id AND cr.user_id = ?) as user_reaction
              ` : 'NULL as user_reaction'}
            FROM story_comments sc
            JOIN users u ON sc.user_id = u.id
            WHERE sc.parent_comment_id = ? 
              AND sc.is_active = TRUE
            ORDER BY sc.created_at ASC
            LIMIT 3
          `;

          const repliesParams = req.user ? 
            [req.user.id, comment.id] : 
            [comment.id];

          const [replies] = await db.execute(repliesQuery, repliesParams);

          return {
            ...comment,
            replies: replies || [],
            has_more_replies: comment.replies_count > 3
          };
        })
      );
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM story_comments WHERE story_id = ? AND parent_comment_id IS NULL AND is_active = TRUE',
        [storyId]
      );

      const total = countResult[0].total;

      res.json({
        comments: commentsWithReplies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        sort: sortBy
      });

    } catch (error) {
      console.error('Error en getCommentsByStory:', error);
      next(error);
    }
  }

  static async createComment(req, res, next) {
    try {
      const storyId = parseInt(req.params.storyId);
      
      if (!storyId || isNaN(storyId)) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const { error, value } = createCommentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { content, parent_comment_id } = value;
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

      if (parent_comment_id) {
        const [parentComment] = await db.execute(
          'SELECT id FROM story_comments WHERE id = ? AND story_id = ? AND is_active = TRUE',
          [parent_comment_id, storyId]
        );

        if (parentComment.length === 0) {
          return res.status(404).json({
            error: 'Comentario padre no encontrado'
          });
        }
      }

      const [result] = await db.execute(`
        INSERT INTO story_comments (story_id, user_id, parent_comment_id, content)
        VALUES (?, ?, ?, ?)
      `, [storyId, userId, parent_comment_id || null, content]);

      const [newComment] = await db.execute(`
        SELECT 
          sc.id,
          sc.content,
          sc.likes_count,
          sc.dislikes_count,
          sc.replies_count,
          sc.created_at,
          sc.updated_at,
          u.id as author_id,
          u.username as author_name
        FROM story_comments sc
        JOIN users u ON sc.user_id = u.id
        WHERE sc.id = ?
      `, [result.insertId]);

      const comment = newComment[0];

      res.status(201).json({
        message: parent_comment_id ? 'Respuesta creada exitosamente' : 'Comentario creado exitosamente',
        comment: {
          ...comment,
          user_reaction: null,
          replies: parent_comment_id ? undefined : []
        }
      });

    } catch (error) {
      console.error('Error en createComment:', error);
      next(error);
    }
  }

  static async updateComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.commentId);

      if (!commentId || isNaN(commentId)) {
        return res.status(400).json({
          error: 'ID de comentario inválido'
        });
      }

      const { error, value } = updateCommentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { content } = value;

      const [comment] = await db.execute(
        'SELECT user_id FROM story_comments WHERE id = ? AND is_active = TRUE',
        [commentId]
      );

      if (comment.length === 0) {
        return res.status(404).json({
          error: 'Comentario no encontrado'
        });
      }

      const canEdit = req.user.id === comment[0].user_id || 
                      ['Admin', 'Moderator'].includes(req.user.role_name);

      if (!canEdit) {
        return res.status(403).json({
          error: 'No tienes permisos para editar este comentario'
        });
      }

      await db.execute(
        'UPDATE story_comments SET content = ?, updated_at = NOW() WHERE id = ?',
        [content, commentId]
      );

      res.json({
        message: 'Comentario actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error en updateComment:', error);
      next(error);
    }
  }

  static async deleteComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.commentId);

      if (!commentId || isNaN(commentId)) {
        return res.status(400).json({
          error: 'ID de comentario inválido'
        });
      }

      const [comment] = await db.execute(
        'SELECT user_id FROM story_comments WHERE id = ? AND is_active = TRUE',
        [commentId]
      );

      if (comment.length === 0) {
        return res.status(404).json({
          error: 'Comentario no encontrado'
        });
      }

      const canDelete = req.user.id === comment[0].user_id || 
                        ['Admin', 'Moderator'].includes(req.user.role_name);

      if (!canDelete) {
        return res.status(403).json({
          error: 'No tienes permisos para eliminar este comentario'
        });
      }

      await db.execute(
        'UPDATE story_comments SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
        [commentId]
      );

      res.json({
        message: 'Comentario eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error en deleteComment:', error);
      next(error);
    }
  }
}

module.exports = CommentController;