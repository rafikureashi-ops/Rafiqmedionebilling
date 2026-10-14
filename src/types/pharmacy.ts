export type SubscriptionPlanId = 'trial' | 'basic' | 'advance' | 'pro';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  price: number; // in INR
  durationDays: number;
  features: string[];
  maxDevices: number;
  maxEmployees: number;
  expiryAlertMode: 'basic' | 'advanced';
  isPopular?: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  dlNumber?: string; // Drug License Number (e.g. 20B/21B)
  fssaiNumber?: string;
  upiVpa?: string; // e.g. pharmacy@upi for QR code
  currency: string;
  status: 'active' | 'suspended' | 'trial_expired';
  createdAt: string;
  subscriptionPlanId: SubscriptionPlanId;
  subscriptionStartedAt: string;
  subscriptionExpiresAt: string; // ISO string calculated server-side
  isTrialUsed: boolean;
  activeDeviceId?: string;
  syncedAt?: string;
}

export interface UserSession {
  id: string;
  pharmacyId: string;
  name: string;
  email: string;
  role: 'owner' | 'pharmacist' | 'cashier' | 'accountant' | 'superadmin';
  token: string;
  deviceId: string;
  deviceName: string;
}

export interface DeviceInfo {
  id: string;
  pharmacyId: string;
  deviceName: string;
  platform: 'Android' | 'Windows' | 'Web' | 'Tablet';
  browser: string;
  registeredAt: string;
  lastActiveAt: string;
  isAuthorized: boolean;
  ipAddress?: string;
}

export type ScheduleCategory = 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'Narcotic';
export type DosageForm = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Powder' | 'Inhaler';

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM or YYYY-MM-DD
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  rackLocation?: string;
  supplierId?: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  pharmacyId: string;
  name: string; // Brand Name, e.g., Dolo 650
  genericName: string; // Generic Composition, e.g., Paracetamol 650mg
  manufacturer: string; // e.g., Micro Labs Ltd
  dosageForm: DosageForm;
  strength: string; // e.g., 650 mg
  packSize: string; // e.g., 15 Tablets
  unitsPerPack: number; // e.g. 15
  barcode?: string;
  hsnCode?: string; // e.g., 3004
  gstRate: number; // 0, 5, 12, 18
  scheduleCategory: ScheduleCategory;
  minimumStockLevel: number;
  rackLocation: string;
  batches: MedicineBatch[];
  totalStock: number; // calculated sum of batches
  earliestExpiry?: string;
  notes?: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  pharmacyId: string;
  name: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  gstin?: string;
  dlNumber?: string;
  paymentTerms: string;
  openingBalance: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  pharmacyId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  creditLimit: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface InvoiceItem {
  medicineId: string;
  batchId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  hsnCode: string;
  quantity: number; // in units/packs
  mrp: number;
  purchasePrice: number; // for gross profit calculation
  unitPrice: number; // selling price
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit' | 'split';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. MOB-2026-0001
  pharmacyId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  invoiceDate: string; // ISO string
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  roundingAdjustment: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  cashTendered?: number;
  changeReturned?: number;
  paymentStatus: 'paid' | 'pending' | 'partially_paid' | 'refunded';
  notes?: string;
  createdBy: string;
  createdByName: string;
  isOfflineCreated?: boolean;
  synced: boolean;
  status: 'active' | 'cancelled' | 'returned';
}

export interface SalesReturn {
  id: string;
  pharmacyId: string;
  returnNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerName: string;
  returnDate: string;
  items: {
    medicineId: string;
    batchId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    refundAmount: number;
    reason: string;
  }[];
  totalRefundAmount: number;
  refundMethod: 'cash' | 'credit_reversal' | 'upi';
  processedBy: string;
}

export interface PurchaseInvoiceItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  freeQuantity?: number;
  purchaseRate: number;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  gstRate: number;
  totalAmount: number;
}

export interface PurchaseInvoice {
  id: string;
  pharmacyId: string;
  supplierId: string;
  supplierName: string;
  supplierBillNumber: string;
  purchaseDate: string;
  items: PurchaseInvoiceItem[];
  subtotal: number;
  totalGst: number;
  totalDiscount: number;
  finalAmount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod: 'cash' | 'neft' | 'cheque' | 'upi' | 'credit';
  notes?: string;
  createdAt: string;
}

export interface PurchaseReturn {
  id: string;
  pharmacyId: string;
  supplierId: string;
  supplierName: string;
  returnNumber: string;
  returnDate: string;
  items: {
    medicineId: string;
    batchId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    purchaseRate: number;
    totalRefund: number;
    reason: 'expired' | 'damaged' | 'near_expiry' | 'overstock';
  }[];
  totalAmount: number;
  status: 'pending' | 'settled';
}

export type ExpenseCategory =
  | 'Rent'
  | 'Salaries'
  | 'Electricity'
  | 'Internet & Phone'
  | 'Transport & Delivery'
  | 'Packaging & Bags'
  | 'Maintenance & Repairs'
  | 'Software & Subscriptions'
  | 'Taxes & Licenses'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  pharmacyId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  description: string;
  receiptNumber?: string;
  recordedBy: string;
  createdAt: string;
}

export interface SubscriptionPayment {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  planId: SubscriptionPlanId;
  planName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentGateway: 'Razorpay' | 'UPI_QR' | 'Admin_Manual';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentSignature?: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  createdAt: string;
  expiresAt: string;
}

export interface SyncTransaction {
  id: string;
  pharmacyId: string;
  deviceId: string;
  type: 'sale_invoice' | 'stock_adjustment' | 'customer_payment' | 'purchase_entry';
  payload: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'conflict' | 'failed';
  errorMessage?: string;
}

export interface SyncConflict {
  id: string;
  pharmacyId: string;
  transactionId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  requestedQty: number;
  availableQty: number;
  conflictType: 'stock_depleted' | 'batch_expired' | 'duplicate_invoice';
  detectedAt: string;
  resolved: boolean;
  resolutionNote?: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'update';
  targetPlans: SubscriptionPlanId[] | 'all';
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  pharmacyId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
