import { faqs } from '../data/faqs.js';

export async function GET() {
  const baseUrl = 'https://www.swutcg.one';
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/',             priority: '1.0', changefreq: 'daily'   },
    { url: '/database',     priority: '0.9', changefreq: 'daily'   },
    { url: '/how-to-play',  priority: '0.9', changefreq: 'monthly' },
    { url: '/builder',      priority: '0.8', changefreq: 'weekly'  },
    { url: '/decklists',    priority: '0.8', changefreq: 'daily'   },
  ];

  // FAQ guide pages - long-form content keyed off the highest-volume
  // Star Wars Unlimited keywords. Refresh weekly when new sets land.
  const faqPages = faqs.map(f => ({
    url: `/faq/${f.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  // /set/{slug} and /card/{slug} pages are intentionally NOT in the
  // sitemap. They are noindex (mixed-quality, mostly thin content), so
  // including them would send a mixed signal to Google. Sitemap is
  // reserved for the high-value indexable pages: homepage, database,
  // builder, decklists, and the FAQ guide pages.

  const allPages = [...staticPages, ...faqPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
