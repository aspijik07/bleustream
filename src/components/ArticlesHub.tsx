import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Star,
  Play,
  ArrowRight,
  Search,
  Sparkles,
  ChevronRight,
  Share2,
  Film,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Tv,
  Flame,
  Layers,
  Compass,
  Check,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { SEO_ARTICLES, SEOArticle } from '../data/seoArticles';
import { pseoEngine } from '../services/pseoEngine';

interface ArticlesHubProps {
  initialSlug?: string | null;
  onPlayMediaById: (mediaId: number, type: 'movie' | 'tv', title: string) => void;
  onBackToHome: () => void;
}

export const ArticlesHub: React.FC<ArticlesHubProps> = ({
  initialSlug,
  onPlayMediaById,
  onBackToHome,
}) => {
  const [articlesList, setArticlesList] = useState<SEOArticle[]>(() =>
    pseoEngine.getAllArticles()
  );
  const [selectedArticle, setSelectedArticle] = useState<SEOArticle | null>(() => {
    if (initialSlug) {
      return (
        pseoEngine.getAllArticles().find((a) => a.slug === initialSlug) || null
      );
    }
    return null;
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync with dynamic pSEO articles
  useEffect(() => {
    const unsub = pseoEngine.subscribe(() => {
      setArticlesList(pseoEngine.getAllArticles());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (initialSlug) {
      const found = pseoEngine.getAllArticles().find((a) => a.slug === initialSlug);
      if (found) {
        setSelectedArticle(found);
      }
    }
  }, [initialSlug]);

  // Scroll to top and inject Schema.org JSON-LD when viewing article
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!selectedArticle) {
      document.title =
        'Cinema Guides & Streaming Articles – Watch Movies Free in HD | BleuStream';
      return;
    }

    document.title = selectedArticle.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', selectedArticle.metaDescription);

    // Dynamic Schema.org JSON-LD injection for Google Rich Snippets
    let scriptTag = document.getElementById(
      'article-jsonld'
    ) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'article-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'NewsArticle',
          headline: selectedArticle.title,
          image: [selectedArticle.coverImage],
          datePublished: selectedArticle.publishedDate,
          dateModified:
            selectedArticle.modifiedDate || selectedArticle.publishedDate,
          author: {
            '@type': 'Person',
            name: selectedArticle.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'BleuStream HD Cinema',
            url: 'https://bleustream.pages.dev',
          },
          description: selectedArticle.excerpt,
        },
        {
          '@type':
            selectedArticle.relatedMediaType === 'tv' ? 'TVSeries' : 'Movie',
          name: selectedArticle.relatedMediaTitle,
          image: selectedArticle.coverImage,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: parseFloat(selectedArticle.rating) || 8.6,
            bestRating: '10',
            ratingCount: 1540,
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: selectedArticle.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://bleustream.pages.dev/',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Articles Hub',
              item: 'https://bleustream.pages.dev/?tab=articles',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: selectedArticle.title,
              item: `https://bleustream.pages.dev/?tab=articles&article=${selectedArticle.slug}`,
            },
          ],
        },
      ],
    };

    scriptTag.textContent = JSON.stringify(jsonLd);

    return () => {
      const el = document.getElementById('article-jsonld');
      if (el) el.remove();
    };
  }, [selectedArticle]);

  const categories = [
    'All',
    'Movie Guides',
    'TV Series Guides',
    'Anime Guides',
    'Curated Recommendations',
  ];

  const filteredArticles = useMemo(() => {
    return articlesList.filter((article) => {
      const matchesCategory =
        activeCategory === 'All' || article.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        (article.keywords || []).some((k) => k.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [articlesList, activeCategory, searchQuery]);

  // Featured Hero Article for Landing Page
  const heroArticle = useMemo(() => {
    return articlesList[0] || SEO_ARTICLES[0];
  }, [articlesList]);

  // Top trending titles for clickable chips
  const trendingChips = useMemo(() => {
    return articlesList.slice(0, 6);
  }, [articlesList]);

  // Related articles for internal cross-linking when viewing an article
  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];
    return articlesList
      .filter((a) => a.id !== selectedArticle.id)
      .slice(0, 6);
  }, [articlesList, selectedArticle]);

  const handleShare = (art: SEOArticle) => {
    const url = `https://bleustream.pages.dev/?tab=articles&article=${encodeURIComponent(
      art.slug
    )}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenArticle = (art: SEOArticle) => {
    setSelectedArticle(art);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ================= DETAILED ARTICLE READER VIEW =================
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-[#101115] text-white pt-24 pb-24 px-4 sm:px-6 lg:px-8 animate-fade-in font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Breadcrumbs & Back Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-1 transition" />
              <span>Back to Cinema Guides Hub</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleShare(selectedArticle)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Guide</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Article Header & Badges */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-black rounded-full uppercase tracking-wider">
                {selectedArticle.category}
              </span>
              <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{selectedArticle.rating}</span>
              </span>
              <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-full">
                100% Free Stream
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {selectedArticle.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-zinc-400 font-medium">
              <span className="text-zinc-200">
                By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{selectedArticle.publishedDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{selectedArticle.readTime}</span>
              </span>
            </div>

            {/* In-Article Internal Keyword Links Bar (User clicks from article to article) */}
            <div className="pt-2">
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Explore More Cinema Guides:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {relatedArticles.slice(0, 4).map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => handleOpenArticle(rel)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950/80 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/50 text-xs text-zinc-300 hover:text-red-300 transition cursor-pointer truncate max-w-xs text-left"
                    >
                      👉 {rel.relatedMediaTitle || rel.title.split('–')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cover Hero Banner with Vibrant RED Watch Button */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group">
            <img
              src={selectedArticle.coverImage}
              alt={selectedArticle.title}
              className="w-full h-72 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase tracking-wider inline-block">
                    4K ULTRA HD PLAYBACK
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow">
                    Stream {selectedArticle.relatedMediaTitle} Now
                  </h3>
                  <p className="text-xs text-zinc-300 drop-shadow">
                    Instant playback across 7 verified cloud mirrors with zero buffering.
                  </p>
                </div>

                {/* The WATCH BUTTON IN RED */}
                <button
                  type="button"
                  onClick={() =>
                    onPlayMediaById(
                      selectedArticle.relatedMediaId,
                      selectedArticle.relatedMediaType,
                      selectedArticle.relatedMediaTitle
                    )
                  }
                  className="px-7 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm transition-all duration-200 shadow-xl shadow-red-950/80 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Free Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Technical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Quality</span>
              <p className="text-xs font-black text-white">4K UHD & 1080p</p>
            </div>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Audio Tracks</span>
              <p className="text-xs font-black text-white">Dolby 5.1 & Stereo</p>
            </div>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Subtitles</span>
              <p className="text-xs font-black text-white">EN, FR, ES, AR, DE</p>
            </div>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">CDN Status</span>
              <p className="text-xs font-black text-emerald-400">7 Mirrors Online</p>
            </div>
          </div>

          {/* Excerpt Lead Quote */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border-l-4 border-red-500 text-zinc-200 text-base sm:text-lg leading-relaxed italic">
            "{selectedArticle.excerpt}"
          </div>

          {/* Content Sections with Keywords & Bullet Points */}
          <div className="space-y-8 text-zinc-300 leading-relaxed text-sm sm:text-base">
            {selectedArticle.sections.map((section, idx) => (
              <div
                key={idx}
                className="space-y-4 p-6 sm:p-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-lg"
              >
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Film className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{section.heading}</span>
                </h2>

                {section.subheading && (
                  <h3 className="text-base font-bold text-zinc-200">{section.subheading}</h3>
                )}

                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-zinc-300 leading-relaxed">
                    {p}
                  </p>
                ))}

                {section.bulletPoints && (
                  <ul className="space-y-2 pt-2">
                    {section.bulletPoints.map((point, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* In-article contextual cross-links injected between sections */}
                {idx === 1 && relatedArticles.length > 0 && (
                  <div className="my-4 p-4 bg-black/50 border border-red-500/30 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recommended Stream in the Same Genre:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenArticle(relatedArticles[0])}
                      className="text-xs sm:text-sm font-bold text-white hover:text-red-300 underline block text-left transition cursor-pointer"
                    >
                      {relatedArticles[0].title}
                    </button>
                    <p className="text-[11px] text-zinc-400">
                      {relatedArticles[0].excerpt.slice(0, 140)}...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Google FAQ Accordions for Rich Snippets */}
          {selectedArticle.faqs && selectedArticle.faqs.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>Frequently Asked Questions</span>
              </h2>
              <div className="space-y-3">
                {selectedArticle.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2 shadow"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 text-xs flex items-center justify-center font-mono font-bold">
                        Q
                      </span>
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 pl-7 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Stream Call-To-Action with Big RED Launch Button */}
          <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-red-950/70 via-zinc-950 to-black border border-red-500/50 text-center space-y-4 shadow-2xl">
            <Sparkles className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Watch {selectedArticle.relatedMediaTitle} Full Movie on BleuStream
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Choose from 7 verified fast mirrors including VidSrc Cloud and enjoy unrestricted 4K Ultra HD cinema without any subscriptions or ads.
            </p>
            <button
              type="button"
              onClick={() =>
                onPlayMediaById(
                  selectedArticle.relatedMediaId,
                  selectedArticle.relatedMediaType,
                  selectedArticle.relatedMediaTitle
                )
              }
              className="px-9 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-base transition shadow-2xl shadow-red-950/90 inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Launch Video Player in 4K</span>
            </button>
          </div>

          {/* Internal Cross-Linking Grid: User jumps from article to article */}
          <div className="space-y-4 pt-8 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-red-500" />
                  <span>Up Next: Recommended Cinema Guides</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Keep exploring trending movies and series guides on BleuStream
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleOpenArticle(art)}
                  className="p-3.5 bg-zinc-900/60 border border-zinc-800 hover:border-red-500/60 rounded-xl cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative overflow-hidden rounded-lg mb-2.5 aspect-video bg-black">
                      <img
                        src={art.coverImage}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white uppercase">
                        {art.category.replace(' Guides', '')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-red-300 line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                      {art.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-850 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {art.readTime}
                    </span>
                    <span className="text-xs font-bold text-red-400 group-hover:underline flex items-center gap-1">
                      Read Guide <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= ULTRA-PRO ARTICLES HUB DIRECTORY LANDING PAGE =================
  return (
    <div className="min-h-screen bg-[#101115] text-white pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* ================= HERO FEATURED SHOWCASE BANNER ================= */}
        {heroArticle && (
          <div className="relative rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-zinc-950 group">
            <div className="relative h-[380px] sm:h-[460px] w-full">
              <img
                src={heroArticle.coverImage}
                alt={heroArticle.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              {/* Cinematic Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#101115] via-[#101115]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#101115] via-[#101115]/50 to-transparent" />

              {/* Hero Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-3xl space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-red-950/80 flex items-center gap-1.5">
                    <Flame className="w-3 h-3 fill-white" />
                    Featured Cinema Guide
                  </span>
                  <span className="px-2.5 py-1 bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-full">
                    {heroArticle.category}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1 font-mono">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {heroArticle.rating}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                  {heroArticle.title}
                </h1>

                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 max-w-2xl leading-relaxed">
                  {heroArticle.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {/* RED WATCH BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      onPlayMediaById(
                        heroArticle.relatedMediaId,
                        heroArticle.relatedMediaType,
                        heroArticle.relatedMediaTitle
                      )
                    }
                    className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs sm:text-sm transition shadow-xl shadow-red-950/80 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Free Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenArticle(heroArticle)}
                    className="px-5 py-3.5 bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs sm:text-sm border border-zinc-700 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TRENDING CHIPS BAR (CLICKABLE CROSS-LINKS) ================= */}
        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300 shrink-0">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Trending Guides:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {trendingChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleOpenArticle(chip)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950/90 hover:bg-red-950/50 border border-zinc-800 hover:border-red-500/50 text-xs font-bold text-zinc-300 hover:text-red-300 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{chip.relatedMediaTitle || chip.title.split('–')[0]}</span>
                <span className="text-[10px] text-amber-400 font-mono">★</span>
              </button>
            ))}
          </div>
        </div>

        {/* ================= CATEGORIES & SEARCH CONTROLS ================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl shadow-xl">
          {/* Category Tabs with Article Counts */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? articlesList.length
                  : articlesList.filter((a) => a.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span>{cat === 'All' ? 'All Guides' : cat.replace(' Guides', '')}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-red-950 text-red-200'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, guides, keywords..."
              className="w-full bg-black/60 border border-zinc-700 focus:border-red-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none transition"
            />
          </div>
        </div>

        {/* ================= ARTICLES GRID ================= */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 space-y-3">
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-zinc-300">No articles match your query</h3>
            <p className="text-xs text-zinc-500">
              Try searching with a different movie title or reset category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-[#15161b] border border-zinc-800/90 hover:border-red-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl group"
              >
                <div>
                  {/* Backdrop / Poster Thumbnail with Hover Play Icon */}
                  <div
                    onClick={() => handleOpenArticle(art)}
                    className="relative aspect-video overflow-hidden cursor-pointer bg-black"
                  >
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition duration-300 shadow-xl shadow-red-950/80">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur border border-zinc-700 text-white">
                        {art.category.replace(' Guides', '')}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{art.rating}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                      <span>{art.publishedDate}</span>
                      <span>•</span>
                      <span>{art.readTime}</span>
                    </div>

                    <h2
                      onClick={() => handleOpenArticle(art)}
                      className="text-base font-bold text-white group-hover:text-red-400 transition cursor-pointer line-clamp-2 leading-snug"
                    >
                      {art.title}
                    </h2>

                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>

                    {/* Keywords pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(art.keywords || []).slice(0, 2).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer with RED WATCH BUTTON */}
                <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-zinc-800/80 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenArticle(art)}
                    className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Read Guide</span>
                    <ChevronRight className="w-3.5 h-3.5 text-red-500" />
                  </button>

                  {/* RED WATCH BUTTON ON CARD */}
                  <button
                    type="button"
                    onClick={() =>
                      onPlayMediaById(
                        art.relatedMediaId,
                        art.relatedMediaType,
                        art.relatedMediaTitle
                      )
                    }
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/60 active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Movie</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ================= SEO AUTHORITY VALUE SECTION ================= */}
        <div className="p-8 sm:p-10 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-red-500" />
              <span>BleuStream Cinema Editorial Standards</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Every guide on BleuStream is generated and curated to connect you directly to verified, high-speed streaming mirrors with zero malware, zero subscription fees, and multi-language audio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Daily Trending TMDB Sync</h4>
              <p className="text-xs text-zinc-400">
                Fresh guides published every 24 hours covering the latest box office hits and seasonal anime.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
              <Film className="w-5 h-5 text-red-400" />
              <h4 className="text-sm font-bold text-white">Ultra HD 4K & 1080p</h4>
              <p className="text-xs text-zinc-400">
                Pristine quality with Dolby audio tracks and subtitles in English, French, Spanish, and Arabic.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Anti-Popup Shield</h4>
              <p className="text-xs text-zinc-400">
                Sandbox sandbox architecture filtering aggressive redirects and invasive popups.
              </p>
            </div>
          </div>
        </div>

        {/* ================= GOOGLEBOT CRAWL DIRECTORY & DYNAMIC SITEMAP HUB ================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0c0e] border border-zinc-800/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Search Engine Index & Complete XML Sitemap Directory
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                All {allArticles.length} cinema guides dynamically registered for Googlebot, Bingbot & DuckDuckGo crawler indexing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-sky-500/50 text-sky-400 hover:text-sky-300 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Live sitemap.xml</span>
              </a>
            </div>
          </div>

          {/* Complete HTML Links Grid for Ultra-Fast Crawling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allArticles.map((art, idx) => (
              <a
                key={art.id}
                href={`/?tab=articles&article=${art.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenArticle(art);
                }}
                className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 hover:border-red-500/50 hover:bg-zinc-900/60 transition group flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="font-mono text-zinc-400">#{idx + 1} • {art.category}</span>
                    <span className="text-amber-400/90 font-mono">Priority 0.85</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200 group-hover:text-red-400 transition line-clamp-2 leading-snug">
                    {art.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-900">
                  <span className="font-mono">{art.publishedDate}</span>
                  <span className="text-red-400 group-hover:translate-x-1 transition flex items-center gap-1 font-semibold">
                    Read Guide →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
