import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeNavbar,
  HeroSection,
  StatsBar,
  HowItWorks,
  FeaturesGrid,
  GroundsPreview,
  ContributionSection,
  TrustSection,
  FinalCTA,
} from '../components/home';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect authenticated users to the app
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    // Navigate to app - will show login if not authenticated
    navigate('/app');
  };

  const handleExploreGrounds = () => {
    const groundsSection = document.getElementById('grounds');
    if (groundsSection) {
      groundsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddGround = () => {
    // Navigate to app to access the grounds feature (requires login)
    navigate('/app');
  };

  const handleUpdateGround = () => {
    // Navigate to app to access the grounds feature (requires login)
    navigate('/app');
  };

  const handleMeetTeam = () => {
    navigate('/about');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <HomeNavbar onLogin={handleGetStarted} />

      {/* Hero Section */}
      <HeroSection
        onGetStarted={handleGetStarted}
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
        <GroundsPreview onExploreGrounds={handleGetStarted} />
      </div>

      {/* Community Contribution */}
      <ContributionSection
        onAddGround={handleAddGround}
        onUpdateGround={handleUpdateGround}
      />

      {/* Trust Section */}
      <TrustSection onMeetTeam={handleMeetTeam} />

      {/* Final CTA */}
      <FinalCTA onGetStarted={handleGetStarted} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
