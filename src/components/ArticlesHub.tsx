import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { SEO_ARTICLES, SEOArticle } from '../data/seoArticles';
import { pseoEngine } from '../services/pseoEngine';
import { MediaItem } from '../types';

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
  const [articlesList, setArticlesList] = useState<SEOArticle[]>(() => pseoEngine.getAllArticles());
  const [selectedArticle, setSelectedArticle] = useState<SEOArticle | null>(() => {
    if (initialSlug) {
      return pseoEngine.getAllArticles().find((a) => a.slug === initialSlug) || null;
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
      document.title = 'Cinema Guides & Streaming Articles – Watch Movies Free in HD | BleuStream';
      return;
    }

    document.title = selectedArticle.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', selectedArticle.metaDescription);

    // Dynamic Schema.org JSON-LD injection for Google Rich Snippets
    let scriptTag = document.getElementById('article-jsonld') as HTMLScriptElement | null;
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
          dateModified: selectedArticle.modifiedDate || selectedArticle.publishedDate,
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
          '@type': selectedArticle.relatedMediaType === 'tv' ? 'TVSeries' : 'Movie',
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

  const filteredArticles = articlesList.filter((article) => {
    const matchesCategory =
      activeCategory === 'All' || article.category === activeCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleShare = (art: SEOArticle) => {
    const url = `https://bleustream.pages.dev/?tab=articles&article=${encodeURIComponent(art.slug)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Detailed Article Reader View
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-[#141414] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back & Breadcrumb Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cinema Articles Hub</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleShare(selectedArticle)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
              </button>
            </div>
          </div>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-sky-500/20 border border-sky-400/40 text-cyan-400 text-xs font-bold rounded-full uppercase tracking-wider">
                {selectedArticle.category}
              </span>
              <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1 font-mono">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{selectedArticle.rating}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {selectedArticle.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-medium">
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
          </div>

          {/* Cover Hero Banner with Direct Play Overlay */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group">
            <img
              src={selectedArticle.coverImage}
              alt={selectedArticle.title}
              className="w-full h-64 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow">
                    Stream {selectedArticle.relatedMediaTitle} in Ultra HD
                  </h3>
                  <p className="text-xs text-zinc-300 drop-shadow">
                    Instant 1080p/4K playback on BleuStream with 0 buffering.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onPlayMediaById(
                      selectedArticle.relatedMediaId,
                      selectedArticle.relatedMediaType,
                      selectedArticle.relatedMediaTitle
                    )
                  }
                  className="px-6 py-3 bg-[#0ea5e9] hover:bg-sky-600 text-white font-extrabold rounded-xl text-sm transition shadow-lg shadow-sky-950/60 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Free Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Excerpt Lead */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border-l-4 border-sky-500 text-zinc-300 text-base sm:text-lg leading-relaxed font-serif italic">
            "{selectedArticle.excerpt}"
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-zinc-300 leading-relaxed text-sm sm:text-base">
            {selectedArticle.sections.map((section, idx) => (
              <div
                key={idx}
                className="space-y-4 p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl"
              >
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>{section.heading}</span>
                </h2>
                {section.subheading && (
                  <h3 className="text-base font-bold text-zinc-200">{section.subheading}</h3>
                )}
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-zinc-300">
                    {p}
                  </p>
                ))}
                {section.bulletPoints && (
                  <ul className="space-y-2 pt-2">
                    {section.bulletPoints.map((point, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* FAQ Accordions for Google Snippets & Engagement */}
          {selectedArticle.faqs.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>Frequently Asked Questions</span>
              </h2>
              <div className="space-y-3">
                {selectedArticle.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center font-mono">
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

          {/* Bottom Stream Call-To-Action */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-black border border-sky-400/40 text-center space-y-4 shadow-xl">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-2xl font-black text-white">
              Watch {selectedArticle.relatedMediaTitle} Full Movie on BleuStream
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Choose from 7 verified fast mirrors including VidSrc Cloud and enjoy unrestricted 4K Ultra HD cinema.
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
              className="px-8 py-3.5 bg-gradient-to-r from-sky-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold rounded-xl text-base transition shadow-xl shadow-sky-950/80 inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Launch Video Player</span>
            </button>
          </div>

          {/* More Articles Preview */}
          <div className="space-y-4 pt-8 border-t border-zinc-800">
            <h3 className="text-lg font-bold text-white">More Cinema Guides You Might Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEO_ARTICLES.filter((a) => a.id !== selectedArticle.id)
                .slice(0, 3)
                .map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition group"
                  >
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                      {art.category}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-red-300 line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 mt-2 block font-mono">
                      {art.readTime} • {art.rating}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Articles Hub Directory View
  return (
    <div className="min-h-screen bg-[#141414] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hub Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>BleuStream Cinema Editorial & SEO Guides</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-bebas tracking-wide text-white">
            Cinema Guides, Reviews & Streaming Tips
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            In-depth guides, release countdowns, ending breakdowns, and streaming recommendations for the biggest blockbusters and anime series.
          </p>
        </div>

        {/* Search & Categories Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl shadow-xl">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-950/40'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, movies..."
              className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800 space-y-3">
            <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-300">No articles match your query</h3>
            <p className="text-xs text-zinc-500">Try changing your search terms or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-[#18181b] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl group"
              >
                <div>
                  {/* Poster Thumbnail */}
                  <div
                    onClick={() => setSelectedArticle(art)}
                    className="relative h-48 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur border border-zinc-700 text-white">
                        {art.category}
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
                      onClick={() => setSelectedArticle(art)}
                      className="text-base font-bold text-white group-hover:text-cyan-400 transition cursor-pointer line-clamp-2 leading-snug"
                    >
                      {art.title}
                    </h2>

                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-zinc-800/80 mt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(art)}
                    className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Read Guide</span>
                    <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onPlayMediaById(art.relatedMediaId, art.relatedMediaType, art.relatedMediaTitle)
                    }
                    className="px-3.5 py-1.5 bg-sky-500/20 hover:bg-sky-500 border border-sky-400/40 hover:border-sky-500 text-red-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Movie</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
