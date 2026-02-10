'use client';

import { useRouter } from 'next/navigation';
import {
  HeroSection,
  StatsBar,
  HowItWorks,
  FeaturesGrid,
  GroundsPreview,
  ContributionSection,
  TrustSection,
  FinalCTA,
} from '@/components/home';
import SchemaScript from '@/components/SchemaScript';
import { generateWebSiteSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  const handleShowLogin = () => {
    const appUrl = encodeURIComponent(siteConfig.appUrl);
    router.push(`/auth/login?redirect=${appUrl}&service=team`);
  };

  const handleExploreGrounds = () => {
    const groundsSection = document.getElementById('grounds');
    if (groundsSection) {
      groundsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <SchemaScript schema={generateWebSiteSchema()} />
      
      <div className="min-h-screen bg-slate-900 -mt-16 sm:-mt-20">
        {/* Hero Section - Get Started shows modal */}
        <HeroSection
          onGetStarted={handleShowLogin}
          onExploreGrounds={handleExploreGrounds}
        />

        {/* Social Proof Stats */}
        <StatsBar />

        {/* How It Works */}
        <HowItWorks />

        {/* Key Features - with id for scroll navigation */}
        <div id="features">
          <FeaturesGrid />
        </div>

        {/* Grounds Discovery - with id for scroll navigation */}
        <div id="grounds">
          <GroundsPreview onExploreGrounds={handleShowLogin} />
        </div>

        {/* Community Contribution */}
        <ContributionSection
          onAddGround={handleShowLogin}
          onUpdateGround={handleShowLogin}
        />

        {/* Trust Section */}
        <TrustSection />

        {/* Final CTA - Get Started shows modal */}
        <FinalCTA onGetStarted={handleShowLogin} />

      </div>
    </>
  );
}
