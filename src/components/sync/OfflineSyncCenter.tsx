import React, { useState, useEffect } from 'react';
import { Pharmacy, SyncTransaction, SyncConflict, DeviceInfo } from '../../types/pharmacy.js';
import { OfflineStore } from '../../lib/offlineStore.js';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Monitor,
  Smartphone,
  CheckCircle,
  XCircle,
  Trash2,
  Check,
  ShieldAlert,
  Server
} from 'lucide-react';

interface OfflineSyncCenterProps {
  pharmacy: Pharmacy;
  isOffline: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

export const OfflineSyncCenter: React.FC<OfflineSyncCenterProps> = ({
  pharmacy,
  isOffline,
  onRefresh,
  onClose
}) => {
  const [pendingQueue, setPendingQueue] = useState<SyncTransaction[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadSyncData = async () => {
    setPendingQueue(OfflineStore.getPendingQueue());
    try {
      const [resConf, resDev] = await Promise.all([
        fetch('/api/sync/conflicts', { headers: { 'x-pharmacy-id': pharmacy.id } }),
        fetch('/api/devices', { headers: { 'x-pharmacy-id': pharmacy.id } })
      ]);
      const dataConf = await resConf.json();
      const dataDev = await resDev.json();
      if (dataConf.success) setConflicts(dataConf.conflicts);
      if (dataDev.success) setDevices(dataDev.devices);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, [pharmacy.id]);

  // Toggle Simulated Offline
  const handleToggleOffline = () => {
    OfflineStore.setSimulateOffline(!isOffline);
    setSyncMessage(
      !isOffline
        ? 'Offline simulation enabled! You can now test counter sales without internet.'
        : 'Network reconnected! Offline transactions can now sync to server.'
    );
  };

  // Run Manual Synchronization
  const handleSyncNow = async () => {
    if (isOffline) {
      setSyncMessage('Cannot sync while in offline mode. Please reconnect network first.');
      return;
    }

    const queue = OfflineStore.getPendingQueue();
    if (queue.length === 0) {
      setSyncMessage('No pending offline transactions to sync. Database is fully up to date!');
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({
          deviceId: 'local_terminal',
          transactions: queue
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        OfflineStore.clearQueue();
        setPendingQueue([]);
        setSyncMessage(`Synchronized ${data.processedCount} offline transaction(s) to server successfully!`);
        if (data.conflicts && data.conflicts.length > 0) {
          setConflicts([...data.conflicts, ...conflicts]);
        }
        onRefresh();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (err: any) {
      setSyncMessage('Sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Resolve Conflict
  const handleResolveConflict = async (conflictId: string) => {
    try {
      const res = await fetch(`/api/sync/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({ note: 'Reviewed and reconciled by Store Pharmacist' })
      });
      if (res.ok) {
        setConflicts(conflicts.map(c => c.id === conflictId ? { ...c, resolved: true } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke device
  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/revoke`, {
        method: 'POST',
        headers: { 'x-pharmacy-id': pharmacy.id }
      });
      if (res.ok) {
        setDevices(devices.map(d => d.id === deviceId ? { ...d, isAuthorized: false } : d));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Device Synchronization & Offline Storage
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Local cache persistence, pending queue, stock collision reconciliation
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {syncMessage && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
            <span>{syncMessage}</span>
            <button onClick={() => setSyncMessage(null)} className="font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
          {/* Network State & Simulation Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                    <WifiOff className="w-4 h-4" /> Offline Mode Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <Wifi className="w-4 h-4" /> Cloud Connected & Synced
                  </span>
                )}
              </div>
              <p className="text-slate-500 mt-1">
                Last synced with cloud server:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {pharmacy.syncedAt ? new Date(pharmacy.syncedAt).toLocaleTimeString('en-IN') : 'Just now'}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleOffline}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                  isOffline
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                }`}
              >
                {isOffline ? 'Reconnect Network' : 'Simulate Offline Outage'}
              </button>

              <button
                onClick={handleSyncNow}
                disabled={isSyncing || isOffline}
                className={`px-4 py-1.5 rounded-lg font-semibold text-white flex items-center gap-1.5 ${
                  isOffline
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 shadow-sm'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Pending Queue'}</span>
              </button>
            </div>
          </div>

          {/* Pending Offline Transactions Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Pending Offline Transactions Queue ({pendingQueue.length})
              </h4>
              {pendingQueue.length > 0 && (
                <span className="text-amber-600 font-semibold">
                  Will push automatically upon reconnection
                </span>
              )}
            </div>

            {pendingQueue.length === 0 ? (
              <div className="p-4 border rounded-xl text-center text-slate-400 bg-slate-50/50">
                All transactions are synchronized with the central cloud database.
              </div>
            ) : (
              <div className="border rounded-xl divide-y overflow-hidden">
                {pendingQueue.map(tx => (
                  <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Offline Sale Invoice #{tx.payload.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {tx.payload.items.length} medicines · Final: ₹{tx.payload.finalAmount} · {new Date(tx.timestamp).toLocaleTimeString('en-IN')}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                      Pending Sync
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conflict Review Section */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Multi-Device Stock Conflict Review ({conflicts.filter(c => !c.resolved).length} Unresolved)</span>
            </h4>

            {conflicts.length === 0 ? (
              <div className="p-4 border rounded-xl text-center text-slate-400 bg-slate-50/50">
                No stock collision conflicts detected across devices.
              </div>
            ) : (
              <div className="border rounded-xl divide-y overflow-hidden">
                {conflicts.map(c => (
                  <div key={c.id} className={`p-3 flex items-center justify-between ${c.resolved ? 'bg-slate-50 opacity-60' : 'bg-rose-50/50'}`}>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {c.medicineName} (Batch {c.batchNumber})
                      </span>
                      <span className="text-[10px] text-rose-700 font-medium">
                        Conflict: Terminal requested {c.requestedQty} units, but server stock was only {c.availableQty}.
                      </span>
                      {c.resolved && (
                        <span className="text-[10px] text-emerald-700 block mt-0.5">
                          ✓ Resolved: {c.resolutionNote}
                        </span>
                      )}
                    </div>
                    {!c.resolved && (
                      <button
                        onClick={() => handleResolveConflict(c.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                      >
                        Acknowledge & Reconcile
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Authorized Devices */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Authorized Store Devices ({devices.length})
            </h4>

            <div className="border rounded-xl divide-y overflow-hidden">
              {devices.map(dev => (
                <div key={dev.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    {dev.platform === 'Android' ? (
                      <Smartphone className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Monitor className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-900 block">{dev.deviceName}</span>
                      <span className="text-[10px] text-slate-500">
                        {dev.platform} · {dev.browser} · Last active: {new Date(dev.lastActiveAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {dev.isAuthorized ? (
                    <button
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="px-2 py-0.5 text-[10px] font-semibold text-rose-600 border border-rose-200 rounded hover:bg-rose-50"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Revoked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
