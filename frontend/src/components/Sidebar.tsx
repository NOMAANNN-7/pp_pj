import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Droplets,
  Building2,
  Search,
  UploadCloud,
  FileText,
  History,
  Settings,
  HeartHandshake
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'register'
  | 'donors'
  | 'analytics'
  | 'camps'
  | 'search'
  | 'import'
  | 'reports'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  donorCount?: number;
  campCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpen,
  onCloseMobile,
  donorCount,
  campCount,
}) => {
  const menuItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register' as NavSection, label: 'Donor Registration', icon: UserPlus, badge: 'New' },
    { id: 'donors' as NavSection, label: 'Donor Management', icon: Users, count: donorCount },
    { id: 'analytics' as NavSection, label: 'Blood Group Analytics', icon: Droplets, highlight: true },
    { id: 'camps' as NavSection, label: 'Donation Camps', icon: Building2, count: campCount },
    { id: 'search' as NavSection, label: 'Search & Filters', icon: Search },
    { id: 'import' as NavSection, label: 'Bulk CSV Import', icon: UploadCloud },
    { id: 'reports' as NavSection, label: 'Reports & Exports', icon: FileText },
    { id: 'audit' as NavSection, label: 'Activity & Audit Logs', icon: History },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-crimson-800 to-crimson-600 flex items-center justify-center text-white shadow-md shadow-crimson-600/30">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                LIFEPOINT
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-crimson-100 dark:bg-crimson-950/80 text-crimson-700 dark:text-crimson-400">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Blood Camp System
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-crimson-50 dark:bg-crimson-950/60 text-crimson-700 dark:text-crimson-400 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-crimson-600 dark:text-crimson-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crimson-100 dark:bg-crimson-950 text-crimson-700 dark:text-crimson-400">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold mb-1">
              <span>Local Database</span>
              <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                SQLite Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Local-first zero cloud dependency.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
