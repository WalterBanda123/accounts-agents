import { ChatMessage } from './message';

export interface Transaction {
    id?: string;
    transaction_id: string; // Standardized field
    transactionId?: string; // Legacy compatibility
    userId: string; // Standardized field - Firebase UID
    user_id?: string; // Legacy compatibility
    customer_name?: string; // Standardized field
    store_id: string; // Standardized field
    storeId?: string; // Legacy compatibility
    date: string; // Standardized field (YYYY-MM-DD)
    time: string; // Standardized field (HH:MM:SS)
    created_at: string; // Standardized field (ISO timestamp)
    sessionId?: string; // Chat session ID that led to this transaction
    chatMessages?: ChatMessage[]; // Chat conversation that led to this transaction
    customerInfo?: {
        email?: string;
        phone?: string;
        name?: string;
    };
    items: TransactionItem[];
    subtotal: number;
    tax_rate: number; // Standardized field
    taxRate?: number; // Legacy compatibility
    tax_amount: number; // Standardized field
    tax?: number; // Legacy compatibility
    total: number;
    payment_method: string; // Standardized field
    paymentMethod?: string; // Legacy compatibility
    change_due?: number; // Standardized field
    status: 'pending' | 'completed' | 'cancelled' | 'refunded'; // Standardized enum
    notes?: string;
    receiptGenerated?: boolean; // Legacy field
    createdAt?: Date; // Legacy compatibility
    updatedAt?: Date; // Legacy compatibility
    timestamp?: Date; // Legacy compatibility
}

export interface TransactionItem {
    productId?: string; // Reference to product in inventory
    name: string; // Standardized field
    productName?: string; // Legacy compatibility
    quantity: number;
    unit_price: number; // Standardized field
    unitPrice?: number; // Legacy compatibility
    line_total: number; // Standardized field
    totalPrice?: number; // Legacy compatibility
    sku?: string; // Standardized field
    category?: string; // Standardized field
    stockReducedBy?: number; // Track how much stock was reduced
}

export interface TransactionSummary {
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    topSellingItems: Array<{
        productName: string;
        quantitySold: number;
        revenue: number;
    }>;
    dateRange: {
        from: Date;
        to: Date;
    };
}

export interface TransactionFilter {
    userId?: string;
    storeId?: string;
    status?: Transaction['status'];
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
}
