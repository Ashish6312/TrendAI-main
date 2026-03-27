"use client";

import React from "react";
import { Download, FileText, Calculator, CheckSquare, ArrowLeft, Star, Crown, Zap, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/context/SubscriptionContext";
import { useSession } from "next-auth/react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ResourcesPage() {
  const router = useRouter();
  const { plan, theme, planFeatures } = useSubscription();
  const { data: session } = useSession();

  const resources = [
    {
      title: "Market Analysis Template",
      description: "Professional template for conducting comprehensive market analysis",
      icon: FileText,
      fileSize: "2.3 MB",
      format: "PDF",
      requiredPlan: "free",
      downloadUrl: "/templates/market-analysis-template.pdf"
    },
    {
      title: "Business Plan Guide",
      description: "Step-by-step guide to creating winning business plans",
      icon: FileText,
      fileSize: "4.1 MB",
      format: "PDF",
      requiredPlan: "professional",
      downloadUrl: "/guides/business-plan-guide.pdf"
    },
    {
      title: "ROI Calculator",
      description: "Advanced spreadsheet for calculating return on investment",
      icon: Calculator,
      fileSize: "1.8 MB",
      format: "XLSX",
      requiredPlan: "professional",
      downloadUrl: "/tools/roi-calculator.xlsx"
    },
    {
      title: "Market Research Checklist",
      description: "Complete checklist for thorough market research",
      icon: CheckSquare,
      fileSize: "0.9 MB",
      format: "PDF",
      requiredPlan: "free",
      downloadUrl: "/checklists/market-research.pdf"
    },
    {
      title: "Competitive Analysis Framework",
      description: "Framework for analyzing competitors and market positioning",
      icon: FileText,
      fileSize: "3.2 MB",
      format: "PDF",
      requiredPlan: "enterprise",
      downloadUrl: "/frameworks/competitive-analysis.pdf"
    },
    {
      title: "Financial Projection Model",
      description: "Advanced Excel model for financial forecasting",
      icon: Calculator,
      fileSize: "2.7 MB",
      format: "XLSX",
      requiredPlan: "enterprise",
      downloadUrl: "/models/financial-projection.xlsx"
    }
  ];

  const planIcons: Record<string, any> = {
    free: Star,
    starter: Target,
    professional: Zap,
    growth: TrendingUp,
    enterprise: Crown
  };

  const planColors: Record<string, string> = {
    free: "#10b981",
    starter: "#3b82f6",
    professional: "#8b5cf6", 
    growth: "#eab308",
    enterprise: "#c026d3"
  };

  const canAccessResource = (requiredPlan: string) => {
    const planHierarchy: Record<string, number> = { free: 0, starter: 1, professional: 2, growth: 3, enterprise: 4 };
    return planHierarchy[plan as keyof typeof planHierarchy] >= planHierarchy[requiredPlan as keyof typeof planHierarchy];
  };

  const handleDownload = (resource: any) => {
    if (!canAccessResource(resource.requiredPlan)) {
      alert(`This resource requires ${resource.requiredPlan} plan or higher. Please upgrade your subscription.`);
      router.push('/acquisition-tiers');
      return;
    }

    // In a real app, this would trigger an actual download
    // For now, we'll simulate it
    const link = document.createElement('a');
    link.href = resource.downloadUrl;
    link.download = resource.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert(`${resource.title} download started!`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500">
        <div className="responsive-container py-8 md:py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8"
          >
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all group font-black uppercase tracking-widest text-[10px]"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="responsive-text-sm">Back</span>
            </button>
            
            <div>
              <h1 className="responsive-text-2xl md:responsive-text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">Resource Library</h1>
              <p className="text-slate-500 dark:text-gray-400 responsive-text-sm font-black uppercase tracking-widest text-[9px] opacity-70">Exclusive templates, guides, and tools for your business success</p>
            </div>
          </motion.div>

          {/* Plan Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8 responsive-p-md md:responsive-p-lg rounded-xl md:rounded-2xl border backdrop-blur-sm"
            style={{ 
              backgroundColor: `${theme.primary}15`,
              borderColor: `${theme.primary}40`
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 md:p-3 rounded-lg md:rounded-xl"
                  style={{ backgroundColor: `${theme.primary}20` }}
                >
                  {React.createElement(planIcons[plan], { size: 20, color: theme.primary, className: "md:w-6 md:h-6" })}
                </div>
                <div>
                  <h3 className="responsive-text-lg md:responsive-text-xl font-black text-slate-900 dark:text-white italic tracking-tight uppercase">{planFeatures.planName} Strategic Plan</h3>
                  <p className="text-slate-500 dark:text-gray-400 responsive-text-sm font-medium">Access to {plan === 'free' ? 'basic' : plan === 'professional' ? 'advanced' : 'all'} business resources</p>
                </div>
              </div>
              {plan === 'free' && (
                <Link 
                  href="/acquisition-tiers"
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all hover:scale-105 text-center responsive-text-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: 'white'
                  }}
                >
                  Upgrade for More Resources
                </Link>
              )}
            </div>
          </motion.div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {resources.map((resource, index) => {
              const canAccess = canAccessResource(resource.requiredPlan);
              const RequiredPlanIcon = planIcons[resource.requiredPlan as keyof typeof planIcons];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`responsive-p-md md:responsive-p-lg rounded-xl md:rounded-2xl border backdrop-blur-sm transition-all hover:scale-105 ${
                    canAccess 
                      ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-800/70 shadow-lg' 
                      : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div 
                      className="p-2 md:p-3 rounded-lg md:rounded-xl"
                      style={{ 
                        backgroundColor: canAccess ? `${planColors[resource.requiredPlan as keyof typeof planColors]}20` : '#374151',
                        color: canAccess ? planColors[resource.requiredPlan as keyof typeof planColors] : '#9ca3af'
                      }}
                    >
                      <resource.icon size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <RequiredPlanIcon size={14} className="md:w-4 md:h-4" style={{ color: planColors[resource.requiredPlan as keyof typeof planColors] }} />
                      <span className="responsive-text-xs font-semibold capitalize" style={{ color: planColors[resource.requiredPlan as keyof typeof planColors] }}>
                        {resource.requiredPlan}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="responsive-text-lg md:responsive-text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight italic uppercase">{resource.title}</h3>
                  <p className="text-slate-500 dark:text-gray-400 responsive-text-sm mb-3 md:mb-4 font-medium leading-relaxed">{resource.description}</p>
                  
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-3 md:gap-4 responsive-text-xs text-slate-400 dark:text-gray-500 font-black uppercase tracking-widest text-[9px]">
                      <span>{resource.format}</span>
                      <span>•</span>
                      <span>{resource.fileSize}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(resource)}
                    disabled={!canAccess}
                    className={`w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all responsive-text-sm ${
                      canAccess
                        ? 'hover:scale-105 text-white'
                        : 'cursor-not-allowed bg-gray-600 text-gray-400'
                    }`}
                    style={canAccess ? { 
                      background: `linear-gradient(135deg, ${planColors[resource.requiredPlan as keyof typeof planColors]}, ${planColors[resource.requiredPlan as keyof typeof planColors]}dd)`
                    } : {}}
                  >
                    <Download size={14} className="md:w-4 md:h-4" />
                    {canAccess ? 'Download' : 'Upgrade Required'}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 md:mt-12 text-center"
          >
            <p className="text-slate-500 dark:text-gray-400 mb-3 md:mb-4 responsive-text-sm font-black uppercase tracking-widest text-[9px]">
              Need more resources? Contact our support team for custom templates and guides.
            </p>
            <Link 
              href="mailto:StarterScope7@gmail.com"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors responsive-text-sm"
            >
              StarterScope7@gmail.com
            </Link>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}