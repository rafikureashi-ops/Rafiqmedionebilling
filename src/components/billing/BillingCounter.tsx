import React, { useState, useMemo } from 'react';
import {
  Medicine,
  MedicineBatch,
  Customer,
  InvoiceItem,
  Invoice,
  Pharmacy,
  PaymentMethod
} from '../../types/pharmacy.js';
import { OfflineStore } from '../../lib/offlineStore.js';
import { PrintModal } from './PrintModal.js';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  AlertTriangle,
  QrCode,
  CreditCard,
  Banknote,
  Clock,
  RotateCcw,
  CheckCircle,
  FileText,
  UserPlus
} from 'lucide-react';

interface BillingCounterProps {
  medicines: Medicine[];
  customers: Customer[];
  pharmacy: Pharmacy;
  isOffline: boolean;
  onInvoiceCreated: (invoice: Invoice) => void;
  onMedicineStockUpdated: () => void;
}

export const BillingCounter: React.FC<BillingCounterProps> = ({
  medicines,
  customers,
  pharmacy,
  isOffline,
  onInvoiceCreated,
  onMedicineStockUpdated
}) => {
  // Search & Selector State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);

  // Cart / Bill Items
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Customer & Prescription Info
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Walk-in Cash Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null);

  // Active Printed Invoice Modal
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);

  // Current Month/Year for expiry validation
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filter medicines based on search (Brand name, Generic name, Barcode)
  const filteredMedicines = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return medicines
      .filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          (m.barcode && m.barcode.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, medicines]);

  // Selected Medicine's Batches sorted by Expiry (FEFO - First Expired First Out)
  const availableBatches = useMemo(() => {
    if (!selectedMedicine) return [];
    return [...selectedMedicine.batches].sort((a, b) =>
      a.expiryDate.localeCompare(b.expiryDate)
    );
  }, [selectedMedicine]);

  // Active selected batch object
  const activeBatch = useMemo(() => {
    return availableBatches.find(b => b.id === selectedBatchId) || availableBatches[0] || null;
  }, [availableBatches, selectedBatchId]);

  // Handle selecting a medicine from search dropdown
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMedicine(med);
    setSearchQuery('');
    // Auto-select FEFO batch (first batch with stock > 0, preferably non-expired)
    const validBatches = med.batches.filter(b => b.currentStock > 0);
    const nonExpired = validBatches.filter(b => b.expiryDate >= currentMonthStr);
    const defaultBatch = nonExpired[0] || validBatches[0] || med.batches[0];
    if (defaultBatch) {
      setSelectedBatchId(defaultBatch.id);
    }
    setItemQty(1);
    setItemDiscount(0);
    setBillingError(null);
  };

  // Add Item to Bill Cart
  const handleAddToCart = () => {
    if (!selectedMedicine || !activeBatch) return;

    // Hard drug regulation check: Expired batches cannot be billed!
    if (activeBatch.expiryDate < currentMonthStr) {
      setBillingError(
        `Drug Safety Alert: Batch ${activeBatch.batchNumber} has expired on ${activeBatch.expiryDate}. Sale of expired drugs is prohibited by law.`
      );
      return;
    }

    if (itemQty <= 0) {
      setBillingError('Quantity must be at least 1.');
      return;
    }

    if (itemQty > activeBatch.currentStock) {
      setBillingError(
        `Insufficient stock! Only ${activeBatch.currentStock} units available for batch ${activeBatch.batchNumber}.`
      );
      return;
    }

    // Check if already in cart
    const existingIndex = cartItems.findIndex(
      item => item.medicineId === selectedMedicine.id && item.batchId === activeBatch.id
    );

    const unitPrice = activeBatch.sellingPrice || activeBatch.mrp;
    const lineGross = unitPrice * itemQty;
    const discAmount = (lineGross * (itemDiscount || 0)) / 100;
    const taxable = lineGross - discAmount;
    const gstRate = selectedMedicine.gstRate || 12;
    const gstAmt = (taxable * gstRate) / 100;
    const lineTotal = +(taxable + gstAmt).toFixed(2);

    const newItem: InvoiceItem = {
      medicineId: selectedMedicine.id,
      batchId: activeBatch.id,
      medicineName: selectedMedicine.name,
      genericName: selectedMedicine.genericName,
      batchNumber: activeBatch.batchNumber,
      expiryDate: activeBatch.expiryDate,
      hsnCode: selectedMedicine.hsnCode || '3004',
      quantity: itemQty,
      mrp: activeBatch.mrp,
      purchasePrice: activeBatch.purchasePrice,
      unitPrice,
      discountPercent: itemDiscount,
      discountAmount: +discAmount.toFixed(2),
      gstRate,
      gstAmount: +gstAmt.toFixed(2),
      total: lineTotal
    };

    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex] = newItem;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, newItem]);
    }

    // Reset selection for next medicine
    setSelectedMedicine(null);
    setSelectedBatchId('');
    setItemQty(1);
    setItemDiscount(0);
    setBillingError(null);
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Compute Bill Summary
  const billSummary = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalGst = 0;

    for (const item of cartItems) {
      const lineGross = item.unitPrice * item.quantity;
      const disc = (lineGross * item.discountPercent) / 100;
      const taxable = lineGross - disc;
      const gst = (taxable * item.gstRate) / 100;

      subtotal += lineGross;
      totalDiscount += disc;
      taxableAmount += taxable;
      totalGst += gst;
    }

    const rawFinal = taxableAmount + totalGst;
    const roundedFinal = Math.round(rawFinal);
    const rounding = +(roundedFinal - rawFinal).toFixed(2);

    return {
      subtotal: +subtotal.toFixed(2),
      totalDiscount: +totalDiscount.toFixed(2),
      taxableAmount: +taxableAmount.toFixed(2),
      cgst: +(totalGst / 2).toFixed(2),
      sgst: +(totalGst / 2).toFixed(2),
      totalGst: +totalGst.toFixed(2),
      rounding,
      finalAmount: roundedFinal
    };
  }, [cartItems]);

  // Change returned calculator
  const changeReturned = useMemo(() => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < billSummary.finalAmount) return 0;
    return +(tendered - billSummary.finalAmount).toFixed(2);
  }, [cashTendered, billSummary.finalAmount]);

  // Handle Complete Bill Submission
  const handleFinalizeBill = async () => {
    if (cartItems.length === 0) {
      setBillingError('Add at least one medicine to the bill.');
      return;
    }

    setIsSubmitting(true);
    setBillingError(null);

    const tenderedNum = parseFloat(cashTendered) || undefined;

    const payload = {
      customerName: customerName.trim() || 'Walk-in Cash Customer',
      customerPhone: customerPhone.trim() || undefined,
      customerId: selectedCustomerId || undefined,
      doctorName: doctorName.trim() || undefined,
      items: cartItems,
      paymentMethod,
      amountPaid: billSummary.finalAmount,
      cashTendered: paymentMethod === 'cash' ? tenderedNum : undefined,
      changeReturned: paymentMethod === 'cash' ? changeReturned : undefined
    };

    try {
      if (OfflineStore.isOffline()) {
        // Generate bill offline & queue transaction
        const offlineCount = Math.floor(Math.random() * 9000) + 1000;
        const offlineInvoice: Invoice = {
          id: 'inv_off_' + Date.now(),
          invoiceNumber: `MOB-${new Date().getFullYear()}-OFF${offlineCount}`,
          pharmacyId: pharmacy.id,
          ...payload,
          subtotal: billSummary.subtotal,
          totalDiscount: billSummary.totalDiscount,
          taxableAmount: billSummary.taxableAmount,
          cgst: billSummary.cgst,
          sgst: billSummary.sgst,
          igst: 0,
          totalGst: billSummary.totalGst,
          roundingAdjustment: billSummary.rounding,
          finalAmount: billSummary.finalAmount,
          paymentStatus: 'paid',
          createdBy: 'offline_user',
          createdByName: pharmacy.ownerName,
          invoiceDate: new Date().toISOString(),
          isOfflineCreated: true,
          synced: false,
          status: 'active'
        };

        OfflineStore.queueOfflineInvoice(offlineInvoice, pharmacy.id, 'local_device');
        onInvoiceCreated(offlineInvoice);
        onMedicineStockUpdated();
        setActiveInvoiceForPrint(offlineInvoice);

        setBillingSuccess(`Offline Bill #${offlineInvoice.invoiceNumber} saved! Queued for cloud sync.`);
        setCartItems([]);
        setCashTendered('');
      } else {
        // Online standard API
        const res = await fetch('/api/billing/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-pharmacy-id': pharmacy.id
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to generate invoice');
        }

        onInvoiceCreated(data.invoice);
        onMedicineStockUpdated();
        setActiveInvoiceForPrint(data.invoice);

        setBillingSuccess(`Bill #${data.invoice.invoiceNumber} generated successfully!`);
        setCartItems([]);
        setCashTendered('');
      }
    } catch (err: any) {
      setBillingError(err.message || 'Error processing invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Alerts */}
      {billingSuccess && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{billingSuccess}</span>
          </div>
          <button
            onClick={() => setBillingSuccess(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {billingError && (
        <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{billingError}</span>
          </div>
          <button
            onClick={() => setBillingError(null)}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Billing Grid: Left Search & Cart, Right Payment & Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Counter Search & Item Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Fast Medicine Search Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search medicine by Brand name, Generic composition, or scan Barcode (F2)..."
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm dark:text-white"
              />
            </div>

            {/* Dropdown Results */}
            {filteredMedicines.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMedicines.map(med => (
                  <button
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    className="w-full text-left p-3 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{med.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {med.dosageForm}
                        </span>
                        {med.scheduleCategory !== 'OTC' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                            {med.scheduleCategory}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{med.genericName}</span>
                        <span>·</span>
                        <span>Rack: {med.rackLocation}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                        Stock: {med.totalStock}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {med.batches.length} {med.batches.length === 1 ? 'batch' : 'batches'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Medicine & Batch Configuration Panel (when selected) */}
          {selectedMedicine && (
            <div className="p-4 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedMedicine.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedMedicine.genericName} · {selectedMedicine.packSize}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMedicine(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              {/* Batch Selector with FEFO indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Batch (FEFO Sorted):
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 dark:text-white"
                  >
                    {availableBatches.map((b, idx) => {
                      const isExpired = b.expiryDate < currentMonthStr;
                      return (
                        <option key={b.id} value={b.id}>
                          {idx === 0 ? '★ FEFO: ' : ''}Batch {b.batchNumber} (Exp: {b.expiryDate}) — Stock: {b.currentStock} — MRP: ₹{b.mrp}
                          {isExpired ? ' [EXPIRED]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={activeBatch?.currentStock || 1}
                    value={itemQty}
                    onChange={e => setItemQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount (%):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={itemDiscount}
                    onChange={e => setItemDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Drug Status Notice */}
              {activeBatch && activeBatch.expiryDate < currentMonthStr ? (
                <div className="flex items-center gap-2 p-2 bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>CRITICAL: Batch has EXPIRED ({activeBatch.expiryDate}). Billing blocked!</span>
                </div>
              ) : activeBatch && (
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    Selling Rate: <strong className="text-slate-900 dark:text-white">₹{activeBatch.sellingPrice || activeBatch.mrp}</strong>
                    <span>(MRP: ₹{activeBatch.mrp})</span>
                  </span>
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Current Bill Items ({cartItems.length})
              </span>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-teal-600" />
                <p className="text-sm font-medium">Counter cart is empty</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search medicine above or scan barcode to add to the bill.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Exp</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Disc%</th>
                      <th className="p-2.5 text-right">GST</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cartItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.medicineName}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.genericName}</span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {item.batchNumber}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {item.expiryDate}
                        </td>
                        <td className="p-2.5 text-right font-bold tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">
                          {item.discountPercent}%
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-slate-500">
                          {item.gstRate}%
                        </td>
                        <td className="p-2.5 text-right font-bold tabular-nums text-teal-800 dark:text-teal-400">
                          ₹{item.total.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Customer, Payment & Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer & Doctor Card */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Customer & Doctor
            </h4>

            {/* Customer Dropdown / Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Customer Record:
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedCustomerId(id);
                  const cust = customers.find(c => c.id === id);
                  if (cust) {
                    setCustomerName(cust.name);
                    setCustomerPhone(cust.phone);
                    if (cust.doctorName) setDoctorName(cust.doctorName);
                  } else {
                    setCustomerName('Walk-in Cash Customer');
                    setCustomerPhone('');
                  }
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-white"
              >
                <option value="">Walk-in Cash Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — Bal: ₹{c.outstandingBalance}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Name / Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Customer Name:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Phone (SMS bill):</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Doctor Prescription:</label>
              <input
                type="text"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="Dr. Name (Optional)"
                className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs dark:text-white"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Payment Method
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setPaymentMethod('cash'); setShowUpiQr(false); }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash</span>
              </button>

              <button
                onClick={() => { setPaymentMethod('upi'); setShowUpiQr(true); }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>UPI QR</span>
              </button>

              <button
                onClick={() => { setPaymentMethod('card'); setShowUpiQr(false); }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Card (POS)</span>
              </button>

              <button
                onClick={() => { setPaymentMethod('credit'); setShowUpiQr(false); }}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all ${
                  paymentMethod === 'credit'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Credit (Udhar)</span>
              </button>
            </div>

            {/* UPI QR Display when selected */}
            {paymentMethod === 'upi' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-center space-y-1.5 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Scan to Pay ₹{billSummary.finalAmount}
                </span>
                <div className="w-24 h-24 mx-auto bg-white p-1 rounded-lg border flex items-center justify-center shadow-sm">
                  {/* Clean SVG QR code representation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="25" height="25" fill="black" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="19" y="19" width="7" height="7" fill="black" />
                    <rect x="65" y="10" width="25" height="25" fill="black" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="74" y="19" width="7" height="7" fill="black" />
                    <rect x="10" y="65" width="25" height="25" fill="black" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="19" y="74" width="7" height="7" fill="black" />
                    <rect x="45" y="15" width="10" height="25" fill="black" />
                    <rect x="40" y="50" width="20" height="10" fill="black" />
                    <rect x="65" y="65" width="12" height="12" fill="black" />
                    <rect x="78" y="78" width="12" height="12" fill="black" />
                  </svg>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  VPA: {pharmacy.upiVpa || 'sanjivani@okhdfcbank'}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Supports Google Pay · PhonePe · Paytm · BHIM
                </p>
              </div>
            )}

            {/* Cash Tender / Change Returned */}
            {paymentMethod === 'cash' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Cash Tendered:</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    placeholder={`₹${billSummary.finalAmount}`}
                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Change Due:</label>
                  <div className="w-full p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{changeReturned}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bill Calculation Summary Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 shadow-lg">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Items Subtotal:</span>
              <span className="tabular-nums font-mono">₹{billSummary.subtotal.toFixed(2)}</span>
            </div>

            {billSummary.totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Discount:</span>
                <span className="tabular-nums font-mono">-₹{billSummary.totalDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-300">
              <span>GST (CGST + SGST):</span>
              <span className="tabular-nums font-mono">₹{billSummary.totalGst.toFixed(2)}</span>
            </div>

            {billSummary.rounding !== 0 && (
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Round Off:</span>
                <span className="tabular-nums font-mono">{billSummary.rounding > 0 ? '+' : ''}₹{billSummary.rounding}</span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-sm text-white">PAYABLE:</span>
              <span className="text-2xl font-extrabold text-teal-400 tabular-nums font-mono">
                ₹{billSummary.finalAmount}
              </span>
            </div>

            {/* Finalize Button */}
            <button
              onClick={handleFinalizeBill}
              disabled={isSubmitting || cartItems.length === 0}
              className={`w-full py-3 mt-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                cartItems.length > 0 && !isSubmitting
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Generating Invoice...' : isOffline ? 'Save & Print Offline Bill' : 'Print & Generate Bill'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print Modal for generated invoice */}
      {activeInvoiceForPrint && (
        <PrintModal
          invoice={activeInvoiceForPrint}
          pharmacy={pharmacy}
          onClose={() => setActiveInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
