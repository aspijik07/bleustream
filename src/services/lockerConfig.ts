// Content Locker Configuration Service
// Manages: OGAds & AdBlueMedia (CPABuild), Provider Selection, Timing & Triggers, and Real-Time Synchronization across tabs & player

export type LockerProvider = 'adbluemedia' | 'ogads' | 'both';

export interface AdBlueMediaConfig {
  it: number | string;
  key: string;
  scriptUrl: string;
  varName: string;
  recallFunc: string;
}

export interface LockerConfig {
  enabled: boolean;
  provider: LockerProvider; // 'adbluemedia' | 'ogads' | 'both'
  delaySeconds: number; // e.g. 5, 10, 15, 20, 25, 30...
  triggerOnPlay: boolean; // Trigger when user clicks play triangle (▶)
  triggerOnDelay: boolean; // Trigger after watching for delaySeconds
  triggerMode: 'every_stream' | 'once_per_session';

  // OGAds Configuration
  lockerId: string; // e.g. "o4e5p2"

  // AdBlueMedia Configuration
  adBlueMedia: AdBlueMediaConfig;
}

const STORAGE_KEY = 'bleustream_locker_config_v1';

export const DEFAULT_ADBLUEMEDIA_CONFIG: AdBlueMediaConfig = {
  it: 4192251,
  key: 'db00c',
  scriptUrl: 'https://d1chbu4sfo2xhu.cloudfront.net/5c85a0f.js',
  varName: 'glNky_Esd_BTYEuc',
  recallFunc: '_Ri',
};

const DEFAULT_CONFIG: LockerConfig = {
  enabled: true,
  provider: 'ogads',
  delaySeconds: 15,
  triggerOnPlay: true, // Trigger when user clicks play triangle (▶)
  triggerOnDelay: true,
  triggerMode: 'every_stream',
  lockerId: '4o7vvr',
  adBlueMedia: DEFAULT_ADBLUEMEDIA_CONFIG,
};

// Helper to parse pasted raw script snippets from AdBlueMedia
export function parseAdBlueMediaSnippet(code: string): Partial<AdBlueMediaConfig> {
  const result: Partial<AdBlueMediaConfig> = {};
  if (!code || typeof code !== 'string') return result;

  const itMatch = code.match(/["']?it["']?\s*:\s*([0-9]+)/i);
  if (itMatch) {
    result.it = parseInt(itMatch[1], 10);
  }

  const keyMatch = code.match(/["']?key["']?\s*:\s*["']([^"']+)["']/i);
  if (keyMatch) {
    result.key = keyMatch[1];
  }

  const varMatch = code.match(/var\s+([A-Za-z0-9_$]+)\s*=/i);
  if (varMatch) {
    result.varName = varMatch[1];
  }

  const srcMatch = code.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) {
    result.scriptUrl = srcMatch[1];
  }

  const recallMatch = code.match(/<script>_([A-Za-z0-9_]+)\(\);?<\/script>/i) || code.match(/_([A-Za-z0-9_]+)\(\)/i);
  if (recallMatch) {
    result.recallFunc = `_${recallMatch[1]}`;
  }

  return result;
}

class LockerConfigService {
  private config: LockerConfig;
  private listeners: Array<(cfg: LockerConfig) => void> = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.initBroadcastChannel();
  }

  private loadConfig(): LockerConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Respect whatever lockerId was saved by admin - never override with old perkvex ID
        const resolvedId = (parsed.lockerId && parsed.lockerId.trim() && parsed.lockerId !== 'o4e5p2') 
          ? parsed.lockerId.trim() 
          : DEFAULT_CONFIG.lockerId;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          lockerId: resolvedId,
          adBlueMedia: {
            ...DEFAULT_ADBLUEMEDIA_CONFIG,
            ...(parsed.adBlueMedia || {}),
          },
          delaySeconds: typeof parsed.delaySeconds === 'number' ? parsed.delaySeconds : DEFAULT_CONFIG.delaySeconds,
        };
      }

      // Check legacy v2 - never use o4e5p2 as fallback
      const legacyV2 = localStorage.getItem('perkvex_locker_config_v2');
      if (legacyV2) {
        const parsed = JSON.parse(legacyV2);
        const legacyId = (parsed.lockerId && parsed.lockerId !== 'o4e5p2') ? parsed.lockerId : DEFAULT_CONFIG.lockerId;
        return {
          ...DEFAULT_CONFIG,
          enabled: parsed.enabled ?? true,
          delaySeconds: parsed.delaySeconds ?? DEFAULT_CONFIG.delaySeconds,
          lockerId: legacyId,
        };
      }

      // Check legacy flixstream_settings - never use o4e5p2 as fallback
      const legacy = localStorage.getItem('flixstream_settings');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        const legacyId = (parsed.lockerId && parsed.lockerId !== 'o4e5p2') ? parsed.lockerId : DEFAULT_CONFIG.lockerId;
        return {
          ...DEFAULT_CONFIG,
          enabled: parsed.lockerEnabled ?? true,
          delaySeconds: parsed.lockerDelaySeconds ?? DEFAULT_CONFIG.delaySeconds,
          lockerId: legacyId,
        };
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_CONFIG;
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('perkvex_locker_config_bus_v3');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'CONFIG_UPDATE' && event.data.payload) {
            this.config = event.data.payload;
            this.notify();
          }
        };
      }
    } catch {
      // ignore
    }
  }

  public getConfig(): LockerConfig {
    return { ...this.config, adBlueMedia: { ...this.config.adBlueMedia } };
  }

  public get(): LockerConfig {
    return this.getConfig();
  }

  public updateConfig(newConfig: Partial<LockerConfig>): LockerConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      adBlueMedia: {
        ...this.config.adBlueMedia,
        ...(newConfig.adBlueMedia || {}),
      },
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      // Sync legacy storage key for backward compatibility
      const legacy = {
        lockerEnabled: this.config.enabled,
        lockerDelaySeconds: this.config.delaySeconds,
        lockerId: this.config.lockerId,
        provider: this.config.provider,
      };
      localStorage.setItem('flixstream_settings', JSON.stringify(legacy));
    } catch {
      // ignore
    }

    // Broadcast update across open windows and player components
    try {
      this.broadcastChannel?.postMessage({
        type: 'CONFIG_UPDATE',
        payload: this.config,
      });
    } catch {
      // ignore
    }

    this.notify();
    return this.getConfig();
  }

  public subscribe(cb: (cfg: LockerConfig) => void): () => void {
    this.listeners.push(cb);
    cb(this.getConfig());
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    const cfg = this.getConfig();
    this.listeners.forEach(cb => {
      try {
        cb(cfg);
      } catch {
        // ignore
      }
    });
  }
}

export const lockerConfig = new LockerConfigService();

export const getEffectiveMobileLockerId = (cfg?: LockerConfig): string => {
  const current = cfg || lockerConfig.get();
  return current.lockerId?.trim() || DEFAULT_CONFIG.lockerId;
};
