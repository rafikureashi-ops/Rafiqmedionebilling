import React, { useState } from 'react';
import { Supplier, Customer, Pharmacy } from '../../types/pharmacy.js';
import { Users, Truck, Plus, CheckCircle, Search, CreditCard, Banknote, X } from 'lucide-react';

interface SuppliersAndCustomersProps {
  suppliers: Supplier[];
  customers: Customer[];
  pharmacy: Pharmacy;
  onRefresh: () => void;
}

export const SuppliersAndCustomers: React.FC<SuppliersAndCustomersProps> = ({
  suppliers,
  customers,
  pharmacy,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [activePaySupplier, setActivePaySupplier] = useState<Supplier | null>(null);
  const [activeCollectCustomer, setActiveCollectCustomer] = useState<Customer | null>(null);

  // Form states
  const [custForm, setCustForm] = useState({ name: '', phone: '', address: '', doctorName: '', creditLimit: 5000 });
  const [supForm, setSupForm] = useState({ name: '', companyName: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', dlNumber: '', paymentTerms: '30 Days Net', openingBalance: 0 });

  // Payment form states
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [payRef, setPayRef] = useState('');

  // Filtered lists
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify(custForm)
      });
      if (res.ok) {
        setShowAddCustomerModal(false);
        setCustForm({ name: '', phone: '', address: '', doctorName: '', creditLimit: 5000 });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify(supForm)
      });
      if (res.ok) {
        setShowAddSupplierModal(false);
        setSupForm({ name: '', companyName: '', contactPerson: '', phone: '', email: '', address: '', gstin: '', dlNumber: '', paymentTerms: '30 Days Net', openingBalance: 0 });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Collect from Customer
  const handleCollectCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollectCustomer) return;

    try {
      const res = await fetch(`/api/customers/${activeCollectCustomer.id}/collect-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({ amount: payAmount, paymentMethod: payMethod, reference: payRef })
      });
      if (res.ok) {
        setActiveCollectCustomer(null);
        setPayAmount(0);
        setPayRef('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pay Supplier
  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaySupplier) return;

    try {
      const res = await fetch(`/api/suppliers/${activePaySupplier.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({ amount: payAmount, paymentMethod: payMethod, reference: payRef })
      });
      if (res.ok) {
        setActivePaySupplier(null);
        setPayAmount(0);
        setPayRef('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Ledger & Accounts Management
          </h2>
          <p className="text-xs text-slate-500">
            Track customer credit receivables and supplier trade payables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'customers'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Patients & Customers ({customers.length})
            </button>
            <button
              onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'suppliers'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Wholesale Suppliers ({suppliers.length})
            </button>
          </div>

          <button
            onClick={() => activeTab === 'customers' ? setShowAddCustomerModal(true) : setShowAddSupplierModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === 'customers' ? 'Customer' : 'Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'customers' ? 'customers by name or phone...' : 'suppliers by agency, name or phone...'}`}
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs dark:text-white"
        />
      </div>

      {/* CUSTOMERS VIEW */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Customer / Patient</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding Due</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {cust.name}
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {cust.phone}
                    </td>
                    <td className="p-3 text-slate-500">
                      {cust.address || 'Local Customer'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {cust.doctorName || 'Self / OTC'}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-500">
                      ₹{cust.creditLimit}
                    </td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums">
                      <span className={cust.outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}>
                        ₹{cust.outstandingBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {cust.outstandingBalance > 0 ? (
                        <button
                          onClick={() => { setActiveCollectCustomer(cust); setPayAmount(cust.outstandingBalance); }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/40 rounded hover:bg-teal-100"
                        >
                          Collect Payment
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">No Dues</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS VIEW */}
      {activeTab === 'suppliers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="p-3">Agency & Supplier</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">GSTIN / DL</th>
                  <th className="p-3">Payment Terms</th>
                  <th className="p-3 text-right">Outstanding Payable</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white block">{sup.name}</span>
                      <span className="text-[10px] text-slate-500">{sup.companyName}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">{sup.contactPerson}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{sup.phone}</span>
                    </td>
                    <td className="p-3 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      <div>GST: {sup.gstin || 'N/A'}</div>
                      <div>DL: {sup.dlNumber || 'N/A'}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {sup.paymentTerms}
                    </td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums">
                      <span className={sup.outstandingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}>
                        ₹{sup.outstandingBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {sup.outstandingBalance > 0 ? (
                        <button
                          onClick={() => { setActivePaySupplier(sup); setPayAmount(sup.outstandingBalance); }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/40 rounded hover:bg-teal-100"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Customer Payment Modal */}
      {activeCollectCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Collect Credit from {activeCollectCustomer.name}
              </h3>
              <button onClick={() => setActiveCollectCustomer(null)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCollectCustomer} className="space-y-3">
              <div>
                <span className="text-xs text-slate-500">Current Outstanding:</span>
                <div className="text-xl font-bold text-rose-600">₹{activeCollectCustomer.outstandingBalance.toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Amount Receiving (₹):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={activeCollectCustomer.outstandingBalance}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Payment Method:</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full p-2 border rounded-lg text-xs"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Reference / Note:</label>
                <input
                  type="text"
                  placeholder="Receipt # / UTR"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setActiveCollectCustomer(null)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg">Confirm Collection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {activePaySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Payment to {activePaySupplier.name}
              </h3>
              <button onClick={() => setActivePaySupplier(null)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handlePaySupplier} className="space-y-3">
              <div>
                <span className="text-xs text-slate-500">Total Outstanding Payable:</span>
                <div className="text-xl font-bold text-amber-600">₹{activePaySupplier.outstandingBalance.toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Payment Amount (₹):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={activePaySupplier.outstandingBalance}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Payment Mode:</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full p-2 border rounded-lg text-xs"
                >
                  <option value="cheque">Cheque</option>
                  <option value="neft">NEFT / RTGS</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Cheque No / UTR Ref:</label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-991204"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setActivePaySupplier(null)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={custForm.name}
                  onChange={e => setCustForm({ ...custForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={custForm.phone}
                  onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                  placeholder="98XXXXXXXX"
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={custForm.address}
                  onChange={e => setCustForm({ ...custForm, address: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={custForm.doctorName}
                    onChange={e => setCustForm({ ...custForm, doctorName: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={custForm.creditLimit}
                    onChange={e => setCustForm({ ...custForm, creditLimit: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full border p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Supplier Agency</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Supplier Agency Name *</label>
                  <input
                    type="text"
                    required
                    value={supForm.name}
                    onChange={e => setSupForm({ ...supForm, name: e.target.value })}
                    placeholder="e.g. Sun Pharma Agency"
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Company / Principal</label>
                  <input
                    type="text"
                    value={supForm.companyName}
                    onChange={e => setSupForm({ ...supForm, companyName: e.target.value })}
                    placeholder="e.g. Sun Pharma Ltd"
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supForm.contactPerson}
                    onChange={e => setSupForm({ ...supForm, contactPerson: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={supForm.phone}
                    onChange={e => setSupForm({ ...supForm, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={supForm.gstin}
                    onChange={e => setSupForm({ ...supForm, gstin: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Drug License (DL)</label>
                  <input
                    type="text"
                    value={supForm.dlNumber}
                    onChange={e => setSupForm({ ...supForm, dlNumber: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Address / Depot Location</label>
                <input
                  type="text"
                  value={supForm.address}
                  onChange={e => setSupForm({ ...supForm, address: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddSupplierModal(false)} className="px-3 py-1.5 text-xs text-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
