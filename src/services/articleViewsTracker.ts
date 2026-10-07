// Article Views & Reader Engagement Analytics Tracker for BleuStream
// Tracks Total Views, Unique Session Readers, and provides Top Articles Leaderboard

export interface ArticleViewStats {
  slug: string;
  title: string;
  totalViews: number;
  uniqueReaders: number;
  lastViewedAt: number;
  category?: string;
}

const STORAGE_KEY = 'bleustream_article_views_v2';

// Baseline seed data so curated articles start with established metrics
const BASELINE_VIEWS: Record<string, { views: number; unique: number }> = {
  'how-to-watch-dune-part-two-online-free-hd': { views: 4820, unique: 3190 },
  'interstellar-movie-streaming-review-cast': { views: 3950, unique: 2640 },
  'stranger-things-season-5-release-date-cast-stream': { views: 3410, unique: 2280 },
  'deadpool-and-wolverine-online-streaming-guide': { views: 3120, unique: 2050 },
  'solo-leveling-anime-watch-guide-season-2': { views: 2980, unique: 1940 },
  'oppenheimer-movie-stream-review-cast': { views: 2840, unique: 1860 },
  'demon-slayer-infinity-castle-movie-guide': { views: 2750, unique: 1810 },
  'inception-movie-dream-levels-explained-stream': { views: 2420, unique: 1590 },
  'the-dark-knight-joker-heath-ledger-stream': { views: 2210, unique: 1450 },
  'breaking-bad-complete-series-watch-order': { views: 2190, unique: 1430 },
  'game-of-thrones-all-seasons-watch-free-hd': { views: 2040, unique: 1320 },
  'house-of-the-dragon-season-2-stream-guide': { views: 1980, unique: 1290 },
  'arcane-league-of-legends-season-2-stream': { views: 1890, unique: 1240 },
  'attack-on-titan-final-season-complete-guide': { views: 1850, unique: 1210 },
  'jujutsu-kaisen-shibuya-incident-stream-guide': { views: 1760, unique: 1150 },
  'avengers-endgame-full-movie-stream-4k': { views: 1680, unique: 1100 },
  'one-piece-anime-streaming-guide-episodes': { views: 1620, unique: 1050 },
  'spirited-away-studio-ghibli-streaming-guide': { views: 1540, unique: 1010 },
  'top-10-movies-to-watch-free-online-2026': { views: 1420, unique: 930 },
  'watch-fight-club-online-full-movie-hd': { views: 1380, unique: 890 },
};

class ArticleViewsTracker {
  private stats: Record<string, ArticleViewStats> = {};
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadStats();
  }

  private loadStats() {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.stats = JSON.parse(saved);
      }
    } catch {
      this.stats = {};
    }

    // Ensure baseline articles are initialized
    Object.entries(BASELINE_VIEWS).forEach(([slug, val]) => {
      if (!this.stats[slug]) {
        this.stats[slug] = {
          slug,
          title: slug.replace(/-/g, ' '),
          totalViews: val.views,
          uniqueReaders: val.unique,
          lastViewedAt: Date.now() - Math.floor(Math.random() * 3600000),
        };
      }
    });
  }

  private saveStats() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  /**
   * Record an article view.
   * - Total Views: increments every time the article is accessed/viewed.
   * - Unique Readers: increments only once per browser session for that article.
   */
  public recordView(slug: string, title?: string, category?: string): ArticleViewStats {
    if (!slug) {
      return {
        slug: '',
        title: '',
        totalViews: 0,
        uniqueReaders: 0,
        lastViewedAt: Date.now(),
      };
    }

    const current = this.stats[slug] || {
      slug,
      title: title || slug.replace(/-/g, ' '),
      totalViews: BASELINE_VIEWS[slug]?.views || 0,
      uniqueReaders: BASELINE_VIEWS[slug]?.unique || 0,
      lastViewedAt: Date.now(),
      category,
    };

    if (title) current.title = title;
    if (category) current.category = category;

    // Check session storage to see if reader is unique for this session
    let isUniqueInSession = false;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sessionKey = `bleustream_read_${slug}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        isUniqueInSession = true;
      }
    }

    current.totalViews += 1;
    if (isUniqueInSession) {
      current.uniqueReaders += 1;
    }
    current.lastViewedAt = Date.now();

    this.stats[slug] = current;
    this.saveStats();
    return current;
  }

  public getStats(slug: string): ArticleViewStats {
    if (this.stats[slug]) {
      return this.stats[slug];
    }
    const seed = BASELINE_VIEWS[slug];
    return {
      slug,
      title: slug.replace(/-/g, ' '),
      totalViews: seed?.views || 140,
      uniqueReaders: seed?.unique || 95,
      lastViewedAt: Date.now(),
    };
  }

  public getAllStats(): Record<string, ArticleViewStats> {
    return { ...this.stats };
  }

  public getTopArticles(limit = 50): ArticleViewStats[] {
    return Object.values(this.stats)
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);
  }

  public getTotalViewsAllArticles(): number {
    return Object.values(this.stats).reduce((sum, item) => sum + item.totalViews, 0);
  }
}

export const articleViewsTracker = new ArticleViewsTracker();
