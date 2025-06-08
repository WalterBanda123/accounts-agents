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
}

export interface MessageGroup {
    date: string; // YYYY-MM-DD format
    dateLabel: string; // "Today", "Yesterday", "January 15, 2024"
    messages: ChatMessage[];
}
