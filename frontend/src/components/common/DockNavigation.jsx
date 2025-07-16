import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Dock from './dock';
import {
  Home,
  FileText,
  TrendingUp,
  PlusCircle,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  MessageCircle
} from 'lucide-react';

const SearchModal = ({ isOpen, onClose, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onClose();
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Buscar Historias</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué historia buscas?"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NotificationsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    { id: 1, title: 'Nueva historia publicada', message: 'Se publicó una nueva historia en Tecnología', time: '5 min' },
    { id: 2, title: 'Comentario en tu historia', message: 'Alguien comentó en "Innovación en UNAP"', time: '1 hora' },
    { id: 3, title: 'Historia popular', message: 'Tu historia alcanzó 100 likes', time: '2 horas' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Notificaciones</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{notification.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const DockNavigation = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const canCreateStories = user?.role === 'admin' || user?.role === 'moderator';

  const handleSearch = (query) => {
    navigate(`/stories?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const dockItems = [
    {
      key: 'home',
      icon: <Home size={20} />,
      label: 'Inicio',
      onClick: () => navigate('/'),
      isActive: isActivePath('/')
    },
    {
      key: 'stories',
      icon: <FileText size={20} />,
      label: 'Historias',
      onClick: () => navigate('/stories'),
      isActive: isActivePath('/stories')
    },
    {
      key: 'popular',
      icon: <TrendingUp size={20} />,
      label: 'Populares',
      onClick: () => navigate('/popular'),
      isActive: isActivePath('/popular')
    },
    {
      key: 'search',
      icon: <Search size={20} />,
      label: 'Buscar',
      onClick: () => setIsSearchOpen(true),
      isActive: false
    },
  ];

  if (canCreateStories) {
    dockItems.splice(3, 0, {
      key: 'create',
      icon: <PlusCircle size={20} />,
      label: 'Crear Historia',
      onClick: () => navigate('/create-story'),
      isActive: isActivePath('/create-story'),
      className: 'bg-green-600 border-green-400 hover:bg-green-700'
    });
  }

  const userItems = [
    {
      key: 'profile',
      icon: <User size={20} />,
      label: 'Perfil',
      onClick: () => navigate('/profile'),
      isActive: isActivePath('/profile')
    },
    {
      key: 'settings',
      icon: <Settings size={20} />,
      label: 'Configuración',
      onClick: () => navigate('/settings'),
      isActive: isActivePath('/settings')
    },
    {
      key: 'logout',
      icon: <LogOut size={20} />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
      isActive: false,
      className: 'bg-red-600 border-red-400 hover:bg-red-700'
    }
  ];

  const allItems = [...dockItems, ...userItems];

  return (
    <>
      <Dock
        items={allItems}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
        distance={150}
        className="shadow-xl"
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
};

export default DockNavigation;