export interface ProfileInterface {
    id: string; // Required - Firestore document ID
    user_id: string; // Firebase Auth user ID
    businessName: string;
    email: string;
    phone: string;
    profileImage?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
