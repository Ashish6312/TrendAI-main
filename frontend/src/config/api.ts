// API Configuration - Centralized API URL management
// Version: 1.2 - Fixed API URL to point to correct Render deployment
export const API_CONFIG = {
  // Always use Render backend in production
  baseURL: 'https://trendai-api.onrender.com',
  timeout: 30000,
};

export const getApiUrl = () => {
  // Use localhost for development
  return 'http://127.0.0.1:8000';
};


// Helper function for making API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${getApiUrl()}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};