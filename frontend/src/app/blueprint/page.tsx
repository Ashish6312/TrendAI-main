"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  LayoutDashboard, 
  CreditCard, 
  User, 
  Settings, 
  Shield, 
  Zap, 
  Search, 
  Rocket, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Globe,
  Database,
  Lock,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const sitemapData = [
  {
    id: "public",
    title: "Public Gateway",
    icon: <Globe className="text-blue-500" />,
    description: "Multi-region entry points for global visitors.",
    color: "from-blue-500 to-indigo-600",
    nodes: [
      { name: "Home", path: "/", icon: <Home size={14} />, desc: "High-fidelity landing hub" },
      { name: "Acquisition", path: "/acquisition-tiers", icon: <CreditCard size={14} />, desc: "Intelligence tiering & conversion" },
      { name: "Contact", path: "/contact", icon: <Globe size={14} />, desc: "Synchronous support channel" },
    ]
  },
  {
    id: "auth",
    title: "Neural Gateway",
    icon: <Lock className="text-purple-500" />,
    description: "Secure authentication & session reconciliation.",
    color: "from-purple-500 to-pink-600",
    nodes: [
      { name: "Sign In", path: "/auth", icon: <Lock size={14} />, desc: "Institutional entry" },
      { name: "Sign Up", path: "/auth?tab=signup", icon: <Shield size={14} />, desc: "Vault creation" },
    ]
  },
  {
    id: "intelligence",
    title: "Intelligence Hub",
    icon: <Zap className="text-emerald-500" />,
    description: "Core synthesis & market reconnaissance engine.",
    color: "from-emerald-500 to-teal-500",
    nodes: [
      { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={14} />, desc: "Live market synthesis" },
      { name: "Reconnaissance", path: "/roadmap", icon: <Search size={14} />, desc: "Tactical market breakdown" },
      { name: "Strategic Roadmap", path: "/business-plan", icon: <Rocket size={14} />, desc: "Execution architecture" },
    ]
  },
  {
    id: "management",
    title: "Operational Vault",
    icon: <Database className="text-amber-500" />,
    description: "Persistence services for user settings & intel.",
    color: "from-amber-500 to-orange-600",
    nodes: [
      { name: "Profile", path: "/profile", icon: <User size={14} />, desc: "Identity configuration" },
      { name: "The Vault", path: "/profile?tab=vault", icon: <Database size={14} />, desc: "Saved intelligence storage" },
      { name: "API Keys", path: "/api-keys", icon: <Settings size={14} />, desc: "Infrastructure access" },
    ]
  }
];

export default function AnimatedSitemap() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* Background Neural Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[#020617]" />
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)`,
            backgroundSize: `40px 40px`
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        {/* Header */}
        <div className="text-center space-y-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] italic"
          >
            <Sparkles size={12} className="animate-pulse" />
            System Architecture v6.4.8
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none"
          >
            Strategic <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-8">Blueprint</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto font-medium"
          >
            Navigational mapping of the TrendAI Neural Network. Discover the flow of intelligence across our integrated ecosystems.
          </motion.p>
        </div>

        {/* Dynamic Animated Site Map */}
        <div className="relative">
          {/* Central Core Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-blue-500/50 to-transparent -translate-x-1/2 hidden lg:block" />

          <div className="space-y-12 relative">
            {sitemapData.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onMouseEnter={() => setActiveLayer(layer.id)}
                onMouseLeave={() => setActiveLayer(null)}
                className={`relative flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}
              >
                {/* Node Card */}
                <div className={`w-full lg:w-1/2 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'} space-y-4`}>
                  <div className={`inline-flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500 ${activeLayer === layer.id ? 'border-emerald-500/50 scale-105' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${layer.color} flex items-center justify-center text-white shadow-lg rotate-3`}>
                      {layer.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-black italic tracking-tight">{layer.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{layer.description}</p>
                    </div>
                  </div>
                </div>

                {/* Connection Point */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center hidden lg:flex">
                  <div className={`w-4 h-4 rounded-full border-2 bg-[#020617] transition-all duration-500 ${activeLayer === layer.id ? 'border-emerald-500 scale-150 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-slate-700'}`}>
                    <div className={`inset-1 rounded-full animate-ping ${activeLayer === layer.id ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  </div>
                </div>

                {/* Child Nodes */}
                <div className="w-full lg:w-1/2">
                  <div className="grid gap-3">
                    {layer.nodes.map((node, nIndex) => (
                      <motion.div
                        key={node.path}
                        whileHover={{ x: 10, scale: 1.02 }}
                        className="group relative bg-[#0b1120]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer"
                      >
                        <Link href={node.path} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                              {node.icon}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{node.name}</h4>
                              <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-widest">{node.desc}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-32 text-center"
        >
          <div className="inline-block p-1 rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-emerald-500/20">
            <Link 
              href="/dashboard"
              className="flex items-center gap-4 px-12 py-6 bg-[#020617] rounded-[2rem] hover:bg-white/5 transition-all group"
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Ignite Engine</span>
                <span className="text-xl font-bold italic">Initialize Dashboard</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform">
                <ArrowRight size={24} strokeWidth={3} />
              </div>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Institutional Metadata Decorator */}
      <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-between items-end pointer-events-none opacity-40">
        <div className="space-y-1">
          <div className="text-[10px] font-mono tracking-tighter">NODE_INDEX: 0x448B92</div>
          <div className="text-[10px] font-mono tracking-tighter">LATENCY_SYNC: STABLE</div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest">© 2026 TrendAI Institutional</div>
          <div className="text-[10px] font-mono tracking-tighter">V6.4.8_BLUEPRINT_SYNC</div>
        </div>
      </div>
    </div>
  );
}
