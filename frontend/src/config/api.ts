// API Configuration - Centralized API URL management
// Version: 1.1 - Fixed subscription theme errors
export const API_CONFIG = {
  // Always use Render backend in production
  baseURL: 'https://trendai-api.onrender.com',
  timeout: 30000,
};

export const getApiUrl = () => {
  // For development, check if we're on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  // For production, always use Render backend
  return 'https://trendai-api.onrender.com';
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