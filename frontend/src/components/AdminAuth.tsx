import React, { useState } from 'react';

interface AdminAuthProps {
  onAuthenticated: () => void;
  onBackToForm: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated, onBackToForm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/admin/authenticate`;
      console.log('Attempting authentication to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        console.log('Authentication successful, setting localStorage and calling onAuthenticated');
        localStorage.setItem('adminAuthenticated', 'true');
        onAuthenticated();
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-modal-in">
        <div className="text-center mb-8">
          <div className="cricket-ball mx-auto mb-4" style={{width: '48px', height: '48px'}}></div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Admin Access</h1>
          <p className="text-sm md:text-base text-gray-600">Enter admin password to access dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-lg"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={onBackToForm}
            className="text-green-600 hover:text-green-800 font-semibold text-sm flex items-center justify-center gap-2 mx-auto min-h-[44px]"
          >
            <span>←</span> Back to Feedback Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
