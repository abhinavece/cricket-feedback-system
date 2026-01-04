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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card" style={{maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto'}}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-primary">User Profile</h3>
          <button
            onClick={onClose}
            className="text-2xl text-secondary hover:text-primary transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            {success}
          </div>
        )}

          <div className="space-y-6">
            {/* User Avatar and Basic Info */}
            <div className="flex items-center space-x-6 pb-6 border-b" style={{borderColor: 'var(--border-color)'}}>
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4"
                  style={{borderColor: 'var(--primary-green)'}}
                />
              )}
              <div>
                <h4 className="text-xl font-semibold text-primary mb-2">{user?.name}</h4>
                <p className="text-sm text-secondary mb-3">{user?.email}</p>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  user?.role === 'admin' ? 'bg-accent-red text-white' :
                  user?.role === 'editor' ? 'bg-accent-blue text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline"
                    style={{borderColor: 'var(--accent-red)', color: 'var(--accent-red)'}}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                >
                  Edit Profile
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
