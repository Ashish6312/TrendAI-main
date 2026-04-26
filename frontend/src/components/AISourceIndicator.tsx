'use client';

import { motion } from 'framer-motion';
import { 
  Brain, 
  Database, 
  Globe, 
  Search, 
  Zap, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  MapPin,
  Cpu
} from 'lucide-react';

interface AISourceIndicatorProps {
  aiSource?: string;
  dataSources?: string[];
  analysisTime?: string;
  area?: string;
  className?: string;
}

export default function AISourceIndicator({ 
  aiSource, 
  dataSources = [], 
  analysisTime, 
  area,
  className = '' 
}: AISourceIndicatorProps) {
  
  // Get AI source icon and color
  const getAISourceInfo = (source: string) => {
    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('pollinations')) {
      return {
        icon: <Brain size={16} />,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-500/10',
        borderColor: 'border-purple-200 dark:border-purple-500/20',
        label: 'Pollinations AI'
      };
    } else if (sourceLower.includes('tavily')) {
      return {
        icon: <Search size={16} />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-500/10',
        borderColor: 'border-blue-200 dark:border-blue-500/20',
        label: 'Tavily Search'
      };
    } else if (sourceLower.includes('gemini')) {
      return {
        icon: <Zap size={16} />,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
        borderColor: 'border-emerald-200 dark:border-emerald-500/20',
        label: 'Gemini AI'
      };
    } else if (sourceLower.includes('claude')) {
      return {
        icon: <Cpu size={16} />,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-500/10',
        borderColor: 'border-orange-200 dark:border-orange-500/20',
        label: 'Claude AI'
      };
    } else if (sourceLower.includes('fallback') || sourceLower.includes('emergency')) {
      return {
        icon: <Zap size={16} />,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
        borderColor: 'border-indigo-200 dark:border-indigo-500/20',
        label: 'Singularity Neural Cluster'
      };
    } else {
      return {
        icon: <Brain size={16} />,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
        borderColor: 'border-indigo-200 dark:border-indigo-500/20',
        label: 'Multi-AI System'
      };
    }
  };

  // Get data source icons
  const getDataSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('tavily')) return <Search size={12} className="text-blue-500" />;
    if (sourceLower.includes('exa')) return <Globe size={12} className="text-green-500" />;
    if (sourceLower.includes('serper')) return <TrendingUp size={12} className="text-purple-500" />;
    if (sourceLower.includes('apify')) return <MapPin size={12} className="text-red-500" />;
    if (sourceLower.includes('firecrawl')) return <Database size={12} className="text-orange-500" />;
    if (sourceLower.includes('reddit')) return <Globe size={12} className="text-orange-600" />;
    if (sourceLower.includes('google')) return <Search size={12} className="text-blue-600" />;
    
    return <Database size={12} className="text-slate-500" />;
  };

  const aiInfo = aiSource ? getAISourceInfo(aiSource) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-sm ${className}`}
    >
      <div className="space-y-4">
        {/* AI Source */}
        {aiInfo && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${aiInfo.bgColor} ${aiInfo.color} border ${aiInfo.borderColor}`}>
                {aiInfo.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {aiInfo.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">
                  Primary AI Engine
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
          </div>
        )}

        {/* Data Sources */}
        {dataSources.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Data Sources ({dataSources.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {dataSources.map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-white/5 rounded-md border border-slate-200 dark:border-white/10"
                >
                  {getDataSourceIcon(source)}
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-300">
                    {source}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
          {area && (
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                {area}
              </span>
            </div>
          )}
          
          {analysisTime && (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <Clock size={12} className="text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-gray-400">
                {analysisTime}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}