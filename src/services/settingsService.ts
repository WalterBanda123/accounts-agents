import { doc, setDoc, getDoc } from 'firebase/firestore';
import { fStore } from '../../firebase.config';
import { StoreSettings } from '../interfaces/store';

export interface StoreSettingsWithMetadata extends StoreSettings {
    user_id: string;
    created_at: string;
    updated_at: string;
}

export const settingsService = {
    // Get store settings from Firestore
    async getStoreSettings(userId: string): Promise<StoreSettings | null> {
        try {
            const docRef = doc(fStore, 'store_settings', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as StoreSettingsWithMetadata;
                // Remove metadata fields before returning
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { user_id, created_at, updated_at, ...settings } = data;
                return settings;
            } else {
                console.log('No store settings found');
                return null;
            }
        } catch (error) {
            console.error('Error getting store settings:', error);
            throw error;
        }
    },

    // Create or update store settings in Firestore
    async updateStoreSettings(userId: string, settings: StoreSettings): Promise<boolean> {
        try {
            const docRef = doc(fStore, 'store_settings', userId);

            // Add metadata
            const settingsWithMetadata: StoreSettingsWithMetadata = {
                ...settings,
                user_id: userId,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString() // Will be overridden if document exists
            };

            // Check if settings already exist to preserve created_at
            const currentSettings = await this.getStoreSettings(userId);
            if (currentSettings) {
                // Get the existing created_at timestamp
                const existingDoc = await getDoc(docRef);
                if (existingDoc.exists()) {
                    const existingData = existingDoc.data() as StoreSettingsWithMetadata;
                    settingsWithMetadata.created_at = existingData.created_at;
                }
            }

            await setDoc(docRef, settingsWithMetadata, { merge: true });

            console.log('Store settings updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating store settings:', error);
            throw error;
        }
    },

    // Create initial store settings
    async createStoreSettings(userId: string, settings: StoreSettings): Promise<boolean> {
        try {
            const settingsWithMetadata: StoreSettingsWithMetadata = {
                ...settings,
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const docRef = doc(fStore, 'store_settings', userId);
            await setDoc(docRef, settingsWithMetadata);

            console.log('Store settings created successfully');
            return true;
        } catch (error) {
            console.error('Error creating store settings:', error);
            throw error;
        }
    },

    // Get default settings for new users
    getDefaultSettings(user?: { name?: string; businessName?: string; phone?: string; email?: string }): StoreSettings {
        return {
            // Currency Settings
            primaryCurrency: "USD",
            secondaryCurrency: "ZWL",
            manualExchangeRate: 5000,
            showDualCurrency: true,

            // Store Information
            storeName: user?.businessName || user?.name || "My Store",
            storeAddress: "123 Main Street, Harare, Zimbabwe",
            storePhone: user?.phone || "+263 77 123 4567",
            storeEmail: user?.email || "store@example.com",
            businessLicense: "",

            // Tax Settings
            vatEnabled: true,
            vatRate: 14.5,
            vatNumber: "",

            // Receipt Settings
            receiptLogo: true,
            receiptFooter: "Thank you for shopping with us!",
            printReceipts: true,
            emailReceipts: false,

            // Notification Preferences
            lowStockAlerts: true,
            dailyReports: true,
            paymentAlerts: true,
            systemUpdates: false,

            // Display Preferences
            language: "en",
            theme: "auto",

            // Security Settings
            requirePin: false,
            backupEnabled: true,
        };
    },

    // Initialize store settings collection structure
    async initializeStoreSettingsCollection(): Promise<void> {
        console.log('Store settings collection will be created automatically when first document is added');
    },

    // Validate settings structure before saving
    validateSettings(settings: StoreSettings): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields validation
        if (!settings.storeName || settings.storeName.trim() === '') {
            errors.push('Store name is required');
        }

        if (!settings.storeEmail || !this.isValidEmail(settings.storeEmail)) {
            errors.push('Valid store email is required');
        }

        if (settings.vatRate < 0 || settings.vatRate > 100) {
            errors.push('VAT rate must be between 0 and 100');
        }

        if (settings.manualExchangeRate <= 0) {
            errors.push('Exchange rate must be greater than 0');
        }

        // Currency validation
        const validCurrencies = ['USD', 'ZWL', 'EUR', 'GBP', 'ZAR', 'BWP'];
        if (!validCurrencies.includes(settings.primaryCurrency)) {
            errors.push('Invalid primary currency');
        }

        if (!validCurrencies.includes(settings.secondaryCurrency)) {
            errors.push('Invalid secondary currency');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Email validation helper
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Backup current settings to local storage
    async backupSettingsLocally(userId: string, settings: StoreSettings): Promise<void> {
        try {
            const backup = {
                userId,
                settings,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(`store_settings_backup_${userId}`, JSON.stringify(backup));
            console.log('Settings backed up locally');
        } catch (error) {
            console.error('Error backing up settings locally:', error);
        }
    },

    // Restore settings from local storage backup
    async restoreSettingsFromBackup(userId: string): Promise<StoreSettings | null> {
        try {
            const backupData = localStorage.getItem(`store_settings_backup_${userId}`);
            if (backupData) {
                const backup = JSON.parse(backupData);
                return backup.settings;
            }
            return null;
        } catch (error) {
            console.error('Error restoring settings from backup:', error);
            return null;
        }
    },

    // Enhanced update method with validation and backup
    async updateStoreSettingsWithValidation(userId: string, settings: StoreSettings): Promise<{ success: boolean; errors?: string[] }> {
        // Validate settings first
        const validation = this.validateSettings(settings);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        try {
            // Backup current settings locally before updating
            await this.backupSettingsLocally(userId, settings);

            // Update in Firestore
            const success = await this.updateStoreSettings(userId, settings);
            
            return {
                success
            };
        } catch (error) {
            console.error('Error updating settings:', error);
            return {
                success: false,
                errors: ['Failed to save settings to database']
            };
        }
    },

    // Get settings with fallback to backup
    async getStoreSettingsWithFallback(userId: string): Promise<StoreSettings | null> {
        try {
            // Try to get from Firestore first
            const settings = await this.getStoreSettings(userId);
            if (settings) {
                return settings;
            }

            // Fallback to local backup
            console.log('No settings found in database, trying local backup...');
            return await this.restoreSettingsFromBackup(userId);
        } catch (error) {
            console.error('Error getting settings, trying backup:', error);
            return await this.restoreSettingsFromBackup(userId);
        }
    },
};

export default settingsService;
