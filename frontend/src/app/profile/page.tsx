"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { 
  User, Phone, FileText, Loader2, Save, CheckCircle2, ArrowLeft, ArrowRight,
  ShieldCheck, Crown, Zap, Star, Settings, Calendar, 
  MapPin, Globe, Award, BarChart3, Activity, Clock, Building2, 
  Target, Sparkles, ChevronRight, ChevronDown, Edit3, Camera,
  CreditCard, X, RefreshCw, ChevronUp, Bookmark, Trash2, Key, Archive, Cpu
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useNotifications } from "@/context/NotificationContext";
import { getPricingForCountry, formatPrice } from "@/utils/locationPricing";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getApiUrl } from "@/config/api";
import InvoiceModal from "../../components/InvoiceModal";

const getProfessionalPlanName = (name: string): string => {
  const map: { [key: string]: string } = {
    'free': 'Explorer',
    'starter': 'Starter',
    'professional': 'Growth Architect',
    'growth': 'Business Accelerator',
    'enterprise': 'Territorial Dominance'
  };
  
  const normalized = name.toLowerCase().replace(' monthly', '').replace(' yearly', '').trim();
  return map[normalized] || name;
};

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center transition-colors duration-500">
         <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <ProtectedRoute>
        <ProfilePageContent />
      </ProtectedRoute>
    </Suspense>
  );
}

function ProfilePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { plan, theme, planFeatures, setPlan } = useSubscription();
  const { userLocation, addNotification, refreshLocation } = useNotifications();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    image_url: "",
    company: "",
    location: "",
    website: "",
    industry: "",
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [joinDate, setJoinDate] = useState<Date | null>(null);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as 'overview' | 'profile' | 'billing' | 'vault' || 'profile';
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'billing' | 'vault'>(initialTab);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // currentTime removed - use Date() inline to avoid 1s re-render interval
  const [isOnline, setIsOnline] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [detectedLocation, setDetectedLocation] = useState<any>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [savedBusinesses, setSavedBusinesses] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback timeout to ensure form is always accessible
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasLoaded) {
        setHasLoaded(true);
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [hasLoaded]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addNotification({
        type: 'system',
        title: 'Buffer Overflow',
        message: 'Image payload exceeds 2MB limit. Please provide a high-efficiency compressed visual.',
        priority: 'medium'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, image_url: base64String }));
      
      const apiUrl = getApiUrl();
      try {
        await fetch(`${apiUrl}/api/users/${session?.user?.email}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            image_url: base64String
          }),
        });
        
        addNotification({
          type: 'system',
          title: 'Biometric Sync',
          message: 'Your visual identifier has been updated across the neural network.',
          priority: 'low'
        });
      } catch (error) {
        console.error("Failed to sync visual identifier:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatCurrency = (value: string | number, area?: string) => {
    if (!value) return '';
    const str = String(value);
    const areaLower = (area || "").toLowerCase();
    
    const indianKeywords = [
        "india", "bhopal", "mumbai", "delhi", "bangalore", "chennai", "hyderabad", 
        "pune", "ahmedabad", "surat", "jaipur", "lucknow", "kanpur", "nagpur", 
        "indore", "thane", "berasia", "mp", "maharashtra", "karnataka", "tamil nadu", 
        "gujarat", "rajasthan", "up", "uttar pradesh", "haryana", "punjab", 
        "telangana", "andhra", "bengal", "kerala", "assam", "bihar", "odisha"
    ];
    
    // Check if definitely Indian (has L or Cr, or in an Indian area)
    const isIndian = str.includes('L') || str.includes('Cr') || indianKeywords.some(k => areaLower.includes(k));
    
    if (isIndian) {
      if (str.includes('$')) return str.replace(/\$/g, '₹');
      if (!str.includes('₹')) return `₹${str}`;
    }
    
    return str;
  };
  
  // Tab handling from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'billing' || tab === 'profile' || tab === 'overview' || tab === 'vault') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Fetch vault data when tab becomes active
  useEffect(() => {
    if (activeTab === 'vault') {
      // If we already have data (from cache), fetch silently in background
      fetchSavedBusinesses(savedBusinesses.length > 0);
    }
  }, [activeTab]);

  const fetchPayments = async () => {
    if (!session?.user?.email) return;
    setLoadingPayments(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/${session.user.email}/profile`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.recent_payments || []);
        if (data.subscription) setSubscriptionDetails(data.subscription);
        
        addNotification({
          type: 'system',
          title: 'History Updated',
          message: `Fetched ${data.recent_payments?.length || 0} transaction records`,
          priority: 'low'
        });
      }
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchSavedBusinesses = async (silent = false) => {
    if (!session?.user?.email) return;
    
    // Only show loader if we don't have cached data or if requested
    if (!silent && savedBusinesses.length === 0) {
      setLoadingVault(true);
    }
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/saved-businesses?email=${encodeURIComponent(session.user.email)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSavedBusinesses(data || []);
        
        // Cache result
        if (typeof window !== 'undefined' && data) {
          localStorage.setItem(`vault_cache_${session.user.email}`, JSON.stringify(data));
        }
      } else {
        setSavedBusinesses([]);
      }
    } catch (error) {
      console.error('Failed to fetch vault:', error);
    } finally {
      setLoadingVault(false);
    }
  };

  // Immediate cache restoration for ultra-fast load
  useEffect(() => {
    if (session?.user?.email && typeof window !== 'undefined') {
      const cached = localStorage.getItem(`vault_cache_${session.user.email}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (Array.isArray(data)) {
            setSavedBusinesses(data);
            if (activeTab === 'vault') fetchSavedBusinesses(true);
          }
        } catch (e) {}
      }
    }
  }, [session?.user?.email]);

  const deleteSavedBusiness = async (id: number) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/saved-businesses/${id}?user_email=${session?.user?.email}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSavedBusinesses(prev => prev.filter(b => b.id !== id));
        addNotification({
          type: 'system',
          title: 'Removed from Vault',
          message: 'The business opportunity has been permanently deleted.',
          priority: 'low'
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
  
  // Check for payment success from URL params (one-time animation trigger)
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const paymentId = searchParams.get('payment_id');
    
    if (paymentSuccess === 'true' && paymentId) {
      console.log('🌊 Payment success detected from URL! Animation will be handled by PaymentSuccessModal');
      
      // Clear URL params to prevent re-triggering
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]payment_success=true/, '').replace(/[?&]payment_id=[^&]*/, '');
      window.history.replaceState({}, '', newUrl);
      
      // Show success notification
      addNotification({
        type: 'system',
        title: '💰 Payment Successful!',
        message: 'Your payment has been processed successfully. Plan updated!',
        priority: 'high'
      });
      
      // Force refresh data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [searchParams]);

  // Real-time payment detection WITHOUT animation (silent updates only)
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const checkForUpdates = async () => {
      if (!session?.user?.email) return;
      
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/users/${session.user.email}/profile`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.recent_payments && Array.isArray(data.recent_payments)) {
            // SILENT UPDATE ONLY - NO ANIMATION
            setPayments(data.recent_payments);
            setSubscriptionDetails(data.subscription);
            
            // Only update plan state from a VALID non-free subscription
            if (data.subscription && data.subscription.plan_name && data.subscription.plan_name !== 'free') {
              const rawPlan = data.subscription.plan_name.toLowerCase();
              const rawDisplay = (data.subscription.plan_display_name || '').toLowerCase();
              
              let mappedPlan: any = 'free';
              if (rawPlan.includes('enterprise') || rawDisplay.includes('enterprise') || rawDisplay.includes('dominance') ||
                  rawPlan.includes('growth') || rawDisplay.includes('growth') || rawDisplay.includes('accelerator') ||
                  rawPlan.includes('professional') || rawPlan.includes('pro') || rawDisplay.includes('professional')) {
                mappedPlan = 'professional';
              } else if (rawPlan.includes('starter') || rawDisplay.includes('starter') || rawDisplay.includes('venture')) {
                mappedPlan = 'starter';
              }
              
              // Only upgrade — never silently downgrade from a paid plan to free
              const planHierarchy: Record<string, number> = { free: 0, starter: 1, professional: 2 };
              if (mappedPlan !== 'free' && (planHierarchy[mappedPlan] ?? 0) > (planHierarchy[plan] ?? 0)) {
                setPlan(mappedPlan);
              } else if (plan === 'free' && mappedPlan !== 'free') {
                setPlan(mappedPlan);
              }
            }
          }
        }
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    };
    
    if (session?.user?.email) {
      checkForUpdates();
      // Poll every 60 seconds
      pollInterval = setInterval(checkForUpdates, 60000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [session?.user?.email, plan, setPlan]);

  // Get location-based pricing
  const locationPricing = getPricingForCountry(userLocation?.country || 'Global');

  const planIcons: Record<string, any> = {
    free: Star,
    starter: Zap,
    professional: Zap
  };

  const PlanIcon = planIcons[plan];
  // Removed: 1s clock interval was causing constant re-renders on entire profile page

  // Real-time connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Removed: auto-save was firing API calls every 2s on any form change

  // Removed: duplicate silent refresh interval (already handled by main polling interval below)
  // Sync global location to local state
  useEffect(() => {
    if (userLocation) {
      setDetectedLocation(userLocation);
    }
  }, [userLocation]);

  // Auto-detect location button handler (Uses global refresh)
  const handleAutoDetectLocation = async () => {
    setLocationDetecting(true);
    try {
      refreshLocation(); // Use global refresh from NotificationContext
      setMessage('Refreshing global intelligence node...');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Location refresh failed:', error);
    } finally {
      setLocationDetecting(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // INSTANT CACHE LOAD (Independent of API Status)
  useEffect(() => {
    const email = session?.user?.email?.toLowerCase().trim();
    if (email && !hasLoaded) {
      const cachedProfile = localStorage.getItem(`profile_data_${email}`);
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          setFormData(parsed.formData);
          setAnalysisCount(parsed.analysisCount);
          setSubscriptionDetails(parsed.subscriptionDetails);
          setPayments(parsed.payments || []);
          setAnalysisHistory(parsed.analysisHistory || []);
          setJoinDate(parsed.joinDate ? new Date(parsed.joinDate) : null);
          setHasLoaded(true);
          setLoading(false);
        } catch (e) {
          // Cache parse error - will load fresh from API
        }
      }
    }
  }, [session?.user?.email, hasLoaded]);
  useEffect(() => {
    const fetchProfile = async (silent = false) => {
      if (!session?.user?.email) return;
      
      const email = session.user.email.toLowerCase().trim();
      const apiUrl = getApiUrl();

      // Only show full loading screen on the very first load if no cache
      if (!silent && !hasLoaded && !localStorage.getItem(`profile_data_${email}`)) {
        setLoading(true);
      }

      try {
        // 2. BACKGROUND USER SYNC (Don't wait for this to fetch data)
        const syncPromise = fetch(`${apiUrl}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: session?.user?.name || "",
            image_url: session?.user?.image || ""
          }),
        }).catch(err => console.warn('Background sync failed:', err));

        // 3. PARALLEL DATA FETCHING
        const [userRes, historyRes, profileRes] = await Promise.all([
          fetch(`${apiUrl}/api/users/${email}`),
          fetch(`${apiUrl}/api/history/${email}`),
          fetch(`${apiUrl}/api/users/${email}/profile`)
        ]);

        let updatedFormData = formData;
        let updatedAnalysisCount = analysisCount;
        let updatedSubscriptionDetails = subscriptionDetails;
        let updatedPayments = payments;
        let updatedJoinDate = joinDate;

        if (userRes.ok) {
          const data = await userRes.json();
          updatedFormData = {
            name: data.name || session?.user?.name || "",
            bio: data.bio || "",
            phone: data.phone || "",
            image_url: data.image_url || session?.user?.image || "",
            company: data.company || "",
            location: data.location || "",
            website: data.website || "",
            industry: data.industry || "",
          };
          setFormData(updatedFormData);
          updatedJoinDate = data.created_at ? new Date(data.created_at) : null;
          setJoinDate(updatedJoinDate);
        }

        let historyData = [];
        if (historyRes.ok) {
          historyData = await historyRes.json();
          setAnalysisHistory(historyData || []);
          updatedAnalysisCount = historyData.length;
          setAnalysisCount(updatedAnalysisCount);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          
          updatedSubscriptionDetails = profileData.subscription;
          updatedPayments = profileData.recent_payments || [];
          setSubscriptionDetails(updatedSubscriptionDetails);
          setPayments(updatedPayments);
        }

        // 4. PERSIST TO CACHE FOR NEXT LOAD
        localStorage.setItem(`profile_data_${email}`, JSON.stringify({
          formData: updatedFormData,
          analysisCount: updatedAnalysisCount,
          subscriptionDetails: updatedSubscriptionDetails,
          payments: updatedPayments,
          analysisHistory: historyData,
          joinDate: updatedJoinDate
        }));

        setLastUpdated(new Date());
        setHasLoaded(true);
      } catch (error: any) {
        console.error("Optimized fetch failed:", error);
        if (!silent && !hasLoaded) setMessage("Operating in Offline Mode");
        setHasLoaded(true); 
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      // Always fetch fresh data on mount to ensure synchronization
      // But only show full loader if we have NO cache yet
      const isFirstLoad = !hasLoaded;
      fetchProfile(isFirstLoad ? false : true);
    }
  }, [session?.user?.email, status]);
  const handleSubmit = async (e: React.FormEvent, silent = false) => {
    e.preventDefault();
    if (!silent) setSaving(true);
    if (!silent) setMessage("");

    try {
      const apiUrl = getApiUrl();
      
      // Enhanced validation
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      
      if (formData.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      
      if (formData.phone && formData.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }
      
      if (formData.website && formData.website.trim() && !formData.website.match(/^https?:\/\/.+/)) {
        const websiteWithProtocol = `https://${formData.website.trim()}`;
        setFormData({ ...formData, website: websiteWithProtocol });
      }

      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        image_url: formData.image_url || session?.user?.image || "",
        company: formData.company.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        industry: formData.industry.trim()
      };

      const email = session?.user?.email?.toLowerCase().trim() || "";
      const response = await fetch(`${apiUrl}/api/users/${email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setLastUpdated(new Date());
        if (!silent) {
          setMessage("Profile updated successfully!");
          setTimeout(() => setMessage(""), 3000);
          
          // Add simple notification
          addNotification({
            type: 'system',
            title: 'Profile Updated',
            message: 'Your profile has been successfully updated with the latest information.',
            priority: 'low',
            actionUrl: '/profile',
            metadata: {
              profile_completion: completionPercentage(),
              updated_at: new Date().toISOString()
            }
          });
        }
        
        // Update form data with server response to ensure consistency
        setFormData({
          name: updatedUser.name || "",
          bio: updatedUser.bio || "",
          phone: updatedUser.phone || "",
          image_url: updatedUser.image_url || session?.user?.image || "",
          company: updatedUser.company || "",
          location: updatedUser.location || "",
          website: updatedUser.website || "",
          industry: updatedUser.industry || "",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Failed to update profile", error);
      if (!silent) {
        setMessage(error.message || "Failed to update profile. Please try again.");
        setTimeout(() => setMessage(""), 5000);
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const downloadTransactions = () => {
    if (!payments.length) return;
    
    const headers = ["Invoice ID", "Date", "Plan", "Billing Cycle", "Amount", "Currency", "Status", "Payment Gateway"];
    const csvRows = [
      headers.join(","),
      ...payments.map(p => [
        p.dodo_payment_id || p.id,
        new Date(p.payment_date).toLocaleDateString(),
        p.plan_name,
        p.billing_cycle,
        p.amount,
        p.currency,
        p.status
      ].join(","))
    ];
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `StarterScope_Transactions_${session?.user?.email}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      type: 'system',
      title: 'Download Complete',
      message: 'Your transaction history has been exported successfully.',
      priority: 'low',
      actionUrl: '/profile?tab=billing'
    });
  };
  // Enhanced loading guard: Only show full-screen loader on initial mount
  // Subsequent session revalidations or silent refreshes won't interrupt the UI
  if ((status === "loading" || loading) && !hasLoaded && status !== "authenticated") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            {/* Elegant loading rings */}
            <div className="relative w-20 h-20 mx-auto">
              <motion.div 
                className="absolute inset-0 border-4 border-t-transparent rounded-full"
                style={{ borderTopColor: theme.primary, borderRightColor: `${theme.primary}30`, borderBottomColor: `${theme.primary}30`, borderLeftColor: `${theme.primary}30` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-2 border-r-transparent rounded-full"
                style={{ borderTopColor: `${theme.secondary}40`, borderRightColor: 'transparent', borderBottomColor: `${theme.secondary}40`, borderLeftColor: `${theme.secondary}40` }}
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <PlanIcon size={32} style={{ color: theme.primary }} />
              </motion.div>
            </div>
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic"
          >
            {t('prof_loading')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 dark:text-gray-400 font-medium"
          >
            Preparing your {planFeatures.planName} experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const completionPercentage = () => {
    const fields = [
      formData.name, 
      formData.phone, 
      formData.company, 
      formData.location, 
      formData.bio, 
      formData.industry,
      formData.website
    ];
    const completed = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative transition-colors duration-500 pt-20 sm:pt-28 lg:pt-36">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 noise-bg opacity-10" />
        <div className="absolute inset-0 opacity-20">
          {/* Elegant floating orbs instead of particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-xl"
              style={{
                background: `radial-gradient(circle, ${theme.primary}40, transparent)`,
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 responsive-container py-8 lg:py-12">
        {/* Header - More Compact & Premium */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 lg:mb-6"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all group backdrop-blur-sm text-xs lg:text-sm italic shadow-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-black">{t('nav_dashboard')}</span>
            </button>

            {/* Real-time Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-sm shadow-sm">
              <motion.div
                animate={{
                  scale: isOnline ? [1, 1.2, 1] : 1,
                  opacity: isOnline ? [0.7, 1, 0.7] : 0.5
                }}
                transition={{
                  duration: 2,
                  repeat: isOnline ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">
               {isOnline ? 'Network Live' : 'Interface Offline'}
              </span>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 lg:gap-4 w-full sm:w-auto justify-center sm:justify-end"
          >
            <div 
              className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] flex items-center gap-2 lg:gap-3 backdrop-blur-md min-w-0"
              style={{ 
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}40`,
                color: theme.primary,
                boxShadow: `0 8px 32px ${theme.primary}10`
              }}
            >
              <PlanIcon size={14} className="lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="truncate">{planFeatures.planName}</span>
              <div 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
          </motion.div>
        </motion.div>
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Sidebar - Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 order-1 lg:order-1"
          >
            <div 
              className="glass-card p-6 lg:p-8 text-center relative overflow-hidden bg-white/80 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 shadow-xl"
              style={{ 
                borderColor: `${theme.primary}20`,
                background: `linear-gradient(135deg, ${theme.primary}08, transparent)`
              }}
            >
              {/* Profile Image with Plan-based Animation */}
              <div className="relative mb-4 lg:mb-6">
                {/* Elegant pulsing ring instead of spinning gradient */}
                <motion.div 
                  className="absolute -inset-3 lg:-inset-4 rounded-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary}40, ${theme.secondary}40, ${theme.primary}40)`,
                    filter: 'blur(8px)'
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Secondary ring for depth */}
                <motion.div 
                  className="absolute -inset-2 lg:-inset-3 rounded-full border-2 opacity-30"
                  style={{ borderColor: theme.primary }}
                  animate={{
                    scale: [1.05, 0.95, 1.05],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img 
                    src={formData.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || session?.user?.name || 'User')}&background=${theme.primary.slice(1)}&color=ffffff&size=200&bold=true`} 
                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white/20 shadow-2xl object-cover mx-auto relative z-10 group-hover:opacity-60 transition-all duration-500"
                    alt="Profile"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Camera className="text-white w-8 h-8 lg:w-10 lg:h-10" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 p-2 lg:p-3 rounded-full shadow-xl border-2 lg:border-4 border-white dark:border-slate-800"
                    style={{ backgroundColor: theme.primary }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: [
                        `0 0 20px ${theme.primary}40`,
                        `0 0 30px ${theme.primary}60`,
                        `0 0 20px ${theme.primary}40`
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <PlanIcon size={16} className="lg:w-5 lg:h-5 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* User Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">
                  {formData.name || session?.user?.name || 'Welcome'}
                </h1>
                <p className="text-slate-500 dark:text-gray-400 text-xs lg:text-sm mb-3 lg:mb-4 break-all px-2 font-medium">{session?.user?.email}</p>
                
                {formData.company && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-gray-300 mb-2 font-bold"
                  >
                    <Building2 size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span className="truncate px-2 italic">{formData.company}</span>
                  </motion.div>
                )}
                
                {(formData.location || userLocation?.country !== 'Unknown') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-gray-300 mb-2 font-bold"
                  >
                    <MapPin size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span className="truncate px-2 italic">{formData.location || `${userLocation?.city}, ${userLocation?.country}`}</span>
                  </motion.div>
                )}

                {joinDate && (
                  <div className="flex items-center justify-center gap-2 text-xs lg:text-sm text-slate-500 dark:text-gray-400 mb-3 lg:mb-4 font-black italic uppercase tracking-widest">
                    <Calendar size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span>Member since {joinDate.toLocaleDateString()}</span>
                  </div>
                )}
              </motion.div>
              {/* Profile Completion */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4 lg:mb-6"
              >
                <div className="flex items-center justify-between mb-2 font-black italic">
                  <span className="text-xs lg:text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-300">Profile Completion</span>
                  <span className="text-xs lg:text-sm font-black" style={{ color: theme.primary }}>
                    {completionPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2 overflow-hidden">
                  <motion.div 
                    className="h-1.5 lg:h-2 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage()}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6"
              >
                <div className="text-center p-3 lg:p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-300 dark:border-white/10 shadow-sm">
                  <motion.div 
                    className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 italic tracking-tighter"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", bounce: 0.5 }}
                  >
                    {analysisCount}
                  </motion.div>
                  <div className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Analyses</div>
                </div>
                <div className="text-center p-3 lg:p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-300 dark:border-white/10 shadow-sm">
                  <motion.div 
                    className="text-2xl lg:text-3xl font-black mb-1 italic tracking-tighter"
                    style={{ color: theme.primary }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring", bounce: 0.5 }}
                  >
                    {planFeatures.maxAnalyses === -1 ? '∞' : planFeatures.maxAnalyses}
                  </motion.div>
                  <div className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Limit</div>
                </div>
              </motion.div>

              {/* Upgrade CTA for Free Users */}
              {plan === 'free' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Link 
                    href="/acquisition-tiers"
                    className="block w-full py-3 lg:py-4 px-4 lg:px-6 rounded-xl font-bold text-xs lg:text-sm transition-all hover:scale-105 group relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      color: 'white'
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles size={14} className="lg:w-4 lg:h-4" />
                      <span>Upgrade Plan</span>
                      <ChevronRight size={14} className="lg:w-4 lg:h-4" />
                    </span>
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
          {/* Right Content - Tabs */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 order-2 lg:order-2"
          >
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 lg:mb-8 p-1.5 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-300 dark:border-white/10 backdrop-blur-sm shadow-md">
              {[
                { id: 'overview', label: 'NETWORK', icon: BarChart3 },
                { id: 'profile', label: 'PROFILE', icon: User },
                { id: 'vault', label: 'VAULT', icon: Bookmark },
                { id: 'billing', label: 'BILLING', icon: Crown }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-black text-xs sm:text-sm transition-all italic tracking-tight ${
                    activeTab === tab.id
                      ? 'text-slate-900 dark:text-white shadow-lg'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? `${theme.primary}20` : 'transparent',
                    border: activeTab === tab.id ? `1px solid ${theme.primary}40` : '1px solid transparent'
                  }}
                >
                  <tab.icon size={16} className="sm:inline hidden" />
                  <tab.icon size={14} className="sm:hidden" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                   key="overview"
                   variants={tabVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="space-y-6"
                 >
                   {/* Elite Founder Protocol - High Engagement Dashboard */}
                   <motion.div 
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="glass-card p-10 bg-gradient-to-br from-white dark:from-slate-900/40 via-white dark:via-slate-900/95 to-white/95 dark:to-slate-900 overflow-hidden relative shadow-2xl"
                     style={{ borderColor: `${theme.primary}20` }}
                   >
                     <div 
                       className="absolute top-0 right-0 w-[400px] h-[400px] blur-[120px] rounded-full -mr-48 -mt-48 transition-colors duration-1000" 
                       style={{ backgroundColor: `${theme.primary}10` }}
                     />
                    
                    <div className="relative z-10">
                      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
                        {/* Interactive Progress Ring */}
                        <div className="relative shrink-0 mx-auto lg:mx-0">
                          <svg className="w-32 h-32 md:w-48 md:h-48 transform -rotate-90">
                            <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900/5 dark:text-white/5" />
                            <motion.circle
                              cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent"
                              strokeDasharray="264%"
                               initial={{ strokeDashoffset: "264%" }}
                               animate={{ strokeDashoffset: `${264 - (264 * completionPercentage()) / 100}%` }}
                               transition={{ duration: 2, ease: "easeOut" }}
                               style={{ color: theme.primary }}
                               className="drop-shadow-[0_0_15px_rgba(var(--glow-color),0.5)]"
                             />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">{completionPercentage()}%</span>
                             <span 
                               className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mt-0.5 md:mt-1"
                               style={{ color: theme.primary }}
                             >Readiness</span>
                           </div>
                        </div>

                        <div className="flex-1 space-y-10 text-center lg:text-left">
                          <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-tight">Profile Summary</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed max-w-xl italic">
                              Complete your profile to get the most out of our AI business tools and personalized market insights.
                            </p>
                          </div>

                          {/* Status Badges - High Engagement */}
                          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4">
                              <div 
                                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-2xl border flex items-center gap-2 md:gap-3 transition-all duration-500 font-black italic shadow-xl`}
                                style={{ 
                                  backgroundColor: completionPercentage() > 80 ? `${theme.primary}20` : 'transparent',
                                  borderColor: completionPercentage() > 80 ? `${theme.primary}30` : 'inherit',
                                  color: completionPercentage() > 80 ? theme.primary : 'inherit'
                                }}
                              >
                                 <Award size={16} className="md:w-[18px]" />
                                 <span className="text-[9px] md:text-[10px] uppercase tracking-widest">{completionPercentage() > 80 ? 'Elite Status' : 'Basic User'}</span>
                              </div>
                             <div className={`px-4 md:px-5 py-2 md:py-2.5 rounded-2xl border flex items-center gap-2 md:gap-3 transition-all duration-500 group relative font-black italic ${formData.location ? 'bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xl' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'}`}>
                                <Globe size={16} className={`md:w-[18px] ${formData.location ? 'animate-pulse' : ''}`} />
                                <span className="text-[9px] md:text-[10px] uppercase tracking-widest">{formData.location ? `Node: ${formData.location.split(',')[0]}` : 'Grid: Not Set'}</span>
                             </div>
                             <div className="px-4 md:px-5 py-2 md:py-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center gap-2 md:gap-3 font-black italic">
                                <Target size={16} className="md:w-[18px]" />
                                <span className="text-[9px] md:text-[10px] uppercase tracking-widest">Alpha Tier</span>
                             </div>
                          </div>

                          {/* Critical Actions */}
                          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-6">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Next Steps:</span>
                             <div className="flex gap-4">
                                 {completionPercentage() < 100 && (
                                   <button 
                                     onClick={() => setActiveTab('profile')}
                                     className="text-[11px] font-bold hover:text-white flex items-center gap-2 group transition-colors"
                                     style={{ color: theme.primary }}
                                   >
                                      Finish Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                   </button>
                                 )}
                                <button 
                                  onClick={() => router.push('/dashboard')}
                                  className="text-[11px] font-bold text-blue-400 hover:text-white flex items-center gap-2 group transition-colors"
                                >
                                   Search Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                   {/* Analysis History Section - This is what the user calls "History" */}
                   <div 
                     className="glass-card p-10 relative overflow-hidden"
                     style={{ borderColor: `${theme.primary}20` }}
                   >
                     <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-4">
                          <div 
                            className="p-4 rounded-2xl"
                            style={{ backgroundColor: `${theme.primary}15` }}
                          >
                            <BarChart3 size={28} style={{ color: theme.primary }} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none mb-1">Intelligence History</h2>
                            <p className="text-slate-500 dark:text-gray-400 text-sm font-bold opacity-80 uppercase tracking-widest italic">Generated Strategic Reports</p>
                          </div>
                        </div>
                     </div>

                     {analysisHistory.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                         {analysisHistory.slice(0, 6).map((item, idx) => (
                           <motion.div 
                             key={item.id || idx}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             whileHover={{ scale: 1.02, translateY: -5 }}
                             transition={{ delay: idx * 0.1, duration: 0.3 }}

                             className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer group"

                             onClick={() => router.push(`/dashboard?topic=${encodeURIComponent(item.topic || '')}`)}
                           >
                             <div className="flex items-start justify-between mb-3">
                               <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.type || 'AI SCAN'}</span>
                               </div>
                               <span className="text-[9px] font-black text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                             </div>
                             <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-1 line-clamp-1">{item.topic || 'Market Analysis'}</h4>
                             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate tracking-wide">{item.location || 'Global Search'}</p>
                           </motion.div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-10 opacity-50 grayscale">
                          <Activity size={48} className="mx-auto mb-4 text-slate-300" />
                          <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No intelligence assets deployed yet</p>
                       </div>
                     )}
                   </div>


                 </motion.div>
                  {/* Plan Features Overview */}
                  <div 
                    className="glass-card p-8"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <Settings size={24} style={{ color: theme.primary }} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">Plan Overview</h2>
                        <p className="text-slate-500 dark:text-gray-400 font-medium">Your current subscription and features</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      {/* Usage Stats */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic tracking-tighter">
                          <Activity size={20} style={{ color: theme.primary }} />
                          Usage Statistics
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2 font-black italic">
                              <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-300">Regional Intelligence Scans</span>
                              <span className="text-sm text-slate-900 dark:text-white">
                                {analysisCount} / {planFeatures.maxAnalyses === -1 ? '∞' : planFeatures.maxAnalyses}
                              </span>
                            </div>
                            {planFeatures.maxAnalyses !== -1 && (
                              <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                                <motion.div 
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ backgroundColor: theme.primary }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((analysisCount / planFeatures.maxAnalyses) * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Features List */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic tracking-tighter">
                          <Target size={20} style={{ color: theme.primary }} />
                          Available Features
                        </h3>
                        <div className="space-y-3">
                          {[
                            { key: 'maxAnalyses', label: 'AI Business Recommendations', icon: BarChart3, value: planFeatures.maxAnalyses === -1 ? 'Unlimited' : `${planFeatures.maxAnalyses} / month` },
                            { key: 'advancedFeatures', label: 'Neural Profit Engine (AI)', icon: Cpu },
                            { key: 'competitorInsights', label: 'Competitor Neural Heatmaps', icon: MapPin },
                            { key: 'maxVaultSaves', label: 'Alpha Vault Archival', icon: Archive, value: planFeatures.maxVaultSaves === -1 ? 'Unlimited' : `${planFeatures.maxVaultSaves} Assets` },
                            { key: 'roadmapAccess', label: '6-Month Strategic Roadmaps', icon: Target },
                            { key: 'realTimeAlerts', label: 'Real-time Demand Scoring', icon: Activity },
                            { key: 'prioritySupport', label: 'Priority Support Concierge', icon: ShieldCheck }
                          ].map((feature, index) => {
                            const isIncluded = feature.value || !!planFeatures[feature.key as keyof typeof planFeatures];
                            return (
                              <motion.div 
                                key={feature.key}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-black italic relative group"
                              >
                                <div className="flex items-center gap-3">
                                  <feature.icon size={16} className={isIncluded && !feature.value ? "text-blue-500" : "text-slate-400 dark:text-gray-500"} />
                                  <span className="text-[10px] uppercase tracking-widest text-slate-600 dark:text-gray-300">{feature.label}</span>
                                </div>
                                
                                {isIncluded ? (
                                  <span 
                                    className="text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border shadow-sm"
                                    style={{ 
                                      backgroundColor: `${theme.primary}20`,
                                      borderColor: `${theme.primary}30`,
                                      color: theme.primary
                                    }}
                                  >
                                    {feature.value || '✓ Included'}
                                  </span>
                                ) : (
                                  <Link 
                                    href="/acquisition-tiers"
                                    className="text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-300 dark:border-white/10 text-slate-400 dark:text-gray-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                                  >
                                    Upgrade
                                  </Link>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 text-center cursor-pointer group"
                      style={{ borderColor: `${theme.primary}20` }}
                      onClick={() => router.push('/dashboard')}
                    >
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <BarChart3 size={24} style={{ color: theme.primary }} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">Dashboard</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">View your analytics</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 text-center cursor-pointer group"
                      style={{ borderColor: `${theme.primary}20` }}
                      onClick={() => setActiveTab('profile')}
                    >
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <Edit3 size={24} style={{ color: theme.primary }} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">Edit Profile</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Update your information</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 text-center cursor-pointer group"
                      style={{ borderColor: `${theme.primary}20` }}
                      onClick={() => router.push('/acquisition-tiers')}
                    >
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <Crown size={24} style={{ color: theme.primary }} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">Upgrade Plan</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Unlock more features</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'vault' && (
                <motion.div
                  key="vault"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div 
                    className="glass-card p-10 relative overflow-hidden shadow-2xl"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                      <div className="flex items-center gap-5">
                        <div 
                          className="w-16 h-16 rounded-[1.5rem] bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl relative group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Bookmark size={32} className="text-white dark:text-slate-900 relative z-10 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-[-0.05em] uppercase leading-none">VAULT</h2>
                            <div className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest italic">Encrypted</div>
                          </div>
                          <p className="text-slate-500 dark:text-gray-400 text-xs font-bold opacity-80 uppercase tracking-[0.2em] italic">Elite Intelligence Archive · Unlimited</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => fetchSavedBusinesses()}
                        className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all group lg:self-end"
                      >
                        <RefreshCw size={14} className={`text-slate-400 group-hover:text-emerald-500 transition-colors ${loadingVault ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest italic">Sync Core Nodes</span>
                      </button>
                    </div>

                    {plan === 'free' ? (
                      <div className="py-20 text-center space-y-8 bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 dark:bg-white/10 flex items-center justify-center relative z-10">
                            <Key size={32} className="text-slate-400 dark:text-slate-600" />
                          </div>
                        </div>
                        <div className="max-w-md mx-auto px-6">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-3 uppercase tracking-widest">Vault Access Restricted</h3>
                          <p className="text-slate-500 dark:text-gray-400 font-bold mb-8 italic">
                            The Alpha Vault allows you to store and protect your most valuable business opportunities. Archive access requires an active Professional membership.
                          </p>
                          <Link 
                            href="/acquisition-tiers"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                          >
                            UPGRADE TO PROFESSIONAL <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                    ) : (savedBusinesses.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {loadingVault && (
                          <div className="col-span-full flex items-center justify-center gap-3 py-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-pulse">
                            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Synchronizing Core Nodes...</span>
                          </div>
                        )}
                        {savedBusinesses.map((item, idx) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-[2rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 hover:shadow-2xl transition-all relative group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{item.category || 'General Strategy'}</span>
                              </div>
                              <button 
                                onClick={() => deleteSavedBusiness(item.id)}
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                title="Purge from Archive"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <h4 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-2 italic tracking-tighter">{item.business_name}</h4>
                            <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest italic flex items-center gap-2">
                              <MapPin size={10} /> {item.location || 'Global Search'}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-center flex flex-col justify-center">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">ROI Potential</div>
                                <div className="text-sm font-black text-emerald-500 line-clamp-1">{item.details?.roi_percentage || '85'}%</div>
                              </div>
                              <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-center flex flex-col justify-center">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Startup Capital</div>
                                <div className="text-sm font-black text-blue-500 line-clamp-1">{formatCurrency(item.details?.funding_required || '₹10L', item.location)}</div>
                              </div>
                            </div>

                            {/* New Intelligence Fields */}
                            {(item.details?.required_services || item.details?.unique_selling_proposition) && (
                              <div className="mb-6 space-y-3">
                                {item.details?.required_services && (
                                  <div className="p-3 rounded-xl bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 grayscale opacity-70">
                                      <div className="w-1 h-1 rounded-full bg-slate-400" /> Infrastructure Needs
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Array.isArray(item.details.required_services) ? (
                                        item.details.required_services.slice(0, 3).map((svc: string, idx: number) => (
                                          <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                                            {svc}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 italic">Analysis optimized...</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {item.details?.unique_selling_proposition && (
                                  <div className="p-3 rounded-xl bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border border-emerald-500/10 dark:border-emerald-500/20">
                                    <div className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                      <Zap size={8} /> Core Advantage
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-700 dark:text-gray-300 leading-relaxed italic">
                                      "{item.details.unique_selling_proposition}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex gap-3">
                              <button 
                                onClick={() => {
                                  // If the item itself has the full structure, use it directly
                                  const storageData = item.details?.is_snapshot 
                                    ? item.details 
                                    : { business: item.details, area: item.location };
                                    
                                  sessionStorage.setItem('selected_business', JSON.stringify(storageData));
                                  router.push('/business-details');
                                }}
                                className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-md flex items-center justify-center gap-2"
                              >
                                Open Intelligence <ChevronRight size={14} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center opacity-30 grayscale ring-1 ring-slate-200 dark:ring-white/10">
                          <Archive size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-2 uppercase tracking-widest">Vault is Vacuum</h3>
                        <p className="text-slate-500 dark:text-gray-400 max-w-sm mx-auto font-bold italic">
                          You haven't archived any business opportunities yet. Start searching and save your first asset to the Alpha Vault.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div 
                    className="glass-card p-8"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <div 
                          className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 shadow-sm"
                        >
                          <User size={24} style={{ color: theme.primary }} />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none mb-1">
                            {t('prof_header')}
                          </h2>
                          <p className="text-slate-500 dark:text-gray-400 text-sm font-bold italic opacity-80">
                            Update your personal information
                          </p>
                        </div>
                      </div>
                      
                      {/* Premium Auto-save Toggle */}
                      <div className="flex items-center gap-3 bg-slate-900/5 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-slate-900/10 dark:border-white/10 w-fit">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Auto-save</span>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{autoSave ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoSave(!autoSave)}
                          className={`relative w-12 h-6.5 rounded-full transition-all duration-300 outline-none p-1 ${
                            autoSave 
                              ? 'bg-slate-200 dark:bg-white/10' 
                              : 'bg-slate-200 dark:bg-white/10'
                          } border`}
                          style={{ 
                            borderColor: autoSave ? `${theme.primary}50` : 'transparent',
                            background: autoSave ? `${theme.primary}20` : ''
                          }}
                        >
                          <motion.div
                            animate={{ 
                              x: autoSave ? 22 : 0,
                              backgroundColor: autoSave ? theme.primary : '#94a3b8'
                            }}
                            className="w-4.5 h-4.5 rounded-full shadow-lg"
                          />
                        </button>
                      </div>
                    </div>

                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl border flex items-center gap-2 ${
                          message.includes('successfully') 
                            ? 'bg-green-500/20 border-green-500/30 text-green-400'
                            : message.includes('offline') || message.includes('locally')
                            ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                            : 'bg-red-500/20 border-red-500/30 text-red-400'
                        }`}

                      >
                        {message.includes('successfully') ? (
                          <CheckCircle2 size={16} />
                        ) : message.includes('offline') || message.includes('locally') ? (
                          <Clock size={16} />
                        ) : (
                          <X size={16} />
                        )}
                        <span>{message}</span>
                        {autoSave && message.includes('successfully') && (
                          <span className="ml-auto text-xs opacity-70">Auto-saved</span>
                        )}
                      </motion.div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 ml-1">
                            {t('prof_name')} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center">
                              <User size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold italic tracking-tight"
                                placeholder={t('prof_placeholder_name')}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 ml-1">
                            {t('prof_phone')}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center">
                              <Phone size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold italic tracking-tight"
                                placeholder="+1 (555) 000-0000"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 ml-1">
                            {t('prof_company')}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center">
                              <Building2 size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold italic tracking-tight"
                                placeholder="Neural Enterprises Ltd."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 ml-1">
                            {t('prof_location')}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center">
                              <MapPin size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full pl-12 pr-24 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold italic tracking-tight"
                                placeholder="City, Country"
                              />
                              <button
                                type="button"
                                onClick={handleAutoDetectLocation}
                                disabled={locationDetecting}
                                className="absolute right-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/10"
                                style={{ 
                                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                }}
                              >
                                {locationDetecting ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Syncing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Globe size={12} />
                                    <span>Sync GPS</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          {detectedLocation && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                  <Activity size={12} className="text-blue-500" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">{t('prof_location_found')}</p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">
                                    {detectedLocation.city}, {detectedLocation.country}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const locationString = `${detectedLocation.city}, ${detectedLocation.country}`;
                                  setFormData({ ...formData, location: locationString });
                                }}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                              >
                                {t('prof_deploy_location')}
                              </button>
                            </motion.div>
                          )}
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 ml-1">
                            {t('prof_website')}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center">
                              <Globe size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold italic tracking-tight"
                                placeholder="https://domain.com"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 ml-1">
                            {t('prof_industry')}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center">
                              <Target size={18} className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <select
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer font-bold italic tracking-tight"
                              >
                                <option value="" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">{t('prof_select_sector')}</option>
                                <option value="Technology" className="bg-slate-100 dark:bg-slate-900">Technology</option>
                                <option value="Healthcare" className="bg-slate-100 dark:bg-slate-900">Healthcare</option>
                                <option value="Finance" className="bg-slate-100 dark:bg-slate-900">Finance</option>
                                <option value="Education" className="bg-slate-100 dark:bg-slate-900">Education</option>
                                <option value="Retail" className="bg-slate-100 dark:bg-slate-900">Retail</option>
                                <option value="Manufacturing" className="bg-slate-100 dark:bg-slate-900">Manufacturing</option>
                                <option value="Real Estate" className="bg-slate-100 dark:bg-slate-900">Real Estate</option>
                                <option value="Food & Beverage" className="bg-slate-100 dark:bg-slate-900">Food & Beverage</option>
                                <option value="Consulting" className="bg-slate-100 dark:bg-slate-900">Consulting</option>
                                <option value="Marketing" className="bg-slate-100 dark:bg-slate-900">Marketing</option>
                                <option value="Agriculture" className="bg-slate-100 dark:bg-slate-900">Agriculture</option>
                                <option value="Transportation" className="bg-slate-100 dark:bg-slate-900">Transportation</option>
                                <option value="Entertainment" className="bg-slate-100 dark:bg-slate-900">Entertainment</option>
                                <option value="Other" className="bg-slate-100 dark:bg-slate-900">Other</option>
                              </select>
                              <div className="absolute right-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <ChevronDown size={18} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Bio */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                          <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                            {t('prof_bio')}
                          </label>
                          <span className={`text-[10px] font-black italic tracking-tighter ${formData.bio.length > 450 ? 'text-indigo-500' : 'text-slate-500'}`}>
                            {formData.bio.length} <span className="opacity-30">/</span> 500
                          </span>

                        </div>
                        <div className="relative group">
                          <div 
                            className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" 
                            style={{ background: `linear-gradient(to r, ${theme.primary}10, ${theme.secondary}10)` }}
                          />
                          <div className="relative">
                            <FileText size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:transition-colors" style={{ color: 'var(--focus-color, inherit)' }} />
                            <textarea
                              value={formData.bio}
                              onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                  setFormData({ ...formData, bio: e.target.value });
                                }
                              }}
                              rows={5}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none transition-all resize-none font-bold italic tracking-tight leading-relaxed"
                              style={{ 
                                borderColor: 'inherit',
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.primary}50`;
                                e.currentTarget.style.borderColor = theme.primary;
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '';
                              }}
                              placeholder="Describe your professional objectives and mission profile..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Command Section */}
                      <div className="pt-8 border-t border-slate-200 dark:border-white/5">
                        <motion.button
                          type="submit"
                          disabled={saving}
                          whileHover={{ scale: 1.01, y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group shadow-2xl shadow-blue-500/20"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          }}
                        >
                          <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-10" />
                          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            {saving ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{t('prof_saving')}</span>
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                <span>{t('prof_save')}</span>
                              </>
                            )}
                          </span>
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div 
                    className="glass-card p-6 lg:p-8"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <div 
                          className="p-4 rounded-2xl transition-transform hover:scale-105"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
                            border: `1px border ${theme.primary}30`,
                            boxShadow: `0 8px 20px -5px ${theme.primary}20`
                          }}
                        >
                          <Crown size={28} className="animate-pulse" style={{ color: theme.primary }} />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none mb-1">
                            Plan & Billing
                          </h2>
                          <p className="text-slate-500 dark:text-gray-400 text-sm font-bold italic opacity-80">
                            Review your subscription status and financial history
                          </p>
                        </div>
                      </div>
                      
                        <Link 
                          href="/acquisition-tiers"
                          className="px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-white hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-xl group"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                            boxShadow: `0 10px 25px -5px ${theme.primary}50`
                          }}
                        >
                          <Zap size={14} className="text-white group-hover:scale-125 transition-transform" />
                          Intelligence Tiers
                        </Link>
                    </div>

                    <div className="space-y-10">
                      {/* Current Subscription Status */}
                      <div className="grid grid-cols-1 gap-6">
                        {/* Plan Card - High Fidelity */}
                        <div className="p-8 rounded-3xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 relative overflow-hidden group shadow-2xl">
                          {/* Interactive Background Elements */}
                          <motion.div 
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px]" 
                            style={{ background: `radial-gradient(circle, ${theme.primary}, transparent)` }} 
                          />
                          
                          <div className="relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                                <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20 shadow-sm">
                                    Current Deployment
                                    </span>
                                    {subscriptionDetails?.status === 'active' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Operational</span>
                                    </div>
                                    )}
                                </div>
                                <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                                    {planFeatures.planName}
                                </h3>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-white/[0.05] p-6 rounded-2xl border border-slate-200 dark:border-white/10 min-w-[200px] text-center lg:text-right">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-2">Alpha Pricing</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white italic flex items-baseline justify-center lg:justify-end gap-2">
                                    {plan === 'free' ? '0.00' : formatPrice(subscriptionDetails?.price || 0, getPricingForCountry(userLocation?.country || 'Global'))}
                                    <span className="text-sm text-slate-400">/ {subscriptionDetails?.billing_cycle || 'mo'}</span>
                                </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-slate-200 dark:border-white/10">
                                <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Calendar size={12} className="text-blue-500" /> Cycle Reset
                                </span>
                                <p className="text-base font-black text-slate-800 dark:text-slate-100 italic">
                                    {subscriptionDetails?.subscription_end ? new Date(subscriptionDetails.subscription_end).toLocaleDateString() : 'Active Forever'}
                                </p>
                                </div>
                                <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Activity size={12} className="text-blue-500" /> Protocol
                                </span>
                                <p className="text-base font-black text-slate-800 dark:text-slate-100 capitalize italic">
                                    {subscriptionDetails?.billing_cycle || 'Standard'}
                                </p>
                                </div>
                                <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <BarChart3 size={12} className="text-blue-500" /> Scan Quota
                                </span>
                                <p className="text-base font-black text-slate-800 dark:text-slate-100 italic">
                                    {analysisCount} <span className="opacity-20 mx-1">/</span> {planFeatures.maxAnalyses === -1 ? '∞' : planFeatures.maxAnalyses}
                                </p>
                                </div>
                                <div className="flex items-center lg:justify-end">
                                <Link 
                                    href="/acquisition-tiers"
                                    className="group/btn w-full sm:w-auto px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95"
                                >
                                    {plan === 'free' ? 'Upgrade' : 'Elevate'} 
                                    <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction History Section */}
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                          <Activity size={18} className="text-blue-500" />
                          Recent Transactions
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            id="refresh-transactions-btn"
                            onClick={async () => {
                              try {
                                setLoadingPayments(true);
                                const apiUrl = getApiUrl();
                                // Trigger Cloud Sync (Caching)
                                // Refresh local records directly - legacy Razorpay sync removed
                                // Fetch local records
                                await fetchPayments();
                                addNotification({
                                  type: 'system',
                                  title: '🔄 Intelligence Sync',
                                  message: 'Transaction history refreshed from cloud nodes.',
                                  priority: 'low'
                                });
                              } catch (e) {
                                console.error('Cloud Sync failed', e);
                                fetchPayments();
                              } finally {
                                setLoadingPayments(false);
                              }
                            }}
                            disabled={loadingPayments}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white rounded-xl flex items-center gap-2 transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{ 
                              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                              boxShadow: `0 8px 15px -4px ${theme.primary}40`
                            }}
                          >
                            <RefreshCw size={12} className={loadingPayments ? "animate-spin" : ""} />
                            Refresh History
                          </button>

                          
                          <button 
                            onClick={async () => {
                              if (!session?.user?.email) return;
                              const element = document.getElementById('billing-report');
                              if (!element) return;
                              
                              try {
                                const { default: html2canvas } = await import('html2canvas');
                                const { jsPDF } = await import('jspdf');
                                
                                const isDark = document.documentElement.classList.contains('dark');
                                
                                // html2canvas crashes on Tailwind v4 oklab/oklch colors
                                // This is an aggressive fix: we strip all oklab/oklch declarations from the DOM
                                const canvas = await html2canvas(element, {
                                  scale: 2,
                                  useCORS: true,
                                  backgroundColor: isDark ? "#020617" : "#ffffff",
                                  onclone: (clonedDoc) => {
                                    // 1. STRIP ALL OKLCH/OKLAB FROM STYLE TAGS (The most direct fix for the crash)
                                    const styleBlocks = clonedDoc.querySelectorAll('style');
                                    styleBlocks.forEach(style => {
                                      // Replace oklch/oklab with a safe fallback hex (blue-500)
                                      // This prevents html2canvas parser from seeing tokens it doesn't recognize
                                      let css = style.innerHTML;
                                      if (css.includes('oklch') || css.includes('oklab')) {
                                        css = css.replace(/oklch\([^)]+\)/g, '#3b82f6');
                                        css = css.replace(/oklab\([^)]+\)/g, '#3b82f6');
                                        style.innerHTML = css;
                                      }
                                    });

                                    // 2. SANITIZE INLINE STYLES AND COMPUTED STYLES
                                    const allElements = clonedDoc.querySelectorAll('*');
                                    allElements.forEach(el => {
                                      const htmlEl = el as HTMLElement;
                                      
                                      // Clear any inline styles that might use oklch
                                      if (htmlEl.style.color?.includes('okl')) htmlEl.style.color = '#3b82f6';
                                      if (htmlEl.style.backgroundColor?.includes('okl')) htmlEl.style.backgroundColor = '#1e293b';
                                      if (htmlEl.style.borderColor?.includes('okl')) htmlEl.style.borderColor = '#334155';
                                      if (htmlEl.style.fill?.includes('okl')) htmlEl.style.fill = '#3b82f6';
                                      if (htmlEl.style.stroke?.includes('okl')) htmlEl.style.stroke = '#3b82f6';

                                      const style = window.getComputedStyle(htmlEl);
                                      const sanitize = (val: string) => {
                                        if (!val || val === 'none') return val;
                                        if (val.includes('oklch') || val.includes('oklab') || val.includes('lab(') || val.includes('hwb(')) {
                                          return '#3b82f6'; 
                                        }
                                        return val;
                                      };

                                      // Force apply sanitized computed styles as inline overrides
                                      htmlEl.style.color = sanitize(style.color);
                                      htmlEl.style.backgroundColor = sanitize(style.backgroundColor);
                                      htmlEl.style.borderColor = sanitize(style.borderColor);
                                      htmlEl.style.boxShadow = sanitize(style.boxShadow);
                                    });

                                    const el = clonedDoc.getElementById('billing-report');
                                    if (el) {
                                      el.style.padding = '40px';
                                      el.style.width = '1200px';
                                      el.style.background = isDark ? "#020617" : "#ffffff";
                                      el.style.color = isDark ? "white" : "black";
                                    }
                                  }
                                });
                                
                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF('p', 'mm', 'a4');
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const imgWidth = 210; 
                                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                                
                                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                                pdf.save(`billing-report-${session.user?.email?.split('@')[0] || 'user'}.pdf`);
                                
                              } catch (err) {
                                console.error('Failed to generate billing PDF', err);
                                alert('PDF Generation failed due to a styling engine incompatibility. Please try taking a screenshot or use Print (Ctrl+P).');
                              }
                            }}
                            className="px-5 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group italic shadow-xl hover:scale-105 active:scale-95"
                            style={{ 
                              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                              boxShadow: `0 10px 20px -5px ${theme.primary}40`

                            }}
                          >
                            <FileText size={14} className="group-hover:scale-110 transition-transform" />
                            Download PDF Report
                          </button>
                        </div>
                      </div>

                      {payments.length > 0 ? (
                        <div id="billing-report" className="space-y-6">
                          {/* Desktop View Table */}
                          <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                            <table className="w-full text-left min-w-[700px]">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-white/5">
                                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Invoice ID</th>
                                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Date</th>
                                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Plan</th>
                                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Amount</th>
                                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 text-center">Status</th>
                                  <th className="pb-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {(showAllPayments ? payments : payments.slice(0, 3)).map((payment: any, index: number) => (
                                  <motion.tr 
                                    key={payment.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300"
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <td className="py-4 font-mono text-[10px] text-slate-600 dark:text-slate-400 italic">
                                      {payment.dodo_payment_id?.split('_').slice(-1)[0].toUpperCase().slice(0, 10) || payment.id}
                                    </td>
                                    <td className="py-4 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                      {new Date(payment.created_at || payment.payment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-4">
                                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic tracking-widest">
                                        {payment.plan_name?.toLowerCase().includes('professional') || payment.plan_id?.toLowerCase().includes('professional') ? 'Professional' : 
                                         payment.plan_name?.toLowerCase().includes('starter') || payment.plan_id?.toLowerCase().includes('starter') ? 'Starter' : 
                                         (payment.plan_name || 'Explorer')}
                                      </span>
                                    </td>
                                    <td className="py-4 text-xs font-black text-slate-900 dark:text-white tracking-widest">₹{parseFloat(payment.amount).toLocaleString()}</td>
                                    <td className="py-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                        payment.status?.toLowerCase() === 'captured' || payment.status?.toLowerCase() === 'success'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      }`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                    <td className="py-4 text-right">
                                      <button 
                                        onClick={() => {
                                          setSelectedPayment(payment);
                                          setIsInvoiceModalOpen(true);
                                        }}
                                        className="p-2 ml-auto rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 transition-all flex items-center gap-2 group italic shadow-sm"
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = theme.primary;
                                          e.currentTarget.style.backgroundColor = `${theme.primary}10`;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '';
                                          e.currentTarget.style.backgroundColor = '';
                                        }}
                                      >
                                        <FileText size={14} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Receipt</span>
                                      </button>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile View - Card Layout */}
                          <div className="md:hidden space-y-4">
                            {(showAllPayments ? payments : payments.slice(0, 3)).map((payment: any, index: number) => (
                              <motion.div
                                key={payment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4 shadow-sm"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Invoice ID</div>
                                    <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                                      {payment.dodo_payment_id?.slice(0, 16)}...
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    payment.status?.toLowerCase() === 'captured' || payment.status?.toLowerCase() === 'success'
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                      : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                  }`}>

                                    {payment.status}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 dark:border-white/5">
                                  <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Plan</div>
                                    <div className="text-[10px] font-black dark:text-white uppercase italic truncate">{payment.plan_id?.split('_').join(' ') || getProfessionalPlanName(payment.plan_name)}</div>
                                  </div>
                                  <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Amount</div>
                                    <div className="text-[10px] font-black dark:text-white">₹{payment.amount}</div>
                                  </div>
                                  <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Date</div>
                                    <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{new Date(payment.created_at || payment.payment_date).toLocaleDateString()}</div>
                                  </div>
                                </div>

                                <button
                                   onClick={() => {
                                     setSelectedPayment(payment);
                                     setIsInvoiceModalOpen(true);
                                   }}
                                   className="w-full py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 shadow-lg group italic"
                                   style={{ 
                                     background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                     boxShadow: `0 8px 16px -4px ${theme.primary}40`
                                   }}
                                 >
                                   <FileText size={12} className="group-hover:scale-110 transition-transform" />
                                   View Invoice
                                 </button>
                              </motion.div>
                            ))}
                          </div>

                          {payments.length > 3 && (
                            <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                        <button
                          onClick={() => setShowAllPayments(!showAllPayments)}
                          className="w-full sm:w-auto px-10 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group shadow-xl hover:scale-105 active:scale-95 italic"
                          style={{ 
                            borderColor: `${theme.primary}30`, 
                            backgroundColor: `${theme.primary}05`,
                            color: theme.primary,
                            boxShadow: `0 10px 20px -5px ${theme.primary}10`
                          }}
                        >
                          {showAllPayments ? (
                            <><ChevronUp size={16} className="group-hover:-translate-y-1 transition-transform" /> Hide History</>
                          ) : (
                            <><ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /> View Full Archive</>
                          )}
                        </button>
                      </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                          <CreditCard size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600 opacity-50" />
                          <p className="text-sm font-black text-slate-500 dark:text-slate-400 italic mb-2">No transactions found</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-4">
                            {plan === 'free' ? 'Upgrade your plan to see billing history' : 'Your payment records will appear here'}
                          </p>
                          <p className="text-[8px] text-slate-400 dark:text-slate-600 mb-4">
                            If you have made payments and they're not showing, try refreshing below.
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <motion.button 
                              onClick={() => document.getElementById('refresh-transactions-btn')?.click()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 relative overflow-hidden"
                            >
                              <RefreshCw size={12} className={loadingPayments ? "animate-spin" : ""} />
                              Sync Transactions
                            </motion.button>

                            
                            {plan === 'free' && (
                              <Link 
                                href="/acquisition-tiers"
                                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                style={{ 
                                  backgroundColor: `${theme.primary}20`,
                                  color: theme.primary,
                                  border: `1px solid ${theme.primary}40`
                                }}
                              >
                                <Crown size={12} />
                                Upgrade Plan
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        payment={selectedPayment}
        userData={{
          name: formData.name || session?.user?.name || "Premium User",
          email: session?.user?.email || "billing@starterscope.ai",
          company: formData.company,
          location: formData.location
        }}
      />
    </div>
  );
}
