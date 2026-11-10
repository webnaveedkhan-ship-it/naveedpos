/**
 * Enterprise CSV Exporter for NaveedPOS Financial & Sales Reports
 * Encodes with UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
 * Escapes quotes and commas safely
 */

export const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value);
  // If contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
};

export const exportDetailedSalesReportCsv = ({
  storeName = 'NORMEGA MART',
  period = 'daily',
  periodLabel = 'Today',
  dateRangeStr = '',
  summary = {},
  orders = [],
}) => {
  const timestamp = new Date().toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const turnover = Number(summary.totalSales || summary.turnover || 0);
  const cogs = Number(summary.totalCost || summary.cogs || 0);
  const profit = Number(summary.netProfit || turnover - cogs);
  const margin = turnover > 0 ? ((profit / turnover) * 100).toFixed(1) : '0.0';
  const khata = Number(summary.totalUdhar || summary.khataUdharGiven || 0);

  // 1. Metadata Block (Top Rows)
  const metadataRows = [
    ['REPORT', `${storeName.toUpperCase()} - SALES & NET PROFIT FINANCIAL REPORT`],
    ['REPORT PERIOD', `${periodLabel} (${dateRangeStr || 'Current Window'})`],
    ['GENERATED AT', timestamp],
    ['CURRENCY', 'PKR (Pakistani Rupee - Rs.)'],
    ['TOTAL BILLS / ORDERS', orders.length],
    ['GROSS TURNOVER', `Rs. ${turnover.toLocaleString()}`],
    ['COST OF GOODS SOLD (COGS)', `Rs. ${cogs.toLocaleString()}`],
    ['NET PROFIT', `Rs. ${profit.toLocaleString()}`],
    ['NET PROFIT MARGIN', `${margin}%`],
    ['KHATA / UDHAR GIVEN', `Rs. ${khata.toLocaleString()}`],
    [], // Blank line separator
  ];

  // 2. Line-Item Data Table Header
  const tableHeaders = [
    'Receipt No',
    'Date & Time',
    'Customer Name / Phone',
    'Payment Method',
    'Items Sold Summary',
    'Total Quantity',
    'Total Cost Price (Rs.)',
    'Gross Selling Price (Rs.)',
    'Discount (Rs.)',
    'Net Turnover (Rs.)',
    'Net Profit (Rs.)',
    'Margin %',
  ];

  // 3. Line-Item Rows
  const dataRows = orders.map((o) => {
    const d = new Date(o.createdAt);
    const dateFormatted = d.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const customerText = o.customerName
      ? o.customerPhone
        ? `${o.customerName} (${o.customerPhone})`
        : o.customerName
      : o.customer?.name
      ? o.customer.name
      : 'Walk-in Customer';

    // Build items sold summary (e.g. "Basmati Rice 1kg x 2, Sugar 5kg x 1")
    let itemsSummary = '';
    let totalQty = 0;
    if (Array.isArray(o.items) && o.items.length > 0) {
      itemsSummary = o.items
        .map((i) => `${i.title || 'Item'} x ${i.quantity || 1}`)
        .join(', ');
      totalQty = o.items.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
    } else {
      itemsSummary = o.itemsSoldSummary || 'Counter Items';
      totalQty = o.itemsCount || 1;
    }

    const orderCost = Number(o.totalCost || o.cogs || 0);
    const grossPrice = Number(o.subtotal || o.grandTotal || o.total || 0);
    const discount = Number(o.discountAmount || 0);
    const netTurnover = Number(o.grandTotal || o.total || grossPrice - discount);
    const netProfit = Number(o.netProfit !== undefined ? o.netProfit : netTurnover - orderCost);
    const orderMargin = netTurnover > 0 ? ((netProfit / netTurnover) * 100).toFixed(1) : '0.0';

    return [
      o.orderNumber,
      `${dateFormatted} ${timeFormatted}`,
      customerText,
      (o.paymentMethod || 'CASH').toUpperCase(),
      itemsSummary,
      totalQty,
      orderCost.toFixed(2),
      grossPrice.toFixed(2),
      discount.toFixed(2),
      netTurnover.toFixed(2),
      netProfit.toFixed(2),
      `${orderMargin}%`,
    ];
  });

  // 4. Assemble CSV Content
  const csvLines = [
    ...metadataRows.map((row) => row.map(escapeCsvValue).join(',')),
    tableHeaders.map(escapeCsvValue).join(','),
    ...dataRows.map((row) => row.map(escapeCsvValue).join(',')),
  ];

  // UTF-8 BOM prefix
  const csvString = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Clean filename: e.g. NaveedPOS_SalesReport_Daily_2026-11-07.csv
  const sanitizedStore = (storeName || 'NaveedPOS').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedPeriod = (periodLabel || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizedStore}_SalesReport_${sanitizedPeriod}_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
