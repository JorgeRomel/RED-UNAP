import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:3001/api";

const SettingsPage = () => {
  const { user, logout, updateUserContext } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Verificar autenticación
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const showMessage = (msg, isError = false) => {
    setMessage({ text: msg, isError });
    setTimeout(() => setMessage(''), 3000);
  };

  // UPDATE - Actualizar nombre de usuario
  const handleSaveUsername = async () => {
    if (!username.trim()) {
      return showMessage('El nombre de usuario es requerido', true);
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) throw new Error('Error al actualizar nombre');
      
      const data = await response.json();
      updateUserContext(data);
      showMessage('✅ Nombre actualizado correctamente');
    } catch (error) {
      showMessage('❌ ' + error.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE - Actualizar email
  const handleSaveEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      return showMessage('Email inválido', true);
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) throw new Error('Error al actualizar email');
      
      const data = await response.json();
      updateUserContext(data);
      showMessage('✅ Email actualizado correctamente');
    } catch (error) {
      showMessage('❌ ' + error.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE - Cambiar contraseña
  const handlePasswordChange = async () => {
    if (password !== confirmPassword) {
      return showMessage('Las contraseñas no coinciden', true);
    }
    if (password.length < 6) {
      return showMessage('La contraseña debe tener al menos 6 caracteres', true);
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) throw new Error('Error al actualizar contraseña');
      
      showMessage('✅ Contraseña actualizada correctamente');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      showMessage('❌ ' + error.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE - Guardar biografía
  const handleBioSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bio })
      });
      
      if (!response.ok) throw new Error('Error al actualizar biografía');
      
      const data = await response.json();
      updateUserContext(data);
      setEditingBio(false);
      showMessage('✅ Biografía actualizada correctamente');
    } catch (error) {
      showMessage('❌ ' + error.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE - Actualizar imagen
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`${API_URL}/auth/profile-image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Error al actualizar imagen');
      
      const data = await response.json();
      updateUserContext(data);
      
      // Preview local
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImage(ev.target.result);
      reader.readAsDataURL(file);
      
      showMessage('✅ Imagen actualizada correctamente');
    } catch (error) {
      showMessage('❌ ' + error.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE - Eliminar cuenta
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ ADVERTENCIA: Estás a punto de eliminar tu cuenta\n\n' +
      '- Esta acción NO se puede deshacer\n' +
      '- Se eliminarán TODOS tus datos\n' +
      '- Perderás acceso inmediatamente\n\n' +
      '¿Estás realmente seguro?'
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al eliminar la cuenta');
      
      // Limpiar datos
      localStorage.clear();
      sessionStorage.clear();
      
      showMessage('Cuenta eliminada correctamente');
      
      // Redireccionar
      setTimeout(() => {
        logout();
        navigate('/login', { 
          replace: true,
          state: { message: 'Tu cuenta ha sido eliminada correctamente' }
        });
      }, 1500);

    } catch (error) {
      showMessage('❌ ' + error.message, true);
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white shadow-xl rounded-2xl space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Configuración de la cuenta
      </h1>
      
      {/* Mensajes */}
      {message && (
        <div className={`text-center p-3 rounded-lg ${
          message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Imagen de perfil */}
      <div className="flex items-center gap-4">
        <img
          src={profileImage || `https://ui-avatars.com/api/?name=${username}`}
          alt="Avatar"
          className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
        />
        <div>
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700"
            disabled={isLoading}
          >
            Cambiar imagen
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Nombre de usuario */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Nombre de usuario
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded-lg mb-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
        <button
          onClick={handleSaveUsername}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          Guardar nombre
        </button>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          className="w-full p-2 border rounded-lg mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <button
          onClick={handleSaveEmail}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          Guardar correo
        </button>
      </div>

      {/* Biografía */}
      <div>
        <label className="block text-sm font-semibold mb-1">Biografía</label>
        {editingBio ? (
          <>
            <textarea
              className="w-full border rounded-lg p-2 mb-2"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escribe tu biografía..."
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <button 
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleBioSave}
                disabled={isLoading}
              >
                Guardar
              </button>
              <button
                className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
                onClick={() => {
                  setBio(user?.bio || '');
                  setEditingBio(false);
                }}
                disabled={isLoading}
              >
                Cancelar
              </button> 
            </div>
          </>
        ) : (
          <div>
            <p className="text-gray-600 min-h-[48px]">{bio || 'Sin biografía'}</p>
            <button
              onClick={() => setEditingBio(true)}
              className="mt-2 text-blue-600 hover:underline text-sm"
              disabled={isLoading}
            >
              Editar biografía
            </button>
          </div>
        )}
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Cambiar contraseña
        </label>
        <input
          type="password"
          className="w-full p-2 border rounded-lg mb-2"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="password"
          className="w-full p-2 border rounded-lg mb-2"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
        <button
          onClick={handlePasswordChange}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          Cambiar contraseña
        </button>
      </div>

      {/* Eliminar cuenta */}
      <div className="border-t pt-6">
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full disabled:opacity-50"
          disabled={isLoading}
        >
          Eliminar cuenta
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Esta acción no se puede deshacer. Se eliminarán todos tus datos.
        </p>
      </div>

      {/* Cerrar sesión */}
      <div className="text-center border-t pt-6">
        <button
          onClick={handleLogout}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          disabled={isLoading}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;