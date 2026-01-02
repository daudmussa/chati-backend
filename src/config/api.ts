// Configuration for API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication
  AUTH_SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_ME: `${API_BASE_URL}/api/auth/me`,
  
  // Store
  STORE_SETTINGS: `${API_BASE_URL}/api/store/settings`,
  STORE_BY_NAME: (name: string) => `${API_BASE_URL}/api/store/by-name/${encodeURIComponent(name)}`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  
  // Admin
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_USER_FEATURES: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/features`,
  ADMIN_USER_LIMITS: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/limits`,
  
  // Conversations
  CONVERSATIONS: `${API_BASE_URL}/api/conversations`,
  
  // Bookings
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  BOOKINGS_STATUS: `${API_BASE_URL}/api/bookings/status`,
  BOOKINGS_TOGGLE: `${API_BASE_URL}/api/bookings/toggle`,
  SERVICES: `${API_BASE_URL}/api/services`,
  SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/api/services/${id}`,
  BOOKING_STATUS: (id: string) => `${API_BASE_URL}/api/bookings/${id}/status`,
  
  // Settings
  BUSINESS_SETTINGS: `${API_BASE_URL}/api/business/settings`,
  
  // User Credentials
  USER_CREDENTIALS: `${API_BASE_URL}/api/user/credentials`,
  
  // Health
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;
