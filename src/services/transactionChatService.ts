import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { fStore } from '../../firebase.config';
import { ChatMessage } from '../interfaces/message';
import { Transaction } from '../interfaces/transaction';

export interface TransactionChatSummary {
    transactionId: string;
    messageCount: number;
    chatDuration: number; // in minutes
    firstMessage: Date;
    lastMessage: Date;
    userMessageCount: number;
    botMessageCount: number;
}

export const transactionChatService = {
    // Get all chat messages for a specific transaction
    async getTransactionChat(transactionId: string): Promise<ChatMessage[]> {
        try {
            const messagesRef = collection(fStore, 'messages');
            const q = query(
                messagesRef,
                where('transactionId', '==', transactionId),
                where('type', '==', 'transaction_chat'),
                orderBy('messageIndex', 'asc')
            );

            const snapshot = await getDocs(q);
            const messages: ChatMessage[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                messages.push({
                    id: doc.id,
                    profileId: data.profileId,
                    sessionId: data.sessionId,
                    text: data.text,
                    isBot: data.isBot,
                    timestamp: data.timestamp.toDate(),
                    messageOrder: data.messageOrder || data.messageIndex,
                    createdAt: data.createdAt?.toDate() || data.timestamp.toDate(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                });
            });

            console.log(`📞 Retrieved ${messages.length} chat messages for transaction ${transactionId}`);
            return messages;
        } catch (error) {
            console.error('Error getting transaction chat:', error);
            throw error;
        }
    },

    // Get chat summary for a transaction
    async getTransactionChatSummary(transactionId: string): Promise<TransactionChatSummary | null> {
        try {
            const messages = await this.getTransactionChat(transactionId);

            if (messages.length === 0) {
                return null;
            }

            const timestamps = messages.map(m => m.timestamp);
            const firstMessage = new Date(Math.min(...timestamps.map(t => t.getTime())));
            const lastMessage = new Date(Math.max(...timestamps.map(t => t.getTime())));
            const chatDuration = (lastMessage.getTime() - firstMessage.getTime()) / (1000 * 60); // minutes

            return {
                transactionId,
                messageCount: messages.length,
                chatDuration: Math.round(chatDuration * 100) / 100, // Round to 2 decimal places
                firstMessage,
                lastMessage,
                userMessageCount: messages.filter(m => !m.isBot).length,
                botMessageCount: messages.filter(m => m.isBot).length,
            };
        } catch (error) {
            console.error('Error getting transaction chat summary:', error);
            return null;
        }
    },

    // Get all transactions with their chat summaries for a user
    async getUserTransactionsWithChats(userId: string): Promise<Array<Transaction & { chatSummary?: TransactionChatSummary }>> {
        try {
            const transactionsRef = collection(fStore, 'transactions');
            const q = query(
                transactionsRef,
                where('userId', '==', userId),
                orderBy('created_at', 'desc')
            );

            const snapshot = await getDocs(q);
            const transactions: Array<Transaction & { chatSummary?: TransactionChatSummary }> = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const transaction = {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || (data.created_at ? new Date(data.created_at) : new Date()),
                    createdAt: data.createdAt?.toDate() || (data.created_at ? new Date(data.created_at) : new Date()),
                    updatedAt: data.updatedAt?.toDate() || (data.updated_at ? new Date(data.updated_at) : new Date()),
                } as Transaction;

                // Get chat summary if available
                const chatSummary = await this.getTransactionChatSummary(transaction.id!);

                transactions.push({
                    ...transaction,
                    chatSummary: chatSummary || undefined,
                });
            }

            console.log(`📊 Retrieved ${transactions.length} transactions with chat data for user ${userId}`);
            return transactions;
        } catch (error) {
            console.error('Error getting user transactions with chats:', error);
            throw error;
        }
    },

    // Save individual transaction chat message (for real-time saving)
    async saveTransactionChatMessage(
        transactionId: string,
        message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>,
        messageIndex: number
    ): Promise<string> {
        try {
            const messageData = {
                ...message,
                transactionId,
                messageIndex,
                type: 'transaction_chat',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const docRef = await addDoc(collection(fStore, 'messages'), messageData);
            console.log(`💬 Saved transaction chat message ${docRef.id} for transaction ${transactionId}`);

            return docRef.id;
        } catch (error) {
            console.error('Error saving transaction chat message:', error);
            throw error;
        }
    },

    // Export chat to text format for receipts or reports
    exportChatToText(messages: ChatMessage[]): string {
        if (messages.length === 0) {
            return 'No chat messages found.';
        }

        const chatText = messages.map(message => {
            const timestamp = message.timestamp.toLocaleString();
            const sender = message.isBot ? 'Assistant' : 'Customer';
            return `[${timestamp}] ${sender}: ${message.text}`;
        }).join('\n');

        return `Transaction Chat Log\n${'='.repeat(50)}\n\n${chatText}`;
    }
};

export default transactionChatService;
