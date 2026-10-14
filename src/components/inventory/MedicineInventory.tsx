import React, { useState, useMemo } from 'react';
import {
  Medicine,
  MedicineBatch,
  DosageForm,
  ScheduleCategory,
  Pharmacy
} from '../../types/pharmacy.js';
import {
  Search,
  Plus,
  Package,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  X,
  Check,
  Edit2
} from 'lucide-react';

interface MedicineInventoryProps {
  medicines: Medicine[];
  pharmacy: Pharmacy;
  onRefresh: () => void;
}

export const MedicineInventory: React.FC<MedicineInventoryProps> = ({
  medicines,
  pharmacy,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('all');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  // Modals state
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState<Medicine | null>(null);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState<{ med: Medicine; batch: MedicineBatch } | null>(null);

  // Form states for Add Medicine
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    dosageForm: 'Tablet' as DosageForm,
    strength: '',
    packSize: '10 Tablets Strip',
    unitsPerPack: 10,
    barcode: '',
    hsnCode: '30049060',
    gstRate: 12,
    scheduleCategory: 'OTC' as ScheduleCategory,
    minimumStockLevel: 20,
    rackLocation: 'Rack A-01',
    initialBatchNumber: '',
    initialExpiryDate: '',
    initialMrp: 0,
    initialPurchasePrice: 0,
    initialSellingPrice: 0,
    initialQuantity: 0
  });

  // Form states for Add Batch
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: '',
    expiryDate: '',
    mrp: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    rackLocation: ''
  });

  // Stock Adjustment Form
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Physical audit reconciliation');
  const [adjustAction, setAdjustAction] = useState<'add' | 'remove' | 'quarantine'>('add');

  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filtered Medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.barcode && m.barcode.includes(searchQuery));
      const matchCategory = selectedCategory === 'all' || m.dosageForm === selectedCategory;
      const matchSchedule = selectedSchedule === 'all' || m.scheduleCategory === selectedSchedule;
      return matchSearch && matchCategory && matchSchedule;
    });
  }, [medicines, searchQuery, selectedCategory, selectedSchedule]);

  // Handle Add Medicine Submit
  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        genericName: formData.genericName,
        manufacturer: formData.manufacturer,
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        packSize: formData.packSize,
        unitsPerPack: formData.unitsPerPack,
        barcode: formData.barcode,
        hsnCode: formData.hsnCode,
        gstRate: formData.gstRate,
        scheduleCategory: formData.scheduleCategory,
        minimumStockLevel: formData.minimumStockLevel,
        rackLocation: formData.rackLocation,
        initialBatch: formData.initialBatchNumber
          ? {
              batchNumber: formData.initialBatchNumber,
              expiryDate: formData.initialExpiryDate,
              mrp: formData.initialMrp,
              purchasePrice: formData.initialPurchasePrice,
              sellingPrice: formData.initialSellingPrice || formData.initialMrp,
              quantity: formData.initialQuantity,
              rackLocation: formData.rackLocation
            }
          : undefined
      };

      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pharmacy-id': pharmacy.id
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddMedModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Batch Submit
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddBatchModal) return;

    try {
      const res = await fetch(`/api/medicines/${showAddBatchModal.id}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pharmacy-id': pharmacy.id
        },
        body: JSON.stringify(batchFormData)
      });

      if (res.ok) {
        setShowAddBatchModal(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Stock Adjustment
  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStockAdjustModal) return;

    const delta = adjustAction === 'remove' || adjustAction === 'quarantine' ? -Math.abs(adjustQty) : Math.abs(adjustQty);

    try {
      const res = await fetch(`/api/medicines/${showStockAdjustModal.med.id}/adjust-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pharmacy-id': pharmacy.id
        },
        body: JSON.stringify({
          batchId: showStockAdjustModal.batch.id,
          quantityChange: delta,
          reason: adjustReason,
          actionType: adjustAction === 'quarantine' ? 'EXPIRED_QUARANTINE' : 'STOCK_AUDIT'
        })
      });

      if (res.ok) {
        setShowStockAdjustModal(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    let csv = 'Product ID,Brand Name,Generic Name,Dosage Form,HSN,GST %,Schedule,Total Stock,Batch Number,Expiry,MRP,Purchase Rate,Selling Rate,Batch Stock,Rack\n';

    medicines.forEach(m => {
      if (m.batches.length === 0) {
        csv += `"${m.id}","${m.name}","${m.genericName}","${m.dosageForm}","${m.hsnCode}","${m.gstRate}","${m.scheduleCategory}","${m.totalStock}","","","","","","","${m.rackLocation}"\n`;
      } else {
        m.batches.forEach(b => {
          csv += `"${m.id}","${m.name}","${m.genericName}","${m.dosageForm}","${m.hsnCode}","${m.gstRate}","${m.scheduleCategory}","${m.totalStock}","${b.batchNumber}","${b.expiryDate}","${b.mrp}","${b.purchasePrice}","${b.sellingPrice}","${b.currentStock}","${b.rackLocation || m.rackLocation}"\n`;
        });
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medione_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Medicine Master & Batch Inventory
          </h2>
          <p className="text-xs text-slate-500">
            {medicines.length} registered pharmaceutical formulations with batch-level tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddMedModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by brand name, generic formulation, or barcode..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white"
          >
            <option value="all">All Dosage Forms</option>
            <option value="Tablet">Tablets</option>
            <option value="Capsule">Capsules</option>
            <option value="Syrup">Syrups & Liquids</option>
            <option value="Injection">Injections</option>
            <option value="Ointment">Ointments</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedSchedule}
            onChange={e => setSelectedSchedule(e.target.value)}
            className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs dark:text-white"
          >
            <option value="all">All Drug Schedules</option>
            <option value="OTC">OTC (Over the Counter)</option>
            <option value="Schedule H">Schedule H</option>
            <option value="Schedule H1">Schedule H1 (Controlled)</option>
            <option value="Schedule X">Schedule X</option>
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Medicine & Generic Form</th>
                <th className="p-3">Dosage & Pack</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">Rack</th>
                <th className="p-3 text-right">Min Stock</th>
                <th className="p-3 text-right">Total Stock</th>
                <th className="p-3 text-center">Batches</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMedicines.map(med => {
                const isExpanded = expandedMedId === med.id;
                const isLowStock = med.totalStock <= med.minimumStockLevel;

                return (
                  <React.Fragment key={med.id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{med.name}</span>
                          {med.barcode && (
                            <span className="text-[10px] font-mono text-slate-400">
                              #{med.barcode}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {med.genericName} · {med.manufacturer}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        <span>{med.dosageForm}</span>
                        <span className="block text-[11px] text-slate-500">{med.packSize}</span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            med.scheduleCategory === 'Schedule H1'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : med.scheduleCategory === 'Schedule H'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {med.scheduleCategory}
                        </span>
                      </td>

                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {med.rackLocation}
                      </td>

                      <td className="p-3 text-right font-mono tabular-nums text-slate-500">
                        {med.minimumStockLevel}
                      </td>

                      <td className="p-3 text-right font-bold font-mono tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            med.totalStock === 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {med.totalStock} units
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          {med.batches.length} {med.batches.length === 1 ? 'Batch' : 'Batches'}{' '}
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setShowAddBatchModal(med)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 rounded hover:bg-teal-100 transition-colors"
                        >
                          + New Batch
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Batches View */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0 bg-slate-50/70 dark:bg-slate-950/40 border-y border-slate-200 dark:border-slate-800">
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Active Batches for {med.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                FEFO Recommendation: First expiring batch is served automatically at billing counter
                              </span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                                  <tr>
                                    <th className="p-2">Batch No</th>
                                    <th className="p-2">Expiry</th>
                                    <th className="p-2 text-right">Purchase Rate</th>
                                    <th className="p-2 text-right">MRP</th>
                                    <th className="p-2 text-right">Selling Rate</th>
                                    <th className="p-2 text-right">Available Stock</th>
                                    <th className="p-2">Rack</th>
                                    <th className="p-2 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {med.batches.map(batch => {
                                    const isExpired = batch.expiryDate < currentMonthStr;
                                    return (
                                      <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="p-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                          {batch.batchNumber}
                                        </td>
                                        <td className="p-2 font-mono">
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              isExpired
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                : 'text-slate-700 dark:text-slate-300'
                                            }`}
                                          >
                                            {batch.expiryDate} {isExpired ? '(EXPIRED)' : ''}
                                          </span>
                                        </td>
                                        <td className="p-2 text-right tabular-nums text-slate-500">
                                          ₹{batch.purchasePrice.toFixed(2)}
                                        </td>
                                        <td className="p-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                                          ₹{batch.mrp.toFixed(2)}
                                        </td>
                                        <td className="p-2 text-right tabular-nums font-bold text-teal-700 dark:text-teal-400">
                                          ₹{batch.sellingPrice.toFixed(2)}
                                        </td>
                                        <td className="p-2 text-right tabular-nums font-semibold">
                                          {batch.currentStock}
                                        </td>
                                        <td className="p-2 text-slate-500">
                                          {batch.rackLocation || med.rackLocation}
                                        </td>
                                        <td className="p-2 text-right">
                                          <button
                                            onClick={() => setShowStockAdjustModal({ med, batch })}
                                            className="px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:text-slate-900 border rounded"
                                          >
                                            Adjust / Quarantine
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Medicine Formulation
              </h3>
              <button
                onClick={() => setShowAddMedModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dolo 650, Augmentin 625"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Generic Composition *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol IP 650mg"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Micro Labs, Cipla"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={formData.dosageForm}
                    onChange={e => setFormData({ ...formData, dosageForm: e.target.value as DosageForm })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={e => setFormData({ ...formData, packSize: e.target.value })}
                    placeholder="10 Tablets Strip"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule Category
                  </label>
                  <select
                    value={formData.scheduleCategory}
                    onChange={e => setFormData({ ...formData, scheduleCategory: e.target.value as ScheduleCategory })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  >
                    <option value="OTC">OTC (Over the counter)</option>
                    <option value="Schedule H">Schedule H</option>
                    <option value="Schedule H1">Schedule H1</option>
                    <option value="Schedule X">Schedule X</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12% (Standard)</option>
                    <option value={18}>18%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={e => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. Rack B-02"
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Reorder Stock
                  </label>
                  <input
                    type="number"
                    value={formData.minimumStockLevel}
                    onChange={e => setFormData({ ...formData, minimumStockLevel: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg dark:text-white"
                  />
                </div>
              </div>

              {/* Initial Batch Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                  Initial Batch (Optional)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Batch No:</label>
                    <input
                      type="text"
                      placeholder="e.g. B-998"
                      value={formData.initialBatchNumber}
                      onChange={e => setFormData({ ...formData, initialBatchNumber: e.target.value })}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Expiry (YYYY-MM):</label>
                    <input
                      type="text"
                      placeholder="2027-08"
                      value={formData.initialExpiryDate}
                      onChange={e => setFormData({ ...formData, initialExpiryDate: e.target.value })}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Purchase Rate (₹):</label>
                    <input
                      type="number"
                      value={formData.initialPurchasePrice}
                      onChange={e => setFormData({ ...formData, initialPurchasePrice: Number(e.target.value) })}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">MRP (₹):</label>
                    <input
                      type="number"
                      value={formData.initialMrp}
                      onChange={e => setFormData({ ...formData, initialMrp: Number(e.target.value) })}
                      className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border rounded dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Batch to {showAddBatchModal.name}
              </h3>
              <button
                onClick={() => setShowAddBatchModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  Batch Number *
                </label>
                <input
                  type="text"
                  required
                  value={batchFormData.batchNumber}
                  onChange={e => setBatchFormData({ ...batchFormData, batchNumber: e.target.value })}
                  placeholder="e.g. DL-2026-X"
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Expiry (YYYY-MM) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2027-12"
                    value={batchFormData.expiryDate}
                    onChange={e => setBatchFormData({ ...batchFormData, expiryDate: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Initial Stock Qty *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={batchFormData.currentStock}
                    onChange={e => setBatchFormData({ ...batchFormData, currentStock: Number(e.target.value) })}
                    className="w-full p-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Purchase Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={batchFormData.purchasePrice}
                    onChange={e => setBatchFormData({ ...batchFormData, purchasePrice: Number(e.target.value) })}
                    className="w-full p-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={batchFormData.mrp}
                    onChange={e => setBatchFormData({ ...batchFormData, mrp: Number(e.target.value) })}
                    className="w-full p-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Selling Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={batchFormData.sellingPrice}
                    onChange={e => setBatchFormData({ ...batchFormData, sellingPrice: Number(e.target.value) })}
                    className="w-full p-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg"
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Adjust Stock: {showStockAdjustModal.med.name} (Batch {showStockAdjustModal.batch.batchNumber})
              </h3>
              <button
                onClick={() => setShowStockAdjustModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjust} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Action Type:
                </label>
                <select
                  value={adjustAction}
                  onChange={e => setAdjustAction(e.target.value as any)}
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                >
                  <option value="add">Add Found Stock (Physical Audit +)</option>
                  <option value="remove">Write-off / Breakage / Damage (-)</option>
                  <option value="quarantine">Quarantine Expired Stock for Supplier Return (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Audit Note:
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowStockAdjustModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg"
                >
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
