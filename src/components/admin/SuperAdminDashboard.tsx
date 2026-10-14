import React, { useState, useEffect } from 'react';
import {
  Pharmacy,
  SubscriptionPlanConfig,
  SubscriptionPayment,
  PlatformAnnouncement,
  AuditLog
} from '../../types/pharmacy.js';
import {
  Sliders,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Megaphone,
  ShieldAlert,
  Edit2,
  CheckCircle,
  XCircle,
  Download,
  Plus,
  RefreshCw,
  LogOut,
  X
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onExitSuperAdmin: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onExitSuperAdmin }) => {
  const [activeTab, setActiveTab] = useState<'pharmacies' | 'plans' | 'revenue' | 'announcements' | 'logs'>('pharmacies');
  const [metrics, setMetrics] = useState<any>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Edit Plan Modal
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanConfig | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDevices, setEditDevices] = useState<number>(1);

  // New Announcement Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'update'>('info');

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [resOverview, resAnn, resLogs] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/announcements'),
        fetch('/api/admin/logs')
      ]);

      const dataOverview = await resOverview.json();
      const dataAnn = await resAnn.json();
      const dataLogs = await resLogs.json();

      if (dataOverview.success) {
        setMetrics(dataOverview.metrics);
        setPharmacies(dataOverview.pharmacies);
        setPayments(dataOverview.recentPayments);
        setPlans(dataOverview.plans);
        setSystemHealth(dataOverview.systemHealth);
      }

      if (dataAnn.success) setAnnouncements(dataAnn.announcements);
      if (dataLogs.success) setLogs(dataLogs.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Suspend / Reactivate pharmacy
  const handleTogglePharmacyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/pharmacies/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setFeedback(`Pharmacy account status updated to ${newStatus}`);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Plan Pricing & Limits
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: editPrice,
          maxDevices: editDevices
        })
      });

      if (res.ok) {
        setFeedback(`Plan ${editingPlan.name} updated. New Price: ₹${editPrice}`);
        setEditingPlan(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Broadcast announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          type: annType,
          targetPlans: 'all'
        })
      });

      if (res.ok) {
        setShowAnnModal(false);
        setAnnTitle('');
        setAnnMessage('');
        setFeedback('Announcement broadcasted across all active store counters!');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export Revenue CSV
  const handleExportRevenue = () => {
    let csv = 'Payment ID,Pharmacy Name,Plan,Amount (₹),Tax (₹),Total (₹),Gateway,Status,Date\n';
    payments.forEach(p => {
      csv += `"${p.id}","${p.pharmacyName}","${p.planName}","${p.amount}","${p.taxAmount}","${p.totalAmount}","${p.paymentGateway}","${p.status}","${p.createdAt}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medione_revenue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
              Platform Owner Control
            </span>
            <span className="text-xs text-slate-400">Owner: admin@medione.in</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            MediOneBilling Super Admin Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full SaaS tenancy governance, pricing controls, revenue audits & system health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onExitSuperAdmin}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Pharmacy POS</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* High-Level SaaS Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Registered Pharmacies</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {metrics.totalPharmacies}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              {metrics.activePharmacies} actively operating
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Platform Subscription Revenue</span>
            <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Including GST receipts
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Active ₹1 Trials</span>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
              {metrics.planBreakdown.trial}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              24-Hour Trial Stores
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">System Sync Health</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {systemHealth?.serverUptime || '99.98%'}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              File Database Status: Healthy
            </span>
          </div>
        </div>
      )}

      {/* Sub Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pharmacies')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'pharmacies' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Pharmacy Accounts ({pharmacies.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'plans' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Pricing & Plan Manager
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'revenue' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Subscription Revenue ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'announcements' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Platform Broadcasts ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg ${activeTab === 'logs' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Audit Logs ({logs.length})
        </button>
      </div>

      {/* 1. PHARMACIES TABLE */}
      {activeTab === 'pharmacies' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Pharmacy & Owner</th>
                  <th className="p-3">Mobile & Email</th>
                  <th className="p-3">City & State</th>
                  <th className="p-3">Drug License (DL)</th>
                  <th className="p-3">Active Plan</th>
                  <th className="p-3">Subscription Expiry</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Owner Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pharmacies.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-500">Owner: {p.ownerName}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                      <div>{p.mobile}</div>
                      <div className="text-[10px] text-slate-500">{p.email}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {p.city}, {p.state}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {p.dlNumber || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {p.subscriptionPlanId}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(p.subscriptionExpiresAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleTogglePharmacyStatus(p.id, p.status)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded border ${
                          p.status === 'active'
                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {p.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PLANS PRICING & LIMITS MANAGER */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setEditPrice(plan.price);
                      setEditDevices(plan.maxDevices);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Config</span>
                  </button>
                </div>

                <div className="my-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    ₹{plan.price}
                  </span>
                  <span className="text-xs text-slate-500">
                    {plan.durationDays === 1 ? 'for 24 hours' : `per ${plan.durationDays} days`}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div>Max Devices / Terminals: <strong className="text-slate-900 dark:text-white">{plan.maxDevices}</strong></div>
                  <div>Max Staff Accounts: <strong className="text-slate-900 dark:text-white">{plan.maxEmployees}</strong></div>
                  <div>Expiry Alert Mode: <strong className="capitalize text-slate-900 dark:text-white">{plan.expiryAlertMode}</strong></div>
                </div>

                <div className="mt-3 pt-3 border-t text-[11px] text-slate-500 space-y-1">
                  {plan.features.map((f, i) => (
                    <div key={i}>• {f}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. REVENUE & PAYMENT LOGS */}
      {activeTab === 'revenue' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-3 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800">
            <span className="font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Platform Subscription Transactions
            </span>
            <button
              onClick={handleExportRevenue}
              className="flex items-center gap-1 px-3 py-1 bg-white border rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Pharmacy</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3 text-right">Base (₹)</th>
                  <th className="p-3 text-right">GST 18%</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3">Gateway</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {p.id}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {p.pharmacyName}
                    </td>
                    <td className="p-3 uppercase text-[10px] font-bold text-teal-700">
                      {p.planName}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-500">
                      ₹{p.taxAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      ₹{p.totalAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-600">
                      {p.paymentGateway}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. BROADCAST ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Broadcast critical drug regulatory notices or platform updates to all pharmacy counters.
            </p>
            <button
              onClick={() => setShowAnnModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Broadcast</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {announcements.map(ann => (
              <div key={ann.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ann.title}</h4>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ann.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {ann.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{ann.message}</p>
                <div className="text-[10px] text-slate-400 pt-2 border-t flex justify-between">
                  <span>Target: {ann.targetPlans === 'all' ? 'All Pharmacies' : ann.targetPlans.join(', ')}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden shadow-sm">
          <div className="p-3 border-b bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Platform Audit Trail ({logs.length} Events)
          </div>
          <div className="divide-y text-xs max-h-[60vh] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="p-3 hover:bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{log.entityType}</span>
                    <span className="text-slate-500">by {log.userName}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-4">
                  {new Date(log.timestamp).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Edit {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Plan Price in INR (Annual/Trial) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editPrice}
                  onChange={e => setEditPrice(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Allowed Device Terminals *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={editDevices}
                  onChange={e => setEditDevices(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEditingPlan(null)} className="px-3 py-1.5 text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded-lg">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">New Platform Announcement</h3>
              <button onClick={() => setShowAnnModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule H1 Audit Inspection Advisory"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notice Body / Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Important message visible on all pharmacy dashboards..."
                  value={annMessage}
                  onChange={e => setAnnMessage(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notice Type</label>
                <select
                  value={annType}
                  onChange={e => setAnnType(e.target.value as any)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="info">Information (Blue)</option>
                  <option value="warning">Warning / Regulatory (Amber)</option>
                  <option value="update">Feature Update (Emerald)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAnnModal(false)} className="px-3 py-1.5 text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 font-bold text-white bg-teal-600 rounded-lg">Broadcast Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
