"use client";

import { ArrowLeft, Shield, CheckCircle, FileText, Globe, AlertCircle, Lock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function CompliancePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const standards = [
    { title: t('comp_section_1'), desc: t('comp_content_1'), icon: <Shield className="text-emerald-500" /> },
    { title: t('comp_section_2'), desc: t('comp_content_2'), icon: <Lock className="text-blue-500" /> },
    { title: t('comp_section_3'), desc: t('comp_content_3'), icon: <Zap className="text-blue-500" /> },

    { title: t('comp_section_4'), desc: t('comp_content_4'), icon: <FileText className="text-purple-500" /> }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all group mb-8 font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('go_back')}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
             <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-2">
                <Shield size={40} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{t('comp_title')}</h1>
             <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
               {t('comp_subtitle')}
             </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {standards.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  {s.icon}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed font-medium">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 w-fit">
                  <CheckCircle size={10} />
                  Verified
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-sm text-slate-500 dark:text-gray-500 font-medium">
              Need more info? Contact us at <span className="text-emerald-600 dark:text-emerald-400 font-bold">StarterScope7@gmail.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
