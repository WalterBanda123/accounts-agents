export interface TransactionNotification {
    id: string;
    transactionId: string;
    title: string;
    message: string;
    type: "transaction" | "receipt" | "payment";
    timestamp: Date;
    isRead: boolean;
    priority: "low" | "medium" | "high";
    amount: number;
    customerInfo?: {
        name?: string;
        email?: string;
    };
    itemCount: number;
    actionUrl?: string;
}

export interface TransactionNotificationData {
    transactionId: string;
    amount: number;
    itemCount: number;
    customerInfo?: {
        name?: string;
        email?: string;
    };
    timestamp: Date;
}
