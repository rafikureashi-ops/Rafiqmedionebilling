import React, { useState, useMemo } from 'react';
import { Medicine, MedicineBatch, Pharmacy, Supplier } from '../../types/pharmacy.js';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  PackageX,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Download
} from 'lucide-react';

interface ExpiryAndStockAlertsProps {
  medicines: Medicine[];
  suppliers: Supplier[];
  pharmacy: Pharmacy;
  onRefresh: () => void;
  onUpgradePlan: () => void;
}

export const ExpiryAndStockAlerts: React.FC<ExpiryAndStockAlertsProps> = ({
  medicines,
  suppliers,
  pharmacy,
  onRefresh,
  onUpgradePlan
}) => {
  const isAdvanceOrPro = pharmacy.subscriptionPlanId === 'advance' || pharmacy.subscriptionPlanId === 'pro' || pharmacy.subscriptionPlanId === 'trial';
  const [activeTab, setActiveTab] = useState<'near_expiry' | 'expired' | 'low_stock'>('near_expiry');
  const [thresholdDays, setThresholdDays] = useState<number>(30); // for basic plan
  const [advanceFilter, setAdvanceFilter] = useState<'30' | '90' | '180' | 'all'>('all');
  const [quarantineSuccess, setQuarantineSuccess] = useState<string | null>(null);

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);

  // Group batches by expiry status
  const analyzedBatches = useMemo(() => {
    const expired: { med: Medicine; batch: MedicineBatch; daysLeft: number }[] = [];
    const critical30: { med: Medicine; batch: MedicineBatch; daysLeft: number }[] = [];
    const warning90: { med: Medicine; batch: MedicineBatch; daysLeft: number }[] = [];
    const earlyWatch180: { med: Medicine; batch: MedicineBatch; daysLeft: number }[] = [];

    medicines.forEach(med => {
      med.batches.forEach(b => {
        if (b.currentStock <= 0) return;

        // Parse batch expiry date
        const expDate = new Date(b.expiryDate + '-28');
        const diffMs = expDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0 || b.expiryDate < currentMonthStr) {
          expired.push({ med, batch: b, daysLeft: diffDays });
        } else if (diffDays <= 30) {
          critical30.push({ med, batch: b, daysLeft: diffDays });
        } else if (diffDays <= 90) {
          warning90.push({ med, batch: b, daysLeft: diffDays });
        } else if (diffDays <= 180) {
          earlyWatch180.push({ med, batch: b, daysLeft: diffDays });
        }
      });
    });

    return { expired, critical30, warning90, earlyWatch180 };
  }, [medicines, now, currentMonthStr]);

  // Low stock medicines
  const lowStockMedicines = useMemo(() => {
    return medicines.filter(m => m.totalStock <= m.minimumStockLevel);
  }, [medicines]);

  // Handle 1-click quarantine / return to supplier
  const handleQuarantineBatch = async (medId: string, batchId: string, currentStock: number) => {
    try {
      const res = await fetch(`/api/medicines/${medId}/adjust-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pharmacy-id': pharmacy.id
        },
        body: JSON.stringify({
          batchId,
          quantityChange: -currentStock,
          reason: 'Transferred to Expired Quarantine for Supplier Replacement Credit',
          actionType: 'EXPIRED_QUARANTINE'
        })
      });

      if (res.ok) {
        setQuarantineSuccess('Batch stock quarantined and removed from active billing!');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Drug Expiry & Stock Alert Management</span>
            {!isAdvanceOrPro && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Basic Plan (Single Threshold)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            {isAdvanceOrPro
              ? 'Multi-tier FEFO surveillance (180, 90, 30 days) and automated expired drug quarantine'
              : 'Standard 30-day near-expiry surveillance. Upgrade to Advance for 180-day forecasting.'}
          </p>
        </div>

        {/* Upgrade Callout if on Basic Plan */}
        {!isAdvanceOrPro && (
          <button
            onClick={onUpgradePlan}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Unlock 90 & 180-Day Advance Alerts</span>
          </button>
        )}
      </div>

      {quarantineSuccess && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{quarantineSuccess}</span>
          </div>
          <button onClick={() => setQuarantineSuccess(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Expired Batches</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {analyzedBatches.expired.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Billing hard-blocked by law
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">&lt; 30 Days (Critical)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {analyzedBatches.critical30.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            FEFO prioritize or return
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">30–90 Days (Warning)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {isAdvanceOrPro ? analyzedBatches.warning90.length : 'Pro Feature'}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isAdvanceOrPro ? 'Mid-term expiry horizon' : 'Available in Advance & Pro'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock Formulations</span>
            <ShieldAlert className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {lowStockMedicines.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Stock &le; Reorder level
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('near_expiry')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'near_expiry'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Near-Expiry Batches ({analyzedBatches.critical30.length + (isAdvanceOrPro ? analyzedBatches.warning90.length + analyzedBatches.earlyWatch180.length : 0)})
          </button>

          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'expired'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Expired Quarantine ({analyzedBatches.expired.length})
          </button>

          <button
            onClick={() => setActiveTab('low_stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'low_stock'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Low & Out of Stock ({lowStockMedicines.length})
          </button>
        </div>

        {/* Advance Filter Pill when on Near-Expiry tab */}
        {activeTab === 'near_expiry' && isAdvanceOrPro && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px]">Threshold:</span>
            <button
              onClick={() => setAdvanceFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] ${advanceFilter === 'all' ? 'bg-slate-200 dark:bg-slate-700 font-bold' : 'text-slate-500'}`}
            >
              All (180d)
            </button>
            <button
              onClick={() => setAdvanceFilter('30')}
              className={`px-2 py-0.5 rounded text-[11px] ${advanceFilter === '30' ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-500'}`}
            >
              &lt; 30d
            </button>
            <button
              onClick={() => setAdvanceFilter('90')}
              className={`px-2 py-0.5 rounded text-[11px] ${advanceFilter === '90' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-500'}`}
            >
              30–90d
            </button>
            <button
              onClick={() => setAdvanceFilter('180')}
              className={`px-2 py-0.5 rounded text-[11px] ${advanceFilter === '180' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-500'}`}
            >
              90–180d
            </button>
          </div>
        )}
      </div>

      {/* NEAR EXPIRY TABLE */}
      {activeTab === 'near_expiry' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Medicine & Generic</th>
                  <th className="p-3">Batch No</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Days Remaining</th>
                  <th className="p-3 text-right">Available Qty</th>
                  <th className="p-3 text-right">MRP (₹)</th>
                  <th className="p-3 text-right">Potential Loss (Cost)</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Critical (<30 days) */}
                {(advanceFilter === 'all' || advanceFilter === '30') &&
                  analyzedBatches.critical30.map(({ med, batch, daysLeft }) => (
                    <tr key={batch.id} className="bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{med.name}</span>
                        <span className="text-[10px] text-slate-500">{med.genericName}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {batch.batchNumber}
                      </td>
                      <td className="p-3 font-mono text-rose-700 dark:text-rose-400 font-bold">
                        {batch.expiryDate}
                      </td>
                      <td className="p-3 font-semibold text-rose-700 dark:text-rose-400">
                        {daysLeft} days left (CRITICAL)
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums">
                        {batch.currentStock}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ₹{batch.mrp.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-rose-700 dark:text-rose-400 font-bold">
                        ₹{(batch.purchasePrice * batch.currentStock).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleQuarantineBatch(med.id, batch.id, batch.currentStock)}
                          className="px-2 py-1 text-[10px] font-semibold text-rose-700 bg-rose-100 rounded hover:bg-rose-200"
                        >
                          Quarantine / Return
                        </button>
                      </td>
                    </tr>
                  ))}

                {/* 30-90 Days */}
                {isAdvanceOrPro && (advanceFilter === 'all' || advanceFilter === '90') &&
                  analyzedBatches.warning90.map(({ med, batch, daysLeft }) => (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{med.name}</span>
                        <span className="text-[10px] text-slate-500">{med.genericName}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-800 dark:text-slate-200">
                        {batch.batchNumber}
                      </td>
                      <td className="p-3 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        {batch.expiryDate}
                      </td>
                      <td className="p-3 text-amber-700 dark:text-amber-400 font-medium">
                        {daysLeft} days (Warning)
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {batch.currentStock}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ₹{batch.mrp.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        ₹{(batch.purchasePrice * batch.currentStock).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          FEFO Bill Fast
                        </span>
                      </td>
                    </tr>
                  ))}

                {/* 90-180 Days */}
                {isAdvanceOrPro && (advanceFilter === 'all' || advanceFilter === '180') &&
                  analyzedBatches.earlyWatch180.map(({ med, batch, daysLeft }) => (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 dark:text-white block">{med.name}</span>
                        <span className="text-[10px] text-slate-500">{med.genericName}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                        {batch.batchNumber}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {batch.expiryDate}
                      </td>
                      <td className="p-3 text-slate-500">
                        {daysLeft} days
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {batch.currentStock}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ₹{batch.mrp.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-slate-500">
                        ₹{(batch.purchasePrice * batch.currentStock).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] text-slate-400">Normal</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPIRED QUARANTINE TABLE */}
      {activeTab === 'expired' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-300 flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <PackageX className="w-4 h-4 text-rose-600" />
              Expired Stock Quarantine Box
            </span>
            <span>Billing is blocked. Move to Supplier Return or write off as damage.</span>
          </div>

          {analyzedBatches.expired.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No expired stock currently in the pharmacy. Excellent inventory turnover!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                  <tr>
                    <th className="p-3">Medicine Formulation</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Expired On</th>
                    <th className="p-3 text-right">Unsold Units</th>
                    <th className="p-3 text-right">Loss Valuation</th>
                    <th className="p-3 text-right">Quarantine Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analyzedBatches.expired.map(({ med, batch }) => (
                    <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{med.name}</span>
                        <span className="text-[10px] text-slate-500">{med.genericName}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-rose-600">
                        {batch.batchNumber}
                      </td>
                      <td className="p-3 font-mono text-rose-600 font-bold">
                        {batch.expiryDate} (EXPIRED)
                      </td>
                      <td className="p-3 text-right font-bold tabular-nums">
                        {batch.currentStock}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-rose-600 font-bold">
                        ₹{(batch.purchasePrice * batch.currentStock).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleQuarantineBatch(med.id, batch.id, batch.currentStock)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                        >
                          Write-off / Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOW STOCK TABLE */}
      {activeTab === 'low_stock' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Rack</th>
                  <th className="p-3 text-right">Current Available Stock</th>
                  <th className="p-3 text-right">Minimum Reorder Level</th>
                  <th className="p-3 text-right">Shortage</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockMedicines.map(med => {
                  const shortage = Math.max(0, med.minimumStockLevel - med.totalStock);
                  return (
                    <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{med.name}</span>
                        <span className="text-[10px] text-slate-500">{med.genericName}</span>
                      </td>
                      <td className="p-3 text-slate-500">{med.rackLocation}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-600 tabular-nums">
                        {med.totalStock} units
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-slate-500">
                        {med.minimumStockLevel} units
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                        -{shortage} units
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Create Purchase PO
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
