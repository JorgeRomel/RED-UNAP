const API_BASE = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.maxRetries = 3;
    this.baseDelay = 1000;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { resolve, reject, requestFn } = this.requestQueue.shift();
      
      try {
        const result = await requestFn();
        resolve(result);
        await this.sleep(100);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, requestFn });
      this.processQueue();
    });
  }

  async requestWithRetry(endpoint, options = {}, retryCount = 0) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (response.status === 429 && retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.warn(`Rate limit hit, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.requestWithRetry(endpoint, options, retryCount + 1);
      }

      if (response.status >= 500 && retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.warn(`Server error ${response.status}, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.requestWithRetry(endpoint, options, retryCount + 1);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (retryCount < this.maxRetries && !error.message.includes('HTTP')) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.warn(`Network error, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.requestWithRetry(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    return this.queueRequest(() => this.requestWithRetry(endpoint, options));
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.setToken(null);
  }

  async validateToken() {
    if (!this.token) return false;
    
    try {
      await this.get('/auth/verify');
      return true;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        this.clearToken();
      }
      return false;
    }
  }
}

export default new ApiService();