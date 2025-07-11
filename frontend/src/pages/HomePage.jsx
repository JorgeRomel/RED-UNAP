import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useStories';
import {
  TrendingUp,
  Clock,
  MessageCircle,
  Heart,
  Eye,
  PlusCircle,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  Calendar,
  Bell,
  Star,
  RefreshCw
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, trend, color = "blue", loading = false }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200"
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +{trend}% esta semana
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border-2 ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const FeaturedStoryCard = ({ story, onClick, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="flex justify-between">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      {story.image_url ? (
        <div className="h-48 relative overflow-hidden">
          <img 
            src={story.image_url} 
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div 
            className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 hidden items-center justify-center text-white text-6xl"
            style={{ display: 'none' }}
          >
            📰
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
              {story.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-6xl relative">
          📰
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
              {story.category}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {story.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {story.summary || story.content?.substring(0, 150) + '...'}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Heart size={16} className="mr-1" />
              {story.likes_count || 0}
            </span>
            <span className="flex items-center">
              <MessageCircle size={16} className="mr-1" />
              {story.comments_count || 0}
            </span>
            <span className="flex items-center">
              <Eye size={16} className="mr-1" />
              {story.views_count || 0}
            </span>
          </div>
          <span className="flex items-center">
            <Clock size={16} className="mr-1" />
            {new Date(story.published_at).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>
    </div>
  );
};

const RecentStoryItem = ({ story, onClick, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-8"></div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
        {story.title?.charAt(0) || '📰'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {story.title}
        </h4>
        <p className="text-sm text-gray-600 truncate">
          {story.summary || story.content?.substring(0, 80) + '...'}
        </p>
        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
          <span>{story.category}</span>
          <span>•</span>
          <span>{new Date(story.published_at).toLocaleDateString('es-ES')}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Heart size={14} />
        <span>{story.likes_count || 0}</span>
      </div>
    </div>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, onClick, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    orange: "bg-orange-600 hover:bg-orange-700"
  };

  return (
    <div 
      onClick={onClick}
      className={`${colorClasses[color]} text-white rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1`}
    >
      <Icon size={32} className="mb-4" />
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-blue-100 text-sm opacity-90">{description}</p>
    </div>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    featuredStories,
    recentStories,
    stats,
    loading,
    error,
    refreshDashboard
  } = useDashboardData();

  const handleStoryClick = (storyId) => {
    navigate(`/stories/${storyId}`);
  };

  const canCreateStories = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={refreshDashboard}
            className="text-red-600 hover:text-red-800"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido{user?.username ? `, ${user.username}` : ''}! 🎓
            </h1>
            <p className="text-blue-100 text-lg">
              Descubre las últimas historias y mantente conectado con la comunidad UNAP
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Rol: {user?.role === 'admin' ? 'Administrador' : 
                     user?.role === 'moderator' ? 'Moderador' : 
                     user?.role || 'Invitado'}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Miembro desde {new Date().getFullYear()}
              </span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              🏛️
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Estadísticas de la Comunidad</h2>
          {!loading && (
            <button
              onClick={refreshDashboard}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100"
              title="Actualizar datos"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={BookOpen}
            title="Total de Historias"
            value={loading ? '...' : stats.totalStories.toLocaleString()}
            trend={loading ? null : 12}
            color="blue"
            loading={loading}
          />
          <StatCard
            icon={Eye}
            title="Visualizaciones"
            value={loading ? '...' : stats.totalViews.toLocaleString()}
            trend={loading ? null : 8}
            color="green"
            loading={loading}
          />
          <StatCard
            icon={Heart}
            title="Me Gusta"
            value={loading ? '...' : stats.totalLikes.toLocaleString()}
            trend={loading ? null : 15}
            color="purple"
            loading={loading}
          />
          <StatCard
            icon={Users}
            title="Usuarios Activos"
            value={loading ? '...' : stats.activeUsers.toLocaleString()}
            trend={loading ? null : 5}
            color="orange"
            loading={loading}
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            icon={BookOpen}
            title="Ver Historias"
            description="Explora todas las historias de la comunidad"
            onClick={() => navigate('/stories')}
            color="blue"
          />
          <QuickActionCard
            icon={TrendingUp}
            title="Historias Populares"
            description="Descubre las historias más populares"
            onClick={() => navigate('/popular')}
            color="purple"
          />
          {canCreateStories && (
            <QuickActionCard
              icon={PlusCircle}
              title="Crear Historia"
              description="Comparte una nueva historia con la comunidad"
              onClick={() => navigate('/create-story')}
              color="green"
            />
          )}
          <QuickActionCard
            icon={Bell}
            title="Notificaciones"
            description="Revisa tus notificaciones recientes"
            onClick={() => navigate('/settings')}
            color="orange"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Historias Destacadas</h2>
          <Link 
            to="/stories" 
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ver todas <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            <>
              <FeaturedStoryCard loading={true} />
              <FeaturedStoryCard loading={true} />
            </>
          ) : featuredStories.length > 0 ? (
            featuredStories.map((story) => (
              <FeaturedStoryCard
                key={story.id}
                story={story}
                onClick={() => handleStoryClick(story.id)}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay historias destacadas disponibles</p>
              {canCreateStories && (
                <button
                  onClick={() => navigate('/create-story')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear la primera historia
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Actividad Reciente</h2>
          <Link 
            to="/stories?sort=newest" 
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ver más <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="space-y-4">
          {loading ? (
            <>
              <RecentStoryItem loading={true} />
              <RecentStoryItem loading={true} />
              <RecentStoryItem loading={true} />
            </>
          ) : recentStories.length > 0 ? (
            recentStories.map((story) => (
              <RecentStoryItem
                key={story.id}
                story={story}
                onClick={() => handleStoryClick(story.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl p-8 text-center">
        <Star size={48} className="mx-auto mb-4 text-yellow-300" />
        <h3 className="text-2xl font-bold mb-2">¡Sé parte de la comunidad!</h3>
        <p className="text-green-100 mb-6 text-lg">
          Comparte tus experiencias, descubre nuevas historias y conecta con otros estudiantes de UNAP
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/stories')}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Explorar Historias
          </button>
          {canCreateStories && (
            <button
              onClick={() => navigate('/create-story')}
              className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors border-2 border-green-600"
            >
              Crear Mi Historia
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;