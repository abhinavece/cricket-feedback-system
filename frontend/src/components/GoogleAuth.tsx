import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

interface GoogleAuthProps {
  onSuccess?: () => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess }) => {
  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        onSuccess?.();
      } else {
        console.error('Authentication failed:', data.error);
      }
    } catch (error) {
      console.error('Google auth error:', error);
    }
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
  };

  return (
    <div className="flex flex-col items-center space-y-6 md:space-y-8 w-full max-w-sm mx-auto">
      <div className="text-center">
        <div className="cricket-ball mx-auto mb-6" style={{width: '48px', height: '48px'}}></div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Welcome to Mavericks XI</h2>
        <p className="text-secondary text-sm md:text-base">Sign in with your Google account to access the dashboard</p>
      </div>
      
      <div className="w-full flex justify-center py-2">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          text="continue_with"
          shape="pill"
          width="100%"
          logo_alignment="left"
        />
      </div>
      
      <div className="text-center text-[10px] md:text-xs text-secondary opacity-60">
        <p>By signing in, you agree to the Mavericks Team internal access policy.</p>
      </div>
    </div>
  );
};

export default GoogleAuth;
