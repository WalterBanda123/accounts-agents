export interface ChatMessage {
    id?: string;
    profileId: string;
    sessionId: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
    messageOrder: number;
    createdAt?: Date;
    updatedAt?: Date;
    isReceipt?: boolean; // Add this field
    transactionId?: string; // Add this field
    attachment?: {
        type: 'pdf' | 'image' | 'document';
        url: string;
        filename: string;
        size?: number;
    };
    pdfData?: {
        pdf_base64: string;
        pdf_size: number;
        direct_download_url: string;
    };
}

export interface MessageData {
    profileId: string;
    sessionId: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
    messageOrder: number;
    createdAt: Date;
    updatedAt: Date;
    isReceipt?: boolean; // Add this field
    transactionId?: string; // Add this field
}

export interface MessageGroup {
    date: string; // YYYY-MM-DD format
    dateLabel: string; // "Today", "Yesterday", "January 15, 2024"
    messages: ChatMessage[];
}
