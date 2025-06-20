/**
 * Currency formatting utilities
 */

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Fallback formatting
        return `$${amount.toFixed(2)}`;
    }
};

export const formatCurrencySimple = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
};

export const parseCurrency = (currencyString: string): number => {
    // Remove currency symbols and parse as float
    const cleaned = currencyString.replace(/[$,\s]/g, '');
    return parseFloat(cleaned) || 0;
};
