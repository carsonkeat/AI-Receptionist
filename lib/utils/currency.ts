/**
 * Currency formatting utilities
 */

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatCost = (cost: number): string => {
  // For very small costs, show more decimal places
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return formatCurrency(cost)
}

