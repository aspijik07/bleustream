// Programmatic Dynamic Sitemap XML Generator for BleuStream
// Generates standard compliant XML for Googlebot, Bingbot, Yandex & DuckDuckGo

import { SEOArticle } from '../data/seoArticles';

export const DEFAULT_SITE_DOMAIN = 'https://bleustream.online';

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export function generateSitemapXml(articles: SEOArticle[] = [], customDomain?: string): string {
  const domain = (customDomain?.trim() || DEFAULT_SITE_DOMAIN).replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];

  const staticPages: SitemapUrlEntry[] = [
    { loc: `${domain}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${domain}/?tab=movies`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=tv`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=anime`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=trending`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=articles`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${domain}/?tab=watchlist`, lastmod: today, changefreq: 'weekly', priority: '0.6' },
  ];

  // Article Pages (Programmatic SEO & Cinema Guides)
  const articlePages: SitemapUrlEntry[] = articles.map((art) => ({
    loc: `${domain}/?tab=articles&amp;article=${encodeURIComponent(art.slug)}`,
    lastmod: art.modifiedDate || art.publishedDate || today,
    changefreq: 'daily',
    priority: '0.85',
  }));

  const allUrls = [...staticPages, ...articlePages];

  const xmlEntries = allUrls
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${xmlEntries}
</urlset>`;
}

export function downloadSitemapFile(articles: SEOArticle[] = [], customDomain?: string): void {
  const xml = generateSitemapXml(articles, customDomain);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sitemap.xml');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
