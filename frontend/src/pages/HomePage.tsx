import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDomainType, getAppUrl } from '../utils/domain';
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
  LoginModal,
} from '../components/home';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const domainType = getDomainType();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Redirect authenticated users to the app
  useEffect(() => {
    if (user) {
      // If on homepage domain, redirect to app domain
      if (domainType === 'homepage') {
        window.location.href = getAppUrl();
      } else {
        navigate('/app');
      }
    }
  }, [user, navigate, domainType]);

  // Show login modal instead of redirecting
  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // After successful login, redirect to app
    if (domainType === 'homepage') {
      window.location.href = getAppUrl();
    } else {
      navigate('/app');
    }
  };

  const handleExploreGrounds = () => {
    const groundsSection = document.getElementById('grounds');
    if (groundsSection) {
      groundsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddGround = () => {
    // Show login modal to access the grounds feature
    handleShowLogin();
  };

  const handleUpdateGround = () => {
    // Show login modal to access the grounds feature
    handleShowLogin();
  };

  const handleMeetTeam = () => {
    navigate('/about');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation - Login button shows modal */}
      <HomeNavbar onLogin={handleShowLogin} />

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
        onAddGround={handleAddGround}
        onUpdateGround={handleUpdateGround}
      />

      {/* Trust Section */}
      <TrustSection onMeetTeam={handleMeetTeam} />

      {/* Final CTA - Get Started shows modal */}
      <FinalCTA onGetStarted={handleShowLogin} />

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default HomePage;
