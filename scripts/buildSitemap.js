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

// Generate Visual HTML Sitemap matching exact screenshot
const htmlRows = allEntries.map((e, idx) => `
  <tr>
    <td class="col-num">${idx + 1}</td>
    <td class="col-url"><a href="${e.loc}" target="_blank">${e.loc}</a></td>
    <td class="col-pri"><span class="badge-pri">${e.priority}</span></td>
    <td class="col-freq">${e.changefreq.toUpperCase()}</td>
    <td class="col-date">${e.lastmod}</td>
  </tr>
`).join('');

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BleuStream – Programmatic SEO XML Sitemap Index</title>
  <meta name="description" content="Programmatic SEO XML Sitemap Index for Search Engine Crawlers - BleuStream Ultra HD Cinema">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #0b0c10;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 1100px;
      background: #11131a;
      border: 1px solid #222530;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid #222530;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #fff;
    }
    .brand-title span { color: #38bdf8; }
    .subtitle {
      font-size: 13px;
      color: #8e95a5;
      margin-top: 4px;
    }
    .total-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #10b981;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
    }
    .search-bar {
      margin: 20px 0 16px 0;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-input {
      background: #0d0e14;
      border: 1px solid #252836;
      border-radius: 10px;
      color: #fff;
      padding: 8px 14px;
      font-size: 13px;
      width: 100%;
      max-width: 320px;
      outline: none;
    }
    .search-input:focus { border-color: #38bdf8; }
    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #222530;
      border-radius: 14px;
      background: #0d0f15;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: #14161f;
      padding: 14px 16px;
      color: #7d8495;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #222530;
    }
    td {
      padding: 13px 16px;
      border-bottom: 1px solid #1a1c26;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
    }
    tr:hover td { background: rgba(56, 189, 248, 0.03); }
    .col-num { color: #5a6170; width: 45px; }
    .col-url { font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: 500; }
    .col-url a { color: #d1d5db; text-decoration: none; word-break: break-all; }
    .col-url a:hover { color: #38bdf8; text-decoration: underline; }
    .col-pri { text-align: center; width: 100px; }
    .badge-pri {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #10b981;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
    }
    .col-freq { text-align: center; color: #8e95a5; font-size: 11px; width: 110px; font-weight: 600; }
    .col-date { text-align: right; color: #8e95a5; width: 120px; font-size: 11px; }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 12px;
      color: #606778;
    }
    .footer a { color: #38bdf8; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand-title">BLEU<span>STREAM</span></div>
        <div class="subtitle">Programmatic SEO XML Sitemap Index for Search Engine Crawlers</div>
      </div>
      <div class="total-badge">
        <span class="pulse-dot"></span>
        <span>TOTAL URLS: ${allEntries.length}</span>
      </div>
    </div>

    <div class="search-bar">
      <input type="text" id="filterInput" class="search-input" placeholder="Search URL location...">
      <div style="font-size: 12px; color: #7d8495; align-self: center;">
        Format: XML Sitemap Index 0.9 + Multi-Language Hreflang
      </div>
    </div>

    <div class="table-wrapper">
      <table id="sitemapTable">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th>URL LOCATION</th>
            <th style="text-align: center;">PRIORITY</th>
            <th style="text-align: center;">CHANGE FREQ</th>
            <th style="text-align: right;">LAST MODIFIED</th>
          </tr>
        </thead>
        <tbody>
          ${htmlRows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div>BleuStream Dynamic Programmatic SEO Engine • Auto-generates 10 articles daily</div>
      <div><a href="/sitemap.xml">View Raw XML Feed</a> • <a href="/">Return to Cinema</a></div>
    </div>
  </div>

  <script>
    const input = document.getElementById('filterInput');
    const table = document.getElementById('sitemapTable');
    input.addEventListener('keyup', function() {
      const filter = input.value.toLowerCase();
      const rows = table.getElementsByTagName('tr');
      for (let i = 1; i < rows.length; i++) {
        const urlCell = rows[i].getElementsByTagName('td')[1];
        if (urlCell) {
          const text = urlCell.textContent || urlCell.innerText;
          rows[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
        }
      }
    });
  </script>
</body>
</html>
`;

const publicHtmlPath = path.resolve(__dirname, '../public/sitemap.html');
fs.writeFileSync(publicHtmlPath, fullHtml, 'utf8');
console.log(`[Sitemap Builder] Successfully wrote visual HTML sitemap to ${publicHtmlPath}`);

// Also copy to dist if dist exists
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), fullXml, 'utf8');
  fs.writeFileSync(path.join(distDir, 'sitemap.html'), fullHtml, 'utf8');
  console.log(`[Sitemap Builder] Successfully copied sitemap.xml and sitemap.html to dist/`);
}

