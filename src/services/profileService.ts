import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { fAuth, fStore } from '../../firebase.config';
import { UserProfile } from '../interfaces/user';
import { Transaction } from '../interfaces/transaction';

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
    },

    // Get user transactions from Firestore
    async getUserTransactions(userId: string): Promise<Transaction[]> {
        try {
            console.log(`🔍 Fetching transactions for user: ${userId}`);

            const transactionsRef = collection(fStore, 'transactions');

            // Try the indexed query first
            try {
                const q = query(
                    transactionsRef,
                    where('userId', '==', userId),
                    orderBy('created_at', 'desc') // Order by most recent first
                );

                const querySnapshot = await getDocs(q);
                const transactions: Transaction[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    transactions.push({
                        id: doc.id,
                        transaction_id: data.transaction_id || doc.id,
                        transactionId: data.transactionId,
                        userId: data.userId,
                        user_id: data.user_id,
                        customer_name: data.customer_name,
                        store_id: data.store_id || 'default_store',
                        storeId: data.storeId,
                        date: data.date || new Date(data.created_at).toISOString().split('T')[0],
                        time: data.time || new Date(data.created_at).toTimeString().split(' ')[0],
                        created_at: data.created_at,
                        sessionId: data.sessionId,
                        chatMessages: data.chatMessages || data.chat_messages || [],
                        customerInfo: data.customerInfo || data.customer_info,
                        items: data.items || [],
                        subtotal: data.subtotal || 0,
                        tax_rate: data.tax_rate || data.taxRate || 0,
                        taxRate: data.taxRate,
                        tax_amount: data.tax_amount || data.tax || 0,
                        tax: data.tax,
                        total: data.total || data.total_amount || 0,
                        payment_method: data.payment_method || data.paymentMethod || 'cash',
                        paymentMethod: data.paymentMethod,
                        change_due: data.change_due,
                        status: data.status || 'completed',
                        notes: data.notes,
                        receiptGenerated: data.receiptGenerated,
                        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                        updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
                        timestamp: data.timestamp ? data.timestamp.toDate() : undefined
                    });
                });

                console.log(`✅ Used indexed query: Found ${transactions.length} transactions for user ${userId}`);
                return transactions;

            } catch (indexError) {
                // Check if it's a missing index error
                if (indexError && typeof indexError === 'object' && 'code' in indexError &&
                    indexError.code === 'failed-precondition') {
                    console.warn('⚠️ Firestore index missing for transactions query. Using fallback (client-side filtering).');
                    console.warn('📋 Create the index here: Check Firebase Console for index creation link');

                    // Fallback: get all transactions for this user without ordering
                    const fallbackQuery = query(
                        transactionsRef,
                        where('userId', '==', userId)
                    );

                    const querySnapshot = await getDocs(fallbackQuery);
                    const transactions: Transaction[] = [];

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        transactions.push({
                            id: doc.id,
                            transaction_id: data.transaction_id || doc.id,
                            transactionId: data.transactionId,
                            userId: data.userId,
                            user_id: data.user_id,
                            customer_name: data.customer_name,
                            store_id: data.store_id || 'default_store',
                            storeId: data.storeId,
                            date: data.date || new Date(data.created_at).toISOString().split('T')[0],
                            time: data.time || new Date(data.created_at).toTimeString().split(' ')[0],
                            created_at: data.created_at,
                            sessionId: data.sessionId,
                            chatMessages: data.chatMessages || data.chat_messages || [],
                            customerInfo: data.customerInfo || data.customer_info,
                            items: data.items || [],
                            subtotal: data.subtotal || 0,
                            tax_rate: data.tax_rate || data.taxRate || 0,
                            taxRate: data.taxRate,
                            tax_amount: data.tax_amount || data.tax || 0,
                            tax: data.tax,
                            total: data.total || data.total_amount || 0,
                            payment_method: data.payment_method || data.paymentMethod || 'cash',
                            paymentMethod: data.paymentMethod,
                            change_due: data.change_due,
                            status: data.status || 'completed',
                            notes: data.notes,
                            receiptGenerated: data.receiptGenerated,
                            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                            updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
                            timestamp: data.timestamp ? data.timestamp.toDate() : undefined
                        });
                    });

                    // Sort by created_at on the client side
                    transactions.sort((a, b) => {
                        const dateA = new Date(a.created_at || 0).getTime();
                        const dateB = new Date(b.created_at || 0).getTime();
                        return dateB - dateA; // Descending order (newest first)
                    });

                    console.log(`⚡ Used fallback query: Found ${transactions.length} transactions (client-side sorted)`);
                    return transactions;
                } else {
                    // Re-throw if it's not an index error
                    throw indexError;
                }
            }
        } catch (error) {
            console.error('Error getting user transactions:', error);
            throw error;
        }
    },

    // Get user transactions with optional filtering and pagination
    async getUserTransactionsFiltered(
        userId: string,
        options?: {
            limit?: number;
            startDate?: string;
            endDate?: string;
            status?: string;
            paymentMethod?: string;
        }
    ): Promise<Transaction[]> {
        try {
            const transactionsRef = collection(fStore, 'transactions');
            let q = query(
                transactionsRef,
                where('userId', '==', userId)
            );

            // Add date filtering if provided
            if (options?.startDate) {
                q = query(q, where('created_at', '>=', options.startDate));
            }
            if (options?.endDate) {
                q = query(q, where('created_at', '<=', options.endDate));
            }

            // Add status filtering if provided
            if (options?.status) {
                q = query(q, where('status', '==', options.status));
            }

            // Add payment method filtering if provided
            if (options?.paymentMethod) {
                q = query(q, where('payment_method', '==', options.paymentMethod));
            }

            // Always order by created_at desc and limit if specified
            q = query(q, orderBy('created_at', 'desc'));
            if (options?.limit) {
                q = query(q, limit(options.limit));
            }

            const querySnapshot = await getDocs(q);
            const transactions: Transaction[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                transactions.push({
                    id: doc.id,
                    transaction_id: data.transaction_id || doc.id,
                    transactionId: data.transactionId,
                    userId: data.userId,
                    user_id: data.user_id,
                    customer_name: data.customer_name,
                    store_id: data.store_id || 'default_store',
                    storeId: data.storeId,
                    date: data.date || new Date(data.created_at).toISOString().split('T')[0],
                    time: data.time || new Date(data.created_at).toTimeString().split(' ')[0],
                    created_at: data.created_at,
                    sessionId: data.sessionId,
                    chatMessages: data.chatMessages || data.chat_messages || [],
                    customerInfo: data.customerInfo || data.customer_info,
                    items: data.items || [],
                    subtotal: data.subtotal || 0,
                    tax_rate: data.tax_rate || data.taxRate || 0,
                    taxRate: data.taxRate,
                    tax_amount: data.tax_amount || data.tax || 0,
                    tax: data.tax,
                    total: data.total || data.total_amount || 0,
                    payment_method: data.payment_method || data.paymentMethod || 'cash',
                    paymentMethod: data.paymentMethod,
                    change_due: data.change_due,
                    status: data.status || 'completed',
                    notes: data.notes,
                    receiptGenerated: data.receiptGenerated,
                    createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                    updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
                    timestamp: data.timestamp ? data.timestamp.toDate() : undefined
                });
            });

            console.log(`Found ${transactions.length} filtered transactions for user ${userId}`);
            return transactions;
        } catch (error) {
            console.error('Error getting filtered user transactions:', error);
            throw error;
        }
    },

    // Get transaction count for user
    async getUserTransactionCount(userId: string): Promise<number> {
        try {
            const transactionsRef = collection(fStore, 'transactions');
            const q = query(
                transactionsRef,
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error('Error getting user transaction count:', error);
            throw error;
        }
    }
};

export default profileService;
