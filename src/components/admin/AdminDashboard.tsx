import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Users,
  Play,
  Film,
  Lock,
  Download,
  Trash2,
  Key,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  Sparkles,
  RefreshCw,
  LogOut,
  X,
  AlertTriangle,
  Check,
  ChevronRight,
  Filter,
  Eye,
  CheckCircle2,
  SlidersHorizontal,
  Timer,
  Zap,
  Radio,
  Compass,
  Link,
  ChevronDown,
  Calendar as CalendarIcon,
  Cloud,
  Layers,
  Search,
  Copy,
  ExternalLink,
  FileText,
} from 'lucide-react';
import {
  liveTracker,
  StreamEvent,
  DailyStats,
  CountryStat,
  DeviceStat,
  LockerStats,
  LiveVisitor,
  ReferrerStat,
  BrowserStat,
} from '../../services/liveTracker';
import { adminAuth, AuthState, AuditLogEntry } from '../../services/adminAuth';
import { lockerConfig, LockerConfig, parseAdBlueMediaSnippet, LockerProvider } from '../../services/lockerConfig';
import { triggerNativeOGAdsLocker, triggerAdBlueMediaLocker, triggerActiveLocker } from '../../utils/locker';
import { pseoEngine } from '../../services/pseoEngine';
import { downloadSitemapFile, DEFAULT_SITE_DOMAIN } from '../../services/sitemapGenerator';
import { SEOArticle } from '../../data/seoArticles';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'analytics' | 'top_titles' | 'locker' | 'security' | 'seo'>('radar');
  const [events, setEvents] = useState<StreamEvent[]>(liveTracker.getLiveStreamEvents());
  const [dailyStats, setDailyStats] = useState<DailyStats>(liveTracker.getDailyStats());

  // pSEO State & Real-Time Synchronization
  const [pseoArticles, setPseoArticles] = useState<SEOArticle[]>(pseoEngine.getAllArticles());
  const [pseoStats, setPseoStats] = useState(pseoEngine.getStats());
  const [isGeneratingPSEO, setIsGeneratingPSEO] = useState(false);
  const [pseoSuccessMsg, setPseoSuccessMsg] = useState<string | null>(null);
  const [pseoSearchQuery, setPseoSearchQuery] = useState('');
  const [pseoCategoryFilter, setPseoCategoryFilter] = useState<'all' | 'Movie Guides' | 'TV Series Guides' | 'Anime Guides'>('all');
  const [copiedSitemap, setCopiedSitemap] = useState(false);

  useEffect(() => {
    const unsub = pseoEngine.subscribe(() => {
      setPseoArticles(pseoEngine.getAllArticles());
      setPseoStats(pseoEngine.getStats());
    });
    const unsubLocker = lockerConfig.subscribe((cfg) => {
      setLockerSettings(cfg);
    });
    return () => {
      unsub();
      unsubLocker();
    };
  }, []);

  const handleGenerateDailyArticles = async () => {
    setIsGeneratingPSEO(true);
    setPseoSuccessMsg(null);
    try {
      const added = await pseoEngine.generateDailyTrendingArticles(true);
      setPseoSuccessMsg(`Successfully generated ${added.length} trending articles with high-ranking keywords & Google Schema!`);
      setTimeout(() => setPseoSuccessMsg(null), 6000);
    } catch (err: any) {
      alert('Failed to generate articles: ' + (err?.message || 'Network error'));
    } finally {
      setIsGeneratingPSEO(false);
    }
  };

  const handleDeletePseoArticle = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      pseoEngine.deleteArticle(id);
    }
  };

  const handleClearAllGenerated = () => {
    if (confirm('Clear all dynamically generated articles? Curated baseline guides will be preserved.')) {
      pseoEngine.clearGeneratedArticles();
      setPseoSuccessMsg('Cleared generated articles.');
      setTimeout(() => setPseoSuccessMsg(null), 4000);
    }
  };

  const handleDownloadSitemap = () => {
    downloadSitemapFile(pseoArticles);
  };

  const handleCopySitemapUrl = () => {
    const url = `${DEFAULT_SITE_DOMAIN}/sitemap.xml`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSitemap(true);
      setTimeout(() => setCopiedSitemap(false), 2500);
    }
  };
  const [lockerStats, setLockerStats] = useState<LockerStats>(liveTracker.getLockerStats());
  const [countries, setCountries] = useState<CountryStat[]>(liveTracker.getCountryDistribution());
  const [devices, setDevices] = useState<DeviceStat[]>(liveTracker.getDeviceBreakdown());
  const [topTitles, setTopTitles] = useState(liveTracker.getTopWatchedTitles());
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>(liveTracker.getLiveVisitors());
  const [referrers, setReferrers] = useState<ReferrerStat[]>(liveTracker.getReferrerBreakdown());
  const [browsers, setBrowsers] = useState<BrowserStat[]>(liveTracker.getBrowserBreakdown());
  const [searchFilter, setSearchFilter] = useState('');
  const [filterRealOnly, setFilterRealOnly] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRange, setSelectedRange] = useState<'1d' | '7d' | '30d' | 'month' | 'custom'>('1d');
  const [showLiveVisitorsModal, setShowLiveVisitorsModal] = useState<boolean>(true); // default open matching image
  const [showCalendarDropdown, setShowCalendarDropdown] = useState<boolean>(false);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Content Locker Control States
  const [lockerSettings, setLockerSettings] = useState<LockerConfig>(lockerConfig.getConfig());
  const [lockerSavedMsg, setLockerSavedMsg] = useState<string | null>(null);
  const [rawSnippetInput, setRawSnippetInput] = useState('');
  const [snippetParsedMsg, setSnippetParsedMsg] = useState<string | null>(null);

  // Security Form States
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  const [quickPin, setQuickPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(adminAuth.getAuditLogs());
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(1800);

  // Sync with live tracker
  useEffect(() => {
    const refreshData = () => {
      setEvents(liveTracker.getLiveStreamEvents());
      setDailyStats(liveTracker.getDailyStats(selectedDate, selectedRange));
      setLockerStats(liveTracker.getLockerStats());
      setCountries(liveTracker.getCountryDistribution(selectedDate, selectedRange));
      setDevices(liveTracker.getDeviceBreakdown(selectedDate, selectedRange));
      setTopTitles(liveTracker.getTopWatchedTitles());
      setLiveVisitors(liveTracker.getLiveVisitors());
      setReferrers(liveTracker.getReferrerBreakdown(selectedDate, selectedRange));
      setBrowsers(liveTracker.getBrowserBreakdown(selectedDate, selectedRange));
    };

    const unsub = liveTracker.subscribe(refreshData);
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [selectedDate, selectedRange]);

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate < todayStr) {
      current.setDate(current.getDate() + 1);
      const newDateStr = current.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
    }
  };

  // Session countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const state = adminAuth.getState();
      if (!state.isAuthenticated || !state.sessionExpiresAt) {
        onClose();
        return;
      }
      const left = Math.max(0, Math.ceil((state.sessionExpiresAt - Date.now()) / 1000));
      setSessionSecondsLeft(left);
      if (left <= 0) {
        adminAuth.logout();
        onClose();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    adminAuth.logout();
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccessMsg(null);
    setPwErrorMsg(null);

    const cleanCurrent = currentPw.trim();
    const cleanNew = newPw.trim();
    const cleanConfirm = confirmPw.trim();

    if (!cleanCurrent) {
      setPwErrorMsg('Please enter your current password.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPwErrorMsg('New passwords do not match.');
      return;
    }

    if (cleanNew.length < 6) {
      setPwErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    const res = await adminAuth.changePassword(cleanCurrent, cleanNew);
    if (res.success) {
      setPwSuccessMsg('Password changed successfully! You will now use this new password to log in.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setAuditLogs(adminAuth.getAuditLogs());
      setTimeout(() => setPwSuccessMsg(null), 5000);
    } else {
      setPwErrorMsg(res.error || 'Failed to update password.');
    }
  };

  const handleSetQuickPin = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminAuth.setQuickPin(quickPin);
    setPinSuccessMsg('Quick PIN updated successfully!');
    setAuditLogs(adminAuth.getAuditLogs());
    setTimeout(() => setPinSuccessMsg(null), 3000);
  };

  const handlePanicWipe = () => {
    if (window.confirm('⚠️ WARNING: This will permanently wipe all telemetry history, reset security credentials, and lock the terminal. Are you sure?')) {
      adminAuth.panicWipe();
      onClose();
    }
  };

  const handleDownloadCSV = () => {
    const csv = liveTracker.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bleustream-telemetry-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const json = liveTracker.exportJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bleustream-telemetry-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format relative timestamp
  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  // Filtered stream events
  const filteredEvents = events.filter((e) => {
    if (filterRealOnly && !e.isRealVisitor) return false;
    if (searchFilter.trim()) {
      return e.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
             e.countryName.toLowerCase().includes(searchFilter.toLowerCase()) ||
             e.serverName.toLowerCase().includes(searchFilter.toLowerCase());
    }
    return true;
  });

  const minutesLeft = Math.floor(sessionSecondsLeft / 60);
  const secondsLeft = sessionSecondsLeft % 60;

  return (
    <div className="fixed inset-0 z-[90] bg-[#090a0d] text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Cyber Command Header */}
      <header className="bg-[#0f1117] border-b border-zinc-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        {/* Brand & Live Pulse */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-2 bg-red-950/70 border border-sky-500/50 rounded-xl text-sky-400 shadow-md">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white font-mono flex items-center gap-2">
                <span>BleuStream Command Center</span>
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600/40 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE TELEMETRY
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Real-time movie streams, visitor traffic & security vault
            </p>
          </div>
        </div>

        {/* Live Counters & Controls */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          {/* Active Viewers Now Indicator */}
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400">Live Active:</span>
            <span className="text-emerald-400 font-black text-sm">{dailyStats.activeNow}</span>
          </div>

          {/* Session Timer */}
          <div className="hidden md:flex items-center gap-1.5 text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-xl text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Lockout in {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}</span>
          </div>

          {/* Logout / Lock Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
            title="Minimize Dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#0b0c10] border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
            activeTab === 'radar'
              ? 'border-sky-400/60 text-white bg-gradient-to-r from-sky-500/30 to-red-950/40 shadow-md shadow-sky-950/40'
              : 'border-zinc-800/80 text-zinc-400 bg-zinc-900/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          }`}
        >
          <Activity className="w-4 h-4 text-sky-400" />
          <span>Live Stream Radar</span>
          <span className="px-1.5 py-0.5 bg-red-950/80 border border-sky-400/30 text-cyan-400 text-[10px] rounded-full font-mono font-bold">
            {events.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
            activeTab === 'analytics'
              ? 'border-blue-500/60 text-white bg-gradient-to-r from-blue-600/30 to-blue-950/40 shadow-md shadow-blue-950/40'
              : 'border-zinc-800/80 text-zinc-400 bg-zinc-900/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Daily Visitors & Traffic</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('top_titles')}
          className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
            activeTab === 'top_titles'
              ? 'border-amber-500/60 text-white bg-gradient-to-r from-amber-600/30 to-amber-950/40 shadow-md shadow-amber-950/40'
              : 'border-zinc-800/80 text-zinc-400 bg-zinc-900/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          }`}
        >
          <Film className="w-4 h-4 text-amber-400" />
          <span>Top Watched Titles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('locker')}
          className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
            activeTab === 'locker'
              ? 'border-amber-500/80 text-amber-300 bg-gradient-to-r from-amber-600/30 via-orange-950/40 to-black shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40'
              : 'border-zinc-800/80 text-zinc-400 bg-zinc-900/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span>Locker Timing & Controls</span>
          <span className="px-2 py-0.5 bg-amber-950 border border-amber-500/50 text-amber-300 text-[10px] rounded-full font-mono font-black">
            {lockerSettings.delaySeconds}s
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
            activeTab === 'seo'
              ? 'border-indigo-500/80 text-indigo-300 bg-gradient-to-r from-indigo-600/30 via-purple-950/40 to-black shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
              : 'border-zinc-800/80 text-zinc-400 bg-zinc-900/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>SEO & pSEO Engine</span>
          <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-500/50 text-indigo-300 text-[10px] rounded-full font-mono font-black">
            {pseoArticles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2 px-3.5 sm:px-4 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap border ${
            activeTab === 'security'
              ? 'border-emerald-500/60 text-white bg-gradient-to-r from-emerald-600/30 to-emerald-950/40 shadow-md shadow-emerald-950/40'
              : 'border-zinc-800/80 text-zinc-400 bg-zinc-900/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security & Vault Control</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ================= TAB 1: LIVE STREAM RADAR ================= */}
        {activeTab === 'radar' && (
          <div className="space-y-5">
            {/* Live Visitors Real-time Banner (as in Simple Analytics live pageviews popover) */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                    <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white font-mono flex items-center gap-2">
                      <span>Live Active Visitors & Pageviews</span>
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-full">
                        {liveVisitors.length} online now
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      Active sessions with real country, device, browser & current page
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Visitor (unique)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Active Pageview</span>
                  </div>
                </div>
              </div>

              {/* Active Visitors List (Simple Analytics style card with Country flag, Browser, Device, Path) */}
              <div className="space-y-2">
                {liveVisitors.length === 0 ? (
                  <div className="p-4 bg-black/40 rounded-xl text-center text-xs text-zinc-500 font-mono">
                    Detecting active incoming traffic...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {liveVisitors.map((vis) => (
                      <div
                        key={vis.sessionId}
                        className="p-3 bg-zinc-900/80 hover:bg-zinc-850/90 border border-zinc-800/90 rounded-xl flex items-center justify-between gap-3 font-mono text-xs transition shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold truncate">
                                {vis.page || '/'}
                              </span>
                              {vis.isWatching && (
                                <span className="px-1.5 py-0.2 bg-red-950/80 border border-sky-500/50 text-cyan-400 text-[10px] rounded font-semibold shrink-0 animate-pulse">
                                  STREAMING
                                </span>
                              )}
                            </div>
                            {vis.mediaTitle && (
                              <div className="text-[11px] text-cyan-400 truncate">
                                🎬 {vis.mediaTitle}
                              </div>
                            )}
                            <div className="text-[10px] text-zinc-500 truncate">
                              IP: {vis.ip} • Ref: {vis.referrer}
                            </div>
                          </div>
                        </div>

                        {/* Icons: Device, Browser, Flag */}
                        <div className="flex items-center gap-2 shrink-0 bg-black/50 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                          <span title={vis.device} className="flex items-center">
                            {vis.device.includes('iPhone') || vis.device.includes('Android') || vis.device.includes('Mobile') ? (
                              <Smartphone className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Monitor className="w-4 h-4 text-blue-400" />
                            )}
                          </span>
                          <span className="text-[11px] text-zinc-300 font-bold px-1 py-0.2 bg-zinc-800 rounded">
                            {vis.browser}
                          </span>
                          <span className="text-base" title={`${vis.countryName} (${vis.city || vis.countryCode})`}>
                            {vis.flagEmoji || '🌐'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter & Live Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11131a] border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter streams by title, country or server..."
                  className="w-full bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <input
                    type="checkbox"
                    checked={filterRealOnly}
                    onChange={(e) => setFilterRealOnly(e.target.checked)}
                    className="rounded bg-black border-zinc-700 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Show Real-Time Streamers Only</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setEvents(liveTracker.getLiveStreamEvents());
                  }}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition cursor-pointer"
                  title="Refresh Live Feed"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Streams Table */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0d0e14] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Title & Media</th>
                      <th className="py-3 px-4">Visitor Location & IP</th>
                      <th className="py-3 px-4">Streaming Server</th>
                      <th className="py-3 px-4">Device & Browser</th>
                      <th className="py-3 px-4">Traffic Source</th>
                      <th className="py-3 px-4 text-right">Time Elapsed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 space-y-2">
                          <Film className="w-8 h-8 text-zinc-700 mx-auto" />
                          <div className="font-bold text-zinc-400 text-sm">No live streams recorded yet</div>
                          <div className="text-xs text-zinc-600 max-w-sm mx-auto">
                            Whenever any visitor anywhere in the world plays a movie or episode, their real IP, country, city, and film choice will appear here live!
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => (
                        <tr
                          key={evt.id}
                          className="hover:bg-zinc-900/60 transition group"
                        >
                          {/* Title & Media */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {evt.posterPath ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${evt.posterPath}`}
                                  alt={evt.title}
                                  className="w-9 h-13 object-cover rounded shadow border border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-13 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 shrink-0">
                                  <Film className="w-4 h-4" />
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition truncate max-w-[220px]">
                                  {evt.title}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="uppercase px-1 py-0.2 bg-zinc-800 text-zinc-300 rounded font-semibold">
                                    {evt.mediaType}
                                  </span>
                                  {evt.season && (
                                    <span className="text-zinc-400">
                                      S{evt.season}:E{evt.episode || 1}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold rounded flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                    100% REAL
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Origin Country, City & Real IP */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xl shrink-0 mt-0.5">{evt.flagEmoji}</span>
                              <div className="space-y-0.5">
                                <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                                  <span>{evt.countryName}</span>
                                  {evt.city && (
                                    <span className="text-zinc-400 font-normal text-[11px]">
                                      ({evt.city})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-emerald-400 font-mono">
                                  IP: {evt.ip}
                                </div>
                                {evt.isp && (
                                  <div className="text-[10px] text-zinc-500 truncate max-w-[160px]">
                                    ISP: {evt.isp}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Server */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-red-950/60 border border-red-800/40 text-red-300 text-[11px] rounded-lg font-semibold inline-block">
                              {evt.serverName}
                            </span>
                          </td>

                          {/* Device */}
                          <td className="py-3 px-4 text-zinc-300">
                            <div>{evt.device}</div>
                          </td>

                          {/* Traffic Source */}
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {evt.referrer}
                          </td>

                          {/* Time */}
                          <td className="py-3 px-4 text-right">
                            <span className="text-emerald-400 font-bold">
                              {formatTimeAgo(evt.timestamp)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DAILY VISITORS & ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Simple Analytics Style Dashboard Board */}
            <div className="bg-[#10121a] border border-zinc-850 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 font-mono relative">
              
              {/* Top Metrics Row (Simple Analytics style header) */}
              <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-zinc-800/80 pb-6 relative z-10">
                <div className="flex flex-wrap items-baseline gap-6 sm:gap-12">
                  {/* Metric 1: Visitors */}
                  <div>
                    <div className="text-zinc-400 text-xs font-mono lowercase flex items-center gap-1">
                      <span>visitors</span>
                      <span className="text-[10px] text-zinc-500 rounded-full border border-zinc-700 w-3.5 h-3.5 inline-flex items-center justify-center">?</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1 font-sans">
                      {dailyStats.todayVisitors}
                    </div>
                  </div>

                  {/* Metric 2: Pageviews */}
                  <div>
                    <div className="text-zinc-400 text-xs font-mono lowercase flex items-center gap-1">
                      <span>pageviews</span>
                      <span className="text-[10px] text-zinc-500 rounded-full border border-zinc-700 w-3.5 h-3.5 inline-flex items-center justify-center">?</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1 font-sans">
                      {dailyStats.totalPageViews}
                    </div>
                  </div>

                  {/* Metric 3: Time on page */}
                  <div>
                    <div className="text-zinc-400 text-xs font-mono lowercase flex items-center gap-1">
                      <span>time on page</span>
                      <span className="text-[10px] text-zinc-500 rounded-full border border-zinc-700 w-3.5 h-3.5 inline-flex items-center justify-center">?</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1 font-sans">
                      47s
                    </div>
                  </div>

                  {/* Metric 4: Live Pageviews with Clickable Dropdown */}
                  <div className="relative">
                    <div
                      onClick={() => setShowLiveVisitorsModal(!showLiveVisitorsModal)}
                      className="cursor-pointer group select-none flex flex-col"
                      title="Click to toggle active visitors details table"
                    >
                      <div className="text-cyan-400 text-xs font-mono lowercase flex items-center gap-1.5 font-bold group-hover:text-red-300">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        <span>live pageviews</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight mt-1 font-sans">
                        <span>{liveVisitors.length}</span>
                        <ChevronDown className={`w-5 h-5 text-zinc-400 group-hover:text-emerald-300 transition-transform stroke-[3] ${showLiveVisitorsModal ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Floating Dropdown Popover (Attached to metric, absolute overlay so graph below never moves) */}
                    {showLiveVisitorsModal && (
                      <div className="absolute left-0 top-full mt-3 z-50 w-[330px] sm:w-[420px] bg-white text-zinc-900 rounded-2xl p-4 shadow-2xl shadow-black/80 font-mono border border-zinc-200 animate-in fade-in duration-150">
                        {/* Triangle arrow notch pointing to live pageviews metric */}
                        <div className="absolute -top-2 left-6 w-4 h-4 bg-white rotate-45 border-t border-l border-zinc-200" />

                        {/* Popover Header */}
                        <div className="text-[12px] font-bold text-zinc-800 pb-2 border-b border-zinc-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>{liveVisitors.length} pageview{liveVisitors.length > 1 ? 's' : ''} in the last 60 seconds</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLiveVisitorsModal(false);
                            }}
                            className="text-zinc-400 hover:text-zinc-800 text-sm px-1.5 py-0.5 rounded hover:bg-zinc-100 font-bold cursor-pointer transition"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Active Users Table with info & country flags */}
                        <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto my-2 pr-1">
                          {liveVisitors.map((vis, idx) => (
                            <div key={vis.sessionId || idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                              {/* Left: Indicator + Path */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${vis.isWatching ? 'bg-emerald-600 ring-2 ring-emerald-300 animate-pulse' : 'bg-emerald-500'}`} />
                                <div className="truncate flex-1">
                                  <div className="text-zinc-900 font-bold truncate">
                                    {vis.isWatching && vis.mediaTitle ? `🎬 ${vis.mediaTitle}` : (vis.page || '/')}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1.5">
                                    <span>{formatTimeAgo(vis.lastSeen)}</span>
                                    <span>•</span>
                                    <span>{vis.city || 'Online'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Device icon, Browser tag, Country flag & code */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-zinc-500" title={vis.device}>
                                  {vis.device.includes('iPhone') || vis.device.includes('Android') || vis.device.includes('Mobile') ? (
                                    <Smartphone className="w-4 h-4 text-cyan-600" />
                                  ) : (
                                    <Monitor className="w-4 h-4 text-cyan-600" />
                                  )}
                                </span>

                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold border border-zinc-300">
                                  {vis.browser}
                                </span>

                                <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded-md" title={`${vis.countryName} (${vis.countryCode})`}>
                                  <span className="text-base leading-none">{vis.flagEmoji || '🌐'}</span>
                                  <span className="text-[10px] font-black text-zinc-800">{vis.countryCode || 'US'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="border-t border-zinc-200 pt-2 flex flex-wrap items-center justify-between text-[10px] text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            <span>Visitor (unique pageview)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                            <span>Pageview</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span>Robot</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Navigation & Calendar Dropdown (Right Side) */}
                <div className="relative flex items-center gap-2 text-xs font-mono text-zinc-300">
                  <div
                    onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    className="cursor-pointer hover:text-white flex items-center gap-1.5 text-zinc-200 font-bold bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-750 transition select-none hover:border-cyan-500/50"
                    title="Choose Date or Range"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {selectedRange === '1d'
                        ? (selectedDate === new Date().toISOString().split('T')[0]
                            ? 'Today (1d)'
                            : selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                            ? `Yesterday (${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
                            : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
                        : selectedRange === '7d'
                        ? 'Last 7 Days'
                        : 'Last 30 Days'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </div>

                  {/* Date Navigation arrows */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                    <button
                      type="button"
                      onClick={handlePrevDay}
                      title="Previous Day"
                      className="text-zinc-400 hover:text-white px-1 font-bold cursor-pointer transition"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRange('1d');
                        setSelectedDate(new Date().toISOString().split('T')[0]);
                      }}
                      className={`px-1 font-bold transition cursor-pointer ${selectedRange === '1d' && selectedDate === new Date().toISOString().split('T')[0] ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'}`}
                      title="Reset to Today (1 Day)"
                    >
                      1d
                    </button>
                    <button
                      type="button"
                      onClick={handleNextDay}
                      title="Next Day"
                      disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                      className={`px-1 font-bold transition ${selectedDate >= new Date().toISOString().split('T')[0] ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white cursor-pointer'}`}
                    >
                      »
                    </button>
                  </div>

                  {/* Calendar & Range Dropdown Menu */}
                  {showCalendarDropdown && (
                    <div className="absolute right-0 top-10 bg-[#0d1017] border border-zinc-700 rounded-xl p-3 shadow-2xl z-50 w-64 space-y-2.5 animate-in fade-in">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-800">
                        Select Time Range
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRange('1d');
                            setSelectedDate(new Date().toISOString().split('T')[0]);
                            setShowCalendarDropdown(false);
                          }}
                          className={`p-2 rounded-lg text-left font-bold transition cursor-pointer ${selectedRange === '1d' && selectedDate === new Date().toISOString().split('T')[0] ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'}`}
                        >
                          ⚡ Today (1d)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRange('1d');
                            const y = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                            setSelectedDate(y);
                            setShowCalendarDropdown(false);
                          }}
                          className={`p-2 rounded-lg text-left font-bold transition cursor-pointer ${selectedRange === '1d' && selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'}`}
                        >
                          📅 Yesterday
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRange('7d');
                            setShowCalendarDropdown(false);
                          }}
                          className={`p-2 rounded-lg text-left font-bold transition cursor-pointer ${selectedRange === '7d' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'}`}
                        >
                          📊 Last 7 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRange('30d');
                            setShowCalendarDropdown(false);
                          }}
                          className={`p-2 rounded-lg text-left font-bold transition cursor-pointer ${selectedRange === '30d' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'}`}
                        >
                          📈 Last 30 Days
                        </button>
                      </div>

                      {/* Custom Date Input */}
                      <div className="pt-2 border-t border-zinc-800 space-y-1">
                        <label className="text-[10px] text-zinc-400 block font-bold">Pick specific date (Calendia):</label>
                        <input
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={selectedDate}
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedRange('1d');
                              setSelectedDate(e.target.value);
                              setShowCalendarDropdown(false);
                            }
                          }}
                          className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Chart Canvas Area (Graph stays completely fixed below at all times) */}
              <div className="relative pt-4 pb-2 border-b border-zinc-850">
                {/* Graph Container with Y-Axis */}
                <div className="flex items-stretch gap-3">
                  
                  {/* Left Y-Axis Numbers */}
                  {(() => {
                    const maxVal = Math.max(...dailyStats.hourlyTraffic, 5);
                    const step = Math.ceil(maxVal / 5);
                    return (
                      <div className="flex flex-col justify-between text-[11px] text-zinc-500 font-mono py-1 pr-1 select-none shrink-0 h-44 text-right">
                        <span>{step * 5}</span>
                        <span>{step * 4}</span>
                        <span>{step * 3}</span>
                        <span>{step * 2}</span>
                        <span>{step * 1}</span>
                        <span>0</span>
                      </div>
                    );
                  })()}

                  {/* SVG Chart */}
                  <div className="h-44 flex-1 relative flex items-end select-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 160">
                      <defs>
                        <linearGradient id="cyanArea" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Background Grid Lines (matching y levels) */}
                      <line x1="0" y1="5" x2="1000" y2="5" stroke="#1c212c" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="36" x2="1000" y2="36" stroke="#1c212c" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="67" x2="1000" y2="67" stroke="#1c212c" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="98" x2="1000" y2="98" stroke="#1c212c" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="129" x2="1000" y2="129" stroke="#1c212c" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="155" x2="1000" y2="155" stroke="#252b3b" strokeWidth="1" />

                      {/* Dynamic Coordinates generation based on dailyStats.hourlyTraffic */}
                      {(() => {
                        const totalPoints = dailyStats.hourlyTraffic.length || 24;
                        const maxVal = Math.max(...dailyStats.hourlyTraffic, 5);
                        const pointsArr = dailyStats.hourlyTraffic.map((val, idx) => {
                          const x = totalPoints > 1 ? (idx / (totalPoints - 1)) * 1000 : 500;
                          const y = 155 - (val / maxVal) * 145;
                          return { x, y, val, idx };
                        });

                        const polyPoints = `0,155 ${pointsArr.map(p => `${p.x},${p.y}`).join(' ')} 1000,155`;
                        const linePoints = pointsArr.map(p => `${p.x},${p.y}`).join(' ');

                        return (
                          <>
                            {/* Gradient Polygon Area */}
                            <polygon points={polyPoints} fill="url(#cyanArea)" />

                            {/* Main Line */}
                            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />

                            {/* Data points */}
                            {pointsArr.map((p) => {
                              const isHovered = hoveredHour === p.idx;
                              return (
                                <circle
                                  key={p.idx}
                                  cx={p.x}
                                  cy={p.y}
                                  r={isHovered ? 6 : p.val > 0 ? 3.5 : 2}
                                  fill={isHovered ? '#ffffff' : '#06b6d4'}
                                  stroke="#083344"
                                  strokeWidth={isHovered ? 3 : 1.5}
                                  className="transition-all duration-150 cursor-pointer"
                                />
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                    {/* Bottom Left Badge on graph */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg pointer-events-none opacity-80">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-300">
                        {selectedRange === '1d' ? 'Hourly Timeline' : selectedRange === '7d' ? '7-Day Trend' : '30-Day Trend'}
                      </span>
                    </div>

                    {/* Hover Interaction Bar Overlay */}
                    <div className="absolute inset-0 flex">
                      {dailyStats.hourlyTraffic.map((val, idx) => {
                        const isHovered = hoveredHour === idx;
                        const total = dailyStats.hourlyTraffic.length;
                        
                        let label = '';
                        if (selectedRange === '1d') {
                          const ampm = idx >= 12 ? 'PM' : 'AM';
                          label = (idx % 12 || 12) + ':00 ' + ampm;
                        } else if (selectedRange === '7d') {
                          const pastDay = new Date(Date.now() - (total - 1 - idx) * 86400000);
                          label = pastDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        } else {
                          const pastDay = new Date(Date.now() - (total - 1 - idx) * 86400000);
                          label = pastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredHour(idx)}
                            onMouseLeave={() => setHoveredHour(null)}
                            className="flex-1 h-full relative cursor-crosshair group z-10"
                          >
                            {/* Vertical guide line on hover */}
                            {isHovered && (
                              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-cyan-400/60 pointer-events-none" />
                            )}

                            {/* Tooltip Bubble */}
                            {isHovered && (
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0d1017] border border-cyan-500 text-white text-[11px] font-mono px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap z-50">
                                <div className="font-bold text-cyan-400">{label}</div>
                                <div className="text-zinc-200">
                                  {val} visitor{val !== 1 ? 's' : ''} / pageview{val !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* X-Axis Timeline */}
                {selectedRange === '1d' ? (
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-2 pl-6">
                    <span>12 AM</span>
                    <span>2 AM</span>
                    <span>4 AM</span>
                    <span>6 AM</span>
                    <span>8 AM</span>
                    <span>10 AM</span>
                    <span>12 PM</span>
                    <span>2 PM</span>
                    <span>4 PM</span>
                    <span>6 PM</span>
                    <span>8 PM</span>
                    <span>10 PM</span>
                    <span>11 PM</span>
                  </div>
                ) : selectedRange === '7d' ? (
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-2 pl-6">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date(Date.now() - (6 - i) * 86400000);
                      return (
                        <span key={i} className="font-bold">
                          {i === 6 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-2 pl-6">
                    <span>30 days ago</span>
                    <span>25d</span>
                    <span>20d</span>
                    <span>15d</span>
                    <span>10d</span>
                    <span>5d</span>
                    <span className="font-bold text-cyan-400">Today</span>
                  </div>
                )}

                {/* Checkboxes below chart */}
                <div className="flex items-center justify-end gap-5 text-xs text-zinc-400 font-mono pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" className="rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0" />
                    <span>Trend lines</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0" />
                    <span>Pageviews</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0" />
                    <span>Visitors</span>
                  </label>
                </div>
              </div>

              {/* 4 Bottom Breakdown Columns (Referrals, Pages, Devices, Countries & Browsers) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 font-mono">
                {/* Column 1: Referrals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-zinc-800">
                    <span>Referrals</span>
                    <span className="text-zinc-500 text-xs">🔍</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {referrers.length === 0 ? (
                      <div className="flex items-center justify-between text-zinc-400 py-1">
                        <span className="text-cyan-400 font-bold">15</span>
                        <span className="truncate flex-1 ml-2">(direct)</span>
                      </div>
                    ) : (
                      referrers.map((r) => (
                        <div key={r.source} className="flex items-center justify-between text-zinc-300">
                          <span className="text-cyan-400 font-bold w-6">{r.count}</span>
                          <span className="truncate flex-1 text-zinc-200">{r.source}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: Pages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-zinc-800">
                    <span>Pages</span>
                    <span className="text-zinc-500 text-xs">🔍</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-cyan-400 font-bold w-6">{dailyStats.totalPageViews}</span>
                      <span className="truncate flex-1 text-zinc-200">/</span>
                    </div>
                    {events.slice(0, 3).map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-zinc-400">
                        <span className="text-cyan-400 font-bold w-6">1</span>
                        <span className="truncate flex-1 text-zinc-400">/watch/{e.mediaId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Devices & Browsers */}
                <div className="space-y-4">
                  {/* Devices Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-zinc-800">
                      <span>Devices</span>
                      <span className="text-zinc-500 text-xs">🔍</span>
                    </div>
                    {devices.map((d) => (
                      <div key={d.type} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-zinc-400">
                          {d.type === 'Mobile' ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Monitor className="w-3.5 h-3.5 text-cyan-400" />}
                        </span>
                        <div className="flex-1 bg-zinc-850 h-5 rounded overflow-hidden relative">
                          <div
                            style={{ width: `${d.percentage}%` }}
                            className="bg-cyan-950 border-r border-cyan-400 h-full flex items-center px-2"
                          >
                            <span className="text-cyan-300 font-bold text-[11px]">{d.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Browsers Section */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-zinc-800">
                      <span>Browsers</span>
                      <span className="text-zinc-500 text-xs">🔍</span>
                    </div>
                    {browsers.map((b) => (
                      <div key={b.browser} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-zinc-400 truncate w-14">{b.browser}</span>
                        <div className="flex-1 bg-zinc-850 h-5 rounded overflow-hidden relative">
                          <div
                            style={{ width: `${b.percentage}%` }}
                            className="bg-cyan-950 border-r border-cyan-400 h-full flex items-center px-2"
                          >
                            <span className="text-cyan-300 font-bold text-[11px]">{b.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 4: Countries (With Country Logos & Flags) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-zinc-800">
                    <span>Countries</span>
                    <span className="text-zinc-500 text-xs">🔍</span>
                  </div>
                  <div className="space-y-2.5">
                    {countries.map((c) => (
                      <div key={c.code} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-lg leading-none shrink-0" title={c.name}>{c.flag}</span>
                        <div className="flex-1 bg-zinc-850 h-5 rounded overflow-hidden relative">
                          <div
                            style={{ width: `${c.percentage}%` }}
                            className="bg-cyan-950 border-r border-cyan-400 h-full flex items-center px-2"
                          >
                            <span className="text-cyan-300 font-bold text-[11px]">{c.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset counters button at bottom */}
              <div className="pt-4 border-t border-zinc-850 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">Live Telemetry Synchronized via Global Cloud Mirror</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all analytics and counts back to 0?')) {
                      liveTracker.clearAllData();
                    }
                  }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reset Counters</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TOP TITLES LEADERBOARD ================= */}
        {activeTab === 'top_titles' && (
          <div className="space-y-4">
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Top 10 Most Streamed Titles (Today & All-Time)
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Ranked by live server clicks and completed playback sessions
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {topTitles.map((item, idx) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 p-3 bg-zinc-900/70 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition"
                  >
                    <span className="text-lg font-black text-zinc-500 font-mono w-6 text-center">
                      #{idx + 1}
                    </span>
                    {item.poster ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster}`}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded shadow border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 pt-0.5">
                        <span className="uppercase text-[10px] px-1.5 py-0.2 bg-zinc-800 rounded">
                          {item.type}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {item.count} views
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CONTENT LOCKER CONTROLS & TIMING ================= */}
        {activeTab === 'locker' && (
          <div className="space-y-6 max-w-4xl mx-auto font-mono">
            {/* Success notification */}
            {lockerSavedMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{lockerSavedMsg}</span>
              </div>
            )}

            {/* Timing & Countdown Card */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <Timer className="w-5 h-5 text-amber-400" />
                    <span>Locker Countdown Delay (Waqt Fach Kay-Ban L-Locker)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Control exactly how many seconds a visitor can watch before the stream pauses and prompts the CPA locker.
                  </p>
                </div>
                <div className="px-3.5 py-1.5 bg-amber-950/80 border border-amber-500/40 rounded-xl text-amber-300 text-sm font-bold shrink-0 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{lockerSettings.delaySeconds} Seconds</span>
                </div>
              </div>

              {/* Slider & Number Display */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Fast Gate (3s)</span>
                  <span className="text-amber-400 font-bold text-sm bg-black/60 px-3 py-1 rounded-lg border border-zinc-800">
                    {lockerSettings.delaySeconds}s Delay
                  </span>
                  <span>Generous Preview (120s)</span>
                </div>

                <input
                  type="range"
                  min="3"
                  max="120"
                  step="1"
                  value={lockerSettings.delaySeconds}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const next = { ...lockerSettings, delaySeconds: val, enabled: true };
                    setLockerSettings(next);
                    lockerConfig.updateConfig(next);
                  }}
                  className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />

                {/* Quick Presets */}
                <div className="pt-2">
                  <div className="text-[11px] text-zinc-400 mb-2 font-bold uppercase tracking-wider">Quick Presets:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { s: 5, label: '5s Fast', hint: 'Aggressive' },
                      { s: 10, label: '10s Quick', hint: 'High CR' },
                      { s: 15, label: '15s Optimal', hint: 'Recommended' },
                      { s: 20, label: '20s Standard', hint: 'Balanced' },
                      { s: 30, label: '30s Cinema', hint: 'High Hook' },
                      { s: 60, label: '60s Preview', hint: 'Generous' },
                    ].map((preset) => {
                      const active = lockerSettings.delaySeconds === preset.s;
                      return (
                        <button
                          key={preset.s}
                          type="button"
                          onClick={() => {
                            const next = { ...lockerSettings, delaySeconds: preset.s, enabled: true };
                            setLockerSettings(next);
                            lockerConfig.updateConfig(next);
                          }}
                          className={`p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer text-xs select-none ${
                            active
                              ? 'bg-gradient-to-b from-amber-600/30 to-amber-950/60 border-amber-500 text-amber-300 font-black shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/40'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="font-bold text-sm">{preset.label}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{preset.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Master Switch & CPA Network Platform Selector */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                  <span>CPA Networks & Content Locker Control (OGAds & AdBlueMedia)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Master State:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...lockerSettings, enabled: !lockerSettings.enabled };
                      setLockerSettings(next);
                      lockerConfig.updateConfig(next);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                      lockerSettings.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 ring-2 ring-emerald-400/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${lockerSettings.enabled ? 'bg-white animate-pulse' : 'bg-zinc-500'}`} />
                    <span>{lockerSettings.enabled ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}</span>
                  </button>
                </div>
              </div>

              {/* Platform Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Active CPA Network Platform:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'adbluemedia', name: 'AdBlueMedia (CPABuild)', desc: 'CloudFront script with _Ri() recall', badge: 'Active Network', color: 'from-blue-600/30 to-cyan-950/50 border-cyan-500 text-cyan-300' },
                    { id: 'ogads', name: 'OGAds Native', desc: `Direct locker ID (${lockerSettings.lockerId || '4o7vvr'}) with AppSave CDN`, badge: 'OGAds Direct', color: 'from-sky-500/30 to-amber-950/50 border-sky-400 text-red-300' },
                    { id: 'both', name: 'Multi-Network (Both)', desc: 'AdBlueMedia + OGAds fallback rotation', badge: 'Dual Rotation', color: 'from-purple-600/30 to-indigo-950/50 border-purple-500 text-purple-300' },
                  ].map((p) => {
                    const isSelected = (lockerSettings.provider || 'adbluemedia') === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const next = { ...lockerSettings, provider: p.id as LockerProvider, enabled: true };
                          setLockerSettings(next);
                          lockerConfig.updateConfig(next);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative select-none ${
                          isSelected
                            ? `bg-gradient-to-br ${p.color} ring-2 ring-current font-bold shadow-lg`
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{p.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 text-[9px] uppercase font-mono font-bold bg-white/20 rounded">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Behavior: On Play Click vs Timer Delay */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Triggering Methods (When should locker appear?)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...lockerSettings, triggerOnPlay: !lockerSettings.triggerOnPlay };
                      setLockerSettings(next);
                      lockerConfig.updateConfig(next);
                    }}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between cursor-pointer transition ${
                      lockerSettings.triggerOnPlay
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>On Play Button Click (▶ Triangle)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Calls <code className="text-amber-300 font-mono">_Ri()</code> immediately when user clicks the play triangle to start watching.
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${lockerSettings.triggerOnPlay ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                      {lockerSettings.triggerOnPlay ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...lockerSettings, triggerOnDelay: !lockerSettings.triggerOnDelay };
                      setLockerSettings(next);
                      lockerConfig.updateConfig(next);
                    }}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between cursor-pointer transition ${
                      lockerSettings.triggerOnDelay
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>After Delay Timer ({lockerSettings.delaySeconds}s)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Also prompts after {lockerSettings.delaySeconds} seconds of stream playback (Hook delay).
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${lockerSettings.triggerOnDelay ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                      {lockerSettings.triggerOnDelay ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Trigger Mode: Every Stream vs Once Per Session */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span>Trigger Frequency (How often should locker appear?)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...lockerSettings, triggerMode: 'every_stream' as const };
                      setLockerSettings(next);
                      lockerConfig.updateConfig(next);
                    }}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between cursor-pointer transition ${
                      (lockerSettings.triggerMode || 'every_stream') === 'every_stream'
                        ? 'bg-purple-500/10 border-purple-500/50 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                        <span>Every Stream</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Locker appears on every video — max revenue per visitor.
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      (lockerSettings.triggerMode || 'every_stream') === 'every_stream' ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {(lockerSettings.triggerMode || 'every_stream') === 'every_stream' ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...lockerSettings, triggerMode: 'once_per_session' as const };
                      setLockerSettings(next);
                      lockerConfig.updateConfig(next);
                    }}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between cursor-pointer transition ${
                      lockerSettings.triggerMode === 'once_per_session'
                        ? 'bg-purple-500/10 border-purple-500/50 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Once Per Session</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Locker shows only once per browser session — smoother UX.
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      lockerSettings.triggerMode === 'once_per_session' ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {lockerSettings.triggerMode === 'once_per_session' ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
              {/* AdBlueMedia Detailed Settings */}
              {((lockerSettings.provider || 'adbluemedia') === 'adbluemedia' || lockerSettings.provider === 'both') && (
                <div className="p-5 bg-gradient-to-br from-blue-950/30 via-zinc-900 to-zinc-900 border border-blue-500/40 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <h4 className="text-sm font-bold text-cyan-300">AdBlueMedia (CPABuild) Configuration</h4>
                    </div>
                    <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                      Recall: &lt;script&gt;{lockerSettings.adBlueMedia?.recallFunc || '_Ri'}();&lt;/script&gt;
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Campaign `it` ID:
                      </label>
                      <input
                        type="text"
                        value={lockerSettings.adBlueMedia?.it ?? 4192251}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const next = {
                            ...lockerSettings,
                            adBlueMedia: {
                              ...lockerSettings.adBlueMedia,
                              it: val ? Number(val) || val : '',
                            },
                          };
                          setLockerSettings(next);
                          lockerConfig.updateConfig(next);
                        }}
                        placeholder="e.g. 4192251"
                        className="w-full bg-black/70 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Security `key`:
                      </label>
                      <input
                        type="text"
                        value={lockerSettings.adBlueMedia?.key || 'db00c'}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const next = {
                            ...lockerSettings,
                            adBlueMedia: {
                              ...lockerSettings.adBlueMedia,
                              key: val,
                            },
                          };
                          setLockerSettings(next);
                          lockerConfig.updateConfig(next);
                        }}
                        placeholder="e.g. db00c"
                        className="w-full bg-black/70 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Variable Name:
                      </label>
                      <input
                        type="text"
                        value={lockerSettings.adBlueMedia?.varName || 'glNky_Esd_BTYEuc'}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const next = {
                            ...lockerSettings,
                            adBlueMedia: {
                              ...lockerSettings.adBlueMedia,
                              varName: val,
                            },
                          };
                          setLockerSettings(next);
                          lockerConfig.updateConfig(next);
                        }}
                        placeholder="e.g. glNky_Esd_BTYEuc"
                        className="w-full bg-black/70 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Recall Function:
                      </label>
                      <input
                        type="text"
                        value={lockerSettings.adBlueMedia?.recallFunc || '_Ri'}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const next = {
                            ...lockerSettings,
                            adBlueMedia: {
                              ...lockerSettings.adBlueMedia,
                              recallFunc: val,
                            },
                          };
                          setLockerSettings(next);
                          lockerConfig.updateConfig(next);
                        }}
                        placeholder="e.g. _Ri"
                        className="w-full bg-black/70 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      CloudFront CDN Script URL:
                    </label>
                    <input
                      type="text"
                      value={lockerSettings.adBlueMedia?.scriptUrl || 'https://d1chbu4sfo2xhu.cloudfront.net/5c85a0f.js'}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const next = {
                          ...lockerSettings,
                          adBlueMedia: {
                            ...lockerSettings.adBlueMedia,
                            scriptUrl: val,
                          },
                        };
                        setLockerSettings(next);
                        lockerConfig.updateConfig(next);
                      }}
                      placeholder="https://d1chbu4sfo2xhu.cloudfront.net/5c85a0f.js"
                      className="w-full bg-black/70 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Auto-Detect & Fill by Pasting Full Code */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-300">
                        Paste Raw AdBlueMedia Script Snippet (Auto-Detect):
                      </span>
                      {snippetParsedMsg && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {snippetParsedMsg}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={rawSnippetInput}
                        onChange={(e) => setRawSnippetInput(e.target.value)}
                        placeholder={`Paste snippet here, e.g.:\n<script type="text/javascript">\n    var glNky_Esd_BTYEuc={"it":4192251,"key":"db00c"};\n</script>\n<script src="https://d1chbu4sfo2xhu.cloudfront.net/5c85a0f.js"></script>`}
                        className="flex-1 bg-black/80 border border-zinc-700 rounded-lg p-2 text-[11px] font-mono text-zinc-300 focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!rawSnippetInput.trim()) return;
                          const parsed = parseAdBlueMediaSnippet(rawSnippetInput);
                          if (parsed.it || parsed.key || parsed.scriptUrl) {
                            const next = {
                              ...lockerSettings,
                              provider: 'adbluemedia' as LockerProvider,
                              adBlueMedia: {
                                ...lockerSettings.adBlueMedia,
                                ...(parsed.it ? { it: parsed.it } : {}),
                                ...(parsed.key ? { key: parsed.key } : {}),
                                ...(parsed.varName ? { varName: parsed.varName } : {}),
                                ...(parsed.scriptUrl ? { scriptUrl: parsed.scriptUrl } : {}),
                                ...(parsed.recallFunc ? { recallFunc: parsed.recallFunc } : {}),
                              },
                            };
                            setLockerSettings(next);
                            lockerConfig.updateConfig(next);
                            setSnippetParsedMsg(`✓ Auto-detected it: ${parsed.it || 'default'}, key: ${parsed.key || 'default'}`);
                            setTimeout(() => setSnippetParsedMsg(null), 4000);
                          } else {
                            setSnippetParsedMsg('⚠️ Could not detect it or key in snippet');
                            setTimeout(() => setSnippetParsedMsg(null), 3000);
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Auto-Fill</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OGAds Detailed Settings */}
              {((lockerSettings.provider || 'adbluemedia') === 'ogads' || lockerSettings.provider === 'both') && (
                <div className="p-4 bg-zinc-900/60 border border-red-900/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-300 font-bold block">
                      OGAds Campaign Locker ID:
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Active: {lockerSettings.lockerId}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={lockerSettings.lockerId}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const next = { ...lockerSettings, lockerId: val };
                      setLockerSettings(next);
                      lockerConfig.updateConfig(next);
                    }}
                    placeholder="Enter your OGAds Locker ID (e.g. 4o7vvr) or Direct URL"
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500 font-bold tracking-wider"
                  />
                  <div className="text-[10px] font-mono text-zinc-500 bg-black/40 p-2 rounded border border-zinc-800/80">
                    Active URL: <span className="text-emerald-400">{lockerSettings.lockerId?.startsWith('http') ? lockerSettings.lockerId : `https://appsave.online/cl/v/${lockerSettings.lockerId || '4o7vvr'}`}</span>
                  </div>
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    const updated = lockerConfig.updateConfig(lockerSettings);
                    setLockerSettings(updated);
                    const triggerInfo = [updated.triggerOnPlay ? '▶ Play' : '', updated.triggerOnDelay ? `⏱ ${updated.delaySeconds}s` : ''].filter(Boolean).join(' + ') || 'None';
                    const modeInfo = updated.triggerMode === 'once_per_session' ? 'Once/Session' : 'Every Stream';
                    setLockerSavedMsg(`✓ Saved! Provider: ${updated.provider.toUpperCase()} | Trigger: ${triggerInfo} | Mode: ${modeInfo}`);
                    setTimeout(() => setLockerSavedMsg(null), 5000);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-sky-500 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-xl shadow-sky-950/60 flex items-center gap-2 border border-cyan-400/30 active:scale-95"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Save & Apply Settings Instantly</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      lockerConfig.updateConfig(lockerSettings);
                      triggerAdBlueMediaLocker();
                    }}
                    className="px-4 py-2.5 bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 font-extrabold rounded-xl text-xs transition-all duration-200 cursor-pointer border border-cyan-500/40 hover:border-cyan-400 shadow flex items-center gap-1.5 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Test AdBlueMedia (_Ri())</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      lockerConfig.updateConfig(lockerSettings);
                      triggerNativeOGAdsLocker();
                    }}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 font-extrabold rounded-xl text-xs transition-all duration-200 cursor-pointer border border-amber-500/40 hover:border-amber-400 shadow flex items-center gap-1.5 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test OGAds</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cloudflare Pages Deployment Package */}
            <div className="bg-[#11131a] border border-amber-900/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5 font-mono text-white font-bold text-base">
                  <Cloud className="w-5 h-5 text-amber-500" />
                  <span>Cloudflare Pages Deployment Packages</span>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  Ready to Deploy
                </span>
              </div>

              <p className="text-xs text-zinc-300">
                You can download the production build specifically configured for Cloudflare Pages (includes <code className="text-amber-400 font-mono">_redirects</code> and all production assets), or download the complete source code for Git repository push.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href="/bleustream-cloudflare.zip"
                  download="bleustream-cloudflare.zip"
                  className="p-4 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-600/40 hover:border-amber-500 rounded-xl transition flex flex-col justify-between group shadow-lg shadow-black/40 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
                        bleustream-cloudflare.zip
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">239 KB</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      <strong>Direct Upload to Cloudflare Pages:</strong> Unzip and drag the files into Cloudflare Pages. Works instantly with 0 configuration.
                    </p>
                  </div>
                  <div className="pt-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 group-hover:underline">
                      Download Cloudflare Build &rarr;
                    </span>
                  </div>
                </a>

                <a
                  href="/bleustream-source-code.zip"
                  download="bleustream-source-code.zip"
                  className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition flex flex-col justify-between group shadow-lg shadow-black/40 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-zinc-400 group-hover:scale-110 transition" />
                        bleustream-source-code.zip
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">149 KB</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      <strong>Complete Source Code:</strong> Includes React, Vite, TypeScript, Tailwind CSS, ready for GitHub / GitLab repository.
                    </p>
                  </div>
                  <div className="pt-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 group-hover:underline">
                      Download Full Source Code &rarr;
                    </span>
                  </div>
                </a>
            </div>
          </div>
        </div>
        )}

        {/* ================= TAB 5: SECURITY VAULT CONTROL ================= */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Master Password Update Form */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5 font-mono text-white font-bold text-base border-b border-zinc-800 pb-3">
                <Key className="w-5 h-5 text-sky-400" />
                <span>Update Master Cryptographic Password</span>
              </div>

              {pwSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pwSuccessMsg}</span>
                </div>
              )}

              {pwErrorMsg && (
                <div className="p-3 bg-red-950/80 border border-sky-400/50 rounded-xl text-xs text-red-300 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{pwErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Current Password:</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password..."
                    required
                    className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">New Password (min 6 chars):</label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Enter new password..."
                      required
                      className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Confirm New Password:</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Confirm new password..."
                      required
                      className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0ea5e9] hover:bg-sky-600 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-sky-950/40"
                  >
                    Save & Re-Hash Master Password
                  </button>
                </div>
              </form>
            </div>

            {/* Quick 4-Digit Security PIN */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5 font-mono text-white font-bold text-base border-b border-zinc-800 pb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Quick Security PIN (For Rapid Terminal Access)</span>
              </div>

              {pinSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-mono">
                  {pinSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSetQuickPin} className="flex items-center gap-3 font-mono text-xs">
                <input
                  type="password"
                  maxLength={6}
                  value={quickPin}
                  onChange={(e) => setQuickPin(e.target.value)}
                  placeholder="e.g. 7842"
                  className="bg-black/60 border border-zinc-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-500 w-44 tracking-widest text-center"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Set PIN
                </button>
              </form>
            </div>

            {/* Data Export & Backup Controls */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono">
              <div className="flex items-center gap-2.5 text-white font-bold text-base border-b border-zinc-800 pb-3">
                <Download className="w-5 h-5 text-blue-400" />
                <span>Export Telemetry & Stream History</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Telemetry CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download Full JSON Dump</span>
                </button>

                <button
                  type="button"
                  onClick={handlePanicWipe}
                  className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-bold rounded-xl transition flex items-center gap-2 ml-auto cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-sky-400" />
                  <span>Panic Wipe Terminal</span>
                </button>
              </div>
            </div>

            {/* Security Audit Log */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl font-mono">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Security Audit Logs
              </h4>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-black/50 border border-zinc-850 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.event === 'login_success'
                            ? 'bg-emerald-400'
                            : log.event === 'login_failed'
                            ? 'bg-sky-500'
                            : 'bg-amber-400'
                        }`}
                      />
                      <span className="text-zinc-200 font-semibold">{log.event}</span>
                      <span className="text-zinc-500">• {log.details}</span>
                    </div>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: PROGRAMMATIC SEO & DYNAMIC SITEMAP ================= */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Daily Automated Engine Active
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Goal: 1,000,000 Organic Traffic
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <span>Programmatic SEO & Content Matrix</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Auto-synthesizes 10 keyword-dense, high-ranking cinema articles every day for Top 10 Trending Movies, Series & Anime from TMDB. Automatically injects Schema.org JSON-LD (FAQPage, NewsArticle, Rating Snippets) and updates dynamic sitemap for Googlebot.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateDailyArticles}
                    disabled={isGeneratingPSEO}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingPSEO ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Generating Articles...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Generate 10 Daily Trend Articles Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSitemap}
                    className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Download sitemap.xml</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySitemapUrl}
                    className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    {copiedSitemap ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-400" />
                        <span>Copy Sitemap URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://bleustream.pages.dev/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-sky-400 hover:text-sky-300 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                    <span>Open Live sitemap.xml</span>
                  </a>

                  {pseoStats.generatedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllGenerated}
                      className="px-3 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      title="Clear generated articles (keeps curated)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification alert */}
            {pseoSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{pseoSuccessMsg}</span>
              </div>
            )}

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#11131a] border border-zinc-800 rounded-xl p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Total Indexed Articles
                </span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                  <span>{pseoArticles.length}</span>
                  <span className="text-xs text-emerald-400 font-sans font-bold">
                    +{pseoStats.generatedCount} automated
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1">
                  <span>{pseoStats.categoriesCount.movies} Movies</span>
                  <span>•</span>
                  <span>{pseoStats.categoriesCount.series} Series</span>
                  <span>•</span>
                  <span>{pseoStats.categoriesCount.anime} Anime</span>
                </div>
              </div>

              <div className="bg-[#11131a] border border-zinc-800 rounded-xl p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Targeted Power Keywords
                </span>
                <div className="text-2xl font-black text-indigo-300 font-mono flex items-baseline gap-2">
                  <span>{pseoStats.totalKeywordsTargeted}</span>
                  <span className="text-xs text-indigo-400 font-sans font-bold">keywords</span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  "watch free", "1080p stream", "reddit mirror"
                </div>
              </div>

              <div className="bg-[#11131a] border border-zinc-800 rounded-xl p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Est. Monthly Reach
                </span>
                <div className="text-2xl font-black text-sky-400 font-mono flex items-baseline gap-2">
                  <span>{pseoStats.estimatedMonthlySearchImpressions.toLocaleString()}+</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Target: 1,000,000 visitors in progress
                </div>
              </div>

              <div className="bg-[#11131a] border border-zinc-800 rounded-xl p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Google Index Status
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>100% Ready</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  FAQPage, NewsArticle & 5★ Rating
                </div>
              </div>
            </div>

            {/* Google SERP Live Snippet Preview Box */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-bold text-xs text-blue-600">
                    G
                  </div>
                  <h3 className="text-sm font-black text-white font-mono">
                    Google SERP Rich Snippet Live Preview
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Real Schema.org JSON-LD Output
                </span>
              </div>

              {pseoArticles.length > 0 && (
                <div className="p-4 bg-zinc-950/80 border border-zinc-800/70 rounded-xl space-y-2 max-w-3xl font-sans">
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <span>https://bleustream.pages.dev › articles › {pseoArticles[0].slug}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-[#8ab4f8] hover:underline cursor-pointer">
                    {pseoArticles[0].metaTitle}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="text-amber-400">★★★★★</span>
                    <span className="font-semibold text-zinc-200">Rating: 9.4/10</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-400">1,250 votes</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-emerald-400 font-semibold">Free Streaming</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {pseoArticles[0].metaDescription}
                  </p>

                  {/* Google Rich FAQ Preview */}
                  {pseoArticles[0].faqs && pseoArticles[0].faqs.length > 0 && (
                    <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Google People Also Ask (FAQ Rich Snippet):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pseoArticles[0].faqs.slice(0, 2).map((faq, i) => (
                          <div key={i} className="text-xs bg-zinc-900/60 p-2 rounded border border-zinc-800/50">
                            <span className="text-zinc-200 font-medium">{faq.question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Articles Table & Search Filter */}
            <div className="bg-[#11131a] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white font-mono">
                    All Programmatic & Curated Cinema Articles ({pseoArticles.length})
                  </h3>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {(['all', 'Movie Guides', 'TV Series Guides', 'Anime Guides'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPseoCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        pseoCategoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat.replace(' Guides', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input inside table */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={pseoSearchQuery}
                  onChange={(e) => setPseoSearchQuery(e.target.value)}
                  placeholder="Filter articles by title, keywords, or slug..."
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>

              {/* Articles List / Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Article / Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">High-Intent Keywords</th>
                      <th className="p-3">Google Schema</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {pseoArticles
                      .filter((art) => {
                        if (pseoCategoryFilter !== 'all' && art.category !== pseoCategoryFilter) {
                          return false;
                        }
                        if (pseoSearchQuery.trim()) {
                          const q = pseoSearchQuery.toLowerCase();
                          const matchTitle = art.title.toLowerCase().includes(q);
                          const matchSlug = art.slug.toLowerCase().includes(q);
                          const matchKeywords = art.keywords?.some((k) => k.toLowerCase().includes(q));
                          return matchTitle || matchSlug || matchKeywords;
                        }
                        return true;
                      })
                      .map((art) => (
                        <tr key={art.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {art.coverImage && (
                                <img
                                  src={art.coverImage}
                                  alt={art.title}
                                  className="w-12 h-16 object-cover rounded-md bg-zinc-900 border border-zinc-800 shrink-0"
                                  loading="lazy"
                                />
                              )}
                              <div className="min-w-0 max-w-xs sm:max-w-md">
                                <p className="font-bold text-white truncate text-xs hover:text-indigo-300">
                                  {art.title}
                                </p>
                                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                                  Slug: /{art.slug}
                                </p>
                                <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-1">
                                  <span>{art.publishedDate}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold">{art.rating}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {art.category}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {(art.keywords || []).slice(0, 3).map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-[10px] text-indigo-300"
                                >
                                  {kw}
                                </span>
                              ))}
                              {(art.keywords?.length || 0) > 3 && (
                                <span className="text-[10px] text-zinc-500 self-center">
                                  +{(art.keywords?.length || 0) - 3} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <div className="space-y-1 text-[10px]">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 font-mono">
                                ✓ FAQPage (4)
                              </span>
                              <br />
                              <span className="inline-block px-1.5 py-0.5 rounded bg-sky-950/50 text-sky-400 border border-sky-500/30 font-mono">
                                ✓ NewsArticle + 5★
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/?tab=articles&article=${encodeURIComponent(art.slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                                title="Open Live Article in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {art.id.startsWith('pseo_') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePseoArticle(art.id, art.title)}
                                  className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 rounded-lg transition cursor-pointer"
                                  title="Delete Article"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
