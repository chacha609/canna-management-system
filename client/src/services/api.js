import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Extract error message
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'An unexpected error occurred';
    
    return Promise.reject(new Error(message));
  }
);

// Generic API methods
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  upload: async (url, formData, onUploadProgress = null) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      if (onUploadProgress) {
        config.onUploadProgress = onUploadProgress;
      }
      
      const response = await api.post(url, formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download file
  download: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Specific API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    permissions: (id) => `/users/${id}/permissions`,
  },

  // Facilities
  facilities: {
    list: '/facilities',
    create: '/facilities',
    get: (id) => `/facilities/${id}`,
    update: (id) => `/facilities/${id}`,
    delete: (id) => `/facilities/${id}`,
  },

  // Strains
  strains: {
    list: '/strains',
    create: '/strains',
    get: (id) => `/strains/${id}`,
    update: (id) => `/strains/${id}`,
    delete: (id) => `/strains/${id}`,
  },

  // Rooms
  rooms: {
    list: '/rooms',
    create: '/rooms',
    get: (id) => `/rooms/${id}`,
    update: (id) => `/rooms/${id}`,
    delete: (id) => `/rooms/${id}`,
  },

  // Batches
  batches: {
    list: '/batches',
    create: '/batches',
    get: (id) => `/batches/${id}`,
    update: (id) => `/batches/${id}`,
    delete: (id) => `/batches/${id}`,
    plants: (id) => `/batches/${id}/plants`,
    harvest: (id) => `/batches/${id}/harvest`,
    destroy: (id) => `/batches/${id}/destroy`,
  },

  // Plants
  plants: {
    list: '/plants',
    create: '/plants',
    get: (id) => `/plants/${id}`,
    update: (id) => `/plants/${id}`,
    delete: (id) => `/plants/${id}`,
    history: (id) => `/plants/${id}/history`,
    harvest: (id) => `/plants/${id}/harvest`,
    destroy: (id) => `/plants/${id}/destroy`,
    move: (id) => `/plants/${id}/move`,
  },

  // Tasks
  tasks: {
    list: '/tasks',
    create: '/tasks',
    get: (id) => `/tasks/${id}`,
    update: (id) => `/tasks/${id}`,
    delete: (id) => `/tasks/${id}`,
    complete: (id) => `/tasks/${id}/complete`,
    templates: '/tasks/templates',
  },

  // Inventory
  inventory: {
    list: '/inventory',
    create: '/inventory',
    get: (id) => `/inventory/${id}`,
    update: (id) => `/inventory/${id}`,
    delete: (id) => `/inventory/${id}`,
    updateQuantities: (id) => `/inventory/${id}/quantities`,
    movements: (id) => `/inventory/${id}/movements`,
    recordMovement: (id) => `/inventory/${id}/movements`,
    lowStock: '/inventory/low-stock',
    expiring: '/inventory/expiring',
    reserve: (id) => `/inventory/${id}/reserve`,
    release: (id) => `/inventory/${id}/release`,
    stats: '/inventory/stats',
  },

  // Suppliers
  suppliers: {
    list: '/suppliers',
    create: '/suppliers',
    get: (id) => `/suppliers/${id}`,
    update: (id) => `/suppliers/${id}`,
    delete: (id) => `/suppliers/${id}`,
  },

  // Categories
  categories: {
    list: '/categories',
    create: '/categories',
    get: (id) => `/categories/${id}`,
    update: (id) => `/categories/${id}`,
    delete: (id) => `/categories/${id}`,
    stats: (id) => `/categories/${id}/stats`,
  },

  // Compliance & METRC
  compliance: {
    reports: '/compliance/reports',
    metrc: {
      test: '/compliance/metrc/test',
      facilities: '/compliance/metrc/facilities',
      sync: '/compliance/metrc/sync',
      plants: '/compliance/metrc/plants',
      harvests: '/compliance/metrc/harvests',
      packages: '/compliance/metrc/packages',
      createPlantsFromSeeds: '/compliance/metrc/plants/create-from-seeds',
      createPlantsFromClones: '/compliance/metrc/plants/create-from-clones',
      changeGrowthPhases: '/compliance/metrc/plants/change-growth-phases',
      movePlants: '/compliance/metrc/plants/move',
      createHarvest: '/compliance/metrc/harvests/create',
      syncHistory: '/compliance/metrc/sync-history',
      syncStats: '/compliance/metrc/sync-stats',
      storedPlants: '/compliance/metrc/stored/plants',
      storedHarvests: '/compliance/metrc/stored/harvests',
      storedPackages: '/compliance/metrc/stored/packages'
    }
  },

  // Environmental Monitoring
  environmental: {
    // Room data
    roomData: (roomId) => `/environmental/rooms/${roomId}/data`,
    roomLatest: (roomId) => `/environmental/rooms/${roomId}/latest`,
    roomStats: (roomId) => `/environmental/rooms/${roomId}/stats`,
    roomTrends: (roomId) => `/environmental/rooms/${roomId}/trends`,
    
    // Facility overview
    facilityOverview: (facilityId) => `/environmental/facilities/${facilityId}/overview`,
    
    // Data recording
    recordData: '/environmental/data',
    bulkRecordData: '/environmental/data/bulk',
    
    // Alerts
    alerts: '/environmental/alerts',
    acknowledgeAlert: (alertId) => `/environmental/alerts/${alertId}/acknowledge`,
    resolveAlert: (alertId) => `/environmental/alerts/${alertId}/resolve`,
    
    // Sensor types
    sensorTypes: '/environmental/sensor-types',
  },

  // Reports
  reports: {
    dashboard: '/reports/dashboard',
    plants: '/reports/plants',
    inventory: '/reports/inventory',
    compliance: '/reports/compliance',
    custom: '/reports/custom',
  },
};

export default api;