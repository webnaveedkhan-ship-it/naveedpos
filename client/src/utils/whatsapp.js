// WhatsApp Integration Utility for NaveedPOS

/**
 * Normalizes a phone number to Pakistani international standard format for WhatsApp.
 * e.g., '0300-1234567' -> '923001234567'
 *       '+92 300 1234567' -> '923001234567'
 */
export const normalizeWhatsAppPhone = (rawPhone) => {
  if (!rawPhone) return '';
  // Strip all non-digit characters
  let digits = rawPhone.toString().replace(/\D/g, '');

  if (digits.startsWith('0') && digits.length === 11) {
    // 03001234567 -> 923001234567
    digits = '92' + digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    // 3001234567 -> 923001234567
    digits = '92' + digits;
  } else if (digits.startsWith('0092')) {
    digits = digits.substring(2);
  }

  return digits;
};

/**
 * Formats a sales order into a professional WhatsApp receipt message.
 */
export const buildWhatsAppReceiptText = (order, storeName = 'NaveedPOS Store') => {
  const d = new Date(order.createdAt || Date.now());
  const dateStr = d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    `🧾 *SALES RECEIPT*`,
    `🏪 *${storeName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Invoice: *#${order.orderNumber || 'N/A'}*`,
    `Date: ${dateStr}`,
    order.customer?.name ? `Customer: ${order.customer.name}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*ITEMS ORDERED:*`,
  ].filter(Boolean);

  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      const unitLabel = item.unitType ? ` ${item.unitType}` : '';
      lines.push(`• ${item.title}`);
      lines.push(`  ${item.quantity}${unitLabel} × Rs ${item.price?.toLocaleString()} = *Rs ${item.subtotal?.toLocaleString()}*`);
    });
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Subtotal: Rs ${order.subtotal?.toLocaleString()}`);

  if (order.discountAmount > 0) {
    lines.push(`Discount: -Rs ${order.discountAmount?.toLocaleString()}`);
  }

  lines.push(`*GRAND TOTAL: Rs ${order.grandTotal?.toLocaleString()}*`);
  lines.push(`Payment Method: *${(order.paymentMethod || 'CASH').toUpperCase()}*`);

  if (order.paymentMethod?.toUpperCase() === 'KHATA') {
    lines.push(`Udhar Added: Rs ${order.grandTotal?.toLocaleString()}`);
    if (order.paymentDetails?.balanceAfter !== undefined) {
      lines.push(`*Outstanding Khata Balance: Rs ${order.paymentDetails.balanceAfter?.toLocaleString()}*`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Thank you for shopping with us!`);
  lines.push(`_Powered by NaveedPOS_`);

  return lines.join('\n');
};

/**
 * Builds a direct wa.me link for sending a sales receipt.
 */
export const getWhatsAppReceiptUrl = (order, storeName, customPhone = '') => {
  const targetPhone = customPhone || order?.customer?.phone || '';
  const normalized = normalizeWhatsAppPhone(targetPhone);
  const message = buildWhatsAppReceiptText(order, storeName);
  const encoded = encodeURIComponent(message);

  if (normalized) {
    return `https://wa.me/${normalized}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Formats a polite Udhar / Khata balance reminder for WhatsApp.
 */
export const buildWhatsAppReminderText = (customer, storeName = 'NaveedPOS Store') => {
  const debt = Number(customer.totalDebt || 0);

  const lines = [
    `السلام علیکم / Hello *${customer.name}*,`,
    ``,
    `This is a friendly reminder from *${storeName}* regarding your Khata (Udhar) ledger balance.`,
    ``,
    `💰 *Outstanding Balance Due: Rs ${debt.toLocaleString()}*`,
    ``,
    `We kindly request you to clear the balance at your earliest convenience. You may pay in cash at our counter or via direct bank transfer / Raast.`,
    ``,
    `Thank you for your valued cooperation and continued patronage!`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*${storeName}*`,
  ];

  return lines.join('\n');
};

/**
 * Builds a direct wa.me link for an Udhar reminder.
 */
export const getWhatsAppReminderUrl = (customer, storeName) => {
  const normalized = normalizeWhatsAppPhone(customer?.phone);
  const message = buildWhatsAppReminderText(customer, storeName);
  const encoded = encodeURIComponent(message);

  if (normalized) {
    return `https://wa.me/${normalized}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};
