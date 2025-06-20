import React from "react";
import { StockItem } from "../../mock/stocks";
import { ChatMessage } from "../../interfaces/message";
import { ProfileInterface } from "../../interfaces/profile";
import { Transaction, TransactionItem, TransactionSummary, TransactionFilter } from "../../interfaces/transaction";
import { Notification, NotificationFilter, NotificationSummary } from "../../interfaces/notification";

// Import the transaction chat summary type
export interface TransactionChatSummary {
    transactionId: string;
    messageCount: number;
    chatDuration: number;
    firstMessage: Date;
    lastMessage: Date;
    userMessageCount: number;
    botMessageCount: number;
}

export interface DataContextInterface {
    isLoading: boolean,
    isProductsLoading: boolean,
    isChatLoading: boolean,
    error: unknown,
    inventory: Partial<StockItem>[],
    addNewProduct: (product: Partial<StockItem>) => Promise<unknown>,
    getProduct: (productId: string) => Promise<Partial<StockItem> | null>,
    getAllProducts: () => Promise<unknown>,
    refreshInventory: () => Promise<unknown>,
    searchProducts: (search: string) => Promise<Partial<StockItem>[]>
    askAiAssistant: (message: string, sessionId?: string, imageFile?: File | Blob) => Promise<unknown>,
    getAgentSession: () => Promise<unknown>,
    getChatSession: () => Promise<unknown>,
    createSession: () => Promise<string>,
    currentSessionId: string | null,
    deactivateSession: (sessionId: string) => Promise<void>,
    deactivateAllUserSessions: (userId: string) => Promise<void>,
    // Miscellaneous Activities Session Management
    getMiscActivitiesSession: () => Promise<unknown>,
    createMiscActivitiesSession: () => Promise<string>,
    miscActivitiesSessionId: string | null,
    loadMiscActivitiesMessages: () => Promise<ChatMessage[]>,
    getUserProfile: () => Promise<ProfileInterface | null>,
    createUserProfile: (userData: {
        businessName: string;
        email: string;
        phone: string;
    }) => Promise<ProfileInterface | null>,
    // Message management functions
    saveMessage: (message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>,
    loadMessages: (sessionId: string) => Promise<ChatMessage[]>,
    loadAllUserMessages: () => Promise<ChatMessage[]>,
    deleteMessage: (messageId: string) => Promise<void>,
    // Transaction management functions
    createTransaction: (
        sessionId: string,
        items: TransactionItem[],
        customerInfo?: Transaction['customerInfo'],
        paymentMethod?: Transaction['paymentMethod'],
        notes?: string,
        chatMessages?: ChatMessage[]
    ) => Promise<{ success: boolean; transactionId?: string; error?: string }>,
    getTransactionHistory: (filter?: TransactionFilter) => Promise<Transaction[]>,
    getTransactionById: (transactionId: string) => Promise<Transaction | null>,
    getTransactionSummary: (dateFrom?: Date, dateTo?: Date) => Promise<TransactionSummary | null>,
    updateTransactionStatus: (transactionId: string, status: Transaction['status'], notes?: string) => Promise<boolean>,
    linkTransactionToSession: (transactionId: string, sessionId: string) => Promise<boolean>,
    // Transaction chat functions
    getTransactionChat: (transactionId: string) => Promise<ChatMessage[]>,
    getTransactionChatSummary: (transactionId: string) => Promise<TransactionChatSummary | null>,
    // Notification management functions
    createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>,
    createTransactionNotification: (transaction: Transaction) => Promise<string | null>,
    getNotifications: (filter?: NotificationFilter) => Promise<Notification[]>,
    markNotificationAsRead: (notificationId: string) => Promise<boolean>,
    markAllNotificationsAsRead: () => Promise<boolean>,
    deleteNotification: (notificationId: string) => Promise<boolean>,
    getNotificationSummary: () => Promise<NotificationSummary | null>
}

const DataContext = React.createContext<DataContextInterface>({
    isLoading: true,
    isProductsLoading: false,
    isChatLoading: false,
    error: null,
    inventory: [] as Partial<StockItem>[],
    addNewProduct: async () => {
        return Promise.resolve(null);
    },
    getProduct: async () => {
        return Promise.resolve({})
    },
    getAllProducts: async () => {
        return Promise.resolve({})
    },
    refreshInventory: async () => {
        return Promise.resolve({})
    },
    searchProducts: async () => {
        return Promise.resolve([])
    },
    askAiAssistant: async () => { },
    getAgentSession: async () => { },
    getChatSession: async () => { },
    createSession: async () => Promise.resolve(''),
    currentSessionId: null,
    deactivateSession: async () => Promise.resolve(),
    deactivateAllUserSessions: async () => Promise.resolve(),
    // Miscellaneous Activities Session Management
    getMiscActivitiesSession: async () => { },
    createMiscActivitiesSession: async () => Promise.resolve(''),
    miscActivitiesSessionId: null,
    loadMiscActivitiesMessages: async () => Promise.resolve([]),
    getUserProfile: async () => Promise.resolve(null),
    createUserProfile: async () => Promise.resolve(null),
    // Message management function defaults
    saveMessage: async () => Promise.resolve(''),
    loadMessages: async () => Promise.resolve([]),
    loadAllUserMessages: async () => Promise.resolve([]),
    deleteMessage: async () => Promise.resolve(),
    // Transaction management function defaults
    createTransaction: async () => Promise.resolve({ success: false, error: 'Not implemented' }),
    getTransactionHistory: async () => Promise.resolve([]),
    getTransactionById: async () => Promise.resolve(null),
    getTransactionSummary: async () => Promise.resolve(null),
    updateTransactionStatus: async () => Promise.resolve(false),
    linkTransactionToSession: async () => Promise.resolve(false),
    // Transaction chat function defaults
    getTransactionChat: async () => Promise.resolve([]),
    getTransactionChatSummary: async () => Promise.resolve(null),
    // Notification management function defaults
    createNotification: async () => Promise.resolve(null),
    createTransactionNotification: async () => Promise.resolve(null),
    getNotifications: async () => Promise.resolve([]),
    markNotificationAsRead: async () => Promise.resolve(false),
    markAllNotificationsAsRead: async () => Promise.resolve(false),
    deleteNotification: async () => Promise.resolve(false),
    getNotificationSummary: async () => Promise.resolve(null)
})

export default DataContext;