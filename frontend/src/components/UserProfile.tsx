import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Note: In a real implementation, you'd update the auth context with new user data
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg shadow-2xl animate-modal-in overflow-hidden" style={{maxHeight: '90vh', borderRadius: '24px'}}>
        <div className="flex justify-between items-center px-6 py-5 border-b" style={{borderColor: 'var(--border-color)'}}>
          <h3 className="text-xl font-bold text-white">User Profile</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close profile"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          {error && (
            <div className="alert alert-error mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-6 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-8">
            {/* User Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center space-y-4 pb-8 border-b" style={{borderColor: 'var(--border-color)'}}>
              {user?.avatar ? (
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 shadow-xl"
                    style={{borderColor: 'var(--primary-green)'}}
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-card-bg rounded-full"></div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-green flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="text-2xl font-bold text-white leading-tight">{user?.name}</h4>
                <p className="text-secondary text-sm font-medium mt-1">{user?.email}</p>
                <div className="mt-4">
                  <span className={`inline-flex px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-full ${
                    user?.role === 'admin' ? 'bg-accent-red text-white' :
                    user?.role === 'editor' ? 'bg-accent-blue text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control h-12 text-lg"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control h-12 text-lg"
                    required
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary h-12 order-1 md:order-2"
                  >
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline h-12 order-2 md:order-1"
                    style={{borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)'}}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary w-full h-12 shadow-lg"
                >
                  Edit Profile Information
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
