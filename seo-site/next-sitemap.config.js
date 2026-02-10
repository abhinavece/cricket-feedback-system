/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://cricsmart.in',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  
  // Exclude admin and API routes
  exclude: ['/admin/*', '/api/*', '/_next/*', '/server-sitemap.xml', '/auth/callback'],
  
  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
    additionalSitemaps: [
      'https://cricsmart.in/server-sitemap.xml',
    ],
  },
  
  // Transform function for custom priority and changefreq
  transform: async (config, path) => {
    // High priority for main pages
    const highPriorityPaths = ['/', '/glossary', '/tools', '/grounds', '/faq'];
    const mediumPriorityPaths = ['/about', '/privacy', '/blog', '/learn', '/auth/login'];
    
    let priority = 0.7;
    let changefreq = 'weekly';
    
    if (highPriorityPaths.some(p => path === p)) {
      priority = 1.0;
      changefreq = 'daily';
    } else if (mediumPriorityPaths.some(p => path === p)) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/glossary/')) {
      priority = 0.9;
      changefreq = 'monthly';
    } else if (path.startsWith('/tools/')) {
      priority = 0.9;
      changefreq = 'monthly';
    } else if (path.startsWith('/grounds/')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/blog/')) {
      priority = 0.7;
      changefreq = 'weekly';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
