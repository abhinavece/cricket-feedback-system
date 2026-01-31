import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Shield, 
  Edit3, 
  Eye, 
  Crown, 
  Clock, 
  Mail, 
  ChevronDown,
  Sparkles,
  Brain,
  UserCheck,
  Activity,
  RefreshCw
} from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const { token } = useAuth();

  // Animated neural network background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    const numParticles = 30;
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
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
    setUpdatingUserId(userId);
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/users/${userId}/role`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: newRole }
              : user
          )
        );
      } else {
        const errorData = await response.json();
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
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: <Crown className="w-3 h-3" />,
          bg: 'from-rose-500/20 to-pink-500/20',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          glow: 'shadow-rose-500/20',
          label: 'Admin'
        };
      case 'editor':
        return {
          icon: <Edit3 className="w-3 h-3" />,
          bg: 'from-cyan-500/20 to-blue-500/20',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          glow: 'shadow-cyan-500/20',
          label: 'Editor'
        };
      default:
        return {
          icon: <Eye className="w-3 h-3" />,
          bg: 'from-slate-500/20 to-slate-600/20',
          border: 'border-slate-500/30',
          text: 'text-slate-400',
          glow: 'shadow-slate-500/20',
          label: 'Viewer'
        };
    }
  };

  // Stats calculations
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    editors: users.filter(u => u.role === 'editor').length,
    viewers: users.filter(u => u.role === 'viewer').length,
    activeToday: users.filter(u => {
      if (!u.lastLogin) return false;
      const lastLogin = new Date(u.lastLogin);
      const today = new Date();
      return lastLogin.toDateString() === today.toDateString();
    }).length
  };

  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(u => u.role === selectedRole);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-emerald-500/30 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center">
          <Users className="w-8 h-8 text-rose-400" />
        </div>
        <p className="text-rose-400 font-medium">{error}</p>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
        style={{ zIndex: 0 }}
      />

      <div className="relative z-10">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  User Directory
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-400">
                    <Brain className="w-3 h-3" />
                    AI
                  </span>
                </h1>
                <p className="text-sm text-slate-400">Manage team access & permissions</p>
              </div>
            </div>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:border-emerald-500/30 transition-all group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Users', value: stats.total, icon: <Users className="w-4 h-4" />, color: 'emerald' },
            { label: 'Admins', value: stats.admins, icon: <Crown className="w-4 h-4" />, color: 'rose' },
            { label: 'Editors', value: stats.editors, icon: <Edit3 className="w-4 h-4" />, color: 'cyan' },
            { label: 'Viewers', value: stats.viewers, icon: <Eye className="w-4 h-4" />, color: 'slate' },
            { label: 'Active Today', value: stats.activeToday, icon: <Activity className="w-4 h-4" />, color: 'violet' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-3 md:p-4 hover:border-${stat.color}-500/30 transition-all group ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center text-${stat.color}-400`}>
                  {stat.icon}
                </div>
                <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All Users', count: users.length },
            { id: 'admin', label: 'Admins', count: stats.admins },
            { id: 'editor', label: 'Editors', count: stats.editors },
            { id: 'viewer', label: 'Viewers', count: stats.viewers },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedRole(filter.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedRole === filter.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {filter.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                selectedRole === filter.id ? 'bg-emerald-500/30' : 'bg-slate-700/50'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* User Cards - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => {
            const roleConfig = getRoleConfig(user.role);
            return (
              <div
                key={user.id}
                className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 group-hover:border-emerald-500/50 transition-colors"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border-2 border-slate-700">
                          <span className="text-lg font-bold text-slate-400">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${
                        user.lastLogin && new Date(user.lastLogin).toDateString() === new Date().toDateString()
                          ? 'bg-emerald-500'
                          : 'bg-slate-600'
                      } border-2 border-slate-900`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {user.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${roleConfig.bg} border ${roleConfig.border} ${roleConfig.text} mb-4`}>
                  {roleConfig.icon}
                  <span className="text-xs font-semibold">{roleConfig.label}</span>
                </div>

                {/* Last Login */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last seen: <span className="text-slate-300">{formatDate(user.lastLogin)}</span></span>
                </div>

                {/* Role Selector */}
                <div className="relative">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as 'viewer' | 'editor' | 'admin')}
                    disabled={updatingUserId === user.id}
                    className="w-full appearance-none bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="viewer">👁️ Viewer - View Only</option>
                    <option value="editor">✏️ Editor - Can Edit</option>
                    <option value="admin">👑 Admin - Full Access</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  {updatingUserId === user.id && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredUsers.map((user, index) => {
            const roleConfig = getRoleConfig(user.role);
            return (
              <div
                key={user.id}
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="text-base font-bold text-slate-400">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
                      user.lastLogin && new Date(user.lastLogin).toDateString() === new Date().toDateString()
                        ? 'bg-emerald-500'
                        : 'bg-slate-600'
                    } border-2 border-slate-900`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{user.name}</h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r ${roleConfig.bg} border ${roleConfig.border} ${roleConfig.text}`}>
                        {roleConfig.icon}
                        <span className="text-[10px] font-semibold">{roleConfig.label}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(user.lastLogin)}</span>
                  </div>
                  
                  <div className="relative flex-1 max-w-[140px]">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'viewer' | 'editor' | 'admin')}
                      disabled={updatingUserId === user.id}
                      className="w-full appearance-none bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    {updatingUserId === user.id && (
                      <div className="absolute right-7 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400">No users found</p>
          </div>
        )}

        {/* Permissions Legend */}
        <div className="mt-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Role Permissions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                role: 'Viewer',
                icon: <Eye className="w-4 h-4" />,
                color: 'slate',
                permissions: ['View feedback', 'Submit feedback', 'View basic stats']
              },
              {
                role: 'Editor',
                icon: <Edit3 className="w-4 h-4" />,
                color: 'cyan',
                permissions: ['All Viewer permissions', 'Edit feedback', 'Manage matches', 'View detailed analytics']
              },
              {
                role: 'Admin',
                icon: <Crown className="w-4 h-4" />,
                color: 'rose',
                permissions: ['Full access', 'Manage users', 'Delete data', 'System settings']
              }
            ].map((item) => (
              <div key={item.role} className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
                <div className={`flex items-center gap-2 mb-3 text-${item.color}-400`}>
                  {item.icon}
                  <span className="font-semibold text-sm">{item.role}</span>
                </div>
                <ul className="space-y-1.5">
                  {item.permissions.map((perm, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <UserCheck className="w-3 h-3 text-emerald-500" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
