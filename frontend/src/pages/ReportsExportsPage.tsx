import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Camp } from '../types';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Droplet
} from 'lucide-react';

const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ReportsExportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedBg, setSelectedBg] = useState('');
  const [selectedCamp, setSelectedCamp] = useState('');
  const [markdownPreview, setMarkdownPreview] = useState('');
  const [textPreview, setTextPreview] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Backup & Restore
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupList, setBackupList] = useState<any[]>([]);

  useEffect(() => {
    api.getCamps().then(setCamps).catch(console.error);
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = await api.listBackups();
      setBackupList(data.backups || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMarkdownPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/reports/export/markdown');
      const text = await res.text();
      setMarkdownPreview(text);
      setTextPreview('');
    } catch (e: any) {
      showToast('Failed to load markdown report preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadTextPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/reports/export/text');
      const text = await res.text();
      setTextPreview(text);
      setMarkdownPreview('');
    } catch (e: any) {
      showToast('Failed to load text preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await api.createBackup();
      showToast(res.message, 'success');
      loadBackups();
    } catch (err: any) {
      showToast(err.message || 'Backup failed', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setRestoring(true);
      try {
        const res = await api.restoreBackup(f);
        showToast(res.message, 'success');
      } catch (err: any) {
        showToast(err.message || 'Restore failed', 'error');
      } finally {
        setRestoring(false);
        e.target.value = '';
      }
    }
  };

  const getCsvDownloadUrl = () => {
    const params = new URLSearchParams();
    if (selectedBg) params.append('blood_group', selectedBg);
    if (selectedCamp) params.append('camp_id', selectedCamp);
    return `/api/reports/export/csv?${params.toString()}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          <span>Audited Intelligence</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Reports Center & Data Persistence
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate official executive reports in CSV, PDF, Markdown, and Plain text, or take full JSON database snapshots
        </p>
      </div>

      {/* Export Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PDF Export Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-crimson-50 dark:bg-crimson-950/60 text-crimson-700 dark:text-crimson-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Executive PDF Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Formatted document with branding, donor counts, camp tables, and inventory breakdown.
            </p>
          </div>
          <a
            href="/api/reports/export/pdf"
            download="lifepoint_executive_report.pdf"
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white flex items-center justify-center space-x-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>

        {/* CSV Export Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tabular CSV Data
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Export raw records with custom column headers for spreadsheet analysis.
            </p>
          </div>
          <div className="space-y-2 mt-3">
            <select
              value={selectedBg}
              onChange={e => setSelectedBg(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Blood Groups</option>
              {ALLOWED_BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>Only {bg}</option>
              ))}
            </select>
            <a
              href={getCsvDownloadUrl()}
              download
              className="w-full px-4 py-2 rounded-xl text-xs font-bold border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </a>
          </div>
        </div>

        {/* Markdown Export Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Markdown Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Standard Markdown format with GFM tables, perfect for documentation and GitHub.
            </p>
          </div>
          <button
            onClick={loadMarkdownPreview}
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 transition-all"
          >
            <span>Preview & Copy Markdown</span>
          </button>
        </div>

        {/* Plain Text Export Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Plain Text Summary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fixed-width terminal/printer format for physical camp logs or offline dispatches.
            </p>
          </div>
          <button
            onClick={loadTextPreview}
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 transition-all"
          >
            <span>Preview Plain Text</span>
          </button>
        </div>
      </div>

      {/* Report Preview Panel */}
      {(markdownPreview || textPreview) && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {markdownPreview ? 'Generated Markdown Document' : 'Generated Plain Text Document'}
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(markdownPreview || textPreview);
                showToast('Copied report to clipboard!', 'success');
              }}
              className="text-xs font-bold text-crimson-600 hover:underline"
            >
              Copy Content
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-mono overflow-x-auto max-h-80 text-slate-800 dark:text-slate-200 whitespace-pre">
            {markdownPreview || textPreview}
          </pre>
        </div>
      )}

      {/* JSON Database Backup & Restore Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                JSON Database Backup & Disaster Recovery
              </h3>
              <p className="text-xs text-slate-500">
                Full relational database persistence exported in standardized JSON format
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center space-x-1.5 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{restoring ? 'Restoring...' : 'Restore from JSON'}</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 flex items-center space-x-1.5 transition-all"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{creatingBackup ? 'Creating Snapshot...' : 'Create JSON Backup'}</span>
            </button>
          </div>
        </div>

        {/* Saved Backups Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Local Backup Archives ({backupList.length})
          </h4>
          {backupList.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No previous backups saved in data/backups/</p>
          ) : (
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Donors</th>
                    <th className="py-2.5 px-3">Camps</th>
                    <th className="py-2.5 px-3">File Size</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {backupList.map(b => (
                    <tr key={b.filename} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {b.filename}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{b.metadata?.donor_count ?? 'N/A'}</td>
                      <td className="py-2.5 px-3 font-semibold">{b.metadata?.camp_count ?? 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{(b.size_bytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 px-3 text-slate-400">{b.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
