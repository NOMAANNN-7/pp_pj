import React, { useState } from 'react';
import { WarningItem } from '../types';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface WarningBannerProps {
  warnings: WarningItem[];
  onNavigate?: (url: string) => void;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ warnings, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!warnings || warnings.length === 0) return null;

  const criticalCount = warnings.filter(w => w.level === 'critical').length;
  const warningCount = warnings.filter(w => w.level === 'warning').length;

  return (
    <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-sm mb-6 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              Operational Alerts & Quality Checks ({warnings.length} active)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-400">
              {criticalCount > 0 && `${criticalCount} critical action required • `}
              {warningCount > 0 && `${warningCount} warnings to review • `}
              Automated audit indicators active
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 flex items-center space-x-1 transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'View Details'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/50 space-y-2">
          {warnings.map(w => (
            <div
              key={w.id}
              className={`p-3 rounded-xl border flex items-start justify-between text-xs transition-colors ${
                w.level === 'critical'
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                  : w.level === 'warning'
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
                  : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {w.level === 'critical' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                ) : w.level === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold">{w.title}</span> — {w.message}
                </div>
              </div>
              {w.action_url && onNavigate && (
                <button
                  onClick={() => onNavigate(w.action_url!)}
                  className="font-bold underline ml-3 flex items-center shrink-0 hover:opacity-80"
                >
                  Resolve <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
