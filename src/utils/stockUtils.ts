/**
 * Utility functions for stock management
 */

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

/**
 * Calculate stock status based on quantity
 * @param quantity - Current product quantity
 * @param lowStockThreshold - Threshold below which stock is considered low (default: 10)
 * @returns Stock status
 */
export const calculateStockStatus = (quantity: number, lowStockThreshold: number = 10): StockStatus => {
    if (quantity === 0) {
        return 'out-of-stock';
    } else if (quantity <= lowStockThreshold) {
        return 'low-stock';
    } else {
        return 'in-stock';
    }
};

/**
 * Update product with calculated stock status
 * @param product - Product to update
 * @param lowStockThreshold - Threshold below which stock is considered low (default: 10)
 * @returns Product with updated status
 */
export const updateProductStatus = <T extends { quantity: number; status?: StockStatus }>(
    product: T,
    lowStockThreshold: number = 10
): T => {
    return {
        ...product,
        status: calculateStockStatus(product.quantity, lowStockThreshold)
    };
};
