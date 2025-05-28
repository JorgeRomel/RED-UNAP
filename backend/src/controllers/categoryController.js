const db = require('../config/database');

class CategoryController {
  static async getAllCategories(req, res, next) {
    try {
      console.log('Obteniendo categorías...');
      
      const query = `
        SELECT id, name, description, created_at
        FROM categories 
        ORDER BY name ASC
      `;

      const [categories] = await db.execute(query);
      
      console.log('Categorías encontradas:', categories.length);

      res.json({
        categories: categories || []
      });

    } catch (error) {
      console.error('Error en getAllCategories:', error);
      next(error);
    }
  }
}

module.exports = CategoryController;