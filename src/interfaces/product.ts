// Standardized Product Model Schema
export interface Product {
    id?: string; // Document ID (auto-generated)
    userId: string; // Owner user ID (standardized field)
    product_name: string; // Standardized field
    name?: string; // Alias for product_name (for compatibility)
    description?: string;
    category: string;
    subcategory?: string;
    brand?: string;
    unit_price: number; // Standardized field
    unitPrice?: number; // Alias for unit_price (for compatibility)
    cost_price?: number;
    stock_quantity: number; // Standardized field
    quantity?: number; // Alias for stock_quantity
    unit_of_measure: string; // Standardized field
    unit?: string; // Alias for unit_of_measure
    reorder_point?: number; // Default: 5
    status: 'active' | 'inactive' | 'discontinued'; // Standardized enum
    created_at: string; // Creation timestamp (ISO format)
    updated_at: string; // Last update timestamp
    createdAt?: Date; // Legacy timestamp field
    lastRestocked?: string;
    image?: string;
    barcode?: string;
    sku?: string;
    supplier?: string;
    confidence?: number; // AI detection confidence
    processing_time?: number; // Processing time for AI detection
    size?: number; // Product size/volume

    // Legacy compatibility fields
    store_id?: string;
}

// Legacy StockItem interface for backward compatibility
export interface StockItem {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    brand: string;
    size: string;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    lastRestocked: string;
    supplier: string;
    barcode?: string;
    image?: string;
    store_id?: string;
}

// Utility functions to convert between formats
export const convertProductToStockItem = (product: Product): StockItem => {
    return {
        id: product.id || '',
        name: product.product_name || product.name || '',
        description: product.description || '',
        category: product.category,
        subcategory: product.subcategory || '',
        unitPrice: product.unit_price || product.unitPrice || 0,
        quantity: product.stock_quantity || product.quantity || 0,
        unit: product.unit_of_measure || product.unit || '',
        brand: product.brand || '',
        size: product.size?.toString() || '',
        status: mapProductStatusToStockStatus(product.status, product.stock_quantity || 0),
        lastRestocked: product.lastRestocked || '',
        supplier: product.supplier || '',
        barcode: product.barcode,
        image: product.image,
        store_id: product.store_id
    };
};

export const convertStockItemToProduct = (stockItem: StockItem, userId: string): Product => {
    const now = new Date().toISOString();
    return {
        id: stockItem.id,
        userId,
        product_name: stockItem.name,
        name: stockItem.name,
        description: stockItem.description,
        category: stockItem.category,
        subcategory: stockItem.subcategory,
        brand: stockItem.brand,
        unit_price: stockItem.unitPrice,
        unitPrice: stockItem.unitPrice,
        stock_quantity: stockItem.quantity,
        quantity: stockItem.quantity,
        unit_of_measure: stockItem.unit,
        unit: stockItem.unit,
        reorder_point: 5, // Default
        status: mapStockStatusToProductStatus(stockItem.status),
        created_at: now,
        updated_at: now,
        lastRestocked: stockItem.lastRestocked,
        image: stockItem.image,
        barcode: stockItem.barcode,
        supplier: stockItem.supplier,
        size: parseFloat(stockItem.size) || undefined,
        store_id: stockItem.store_id
    };
};

// Helper functions for status mapping
const mapProductStatusToStockStatus = (
    productStatus: Product['status'],
    quantity: number
): StockItem['status'] => {
    if (productStatus === 'inactive' || productStatus === 'discontinued') {
        return 'out-of-stock';
    }
    if (quantity <= 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    return 'in-stock';
};

const mapStockStatusToProductStatus = (stockStatus: StockItem['status']): Product['status'] => {
    if (stockStatus === 'out-of-stock') return 'inactive';
    return 'active';
};
