/**
 * @fileoverview Admin Menu Component
 * 
 * 9-dot dropdown menu for admin-level features.
 * Supports desktop (compact) and mobile (grouped, full-width) variants.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  BarChart3,
  Users,
  Settings,
  Trophy,
  MessageCircle,
  Send,
  MapPin,
  History,
  Building2,
} from 'lucide-react';

export interface AdminMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  adminOnly?: boolean;
  /** Optional section for grouped mobile menu */
  section?: 'communicate' | 'team' | 'admin' | 'account';
}

interface AdminMenuProps {
  items: AdminMenuItem[];
  userRole?: string;
  className?: string;
  /** 'mobile' = full-width grouped dropdown + "More" label */
  variant?: 'default' | 'mobile';
}

const SECTION_LABELS: Record<string, string> = {
  communicate: 'Communicate',
  team: 'Team & Places',
  admin: 'Admin',
  account: 'Account',
};

const AdminMenu: React.FC<AdminMenuProps> = ({ items, userRole, className = '', variant = 'default' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const visibleItems = items.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false;
    return true;
  });

  const hasSections = visibleItems.some(i => i.section);
  const grouped = hasSections
    ? (['communicate', 'team', 'admin', 'account'] as const).map(section => ({
        section,
        label: SECTION_LABELS[section],
        items: visibleItems.filter(i => i.section === section),
      })).filter(g => g.items.length > 0)
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (visibleItems.length === 0) return null;

  const isMobile = variant === 'mobile';

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center transition-all duration-150
          ${isMobile
            ? `h-9 w-9 rounded-lg ${isOpen ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
            : `p-2 rounded-lg ${isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`
          }
        `}
        aria-label="More menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <LayoutGrid className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 animate-in fade-in duration-100"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div
            ref={menuRef}
            className={`
              z-50 overflow-hidden bg-slate-800 border border-white/10 shadow-2xl
              animate-in fade-in slide-in-from-top-1 duration-100
              ${isMobile
                ? 'fixed right-2 top-12 w-44 rounded-lg py-1'
                : 'absolute right-0 top-full mt-2 min-w-[180px] rounded-xl py-2'}
            `}
            style={isMobile ? { maxHeight: 'calc(100vh - 5rem)' } : undefined}
            role="menu"
          >
            {!isMobile && (
              <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Admin</h3>
              </div>
            )}

            {grouped ? (
              <div className="max-h-[70vh] overflow-y-auto">
                {grouped.map(({ section, label, items: sectionItems }, idx) => (
                  <div key={section}>
                    {isMobile && idx > 0 && <div className="h-px bg-white/5 my-1 mx-2" />}
                    {isMobile && (
                      <p className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                      </p>
                    )}
                    {sectionItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { item.onClick(); setIsOpen(false); }}
                        className={`
                          w-full flex items-center gap-2 text-left transition-colors
                          ${isMobile
                            ? 'px-2.5 py-1.5 text-[11px] text-slate-200 hover:bg-white/8 active:bg-white/12'
                            : 'px-3 py-2 text-sm text-white hover:bg-white/10'}
                        `}
                        role="menuitem"
                      >
                        <span className="text-slate-400 flex-shrink-0 [&>svg]:w-3 [&>svg]:h-3">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { item.onClick(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                  role="menuitem"
                >
                  <span className="text-slate-400">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Desktop: Analytics, Users, Tournaments, Settings only
export const getDefaultAdminMenuItems = (
  onNavigate: (tab: string) => void,
  _userRole?: string
): AdminMenuItem[] => [
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, onClick: () => onNavigate('analytics'), adminOnly: true },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, onClick: () => onNavigate('users'), adminOnly: true },
  { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" />, onClick: () => onNavigate('tournaments'), adminOnly: true },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => onNavigate('settings'), adminOnly: false },
];

// Mobile: everything except Feedback, Matches, Payments (grouped for 9-dot "More" menu)
export const getMobileAdminMenuItems = (
  onNavigate: (tab: string) => void,
  _userRole?: string
): AdminMenuItem[] => [
  { id: 'chats', label: 'Chats', icon: <MessageCircle className="w-4 h-4" />, onClick: () => onNavigate('chats'), adminOnly: true, section: 'communicate' },
  { id: 'whatsapp', label: 'WhatsApp', icon: <Send className="w-4 h-4" />, onClick: () => onNavigate('whatsapp'), adminOnly: true, section: 'communicate' },
  { id: 'grounds', label: 'Grounds', icon: <MapPin className="w-4 h-4" />, onClick: () => onNavigate('grounds'), adminOnly: false, section: 'team' },
  { id: 'player-history', label: 'History', icon: <History className="w-4 h-4" />, onClick: () => onNavigate('player-history'), adminOnly: false, section: 'team' },
  { id: 'team', label: 'Team', icon: <Building2 className="w-4 h-4" />, onClick: () => onNavigate('team'), adminOnly: false, section: 'team' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, onClick: () => onNavigate('analytics'), adminOnly: true, section: 'admin' },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, onClick: () => onNavigate('users'), adminOnly: true, section: 'admin' },
  { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" />, onClick: () => onNavigate('tournaments'), adminOnly: true, section: 'admin' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => onNavigate('settings'), adminOnly: false, section: 'account' },
];

export default AdminMenu;
