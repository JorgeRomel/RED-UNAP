import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Balatro from '../components/ui/balatro';

const MemoizedBalatro = memo(Balatro);

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const { login, register, guestLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  }, [error]);

  const validateForm = useCallback(() => {
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return false;
    }
    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      return false;
    }
    if (showRegister && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  }, [formData.email, formData.password, showRegister]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (showRegister) {
        await register(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, showRegister, register, login, formData.email, formData.password]);

  const handleGuestAccess = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      await guestLogin();
    } catch (err) {
      setError(err.message || 'Error al acceder como invitado');
    } finally {
      setIsLoading(false);
    }
  }, [guestLogin]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  }, [handleSubmit, isLoading]);

  const toggleMode = useCallback(() => {
    setShowRegister(!showRegister);
    setError('');
    setFormData({ email: '', password: '' });
  }, [showRegister]);

  const balatrConfig = {
    isRotate: false,
    mouseInteraction: false,
    pixelFilter: 1000,
    color1: "#DE443B",
    color2: "#006BB4",
    color3: "#162325",
    contrast: 3.5,
    lighting: 0.4,
    spinAmount: 0.30,      
    spinEase: 1.0,
    spinRotation: -2.0,    
    spinSpeed: 7.0
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MemoizedBalatro {...balatrConfig} />
      </div>
      
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>

      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">🎓</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">RED UNAP</h1>
            <p className="text-gray-400 text-sm">
              {showRegister ? 'Crear nueva cuenta' : 'Iniciar sesión'}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                {showRegister ? 'EMAIL' : 'USUARIO'}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                required
                disabled={isLoading}
                autoComplete={showRegister ? 'email' : 'username'}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50"
                placeholder={showRegister ? "tu@email.com" : "usuario@ejemplo.com"}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                CONTRASEÑA
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                required
                disabled={isLoading}
                autoComplete={showRegister ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded-md text-sm animate-pulse">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
              className="w-full bg-white text-gray-900 py-3 px-4 rounded-md font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Cargando...
                </div>
              ) : (
                showRegister ? 'Registrarse' : 'login'
              )}
            </button>
          </div>

          <div className="mt-8 text-center space-y-4">
            <button
              onClick={toggleMode}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 transition duration-200 text-sm disabled:opacity-50"
            >
              {showRegister ? 'Ya tienes cuenta? Inicia sesión' : 'crear nuevo usuario'}
            </button>

            {!showRegister && (
              <div>
                <button
                  onClick={handleGuestAccess}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-300 transition duration-200 text-sm underline disabled:opacity-50"
                >
                  ingresar como invitado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;