import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  createdAt: string;
  lastLogin: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched users data:', data);
        console.log('First user structure:', data[0]);
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    console.log('Updating user role:', { userId, newRole });
    setUpdatingUserId(userId);
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/users/${userId}/role`;
      console.log('API URL:', apiUrl);
      console.log('Token:', token ? 'exists' : 'missing');
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: newRole }
              : user
          )
        );
        alert(`User role updated to ${newRole} successfully!`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Failed to update role: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Error updating user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-accent-red text-white';
      case 'editor':
        return 'bg-accent-blue text-white';
      case 'viewer':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner" style={{width: '32px', height: '32px'}}></div>
        <span className="ml-2 text-secondary">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b" style={{borderColor: 'var(--border-color)'}}>
        <h2 className="text-xl font-semibold text-primary">User Management</h2>
        <p className="text-sm text-secondary mt-1">Manage user roles and permissions</p>
      </div>
      
      <div className="hidden md:block overflow-x-auto no-scrollbar" style={{WebkitOverflowScrolling: 'touch'}}>
        <table className="min-w-full">
          <thead style={{backgroundColor: 'var(--card-bg)'}}>
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-secondary uppercase tracking-wider whitespace-nowrap">
                User
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-secondary uppercase tracking-wider whitespace-nowrap">
                Role
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-secondary uppercase tracking-wider whitespace-nowrap">
                Last Login
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-secondary uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b" style={{borderColor: 'var(--border-color)'}}>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.avatar && (
                      <img
                        className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-primary-green/30"
                        src={user.avatar}
                        alt={user.name}
                      />
                    )}
                    <div className="ml-3 md:ml-4">
                      <div className="text-sm font-medium text-primary">{user.name}</div>
                      <div className="text-xs text-secondary">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-[10px] md:text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-secondary">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as 'viewer' | 'editor' | 'admin')}
                    disabled={updatingUserId === user.id}
                    className="form-control text-sm min-h-[36px] min-w-[100px]"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-white/5">
        {users.map((user) => (
          <div key={user.id} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.avatar && (
                  <img
                    className="h-10 w-10 rounded-full border border-primary-green/30"
                    src={user.avatar}
                    alt={user.name}
                  />
                )}
                <div>
                  <div className="text-sm font-bold text-primary">{user.name}</div>
                  <div className="text-[10px] text-secondary/70">{user.email}</div>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-[10px] text-secondary uppercase tracking-widest">
                Last Login: <span className="text-white ml-1">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
              </div>
              <div className="w-1/2">
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user.id, e.target.value as 'viewer' | 'editor' | 'admin')}
                  disabled={updatingUserId === user.id}
                  className="form-control text-xs min-h-[44px] bg-white/5 border-white/10"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-4 md:px-6 py-4 border-t" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)'}}>
        <div className="text-xs text-secondary">
          <p className="font-medium mb-2">Role Permissions:</p>
          <ul className="space-y-1">
            <li><span className="font-medium text-primary-green">Viewer:</span> Submit feedback only</li>
            <li><span className="font-medium text-accent-blue">Editor:</span> Submit + View Dashboard + Edit</li>
            <li><span className="font-medium text-accent-red">Admin:</span> Full Access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
