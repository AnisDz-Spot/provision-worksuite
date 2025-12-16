/**
 * Export Utilities - PDF, Excel, CSV generation
 * Server-safe utility functions for data export
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ============================================================================
// Types
// ============================================================================

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  title?: string;
  subtitle?: string;
  filename: string;
  orientation?: "portrait" | "landscape";
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Export data to PDF with formatted table
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions
): void {
  const doc = new jsPDF({
    orientation: options.orientation || "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add title
  if (options.title) {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(options.title, 14, 20);
  }

  // Add subtitle
  if (options.subtitle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(options.subtitle, 14, 28);
    doc.setTextColor(0);
  }

  // Prepare table data
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (value === null || value === undefined) return "";
      if (typeof value === "number") return value.toLocaleString();
      if (value instanceof Date) return value.toLocaleDateString();
      return String(value);
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: options.title ? 35 : 20,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: columns.reduce(
      (acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      },
      {} as Record<number, { cellWidth: number }>
    ),
  });

  // Add footer with date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Download
  doc.save(`${options.filename}.pdf`);
}

// ============================================================================
// Excel Export
// ============================================================================

/**
 * Export data to Excel (.xlsx) format
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions
): void {
  // Create worksheet data
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (value === null || value === undefined) return "";
      if (value instanceof Date) return value.toISOString();
      return value;
    })
  );

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, options.title || "Data");

  // Download
  XLSX.writeFile(wb, `${options.filename}.xlsx`);
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions
): void {
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (value === null || value === undefined) return "";
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (value instanceof Date) return value.toISOString();
      return String(value);
    })
  );

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${options.filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Invoice PDF Generation
// ============================================================================

export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  clientName: string;
  clientAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
}

/**
 * Generate a professional invoice PDF
 */
export function generateInvoicePDF(
  invoice: InvoiceData,
  companyName = "ProVision WorkSuite"
): void {
  const doc = new jsPDF();

  // Company header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text(companyName, 14, 25);

  // Invoice label
  doc.setFontSize(28);
  doc.setTextColor(100);
  doc.text("INVOICE", 140, 25);

  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 35);
  doc.text(`Date: ${invoice.date.toLocaleDateString()}`, 140, 42);
  doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 140, 49);

  // Client info
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.clientName, 14, 57);
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, 14, 64);
  }

  // Items table
  autoTable(doc, {
    head: [["Description", "Qty", "Rate", "Amount"]],
    body: invoice.items.map((item) => [
      item.description,
      item.quantity.toString(),
      `$${item.rate.toFixed(2)}`,
      `$${item.amount.toFixed(2)}`,
    ]),
    startY: 75,
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  // Totals
  const finalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 140, finalY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 180, finalY, { align: "right" });

  if (invoice.tax) {
    doc.text("Tax:", 140, finalY + 7);
    doc.text(`$${invoice.tax.toFixed(2)}`, 180, finalY + 7, { align: "right" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", 140, finalY + (invoice.tax ? 17 : 10));
  doc.text(
    `$${invoice.total.toFixed(2)}`,
    180,
    finalY + (invoice.tax ? 17 : 10),
    { align: "right" }
  );

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Notes:", 14, finalY + 30);
    doc.setTextColor(100);
    doc.text(invoice.notes, 14, finalY + 37);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 14, 280);

  // Download
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
