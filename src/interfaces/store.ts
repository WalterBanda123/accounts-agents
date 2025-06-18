export interface StoreProfile {
    store_id: string;
    user_id: string; // Links to user profile
    store_name: string;
    business_type: string;
    business_size: "small" | "medium" | "large";
    currency: string;
    tax_rate: number;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
    location: {
        address: string;
        city: string;
        country: string;
    };
    contact: {
        phone: string;
        email: string;
    };
    industry_profile: {
        product_categories: string[];
        common_brands: string[];
    };
}

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