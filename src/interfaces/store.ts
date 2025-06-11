
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

export interface StoreProfile {
    store_id: string;                    // Unique store identifier
    user_id: string;                     // Owner's user ID (Firebase Auth UID)
    store_name: string;                  // Store display name
    business_type: 'grocery' | 'pharmacy' | 'electronics' | 'clothing' | 'general' | 'other';
    description?: string;                // Store description

    // Location & Contact
    location: {
        country: string;                   // e.g., "Zimbabwe"
        city?: string;                     // e.g., "Harare"
        address?: string;                  // Physical address
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };

    contact?: {
        phone?: string;
        email?: string;
        whatsapp?: string;
    };

    // Business Details
    currency: 'USD' | 'ZIG' | 'ZWL' | string;  // Primary currency
    tax_rate: number;                    // Default tax rate (e.g., 0.05 for 5%)
    business_size: 'small' | 'medium' | 'large';

    // System Fields
    created_at: string;                  // ISO date string
    updated_at: string;                  // ISO date string
    status: 'active' | 'inactive' | 'suspended';

    // Business Profile for AI Enhancement
    industry_profile: {
        common_brands: string[];           // Frequently sold brands
        product_categories: string[];      // Main product categories
        custom_brands?: string[];          // User-added brands
        size_patterns?: string[];          // Common size formats
    };
}