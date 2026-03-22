// Location-based pricing utility
export interface CountryPricing {
  country: string;
  currency: string;
  symbol: string;
  free: {
    price: number;
    originalPrice?: number;
  };
  professional: {
    monthly: number;
    yearly: number;
    originalMonthly?: number;
    originalYearly?: number;
  };
  enterprise: {
    monthly: number;
    yearly: number;
    originalMonthly?: number;
    originalYearly?: number;
  };
  purchasingPower: number; // Relative purchasing power (1.0 = baseline)
}

// Global India-only pricing as requested
export const IndiaPricing: CountryPricing = {
  country: 'India',
  currency: 'INR',
  symbol: '₹',
  free: { price: 0 },
  professional: { monthly: 1999, yearly: 1399, originalMonthly: 2999, originalYearly: 1999 },
  enterprise: { monthly: 5999, yearly: 4499, originalMonthly: 8999, originalYearly: 5999 },
  purchasingPower: 1.0
};

// Comprehensive location-based pricing data - Simplified to India only
export const locationPricing: Record<string, CountryPricing> = {
  'India': IndiaPricing
};

// Default pricing for all users (Forced to INR as requested)
export const defaultPricing: CountryPricing = IndiaPricing;

// Get pricing for a specific country (Always return India pricing for now)
export function getPricingForCountry(country: string): CountryPricing {
  // Directly return India pricing to fulfill the request for INR only
  return IndiaPricing;
}

// Format price with currency symbol (Simplified to INR)
export function formatPrice(amount: number, pricing: CountryPricing): string {
  // Always format as INR regardless of the pricing object passed
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Get savings percentage
export function getSavingsPercentage(monthly: number, yearly: number): number {
  const savings = ((monthly - yearly) / monthly) * 100;
  return Math.round(savings);
}

// Get purchasing power adjusted pricing (Always return India pricing)
export function getAdjustedPricing(basePricing: CountryPricing, targetCountry: string): CountryPricing {
  return IndiaPricing;
}