export interface Notification {
    id?: string;
    userId: string; // Firebase UID
    storeId: string; // Store/profile ID
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'transaction' | 'inventory';
    priority: 'low' | 'medium' | 'high';
    isRead: boolean;
    actionUrl?: string;
    transactionId?: string; // Reference to transaction if applicable
    productId?: string; // Reference to product if applicable
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationFilter {
    userId?: string;
    storeId?: string;
    type?: Notification['type'];
    priority?: Notification['priority'];
    isRead?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface NotificationSummary {
    totalNotifications: number;
    unreadCount: number;
    priorityBreakdown: {
        high: number;
        medium: number;
        low: number;
    };
    typeBreakdown: {
        [key in Notification['type']]: number;
    };
}
