// Conversion factors to a base unit (mL for volume, g for weight)
const volumeFactors = {
    CUP:   240,
    TBSP:  14.7868,
    TSP:   4.92892,
    'FL OZ': 29.5735,
    PT:    480,
    QT:    960,
    L:     1000,
    ML:    1,
    PINCH: 4.92892 / 8,
    BOTTLE: 750
  };
  
  const weightFactors = {
    G:   1,
    OZ:  28.3495,
    LB:  453.592,
    KG:  1000
  };
  
  /**
   * Converts a value from one unit to another.
   * Supports volume units (CUP, TBSP, TSP, FL OZ, PT, QT, L, ML, PINCH, BOTTLE)
   * and weight units (G, OZ, LB, KG). 
   *
   * @param {number} value - the numeric quantity to convert
   * @param {string} fromUnit - the unit to convert from (e.g. "CUP", "TBSP", "G", "KG")
   * @param {string} toUnit - the unit to convert to
   * @returns {number} - the converted value
   * @throws {Error} - if units are unknown or from/to mix volume & weight
   */
  module.exports = function convert(value, fromUnit, toUnit) {
    const uFrom = fromUnit.trim().toUpperCase();
    const uTo   = toUnit.trim().toUpperCase();
  
    const isVolumeFrom = uFrom in volumeFactors;
    const isVolumeTo   = uTo   in volumeFactors;
    const isWeightFrom = uFrom in weightFactors;
    const isWeightTo   = uTo   in weightFactors;
  
    if (isVolumeFrom && isVolumeTo) {
      // Convert via mL
      return value * (volumeFactors[uFrom] / volumeFactors[uTo]);
    } 
    else if (isWeightFrom && isWeightTo) {
      // Convert via g
      return value * (weightFactors[uFrom] / weightFactors[uTo]);
    } 
    else if ((isVolumeFrom && isWeightTo) || (isWeightFrom && isVolumeTo)) {
      throw new Error('Cannot convert between volume and weight units without density.');
    } 
    else {
      throw new Error(`Unknown unit(s): ${fromUnit}, ${toUnit}`);
    }
  }
  
  // Example usage:
  // console.log(convert(1, 'CUP', 'TBSP'));    // → 16
  // console.log(convert(2, 'LB', 'G'));        // → 907.184
  // console.log(convert(1, 'BOTTLE', 'CUP'));  // → 3.125