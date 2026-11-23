import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Donor, Camp } from '../types';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Droplet,
  MapPin,
  Calendar,
  CheckCircle,
  Ban,
  Clock,
  HeartHandshake
} from 'lucide-react';
import { NavSection } from '../components/Sidebar';

interface DonorManagementPageProps {
  onNavigate: (section: NavSection) => void;
  onRefreshStats?: () => void;
}

const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DonorManagementPage: React.FC<DonorManagementPageProps> = ({
  onNavigate,
  onRefreshStats,
}) => {
  const { showToast } = useToast();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('registration_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modals state
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [deleteConfirmDonor, setDeleteConfirmDonor] = useState<Donor | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWeight, setEditWeight] = useState('');

  // Status modal state
  const [newStatus, setNewStatus] = useState('');
  const [deferralReason, setDeferralReason] = useState('');
  const [deferralUntil, setDeferralUntil] = useState('');

  // Donation recording state
  const [camps, setCamps] = useState<Camp[]>([]);
  const [donationCampId, setDonationCampId] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [unitsDonated, setUnitsDonated] = useState('1.0');
  const [hemoglobin, setHemoglobin] = useState('13.5');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [phlebotomist, setPhlebotomist] = useState('Staff Nurse');

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await api.getDonors({
        search,
        blood_group: bloodGroup,
        screening_status: screeningStatus,
        city: cityFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_inactive: includeInactive,
        page,
        page_size: pageSize,
      });
      setDonors(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load donors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [page, search, bloodGroup, screeningStatus, cityFilter, sortBy, sortOrder, includeInactive]);

  useEffect(() => {
    api.getCamps().then(setCamps).catch(console.error);
  }, []);

  const openProfile = async (donor: Donor) => {
    try {
      const res = await api.getDonorById(donor.id);
      setSelectedDonor(res.data);
      setIsProfileModalOpen(true);
    } catch (e) {
      setSelectedDonor(donor);
      setIsProfileModalOpen(true);
    }
  };

  const openEdit = (donor: Donor) => {
    setSelectedDonor(donor);
    setEditFullName(donor.full_name);
    setEditPhone(donor.phone);
    setEditCity(donor.city);
    setEditAddress(donor.address);
    setEditWeight(donor.weight_kg.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDonor) return;
    try {
      await api.updateDonor(selectedDonor.id, {
        full_name: editFullName,
        phone: editPhone,
        city: editCity,
        address: editAddress,
        weight_kg: parseFloat(editWeight),
      });
      showToast(`Donor ${selectedDonor.donor_id} updated successfully`, 'success');
      setIsEditModalOpen(false);
      fetchDonors();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openStatusModal = (donor: Donor) => {
    setSelectedDonor(donor);
    setNewStatus(donor.screening_status);
    setDeferralReason(donor.deferral_reason || '');
    setDeferralUntil(donor.deferral_until || '');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedDonor) return;
    try {
      await api.updateDonorStatus(selectedDonor.id, {
        screening_status: newStatus,
        deferral_reason: deferralReason || null,
        deferral_until: deferralUntil || null,
      });
      showToast(`Screening status updated to ${newStatus}`, 'success');
      setIsStatusModalOpen(false);
      fetchDonors();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openDonationModal = (donor: Donor) => {
    setSelectedDonor(donor);
    setDonationDate(new Date().toISOString().split('T')[0]);
    setIsDonationModalOpen(true);
  };

  const handleRecordDonation = async () => {
    if (!selectedDonor) return;
    try {
      await api.recordDonation(selectedDonor.id, {
        camp_id: donationCampId ? parseInt(donationCampId) : null,
        donation_date: donationDate,
        units_donated: parseFloat(unitsDonated) || 1.0,
        hemoglobin_level: parseFloat(hemoglobin) || null,
        blood_pressure: bloodPressure || null,
        phlebotomist_name: phlebotomist || null,
      });
      showToast(`Donation recorded for ${selectedDonor.full_name}`, 'success');
      setIsDonationModalOpen(false);
      fetchDonors();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmDonor) return;
    try {
      await api.deleteDonor(deleteConfirmDonor.id);
      showToast(`Donor ${deleteConfirmDonor.donor_id} deactivated (soft-deleted).`, 'info');
      setDeleteConfirmDonor(null);
      fetchDonors();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRestore = async (donor: Donor) => {
    try {
      await api.restoreDonor(donor.id);
      showToast(`Donor ${donor.donor_id} restored successfully.`, 'success');
      fetchDonors();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Donor Records Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete registry of registered volunteers, medical verification flags, and donation history
          </p>
        </div>
        <button
          onClick={() => onNavigate('register')}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-sm transition-all flex items-center justify-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Donor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Donor ID, name, phone, or city..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
            />
          </div>

          {/* Blood Group Filter */}
          <div>
            <select
              value={bloodGroup}
              onChange={e => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
            >
              <option value="">All Blood Groups</option>
              {ALLOWED_BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Screening Status Filter */}
          <div>
            <select
              value={screeningStatus}
              onChange={e => {
                setScreeningStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
            >
              <option value="">All Statuses</option>
              <option value="PRELIMINARY_ELIGIBLE">Preliminary Eligible</option>
              <option value="VERIFIED_ELIGIBLE">Verified Eligible</option>
              <option value="TEMPORARILY_DEFERRED">Temporarily Deferred</option>
              <option value="PERMANENTLY_DEFERRED">Permanently Deferred</option>
            </select>
          </div>
        </div>

        {/* Secondary options row */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={e => {
                  setIncludeInactive(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
              />
              <span>Show deactivated / soft-deleted records</span>
            </label>
            {(search || bloodGroup || screeningStatus || cityFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setBloodGroup('');
                  setScreeningStatus('');
                  setCityFilter('');
                  setPage(1);
                }}
                className="text-crimson-600 dark:text-crimson-400 font-bold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Showing {donors.length} of {total} records
          </div>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Donor ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Donations</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading donors...
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No donor records match the selected criteria.
                  </td>
                </tr>
              ) : (
                donors.map(d => (
                  <tr
                    key={d.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      !d.is_active ? 'opacity-50 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-crimson-700 dark:text-crimson-400">
                      {d.donor_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {d.full_name}
                      <span className="block font-normal text-[11px] text-slate-400">
                        Age: {d.age} • {d.gender || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold px-2 py-0.5 rounded-md bg-crimson-50 dark:bg-crimson-950/80 text-crimson-700 dark:text-crimson-400 border border-crimson-200/50 dark:border-crimson-900/50">
                        {d.blood_group}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{d.phone}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.city}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{d.registration_date.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          d.screening_status === 'VERIFIED_ELIGIBLE'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : d.screening_status === 'PRELIMINARY_ELIGIBLE'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : d.screening_status === 'TEMPORARILY_DEFERRED'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {d.screening_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {d.total_donations}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openProfile(d)}
                          title="View Complete Profile"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDonationModal(d)}
                          title="Record Donation Event"
                          className="p-1.5 rounded-lg text-crimson-600 hover:text-crimson-800 hover:bg-crimson-50 dark:hover:bg-crimson-950/60 transition-colors"
                        >
                          <Droplet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(d)}
                          title="Update Screening Verification"
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(d)}
                          title="Edit Information"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {d.is_active ? (
                          <button
                            onClick={() => setDeleteConfirmDonor(d)}
                            title="Soft Delete Donor"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(d)}
                            title="Restore Donor"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
            <span className="text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={selectedDonor ? `Donor Profile: ${selectedDonor.full_name}` : 'Donor Profile'}
        maxWidth="2xl"
      >
        {selectedDonor && (
          <div className="space-y-6 text-xs">
            {/* Header Card */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-crimson-100 dark:bg-crimson-950 text-crimson-700 dark:text-crimson-400 font-black text-lg flex items-center justify-center">
                  {selectedDonor.blood_group}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedDonor.full_name}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 font-mono">
                    ID: {selectedDonor.donor_id} • Age: {selectedDonor.age} • {selectedDonor.gender}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedDonor.screening_status.includes('ELIGIBLE')
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {selectedDonor.screening_status.replace('_', ' ')}
              </span>
            </div>

            {/* Two column grid details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Contact & Location
                </span>
                <p><strong>Phone:</strong> {selectedDonor.phone}</p>
                <p><strong>Email:</strong> {selectedDonor.email || 'None'}</p>
                <p><strong>Address:</strong> {selectedDonor.address}</p>
                <p><strong>City/State:</strong> {selectedDonor.city}, {selectedDonor.state} - {selectedDonor.pin_code}</p>
              </div>

              <div className="space-y-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Medical & Donation History
                </span>
                <p><strong>Weight:</strong> {selectedDonor.weight_kg} kg</p>
                <p><strong>Total Completed Donations:</strong> {selectedDonor.total_donations}</p>
                <p><strong>Last Donation Date:</strong> {selectedDonor.last_donation_date || 'No previous donation'}</p>
                <p><strong>Preferred Camp:</strong> {selectedDonor.preferred_camp_name || 'General Roster'}</p>
                {selectedDonor.deferral_reason && (
                  <p className="text-rose-600 font-semibold">
                    <strong>Deferral Reason:</strong> {selectedDonor.deferral_reason}
                  </p>
                )}
              </div>
            </div>

            {/* Donation History Table */}
            <div>
              <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                Verified Donation Records ({selectedDonor.donations?.length || 0})
              </h5>
              {selectedDonor.donations && selectedDonor.donations.length > 0 ? (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Camp / Venue</th>
                        <th className="py-2 px-3">Units</th>
                        <th className="py-2 px-3">Hemoglobin</th>
                        <th className="py-2 px-3">BP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedDonor.donations.map(don => (
                        <tr key={don.id}>
                          <td className="py-2 px-3">{don.donation_date}</td>
                          <td className="py-2 px-3">{don.camp_name || 'Direct Center'}</td>
                          <td className="py-2 px-3 font-bold">{don.units_donated} Unit</td>
                          <td className="py-2 px-3">{don.hemoglobin_level || 'N/A'}</td>
                          <td className="py-2 px-3">{don.blood_pressure || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 italic">No historical donation events recorded for this volunteer yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Donor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedDonor ? `Edit Profile: ${selectedDonor.donor_id}` : 'Edit Donor'}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={editFullName}
              onChange={e => setEditFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <input
              type="text"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
            <input
              type="text"
              value={editCity}
              onChange={e => setEditCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
            <textarea
              rows={2}
              value={editAddress}
              onChange={e => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
            <input
              type="number"
              value={editWeight}
              onChange={e => setEditWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white font-bold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Verification Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Medical Verification Status"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Screening Status
            </label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="PRELIMINARY_ELIGIBLE">Preliminary Eligible (Awaiting Camp Check)</option>
              <option value="VERIFIED_ELIGIBLE">Verified Eligible (Physician Approved)</option>
              <option value="TEMPORARILY_DEFERRED">Temporarily Deferred</option>
              <option value="PERMANENTLY_DEFERRED">Permanently Deferred</option>
            </select>
          </div>
          {(newStatus === 'TEMPORARILY_DEFERRED' || newStatus === 'PERMANENTLY_DEFERRED') && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deferral Reason / Clinical Notes
              </label>
              <textarea
                rows={2}
                value={deferralReason}
                onChange={e => setDeferralReason(e.target.value)}
                placeholder="Specify clinical reasons or recovery requirements..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}
          {newStatus === 'TEMPORARILY_DEFERRED' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deferral Valid Until
              </label>
              <input
                type="date"
                value={deferralUntil}
                onChange={e => setDeferralUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Update Status
            </button>
          </div>
        </div>
      </Modal>

      {/* Record Donation Event Modal */}
      <Modal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        title={selectedDonor ? `Record Blood Donation: ${selectedDonor.full_name}` : 'Record Donation'}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Donation Camp</label>
            <select
              value={donationCampId}
              onChange={e => setDonationCampId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">General Clinic Collection</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date of Donation</label>
              <input
                type="date"
                value={donationDate}
                onChange={e => setDonationDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Units (Standard: 1.0)</label>
              <input
                type="number"
                step="0.5"
                value={unitsDonated}
                onChange={e => setUnitsDonated(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hemoglobin (g/dL)</label>
              <input
                type="number"
                step="0.1"
                value={hemoglobin}
                onChange={e => setHemoglobin(e.target.value)}
                placeholder="13.5"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Pressure</label>
              <input
                type="text"
                value={bloodPressure}
                onChange={e => setBloodPressure(e.target.value)}
                placeholder="120/80"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsDonationModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordDonation}
              className="px-4 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white font-bold"
            >
              Save Donation Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmDonor}
        onClose={() => setDeleteConfirmDonor(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Volunteer Record"
        message={`Are you sure you want to deactivate donor '${deleteConfirmDonor?.full_name}' (${deleteConfirmDonor?.donor_id})? The record will be soft-deleted and can be restored at any time.`}
        confirmLabel="Deactivate Record"
        variant="danger"
      />
    </div>
  );
};
