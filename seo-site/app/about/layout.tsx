import { Metadata } from 'next';
import { siteConfig } from '@/lib/api';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'About CricSmart - AI-Powered Cricket Team Management',
  description: 'CricSmart is an AI-powered cricket team management platform. Built by cricket enthusiasts for cricket teams. Learn about our mission, features, and values.',
  keywords: [
    'cricsmart about',
    'cricket team management',
    'AI cricket platform',
    'cricket software',
    'team management app',
    'cricket app india',
  ],
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    title: 'About CricSmart - AI-Powered Cricket Team Management',
    description: 'Built by cricket enthusiasts for cricket teams. AI-powered payments, WhatsApp automation, and smart squad building.',
    url: `${siteConfig.url}/about`,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'About CricSmart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About CricSmart - AI Cricket Platform',
    description: 'Built by cricket enthusiasts for cricket teams.',
    images: [siteConfig.ogImage],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webPageSchema = generateWebPageSchema({
    name: 'About CricSmart - AI-Powered Cricket Team Management',
    description: 'CricSmart is an AI-powered cricket team management platform. Built by cricket enthusiasts for cricket teams.',
    url: `${siteConfig.url}/about`,
    breadcrumb: [{ name: 'About', url: `${siteConfig.url}/about` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />
      {children}
    </>
  );
}
