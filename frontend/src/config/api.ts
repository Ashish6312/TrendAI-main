// API Configuration - Centralized API URL management
// Version: 1.2 - Fixed API URL to point to correct Render deployment
export const API_CONFIG = {
  // Always use Render backend in production
  baseURL: 'https://trendai-api.onrender.com',
  timeout: 30000,
};

export const getApiUrl = () => {
  // Always prioritize explicitly set environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.startsWith('192.168.'));

  if (isLocalhost) {
    // Only use localhost if no production URL is set
    return 'http://127.0.0.1:8000';
  }
  
  // Fallback to Render for production
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