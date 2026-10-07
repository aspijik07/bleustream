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
  ShieldAlert,
  AlertTriangle,
  Zap,
  ExternalLink,
  Volume2,
  Building2,
  Eye,
  Users,
} from 'lucide-react';
import { SEO_ARTICLES, SEOArticle, SimilarTitleItem } from '../data/seoArticles';
import { pseoEngine } from '../services/pseoEngine';
import { articleViewsTracker } from '../services/articleViewsTracker';
import { fetchDetails, fetchCredits, fetchSimilar, getPosterUrl } from '../services/tmdb';

interface ArticlesHubProps {
  initialSlug?: string | null;
  onPlayMediaById: (mediaId: number, type: 'movie' | 'tv', title: string) => void;
  onBackToHome: () => void;
  onSelectArticle?: (slug: string | null) => void;
}

export const ArticlesHub: React.FC<ArticlesHubProps> = ({
  initialSlug,
  onPlayMediaById,
  onBackToHome,
  onSelectArticle,
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
  const [liveSimilar, setLiveSimilar] = useState<SimilarTitleItem[]>([]);
  const [, setViewsTick] = useState<number>(0);

  // Sync with dynamic pSEO articles
  useEffect(() => {
    const unsub = pseoEngine.subscribe(() => {
      setArticlesList(pseoEngine.getAllArticles());
    });
    const unsubViews = articleViewsTracker.subscribe(() => {
      setViewsTick((v) => v + 1);
    });
    return () => {
      unsub();
      unsubViews();
    };
  }, []);

  // Record article view and reader presence whenever an article is opened
  useEffect(() => {
    if (selectedArticle) {
      articleViewsTracker.recordView(
        selectedArticle.slug,
        selectedArticle.title,
        selectedArticle.category
      );
    }
  }, [selectedArticle]);

  useEffect(() => {
    if (initialSlug) {
      const found = pseoEngine.getAllArticles().find((a) => a.slug === initialSlug);
      if (found) {
        setSelectedArticle(found);
      } else {
        const partial = pseoEngine.getAllArticles().find(
          (a) => a.slug.includes(initialSlug) || initialSlug.includes(a.slug)
        );
        if (partial) setSelectedArticle(partial);
      }
    } else if (initialSlug === null) {
      setSelectedArticle(null);
    }
  }, [initialSlug]);

  // Fetch live TMDB recommendations if needed
  useEffect(() => {
    if (!selectedArticle) {
      setLiveSimilar([]);
      return;
    }

    if (selectedArticle.relatedMediaId) {
      fetchSimilar(selectedArticle.relatedMediaType, selectedArticle.relatedMediaId)
        .then((items) => {
          if (items && items.length > 0) {
            const formatted: SimilarTitleItem[] = items.slice(0, 6).map((item) => ({
              id: item.id,
              title: item.title || item.name || 'Similar Title',
              mediaType: (item.media_type as 'movie' | 'tv') || selectedArticle.relatedMediaType,
              posterPath: getPosterUrl(item.poster_path, 'w500'),
              rating: `${(item.vote_average || 8.0).toFixed(1)}/10`,
              year: (item.release_date || item.first_air_date || '').slice(0, 4) || '2024',
            }));
            setLiveSimilar(formatted);
          }
        })
        .catch(() => {});
    }
  }, [selectedArticle]);

  // Scroll to top and inject Schema.org JSON-LD, OpenGraph & Canonical meta tags
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const setMeta = (nameOrProp: string, val: string, isProp = false) => {
      let el = document.querySelector(
        isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (isProp) el.setAttribute('property', nameOrProp);
        else el.setAttribute('name', nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    if (!selectedArticle) {
      document.title =
        'Cinema Guides & Streaming Articles – Watch Movies Free in HD | BleuStream';
      const hubCanonical = 'https://bleustream.pages.dev/?tab=articles';
      let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.rel = 'canonical';
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.href = hubCanonical;

      setMeta('og:title', 'Cinema Guides & Streaming Articles | BleuStream', true);
      setMeta(
        'og:description',
        'Explore verified cinema guides, chronological watch orders, and streaming reviews for trending movies and anime.',
        true
      );
      setMeta('og:url', hubCanonical, true);
      return;
    }

    document.title = selectedArticle.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', selectedArticle.metaDescription);

    // Dynamic Canonical Tag
    const canonicalHref = `https://bleustream.pages.dev/?tab=articles&article=${selectedArticle.slug}`;
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalHref;

    // Dynamic Multi-Language hreflang link tags (EN, FR, ES, AR) for Google Global Rankings
    const siteLangs = [
      { code: 'en', param: '' },
      { code: 'fr', param: '&lang=fr' },
      { code: 'es', param: '&lang=es' },
      { code: 'ar', param: '&lang=ar' },
    ];
    siteLangs.forEach(({ code, param }) => {
      let hl = document.querySelector(`link[rel="alternate"][hreflang="${code}"]`) as HTMLLinkElement | null;
      if (!hl) {
        hl = document.createElement('link');
        hl.rel = 'alternate';
        hl.setAttribute('hreflang', code);
        document.head.appendChild(hl);
      }
      hl.href = `${canonicalHref}${param}`;
    });
    let defHl = document.querySelector('link[rel="alternate"][hreflang="x-default"]') as HTMLLinkElement | null;
    if (!defHl) {
      defHl = document.createElement('link');
      defHl.rel = 'alternate';
      defHl.setAttribute('hreflang', 'x-default');
      document.head.appendChild(defHl);
    }
    defHl.href = canonicalHref;

    // Dynamic Open Graph Tags
    setMeta('og:title', selectedArticle.metaTitle, true);
    setMeta('og:description', selectedArticle.metaDescription, true);
    setMeta('og:image', selectedArticle.coverImage, true);
    setMeta('og:url', canonicalHref, true);
    setMeta(
      'og:type',
      selectedArticle.relatedMediaType === 'tv' ? 'video.tv_show' : 'video.movie',
      true
    );

    // Dynamic Twitter Card Tags
    setMeta('twitter:card', 'summary_large_image', false);
    setMeta('twitter:title', selectedArticle.metaTitle, false);
    setMeta('twitter:description', selectedArticle.metaDescription, false);
    setMeta('twitter:image', selectedArticle.coverImage, false);

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

    const releaseYear =
      selectedArticle.specs?.releaseYear ||
      selectedArticle.publishedDate.slice(0, 4);
    const schemaMediaType =
      selectedArticle.category === 'Anime Guides'
        ? 'TVSeries'
        : selectedArticle.relatedMediaType === 'tv'
        ? 'TVSeries'
        : 'Movie';

    const topActorsList =
      selectedArticle.topActors && selectedArticle.topActors.length > 0
        ? selectedArticle.topActors
        : ['Principal Lead Actor', 'Supporting Co-Star', 'Ensemble Cast'];

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
          '@type': schemaMediaType,
          name: selectedArticle.relatedMediaTitle || selectedArticle.title,
          image: selectedArticle.coverImage,
          description: selectedArticle.metaDescription || selectedArticle.excerpt,
          datePublished: releaseYear,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: parseFloat(selectedArticle.rating) || 8.6,
            bestRating: '10',
            ratingCount: 2450,
          },
          director: {
            '@type': 'Person',
            name: selectedArticle.director || 'Visionary Film Director',
          },
          actor: topActorsList.slice(0, 5).map((actorName) => ({
            '@type': 'Person',
            name: actorName,
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
              name: 'Cinema Guides',
              item: 'https://bleustream.pages.dev/?tab=articles',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: selectedArticle.category,
              item: `https://bleustream.pages.dev/?tab=articles&category=${encodeURIComponent(
                selectedArticle.category
              )}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: selectedArticle.relatedMediaTitle || selectedArticle.title,
              item: canonicalHref,
            },
          ],
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

  // Computed Similar Titles for pSEO "Movies Like X" pattern
  const displaySimilarTitles = useMemo<SimilarTitleItem[]>(() => {
    if (!selectedArticle) return [];
    if (selectedArticle.similarTitles && selectedArticle.similarTitles.length > 0) {
      return selectedArticle.similarTitles.slice(0, 4);
    }
    if (liveSimilar && liveSimilar.length > 0) {
      return liveSimilar.slice(0, 4);
    }
    return articlesList
      .filter((a) => a.id !== selectedArticle.id && a.relatedMediaId !== selectedArticle.relatedMediaId)
      .slice(0, 4)
      .map((a) => ({
        id: a.relatedMediaId,
        title: a.relatedMediaTitle || a.title.split('–')[0],
        mediaType: a.relatedMediaType,
        posterPath: a.coverImage,
        rating: a.rating,
        year: a.publishedDate.slice(0, 4),
        slug: a.slug,
      }));
  }, [selectedArticle, liveSimilar, articlesList]);

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
    if (onSelectArticle) {
      onSelectArticle(art.slug);
    }
    const targetUrl = `/?tab=articles&article=${encodeURIComponent(art.slug)}`;
    if (window.location.search !== `?tab=articles&article=${art.slug}`) {
      window.history.pushState({ tab: 'articles', article: art.slug }, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHub = () => {
    setSelectedArticle(null);
    if (onSelectArticle) {
      onSelectArticle(null);
    }
    window.history.pushState({ tab: 'articles' }, '', '/?tab=articles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGuideForSimilar = async (sim: SimilarTitleItem) => {
    let target = articlesList.find(
      (a) =>
        (sim.slug && a.slug === sim.slug) ||
        (sim.id && a.relatedMediaId === sim.id) ||
        (sim.title && a.relatedMediaTitle.toLowerCase() === sim.title.toLowerCase())
    );

    if (!target && sim.id) {
      target = await pseoEngine.getOrCreateArticleByMediaId(
        sim.id,
        sim.mediaType || 'movie',
        sim.title
      );
    }

    if (target) {
      handleOpenArticle(target);
    }
  };

  const handleOpenGuideForStep = async (step: { slug?: string; mediaId?: number; title: string; type?: string }) => {
    let target = step.slug
      ? articlesList.find((a) => a.slug === step.slug)
      : step.mediaId
      ? articlesList.find((a) => a.relatedMediaId === step.mediaId)
      : null;

    if (!target && step.mediaId) {
      target = await pseoEngine.getOrCreateArticleByMediaId(
        step.mediaId,
        step.type === 'Movie' ? 'movie' : 'tv',
        step.title
      );
    }

    if (target) {
      handleOpenArticle(target);
    }
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
              onClick={handleBackToHub}
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
              <span>•</span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/70 border border-sky-500/40 text-cyan-300 font-bold">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>{articleViewsTracker.getStats(selectedArticle.slug).totalViews.toLocaleString()} Total Views</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{articleViewsTracker.getStats(selectedArticle.slug).uniqueReaders.toLocaleString()} Readers</span>
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

          {/* Quick Specs Bar (Runtime, Age Rating, Studio, Audio/Subs) */}
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Runtime */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Runtime
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {selectedArticle.specs?.runtime ||
                    (selectedArticle.relatedMediaType === 'tv'
                      ? '45-60m / ep'
                      : '118 min')}
                </span>
              </div>
            </div>

            {/* Age Rating / Certification */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Certification
                </span>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  {selectedArticle.specs?.certification || 'PG-13'}
                </span>
              </div>
            </div>

            {/* Studio / Network */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Studio / Network
                </span>
                <span
                  className="text-xs font-bold text-white truncate block"
                  title={selectedArticle.specs?.studio}
                >
                  {selectedArticle.specs?.studio ||
                    (selectedArticle.category === 'Anime Guides'
                      ? 'ufotable / MAPPA'
                      : 'Universal / Warner Bros.')}
                </span>
              </div>
            </div>

            {/* Audio & Subtitles Status */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Audio & Subs
                </span>
                <span className="text-xs font-bold text-emerald-400 truncate block">
                  {selectedArticle.specs?.audioSubStatus || 'Dolby 5.1 / Multi-Sub'}
                </span>
              </div>
            </div>
          </div>

          {/* Parental Guide & Content Warning Block */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Parental Guide & Content Warning
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                  selectedArticle.contentWarning?.level === 'Family Friendly'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                    : selectedArticle.contentWarning?.level === 'Mature 18+'
                    ? 'bg-red-950/70 border-red-500/50 text-red-300'
                    : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                }`}
              >
                {selectedArticle.contentWarning?.level || 'Moderate (PG-13)'}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {selectedArticle.contentWarning?.summary ||
                'Parental advisory: May contain intense cinema action sequences, thematic suspense, and language.'}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(
                selectedArticle.contentWarning?.tags || [
                  'Action Violence',
                  'Thematic Peril',
                  'English Sub & Dub',
                ]
              ).map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-medium text-zinc-300"
                >
                  ⚠️ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Availability / Streaming Status Block */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-black border border-emerald-500/30 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Availability & Streaming Status
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 uppercase">
                {selectedArticle.streamingStatus?.qualityBadge ||
                  '4K Ultra HD & 1080p'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  HD Cloud Mirrors
                </span>
                <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedArticle.streamingStatus?.hdMirrorsStatus ||
                    '7 Live Fast Mirrors Online'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Audio & Dub Status
                </span>
                <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  {selectedArticle.streamingStatus?.audioAvailable ||
                    'Stereo 5.1 & Multi-Subtitles'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  BleuStream Access
                </span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {selectedArticle.streamingStatus?.officialAvailability ||
                    '100% Free / Zero Buffering'}
                </span>
              </div>
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

          {/* Chronological Watch Order Block for Franchises & Anime */}
          {selectedArticle.franchiseWatchOrder && (
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/60 border border-red-500/40 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-red-500" />
                    <span>{selectedArticle.franchiseWatchOrder.franchiseName}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedArticle.franchiseWatchOrder.description}
                  </p>
                </div>
                <span className="px-3 py-1 bg-red-950/70 border border-red-500/50 text-red-300 text-[10px] font-black uppercase rounded-full tracking-wider">
                  Chronological Watch Order
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {selectedArticle.franchiseWatchOrder.order.map((step) => {
                  const isCurrent =
                    step.highlight ||
                    (selectedArticle.relatedMediaId && step.mediaId === selectedArticle.relatedMediaId) ||
                    (step.slug && step.slug === selectedArticle.slug);
                  const linkedArticle = step.slug
                    ? articlesList.find((a) => a.slug === step.slug)
                    : step.mediaId
                    ? articlesList.find((a) => a.relatedMediaId === step.mediaId)
                    : null;

                  return (
                    <div
                      key={step.step}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isCurrent
                          ? 'bg-red-950/40 border-red-500/70 shadow-lg shadow-red-950/30 ring-1 ring-red-500/30'
                          : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            isCurrent
                              ? 'bg-red-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 font-mono'
                          }`}
                        >
                          {step.step}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {step.title}
                            </h4>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>{step.year}</span>
                            <span>•</span>
                            <span className="text-zinc-300 font-medium">{step.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {step.mediaId && (
                          <button
                            type="button"
                            onClick={() =>
                              onPlayMediaById(
                                step.mediaId!,
                                step.type === 'Movie' ? 'movie' : 'tv',
                                step.title
                              )
                            }
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Stream</span>
                          </button>
                        )}
                        {(!step.slug || step.slug !== selectedArticle.slug) && (
                          <button
                            type="button"
                            onClick={() => handleOpenGuideForStep(step)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition cursor-pointer font-medium"
                          >
                            Read Guide
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* "Similar Titles / Watch Next" - Pattern pSEO "Movies Like X" */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>
                    {selectedArticle.category === 'Anime Guides'
                      ? 'Anime Like'
                      : selectedArticle.relatedMediaType === 'tv'
                      ? 'Series Like'
                      : 'Movies Like'}{' '}
                    {selectedArticle.relatedMediaTitle || selectedArticle.title.split('–')[0]} (Watch Next)
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-rated recommendations matching the tone, storyline, and cinematic scope
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-300">
                Verified HD Streams
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {displaySimilarTitles.map((sim, sIdx) => {
                const existingGuide = articlesList.find(
                  (a) =>
                    a.relatedMediaId === sim.id ||
                    (sim.slug && a.slug === sim.slug) ||
                    a.relatedMediaTitle.toLowerCase() === sim.title.toLowerCase()
                );

                return (
                  <div
                    key={sIdx}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-red-500/50 rounded-xl transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5 bg-black">
                        <img
                          src={
                            sim.posterPath ||
                            (existingGuide
                              ? existingGuide.coverImage
                              : selectedArticle.coverImage)
                          }
                          alt={sim.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-black/80 text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {sim.rating}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-red-300 line-clamp-1">
                        {sim.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        {sim.year} • {sim.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                      </span>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-zinc-800 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPlayMediaById(sim.id, sim.mediaType, sim.title)}
                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Watch</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenGuideForSimilar(sim)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium rounded-lg transition cursor-pointer"
                        title={`Read Cinema Guide for ${sim.title}`}
                      >
                        Guide
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
                      <span>•</span>
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" />
                        <span>{articleViewsTracker.getStats(art.slug).totalViews.toLocaleString()} views</span>
                      </span>
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
                All {articlesList.length} cinema guides dynamically registered for Googlebot, Bingbot & DuckDuckGo crawler indexing.
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
            {articlesList.map((art, idx) => (
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
