"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/config/api";

export type SubscriptionPlan = 'free' | 'starter' | 'professional';

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
  actualPlanName: string;
  theme: SubscriptionTheme;
  setPlan: (plan: SubscriptionPlan) => void;
  isSubscribed: boolean;
  planFeatures: {
    maxAnalyses: number;
    maxVaultSaves: number;
    advancedFeatures: boolean;
    prioritySupport: boolean;
    customReports: boolean;
    apiAccess: boolean;
    competitorInsights: boolean;
    realTimeAlerts: boolean;
    exportToPdf: boolean;
    roadmapAccess: boolean;
    planName: string;
    planDescription: string;
  };
  canAccessFeature: (feature: keyof typeof planFeatures.free) => boolean;
  getRemainingAnalyses: (currentCount: number) => number;
  hasReachedAnalysisLimit: (currentCount: number) => boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const themes: Record<SubscriptionPlan, SubscriptionTheme> = {
  free: {
    primary: '#64748b', // Slate
    secondary: '#94a3b8',
    accent: '#475569',
    gradient: 'from-slate-600 to-slate-500',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    glow: 'shadow-[0_0_30px_-5px_rgba(100,116,139,0.3)]'
  },
  starter: {
    primary: '#0891b2', // Cyan (Branding)
    secondary: '#06b6d4',
    accent: '#0e7490',
    gradient: 'from-cyan-600 to-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    glow: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)]'
  },
  professional: {
    primary: '#2563eb', // Royal Blue
    secondary: '#3b82f6',
    accent: '#1d4ed8',
    gradient: 'from-blue-600 to-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    glow: 'shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]'
  }
};

const planFeatures = {
  free: {
    maxAnalyses: 1, // Registration gift: 1 high-precision business scan
    maxVaultSaves: 0,
    advancedFeatures: false, // Neural Profit Engine
    prioritySupport: false,
    customReports: false,
    apiAccess: false,
    competitorInsights: false, // Heatmaps
    realTimeAlerts: false,
    exportToPdf: false,
    roadmapAccess: false,
    planName: 'Explorer',
    planDescription: 'Registration gift: 1 high-precision business scan.'
  },
  starter: {
    maxAnalyses: 100, // 100 recommendations/month
    maxVaultSaves: 5, // Alpha Vault (5 Saves)
    advancedFeatures: false,
    prioritySupport: false,
    customReports: false,
    apiAccess: false,
    competitorInsights: false,
    realTimeAlerts: false, 
    exportToPdf: false,
    roadmapAccess: false,
    planName: 'Starter',
    planDescription: '100 Monthly Insights & Alpha Vault archival (5 assets).'
  },
  professional: {
    maxAnalyses: -1, // Unlimited
    maxVaultSaves: -1, // Unlimited
    advancedFeatures: true, // Neural Profit Engine
    prioritySupport: true,
    customReports: true,
    apiAccess: true,
    competitorInsights: true, // Heatmaps
    realTimeAlerts: true,
    exportToPdf: true,
    roadmapAccess: true, // 6-Month Strategic Roadmaps
    planName: 'Professional',
    planDescription: 'Unlimited business insights, Neural Profit Engine, and Elite Alpha Vault access for professional growth.'
  }
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [plan, setPlanState] = useState<SubscriptionPlan>('free');
  const [actualPlanName, setActualPlanName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Ensure plan is always valid
  const validPlan = plan && ['free', 'starter', 'professional'].includes(plan) ? plan : 'free';

  // Fetch subscription plan from the authoritative profile endpoint
  const fetchSubscriptionPlan = async (): Promise<SubscriptionPlan | null> => {
    if (!session?.user?.email) return null;
    
    const email = session.user.email.toLowerCase().trim();
    const apiUrl = getApiUrl();
    
    console.log('🔗 Subscription API URL:', apiUrl);
    console.log('👤 Fetching subscription for:', email);
    
    try {
      // Use the profile endpoint which reconciles payment history (source of truth)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/api/subscriptions/${email}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Enhanced mapping for plan names with fuzzy matching
        const rawPlanName = (data.plan_name || '').toLowerCase();
        const rawDisplayName = (data.plan_display_name || '').toLowerCase();
        
        let planToSet: SubscriptionPlan = 'free';
        
        if (rawPlanName.includes('starter') || 
            rawDisplayName.includes('starter') ||
            rawDisplayName.includes('venture') ||
            rawDisplayName.includes('strategist')) {
          planToSet = 'starter';
        } else if (rawPlanName.includes('professional') || 
                   rawPlanName.includes('pro') || 
                   rawDisplayName.includes('professional') ||
                   rawPlanName.includes('enterprise') || 
                   rawPlanName.includes('growth') ||
                   rawDisplayName.includes('enterprise') ||
                   rawDisplayName.includes('dominance') ||
                   rawDisplayName.includes('accelerator') ||
                   rawDisplayName.includes('pro')) {
          planToSet = 'professional';
        } else {
          planToSet = 'free';
        }

        // We use the normalized new display names instead of old messy DB data if they are legacy
        const actualName = planToSet === 'professional' ? 'Professional' : 
                           planToSet === 'starter' ? 'Starter' : '';
                           
        setPlanState(planToSet);
        setActualPlanName(actualName);
        localStorage.setItem(`subscription_${email}`, planToSet);
        localStorage.setItem(`subscription_name_${email}`, actualName);
        return planToSet;
      } else {
        console.warn(`⚠️ Subscription API returned ${response.status}, using cached plan`);
        // Try to use cached plan
        const cachedPlan = localStorage.getItem(`subscription_${email}`) as SubscriptionPlan;
        if (cachedPlan && ['free', 'starter', 'professional'].includes(cachedPlan)) {
          setPlanState(cachedPlan);
          return cachedPlan;
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Subscription fetch timed out, using cached plan');
      } else {
        console.warn('⚠️ Subscription fetch failed, using cached plan:', error.message);
      }
      
      // Try to use cached plan on error
      const cachedPlan = localStorage.getItem(`subscription_${email}`) as SubscriptionPlan;
      if (cachedPlan && ['free', 'starter', 'professional'].includes(cachedPlan)) {
        setPlanState(cachedPlan);
        return cachedPlan;
      }
    }
    
    return null;
  };

  // Load subscription plan from API (payment history is source of truth)
  useEffect(() => {
    const loadUserPlan = async () => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim();
        
        // Show cached plan immediately (instant UI, no flicker)
        const cachedPlan = localStorage.getItem(`subscription_${email}`);
        const cachedPlanName = localStorage.getItem(`subscription_name_${email}`);
        if (cachedPlan && ['free', 'starter', 'professional'].includes(cachedPlan)) {
          setPlanState(cachedPlan as SubscriptionPlan);
          if (cachedPlanName) setActualPlanName(cachedPlanName);
        }
        // Always re-fetch from backend (always overrides with truth)
        try {
          await fetchSubscriptionPlan();
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
    if (!newPlan || !['free', 'starter', 'professional'].includes(newPlan)) {
      console.warn('Invalid plan provided to setPlan:', newPlan);
      return;
    }

    // Additional safety check for browser environment
    if (typeof window === 'undefined') {
      console.warn('setPlan called in non-browser environment');
      return;
    }

    setPlanState(newPlan);
    
    // Set actual plan name based on the new plan
    const newActualName = newPlan === 'professional' ? 'Professional' : 
                          newPlan === 'starter' ? 'Starter' : 'Free';
    setActualPlanName(newActualName);

    if (session?.user?.email) {
      localStorage.setItem(`subscription_${session.user.email}`, newPlan);
      localStorage.setItem(`subscription_name_${session.user.email}`, newActualName);
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
        const classList = Array.from(document.body.classList);
        classList.forEach(cls => {
          if (cls.startsWith('plan-')) document.body.classList.remove(cls);
        });
        document.body.classList.add(`plan-${newPlan}`);
      }
    } catch (error) {
      console.error('Error updating body class:', error);
    }
  };

  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscriptionPlan();
    setIsLoading(false);
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
    const currentPlanFeatures = planFeatures[validPlan as SubscriptionPlan];
    return !!currentPlanFeatures[feature as keyof typeof currentPlanFeatures];
  };

  const getRemainingAnalyses = (currentCount: number): number => {
    const currentPlanFeatures = planFeatures[validPlan as SubscriptionPlan];
    const maxAnalyses = currentPlanFeatures.maxAnalyses;
    if (maxAnalyses === -1) return -1; // Unlimited
    return Math.max(0, maxAnalyses - currentCount);
  };

  const hasReachedAnalysisLimit = (currentCount: number): boolean => {
    const currentPlanFeatures = planFeatures[validPlan as SubscriptionPlan];
    const maxAnalyses = currentPlanFeatures.maxAnalyses;
    if (maxAnalyses === -1) return false; // Unlimited
    return currentCount >= maxAnalyses;
  };

  // Performance Optimization: We no longer block the whole app with a global loader.
  // The app will render immediately using cached state, then quietly update once API returns.

  return (
    <SubscriptionContext.Provider value={{
      plan: validPlan,
      actualPlanName: actualPlanName || planFeatures[validPlan]?.planName || '',
      theme: themes[validPlan] || themes.free, // Double fallback safety
      setPlan,
      isSubscribed: validPlan !== 'free',
      planFeatures: planFeatures[validPlan] || planFeatures.free, // Double fallback safety
      canAccessFeature,
      getRemainingAnalyses,
      hasReachedAnalysisLimit,
      isLoading,
      refreshSubscription
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