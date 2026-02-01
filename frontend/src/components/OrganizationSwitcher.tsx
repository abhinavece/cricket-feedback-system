/**
 * @fileoverview Organization Switcher Component
 * 
 * Dropdown component for switching between organizations.
 * Shows current organization and allows switching to other organizations the user belongs to.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Users, Settings } from 'lucide-react';
import { useOrganization, OrganizationMembership } from '../contexts/OrganizationContext';

interface OrganizationSwitcherProps {
  onCreateNew?: () => void;
  onManageOrg?: () => void;
  compact?: boolean;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  onCreateNew,
  onManageOrg,
  compact = false,
}) => {
  const { currentOrg, userOrgs, switchOrganization, loading, isOrgAdmin } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (org: OrganizationMembership) => {
    if (org._id === currentOrg?._id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      await switchOrganization(org._id);
      setIsOpen(false);
      // Reload page to refresh all data with new org context
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-500/20 text-amber-400';
      case 'admin': return 'bg-purple-500/20 text-purple-400';
      case 'editor': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading && !currentOrg) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-slate-700 rounded-lg" />
        <div className="w-24 h-4 bg-slate-700 rounded" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Create Team</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className={`flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-white/10 ${
          switching ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {/* Org Logo/Icon */}
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
          {currentOrg.logo ? (
            <img src={currentOrg.logo} alt={currentOrg.name} className="w-full h-full rounded-lg object-cover" />
          ) : (
            <Building2 className="w-4 h-4 text-white" />
          )}
        </div>
        
        {!compact && (
          <>
            <div className="text-left">
              <div className="text-sm font-medium text-white truncate max-w-[120px]">
                {currentOrg.name}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                {currentOrg.userRole}
              </div>
            </div>
            
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Current Org Header */}
          <div className="p-3 border-b border-white/10 bg-slate-700/50">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Current Team</div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-white">{currentOrg.name}</div>
                <div className="text-xs text-slate-400">
                  {currentOrg.stats.playerCount} players · {currentOrg.stats.memberCount} members
                </div>
              </div>
            </div>
          </div>

          {/* Organization List */}
          {userOrgs.length > 1 && (
            <div className="p-2 border-b border-white/10">
              <div className="text-xs text-slate-400 uppercase tracking-wide px-2 mb-1">Switch Team</div>
              <div className="max-h-48 overflow-y-auto">
                {userOrgs.map((org) => (
                  <button
                    key={org._id}
                    onClick={() => handleSwitch(org)}
                    disabled={switching}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                      org._id === currentOrg._id
                        ? 'bg-emerald-500/20'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{org.name}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(org.userRole)}`}>
                          {org.userRole}
                        </span>
                        <span className="text-xs text-slate-500">
                          {org.stats.playerCount} players
                        </span>
                      </div>
                    </div>
                    {org._id === currentOrg._id && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2">
            {onCreateNew && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">Create New Team</span>
              </button>
            )}
            
            {isOrgAdmin && onManageOrg && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onManageOrg();
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Team Settings</span>
              </button>
            )}
            
            {isOrgAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to members page
                  window.location.href = '/users';
                }}
                className="w-full flex items-center gap-3 px-2 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                <span className="text-sm">Manage Members</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSwitcher;
