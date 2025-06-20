/**
 * Debug utilities for session management
 */
export const debugSessionUtils = {
  /**
   * Get session debug information
   */
  getSessionDebugInfo: () => {
    if (typeof window === 'undefined') return null;

    const currentSession = sessionStorage.getItem('currentSessionId');
    const miscSession = sessionStorage.getItem('miscActivitiesSessionId');
    const expiry = sessionStorage.getItem('sessionExpiry');
    const now = Date.now();
    const isExpired = expiry ? now > parseInt(expiry, 10) : true;

    return {
      currentSessionId: currentSession,
      miscActivitiesSessionId: miscSession,
      sessionExpiry: expiry ? new Date(parseInt(expiry, 10)) : null,
      currentTime: new Date(now),
      isExpired,
      timeUntilExpiry: expiry ? Math.max(0, parseInt(expiry, 10) - now) : 0,
    };
  },

  /**
   * Log session debug information to console
   */
  logSessionDebugInfo: () => {
    const info = debugSessionUtils.getSessionDebugInfo();
    console.group('🔐 Session Debug Information');
    console.log('Session Info:', info);
    console.log('SessionStorage Contents:', {
      currentSessionId: sessionStorage.getItem('currentSessionId'),
      miscActivitiesSessionId: sessionStorage.getItem('miscActivitiesSessionId'),
      sessionExpiry: sessionStorage.getItem('sessionExpiry'),
    });
    console.groupEnd();
    return info;
  },

  /**
   * Force expire sessions for testing
   */
  forceExpireSessions: () => {
    if (typeof window === 'undefined') return;

    console.log('🚫 Force expiring sessions for testing');
    sessionStorage.setItem('sessionExpiry', (Date.now() - 1000).toString());
  },

  /**
   * Clear all session data manually
   */
  forceClearSessions: () => {
    if (typeof window === 'undefined') return;

    console.log('🧹 Force clearing all session data');
    sessionStorage.removeItem('currentSessionId');
    sessionStorage.removeItem('miscActivitiesSessionId');
    sessionStorage.removeItem('sessionExpiry');
  }
};

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as typeof window & { debugSessions: typeof debugSessionUtils }).debugSessions = debugSessionUtils;
}
