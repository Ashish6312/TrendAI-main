"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface LoginSession {
  id: number;
  session_token: string;
  provider: string;
  ip_address: string;
  user_agent: string;
  device_info: {
    browser: string;
    os: string;
    device: string;
    screen_resolution?: string;
    timezone?: string;
    language?: string;
  };
  location_info: {
    country: string;
    city: string;
    region?: string;
    timezone?: string;
  };
  login_method: string;
  session_start: string;
  session_end: string | null;
  is_active: boolean;
}

interface LoginHistoryProps {
  userEmail: string;
}

export default function LoginHistory({ userEmail }: LoginHistoryProps) {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userEmail) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscope-api.onrender.com';
        const response = await fetch(`${apiUrl}/api/users/${userEmail}/sessions?limit=10`);
        
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else if (response.status === 404) {
          // User not found - this is expected for new users
          console.log('User sessions not found - user may not be synced yet');
          setSessions([]);
        } else {
          console.error('Failed to fetch login sessions:', response.status);
          setSessions([]);
        }
      } catch (error) {
        console.error('Failed to fetch login sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userEmail]);

  const getDeviceIcon = (deviceType: string | undefined) => {
    const type = deviceType?.toLowerCase() || 'desktop';
    switch (type) {
      case 'mobile':
        return <Smartphone size={16} />;
      case 'tablet':
        return <Tablet size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionDuration = (start: string, end: string | null) => {
    if (!end) return "Active";
    
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = endTime - startTime;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-white/10 rounded"></div>
                    <div className="w-24 h-3 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-white/10 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Shield size={48} className="mx-auto mb-4 opacity-50" />
        <p>No login history found</p>
        <p className="text-sm mt-2">Your login sessions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(showAllSessions ? sessions : sessions.slice(0, 3)).map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-blue-400 border border-white/5 shadow-inner">
                {getDeviceIcon(session.device_info.device)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white">
                  <span>{session.device_info.browser}</span>
                  <span className="text-gray-500 font-normal text-xs">on</span>
                  <span>{session.device_info.os}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                  <Clock size={10} />
                  <span>{formatDate(session.session_start)}</span>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 pt-1">
              {session.is_active ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-500/20">
                  {getSessionDuration(session.session_start, session.session_end)}
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin size={12} />
                <span>
                  {session.location_info?.city && session.location_info?.country 
                    ? `${session.location_info.city}, ${session.location_info.country}`
                    : 'Institutional Node - Verified Area'
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-300">
                <Globe size={12} />
                <span>ID: {session.ip_address === 'server-side' ? 'Protected Protocol' : (session.ip_address || 'Internal Secure Tunnel')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {session.device_info.screen_resolution && (
                <div className="text-gray-400">
                  Screen: {session.device_info.screen_resolution}
                </div>
              )}
              
              {session.device_info.timezone && (
                <div className="text-gray-400">
                  Timezone: {session.device_info.timezone}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {sessions.length > 3 && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setShowAllSessions(!showAllSessions)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors italic flex items-center gap-2 mx-auto"
          >
            {showAllSessions ? (
              <>Show Fewer Sessions <Clock size={12} className="rotate-180 transition-transform" /></>
            ) : (
              <>+ {sessions.length - 3} More Sessions Hidden <Clock size={12} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}