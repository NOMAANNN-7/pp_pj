import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { NavSection } from '../components/Sidebar';

interface BulkImportPageProps {
  onNavigate: (section: NavSection) => void;
  onRefreshStats?: () => void;
}

export const BulkImportPage: React.FC<BulkImportPageProps> = ({ onNavigate, onRefreshStats }) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [importCompleted, setImportCompleted] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setImportCompleted(null);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      showToast('Please select a CSV file first.', 'error');
      return;
    }
    setValidating(true);
    try {
      const res = await api.validateCsv(file);
      if (!res.success) {
        showToast(res.error || 'Validation failed', 'error');
        setValidationResult(null);
      } else {
        setValidationResult(res);
        if (res.invalid_count > 0) {
          showToast(`Validation finished: ${res.valid_count} valid, ${res.invalid_count} rejected.`, 'info');
        } else {
          showToast(`Validation passed! All ${res.valid_count} rows are valid.`, 'success');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'File validation error', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.valid_rows || validationResult.valid_rows.length === 0) {
      showToast('No valid rows available to import.', 'error');
      return;
    }
    setImporting(true);
    try {
      const res = await api.executeImport(validationResult.valid_rows);
      showToast(res.message, 'success');
      setImportCompleted(res.imported_count);
      setValidationResult(null);
      setFile(null);
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message || 'Import execution failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!validationResult || !validationResult.error_csv) return;
    const blob = new Blob([validationResult.error_csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifepoint_import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4" />
            <span>Data Ingestion</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Bulk CSV Volunteer Import
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Safely upload and ingest batches of volunteer donor records with full row-level verification
          </p>
        </div>

        <a
          href="/api/import/template"
          download="lifepoint_sample_template.csv"
          className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm flex items-center space-x-2 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-crimson-600" />
          <span>Download Sample CSV Template</span>
        </a>
      </div>

      {/* Import Completed Alert */}
      {importCompleted !== null && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Bulk Import Completed Successfully
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Successfully inserted <strong>{importCompleted}</strong> volunteer records into the local SQLite database.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('donors')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
          >
            View Directory →
          </button>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-crimson-50 dark:bg-crimson-950/60 text-crimson-600 dark:text-crimson-400 mx-auto flex items-center justify-center">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {file ? file.name : 'Choose a CSV file to validate and import'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ensure your file conforms to required columns: full_name, date_of_birth, phone, blood_group, weight_kg, city...
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <label className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors">
            <span>Browse CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
          {file && (
            <button
              onClick={handleValidate}
              disabled={validating}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-sm transition-all"
            >
              {validating ? 'Verifying File...' : 'Validate CSV Rows'}
            </button>
          )}
        </div>
      </div>

      {/* Validation Results View */}
      {validationResult && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pre-Ingestion Validation Summary
              </h3>
              <p className="text-xs text-slate-500">
                Total Rows Checked: <strong>{validationResult.total_rows}</strong> • Valid:{' '}
                <strong className="text-emerald-600">{validationResult.valid_count}</strong> • Errors:{' '}
                <strong className="text-rose-600">{validationResult.invalid_count}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {validationResult.invalid_count > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report CSV</span>
                </button>
              )}
              {validationResult.valid_count > 0 && (
                <button
                  onClick={handleExecuteImport}
                  disabled={importing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  {importing ? 'Importing Rows...' : `Import ${validationResult.valid_count} Valid Records`}
                </button>
              )}
            </div>
          </div>

          {/* Valid Rows Preview */}
          {validationResult.valid_count > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready for Import ({validationResult.valid_count} rows)</span>
              </h4>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Blood Group</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">City</th>
                      <th className="py-2 px-3">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validationResult.valid_rows.map((r: any) => (
                      <tr key={r.row_number} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-3 font-mono text-slate-400">{r.row_number}</td>
                        <td className="py-1.5 px-3 font-semibold">{r.full_name}</td>
                        <td className="py-1.5 px-3 font-bold text-crimson-600">{r.blood_group}</td>
                        <td className="py-1.5 px-3 font-mono">{r.phone}</td>
                        <td className="py-1.5 px-3">{r.city}</td>
                        <td className="py-1.5 px-3">{r.weight_kg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejected Rows Preview */}
          {validationResult.invalid_count > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center space-x-1.5">
                <XCircle className="w-4 h-4" />
                <span>Rejected Rows With Validation Issues ({validationResult.invalid_count} rows)</span>
              </h4>
              <div className="border border-rose-100 dark:border-rose-950/60 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 sticky top-0 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Full Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Errors Detected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-950/50">
                    {validationResult.invalid_rows.map((r: any) => (
                      <tr key={r.row_number} className="bg-rose-50/20">
                        <td className="py-1.5 px-3 font-mono text-rose-500 font-bold">{r.row_number}</td>
                        <td className="py-1.5 px-3">{r.full_name || '<Empty>'}</td>
                        <td className="py-1.5 px-3 font-mono">{r.phone}</td>
                        <td className="py-1.5 px-3 text-rose-600 dark:text-rose-400 font-medium">
                          {r.errors.join(' • ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
