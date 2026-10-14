import React, { useState } from 'react';
import { Invoice, Pharmacy } from '../../types/pharmacy.js';
import { generateInvoicePDF } from '../../lib/pdfGenerator.js';
import { Printer, Download, X, QrCode } from 'lucide-react';

interface PrintModalProps {
  invoice: Invoice;
  pharmacy: Pharmacy;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ invoice, pharmacy, onClose }) => {
  const [template, setTemplate] = useState<'80mm' | '58mm' | 'a4'>('80mm');

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, pharmacy);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Invoice #{invoice.invoiceNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Select printer template or export official Tax Invoice PDF
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setTemplate('80mm')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  template === '80mm'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Thermal 80mm (3")
              </button>
              <button
                onClick={() => setTemplate('58mm')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  template === '58mm'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Thermal 58mm (2")
              </button>
              <button
                onClick={() => setTemplate('a4')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  template === 'a4'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Standard A4
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Preview Container */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-100 dark:bg-slate-950/70 flex justify-center">
          {/* 80mm Thermal Receipt */}
          {template === '80mm' && (
            <div className="w-[80mm] min-h-[140mm] bg-white text-black p-4 font-mono text-xs shadow-md border border-slate-300 print:shadow-none print:border-none print:w-full">
              <div className="text-center border-b border-dashed border-black pb-2 mb-2 flex flex-col items-center">
                <img
                  src="/logo.png"
                  alt="MOB Logo"
                  className="w-12 h-12 object-contain mb-1 rounded-full border border-gray-300"
                />
                <p className="font-bold text-sm tracking-tight">{pharmacy.name}</p>
                <p className="text-[10px] leading-tight mt-0.5">{pharmacy.address}</p>
                <p className="text-[10px] leading-tight">{pharmacy.city}, {pharmacy.state} - {pharmacy.pincode}</p>
                <p className="text-[10px] font-bold mt-1">Ph: {pharmacy.mobile}</p>
                <p className="text-[10px]">DL: {pharmacy.dlNumber || 'N/A'}</p>
                <p className="text-[10px]">GSTIN: {pharmacy.gstin || 'Unregistered'}</p>
              </div>

              <div className="text-[11px] mb-2 leading-tight">
                <div className="flex justify-between">
                  <span>Bill: {invoice.invoiceNumber}</span>
                  <span>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Customer: {invoice.customerName}</span>
                  <span>{new Date(invoice.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {invoice.doctorName && (
                  <div className="text-[10px] text-gray-700">Dr: {invoice.doctorName}</div>
                )}
                {invoice.isOfflineCreated && (
                  <div className="font-bold text-center text-[10px] bg-gray-200 py-0.5 mt-1">
                    ** OFFLINE COUNTER SALE **
                  </div>
                )}
              </div>

              <div className="border-t border-b border-dashed border-black py-1 mb-2 text-[10px]">
                <div className="flex justify-between font-bold">
                  <span className="w-1/2">Item/Batch/Exp</span>
                  <span className="w-1/6 text-right">Qty</span>
                  <span className="w-1/6 text-right">Rate</span>
                  <span className="w-1/6 text-right">Amt</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-2 text-[10px]">
                {invoice.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="font-semibold truncate">{item.medicineName}</div>
                    <div className="flex justify-between text-gray-700 text-[9px]">
                      <span>B:{item.batchNumber} E:{item.expiryDate}</span>
                      <span className="tabular-nums">{item.quantity} x ₹{item.unitPrice.toFixed(1)}</span>
                      <span className="font-bold tabular-nums">₹{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black pt-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount:</span>
                    <span className="tabular-nums">-₹{invoice.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Total GST (Incl):</span>
                  <span className="tabular-nums">₹{invoice.totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-black pt-1">
                  <span>FINAL PAYABLE:</span>
                  <span className="tabular-nums">₹{invoice.finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Paid via: {invoice.paymentMethod.toUpperCase()}</span>
                  <span>{invoice.paymentStatus.toUpperCase()}</span>
                </div>
                {invoice.cashTendered ? (
                  <div className="flex justify-between text-[10px] text-gray-700">
                    <span>Cash: ₹{invoice.cashTendered}</span>
                    <span>Change: ₹{invoice.changeReturned || 0}</span>
                  </div>
                ) : null}
              </div>

              <div className="text-center text-[9px] border-t border-dashed border-black pt-2 mt-2 leading-tight">
                <p>Thank You! Get Well Soon</p>
                <p>Returns accepted within 7 days with bill.</p>
                <p className="text-[8px] text-gray-500 mt-1">Powered by MediOneBilling (MOB)</p>
              </div>
            </div>
          )}

          {/* 58mm Compact Thermal Receipt */}
          {template === '58mm' && (
            <div className="w-[58mm] min-h-[120mm] bg-white text-black p-2 font-mono text-[10px] shadow-md border border-slate-300 print:shadow-none print:border-none print:w-full">
              <div className="text-center border-b border-dashed border-black pb-1 mb-1">
                <p className="font-bold text-xs">{pharmacy.name}</p>
                <p className="text-[8px]">{pharmacy.city} | Ph: {pharmacy.mobile}</p>
                <p className="text-[8px]">DL: {pharmacy.dlNumber || 'N/A'}</p>
              </div>

              <div className="text-[9px] mb-1">
                <div>Inv: {invoice.invoiceNumber}</div>
                <div>Dt: {new Date(invoice.invoiceDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
                <div>Cust: {invoice.customerName.slice(0, 18)}</div>
              </div>

              <div className="border-t border-b border-dashed border-black py-0.5 mb-1 text-[8px] font-bold flex justify-between">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>

              <div className="space-y-1 mb-1 text-[9px]">
                {invoice.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="truncate font-semibold">{item.medicineName}</div>
                    <div className="flex justify-between text-[8px] text-gray-700">
                      <span>B:{item.batchNumber}</span>
                      <span>{item.quantity} x {item.unitPrice}</span>
                      <span className="font-bold">₹{item.total.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black pt-1 space-y-0.5 text-[9px]">
                <div className="flex justify-between font-bold text-[11px] pt-0.5">
                  <span>TOTAL:</span>
                  <span>₹{invoice.finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[8px]">
                  <span>Mode: {invoice.paymentMethod}</span>
                  <span>GST: ₹{invoice.totalGst.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[8px] border-t border-dashed border-black pt-1 mt-1">
                <p>Thank you! Visit again</p>
              </div>
            </div>
          )}

          {/* A4 Tax Invoice Preview */}
          {template === 'a4' && (
            <div className="w-full max-w-[190mm] bg-white text-slate-900 p-6 shadow-md border border-slate-200 text-xs">
              <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
                <div className="flex items-start gap-3">
                  <img
                    src="/logo.png"
                    alt="MOB Logo"
                    className="w-16 h-16 object-contain rounded-full border border-slate-200 shrink-0"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-teal-800">{pharmacy.name}</h2>
                    <p className="text-xs text-slate-600">{pharmacy.address}</p>
                    <p className="text-xs text-slate-600">{pharmacy.city}, {pharmacy.state} - {pharmacy.pincode}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">Ph: {pharmacy.mobile} | Email: {pharmacy.email}</p>
                    <p className="text-xs text-slate-600">DL: {pharmacy.dlNumber || 'N/A'} | GSTIN: {pharmacy.gstin || 'Unregistered'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 font-bold text-xs bg-slate-100 rounded text-slate-800 border mb-1">
                    TAX INVOICE
                  </span>
                  <p className="font-bold text-sm text-slate-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-600">Date: {new Date(invoice.invoiceDate).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-600">Payment: {invoice.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 rounded-lg mb-4 bg-slate-50/50">
                <div>
                  <span className="font-bold text-slate-700">Patient / Bill To:</span>
                  <p className="font-semibold text-slate-900">{invoice.customerName}</p>
                  {invoice.customerPhone && <p className="text-slate-600">Ph: {invoice.customerPhone}</p>}
                </div>
                <div>
                  <span className="font-bold text-slate-700">Prescription Details:</span>
                  <p className="text-slate-800">Doctor: {invoice.doctorName || 'Self / OTC'}</p>
                  <p className="text-slate-600">Billed by: {invoice.createdByName}</p>
                </div>
              </div>

              <table className="w-full text-left border border-slate-200 mb-4 text-[11px]">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr className="border-b border-slate-200">
                    <th className="p-2">#</th>
                    <th className="p-2">Medicine Description</th>
                    <th className="p-2">HSN</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Exp</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">MRP</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Disc%</th>
                    <th className="p-2 text-right">GST%</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 font-medium">
                        {item.medicineName}
                        <span className="block text-[10px] text-slate-500">{item.genericName}</span>
                      </td>
                      <td className="p-2">{item.hsnCode}</td>
                      <td className="p-2 font-mono">{item.batchNumber}</td>
                      <td className="p-2 font-mono">{item.expiryDate}</td>
                      <td className="p-2 text-right font-semibold">{item.quantity}</td>
                      <td className="p-2 text-right">₹{item.mrp.toFixed(2)}</td>
                      <td className="p-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="p-2 text-right">{item.discountPercent}%</td>
                      <td className="p-2 text-right">{item.gstRate}%</td>
                      <td className="p-2 text-right font-bold tabular-nums">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start border-t border-slate-300 pt-3">
                <div className="w-1/2 text-[10px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">GST Breakdown:</p>
                  <p>Taxable Value: ₹{invoice.taxableAmount.toFixed(2)}</p>
                  <p>CGST: ₹{invoice.cgst.toFixed(2)} | SGST: ₹{invoice.sgst.toFixed(2)}</p>
                  <p className="font-medium text-teal-700">Total Tax: ₹{invoice.totalGst.toFixed(2)}</p>
                </div>
                <div className="w-1/2 space-y-1.5 text-right text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="tabular-nums">₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Total Discount:</span>
                      <span className="tabular-nums text-emerald-600">-₹{invoice.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable GST:</span>
                    <span className="tabular-nums">₹{invoice.totalGst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-teal-900 border-t border-slate-300 pt-2">
                    <span>Grand Total:</span>
                    <span className="tabular-nums text-base">₹{invoice.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 no-print">
          <span className="text-xs text-slate-500">
            Payment Mode: <strong className="uppercase text-slate-700 dark:text-slate-300">{invoice.paymentMethod}</strong> (Status: {invoice.paymentStatus})
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-teal-600" />
              Download Official PDF
            </button>

            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
