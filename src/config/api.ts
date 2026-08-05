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
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCTS_BY_STORE: (storeName: string) => `${API_BASE_URL}/api/products/by-store/${encodeURIComponent(storeName)}`,
  PRODUCT_BY_ID: (id: string) => `${API_BASE_URL}/api/products/${id}`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_BY_ID: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
  
  // Admin
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_USER_FEATURES: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/features`,
  ADMIN_USER_LIMITS: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/limits`,
  ADMIN_USER_SUBSCRIPTION: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/subscription`,
  ADMIN_USER_PAYMENTS: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/payments`,
  ADMIN_USER_INFO: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/info`,
  ADMIN_LOGIN_AS_USER: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/login-as`,
  ADMIN_DELETE_USER: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}`,
  ADMIN_CHANGE_PASSWORD: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}/password`,
  ADMIN_TEST_EMAIL: `${API_BASE_URL}/api/admin/test-email`,
  
  // Conversations
  CONVERSATIONS: `${API_BASE_URL}/api/conversations`,
  
  // Bookings
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  BOOKINGS_STATUS: `${API_BASE_URL}/api/bookings/status`,
  BOOKINGS_TOGGLE: `${API_BASE_URL}/api/bookings/toggle`,
  SERVICES: `${API_BASE_URL}/api/services`,
  SERVICE_BY_ID: (id: string) => `${API_BASE_URL}/api/services/${id}`,
  BOOKING_STATUS: (id: string) => `${API_BASE_URL}/api/bookings/${id}/status`,
  
  // Staff
  STAFF: `${API_BASE_URL}/api/staff`,
  STAFF_BY_ID: (id: string) => `${API_BASE_URL}/api/staff/${id}`,
  
  // Categories
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  CATEGORIES_BY_STORE: (storeName: string) => `${API_BASE_URL}/api/categories/by-store/${encodeURIComponent(storeName)}`,
  CATEGORY_BY_ID: (id: string) => `${API_BASE_URL}/api/categories/${id}`,
  
  // Image Upload
  UPLOAD_IMAGE: `${API_BASE_URL}/api/upload/image`,
  DELETE_IMAGE: `${API_BASE_URL}/api/upload/image`,
  
  // Settings
  BUSINESS_SETTINGS: `${API_BASE_URL}/api/business/settings`,
  
  // User Credentials
  USER_CREDENTIALS: `${API_BASE_URL}/api/user/credentials`,
  
  // Payment
  PAYMENT_SETTINGS: `${API_BASE_URL}/api/payment/settings`,
  PAYMENT_CREATE: `${API_BASE_URL}/api/payment/create`,
  PAYMENT_BOOKING: (bookingId: string) => `${API_BASE_URL}/api/payment/booking/${bookingId}`,
  PAYMENT_TRANSACTIONS: `${API_BASE_URL}/api/payment/transactions`,
  PAYMENT_STATS: `${API_BASE_URL}/api/payment/stats`,
  PAYMENT_WEBHOOK: `${API_BASE_URL}/api/payment/webhook`,
  PAYMENT_ITEMS: `${API_BASE_URL}/api/payment/items`,
  PAYMENT_ITEMS_BY_STORE: (storeName: string) => `${API_BASE_URL}/api/payment/items/by-store/${encodeURIComponent(storeName)}`,
  PAYMENT_ITEM_BY_ID: (itemId: string) => `${API_BASE_URL}/api/payment/items/${itemId}`,
  PAYMENT_ITEM_PAY: (itemId: string) => `${API_BASE_URL}/api/payment/item/${itemId}/pay`,
  
  // Health
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;
