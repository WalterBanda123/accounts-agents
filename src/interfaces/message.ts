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
