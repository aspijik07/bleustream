// Cloudflare Pages Function: Dynamic sitemap.xml responder
// Serves up-to-date XML Sitemap directly to Googlebot, Bingbot, Yandex & DuckDuckGo

export async function onRequestGet(context: any): Promise<Response> {
  const host = context.request.headers.get('host') || 'bleustream.live';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const domain = `${protocol}://${host}`;
  const today = new Date().toISOString().split('T')[0];

  // Complete catalog of articles for high-speed indexing
  const articles = [
    { slug: 'how-to-watch-dune-part-two-online-free-hd', title: 'How to Watch Dune: Part Two Online for Free in 1080p & 4K Ultra HD', date: '2026-09-28' },
    { slug: 'interstellar-movie-streaming-review-cast', title: 'Where to Stream Interstellar (2014) in 4K: Cast, Ending Explained & Free Guide', date: '2026-09-26' },
    { slug: 'stranger-things-season-5-release-date-cast-stream', title: 'Stranger Things Season 5: Everything We Know, Release Window & Streaming', date: '2026-09-25' },
    { slug: 'deadpool-and-wolverine-online-streaming-guide', title: 'Watch Deadpool & Wolverine Online: Stream, Marvel Multiverse Cameos & 4K Playback', date: '2026-09-24' },
    { slug: 'solo-leveling-anime-watch-guide-season-2', title: 'Solo Leveling Anime: Episode Streaming Order, Sung Jin-woo Rise & Season 2 Guide', date: '2026-09-23' },
    { slug: 'oppenheimer-movie-stream-review-cast', title: 'Oppenheimer Movie Stream: Cast, 70mm IMAX Cinematography & Christopher Nolan Masterpiece', date: '2026-09-22' },
    { slug: 'top-10-movies-to-watch-free-online-2026', title: 'Top 10 Must-Watch Movies to Stream Free in 2026: Box Office Hits in Ultra HD', date: '2026-09-21' },
    { slug: 'demon-slayer-infinity-castle-movie-guide', title: 'Demon Slayer: Kimetsu no Yaiba Infinity Castle Arc Movie Streaming Guide', date: '2026-09-20' },
    { slug: 'watch-fight-club-online-full-movie-hd', title: 'Watch Fight Club (1999) Online: Full Movie Stream, Tyler Durden Breakdown & Subtitles', date: '2026-09-19' },
    { slug: 'inception-movie-dream-levels-explained-stream', title: 'Inception (2010): Dream Levels Explained, Totem Spinning Ending & 4K Stream', date: '2026-09-18' },
    { slug: 'the-dark-knight-joker-heath-ledger-stream', title: 'The Dark Knight (2008): Heath Ledger Joker Performance, 4K HDR Watch Guide', date: '2026-09-17' },
    { slug: 'breaking-bad-complete-series-watch-order', title: 'Breaking Bad: Complete Series Binge Guide, Walter White Transformation & 1080p Stream', date: '2026-09-16' },
    { slug: 'game-of-thrones-all-seasons-watch-free-hd', title: 'Game of Thrones: Stream All 8 Seasons Online Free in 4K Ultra HD & Surround Audio', date: '2026-09-15' },
    { slug: 'house-of-the-dragon-season-2-stream-guide', title: 'House of the Dragon: Dance of the Dragons Targaryen Civil War Streaming Guide', date: '2026-09-14' },
    { slug: 'arcane-league-of-legends-season-2-stream', title: 'Arcane: League of Legends Season 2 - Jinx, Vi & Piltover Streaming Analysis', date: '2026-09-13' },
    { slug: 'attack-on-titan-final-season-complete-guide', title: 'Attack on Titan (Shingeki no Kyojin): Complete Episode Stream & Rumbling Finale', date: '2026-09-12' },
    { slug: 'jujutsu-kaisen-shibuya-incident-stream-guide', title: 'Jujutsu Kaisen: Shibuya Incident Arc Breakdown & Episode Streaming Guide', date: '2026-09-11' },
    { slug: 'avengers-endgame-full-movie-stream-4k', title: 'Watch Avengers: Endgame in 4K Ultra HD: Full Movie Streaming Guide & MCU Climax', date: '2026-09-10' },
    { slug: 'one-piece-anime-streaming-guide-episodes', title: 'How to Stream One Piece Online: Egghead Arc, Gear 5 & Episode Watch Guide', date: '2026-09-09' },
    { slug: 'spirited-away-studio-ghibli-streaming-guide', title: 'Spirited Away (2001): Hayao Miyazaki Studio Ghibli Masterpiece Streaming Guide', date: '2026-09-08' },
  ];

  const staticUrls = [
    { loc: `${domain}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${domain}/?tab=articles`, lastmod: today, changefreq: 'daily', priority: '0.95' },
    { loc: `${domain}/?tab=movies`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=tv`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=anime`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=trending`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=watchlist`, lastmod: today, changefreq: 'weekly', priority: '0.6' },
  ];

  const articleUrls = articles.map((art) => ({
    loc: `${domain}/?tab=articles&amp;article=${encodeURIComponent(art.slug)}`,
    lastmod: art.date || today,
    changefreq: 'daily',
    priority: '0.85',
  }));

  const allEntries = [...staticUrls, ...articleUrls];

  const xmlEntries = allEntries
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${xmlEntries}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
