import { jsPDF } from 'jspdf';
import { Invoice, Pharmacy } from '../types/pharmacy.js';

export function generateInvoicePDF(invoice: Invoice, pharmacy: Pharmacy): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  let y = 14;

  // Header - Pharmacy Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(13, 148, 136); // Emerald / Teal
  doc.text(pharmacy.name, 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate
  y += 5;
  doc.text(pharmacy.address, 14, y);
  y += 4;
  doc.text(`${pharmacy.city}, ${pharmacy.state} - ${pharmacy.pincode} | Ph: ${pharmacy.mobile}`, 14, y);
  y += 4;
  doc.text(`DL No: ${pharmacy.dlNumber || 'N/A'} | GSTIN: ${pharmacy.gstin || 'Unregistered'}`, 14, y);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('RETAIL TAX INVOICE / CASH MEMO', pageWidth - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - 14, 24, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleString('en-IN')}`, pageWidth - 14, 29, { align: 'right' });
  doc.text(`Mode: ${invoice.paymentMethod.toUpperCase()}`, pageWidth - 14, 34, { align: 'right' });

  // Divider line
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  // Customer & Doctor Info
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Patient / Customer:`, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.customerName} ${invoice.customerPhone ? '(' + invoice.customerPhone + ')' : ''}`, 48, y);

  if (invoice.doctorName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Doctor Name:`, 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.doctorName, 145, y);
  }

  y += 6;
  doc.line(14, y, pageWidth - 14, y);

  // Table Headers
  y += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, pageWidth - 28, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('#', 16, y);
  doc.text('Medicine / Generic Name', 24, y);
  doc.text('HSN', 88, y);
  doc.text('Batch', 106, y);
  doc.text('Exp', 126, y);
  doc.text('Qty', 142, y);
  doc.text('MRP', 152, y);
  doc.text('Rate', 165, y);
  doc.text('GST%', 178, y);
  doc.text('Total (₹)', pageWidth - 16, y, { align: 'right' });

  // Table Items
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  invoice.items.forEach((item, index) => {
    // Check if new page needed
    if (y > 260) {
      doc.addPage();
      y = 14;
    }

    doc.text(`${index + 1}`, 16, y);
    const medName = item.medicineName.length > 32 ? item.medicineName.slice(0, 30) + '..' : item.medicineName;
    doc.text(medName, 24, y);
    doc.text(item.hsnCode || '3004', 88, y);
    doc.text(item.batchNumber, 106, y);
    doc.text(item.expiryDate, 126, y);
    doc.text(`${item.quantity}`, 142, y);
    doc.text(item.mrp.toFixed(2), 152, y);
    doc.text(item.unitPrice.toFixed(2), 165, y);
    doc.text(`${item.gstRate}%`, 178, y);
    doc.text(item.total.toFixed(2), pageWidth - 16, y, { align: 'right' });

    y += 5;
  });

  // Table bottom border
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);

  // Financial summary
  y += 6;
  const leftX = 14;
  const rightX = pageWidth - 14;

  // Left side: GST summary table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GST Summary:', leftX, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Taxable Value: ₹${invoice.taxableAmount.toFixed(2)}`, leftX, y);
  y += 4;
  doc.text(`CGST: ₹${invoice.cgst.toFixed(2)}  |  SGST: ₹${invoice.sgst.toFixed(2)}`, leftX, y);
  y += 4;
  doc.text(`Total Tax: ₹${invoice.totalGst.toFixed(2)}`, leftX, y);

  // Right side: Totals
  let totalY = y - 12;
  doc.text(`Subtotal:`, 140, totalY);
  doc.text(`₹${invoice.subtotal.toFixed(2)}`, rightX, totalY, { align: 'right' });
  totalY += 4;

  if (invoice.totalDiscount > 0) {
    doc.text(`Discount:`, 140, totalY);
    doc.text(`-₹${invoice.totalDiscount.toFixed(2)}`, rightX, totalY, { align: 'right' });
    totalY += 4;
  }

  doc.text(`GST Total:`, 140, totalY);
  doc.text(`₹${invoice.totalGst.toFixed(2)}`, rightX, totalY, { align: 'right' });
  totalY += 4;

  if (invoice.roundingAdjustment !== 0) {
    doc.text(`Rounding:`, 140, totalY);
    doc.text(`${invoice.roundingAdjustment > 0 ? '+' : ''}₹${invoice.roundingAdjustment.toFixed(2)}`, rightX, totalY, { align: 'right' });
    totalY += 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(13, 148, 136);
  doc.text(`Grand Total:`, 140, totalY + 1);
  doc.text(`₹${invoice.finalAmount.toFixed(2)}`, rightX, totalY + 1, { align: 'right' });

  // Footer notes & terms
  y = Math.max(y + 8, totalY + 10);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Terms & Conditions:', 14, y);
  y += 3.5;
  doc.text('1. Goods once sold will be taken back only within 7 days with original bill in sealed pack.', 14, y);
  y += 3.5;
  doc.text('2. Refrigerated & Schedule X items cannot be returned or exchanged.', 14, y);
  y += 3.5;
  doc.text('3. Consult your physician before taking any Schedule H/H1 prescription drugs.', 14, y);

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${pharmacy.name}`, pageWidth - 14, y - 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Registered Pharmacist Sign', pageWidth - 14, y + 2, { align: 'right' });

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
