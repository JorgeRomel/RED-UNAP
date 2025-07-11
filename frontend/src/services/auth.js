import ApiService from './api';

export const authService = {
  async login(email, password) {
    const data = await ApiService.post('/auth/login', { email, password });
    
    if (data.token) {
      ApiService.setToken(data.token);
    }
    
    return data;
  },

  async register(email, password) {
    const data = await ApiService.post('/auth/register', { email, password });
    
    if (data.token) {
      ApiService.setToken(data.token);
    }
    
    return data;
  },

  async guestAccess() {
    const data = await ApiService.post('/auth/guest');
    
    if (data.token) {
      ApiService.setToken(data.token);
    }
    
    return data;
  },

  async verifyToken() {
    return await ApiService.get('/auth/verify');
  },

  logout() {
    ApiService.clearToken();
  },

  isAuthenticated() {
    return !!ApiService.getToken();
  }
};