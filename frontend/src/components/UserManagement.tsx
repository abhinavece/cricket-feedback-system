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
    <div className="card">
      <div className="px-6 py-4 border-b" style={{borderColor: 'var(--border-color)'}}>
        <h2 className="text-xl font-semibold text-primary">User Management</h2>
        <p className="text-sm text-secondary mt-1">Manage user roles and permissions</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead style={{backgroundColor: 'var(--card-bg)'}}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              console.log('Rendering user:', user);
              return (
              <tr key={user.id} className="border-b" style={{borderColor: 'var(--border-color)'}}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.avatar && (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.avatar}
                        alt={user.name}
                      />
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-primary">{user.name}</div>
                      <div className="text-sm text-secondary">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as 'viewer' | 'editor' | 'admin')}
                    disabled={updatingUserId === user.id}
                    className="form-control text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)'}}>
        <div className="text-sm text-secondary">
          <p className="font-medium mb-2">Role Permissions:</p>
          <ul className="space-y-1">
            <li><span className="font-medium">Viewer:</span> Can submit feedback only</li>
            <li><span className="font-medium">Editor:</span> Can submit feedback + view dashboard + edit feedback</li>
            <li><span className="font-medium">Admin:</span> Full access including user management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
