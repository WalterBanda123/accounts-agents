
export interface StoreSettings {
    // Currency Settings
    primaryCurrency: string;
    secondaryCurrency: string;
    showDualCurrency: boolean;
    manualExchangeRate: number;

    // Store Information
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeEmail: string;
    businessLicense: string;

    // Tax Settings
    vatEnabled: boolean;
    vatRate: number;
    vatNumber: string;

    // Receipt Settings
    receiptLogo: boolean;
    receiptFooter: string;
    printReceipts: boolean;
    emailReceipts: boolean;

    // Notification Preferences
    lowStockAlerts: boolean;
    dailyReports: boolean;
    paymentAlerts: boolean;
    systemUpdates: boolean;

    // Display Preferences
    language: string;
    theme: "light" | "dark" | "auto";

    // Security Settings
    requirePin: boolean;
    backupEnabled: boolean;
}