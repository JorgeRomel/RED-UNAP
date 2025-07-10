const db = require('../config/database');
const Joi = require('joi');
const storySchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  content: Joi.string().min(10).required(),
  summary: Joi.string().max(500).optional().allow(''),
  category_id: Joi.number().integer().positive().required(),
  image_url: Joi.string().uri().optional().allow('')
});

class StoryController {
  static async getAllStories(req, res, next) {
    try {
      const includeStats = req.query.include_stats === 'true';
      const userId = req.user ? req.user.id : null;
      let simpleQuery = `
        SELECT s.id, s.title, s.summary, s.published_at, s.image_url,
               c.name as category, u.username as author
      `;
      if (includeStats) {
        simpleQuery += `, s.likes_count, s.dislikes_count, s.comments_count`;
        
        if (userId) {
          simpleQuery += `, (SELECT reaction_type FROM story_reactions sr 
                              WHERE sr.story_id = s.id AND sr.user_id = ${userId}) as user_reaction`;
        } else {
          simpleQuery += `, NULL as user_reaction`;
        }
      }
      
      simpleQuery += `
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_published = 1
        ORDER BY s.published_at DESC
      `;
      
      console.log('Ejecutando consulta simple...');
      const [allStories] = await db.execute(simpleQuery);
      console.log('Consulta simple exitosa. Total historias:', allStories.length);
      
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStories = allStories.slice(startIndex, endIndex);
      
      const formattedStories = paginatedStories.map(story => ({
        ...story,
        published_at: story.published_at ? story.published_at.toISOString() : null
      }));
      
      const total = allStories.length;
      const totalPages = Math.ceil(total / limit);
      
      console.log('=== DEBUG: Enviando respuesta ===');
      
      res.json({
        stories: formattedStories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Error en getAllStories:', error);
      next(error);
    }
  }

  static async getStoryById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      console.log('Obteniendo historia ID:', id);

      if (!id || isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const userId = req.user ? req.user.id : null;

      let query = `
        SELECT s.*, c.name as category, c.id as category_id, 
               u.username as author, u.id as author_id,
               s.likes_count, s.dislikes_count, s.comments_count
      `;
      
      if (userId) {
        query += `, (SELECT reaction_type FROM story_reactions sr 
                      WHERE sr.story_id = s.id AND sr.user_id = ${userId}) as user_reaction`;
      } else {
        query += `, NULL as user_reaction`;
      }
      
      query += `
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.id = ${id} AND s.is_published = 1
      `;

      console.log('Ejecutando query:', query);
      const [stories] = await db.execute(query);

      if (stories.length === 0) {
        return res.status(404).json({
          error: 'Historia no encontrada'
        });
      }

      const story = stories[0];
      
      if (story.published_at) {
        story.published_at = story.published_at.toISOString();
      }
      const [recentComments] = await db.execute(`
        SELECT 
          sc.id,
          sc.content,
          sc.likes_count,
          sc.dislikes_count,
          sc.created_at,
          u.username as author_name
        FROM story_comments sc
        JOIN users u ON sc.user_id = u.id
        WHERE sc.story_id = ? AND sc.parent_comment_id IS NULL AND sc.is_active = TRUE
        ORDER BY sc.created_at DESC
        LIMIT 3
      `, [id]);

      story.recent_comments = recentComments || [];
      story.has_more_comments = story.comments_count > 3;

      res.json({ story });

    } catch (error) {
      console.error('Error en getStoryById:', error);
      next(error);
    }
  }

  static async createStory(req, res, next) {
    try {
      console.log('=== CREAR HISTORIA ===');
      console.log('Datos recibidos:', req.body);
      console.log('Usuario:', req.user);

      const { error, value } = storySchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { title, content, summary, category_id, image_url } = value;
      const author_id = req.user.id;

      const categoryQuery = `SELECT id FROM categories WHERE id = ${category_id}`;
      console.log('Verificando categoría:', categoryQuery);
      
      const [categoryExists] = await db.execute(categoryQuery);

      if (categoryExists.length === 0) {
        return res.status(400).json({
          error: 'Categoría no válida'
        });
      }

      const escapedTitle = title.replace(/'/g, "''");
      const escapedContent = content.replace(/'/g, "''");
      const escapedSummary = summary ? summary.replace(/'/g, "''") : null;
      const escapedImageUrl = image_url ? image_url.replace(/'/g, "''") : null;
      const insertQuery = `
        INSERT INTO stories (title, content, summary, author_id, category_id, image_url, is_published, published_at, likes_count, dislikes_count, comments_count)
        VALUES ('${escapedTitle}', '${escapedContent}', ${escapedSummary ? `'${escapedSummary}'` : 'NULL'}, ${author_id}, ${category_id}, ${escapedImageUrl ? `'${escapedImageUrl}'` : 'NULL'}, 1, NOW(), 0, 0, 0)
      `;

      console.log('Ejecutando inserción...');
      const [result] = await db.execute(insertQuery);
      console.log('Historia creada con ID:', result.insertId);

      const selectQuery = `
        SELECT s.*, c.name as category, u.username as author,
               s.likes_count, s.dislikes_count, s.comments_count
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.id = ${result.insertId}
      `;

      const [newStory] = await db.execute(selectQuery);
      const story = newStory[0];
      
      if (story.published_at) {
        story.published_at = story.published_at.toISOString();
      }

      res.status(201).json({
        message: 'Historia creada exitosamente',
        story,
        notifications_sent: false
      });

      setImmediate(async () => {
        try {
          console.log('📱 Iniciando envío de notificaciones...');
          let WhatsAppController;
          try {
            WhatsAppController = require('./whatsappController');
          } catch (requireError) {
            console.log('⚠️ WhatsAppController no encontrado, omitiendo notificaciones');
            return;
          }

          const notificationMessage = `📰 ¡Nueva historia publicada!\n\n🔸 *${story.title}*\n\n${story.summary || 'Nueva historia disponible en RED UNAP'}\n\n📱 Ingresa a la web para leer más.`;
          
          const result = await WhatsAppController.sendNotificationToSubscribers(
            'new_story',
            notificationMessage,
            null // Cambiar por author_id en producción para excluir al autor
          );
          
          console.log(`📱 Notificaciones completadas: ${result.sent} exitosas, ${result.failed} fallidas`);
          
        } catch (notificationError) {
          console.error('Error enviando notificaciones:', notificationError);
        }
      });

    } catch (error) {
      console.error('Error en createStory:', error);
      next(error);
    }
  }

  static async updateStory(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      
      if (!id || isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const { error, value } = storySchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.details.map(detail => detail.message)
        });
      }

      const { title, content, summary, category_id, image_url } = value;

      const checkQuery = `SELECT author_id FROM stories WHERE id = ${id}`;
      const [existingStory] = await db.execute(checkQuery);

      if (existingStory.length === 0) {
        return res.status(404).json({
          error: 'Historia no encontrada'
        });
      }

      const canEdit = req.user.id === existingStory[0].author_id || 
                      ['Admin', 'Moderator'].includes(req.user.role_name);

      if (!canEdit) {
        return res.status(403).json({
          error: 'No tienes permisos para editar esta historia'
        });
      }

      const categoryQuery = `SELECT id FROM categories WHERE id = ${category_id}`;
      const [categoryExists] = await db.execute(categoryQuery);

      if (categoryExists.length === 0) {
        return res.status(400).json({
          error: 'Categoría no válida'
        });
      }

      const escapedTitle = title.replace(/'/g, "''");
      const escapedContent = content.replace(/'/g, "''");
      const escapedSummary = summary ? summary.replace(/'/g, "''") : null;
      const escapedImageUrl = image_url ? image_url.replace(/'/g, "''") : null;
      const updateQuery = `
        UPDATE stories 
        SET title = '${escapedTitle}', 
            content = '${escapedContent}', 
            summary = ${escapedSummary ? `'${escapedSummary}'` : 'NULL'}, 
            category_id = ${category_id}, 
            image_url = ${escapedImageUrl ? `'${escapedImageUrl}'` : 'NULL'}, 
            updated_at = NOW()
        WHERE id = ${id}
      `;

      await db.execute(updateQuery);

      const selectQuery = `
        SELECT s.*, c.name as category, u.username as author,
               s.likes_count, s.dislikes_count, s.comments_count
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.id = ${id}
      `;

      const [updatedStory] = await db.execute(selectQuery);
      const story = updatedStory[0];
      
      if (story.published_at) {
        story.published_at = story.published_at.toISOString();
      }

      res.json({
        message: 'Historia actualizada exitosamente',
        story,
        notifications_sent: false
      });

      setImmediate(async () => {
        try {
          let WhatsAppController;
          try {
            WhatsAppController = require('./whatsappController');
          } catch (requireError) {
            console.log('⚠️ WhatsAppController no encontrado para actualización');
            return;
          }

          const notificationMessage = `📝 Historia actualizada:\n\n🔸 *${story.title}*\n\n${story.summary || 'Historia actualizada en RED UNAP'}\n\n📱 Revisa los cambios en la web.`;
          
          const result = await WhatsAppController.sendNotificationToSubscribers(
            'story_update',
            notificationMessage,
            req.user.id
          );
          
          console.log(`📱 Notificaciones de actualización: ${result.sent} exitosas, ${result.failed} fallidas`);
          
        } catch (notificationError) {
          console.error('Error enviando notificaciones de actualización:', notificationError);
        }
      });

    } catch (error) {
      console.error('Error en updateStory:', error);
      next(error);
    }
  }
  static async deleteStory(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      if (!id || isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: 'ID de historia inválido'
        });
      }

      const checkQuery = `SELECT author_id, title FROM stories WHERE id = ${id}`;
      const [existingStory] = await db.execute(checkQuery);

      if (existingStory.length === 0) {
        return res.status(404).json({
          error: 'Historia no encontrada'
        });
      }
    
      const canDelete = req.user.id === existingStory[0].author_id || 
                        ['Admin', 'Moderator'].includes(req.user.role_name);

      if (!canDelete) {
        return res.status(403).json({
          error: 'No tienes permisos para eliminar esta historia'
        });
      }

      const storyTitle = existingStory[0].title;

      const deleteQuery = `DELETE FROM stories WHERE id = ${id}`;
      await db.execute(deleteQuery);

      res.json({
        message: `Historia "${storyTitle}" eliminada exitosamente`
      });

    } catch (error) {
      console.error('Error en deleteStory:', error);
      next(error);
    }
  }

  // NUEVOS MÉTODOS AGREGADOS

  // Obtener historias populares
  static async getPopularStories(req, res, next) {
    try {
      const timeframe = req.query.timeframe || 'week';
      const limit = Math.max(1, Math.min(20, parseInt(req.query.limit) || 10));
      const userId = req.user ? req.user.id : null;

      let timeCondition = '';
      switch (timeframe) {
        case 'day':
          timeCondition = 'AND s.published_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
          break;
        case 'week':
          timeCondition = 'AND s.published_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'month':
          timeCondition = 'AND s.published_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          break;
        default:
          timeCondition = '';
          break;
      }

      let query = `
        SELECT s.id, s.title, s.summary, s.published_at, s.image_url,
               c.name as category, u.username as author,
               s.likes_count, s.dislikes_count, s.comments_count,
               (s.likes_count + s.comments_count * 2) as popularity_score
      `;
      
      if (userId) {
        query += `, (SELECT reaction_type FROM story_reactions sr 
                      WHERE sr.story_id = s.id AND sr.user_id = ${userId}) as user_reaction`;
      } else {
        query += `, NULL as user_reaction`;
      }
      
      query += `
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_published = 1 ${timeCondition}
        ORDER BY popularity_score DESC, s.published_at DESC
        LIMIT ${limit}
      `;

      const [stories] = await db.execute(query);

      const formattedStories = stories.map(story => ({
        ...story,
        published_at: story.published_at ? story.published_at.toISOString() : null
      }));

      res.json({
        stories: formattedStories,
        timeframe,
        total_found: stories.length
      });

    } catch (error) {
      console.error('Error en getPopularStories:', error);
      next(error);
    }
  }

  // Buscar historias
  static async searchStories(req, res, next) {
    try {
      const query = req.query.q;
      const category = req.query.category;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
      const offset = (page - 1) * limit;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: 'La búsqueda debe tener al menos 2 caracteres'
        });
      }

      const searchTerm = `%${query.trim()}%`;
      let searchQuery = `
        SELECT s.id, s.title, s.summary, s.published_at, s.image_url,
               c.name as category, u.username as author,
               s.likes_count, s.dislikes_count, s.comments_count
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_published = 1 
          AND (s.title LIKE ? OR s.content LIKE ? OR s.summary LIKE ?)
      `;

      const queryParams = [searchTerm, searchTerm, searchTerm];

      if (category) {
        searchQuery += ' AND c.name = ?';
        queryParams.push(category);
      }

      searchQuery += ' ORDER BY s.published_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);

      const [stories] = await db.execute(searchQuery, queryParams);

      // Contar total
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_published = 1 
          AND (s.title LIKE ? OR s.content LIKE ? OR s.summary LIKE ?)
      `;
      
      const countParams = [searchTerm, searchTerm, searchTerm];
      
      if (category) {
        countQuery += ' AND c.name = ?';
        countParams.push(category);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const total = countResult[0].total;

      const formattedStories = stories.map(story => ({
        ...story,
        published_at: story.published_at ? story.published_at.toISOString() : null
      }));

      res.json({
        stories: formattedStories,
        search_query: query,
        category_filter: category || null,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Error en searchStories:', error);
      next(error);
    }
  }
}

module.exports = StoryController;