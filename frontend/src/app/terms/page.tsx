"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const router = useRouter();
  const { t } = useLanguage();

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
          className="prose dark:prose-invert max-w-none"
        >
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-8 italic tracking-tighter">{t('terms_title')}</h1>
          
          <div className="space-y-8 text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{t('terms_section_1')}</h2>
              <p>{t('terms_content_1')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{t('terms_section_2')}</h2>
              <p>{t('terms_content_2')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{t('terms_section_3')}</h2>
              <p>{t('terms_content_3')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{t('terms_section_4')}</h2>
              <p>{t('terms_content_4')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{t('terms_section_5')}</h2>
              <p>{t('terms_content_5')} <span className="text-emerald-600 dark:text-emerald-400 font-bold">StarterScope7@gmail.com</span></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}