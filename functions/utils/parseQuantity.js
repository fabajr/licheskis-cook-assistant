// functions/utils/parseQuantity.js
/**
 * Turn a string like "1/2", "2", "1.5" into a Number.
 * Returns 0 for invalid or ≤ 0.
 */
module.exports = function parseQuantity(qtyStr) {
    if (typeof qtyStr !== 'string') return 0;
    const parts = qtyStr.split('/').map(s => s.trim());
    let num =
      parts.length === 2
        ? parseFloat(parts[0]) / parseFloat(parts[1])
        : parseFloat(qtyStr);
    if (isNaN(num) || num <= 0) return 0;
    return num;
  };
  