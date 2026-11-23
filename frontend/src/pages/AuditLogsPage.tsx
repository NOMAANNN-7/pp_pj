import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { useToast } from '../components/Toast';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        page,
        page_size: 25,
      });
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter, entityFilter]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
          <History className="w-4 h-4" />
          <span>System Governance</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Activity & Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable chronological journal recording donor registrations, clinical eligibility modifications, camp logistics, and data backups
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search audit descriptions, activity IDs, entity IDs..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Action Types</option>
            <option value="DONOR_REGISTERED">Donor Registered</option>
            <option value="DONOR_UPDATED">Donor Updated</option>
            <option value="DONOR_DELETED">Donor Deleted</option>
            <option value="DONOR_RESTORED">Donor Restored</option>
            <option value="CAMP_CREATED">Camp Created</option>
            <option value="CAMP_UPDATED">Camp Updated</option>
            <option value="DATA_IMPORTED">Data Imported</option>
            <option value="BACKUP_CREATED">Backup Created</option>
            <option value="DATA_RESTORED">Data Restored</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={e => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Entity Categories</option>
            <option value="DONOR">Donor</option>
            <option value="CAMP">Camp</option>
            <option value="DONATION">Donation</option>
            <option value="SYSTEM">System</option>
            <option value="IMPORT">Import</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Target Ref</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4 font-mono text-slate-400">Activity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No audit events match your criteria.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-crimson-700 dark:text-crimson-400">
                      {log.entity_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium leading-relaxed max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {log.activity_id.slice(0, 8)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages} (Total {total} events)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
