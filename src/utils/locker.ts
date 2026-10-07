// Unified Content Locker Controller for BleuStream
// Supports: OGAds and AdBlueMedia (CPABuild) with real-time switching from Admin Panel
// Full support for delay timers (e.g. 10s, 15s) and Play button triggers

import { lockerConfig } from '../services/lockerConfig';

declare global {
  interface Window {
    LAST?: () => void;
    og_load?: (options?: Record<string, unknown>) => void;
    call_locker?: (options?: Record<string, unknown>) => void;
    og_call?: (options?: Record<string, unknown>) => void;
    ogblock?: boolean;
    og_completed?: () => void;
    og_unlock?: () => void;
    onOGAdsComplete?: () => void;

    // AdBlueMedia / CPABuild globals & recall methods
    _Ri?: () => void;
    _Rw?: () => void;
    _cl?: () => void;
    CPABuildLock?: () => void;
    CPABuildUnlock?: () => void;
    CPABuildComplete?: () => void;
    xfLock?: () => void;
    xfUnlock?: () => void;
    xfComplete?: () => void;
    CPABUILDSETTINGS?: Record<string, unknown>;
    [key: string]: unknown;
  }
}

export const getActiveLockerId = (): string => {
  const id = lockerConfig.get().lockerId?.trim();
  return id || '4o7vvr';
};

export const CURRENT_LOCKER_ID = '4o7vvr';

// Detect mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
};

// Set of registered unlock listeners (CinemaPlayer etc.)
const unlockListeners = new Set<() => void>();

// Set of registered modal open/close listeners
const modalListeners = new Set<(isOpen: boolean, provider?: 'ogads' | 'adbluemedia') => void>();

export const isMediaUnlocked = (mediaId?: number): boolean => {
  if (typeof window === 'undefined' || !mediaId) return false;
  try {
    const cfg = lockerConfig.get();
    if (cfg.triggerMode === 'once_per_session') {
      return sessionStorage.getItem('bleustream_session_unlocked') === 'true';
    }
    return sessionStorage.getItem(`unlocked_${mediaId}`) === 'true';
  } catch {
    return false;
  }
};

export const markMediaUnlocked = (mediaId?: number): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('bleustream_session_unlocked', 'true');
    if (mediaId) {
      sessionStorage.setItem(`unlocked_${mediaId}`, 'true');
    }
  } catch {
    // ignore
  }
  unlockListeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.warn('Unlock listener callback error:', err);
    }
  });
};

export const subscribeToLockerUnlock = (callback: () => void): (() => void) => {
  unlockListeners.add(callback);
  return () => {
    unlockListeners.delete(callback);
  };
};

export const subscribeToLockerModal = (
  callback: (isOpen: boolean, provider?: 'ogads' | 'adbluemedia') => void
): (() => void) => {
  modalListeners.add(callback);
  return () => {
    modalListeners.delete(callback);
  };
};

export const openLockerModal = (provider: 'ogads' | 'adbluemedia' = 'adbluemedia'): void => {
  modalListeners.forEach((cb) => {
    try {
      cb(true, provider);
    } catch (err) {
      console.warn('Error opening locker modal:', err);
    }
  });
};

export const closeLockerModal = (): void => {
  modalListeners.forEach((cb) => {
    try {
      cb(false);
    } catch (err) {
      console.warn('Error closing locker modal:', err);
    }
  });
};

export const handleLockerCompletion = () => {
  closeLockerModal();
  unlockListeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.warn('Error in completion hook:', err);
    }
  });
};

// ==========================================
// AdBlueMedia (CPABuild) Integration
// ==========================================
export const ensureAdBlueMediaLoaded = () => {
  if (typeof window === 'undefined') return;

  const cfg = lockerConfig.get();
  const { it, key, scriptUrl, varName } = cfg.adBlueMedia;

  const targetVarName = varName?.trim() || 'glNky_Esd_BTYEuc';
  const numericIt = typeof it === 'string' ? parseInt(it, 10) || 4192251 : it || 4192251;
  const settingsObj = {
    it: numericIt,
    key: key?.trim() || 'db00c',
  };

  window['CPABUILDSETTINGS'] = settingsObj;
  window[targetVarName] = settingsObj;

  const targetScriptSrc = scriptUrl?.trim() || 'https://d1chbu4sfo2xhu.cloudfront.net/5c85a0f.js';
  const existingScript = document.getElementById('adbluemedia-cdn-script') as HTMLScriptElement | null;

  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'adbluemedia-cdn-script';
    script.type = 'text/javascript';
    script.src = targetScriptSrc;
    script.async = true;
    script.onload = () => {
      hookAdBlueMediaCallbacks();
    };
    script.onerror = () => {
      console.warn('AdBlueMedia CDN script load error. Direct iframe will be used.');
    };
    document.head.appendChild(script);
  }

  hookAdBlueMediaCallbacks();
};

export const hookAdBlueMediaCallbacks = () => {
  if (typeof window === 'undefined') return;
  window.CPABuildComplete = handleLockerCompletion;
  window.CPABuildUnlock = handleLockerCompletion;
  window.xfComplete = handleLockerCompletion;
  window.xfUnlock = handleLockerCompletion;
};

// Trigger AdBlueMedia
export const triggerAdBlueMediaLocker = (): boolean => {
  if (typeof window === 'undefined') return false;

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  ensureAdBlueMediaLoaded();

  const cfg = lockerConfig.get();
  const recallFuncName = cfg.adBlueMedia.recallFunc?.trim() || '_Ri';

  // Try CPABuildLock / xfLock native methods
  if (typeof window.CPABuildLock === 'function') {
    try {
      window.CPABuildLock();
    } catch (err) {
      console.warn('CPABuildLock error:', err);
    }
  } else if (typeof window.xfLock === 'function') {
    try {
      window.xfLock();
    } catch (err) {
      console.warn('xfLock error:', err);
    }
  }

  // Try calling native recall function if available (e.g. _Ri)
  const customFunc = window[recallFuncName];
  if (typeof customFunc === 'function') {
    try {
      customFunc();
    } catch (err) {
      console.warn(`Error running ${recallFuncName}():`, err);
    }
  }

  // Always open modal to ensure prompt is visible to user
  openLockerModal('adbluemedia');
  return true;
};

// Trigger OGAds
export const triggerNativeOGAdsLocker = (): boolean => {
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  openLockerModal('ogads');
  return true;
};

// Multi-Network Rotation State
let multiRotationTurn: 'adbluemedia' | 'ogads' = 'adbluemedia';

// Unified Dispatcher: Trigger Active Locker
export const triggerActiveLocker = (): boolean => {
  const cfg = lockerConfig.get();
  if (!cfg.enabled) {
    console.log('[BleuStream Locker] Locker disabled in Admin settings (enabled: false)');
    return false;
  }

  console.log('[BleuStream Locker] Dispatching locker for provider:', cfg.provider);

  if (cfg.provider === 'adbluemedia') {
    return triggerAdBlueMediaLocker();
  }

  if (cfg.provider === 'ogads') {
    return triggerNativeOGAdsLocker();
  }

  if (cfg.provider === 'both') {
    const turn = multiRotationTurn;
    multiRotationTurn = turn === 'adbluemedia' ? 'ogads' : 'adbluemedia';
    console.log('[BleuStream Locker] Multi-Rotation active turn:', turn);
    if (turn === 'adbluemedia') {
      return triggerAdBlueMediaLocker();
    } else {
      return triggerNativeOGAdsLocker();
    }
  }

  return false;
};

// Global event listeners for completion
if (typeof window !== 'undefined') {
  window.og_completed = handleLockerCompletion;
  window.og_unlock = handleLockerCompletion;
  window.onOGAdsComplete = handleLockerCompletion;

  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (
        data?.type === 'ogads_complete' ||
        data?.type === 'lead_complete' ||
        data?.type === 'og_unlock' ||
        data?.type === 'conversion_complete' ||
        data?.type === 'cpa_lead' ||
        data?.type === 'cpabuild_lead' ||
        data?.type === 'adbluemedia_complete' ||
        data?.event === 'unlock' ||
        data?.action === 'close_locker'
      ) {
        handleLockerCompletion();
      }
    } catch {
      // not JSON
    }
  });
}
