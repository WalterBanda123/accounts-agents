import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { fStore } from "../../firebase.config";

/**
 * Deactivates all active sessions for a given user ID
 * This should be called when a user logs out to prevent session leakage
 */
export const deactivateAllUserSessions = async (userId: string): Promise<void> => {
    try {
        console.log("Deactivating all sessions for user:", userId);

        const sessionsRef = collection(fStore, "sessions");
        const q = query(
            sessionsRef,
            where("profileId", "==", userId),
            where("isActive", "==", true)
        );

        const querySnapshot = await getDocs(q);

        // Deactivate all active sessions for this user
        const updatePromises = querySnapshot.docs.map(doc =>
            updateDoc(doc.ref, {
                isActive: false,
                updatedAt: new Date(),
            })
        );

        await Promise.all(updatePromises);

        console.log(`Deactivated ${querySnapshot.docs.length} sessions for user:`, userId);
    } catch (error) {
        console.error("Error deactivating user sessions:", error);
        throw error;
    }
};
