import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Settings,
  Sliders,
  Database,
  Moon,
  Sun,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface SettingsPageProps {
  onRefreshStats?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshStats }) => {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [minWeight, setMinWeight] = useState(50);
  const [intervalDays, setIntervalDays] = useState(90);
  const [capacityThreshold, setCapacityThreshold] = useState(85);

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      const s = res.settings;
      if (s.min_age) setMinAge(s.min_age);
      if (s.max_age) setMaxAge(s.max_age);
      if (s.min_weight_kg) setMinWeight(s.min_weight_kg);
      if (s.min_donation_interval_days) setIntervalDays(s.min_donation_interval_days);
      if (s.camp_capacity_warning_pct) setCapacityThreshold(s.camp_capacity_warning_pct);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        min_age: minAge,
        max_age: maxAge,
        min_weight_kg: minWeight,
        min_donation_interval_days: intervalDays,
        camp_capacity_warning_pct: capacityThreshold,
      });
      showToast('System operational parameters updated successfully.', 'success');
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      const res = await api.resetSampleData();
      showToast(res.message, 'success');
      setIsResetConfirmOpen(false);
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset data', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>System Configuration</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Application Settings & Controls
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure medical screening thresholds, appearance themes, and demonstration datasets
        </p>
      </div>

      {/* Form: Medical Screening Rules */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-crimson-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Medical Screening & Eligibility Criteria
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Minimum Donation Age (Years)
            </label>
            <input
              type="number"
              min="16"
              max="25"
              value={minAge}
              onChange={e => setMinAge(parseInt(e.target.value) || 18)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard: 18 years</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Maximum Standard Age (Years)
            </label>
            <input
              type="number"
              min="50"
              max="75"
              value={maxAge}
              onChange={e => setMaxAge(parseInt(e.target.value) || 65)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard: 65 years</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Minimum Safe Weight (kg)
            </label>
            <input
              type="number"
              step="1"
              min="40"
              max="65"
              value={minWeight}
              onChange={e => setMinWeight(parseFloat(e.target.value) || 50)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard: 50.0 kg</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Recovery Interval Window (Days)
            </label>
            <input
              type="number"
              min="30"
              max="180"
              value={intervalDays}
              onChange={e => setIntervalDays(parseInt(e.target.value) || 90)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard: 90 days between cycles</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Camp Capacity Alert Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={capacityThreshold}
              onChange={e => setCapacityThreshold(parseInt(e.target.value) || 85)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Triggers warning banner on dashboard</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-sm transition-all"
          >
            {saving ? 'Saving Changes...' : 'Save Configuration Parameters'}
          </button>
        </div>
      </form>

      {/* Theme Preference Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Appearance & Color Theme
            </h3>
            <p className="text-xs text-slate-500">
              Current active theme is <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
        >
          Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* Hackathon Demonstration Tools Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-amber-100 dark:border-amber-900/40 pb-3">
          <Database className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Hackathon Demonstration Controls
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Reset Demonstration Dataset
            </h4>
            <p className="text-slate-500 mt-0.5">
              Instantly re-seeds the standard 40 synthetic records across all eight blood groups and 4 donation camps.
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={resetting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-1.5 transition-all shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetting ? 'Resetting Database...' : 'Reset to 40 Demonstration Records'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Application Data"
        message="This action will clean all existing records in your local SQLite database and restore the standard 40 demonstration records. Are you sure you want to proceed?"
        confirmLabel="Confirm Data Reset"
        variant="danger"
        isLoading={resetting}
      />
    </div>
  );
};
