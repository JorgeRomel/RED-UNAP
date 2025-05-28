const db = require('../config/database');
const { hashPassword } = require('../utils/auth');
const Joi = require('joi');
const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional()
});

class UserController {
  static async getProfile(req, res, next) {
    try {
      const [users] = await db.execute(`
        SELECT u.id, u.email, u.username, u.created_at, u.last_login, r.name as role_name
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [req.user.id]);

      if (users.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      const user = users[0];
      const [storyCount] = await db.execute(
        'SELECT COUNT(*) as count FROM stories WHERE author_id = ?',
        [req.user.id]
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role_name,
          created_at: user.created_at,
          last_login: user.last_login,
          story_count: storyCount[0].count
        }
      });

    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const { username, email, password } = value;
      const updateFields = [];
      const updateValues = [];

      if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
      }

      if (email) {
        const [existingUsers] = await db.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, req.user.id]
        );

        if (existingUsers.length > 0) {
          return res.status(409).json({
            error: 'El email ya está en uso'
          });
        }

        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (password) {
        const passwordHash = await hashPassword(password);
        updateFields.push('password_hash = ?');
        updateValues.push(passwordHash);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No hay campos para actualizar'
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(req.user.id);

      await db.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        message: 'Perfil actualizado exitosamente'
      });

    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const [users] = await db.execute(`
        SELECT u.id, u.email, u.username, u.is_active, u.created_at, u.last_login, r.name as role_name
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        ORDER BY u.created_at DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const [countResult] = await db.execute('SELECT COUNT(*) as total FROM users');
      const total = countResult[0].total;

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;