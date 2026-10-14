import fs from 'fs';
import path from 'path';
import {
  Pharmacy,
  SubscriptionPlanConfig,
  Medicine,
  Supplier,
  Customer,
  Invoice,
  SalesReturn,
  PurchaseInvoice,
  PurchaseReturn,
  Expense,
  SubscriptionPayment,
  SyncTransaction,
  SyncConflict,
  PlatformAnnouncement,
  AuditLog,
  DeviceInfo
} from '../types/pharmacy.js';

interface DatabaseSchema {
  plans: SubscriptionPlanConfig[];
  pharmacies: Pharmacy[];
  medicines: Medicine[];
  suppliers: Supplier[];
  customers: Customer[];
  invoices: Invoice[];
  salesReturns: SalesReturn[];
  purchaseInvoices: PurchaseInvoice[];
  purchaseReturns: PurchaseReturn[];
  expenses: Expense[];
  payments: SubscriptionPayment[];
  syncTransactions: SyncTransaction[];
  syncConflicts: SyncConflict[];
  announcements: PlatformAnnouncement[];
  auditLogs: AuditLog[];
  devices: DeviceInfo[];
  platformSettings: {
    razorpayKeyId: string;
    razorpayKeySecretConfigured: boolean;
    trialEligibilityHours: number;
    allowOfflineBillingHours: number;
    maintenanceNotice?: string;
  };
  brandAssets?: {
    logoUrl?: string;
    splashUrl?: string;
    updatedAt?: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'medione_db.json');

const DEFAULT_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'trial',
    name: 'One-Day Trial',
    tagline: 'Explore full pharmacy features for 24 hours',
    price: 1,
    durationDays: 1,
    maxDevices: 2,
    maxEmployees: 2,
    expiryAlertMode: 'basic',
    features: [
      '24-Hour Full Access',
      'GST Billing Counter',
      'Inventory & Batches',
      'Basic Expiry Alerts',
      'Thermal & A4 Printing',
      'Offline Billing Mode',
      '₹1 Payment Gateway Verification'
    ]
  },
  {
    id: 'basic',
    name: 'Basic Annual',
    tagline: 'Essential billing & stock for single-counter stores',
    price: 1199,
    durationDays: 365,
    maxDevices: 1,
    maxEmployees: 1,
    expiryAlertMode: 'basic',
    features: [
      'Single Counter / Device',
      'Fast GST Billing & POS',
      'Medicine & Stock Tracking',
      'Customer & Supplier Records',
      'Purchase Entries',
      'Thermal 80mm/58mm & A4 Invoices',
      'Basic 30-Day Near-Expiry Alerts',
      'Daily Sales Reports',
      'Offline Billing Support'
    ]
  },
  {
    id: 'advance',
    name: 'Advance Annual',
    tagline: 'Comprehensive batch tracking, alerts & gross profit',
    price: 1799,
    durationDays: 365,
    maxDevices: 3,
    maxEmployees: 3,
    expiryAlertMode: 'advanced',
    isPopular: true,
    features: [
      'Up to 3 Devices / Counters',
      'All Basic Plan Features',
      'Full Batch-Wise Expiry (180/90/30 Days)',
      'FEFO Smart Batch Recommendations',
      'Barcode Scanning & Generation',
      'Customer Credit (Udhar) Ledger',
      'Supplier Outstanding & Payments',
      'Gross Profit & COGS Reports',
      'Expense Management & Net Profit',
      'Sales & Purchase Returns'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Enterprise',
    tagline: 'Multi-device sync, audit logs & team access control',
    price: 2399,
    durationDays: 365,
    maxDevices: 5,
    maxEmployees: 10,
    expiryAlertMode: 'advanced',
    features: [
      'Up to 5 Devices Simultaneous Sync',
      'All Advance Plan Features',
      'Multi-Device Auto Synchronization',
      'Multi-Employee Roles (Pharmacist/Cashier/Accountant)',
      'Detailed Financial P&L Audits',
      'Stock Conflict Detection & Resolution',
      'Complete Activity Audit Logs',
      'Automated Data Backup & Export',
      'Dedicated Priority WhatsApp Support'
    ]
  }
];

function generateSeedData(): DatabaseSchema {
  const pharmacyId = 'pharm_sanjivani_01';
  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const initialPharmacy: Pharmacy = {
    id: pharmacyId,
    name: 'Sanjivani Medical & General Store',
    ownerName: 'Rajesh Sharma',
    mobile: '9820198201',
    email: 'rajesh@sanjivanimedical.in',
    address: 'Shop No. 4, Gokul Arcade, Station Road, Vile Parle East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400057',
    gstin: '27AABCS1429B1Z8',
    dlNumber: 'MH-TZ5-283910 / 283911',
    fssaiNumber: '11518018000421',
    upiVpa: 'sanjivani@okhdfcbank',
    currency: 'INR',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionPlanId: 'pro',
    subscriptionStartedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: oneYearFromNow.toISOString(),
    isTrialUsed: true,
    activeDeviceId: 'dev_primary_01',
    syncedAt: new Date().toISOString()
  };

  const initialSuppliers: Supplier[] = [
    {
      id: 'sup_01',
      pharmacyId,
      name: 'Sun Pharma Logistics Mumbai',
      companyName: 'Sun Pharmaceutical Industries Ltd',
      contactPerson: 'Anil Deshmukh',
      phone: '9821034455',
      email: 'mumbai.dist@sunpharma.com',
      address: 'Plot 12, MIDC Industrial Area, Andheri East, Mumbai',
      gstin: '27AABCS9912C1ZZ',
      dlNumber: 'MH-WZ-102934',
      paymentTerms: '30 Days Net',
      openingBalance: 0,
      outstandingBalance: 12450,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sup_02',
      pharmacyId,
      name: 'Cipla Genuine Agency',
      companyName: 'Cipla Healthcare Distributors',
      contactPerson: 'Suresh Varma',
      phone: '9833411223',
      email: 'orders@ciplaagency.in',
      address: 'Gala 8, Pharma Plaza, Kurla West, Mumbai',
      gstin: '27AACCC4412K1Z9',
      dlNumber: 'MH-KZ-882910',
      paymentTerms: '15 Days Net',
      openingBalance: 0,
      outstandingBalance: 8200,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sup_03',
      pharmacyId,
      name: 'Micro Labs Regional Depot',
      companyName: 'Micro Labs Limited Distributors',
      contactPerson: 'Manish Joshi',
      phone: '9819200334',
      email: 'depot.west@microlabs.in',
      address: 'Bhiwandi Pharma Warehousing Zone, Thane',
      gstin: '27AABCM7721A1ZX',
      dlNumber: 'MH-TH-445566',
      paymentTerms: 'Immediate / 7 Days',
      openingBalance: 0,
      outstandingBalance: 0,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const initialCustomers: Customer[] = [
    {
      id: 'cust_01',
      pharmacyId,
      name: 'Ramesh Patel',
      phone: '9867012345',
      address: 'Flat 302, Sagar View Apt, Vile Parle East',
      doctorName: 'Dr. V. K. Gupta (MD Card)',
      creditLimit: 5000,
      outstandingBalance: 1850,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cust_02',
      pharmacyId,
      name: 'Sunita Mehra',
      phone: '9820554433',
      address: 'B-14, Shanti Nagar, Nehru Road',
      doctorName: 'Dr. Anita Desai (Pediatrician)',
      creditLimit: 3000,
      outstandingBalance: 0,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cust_03',
      pharmacyId,
      name: 'Dr. V.K. Gupta Clinic (Bulk)',
      phone: '9819001122',
      address: 'Gupta Heart & Diabetic Care, M.G. Road',
      creditLimit: 25000,
      outstandingBalance: 6400,
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const d1 = new Date();
  const expFuture1 = new Date(d1.getFullYear() + 2, d1.getMonth() + 4, 1).toISOString().slice(0, 7);
  const expFuture2 = new Date(d1.getFullYear() + 1, d1.getMonth() + 8, 1).toISOString().slice(0, 7);
  // Near expiry: 45 days from now
  const expNear = new Date(d1.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
  // Warning expiry: 110 days from now
  const expWarning = new Date(d1.getTime() + 110 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
  // Expired: 2 months ago (for quarantine and testing)
  const expExpired = new Date(d1.getFullYear(), d1.getMonth() - 2, 1).toISOString().slice(0, 7);

  const initialMedicines: Medicine[] = [
    {
      id: 'med_01',
      pharmacyId,
      name: 'Dolo 650 Tablet',
      genericName: 'Paracetamol IP 650mg',
      manufacturer: 'Micro Labs Ltd',
      dosageForm: 'Tablet',
      strength: '650 mg',
      packSize: '15 Tablets Strip',
      unitsPerPack: 15,
      barcode: '8901148201923',
      hsnCode: '30049060',
      gstRate: 12,
      scheduleCategory: 'OTC',
      minimumStockLevel: 30,
      rackLocation: 'Rack A-01',
      batches: [
        {
          id: 'bat_dolo_01',
          medicineId: 'med_01',
          batchNumber: 'DL-24B01',
          expiryDate: expFuture1,
          mrp: 34.00,
          purchasePrice: 24.50,
          sellingPrice: 32.00,
          currentStock: 120,
          rackLocation: 'Rack A-01',
          supplierId: 'sup_03',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'bat_dolo_02',
          medicineId: 'med_01',
          batchNumber: 'DL-23J98',
          expiryDate: expNear, // 45 days left
          mrp: 32.00,
          purchasePrice: 23.00,
          sellingPrice: 30.00,
          currentStock: 18,
          rackLocation: 'Rack A-01',
          supplierId: 'sup_03',
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 138,
      earliestExpiry: expNear,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'med_02',
      pharmacyId,
      name: 'Augmentin 625 Duo',
      genericName: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      dosageForm: 'Tablet',
      strength: '625 mg',
      packSize: '10 Tablets Strip',
      unitsPerPack: 10,
      barcode: '8901032334412',
      hsnCode: '30041010',
      gstRate: 12,
      scheduleCategory: 'Schedule H1',
      minimumStockLevel: 20,
      rackLocation: 'Rack B-04 (H1 Locked)',
      batches: [
        {
          id: 'bat_aug_01',
          medicineId: 'med_02',
          batchNumber: 'AG-6258',
          expiryDate: expFuture2,
          mrp: 204.50,
          purchasePrice: 155.00,
          sellingPrice: 195.00,
          currentStock: 45,
          rackLocation: 'Rack B-04',
          supplierId: 'sup_02',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 45,
      earliestExpiry: expFuture2,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'med_03',
      pharmacyId,
      name: 'Pan 40 Tablet',
      genericName: 'Pantoprazole Gastro-resistant IP 40mg',
      manufacturer: 'Alkem Laboratories Ltd',
      dosageForm: 'Tablet',
      strength: '40 mg',
      packSize: '15 Tablets Strip',
      unitsPerPack: 15,
      barcode: '8901238910021',
      hsnCode: '30049099',
      gstRate: 12,
      scheduleCategory: 'Schedule H',
      minimumStockLevel: 25,
      rackLocation: 'Rack A-05',
      batches: [
        {
          id: 'bat_pan_01',
          medicineId: 'med_03',
          batchNumber: 'PN-4401',
          expiryDate: expFuture1,
          mrp: 155.00,
          purchasePrice: 110.00,
          sellingPrice: 145.00,
          currentStock: 80,
          rackLocation: 'Rack A-05',
          supplierId: 'sup_01',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 80,
      earliestExpiry: expFuture1,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'med_04',
      pharmacyId,
      name: 'Azee 500 Tablet',
      genericName: 'Azithromycin IP 500mg',
      manufacturer: 'Cipla Ltd',
      dosageForm: 'Tablet',
      strength: '500 mg',
      packSize: '5 Tablets Strip',
      unitsPerPack: 5,
      barcode: '8901117182901',
      hsnCode: '30042010',
      gstRate: 12,
      scheduleCategory: 'Schedule H',
      minimumStockLevel: 20,
      rackLocation: 'Rack B-01',
      batches: [
        {
          id: 'bat_azee_01',
          medicineId: 'med_04',
          batchNumber: 'AZ-9901',
          expiryDate: expWarning, // 110 days left
          mrp: 132.00,
          purchasePrice: 94.00,
          sellingPrice: 125.00,
          currentStock: 22,
          rackLocation: 'Rack B-01',
          supplierId: 'sup_02',
          createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 22,
      earliestExpiry: expWarning,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'med_05',
      pharmacyId,
      name: 'Telma 40 Tablet',
      genericName: 'Telmisartan IP 40mg',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      dosageForm: 'Tablet',
      strength: '40 mg',
      packSize: '30 Tablets Strip',
      unitsPerPack: 30,
      barcode: '8901332009182',
      hsnCode: '30049079',
      gstRate: 12,
      scheduleCategory: 'Schedule H',
      minimumStockLevel: 30,
      rackLocation: 'Rack C-02',
      batches: [
        {
          id: 'bat_telma_01',
          medicineId: 'med_05',
          batchNumber: 'TL-8819',
          expiryDate: expFuture2,
          mrp: 248.00,
          purchasePrice: 180.00,
          sellingPrice: 235.00,
          currentStock: 6, // LOW STOCK TRIGGER!
          rackLocation: 'Rack C-02',
          supplierId: 'sup_01',
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 6,
      earliestExpiry: expFuture2,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'med_06',
      pharmacyId,
      name: 'Benadryl Cough Syrup (100ml)',
      genericName: 'Diphenhydramine HCl + Ammonium Chloride',
      manufacturer: 'Johnson & Johnson Pvt Ltd',
      dosageForm: 'Syrup',
      strength: '100 ml Bottle',
      packSize: '1 Bottle',
      unitsPerPack: 1,
      barcode: '8901012390192',
      hsnCode: '30049099',
      gstRate: 18,
      scheduleCategory: 'OTC',
      minimumStockLevel: 15,
      rackLocation: 'Syrup Section S-01',
      batches: [
        {
          id: 'bat_ben_01',
          medicineId: 'med_06',
          batchNumber: 'BN-3392',
          expiryDate: expFuture1,
          mrp: 142.00,
          purchasePrice: 105.00,
          sellingPrice: 135.00,
          currentStock: 35,
          rackLocation: 'Syrup Section S-01',
          supplierId: 'sup_01',
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 35,
      earliestExpiry: expFuture1,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'med_07',
      pharmacyId,
      name: 'Limcee 500 Chewable',
      genericName: 'Ascorbic Acid (Vitamin C 500mg)',
      manufacturer: 'Abbott Healthcare Pvt Ltd',
      dosageForm: 'Tablet',
      strength: '500 mg',
      packSize: '15 Tablets Strip',
      unitsPerPack: 15,
      barcode: '8901043321901',
      hsnCode: '30045010',
      gstRate: 12,
      scheduleCategory: 'OTC',
      minimumStockLevel: 40,
      rackLocation: 'Counter Front',
      batches: [
        {
          id: 'bat_lim_01',
          medicineId: 'med_07',
          batchNumber: 'LM-2490',
          expiryDate: expFuture1,
          mrp: 26.50,
          purchasePrice: 18.00,
          sellingPrice: 25.00,
          currentStock: 95,
          rackLocation: 'Counter Front',
          supplierId: 'sup_03',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'bat_lim_expired',
          medicineId: 'med_07',
          batchNumber: 'LM-OLD22',
          expiryDate: expExpired, // EXPIRED (quarantine test)
          mrp: 24.00,
          purchasePrice: 17.00,
          sellingPrice: 23.00,
          currentStock: 12,
          rackLocation: 'Quarantine Box',
          supplierId: 'sup_03',
          createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      totalStock: 107,
      earliestExpiry: expExpired,
      updatedAt: new Date().toISOString()
    }
  ];

  const initialExpenses: Expense[] = [
    {
      id: 'exp_01',
      pharmacyId,
      category: 'Rent',
      amount: 35000,
      date: new Date(d1.getFullYear(), d1.getMonth(), 1).toISOString().slice(0, 10),
      paymentMethod: 'bank_transfer',
      description: 'Monthly store shop rent for Gokul Arcade premises',
      recordedBy: 'Rajesh Sharma',
      createdAt: new Date(d1.getFullYear(), d1.getMonth(), 1).toISOString()
    },
    {
      id: 'exp_02',
      pharmacyId,
      category: 'Salaries',
      amount: 42000,
      date: new Date(d1.getFullYear(), d1.getMonth(), 5).toISOString().slice(0, 10),
      paymentMethod: 'bank_transfer',
      description: 'Pharmacist (Amit Trivedi) & Cashier staff salary',
      recordedBy: 'Rajesh Sharma',
      createdAt: new Date(d1.getFullYear(), d1.getMonth(), 5).toISOString()
    },
    {
      id: 'exp_03',
      pharmacyId,
      category: 'Electricity',
      amount: 6850,
      date: new Date(d1.getFullYear(), d1.getMonth(), 8).toISOString().slice(0, 10),
      paymentMethod: 'upi',
      description: 'Adani Electricity commercial bill for refrigerator & AC',
      recordedBy: 'Rajesh Sharma',
      createdAt: new Date(d1.getFullYear(), d1.getMonth(), 8).toISOString()
    },
    {
      id: 'exp_04',
      pharmacyId,
      category: 'Packaging & Bags',
      amount: 1450,
      date: new Date(d1.getFullYear(), d1.getMonth(), 10).toISOString().slice(0, 10),
      paymentMethod: 'cash',
      description: 'Biodegradable printed pharmacy carry pouches',
      recordedBy: 'Rajesh Sharma',
      createdAt: new Date(d1.getFullYear(), d1.getMonth(), 10).toISOString()
    }
  ];

  const initialInvoices: Invoice[] = [
    {
      id: 'inv_001',
      invoiceNumber: 'MOB-2026-0001',
      pharmacyId,
      customerId: 'cust_01',
      customerName: 'Ramesh Patel',
      customerPhone: '9867012345',
      doctorName: 'Dr. V. K. Gupta',
      invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          medicineId: 'med_01',
          batchId: 'bat_dolo_01',
          medicineName: 'Dolo 650 Tablet',
          genericName: 'Paracetamol IP 650mg',
          batchNumber: 'DL-24B01',
          expiryDate: expFuture1,
          hsnCode: '30049060',
          quantity: 2,
          mrp: 34.00,
          purchasePrice: 24.50,
          unitPrice: 32.00,
          discountPercent: 5,
          discountAmount: 3.20,
          gstRate: 12,
          gstAmount: 6.51,
          total: 67.31
        },
        {
          medicineId: 'med_03',
          batchId: 'bat_pan_01',
          medicineName: 'Pan 40 Tablet',
          genericName: 'Pantoprazole Gastro-resistant IP 40mg',
          batchNumber: 'PN-4401',
          expiryDate: expFuture1,
          hsnCode: '30049099',
          quantity: 1,
          mrp: 155.00,
          purchasePrice: 110.00,
          unitPrice: 145.00,
          discountPercent: 5,
          discountAmount: 7.25,
          gstRate: 12,
          gstAmount: 14.76,
          total: 152.51
        }
      ],
      subtotal: 209.00,
      totalDiscount: 10.45,
      taxableAmount: 198.55,
      cgst: 11.91,
      sgst: 11.91,
      igst: 0,
      totalGst: 23.82,
      roundingAdjustment: -0.37,
      finalAmount: 222.00,
      paymentMethod: 'upi',
      amountPaid: 222.00,
      paymentStatus: 'paid',
      createdBy: 'user_01',
      createdByName: 'Rajesh Sharma',
      synced: true,
      status: 'active'
    },
    {
      id: 'inv_002',
      invoiceNumber: 'MOB-2026-0002',
      pharmacyId,
      customerName: 'Walk-in Cash Customer',
      invoiceDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          medicineId: 'med_02',
          batchId: 'bat_aug_01',
          medicineName: 'Augmentin 625 Duo',
          genericName: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
          batchNumber: 'AG-6258',
          expiryDate: expFuture2,
          hsnCode: '30041010',
          quantity: 1,
          mrp: 204.50,
          purchasePrice: 155.00,
          unitPrice: 195.00,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: 12,
          gstAmount: 20.89,
          total: 215.89
        }
      ],
      subtotal: 195.00,
      totalDiscount: 0,
      taxableAmount: 195.00,
      cgst: 10.45,
      sgst: 10.45,
      igst: 0,
      totalGst: 20.90,
      roundingAdjustment: 0.10,
      finalAmount: 216.00,
      paymentMethod: 'cash',
      amountPaid: 216.00,
      cashTendered: 500,
      changeReturned: 284,
      paymentStatus: 'paid',
      createdBy: 'user_01',
      createdByName: 'Rajesh Sharma',
      synced: true,
      status: 'active'
    }
  ];

  const initialAnnouncements: PlatformAnnouncement[] = [
    {
      id: 'ann_01',
      title: 'GST E-Invoice & Schedule H1 Register Advisory',
      message: 'Government guidelines recommend keeping Schedule H1 and Narcotic audit registers up to date. MediOneBilling automatically tags schedule categories on print receipts.',
      type: 'info',
      targetPlans: 'all',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann_02',
      title: '₹1 Trial & Multi-Device Sync Active',
      message: 'New medical stores can activate the 24-hour full feature trial for ₹1. Instant server verification enabled.',
      type: 'update',
      targetPlans: 'all',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  const initialPayments: SubscriptionPayment[] = [
    {
      id: 'pay_init_01',
      pharmacyId,
      pharmacyName: 'Sanjivani Medical & General Store',
      planId: 'pro',
      planName: 'Pro Enterprise',
      amount: 2399,
      taxAmount: 431.82,
      totalAmount: 2830.82,
      currency: 'INR',
      paymentGateway: 'Razorpay',
      gatewayPaymentId: 'pay_RzpSim_998129',
      gatewayOrderId: 'order_mob_init_998',
      status: 'success',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: oneYearFromNow.toISOString()
    }
  ];

  const initialAuditLogs: AuditLog[] = [
    {
      id: 'log_01',
      pharmacyId,
      userId: 'user_01',
      userName: 'Rajesh Sharma',
      action: 'SYSTEM_BOOT',
      entityType: 'Pharmacy',
      entityId: pharmacyId,
      details: 'Pharmacy account initial setup and database bootstrap completed.',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'log_02',
      pharmacyId,
      userId: 'user_01',
      userName: 'Rajesh Sharma',
      action: 'SUBSCRIPTION_UPGRADE',
      entityType: 'Subscription',
      entityId: 'pay_init_01',
      details: 'Activated Pro Enterprise annual subscription with 5 device capacity.',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const initialDevices: DeviceInfo[] = [
    {
      id: 'dev_primary_01',
      pharmacyId,
      deviceName: 'Billing Counter PC 1 (Windows Desktop)',
      platform: 'Windows',
      browser: 'Chrome 128 / Desktop',
      registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date().toISOString(),
      isAuthorized: true,
      ipAddress: '192.168.1.101'
    },
    {
      id: 'dev_mobile_02',
      pharmacyId,
      deviceName: 'Pharmacist Mobile (Samsung Galaxy Tab)',
      platform: 'Android',
      browser: 'Android Webview PWA',
      registeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isAuthorized: true,
      ipAddress: '192.168.1.105'
    }
  ];

  return {
    plans: DEFAULT_PLANS,
    pharmacies: [initialPharmacy],
    medicines: initialMedicines,
    suppliers: initialSuppliers,
    customers: initialCustomers,
    invoices: initialInvoices,
    salesReturns: [],
    purchaseInvoices: [],
    purchaseReturns: [],
    expenses: initialExpenses,
    payments: initialPayments,
    syncTransactions: [],
    syncConflicts: [],
    announcements: initialAnnouncements,
    auditLogs: initialAuditLogs,
    devices: initialDevices,
    platformSettings: {
      razorpayKeyId: 'rzp_test_medione2026',
      razorpayKeySecretConfigured: true,
      trialEligibilityHours: 24,
      allowOfflineBillingHours: 72,
      maintenanceNotice: ''
    }
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.pharmacies && parsed.medicines) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading database file, generating fresh seed data:', err);
    }

    const seed = generateSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public save() {
    this.persist();
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // --- Pharmacies ---
  public getPharmacies(): Pharmacy[] {
    return this.data.pharmacies;
  }

  public getPharmacyById(id: string): Pharmacy | undefined {
    return this.data.pharmacies.find(p => p.id === id);
  }

  public addPharmacy(pharmacy: Pharmacy): Pharmacy {
    this.data.pharmacies.push(pharmacy);
    this.save();
    return pharmacy;
  }

  public updatePharmacy(id: string, updates: Partial<Pharmacy>): Pharmacy | undefined {
    const idx = this.data.pharmacies.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.pharmacies[idx] = { ...this.data.pharmacies[idx], ...updates };
      this.save();
      return this.data.pharmacies[idx];
    }
    return undefined;
  }

  // --- Plans ---
  public getPlans(): SubscriptionPlanConfig[] {
    return this.data.plans;
  }

  public updatePlan(id: string, updates: Partial<SubscriptionPlanConfig>): SubscriptionPlanConfig | undefined {
    const idx = this.data.plans.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.plans[idx] = { ...this.data.plans[idx], ...updates };
      this.save();
      return this.data.plans[idx];
    }
    return undefined;
  }

  // --- Medicines & Batches ---
  public getMedicines(pharmacyId: string): Medicine[] {
    return this.data.medicines.filter(m => m.pharmacyId === pharmacyId);
  }

  public getMedicineById(pharmacyId: string, id: string): Medicine | undefined {
    return this.data.medicines.find(m => m.pharmacyId === pharmacyId && m.id === id);
  }

  public addMedicine(medicine: Medicine): Medicine {
    this.data.medicines.push(medicine);
    this.save();
    return medicine;
  }

  public updateMedicine(pharmacyId: string, id: string, updates: Partial<Medicine>): Medicine | undefined {
    const idx = this.data.medicines.findIndex(m => m.pharmacyId === pharmacyId && m.id === id);
    if (idx !== -1) {
      this.data.medicines[idx] = { ...this.data.medicines[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.medicines[idx];
    }
    return undefined;
  }

  public deleteMedicine(pharmacyId: string, id: string): boolean {
    const prevLen = this.data.medicines.length;
    this.data.medicines = this.data.medicines.filter(m => !(m.pharmacyId === pharmacyId && m.id === id));
    if (this.data.medicines.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Deduct stock from specific batch
  public deductBatchStock(pharmacyId: string, medicineId: string, batchId: string, qty: number): { success: boolean; remaining: number; conflict?: boolean } {
    const med = this.data.medicines.find(m => m.pharmacyId === pharmacyId && m.id === medicineId);
    if (!med) return { success: false, remaining: 0 };
    const batch = med.batches.find(b => b.id === batchId);
    if (!batch) return { success: false, remaining: 0 };

    if (batch.currentStock < qty) {
      // Stock conflict!
      return { success: false, remaining: batch.currentStock, conflict: true };
    }

    batch.currentStock -= qty;
    med.totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
    med.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, remaining: batch.currentStock };
  }

  // Restore stock on return or cancellation
  public restoreBatchStock(pharmacyId: string, medicineId: string, batchId: string, qty: number): boolean {
    const med = this.data.medicines.find(m => m.pharmacyId === pharmacyId && m.id === medicineId);
    if (!med) return false;
    const batch = med.batches.find(b => b.id === batchId);
    if (!batch) return false;

    batch.currentStock += qty;
    med.totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
    med.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // --- Invoices ---
  public getInvoices(pharmacyId: string): Invoice[] {
    return this.data.invoices.filter(i => i.pharmacyId === pharmacyId);
  }

  public getInvoiceById(pharmacyId: string, id: string): Invoice | undefined {
    return this.data.invoices.find(i => i.pharmacyId === pharmacyId && i.id === id);
  }

  public addInvoice(invoice: Invoice): Invoice {
    this.data.invoices.unshift(invoice);
    this.save();
    return invoice;
  }

  public cancelInvoice(pharmacyId: string, invoiceId: string, reason: string): Invoice | undefined {
    const inv = this.data.invoices.find(i => i.pharmacyId === pharmacyId && i.id === invoiceId);
    if (!inv || inv.status === 'cancelled') return undefined;

    inv.status = 'cancelled';
    inv.notes = (inv.notes ? inv.notes + ' | ' : '') + `Cancelled: ${reason}`;

    // Restore batch stocks
    for (const item of inv.items) {
      this.restoreBatchStock(pharmacyId, item.medicineId, item.batchId, item.quantity);
    }

    this.save();
    return inv;
  }

  // --- Customers & Suppliers ---
  public getCustomers(pharmacyId: string): Customer[] {
    return this.data.customers.filter(c => c.pharmacyId === pharmacyId);
  }

  public addCustomer(customer: Customer): Customer {
    this.data.customers.push(customer);
    this.save();
    return customer;
  }

  public updateCustomer(pharmacyId: string, id: string, updates: Partial<Customer>): Customer | undefined {
    const idx = this.data.customers.findIndex(c => c.pharmacyId === pharmacyId && c.id === id);
    if (idx !== -1) {
      this.data.customers[idx] = { ...this.data.customers[idx], ...updates };
      this.save();
      return this.data.customers[idx];
    }
    return undefined;
  }

  public getSuppliers(pharmacyId: string): Supplier[] {
    return this.data.suppliers.filter(s => s.pharmacyId === pharmacyId);
  }

  public addSupplier(supplier: Supplier): Supplier {
    this.data.suppliers.push(supplier);
    this.save();
    return supplier;
  }

  public updateSupplier(pharmacyId: string, id: string, updates: Partial<Supplier>): Supplier | undefined {
    const idx = this.data.suppliers.findIndex(s => s.pharmacyId === pharmacyId && s.id === id);
    if (idx !== -1) {
      this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates };
      this.save();
      return this.data.suppliers[idx];
    }
    return undefined;
  }

  // --- Expenses ---
  public getExpenses(pharmacyId: string): Expense[] {
    return this.data.expenses.filter(e => e.pharmacyId === pharmacyId);
  }

  public addExpense(expense: Expense): Expense {
    this.data.expenses.unshift(expense);
    this.save();
    return expense;
  }

  // --- Purchases ---
  public getPurchases(pharmacyId: string): PurchaseInvoice[] {
    return this.data.purchaseInvoices.filter(p => p.pharmacyId === pharmacyId);
  }

  public addPurchase(purchase: PurchaseInvoice): PurchaseInvoice {
    this.data.purchaseInvoices.unshift(purchase);

    // Auto-update or create batches for purchased medicines
    for (const item of purchase.items) {
      const med = this.data.medicines.find(m => m.pharmacyId === purchase.pharmacyId && m.id === item.medicineId);
      if (med) {
        let existingBatch = med.batches.find(b => b.batchNumber.toLowerCase() === item.batchNumber.toLowerCase());
        const totalQty = item.quantity + (item.freeQuantity || 0);
        if (existingBatch) {
          existingBatch.currentStock += totalQty;
          existingBatch.mrp = item.mrp;
          existingBatch.purchasePrice = item.purchaseRate;
          existingBatch.sellingPrice = item.sellingPrice;
          existingBatch.expiryDate = item.expiryDate;
        } else {
          med.batches.push({
            id: 'bat_' + Math.random().toString(36).substring(2, 9),
            medicineId: med.id,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            mrp: item.mrp,
            purchasePrice: item.purchaseRate,
            sellingPrice: item.sellingPrice,
            currentStock: totalQty,
            supplierId: purchase.supplierId,
            createdAt: new Date().toISOString()
          });
        }
        med.totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
        med.updatedAt = new Date().toISOString();
      }
    }

    // Update supplier outstanding balance if not fully paid
    const unpaid = purchase.finalAmount - (purchase.amountPaid || 0);
    if (unpaid > 0) {
      const supplier = this.data.suppliers.find(s => s.pharmacyId === purchase.pharmacyId && s.id === purchase.supplierId);
      if (supplier) {
        supplier.outstandingBalance += unpaid;
      }
    }

    this.save();
    return purchase;
  }

  // --- Subscription Payments ---
  public getPayments(pharmacyId?: string): SubscriptionPayment[] {
    if (pharmacyId) {
      return this.data.payments.filter(p => p.pharmacyId === pharmacyId);
    }
    return this.data.payments;
  }

  public addPayment(payment: SubscriptionPayment): SubscriptionPayment {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  // --- Devices ---
  public getDevices(pharmacyId: string): DeviceInfo[] {
    return this.data.devices.filter(d => d.pharmacyId === pharmacyId);
  }

  public registerDevice(device: DeviceInfo): DeviceInfo {
    const existing = this.data.devices.find(d => d.pharmacyId === device.pharmacyId && d.id === device.id);
    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      this.save();
      return existing;
    }
    this.data.devices.push(device);
    this.save();
    return device;
  }

  public revokeDevice(pharmacyId: string, deviceId: string): boolean {
    const dev = this.data.devices.find(d => d.pharmacyId === pharmacyId && d.id === deviceId);
    if (dev) {
      dev.isAuthorized = false;
      this.save();
      return true;
    }
    return false;
  }

  // --- Sync Conflicts ---
  public getConflicts(pharmacyId: string): SyncConflict[] {
    return this.data.syncConflicts.filter(c => c.pharmacyId === pharmacyId);
  }

  public addConflict(conflict: SyncConflict): SyncConflict {
    this.data.syncConflicts.unshift(conflict);
    this.save();
    return conflict;
  }

  public resolveConflict(pharmacyId: string, conflictId: string, note: string): boolean {
    const conf = this.data.syncConflicts.find(c => c.pharmacyId === pharmacyId && c.id === conflictId);
    if (conf) {
      conf.resolved = true;
      conf.resolutionNote = note;
      this.save();
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  public getAuditLogs(pharmacyId?: string): AuditLog[] {
    if (pharmacyId) {
      return this.data.auditLogs.filter(a => a.pharmacyId === pharmacyId);
    }
    return this.data.auditLogs;
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  // --- Platform Announcements ---
  public getAnnouncements(): PlatformAnnouncement[] {
    return this.data.announcements;
  }

  public addAnnouncement(ann: PlatformAnnouncement): PlatformAnnouncement {
    this.data.announcements.unshift(ann);
    this.save();
    return ann;
  }

  public toggleAnnouncement(id: string): boolean {
    const a = this.data.announcements.find(item => item.id === id);
    if (a) {
      a.active = !a.active;
      this.save();
      return true;
    }
    return false;
  }

  // --- Brand Assets (Logo & Splash Screen) ---
  public getBrandAssets(): { logoUrl: string; splashUrl: string; updatedAt?: string } {
    if (!this.data.brandAssets) {
      this.data.brandAssets = {
        logoUrl: '/logo.png',
        splashUrl: '/splash.jpg'
      };
    }
    return {
      logoUrl: this.data.brandAssets.logoUrl || '/logo.png',
      splashUrl: this.data.brandAssets.splashUrl || '/splash.jpg',
      updatedAt: this.data.brandAssets.updatedAt
    };
  }

  public updateBrandAssets(assets: { logoUrl?: string; splashUrl?: string }) {
    if (!this.data.brandAssets) {
      this.data.brandAssets = {
        logoUrl: '/logo.png',
        splashUrl: '/splash.jpg'
      };
    }
    if (assets.logoUrl) {
      this.data.brandAssets.logoUrl = assets.logoUrl;
    }
    if (assets.splashUrl) {
      this.data.brandAssets.splashUrl = assets.splashUrl;
    }
    this.data.brandAssets.updatedAt = new Date().toISOString();
    this.save();
    return this.getBrandAssets();
  }
}

export const db = new DatabaseManager();
