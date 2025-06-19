// Avatar utility functions

export const AVATAR_COLORS = [
  '#3498db', // Blue
  '#e74c3c', // Red  
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#34495e', // Dark Blue
  '#e67e22', // Dark Orange
];

export const generateUserAvatar = (userId: string, userName: string) => {
  const colorIndex = Math.abs(hashCode(userId)) % AVATAR_COLORS.length;
  const initials = getInitials(userName);

  return {
    initials,
    color: AVATAR_COLORS[colorIndex],
  };
};

export const getInitials = (name: string): string => {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
};
