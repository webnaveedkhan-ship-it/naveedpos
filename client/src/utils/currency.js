// Currency Formatter for Pakistani Rupee (PKR / Rs.)
export const CURRENCY_SYMBOL = 'Rs.';

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  // Format with commas, e.g. Rs. 1,250 or Rs. 1,250.50
  return `Rs. ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// Common Pakistani Banknotes for POS Quick-Tender
export const PAKISTANI_BANKNOTES = [50, 100, 500, 1000, 5000];
