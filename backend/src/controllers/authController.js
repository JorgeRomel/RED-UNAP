const db = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { registerSchema, loginSchema } = require('../utils/validators');

class AuthController {
  static async generateUsername() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      const username = `Anónimo#${randomNumber}`;
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      
      if (existingUsers.length === 0) {
        return username;
      }
      
      attempts++;
    }
    
    const timestamp = Date.now().toString().slice(-5);
    return `Anónimo#${timestamp}`;
  }

  static async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const { email, password } = value;
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: 'El email ya está registrado'
        });
      }

      const passwordHash = await hashPassword(password);
      const username = await AuthController.generateUsername();

      const [result] = await db.execute(
        'INSERT INTO users (email, password_hash, username, role_id) VALUES (?, ?, ?, ?)',
        [email, passwordHash, username, 4]
      );

      const [newUser] = await db.execute(
        'SELECT u.id, u.email, u.username, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
        [result.insertId]
      );

      const user = newUser[0];

      const token = generateToken(user.id, user.email, user.role_name);

      res.status(201).json({
        message: `Usuario registrado exitosamente como ${user.username}`,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role_name
        },
        token
      });
      setImmediate(async () => {
        try {
          const NotificationService = require('../services/notificationService');
          await NotificationService.sendWelcomeNotification(user.id, user.username);
        } catch (notificationError) {
          console.error('Error enviando notificación de bienvenida:', notificationError);
        }
      });

    } catch (error) {
      next(error);
    }
  }
  

  static async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }
      const { email, password } = value;
      const [users] = await db.execute(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND u.is_active = true',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      const user = users[0];
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }
      await db.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );
      const token = generateToken(user.id, user.email, user.role_name);

      res.json({
        message: `¡Bienvenido de vuelta ${user.username}!`,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role_name
        },
        token
      });

    } catch (error) {
      next(error);
    }
  }
  static async guestAccess(req, res) {
    try {
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      const guestUsername = `Invitado#${randomNumber}`;
      const guestToken = generateToken('guest', 'guest@temp.com', 'Guest');

      res.json({
        message: `¡Bienvenido ${guestUsername}!`,
        user: {
          id: 'guest',
          email: null,
          username: guestUsername,
          role: 'Guest'
        },
        token: guestToken
      });

    } catch (error) {
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  }
  static async verifyToken(req, res) {
    res.json({
      valid: true,
      user: req.user
    });
  }
}

module.exports = AuthController;