import { deactivateAllUserSessions } from './sessionUtils';

/**
 * Session storage keys
 */
const SESSION_KEYS = {
  CURRENT_SESSION_ID: 'currentSessionId',
  MISC_ACTIVITIES_SESSION_ID: 'miscActivitiesSessionId',
  SESSION_EXPIRY: 'sessionExpiry',
} as const;

/**
 * Get current session expiry time (end of current day)
 */
const getSessionExpiry = (): number => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDay.getTime();
};

/**
 * Check if current session has expired
 */
const isSessionExpired = (): boolean => {
  const expiryTime = sessionStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
  if (!expiryTime) return true;

  return Date.now() > parseInt(expiryTime, 10);
};

/**
 * Store session ID with expiry
 */
export const storeSessionId = (sessionId: string, key: string = SESSION_KEYS.CURRENT_SESSION_ID): void => {
  if (typeof window === 'undefined') return;

  const expiryTime = getSessionExpiry();
  sessionStorage.setItem(key, sessionId);
  sessionStorage.setItem(SESSION_KEYS.SESSION_EXPIRY, expiryTime.toString());
};

/**
 * Get session ID if not expired, null otherwise
 */
export const getSessionId = (key: string = SESSION_KEYS.CURRENT_SESSION_ID): string | null => {
  if (typeof window === 'undefined') return null;

  if (isSessionExpired()) {
    clearAllSessions();
    return null;
  }

  return sessionStorage.getItem(key);
};

/**
 * Clear all session data from storage
 */
export const clearAllSessions = (): void => {
  if (typeof window === 'undefined') return;

  Object.values(SESSION_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};

/**
 * Initialize session management with cleanup on expired sessions
 */
export const initializeSessionManagement = async (userId: string): Promise<void> => {
  if (isSessionExpired()) {
    console.log('Session expired, clearing local storage and deactivating server sessions');

    // Clear local storage
    clearAllSessions();

    // Deactivate all server sessions for this user
    try {
      await deactivateAllUserSessions(userId);
    } catch (error) {
      console.error('Error deactivating expired user sessions:', error);
    }
  }
};

/**
 * Session storage utilities for different session types
 */
export const sessionStorageUtils = {
  // Current session (main chat)
  setCurrentSession: (sessionId: string) => storeSessionId(sessionId, SESSION_KEYS.CURRENT_SESSION_ID),
  getCurrentSession: () => getSessionId(SESSION_KEYS.CURRENT_SESSION_ID),

  // Miscellaneous activities session
  setMiscActivitiesSession: (sessionId: string) => storeSessionId(sessionId, SESSION_KEYS.MISC_ACTIVITIES_SESSION_ID),
  getMiscActivitiesSession: () => getSessionId(SESSION_KEYS.MISC_ACTIVITIES_SESSION_ID),

  // Check if sessions are expired
  areSessionsExpired: isSessionExpired,

  // Clear all sessions
  clearAll: clearAllSessions,

  // Initialize with cleanup
  initialize: initializeSessionManagement,
};

/**
 * Logout cleanup - deactivate all sessions
 */
export const logoutCleanup = async (userId: string): Promise<void> => {
  try {
    // Clear local storage
    clearAllSessions();

    // Deactivate all server sessions
    await deactivateAllUserSessions(userId);

    console.log('Logout cleanup completed for user:', userId);
  } catch (error) {
    console.error('Error during logout cleanup:', error);
  }
};
