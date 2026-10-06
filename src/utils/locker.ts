// Unified Content Locker Controller (Completely Deactivated)
// Ensures movies, TV series, and anime play instantly with 0% locker interruption or popups

export const CURRENT_LOCKER_ID = '';

export const getActiveLockerId = (): string => {
  return '';
};

// Detect mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
};

// All media is permanently unlocked
export const isMediaUnlocked = (_mediaId?: number): boolean => {
  return true;
};

export const markMediaUnlocked = (_mediaId?: number): void => {
  // no-op: always unlocked
};

export const subscribeToLockerUnlock = (callback: () => void): (() => void) => {
  // Immediately call callback once
  try {
    callback();
  } catch {
    // ignore
  }
  return () => {};
};

export const subscribeToLockerModal = (_callback: (isOpen: boolean) => void): (() => void) => {
  return () => {};
};

export const openLockerModal = (_provider?: string): void => {
  // Deactivated: never open any locker modal
};

export const closeLockerModal = (): void => {
  // no-op
};

export const handleLockerCompletion = () => {
  // no-op
};

export const ensureAdBlueMediaLoaded = () => {
  // Deactivated
};

export const hookAdBlueMediaCallbacks = () => {
  // Deactivated
};

export const triggerAdBlueMediaLocker = (): boolean => {
  return false;
};

export const triggerNativeOGAdsLocker = (): boolean => {
  return false;
};

export const triggerActiveLocker = (): boolean => {
  return false;
};
