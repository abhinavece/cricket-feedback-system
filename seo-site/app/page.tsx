'use client';

import { useRouter } from 'next/navigation';
import {
  HeroSection,
  StatsBar,
  HowItWorks,
  ProductsSection,
  WhyCricSmart,
  Testimonials,
  UseCases,
  WhyChooseUs,
  FAQSection,
  TrustSection,
  FinalCTA,
} from '@/components/home';
import SchemaScript from '@/components/SchemaScript';
import { generateWebSiteSchema, generateFAQSchema, generateProductSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

const homepageFAQs = [
  { id: '1', question: 'Is CricSmart really free to use?', answer: 'Yes! CricSmart is completely free for teams with up to 50 players. No credit card required, no hidden fees.', category: 'pricing' },
  { id: '2', question: 'How does the AI payment verification work?', answer: 'Simply upload a screenshot of your UPI payment, and our AI-powered OCR technology automatically extracts the transaction ID, amount, and date.', category: 'features' },
  { id: '3', question: 'Do my players need to download an app?', answer: 'No! Players receive match notifications and availability requests via WhatsApp. They can respond with a single tap without downloading anything.', category: 'usage' },
  { id: '4', question: 'Can I manage multiple teams?', answer: 'Absolutely! You can create and manage multiple teams under a single account. Each team has its own set of players, matches, and payment records.', category: 'features' },
  { id: '5', question: 'How do player auctions work?', answer: 'CricSmart offers IPL-style live player auctions. Admins create a player pool, set budgets for each team, and run real-time bidding sessions.', category: 'features' },
  { id: '6', question: 'Is my team data secure?', answer: 'Yes, security is our top priority. All data is encrypted, stored securely on cloud infrastructure, and never shared with third parties.', category: 'security' },
];

export default function HomePage() {
  const router = useRouter();

  const handleShowLogin = () => {
    const appUrl = encodeURIComponent(siteConfig.appUrl);
    router.push(`/auth/login?redirect=${appUrl}&service=team`);
  };

  const handleExploreFeatures = () => {
    const whyCricSmartSection = document.getElementById('why-cricsmart');
    if (whyCricSmartSection) {
      whyCricSmartSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* SEO Schema - Website + FAQ + Product */}
      <SchemaScript schema={generateWebSiteSchema()} />
      <SchemaScript schema={generateFAQSchema(homepageFAQs)} />
      <SchemaScript schema={generateProductSchema()} />
      
      <div className="min-h-screen bg-slate-900 -mt-16 sm:-mt-20">
        {/* Hero Section - Primary CTA */}
        <HeroSection
          onGetStarted={handleShowLogin}
          onExploreGrounds={handleExploreFeatures}
        />

        {/* Products Overview - Team, Tournament, Auction */}
        <ProductsSection />

        {/* Social Proof Stats - Numbers that build trust */}
        <StatsBar />

        {/* How It Works - Simple 6-step process */}
        <HowItWorks />

        {/* Why CricSmart - Product overview with links */}
        <WhyCricSmart />

        {/* Use Cases - Who it's built for */}
        <UseCases />

        {/* Testimonials - Social proof from real users */}
        <Testimonials />

        {/* Why Choose Us - Comparison with competitors */}
        <WhyChooseUs />

        {/* FAQ Section - Common questions answered */}
        <FAQSection />

        {/* Trust Section - Built by cricket enthusiasts */}
        <TrustSection />

        {/* Final CTA - Get started call to action */}
        <FinalCTA onGetStarted={handleShowLogin} />
      </div>
    </>
  );
}
