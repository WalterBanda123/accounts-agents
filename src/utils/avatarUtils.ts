// Avatar utility functions for generating user/store avatars

export const AVATAR_COLORS = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#34495e', // Dark Blue
    '#e67e22', // Carrot
    '#95a5a6', // Gray
    '#f1c40f', // Yellow
    '#8e44ad', // Dark Purple
    '#16a085', // Dark Turquoise
    '#27ae60', // Dark Green
    '#d35400', // Dark Orange
    '#c0392b', // Dark Red
    '#2980b9', // Darker Blue
];

/**
 * Generate initials from a name or store name
 */
export const generateInitials = (name: string): string => {
    if (!name) return 'U';

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        // Single word: take first two characters
        return words[0].substring(0, 2).toUpperCase();
    } else {
        // Multiple words: take first character of first two words
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
};

/**
 * Generate a consistent color based on user ID or name
 */
export const generateAvatarColor = (seed: string): string => {
    if (!seed) return AVATAR_COLORS[0];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

/**
 * Generate avatar data for a user
 */
export const generateUserAvatar = (userId: string, name: string) => {
    return {
        initials: generateInitials(name),
        color: generateAvatarColor(userId),
    };
};

/**
 * Generate avatar data for a store
 */
export const generateStoreAvatar = (storeId: string, storeName: string) => {
    return {
        initials: generateInitials(storeName),
        color: generateAvatarColor(storeId),
    };
};

/**
 * Get a random color (for user customization)
 */
export const getRandomAvatarColor = (): string => {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};
