import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../../lib/usePWAInstall.js';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Terminal,
  X,
  Copy,
  Check,
  FileCode,
  AlertTriangle,
  Layers,
  Sparkles,
  Github,
  FolderGit2,
  Workflow,
  CloudUpload,
  ArrowRight
} from 'lucide-react';

interface MobileApkModalProps {
  onClose: () => void;
}

export const MobileApkModal: React.FC<MobileApkModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'download' | 'github' | 'webapk' | 'qrcode' | 'capacitor'>('download');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://medione.app';

  useEffect(() => {
    QRCode.toDataURL(currentAppUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [currentAppUrl]);

  const handleDownloadApk = () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    // Create a temporary link element to trigger the browser download
    const link = document.createElement('a');
    link.href = '/download/medione-debug.apk';
    link.setAttribute('download', 'medione-pharmacy-debug.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
    }, 1200);
  };

  const handleDownloadSource = () => {
    const link = document.createElement('a');
    link.href = '/download/medione-android-source.zip';
    link.setAttribute('download', 'medione-android-project-source.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadGithubProject = () => {
    const link = document.createElement('a');
    link.href = '/download/medione-github-project.zip';
    link.setAttribute('download', 'medione-github-project.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gitCommandsText = `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git\ngit push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitCommandsText);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // PWABuilder direct link
  const pwaBuilderLink = `https://www.pwabuilder.com?url=${encodeURIComponent(currentAppUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Android APK & Mobile Installation</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  debug.apk
                </span>
              </div>
              <p className="text-xs text-white/90">
                Direct Android APK installer, WebAPK 1-tap setup, & source package
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'download'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct Download debug.apk</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Actions APK (گٹ ہب سے APK)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">
              Auto
            </span>
          </button>

          <button
            onClick={() => setActiveTab('webapk')}
            className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'webapk'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Tap WebAPK (Browser)</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'qrcode'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('capacitor')}
            className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'capacitor'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Android Studio Project</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: Direct Download debug.apk */}
          {activeTab === 'download' && (
            <div className="space-y-5">
              {/* Main Download Card */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/30">
                      APK
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        medione-pharmacy-debug.apk
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>v2026.1.0-debug</span>
                        <span>·</span>
                        <span>Universal Android (5.0+)</span>
                        <span>·</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Signed Package</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      125 KB
                    </span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleDownloadApk}
                  disabled={isDownloading}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-[0.98] disabled:opacity-75"
                >
                  <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span>
                    {isDownloading ? 'Starting APK Download...' : 'Download medione-pharmacy-debug.apk'}
                  </span>
                </button>

                {downloadSuccess && (
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Download started! Check your browser downloads or notification bar.</span>
                  </div>
                )}

                {/* Secondary source project zip download */}
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    Need the complete Android Studio source project?
                  </span>
                  <button
                    onClick={handleDownloadSource}
                    className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Download Project (.zip)</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Installation Instructions */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>How to Install on Android Mobile (موبائل میں انسٹال کا طریقہ)</span>
                  </h5>
                  <span className="text-[10px] text-slate-400">4 Simple Steps</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        1
                      </span>
                      <strong className="text-slate-900 dark:text-white">Download APK</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Tap the green download button above to save the <code>medione-pharmacy-debug.apk</code> to your phone.
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      اوپر دیے گئے بٹن سے APK فائل ڈاؤن لوڈ کریں۔
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        2
                      </span>
                      <strong className="text-slate-900 dark:text-white">Open the File</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Tap on the downloaded file from your mobile notification bar or Files/Downloads folder.
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      ڈاؤن لوڈ مکمل ہونے پر نوٹیفکیشن یا ڈاؤن لوڈز فولڈر سے اوپن کریں۔
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        3
                      </span>
                      <strong className="text-slate-900 dark:text-white">Allow Unknown Sources</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      If Android prompts &quot;Install unknown apps&quot;, tap <strong>Settings</strong> &gt; toggle <strong>Allow from this source</strong>.
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      اگر سیکیورٹی پرامپٹ آئے تو سیٹنگز میں جا کر 'Allow' کر دیں۔
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        4
                      </span>
                      <strong className="text-slate-900 dark:text-white">Install &amp; Launch</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Tap <strong>Install</strong>. Once done, launch MediOneBilling with full offline counter sync!
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      'Install' پر کلک کریں اور ایپ استعمال کرنا شروع کریں۔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GitHub APK Auto-Build */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              {/* GitHub Header Card */}
              <div className="p-5 rounded-2xl border-2 border-slate-700/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
                      <Github className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">
                          GitHub Actions Automated APK Builder
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                          Ready &amp; Configured
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        GitHub CI/CD workflow <code className="text-emerald-400 font-mono text-[11px]">.github/workflows/build-apk.yml</code> is set up!
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto border border-white/15"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Create Repo on GitHub</span>
                  </a>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-700/40">
                  <strong className="text-white">اردو رہنمائی:</strong> اس پروجیکٹ میں خودکار GitHub Actions ورک فلو اور مکمل اینڈرائیڈ گریڈل سورس کوڈ تیار کر دیا گیا ہے۔ آپ صرف کوڈ GitHub پر پش کریں، GitHub کلاؤڈ پر آپ کی <code className="text-emerald-300">medione-pharmacy-debug.apk</code> بنا کر دے گا جسے آپ فوری ڈاؤن لوڈ کر سکتے ہیں!
                </p>

                {/* Download Entire GitHub Ready Project (.zip) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                      <FolderGit2 className="w-4 h-4" />
                      <span>Download GitHub-Ready Project Zip (13 MB)</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Includes <code className="text-slate-200 font-mono text-[11px]">.github/workflows</code>, <code className="text-slate-200 font-mono text-[11px]">android/</code>, and full source code
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadGithubProject}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Project .zip</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-600" />
                  <span>How to Get APK from GitHub (گٹ ہب سے APK حاصل کرنے کا طریقہ)</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        1
                      </span>
                      <strong className="text-slate-900 dark:text-white">Push Code to GitHub (کوڈ پش کریں)</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      Terminal mein yeh commands chalayein ya GitHub website par files upload karein:
                    </p>
                    <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[10px] relative group overflow-x-auto">
                      <pre className="text-emerald-400 whitespace-pre-wrap">{gitCommandsText}</pre>
                      <button
                        onClick={handleCopyGitCommands}
                        className="mt-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] rounded flex items-center gap-1 transition"
                      >
                        {copiedGit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedGit ? 'Copied Commands!' : 'Copy Git Commands'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        2
                      </span>
                      <strong className="text-slate-900 dark:text-white">Go to &quot;Actions&quot; Tab (ایکشنز ٹیب کھولیں)</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      Apne GitHub repository page par upar <strong>Actions</strong> tab par click karein.
                    </p>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Workflow: &quot;Build &amp; Release Android APK&quot;</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                        Push hote hi GitHub automatically Ubuntu runner par APK banana shuru kar dega (2-3 mins).
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        3
                      </span>
                      <strong className="text-slate-900 dark:text-white">Download APK Artifact (فائل ڈاؤن لوڈ کریں)</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      Completed green checkmark ✅ wale run par click karein aur page ke niche jayein:
                    </p>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                        <span>📦 Artifacts Section</span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded">Ready</span>
                      </div>
                      <p className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                        👉 medione-pharmacy-debug-apk
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Is par click karte hi APK download shuru ho jayegi!
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold inline-flex items-center justify-center text-[11px]">
                        4
                      </span>
                      <strong className="text-slate-900 dark:text-white">GitHub Releases (مستقل ڈاؤن لوڈ لنک)</strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      Repository ke right sidebar mein <strong>Releases</strong> section se direct <code>medione-pharmacy-debug.apk</code> download ki ja sakti hai.
                    </p>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Phone ya PC dono par direct download link hamesha live rahega!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WebAPK Direct Install */}
          {activeTab === 'webapk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-200">
                      Official Android WebAPK Technology
                    </h4>
                    <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      On Chrome or Samsung Internet, Android builds a native <strong>WebAPK</strong> automatically. It installs to your phone&apos;s app drawer like WhatsApp, works offline, and requires no unknown source permissions!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-4">
                {isInstalled ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      App Already Installed!
                    </h4>
                    <p className="text-xs text-slate-500">
                      MediOneBilling is installed on this device. Launch it directly from your home screen.
                    </p>
                  </div>
                ) : isInstallable ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Ready to Install on this Device
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Tap the button below to install the official WebAPK directly.
                      </p>
                    </div>

                    <button
                      onClick={install}
                      className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
                    >
                      <Zap className="w-4 h-4" />
                      <span>1-Tap Install App on Phone</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      To install via Chrome on your phone:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold inline-flex items-center justify-center text-[11px] mb-1">
                          1
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">Open in Chrome</p>
                        <p className="text-[11px] text-slate-500">Open this URL in Google Chrome on your phone.</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold inline-flex items-center justify-center text-[11px] mb-1">
                          2
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">Tap Menu (⋮)</p>
                        <p className="text-[11px] text-slate-500">Tap the three dots icon in top right corner.</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold inline-flex items-center justify-center text-[11px] mb-1">
                          3
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">&apos;Install App&apos;</p>
                        <p className="text-[11px] text-slate-500">Select &apos;Install app&apos; or &apos;Add to Home screen&apos;.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Scan QR on Mobile */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4 text-center">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Scan to Open &amp; Install on Phone
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Point your Android camera at the QR code to open MediOneBilling instantly
                </p>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner w-fit mx-auto">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="App QR Code" className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    Generating QR code...
                  </div>
                )}
              </div>

              {/* URL Display */}
              <div className="flex items-center gap-2 max-w-md mx-auto p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <input
                  type="text"
                  readOnly
                  value={currentAppUrl}
                  className="bg-transparent flex-1 truncate px-2 text-slate-700 dark:text-slate-300 font-mono text-[11px] outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1 transition shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Capacitor / Android Studio */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Full Android Studio &amp; Gradle Build Kit:
                </div>
                <button
                  onClick={handleDownloadSource}
                  className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download android-project.zip</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto space-y-2">
                <p className="text-slate-400"># 1. Open the project in Android Studio or terminal</p>
                <p className="text-emerald-400">cd android</p>
                <p className="text-slate-400 mt-2"># 2. Build debug APK using Gradle</p>
                <p className="text-emerald-400">./gradlew assembleDebug</p>
                <p className="text-slate-400 mt-2"># 3. Output debug APK location:</p>
                <p className="text-cyan-300">app/build/outputs/apk/debug/app-debug.apk</p>
                <p className="text-slate-400 mt-2"># 4. Install directly to connected phone via ADB:</p>
                <p className="text-emerald-400">adb install -r app/build/outputs/apk/debug/app-debug.apk</p>
              </div>

              {/* PWABuilder Store packaging button */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Google Play Store Package</p>
                  <p className="text-slate-500">Generate signed Google Play Store App Bundle (.aab)</p>
                </div>
                <a
                  href={pwaBuilderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>PWABuilder</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Standalone Android APK &amp; WebAPK Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
