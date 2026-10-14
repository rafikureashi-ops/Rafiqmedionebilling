import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, Pharmacy } from '../../types/pharmacy.js';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Plus,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  X
} from 'lucide-react';

interface FinancialsAndExpensesProps {
  pharmacy: Pharmacy;
}

export const FinancialsAndExpenses: React.FC<FinancialsAndExpensesProps> = ({ pharmacy }) => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'expenses'>('pnl');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pnlSummary, setPnlSummary] = useState<any>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Add Expense form
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [description, setDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  const loadFinancialData = async () => {
    try {
      const [resExp, resPnl] = await Promise.all([
        fetch('/api/expenses', { headers: { 'x-pharmacy-id': pharmacy.id } }),
        fetch('/api/financials/pnl', { headers: { 'x-pharmacy-id': pharmacy.id } })
      ]);

      const dataExp = await resExp.json();
      const dataPnl = await resPnl.json();

      if (dataExp.success) setExpenses(dataExp.expenses);
      if (dataPnl.success) setPnlSummary(dataPnl.summary);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [pharmacy.id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({ category, amount, date: expenseDate, paymentMethod, description, receiptNumber })
      });

      if (res.ok) {
        setShowAddExpenseModal(false);
        setAmount(0);
        setDescription('');
        setReceiptNumber('');
        loadFinancialData();
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Financial Health & P&L Statement
          </h2>
          <p className="text-xs text-slate-500">
            Real batch-level COGS accounting, gross margins, and store operating expenditure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('pnl')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'pnl'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Profit & Loss Summary
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Operating Expenses ({expenses.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* P&L OVERVIEW */}
      {activeTab === 'pnl' && pnlSummary && (
        <div className="space-y-6">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Net Sales Revenue</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                ₹{pnlSummary.netSales.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {pnlSummary.invoiceCount} retail invoices billed
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">True COGS (Batch Cost)</span>
              <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
                ₹{pnlSummary.cogs.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Direct wholesale purchase cost
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Estimated Gross Profit</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{pnlSummary.estimatedGrossProfit.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                {pnlSummary.grossProfitMargin}% Gross Margin
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Estimated Net Operating Profit</span>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  pnlSummary.estimatedNetProfit >= 0
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-rose-600'
                }`}
              >
                ₹{pnlSummary.estimatedNetProfit.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                After subtracting ₹{pnlSummary.totalOperatingExpenses} expenses
              </span>
            </div>
          </div>

          {/* Structured P&L Statement Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income & Gross Profit Statement */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between border-b pb-2">
                <span>Trading Account Breakdown</span>
                <span className="text-[11px] font-normal text-slate-500">All figures in INR</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Gross Pharmacy Sales:</span>
                  <span className="font-mono tabular-nums font-semibold">₹{pnlSummary.grossSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-rose-600">
                  <span>Less: Customer Discounts Allowed:</span>
                  <span className="font-mono tabular-nums font-semibold">-₹{pnlSummary.totalDiscountsGiven.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-t font-semibold text-slate-900 dark:text-white">
                  <span>Net Sales Revenue:</span>
                  <span className="font-mono tabular-nums">₹{pnlSummary.netSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
                  <span>Less: Cost of Goods Sold (COGS):</span>
                  <span className="font-mono tabular-nums font-semibold">-₹{pnlSummary.cogs.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Gross Profit from Operations:</span>
                  <span className="font-mono tabular-nums">₹{pnlSummary.estimatedGrossProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses & Working Capital */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between border-b pb-2">
                <span>Balance & Working Capital Position</span>
                <span className="text-[11px] font-normal text-slate-500">Store Liquidity</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Total Operating Expenses:</span>
                  <span className="font-mono tabular-nums font-semibold text-rose-600">₹{pnlSummary.totalOperatingExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Customer Trade Receivables (Udhar Due):</span>
                  <span className="font-mono tabular-nums font-semibold text-amber-600">₹{pnlSummary.totalCustomerReceivables.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-400">Supplier Trade Payables (Pending Bills):</span>
                  <span className="font-mono tabular-nums font-semibold text-rose-600">₹{pnlSummary.totalSupplierPayables.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-sm text-teal-800 dark:text-teal-400">
                  <span>Estimated Net Profit:</span>
                  <span className="font-mono tabular-nums">₹{pnlSummary.estimatedNetProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Expense Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Receipt Ref</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {e.category}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {e.description || 'General store expense'}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {e.date}
                    </td>
                    <td className="p-3 uppercase text-[11px] text-slate-600 dark:text-slate-400">
                      {e.paymentMethod}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {e.receiptNumber || 'N/A'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums text-rose-600">
                      ₹{e.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Operating Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full p-2 border rounded-lg text-xs"
                >
                  <option value="Rent">Shop Rent</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Electricity">Electricity & Refrigerator Power</option>
                  <option value="Packaging & Bags">Packaging & Bags</option>
                  <option value="Transport & Delivery">Transport & Home Delivery</option>
                  <option value="Internet & Phone">Internet & Phone</option>
                  <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 border rounded-lg text-xs"
                  >
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. March store electricity bill"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Receipt / Voucher Number</label>
                <input
                  type="text"
                  placeholder="e.g. VCH-0042"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
