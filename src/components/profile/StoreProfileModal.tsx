import React, { useState } from 'react';
import { Pharmacy } from '../../types/pharmacy.js';
import { Building, Phone, Mail, MapPin, FileText, QrCode, Shield, Download, X, Check, Palette } from 'lucide-react';

interface StoreProfileModalProps {
  pharmacy: Pharmacy;
  onClose: () => void;
  onUpdate: (updated: Pharmacy) => void;
  onOpenBrandCustomizer?: () => void;
}

export const StoreProfileModal: React.FC<StoreProfileModalProps> = ({ pharmacy, onClose, onUpdate, onOpenBrandCustomizer }) => {
  const [formData, setFormData] = useState({
    name: pharmacy.name,
    ownerName: pharmacy.ownerName,
    mobile: pharmacy.mobile,
    email: pharmacy.email,
    address: pharmacy.address,
    city: pharmacy.city,
    state: pharmacy.state,
    pincode: pharmacy.pincode,
    gstin: pharmacy.gstin || '',
    dlNumber: pharmacy.dlNumber || '',
    upiVpa: pharmacy.upiVpa || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/pharmacies/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdate(data.pharmacy);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Full backup JSON export
  const handleExportBackup = () => {
    const backupData = {
      pharmacy,
      exportedAt: new Date().toISOString(),
      platform: 'MediOneBilling SaaS'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${pharmacy.name.replace(/\s+/g, '_')}_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pharmacy Store Profile & Invoicing Details
            </h3>
            <p className="text-xs text-slate-500">
              Details printed on retail cash memos, GST invoices, and UPI counter QR code
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Store profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1">Pharmacy / Medical Store Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Owner / Chief Pharmacist *</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Counter Mobile *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Store Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Drug License (DL No) *</label>
              <input
                type="text"
                placeholder="20B/21B-XXXXX"
                value={formData.dlNumber}
                onChange={e => setFormData({ ...formData, dlNumber: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">GSTIN</label>
              <input
                type="text"
                placeholder="27XXXXXXXXXXXXX"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Store UPI VPA for Counter QR Code</label>
            <input
              type="text"
              placeholder="e.g. pharmacy@okhdfcbank"
              value={formData.upiVpa}
              onChange={e => setFormData({ ...formData, upiVpa: e.target.value })}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Generates dynamic UPI QR code on the billing counter and thermal receipts.
            </span>
          </div>

          {/* Brand Logo & Splash Customizer Link */}
          {onOpenBrandCustomizer && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBrandCustomizer();
                }}
                className="w-full py-2 px-3 border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-teal-100/50 transition"
              >
                <Palette className="w-4 h-4" />
                <span>Customize Pharmacy Logo & Splash Screen</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t flex items-center justify-between">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Export Store Backup JSON</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Update Store Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
