import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import {
  isMobileDevice,
  markMediaUnlocked,
  subscribeToLockerModal,
  closeLockerModal,
} from '../utils/locker';
import { lockerConfig, LockerConfig } from '../services/lockerConfig';

interface LockerModalProps {
  mediaId?: number;
  onUnlocked?: () => void;
}

const getLockerEmbedUrl = (cfg: LockerConfig, provider: 'ogads' | 'adbluemedia' = 'ogads'): string => {
  if (provider === 'adbluemedia') {
    const { it, key, scriptUrl } = cfg.adBlueMedia;
    if (typeof scriptUrl === 'string' && (scriptUrl.includes('/cl/') || scriptUrl.includes('/lock/'))) {
      return scriptUrl;
    }
    const numIt = it || 4192251;
    const cleanKey = (key || 'db00c').trim();
    return `https://d3r33tlb373kwk.cloudfront.net/public/ct?it=${numIt}&key=${cleanKey}`;
  }

  // OGAds default
  const clean = (cfg.lockerId || '').trim();
  const id = clean || '4o7vvr';
  if (id.startsWith('http://') || id.startsWith('https://')) return id;
  return `https://appsave.online/cl/v/${id}`;
};

export const LockerModal: React.FC<LockerModalProps> = ({ mediaId, onUnlocked }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const [activeConfig, setActiveConfig] = useState<LockerConfig>(() => lockerConfig.get());
  const [activeProvider, setActiveProvider] = useState<'ogads' | 'adbluemedia'>('ogads');
  const iframeLoadCountRef = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubModal = subscribeToLockerModal((open, provider) => {
      if (open) {
        const latestCfg = lockerConfig.get();
        setActiveConfig(latestCfg);
        const resolved = provider || (latestCfg.provider === 'both' ? 'ogads' : latestCfg.provider) || 'ogads';
        setActiveProvider(resolved as 'ogads' | 'adbluemedia');
        iframeLoadCountRef.current = 0;
      }
      setIsOpen(open);
    });

    const unsubConfig = lockerConfig.subscribe((cfg) => {
      setActiveConfig(cfg);
    });

    return () => {
      unsubModal();
      unsubConfig();
    };
  }, []);

  const handleUnlockAndClose = () => {
    if (mediaId) {
      markMediaUnlocked(mediaId);
    }
    if (onUnlocked) {
      onUnlocked();
    }
    closeLockerModal();
    setIsOpen(false);
  };

  const handleIframeLoad = () => {
    iframeLoadCountRef.current += 1;
    // If iframe navigates again (count > 1), offer was completed and redirected!
    if (iframeLoadCountRef.current > 1) {
      handleUnlockAndClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const embedUrl = getLockerEmbedUrl(activeConfig, activeProvider);

  return (
    <div className="fixed inset-0 z-[9999999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header - No X close button allowed */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/95 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              {activeProvider === 'adbluemedia' ? 'AdBlueMedia Verification' : 'OGAds Human Verification'}
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
              Live Stream Unlock
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] bg-amber-950/80 px-2.5 py-1 rounded border border-amber-500/30">
            <Lock className="w-3 h-3" />
            <span>Verification Required</span>
          </div>
        </div>

        {/* Embedded Locker Iframe */}
        <div className="flex-1 w-full bg-black relative min-h-[460px] sm:min-h-[540px]">
          <iframe
            key={`${activeProvider}-${embedUrl}`}
            src={embedUrl}
            title={activeProvider === 'adbluemedia' ? 'AdBlueMedia Locker' : 'OGAds Locker'}
            onLoad={handleIframeLoad}
            className="w-full h-full min-h-[460px] sm:min-h-[540px] border-0"
            allow="autoplay"
          />
        </div>

        {/* Modal Footer - Strict No Bypass Button */}
        <div className="px-4 py-3 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-200 font-medium">Complete 1 sponsor offer above to unlock full 1080p stream.</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Auto-detects offer completion</span>
        </div>
      </div>
    </div>
  );
};
