import React, { useState, useRef } from 'react';
import { BrandStore } from '../../lib/brandStore.js';
import { MobLogo } from './MobLogo.js';
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle,
  Eye,
  Sparkles,
  X,
  Smartphone,
  Layers,
  FileCheck
} from 'lucide-react';

interface BrandCustomizerModalProps {
  onClose: () => void;
  onPreviewSplash: () => void;
}

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  onClose,
  onPreviewSplash
}) => {
  const [logoPreview, setLogoPreview] = useState<string>(BrandStore.getLogo());
  const [splashPreview, setSplashPreview] = useState<string>(BrandStore.getSplash());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await BrandStore.readFileAsDataUrl(file);
      setLogoPreview(dataUrl);
    } catch (err) {
      console.error('Failed to read logo image:', err);
    }
  };

  const handleSplashFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await BrandStore.readFileAsDataUrl(file);
      setSplashPreview(dataUrl);
    } catch (err) {
      console.error('Failed to read splash image:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await BrandStore.updateAssets({
        logoUrl: logoPreview,
        splashUrl: splashPreview
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save brand assets:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const reset = await BrandStore.reset();
    setLogoPreview(reset.logoUrl);
    setSplashPreview(reset.splashUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50 via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Brand & Visual Identity Customizer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update the official pharmacy software logo and mobile splash screen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner in Urdu & English */}
          <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 leading-relaxed flex gap-2.5 items-start">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Custom Logo & Splash Screen Support</p>
              <p className="text-teal-800 dark:text-teal-300">
                Aap apna pharmacy logo aur splash screen image yahan upload kar sakte hain ya chat mein bhej sakte hain. Ye automatically header, billing invoices, reports, aur mobile app splash screen par lag jayega.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Logo */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Software Logo</h4>
                  <p className="text-[11px] text-slate-500">Circular / Square emblem for header & invoices</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                  PNG / SVG / JPG
                </span>
              </div>

              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-500 shadow-md flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Live Header & Receipt Preview
                  </span>
                </div>
              </div>

              {/* Upload Logo Button */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFile}
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-lg border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Logo Image</span>
              </button>
            </div>

            {/* Section 2: Splash Screen */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mobile Splash Screen</h4>
                  <p className="text-[11px] text-slate-500">App launch screen poster (9:16 portrait)</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  Full HD
                </span>
              </div>

              {/* Splash Preview */}
              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <div className="w-24 h-36 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-md relative bg-black">
                  <img
                    src={splashPreview}
                    alt="Splash Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/splash.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-1.5">
                    <span className="text-[8px] font-bold text-white bg-black/60 px-1 py-0.5 rounded self-start">MOB</span>
                    <span className="text-[8px] font-medium text-cyan-300 self-center">Loading...</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onPreviewSplash();
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Test Full Splash Screen</span>
                </button>
              </div>

              {/* Upload Splash Button */}
              <input
                ref={splashInputRef}
                type="file"
                accept="image/*"
                onChange={handleSplashFile}
                className="hidden"
              />
              <button
                onClick={() => splashInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Splash Image</span>
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl flex items-center justify-between">
            <span>Any image uploaded here takes effect across all screens, tabs, and exported invoices immediately.</span>
            <button
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 shrink-0 ml-3"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-4 h-4" />
                <span>Brand assets updated successfully!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Save & Apply Everywhere</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
