import React from 'react';
import { MobLogo } from '../brand/MobLogo.js';
import { Pharmacy, SubscriptionPlanConfig } from '../../types/pharmacy.js';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  Sliders,
  Smartphone,
  Palette
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pharmacy: Pharmacy | null;
  subscriptionPlan: SubscriptionPlanConfig | undefined;
  remainingSeconds: number;
  isOffline: boolean;
  pendingSyncCount: number;
  onOpenSubscriptionModal: () => void;
  onOpenSyncModal: () => void;
  onOpenProfileModal: () => void;
  onOpenApkModal: () => void;
  onOpenBrandModal: () => void;
  onOpenSplash?: () => void;
  onLogout: () => void;
  isSuperAdmin: boolean;
  onToggleSuperAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  pharmacy,
  subscriptionPlan,
  remainingSeconds,
  isOffline,
  pendingSyncCount,
  onOpenSubscriptionModal,
  onOpenSyncModal,
  onOpenProfileModal,
  onOpenApkModal,
  onOpenBrandModal,
  onOpenSplash,
  onLogout,
  isSuperAdmin,
  onToggleSuperAdmin
}) => {
  // Format remaining trial hours
  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hours}h ${mins}m left`;
  };

  const navItems = [
    { id: 'billing', label: 'Counter POS' },
    { id: 'inventory', label: 'Medicines' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'contacts', label: 'Ledger' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'financials', label: 'P&L Reports' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('billing')}
            className="flex items-center text-left hover:opacity-95 transition-opacity"
          >
            <MobLogo size="md" showSubtitle={false} />
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-Line, 4-6 tabs) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navItems.map(item => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors pb-1 text-sm ${
                  active
                    ? 'text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600 dark:border-teal-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Super Admin Control Tab */}
          <button
            onClick={onToggleSuperAdmin}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors pb-1 text-sm ${
              isSuperAdmin
                ? 'text-amber-600 dark:text-amber-400 font-semibold border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-amber-600'
            }`}
            title="Super Admin Platform Owner Console"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Platform Owner</span>
          </button>
        </nav>

        {/* Zone 3: Sync Status + Subscription + Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Multi-Device & Offline Sync Status Indicator */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isOffline
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : pendingSyncCount > 0
                ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}
            title="Click to view Multi-Device Synchronization & Offline Storage"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Offline Mode</span>
                {pendingSyncCount > 0 && (
                  <span className="bg-amber-600 text-white rounded px-1 text-[10px]">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="hidden sm:inline">Syncing ({pendingSyncCount})</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Cloud Synced</span>
              </>
            )}
          </button>

          {/* Subscription Status Pill */}
          <button
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {pharmacy?.subscriptionPlanId === 'trial' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Trial: {formatCountdown(remainingSeconds)}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="uppercase">{pharmacy?.subscriptionPlanId || 'Basic'} Plan</span>
              </>
            )}
          </button>

          {/* Mobile App / APK Install Button */}
          <button
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-600/20 transition active:scale-95"
            title="Download debug.apk file & Mobile Installer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>debug.apk</span>
            <span className="hidden md:inline px-1 py-0.2 bg-white/20 text-[10px] rounded uppercase font-black">
              APK
            </span>
          </button>

          {/* User/Pharmacy Account Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenBrandModal}
              className="p-1.5 rounded-lg text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Customize Pharmacy Logo & Splash Screen"
            >
              <Palette className="w-4 h-4 text-teal-600" />
            </button>

            {onOpenSplash && (
              <button
                onClick={onOpenSplash}
                className="p-1.5 rounded-lg text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="View App Splash Screen"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
            )}

            <button
              onClick={onOpenProfileModal}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={pharmacy?.name || 'Store Profile'}
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              currentTab === item.id
                ? 'bg-teal-600 text-white font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
