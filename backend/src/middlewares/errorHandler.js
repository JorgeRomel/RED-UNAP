const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.isJoi) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: err.details.map(detail => detail.message)
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }
    return res.status(500).json({
      error: 'Error de base de datos'
    });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
};

module.exports = errorHandler;