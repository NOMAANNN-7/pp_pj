import React from 'react';
import { Menu, Sun, Moon, Bell, Search, ShieldCheck, HeartPulse } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { NavSection } from './Sidebar';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onNavigate: (section: NavSection) => void;
  warningCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onNavigate,
  warningCount,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Quick Trigger */}
        <button
          onClick={() => onNavigate('search')}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 text-xs transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Quick search donors, blood groups, camps...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {/* System Health Status */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Engine Healthy</span>
        </div>

        {/* Quick Register Action */}
        <button
          onClick={() => onNavigate('register')}
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-bold shadow-sm shadow-crimson-700/20 transition-all"
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>+ Register Volunteer</span>
        </button>

        {/* Alerts Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          title="System Warnings & Audit"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {warningCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
