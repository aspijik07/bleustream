// Unified Content Locker Controller
// Supports: OGAds and AdBlueMedia (CPABuild) with real-time switching from Admin Panel
// Recall: Calls window._Ri() for AdBlueMedia on Play Triangle (▶) click or delay timer

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
    _ogadsIframeSeen?: boolean;

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
    [key: string]: unknown;
  }
}

// Get currently configured OGAds locker ID - always reads fresh from admin config
export const getActiveLockerId = (): string => {
  const id = lockerConfig.get().lockerId?.trim();
  return (id && id !== 'o4e5p2') ? id : '4o7vvr';
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

// Set of registered modal open/close listeners for mobile modal
const modalListeners = new Set<(isOpen: boolean) => void>();

export const isMediaUnlocked = (mediaId: number): boolean => {
  try {
    return sessionStorage.getItem(`unlocked_${mediaId}`) === 'true';
  } catch {
    return false;
  }
};

export const markMediaUnlocked = (mediaId: number): void => {
  try {
    sessionStorage.setItem(`unlocked_${mediaId}`, 'true');
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

export const subscribeToLockerModal = (callback: (isOpen: boolean) => void): (() => void) => {
  modalListeners.add(callback);
  return () => {
    modalListeners.delete(callback);
  };
};

export const openLockerModal = (): void => {
  modalListeners.forEach((cb) => {
    try {
      cb(true);
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

// Common completion handler for either OGAds or AdBlueMedia
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
let isAdBlueMediaScriptInjected = false;

export const ensureAdBlueMediaLoaded = () => {
  if (typeof window === 'undefined') return;

  const cfg = lockerConfig.get();
  const { it, key, scriptUrl, varName } = cfg.adBlueMedia;

  // 1. Set global variable object e.g. window["glNky_Esd_BTYEuc"] = {"it": 4192251, "key": "db00c"};
  const targetVarName = varName?.trim() || 'glNky_Esd_BTYEuc';
  const numericIt = typeof it === 'string' ? parseInt(it, 10) || it : it;
  window[targetVarName] = {
    it: numericIt,
    key: key?.trim() || 'db00c',
  };

  // 2. Inject CloudFront script if not already present
  const targetScriptSrc = scriptUrl?.trim() || 'https://d1chbu4sfo2xhu.cloudfront.net/5c85a0f.js';
  const existingScript = document.getElementById('adbluemedia-cdn-script') as HTMLScriptElement | null;

  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'adbluemedia-cdn-script';
    script.type = 'text/javascript';
    script.src = targetScriptSrc;
    script.async = true;
    script.onload = () => {
      isAdBlueMediaScriptInjected = true;
      hookAdBlueMediaCallbacks();
    };
    document.head.appendChild(script);
  } else if (existingScript.src !== targetScriptSrc) {
    existingScript.src = targetScriptSrc;
  }

  hookAdBlueMediaCallbacks();
};

export const hookAdBlueMediaCallbacks = () => {
  if (typeof window === 'undefined') return;

  // Override AdBlueMedia completion hooks to resume playback immediately
  window.CPABuildComplete = handleLockerCompletion;
  window.CPABuildUnlock = handleLockerCompletion;
  window.xfComplete = handleLockerCompletion;
  window.xfUnlock = handleLockerCompletion;
};

// Trigger AdBlueMedia via recall function (e.g. _Ri())
export const triggerAdBlueMediaLocker = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Exit fullscreen if active so locker is visible
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  ensureAdBlueMediaLoaded();

  const cfg = lockerConfig.get();
  const recallFuncName = cfg.adBlueMedia.recallFunc?.trim() || '_Ri';

  // 1. Check if configured recall function e.g. window._Ri() exists
  const customFunc = window[recallFuncName];
  if (typeof customFunc === 'function') {
    try {
      customFunc();
      return true;
    } catch (err) {
      console.warn(`Error running ${recallFuncName}():`, err);
    }
  }

  // 2. Fallbacks provided by CPBContentLocker
  if (typeof window.CPABuildLock === 'function') {
    window.CPABuildLock();
    return true;
  }
  if (typeof window.xfLock === 'function') {
    window.xfLock();
    return true;
  }

  // 3. If script is still loading asynchronously, wait 350ms and try recall
  setTimeout(() => {
    const delayedFunc = window[recallFuncName];
    if (typeof delayedFunc === 'function') {
      try {
        delayedFunc();
      } catch {
        // ignore
      }
    } else if (typeof window.CPABuildLock === 'function') {
      window.CPABuildLock();
    }
  }, 400);

  return true;
};

// ==========================================
// OGAds Native Locker
// ==========================================
export const triggerNativeOGAdsLocker = (): boolean => {
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  openLockerModal();
  return true;
};

// ==========================================
// Unified Dispatcher: Trigger Active Locker
// ==========================================
export const triggerActiveLocker = (): boolean => {
  const cfg = lockerConfig.get();
  if (!cfg.enabled) return false;

  if (cfg.provider === 'adbluemedia') {
    return triggerAdBlueMediaLocker();
  }

  if (cfg.provider === 'ogads') {
    return triggerNativeOGAdsLocker();
  }

  if (cfg.provider === 'both') {
    // Both active: trigger AdBlueMedia recall
    return triggerAdBlueMediaLocker();
  }

  return false;
};

// Global event listeners
if (typeof window !== 'undefined') {
  window.og_completed = handleLockerCompletion;
  window.og_unlock = handleLockerCompletion;
  window.onOGAdsComplete = handleLockerCompletion;

  if (isMobileDevice()) {
    window.LAST = openLockerModal;
  }

  // Listen for postMessage from OGAds / AdBlueMedia iframe
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

  // Watch for desktop DOM modal removal upon offer completion
  const observer = new MutationObserver(() => {
    const testIframe = document.getElementById('test_iframe');
    if (window._ogadsIframeSeen && !testIframe) {
      window._ogadsIframeSeen = false;
      handleLockerCompletion();
    } else if (testIframe) {
      window._ogadsIframeSeen = true;
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Pre-load AdBlueMedia script if selected provider
  setTimeout(() => {
    const cfg = lockerConfig.get();
    if (cfg.enabled && (cfg.provider === 'adbluemedia' || cfg.provider === 'both')) {
      ensureAdBlueMediaLoaded();
    }
  }, 1000);
}
