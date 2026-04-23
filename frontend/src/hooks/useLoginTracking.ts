"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

interface LoginTrackingData {
  user_email: string;
  session_token: string;
  provider: string;
  ip_address?: string;
  user_agent: string;
  device_info: {
    browser: string;
    os: string;
    device: string;
    screen_resolution: string;
    timezone: string;
    language: string;
  };
  location_info?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  login_method: string;
}

import { getApiUrl } from "@/config/api";

// Helper function to detect browser
function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browser = "Unknown";
  
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";
  
  return browser;
}

// Helper function to detect OS
function getOSInfo() {
  const userAgent = navigator.userAgent;
  let os = "Unknown";
  
  if (userAgent.includes("Windows NT")) os = "Windows";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  return os;
}

// Helper function to detect device type
function getDeviceType() {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

// Helper function to get location from IP and GPS
async function getLocationInfo(): Promise<any> {
  // First try to get GPS location if available and user grants permission
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 600000
        });
      });

      const { latitude, longitude } = position.coords;
      
      try {
        const geoServices = [
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
        ];

        for (const serviceUrl of geoServices) {
          try {
            const response = await fetch(serviceUrl);
            if (response.ok) {
              const data = await response.json();
              
              if (serviceUrl.includes('bigdatacloud')) {
                return {
                  country: data.countryName || 'Unknown',
                  city: data.city || data.locality || 'Unknown',
                  region: data.principalSubdivision || 'Unknown',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  ip: 'GPS Location',
                  accuracy: position.coords.accuracy,
                  coordinates: { lat: latitude, lng: longitude },
                  source: 'GPS + BigDataCloud'
                };
              } else {
                return {
                  country: data.address?.country || 'Unknown',
                  city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
                  region: data.address?.state || data.address?.region || 'Unknown',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  ip: 'GPS Location',
                  accuracy: position.coords.accuracy,
                  coordinates: { lat: latitude, lng: longitude },
                  source: 'GPS + OpenStreetMap'
                };
              }
            }
          } catch (e) { continue; }
        }
      } catch (e) { /* Silent */ }
    } catch (e) { /* Silent */ }
  }

  // Fallback to IP-based location
  const apiUrl = getApiUrl();
  const services = [
    `${apiUrl}/api/utils/location`,
    'https://ipapi.co/json/',
    'https://ipwho.is',
    'https://ipinfo.io/json'
  ];

  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(service, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        let locationData;
        
        if (service.includes('ipapi.co')) {
          locationData = { country: data.country_name, city: data.city, region: data.region, timezone: data.timezone, ip: data.ip, source: 'IP-API' };
        } else if (service.includes('ipwho.is')) {
          locationData = { country: data.country, city: data.city, region: data.region, timezone: data.timezone?.name, ip: data.ip, source: 'IP-WHO' };
        } else if (service.includes('ipinfo.io')) {
          locationData = { country: data.country, city: data.city, region: data.region, timezone: data.timezone, ip: data.ip, source: 'IP-INFO' };
        } else {
          locationData = { country: data.country, city: data.city, region: data.region, timezone: data.timezone, ip: data.ip, source: 'Backend' };
        }
        
        if (locationData.country && locationData.country !== 'Unknown') return locationData;
      }
    } catch (e) { continue; }
  }
  
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ip: 'Unknown',
    source: 'Fallback'
  };
}

export function useLoginTracking() {
  const { data: session, status } = useSession();
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackLogin = async () => {
      if (status !== "authenticated" || !session?.user?.email || hasTracked.current) return;
      hasTracked.current = true;

      try {
        const locationInfo = await getLocationInfo();
        
        // Persistent trackingId logic
        let trackingId = localStorage.getItem('starterscope_tracking_id');
        if (!trackingId) {
          trackingId = `tr_${(session as any)?.user?.id || 'usr'}_${Math.random().toString(36).substring(2, 11)}`;
          localStorage.setItem('starterscope_tracking_id', trackingId);
        }

        const trackingData: LoginTrackingData = {
          user_email: session.user.email,
          session_token: trackingId, // Use persistent trackingId as session token
          provider: (session as any).provider || 'credentials',
          ip_address: locationInfo?.ip,
          user_agent: navigator.userAgent,
          device_info: {
            browser: getBrowserInfo(),
            os: getOSInfo(),
            device: getDeviceType(),
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
          },
          location_info: {
            country: locationInfo?.country,
            city: locationInfo?.city,
            region: locationInfo?.region,
            timezone: locationInfo?.timezone
          },
          login_method: 'auto'
        };

        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/api/users/login-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackingData)
        });
      } catch (error) {
        // Silent
      }
    };

    trackLogin();
  }, [status, session]);
}