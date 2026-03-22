"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/config/api";

export type SubscriptionPlan = 'free' | 'professional' | 'enterprise';

export interface SubscriptionTheme {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  badge: string;
  glow: string;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  theme: SubscriptionTheme;
  setPlan: (plan: SubscriptionPlan) => void;
  isSubscribed: boolean;
  planFeatures: {
    maxAnalyses: number;
    advancedFeatures: boolean;
    prioritySupport: boolean;
    customReports: boolean;
    apiAccess: boolean;
    competitorInsights: boolean;
    realTimeAlerts: boolean;
    exportToPdf: boolean;
    customBranding: boolean;
    dedicatedManager: boolean;
    whiteLabel: boolean;
    phoneSupport: boolean;
    advancedDashboard: boolean;
    customDataSources: boolean;
    planName: string;
    planDescription: string;
  };
  canAccessFeature: (feature: keyof typeof planFeatures.free) => boolean;
  getRemainingAnalyses: (currentCount: number) => number;
  hasReachedAnalysisLimit: (currentCount: number) => boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const themes: Record<SubscriptionPlan, SubscriptionTheme> = {
  free: {
    primary: '#6b7280', // Gray
    secondary: '#9ca3af',
    accent: '#3b82f6', // Blue
    gradient: 'from-gray-600 to-gray-500',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    glow: 'shadow-[0_0_30px_-5px_rgba(107,114,128,0.4)]'
  },
  professional: {
    primary: '#10b981', // Emerald
    secondary: '#34d399',
    accent: '#059669',
    gradient: 'from-emerald-600 to-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    glow: 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]'
  },
  enterprise: {
    primary: '#8b5cf6', // Purple
    secondary: '#a78bfa',
    accent: '#7c3aed',
    gradient: 'from-purple-600 to-purple-500',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    glow: 'shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]'
  }
};

const planFeatures = {
  free: {
    maxAnalyses: 5,
    advancedFeatures: false,
    prioritySupport: false,
    customReports: false,
    apiAccess: false,
    competitorInsights: false,
    realTimeAlerts: false,
    exportToPdf: false,
    customBranding: false,
    dedicatedManager: false,
    whiteLabel: false,
    phoneSupport: false,
    advancedDashboard: false,
    customDataSources: false,
    planName: 'Starter',
    planDescription: 'Essential AI tools to help you find and explore new business ideas.'
  },
  professional: {
    maxAnalyses: -1, // Unlimited
    advancedFeatures: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: false,
    competitorInsights: true,
    realTimeAlerts: true,
    exportToPdf: true,
    customBranding: true,
    dedicatedManager: false,
    whiteLabel: false,
    phoneSupport: false,
    advancedDashboard: true,
    customDataSources: false,
    planName: 'Professional',
    planDescription: 'Unlimited business scans and advanced insights for growing entrepreneurs.'
  },
  enterprise: {
    maxAnalyses: -1, // Unlimited
    advancedFeatures: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: true,
    competitorInsights: true,
    realTimeAlerts: true,
    exportToPdf: true,
    customBranding: true,
    dedicatedManager: true,
    whiteLabel: true,
    phoneSupport: true,
    advancedDashboard: true,
    customDataSources: true,
    planName: 'Territorial Dominance',
    planDescription: 'Complete business solutions with API access and dedicated support for large organizations.'
  }
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [plan, setPlanState] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Ensure plan is always valid
  const validPlan = plan && ['free', 'professional', 'enterprise'].includes(plan) ? plan : 'free';

  // Force refresh function
  const forceRefreshPlan = async () => {
    if (!session?.user?.email) return;
    
    const email = session.user.email.toLowerCase().trim();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      console.log('🔄 Force refreshing subscription plan...');
      const response = await fetch(`${apiUrl}/api/subscriptions/${email}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Force refresh - Subscription data:', data);
        
        // Enhanced mapping for plan names with fuzzy matching
        const rawPlanName = data.plan_name?.toLowerCase() || '';
        const rawDisplayName = data.plan_display_name?.toLowerCase() || '';
        
        let planToSet: SubscriptionPlan = 'free';
        
        // Check for enterprise plans with fuzzy matching
        if (rawPlanName.includes('enterprise') || 
            rawDisplayName.includes('enterprise') ||
            rawDisplayName.includes('territorial') ||
            rawDisplayName.includes('dominance') ||
            rawDisplayName.includes('dominator')) {
          planToSet = 'enterprise';
        }
        // Check for professional plans with fuzzy matching
        else if (rawPlanName.includes('professional') || 
                 rawPlanName.includes('pro') || 
                 rawDisplayName.includes('professional') ||
                 rawDisplayName.includes('growth') ||
                 rawDisplayName.includes('architect') ||
                 rawDisplayName.includes('accelerator') ||
                 rawDisplayName.includes('pro')) {
          planToSet = 'professional';
        }
        // Default to free for anything else
        else {
          planToSet = 'free';
        }

        console.log('🔄 Force refresh - Plan mapped to:', planToSet, 'from:', rawPlanName, rawDisplayName);
        setPlanState(planToSet);
        localStorage.setItem(`subscription_${email}`, planToSet);
        
        return planToSet;
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
    
    return null;
  };

  // Load subscription plan from API or localStorage
  useEffect(() => {
    const loadUserPlan = async () => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim();
        const apiUrl = getApiUrl();

        // 1. Check local cache FIRST for instant UI response
        const cachedPlan = localStorage.getItem(`subscription_${email}`);
        if (cachedPlan && ['free', 'professional', 'enterprise'].includes(cachedPlan)) {
          setPlanState(cachedPlan as SubscriptionPlan);
          setIsLoading(false);
        } else {
          setIsLoading(true);
        }

        try {
          // 2. Always verify with API (force refresh)
          const refreshedPlan = await forceRefreshPlan();
          if (refreshedPlan) {
            console.log('✅ Plan successfully refreshed to:', refreshedPlan);
          }
        } catch (err) {
          console.error('❌ AI Terminal: Subscription fetch error:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUserPlan();
  }, [session?.user?.email]);

  const setPlan = (newPlan: SubscriptionPlan) => {
    // Validate the new plan before proceeding
    if (!newPlan || !['free', 'professional', 'enterprise'].includes(newPlan)) {
      console.warn('Invalid plan provided to setPlan:', newPlan);
      return;
    }

    // Additional safety check for browser environment
    if (typeof window === 'undefined') {
      console.warn('setPlan called in non-browser environment');
      return;
    }

    setPlanState(newPlan);
    if (session?.user?.email) {
      localStorage.setItem(`subscription_${session.user.email}`, newPlan);
    }
    
    // Update CSS custom properties for theme with extra safety
    const theme = themes[newPlan];
    if (theme && theme.primary && theme.secondary && theme.accent) {
      try {
        if (document?.documentElement?.style) {
          document.documentElement.style.setProperty('--subscription-primary', theme.primary);
          document.documentElement.style.setProperty('--subscription-secondary', theme.secondary);
          document.documentElement.style.setProperty('--subscription-accent', theme.accent);
        }
      } catch (error) {
        console.error('Error setting CSS properties:', error);
      }
    } else {
      console.warn('Theme not found or incomplete for plan:', newPlan, theme);
    }
    
    // Add plan-specific body class for global styling
    try {
      if (document?.body) {
        document.body.className = document.body.className.replace(/plan-\w+/g, '');
        document.body.classList.add(`plan-${newPlan}`);
      }
    } catch (error) {
      console.error('Error updating body class:', error);
    }
  };

  // Apply theme on mount and plan change
  useEffect(() => {
    // Browser environment check
    if (typeof window === 'undefined') return;
    
    const theme = themes[validPlan];
    if (theme && theme.primary && theme.secondary && theme.accent) {
      try {
        if (document?.documentElement?.style) {
          document.documentElement.style.setProperty('--subscription-primary', theme.primary);
          document.documentElement.style.setProperty('--subscription-secondary', theme.secondary);
          document.documentElement.style.setProperty('--subscription-accent', theme.accent);
        }
        
        // Add plan-specific body class
        if (document?.body) {
          document.body.className = document.body.className.replace(/plan-\w+/g, '');
          document.body.classList.add(`plan-${validPlan}`);
        }
      } catch (error) {
        console.error('Error applying theme:', error);
      }
    }
  }, [validPlan]);

  const isSubscribed = plan !== 'free';

  // Plan enforcement functions
  const canAccessFeature = (feature: keyof typeof planFeatures.free): boolean => {
    const currentPlanFeatures = planFeatures[plan as SubscriptionPlan];
    return !!currentPlanFeatures[feature as keyof typeof currentPlanFeatures];
  };

  const getRemainingAnalyses = (currentCount: number): number => {
    const currentPlanFeatures = planFeatures[plan as SubscriptionPlan];
    const maxAnalyses = currentPlanFeatures.maxAnalyses;
    if (maxAnalyses === -1) return -1; // Unlimited
    return Math.max(0, maxAnalyses - currentCount);
  };

  const hasReachedAnalysisLimit = (currentCount: number): boolean => {
    const currentPlanFeatures = planFeatures[plan as SubscriptionPlan];
    const maxAnalyses = currentPlanFeatures.maxAnalyses;
    if (maxAnalyses === -1) return false; // Unlimited
    return currentCount >= maxAnalyses;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SubscriptionContext.Provider value={{
      plan: validPlan,
      theme: themes[validPlan] || themes.free, // Double fallback safety
      setPlan,
      isSubscribed: validPlan !== 'free',
      planFeatures: planFeatures[validPlan] || planFeatures.free, // Double fallback safety
      canAccessFeature,
      getRemainingAnalyses,
      hasReachedAnalysisLimit,
      isLoading
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}