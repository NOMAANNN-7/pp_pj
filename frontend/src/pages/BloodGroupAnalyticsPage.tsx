import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BloodGroupAnalytics, Camp } from '../types';
import { BloodGroupCard } from '../components/BloodGroupCard';
import { useToast } from '../components/Toast';
import {
  Droplet,
  PieChart as PieIcon,
  BarChart3,
  Filter,
  Flame,
  Award,
  Users,
  CheckCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const BG_COLORS: Record<string, string> = {
  'O+': '#B91C1C',
  'A+': '#DC2626',
  'B+': '#EA580C',
  'AB+': '#D97706',
  'O-': '#059669',
  'A-': '#0284C7',
  'B-': '#4F46E5',
  'AB-': '#7C3AED'
};

export const BloodGroupAnalyticsPage: React.FC = () => {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<BloodGroupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [camps, setCamps] = useState<Camp[]>([]);

  // Filter States
  const [selectedCamp, setSelectedCamp] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [activeBloodGroupFilter, setActiveBloodGroupFilter] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getBloodGroupAnalytics({
        camp_id: selectedCamp || undefined,
        city: selectedCity || undefined,
        screening_status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setAnalytics(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch blood group analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCamp, selectedCity, selectedStatus, startDate, endDate]);

  useEffect(() => {
    api.getCamps().then(setCamps).catch(console.error);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Filter down to selected card if any
  const displayedGroups = activeBloodGroupFilter
    ? analytics.blood_groups.filter(bg => bg.blood_group === activeBloodGroupFilter)
    : analytics.blood_groups;

  // Chart data
  const pieData = analytics.blood_groups
    .filter(bg => bg.total_donors > 0)
    .map(bg => ({
      name: bg.blood_group,
      value: bg.total_donors,
      color: BG_COLORS[bg.blood_group] || '#B91C1C'
    }));

  const barData = analytics.blood_groups.map(bg => ({
    group: bg.blood_group,
    Total: bg.total_donors,
    Eligible: bg.eligible_donors,
    Deferred: bg.temporarily_deferred + bg.permanently_deferred,
    Donations: bg.completed_donations
  }));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Droplet className="w-4 h-4 fill-crimson-600 text-crimson-600" />
            <span>Core Analytical Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Blood Group Distribution & Inventory Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time counting calculated via Python collections.Counter directly from registered records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/reports/export/csv"
            download
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/reports/export/pdf"
            download
            className="px-4 py-2 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Filter className="w-4 h-4 text-crimson-600" />
          <span>Multi-Dimensional Analytic Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Donation Camp</label>
            <select
              value={selectedCamp}
              onChange={e => setSelectedCamp(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Camps</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">City</label>
            <input
              type="text"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              placeholder="e.g. Bengaluru, Mumbai"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Screening Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Statuses</option>
              <option value="PRELIMINARY_ELIGIBLE">Preliminary Eligible</option>
              <option value="VERIFIED_ELIGIBLE">Verified Eligible</option>
              <option value="TEMPORARILY_DEFERRED">Temporarily Deferred</option>
              <option value="PERMANENTLY_DEFERRED">Permanently Deferred</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Registered After</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Registered Before</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {(selectedCamp || selectedCity || selectedStatus || startDate || endDate || activeBloodGroupFilter) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSelectedCamp('');
                setSelectedCity('');
                setSelectedStatus('');
                setStartDate('');
                setEndDate('');
                setActiveBloodGroupFilter(null);
              }}
              className="text-xs font-bold text-crimson-600 dark:text-crimson-400 hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-crimson-50 dark:bg-crimson-950/60 border border-crimson-200/50 flex items-center justify-center text-crimson-700 dark:text-crimson-400 shrink-0 font-black text-xl">
            {analytics.total_registered}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Donors</span>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Total in Scope</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Most Common</span>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {analytics.most_common_blood_group || 'N/A'} ({analytics.most_common_count} donors)
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rarest Group</span>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {analytics.least_common_blood_group || 'N/A'} ({analytics.least_common_count} donors)
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 font-black text-xl">
            {analytics.blood_groups.reduce((acc, bg) => acc + bg.completed_donations, 0)}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Units</span>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Collected in History</h4>
          </div>
        </div>
      </div>

      {/* 8 Blood Group Cards (Click to filter table) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Eight Standard Blood Group Totals (Click to focus table)
          </h3>
          {activeBloodGroupFilter && (
            <button
              onClick={() => setActiveBloodGroupFilter(null)}
              className="text-xs text-crimson-600 dark:text-crimson-400 font-bold hover:underline"
            >
              Clear Focus ({activeBloodGroupFilter})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {analytics.blood_groups.map(bg => (
            <BloodGroupCard
              key={bg.blood_group}
              bloodGroup={bg.blood_group}
              count={bg.total_donors}
              totalDonors={analytics.total_registered}
              eligibleCount={bg.eligible_donors}
              isSelected={activeBloodGroupFilter === bg.blood_group}
              onClick={() => {
                setActiveBloodGroupFilter(
                  activeBloodGroupFilter === bg.blood_group ? null : bg.blood_group
                );
              }}
            />
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Comparative Blood Group Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total registered vs. eligible donors vs. donations by blood group
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Total" fill="#B91C1C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Eligible" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Donations" fill="#0284C7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Proportional Share Percentage (%)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accurate share of volunteer pool
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry: any) =>
                    `${entry.name} (${((entry.percent || 0) * 100).toFixed(0)}%)`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} donors`, 'Total']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Analytical Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Detailed Blood Group Breakdown Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exhaustive figures across verified statuses and historical donations
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4 text-center">Total Volunteers</th>
                <th className="py-3 px-4 text-center text-emerald-600">Eligible Donors</th>
                <th className="py-3 px-4 text-center text-amber-600">Temp Deferred</th>
                <th className="py-3 px-4 text-center text-rose-600">Perm Deferred</th>
                <th className="py-3 px-4 text-center">Completed Donations</th>
                <th className="py-3 px-4 text-right">Pool Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedGroups.map(bg => (
                <tr key={bg.blood_group} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-extrabold px-3 py-1 rounded-lg bg-crimson-50 dark:bg-crimson-950/80 text-crimson-700 dark:text-crimson-400 border border-crimson-200/50 dark:border-crimson-900/50">
                      {bg.blood_group}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                    {bg.total_donors}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                    {bg.eligible_donors}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-600 dark:text-amber-400">
                    {bg.temporarily_deferred}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">
                    {bg.permanently_deferred}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {bg.completed_donations} unit(s)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    {bg.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
