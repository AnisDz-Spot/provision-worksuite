import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  uid: string;
  clientName: string;
  issueDate: string | Date;
  dueDate: string | Date;
  status: string;
  total: number;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  notes?: string;
  project?: {
    name: string;
  };
}

export const generateInvoicePDF = (invoice: InvoiceData) => {
  const doc = new jsPDF();

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Header
  doc.setFontSize(22);
  doc.text("INVOICE", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`ID: #${invoice.uid.substring(0, 8).toUpperCase()}`, 14, 28);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 33);

  // Client & Project Info
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Bill To:", 14, 45);
  doc.setFontSize(10);
  doc.text(invoice.clientName, 14, 52);

  if (invoice.project) {
    doc.text(`Project: ${invoice.project.name}`, 14, 57);
  }

  // Dates (Right Aligned)
  doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 140, 45);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 140, 50);

  // Table
  const tableColumn = ["Description", "Quantity", "Rate", "Amount"];
  const tableRows: any[] = [];

  invoice.items.forEach((item) => {
    const invoiceData = [
      item.description,
      item.quantity,
      formatCurrency(item.rate),
      formatCurrency(item.amount),
    ];
    tableRows.push(invoiceData);
  });

  // @ts-ignore - autotable types sometimes conflict
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 65,
    theme: "striped",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { top: 65 },
  });

  // Total
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${formatCurrency(invoice.total)}`, 140, finalY);

  // Footer / Notes
  if (invoice.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Notes:", 14, finalY + 10);
    doc.text(invoice.notes, 14, finalY + 16);
  }

  // Save
  doc.save(`Invoice_${invoice.uid.substring(0, 8)}.pdf`);
};
