import { ProfileInterface } from '../interfaces/profile';
import { UserInterface } from '../interfaces/user';

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
