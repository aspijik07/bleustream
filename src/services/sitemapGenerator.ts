// Programmatic Dynamic Sitemap XML Generator for BleuStream
// Generates standard compliant XML for Googlebot, Bingbot, Yandex & DuckDuckGo
// Includes full image sitemaps, news/article schemas, high priority indexing, and canonical URLs

import { SEOArticle, SEO_ARTICLES } from '../data/seoArticles';

export const DEFAULT_SITE_DOMAIN = 'https://bleustream.pages.dev';

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  imageUrl?: string;
  imageTitle?: string;
}

export function generateSitemapXml(articles: SEOArticle[] = [], customDomain?: string): string {
  const domain = (customDomain?.trim() || DEFAULT_SITE_DOMAIN).replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];

  // Core Static Platform Navigation Pages
  const staticPages: SitemapUrlEntry[] = [
    { loc: `${domain}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${domain}/?tab=articles`, lastmod: today, changefreq: 'daily', priority: '0.95' },
    { loc: `${domain}/?tab=movies`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=tv`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=anime`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=trending`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${domain}/?tab=watchlist`, lastmod: today, changefreq: 'weekly', priority: '0.6' },
  ];

  // Merge provided articles with baseline SEO articles, deduplicating by slug
  const articleMap = new Map<string, SEOArticle>();
  SEO_ARTICLES.forEach((art) => articleMap.set(art.slug, art));
  articles.forEach((art) => articleMap.set(art.slug, art));
  const mergedArticles = Array.from(articleMap.values());

  // Article Pages (Programmatic SEO & Cinema Guides with Rich Images)
  const articlePages: SitemapUrlEntry[] = mergedArticles.map((art) => ({
    loc: `${domain}/?tab=articles&amp;article=${encodeURIComponent(art.slug)}`,
    lastmod: art.modifiedDate || art.publishedDate || today,
    changefreq: 'daily',
    priority: '0.85',
    imageUrl: art.coverImage,
    imageTitle: art.title,
  }));

  const allUrls = [...staticPages, ...articlePages];

  const xmlEntries = allUrls
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
