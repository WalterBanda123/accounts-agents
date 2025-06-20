import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { fStore } from "../../firebase.config";

/**
 * Debug utility to check transactions in Firestore
 */
export const debugTransactions = async (userId: string) => {
  console.log("🔍 DEBUG: Checking transactions for user:", userId);
  
  try {
    const transactionsRef = collection(fStore, "transactions");
    
    // Check transactions with userId field
    const userIdQuery = query(transactionsRef, where("userId", "==", userId), limit(10));
    const userIdSnapshot = await getDocs(userIdQuery);
    
    console.log(`🔍 Found ${userIdSnapshot.size} transactions with userId field`);
    userIdSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 Transaction with userId:", {
        id: doc.id,
        userId: data.userId,
        user_id: data.user_id,
        transaction_id: data.transaction_id,
        created_at: data.created_at,
        total: data.total
      });
    });
    
    // Check transactions with legacy user_id field
    const legacyUserIdQuery = query(transactionsRef, where("user_id", "==", userId), limit(10));
    const legacySnapshot = await getDocs(legacyUserIdQuery);
    
    console.log(`🔍 Found ${legacySnapshot.size} transactions with legacy user_id field`);
    legacySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 Transaction with user_id:", {
        id: doc.id,
        userId: data.userId,
        user_id: data.user_id,
        transaction_id: data.transaction_id,
        created_at: data.created_at,
        total: data.total
      });
    });
    
    // Check all transactions (sample)
    const allQuery = query(transactionsRef, limit(5));
    const allSnapshot = await getDocs(allQuery);
    
    console.log(`🔍 Sample of all transactions in database (${allSnapshot.size}):`);
    allSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📄 Sample transaction:", {
        id: doc.id,
        userId: data.userId,
        user_id: data.user_id,
        transaction_id: data.transaction_id,
        created_at: data.created_at,
        total: data.total
      });
    });
    
  } catch (error) {
    console.error("❌ Error debugging transactions:", error);
  }
};

/**
 * Check what fields exist in existing transactions
 */
export const analyzeTransactionFields = async () => {
  console.log("🔍 ANALYZING: Transaction field patterns");
  
  try {
    const transactionsRef = collection(fStore, "transactions");
    const sampleQuery = query(transactionsRef, limit(10));
    const snapshot = await getDocs(sampleQuery);
    
    const fieldCounts = {
      userId: 0,
      user_id: 0,
      transactionId: 0,
      transaction_id: 0,
      total: 0
    };
    
    console.log(`📊 Analyzing ${snapshot.size} transactions:`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      if (data.userId) fieldCounts.userId++;
      if (data.user_id) fieldCounts.user_id++;
      if (data.transactionId) fieldCounts.transactionId++;
      if (data.transaction_id) fieldCounts.transaction_id++;
      if (data.total) fieldCounts.total++;
      
      console.log(`📄 Transaction ${doc.id} fields:`, {
        hasUserId: !!data.userId,
        hasUser_id: !!data.user_id,
        hasTransactionId: !!data.transactionId,
        hasTransaction_id: !!data.transaction_id,
        userIdValue: data.userId,
        user_idValue: data.user_id
      });
    });
    
    console.log("📊 Field usage summary:", fieldCounts);
    
  } catch (error) {
    console.error("❌ Error analyzing transaction fields:", error);
  }
};
