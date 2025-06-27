
export const useOffline = () => {
  // In offline-only mode, we're always "offline" from a network perspective
  // but we have full functionality through SQLite
  return { 
    isOffline: true, 
    isOnline: false 
  };
};
