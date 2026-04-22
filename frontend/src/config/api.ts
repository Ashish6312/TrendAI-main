// API Configuration - Centralized API URL management
export const API_CONFIG = {
  // Priority: 1. ENV Var, 2. Render Fallback
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://trendai-api.onrender.com',
  timeout: 30000,
};

export const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Use consistent protocol/hostname for local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:8000`;
    }
    
    // Check for explicit local API override (e.g., ?api=local)
    if (searchParams.get('api') === 'local') {
      return 'http://127.0.0.1:8000';
    }

    // Use production Render backend for all deployed versions
    return API_CONFIG.baseURL;
  }
  
  return API_CONFIG.baseURL;
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