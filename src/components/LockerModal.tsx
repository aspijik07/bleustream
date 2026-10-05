import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import {
  isMobileDevice,
  markMediaUnlocked,
  subscribeToLockerModal,
  closeLockerModal,
} from '../utils/locker';
import { lockerConfig } from '../services/lockerConfig';

interface LockerModalProps {
  mediaId?: number;
  onUnlocked?: () => void;
}

export const LockerModal: React.FC<LockerModalProps> = ({ mediaId, onUnlocked }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const [activeLockerId, setActiveLockerId] = useState<string>(() => lockerConfig.get().lockerId || 'o4e5p2');
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasInteractedWithOffer, setHasInteractedWithOffer] = useState(false);
  const iframeLoadCountRef = useRef(0);

  // Keep mobile detection updated on screen resize/orientation changes
  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to locker modal triggers and dynamic Admin Dashboard locker ID updates
  useEffect(() => {
    const unsubModal = subscribeToLockerModal((open) => {
      if (open) {
        // ALWAYS dynamically re-fetch the exact lockerId from Admin Panel configuration
        const latestId = lockerConfig.get().lockerId?.trim() || 'o4e5p2';
        setActiveLockerId(latestId);
        setIsSuccess(false);
        setHasInteractedWithOffer(false);
        iframeLoadCountRef.current = 0;
      }
      setIsOpen(open);
    });

    const unsubConfig = lockerConfig.subscribe((cfg) => {
      if (cfg.lockerId) {
        setActiveLockerId(cfg.lockerId.trim());
      }
    });

    return () => {
      unsubModal();
      unsubConfig();
    };
  }, []);

  // Handle successful automatic unlock once offer is completed
  const handleAutoUnlock = () => {
    setIsSuccess(true);
    setTimeout(() => {
      if (mediaId) {
        markMediaUnlocked(mediaId);
      }
      if (onUnlocked) {
        onUnlocked();
      }
      closeLockerModal();
      setIsOpen(false);
      setIsSuccess(false);
    }, 1000);
  };

  // Listen for iframe navigation/redirect events upon offer completion
  const handleIframeLoad = () => {
    iframeLoadCountRef.current += 1;
    // Load count 1 is initial locker embed.
    // If the iframe navigates again (count > 1), it means OGAds completed/redirected!
    if (iframeLoadCountRef.current > 1) {
      handleAutoUnlock();
    }
  };

  // Re-check status when user returns to tab after completing offer
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowFocus = () => {
      if (hasInteractedWithOffer) {
        // User returned to our tab after visiting the offer
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isOpen, hasInteractedWithOffer]);

  if (!isOpen) {
    return null;
  }

  // -------------------------------------------------------------
  // 1. PC (DESKTOP) VERSION:
  // Render the authentic OGAds Desktop Locker natively!
  // No custom React header/frame. Displays the 580px centered card
  // with Source Sans Pro font, bounce animation, and desktop offers.
  // -------------------------------------------------------------
  if (!isMobile) {
    const pcEmbedUrl = `https://appsave.online/cl/v/${activeLockerId}`;
    return (
      <div className="fixed inset-0 z-[9999999] bg-black/75 backdrop-blur-xs flex items-center justify-center select-none animate-in fade-in duration-200">
        <iframe
          src={pcEmbedUrl}
          title="OGAds Desktop Locker"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0 relative z-10"
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MOBILE (PHONE) VERSION:
  // Scaled down by ~14% (scale: 0.86, width: 116%) so fonts and
  // offer descriptions ("lktba dyal l3ard chno fih") are not zoomed in
  // and fit comfortably without truncation.
  // -------------------------------------------------------------
  const mobileEmbedUrl = `https://appsave.online/cl/v/${activeLockerId}`;

  return (
    <div
      className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-in fade-in duration-200"
      // Explicitly unskippable on mobile: no background click to close!
    >
      {/* Centered Mobile In-Page Popup Box */}
      <div className="relative w-[96vw] max-w-[420px] bg-white rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col h-[85vh] max-h-[640px] animate-in zoom-in-95 duration-200 border border-white/20">
        {/* Success Overlay when verified by OGAds */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 h-full bg-[#141414] text-white">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            <h3 className="text-xl font-bold">Verification Complete!</h3>
            <p className="text-xs text-zinc-400">Unlocking Ultra HD stream automatically...</p>
          </div>
        ) : (
          /* Mobile In-Page Locker Iframe - Scaled down so offers & text are crisp and not zoomed in */
          <div
            className="relative w-full flex-1 bg-white overflow-hidden"
            onClick={() => setHasInteractedWithOffer(true)}
          >
            <iframe
              src={mobileEmbedUrl}
              title="Verification Content Locker"
              onLoad={handleIframeLoad}
              className="border-0 relative z-10"
              style={{
                width: '116.3%',
                height: '116.3%',
                transform: 'scale(0.86)',
                transformOrigin: 'top left',
              }}
            />
          </div>
        )}

        {/* Footer with Live Status - Unskippable, unlocks automatically */}
        <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">
              Live Verification Active
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />
            <span>Unlocks automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
};
