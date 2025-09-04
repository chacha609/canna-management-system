import { apiService, endpoints } from './api';

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await apiService.post(endpoints.auth.login, {
        email,
        password
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiService.post(endpoints.auth.register, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await apiService.post(endpoints.auth.logout);
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.error('Logout error:', error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiService.get(endpoints.auth.me);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiService.post(endpoints.auth.refresh);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await apiService.post(endpoints.auth.forgotPassword, {
        email
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await apiService.post(endpoints.auth.resetPassword, {
        token,
        password
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Set token in localStorage
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Get user role from token
  getUserRole: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (error) {
      return null;
    }
  },

  // Get user permissions from token
  getUserPermissions: () => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.permissions || [];
    } catch (error) {
      return [];
    }
  },

  // Check if user has specific permission
  hasPermission: (permission) => {
    const role = authService.getUserRole();
    const permissions = authService.getUserPermissions();
    
    // Admin has all permissions
    if (role === 'admin') return true;
    
    return permissions.includes(permission);
  },

  // Check if user has any of the specified permissions
  hasAnyPermission: (permissionList) => {
    if (!Array.isArray(permissionList)) return false;
    
    return permissionList.some(permission => 
      authService.hasPermission(permission)
    );
  },

  // Get user facility from token
  getUserFacility: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.facility_id;
    } catch (error) {
      return null;
    }
  }
};

export default authService;