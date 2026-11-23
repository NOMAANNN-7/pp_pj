import React from 'react';
import { Droplet } from 'lucide-react';

interface BloodGroupCardProps {
  bloodGroup: string;
  count: number;
  totalDonors: number;
  eligibleCount?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export const BloodGroupCard: React.FC<BloodGroupCardProps> = ({
  bloodGroup,
  count,
  totalDonors,
  eligibleCount = 0,
  onClick,
  isSelected = false,
}) => {
  const percentage = totalDonors > 0 ? ((count / totalDonors) * 100).toFixed(1) : '0.0';

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-crimson-600 ring-2 ring-crimson-600/20 shadow-md'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-crimson-300 dark:hover:border-crimson-800 shadow-sm hover:shadow'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-crimson-50 dark:bg-crimson-950/60 border border-crimson-100 dark:border-crimson-900/40 flex items-center justify-center text-crimson-700 dark:text-crimson-400 font-black text-sm">
            <Droplet className="w-4 h-4 mr-0.5 fill-crimson-600 text-crimson-600" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {bloodGroup}
          </span>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {percentage}%
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{count}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">volunteers</span>
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {eligibleCount} eligible
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-crimson-600 dark:bg-crimson-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
        />
      </div>
    </div>
  );
};
