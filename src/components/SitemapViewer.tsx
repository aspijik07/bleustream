import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Layers,
  Globe,
  Film,
  Compass,
} from 'lucide-react';
import { pseoEngine } from '../services/pseoEngine';
import { SEO_ARTICLES, SEOArticle } from '../data/seoArticles';
import { downloadSitemapFile, DEFAULT_SITE_DOMAIN } from '../services/sitemapGenerator';

interface SitemapViewerProps {
  onBackToHome?: () => void;
  onNavigateToUrl?: (url: string) => void;
}

export interface SitemapRow {
  index: number;
  url: string;
  path: string;
  priority: string;
  changeFreq: 'DAILY' | 'WEEKLY' | 'HOURLY';
  lastModified: string;
  type: 'core' | 'article' | 'watch';
  title?: string;
}

export const SitemapViewer: React.FC<SitemapViewerProps> = ({
  onBackToHome,
  onNavigateToUrl,
}) => {
  const [articles, setArticles] = useState<SEOArticle[]>(() =>
    pseoEngine.getAllArticles()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'articles' | 'watch' | 'core'>('all');
  const [copiedUrlIndex, setCopiedUrlIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Subscribe to pSEO engine so newly generated articles appear in real time!
  useEffect(() => {
    const unsub = pseoEngine.subscribe(() => {
      setArticles(pseoEngine.getAllArticles());
    });
    return unsub;
  }, []);

  const domain = 'https://bleustream.live';
  const today = new Date().toISOString().split('T')[0];

  // Build the complete list of URLs
  const allRows: SitemapRow[] = useMemo(() => {
    const list: SitemapRow[] = [];
    let idx = 1;

    // 1. Core Platform Pages
    const staticPages = [
      { path: '/', priority: '1.0', changeFreq: 'DAILY' as const, title: 'Home – BleuStream Ultra HD Cinema' },
      { path: '/?tab=articles', priority: '0.95', changeFreq: 'DAILY' as const, title: 'Cinema Guides Directory' },
      { path: '/?tab=movies', priority: '0.9', changeFreq: 'DAILY' as const, title: 'Browse Movies Catalog' },
      { path: '/?tab=tv', priority: '0.9', changeFreq: 'DAILY' as const, title: 'Browse TV Series Catalog' },
      { path: '/?tab=anime', priority: '0.9', changeFreq: 'DAILY' as const, title: 'Anime Universe (アニメ)' },
      { path: '/?tab=trending', priority: '0.9', changeFreq: 'DAILY' as const, title: 'Trending Cinema Right Now' },
      { path: '/?tab=watchlist', priority: '0.6', changeFreq: 'WEEKLY' as const, title: 'My Personal Watchlist' },
    ];

    staticPages.forEach((p) => {
      list.push({
        index: idx++,
        url: `${domain}${p.path}`,
        path: p.path,
        priority: p.priority,
        changeFreq: p.changeFreq,
        lastModified: today,
        type: 'core',
        title: p.title,
      });
    });

    // 2. Programmatic SEO & Curated Cinema Guides
    articles.forEach((art) => {
      const artPath = `/?tab=articles&article=${art.slug}`;
      list.push({
        index: idx++,
        url: `${domain}${artPath}`,
        path: artPath,
        priority: '0.85',
        changeFreq: 'DAILY',
        lastModified: art.modifiedDate || art.publishedDate || today,
        type: 'article',
        title: art.title,
      });
    });

    // 3. Direct Watch Media Streams for Top Titles
    const topMedia = [
      { id: 693134, title: 'Watch Dune: Part Two 4K Stream' },
      { id: 157336, title: 'Watch Interstellar 4K Stream' },
      { id: 27205, title: 'Watch Inception 4K Stream' },
      { id: 872585, title: 'Watch Oppenheimer 4K Stream' },
      { id: 533535, title: 'Watch Deadpool & Wolverine Stream' },
      { id: 66732, isTv: true, title: 'Watch Stranger Things S1 E1' },
      { id: 127532, isTv: true, title: 'Watch Solo Leveling Anime S1 E1' },
      { id: 85937, isTv: true, title: 'Watch Demon Slayer Anime S1 E1' },
      { id: 37854, isTv: true, title: 'Watch One Piece Anime S1 E1' },
      { id: 1399, isTv: true, title: 'Watch Game of Thrones S1 E1' },
      { id: 1396, isTv: true, title: 'Watch Breaking Bad S1 E1' },
    ];

    topMedia.forEach((m) => {
      const watchPath = m.isTv
        ? `/?watch=${m.id}&season=1&episode=1`
        : `/?watch=${m.id}`;
      list.push({
        index: idx++,
        url: `${domain}${watchPath}`,
        path: watchPath,
        priority: '0.85',
        changeFreq: 'DAILY',
        lastModified: today,
        type: 'watch',
        title: m.title,
      });
    });

    return list;
  }, [articles, domain, today]);

  // Filter rows based on search and category tabs
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (activeFilter !== 'all' && row.type !== activeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        row.url.toLowerCase().includes(q) ||
        (row.title && row.title.toLowerCase().includes(q))
      );
    });
  }, [allRows, activeFilter, searchQuery]);

  const handleCopyUrl = (url: string, index: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrlIndex(index);
      setTimeout(() => setCopiedUrlIndex(null), 2000);
    }
  };

  const handleCopyAllXml = () => {
    const xml = allRows.map((r) => r.url).join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(xml);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Back & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-1 transition" />
            <span>Back to BleuStream Cinema</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyAllXml}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">All URLs Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All URLs</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadSitemapFile(articles)}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 hover:bg-emerald-900/60 text-xs text-emerald-300 font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download sitemap.xml</span>
            </button>
          </div>
        </div>

        {/* ================= SITEMAP CONTAINER CARD (EXACT REPLICA OF USER SCREENSHOT) ================= */}
        <div className="rounded-3xl bg-[#11131a] border border-zinc-800/90 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Card Header with Brand Logo & TOTAL URLS Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                  <span className="text-sky-400">BLEU</span>
                  <span className="text-cyan-300">STREAM</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
                  SEO INDEX
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
                Programmatic SEO XML Sitemap Index for Search Engine Crawlers
              </p>
            </div>

            {/* TOTAL URLS Pill Badge */}
            <div className="flex items-center gap-2">
              <div className="px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>TOTAL URLS: {allRows.length}</span>
              </div>
            </div>
          </div>

          {/* Controls: Search Bar & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `All URLs (${allRows.length})` },
                {
                  id: 'articles',
                  label: `Cinema Guides (${allRows.filter((r) => r.type === 'article').length})`,
                },
                {
                  id: 'watch',
                  label: `Stream Pages (${allRows.filter((r) => r.type === 'watch').length})`,
                },
                {
                  id: 'core',
                  label: `Core Nav (${allRows.filter((r) => r.type === 'core').length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* In-Page Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search url, slug, or title..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          {/* ================= SITEMAP TABLE ================= */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-zinc-500">#</th>
                  <th className="py-3 px-4">URL LOCATION</th>
                  <th className="py-3 px-4 w-28 text-center">PRIORITY</th>
                  <th className="py-3 px-4 w-32 text-center">CHANGE FREQ</th>
                  <th className="py-3 px-4 w-36 text-right">LAST MODIFIED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 font-mono">
                {filteredRows.map((row) => (
                  <tr
                    key={row.index}
                    className="hover:bg-zinc-900/60 transition group"
                  >
                    {/* Index # */}
                    <td className="py-3.5 px-4 text-zinc-500 font-bold">
                      {row.index}
                    </td>

                    {/* URL LOCATION */}
                    <td className="py-3.5 px-4 font-sans font-medium">
                      <div className="flex items-center gap-2 min-w-0">
                        <a
                          href={row.path}
                          onClick={(e) => {
                            if (onNavigateToUrl) {
                              e.preventDefault();
                              onNavigateToUrl(row.path);
                            }
                          }}
                          className="text-zinc-200 hover:text-sky-400 transition truncate max-w-xs sm:max-w-md lg:max-w-xl group-hover:underline"
                          title={row.url}
                        >
                          {row.url}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(row.url, row.index)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition"
                          title="Copy URL"
                        >
                          {copiedUrlIndex === row.index ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {row.title && (
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-sans">
                          {row.title}
                        </p>
                      )}
                    </td>

                    {/* PRIORITY */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-sm">
                        {row.priority}
                      </span>
                    </td>

                    {/* CHANGE FREQ */}
                    <td className="py-3.5 px-4 text-center uppercase text-zinc-400 font-semibold text-[11px]">
                      {row.changeFreq}
                    </td>

                    {/* LAST MODIFIED */}
                    <td className="py-3.5 px-4 text-right text-zinc-400 font-mono text-[11px]">
                      {row.lastModified}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No URLs matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer inside Card: Live Stats & Crawlers Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] text-zinc-500 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                Real-time synchronized with Programmatic SEO generator (10 new articles daily)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Raw XML Feed</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span>Schema: sitemaps.org 0.9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
