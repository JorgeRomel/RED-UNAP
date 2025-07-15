import ApiService from './api';

export const storiesService = {
  async getStories(params = {}) {
    const queryString = new URLSearchParams({
      include_stats: 'true',
      ...params
    }).toString();
    return await ApiService.get(`/stories?${queryString}`);
  },

  async getStory(id) {
    return await ApiService.get(`/stories/${id}`);
  },

  async getPopularStories(timeframe = 'week') {
    return await ApiService.get(`/stories/popular?timeframe=${timeframe}`);
  },

  async searchStories(query, category = null) {
    const params = new URLSearchParams();
    
    if (query && query.trim()) {
      params.append('q', query.trim());
    }
    
    if (category && category.trim()) {
      params.append('category', category.trim());
    }

    params.append('page', '1');
    params.append('limit', '20');
    params.append('include_stats', 'true');

    return await ApiService.get(`/stories/search?${params.toString()}`);
  },

  async createStory(storyData) {
    return await ApiService.post('/stories', storyData);
  },

  async updateStory(id, storyData) {
    return await ApiService.put(`/stories/${id}`, storyData);
  },

  async deleteStory(id) {
    return await ApiService.delete(`/stories/${id}`);
  },

  async getDashboardStats() {
    return await ApiService.get('/stories/stats');
  },

  async incrementViews(id) {
    try {
      return await ApiService.post(`/stories/${id}/view`);
    } catch (error) {
      console.warn('Error incrementing views:', error);
    }
  }
};