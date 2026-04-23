"use client";

import { ArrowLeft, Mail, MessageSquare, MapPin, Send, Headset } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";

export default function ContactPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || ""
      }));

      // Fetch full profile for context
      const fetchProfile = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscopebackend-git-master-ashish-sharmas-projects-7e8014b8.vercel.app';
          const res = await fetch(`${apiUrl}/api/users/${session.user?.email}/profile`);
          if (res.ok) {
            const data = await res.json();
            setProfileData(data);
          }
        } catch (e) {
          console.error("Context fetch failed:", e);
        }
      };
      fetchProfile();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscopebackend-git-master-ashish-sharmas-projects-7e8014b8.vercel.app';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profile_context: profileData?.user || profileData // Send refined user data if available
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transmit message');
      }

      alert(t('contact_success'));
      setFormData(prev => ({ ...prev, subject: "", message: "" }));
    } catch (error) {
      console.error("Transmission Error:", error);
      alert("Neural transmission failed. Please try again or email StarterScope7@gmail.com directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactItems = [
    { icon: <Mail />, title: t('contact_mail_title'), detail: "StarterScope7@gmail.com", subtext: t('contact_mail_sub') },
    { icon: <MapPin />, title: t('contact_loc_title'), detail: "Operations Command", subtext: "India Remote Network" },
    { icon: <Headset />, title: t('contact_support_title'), detail: "Priority Support", subtext: t('contact_support_sub') }
  ];

  const stats = [
    { label: "Global Status", val: "Operational", color: "text-emerald-500" },
    { label: "AI Latency", val: "14ms", color: "text-blue-500" },
    { label: "AI Core Speed", val: "99.8 TFLOPS", color: "text-purple-500" },
    { label: "Secured Nodes", val: "1,240+", color: "text-emerald-500" }

  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all group mb-12 font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('go_back')}</span>
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
          >
            <div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-4">{t('contact_title')}</h1>
              <p className="text-xl text-slate-500 dark:text-gray-400 font-medium leading-relaxed max-w-md">
                {t('contact_subtitle')}
              </p>
            </div>

            <div className="space-y-8">
              {contactItems.map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 transition-all group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/20">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">{item.title}</h4>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{item.detail}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{item.subtext}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 sm:p-10 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 p-3">
              <MessageSquare className="text-slate-200 dark:text-white/5 w-16 h-16" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('contact_form_name')}</label>
                  <input
                    required
                    readOnly
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('contact_id_self')}
                    className="w-full px-5 py-4 bg-slate-100/50 dark:bg-black/40 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 transition-all outline-none text-sm font-bold opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('contact_form_email')}</label>
                  <input
                    required
                    readOnly
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@email.com"
                    className="w-full px-5 py-4 bg-slate-100/50 dark:bg-black/40 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 transition-all outline-none text-sm font-bold opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('contact_form_subject')}</label>
                <input
                  required
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={t('contact_obj')}
                  className="w-full px-5 py-4 bg-white dark:bg-black/20 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 transition-all outline-none text-sm font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('contact_form_message')}</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('contact_msg_dir')}
                  className="w-full px-5 py-4 bg-white dark:bg-black/20 border-2 border-slate-200 dark:border-white/5 rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-500 transition-all outline-none text-sm font-bold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 italic"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('contact_transmit')}</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
              <div className={`text-sm font-black italic ${stat.color}`}>{stat.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
