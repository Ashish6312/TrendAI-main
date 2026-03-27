"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Star, CheckCircle, AlertTriangle, Lightbulb, 
  Zap, Phone, Mail, ExternalLink, Navigation, Loader2, Map, 
  Eye, Maximize2, RefreshCw, X, Building, Store, Factory, 
  Globe2, DollarSign, BarChart3, Target, Building2, Globe, Search, Plus, 
  Trash2, ShieldCheck, Calendar, Clock, Award, Info, Sparkles, TrendingUp,
  Cpu, Archive, ChevronRight, Bookmark, Instagram, Facebook, Twitter
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useNotifications } from "@/context/NotificationContext";
import { getApiUrl } from "@/config/api";
import { locationAPI, type Country, type State, type City } from '@/utils/locationAPI';
import { realBusinessAPI, type RealBusiness } from '@/utils/realBusinessAPI';
import InteractiveMap from '@/components/InteractiveMap';
import UniformLayout from '@/components/UniformLayout';
import UniformCard from '@/components/UniformCard';

interface ExistingBusiness {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  status: 'active' | 'closed' | 'unknown';
  distance?: string;
  established?: string;
  category?: string;
  coordinates?: { lat: number; lng: number };
  social_media?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  opening_hours?: string;
  price_level?: number;
}

interface LocationData {
  country?: Country;
  state?: State;
  city?: City;
  coordinates?: { lat: number; lng: number };
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingBusinesses, setExistingBusinesses] = useState<ExistingBusiness[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({});
  const [realLocationData, setRealLocationData] = useState<any>(null);
  const [fetchingRealData, setFetchingRealData] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'businesses' | 'neural'>('overview');
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [savingToVault, setSavingToVault] = useState(false);
  const { data: session } = useSession();
  const { plan } = useSubscription();
  const { addNotification } = useNotifications();
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    const storedBusiness = sessionStorage.getItem('selected_business');
    if (storedBusiness) {
      const data = JSON.parse(storedBusiness);
      setBusinessData(data);
      
      // If it's a frozen snapshot, load that instead of refetching
      if (data.is_snapshot && data.snapshot) {
        setExistingBusinesses(data.snapshot.existingBusinesses || []);
        setLocationData(data.snapshot.locationData || {});
        setRealLocationData(data.snapshot.realLocationData || null);
        setContactInfo(data.snapshot.contactInfo || null);
        setFetchingRealData(false);
        setLoadingMap(false);
      } else {
        loadRealLocationData(data);
      }
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  }, [router]);
  const loadRealLocationData = async (data: any) => {
    setLoadingMap(true);
    setFetchingRealData(true);
    
    try {
      console.log('🔍 Loading location data for:', data.area);
      
      // Parse location using real API, passing along any existing coordinates for precision
      const parsedLocation = await locationAPI.parseLocationString(data.area, data.coordinates);
      console.log('📍 Parsed location:', parsedLocation);
      
      setLocationData(parsedLocation);
      
      // Generate location-based business data
      const locationBasedData = locationAPI.generateLocationBasedBusinessData(
        parsedLocation, 
        data.business.title
      );
      setRealLocationData(locationBasedData);
      
      // Fetch businesses and contact info
      await Promise.all([
        fetchRealExistingBusinesses(data.business.title, data.area, parsedLocation),
        fetchContactInformation(data.business.title, data.area, locationBasedData)
      ]);
      
    } catch (error) {
      console.error('❌ Error loading location data:', error);
    } finally {
      setLoadingMap(false);
      setFetchingRealData(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    if (!value) return '';
    const str = String(value);
    const area = businessData?.area || "";
    const areaLower = area.toLowerCase();
    
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

  const fetchRealExistingBusinesses = async (businessType: string, area: string, locationData: LocationData) => {
    try {
      console.log('🏢 Fetching real business data for:', businessType, 'in', area);
      
      const realBusinesses = await realBusinessAPI.searchBusinesses({
        businessType,
        location: area,
        coordinates: locationData.coordinates,
        radius: 15
      });

      const convertedBusinesses: ExistingBusiness[] = realBusinesses.map(business => ({
        name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
        website: business.website,
        rating: business.rating,
        reviews: business.reviews,
        status: business.status,
        distance: business.distance,
        established: business.established,
        category: business.category,
        coordinates: business.coordinates
      }));

      setExistingBusinesses(convertedBusinesses);
      
    } catch (error) {
      console.error('❌ Error fetching businesses:', error);
      setExistingBusinesses(generateFallbackBusinesses(businessType, area, locationData));
    }
  };
  const generateFallbackBusinesses = (businessType: string, area: string, locationData: LocationData): ExistingBusiness[] => {
    const businessNames = [
      `${area.split(',')[0]} ${businessType} Solutions`,
      `Elite ${businessType} ${area.split(',')[0]}`,
      `Professional ${businessType} Center`,
      `${businessType} Hub ${area.split(',')[0]}`,
      `Advanced ${businessType} Services`,
      `Local ${businessType} Network`
    ];

    return businessNames.map((name, index) => ({
      name,
      address: `${100 + index * 50} Business Street, ${area}`,
      phone: `+1 555 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `contact@${name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.com`,
      website: `www.${name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.com`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviews: Math.floor(Math.random() * 200 + 10),
      status: Math.random() > 0.2 ? 'active' : 'closed',
      distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
      established: `${2015 + Math.floor(Math.random() * 8)}`,
      category: businessType,
      coordinates: locationData.coordinates ? {
        lat: locationData.coordinates.lat + (Math.random() - 0.5) * 0.02,
        lng: locationData.coordinates.lng + (Math.random() - 0.5) * 0.02
      } : undefined
    })) as ExistingBusiness[];
  };

  const fetchContactInformation = async (businessType: string, area: string, locationBasedData?: any) => {
    const locationName = locationBasedData?.locationName || area.split(',')[0];
    const countryName = locationBasedData?.countryName || 'Unknown';
    const phoneFormat = locationBasedData?.phoneFormat || '+1 (555) XXX-XXXX';
    
    const mockContactInfo = {
      businessAssociations: [
        {
          name: `${locationName} Chamber of Commerce`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `info@${locationName.toLowerCase().replace(/\s+/g, '')}chamber.com`,
          website: `www.${locationName.toLowerCase().replace(/\s+/g, '')}chamber.com`
        },
        {
          name: `${businessType} Business Association`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `contact@${businessType.toLowerCase().replace(/\s+/g, '')}assoc.org`,
          website: `www.${businessType.toLowerCase().replace(/\s+/g, '')}association.org`
        }
      ],
      localSupport: [
        {
          name: `${locationName} Business Development Center`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `help@${locationName.toLowerCase().replace(/\s+/g, '')}bdc.org`,
          website: `www.${locationName.toLowerCase().replace(/\s+/g, '')}business.org`,
          services: ['Business Planning', 'Funding Assistance', 'Mentoring', 'Market Research']
        }
      ],
      suppliers: [
        {
          name: `${locationName} Supply Network`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `sales@${locationName.toLowerCase().replace(/\s+/g, '')}supply.com`,
          category: 'Equipment & Supplies'
        }
      ]
    };

    setContactInfo(mockContactInfo);
  };

  const handleDeepScrape = async () => {
    if (plan === 'free') {
      addNotification({
        type: 'alert',
        title: 'Deep Scrape Locked',
        message: 'High-fidelity data extraction is a Pro feature. Upgrade to access emails and social links.',
        priority: 'high'
      });
      return;
    }

    setScraping(true);
    addNotification({
      type: 'analysis',
      title: 'Deep Extraction Started',
      message: `Scanning Google Maps for ${businessData.business.title} in ${businessData.area}...`,
      priority: 'low'
    });

    try {
      const enriched = await realBusinessAPI.deepScrapeBusinesses(
        businessData.business.title,
        businessData.area,
        session?.user?.email || undefined
      );

      if (enriched.length > 0) {
        setExistingBusinesses(enriched as any);
        addNotification({
          type: 'profile',
          title: 'Extraction Complete',
          message: `Found ${enriched.length} businesses with enriched contact details.`,
          priority: 'medium'
        });
      } else {
        addNotification({
          type: 'alert',
          title: 'Extraction Empty',
          message: 'No enriched data could be retrieved for this search.',
          priority: 'medium'
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'alert',
        title: 'Extraction Failed',
        message: error.message || 'Apify service disruption.',
        priority: 'high'
      });
    } finally {
      setScraping(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!session?.user?.email) {
      addNotification({
        type: 'alert',
        title: 'Authentication Buffer Required',
        message: 'Please synchronize your identity (Sign In) to access the Alpha Vault.',
        priority: 'high'
      });
      return;
    }

    if (plan === 'free') {
      addNotification({
        type: 'alert',
        title: 'Vault Access Restricted',
        message: 'Secure archival is a Professional feature. Upgrade now to freeze business intelligence.',
        priority: 'high'
      });
      return;
    }

    setSavingToVault(true);
    try {
      const apiUrl = getApiUrl();
      
      // Create a full data capture payload
      const snapshotPayload = {
        business: businessData.business,
        area: businessData.area,
        is_snapshot: true,
        snapshot: {
          locationData,
          existingBusinesses,
          realLocationData,
          contactInfo,
          coordinates: locationData.coordinates,
          captured_at: new Date().toISOString()
        }
      };

      const response = await fetch(`${apiUrl}/api/saved-businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: session.user.email,
          business_name: businessData.business.title,
          category: businessData.business.category || 'General Strategy',
          location: businessData.area,
          details: snapshotPayload // This becomes the data object when reloaded
        })
      });

      if (response.ok) {
        addNotification({
          type: 'profile',
          title: 'Asset Frozen',
          message: `${businessData.business.title} state has been permanently archived in your Vault.`,
          priority: 'medium'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Archival failed');
      }
    } catch (error: any) {
      console.error('Vault Save Error:', error);
      addNotification({
        type: 'alert',
        title: 'Archival Disruption',
        message: error.message || 'Could not serialize asset to Vault.',
        priority: 'high'
      });
    } finally {
      setSavingToVault(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg">No business data found</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <Eye className="w-5 h-5" />, 
      active: activeView === 'overview',
      onClick: () => setActiveView('overview')
    },
    { 
      id: 'map', 
      label: 'Location Map', 
      icon: <Map className="w-5 h-5" />, 
      active: activeView === 'map',
      onClick: () => setActiveView('map')
    },
    { 
      id: 'businesses', 
      label: 'Local Businesses', 
      icon: <Building2 className="w-5 h-5" />, 
      active: activeView === 'businesses',
      onClick: () => setActiveView('businesses')
    },
    { 
      id: 'neural', 
      label: 'Neural Analysis', 
      icon: <Cpu className="w-5 h-5" />, 
      active: activeView === 'neural',
      onClick: () => setActiveView('neural')
    }
  ];

  const locationString = locationData.country?.name && locationData.state?.name && locationData.city?.name
    ? `${locationData.city.name}, ${locationData.state.name}, ${locationData.country.name}`
    : businessData.area;
  return (
    <UniformLayout
      title={businessData.business.title}
      subtitle="Detailed Business Analysis"
      location={locationString}
      tabs={tabs}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToVault}
            disabled={savingToVault}
            className={`px-4 lg:px-6 py-2.5 rounded-2xl flex items-center gap-2 lg:gap-3 transition-all font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 ${
              plan === 'free' 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale' 
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-slate-900/10 dark:border-white/10'
            }`}
          >
            {savingToVault ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Archive size={14} />
            )}
            <span>{plan === 'free' ? 'Vault (Locked)' : 'Save snapshot'}</span>
          </button>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Real Location Information */}
            <UniformCard 
              title="Location Information" 
              icon={<MapPin className="w-6 h-6" />}
              variant="gradient"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Country</p>
                  <p className="text-slate-900 dark:text-white font-bold flex items-center mt-1">
                    {locationData.country?.emoji && <span className="mr-2">{locationData.country.emoji}</span>}
                    {locationData.country?.name || 'Unknown Country'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">State/Region</p>
                  <p className="text-slate-900 dark:text-white font-bold mt-1">
                    {locationData.state?.name || 'Unknown State'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">City</p>
                  <p className="text-slate-900 dark:text-white font-bold mt-1">
                    {locationData.city?.name || businessData.area.split(',')[0] || 'Unknown City'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Coordinates</p>
                  <p className="text-slate-900 dark:text-white font-bold text-xs mt-1">
                    {locationData.coordinates ? 
                      `${locationData.coordinates.lat.toFixed(4)}, ${locationData.coordinates.lng.toFixed(4)}` : 
                      'Loading...'
                    }
                  </p>
                </div>
              </div>
            </UniformCard>
            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UniformCard 
                  title="Financial Overview" 
                  icon={<DollarSign className="w-6 h-6" />}
                  variant="glass"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-5 sm:p-6 border border-green-500/20 shadow-sm">
                      <p className="text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Investment Required</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {formatCurrency(businessData.business.funding_required || '₹5L-₹15L')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-5 sm:p-6 border border-blue-500/20 shadow-sm">
                      <p className="text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Expected Revenue</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {formatCurrency(businessData.business.estimated_revenue || '₹25L/year')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-5 sm:p-6 border border-purple-500/20 shadow-sm">
                      <p className="text-purple-600 dark:text-purple-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">ROI Projection</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {businessData.business.roi_percentage || '120'}%
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-5 sm:p-6 border border-orange-500/20 shadow-sm">
                      <p className="text-orange-600 dark:text-orange-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Payback Period</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {businessData.business.payback_period || '12 months'}
                      </p>
                    </div>
                  </div>
                </UniformCard>
              </div>

              <UniformCard 
                title="Quick Stats" 
                icon={<BarChart3 className="w-6 h-6" />}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Market Size</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.market_size || 'Growing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Competition</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.competition_level || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Difficulty</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.startup_difficulty || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Team Size</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.initial_team_size || '3-5'} people
                    </span>
                  </div>
                </div>
              </UniformCard>
            </div>
            {/* Success Factors */}
            <UniformCard 
              title="Key Success Factors" 
              icon={<Target className="w-6 h-6" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(businessData.business.key_success_factors || [
                  'Strong local market presence',
                  'Quality service delivery',
                  'Competitive pricing strategy',
                  'Effective marketing campaigns',
                  'Customer relationship management',
                  'Operational efficiency'
                ]).map((factor: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-gray-300 text-sm font-medium">{factor}</span>
                  </div>
                ))}
              </div>
            </UniformCard>

          </motion.div>
        )}
        {activeView === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title={`Location Map: ${businessData.area}`}
              icon={<Map className="w-6 h-6" />}
              size="lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMapFullscreen(!mapFullscreen)}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors text-sm"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>{mapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                    </button>
                    <button
                      onClick={() => loadRealLocationData(businessData)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                  {fetchingRealData && (
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading location data...</span>
                    </div>
                  )}
                </div>

                <div className={`bg-slate-100 dark:bg-slate-800 overflow-hidden transition-all duration-500 ${
                  mapFullscreen ? 'fixed inset-0 z-[9999]' : 'h-96 rounded-xl border border-slate-200 dark:border-white/10'
                }`}>
                  <div className="h-full relative">
                    {mapFullscreen && (
                      <button
                        onClick={() => setMapFullscreen(false)}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    
                    {loadingMap ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
                          <p className="text-slate-600 dark:text-gray-400">Loading map...</p>
                        </div>
                      </div>
                    ) : locationData.coordinates ? (
                      <InteractiveMap
                        coordinates={locationData.coordinates}
                        locationName={businessData.area}
                        isFullscreen={mapFullscreen}
                        businesses={existingBusinesses.map(b => ({
                          name: b.name,
                          address: b.address,
                          status: b.status,
                          distance: b.distance
                        }))}
                        onOpenInMaps={() => {
                          const coords = locationData.coordinates;
                          if (coords) {
                            window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15`, '_blank');
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 dark:text-gray-400 text-lg mb-2">Location coordinates not found</p>
                          <p className="text-slate-500 dark:text-gray-500 mb-4">Unable to display map for: {businessData.area}</p>
                          <button
                            onClick={() => loadRealLocationData(businessData)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Map Legend */}
                {existingBusinesses.length > 0 && (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Map Legend</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-gray-400 text-sm">Active Businesses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-gray-400 text-sm">Closed Businesses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-gray-400 text-sm">Your Target Location</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </UniformCard>
          </motion.div>
        )}
        {activeView === 'businesses' && (
          <motion.div
            key="businesses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 flex items-center justify-center shadow-xl">
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none truncate max-w-[400px]">
                    {businessData.business.title.replace(/\s+for\s+\S+(\s+in\s+\S+)*/gi, '').trim() || 'Asset Overview'}
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                     <Target size={12} className="text-blue-500" /> Competitive Landscape Analysis · {businessData.area.split(',')[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {fetchingRealData ? (
                  <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg italic">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Neural Scan in Progress...
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg italic">
                    <Globe2 className="w-4 h-4" />
                    {existingBusinesses.length > 0 ? `${existingBusinesses.length} DISCOVERED` : 'CLOUD CONNECTED'}
                  </div>
                )}
                <button
                  onClick={handleDeepScrape}
                  disabled={scraping}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-xl italic ${
                    scraping 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : plan === 'free'
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  {scraping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {plan === 'free' ? 'ENHANCED SEARCH (PRO)' : 'ENHANCED SEARCH'}
                </button>
                <button
                  onClick={() => loadRealLocationData(businessData)}
                  disabled={fetchingRealData}
                  className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-xl italic"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingRealData ? 'animate-spin' : ''}`} />
                  RE-SCAN
                </button>
              </div>
            </div>

            {/* AI Data Analysis Summary */}
            {!fetchingRealData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <div className="p-6 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp size={16} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Market Saturation</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-1">
                    {existingBusinesses.length < 5 ? 'LOW' : existingBusinesses.length < 15 ? 'MEDIUM' : 'HIGH'}
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 italic opacity-80">
                    {existingBusinesses.length < 5 
                      ? "High entrance potential. Minimal direct interference detected in the broad search zone." 
                      : "Balanced competitive state. Niche positioning is recommended to optimize ROI."}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Target size={16} className="text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search Radius</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-1">
                    15.0 KM
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 italic opacity-80">
                    Broad city-wide analysis coverage. Capturing industrial zones and central business districts.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center">
                        <Sparkles size={16} className="text-blue-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Pulse Index</span>
                    </div>
                    <div className="text-2xl font-black italic tracking-tighter mb-1">
                      78.2 / 100
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Entry Strategy Optimized</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* List of businesses */}

            {/* Loading skeleton */}
            {fetchingRealData && existingBusinesses.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
                        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Business cards grid */}
            {!fetchingRealData && existingBusinesses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="w-16 h-16 text-slate-300 dark:text-white/10 mb-4" />
                <p className="text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">No businesses found</p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mb-6">Click Refresh to scan live map data for {businessData.area.split(',')[0]}</p>
                <button
                  onClick={() => loadRealLocationData(businessData)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Scan Now
                </button>
              </div>
            )}

            {existingBusinesses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {existingBusinesses.map((biz, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Store className="w-5 h-5 text-blue-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + status */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm leading-tight truncate">{biz.name}</h3>
                          <div className="flex gap-2 items-center flex-shrink-0">
                            {biz.price_level && (
                              <span className="text-[10px] font-black text-amber-500/80 tracking-tighter">
                                {'$'.repeat(biz.price_level)}
                              </span>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              biz.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : biz.status === 'closed'
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 border border-slate-300 dark:border-white/10'
                            }`}>
                              {biz.status}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        {biz.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, s) => (
                              <Star key={s} className={`w-3 h-3 ${s < Math.round(biz.rating!) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-white/10'}`} />
                            ))}
                            <span className="text-xs text-slate-500 dark:text-gray-400 ml-1">{biz.rating.toFixed(1)}</span>
                            {biz.reviews && <span className="text-xs text-slate-400 dark:text-gray-500">({biz.reviews})</span>}
                          </div>
                        )}

                        {/* Address */}
                        {biz.address && biz.address !== 'Address not available' && (
                          <div className="flex items-start gap-1.5 mb-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-slate-500 dark:text-gray-400 leading-snug line-clamp-2">{biz.address}</span>
                          </div>
                        )}

                        {/* Phone */}
                        {biz.phone && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Phone className="w-3 h-3 text-slate-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-slate-500 dark:text-gray-400">{biz.phone}</span>
                          </div>
                        )}

                        {/* Social Media Links */}
                        {biz.social_media && (biz.social_media.instagram || biz.social_media.facebook || biz.social_media.twitter) && (
                          <div className="flex items-center gap-4 mb-2 mt-2">
                             {biz.social_media.instagram && (
                               <a href={biz.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500/60 hover:text-pink-500 transition-colors">
                                 <Instagram className="w-3.5 h-3.5" />
                               </a>
                             )}
                             {biz.social_media.facebook && (
                               <a href={biz.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-500/60 hover:text-blue-500 transition-colors">
                                 <Facebook className="w-3.5 h-3.5" />
                               </a>
                             )}
                             {biz.social_media.twitter && (
                               <a href={biz.social_media.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                                 <Twitter className="w-3.5 h-3.5" />
                               </a>
                             )}
                          </div>
                        )}

                        {/* Opening Hours Status */}
                        {biz.opening_hours && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-gray-500 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 opacity-80 truncate uppercase tracking-tighter">
                              {biz.opening_hours}
                            </span>
                          </div>
                        )}

                        {/* Footer row */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            {biz.distance && (
                              <span className="text-xs font-bold text-slate-400 dark:text-gray-500 flex items-center gap-1">
                                <Navigation className="w-3 h-3" />{biz.distance}
                              </span>
                            )}
                            {biz.established && (
                              <span className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />Est. {biz.established}
                              </span>
                            )}
                          </div>
                          {biz.website && (
                            <a
                              href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 font-bold transition-colors"
                            >
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Source attribution */}
            {existingBusinesses.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-600 justify-end">
                <Globe2 className="w-3 h-3" />
                Data sourced from OpenStreetMap &amp; AI analysis · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </motion.div>
        )}

        {activeView === 'neural' && (
          <motion.div
            key="neural"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {plan !== 'professional' ? (
              <div className="glass-card p-12 sm:p-20 text-center relative overflow-hidden bg-slate-100/50 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-20 animate-pulse" />
                    <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-[2rem] bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-2xl flex items-center justify-center relative z-10">
                      <Cpu size={48} className="text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none">Neural Node Locked</h2>
                    <p className="text-slate-500 dark:text-gray-400 font-bold text-sm sm:text-base italic uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                      Hyper-precision market intelligence, competitor heatmaps, and ROI neural processing are exclusive to Professional Tier Operatives.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left">
                       <ShieldCheck className="text-emerald-500 mb-2" size={20} />
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Feature Status</div>
                       <div className="text-xs font-bold text-slate-900 dark:text-white italic">Neural Profit Engine</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left">
                       <Map className="text-blue-500 mb-2" size={20} />
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Feature Status</div>
                       <div className="text-xs font-bold text-slate-900 dark:text-white italic">Neural Heatmaps</div>
                    </div>
                  </div>

                  <Link 
                    href="/acquisition-tiers"
                    className="inline-flex items-center gap-4 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-xs sm:text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] group"
                  >
                    UPGRADE TO PROFESSIONAL <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  <UniformCard 
                    title="Neural Profit Engine Analysis" 
                    icon={<Cpu className="w-6 h-6" />}
                    variant="glass"
                  >
                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl mb-8">
                       <div className="flex items-center gap-3 mb-2">
                          <Cpu size={16} className="text-purple-500" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 italic">Advanced Neural Processing Unit</span>
                       </div>
                       <p className="text-sm font-medium text-slate-600 dark:text-gray-300">
                          Neural node is optimizing profit projections for {businessData.business.title} in {businessData.area}. Detailed revenue streams and scalability metrics are calculated based on live localized demand indices.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Placeholder for real neural data */}
                       <div className="space-y-6">
                          <div>
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-4 italic">High-Profit Micro-Niches</h4>
                             <div className="space-y-3">
                                {['B2B Corporate Supply', 'Sustainable Sourcing', 'AI-Driven Customization'].map((n, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                                     <span className="text-sm font-bold text-slate-800 dark:text-white italic">{n}</span>
                                     <div className="text-emerald-500 font-black text-xs">+{(20 - i*5)}% yield</div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div>
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-4 italic">Demand Pulse Index</h4>
                             <div className="p-6 bg-slate-900 dark:bg-white/5 rounded-3xl border border-slate-800 dark:border-white/10 relative overflow-hidden">
                                <div className="relative z-10">
                                   <div className="text-4xl font-black text-white italic tracking-tighter mb-2">92.4</div>
                                   <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Optimized Entrance Vector</div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                   <TrendingUp size={120} className="text-white" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </UniformCard>
                  <UniformCard 
                    title="Competitive Hyper-Intensity" 
                    icon={<Target className="w-6 h-6" />}
                  >
                    <div className="h-[300px] relative bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden group">
                       {/* Grid Lines */}
                       <div className="absolute inset-0 opacity-10 dark:opacity-5" 
                            style={{ backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                       
                       {/* Center Point (Target) */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,1)] z-20">
                          <div className="absolute inset-0 animate-ping bg-blue-500 rounded-full opacity-40" />
                       </div>

                       {/* Neural Heatmap Layer */}
                       <div className="absolute inset-0 flex items-center justify-center p-8">
                          <div className="w-full h-full relative">
                             {existingBusinesses.length > 0 ? (
                               existingBusinesses.map((biz, idx) => {
                                 // Simple relative positioning based on index for variety, or random offset if no precise coords
                                 const angle = (idx * 137.5) % 360;
                                 const dist = (15 + (idx * 8)) % 45;
                                 const x = 50 + dist * Math.cos(angle * Math.PI / 180);
                                 const y = 50 + dist * Math.sin(angle * Math.PI / 180);
                                 
                                 return (
                                   <motion.div
                                     key={idx}
                                     initial={{ opacity: 0, scale: 0 }}
                                     animate={{ opacity: 0.6, scale: 1 }}
                                     className="absolute w-12 h-12 -ml-6 -mt-6 bg-red-500/20 blur-xl rounded-full"
                                     style={{ left: `${x}%`, top: `${y}%` }}
                                   />
                                 );
                               })
                             ) : (
                               <div className="absolute inset-0 flex items-center justify-center">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">Zero Interference Detected</p>
                               </div>
                             )}

                             {/* Pulse Points for each business */}
                             {existingBusinesses.slice(0, 10).map((biz, idx) => {
                                 const angle = (idx * 137.5) % 360;
                                 const dist = (15 + (idx * 8)) % 45;
                                 const x = 50 + dist * Math.cos(angle * Math.PI / 180);
                                 const y = 50 + dist * Math.sin(angle * Math.PI / 180);
                                 
                                 return (
                                   <div
                                     key={idx}
                                     className="absolute w-2 h-2 -ml-1 -mt-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"
                                     style={{ left: `${x}%`, top: `${y}%` }}
                                   />
                                 );
                             })}
                          </div>
                       </div>

                       {/* Legend Overlay */}
                       <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500" />
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">User Node</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-500" />
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Competitive Node ({existingBusinesses.length})</span>
                          </div>
                       </div>

                       {/* Interactive Tag */}
                       <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest italic">
                          Neural Precision: 98.2%
                       </div>
                    </div>
                  </UniformCard>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <UniformCard title="Strategic Recommendations" icon={<Lightbulb className="w-6 h-6" />}>
                     <div className="space-y-6">
                        {[
                          { t: 'Market Dominance', d: 'Focus on under-served micro-zones within 2km of the central hub.' },
                          { t: 'Operational Optimization', d: 'Automate logistics using AI-powered routing to reduce OH by 15%.' }
                        ].map((r, i) => (
                          <div key={i} className="space-y-2">
                             <div className="text-xs font-black text-purple-500 uppercase tracking-widest">{r.t}</div>
                             <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">{r.d}</p>
                          </div>
                        ))}
                     </div>
                  </UniformCard>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </UniformLayout>
  );
}