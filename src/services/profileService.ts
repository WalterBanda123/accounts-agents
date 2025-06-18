import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { fAuth, fStore } from '../../firebase.config';
import { UserProfile } from '../interfaces/user';

export const profileService = {
    // Get user profile from Firestore
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const docRef = doc(fStore, 'user_profiles', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as UserProfile;
            } else {
                console.log('No user profile found');
                return null;
            }
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    },

    // Create or update user profile in Firestore
    async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<boolean> {
        try {
            const docRef = doc(fStore, 'user_profiles', userId);

            // Add timestamp
            const updatedProfile = {
                ...profileData,
                user_id: userId,
                updated_at: new Date().toISOString()
            };

            // If created_at doesn't exist, add it
            const currentProfile = await this.getUserProfile(userId);
            if (!currentProfile?.created_at) {
                updatedProfile.created_at = new Date().toISOString();
            }

            await setDoc(docRef, updatedProfile, { merge: true });

            // Also update Firebase Auth profile if name changed
            if (profileData.name && fAuth.currentUser) {
                await updateProfile(fAuth.currentUser, {
                    displayName: profileData.name
                });
            }

            console.log('Profile updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    // Create initial user profile
    async createUserProfile(userId: string, profileData: Omit<UserProfile, 'user_id' | 'created_at'>): Promise<boolean> {
        try {
            const fullProfile: UserProfile = {
                ...profileData,
                user_id: userId,
                created_at: new Date().toISOString()
            };

            const docRef = doc(fStore, 'user_profiles', userId);
            await setDoc(docRef, fullProfile);

            console.log('User profile created successfully');
            return true;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    },

    // Delete user profile
    async deleteUserProfile(userId: string): Promise<boolean> {
        try {
            const docRef = doc(fStore, 'user_profiles', userId);
            await updateDoc(docRef, {
                status: 'deleted',
                deleted_at: new Date().toISOString()
            });

            console.log('User profile deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting user profile:', error);
            throw error;
        }
    }
};

export default profileService;
