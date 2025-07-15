import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storiesService } from '../services/Stories';
import {
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Eye,
  Filter,
  Trophy,
  Star,
  Flame,
  Grid3X3,
  List,
  RefreshCw,
  Calendar,
  PlusCircle
} from 'lucide-react';

const PopularStoryCard = ({ story, onClick, viewMode = 'grid', rank }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalEngagement = () => {
    return (story.likes_count || 0) + (story.comments_count || 0) + Math.floor((story.views_count || 0) / 10);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (rank === 2) return <Trophy className="text-gray-400" size={20} />;
    if (rank === 3) return <Trophy className="text-orange-500" size={20} />;
    return <Star className="text-blue-500" size={16} />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-blue-500 to-purple-600';
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
      >
        {/* Indicador de ranking */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className={`${getRankColor(rank)} text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1`}>
            {getRankIcon(rank)}
            <span>#{rank}</span>
          </div>
        </div>

        <div className="flex items-start space-x-6 pt-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {story.title?.charAt(0) || '🔥'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {story.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {story.summary || story.content?.substring(0, 200) + '...'}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    {story.category}
                  </span>
                  <span className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDate(story.published_at)}
                  </span>
                  <span>Por: {story.author || story.username}</span>
                </div>
              </div>
            </div>

            {/* Métricas de popularidad */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="text-red-500" size={18} />
                    <span className="font-semibold text-gray-900">{story.likes_count || 0}</span>
                    <span className="text-gray-500 text-sm">likes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="text-blue-500" size={18} />
                    <span className="font-semibold text-gray-900">{story.comments_count || 0}</span>
                    <span className="text-gray-500 text-sm">comentarios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="text-green-500" size={18} />
                    <span className="font-semibold text-gray-900">{story.views_count || 0}</span>
                    <span className="text-gray-500 text-sm">vistas</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">
                  <Flame size={14} />
                  <span className="text-sm font-bold">{getTotalEngagement()} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative"
    >
      {/* Indicador de ranking */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`${getRankColor(rank)} text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1 shadow-lg`}>
          {getRankIcon(rank)}
          <span>#{rank}</span>
        </div>
      </div>

      {/* Imagen o placeholder */}
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
            className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 hidden items-center justify-center text-white text-4xl"
            style={{ display: 'none' }}
          >
            🔥
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-4xl">
          🔥
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {story.category}
          </span>
          <span className="text-sm text-gray-500">{formatDate(story.published_at)}</span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {story.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {story.summary || story.content?.substring(0, 120) + '...'}
        </p>
        
        {/* Métricas compactas */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Por: {story.author || story.username}</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-red-500">
              <Heart size={14} className="mr-1" />
              {story.likes_count || 0}
            </span>
            <span className="flex items-center text-blue-500">
              <MessageCircle size={14} className="mr-1" />
              {story.comments_count || 0}
            </span>
            <span className="flex items-center text-green-500">
              <Eye size={14} className="mr-1" />
              {story.views_count || 0}
            </span>
          </div>
        </div>

        {/* Score de popularidad */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg">
            <Flame size={16} />
            <span className="font-bold">Score: {getTotalEngagement()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PopularStorySkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-6">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6">
        <div className="flex justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="flex space-x-3">
            <div className="h-4 bg-gray-200 rounded w-8"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

const PopularStoriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [timeframe, setTimeframe] = useState(searchParams.get('timeframe') || 'week');
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const timeframeOptions = [
    { value: 'today', label: 'Hoy', icon: '📅' },
    { value: 'week', label: 'Esta semana', icon: '📈' },
    { value: 'month', label: 'Este mes', icon: '🗓️' },
    { value: 'year', label: 'Este año', icon: '📊' },
    { value: 'all', label: 'Todo el tiempo', icon: '⭐' }
  ];

  const loadPopularStories = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await storiesService.getPopularStories(timeframe);
      setStories(response.stories || []);
    } catch (err) {
      setError(err.message || 'Error al cargar historias populares');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPopularStories();
  }, [timeframe]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (timeframe !== 'week') params.set('timeframe', timeframe);
    setSearchParams(params);
  }, [timeframe, setSearchParams]);

  const handleStoryClick = (storyId) => {
    navigate(`/stories/${storyId}`);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const canCreateStories = user?.role === 'admin' || user?.role === 'moderator';

  const getCurrentTimeframeLabel = () => {
    const option = timeframeOptions.find(opt => opt.value === timeframe);
    return option ? option.label : 'Esta semana';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Historias Populares</h1>
          </div>
          <p className="text-gray-600">
            Las historias con más engagement en {getCurrentTimeframeLabel().toLowerCase()}
          </p>
        </div>
        
        {canCreateStories && (
          <button
            onClick={() => navigate('/create-story')}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle size={20} />
            <span>Nueva Historia</span>
          </button>
        )}
      </div>

      {/* Controles y filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filtros de tiempo */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-3">Período de tiempo</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeframeChange(option.value)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all ${
                    timeframe === option.value
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controles de vista */}
          <div className="flex items-end space-x-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            <button
              onClick={loadPopularStories}
              disabled={loading}
              className="p-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadPopularStories}
            className="text-red-600 hover:text-red-800"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? 'Cargando...' : `${stories.length} historias populares encontradas`}
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Flame className="text-purple-500" size={16} />
          <span className="text-gray-600">Ordenado por engagement</span>
        </div>
      </div>

      {/* Grid/Lista de historias */}
      {loading ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <PopularStorySkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      ) : stories.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {stories.map((story, index) => (
            <PopularStoryCard
              key={story.id}
              story={story}
              viewMode={viewMode}
              rank={index + 1}
              onClick={() => handleStoryClick(story.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <TrendingUp size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No hay historias populares
          </h3>
          <p className="text-gray-600 mb-6">
            No se encontraron historias populares para {getCurrentTimeframeLabel().toLowerCase()}
          </p>
          {canCreateStories && (
            <button
              onClick={() => navigate('/create-story')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear la primera historia
            </button>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-purple-600 rounded-full p-3">
            <Trophy className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Cómo se calcula la popularidad?
            </h3>
            <p className="text-gray-700 mb-4">
              El score de popularidad se basa en una combinación de likes, comentarios y vistas, 
              ponderados según el período de tiempo seleccionado.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Heart className="text-red-500" size={16} />
                <span>Likes: Peso alto</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="text-blue-500" size={16} />
                <span>Comentarios: Peso medio</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="text-green-500" size={16} />
                <span>Vistas: Peso bajo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularStoriesPage;