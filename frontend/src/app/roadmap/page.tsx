'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  ChevronLeft,
  Download,
  Share2,
  Target,
  CheckCircle,
  BarChart3,
  Loader2,
  Briefcase,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Hammer,
  Shield,
  ShieldCheck,
  Building,
  Lightbulb,
  Zap,
  CheckCircle2,
  TrendingUp,
  Layout,
  ExternalLink,
  Info,
  Users,
  Play,
  BookOpen,
  Activity,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UniformLayout from '@/components/UniformLayout';
import UniformCard from '@/components/UniformCard';
import { generateRoadmapPDF } from '@/utils/pdfReportGenerator';

export default function RoadmapPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeGuideStep, setActiveGuideStep] = useState<any>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  const handleStepAdvance = (idx: number) => {
    if (!businessData) return;
    setCurrentStep(idx);
    const updated = { ...businessData, current_phase: idx };
    setBusinessData(updated);
    localStorage.setItem('currentBusinessAnalysis', JSON.stringify(updated));
  };

  const fetchTacticalInsight = async (step: any, idx: number) => {
    setGuideLoading(true);
    setActiveGuideStep({ ...step, idx, title: step.title });
    
    try {
      const prompt = `Act as an Elite Business Consultant specialized in the Indian Market. Generate a hyper-granular technical implementation guide for:
Business Title: ${businessData.business.title}
Current Phase: ${step.title}
Market Context: India (${businessData.area})

Focus on: 
1. Indian Regulatory Compliance (GST, MCA, MSME)
2. Digital Infrastructure (UPI, ONDC, India Stack)
3. Local Logistics & Supply Chain nuances
4. Regional Consumer Behavior & Cultural alignment
5. Specific Indian competitors or market entry barriers.

Respond ONLY with a JSON object:
{
  "insight": "High-fidelity strategic briefing (4-5 long sentences)",
  "milestones": ["Milestone 1 (India specific)", "Milestone 2", "Milestone 3", "Milestone 4", "Milestone 5"]
}
Respond with valid JSON only.`;

      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      const text = await response.text();
      
      // Robust Neural Data Extraction
      let jsonStr = text;
      const firstCurly = text.indexOf('{');
      const lastCurly = text.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1) {
        jsonStr = text.substring(firstCurly, lastCurly + 1);
      } else if (text.includes('```json')) {
        jsonStr = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        jsonStr = text.split('```')[1].split('```')[0].trim();
      }
      
      const result = JSON.parse(jsonStr);
      setActiveGuideStep((prev: any) => ({
        ...prev,
        detailed_insight: result.insight,
        milestones: result.milestones
      }));
    } catch (error) {
      console.error("Guide synthesis failed:", error);
    } finally {
      setGuideLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!businessData) return;
    setRegenerating(true);
    try {
      const prompt = `You are a World-Class Strategic Director (McKinsey/BCG). Synthesize a hyper-granular, technical 6-month execution roadmap for a:
Business Title: ${businessData.business.title}
Target Market Context: ${businessData.area}

Generate a JSON object with this exact technical schema:
{
  "steps": [
    {
      "title": "TACTICAL PHASE NAME (e.g. 'LOCAL REGULATORY DOMINANCE')",
      "description": "Short technical objective",
      "detailed_insight": "A hyper-granular 4-5 sentence strategic briefing including specific tactical parameters for the ${businessData.area} market. Mention competitors or local dynamics.",
      "milestones": [
        "Granular Milestone 1 (Technical)",
        "Granular Milestone 2 (Strategic)",
        "Granular Milestone 3 (Execution)",
        "Granular Milestone 4 (Validation)",
        "Granular Milestone 5 (Handover)"
      ]
    },
    ... (6 phases total)
  ],
  "requirements": "List technical stack and personnel (comma-separated)",
  "tips": [
    "High-level strategic tip 1",
    "High-level strategic tip 2",
    "High-level strategic tip 3"
  ]
}
Ensure the tone is elite, technical, and data-dense. Respond ONLY with valid JSON. NO introductory text.`;

      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      const text = await response.text();

      // Hyper-Robust Neural Data Extraction
      let jsonStr = "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        // Aggressive search for any JSON-like structure
        const firstCurly = text.indexOf('{');
        const lastCurly = text.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
          jsonStr = text.substring(firstCurly, lastCurly + 1);
        }
      }

      if (!jsonStr) {
        console.warn("⚠️ No JSON detected in AI response. Using high-fidelity baseline fallback.");
        // Static strategic fallback for Punjab context (professional-grade)
        const fallback = {
          steps: [
            { title: "Strategic Resource Mobilization", description: "Securing capital and local logistics assets.", detailed_insight: "Deploying initial operational infrastructure in the region.", milestones: ["Finalize budget", "Securing primary logistics", "Team induction"] },
            { title: "Market Entry & Brand Blitz", description: "Executing aggressive local GTM strategy.", detailed_insight: "Establishing a dominant footprint through targeted regional channels.", milestones: ["Brand launch", "First 100 customers", "Channel partnership check"] },
            { title: "Operational Scaling Ph-1", description: "Expanding to secondary village clusters.", detailed_insight: "Extending reach beyond the primary hub to maximize territorial impact.", milestones: ["New location scan", "Hiring Phase 2", "System optimization"] }
          ],
          requirements: "Capital, Local Logistics, Regulatory Permits",
          tips: ["Scale fast", "Maintain quality", "Build community trust"]
        };
        jsonStr = JSON.stringify(fallback);
      }

      const result = JSON.parse(jsonStr);

      if (result && result.steps) {
        setBusinessData((prev: any) => {
          const updated = {
            ...prev,
            business: {
              ...prev.business,
              six_month_plan: result.steps,
              requirements: result.requirements,
              execution_tips: result.tips
            }
          };
          localStorage.setItem('currentBusinessAnalysis', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Roadmap regeneration failed:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!businessData) return;
    try {
      // Use the named export generator
      await generateRoadmapPDF(
        businessData.area,
        businessData.business.title,
        roadmapSteps
      );
    } catch (err) {
      console.error("PDF Export failed:", err);
    }
  };

  const handleSharePlan = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Roadmap URL copied to clipboard! Share it with your stakeholders.");
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('currentBusinessAnalysis');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBusinessData(parsed);
        setCurrentStep(parsed.current_phase || 0);

        // If the roadmap is missing or in the old string format, auto-regenerate it for "managed content"
        const plan = parsed.business?.six_month_plan || [];
        if (plan.length === 0 || (plan.length > 0 && typeof plan[0] === 'string') || !parsed.business.requirements) {
          console.log("🛠️ Upgrading to Real-Time Strategic Roadmap...");
          // We can't call handleRegenerate directly inside useEffect because businessData state hasn't stabilized yet
          // But we can trigger a one-time synthesis if data is legacy
          const triggerSync = async () => {
             // Artificial delay to allow state to settle
             await new Promise(r => setTimeout(r, 800));
             const btn = document.getElementById('ai-sync-trigger');
             if (btn) btn.click();
          };
          triggerSync();
        }
      } catch (e) {
        console.error('Failed to parse business data:', e);
      }
    }
    setLoading(false);
  }, []);

  if (loading || regenerating) {
    return (
      <UniformLayout title="Preparing Plan">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12">
          {/* Neural Orbital Loader */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
            />
            <div className="relative w-32 h-32 rounded-full border-2 border-blue-500/20 flex items-center justify-center bg-slate-900/50 backdrop-blur-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border border-dashed border-blue-500/30"
              />
              <Rocket className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] italic">Preparing Plan</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Analyzing Market</span>
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </UniformLayout>
    );
  }

  if (!businessData) {
    return (
      <UniformLayout title="Roadmap Not Found">
        <div className="max-w-md mx-auto py-20 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-4 italic">No Roadmap Sync detected</h2>
          <p className="text-slate-500 dark:text-gray-400 mb-8">Please select a business opportunity from the dashboard to generate its unique 2026 execution roadmap.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </UniformLayout>
    );
  }

  const hasPlan = Array.isArray(businessData.business.six_month_plan) && businessData.business.six_month_plan.length > 0;

  // Upgrade legacy session data to high-fidelity AI-driven objects
  const roadmapSteps = hasPlan ? businessData.business.six_month_plan.map((step: any, idx: number) => {
    if (typeof step === 'string') {
      const parts = step.split(':');
      const baseTitle = parts[0].replace(/Month \d+/i, '').trim();
      return {
        title: baseTitle || `Phase ${idx + 1} Stratagem`,
        description: parts.slice(1).join(':').trim() || step,
        detailed_insight: "Upgrade required. Initiate AI synthesis for real-time tactical intelligence based on current market dynamics.",
        milestones: ["Initiate setup", "Strategic validation", "Execution planning"]
      };
    }
    return step;
  }) : [
    { title: "FOUNDATIONAL SCOUTING", description: "Market Entry & Regulatory Alignment", detailed_insight: "Strategic analysis of local licensing and entry barriers for ${businessData.area}.", milestones: ["Secure core permits", "Define GTM strategy"] },
    { title: "OPERATIONAL IGNITION", description: "Supply Chain & Provider Integration", detailed_insight: "Integrating regional logistics providers into the core business architecture.", milestones: ["Onboard primary vendors", "Deploy logistics engine"] },
    { title: "MARKET PENETRATION", description: "Soft Launch & Feedback Capture", detailed_insight: "Deploying MVP to core target demographic in ${businessData.area}.", milestones: ["Region alpha test", "User sentiment analysis"] },
    { title: "GROWTH AMPLIFICATION", description: "Customer Acquisition Blitz", detailed_insight: "Executing aggressive multi-channel marketing campaigns.", milestones: ["Scale performance marketing", "Optimize conversion funnel"] },
    { title: "INTELLIGENT OPTIMIZATION", description: "Operational Refinement", detailed_insight: "Data-driven refinement of service delivery and unit economics.", milestones: ["Financial audit", "Scale core infrastructure"] },
    { title: "REGIONAL DOMINANCE", description: "Scalability & Expansion", detailed_insight: "Broadening coverage across the entire regional territory.", milestones: ["Territorial expansion", "Institutional partnership scale"] }
  ];

  return (
    <UniformLayout
      title="Strategic Execution Roadmap"
      subtitle={`Verified Implementation Framework for ${businessData.area}`}
    >
      <div className="max-w-7xl mx-auto pb-32">
        {/* Superior Header with Dynamic Pulse */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="px-4 py-1.5 rounded-full bg-slate-900/50 dark:bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2 mb-2">
            <Briefcase size={12} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80">Business Plan</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Your <span className="text-emerald-500">Growth Plan</span>
          </h1>
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {businessData.business.title}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
              <MapPin size={14} className="text-emerald-500 animate-bounce-slow" /> {businessData.area}
            </div>
          </div>
        </div>

        {/* Primary Command Hub Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <button
            id="ai-sync-trigger"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all shadow-xl flex items-center gap-3 group"
          >
            {regenerating ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
            {regenerating ? 'Synthesizing...' : 'Regenerate with AI'}
          </button>
          <button
            onClick={handleExportPDF}
            className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all shadow-xl flex items-center gap-3 group"
          >
            <Download size={16} /> Export PDF
          </button>
          <button
            onClick={handleSharePlan}
            className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all shadow-xl flex items-center gap-3 group"
          >
            <Share2 size={16} /> Share Plan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT SIDEBAR: Strategic Control Panel */}
          <div className="lg:col-span-3 space-y-10 order-2 lg:order-1">
            {/* Launch Steps Navigation */}
            <div className="p-6 rounded-[2.5rem] bg-slate-900/50 dark:bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">Launch Steps</h4>
              <div className="space-y-6">
                {roadmapSteps.map((step: any, idx: number) => {
                  const isObject = typeof step === 'object' && step !== null;
                  const stepTitle = isObject ? step.title : (step.includes(':') ? step.split(':')[0] : `PHASE ${idx + 1}`);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleStepAdvance(idx)}
                      className="flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="relative mt-1">
                        <div className={`w-3 h-3 rounded-full border-2 ${idx <= currentStep ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-slate-700'} group-hover:border-emerald-500/50 transition-colors`} />
                        {idx === currentStep && (
                          <div className="absolute inset-0">
                            {/* Neural Teal Core */}
                            <motion.div
                              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.4, 0.8] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="absolute inset-0 bg-emerald-500 rounded-full blur-[2px]"
                            />
                            {/* Floating Sparks */}
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ y: 0, opacity: 1, scale: 0.5 }}
                                animate={{ y: -15, opacity: 0, scale: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest block ${idx === currentStep ? 'text-emerald-500' : idx < currentStep ? 'text-emerald-500/60' : 'text-slate-500'} group-hover:text-emerald-400 transition-colors`}>Phase 0{idx + 1}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-tight block mt-0.5 ${idx === currentStep ? 'text-slate-400' : 'text-slate-600'}`}>{stepTitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Summary Box */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 rounded-[2rem] bg-slate-900/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Timeline</p>
                    <p className="text-sm font-black text-white italic">6 Months Plan</p>
                  </div>
                </div>
              </div>

              {/* Items Needed - Strategic Reconnaissance */}
              <div className="p-6 rounded-[2rem] bg-slate-900/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Items Needed</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-black text-white/90 italic leading-tight">
                        {regenerating ? "Synthesizing intelligence..." : (businessData.business.requirements || "Strategy pending...")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Tips */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Execution Tips</h4>
              <div className="space-y-5">
                {(businessData.business.execution_tips || [
                  'Automate core tasks',
                  'Build local presence',
                  'Launch quickly'
                ]).map((tip: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="text-blue-500 mt-0.5">
                      {i === 0 ? <Zap size={14} /> : i === 1 ? <Building size={14} /> : <Rocket size={14} />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 italic leading-tight">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT: The High-Fidelity Timeline */}
          <div className="lg:col-span-9 lg:col-start-4 space-y-16 order-1 lg:order-2">
            {roadmapSteps.map((step: any, idx: number) => {
              const isObject = typeof step === 'object' && step !== null;
              const rawTitle = isObject ? step.title : (step.includes(':') ? step.split(':')[0] : `Phase ${idx + 1}`);
              const description = isObject ? step.description : (step.includes(':') ? step.split(':').slice(1).join(':').trim() : step);
              const title = rawTitle.toUpperCase();

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  onClick={() => handleStepAdvance(idx)}
                  className="relative flex gap-8 items-start cursor-pointer"
                >
                  {/* Visual Milestone Indicator */}
                  <div className="hidden sm:flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full border-4 border-slate-900 transition-all duration-500 z-20 flex items-center justify-center relative overflow-hidden ${idx === currentStep ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : idx < currentStep ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                      <span className={`text-2xl font-black italic leading-none z-10 ${idx <= currentStep ? 'text-white' : 'text-slate-600'}`}>{idx + 1}</span>

                      {/* Inner Plasma Core */}
                      {idx === currentStep && (
                        <motion.div
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.7, 0.3],
                            filter: ["blur(4px)", "blur(8px)", "blur(4px)"]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-x-0 bottom-0 top-0 bg-emerald-300/40"
                        />
                      )}
                    </div>

                    {/* Solar Flare Sparks */}
                    {idx === currentStep && (
                      <div className="absolute h-16 w-16 pointer-events-none">
                        {[...Array(8)].map((_, sparkIdx) => (
                          <motion.div
                            key={sparkIdx}
                            initial={{ y: 20, x: (sparkIdx - 3.5) * 8, opacity: 1, scale: 0.8 }}
                            animate={{ 
                              y: -80, 
                              opacity: 0, 
                              scale: 0,
                              x: (sparkIdx - 3.5) * 12 + (Math.random() - 0.5) * 20 
                            }}
                            transition={{ 
                              duration: 1 + Math.random(), 
                              repeat: Infinity, 
                              delay: sparkIdx * 0.2, 
                              ease: "easeOut" 
                            }}
                            className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px] shadow-[0_0_10px_#10b981]"
                          />
                        ))}
                      </div>
                    )}

                    {idx !== roadmapSteps.length - 1 && (
                      <div className="relative w-0.5 h-64 -mb-16 mt-4 overflow-hidden">
                        {/* Static Background Path */}
                        <div className={`absolute inset-0 transition-all duration-1000 ${idx < currentStep ? 'bg-emerald-500' : 'bg-white/5 opacity-20'}`} />
                        
                        {/* Active Plasma Flow Beam */}
                        {idx === currentStep && (
                           <motion.div 
                             animate={{ y: [-256, 256] }}
                             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                             className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-emerald-400 to-transparent z-10 blur-[1px]"
                           />
                        )}
                        
                        {/* High-Intensity Pulse Lightning */}
                        {idx === currentStep && (
                           <motion.div 
                             animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5 }}
                             className="absolute inset-x-0 inset-y-0 bg-emerald-300/60 z-20 blur-sm origin-top"
                           />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step Strategy Card */}
                  <div className={`flex-1 p-8 sm:p-12 rounded-[3.5rem] border transition-all duration-500 backdrop-blur-2xl shadow-2xl relative overflow-hidden group ${idx === currentStep ? 'bg-slate-900/60 border-emerald-500/30 scale-[1.02]' : 'bg-slate-900/40 border-white/5 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}>
                    {/* Subtle Inner Glow */}
                    {idx === currentStep && <div className="absolute -left-20 -top-20 w-40 h-40 bg-emerald-500/20 blur-[100px]" />}

                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-10 rounded-full transition-all duration-500 ${idx === currentStep ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : idx < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                          <h3 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter uppercase leading-none truncate max-w-[250px] sm:max-w-none">
                            {title}
                          </h3>
                        </div>

                        {idx === currentStep && (
                          <div className="flex-shrink-0">
                            <div className="px-5 py-2 rounded-full bg-emerald-500 text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                              <Zap size={12} className="animate-pulse" /> Current Strategize
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed mb-12 opacity-80 max-w-3xl">
                        {description}
                      </p>

                      <div className="flex flex-wrap gap-5">
                        <button className="px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-emerald-500/10 transition-all">
                          <ShieldCheck size={16} /> High Priority
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStepAdvance(idx + 1 < roadmapSteps.length ? idx + 1 : idx); }}
                          className={`px-6 py-3 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${idx < currentStep ? 'bg-emerald-500 text-slate-900' : idx === currentStep ? 'bg-emerald-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/30'}`}
                        >
                          {idx < currentStep ? <CheckCircle size={16} /> : <Play size={16} fill="currentColor" />}
                          {idx < currentStep ? 'Completed' : idx === currentStep ? 'Active Strategy' : 'Action Needed'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); fetchTacticalInsight(step, idx); }}
                          className="px-6 py-3 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
                        >
                          <BookOpen size={16} /> Implementation Guide
                        </button>
                      </div>
                    </div>
                </motion.div>
              );
            })}

          </div>
        </div>
      </div>

      {/* IMPLEMENTATION GUIDE MODAL */}
      <AnimatePresence>
        {activeGuideStep && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveGuideStep(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-3xl bg-slate-900 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500 z-30" />
              
              {/* Modal Header - Fixed */}
              <div className="p-6 sm:p-10 pb-4 border-b border-white/5 relative z-20 bg-slate-900/50 backdrop-blur-xl">
                  <div className="flex justify-between items-start">
                     <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                              <ShieldCheck size={16} className="text-emerald-500" />
                           </div>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest truncate">TACTICAL ANALYSIS - PHASE {activeGuideStep.idx + 1}</span>
                           <div className="flex items-center gap-1.5 ml-auto bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">LIVE DATA</span>
                           </div>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight mb-1 truncate">
                           {activeGuideStep.title.replace(/Month \d+/i, '').trim() || activeGuideStep.title}
                        </h2>
                        <p className="text-emerald-400/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">{activeGuideStep.description}</p>
                     </div>
                     <button onClick={() => setActiveGuideStep(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">
                        <X size={20} />
                     </button>
                  </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 pt-6 custom-scrollbar relative z-10">
                  {guideLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                       <div className="relative">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500/30"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">Synthesizing Market Data</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">Tailoring for Indian Ecosystem...</p>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-8 pb-10">
                       <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-3">
                             <Lightbulb size={14} className="text-blue-400" />
                             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Professional Tactical Insight</span>
                          </div>
                          <p className="text-sm sm:text-base font-bold text-slate-300 italic leading-relaxed">
                             {activeGuideStep.detailed_insight || "Synthesizing professional implementation path based on regional market dynamics..."}
                          </p>
                       </div>

                       <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Strategic Reconnaissance Checklist</h4>
                          <div className="grid grid-cols-1 gap-3">
                             {(activeGuideStep.milestones || []).map((milestone: string, i: number) => (
                               <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                     <CheckCircle size={14} className="text-emerald-500 group-hover:text-white" />
                                  </div>
                                  <span className="text-sm font-black text-white italic tracking-tight">{milestone}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
               </div>

               {/* Modal Footer - Fixed */}
               <div className="p-6 sm:p-10 pt-4 border-t border-white/5 relative z-20 bg-slate-900/80 backdrop-blur-md">
                  <button 
                     onClick={() => setActiveGuideStep(null)}
                     className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/10"
                  >
                     Close Tactical Hub <ArrowRight size={16} />
                  </button>
               </div>

              {/* Design Aura */}
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UniformLayout>
  );
}
