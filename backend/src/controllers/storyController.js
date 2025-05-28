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
      const simpleQuery = `
        SELECT s.id, s.title, s.summary, s.published_at, s.image_url,
               c.name as category, u.username as author
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
      
      console.log('Parámetros de paginación:', { page, limit, startIndex, endIndex });
      
      const paginatedStories = allStories.slice(startIndex, endIndex);
      
      console.log('Historias paginadas:', paginatedStories.length);
      
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
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('SQL:', error.sql);
      console.error('Stack:', error.stack);
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
      const query = `
        SELECT s.*, c.name as category, c.id as category_id, u.username as author, u.id as author_id
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
        INSERT INTO stories (title, content, summary, author_id, category_id, image_url, is_published, published_at)
        VALUES ('${escapedTitle}', '${escapedContent}', ${escapedSummary ? `'${escapedSummary}'` : 'NULL'}, ${author_id}, ${category_id}, ${escapedImageUrl ? `'${escapedImageUrl}'` : 'NULL'}, 1, NOW())
      `;

      console.log('Ejecutando inserción...');
      const [result] = await db.execute(insertQuery);
      console.log('Historia creada con ID:', result.insertId);

      const selectQuery = `
        SELECT s.*, c.name as category, u.username as author
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
        story
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
        SELECT s.*, c.name as category, u.username as author
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
        story
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
}

module.exports = StoryController;