import { useState, useEffect, useCallback } from 'react';
import { storiesService } from '../services/Stories';

export const useStories = (options = {}) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const loadStories = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await storiesService.getStories({
        page: pagination.page,
        limit: pagination.limit,
        include_stats: true,
        ...params
      });
      
      setStories(response.stories || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
        page: response.page || 1
      }));
    } catch (err) {
      setError(err.message || 'Error al cargar historias');
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const loadPopularStories = useCallback(async (timeframe = 'week') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await storiesService.getPopularStories(timeframe);
      setStories(response.stories || []);
    } catch (err) {
      setError(err.message || 'Error al cargar historias populares');
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStories = useCallback(async (query, category = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await storiesService.searchStories(query, category);
      setStories(response.stories || []);
    } catch (err) {
      setError(err.message || 'Error en la búsqueda');
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStories = useCallback(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadStories();
    }
  }, [options.autoLoad, loadStories]);

  return {
    stories,
    loading,
    error,
    pagination,
    loadStories,
    loadPopularStories,
    searchStories,
    refreshStories,
    setPage: (page) => setPagination(prev => ({ ...prev, page }))
  };
};

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState({
    featuredStories: [],
    recentStories: [],
    stats: {
      totalStories: 0,
      totalViews: 0,
      totalLikes: 0,
      activeUsers: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [popularResponse, recentResponse] = await Promise.all([
        storiesService.getPopularStories('week'),
        storiesService.getStories({ page: 1, limit: 5, include_stats: true })
      ]);

      setDashboardData({
        featuredStories: popularResponse.stories?.slice(0, 2) || [],
        recentStories: recentResponse.stories || [],
        stats: {
          totalStories: recentResponse.total || 0,
          totalViews: popularResponse.stats?.totalViews || 0,
          totalLikes: popularResponse.stats?.totalLikes || 0,
          activeUsers: popularResponse.stats?.activeUsers || 0
        }
      });
    } catch (err) {
      setError(err.message || 'Error al cargar datos del dashboard');
      
      setDashboardData({
        featuredStories: [
          {
            id: 1,
            title: "Innovación Tecnológica en UNAP 2025",
            summary: "Descubre los últimos avances tecnológicos implementados en nuestra universidad.",
            category: "Tecnología",
            likes_count: 45,
            comments_count: 12,
            views_count: 230,
            published_at: "2025-01-08",
            image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop"
          },
          {
            id: 2,
            title: "Éxito en Competencia Nacional de Robótica",
            summary: "Estudiantes de UNAP obtienen primer lugar en la competencia nacional.",
            category: "Académico",
            likes_count: 67,
            comments_count: 23,
            views_count: 412,
            published_at: "2025-01-07",
            image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop"
          }
        ],
        recentStories: [
          {
            id: 3,
            title: "Nueva Biblioteca Digital Disponible",
            summary: "Acceso a más de 10,000 libros digitales para estudiantes",
            category: "Biblioteca",
            likes_count: 23,
            published_at: "2025-01-09"
          },
          {
            id: 4,
            title: "Programa de Intercambio Estudiantil 2025",
            summary: "Oportunidades de intercambio con universidades internacionales",
            category: "Internacional",
            likes_count: 34,
            published_at: "2025-01-08"
          }
        ],
        stats: {
          totalStories: 125,
          totalViews: 15420,
          totalLikes: 2340,
          activeUsers: 89
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...dashboardData,
    loading,
    error,
    refreshDashboard: loadDashboardData
  };
};