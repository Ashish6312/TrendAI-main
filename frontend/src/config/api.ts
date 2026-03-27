// API Configuration - Centralized API URL management
// Version: 1.2 - Fixed API URL to point to correct Render deployment
export const API_CONFIG = {
  // Always use Render backend in production
  baseURL: 'https://trendai-api.onrender.com',
  timeout: 30000,
};

export const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for explicit local API override (e.g., ?api=local)
    if (searchParams.get('api') === 'local') {
      return 'http://localhost:8000';
    }

    // Default to production Render backend even on localhost 
    // to ensure the UI works without running the backend locally.
    // If you WANT to use the local backend, add ?api=local to the URL.
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