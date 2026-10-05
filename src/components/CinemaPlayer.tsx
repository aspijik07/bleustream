import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Maximize2,
  Tv,
  Film,
  Star,
  Clock,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ListVideo,
  Play,
  Lock,
  AlertCircle,
  Users,
  ExternalLink,
} from 'lucide-react';
import { MediaItem, TVEpisode, CastMember, SeasonSummary } from '../types';
import { STREAMING_SERVERS } from '../config/servers';
import { fetchTVSeason, fetchTVDetails, fetchDetails, fetchCredits, fetchSimilar, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { triggerActiveLocker, triggerNativeOGAdsLocker, subscribeToLockerUnlock, markMediaUnlocked } from '../utils/locker';
import { useLanguage } from '../context/LanguageContext';
import { WatchPartyModal } from './WatchPartyModal';
import { CommunityReviews } from './CommunityReviews';
import { liveTracker } from '../services/liveTracker';
import { lockerConfig, LockerConfig } from '../services/lockerConfig';

interface CinemaPlayerProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
  onBack: () => void;
  onSelectSimilar: (item: MediaItem) => void;
  onStreamStarted: () => void;
  isLocked?: boolean;
  onTriggerLocker?: () => void;
}

export const CinemaPlayer: React.FC<CinemaPlayerProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  onBack,
  onSelectSimilar,
  onStreamStarted,
  isLocked = false,
  onTriggerLocker,
}) => {
  const { t } = useLanguage();
  const isTv = media.media_type === 'tv' || !!media.first_air_date;
  const title = media.title || media.name || 'Now Streaming';
  const [lockerCfg, setLockerCfg] = useState<LockerConfig>(lockerConfig.getConfig());
  const lockerDelaySeconds = lockerCfg.delaySeconds || 15;
  const isLockerEnabled = lockerCfg.enabled;

  const [selectedServer, setSelectedServer] = useState(STREAMING_SERVERS[0]);
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [availableSeasons, setAvailableSeasons] = useState<SeasonSummary[]>(media.seasons || []);
  const [totalSeasonsCount, setTotalSeasonsCount] = useState<number>(media.number_of_seasons || 1);
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [isCinemaExpanded, setIsCinemaExpanded] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [imdbId, setImdbId] = useState<string | undefined>(media.imdb_id);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(true);

  // Suppress popup advertisements when Ad-Shield is enabled
  useEffect(() => {
    if (!isAdBlockEnabled) return;
    const originalOpen = window.open;
    window.open = function (...args) {
      console.warn('Popup advertisement blocked by Ad-Shield', args);
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, [isAdBlockEnabled]);
  const [isLockedInternal, setIsLockedInternal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(lockerDelaySeconds);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);

  // Sync with lockerConfig updates in real-time
  useEffect(() => {
    const unsub = lockerConfig.subscribe((cfg) => {
      setLockerCfg(cfg);
      setCountdownSeconds(cfg.delaySeconds);
    });
    return unsub;
  }, []);

  const effectiveLocked = isLocked || isLockedInternal;

  const isAlreadyUnlocked = () => {
    try {
      return sessionStorage.getItem(`unlocked_${media.id}`) === 'true';
    } catch {
      return false;
    }
  };

  // Reset playback and countdown whenever a new media is chosen
  useEffect(() => {
    setHasStartedPlayback(false);
    setIsLockedInternal(false);
    setIsCountingDown(false);
    setCountdownSeconds(lockerDelaySeconds);
    setIsPlayerLoading(false);

    return () => {
      liveTracker.setWatchingState(false);
    };
  }, [media.id, lockerDelaySeconds]);

  const [isUnlockedThisStream, setIsUnlockedThisStream] = useState(false);

  // Sync prop unlock: when unlocked, resume playback smoothly
  useEffect(() => {
    if (!isLocked && isUnlockedThisStream) {
      setIsLockedInternal(false);
      setIsCountingDown(false);
      setHasStartedPlayback(true);
      setIsPlayerLoading(false);
    }
  }, [isLocked, isUnlockedThisStream]);

  // Auto-resume when OGAds completion event or callback is fired
  useEffect(() => {
    const unsubscribe = subscribeToLockerUnlock(() => {
      markMediaUnlocked(media.id);
      liveTracker.recordLockerEvent(media, 'unlocked');
      setIsUnlockedThisStream(true);
      setIsLockedInternal(false);
      setIsCountingDown(false);
      setHasStartedPlayback(true);
      setIsPlayerLoading(false);
    });
    return unsubscribe;
  }, [media.id]);

  // Start Countdown: ONLY starts if user has initiated playback AND locker is enabled AND not yet unlocked
  useEffect(() => {
    // Strictly do nothing if playback has NOT started yet or locker is disabled in Admin Panel!
    if (!hasStartedPlayback || !isLockerEnabled) {
      setIsCountingDown(false);
      return;
    }

    if (effectiveLocked || isUnlockedThisStream) {
      setIsCountingDown(false);
      return;
    }

    if (!isCountingDown && countdownSeconds === lockerDelaySeconds) {
      // Exactly 1 second after playback begins:
      const delayTimer = setTimeout(() => {
        setIsCountingDown(true);
      }, 1000);
      return () => clearTimeout(delayTimer);
    }
  }, [hasStartedPlayback, isLockerEnabled, effectiveLocked, isCountingDown, countdownSeconds, lockerDelaySeconds, isUnlockedThisStream]);

  // 20-Second Countdown Timer: ticks 20s silently while user is watching, then halts playback & triggers LAST();
  useEffect(() => {
    if (!isCountingDown || effectiveLocked) return;

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCountingDown(false);
          // Playback finished delay seconds: stop movie & trigger active locker
          setIsLockedInternal(true);
          liveTracker.recordLockerEvent(media, 'prompted');
          triggerActiveLocker();
          if (onTriggerLocker) {
            onTriggerLocker();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown, effectiveLocked, onTriggerLocker, media]);

  // Center Play triangle button click handler ("daak lmotalat bach ibda l fraja")
  const handleStartPlayCenter = () => {
    const cfg = lockerConfig.get();

    // Check if content locker is enabled and configured to trigger on play click (▶ triangle)
    if (isLockerEnabled && !isAlreadyUnlocked() && cfg.triggerOnPlay) {
      liveTracker.recordStreamStart(media, currentSeason, currentEpisode, selectedServer.name);
      liveTracker.recordLockerEvent(media, 'prompted');
      setIsLockedInternal(true);
      triggerActiveLocker();
      if (onTriggerLocker) {
        onTriggerLocker();
      }
      return;
    }

    setHasStartedPlayback(true);
    setIsPlayerLoading(true);
    liveTracker.recordStreamStart(media, currentSeason, currentEpisode, selectedServer.name);
    liveTracker.setWatchingState(true, title);

    // Fast loading safety timeout: dismiss loading indicator in 800ms so it NEVER freezes or hangs
    setTimeout(() => {
      setIsPlayerLoading(false);
    }, 800);

    if (isAlreadyUnlocked()) {
      setIsCountingDown(false);
      setIsLockedInternal(false);
      onStreamStarted();
      return;
    }

    setIsLockedInternal(false);
    onStreamStarted();
  };

  // Advanced SEO Dynamic Optimization (Title, Meta, OpenGraph, Twitter, and Schema.org JSON-LD)
  useEffect(() => {
    const year = (media.release_date || media.first_air_date || '').slice(0, 4);
    const mediaTypeStr = isTv ? 'TV Series' : 'Movie';
    const seoTitle = `${title} ${year ? `(${year})` : ''} – Watch Free in Ultra HD on BleuStream`;
    const seoDesc = media.overview
      ? `Stream ${title} (${year}) online in full 1080p / 4K Ultra HD on BleuStream. ${media.overview.slice(0, 120)}... 7 fast mirrors, stereo sound, no buffering.`
      : `Stream ${title} for free in Ultra HD on BleuStream. Unlimited high-speed mirrors, complete episodes, and zero ads interruption.`;
    const posterFull = getPosterUrl(media.poster_path, 'w500');

    document.title = seoTitle;

    // Standard Meta
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', seoDesc);

    // OpenGraph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', seoTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seoDesc);
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && posterFull) ogImage.setAttribute('content', posterFull);

    // Twitter
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', seoTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', seoDesc);
    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage && posterFull) twImage.setAttribute('content', posterFull);

    // Dynamic Schema.org JSON-LD structured data for Google Rich Snippets
    let scriptEl = document.getElementById('media-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'media-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': isTv ? 'TVSeries' : 'Movie',
      name: title,
      description: media.overview || `Watch ${title} on BleuStream`,
      image: posterFull,
      datePublished: media.release_date || media.first_air_date,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (media.vote_average || 8.0).toFixed(1),
        bestRating: '10',
        worstRating: '1',
        ratingCount: Math.max(media.vote_count || 150, 100),
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    };
    scriptEl.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = 'BleuStream – Watch Free Movies, TV Shows & Anime in Ultra HD';
      const dynamicScript = document.getElementById('media-jsonld');
      if (dynamicScript) dynamicScript.remove();
    };
  }, [title, media, isTv]);

  // Fetch full details to get imdb_id if not present
  useEffect(() => {
    if (!imdbId && media.id) {
      if (isTv) {
        fetchTVDetails(media.id).then((details) => {
          if (details?.imdb_id) setImdbId(details.imdb_id);
        });
      } else {
        fetchDetails('movie', media.id).then((details) => {
          if (details?.imdb_id) setImdbId(details.imdb_id);
        });
      }
    }
  }, [media.id, isTv, imdbId]);

  const playerContainerRef = useRef<HTMLDivElement>(null);

  const totalSeasons = Math.max(
    totalSeasonsCount,
    availableSeasons.length,
    media.number_of_seasons || 1
  );

  // Fetch full TV details to get all real seasons
  useEffect(() => {
    if (isTv) {
      fetchTVDetails(media.id).then((details) => {
        if (details) {
          if (details.number_of_seasons) {
            setTotalSeasonsCount(details.number_of_seasons);
          }
          if (details.seasons && details.seasons.length > 0) {
            const regular = details.seasons.filter((s) => s.season_number > 0);
            setAvailableSeasons(regular.length > 0 ? regular : details.seasons);
            if (regular.length > 0) {
              setTotalSeasonsCount(Math.max(...regular.map((s) => s.season_number)));
            }
          }
        }
      });
    }
  }, [media.id, isTv]);

  // Scroll smoothly to top of player when media or episode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [media.id, currentSeason, currentEpisode]);

  // Reset loading state whenever server or episode changes (only if playing)
  useEffect(() => {
    if (!hasStartedPlayback) return;
    setIsPlayerLoading(true);
    const timer = setTimeout(() => {
      setIsPlayerLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedServer.id, currentSeason, currentEpisode, iframeKey, hasStartedPlayback]);

  // Fetch TV Episodes when season changes
  useEffect(() => {
    if (isTv) {
      setLoadingEpisodes(true);
      fetchTVSeason(media.id, currentSeason).then((seasonData) => {
        if (seasonData && seasonData.episodes) {
          setEpisodes(seasonData.episodes);
        }
        setLoadingEpisodes(false);
      });
    }
  }, [media.id, isTv, currentSeason]);

  // Fetch cast and similar recommendations
  useEffect(() => {
    const type = isTv ? 'tv' : 'movie';
    fetchCredits(type, media.id).then(setCast);
    fetchSimilar(type, media.id).then(setSimilar);
  }, [media.id, isTv]);

  const activeStreamUrl = selectedServer.getUrl(
    isTv ? 'tv' : 'movie',
    media.id,
    currentSeason,
    currentEpisode,
    imdbId || media.imdb_id
  );

  const handleReloadPlayer = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen?.().catch((err) => {
          console.warn('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen?.().catch(console.warn);
      }
    }
  };

  const handleNextEpisode = () => {
    if (currentEpisode < episodes.length) {
      setCurrentEpisode(currentEpisode + 1);
    } else if (currentSeason < totalSeasons) {
      setCurrentSeason(currentSeason + 1);
      setCurrentEpisode(1);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      setCurrentEpisode(currentEpisode - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white pt-18 sm:pt-20 pb-16 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Navigation & Status Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg transition font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_browse')}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{t('free_hd_stream')}</span>
            </span>

            {/* In-Site Theater Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsCinemaExpanded(!isCinemaExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg transition font-medium text-xs cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isCinemaExpanded ? t('standard_view') : t('theater_mode')}</span>
            </button>

            {/* Watch Party & Share Button */}
            <button
              type="button"
              onClick={() => setShowWatchPartyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0ea5e9] hover:bg-sky-600 text-white rounded-lg transition font-bold text-xs cursor-pointer shadow-md shadow-sky-950/40"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Watch Party</span>
            </button>
          </div>
        </div>

        {/* Server Selector Switch Bar */}
        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Streaming Mirrors (VidSrc Ultra HD):
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="text-emerald-400 font-medium">Verified Working • Instant Playback</span>
              <span className="hidden md:inline text-zinc-600">•</span>
              <span className="hidden md:inline">VidSrc Fast Cloud CDN with 0% buffering & Anti-Ad Shield</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 pt-2">
            {STREAMING_SERVERS.map((server, idx) => {
              const isSelected = selectedServer.id === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServer(server);
                    liveTracker.recordStreamStart(media, currentSeason, currentEpisode, server.name);
                    handleReloadPlayer();
                  }}
                  className={`relative flex flex-col items-center sm:items-start p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border text-center sm:text-left transition-all duration-150 cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-gradient-to-br from-sky-500/30 via-red-900/20 to-black border-sky-400 shadow-md shadow-sky-950/60 ring-1 sm:ring-2 ring-sky-400/40'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="w-full flex items-center justify-center sm:justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-sky-500 animate-pulse' : 'bg-zinc-600'}`} />
                      <span className={`text-[10px] sm:text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                        VidSrc {idx + 1}
                      </span>
                    </div>
                    <span
                      className={`hidden sm:inline text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                        isSelected ? 'bg-sky-500 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                      }`}
                    >
                      {server.badge}
                    </span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-between w-full">
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium truncate">
                      <span className="sm:hidden text-[8px] font-bold text-amber-400/90">{server.badge} • </span>
                      {server.speed}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TV Series Season & Episode Controls (if TV series) */}
        {isTv && (
          <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Season {currentSeason}, Episode {currentEpisode}
                </h3>
                <p className="text-xs text-zinc-400">
                  {episodes.find((e) => e.episode_number === currentEpisode)?.name ||
                    `Episode ${currentEpisode}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Season Select */}
              <div className="flex items-center gap-1.5 bg-black/60 border border-zinc-700 rounded-xl px-3 py-1.5">
                <span className="text-xs text-zinc-400 font-medium">Season:</span>
                <select
                  value={currentSeason}
                  onChange={(e) => {
                    setCurrentSeason(Number(e.target.value));
                    setCurrentEpisode(1);
                  }}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {availableSeasons.length > 0 ? (
                    availableSeasons.map((s) => (
                      <option key={s.season_number} value={s.season_number} className="bg-zinc-900 text-white">
                        {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count} eps)` : ''}
                      </option>
                    ))
                  ) : (
                    Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s} className="bg-zinc-900 text-white">
                        Season {s}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Episode Select */}
              <div className="flex items-center gap-1.5 bg-black/60 border border-zinc-700 rounded-xl px-3 py-1.5">
                <span className="text-xs text-zinc-400 font-medium">Episode:</span>
                <select
                  value={currentEpisode}
                  onChange={(e) => setCurrentEpisode(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {episodes.length > 0 ? (
                    episodes.map((ep) => (
                      <option key={ep.id} value={ep.episode_number} className="bg-zinc-900 text-white">
                        Ep {ep.episode_number}: {ep.name.slice(0, 24)}
                      </option>
                    ))
                  ) : (
                    <option value={1} className="bg-zinc-900 text-white">
                      Episode 1
                    </option>
                  )}
                </select>
              </div>

              {/* Prev / Next Ep */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevEpisode}
                  disabled={currentEpisode <= 1}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-xl text-xs text-zinc-200 transition cursor-pointer"
                  title="Previous Episode"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextEpisode}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 flex items-center gap-1 transition cursor-pointer"
                  title="Next Episode"
                >
                  <span>Next Ep</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Episode Grid Toggle */}
              <button
                type="button"
                onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
                className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  showEpisodeDrawer
                    ? 'bg-[#0ea5e9] text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                <ListVideo className="w-3.5 h-3.5" />
                <span>All Seasons & Episodes</span>
              </button>
            </div>
          </div>
        )}

        {/* Episode Visual Grid Drawer (when toggled) */}
        {isTv && showEpisodeDrawer && (
          <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-4 animate-fade-in space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Season {currentSeason} - All Episodes ({episodes.length})
              </h4>
              <button
                onClick={() => setShowEpisodeDrawer(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Quick Season Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] text-zinc-400 font-medium shrink-0 mr-1">Seasons:</span>
              {availableSeasons.length > 0 ? (
                availableSeasons.map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => {
                      setCurrentSeason(s.season_number);
                      setCurrentEpisode(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                      currentSeason === s.season_number
                        ? 'bg-[#0ea5e9] text-white shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {s.name || `Season ${s.season_number}`} {s.episode_count ? `(${s.episode_count})` : ''}
                  </button>
                ))
              ) : (
                Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setCurrentSeason(s);
                      setCurrentEpisode(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                      currentSeason === s
                        ? 'bg-[#0ea5e9] text-white shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    Season {s}
                  </button>
                ))
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto pr-1">
              {episodes.map((ep) => {
                const isActiveEp = currentEpisode === ep.episode_number;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisode(ep.episode_number);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isActiveEp
                        ? 'bg-[#0ea5e9]/20 border-[#0ea5e9] text-white ring-1 ring-[#0ea5e9]'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Ep {ep.episode_number}</span>
                        {isActiveEp && (
                          <span className="text-[9px] bg-[#0ea5e9] text-white px-1.5 rounded uppercase font-bold">
                            Playing
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 font-medium">
                        {ep.name}
                      </p>
                    </div>
                    {ep.vote_average > 0 && (
                      <span className="text-[10px] text-amber-400 mt-2 font-semibold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {ep.vote_average.toFixed(1)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Responsive Cinema Player Container (16:9 / Theater Mode) */}
        <div
          ref={playerContainerRef}
          className={`relative w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl shadow-black transition-all duration-300 ${
            isCinemaExpanded ? 'w-full lg:h-[76vh] aspect-video' : 'aspect-video'
          }`}
        >
          {/* Initial Center Play Splash ("dik play li west screen") */}
          {!hasStartedPlayback && (
            <div
              onClick={handleStartPlayCenter}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 cursor-pointer group hover:bg-black/70 transition duration-300 select-none"
            >
              <img
                src={getBackdropUrl(media.backdrop_path, 'w1280')}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center space-y-4 animate-fade-in group-hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center shadow-2xl shadow-sky-500/80 border-4 border-white/20 group-hover:bg-sky-500 transition">
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-white translate-x-1" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-sky-400 animate-ping opacity-60 pointer-events-none" />
                </div>
                <div className="text-center px-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-lg tracking-wide">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-1">
                    Click Play to Watch in 1080p Ultra HD • 0% Buffering
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[10px] bg-sky-500/40 text-red-300 border border-sky-400/30 px-2 py-0.5 rounded font-bold uppercase">
                      VIP Server Active
                    </span>
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                      100% Free
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clean Paused State: Video stops when locked, native Human Verification locker is active */}
          {effectiveLocked && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-6 text-center space-y-4 animate-fade-in select-none">
              <div className="w-14 h-14 rounded-full bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-950/60">
                <Lock className="w-7 h-7 animate-pulse text-amber-400" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Stream Paused
                </h3>
                <p className="text-xs text-zinc-400">
                  Verification in progress. Complete the offer in the verification window to resume watching.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => triggerActiveLocker()}
                  className="px-5 py-2.5 bg-[#0ea5e9] hover:bg-sky-600 active:scale-95 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-lg shadow-sky-950/50 flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Open Verification</span>
                </button>
              </div>
            </div>
          )}

          {/* In-Site Loading Buffer Indicator */}
          {hasStartedPlayback && !effectiveLocked && isPlayerLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-fade-in pointer-events-none transition-opacity duration-300">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-3 border-zinc-800 border-t-[#0ea5e9] animate-spin" />
                <Play className="w-4 h-4 text-[#0ea5e9] absolute inset-0 m-auto fill-[#0ea5e9]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Connecting to {selectedServer.name}...
                </p>
                <p className="text-[11px] text-zinc-400">
                  Ultra HD Stream • Connecting to Cloud Mirror
                </p>
              </div>
            </div>
          )}

          {/* Active Player Iframe */}
          {hasStartedPlayback && !effectiveLocked && (
            <iframe
              key={`${selectedServer.id}-${media.id}-${currentSeason}-${currentEpisode}-${iframeKey}-${isAdBlockEnabled}`}
              src={activeStreamUrl}
              title={`${title} Stream Player`}
              className="w-full h-full border-0 relative z-0"
              {...(isAdBlockEnabled
                ? {
                    sandbox: 'allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock',
                  }
                : {})}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              loading="eager"
              onLoad={() => setIsPlayerLoading(false)}
            />
          )}

          {/* Floating Player Utility Toolbar */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20 opacity-80 hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={() => {
                setIsAdBlockEnabled(!isAdBlockEnabled);
                handleReloadPlayer();
              }}
              title={isAdBlockEnabled ? 'Ad-Shield Active: Popup Ads Blocked' : 'Click to enable Ad-Shield'}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg backdrop-blur-md border transition cursor-pointer flex items-center gap-1 ${
                isAdBlockEnabled
                  ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAdBlockEnabled ? 'Ad-Shield: ON' : 'Ad-Shield: OFF'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const currentIndex = STREAMING_SERVERS.findIndex((s) => s.id === selectedServer.id);
                const nextIndex = (currentIndex + 1) % STREAMING_SERVERS.length;
                setSelectedServer(STREAMING_SERVERS[nextIndex]);
                handleReloadPlayer();
              }}
              title="Switch to Next Streaming Server"
              className="px-2.5 py-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-md border border-white/10 transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-[#0ea5e9]" />
              <span className="hidden sm:inline">Next Server</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCinemaExpanded(!isCinemaExpanded)}
              title={isCinemaExpanded ? 'Exit Theater Mode' : 'Theater Mode'}
              className="p-2 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-md border border-white/10 transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReloadPlayer}
              title="Reload Stream Server"
              className="p-2 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-md border border-white/10 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFullscreen}
              title="Fullscreen Mode"
              className="p-2 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-md border border-white/10 transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Player Controls & Advice Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Currently playing on <strong className="text-white">{selectedServer.name}</strong> ({selectedServer.quality})</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px] hidden sm:inline">
              🛡️ Popups Blocked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const currentIndex = STREAMING_SERVERS.findIndex((s) => s.id === selectedServer.id);
                const nextIndex = (currentIndex + 1) % STREAMING_SERVERS.length;
                setSelectedServer(STREAMING_SERVERS[nextIndex]);
                handleReloadPlayer();
              }}
              className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-cyan-400 hover:text-red-300 font-bold rounded-lg border border-sky-400/30 transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Next Server</span>
            </button>
          </div>
        </div>

        {/* Instant Multi-Server Selector Strip */}
        <div className="bg-[#181818] border border-zinc-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Fast Mirrors:</span>
            <span className="text-[11px] text-zinc-500 font-normal hidden sm:inline">(If one server is slow, click any mirror below)</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {STREAMING_SERVERS.map((server, idx) => {
              const isActive = server.id === selectedServer.id;
              return (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => {
                    setSelectedServer(server);
                    handleReloadPlayer();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0ea5e9] text-white shadow-md shadow-sky-950/40 ring-1 ring-red-400'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{server.badge || `Server ${idx + 1}`}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Movie / Show Information Card */}
        <div className="bg-[#181818] border border-zinc-800/90 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="px-2.5 py-0.5 bg-[#0ea5e9] text-white font-bold rounded uppercase text-[10px]">
                  {isTv ? 'TV Series' : 'Movie'}
                </span>
                <span className="flex items-center gap-1 text-amber-400 bg-zinc-900 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {media.vote_average?.toFixed(1) || '8.0'}
                </span>
                {media.release_date || media.first_air_date ? (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    {(media.release_date || media.first_air_date || '').slice(0, 4)}
                  </span>
                ) : null}
                {media.runtime && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
                  </span>
                )}
                {isTv && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Layers className="w-3 h-3" />
                    {totalSeasons} Season{totalSeasons > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {title}
              </h1>

              {media.tagline && (
                <p className="text-xs text-zinc-400 italic">"{media.tagline}"</p>
              )}

              <p className="text-sm text-zinc-300 leading-relaxed">
                {media.overview || 'Enjoy this full-length stream with ultra-high quality playback and stereo surround audio.'}
              </p>

              {/* Genres */}
              {media.genres && media.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {media.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-2.5 py-1 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg text-xs"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Poster Card */}
            <div className="hidden md:block shrink-0 w-44">
              <img
                src={getPosterUrl(media.poster_path, 'w500')}
                alt={title}
                className="w-full rounded-xl shadow-xl border border-zinc-700/60"
              />
            </div>
          </div>

          {/* Cast Members */}
          {cast.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Top Cast Members
              </h3>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {cast.map((actor) => (
                  <div
                    key={actor.id}
                    className="shrink-0 w-24 text-center space-y-1 group"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shadow">
                      {actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                          {actor.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-zinc-200 truncate">{actor.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Community Reviews & Discussions Section */}
        <div className="pt-4">
          <CommunityReviews media={media} />
        </div>

        {/* Similar / Recommended Titles */}
        {similar.length > 0 && (
          <div className="space-y-4 pt-6">
            <h3 className="text-base font-bold text-white tracking-wide">
              More Titles Like This
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {similar.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectSimilar(item)}
                  className="group cursor-pointer space-y-2"
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow group-hover:border-sky-500 transition duration-300">
                    <img
                      src={getPosterUrl(item.poster_path, 'w500')}
                      alt={item.title || item.name || 'Poster'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="p-3 bg-[#0ea5e9] text-white rounded-full shadow-lg">
                        <Play className="w-4 h-4 fill-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-cyan-400 transition">
                    {item.title || item.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Watch Party & Cinema Room Share Modal */}
      <WatchPartyModal
        isOpen={showWatchPartyModal}
        onClose={() => setShowWatchPartyModal(false)}
        media={media}
        season={currentSeason}
        episode={currentEpisode}
      />
    </div>
  );
};
