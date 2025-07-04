
export const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const getDateLabel = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = getDateString(date);
    const todayString = getDateString(today);
    const yesterdayString = getDateString(yesterday);

    if (messageDate === todayString) {
        return 'Today';
    } else if (messageDate === yesterdayString) {
        return 'Yesterday';
    } else {
        // Format as "January 15, 2024"
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
};


export const isSameDay = (date1: Date, date2: Date): boolean => {
    return getDateString(date1) === getDateString(date2);
};

/**
 * Get time string for message timestamp
 */
export const getTimeString = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};
