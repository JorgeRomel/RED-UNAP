const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ 
        error: 'Token de acceso requerido' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userId === 'guest') {
      req.user = {
        id: 'guest',
        email: null,
        username: 'Invitado',
        role_id: 5,
        role_name: 'Guest',
        is_guest: true
      };
      return next();
    }
    
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ${decoded.userId} AND u.is_active = 1
    `;
    
    const [users] = await db.execute(query);

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario no válido o inactivo' 
      });
    }

    req.user = {
      id: users[0].id,
      email: users[0].email,
      username: users[0].username,
      role_id: users[0].role_id,
      role_name: users[0].role_name,
      is_guest: users[0].is_guest || false
    };

    next();
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      if (req.user.is_guest || req.user.role_name === 'Guest') {
        const guestPermissions = ['access_home', 'access_stories'];
        if (!guestPermissions.includes(permission)) {
          return res.status(403).json({ 
            error: 'Los invitados no tienen acceso a este recurso' 
          });
        }
        return next();
      }

      const query = `
        SELECT can_access 
        FROM role_permissions 
        WHERE role_id = ${req.user.role_id} AND permission_name = '${permission}'
      `;

      const [permissions] = await db.execute(query);

      if (permissions.length === 0 || !permissions[0].can_access) {
        return res.status(403).json({ 
          error: 'No tienes permisos para acceder a este recurso' 
        });
      }

      next();
    } catch (error) {
      console.error('Error en checkPermission:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

const guestAccess = async (req, res, next) => {
  try {
    req.user = {
      id: null,
      email: null,
      username: 'Invitado',
      role_id: 5,
      role_name: 'Guest',
      is_guest: true
    };
    next();
  } catch (error) {
    console.error('Error en guestAccess:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  authenticateToken,
  checkPermission,
  guestAccess
};