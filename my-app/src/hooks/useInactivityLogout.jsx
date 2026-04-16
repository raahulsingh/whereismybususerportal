import { useEffect } from 'react';

const INACTIVITY_TIME = 10 * 60 * 1000; // 10 minutes
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Automatically calls `onLogout` after the user has been inactive for
 * INACTIVITY_TIME milliseconds. Only active while `user` is truthy.
 *
 * @param {object|null} user   - Current authenticated user (hook is a no-op when null).
 * @param {Function}    onLogout - Callback invoked on inactivity timeout.
 * @param {any}         deps     - Extra dependencies whose closure values must stay fresh (e.g. activePage).
 */
export function useInactivityLogout(user, onLogout, deps = []) {
  useEffect(() => {
    if (!user) return;

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onLogout();
        alert('You have been logged out due to 10 minutes of inactivity.');
      }, INACTIVITY_TIME);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ...deps]);
}
