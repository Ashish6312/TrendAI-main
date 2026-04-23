"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscription } from "./SubscriptionContext";

export interface Notification {
  id: string;
  type: 'payment' | 'analysis' | 'profile' | 'system' | 'market' | 'alert' | 'local' | 'trending' | 'location';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    paymentId?: string;
    analysisId?: string;
    region?: string;
    location?: string;
    businessType?: string;
    amount?: number;
    planName?: string;
    recommendationCount?: number;
    country?: string;
    city?: string;
    currency?: string;
    localTrend?: string;
    marketGrowth?: string;
    competitorCount?: number;
    investmentRange?: string;
    coordinates?: { lat: number; lng: number };
    detection_method?: string;
    profile_completion?: number;
    updated_at?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  userLocation: { 
    country: string; 
    city: string; 
    currency: string;
    coordinates?: { lat: number; lng: number };
  } | null;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refreshLocation: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { plan, isSubscribed } = useSubscription();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userLocation, setUserLocation] = useState<{ 
    country: string; 
    city: string; 
    currency: string;
    coordinates?: { lat: number; lng: number };
  } | null>(null);

  useEffect(() => {
    const cachedLocation = localStorage.getItem('user_location_data');
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        if (parsed.country && (parsed.country.length === 2 || parsed.country === 'Unknown' || parsed.city === 'Unknown')) {
          localStorage.removeItem('user_location_data');
          localStorage.removeItem('user_location_timestamp');
        }
      } catch (e) {
        localStorage.removeItem('user_location_data');
      }
    }
    
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      // 1. PRIORITY 1: User Profile Location (if authenticated)
      if (session?.user?.email) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscopebackend-git-master-ashish-sharmas-projects-7e8014b8.vercel.app';
          const profileRes = await fetch(`${apiUrl}/api/users/${encodeURIComponent(session.user.email)}/location`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.location && profileData.location !== 'Unknown') {
               console.log('👤 Using Profile-Saved Location:', profileData.location);
               
               // Resolve the full details for the saved string
               const { locationAPI } = await import('../utils/locationAPI');
               const resolved = await locationAPI.parseLocationString(profileData.location);
               
               if (resolved.country) {
                 const loc = {
                   country: resolved.country.name,
                   city: resolved.city?.name || 'Unknown',
                   currency: resolved.country.currency_symbol || 'USD',
                   coordinates: resolved.coordinates
                 };
                 setUserLocation(loc);
                 localStorage.setItem('user_location_data', JSON.stringify(loc));
                 localStorage.setItem('user_location_timestamp', Date.now().toString());
                 return; // Successful resolution from profile
               }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch profile location, falling back to cache/GPS');
        }
      }

      // 2. PRIORITY 2: Local Cache (Valid for 15 mins)
      const cached = localStorage.getItem('user_location_data');
      const timestamp = localStorage.getItem('user_location_timestamp');
      
      if (cached && timestamp && (Date.now() - parseInt(timestamp) < 15 * 60 * 1000)) {
        const parsed = JSON.parse(cached);
        if (parsed.country && parsed.country !== 'Unknown') {
          console.log('💾 Using Cached Location:', parsed.city);
          setUserLocation(parsed);
          return;
        }
      }

      // 3. PRIORITY 3: GPS (High Accuracy fallback)
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (res.ok) {
              const data = await res.json();
              const loc = {
                country: data.countryName || 'Unknown',
                city: data.locality || data.city || 'Unknown',
                currency: getCurrencyByCountry(data.countryName || 'Unknown'),
                coordinates: { lat: latitude, lng: longitude }
              };
              console.log('📡 Using GPS-Detected Location:', loc.city);
              setUserLocation(loc);
              localStorage.setItem('user_location_data', JSON.stringify(loc));
              localStorage.setItem('user_location_timestamp', Date.now().toString());
            }
          } catch (e) { /* Silent */ }
        }, () => { 
           console.log('⚠️ GPS access denied, trying IP fallback...');
           performIpFallback();
        }, { timeout: 10000 });
      } else {
        performIpFallback();
      }
    } catch (e) {
      setUserLocation({ country: 'Global', city: 'Unknown', currency: 'USD' });
    }
  };

  const performIpFallback = async () => {
    // IP fallback
    const services = [
      { url: 'https://ipapi.co/json/', parser: (d: any) => ({ country: d.country_name, city: d.city, currency: d.currency }) },
      { url: 'https://ipwho.is/', parser: (d: any) => ({ country: d.country, city: d.city, currency: d.currency?.code }) }
    ];

    for (const s of services) {
      try {
        const res = await fetch(s.url);
        if (res.ok) {
          const d = await res.json();
          const loc = { ...s.parser(d), currency: s.parser(d).currency || getCurrencyByCountry(s.parser(d).country) };
          if (loc.country && loc.country !== 'Unknown') {
            console.log('🌐 Using IP-Based Location:', loc.city);
            setUserLocation(loc);
            localStorage.setItem('user_location_data', JSON.stringify(loc));
            localStorage.setItem('user_location_timestamp', Date.now().toString());
            return;
          }
        }
      } catch (e) { continue; }
    }
  };

  const getCurrencyByCountry = (c: string): string => {
    const map: any = { 'India': 'INR', 'United States': 'USD', 'United Kingdom': 'GBP', 'Germany': 'EUR' };
    return map[c] || 'USD';
  };

  const refreshLocation = () => {
    localStorage.removeItem('user_location_data');
    getUserLocation();
  };

  useEffect(() => {
    if (session?.user?.email) {
      const saved = localStorage.getItem(`notifications_${session.user.email}`);
      if (saved) setNotifications(JSON.parse(saved).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email && notifications.length > 0) {
      localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(notifications));
    }
  }, [notifications, session?.user?.email]);

  const addNotification = (n: any) => {
    const newN = { ...n, id: Math.random().toString(36).substr(2, 9), timestamp: new Date(), read: false };
    setNotifications(prev => [newN, ...prev].slice(0, 50));
  };

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount: notifications.filter(n => !n.read).length,
      userLocation, addNotification, markAsRead, markAllAsRead, deleteNotification, clearAll, refreshLocation
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}