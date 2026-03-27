"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { 
  ArrowLeft, CheckCircle2, Loader2, Play, 
  ChevronRight, Calendar, Users, Rocket,
  ShieldCheck, Sparkle, MapPin, Printer, Globe2, Zap,
  BookOpen, Target, Activity, TrendingUp, X, Clock, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { generateRoadmapPDF } from "@/utils/pdfReportGenerator";
import { useNotifications } from "@/context/NotificationContext";

// Implementation Guide Modal Component
function ImplementationGuideModal({ step, onClose, businessInfo }: { step: any, onClose: () => void, businessInfo: any }) {
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/roadmap/guide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_title: step.step_title,
            step_description: step.step_description,
            business_type: businessInfo.title,
            location: businessInfo.area
          })
        });
        if (response.ok) {
          const data = await response.json();
          setGuide(data);
        }
      } catch (err) {
        console.error("Guide fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [step, businessInfo]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-3xl flex flex-col"
      >
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{t("road_implement_guide")}</h4>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{step.step_title}</h3>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 gap-6">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Resolved Strategic Intelligence...</p>
             </div>
          ) : (
            <>
              {/* Phase Information */}
              {guide?.phase_info && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Target className="text-blue-500" size={16} />
                      </div>
                      <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Current Phase</h5>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-blue-600 dark:text-blue-400">{guide.phase_info.current_phase}</div>
                      <div className="text-xs text-blue-500 font-bold">{guide.phase_info.phase_progress} Complete</div>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Next Milestone: {guide.phase_info.next_milestone}
                  </p>
                </div>
              )}

              {/* Phase Context */}
              {guide?.phase_specific_context && (
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase Context</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                    {guide.phase_specific_context}
                  </p>
                </div>
              )}

              {/* Objective Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <Target className="text-emerald-500" size={24} />
                   <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Primary Objective</h5>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{guide?.objective}</p>
              </div>

              {/* Grid Section */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-6">
                   <div className="flex items-center gap-3">
                      <Activity className="text-blue-500" size={20} />
                      <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Key Activities</h5>
                   </div>
                   <ul className="space-y-4">
                     {guide?.key_activities?.map((act: string, i: number) => (
                       <li key={i} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold group">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 group-hover:scale-150 transition-transform" />
                         {act}
                       </li>
                     ))}
                   </ul>
                </div>
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-6">
                   <div className="flex items-center gap-3">
                      <TrendingUp className="text-purple-500" size={20} />
                      <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Success Metrics</h5>
                   </div>
                   <ul className="space-y-4">
                     {guide?.phase_metrics?.map((metric: string, i: number) => (
                       <li key={i} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold group">
                         <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0 group-hover:scale-150 transition-transform" />
                         {metric}
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              {/* Detailed Steps */}
              <div className="space-y-8">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Execution Steps</h5>
                <div className="space-y-4">
                   {guide?.detailed_steps?.map((s: any, i: number) => (
                      <div key={i} className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all group">
                         <div className="flex items-center gap-4 mb-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">{i+1}</span>
                            <h6 className="font-black text-slate-900 dark:text-white">{s.title}</h6>
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-10">{s.description}</p>
                         <div className="mt-4 pl-10 space-y-2">
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                             <Clock size={12} />
                             <span>Duration: {s.duration}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                             <CheckCircle size={12} />
                             <span>Success: {s.success_criteria}</span>
                           </div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>

              {/* Implementation Timeline */}
              {guide?.implementation_timeline && (
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Implementation Timeline</h5>
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-4 mb-4">
                      <Calendar className="text-emerald-500" size={20} />
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        Total Duration: {guide.implementation_timeline.duration}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {guide.implementation_timeline.milestones?.map((milestone: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Mitigation */}
              {guide?.risk_mitigation && (
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Management</h5>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                      <h6 className="text-xs font-black text-red-600 dark:text-red-400 mb-4 uppercase tracking-wider">Common Risks</h6>
                      <ul className="space-y-2">
                        {guide.risk_mitigation.common_risks?.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300 font-medium">
                            <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20">
                      <h6 className="text-xs font-black text-green-600 dark:text-green-400 mb-4 uppercase tracking-wider">Mitigation Strategies</h6>
                      <ul className="space-y-2">
                        {guide.risk_mitigation.mitigation_strategies?.map((strategy: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300 font-medium">
                            <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Advantages */}
              {guide?.location_advantages && (
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Advantages</h5>
                  <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start gap-4">
                      <MapPin className="text-blue-500 mt-1" size={20} />
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                        {guide.location_advantages}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Phase Preparation */}
              {guide?.next_phase_preparation && (
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Phase Preparation</h5>
                  <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-start gap-4">
                      <ChevronRight className="text-purple-500 mt-1" size={20} />
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-medium leading-relaxed">
                        {guide.next_phase_preparation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expert Pro Tip */}
              <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                 <div className="flex items-center gap-4 mb-4">
                    <Sparkle size={20} className="text-emerald-500" />
                    <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Expert Pro-Tip</h5>
                 </div>
                 <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold italic leading-relaxed">
                   "{guide?.pro_tips}"
                 </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 md:p-12 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
           <button onClick={onClose} className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
             Acknowledge & Sync progress
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RoadmapContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const area = searchParams.get('area');
  const title = searchParams.get('title');
  const desc = searchParams.get('desc');
  const language = searchParams.get('lang') || "English";
  
  const [steps, setSteps] = useState<any[]>([]);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { data: sessionData } = useSession();
  const { addNotification } = useNotifications();
  const [activeStep, setActiveStep] = useState(0);
  const [isProcessingStep, setIsProcessingStep] = useState<number | null>(null);
  const [selectedGuideIndex, setSelectedGuideIndex] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (!area || !title || !desc) {
      router.push("/dashboard");
      return;
    }

    const fetchRoadmap = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/roadmap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            area, 
            title, 
            description: desc,
            user_email: sessionData?.user?.email || "anonymous",
            language: language 
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setRoadmapData(data);
            if (Array.isArray(data.steps)) setSteps(data.steps);
            if (data.current_step !== undefined) setActiveStep(data.current_step);
          } else {
            setSteps([]);
          }
        } else {
          console.error("Failed to fetch roadmap data node");
        }
      } catch (error) {
        console.error("Error connecting to API:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchRoadmap();
    }
  }, [area, title, desc, status, router, language]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-blue-500/20 rounded-full animate-ping absolute inset-0" />
          <div className="w-24 h-24 border-t-2 border-blue-600 rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.3)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="text-blue-500 w-10 h-10 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase selection:bg-blue-600">{t("road_preparing")}</h2>
          <p className="text-slate-500 dark:text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase opacity-70">{t("road_analyzing")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--background)]">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/90 via-white/40 to-white dark:from-[#020617]/40 dark:via-[#020617] dark:to-[#020617] transition-colors duration-500" />
      </div>

      <div className="responsive-container navbar-aware pb-16 md:pb-20 lg:pb-24 navbar-content">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10 mb-16 md:mb-20 lg:mb-24">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()} 
            className="group flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-emerald-500/20 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all w-fit shadow-2xl backdrop-blur-xl"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5 group-hover:-translate-x-1.5 transition-transform" />
            <span className="responsive-text-xs font-black uppercase tracking-[0.3em]">{t("road_return")}</span>
          </motion.button>
          
          <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-emerald-500/10 rounded-xl md:rounded-2xl border border-emerald-500/20 responsive-text-xs font-black text-emerald-400 uppercase tracking-[0.3em] shadow-lg">
             <Globe2 size={14} className="md:w-4 md:h-4" /> {language} {t("road_strategy")}
          </div>
        </div>

        <header className="mb-20 md:mb-24 lg:mb-32 space-y-6 md:space-y-8 lg:space-y-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 md:gap-8 justify-center"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent flex-1" />
            <Sparkle className="text-emerald-500 animate-pulse md:w-10 md:h-10" size={32} fill="currentColor" />
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent flex-1" />
          </motion.div>
          
          <div className="space-y-4 md:space-y-6">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 responsive-text-xs font-black text-blue-400 uppercase tracking-widest mb-3 md:mb-4"
            >
               <ShieldCheck size={12} className="md:w-[14px] md:h-[14px]" /> {t("road_directive")}
            </motion.div>
            <h1 className="responsive-text-2xl sm:responsive-text-4xl md:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none max-w-5xl mx-auto italic px-4">
               {t("road_plan_title")}
            </h1>
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="responsive-text-lg sm:responsive-text-xl md:responsive-text-3xl font-black bg-white dark:bg-white/5 px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 shadow-2xl tracking-tight selection:bg-emerald-600 select-all"
              >
                {title}
              </motion.h2>
              <div className="flex items-center gap-2 md:gap-3 text-gray-500 font-bold tracking-widest uppercase responsive-text-xs">
                 <MapPin size={16} className="md:w-[18px] md:h-[18px] text-emerald-500" /> 
                 {area}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-20">
          {/* Progress Sidebar */}
          <div className="hidden lg:block space-y-6 md:space-y-8 sticky top-36 h-fit">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-10 bg-gradient-to-b from-emerald-600/15 via-emerald-600/5 to-transparent border-emerald-500/20 shadow-2xl"
            >
               <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-5">{t("road_milestones")}</h4>
                <div className="space-y-6">
                  {Array.isArray(steps) && steps.map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      onClick={() => {
                        setActiveStep(i);
                        const el = document.getElementById(`phase-${i}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center gap-5 group cursor-pointer"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${
                        i === activeStep 
                          ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] scale-125' 
                          : i < activeStep 
                            ? 'bg-emerald-500/50' 
                            : 'bg-slate-200 dark:bg-gray-800'
                      }`} />
                      <span className={`text-[11px] font-black tracking-widest uppercase transition-colors duration-500 ${
                        i === activeStep 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-slate-400 dark:text-gray-600 group-hover:text-slate-600 dark:group-hover:text-gray-500'
                      }`}>
                        {t("road_phase")} 0{i+1}
                      </span>
                    </motion.div>
                  ))}
                </div>
            </motion.div>
            
             <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-10 space-y-10 border-slate-200 dark:border-white/5 shadow-xl"
            >
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-inner"><Calendar className="text-slate-500 dark:text-gray-500" size={20} /></div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">{t("road_timeline")}</div>
                     <div className="text-sm font-black text-slate-700 dark:text-gray-300 italic tracking-tight">{roadmapData?.timeline || t("road_6_months")}</div>
                  </div>
               </div>
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-inner"><Users className="text-slate-500 dark:text-gray-500" size={20} /></div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">{t("road_team")}</div>
                     <div className="text-sm font-black text-slate-700 dark:text-gray-300 italic tracking-tight">{roadmapData?.team_needed || t("road_taskforce")}</div>
                  </div>
               </div>
            </motion.div>

            {/* NEW: Implementation Hacks */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-10 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20"
            >
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t("road_expert_exec")}</h4>
               <ul className="space-y-5">
                 {(roadmapData?.execution_tips || [t("road_tip_1"), t("road_tip_2"), t("road_tip_3")]).map((tip: string, i: number) => {
                   const icons = [<Zap key="icon1" size={14} />, <Globe2 key="icon2" size={14} />, <Rocket key="icon3" size={14} />, <TrendingUp key="icon4" size={14} />];
                   return (
                     <li key={i} className="flex items-center gap-4 text-[11px] font-bold text-gray-400 group cursor-default leading-loose">
                       <span className="text-blue-500 group-hover:scale-125 transition-transform flex-shrink-0">{icons[i % icons.length]}</span>
                       {tip}
                     </li>
                   );
                 })}
               </ul>
            </motion.div>
          </div>

          {/* Steps Content */}
          <div className="lg:col-span-3 space-y-36 relative">
            <div className="absolute left-[59px] top-12 bottom-12 w-px bg-gradient-to-b from-emerald-500/30 via-white/5 to-emerald-500/30 hidden md:block" />
            
            <AnimatePresence>
              {Array.isArray(steps) && steps.map((step, index) => (
                  <motion.div 
                  key={index} 
                  id={`phase-${index}`}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative pl-0 md:pl-32 group"
                >
                  {/* Number Badge */}
                  <div className="hidden md:flex absolute left-0 top-0 w-28 h-28 items-center justify-center">
                    <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center font-black text-3xl z-10 transition-all duration-700 shadow-2xl group-hover:-translate-y-2 ${
                      index === activeStep 
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-2 border-white/20 scale-110 shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)]'
                        : activeStep > index
                        ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                        : 'bg-white dark:bg-gray-950 border-2 border-slate-200 dark:border-white/10 text-slate-400'
                    }`}>
                      {activeStep > index ? <CheckCircle2 size={32} /> : step.step_number}
                    </div>
                  </div>
                  
                  <div className={`glass-card p-10 md:p-16 transition-all duration-700 relative overflow-hidden group shadow-2xl ${
                    index === activeStep 
                      ? 'bg-white dark:bg-white/[0.05] border-2 border-emerald-500/40 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.15)] scale-[1.02]' 
                      : activeStep > index
                      ? 'bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 opacity-80'
                      : 'bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5'
                  }`}>
                    {index === activeStep && (
                      <div className="absolute top-4 right-8 z-20">
                         <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                           <Activity size={10} /> Current Strategize
                         </div>
                      </div>
                    )}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="flex items-center gap-6 mb-8 relative z-10">
                      <div className="w-2.5 h-10 bg-emerald-600 rounded-full shadow-[0_0_30px_#10b981] group-hover:h-12 transition-all duration-500" />
                      <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-none">
                        {step.step_title}
                      </h3>
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                       <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg md:text-xl font-medium tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">
                         {step.step_description}
                       </p>
                       
                       <div className="flex flex-wrap gap-4 pt-10 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                             <ShieldCheck size={16} /> {t("road_priority")}
                          </div>
                          <div 
                            onClick={async (e) => {
                              if (isProcessingStep !== null) return;
                              
                              setIsProcessingStep(index);
                              
                              // Visual "Thinking/Working" feel
                              await new Promise(r => setTimeout(r, 800));
                              
                               const nextStep = Math.min(steps.length - 1, index + 1);
                              setActiveStep(nextStep);

                              // Persistent DB Sync
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                await fetch(`${apiUrl}/api/roadmap/step`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ 
                                    area, 
                                    title, 
                                    current_step: nextStep,
                                    user_email: (status === "authenticated" && (sessionData as any)?.user?.email) || "anonymous"
                                  }),
                                });
                              } catch (err) {
                                console.warn("Background sync latency detected:", err);
                              }

                              // Smooth scroll to next phase
                              const nextEl = document.getElementById(`phase-${nextStep}`);
                              if (nextEl) {
                                nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                              addNotification({
                                type: 'system',
                                title: `Phase 0${index + 1} Initiated`,
                                message: 'Advanced strategic level synchronized with node cluster.',
                                priority: 'medium'
                              });
                              setIsProcessingStep(null);
                            }}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 group/btn ${
                              isProcessingStep === index 
                                || activeStep > index // Visual feedback for completed
                                ? 'bg-indigo-500/20 border-indigo-500/50 scale-105 select-none opacity-50' 
                                : 'bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 shadow-indigo-500/5'
                            } text-[9px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest`}

                          >
                             {isProcessingStep === index ? (
                               <>
                                 <Loader2 size={16} className="animate-spin" />
                                 <span>Initiating...</span>
                               </>
                             ) : (
                               <>
                                 <Play size={16} fill="currentColor" className="group-hover/btn:scale-125 transition-transform" /> 
                                 {t("road_action")}
                               </>
                             )}
                          </div>

                          <div 
                            onClick={() => setSelectedGuideIndex(index)}
                            className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-all cursor-pointer shadow-lg text-[9px] font-black uppercase tracking-widest active:scale-95"
                          >
                             <BookOpen size={16} /> Implementation Guide
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Implementation Strategies Matrix */}
            <div className="md:ml-32 space-y-12">
               <div className="flex items-center gap-6">
                  <div className="h-px bg-white/10 flex-1" />
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{t("road_strategies")}</h4>
                  <div className="h-px bg-white/10 flex-1" />
               </div>
               
               <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="grid md:grid-cols-2 gap-8"
                >
                   <div className="glass-card p-12 bg-white/50 dark:bg-gradient-to-br dark:from-indigo-600/10 dark:to-transparent border border-slate-200 dark:border-indigo-500/20 group hover:border-indigo-500/40 transition-all duration-700">
                      <div className="w-14 h-14 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500 text-indigo-600 dark:text-indigo-400 group-hover:text-white"><Rocket size={28} /></div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t("road_fast_growth")}</h4>
                      <p className="text-slate-500 dark:text-gray-500 font-medium leading-relaxed text-sm">{t("road_fast_desc")}</p>
                   </div>
                   <div className="glass-card p-12 bg-white/50 dark:bg-gradient-to-br dark:from-emerald-600/10 dark:to-transparent border border-slate-200 dark:border-emerald-500/20 group hover:border-emerald-500/40 transition-all duration-700">
                      <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-500 text-emerald-600 dark:text-emerald-400 group-hover:text-white"><ShieldCheck size={28} /></div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t("road_market_safety")}</h4>
                      <p className="text-slate-500 dark:text-gray-500 font-medium leading-relaxed text-sm">{t("road_safety_desc")}</p>
                   </div>
                </motion.div>
            </div>

            {/* Conclusion */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-16 md:p-24 bg-white/80 dark:bg-gradient-to-br dark:from-emerald-600/15 dark:via-transparent dark:to-indigo-600/15 border border-slate-200 dark:border-emerald-500/30 flex flex-col items-center text-center relative overflow-hidden shadow-3xl group mb-24"

            >
              <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] group-hover:opacity-100 transition-opacity" />
              
              <div className="w-28 h-28 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_80px_-10px_rgba(16,185,129,0.5)] border-2 border-emerald-500/30 animate-pulse relative z-10">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter uppercase italic relative z-10">{t("road_readiness")}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl md:text-2xl font-bold leading-relaxed tracking-tight relative z-10 mb-16 px-4">
                {t("road_success_conf")}
              </p>
              <button 
                onClick={async () => {
                   try {
                     setIsExporting(true);
                     addNotification({
                        type: 'system',
                        title: 'Generating PDF',
                        message: 'Formatting your high-fidelity roadmap...',
                        priority: 'low'
                     });
                     await generateRoadmapPDF(area || "Target Area", title || "Business Venture", steps, {
                        name: sessionData?.user?.name || 'StarterScope Entrepreneur',
                        email: sessionData?.user?.email || ''
                     });
                     addNotification({
                        type: 'system',
                        title: 'Roadmap Ready',
                        message: 'Your execution plan has been downloaded!',
                        priority: 'medium'
                     });
                   } catch (error) {
                     console.error("Roadmap export failed:", error);
                     window.print();
                   } finally {
                     setIsExporting(false);
                   }
                }} 
                disabled={isExporting}
                className="h-20 px-12 sm:px-16 bg-white text-black font-black rounded-[2rem] text-[11px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all duration-700 shadow-2xl flex items-center gap-6 hover:-translate-y-3 active:scale-95 relative z-10 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={24} /> : <Printer size={24} />}
                {isExporting ? 'Preparing...' : t("road_print")}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedGuideIndex !== null && Array.isArray(steps) && steps[selectedGuideIndex] && (
          <ImplementationGuideModal 
            step={steps[selectedGuideIndex]} 
            businessInfo={{ title, area }}
            onClose={() => setSelectedGuideIndex(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoadmapPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center flex-col gap-8 text-gray-500 font-black animate-pulse uppercase tracking-[0.4em] text-xs"><Loader2 className="animate-spin mb-4 w-12 h-12" /> {t("road_loading_strat")}</div>}>
      <ProtectedRoute>
        <RoadmapContent />
      </ProtectedRoute>
    </Suspense>
  );
}
