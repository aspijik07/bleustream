import React, { useState } from 'react';
import { X, Key, Shield, Clock, Download, Check, RefreshCw, Sparkles, Database, Cloud, Layers, Zap } from 'lucide-react';
import { AppSettings } from '../types';
import { DEFAULT_TMDB_API_KEY } from '../services/tmdb';
import { generateAndDownloadZip } from '../utils/exportZip';
import { lockerConfig, LockerProvider } from '../services/lockerConfig';
import { triggerActiveLocker } from '../utils/locker';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  onTriggerTestLocker: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  onTriggerTestLocker,
}) => {
  const [apiKey, setApiKey] = useState(settings.tmdbApiKey);
  const [lockerEnabled, setLockerEnabled] = useState(settings.lockerEnabled);
  const [provider, setProvider] = useState<LockerProvider>(() => lockerConfig.get().provider || 'adbluemedia');
  const [lockerId, setLockerId] = useState(() => lockerConfig.get().lockerId || settings.lockerId);
  const [adBlueIt, setAdBlueIt] = useState<string | number>(() => lockerConfig.get().adBlueMedia?.it ?? 4192251);
  const [adBlueKey, setAdBlueKey] = useState<string>(() => lockerConfig.get().adBlueMedia?.key || 'db00c');
  const [triggerOnPlay, setTriggerOnPlay] = useState<boolean>(() => lockerConfig.get().triggerOnPlay ?? true);
  const [delaySeconds, setDelaySeconds] = useState(settings.lockerDelaySeconds);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [relockedSuccess, setRelockedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = lockerId.trim() || lockerConfig.get().lockerId || 'o4e5p2';
    lockerConfig.updateConfig({
      provider,
      enabled: lockerEnabled,
      lockerId: cleanId,
      triggerOnPlay,
      delaySeconds: Math.max(0, Number(delaySeconds) || 0),
      adBlueMedia: {
        ...lockerConfig.get().adBlueMedia,
        it: adBlueIt ? (Number(adBlueIt) || adBlueIt) : 4192251,
        key: adBlueKey.trim() || 'db00c',
      },
    });
    onSave({
      tmdbApiKey: apiKey.trim() || DEFAULT_TMDB_API_KEY,
      lockerEnabled,
      lockerId: cleanId,
      lockerDelaySeconds: Math.max(0, Number(delaySeconds) || 0),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleDownload = async () => {
    setDownloadingZip(true);
    try {
      await generateAndDownloadZip();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleResetDefault = () => {
    setApiKey(DEFAULT_TMDB_API_KEY);
    setLockerEnabled(true);
    setLockerId('o4e5p2');
    setDelaySeconds(20);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#181818] border border-zinc-700/70 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#202020] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">BleuStream Settings</h2>
              <p className="text-xs text-zinc-400">Configure TMDB API and CPA Locker Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* TMDB API Key */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-semibold text-zinc-200">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" /> TMDB v3 API Key
              </span>
              <button
                type="button"
                onClick={() => setApiKey(DEFAULT_TMDB_API_KEY)}
                className="text-[11px] text-cyan-400 hover:text-red-300 transition"
              >
                Use Default Working Key
              </button>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. abdde991ce2a56652d4c0ca156db7836"
              className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-700 focus:border-sky-400 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 outline-none transition"
            />
            <p className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              Connected to The Movie Database catalog for high-resolution posters and live metadata.
            </p>
          </div>

          {/* CPA Locker Configuration */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-400" /> OGAds CPA Locker
                </span>
                <p className="text-xs text-zinc-400">
                  Activates Human Verification locker (LAST())
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockerEnabled}
                  onChange={(e) => setLockerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
              </label>
            </div>

            {lockerEnabled && (
              <div className="space-y-4 pt-3 border-t border-zinc-800">
                {/* Platform Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>CPA Network Provider</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvider('adbluemedia')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                        provider === 'adbluemedia'
                          ? 'bg-blue-600/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="text-xs">AdBlueMedia</div>
                      <div className="text-[10px] text-zinc-400">CloudFront + _Ri()</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('ogads')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                        provider === 'ogads'
                          ? 'bg-sky-500/20 border-sky-400 text-red-300 font-bold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="text-xs">OGAds Native</div>
                      <div className="text-[10px] text-zinc-400">AppSave Locker ID</div>
                    </button>
                  </div>
                </div>

                {/* AdBlueMedia inputs */}
                {provider === 'adbluemedia' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-cyan-300">Campaign `it` ID</label>
                      <input
                        type="text"
                        value={adBlueIt}
                        onChange={(e) => setAdBlueIt(e.target.value)}
                        placeholder="e.g. 4192251"
                        className="w-full px-3 py-1.5 bg-black/70 border border-zinc-700 focus:border-cyan-500 rounded-lg text-xs font-mono text-cyan-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-cyan-300">Security `key`</label>
                      <input
                        type="text"
                        value={adBlueKey}
                        onChange={(e) => setAdBlueKey(e.target.value)}
                        placeholder="e.g. db00c"
                        className="w-full px-3 py-1.5 bg-black/70 border border-zinc-700 focus:border-cyan-500 rounded-lg text-xs font-mono text-cyan-400 outline-none"
                      />
                    </div>
                    <div className="col-span-full text-[10px] font-mono text-cyan-400/80">
                      Recall: <code className="bg-black/60 px-1 py-0.5 rounded">&lt;script&gt;_Ri();&lt;/script&gt;</code>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <label className="text-xs font-medium text-zinc-300">OGAds Locker ID</label>
                    <input
                      type="text"
                      value={lockerId}
                      onChange={(e) => setLockerId(e.target.value)}
                      placeholder="e.g. o4e5p2"
                      className="w-full px-3 py-2 bg-black/70 border border-zinc-700 focus:border-sky-400 rounded-lg text-xs font-mono text-zinc-100 outline-none"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono">Active ID: {lockerId}</span>
                  </div>
                )}

                {/* Trigger Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer p-2 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={triggerOnPlay}
                      onChange={(e) => setTriggerOnPlay(e.target.checked)}
                      className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Trigger on Play Button (▶ Triangle)</span>
                  </label>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> Hook Delay Seconds
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-black/70 border border-zinc-700 focus:border-sky-400 rounded-lg text-xs font-mono text-zinc-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={onTriggerTestLocker}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Test Preview Locker Modal
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.clear();
                    Object.keys(localStorage).forEach((key) => {
                      if (key.startsWith('unlocked_') || key.startsWith('flixstream_unlocked_')) {
                        localStorage.removeItem(key);
                      }
                    });
                  } catch {
                    // ignore
                  }
                  setRelockedSuccess(true);
                  setTimeout(() => setRelockedSuccess(false), 2500);
                }}
                className="text-cyan-400 hover:text-red-300 underline underline-offset-2 transition cursor-pointer"
              >
                {relockedSuccess ? '✓ All Re-Locked!' : 'Reset Unlock Status (Re-Lock All)'}
              </button>
            </div>
          </div>

          {/* Cloudflare & Source Code Export */}
          <div className="p-4 bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-900/40 rounded-xl space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloudflare Pages & Source Export</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Download the ready-to-deploy package for Cloudflare Pages or the complete source code.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloadingZip}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingZip ? 'Generating ZIP...' : '📦 Telecharger Code (Cloudflare Pages ZIP)'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              Restore Defaults
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0ea5e9] hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-sky-950/40 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
