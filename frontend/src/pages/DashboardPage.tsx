import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardSummary, WarningItem, BloodGroupAnalytics } from '../types';
import { KpiCard } from '../components/KpiCard';
import { BloodGroupCard } from '../components/BloodGroupCard';
import { WarningBanner } from '../components/WarningBanner';
import {
  Users,
  CheckCircle,
  Clock,
  Ban,
  Droplet,
  Building2,
  CalendarPlus,
  Flame,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { NavSection } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (section: NavSection) => void;
  warnings: WarningItem[];
}

const BLOOD_GROUP_COLORS = [
  '#B91C1C', '#DC2626', '#EA580C', '#D97706',
  '#059669', '#0284C7', '#4F46E5', '#7C3AED'
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, warnings }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<BloodGroupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumData, analData] = await Promise.all([
        api.getDashboardSummary(),
        api.getBloodGroupAnalytics()
      ]);
      setSummary(sumData);
      setAnalytics(analData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !summary || !analytics) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data from database
  const donutData = analytics.blood_groups.map(bg => ({
    name: bg.blood_group,
    value: bg.total_donors
  })).filter(item => item.value > 0);

  const eligibilityData = [
    { name: 'Eligible', value: summary.eligible_donors, color: '#16A34A' },
    { name: 'Temp Deferred', value: summary.temporarily_deferred, color: '#F59E0B' },
    { name: 'Perm Deferred', value: summary.permanently_deferred, color: '#DC2626' }
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Greetings */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time verified data from local SQLite database • Camp registration analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Export Executive Report
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-sm transition-all"
          >
            + Register Volunteer
          </button>
        </div>
      </div>

      {/* Warnings & Audit Banner */}
      <WarningBanner warnings={warnings} onNavigate={(url) => onNavigate(url.replace('/', '') as NavSection)} />

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Registered"
          value={summary.total_volunteers}
          subtitle="Volunteers registered in camp database"
          icon={Users}
          color="crimson"
        />
        <KpiCard
          title="Eligible Donors"
          value={summary.eligible_donors}
          subtitle={`${((summary.eligible_donors / (summary.total_volunteers || 1)) * 100).toFixed(0)}% of total volunteers`}
          icon={CheckCircle}
          color="emerald"
        />
        <KpiCard
          title="Temporarily Deferred"
          value={summary.temporarily_deferred}
          subtitle="Weight, travel, or interval recovery"
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Permanently Deferred"
          value={summary.permanently_deferred}
          subtitle="Medical questionnaire clearance flags"
          icon={Ban}
          color="crimson"
        />
        <KpiCard
          title="Donations Recorded"
          value={summary.completed_donations}
          subtitle="Total verified units contributed"
          icon={Droplet}
          color="crimson"
        />
        <KpiCard
          title="Upcoming Camps"
          value={summary.upcoming_camps}
          subtitle={`${summary.active_camps} active camp(s) running today`}
          icon={Building2}
          color="blue"
        />
        <KpiCard
          title="New This Month"
          value={summary.new_registrations_this_month}
          subtitle="Registered in the current calendar month"
          icon={CalendarPlus}
          color="purple"
        />
        <KpiCard
          title="Dominant Blood Group"
          value={summary.most_common_blood_group || 'N/A'}
          subtitle={`Highest share in pool (${summary.blood_group_counts[summary.most_common_blood_group || ''] || 0} donors)`}
          icon={Flame}
          color="crimson"
        />
      </div>

      {/* Blood Group Grid Overview (8 Blood Groups) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Blood Group Inventory Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Python collections.Counter aggregation across all active volunteer records
            </p>
          </div>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs font-bold text-crimson-700 dark:text-crimson-400 hover:underline flex items-center"
          >
            Detailed Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {analytics.blood_groups.map(bg => (
            <BloodGroupCard
              key={bg.blood_group}
              bloodGroup={bg.blood_group}
              count={bg.total_donors}
              totalDonors={analytics.total_registered}
              eligibleCount={bg.eligible_donors}
              onClick={() => onNavigate('analytics')}
            />
          ))}
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blood Group Distribution Donut */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Blood Group Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution across all eight groups
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BLOOD_GROUP_COLORS[index % BLOOD_GROUP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} volunteers`, 'Count']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {donutData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: BLOOD_GROUP_COLORS[idx % BLOOD_GROUP_COLORS.length] }} />
                <span className="font-bold">{item.name}</span>
                <span className="text-slate-400">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Trends Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Registration Activity Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily volunteer signups (last 14 days)
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.registration_trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Volunteers"
                  stroke="#B91C1C"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#B91C1C' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 text-center font-medium">
            Active camp mobilization drives reflected in peaks
          </div>
        </div>

        {/* Eligibility Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Screening & Deferral Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preliminary & verified medical screening
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eligibilityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
                <Bar dataKey="value" name="Donors" radius={[0, 6, 6, 0]}>
                  {eligibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold px-2">
            <span className="text-emerald-600">✓ {summary.eligible_donors} Eligible</span>
            <span className="text-amber-600">⚠ {summary.temporarily_deferred} Temp Defer</span>
            <span className="text-rose-600">✕ {summary.permanently_deferred} Perm Defer</span>
          </div>
        </div>
      </div>

      {/* Tables: Recent Registrations & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Volunteer Registrations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest records stored in the SQLite database
              </p>
            </div>
            <button
              onClick={() => onNavigate('donors')}
              className="text-xs font-bold text-crimson-700 dark:text-crimson-400 hover:underline"
            >
              View All ({summary.total_volunteers}) →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Donor ID</th>
                  <th className="py-2.5 px-3">Volunteer Name</th>
                  <th className="py-2.5 px-3">Blood Group</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {summary.recent_donors.map(donor => (
                  <tr key={donor.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-crimson-700 dark:text-crimson-400">
                      {donor.donor_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {donor.full_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-extrabold px-2 py-0.5 rounded-md bg-crimson-50 dark:bg-crimson-950/80 text-crimson-700 dark:text-crimson-400 border border-crimson-200/50 dark:border-crimson-900/50">
                        {donor.blood_group}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{donor.city}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          donor.screening_status.includes('ELIGIBLE')
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {donor.screening_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{donor.registration_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chronological Activity Feed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Audit & Activity Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tamper-evident system activity
              </p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-bold text-crimson-700 dark:text-crimson-400 hover:underline"
            >
              Full Log →
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 max-h-80 pr-1">
            {summary.recent_activities.map(act => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {act.action.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.timestamp.slice(11)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-snug">{act.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
