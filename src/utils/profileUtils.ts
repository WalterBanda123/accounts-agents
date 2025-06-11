import { ProfileInterface } from '../interfaces/profile';
import { UserInterface } from '../interfaces/user';
import { UserProfile } from '../interfaces/user';
import { StoreProfile } from '../interfaces/store';

export const createProfileFromUser = (user: UserInterface): Omit<ProfileInterface, 'id'> => {
    return {
        user_id: user.id,
        businessName: user.businessName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

export const ensureUserProfileExists = async (
    getUserProfile: () => Promise<ProfileInterface | null>,
    createUserProfile: (userData: { businessName: string; email: string; phone: string }) => Promise<ProfileInterface | null>,
    user: UserInterface | null
): Promise<ProfileInterface | null> => {
    if (!user) {
        throw new Error("User not authenticated");
    }

    // Check if profile exists
    let profile = await getUserProfile();

    if (!profile) {
        // Create profile if it doesn't exist
        profile = await createUserProfile({
            businessName: user.businessName,
            email: user.email,
            phone: user.phone,
        });
    }

    return profile;
};

export interface ProfileCompletionStatus {
    isUserProfileComplete: boolean;
    isStoreProfileComplete: boolean;
    isFullyComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
}

/**
 * Check if user has completed their profile setup
 */
export const checkProfileCompletion = (
    userProfile: UserProfile | null,
    storeProfile: StoreProfile | null
): ProfileCompletionStatus => {
    const missingFields: string[] = [];
    let completedFields = 0;
    const totalFields = 12; // Total important fields to track

    // Check User Profile completion
    const isUserProfileComplete = !!(
        userProfile?.name &&
        userProfile?.email &&
        userProfile?.country &&
        userProfile?.language_preference &&
        userProfile?.preferred_currency
    );

    if (!userProfile?.name) missingFields.push('Full Name');
    if (!userProfile?.country) missingFields.push('Country');
    if (!userProfile?.language_preference) missingFields.push('Language Preference');
    if (!userProfile?.preferred_currency) missingFields.push('Preferred Currency');

    // Count completed user fields
    if (userProfile?.name) completedFields++;
    if (userProfile?.email) completedFields++;
    if (userProfile?.country) completedFields++;
    if (userProfile?.language_preference) completedFields++;
    if (userProfile?.preferred_currency) completedFields++;
    if (userProfile?.phone) completedFields++;

    // Check Store Profile completion
    const isStoreProfileComplete = !!(
        storeProfile?.store_name &&
        storeProfile?.business_type &&
        storeProfile?.location?.country &&
        storeProfile?.currency &&
        storeProfile?.business_size
    );

    if (!storeProfile?.store_name) missingFields.push('Store Name');
    if (!storeProfile?.business_type) missingFields.push('Business Type');
    if (!storeProfile?.location?.country) missingFields.push('Store Location');
    if (!storeProfile?.currency) missingFields.push('Store Currency');
    if (!storeProfile?.business_size) missingFields.push('Business Size');

    // Count completed store fields
    if (storeProfile?.store_name) completedFields++;
    if (storeProfile?.business_type) completedFields++;
    if (storeProfile?.location?.country) completedFields++;
    if (storeProfile?.currency) completedFields++;
    if (storeProfile?.business_size) completedFields++;
    if (storeProfile?.contact?.phone) completedFields++;

    const isFullyComplete = isUserProfileComplete && isStoreProfileComplete;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
        isUserProfileComplete,
        isStoreProfileComplete,
        isFullyComplete,
        completionPercentage,
        missingFields,
    };
};

/**
 * Check if this is a new user (recently registered)
 */
export const isNewUser = (userProfile: UserProfile | null): boolean => {
    if (!userProfile?.created_at) return true;

    const createdDate = new Date(userProfile.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    // Consider user "new" if they registered within the last 7 days
    return daysDiff <= 7;
};

/**
 * Get profile setup progress message
 */
export const getProfileSetupMessage = (
    completionStatus: ProfileCompletionStatus,
    isNew: boolean
): string => {
    if (completionStatus.isFullyComplete) {
        return isNew ? "Welcome! Your profile setup is complete." : "";
    }

    if (completionStatus.completionPercentage === 0) {
        return "Complete your profile setup to get the most out of Account Manager!";
    }

    if (completionStatus.completionPercentage < 50) {
        return `Your profile is ${completionStatus.completionPercentage}% complete. Let's finish setting it up!`;
    }

    return `Almost done! Your profile is ${completionStatus.completionPercentage}% complete.`;
};
