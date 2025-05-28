const db = require('../config/database');

class HomeController {
  static async getDashboard(req, res, next) {
    try {
      const user = req.user;
      const [storyCount] = await db.execute(
        'SELECT COUNT(*) as count FROM stories WHERE is_published = true'
      );

      const [userCount] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE is_active = true'
      );
      const [recentStories] = await db.execute(`
        SELECT s.id, s.title, s.summary, s.published_at, c.name as category, u.username as author
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_published = true 
        ORDER BY s.published_at DESC 
        LIMIT 5
      `);

      res.json({
        message: `¡Bienvenido ${user.username}!`,
        user: {
          username: user.username,
          role: user.role_name,
          is_guest: user.is_guest
        },
        stats: {
          totalStories: storyCount[0].count,
          totalUsers: userCount[0].count
        },
        recentStories,
        navigation: {
          canAccessHome: true,
          canAccessStories: true,
          canAccessChat: user.role_name !== 'Guest'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async getGuestDashboard(req, res, next) {
    try {
      const [publicStories] = await db.execute(`
        SELECT s.id, s.title, s.summary, s.published_at, c.name as category
        FROM stories s 
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_published = true 
        ORDER BY s.published_at DESC 
        LIMIT 5
      `);

      res.json({
        message: '¡Bienvenido Invitado!',
        user: {
          username: 'Invitado',
          role: 'Guest',
          is_guest: true
        },
        publicStories,
        navigation: {
          canAccessHome: true,
          canAccessStories: true,
          canAccessChat: false
        },
        notice: 'Como invitado tienes acceso limitado. Regístrate para acceder a todas las funciones.'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = HomeController;