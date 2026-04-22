"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Printer, Building2, MapPin, Globe, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    dodo_payment_id: string;
    amount: string | number;
    currency: string;
    plan_name: string;
    billing_cycle: string;
    payment_date: string;
    status: string;
  } | null;
  userData: {
    name: string;
    email: string;
    company?: string;
    location?: string;
  };
}

export default function InvoiceModal({ isOpen, onClose, payment, userData }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const element = invoiceRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#020617",
        onclone: (clonedDoc) => {
          // EXHAUSTIVE SANITIZATION: html2canvas recursively parses the DOM
          // Tailwind v4 uses modern colors (oklab/oklch) which crash jspdf/html2canvas
          const allElements = clonedDoc.querySelectorAll('*');
          
          // 1. STRIP ALL STYLE TAGS (Prevents global oklch/oklab definitions)
          const styleBlocks = clonedDoc.querySelectorAll('style');
          styleBlocks.forEach(style => {
            let css = style.innerHTML;
            if (css.includes('oklch') || css.includes('oklab') || css.includes('lab(') || css.includes('hwb(')) {
              // Cleanse all modern colors to safe hex fallbacks
              css = css.replace(/oklch\([^)]+\)/g, '#3b82f6');
              css = css.replace(/oklab\([^)]+\)/g, '#3b82f6');
              css = css.replace(/lab\([^)]+\)/g, '#3b82f6');
              css = css.replace(/hwb\([^)]+\)/g, '#3b82f6');
              style.innerHTML = css;
            }
          });

          // 2. SANITIZE ALL COMPUTED AND INLINE STYLES
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (!htmlEl.style) return;

            // Aggressive cssText cleanup for any remaining modern color leaks
            const cssText = htmlEl.style.cssText;
            if (cssText && (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('var(--'))) {
              htmlEl.style.cssText = cssText
                .replace(/oklch\([^)]+\)/g, '#3b82f6')
                .replace(/oklab\([^)]+\)/g, '#3b82f6')
                .replace(/var\(--[^)]+\)/g, '#3b82f6');
            }

            const style = window.getComputedStyle(htmlEl);
            const sanitizeValue = (val: string) => {
              if (!val || val === 'none' || val === 'transparent') return val;
              if (
                val.includes('oklch') || 
                val.includes('oklab') || 
                val.includes('lab(') || 
                val.includes('hwb(') ||
                val.includes('var(--')
              ) {
                // Heuristic conversion: Emerald/Greenish? -> Green hex
                if (val.includes('150') || val.includes('emerald') || val.includes('160')) return '#10b981';
                // Purple? -> Purple hex
                if (val.includes('270') || val.includes('purple')) return '#8b5cf6';
                return '#3b82f6'; // Standard blue fallback
              }
              return val;
            };

            // Force apply sanitized styles as inline overrides
            htmlEl.style.color = sanitizeValue(style.color);
            htmlEl.style.backgroundColor = sanitizeValue(style.backgroundColor);
            htmlEl.style.borderColor = sanitizeValue(style.borderColor);
            
            // Critical for gradients
            if (style.backgroundImage && (style.backgroundImage.includes('oklch') || style.backgroundImage.includes('oklab'))) {
               htmlEl.style.backgroundImage = 'none';
               htmlEl.style.backgroundColor = '#020617';
            }

            htmlEl.style.boxShadow = 'none'; 
            htmlEl.style.textShadow = 'none';
            htmlEl.style.outline = 'none'; // CRITICAL: outlines often use color-mix with oklab

            // SVG specific styles (Lucide icons)
            if (el.tagName.toLowerCase() === 'svg' || el.parentElement?.tagName.toLowerCase() === 'svg') {
              htmlEl.style.fill = sanitizeValue(style.fill);
              htmlEl.style.stroke = sanitizeValue(style.stroke);
            }
          });

          const clonedElement = clonedDoc.getElementById('printable-invoice');
          if (clonedElement) {
            clonedElement.style.padding = '40px';
            clonedElement.style.margin = '0';
            clonedElement.style.width = '1000px';
            clonedElement.style.minHeight = 'auto';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.backgroundColor = '#020617';
            clonedElement.style.color = 'white';
          }
        }
      });
      
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
      pdf.save(`StarterScope-Receipt-${payment.dodo_payment_id || 'DEMO'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      window.print();
    }
  };

  const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
  const currencySymbol = payment.currency === 'INR' ? '₹' : '$';

  // Dynamic theme based on plan (Using Literal Hex Colors for PDF compatibility)
  const getPlanTheme = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('enterprise') || name.includes('dominance') || name.includes('territorial')) 
      return { primary: '#8b5cf6', secondary: '#a78bfa', text: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]', shadow: 'shadow-[#8b5cf6]/20' };
    if (name.includes('growth') || name.includes('accelerator')) 
      return { primary: '#6366f1', secondary: '#818cf8', text: 'text-[#6366f1]', bg: 'bg-[#6366f1]', shadow: 'shadow-[#6366f1]/20' };

    if (name.includes('professional') || name.includes('architect')) 
      return { primary: '#10b981', secondary: '#34d399', text: 'text-[#10b981]', bg: 'bg-[#10b981]', shadow: 'shadow-[#10b981]/20' };
    if (name.includes('starter') || name.includes('venture') || name.includes('strategist')) 
      return { primary: '#3b82f6', secondary: '#60a5fa', text: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]', shadow: 'shadow-[#3b82f6]/20' };
    return { primary: '#6b7280', secondary: '#9ca3af', text: 'text-[#6b7280]', bg: 'bg-[#6b7280]', shadow: 'shadow-[#6b7280]/20' };
  };

  const planTheme = getPlanTheme(payment.plan_name);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="relative w-full h-full sm:h-auto sm:max-w-5xl bg-slate-900 border-none sm:border border-white/10 sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[100vh] sm:max-h-[95vh]"
        >
          {/* Action Header */}
          <div className="sticky top-0 z-20 p-4 sm:p-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${planTheme.text} mb-0.5`}>Payment Document</span>
              <h2 className="text-white font-black text-sm italic tracking-tight">Receipt #{payment.dodo_payment_id?.slice(-8).toUpperCase() || 'DEMO'}</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-sm group"
                >
                  <Printer size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Print Receipt</span>
                </button>
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl ${planTheme.bg} hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl group`}
                  style={{ boxShadow: `0 10px 20px -5px ${planTheme.primary}40` }}
                >
                  <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="hidden sm:inline">Save PDF</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center border border-white/5 ml-2"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Invoice Body - Dark Theme & One Page Optimization */}
          <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-8 custom-scrollbar relative">
            <div 
              className="mx-auto bg-[#020617] text-white overflow-hidden shadow-2xl relative border border-white/5 sm:rounded-3xl" 
              id="printable-invoice" 
              ref={invoiceRef}
              style={{ 
                width: '100%',
                maxWidth: '850px',
                minHeight: 'auto',
                padding: '40px sm:60px'
              }}
            >
              <div className="relative space-y-12">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-white/5 pb-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border border-white/10 group">
                        <img src="/brand-logo-v3.png" className="w-full h-full object-contain" alt="StarterScope" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tighter text-white italic">StarterScope</h1>
                        <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${planTheme.text}`}>Global Intelligence Hub</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 opacity-60">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Billed From</p>
                      <div className="text-[11px] font-medium leading-relaxed">
                        <p>StarterScope Intelligence Corp.</p>
                        <p>123 High-Alpha Way, Palo Alto</p>
                        <p>CA 94301, USA</p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right space-y-4">
                    <div>
                      <h2 className="text-4xl sm:text-6xl font-black text-white/5 uppercase tracking-tighter leading-none mb-1">RECEIPT</h2>
                      <p className="text-sm font-black text-white italic uppercase tracking-[0.2em]">{payment.status === 'success' || payment.status === 'captured' ? 'Fully Settled' : 'Pending'}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Transaction ID</span>
                      <p className={`font-mono text-xs font-bold ${planTheme.text}`}>{payment.dodo_payment_id?.toUpperCase() || 'PROV-INTEL-2024'}</p>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-white/5 pb-12">
                  <div className="space-y-4">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${planTheme.text} italic`}>Billed To</h3>
                    <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5">
                      <p className="font-black text-xl text-white tracking-tighter mb-1">{userData.name}</p>
                      <p className="text-sm text-slate-400 font-medium mb-4">{userData.email}</p>
                      {(userData.company || userData.location) && (
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-2 opacity-60">
                          {userData.company && (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                              <Building2 size={12} className={planTheme.text} /> {userData.company}
                            </div>
                          )}
                          {userData.location && (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                              <MapPin size={12} className={planTheme.text} /> {userData.location}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-6 sm:items-end">
                    <div className="sm:text-right">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Issue Date</h3>
                      <p className="text-lg font-black text-white">{new Date(payment.payment_date || (payment as any).created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="sm:text-right">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Billing Protocol</h3>
                      <p className="text-lg font-black text-white capitalize italic">{payment.billing_cycle || 'One-time'} Fulfillment</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b border-white/20 ${planTheme.text}`}>
                        <th className="pb-6 text-left text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Tier</th>
                        <th className="pb-6 text-center text-[10px] font-black uppercase tracking-[0.4em]">Qty</th>
                        <th className="pb-6 text-right text-[10px] font-black uppercase tracking-[0.4em]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-10">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${planTheme.bg} bg-opacity-10 border border-white/10 flex items-center justify-center ${planTheme.text}`}>
                              <ShieldCheck size={24} />
                            </div>
                            <div>
                              <p className="font-black text-xl text-white tracking-tighter italic uppercase">{payment.plan_name}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Autonomous Analysis Node</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-10 text-center font-black text-white text-lg">01</td>
                        <td className="py-10 text-right font-black text-white text-2xl tracking-tighter">{currencySymbol}{amount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]">
                  <div className="flex items-center gap-4 text-emerald-500">
                    <CheckCircle2 size={32} />
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest">Transaction Verified</p>
                      <p className="text-[10px] font-bold opacity-60">Status: Successfully Cleared via Protocol</p>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Settlement Amount:</span>
                    <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white">{currencySymbol}{amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-40">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Authorized Digital Receipt</p>
                  <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.2em]">
                    <span>StarterScope.HQ/ALPHA</span>
                    <span>Ref: {String(payment.id || '').slice(0,8).toUpperCase()}</span>
                    <span>© 2026 Intelligence Corp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <style jsx global>{`
          @media print {
            @page { size: A4; margin: 0; }
            body { 
              background: #020617 !important; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-invoice {
              width: 210mm !important;
              height: 297mm !important;
              padding: 20mm !important;
              background: #020617 !important;
              color: white !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Explicit color enforcement for print engines */
            #printable-invoice h1, #printable-invoice h2, #printable-invoice h3, 
            #printable-invoice p, #printable-invoice span, #printable-invoice td, 
            #printable-invoice th, #printable-invoice div {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
