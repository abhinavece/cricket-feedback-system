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
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <div className="cricket-ball" style={{margin: '0 auto 20px'}}></div>
        <h2 className="text-3xl font-bold text-primary mb-3">Welcome to Cricket Feedback</h2>
        <p className="text-secondary">Sign in with your Google account to continue</p>
      </div>
      
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="filled_blue"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
      />
      
      <div className="text-center text-sm text-secondary">
        <p>By signing in, you agree to our terms and conditions</p>
      </div>
    </div>
  );
};

export default GoogleAuth;
