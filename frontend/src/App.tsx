import React, { useState, useEffect } from 'react';
import { Sidebar, NavSection } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './services/api';
import { WarningItem } from './types';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { DonorRegistrationPage } from './pages/DonorRegistrationPage';
import { DonorManagementPage } from './pages/DonorManagementPage';
import { BloodGroupAnalyticsPage } from './pages/BloodGroupAnalyticsPage';
import { DonationCampsPage } from './pages/DonationCampsPage';
import { SearchFiltersPage } from './pages/SearchFiltersPage';
import { BulkImportPage } from './pages/BulkImportPage';
import { ReportsExportsPage } from './pages/ReportsExportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export function AppContent() {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [donorCount, setDonorCount] = useState<number | undefined>(undefined);
  const [campCount, setCampCount] = useState<number | undefined>(undefined);

  const fetchGlobalStats = async () => {
    try {
      const [warnData, sumData, campData] = await Promise.all([
        api.getWarnings(),
        api.getDashboardSummary(),
        api.getCamps()
      ]);
      setWarnings(warnData);
      setDonorCount(sumData.total_volunteers);
      setCampCount(campData.length);
    } catch (e) {
      console.error('Error fetching global application data:', e);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
    // Poll warnings every 60s
    const interval = setInterval(fetchGlobalStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K to open Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentSection('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        donorCount={donorCount}
        campCount={campCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onNavigate={setCurrentSection}
          warningCount={warnings.length}
        />

        <main className="flex-1 pb-16">
          {currentSection === 'dashboard' && (
            <DashboardPage onNavigate={setCurrentSection} warnings={warnings} />
          )}
          {currentSection === 'register' && (
            <DonorRegistrationPage onNavigate={setCurrentSection} onRefreshStats={fetchGlobalStats} />
          )}
          {currentSection === 'donors' && (
            <DonorManagementPage onNavigate={setCurrentSection} onRefreshStats={fetchGlobalStats} />
          )}
          {currentSection === 'analytics' && (
            <BloodGroupAnalyticsPage />
          )}
          {currentSection === 'camps' && (
            <DonationCampsPage />
          )}
          {currentSection === 'search' && (
            <SearchFiltersPage onNavigate={setCurrentSection} />
          )}
          {currentSection === 'import' && (
            <BulkImportPage onNavigate={setCurrentSection} onRefreshStats={fetchGlobalStats} />
          )}
          {currentSection === 'reports' && (
            <ReportsExportsPage />
          )}
          {currentSection === 'audit' && (
            <AuditLogsPage />
          )}
          {currentSection === 'settings' && (
            <SettingsPage onRefreshStats={fetchGlobalStats} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
