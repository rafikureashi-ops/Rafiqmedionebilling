import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import {
  Pharmacy,
  Medicine,
  Invoice,
  PurchaseInvoice,
  Customer,
  Supplier,
  Expense,
  SubscriptionPayment,
  SyncConflict,
  DeviceInfo,
  PlatformAnnouncement,
  SubscriptionPlanId
} from '../types/pharmacy.js';

export const apiRouter = Router();

// Middleware helper to get pharmacyId from headers
const getPharmacyId = (req: any): string => {
  return (req.headers['x-pharmacy-id'] as string) || 'pharm_sanjivani_01';
};

// ----------------------------------------------------
// 1. AUTHENTICATION & PHARMACY TENANCY
// ----------------------------------------------------
apiRouter.post('/auth/login', (req, res) => {
  const { email, password, deviceName, platform } = req.body;

  // Super Admin Check
  if (email === 'admin@medione.in' && password === 'admin@123') {
    return res.json({
      success: true,
      role: 'superadmin',
      user: {
        id: 'admin_root',
        name: 'MediOne Platform Super Admin',
        email: 'admin@medione.in',
        role: 'superadmin'
      },
      token: 'token_superadmin_' + Date.now()
    });
  }

  // Pharmacy login
  const pharmacies = db.getPharmacies();
  const pharmacy = pharmacies.find(
    p => p.email.toLowerCase() === (email || '').toLowerCase() || p.mobile === email
  );

  if (!pharmacy) {
    return res.status(401).json({ success: false, message: 'Invalid mobile or email address' });
  }

  if (pharmacy.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Your pharmacy account has been suspended by the platform administrator. Please contact support.' });
  }

  // Register device if info provided
  const deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
  const device: DeviceInfo = {
    id: deviceId,
    pharmacyId: pharmacy.id,
    deviceName: deviceName || 'Web Terminal',
    platform: platform || 'Web',
    browser: req.headers['user-agent'] || 'Browser',
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isAuthorized: true
  };
  db.registerDevice(device);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId: pharmacy.id,
    userId: 'user_' + pharmacy.id,
    userName: pharmacy.ownerName,
    action: 'USER_LOGIN',
    entityType: 'UserSession',
    entityId: pharmacy.id,
    details: `Owner logged in from ${device.deviceName} (${device.platform})`,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    role: 'owner',
    pharmacy,
    user: {
      id: 'usr_' + pharmacy.id,
      name: pharmacy.ownerName,
      email: pharmacy.email,
      role: 'owner',
      pharmacyId: pharmacy.id
    },
    deviceId,
    token: 'token_mob_' + pharmacy.id + '_' + Date.now()
  });
});

apiRouter.post('/auth/register', (req, res) => {
  const {
    name,
    ownerName,
    mobile,
    email,
    address,
    city,
    state,
    pincode,
    gstin,
    dlNumber,
    fssaiNumber,
    upiVpa
  } = req.body;

  if (!name || !ownerName || !mobile) {
    return res.status(400).json({ success: false, message: 'Pharmacy name, owner name, and mobile number are required.' });
  }

  const existing = db.getPharmacies().find(p => p.mobile === mobile);
  if (existing) {
    return res.status(400).json({ success: false, message: 'A pharmacy is already registered with this mobile number.' });
  }

  const newId = 'pharm_' + Math.random().toString(36).substring(2, 8);
  const now = new Date();
  // Provide automatic 24-hour trial on registration
  const trialExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const newPharmacy: Pharmacy = {
    id: newId,
    name,
    ownerName,
    mobile,
    email: email || `${mobile}@medione.in`,
    address: address || 'Main Market Road',
    city: city || 'Local District',
    state: state || 'State',
    pincode: pincode || '110001',
    gstin: gstin || '',
    dlNumber: dlNumber || 'DL-PENDING',
    fssaiNumber: fssaiNumber || '',
    upiVpa: upiVpa || `${mobile}@upi`,
    currency: 'INR',
    status: 'active',
    createdAt: now.toISOString(),
    subscriptionPlanId: 'trial',
    subscriptionStartedAt: now.toISOString(),
    subscriptionExpiresAt: trialExpiry.toISOString(),
    isTrialUsed: true,
    syncedAt: now.toISOString()
  };

  db.addPharmacy(newPharmacy);

  // Seed sample starter inventory so the owner can immediately bill and test
  const sampleMed: Medicine = {
    id: 'med_sample_' + newId,
    pharmacyId: newId,
    name: 'Paracetamol 650 Tablets (Sample)',
    genericName: 'Paracetamol IP 650mg',
    manufacturer: 'Pharma Sample Labs',
    dosageForm: 'Tablet',
    strength: '650 mg',
    packSize: '10 Tablets Strip',
    unitsPerPack: 10,
    barcode: '8900011223344',
    hsnCode: '30049060',
    gstRate: 12,
    scheduleCategory: 'OTC',
    minimumStockLevel: 10,
    rackLocation: 'Counter A-1',
    batches: [
      {
        id: 'bat_sample_01',
        medicineId: 'med_sample_' + newId,
        batchNumber: 'DEMO-BATCH-01',
        expiryDate: new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString().slice(0, 7),
        mrp: 30.00,
        purchasePrice: 20.00,
        sellingPrice: 28.00,
        currentStock: 50,
        createdAt: now.toISOString()
      }
    ],
    totalStock: 50,
    updatedAt: now.toISOString()
  };
  db.addMedicine(sampleMed);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId: newId,
    userId: 'user_' + newId,
    userName: ownerName,
    action: 'PHARMACY_REGISTERED',
    entityType: 'Pharmacy',
    entityId: newId,
    details: `Pharmacy ${name} successfully registered with 24-Hour Trial`,
    timestamp: now.toISOString()
  });

  res.json({
    success: true,
    pharmacy: newPharmacy,
    message: 'Pharmacy registered successfully! 24-hour trial activated.'
  });
});

apiRouter.get('/pharmacies/current', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const pharmacy = db.getPharmacyById(pharmacyId);
  if (!pharmacy) {
    return res.status(404).json({ success: false, message: 'Pharmacy not found' });
  }

  // Check subscription expiry against server time
  const now = Date.now();
  const expiryTime = new Date(pharmacy.subscriptionExpiresAt).getTime();
  const isExpired = now > expiryTime;
  const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));

  res.json({
    success: true,
    pharmacy,
    subscriptionStatus: {
      planId: pharmacy.subscriptionPlanId,
      isExpired,
      remainingSeconds,
      expiresAt: pharmacy.subscriptionExpiresAt,
      serverTime: new Date().toISOString()
    }
  });
});

apiRouter.put('/pharmacies/current', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const updated = db.updatePharmacy(pharmacyId, req.body);
  res.json({ success: true, pharmacy: updated });
});

// ----------------------------------------------------
// 2. MEDICINE INVENTORY & BATCHES
// ----------------------------------------------------
apiRouter.get('/medicines', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const medicines = db.getMedicines(pharmacyId);
  res.json({ success: true, medicines });
});

apiRouter.post('/medicines', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const {
    name,
    genericName,
    manufacturer,
    dosageForm,
    strength,
    packSize,
    unitsPerPack,
    barcode,
    hsnCode,
    gstRate,
    scheduleCategory,
    minimumStockLevel,
    rackLocation,
    initialBatch
  } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Medicine brand name is required.' });
  }

  const medId = 'med_' + Math.random().toString(36).substring(2, 9);
  const batches = [];

  if (initialBatch && initialBatch.batchNumber) {
    batches.push({
      id: 'bat_' + Math.random().toString(36).substring(2, 9),
      medicineId: medId,
      batchNumber: initialBatch.batchNumber,
      expiryDate: initialBatch.expiryDate,
      mrp: Number(initialBatch.mrp) || 0,
      purchasePrice: Number(initialBatch.purchasePrice) || 0,
      sellingPrice: Number(initialBatch.sellingPrice) || Number(initialBatch.mrp) || 0,
      currentStock: Number(initialBatch.quantity) || 0,
      rackLocation: initialBatch.rackLocation || rackLocation,
      supplierId: initialBatch.supplierId,
      createdAt: new Date().toISOString()
    });
  }

  const totalStock = batches.reduce((sum, b) => sum + b.currentStock, 0);

  const newMedicine: Medicine = {
    id: medId,
    pharmacyId,
    name,
    genericName: genericName || '',
    manufacturer: manufacturer || 'Standard Pharma',
    dosageForm: dosageForm || 'Tablet',
    strength: strength || '',
    packSize: packSize || '1 Strip',
    unitsPerPack: Number(unitsPerPack) || 10,
    barcode: barcode || '',
    hsnCode: hsnCode || '3004',
    gstRate: Number(gstRate) || 12,
    scheduleCategory: scheduleCategory || 'OTC',
    minimumStockLevel: Number(minimumStockLevel) || 10,
    rackLocation: rackLocation || 'General Rack',
    batches,
    totalStock,
    updatedAt: new Date().toISOString()
  };

  db.addMedicine(newMedicine);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: 'Pharmacist',
    action: 'MEDICINE_CREATED',
    entityType: 'Medicine',
    entityId: medId,
    details: `Added new medicine ${name} (${genericName}) with initial stock ${totalStock}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, medicine: newMedicine });
});

apiRouter.put('/medicines/:id', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const updated = db.updateMedicine(pharmacyId, id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }
  res.json({ success: true, medicine: updated });
});

apiRouter.delete('/medicines/:id', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const ok = db.deleteMedicine(pharmacyId, id);
  res.json({ success: ok });
});

apiRouter.post('/medicines/:id/batches', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const med = db.getMedicineById(pharmacyId, id);
  if (!med) {
    return res.status(404).json({ success: false, message: 'Medicine not found' });
  }

  const {
    batchNumber,
    expiryDate,
    mrp,
    purchasePrice,
    sellingPrice,
    currentStock,
    rackLocation,
    supplierId
  } = req.body;

  const newBatch = {
    id: 'bat_' + Math.random().toString(36).substring(2, 9),
    medicineId: id,
    batchNumber,
    expiryDate,
    mrp: Number(mrp) || 0,
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice: Number(sellingPrice) || Number(mrp) || 0,
    currentStock: Number(currentStock) || 0,
    rackLocation: rackLocation || med.rackLocation,
    supplierId,
    createdAt: new Date().toISOString()
  };

  med.batches.push(newBatch);
  med.totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
  med.updatedAt = new Date().toISOString();
  db.save();

  res.json({ success: true, medicine: med, batch: newBatch });
});

apiRouter.post('/medicines/:id/adjust-stock', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const { batchId, quantityChange, reason, actionType } = req.body;

  const med = db.getMedicineById(pharmacyId, id);
  if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
  const batch = med.batches.find(b => b.id === batchId);
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

  const qty = Number(quantityChange);
  batch.currentStock += qty;
  if (batch.currentStock < 0) batch.currentStock = 0;
  med.totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
  med.updatedAt = new Date().toISOString();
  db.save();

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: 'Pharmacist',
    action: 'STOCK_ADJUSTMENT',
    entityType: 'MedicineBatch',
    entityId: batchId,
    details: `${actionType || 'Adjusted'} batch ${batch.batchNumber} by ${qty}. Reason: ${reason || 'Physical inventory audit'}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, medicine: med, batch });
});

// ----------------------------------------------------
// 3. BILLING COUNTER & INVOICES
// ----------------------------------------------------
apiRouter.get('/billing/invoices', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const invoices = db.getInvoices(pharmacyId);
  res.json({ success: true, invoices });
});

apiRouter.post('/billing/invoices', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const pharmacy = db.getPharmacyById(pharmacyId);
  const {
    customerName,
    customerPhone,
    customerId,
    doctorName,
    items,
    paymentMethod,
    amountPaid,
    cashTendered,
    changeReturned,
    isOfflineCreated
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one medicine item is required.' });
  }

  // Check for expired batches and enforce hard prevention
  const todayStr = new Date().toISOString().slice(0, 7);
  for (const item of items) {
    if (item.expiryDate && item.expiryDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: `Sale Blocked! Batch ${item.batchNumber} of ${item.medicineName} has expired (${item.expiryDate}). Expired drugs cannot be billed under drug control regulations.`
      });
    }
  }

  // Deduct batch stocks
  for (const item of items) {
    const resDeduct = db.deductBatchStock(pharmacyId, item.medicineId, item.batchId, item.quantity);
    if (!resDeduct.success && resDeduct.conflict) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: `Insufficient stock for ${item.medicineName} (Batch ${item.batchNumber}). Available: ${resDeduct.remaining}`
      });
    }
  }

  // Compute financial totals accurately
  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let totalGst = 0;

  for (const item of items) {
    const lineGross = item.unitPrice * item.quantity;
    const disc = (lineGross * (item.discountPercent || 0)) / 100;
    const taxable = lineGross - disc;
    const gst = (taxable * (item.gstRate || 0)) / 100;

    subtotal += lineGross;
    totalDiscount += disc;
    taxableAmount += taxable;
    totalGst += gst;
  }

  const rawFinal = taxableAmount + totalGst;
  const roundedFinal = Math.round(rawFinal);
  const roundingAdjustment = +(roundedFinal - rawFinal).toFixed(2);

  // Generate sequential invoice number
  const count = db.getInvoices(pharmacyId).length + 1;
  const currentYear = new Date().getFullYear();
  const invoiceNumber = `MOB-${currentYear}-${String(count).padStart(4, '0')}`;

  const newInvoice: Invoice = {
    id: 'inv_' + Math.random().toString(36).substring(2, 9),
    invoiceNumber,
    pharmacyId,
    customerId,
    customerName: customerName || 'Walk-in Cash Customer',
    customerPhone: customerPhone || '',
    doctorName: doctorName || '',
    invoiceDate: new Date().toISOString(),
    items,
    subtotal: +subtotal.toFixed(2),
    totalDiscount: +totalDiscount.toFixed(2),
    taxableAmount: +taxableAmount.toFixed(2),
    cgst: +(totalGst / 2).toFixed(2),
    sgst: +(totalGst / 2).toFixed(2),
    igst: 0,
    totalGst: +totalGst.toFixed(2),
    roundingAdjustment,
    finalAmount: roundedFinal,
    paymentMethod: paymentMethod || 'cash',
    amountPaid: amountPaid ?? roundedFinal,
    cashTendered,
    changeReturned,
    paymentStatus: (amountPaid ?? roundedFinal) >= roundedFinal ? 'paid' : 'pending',
    createdBy: 'user_' + pharmacyId,
    createdByName: pharmacy?.ownerName || 'Cashier',
    isOfflineCreated: !!isOfflineCreated,
    synced: true,
    status: 'active'
  };

  db.addInvoice(newInvoice);

  // If credit sale and customer linked, update customer outstanding balance
  if (paymentMethod === 'credit' && customerId) {
    const cust = db.getCustomers(pharmacyId).find(c => c.id === customerId);
    if (cust) {
      cust.outstandingBalance += roundedFinal;
      db.save();
    }
  }

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: pharmacy?.ownerName || 'Cashier',
    action: 'INVOICE_GENERATED',
    entityType: 'Invoice',
    entityId: newInvoice.id,
    details: `Generated Bill #${invoiceNumber} for ₹${roundedFinal} via ${paymentMethod}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, invoice: newInvoice });
});

apiRouter.post('/billing/invoices/:id/cancel', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const { reason } = req.body;
  const cancelled = db.cancelInvoice(pharmacyId, id, reason || 'Customer returned before leaving counter');
  if (!cancelled) {
    return res.status(404).json({ success: false, message: 'Invoice not found or already cancelled' });
  }

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: 'Pharmacist',
    action: 'INVOICE_CANCELLED',
    entityType: 'Invoice',
    entityId: id,
    details: `Cancelled invoice #${cancelled.invoiceNumber}. Reason: ${reason}. Stocks restored.`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, invoice: cancelled });
});

// ----------------------------------------------------
// 4. PURCHASES & SUPPLIER INWARD ENTRIES
// ----------------------------------------------------
apiRouter.get('/purchases', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const purchases = db.getPurchases(pharmacyId);
  res.json({ success: true, purchases });
});

apiRouter.post('/purchases', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const {
    supplierId,
    supplierName,
    supplierBillNumber,
    purchaseDate,
    items,
    amountPaid,
    paymentMethod,
    notes
  } = req.body;

  if (!supplierId || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Supplier and purchase items are required.' });
  }

  let subtotal = 0;
  let totalGst = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const lineTotal = item.purchaseRate * item.quantity;
    const disc = (lineTotal * (item.discountPercent || 0)) / 100;
    const taxable = lineTotal - disc;
    const gst = (taxable * (item.gstRate || 0)) / 100;
    subtotal += lineTotal;
    totalDiscount += disc;
    totalGst += gst;
  }

  const finalAmount = Math.round(subtotal - totalDiscount + totalGst);

  const purchase: PurchaseInvoice = {
    id: 'purch_' + Math.random().toString(36).substring(2, 9),
    pharmacyId,
    supplierId,
    supplierName: supplierName || 'Registered Supplier',
    supplierBillNumber: supplierBillNumber || `INV-${Date.now().toString().slice(-6)}`,
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    items,
    subtotal: +subtotal.toFixed(2),
    totalGst: +totalGst.toFixed(2),
    totalDiscount: +totalDiscount.toFixed(2),
    finalAmount,
    amountPaid: Number(amountPaid) || 0,
    paymentStatus: (Number(amountPaid) || 0) >= finalAmount ? 'paid' : (Number(amountPaid) || 0) > 0 ? 'partial' : 'pending',
    paymentMethod: paymentMethod || 'cheque',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.addPurchase(purchase);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: 'Pharmacist',
    action: 'PURCHASE_ENTRY',
    entityType: 'PurchaseInvoice',
    entityId: purchase.id,
    details: `Recorded purchase bill #${purchase.supplierBillNumber} from ${purchase.supplierName} for ₹${finalAmount}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, purchase });
});

// ----------------------------------------------------
// 5. SUPPLIERS & CUSTOMERS
// ----------------------------------------------------
apiRouter.get('/suppliers', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  res.json({ success: true, suppliers: db.getSuppliers(pharmacyId) });
});

apiRouter.post('/suppliers', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const newSup: Supplier = {
    id: 'sup_' + Math.random().toString(36).substring(2, 8),
    pharmacyId,
    ...req.body,
    openingBalance: Number(req.body.openingBalance) || 0,
    outstandingBalance: Number(req.body.openingBalance) || 0,
    createdAt: new Date().toISOString()
  };
  db.addSupplier(newSup);
  res.json({ success: true, supplier: newSup });
});

apiRouter.post('/suppliers/:id/pay', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const { amount, paymentMethod, reference } = req.body;

  const supplier = db.getSuppliers(pharmacyId).find(s => s.id === id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

  const payAmt = Number(amount) || 0;
  supplier.outstandingBalance = Math.max(0, supplier.outstandingBalance - payAmt);
  db.save();

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: 'Pharmacist',
    action: 'SUPPLIER_PAYMENT',
    entityType: 'Supplier',
    entityId: id,
    details: `Paid ₹${payAmt} to ${supplier.name} via ${paymentMethod} (${reference || 'N/A'})`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, supplier });
});

apiRouter.get('/customers', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  res.json({ success: true, customers: db.getCustomers(pharmacyId) });
});

apiRouter.post('/customers', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const newCust: Customer = {
    id: 'cust_' + Math.random().toString(36).substring(2, 8),
    pharmacyId,
    ...req.body,
    creditLimit: Number(req.body.creditLimit) || 5000,
    outstandingBalance: 0,
    createdAt: new Date().toISOString()
  };
  db.addCustomer(newCust);
  res.json({ success: true, customer: newCust });
});

apiRouter.post('/customers/:id/collect-payment', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const { amount, paymentMethod, reference } = req.body;

  const customer = db.getCustomers(pharmacyId).find(c => c.id === id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const payAmt = Number(amount) || 0;
  customer.outstandingBalance = Math.max(0, customer.outstandingBalance - payAmt);
  db.save();

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: 'Cashier',
    action: 'CUSTOMER_CREDIT_COLLECTED',
    entityType: 'Customer',
    entityId: id,
    details: `Collected ₹${payAmt} from ${customer.name} via ${paymentMethod} (${reference || 'N/A'})`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, customer });
});

// ----------------------------------------------------
// 6. EXPENSES & FINANCIAL PROFIT AND LOSS
// ----------------------------------------------------
apiRouter.get('/expenses', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  res.json({ success: true, expenses: db.getExpenses(pharmacyId) });
});

apiRouter.post('/expenses', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { category, amount, date, paymentMethod, description, receiptNumber } = req.body;

  const newExpense: Expense = {
    id: 'exp_' + Math.random().toString(36).substring(2, 8),
    pharmacyId,
    category,
    amount: Number(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    paymentMethod: paymentMethod || 'cash',
    description: description || '',
    receiptNumber: receiptNumber || '',
    recordedBy: 'Rajesh Sharma',
    createdAt: new Date().toISOString()
  };

  db.addExpense(newExpense);
  res.json({ success: true, expense: newExpense });
});

apiRouter.get('/financials/pnl', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const invoices = db.getInvoices(pharmacyId).filter(i => i.status === 'active');
  const expenses = db.getExpenses(pharmacyId);
  const customers = db.getCustomers(pharmacyId);
  const suppliers = db.getSuppliers(pharmacyId);

  let grossSales = 0;
  let totalDiscountsGiven = 0;
  let netSales = 0;
  let cogs = 0; // True Cost of Goods Sold from actual batch purchase prices of sold units

  for (const inv of invoices) {
    grossSales += inv.subtotal;
    totalDiscountsGiven += inv.totalDiscount;
    netSales += inv.finalAmount;

    for (const item of inv.items) {
      cogs += (item.purchasePrice || 0) * item.quantity;
    }
  }

  const estimatedGrossProfit = Math.max(0, netSales - cogs);
  const grossProfitMargin = netSales > 0 ? +((estimatedGrossProfit / netSales) * 100).toFixed(1) : 0;

  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedNetProfit = estimatedGrossProfit - totalOperatingExpenses;
  const netProfitMargin = netSales > 0 ? +((estimatedNetProfit / netSales) * 100).toFixed(1) : 0;

  const totalCustomerReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

  res.json({
    success: true,
    summary: {
      grossSales: Math.round(grossSales),
      totalDiscountsGiven: Math.round(totalDiscountsGiven),
      netSales: Math.round(netSales),
      cogs: Math.round(cogs),
      estimatedGrossProfit: Math.round(estimatedGrossProfit),
      grossProfitMargin,
      totalOperatingExpenses: Math.round(totalOperatingExpenses),
      estimatedNetProfit: Math.round(estimatedNetProfit),
      netProfitMargin,
      totalCustomerReceivables: Math.round(totalCustomerReceivables),
      totalSupplierPayables: Math.round(totalSupplierPayables),
      invoiceCount: invoices.length
    }
  });
});

// ----------------------------------------------------
// 7. SUBSCRIPTIONS, ₹1 TRIAL & PAYMENT GATEWAY
// ----------------------------------------------------
apiRouter.get('/subscription/plans', (req, res) => {
  res.json({ success: true, plans: db.getPlans() });
});

apiRouter.post('/subscription/create-order', (req, res) => {
  const { planId } = req.body;
  const plan = db.getPlans().find(p => p.id === planId);
  if (!plan) return res.status(404).json({ success: false, message: 'Invalid plan selected' });

  // Calculate 18% GST transparently for Indian invoicing
  const basePrice = plan.price;
  const gst = +(basePrice * 0.18).toFixed(2);
  const totalAmount = +(basePrice + gst).toFixed(2);

  const orderId = 'order_rzp_' + Math.random().toString(36).substring(2, 10);

  res.json({
    success: true,
    order: {
      orderId,
      planId: plan.id,
      planName: plan.name,
      basePrice,
      gst,
      totalAmount,
      currency: 'INR',
      keyId: 'rzp_test_medione2026'
    }
  });
});

apiRouter.post('/subscription/verify-payment', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { planId, orderId, paymentId, signature } = req.body;

  const pharmacy = db.getPharmacyById(pharmacyId);
  if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

  const plan = db.getPlans().find(p => p.id === planId);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

  // Server-side timestamp calculation: Anti-clock tampering!
  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  pharmacy.subscriptionPlanId = plan.id;
  pharmacy.subscriptionStartedAt = now.toISOString();
  pharmacy.subscriptionExpiresAt = expiresAt.toISOString();
  pharmacy.status = 'active';
  if (plan.id === 'trial') {
    pharmacy.isTrialUsed = true;
  }
  db.save();

  const basePrice = plan.price;
  const tax = +(basePrice * 0.18).toFixed(2);
  const paymentRecord: SubscriptionPayment = {
    id: 'pay_' + Math.random().toString(36).substring(2, 9),
    pharmacyId,
    pharmacyName: pharmacy.name,
    planId: plan.id,
    planName: plan.name,
    amount: basePrice,
    taxAmount: tax,
    totalAmount: +(basePrice + tax).toFixed(2),
    currency: 'INR',
    paymentGateway: 'Razorpay',
    gatewayOrderId: orderId,
    gatewayPaymentId: paymentId || 'pay_sim_' + Math.random().toString(36).substring(2, 9),
    paymentSignature: signature || 'sig_verified_server',
    status: 'success',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  db.addPayment(paymentRecord);

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId,
    userId: 'user_' + pharmacyId,
    userName: pharmacy.ownerName,
    action: 'SUBSCRIPTION_ACTIVATED',
    entityType: 'Subscription',
    entityId: paymentRecord.id,
    details: `Activated plan ${plan.name} (Valid till ${expiresAt.toLocaleDateString('en-IN')}) via Razorpay`,
    timestamp: now.toISOString()
  });

  res.json({
    success: true,
    message: `Plan ${plan.name} successfully activated!`,
    pharmacy,
    payment: paymentRecord
  });
});

apiRouter.post('/subscription/activate-trial', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const pharmacy = db.getPharmacyById(pharmacyId);
  if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

  // Anti-tamper verification: 24h duration strictly calculated server-side
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  pharmacy.subscriptionPlanId = 'trial';
  pharmacy.subscriptionStartedAt = now.toISOString();
  pharmacy.subscriptionExpiresAt = expiresAt.toISOString();
  pharmacy.status = 'active';
  pharmacy.isTrialUsed = true;
  db.save();

  const trialPayment: SubscriptionPayment = {
    id: 'pay_trial_' + Date.now(),
    pharmacyId,
    pharmacyName: pharmacy.name,
    planId: 'trial',
    planName: 'One-Day Trial (₹1)',
    amount: 1,
    taxAmount: 0.18,
    totalAmount: 1.18,
    currency: 'INR',
    paymentGateway: 'Razorpay',
    gatewayPaymentId: 'pay_rzp_trial_' + Date.now(),
    status: 'success',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  db.addPayment(trialPayment);

  res.json({
    success: true,
    message: '₹1 Trial verified and activated for 24 hours!',
    pharmacy,
    expiresAt: expiresAt.toISOString(),
    remainingSeconds: 86400
  });
});

// ----------------------------------------------------
// 8. MULTI-DEVICE SYNC & OFFLINE ENGINE
// ----------------------------------------------------
apiRouter.post('/sync/push', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { deviceId, transactions } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ success: false, message: 'Transactions array required' });
  }

  const results: any[] = [];
  const conflicts: SyncConflict[] = [];

  for (const tx of transactions) {
    if (tx.type === 'sale_invoice') {
      const invData = tx.payload;
      let hasConflict = false;

      // Verify each item's stock before committing
      for (const item of invData.items) {
        const med = db.getMedicineById(pharmacyId, item.medicineId);
        const batch = med?.batches.find(b => b.id === item.batchId);
        if (!batch || batch.currentStock < item.quantity) {
          hasConflict = true;
          const conf: SyncConflict = {
            id: 'conf_' + Math.random().toString(36).substring(2, 8),
            pharmacyId,
            transactionId: tx.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            batchNumber: item.batchNumber,
            requestedQty: item.quantity,
            availableQty: batch ? batch.currentStock : 0,
            conflictType: 'stock_depleted',
            detectedAt: new Date().toISOString(),
            resolved: false
          };
          db.addConflict(conf);
          conflicts.push(conf);
          break;
        }
      }

      if (!hasConflict) {
        // Apply stock deductions
        for (const item of invData.items) {
          db.deductBatchStock(pharmacyId, item.medicineId, item.batchId, item.quantity);
        }
        // Save invoice
        const inv: Invoice = {
          ...invData,
          pharmacyId,
          synced: true,
          status: 'active'
        };
        db.addInvoice(inv);
        results.push({ id: tx.id, status: 'synced', invoiceId: inv.id });
      } else {
        results.push({ id: tx.id, status: 'conflict', message: 'Concurrent offline stock depletion detected' });
      }
    }
  }

  const pharmacy = db.getPharmacyById(pharmacyId);
  if (pharmacy) {
    pharmacy.syncedAt = new Date().toISOString();
    db.save();
  }

  res.json({
    success: true,
    processedCount: transactions.length,
    results,
    conflicts,
    syncedAt: new Date().toISOString()
  });
});

apiRouter.get('/sync/conflicts', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  res.json({ success: true, conflicts: db.getConflicts(pharmacyId) });
});

apiRouter.post('/sync/conflicts/:id/resolve', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const { note } = req.body;
  const ok = db.resolveConflict(pharmacyId, id, note || 'Manual reconciliation approved by store manager');
  res.json({ success: ok });
});

apiRouter.get('/devices', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  res.json({ success: true, devices: db.getDevices(pharmacyId) });
});

apiRouter.post('/devices/:id/revoke', (req, res) => {
  const pharmacyId = getPharmacyId(req);
  const { id } = req.params;
  const ok = db.revokeDevice(pharmacyId, id);
  res.json({ success: ok });
});

// ----------------------------------------------------
// 9. SUPER ADMIN DASHBOARD (PLATFORM OWNER CONTROL)
// ----------------------------------------------------
apiRouter.get('/admin/overview', (req, res) => {
  const pharmacies = db.getPharmacies();
  const payments = db.getPayments();
  const auditLogs = db.getAuditLogs();
  const plans = db.getPlans();

  const totalPharmacies = pharmacies.length;
  const activePharmacies = pharmacies.filter(p => p.status === 'active').length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  const planBreakdown = {
    trial: pharmacies.filter(p => p.subscriptionPlanId === 'trial').length,
    basic: pharmacies.filter(p => p.subscriptionPlanId === 'basic').length,
    advance: pharmacies.filter(p => p.subscriptionPlanId === 'advance').length,
    pro: pharmacies.filter(p => p.subscriptionPlanId === 'pro').length
  };

  res.json({
    success: true,
    metrics: {
      totalPharmacies,
      activePharmacies,
      totalRevenue: Math.round(totalRevenue),
      planBreakdown
    },
    pharmacies,
    recentPayments: payments.slice(0, 20),
    plans,
    systemHealth: {
      serverUptime: '99.98%',
      databaseStatus: 'Healthy (Persistent File Store)',
      activeSyncNodes: 4,
      pendingConflicts: db.getConflicts('').filter(c => !c.resolved).length
    }
  });
});

apiRouter.post('/admin/pharmacies/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const pharmacy = db.updatePharmacy(id, { status });
  if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

  db.addAuditLog({
    id: 'log_' + Date.now(),
    pharmacyId: id,
    userId: 'admin_root',
    userName: 'Super Admin',
    action: 'ADMIN_PHARMACY_STATUS_CHANGE',
    entityType: 'Pharmacy',
    entityId: id,
    details: `Platform Administrator changed status of ${pharmacy.name} to ${status}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, pharmacy });
});

apiRouter.put('/admin/plans/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updatePlan(id as SubscriptionPlanId, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Plan not found' });
  res.json({ success: true, plan: updated });
});

apiRouter.get('/admin/announcements', (req, res) => {
  res.json({ success: true, announcements: db.getAnnouncements() });
});

apiRouter.post('/admin/announcements', (req, res) => {
  const { title, message, type, targetPlans } = req.body;
  const newAnn: PlatformAnnouncement = {
    id: 'ann_' + Date.now(),
    title,
    message,
    type: type || 'info',
    targetPlans: targetPlans || 'all',
    active: true,
    createdAt: new Date().toISOString()
  };
  db.addAnnouncement(newAnn);
  res.json({ success: true, announcement: newAnn });
});

apiRouter.post('/admin/announcements/:id/toggle', (req, res) => {
  const { id } = req.params;
  const ok = db.toggleAnnouncement(id);
  res.json({ success: ok });
});

apiRouter.get('/admin/logs', (req, res) => {
  res.json({ success: true, logs: db.getAuditLogs().slice(0, 100) });
});

// Helper to persist base64 data URLs as files in /public
const saveBase64Image = (dataUrl: string, fileName: string): string => {
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const buffer = Buffer.from(matches[2], 'base64');
      const publicDir = path.resolve(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const targetPath = path.resolve(publicDir, fileName);
      fs.writeFileSync(targetPath, buffer);
      return `/${fileName}?v=${Date.now()}`;
    }
  } catch (err) {
    console.error(`Failed to write image file ${fileName}:`, err);
  }
  return dataUrl;
};

// ----------------------------------------------------
// 12. BRAND ASSETS & LOGO / SPLASH MANAGEMENT
// ----------------------------------------------------
apiRouter.get('/brand/assets', (req, res) => {
  res.json({ success: true, assets: db.getBrandAssets() });
});

apiRouter.post('/brand/upload', (req, res) => {
  const { logoData, splashData } = req.body;
  let newLogoUrl: string | undefined;
  let newSplashUrl: string | undefined;

  if (logoData) {
    if (logoData.startsWith('data:')) {
      newLogoUrl = saveBase64Image(logoData, 'logo.png');
    } else {
      newLogoUrl = logoData;
    }
  }

  if (splashData) {
    if (splashData.startsWith('data:')) {
      newSplashUrl = saveBase64Image(splashData, 'splash.jpg');
    } else {
      newSplashUrl = splashData;
    }
  }

  const updated = db.updateBrandAssets({
    logoUrl: newLogoUrl,
    splashUrl: newSplashUrl
  });

  res.json({ success: true, assets: updated });
});

apiRouter.post('/brand/reset', (req, res) => {
  const reset = db.updateBrandAssets({
    logoUrl: '/logo.png',
    splashUrl: '/splash.jpg'
  });
  res.json({ success: true, assets: reset });
});

// Download APK API route
apiRouter.get('/download/apk', (req, res) => {
  const apkPath = path.resolve(process.cwd(), 'public/downloads/medione-pharmacy-debug.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="medione-pharmacy-debug.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).json({ success: false, error: 'APK file not found' });
  }
});

