// User Profile Service for Firestore operations
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import { fStore } from '../../firebase.config';
import { UserProfile } from '../interfaces/user';
import { StoreProfile } from '../interfaces/store';

const USER_PROFILES_COLLECTION = 'user_profiles';
const STORE_PROFILES_COLLECTION = 'store_profiles';

/**
 * Save or update user profile to Firestore
 */
export const saveUserProfile = async (userProfile: UserProfile): Promise<void> => {
    try {
        const userDocRef = doc(fStore, USER_PROFILES_COLLECTION, userProfile.user_id);

        const profileData = {
            ...userProfile,
            updated_at: serverTimestamp(),
        };

        await setDoc(userDocRef, profileData, { merge: true });
        console.log('User profile saved to Firestore:', userProfile.user_id);
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
};


export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const userDocRef = doc(fStore, USER_PROFILES_COLLECTION, userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            return { user_id: userId, ...docSnap.data() } as UserProfile;
        }

        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};


export const saveStoreProfile = async (storeProfile: StoreProfile): Promise<void> => {
    try {
        const storeDocRef = doc(fStore, STORE_PROFILES_COLLECTION, storeProfile.user_id);

        const profileData = {
            ...storeProfile,
            updated_at: serverTimestamp(),
        };

        await setDoc(storeDocRef, profileData, { merge: true });
        console.log('Store profile saved to Firestore:', storeProfile.user_id);
    } catch (error) {
        console.error('Error saving store profile:', error);
        throw error;
    }
};


export const getStoreProfile = async (userId: string): Promise<StoreProfile | null> => {
    try {
        const storeDocRef = doc(fStore, STORE_PROFILES_COLLECTION, userId);
        const docSnap = await getDoc(storeDocRef);

        if (docSnap.exists()) {
            return { user_id: userId, ...docSnap.data() } as StoreProfile;
        }

        return null;
    } catch (error) {
        console.error('Error getting store profile:', error);
        return null;
    }
};

export const userProfileExists = async (userId: string): Promise<boolean> => {
    try {
        const userDocRef = doc(fStore, USER_PROFILES_COLLECTION, userId);
        const docSnap = await getDoc(userDocRef);
        return docSnap.exists();
    } catch (error) {
        console.error('Error checking user profile existence:', error);
        return false;
    }
};
