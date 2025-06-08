
import { ChatMessage, MessageGroup } from "../interfaces/message";
import { getDateString, getDateLabel } from "./dateUtils";

/**
 * Group messages by date for chat display
 */
export const groupMessagesByDate = (messages: ChatMessage[]): MessageGroup[] => {
    if (!messages.length) return [];

    // Sort messages by timestamp chronologically
    const sortedMessages = [...messages].sort((a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime()
    );

    const groupedMessages: { [key: string]: ChatMessage[] } = {};

    // Group messages by date
    sortedMessages.forEach((message) => {
        const dateString = getDateString(message.timestamp);
        if (!groupedMessages[dateString]) {
            groupedMessages[dateString] = [];
        }
        groupedMessages[dateString].push(message);
    });

    // Convert to MessageGroup array and sort by date (oldest first for display)
    const messageGroups: MessageGroup[] = Object.keys(groupedMessages)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // Sort dates ascending
        .map((dateString) => {
            const date = new Date(dateString + 'T00:00:00');
            return {
                date: dateString,
                dateLabel: getDateLabel(date),
                messages: groupedMessages[dateString]
            };
        });

    return messageGroups;
};

/**
 * Merge messages from current session with historical messages
 * Ensures no duplicates and proper chronological order
 */
export const mergeSessionMessages = (
    currentMessages: ChatMessage[],
    historicalMessages: ChatMessage[]
): ChatMessage[] => {
    const messageMap = new Map<string, ChatMessage>();

    // Add historical messages first
    historicalMessages.forEach(msg => {
        if (msg.id) {
            messageMap.set(msg.id, msg);
        }
    });

    // Add/override with current session messages (these are more up-to-date)
    currentMessages.forEach(msg => {
        if (msg.id) {
            messageMap.set(msg.id, msg);
        }
    });

    return Array.from(messageMap.values()).sort((a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime()
    );
};
