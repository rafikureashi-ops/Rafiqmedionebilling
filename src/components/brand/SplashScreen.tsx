import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { BrandStore } from '../../lib/brandStore.js';

interface SplashScreenProps {
  onComplete: () => void;
  pharmacyName?: string;
  autoCloseDelayMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  pharmacyName = 'Sanjivani Medical & General Store',
  autoCloseDelayMs = 2800
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing offline SQLite engine...');
  const [splashSrc, setSplashSrc] = useState<string>(BrandStore.getSplash());

  useEffect(() => {
    return BrandStore.subscribe((assets) => {
      setSplashSrc(assets.splashUrl);
    });
  }, []);

  useEffect(() => {
    // Stage 1
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Syncing local medicine inventory & batches...');
    }, 600);

    // Stage 2
    const t2 = setTimeout(() => {
      setProgress(78);
      setStatusText('Verifying GST billing & FEFO registers...');
    }, 1300);

    // Stage 3
    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready! Welcome to MediOneBilling.');
    }, 2100);

    // Completion
    const t4 = setTimeout(() => {
      onComplete();
    }, autoCloseDelayMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete, autoCloseDelayMs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 overflow-hidden select-none"
    >
      {/* Background Ambience with subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          key={splashSrc}
          src={splashSrc}
          alt="MediOneBilling Splash Screen"
          className="w-full h-full object-cover opacity-25 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/95" />
      </div>

      {/* Centered Poster Card (9:16 vertical splash phone/poster layout on desktop, full on mobile) */}
      <div className="relative z-10 w-full max-w-[420px] h-[92vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between bg-black">
        {/* Splash Poster Image */}
        <div className="absolute inset-0 z-0">
          <img
            key={splashSrc}
            src={splashSrc}
            alt="MediOneBilling (MOB) Smart Pharmacy Management"
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient vignette at top and bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        </div>

        {/* Top Header Bar inside Splash */}
        <div className="relative z-10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MediOneBilling v2026</span>
          </div>

          <button
            onClick={onComplete}
            className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Interactive Loading & Launch Bar */}
        <div className="relative z-10 p-6 space-y-3">
          {/* Active Store Chip */}
          <div className="text-center">
            <span className="text-[11px] font-medium text-slate-300 drop-shadow">
              Licensed to: <strong className="text-white">{pharmacyName}</strong>
            </span>
          </div>

          {/* Animated Glowing Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-slate-800/80 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/20">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
                initial={{ width: '10%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-300 drop-shadow font-mono">
              <span className="truncate pr-2">{statusText}</span>
              <span className="font-bold text-cyan-300">{progress}%</span>
            </div>
          </div>

          {/* Quick Start Button */}
          <button
            onClick={onComplete}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Enter Billing Counter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
