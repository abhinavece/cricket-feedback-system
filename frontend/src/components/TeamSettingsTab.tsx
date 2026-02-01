/**
 * @fileoverview Team Settings Tab
 * 
 * Comprehensive team management interface including:
 * - Team info and settings
 * - Invite link management (create, view, revoke)
 * - Member management
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Link,
  Copy,
  Trash2,
  Plus,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink,
  Shield,
  UserPlus,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  createOrganizationInvite,
  getOrganizationInvites,
  revokeOrganizationInvite,
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
  OrganizationInvite,
  OrganizationMember,
} from '../services/api';

type TabType = 'overview' | 'invites' | 'members';

const TeamSettingsTab: React.FC = () => {
  const { currentOrg, isOrgOwner, isOrgAdmin, refreshOrganization, loading: orgLoading } = useOrganization();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Invites state
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  
  // Members state
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Create invite form state
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [inviteMaxUses, setInviteMaxUses] = useState<string>('');
  const [inviteExpiryDays, setInviteExpiryDays] = useState<string>('7');
  const [inviteLabel, setInviteLabel] = useState('');
  
  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Fetch invites
  const fetchInvites = async () => {
    if (!isOrgAdmin) return;
    
    try {
      setLoadingInvites(true);
      const data = await getOrganizationInvites();
      setInvites(data.invites || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  // Fetch members
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await getOrganizationMembers();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'invites' && isOrgAdmin) {
      fetchInvites();
    } else if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab, isOrgAdmin]);

  // Create invite
  const handleCreateInvite = async () => {
    try {
      setCreatingInvite(true);
      setErrorMessage(null);
      
      const data = await createOrganizationInvite({
        role: inviteRole,
        maxUses: inviteMaxUses ? parseInt(inviteMaxUses) : undefined,
        expiresInDays: inviteExpiryDays ? parseInt(inviteExpiryDays) : undefined,
        label: inviteLabel || undefined,
      });
      
      setInvites(prev => [data.invite, ...prev]);
      setShowCreateInvite(false);
      setInviteRole('viewer');
      setInviteMaxUses('');
      setInviteExpiryDays('7');
      setInviteLabel('');
      setSuccessMessage('Invite link created!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create invite');
    } finally {
      setCreatingInvite(false);
    }
  };

  // Revoke invite
  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite? Anyone with this link will no longer be able to join.')) {
      return;
    }
    
    try {
      await revokeOrganizationInvite(inviteId);
      setInvites(prev => prev.filter(i => i._id !== inviteId));
      setSuccessMessage('Invite revoked');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to revoke invite');
    }
  };

  // Copy invite link
  const handleCopyInvite = async (invite: OrganizationInvite) => {
    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopiedInviteId(invite._id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = invite.inviteUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedInviteId(invite._id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    }
  };

  // Update member role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole(userId, newRole);
      setMembers(prev => prev.map(m => 
        m._id === userId ? { ...m, role: newRole as any } : m
      ));
      setSuccessMessage('Role updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update role');
    }
  };

  // Remove member
  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }
    
    try {
      await removeMember(userId);
      setMembers(prev => prev.filter(m => m._id !== userId));
      setSuccessMessage(`${memberName} removed from team`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'editor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <Building2 className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Team Found</h2>
        <p className="text-slate-400">You're not part of any team yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-4 h-4" />
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-300 hover:text-red-200">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            {currentOrg.logo ? (
              <img src={currentOrg.logo} alt={currentOrg.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{currentOrg.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{currentOrg.description || 'No description'}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentOrg.userRole || 'viewer')}`}>
                {currentOrg.userRole}
              </span>
              <span className="text-xs text-slate-500">
                {currentOrg.stats.playerCount} players · {currentOrg.stats.memberCount} members
              </span>
            </div>
          </div>
          <button
            onClick={() => refreshOrganization()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Settings },
          { id: 'invites', label: 'Invite Links', icon: Link, adminOnly: true },
          { id: 'members', label: 'Members', icon: Users },
        ].map(tab => {
          if (tab.adminOnly && !isOrgAdmin) return null;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Players', value: currentOrg.stats.playerCount, icon: Users },
              { label: 'Matches', value: currentOrg.stats.matchCount, icon: Building2 },
              { label: 'Members', value: currentOrg.stats.memberCount, icon: UserPlus },
              { label: 'Plan', value: currentOrg.plan, icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <stat.icon className="w-4 h-4" />
                  {stat.label}
                </div>
                <div className="text-xl font-bold text-white capitalize">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          {isOrgAdmin && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('invites')}
                  className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-emerald-500/10 border border-slate-600 hover:border-emerald-500/50 rounded-xl text-left transition-all"
                >
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Invite Members</div>
                    <div className="text-xs text-slate-400">Create invite links for your team</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                </button>
                
                <button
                  onClick={() => setActiveTab('members')}
                  className="flex items-center gap-3 p-4 bg-slate-700/30 hover:bg-blue-500/10 border border-slate-600 hover:border-blue-500/50 rounded-xl text-left transition-all"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Manage Members</div>
                    <div className="text-xs text-slate-400">View and manage team members</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && isOrgAdmin && (
        <div className="space-y-6">
          {/* Create Invite Button */}
          {!showCreateInvite && (
            <button
              onClick={() => setShowCreateInvite(true)}
              className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Invite Link
            </button>
          )}

          {/* Create Invite Form */}
          {showCreateInvite && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Create Invite Link</h3>
              
              <div className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role for invited members
                  </label>
                  <div className="flex gap-2">
                    {(['viewer', 'editor', 'admin'] as const).map(role => {
                      if (role === 'admin' && !isOrgOwner) return null;
                      return (
                        <button
                          key={role}
                          onClick={() => setInviteRole(role)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                            inviteRole === role
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : 'bg-slate-700/50 text-slate-400 border border-transparent hover:border-white/10'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {inviteRole === 'viewer' && 'Can view data but not make changes'}
                    {inviteRole === 'editor' && 'Can view and edit data'}
                    {inviteRole === 'admin' && 'Full access including member management'}
                  </p>
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max uses (optional)
                  </label>
                  <input
                    type="number"
                    value={inviteMaxUses}
                    onChange={(e) => setInviteMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expires in (days)
                  </label>
                  <select
                    value={inviteExpiryDays}
                    onChange={(e) => setInviteExpiryDays(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="">Never</option>
                  </select>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Label (optional)
                  </label>
                  <input
                    type="text"
                    value={inviteLabel}
                    onChange={(e) => setInviteLabel(e.target.value)}
                    placeholder="e.g., WhatsApp Group Link"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateInvite(false)}
                    className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInvite}
                    disabled={creatingInvite}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {creatingInvite ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invites List */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Active Invite Links</h3>
              <button
                onClick={fetchInvites}
                disabled={loadingInvites}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInvites ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingInvites ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              </div>
            ) : invites.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active invite links</p>
                <p className="text-xs mt-1">Create one to invite team members</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {invites.map(invite => (
                  <div key={invite._id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        invite.isValid ? 'bg-emerald-500/20' : 'bg-slate-600/50'
                      }`}>
                        <Link className={`w-5 h-5 ${invite.isValid ? 'text-emerald-400' : 'text-slate-500'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {invite.label && (
                            <span className="font-medium text-white">{invite.label}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(invite.role)}`}>
                            {invite.role}
                          </span>
                          {!invite.isValid && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                              Expired
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded truncate max-w-[200px]">
                            {invite.code}
                          </code>
                          <button
                            onClick={() => handleCopyInvite(invite)}
                            className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Copy link"
                          >
                            {copiedInviteId === invite._id ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={invite.inviteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {invite.useCount}{invite.maxUses ? `/${invite.maxUses}` : ''} used
                          </span>
                          {invite.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {formatDate(invite.expiresAt)}
                            </span>
                          )}
                          <span>Created {formatDate(invite.createdAt)}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRevokeInvite(invite._id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Revoke invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white">Team Members ({members.length})</h3>
            <button
              onClick={fetchMembers}
              disabled={loadingMembers}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMembers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingMembers ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {members.map(member => (
                <div key={member._id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{member.name.charAt(0)}</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{member.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </div>
                    </div>
                    
                    {/* Role Badge/Selector */}
                    {isOrgAdmin && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border bg-transparent cursor-pointer ${getRoleBadgeColor(member.role)}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        {isOrgOwner && <option value="admin">Admin</option>}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                    
                    {/* Remove Button */}
                    {isOrgAdmin && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member._id, member.name)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamSettingsTab;
