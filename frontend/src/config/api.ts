// API Configuration - Centralized API URL management
// Version: 1.2 - Fixed API URL to point to correct Render deployment
export const API_CONFIG = {
  // Always use Render backend in production
  baseURL: 'https://trendai-api.onrender.com',
  timeout: 30000,
};

export const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.startsWith('192.168.'));

  if (isLocalhost) {
    // If specifically set to something local in env, use it. 
    // Otherwise default to local backend port 8000.
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl;
    }
    return 'http://127.0.0.1:8000';
  }
  
  // For production (Vercel), prioritize explicitly set production URL or fall back to Render
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
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