"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Loader2, TrendingUp, MapPin,
  Target, BarChart3, Lightbulb,
  ArrowRight, FileText, Clock, ChevronRight,
  Cpu, Download, Share2, Play, CheckCircle2, AlertCircle, Sparkles, Bookmark,
  Shield, Activity, Globe
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { generateProfessionalPDF } from "@/utils/pdfReportGenerator";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useSearchParams } from "next/navigation";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import UniformCard from "@/components/UniformCard";
import AIAnalysisCanvas from "@/components/AIAnalysisCanvas";
import AIAnalysisWidget from "@/components/AIAnalysisWidget";
import EnhancedRecommendationCard from "@/components/EnhancedRecommendationCard";
import AISourceIndicator from "@/components/AISourceIndicator";
import { useTheme } from "next-themes";
import { getApiUrl } from "@/config/api";
import { useSearch } from "@/context/SearchContext";


const renderFormattedText = (text: string) => {
  if (!text) return null;

  const cleanText = text.replace(/^"|"$/g, '').trim();

  // Split into lines and process each
  const lines = cleanText.split('\n').filter(l => l.trim().length > 0);

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        // Detect bullet points
        const isBullet = /^[•\-\*]/.test(line.trim());
        const displayLine = isBullet ? line.trim().replace(/^[•\-\*]\s*/, '') : line.trim();

        // Match phrases ending with colon for bolding (e.g., "Key Facts:")
        const parts = displayLine.split(/(\d{4} government data|\d{4} government initiative|Key Market Facts \(2025 Data\):|Economic Indicators \(Current\):|Government Support \(2025 Policies\):|[^:]+:)/i);

        const content = (
          <span className="text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            {parts.map((part, pi) => {
              // Basic heuristic for headers: ends with colon and isn't too long, or matches common pattern
              const isHeader = (part.endsWith(':') && part.length < 50) ||
                /Key Market Facts|Economic Indicators|Government Support/i.test(part);

              if (isHeader) {
                return (
                  <span key={pi} className="block mt-4 mb-2 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider">
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </span>
        );

        if (isBullet) {
          return (
            <div key={i} className="flex gap-3 items-start pl-2">
              <span className="text-emerald-500 mt-1.5 flex-shrink-0 text-sm font-black tracking-widest">•</span>
              <div className="flex-1">{content}</div>
            </div>
          );
        }

        return (
          <p key={i} className="flex-1 text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            {content}
          </p>
        );
      })}
    </div>
  );
};

import { Suspense } from "react";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();
  const { theme, planFeatures, hasReachedAnalysisLimit, actualPlanName, plan } = useSubscription();
  const { lastResult, lastArea, setLastResult, setLastArea } = useSearch();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const apiUrl = getApiUrl();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Update time every second with hydration safety
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [savingBusiness, setSavingBusiness] = useState<string | null>(null);
  const [vaultCount, setVaultCount] = useState(0);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  const fetchVaultCount = async () => {
    if (!session?.user?.email) return;
    try {
      const response = await fetch(`${apiUrl}/api/saved-businesses?email=${encodeURIComponent(session.user.email)}`);
      if (response.ok) {
        const data = await response.json();
        setVaultCount(data.length);
      }
    } catch (e) {
      console.error("Failed to fetch vault count, retrying in 5s...", e);
      setTimeout(fetchVaultCount, 5000); // Retry once after 5s (handles Neon cold start)
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchVaultCount();
    }
  }, [status, session?.user?.email]);

  const handleSaveBusiness = async (businessData: any) => {
    if (!session?.user?.email) {
      addNotification({
        type: 'alert',
        title: 'Sign In Required',
        message: 'Please sign in to save businesses.',
        priority: 'high'
      });
      return;
    }

    // Check plan from context
    if (plan === 'free') {
      addNotification({
        type: 'alert',
        title: 'Alpha Vault Restricted',
        message: 'Business saving is an Alpha Vault feature. Please upgrade to a paid plan to store opportunities.',
        priority: 'high'
      });
      router.push('/acquisition-tiers');
      return;
    }

    // Enforce Starter limit (5 saves)
    if (plan === 'starter' && vaultCount >= 5) {
      addNotification({
        type: 'alert',
        title: 'Vault Capacity Reached',
        message: 'Starter plan is limited to 5 archived assets. Please upgrade to Professional for unlimited storage.',
        priority: 'high'
      });
      router.push('/acquisition-tiers');
      return;
    }

    try {
      setSavingBusiness(businessData.business_name);
      const response = await fetch(`${apiUrl}/api/saved-businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      });

      if (response.ok) {
        setVaultCount(prev => prev + 1);
        addNotification({
          type: 'profile',
          title: 'Stored in Vault',
          message: `${businessData.business_name} has been safely archived in your Alpha Vault.`,
          priority: 'medium'
        });
      } else {
        let errorMessage = 'Failed to archive business';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      let displayMessage = 'Could not store business in vault.';

      // Better error handling
      if (error?.message && typeof error.message === 'string' && error.message !== '[object Object]') {
        displayMessage = error.message;
      } else if (error?.toString && typeof error.toString === 'function') {
        const errorStr = error.toString();
        if (errorStr !== '[object Object]') {
          displayMessage = errorStr;
        }
      }

      addNotification({
        type: 'alert',
        title: 'Encryption Failed',
        message: displayMessage,
        priority: 'high'
      });
    } finally {
      setSavingBusiness(null);
    }
  };

  const [area, setArea] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Initializing Neural Reconnaissance...");
  const [isDeepRecon, setIsDeepRecon] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Auto-persistence logic: Hydrate from global context on mount
  useEffect(() => {
    if (lastResult && !result) {
       setResult(lastResult);
       if (lastArea) setArea(lastArea);
    }
  }, [lastResult, lastArea, result]);

  // Save result to localStorage when it changes
  useEffect(() => {
    if (result && typeof window !== 'undefined') {
      const resultToSave = {
        ...result,
        timestamp_added_to_storage: Date.now()
      };
      localStorage.setItem('last_analysis_result', JSON.stringify(resultToSave));
    }
  }, [result]);

  useEffect(() => {
    const isPaymentSuccess = searchParams.get('payment_success') === 'true';
    const paymentId = searchParams.get('payment_id');

    if (isPaymentSuccess && paymentId) {
      // Check if we've already shown this success modal in this session
      const processedPayments = JSON.parse(sessionStorage.getItem('processed_payments') || '[]');
      if (!processedPayments.includes(paymentId)) {
        const details = {
          payment_id: paymentId,
          order_id: searchParams.get('order_id'),
          plan: searchParams.get('plan'),
          amount: searchParams.get('amount'),
          currency: searchParams.get('currency'),
          billing: searchParams.get('billing')
        };
        setPaymentDetails(details);
        setShowSuccessModal(true);

        // Mark as processed
        processedPayments.push(paymentId);
        sessionStorage.setItem('processed_payments', JSON.stringify(processedPayments));

        // Clear the URL parameters by replacing the current entry in history
        const newUrl = window.location.pathname;
        router.replace(newUrl);
      }
    }

    const areaParam = searchParams.get('area') || searchParams.get('q');
    if (areaParam) {
      setArea(decodeURIComponent(areaParam));
    }
  }, [searchParams]);


  // Fetch user's profile location
  useEffect(() => {
    const fetchProfileLocation = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const encodedEmail = encodeURIComponent(session.user.email);
          const response = await fetch(`${apiUrl}/api/users/${encodedEmail}/location`);

          if (response.ok) {
            const data = await response.json();
            if (data.location) {
              setProfileLocation(data.location);
              // Automatic pre-fill of search area removed to maintain a clean default state
            }
          }
        } catch (error) {
          console.error('Error fetching profile location:', error);
        }
      }
    };

    fetchProfileLocation();
  }, [status, session?.user?.email, apiUrl]);


  // Location suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (area && showSuggestions && area.length > 2) {
        try {
          // 💡 FIXED: Strict India-only location suggestions
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(area)}&countrycodes=in&limit=6&addressdetails=1`, {
            headers: { 'User-Agent': 'StartupScope-Market-Analysis/1.0' }
          });
          const data = await res.json();
          setSuggestions(data);
        } catch (e) {
          console.error("Error fetching locations", e);
        }
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [area, showSuggestions]);

  const handleSelectSuggestion = (suggestion: any) => {
    setArea(suggestion.display_name);
    setShowSuggestions(false);
  };

  // Sync user with backend when session is available
  // 🔐 USER SYNC: Handled server-side in NextAuth signIn callback for optimal performance.
  // The client-side sync was redundant and has been retired to prevent UI-level timeouts.


  // Fetch history function
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchHistory();
    }
  }, [status, session?.user?.email]);


  const fetchHistory = async () => {
    if (!session?.user?.email) return;
    try {
      const encodedEmail = encodeURIComponent(session.user.email);
      const url = `${apiUrl}/api/history/${encodedEmail}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle automatic history maintenance notification
      if (data.purged_count > 0) {
        addNotification({
          type: 'system',
          title: 'History Maintenance',
          message: `Automatically purged ${data.purged_count} records older than 7 days for performance.`,
          priority: 'low'
        });
      }

      const historyList = Array.isArray(data.history) ? data.history : (Array.isArray(data) ? data : []);
      setHistory(historyList);
      setAnalysisCount(historyList.length);
      // Auto-persistence removed to stay clean until user interacts.
    } catch (e) {
      console.error("Failed to fetch history, retrying in 5s...", e);
      setTimeout(fetchHistory, 5000);
      setHistory([]);
      setAnalysisCount(0);
    }
  };

  // Handle analyze function
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Use profile location as fallback and ensure India-only search
    let searchArea = area || profileLocation;
    await performAnalysis(searchArea);
  };

  const performAnalysis = async (searchArea: string) => {
    if (searchArea && !searchArea.toLowerCase().includes('india')) {
      searchArea = `${searchArea}, India`;
    }

    if (!searchArea) {
      addNotification({
        type: 'alert',
        title: 'Location Required',
        message: 'Please enter a location or set one in your profile to get business recommendations.',
        priority: 'high'
      });
      return;
    }

    if (hasReachedAnalysisLimit(analysisCount)) {
      addNotification({
        type: 'alert',
        title: 'Analysis Limit Reached',
        message: `You've reached your analysis limit. Please upgrade your plan to continue.`,
        priority: 'high'
      });
      router.push('/acquisition-tiers');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("Waking up Intelligence Cluster...");
    setResult(null);

    // 🔐 STRATEGIC LOCK: Prevent accidental page cycles during active reconnaissance
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('active_reconnaissance', 'true');
    }

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        // Slow crawling progress logic
        const increment = prev < 30 ? 1 : prev < 70 ? 0.3 : prev < 90 ? 0.05 : 0.01;
        const next = prev >= 99 ? 99 : prev + (Math.random() * increment);
        return next;
       });
    }, 1000);

    try {
      // 📡 STRATEGIC WEBSOCKET COUPLING: Connect to the analysis stream
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${protocol}//${host}/ws/analysis`;

      const socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'analysis_progress') {
            setLoadingMessage(data.message);
            // Dynamic jump for major milestones
            if (data.message.toLowerCase().includes("deep extraction") || data.message.toLowerCase().includes("apify")) {
              setIsDeepRecon(true);
            }
            setLoadingProgress(prev => Math.min(prev + 5, 98));
          }
        } catch (e) {}
      };
      socketRef.current = socket;

      const response = await fetch(`${apiUrl}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: searchArea,
          user_email: session?.user?.email,
          language: language,
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error(`Neural Link Error: ${response.status}`);
      }

      const data = await response.json();

      setResult(data);
      setLastResult(data);
      if (searchArea) setLastArea(searchArea);

      setLoadingProgress(100);
      setLoadingMessage("Intelligence Synthesis Complete");
      
      setTimeout(() => {
        setResult(data);
        clearInterval(progressInterval);
        setLoading(false);
        setIsDeepRecon(false);
        if (socketRef.current) socketRef.current.close();

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('active_reconnaissance');
        }

        if (session?.user?.email && data.recommendations?.length > 0) {
          addNotification({
            type: 'analysis',
            title: 'Mission Success',
            message: `Strategic reconnaissance for ${searchArea.split(',')[0]} complete. ${data.recommendations.length} opportunities identifies.`,
            priority: 'high'
          });
        }
        fetchHistory();
      }, 800);

    } catch (error: any) {
      console.error("Neural Error:", error);
      setResult({
        status: "service_unavailable",
        message: "The intelligence engine is performing deep regional synchronization. High-fidelity results require 60-90s of additional reconnaissance. Please retry shortly."
      });
      addNotification({
        type: 'alert',
        title: 'Neural Link Interrupted',
        message: 'Deep reconnaissance taking longer than expected. The engine is still working; please retry in 60 seconds.',
        priority: 'high'
      });
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setIsDeepRecon(false);
      if (socketRef.current) socketRef.current.close();
    }
  };

  const loadFromHistory = async (item: any) => {
    try {
      setArea(item.area);
      addNotification({
        type: 'analysis',
        title: 'Refreshing Analysis',
        message: `Initiating fresh market logic for ${item.area}...`,
        priority: 'low'
      });

      // Trigger a fresh search for this area
      await performAnalysis(item.area);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error refreshing from history:', error);
    }
  };
  // Loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.2)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="text-emerald-500" size={40} />
            </motion.div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40 italic"
        >
          Loading Dashboard...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative transition-colors duration-500 pt-4 sm:pt-6 lg:pt-10">
      <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-emerald-500/[0.03] dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="responsive-container pb-8 sm:pb-12 lg:pb-16 relative z-10">

        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 sm:mb-6 border-b border-slate-200 dark:border-white/5 pb-2"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Neural Terminal v.2.0
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Active Scan</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tight mb-3">
                {t('dash_ai_insights')}
              </h1>
              <p className="text-slate-600 dark:text-gray-400 text-base sm:text-xl max-w-2xl font-medium leading-relaxed">
                {t('dash_ai_desc')}
              </p>

              {/* Status Indicator Pills from Image */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {[
                  { label: t('dash_vector_global'), active: true, icon: <TrendingUp size={12} /> },
                  profileLocation ? {
                    label: profileLocation.split(',')[0],
                    active: true,
                    icon: <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-blue-500 animate-bounce-slow" />
                            <CheckCircle2 size={12} className="text-blue-400" />
                          </div>,
                    special: true
                  } : null,
                  { label: t('dash_vector_predict'), active: false, icon: <Cpu size={12} /> },
                  { label: "Smart Insights", active: false, icon: <Lightbulb size={12} /> }
                ].filter(Boolean).map((pill: any, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap shrink-0 group ${pill.active
                        ? pill.special
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse-slow'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-500 dark:text-gray-500 shadow-sm'
                      }`}
                  >
                    <div className={`transition-all duration-300 group-hover:scale-125 ${pill.active ? pill.special ? 'text-blue-500' : 'text-emerald-500' : 'text-slate-400'}`}>
                      {pill.icon}
                    </div>
                    {pill.label}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 text-left md:text-right mt-4 md:mt-0">
              <div className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.3em]">System Timestamp</div>
              <div className="text-xl font-mono font-bold text-slate-800 dark:text-white/80">
                {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">
                {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Local Time Syncing..."}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4"
        >

          {/* Left Panel: SEARCH AREA */}
          <div className="lg:col-span-4 space-y-8">

            {/* Region Search Card */}
            <UniformCard
              title={t('dash_market_scope')}
              subtitle={t('dash_empty_desc')}
              icon={<Target className="w-5 h-5 sm:w-6 sm:h-6" />}
              variant="glass"
              size="md"
              className="shadow-xl border-2 border-slate-200/50 dark:border-white/10"
            >
              <form onSubmit={handleAnalyze} className="space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider pl-1">
                      {t('dash_target_loc')}
                    </label>
                    {profileLocation && (
                      <button
                        type="button"
                        onClick={() => setArea(profileLocation)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium underline transition-colors"
                      >
                        Use Profile Location
                      </button>
                    )}
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                      <MapPin className="text-slate-400 dark:text-gray-500 group-focus-within/loc:text-emerald-500 transition-colors" size={20} />
                    </div>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      className="w-full bg-slate-50 dark:bg-[#030612] border-2 border-slate-200 dark:border-slate-800 rounded-[0.75rem] py-2 sm:py-3 pl-10 sm:pl-12 pr-16 text-base font-black tracking-tight text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none hover:border-slate-300 dark:hover:border-slate-700 shadow-lg"
                      placeholder="Search city or region in India..."
                      autoComplete="off"
                      id="location-input"
                    />

                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1 z-10">
                      {profileLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            setArea(profileLocation);
                            setShowSuggestions(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all group/btn"
                          title={`Use profile location: ${profileLocation}`}
                        >
                          <CheckCircle2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      )}
                      <Link
                        href="/profile"
                        className="p-2.5 rounded-xl hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all group/btn"
                        title="Update search preferences"
                      >
                        <MapPin size={20} className="group-hover/btn:scale-110 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Location Status Indicators - Improved spacing and alignment */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 px-1">
                    {profileLocation && area === profileLocation && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                          Using profile location
                        </span>
                      </div>
                    )}
                    {area && area !== profileLocation && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest whitespace-nowrap">
                          Custom search location
                        </span>
                      </div>
                    )}
                    {profileLocation && (
                      <div className="flex items-center gap-2">
                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                          Stored: {profileLocation.split(',')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Location Suggestions Dropdown - Only show when there are actual suggestions or input */}
                  <AnimatePresence>
                    {showSuggestions && (suggestions.length > 0 || area.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className="absolute z-[100] w-full mt-3 bg-white/95 dark:bg-[#0a1128]/95 border-2 border-slate-200 dark:border-emerald-500/30 rounded-2xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.5)] max-h-[450px] overflow-hidden backdrop-blur-3xl flex flex-col"
                      >
                        {/* Header: Dynamic based on content */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/5">
                          <div className="flex items-center gap-2">
                            {suggestions.length > 0 ? (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Verified Locations</div>
                              </>
                            ) : (
                              <>
                                <Clock size={12} className="text-blue-500" />
                                <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Recent Searches</div>
                              </>
                            )}
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">Market Verified</div>
                        </div>

                        <div className="overflow-y-auto p-2 scrollbar-hide">
                          {suggestions.length > 0 ? (
                            <div className="space-y-1">
                              {suggestions.map((s, i) => {
                                const parts = s.display_name.split(',');
                                const primary = parts[0];
                                const secondary = parts.slice(1).join(',').trim();

                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectSuggestion(s);
                                    }}
                                    className="w-full text-left p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/10 flex items-center gap-4"
                                  >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all border border-transparent group-hover:border-emerald-500/20">
                                      <MapPin size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">
                                        {primary}
                                      </div>
                                      <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400 truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                        {secondary}
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                      <ChevronRight size={16} className="text-emerald-500" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : area.length === 0 && history.length > 0 ? (
                            <div className="space-y-1">
                              {history.slice(0, 5).map((item, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    loadFromHistory(item);
                                  }}
                                  className="w-full text-left p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/10 flex items-center gap-4"
                                >
                                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-500 transition-all">
                                    <Clock size={18} className="text-blue-400/60 group-hover:text-blue-500 transition-colors" />
                                  </div>

                                  <div className="flex-grow min-w-0">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-500 transition-colors truncate">
                                      {item.area}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>

                                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight size={14} className="text-blue-500" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : area.length > 0 && area.length <= 2 ? (
                            <div className="py-8 px-4 text-center">
                              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] animate-pulse">
                                Keep typing to search...
                              </div>
                            </div>
                          ) : (
                            <div className="py-12 px-4 text-center">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Globe size={24} className="text-slate-300 dark:text-slate-600" />
                              </div>
                              <div className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-1">No matches found</div>
                              <div className="text-[11px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-widest">Try a different region in India</div>
                            </div>
                          )}
                        </div>
                        
                        {history.length > 0 && suggestions.length > 0 && (
                           <div className="p-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-center">
                              <button 
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setArea("");
                                }}
                                className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
                              >
                                Clear to see history
                              </button>
                           </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Button */}
                <div className="space-y-3">
                  {plan === 'free' && (
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 italic">User Allocation</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{Math.max(0, 1 - analysisCount)} Gifted Analysis Remaining</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (!area && !profileLocation) || hasReachedAnalysisLimit(analysisCount)}
                    className="w-full h-16 bg-slate-900 dark:bg-white group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-black/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border border-white/10 dark:border-slate-200"
                  >
                    {/* Background Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <div className="flex items-center gap-3">
                        {loading ? (
                          <Loader2 className="animate-spin text-emerald-500 dark:text-emerald-600" size={24} />
                        ) : (
                          <Sparkles 
                            size={20} 
                            fill="currentColor" 
                            className="text-emerald-500 dark:text-emerald-600 transition-transform group-hover:rotate-12 group-hover:scale-110" 
                          />
                        )}
                        <span className="text-xl font-bold tracking-tight text-white dark:text-slate-900">
                          {loading ? t('dash_analyzing') : hasReachedAnalysisLimit(analysisCount) ? 'Recon Limit Reached' : t('dash_analyze_btn')}
                        </span>
                      </div>
                      
                      {area && !hasReachedAnalysisLimit(analysisCount) && !loading && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                            {area.split(',')[0]} Verified
                          </span>
                        </div>
                      )}
                      
                      {hasReachedAnalysisLimit(analysisCount) && (
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-[0.2em] mt-1">
                          Neural Credits Depleted
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Upgrade Notice */}
                {hasReachedAnalysisLimit(analysisCount) && (
                  <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">{t('dash_limit_desc')}</p>
                    <Link href="/acquisition-tiers" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                      {t('dash_upgrade_now')} →
                    </Link>
                  </div>
                )}
              </form>
            </UniformCard>
            {/* Recent Searches Card - Intelligent conditional visibility */}
            <UniformCard
              title={t('dash_recent_searches')}
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="default"
              size="md"
              className={`shadow-2xl border-2 border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-[#060b1e]/40 backdrop-blur-2xl transition-all duration-500 ${
                showSuggestions ? 'opacity-20 pointer-events-none scale-[0.98] blur-sm' : 'opacity-100 relative z-20'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-medium text-slate-600 dark:text-gray-400">{t('dash_history_desc')}</span>
                <button
                  onClick={fetchHistory}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  {t('dash_refresh')}
                </button>
              </div>

              <div className="space-y-4">
                {history.length > 0 ? (
                  <>
                    {(showAllHistory ? history : history.slice(0, 2)).map((item, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => loadFromHistory(item)}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-white/10 text-left group transition-all hover:shadow-md"
                      >
                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mb-1">
                          {item.area}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-500" suppressHydrationWarning>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Recent'}
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <div className="text-sm font-medium text-slate-500 dark:text-gray-500">No search history yet</div>
                    <div className="text-xs text-slate-400 dark:text-gray-600 mt-1">Start searching to see your history here</div>
                  </div>
                )}

                {history.length > 2 && (
                  <div className="pt-2 text-center border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => setShowAllHistory(!showAllHistory)}
                      className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-2 mx-auto"
                    >
                      {showAllHistory ? (
                        <>Show Less <ChevronRight size={12} className="rotate-[-90deg]" /></>
                      ) : (
                        <>Show More ({history.length - 2} hidden) <ChevronRight size={12} className="rotate-[90deg]" /></>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </UniformCard>

            {/* Smart Features Card with AI Widget */}
            <UniformCard
              title="AI Engine"
              subtitle="Real-time market analysis"
              icon={<Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="gradient"
              size="md"
              className="shadow-xl border-2 border-slate-200/50 dark:border-white/10"
            >
              {/* AI Widget */}
              <div className="flex justify-center mb-4">
                <AIAnalysisWidget size="sm" showStatus={true} />
              </div>

              <p className="text-xs text-slate-500 dark:text-gray-500 leading-tight mb-4 text-center">
                Real-time market signal extraction and business opportunity synthesis.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Globe size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-gray-300">Live Market Data</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-gray-300">Profit Predictions</div>
                  </div>
                </div>
              </div>
            </UniformCard>
          </div>
          {/* Right Panel: ANALYSIS RESULTS */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading-terminal"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                >
                  <UniformCard
                    variant="glass"
                    size="sm"
                    className="min-h-[300px] sm:min-h-[380px] relative overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10"
                  >
                    {/* AI Animation Background */}
                    <AIAnalysisCanvas className="absolute inset-0 w-full h-full" />

                    {/* Loading Content Overlay */}
                    <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-[#0a0f25]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-white/10 max-w-2xl shadow-2xl"
                      >
                        <div className="w-20 h-20 relative mb-8 mx-auto">
                          <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
                          <div className="absolute inset-2 rounded-full border border-blue-500/50 animate-pulse" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="text-blue-500 animate-spin" size={32} />
                          </div>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-4 drop-shadow-lg transition-all duration-700">
                          {isDeepRecon ? (
                            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent animate-pulse">
                              Deep Reconnaissance Active
                            </span>
                          ) : (
                            loadingMessage
                          )}
                        </h2>

                        <div className="flex items-center justify-center gap-3 mb-6">
                           <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-500/20">
                             {isDeepRecon ? "Apify Swarm Engaged" : "Neural Cluster Active"}
                           </div>
                           <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                             Live Stream
                           </div>
                        </div>

                        <p className="text-slate-600 dark:text-gray-400 text-base font-medium uppercase tracking-wider mb-8 max-w-md drop-shadow-sm min-h-[1.5em] transition-all duration-700">
                          {loadingProgress < 20 ? `Initializing secure uplink to ${area.split(',')[0]}...` :
                            loadingProgress < 50 ? (isDeepRecon ? `Extracting deep market signals via Apify...` : `Gathering business intelligence data...`) :
                              loadingProgress < 75 ? `Processing market trends and gaps...` :
                                loadingProgress < 90 ? `Generating strategic recommendations...` :
                                  `Finalizing business opportunities...`}
                        </p>

                        <div className="w-full max-w-lg h-3 bg-slate-200 rounded-full overflow-hidden backdrop-blur-sm border border-slate-300 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${loadingProgress}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg relative overflow-hidden"
                            transition={{ duration: 0.5 }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </motion.div>
                        </div>
                        
                        <div className="mt-4 flex flex-col items-center gap-2">
                          <div className="text-sm font-black text-blue-600 dark:text-blue-400 tracking-widest">
                            {Math.round(loadingProgress)}% SYNCHRONIZED
                          </div>
                          
                          {/* ⚠️ STRATEGIC STABILITY WARNING */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 max-w-md backdrop-blur-xl animate-pulse"
                          >
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                               <AlertCircle className="text-amber-500" size={20} />
                            </div>
                            <div className="text-left">
                               <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Critical Neural Sync</p>
                               <p className="text-xs text-slate-600 dark:text-gray-400 font-medium leading-relaxed">
                                 Please <span className="text-amber-500 font-bold">do not refresh or navigate away</span> while the Intelligence Cluster is active. Interruption may disrupt the localized mapping process.
                               </p>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </UniformCard>
                </motion.div>
              ) : result && result.status === 'service_unavailable' ? (
                <motion.div
                  key="healing-terminal"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <UniformCard
                    variant="glass"
                    size="md"
                    className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.05)]"
                  >
                    <div className="w-16 h-16 mb-6 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <Activity size={32} className="text-orange-400 animate-pulse" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
                      AI Engine Warming Up
                    </h2>

                    <p className="text-base font-medium text-slate-600 dark:text-gray-400 leading-relaxed mb-8 max-w-md">
                      {result.message || "The AI engine is starting up. Please try again in a few seconds."}
                    </p>

                    <button
                      onClick={(e) => handleAnalyze(e as any)}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95"
                    >
                      🔄 Try Again Now
                    </button>

                    <p className="text-xs text-slate-400 dark:text-gray-600 pt-6 italic">
                      Both AI layers (Gemini + Pollinations) are active. Retrying usually works immediately.
                    </p>
                  </UniformCard>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="results-terminal"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Results Header */}
                  <UniformCard
                    variant="gradient"
                    size="md"
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl border-2 border-slate-200/50 dark:border-white/10"
                  >
                    <div className="space-y-4">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('dash_results_header')}</div>
                      <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {area}
                      </h2>
                      <p className="text-slate-600 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                        Found {Array.isArray(result.recommendations) ? result.recommendations.length : 0} {t('dash_strategic_opps')}
                        {result.cached && (
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-tighter rounded-full border border-blue-500/20">
                            Cached Analysis
                          </span>
                        )}
                        {result.using_profile_location && (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-tighter rounded-full border border-emerald-500/20">
                            Profile Location
                          </span>
                        )}
                      </p>
                    </div>
                  </UniformCard>

                  {/* Analysis Summary */}
                  <div className="grid lg:grid-cols-2 gap-4 items-stretch mb-8">
                    <UniformCard
                      title="Live Market Intelligence"
                      variant="glass"
                      size="md"
                      className="shadow-lg border-2 border-slate-200/50 dark:border-white/10 h-full flex flex-col"
                    >
                      <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex flex-wrap gap-2 mb-4 shrink-0">
                          {Array.isArray(result.analysis?.data_sources) && result.analysis.data_sources.map((source: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-200 dark:border-slate-700">
                              {source}
                            </span>
                          ))}
                        </div>
                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                          {renderFormattedText((() => {
                            const a = result.analysis;
                            if (!a) return "Market analysis in progress...";
                            if (typeof a === 'string') return a;
                            // Fallback chain for structured analysis objects
                            return a.executive_summary || a.market_overview || a.overview || 
                                   a.summary || a.raw_string || a.RAW_STRING || 
                                   (Object.keys(a).length > 0 ? JSON.stringify(a) : "Market analysis in progress...");
                          })())}
                        </div>
                      </div>
                    </UniformCard>
                    <UniformCard
                      title="Key Metrics"
                      variant="glass"
                      size="md"
                      className="shadow-lg border-2 border-slate-200/50 dark:border-white/10 h-full flex flex-col"
                    >
                      <div className="flex-grow flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                            <div className="flex justify-center mb-4">
                              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6" />
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1">Success Rate</div>
                            <div className="text-3xl lg:text-4xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-sm">{
                              (result?.analysis?.confidence_score) 
                                ? result.analysis.confidence_score 
                                : (loading ? "..." : "--%")
                            }</div>
                            <div className="mt-2 text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/40 uppercase">High Potential</div>
                          </div>

                          <div className="text-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all group">
                            <div className="flex justify-center mb-4">
                              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1">Market Gap</div>
                            <div className="text-2xl lg:text-3xl font-black text-blue-500 tracking-tighter drop-shadow-sm break-words line-clamp-2 min-h-[3rem] flex items-center justify-center leading-tight">
                                      {
                                  (result?.analysis?.market_gap_intensity) 
                                    ? result.analysis.market_gap_intensity 
                                    : (loading ? "Analyzing..." : "--")
                                }
                              </div>
                            <div className="mt-2 text-[10px] font-bold text-blue-600/60 dark:text-blue-400/40 uppercase">Unsaturated</div>
                          </div>
                        </div>
                      </div>
                    </UniformCard>
                  </div>

                  {/* Detailed Market Intelligence Sections */}
                  {result.analysis?.detailed_market_data && (
                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                      {/* Economic Indicators */}
                      <UniformCard
                        title="Economic Indicators"
                        variant="glass"
                        size="md"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="space-y-4">
                          {result.analysis.live_economic_indicators && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                                  <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">GDP Growth</div>
                                  <div className="text-lg font-black text-green-700 dark:text-green-300">{result.analysis.live_economic_indicators.gdp_growth}</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Investment</div>
                                  <div className="text-lg font-black text-blue-700 dark:text-blue-300">{result.analysis.live_economic_indicators.investment_inflow}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-white/5 rounded">
                                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Business Registrations</span>
                                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.analysis.live_economic_indicators.business_registrations}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-white/5 rounded">
                                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Consumer Confidence</span>
                                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.analysis.live_economic_indicators.consumer_confidence}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-white/5 rounded">
                                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Digital Adoption</span>
                                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{result.analysis.live_economic_indicators.digital_adoption}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </UniformCard>

                      {/* Market Trends */}
                      <UniformCard
                        title="Market Trends"
                        variant="glass"
                        size="md"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="space-y-4">
                          {result.analysis.market_trends_analysis?.emerging_sectors && (
                            <>
                              <div className="space-y-3">
                                {result.analysis.market_trends_analysis.emerging_sectors.slice(0, 3).map((sector: any, i: number) => (
                                  <div key={i} className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{sector.sector}</h4>
                                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded">{sector.growth_rate}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-600 dark:text-gray-400">Market Size: {sector.market_size}</span>
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">{sector.opportunity_level}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                                <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-2">Consumer Behavior</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400">Online</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{result.analysis.market_trends_analysis.consumer_behavior?.online_adoption}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400">Mobile</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">{result.analysis.market_trends_analysis.consumer_behavior?.mobile_first}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </UniformCard>

                      {/* Investment Climate */}
                      <UniformCard
                        title="Investment Climate"
                        variant="glass"
                        size="md"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="space-y-4">
                          {result.analysis.investment_climate && (
                            <>
                              <div className="space-y-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Funding Landscape</div>

                                  <div className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                    {result.analysis.investment_climate.funding_landscape?.angel_investors} • {result.analysis.investment_climate.funding_landscape?.vc_presence} VC Presence
                                  </div>
                                </div>

                                {result.analysis.investment_climate.investment_sectors?.slice(0, 2).map((sector: any, i: number) => (
                                  <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{sector.sector}</span>
                                      <span className="text-xs font-bold text-green-600 dark:text-green-400">{sector.funding_available}</span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{sector.investor_interest} Interest</div>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                                <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-2">Success Metrics</div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400">Survival Rate</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">{result.analysis.investment_climate.success_metrics?.business_survival_rate}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-gray-400">Avg. Breakeven</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{result.analysis.investment_climate.success_metrics?.average_breakeven}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </UniformCard>
                    </div>
                  )}

                  {/* Competitive Landscape & Consumer Insights */}
                  {result.analysis?.competitive_landscape && (
                    <div className="grid lg:grid-cols-2 gap-4 mb-8">
                      {/* Competitive Landscape */}
                      <UniformCard
                        title="Competitive Landscape"
                        variant="glass"
                        size="md"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                              <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Competition</div>
                              <div className="text-lg font-black text-red-700 dark:text-red-300">{result.analysis.competitive_landscape.competition_intensity?.overall_level}</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                              <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Entry Barrier</div>
                              <div className="text-lg font-black text-green-700 dark:text-green-300">{result.analysis.competitive_landscape.competition_intensity?.new_entrant_threat}</div>
                            </div>
                          </div>

                          {result.analysis.competitive_landscape.market_leaders && (
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Market Leaders</div>
                              {result.analysis.competitive_landscape.market_leaders.slice(0, 2).map((leader: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{leader.category}</span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{leader.market_share}</span>
                                  </div>
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {leader.differentiation_opportunity} Differentiation Opportunity
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {result.analysis.competitive_landscape.market_gaps && (
                            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                              <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-2">Market Gaps</div>
                              <div className="flex flex-wrap gap-1">
                                {result.analysis.competitive_landscape.market_gaps.slice(0, 3).map((gap: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded border border-emerald-200 dark:border-emerald-500/30">
                                    {gap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </UniformCard>

                      {/* Consumer Insights */}
                      <UniformCard
                        title="Consumer Insights"
                        variant="glass"
                        size="md"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="space-y-4">
                          {result.analysis.consumer_insights && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/20">
                                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Median Age</div>
                                  <div className="text-lg font-black text-purple-700 dark:text-purple-300">{result.analysis.consumer_insights.demographics?.median_age}</div>
                                </div>
                                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Income</div>
                                  <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">{result.analysis.consumer_insights.demographics?.household_income}</div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Spending Patterns</div>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-white/5 rounded">
                                    <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Online Spending</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{result.analysis.consumer_insights.spending_patterns?.online_spending}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-white/5 rounded">
                                    <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Local Preference</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.analysis.consumer_insights.spending_patterns?.local_business_preference}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-white/5 rounded">
                                    <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Premium Willingness</span>
                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.analysis.consumer_insights.spending_patterns?.premium_willingness}</span>
                                  </div>
                                </div>
                              </div>

                              {result.analysis.consumer_insights.behavior_trends && (
                                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                                  <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-2">Behavior Trends</div>
                                  <div className="space-y-2">
                                    {result.analysis.consumer_insights.behavior_trends.slice(0, 2).map((trend: any, i: number) => (
                                      <div key={i} className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 rounded border border-blue-200 dark:border-blue-500/20">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{trend.trend}</span>
                                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{trend.adoption_rate}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </UniformCard>
                    </div>
                  )}

                  {/* Business Opportunities */}
                  <div className="space-y-6">
                    {/* AI Source Attribution */}
                    <AISourceIndicator
                      aiSource={result.ai_source}
                      dataSources={result.analysis?.data_sources}
                      analysisTime="Just Now"
                      area={area}
                      className="mb-6"
                    />

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                        <Sparkles className="text-emerald-500 animate-pulse" size={24} />
                        Live Strategic Intelligence
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 text-lg font-medium">
                        {result.recommendations?.length || 0} High-Fidelity Opportunities synthesized for <span className="text-emerald-500 italic uppercase">{area}</span>
                      </p>
                    </div>

                    <div className="space-y-6">
                      {Array.isArray(result.recommendations) && result.recommendations.length > 0 ? (
                        <>
                          {(showAllRecommendations ? result.recommendations : result.recommendations.slice(0, 2)).map((rec: any, idx: number) => (
                            <EnhancedRecommendationCard
                              key={idx}
                              recommendation={{
                                business_name: rec.title || rec.name || rec.business_title || rec.business_name || rec.idea || 'Analyzing...',
                                description: rec.description || rec.thesis || rec.summary || rec.explanation || 'Detailed tactical breakdown in progress...',
                                market_gap: rec.market_gap || rec.gap || 'Analyzing...',
                                target_audience: rec.target_audience || rec.audience || 'Local Market',
                                investment_range: rec.investment || rec.investment_range || rec.funding_required || '--',
                                roi_potential: rec.roi_percentage ? (String(rec.roi_percentage).includes('%') ? rec.roi_percentage : `${rec.roi_percentage}% annual returns`) : '--%',
                                implementation_difficulty: rec.implementation_difficulty || rec.difficulty || rec.complexity || 'Calculating...',
                                market_size: rec.market_size || 'Local Market',
                                ideal_neighborhood: rec.ideal_neighborhood || rec.neighborhood || '',
                                potential_revenue: rec.potential_revenue || '--',
                                cac: rec.cac || '--',
                                competitive_advantage: rec.competitive_advantage || rec.advantage || 'Strategic positioning',
                                revenue_model: rec.revenue_model || rec.business_model || 'Direct Revenue',
                                key_success_factors: Array.isArray(rec.key_success_factors) ? rec.key_success_factors.join(", ") : (rec.success_factors || rec.critical_factors || 'Market penetration'),
                                category: rec.category || 'Industry Opportunity',
                                ai_source: result.ai_source || 'Multi-AI Synthesis',
                                six_month_plan: rec.six_month_plan || []
                              }}
                              index={idx}
                              onSave={(recommendation) => {
                                // Create the correct data structure for the API
                                const businessData = {
                                  user_email: session?.user?.email,
                                  business_name: recommendation.business_name,
                                  category: recommendation.category || 'Business Opportunity',
                                  location: area,
                                  details: recommendation
                                };
                                handleSaveBusiness(businessData);
                              }}
                              onViewDetails={(recommendation) => {
                                const target = (recommendation as any)._target || '/business-details';
                                const bizObj = {
                                  business: {
                                    title: recommendation.business_name,
                                    description: recommendation.description,
                                    category: recommendation.category,
                                    funding_required: recommendation.investment_range,
                                    estimated_revenue: recommendation.potential_revenue,
                                    roi_percentage: recommendation.roi_potential.replace(/\D/g, ''),
                                    market_size: recommendation.market_size,
                                    competition_level: recommendation.implementation_difficulty,
                                    payback_period: (rec as any).payback_period || (rec as any).be_period || 'Analyzing...',
                                    be_period: (rec as any).be_period || 'Analyzing...',
                                    m1_traffic: (rec as any).m1_traffic || 'Analyzing...',
                                    retention_rate: (rec as any).retention_rate || 'Analyzing...',
                                    demand_index: (rec as any).demand_index || 0,
                                    key_success_factors: (recommendation.key_success_factors || '').split(",").map(s => s.trim()),
                                    six_month_plan: recommendation.six_month_plan || []
                                  },
                                  area: area,
                                  analysis: result.analysis
                                };
                                sessionStorage.setItem('selected_business', JSON.stringify(bizObj));
                                if (target === '/roadmap') {
                                  localStorage.setItem('currentBusinessAnalysis', JSON.stringify(bizObj));
                                }
                                router.push(target);
                              }}
                              saving={savingBusiness === (rec.title || rec.name || rec.business_title || rec.business_name)}
                            />
                          ))}

                          {result.recommendations.length > 2 && (
                            <div className="flex justify-center pt-4">
                              <button
                                onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                                className="group relative px-8 py-3 bg-white dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all active:scale-[0.98] flex items-center gap-3 overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="text-sm font-black text-slate-600 dark:text-gray-400 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">
                                  {showAllRecommendations ? (
                                    <>Show Condensed View</>
                                  ) : (
                                    <>Expand Intelligence ({result.recommendations.length - 2} More)</>
                                  )}
                                </span>
                                <ChevronRight size={18} className={`text-slate-400 group-hover:text-emerald-500 transition-all ${showAllRecommendations ? 'rotate-[-90deg]' : 'rotate-[90deg]'}`} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-slate-500 dark:text-gray-400 mb-4">
                            No recommendations available
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* READY TO SEARCH - Idle State with AI Animation */
                <motion.div
                  key="ready-to-search"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  {/* AI Analysis Animation */}
                  <UniformCard
                    variant="glass"
                    size="sm"
                    className="min-h-[300px] sm:min-h-[380px] relative overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10"
                  >
                    <AIAnalysisCanvas className="absolute inset-0 w-full h-full" />

                    {/* Overlay Content */}
                    <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/90 dark:bg-[#0a0f25]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-white/10 max-w-2xl shadow-2xl"
                      >
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3 drop-shadow-lg">
                          AI Market Analysis
                        </h2>

                        <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base font-medium mb-6 leading-relaxed drop-shadow-sm">
                          Enter a city or region to discover profitable business opportunities.
                          Our AI analyzes market data, competition, and local trends in real-time.
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 shrink-0 bg-blue-500 rounded-full animate-pulse" />
                            <span>Live Market Data</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 shrink-0 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                            <span>AI Predictions</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-500 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 shrink-0 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                            <span>Smart Insights</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </UniformCard>

                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <UniformCard
                      size="sm"
                      variant="glass"
                      className="text-center p-3 shadow-lg border border-slate-200/50 dark:border-white/10"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2 mx-auto">
                        <Globe className="text-blue-500" size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Market Analysis</h3>
                      <p className="text-[11px] text-slate-600 dark:text-gray-400">Real-time market analytics</p>
                    </UniformCard>

                    <UniformCard
                      size="sm"
                      variant="glass"
                      className="text-center p-3 shadow-lg border border-slate-200/50 dark:border-white/10"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-2 mx-auto">
                        <TrendingUp className="text-emerald-500" size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Profit Predictions</h3>
                      <p className="text-[11px] text-slate-600 dark:text-gray-400">AI ROI forecasting</p>
                    </UniformCard>

                    <UniformCard
                      size="sm"
                      variant="glass"
                      className="text-center p-3 shadow-lg border border-slate-200/50 dark:border-white/10 sm:col-span-2 lg:col-span-1"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2 mx-auto">
                        <Lightbulb className="text-purple-500" size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Smart Insights</h3>
                      <p className="text-[11px] text-slate-600 dark:text-gray-400">Business recommendations</p>
                    </UniformCard>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        paymentData={paymentDetails}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#020617] relative overflow-hidden">
        <div className="w-20 h-20 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
      </div>
    }>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </Suspense>
  );
}