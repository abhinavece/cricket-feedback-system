/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://auction.cricsmart.in',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin', '/admin/*', '/auth-callback', '/bid/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/auth-callback', '/bid'] },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://auction.cricsmart.in'}/server-sitemap.xml`,
    ],
  },
  additionalPaths: async (config) => {
    const result = [];
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/seo/sitemap/auctions`);
      const data = await res.json();
      if (data.slugs) {
        for (const auction of data.slugs) {
          result.push({
            loc: `/${auction.slug}`,
            changefreq: auction.status === 'live' ? 'always' : 'weekly',
            priority: auction.status === 'live' ? 1.0 : 0.8,
            lastmod: auction.lastModified || new Date().toISOString(),
          });
          result.push({
            loc: `/${auction.slug}/teams`,
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: auction.lastModified || new Date().toISOString(),
          });
          if (['completed', 'trade_window', 'finalized'].includes(auction.status)) {
            result.push({
              loc: `/${auction.slug}/analytics`,
              changefreq: 'monthly',
              priority: 0.6,
              lastmod: auction.lastModified || new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch auction slugs for sitemap:', e);
    }
    return result;
  },
};
