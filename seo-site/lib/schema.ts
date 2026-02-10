/**
 * JSON-LD Schema generators for SEO
 * These generate structured data for Google rich results
 */

import { siteConfig } from './api';
import type { Ground, GroundReview, Player, BlogPost, GlossaryTerm, FAQ } from './api';

// Organization Schema - Used on all pages
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'SportsOrganization'],
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: 'CricSmart - AI Cricket Platform',
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/cricsmart-logo-512.png`,
      width: 512,
      height: 512,
    },
    image: `${siteConfig.url}/cricsmart-logo-512.png`,
    sameAs: [
      'https://www.instagram.com/_mavericks_xi/',
    ],
    sport: 'Cricket',
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Noida',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@cricsmart.in',
      url: `${siteConfig.url}/about`,
    },
    foundingDate: '2024',
    knowsAbout: ['Cricket', 'Cricket Team Management', 'Sports Technology'],
  };
}

// WebSite Schema - Used on homepage
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.name,
    alternateName: 'CricSmart',
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    inLanguage: siteConfig.locale,
  };
}

// SiteNavigationElement Schema - Helps Google generate sitelinks
export function generateSiteNavigationSchema() {
  const navItems = [
    { name: 'Team Management', url: `${siteConfig.url}/features`, description: 'AI-driven cricket team management. No hassle for team availability and payment tracking.' },
    { name: 'Tournament', url: `${siteConfig.url}/tournament`, description: 'Manage your cricket tournament like a pro. No hassle for payment and balance tracking.' },
    { name: 'Auction', url: `${siteConfig.url}/auction`, description: 'AI-powered cricket player auction management matching international standards.' },
    { name: 'Pricing', url: `${siteConfig.url}/pricing`, description: 'Free for most cricket teams. Plans starting from ₹0 for teams up to 50 players.' },
    { name: 'Features', url: `${siteConfig.url}/features`, description: 'AI payment processing, WhatsApp notifications, automatic team availability tracking.' },
    { name: 'Free Cricket Tools', url: `${siteConfig.url}/tools`, description: 'Free online cricket calculators: run rate, DLS, team picker, virtual toss, and more.' },
    { name: 'Contact Us', url: `${siteConfig.url}/contact`, description: 'Get in touch with the CricSmart team for support, feedback, or partnerships.' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    '@id': `${siteConfig.url}/#navigation`,
    name: 'Main Navigation',
    hasPart: navItems.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: item.url,
      description: item.description,
    })),
  };
}

// WebPage Schema - For individual pages to strengthen sitelink signals
export function generateWebPageSchema(page: {
  name: string;
  description: string;
  url: string;
  breadcrumb?: { name: string; url: string }[];
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': page.url,
    name: page.name,
    description: page.description,
    url: page.url,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    about: { '@id': `${siteConfig.url}/#organization` },
    inLanguage: siteConfig.locale,
  };

  if (page.breadcrumb && page.breadcrumb.length > 0) {
    schema.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
        ...page.breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: item.name,
          item: item.url,
        })),
      ],
    };
  }

  return schema;
}

// BreadcrumbList Schema
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// SportsActivityLocation Schema - For cricket grounds
export function generateGroundSchema(ground: Ground, reviews?: GroundReview[]) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${siteConfig.url}/grounds/${ground.slug}`,
    name: ground.name,
    description: ground.description || `Cricket ground located in ${ground.city}, ${ground.state}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ground.address,
      addressLocality: ground.city,
      addressRegion: ground.state,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: ground.coordinates?.lat,
      longitude: ground.coordinates?.lng,
    },
    amenityFeature: ground.amenities?.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    url: `${siteConfig.url}/grounds/${ground.slug}`,
  };

  // Add aggregate rating if reviews exist
  if (ground.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ground.averageRating.toFixed(1),
      reviewCount: ground.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add individual reviews if provided
  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
      },
      author: { '@type': 'Person', name: review.reviewerName },
      reviewBody: review.comment,
      datePublished: review.createdAt,
    }));
  }

  return schema;
}

// Person Schema - For player profiles
export function generatePlayerSchema(player: Player) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.name,
    jobTitle: 'Cricket Player',
    description: player.about || `Cricket player - ${player.role || 'All-rounder'}`,
    memberOf: player.team
      ? {
          '@type': 'SportsTeam',
          name: player.team,
          sport: 'Cricket',
        }
      : undefined,
    knowsAbout: ['Cricket', player.battingStyle, player.bowlingStyle].filter(Boolean),
    url: `${siteConfig.url}/players/${player._id}`,
  };
}

// Article Schema - For blog posts
export function generateArticleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${siteConfig.url}/blog/${post.slug}`,
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || siteConfig.ogImage,
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };
}

// DefinedTerm Schema - For glossary terms
export function generateDefinedTermSchema(term: GlossaryTerm) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'CricSmart Cricket Glossary',
      url: `${siteConfig.url}/glossary`,
    },
    url: `${siteConfig.url}/glossary/${term.slug}`,
  };
}

// FAQPage Schema - For FAQ pages
export function generateFAQSchema(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// SoftwareApplication Schema - For tools
export function generateToolSchema(tool: {
  name: string;
  description: string;
  url: string;
  category?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    applicationCategory: tool.category || 'SportsApplication',
    operatingSystem: 'Web',
    url: tool.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  };
}

// HowTo Schema - For tutorials and tool instructions
export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string; image?: string; url?: string }[];
  totalTime?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    image: howTo.image || siteConfig.ogImage,
    totalTime: howTo.totalTime,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  };
}

// ItemList Schema - For directory/list pages
export function generateItemListSchema(
  items: { name: string; url: string; position: number }[],
  listName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

// Helper to combine multiple schemas
export function combineSchemas(...schemas: Record<string, unknown>[]) {
  return schemas;
}
