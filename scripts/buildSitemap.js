// Build script to generate public/sitemap.xml with all articles and categories
// Run automatically on build or directly via node scripts/buildSitemap.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://bleustream.pages.dev';
const today = new Date().toISOString().split('T')[0];

const seoArticlesPath = path.resolve(__dirname, '../src/data/seoArticles.ts');
const seoContent = fs.readFileSync(seoArticlesPath, 'utf8');

// Parse all articles accurately
const articles = [];
const blocks = seoContent.split(/id:\s*'/).slice(1);

for (const b of blocks) {
  const slugMatch = b.match(/slug:\s*'([^']+)'/);
  const titleMatch = b.match(/title:\s*'([^']+)'/);
  const pubMatch = b.match(/publishedDate:\s*'([^']+)'/);
  const modMatch = b.match(/modifiedDate:\s*'([^']+)'/);
  const imgMatch = b.match(/coverImage:\s*'([^']+)'/);

  if (slugMatch) {
    articles.push({
      slug: slugMatch[1],
      title: titleMatch ? titleMatch[1] : 'BleuStream Cinema Guide',
      publishedDate: pubMatch ? pubMatch[1] : today,
      modifiedDate: modMatch ? modMatch[1] : (pubMatch ? pubMatch[1] : today),
      coverImage: imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop',
    });
  }
}

console.log(`[Sitemap Builder] Successfully parsed all ${articles.length} SEO articles from seoArticles.ts`);

const staticUrls = [
  { loc: `${DOMAIN}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
  { loc: `${DOMAIN}/?tab=articles`, lastmod: today, changefreq: 'daily', priority: '0.95' },
  { loc: `${DOMAIN}/?tab=movies`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  { loc: `${DOMAIN}/?tab=tv`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  { loc: `${DOMAIN}/?tab=anime`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  { loc: `${DOMAIN}/?tab=trending`, lastmod: today, changefreq: 'daily', priority: '0.9' },
  { loc: `${DOMAIN}/?tab=watchlist`, lastmod: today, changefreq: 'weekly', priority: '0.6' },
];

const articleUrls = articles.map((art) => ({
  loc: `${DOMAIN}/?tab=articles&amp;article=${encodeURIComponent(art.slug)}`,
  lastmod: art.modifiedDate || today,
  changefreq: 'daily',
  priority: '0.85',
  imageUrl: art.coverImage,
  imageTitle: art.title,
}));

const topMediaUrls = [
  { loc: `${DOMAIN}/?watch=693134`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Dune: Part Two 4K Stream' },
  { loc: `${DOMAIN}/?watch=157336`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Interstellar 4K Stream' },
  { loc: `${DOMAIN}/?watch=27205`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Inception 4K Stream' },
  { loc: `${DOMAIN}/?watch=872585`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Oppenheimer 4K Stream' },
  { loc: `${DOMAIN}/?watch=533535`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Deadpool & Wolverine Stream' },
  { loc: `${DOMAIN}/?watch=66732&amp;season=1&amp;episode=1`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Stranger Things Stream' },
  { loc: `${DOMAIN}/?watch=127532&amp;season=1&amp;episode=1`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Solo Leveling Anime Stream' },
  { loc: `${DOMAIN}/?watch=85937&amp;season=1&amp;episode=1`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Demon Slayer Anime Stream' },
  { loc: `${DOMAIN}/?watch=37854&amp;season=1&amp;episode=1`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch One Piece Anime Stream' },
  { loc: `${DOMAIN}/?watch=1399&amp;season=1&amp;episode=1`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Game of Thrones Stream' },
  { loc: `${DOMAIN}/?watch=1396&amp;season=1&amp;episode=1`, lastmod: today, changefreq: 'daily', priority: '0.9', imageTitle: 'Watch Breaking Bad Stream' },
];

const allEntries = [...staticUrls, ...articleUrls, ...topMediaUrls];

const xmlEntries = allEntries
  .map((entry) => {
    let imageXml = '';
    if (entry.imageUrl) {
      const cleanImg = entry.imageUrl.replace(/&/g, '&amp;');
      const cleanTitle = (entry.imageTitle || 'BleuStream Cinema Guide')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      imageXml = `\n    <image:image>\n      <image:loc>${cleanImg}</image:loc>\n      <image:title>${cleanTitle}</image:title>\n    </image:image>`;
    }
    const separator = entry.loc.includes('?') ? '&amp;' : '?';
    const hreflangXml = `\n    <xhtml:link rel="alternate" hreflang="en" href="${entry.loc}" />\n    <xhtml:link rel="alternate" hreflang="fr" href="${entry.loc}${separator}lang=fr" />\n    <xhtml:link rel="alternate" hreflang="es" href="${entry.loc}${separator}lang=es" />\n    <xhtml:link rel="alternate" hreflang="ar" href="${entry.loc}${separator}lang=ar" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${entry.loc}" />`;

    return `  <url>
    <loc>${entry.loc}</loc>${hreflangXml}
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${imageXml}
  </url>`;
  })
  .join('\n');

const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${xmlEntries}
</urlset>
`;

const publicPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(publicPath, fullXml, 'utf8');
console.log(`[Sitemap Builder] Successfully wrote ${allEntries.length} URLs to ${publicPath}`);

// Also copy to dist/sitemap.xml if dist exists
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), fullXml, 'utf8');
  console.log(`[Sitemap Builder] Successfully copied to dist/sitemap.xml`);
}
