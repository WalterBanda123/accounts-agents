import { collection, getDocs } from 'firebase/firestore';
import { fStore } from '../../firebase.config';
import settingsService, { StoreSettingsWithMetadata } from '../services/settingsService';
import { StoreSettings } from '../interfaces/store';

export interface SettingsInitializationResult {
    success: boolean;
    usersProcessed: number;
    errors: string[];
}

export const initializeStoreSettingsCollection = async (): Promise<SettingsInitializationResult> => {
    const result: SettingsInitializationResult = {
        success: true,
        usersProcessed: 0,
        errors: []
    };

    try {
        console.log('Initializing store settings collection...');

        // Get all user profiles to create settings for existing users
        const userProfilesRef = collection(fStore, 'user_profiles');
        const userProfilesSnapshot = await getDocs(userProfilesRef);

        for (const userDoc of userProfilesSnapshot.docs) {
            try {
                const userData = userDoc.data();
                const userId = userData.user_id || userDoc.id;

                // Check if settings already exist
                const existingSettings = await settingsService.getStoreSettings(userId);

                if (!existingSettings) {
                    // Create default settings for this user
                    const defaultSettings = settingsService.getDefaultSettings({
                        name: userData.name,
                        businessName: userData.businessName,
                        phone: userData.phone,
                        email: userData.email
                    });

                    await settingsService.createStoreSettings(userId, defaultSettings);
                    console.log(`Created settings for user: ${userId}`);
                }

                result.usersProcessed++;
            } catch (error) {
                console.error(`Error processing user ${userDoc.id}:`, error);
                result.errors.push(`Failed to process user ${userDoc.id}: ${error}`);
            }
        }

        // Create collection indexes (done automatically by Firestore)
        console.log('Store settings collection initialized successfully');

    } catch (error) {
        console.error('Error initializing store settings collection:', error);
        result.success = false;
        result.errors.push(`Initialization failed: ${error}`);
    }

    return result;
};

// Migrate existing localStorage settings to Firestore
export const migrateLocalStorageSettings = async (userId: string): Promise<boolean> => {
    try {
        // Check if user has settings in localStorage
        const localSettings = localStorage.getItem('userSettings') || localStorage.getItem(`settings_${userId}`);

        if (localSettings) {
            const parsedSettings = JSON.parse(localSettings);

            // Check if settings already exist in Firestore
            const existingSettings = await settingsService.getStoreSettings(userId);

            if (!existingSettings) {
                // Migrate from localStorage to Firestore
                const migratedSettings: StoreSettings = {
                    ...settingsService.getDefaultSettings(),
                    ...parsedSettings
                };

                await settingsService.createStoreSettings(userId, migratedSettings);
                console.log('Settings migrated from localStorage to Firestore');

                // Remove from localStorage after successful migration
                localStorage.removeItem('userSettings');
                localStorage.removeItem(`settings_${userId}`);

                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error migrating localStorage settings:', error);
        return false;
    }
};

// Validate and fix any corrupted settings documents
export const validateAndFixSettingsDocuments = async (): Promise<SettingsInitializationResult> => {
    const result: SettingsInitializationResult = {
        success: true,
        usersProcessed: 0,
        errors: []
    };

    try {
        console.log('Validating and fixing settings documents...');

        const settingsRef = collection(fStore, 'store_settings');
        const settingsSnapshot = await getDocs(settingsRef);

        for (const settingsDoc of settingsSnapshot.docs) {
            try {
                const settingsData = settingsDoc.data() as StoreSettingsWithMetadata;
                const userId = settingsData.user_id || settingsDoc.id;

                // Validate the settings structure
                const validation = settingsService.validateSettings(settingsData);

                if (!validation.isValid) {
                    console.log(`Fixing invalid settings for user ${userId}:`, validation.errors);

                    // Get default settings and merge with existing valid data
                    const defaultSettings = settingsService.getDefaultSettings();
                    const fixedSettings: StoreSettings = {
                        ...defaultSettings,
                        ...settingsData,
                        // Ensure required fields are present
                        storeName: settingsData.storeName || defaultSettings.storeName,
                        storeEmail: settingsData.storeEmail || defaultSettings.storeEmail,
                        primaryCurrency: settingsData.primaryCurrency || defaultSettings.primaryCurrency,
                        secondaryCurrency: settingsData.secondaryCurrency || defaultSettings.secondaryCurrency
                    };

                    // Update the document with fixed settings
                    await settingsService.updateStoreSettings(userId, fixedSettings);
                    console.log(`Fixed settings for user: ${userId}`);
                }

                result.usersProcessed++;
            } catch (error) {
                console.error(`Error validating settings for ${settingsDoc.id}:`, error);
                result.errors.push(`Failed to validate settings for ${settingsDoc.id}: ${error}`);
            }
        }

        console.log('Settings validation and fixing completed');
    } catch (error) {
        console.error('Error during settings validation:', error);
        result.success = false;
        result.errors.push(`Validation failed: ${error}`);
    }

    return result;
};

// Complete initialization workflow
export const initializeCompleteSettingsSystem = async (): Promise<SettingsInitializationResult> => {
    console.log('Starting complete settings system initialization...');

    const result: SettingsInitializationResult = {
        success: true,
        usersProcessed: 0,
        errors: []
    };

    try {
        // Step 1: Initialize collection for existing users
        const initResult = await initializeStoreSettingsCollection();
        result.usersProcessed += initResult.usersProcessed;
        result.errors.push(...initResult.errors);

        // Step 2: Validate and fix any issues
        const validateResult = await validateAndFixSettingsDocuments();
        result.errors.push(...validateResult.errors);

        // Step 3: Set success based on critical errors
        result.success = initResult.success && validateResult.success;

        console.log(`Settings system initialization completed:`, {
            success: result.success,
            usersProcessed: result.usersProcessed,
            errors: result.errors.length
        });

    } catch (error) {
        console.error('Critical error during settings initialization:', error);
        result.success = false;
        result.errors.push(`Critical error: ${error}`);
    }

    return result;
};
