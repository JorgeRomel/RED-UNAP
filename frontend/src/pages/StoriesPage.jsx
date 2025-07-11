import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../hooks/useStories';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Eye,
  BookOpen,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SortAsc,
  SortDesc,
  Plus,
  X
} from 'lucide-react';

const StoryCard = ({ story, onClick, viewMode = 'grid' }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {story.title?.charAt(0) || '📰'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {story.title}
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {story.summary || story.content?.substring(0, 200) + '...'}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {story.category}
                  </span>
                  <span className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDate(story.published_at)}
                  </span>
                  <span>Por: {story.author}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 ml-4">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
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
            className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 hidden items-center justify-center text-white text-4xl"
            style={{ display: 'none' }}
          >
            📰
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl">
          📰
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
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
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Por: {story.author}</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Heart size={14} className="mr-1" />
              {story.likes_count || 0}
            </span>
            <span className="flex items-center">
              <MessageCircle size={14} className="mr-1" />
              {story.comments_count || 0}
            </span>
            <span className="flex items-center">
              <Eye size={14} className="mr-1" />
              {story.views_count || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StorySkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
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
        <div className="flex justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-1"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="flex space-x-3">
            <div className="h-4 bg-gray-200 rounded w-8"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange, loading }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} />
      </button>
      
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50 disabled:opacity-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

const StoriesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showFilters, setShowFilters] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    stories,
    loading,
    error,
    pagination,
    loadStories,
    searchStories,
    setPage
  } = useStories({ autoLoad: false });

  const categories = [
    'Tecnología',
    'Académico',
    'Deportes',
    'Cultura',
    'Ciencia',
    'Eventos',
    'Internacional',
    'Biblioteca',
    'Noticias'
  ];

  const loadStoriesWithParams = useCallback(() => {
    const params = {
      page: pagination.page,
      limit: 12,
      sort: sortBy
    };

    if (searchQuery.trim()) {
      searchStories(searchQuery, selectedCategory || null);
    } else {
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      loadStories(params);
    }
  }, [pagination.page, sortBy, searchQuery, selectedCategory, searchStories, loadStories]);

  useEffect(() => {
    loadStoriesWithParams();
  }, [loadStoriesWithParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, sortBy, setSearchParams]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setPage(1);
  };

  const handleStoryClick = (storyId) => {
    navigate(`/stories/${storyId}`);
  };

  const handlePageChange = (page) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('newest');
    setPage(1);
  };

  const canCreateStories = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📰 Historias</h1>
          <p className="text-gray-600 mt-1">
            Descubre todas las historias de la comunidad UNAP
          </p>
        </div>
        
        {canCreateStories && (
          <button
            onClick={() => navigate('/create-story')}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nueva Historia</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Buscar historias..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                showFilters || selectedCategory || sortBy !== 'newest'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filtros</span>
            </button>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            <button
              onClick={loadStoriesWithParams}
              disabled={loading}
              className="p-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="popular">Más populares</option>
                  <option value="most_liked">Más gustados</option>
                  <option value="most_commented">Más comentados</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={18} />
                  <span>Limpiar filtros</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadStoriesWithParams}
            className="text-red-600 hover:text-red-800"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? 'Cargando...' : `${pagination.total} historias encontradas`}
        </div>
        
        {(searchQuery || selectedCategory) && (
          <div className="flex items-center space-x-2 text-sm">
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Búsqueda: "{searchQuery}"
              </span>
            )}
            {selectedCategory && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                {selectedCategory}
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <StorySkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      ) : stories.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              viewMode={viewMode}
              onClick={() => handleStoryClick(story.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No se encontraron historias
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedCategory 
              ? 'Intenta con otros términos de búsqueda o filtros diferentes'
              : 'Aún no hay historias publicadas'
            }
          </p>
          {canCreateStories && !searchQuery && !selectedCategory && (
            <button
              onClick={() => navigate('/create-story')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear la primera historia
            </button>
          )}
        </div>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
};

export default StoriesPage;