import React, { useState, useEffect, useCallback } from 'react';
import {
  Pharmacy,
  Medicine,
  Supplier,
  Customer,
  Invoice,
  SubscriptionPlanConfig,
  PlatformAnnouncement
} from './types/pharmacy.js';
import { OfflineStore } from './lib/offlineStore.js';
import { Header } from './components/layout/Header.js';
import { BillingCounter } from './components/billing/BillingCounter.js';
import { MedicineInventory } from './components/inventory/MedicineInventory.js';
import { PurchaseManager } from './components/purchases/PurchaseManager.js';
import { SuppliersAndCustomers } from './components/contacts/SuppliersAndCustomers.js';
import { ExpiryAndStockAlerts } from './components/alerts/ExpiryAndStockAlerts.js';
import { FinancialsAndExpenses } from './components/financials/FinancialsAndExpenses.js';
import { SubscriptionModal } from './components/subscription/SubscriptionModal.js';
import { OfflineSyncCenter } from './components/sync/OfflineSyncCenter.js';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { StoreProfileModal } from './components/profile/StoreProfileModal.js';
import { SplashScreen } from './components/brand/SplashScreen.js';
import { BrandCustomizerModal } from './components/brand/BrandCustomizerModal.js';
import { MobileApkModal } from './components/mobile/MobileApkModal.js';
import { BrandStore } from './lib/brandStore.js';
import {
  Sparkles,
  AlertCircle,
  WifiOff,
  Bell,
  Layers,
  ArrowRight,
  Smartphone
} from 'lucide-react';

export default function App() {
  // Splash Screen State
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);

  // Navigation & View Mode
  const [currentTab, setCurrentTab] = useState<string>('billing');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Core Data
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);

  // Subscription & Offline State
  const [remainingSeconds, setRemainingSeconds] = useState<number>(86400);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Modals
  const [showSubModal, setShowSubModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  // Initial Data Fetch
  const loadInitialData = useCallback(async (currentPharmacyId?: string) => {
    const pId = currentPharmacyId || pharmacy?.id || 'pharm_sanjivani_01';
    const headers = { 'x-pharmacy-id': pId };

    try {
      const [resPharm, resMeds, resSups, resCusts, resPlans, resAnn] = await Promise.all([
        fetch('/api/pharmacies/current', { headers }),
        fetch('/api/medicines', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/subscription/plans'),
        fetch('/api/admin/announcements')
      ]);

      const dataPharm = await resPharm.json();
      const dataMeds = await resMeds.json();
      const dataSups = await resSups.json();
      const dataCusts = await resCusts.json();
      const dataPlans = await resPlans.json();
      const dataAnn = await resAnn.json();

      if (dataPharm.success) {
        setPharmacy(dataPharm.pharmacy);
        setRemainingSeconds(dataPharm.subscriptionStatus.remainingSeconds);
      }

      if (dataMeds.success) {
        setMedicines(dataMeds.medicines);
        OfflineStore.setCachedMedicines(dataMeds.medicines);
      }

      if (dataSups.success) setSuppliers(dataSups.suppliers);
      if (dataCusts.success) setCustomers(dataCusts.customers);
      if (dataPlans.success) setPlans(dataPlans.plans);
      if (dataAnn.success) setAnnouncements(dataAnn.announcements);
    } catch (err) {
      console.warn('Network offline or backend unreachable, loading local offline cache:', err);
      // Fallback to local offline cache
      const cachedMeds = OfflineStore.getCachedMedicines();
      if (cachedMeds.length > 0) {
        setMedicines(cachedMeds);
      }
    }

    setPendingSyncCount(OfflineStore.getPendingQueue().length);
    setIsOffline(OfflineStore.isOffline());
  }, [pharmacy?.id]);

  useEffect(() => {
    loadInitialData();
    BrandStore.init();

    // Setup network listeners
    const handleNetworkChange = () => {
      const offline = OfflineStore.isOffline();
      setIsOffline(offline);
      setPendingSyncCount(OfflineStore.getPendingQueue().length);
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('mob-network-change', handleNetworkChange);
    window.addEventListener('mob-queue-change', handleNetworkChange);

    // Countdown interval: decrements remaining seconds smoothly
    const timer = setInterval(() => {
      setRemainingSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('mob-network-change', handleNetworkChange);
      window.removeEventListener('mob-queue-change', handleNetworkChange);
      clearInterval(timer);
    };
  }, [loadInitialData]);

  // Handle invoice created from counter
  const handleInvoiceCreated = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    setPendingSyncCount(OfflineStore.getPendingQueue().length);
  };

  // Active Subscription Plan Config
  const activePlanConfig = plans.find(p => p.id === pharmacy?.subscriptionPlanId);

  // Active announcement for banner
  const activeAnnouncement = announcements.find(a => a.active);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Platform Announcements Banner (if active) */}
      {activeAnnouncement && (
        <div className="bg-teal-900 text-teal-100 px-4 py-2 text-xs flex items-center justify-between no-print">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <strong className="text-white">{activeAnnouncement.title}:</strong>
            <span>{activeAnnouncement.message}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setIsSuperAdmin(false);
          setCurrentTab(tab);
        }}
        pharmacy={pharmacy}
        subscriptionPlan={activePlanConfig}
        remainingSeconds={remainingSeconds}
        isOffline={isOffline}
        pendingSyncCount={pendingSyncCount}
        onOpenSubscriptionModal={() => setShowSubModal(true)}
        onOpenSyncModal={() => setShowSyncModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenApkModal={() => setShowApkModal(true)}
        onOpenBrandModal={() => setShowBrandModal(true)}
        onOpenSplash={() => setShowSplashScreen(true)}
        onLogout={() => setShowAuthModal(true)}
        isSuperAdmin={isSuperAdmin}
        onToggleSuperAdmin={() => setIsSuperAdmin(!isSuperAdmin)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If Super Admin View is Active */}
        {isSuperAdmin ? (
          <SuperAdminDashboard onExitSuperAdmin={() => setIsSuperAdmin(false)} />
        ) : (
          <>
            {/* Subscription Upsell Notice for Basic Plan */}
            {pharmacy?.subscriptionPlanId === 'basic' && (
              <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    You are on the <strong>Basic Annual Plan</strong> (Single Counter). Upgrade to <strong>Advance</strong> or <strong>Pro</strong> for 180-Day Expiry Surveillance, FEFO Barcode Scanning & Multi-Device Sync.
                  </span>
                </div>
                <button
                  onClick={() => setShowSubModal(true)}
                  className="px-3 py-1 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 whitespace-nowrap shrink-0 shadow-sm ml-4"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {/* Offline Active Indicator */}
            {isOffline && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Offline Counter Mode Active:</strong> You can continue searching local inventory, billing customers, and printing receipts. Transactions are queued locally and will push automatically once reconnected.
                  </span>
                </div>
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="px-3 py-1 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 whitespace-nowrap shrink-0 shadow-sm ml-4"
                >
                  Manage Sync ({pendingSyncCount})
                </button>
              </div>
            )}

            {/* Tab Routing */}
            {currentTab === 'billing' && pharmacy && (
              <BillingCounter
                medicines={medicines}
                customers={customers}
                pharmacy={pharmacy}
                isOffline={isOffline}
                onInvoiceCreated={handleInvoiceCreated}
                onMedicineStockUpdated={loadInitialData}
              />
            )}

            {currentTab === 'inventory' && pharmacy && (
              <MedicineInventory
                medicines={medicines}
                pharmacy={pharmacy}
                onRefresh={loadInitialData}
              />
            )}

            {currentTab === 'purchases' && pharmacy && (
              <PurchaseManager
                purchases={[]}
                suppliers={suppliers}
                medicines={medicines}
                pharmacy={pharmacy}
                onRefresh={loadInitialData}
              />
            )}

            {currentTab === 'contacts' && pharmacy && (
              <SuppliersAndCustomers
                suppliers={suppliers}
                customers={customers}
                pharmacy={pharmacy}
                onRefresh={loadInitialData}
              />
            )}

            {currentTab === 'alerts' && pharmacy && (
              <ExpiryAndStockAlerts
                medicines={medicines}
                suppliers={suppliers}
                pharmacy={pharmacy}
                onRefresh={loadInitialData}
                onUpgradePlan={() => setShowSubModal(true)}
              />
            )}

            {currentTab === 'financials' && pharmacy && (
              <FinancialsAndExpenses pharmacy={pharmacy} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">MediOneBilling (MOB)</span>
            <span>·</span>
            <span>Professional Pharmacy Management & GST Billing SaaS</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Server Time: {new Date().toLocaleTimeString('en-IN')}</span>
            <span>·</span>
            <span>v2026.1 Enterprise</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {showSubModal && pharmacy && (
        <SubscriptionModal
          pharmacy={pharmacy}
          plans={plans}
          remainingSeconds={remainingSeconds}
          onClose={() => setShowSubModal(false)}
          onPlanActivated={updated => {
            setPharmacy(updated);
            loadInitialData(updated.id);
          }}
        />
      )}

      {showSyncModal && pharmacy && (
        <OfflineSyncCenter
          pharmacy={pharmacy}
          isOffline={isOffline}
          onRefresh={loadInitialData}
          onClose={() => setShowSyncModal(false)}
        />
      )}

      {showProfileModal && pharmacy && (
        <StoreProfileModal
          pharmacy={pharmacy}
          onClose={() => setShowProfileModal(false)}
          onUpdate={updated => setPharmacy(updated)}
          onOpenBrandCustomizer={() => setShowBrandModal(true)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(newPharmacy, adminMode) => {
            if (adminMode) {
              setIsSuperAdmin(true);
            } else if (newPharmacy) {
              setPharmacy(newPharmacy);
              setIsSuperAdmin(false);
              loadInitialData(newPharmacy.id);
            }
          }}
        />
      )}

      {/* Brand & Visual Identity Customizer Modal */}
      {showBrandModal && (
        <BrandCustomizerModal
          onClose={() => setShowBrandModal(false)}
          onPreviewSplash={() => setShowSplashScreen(true)}
        />
      )}

      {/* Mobile App & Android APK Modal */}
      {showApkModal && (
        <MobileApkModal
          onClose={() => setShowApkModal(false)}
        />
      )}

      {/* Mobile Sticky Install Action Bar (PWA / WebAPK) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">Install Mobile App (APK)</p>
              <p className="text-[10px] text-slate-400 truncate">Offline counter & barcode scanning</p>
            </div>
          </div>
          <button
            onClick={() => setShowApkModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shrink-0 shadow-md hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition"
          >
            Download debug.apk
          </button>
        </div>
      </div>

      {/* Official 9:16 Splash Screen */}
      {showSplashScreen && (
        <SplashScreen
          pharmacyName={pharmacy?.name}
          onComplete={() => setShowSplashScreen(false)}
        />
      )}
    </div>
  );
}
