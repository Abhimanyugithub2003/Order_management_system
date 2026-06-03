export type Unit = 'g' | 'kg' | 'mL' | 'L' | 'item';
export type Dimension = 'weight' | 'volume' | 'count';

export const UNITS: { value: Unit; label: string; dimension: Dimension }[] = [
  { value: 'g', label: 'Grams (g)', dimension: 'weight' },
  { value: 'kg', label: 'Kilograms (kg)', dimension: 'weight' },
  { value: 'mL', label: 'Milliliters (mL)', dimension: 'volume' },
  { value: 'L', label: 'Liters (L)', dimension: 'volume' },
  { value: 'item', label: 'Items (count)', dimension: 'count' },
];

export function getDimension(unit: string): Dimension | null {
  const found = UNITS.find((u) => u.value === unit);
  return found ? found.dimension : null;
}

export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const dimA = getDimension(unitA);
  const dimB = getDimension(unitB);
  return dimA !== null && dimA === dimB;
}

export function getCompatibleUnits(unit: string): Unit[] {
  const dim = getDimension(unit);
  if (!dim) return [];
  return UNITS.filter((u) => u.dimension === dim).map((u) => u.value);
}

/**
 * Returns the conversion factor to multiply a quantity of fromUnit to get the quantity in toUnit.
 * Example: from 'kg' to 'g' -> returns 1000
 * Example: from 'g' to 'kg' -> returns 0.001
 */
export function getConversionFactor(fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return 1.0;
  
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(`Incompatible units for conversion: cannot convert from ${fromUnit} to ${toUnit}`);
  }

  // Weight conversion
  if (fromUnit === 'kg' && toUnit === 'g') return 1000.0;
  if (fromUnit === 'g' && toUnit === 'kg') return 0.001;

  // Volume conversion
  if (fromUnit === 'L' && toUnit === 'mL') return 1000.0;
  if (fromUnit === 'mL' && toUnit === 'L') return 0.001;

  // Fallback (for items or unhandled identical dimensions)
  return 1.0;
}

/**
 * Converts a quantity from fromUnit to toUnit.
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  const factor = getConversionFactor(fromUnit, toUnit);
  return quantity * factor;
}

/**
 * Calculates price for an ordered quantity in orderedUnit for a product with baseUnit and basePrice.
 * Steps:
 * 1. Convert ordered quantity to base unit quantity.
 * 2. Multiply base quantity by base price.
 * 3. Return the calculated price.
 */
export function calculateOrderPrice(
  orderedQuantity: number,
  orderedUnit: string,
  baseUnit: string,
  basePrice: number
): {
  baseQuantity: number;
  conversionFactor: number;
  totalPrice: number;
} {
  const factor = getConversionFactor(orderedUnit, baseUnit);
  const baseQuantity = orderedQuantity * factor;
  const totalPrice = baseQuantity * basePrice;
  
  return {
    baseQuantity,
    conversionFactor: factor,
    totalPrice: parseFloat(totalPrice.toFixed(4)), // Maintain 4 decimal precision
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
