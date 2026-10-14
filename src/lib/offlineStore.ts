import { Medicine, Invoice, SyncTransaction, SyncConflict } from '../types/pharmacy.js';

const OFFLINE_QUEUE_KEY = 'mob_offline_tx_queue';
const CACHED_MEDICINES_KEY = 'mob_cached_medicines';
const SIMULATE_OFFLINE_KEY = 'mob_simulate_offline';

export class OfflineStore {
  // Check if network is offline or user manually simulated offline mode
  public static isOffline(): boolean {
    if (typeof window === 'undefined') return false;
    const manualOffline = localStorage.getItem(SIMULATE_OFFLINE_KEY) === 'true';
    return manualOffline || !navigator.onLine;
  }

  public static setSimulateOffline(simulate: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SIMULATE_OFFLINE_KEY, simulate ? 'true' : 'false');
    window.dispatchEvent(new Event('mob-network-change'));
  }

  public static getCachedMedicines(): Medicine[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CACHED_MEDICINES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static setCachedMedicines(medicines: Medicine[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHED_MEDICINES_KEY, JSON.stringify(medicines));
    } catch (e) {
      console.warn('Storage quota exceeded caching medicines', e);
    }
  }

  public static getPendingQueue(): SyncTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static queueOfflineInvoice(invoice: Invoice, pharmacyId: string, deviceId: string): SyncTransaction {
    const queue = this.getPendingQueue();
    const tx: SyncTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      pharmacyId,
      deviceId,
      type: 'sale_invoice',
      payload: invoice,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    queue.push(tx);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    // Also deduct locally from cached medicines so local offline counter knows remaining stock
    const cachedMeds = this.getCachedMedicines();
    for (const item of invoice.items) {
      const med = cachedMeds.find(m => m.id === item.medicineId);
      if (med) {
        const batch = med.batches.find(b => b.id === item.batchId);
        if (batch) {
          batch.currentStock = Math.max(0, batch.currentStock - item.quantity);
          med.totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
        }
      }
    }
    this.setCachedMedicines(cachedMeds);

    window.dispatchEvent(new Event('mob-queue-change'));
    return tx;
  }

  public static clearQueue() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    window.dispatchEvent(new Event('mob-queue-change'));
  }

  public static removeTransactions(txIds: string[]) {
    const queue = this.getPendingQueue();
    const updated = queue.filter(tx => !txIds.includes(tx.id));
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('mob-queue-change'));
  }
}
