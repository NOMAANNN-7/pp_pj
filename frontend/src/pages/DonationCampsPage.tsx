import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Camp } from '../types';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Building2,
  PlusCircle,
  Calendar,
  MapPin,
  Phone,
  Users,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const DonationCampsPage: React.FC = () => {
  const { showToast } = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [deleteCampTarget, setDeleteCampTarget] = useState<Camp | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [status, setStatus] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [notes, setNotes] = useState('');

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const data = await api.getCamps({ status: statusFilter || undefined, search: search || undefined });
      setCamps(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch camps', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [statusFilter, search]);

  const resetForm = () => {
    setName('');
    setVenue('');
    setAddress('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setOrganizer('');
    setContactPhone('');
    setContactEmail('');
    setCapacity('100');
    setStatus('UPCOMING');
    setNotes('');
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim() || !city.trim() || !startDate || !endDate) {
      showToast('Please fill all mandatory fields.', 'error');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showToast('End date cannot be earlier than start date.', 'error');
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        venue: venue.trim(),
        address: address.trim() || venue.trim(),
        city: city.trim(),
        start_date: startDate,
        end_date: endDate,
        organizer: organizer.trim() || 'Health Department & NGO',
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim() || null,
        capacity: parseInt(capacity) || 100,
        status,
        notes: notes.trim() || null,
      };
      const res = await api.createCamp(payload);
      showToast(res.message, 'success');
      setIsCreateModalOpen(false);
      resetForm();
      fetchCamps();
    } catch (err: any) {
      showToast(err.message || 'Failed to create camp', 'error');
    }
  };

  const openEdit = (camp: Camp) => {
    setSelectedCamp(camp);
    setName(camp.name);
    setVenue(camp.venue);
    setAddress(camp.address);
    setCity(camp.city);
    setStartDate(camp.start_date);
    setEndDate(camp.end_date);
    setOrganizer(camp.organizer);
    setContactPhone(camp.contact_phone);
    setContactEmail(camp.contact_email || '');
    setCapacity(camp.capacity.toString());
    setStatus(camp.status);
    setNotes(camp.notes || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamp) return;
    try {
      const payload = {
        name: name.trim(),
        venue: venue.trim(),
        address: address.trim(),
        city: city.trim(),
        start_date: startDate,
        end_date: endDate,
        organizer: organizer.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim() || null,
        capacity: parseInt(capacity) || 100,
        status,
        notes: notes.trim() || null,
      };
      await api.updateCamp(selectedCamp.id, payload);
      showToast(`Camp ${selectedCamp.camp_code} updated successfully`, 'success');
      setIsEditModalOpen(false);
      fetchCamps();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCamp = async () => {
    if (!deleteCampTarget) return;
    try {
      await api.deleteCamp(deleteCampTarget.id);
      showToast(`Camp ${deleteCampTarget.camp_code} deleted successfully`, 'info');
      setDeleteCampTarget(null);
      fetchCamps();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Donation Camp Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule donation drives, manage capacity, track volunteer rosters, and monitor progress
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-sm flex items-center space-x-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Donation Camp</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search camp by name, venue, city..."
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Camp Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <span className="text-slate-400">Total: {camps.length} camps</span>
      </div>

      {/* Camps Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : camps.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No donation camps found matching the filter.
          </div>
        ) : (
          camps.map(camp => {
            const fillPct = camp.capacity > 0 ? (camp.registered_donors_count / camp.capacity) * 100 : 0;
            const isFull = fillPct >= 100;
            const isNearFull = fillPct >= 85 && !isFull;

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-crimson-700 dark:text-crimson-400">
                      {camp.camp_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : camp.status === 'UPCOMING'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : camp.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {camp.name}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{camp.venue}, {camp.city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{camp.start_date} to {camp.end_date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{camp.contact_phone} ({camp.organizer})</span>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      <span>Volunteers: {camp.registered_donors_count} / {camp.capacity}</span>
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      {fillPct.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-rose-600'
                          : isNearFull
                          ? 'bg-amber-500'
                          : 'bg-crimson-600'
                      }`}
                      style={{ width: `${Math.min(fillPct, 100)}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Donations: <strong>{camp.completed_donations_count}</strong>
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEdit(camp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCampTarget(camp)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Camp Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Camp: ${selectedCamp?.camp_code}` : 'Schedule New Donation Camp'}
        maxWidth="lg"
      >
        <form onSubmit={isEditModalOpen ? handleUpdateCamp : handleCreateCamp} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Camp Title / Name <span className="text-crimson-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apex City Youth Blood Drive"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Venue <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g. Community Auditorium"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                City <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-crimson-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date <span className="text-crimson-600">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Organizer <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                placeholder="e.g. Rotary Club & Red Cross"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone <span className="text-crimson-600">*</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Volunteer Capacity <span className="text-crimson-600">*</span>
              </label>
              <input
                type="number"
                min="10"
                max="2000"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Camp Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active (Running Today)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white font-bold"
            >
              {isEditModalOpen ? 'Save Camp Changes' : 'Confirm & Create Camp'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCampTarget}
        onClose={() => setDeleteCampTarget(null)}
        onConfirm={handleDeleteCamp}
        title="Delete Donation Camp"
        message={`Are you sure you want to permanently delete '${deleteCampTarget?.name}' (${deleteCampTarget?.camp_code})? Associated volunteer records will have camp preference reset to general roster.`}
        confirmLabel="Delete Camp"
        variant="danger"
      />
    </div>
  );
};
