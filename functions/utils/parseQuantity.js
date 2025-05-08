// functions/utils/parseQuantity.js
/**
 * Turn a string like "1/2", "2", "1.5" into a Number.
 * Returns 0 for invalid or ≤ 0.
 */

  module.exports = function parseQuantity(qtyStr) {
    // exemplo simples: suporta "1", "1/2", "1 1/2"
    if (!qtyStr) return 0;
    const parts = String(qtyStr).split(' ').filter(Boolean);
    let total = 0;
    for (let p of parts) {
      if (p.includes('/')) {
        const [num, den] = p.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den !== 0) total += num/den;
      } else if (!isNaN(Number(p))) {
        total += Number(p);
      }
    }
    return total;
  } 