import React, { useState } from 'react';
import {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Supplier,
  Medicine,
  Pharmacy
} from '../../types/pharmacy.js';
import {
  Plus,
  Trash2,
  FileCheck,
  Building,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

interface PurchaseManagerProps {
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  medicines: Medicine[];
  pharmacy: Pharmacy;
  onRefresh: () => void;
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  purchases,
  suppliers,
  medicines,
  pharmacy,
  onRefresh
}) => {
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierBillNumber, setSupplierBillNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'neft' | 'cheque' | 'upi' | 'credit'>('cheque');
  const [notes, setNotes] = useState('');

  // Items for the inward bill
  const [purchaseItems, setPurchaseItems] = useState<PurchaseInvoiceItem[]>([]);

  // Item form input states
  const [selectedMedId, setSelectedMedId] = useState('');
  const [itemBatchNo, setItemBatchNo] = useState('');
  const [itemExpiry, setItemExpiry] = useState('');
  const [itemQty, setItemQty] = useState(10);
  const [itemFreeQty, setItemFreeQty] = useState(0);
  const [itemPurchaseRate, setItemPurchaseRate] = useState(0);
  const [itemMrp, setItemMrp] = useState(0);
  const [itemSellingPrice, setItemSellingPrice] = useState(0);
  const [itemDisc, setItemDisc] = useState(0);
  const [itemGst, setItemGst] = useState(12);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // When medicine changes in item adder, prepopulate defaults
  const handleMedSelect = (id: string) => {
    setSelectedMedId(id);
    const med = medicines.find(m => m.id === id);
    if (med) {
      setItemGst(med.gstRate || 12);
      if (med.batches.length > 0) {
        setItemMrp(med.batches[0].mrp);
        setItemPurchaseRate(med.batches[0].purchasePrice);
        setItemSellingPrice(med.batches[0].sellingPrice);
      }
    }
  };

  // Add Item to Purchase list
  const handleAddItem = () => {
    const med = medicines.find(m => m.id === selectedMedId);
    if (!med || !itemBatchNo || !itemExpiry || itemQty <= 0) return;

    const lineTotal = itemPurchaseRate * itemQty;
    const disc = (lineTotal * itemDisc) / 100;
    const taxable = lineTotal - disc;
    const gst = (taxable * itemGst) / 100;

    const newItem: PurchaseInvoiceItem = {
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: itemBatchNo.toUpperCase(),
      expiryDate: itemExpiry,
      quantity: itemQty,
      freeQuantity: itemFreeQty,
      purchaseRate: itemPurchaseRate,
      mrp: itemMrp,
      sellingPrice: itemSellingPrice || itemMrp,
      discountPercent: itemDisc,
      gstRate: itemGst,
      totalAmount: +(taxable + gst).toFixed(2)
    };

    setPurchaseItems([...purchaseItems, newItem]);

    // Reset item form
    setSelectedMedId('');
    setItemBatchNo('');
    setItemExpiry('');
    setItemQty(10);
    setItemFreeQty(0);
    setItemPurchaseRate(0);
    setItemMrp(0);
    setItemSellingPrice(0);
  };

  // Submit inward purchase
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0 || !selectedSupplierId) return;

    setIsSubmitting(true);
    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pharmacy-id': pharmacy.id
        },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierName: supplier?.name || 'Supplier',
          supplierBillNumber: supplierBillNumber || `BILL-${Date.now().toString().slice(-6)}`,
          purchaseDate,
          items: purchaseItems,
          amountPaid,
          paymentMethod,
          notes
        })
      });

      if (res.ok) {
        setFeedback('Purchase inward bill successfully recorded! Inventory stock updated.');
        setShowNewPurchaseModal(false);
        setPurchaseItems([]);
        setSupplierBillNumber('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Purchase Management & Supplier Inward Bills
          </h2>
          <p className="text-xs text-slate-500">
            Record wholesale supplier invoices, update batch quantities, and track payables
          </p>
        </div>

        <button
          onClick={() => setShowNewPurchaseModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Entry</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Purchases List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">
          Inward Purchase History ({purchases.length})
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Building className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-600" />
            <p className="text-sm font-medium">No purchase invoices recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "New Purchase Entry" to record your first supplier bill.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Bill Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-right">Bill Total (₹)</th>
                  <th className="p-3 text-right">Paid (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Payment Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {p.supplierBillNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {p.supplierName}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {p.purchaseDate}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                        {p.items.length} items
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      ₹{p.finalAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                      ₹{p.amountPaid.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          p.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 uppercase text-[11px] text-slate-500">
                      {p.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Purchase Entry Modal */}
      {showNewPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                New Supplier Inward Purchase Entry
              </h3>
              <button
                onClick={() => setShowNewPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Supplier & Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded-lg dark:text-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Bal: ₹{s.outstandingBalance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Bill / Invoice No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SP-2026-991"
                    value={supplierBillNumber}
                    onChange={e => setSupplierBillNumber(e.target.value)}
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bill Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded-lg dark:text-white"
                  >
                    <option value="cheque">Cheque</option>
                    <option value="neft">NEFT / RTGS</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit (Unpaid)</option>
                  </select>
                </div>
              </div>

              {/* Inward Item Adder */}
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                  Add Medicine to Bill
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500">Medicine Formulation:</label>
                    <select
                      value={selectedMedId}
                      onChange={e => handleMedSelect(e.target.value)}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    >
                      <option value="">Select Formulation...</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.packSize})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Batch Number:</label>
                    <input
                      type="text"
                      placeholder="e.g. B-01"
                      value={itemBatchNo}
                      onChange={e => setItemBatchNo(e.target.value)}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Expiry (YYYY-MM):</label>
                    <input
                      type="text"
                      placeholder="2027-10"
                      value={itemExpiry}
                      onChange={e => setItemExpiry(e.target.value)}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Quantity (Units):</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={e => setItemQty(Number(e.target.value))}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Free Scheme Qty:</label>
                    <input
                      type="number"
                      min={0}
                      value={itemFreeQty}
                      onChange={e => setItemFreeQty(Number(e.target.value))}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 items-end">
                  <div>
                    <label className="block text-[10px] text-slate-500">Purchase Rate (₹):</label>
                    <input
                      type="number"
                      value={itemPurchaseRate}
                      onChange={e => setItemPurchaseRate(Number(e.target.value))}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">MRP (₹):</label>
                    <input
                      type="number"
                      value={itemMrp}
                      onChange={e => setItemMrp(Number(e.target.value))}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Selling Rate (₹):</label>
                    <input
                      type="number"
                      value={itemSellingPrice}
                      onChange={e => setItemSellingPrice(Number(e.target.value))}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Discount (%):</label>
                    <input
                      type="number"
                      value={itemDisc}
                      onChange={e => setItemDisc(Number(e.target.value))}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-1.5 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Items List */}
              <div className="border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2">Exp</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchaseItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white">
                          {item.medicineName}
                        </td>
                        <td className="p-2 font-mono">{item.batchNumber}</td>
                        <td className="p-2 font-mono">{item.expiryDate}</td>
                        <td className="p-2 text-right tabular-nums">
                          {item.quantity} {item.freeQuantity ? `(+${item.freeQuantity} free)` : ''}
                        </td>
                        <td className="p-2 text-right tabular-nums">₹{item.purchaseRate}</td>
                        <td className="p-2 text-right font-bold tabular-nums">₹{item.totalAmount}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment Summary */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Amount Paid Now (₹):
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    className="p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                  />
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">Bill Inward Total:</span>
                  <div className="text-xl font-bold text-teal-800 dark:text-teal-400">
                    ₹{purchaseItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewPurchaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || purchaseItems.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Recording Inward...' : 'Confirm Inward & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
