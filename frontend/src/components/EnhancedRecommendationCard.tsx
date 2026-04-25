'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Star,
  Zap,
  BarChart3,
  Shield,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';

interface RecommendationData {
  business_name: string;
  description: string;
  market_gap: string;
  target_audience: string;
  investment_range: string;
  roi_potential: string;
  implementation_difficulty: string;
  market_size?: string;
  competitive_advantage?: string;
  revenue_model?: string;
  key_success_factors?: string;
  category?: string;
  ideal_neighborhood?: string;
  potential_revenue?: string;
  cac?: string;
  ai_source?: string;
  six_month_plan?: (string | { month: string; goal: string })[];
}

interface EnhancedRecommendationCardProps {
  recommendation: RecommendationData;
  index: number;
  onSave?: (rec: RecommendationData) => void;
  onViewDetails?: (rec: RecommendationData) => void;
  saving?: boolean;
}

export default function EnhancedRecommendationCard({ 
  recommendation, 
  index, 
  onSave, 
  onViewDetails,
  saving
}: EnhancedRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse ROI potential
  const getRoiColor = (roi: string) => {
    const roiLower = roi.toLowerCase();
    if (roiLower.includes('high') || roiLower.includes('60%') || roiLower.includes('70%')) {
      return 'text-emerald-500 bg-emerald-500/5 border-slate-700/50';
    } else if (roiLower.includes('medium') || roiLower.includes('30%') || roiLower.includes('40%')) {
      return 'text-blue-500 bg-blue-500/5 border-slate-700/50';
    }
    return 'text-slate-400 bg-slate-800 border-slate-700/50';
  };

  // Parse difficulty level
  const getDifficultyColor = (difficulty: string) => {
    const diffLower = difficulty.toLowerCase();
    if (diffLower.includes('low')) {
      return 'text-emerald-500 bg-emerald-500/5 border-slate-700/50';
    } else if (diffLower.includes('medium')) {
      return 'text-amber-500 bg-amber-500/5 border-slate-700/50';
    } else if (diffLower.includes('high')) {
      return 'text-red-500 bg-red-500/5 border-slate-700/50';
    }
    return 'text-slate-400 bg-slate-800 border-slate-700/50';
  };

  // Get difficulty icon
  const getDifficultyIcon = (difficulty: string) => {
    const diffLower = difficulty.toLowerCase();
    if (diffLower.includes('low')) return <CheckCircle2 size={14} />;
    if (diffLower.includes('medium')) return <AlertCircle size={14} />;
    if (diffLower.includes('high')) return <Shield size={14} />;
    return <Info size={14} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {recommendation.business_name}
                </h3>
                {recommendation.category && (
                  <div className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    {recommendation.category}
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed line-clamp-2">
              {recommendation.description}
            </p>
          </div>

          {onSave && (
            <button
              onClick={() => onSave(recommendation)}
              disabled={saving}
              className="flex-shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all border border-transparent hover:border-emerald-500/20 disabled:opacity-50"
            >
              {saving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Star size={20} />
                </motion.div>
              ) : (
                <Star size={20} />
              )}
            </button>
          )}
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Investment Range */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investment</span>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {recommendation.investment_range}
            </div>
          </div>

          {/* ROI Potential */}
          <div className={`p-3 rounded-xl border ${getRoiColor(recommendation.roi_potential)}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">ROI</span>
            </div>
            <div className="text-sm font-black">
              {recommendation.roi_potential}
            </div>
          </div>

          {/* Implementation Difficulty */}
          <div className={`p-3 rounded-xl border ${getDifficultyColor(recommendation.implementation_difficulty)}`}>
            <div className="flex items-center gap-2 mb-1">
              {getDifficultyIcon(recommendation.implementation_difficulty)}
              <span className="text-xs font-bold uppercase tracking-wider">Difficulty</span>
            </div>
            <div className="text-sm font-black">
              {recommendation.implementation_difficulty}
            </div>
          </div>

          {/* Market Size / Neighborhood */}
          <div className="p-3 bg-blue-500/5 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Location</span>
            </div>
            <div className="text-sm font-bold text-blue-300 truncate">
              {recommendation.ideal_neighborhood || recommendation.market_size || 'Regional'}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-white/2">
              {/* Market Gap & Target Audience */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-emerald-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Market Gap</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed pl-6">
                    {recommendation.market_gap}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Target Audience</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed pl-6">
                    {recommendation.target_audience}
                  </p>
                </div>
              </div>

              {/* Competitive Advantage */}
              {recommendation.competitive_advantage && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-purple-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Competitive Advantage</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed pl-6">
                    {recommendation.competitive_advantage}
                  </p>
                </div>
              )}

              {/* Revenue & CAC */}
              <div className="grid lg:grid-cols-2 gap-6">
                {recommendation.revenue_model && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Monetization Strategy</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-white/5">
                      <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                        {recommendation.revenue_model}
                      </p>
                      {recommendation.potential_revenue && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Est. Annual Revenue</span>
                          <span className="text-xs font-black text-emerald-500">{recommendation.potential_revenue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {recommendation.cac && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Unit Economics</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-500">Avg. Customer Acquisition</span>
                        <span className="text-xs font-black text-blue-500">{recommendation.cac}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        *Estimated based on current regional digital advertising and physical marketing benchmarks.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategic Roadmap Preview */}
              {recommendation.six_month_plan && recommendation.six_month_plan.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-blue-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Tactical Roadmap Preview</h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {recommendation.six_month_plan.map((step, sIdx) => {
                      const isObj = typeof step === 'object' && step !== null;
                      return (
                        <div key={sIdx} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/20 transition-all">
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                            {isObj ? step.month : `Phase ${sIdx + 1}`}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                            {isObj ? step.goal : step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Success Factors */}
              {recommendation.key_success_factors && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Rocket size={16} className="text-orange-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Key Success Factors</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed pl-6">
                    {recommendation.key_success_factors}
                  </p>
                </div>
              )}

              {/* Export/Action Button */}
              {onViewDetails && (
                <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onViewDetails(recommendation)}
                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[10px] uppercase tracking-[0.15em] border border-slate-700 hover:border-slate-500 shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Rocket size={14} className="text-emerald-500" />
                    Market Report
                  </button>
                  <button
                    onClick={() => {
                        // Triggers the same logic but the dashboard will redirect to /roadmap
                        if (onViewDetails) {
                            (recommendation as any)._target = '/roadmap';
                            onViewDetails(recommendation);
                        }
                    }}
                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[10px] uppercase tracking-[0.15em] border border-slate-700 hover:border-slate-500 shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <CalendarIcon size={14} className="text-blue-500" />
                    Roadmap
                  </button>
                </div>
              )}

              {/* AI Source Attribution */}
              {recommendation.ai_source && (
                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
                    <Lightbulb size={12} />
                    <span className="font-medium">Generated by: {recommendation.ai_source}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 bg-slate-900/40 hover:bg-slate-800/60 transition-colors border-t border-slate-800 dark:border-white/5 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 uppercase tracking-widest text-[10px]"
      >
        <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </motion.div>
  );
}