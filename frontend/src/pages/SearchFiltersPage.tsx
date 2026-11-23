import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Donor, Camp } from '../types';
import { useToast } from '../components/Toast';
import {
  Search,
  Filter,
  X,
  Droplet,
  MapPin,
  Calendar,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { NavSection } from '../components/Sidebar';

interface SearchFiltersPageProps {
  onNavigate: (section: NavSection) => void;
}

const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const SearchFiltersPage: React.FC<SearchFiltersPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [results, setResults] = useState<Donor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [camps, setCamps] = useState<Camp[]>([]);

  // Search Criteria
  const [query, setQuery] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('');
  const [campId, setCampId] = useState('');

  useEffect(() => {
    api.getCamps().then(setCamps).catch(console.error);
    // Run initial search
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.getDonors({
        search: query.trim() || undefined,
        blood_group: bloodGroup || undefined,
        city: city.trim() || undefined,
        screening_status: screeningStatus || undefined,
        camp_id: campId || undefined,
        page_size: 50,
      });
      setResults(res.items);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Search execution failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setBloodGroup('');
    setCity('');
    setScreeningStatus('');
    setCampId('');
    setTimeout(handleSearch, 50);
  };

  const hasActiveFilters = !!(query || bloodGroup || city || screeningStatus || campId);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Search className="w-4 h-4" />
          <span>Database Engine</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Global Search & Multi-Attribute Filtering
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Perform indexed queries across volunteer names, donor IDs, contact numbers, blood groups, and locations
        </p>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Main query bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by full name, phone number, Donor ID (e.g. LP-2026-0001), or address..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
          />
        </div>

        {/* Detailed attribute filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={e => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Any Blood Group</option>
              {ALLOWED_BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Bengaluru, Pune, Delhi"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Medical Eligibility</label>
            <select
              value={screeningStatus}
              onChange={e => setScreeningStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Any Status</option>
              <option value="PRELIMINARY_ELIGIBLE">Preliminary Eligible</option>
              <option value="VERIFIED_ELIGIBLE">Verified Eligible</option>
              <option value="TEMPORARILY_DEFERRED">Temporarily Deferred</option>
              <option value="PERMANENTLY_DEFERRED">Permanently Deferred</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Associated Camp</label>
            <select
              value={campId}
              onChange={e => setCampId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">Any Camp</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-crimson-600 dark:text-crimson-400 font-bold hover:underline flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All Search Filters</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-sm transition-all"
          >
            {loading ? 'Searching Database...' : 'Run Query'}
          </button>
        </div>
      </form>

      {/* Results Header */}
      {hasSearched && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Found <strong>{total}</strong> matching records in database</span>
          <span className="text-[11px] font-mono">SQLite Query Executed Locally</span>
        </div>
      )}

      {/* Search Results Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Querying database...</div>
        ) : results.length === 0 && hasSearched ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No Volunteer Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search keywords or resetting filters.</p>
          </div>
        ) : (
          results.map(d => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-crimson-50 dark:bg-crimson-950/80 border border-crimson-100 dark:border-crimson-900/40 flex items-center justify-center text-crimson-700 dark:text-crimson-400 font-black text-base shrink-0">
                  {d.blood_group}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{d.full_name}</h3>
                    <span className="font-mono text-[11px] font-bold text-crimson-700 dark:text-crimson-400">
                      {d.donor_id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.phone}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.city}, {d.state}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Age: {d.age} • Registered: {d.registration_date.slice(0, 10)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    d.screening_status.includes('ELIGIBLE')
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {d.screening_status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => onNavigate('donors')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
