import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Camp } from '../types';
import { NavSection } from '../components/Sidebar';
import {
  UserPlus,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Weight,
  User,
  Info
} from 'lucide-react';

interface DonorRegistrationPageProps {
  onNavigate: (section: NavSection) => void;
  onRefreshStats?: () => void;
}

const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DonorRegistrationPage: React.FC<DonorRegistrationPageProps> = ({
  onNavigate,
  onRefreshStats,
}) => {
  const { showToast } = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [weightKg, setWeightKg] = useState('65');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [preferredCampId, setPreferredCampId] = useState<string>('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Medical questionnaire
  const [hasChronicIllness, setHasChronicIllness] = useState(false);
  const [hasRecentSurgery, setHasRecentSurgery] = useState(false);
  const [hasMedication, setHasMedication] = useState(false);

  // Consent
  const [consentStorage, setConsentStorage] = useState(true);
  const [consentContact, setConsentContact] = useState(true);

  // Inline Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  useEffect(() => {
    const loadCamps = async () => {
      try {
        setLoadingCamps(true);
        const data = await api.getCamps({ status: 'ACTIVE,UPCOMING' });
        setCamps(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCamps(false);
      }
    };
    loadCamps();
  }, []);

  // Real-time Age Calculation
  useEffect(() => {
    if (!dateOfBirth) {
      setCalculatedAge(null);
      return;
    }
    const birth = new Date(dateOfBirth);
    const today = new Date();
    if (isNaN(birth.getTime())) {
      setCalculatedAge(null);
      return;
    }
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    setCalculatedAge(age);
  }, [dateOfBirth]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is mandatory.';
    if (!dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required.';
    } else {
      const birth = new Date(dateOfBirth);
      if (birth > new Date()) errs.dateOfBirth = 'Date of birth cannot be in the future.';
      else if (calculatedAge !== null && (calculatedAge < 18 || calculatedAge > 65)) {
        errs.dateOfBirth = `Volunteer age is ${calculatedAge}. Safe voluntary donation range is 18 to 65 years.`;
      }
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Valid phone number required (min 10 digits).';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email address format.';
    }

    if (!address.trim()) errs.address = 'Street address is mandatory.';
    if (!city.trim()) errs.city = 'City is mandatory.';
    if (!state.trim()) errs.state = 'State is mandatory.';
    if (!pinCode.trim()) errs.pinCode = 'PIN Code is mandatory.';

    const weightNum = parseFloat(weightKg);
    if (isNaN(weightNum) || weightNum < 45 || weightNum > 200) {
      errs.weightKg = 'Weight must be between 45 and 200 kg.';
    }

    if (!consentStorage) errs.consentStorage = 'Data storage consent is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix form validation errors before proceeding.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        gender,
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pin_code: pinCode.trim(),
        blood_group: bloodGroup,
        weight_kg: parseFloat(weightKg),
        last_donation_date: lastDonationDate || null,
        preferred_camp_id: preferredCampId ? parseInt(preferredCampId) : null,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
        has_chronic_illness: hasChronicIllness,
        has_recent_surgery: hasRecentSurgery,
        has_medication: hasMedication,
        consent_data_storage: consentStorage,
        consent_contact: consentContact,
      };

      const res = await api.createDonor(payload);
      showToast(res.message, 'success');
      setSuccessReceipt({
        donorId: res.data.donor_id,
        name: fullName,
        bloodGroup,
        age: calculatedAge,
        status: res.data.screening_status,
      });

      // Reset form
      setFullName('');
      setDateOfBirth('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCity('');
      setState('');
      setPinCode('');
      setWeightKg('65');
      setLastDonationDate('');
      setPreferredCampId('');
      setEmergencyName('');
      setEmergencyPhone('');
      setHasChronicIllness(false);
      setHasRecentSurgery(false);
      setHasMedication(false);
      setErrors({});

      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-crimson-700 dark:text-crimson-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Heart className="w-4 h-4 fill-crimson-600 text-crimson-600" />
          <span>Volunteer Onboarding</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Blood Donation Camp Registration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Collect volunteer details, conduct preliminary medical screening, and generate a verified donor ID.
        </p>
      </div>

      {/* Success Modal Receipt */}
      {successReceipt && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-md animate-in zoom-in-95 duration-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Registration Successful
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Volunteer Registered: {successReceipt.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Assigned Donor ID: <strong className="font-mono text-crimson-700 dark:text-crimson-400">{successReceipt.donorId}</strong> •
                Blood Group: <strong>{successReceipt.bloodGroup}</strong> • Status: <strong>{successReceipt.status}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => onNavigate('donors')}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              View in Directory
            </button>
            <button
              onClick={() => setSuccessReceipt(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-crimson-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              1. Volunteer Personal Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Kumar Sharma"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.fullName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.fullName && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Date of Birth & Calculated Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth <span className="text-crimson-600">*</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setDateOfBirth(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.dateOfBirth ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {calculatedAge !== null && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  Age: {calculatedAge} years
                </p>
              )}
              {errors.dateOfBirth && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.dateOfBirth}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number <span className="text-crimson-600">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.phone && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="volunteer@example.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>}
            </div>
          </div>

          {/* Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Street Address <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="House / Flat No., Street, Landmark"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.address ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.address && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                City <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.city ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.city && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                State & PIN <span className="text-crimson-600">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="State"
                  className="w-1/2 px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  placeholder="PIN"
                  className="w-1/2 px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Blood Group & Donation Preferences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Heart className="w-5 h-5 text-crimson-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              2. Blood Group & Donation Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Blood Group Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Blood Group <span className="text-crimson-600">*</span>
              </label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-crimson-700 dark:text-crimson-400 bg-slate-50/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
              >
                {ALLOWED_BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight in kg */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Weight (kg) <span className="text-crimson-600">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20 ${
                  errors.weightKg ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {parseFloat(weightKg) < 50 && (
                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                  ⚠ Under 50 kg triggers temporary deferral.
                </p>
              )}
            </div>

            {/* Last Donation Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Last Donation Date
              </label>
              <input
                type="date"
                value={lastDonationDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setLastDonationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
              />
            </div>

            {/* Preferred Camp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Donation Camp
              </label>
              <select
                value={preferredCampId}
                onChange={e => setPreferredCampId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-crimson-600/20"
              >
                <option value="">General Camp Roster</option>
                {camps.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Preliminary Medical Questionnaire */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-crimson-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                3. Preliminary Screening Checklist
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Requires physical verification by camp physician
            </span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Regulatory Notice:</strong> Final medical eligibility requires authorized physical examination by a registered physician at the donation camp.
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer">
              <input
                type="checkbox"
                checked={hasChronicIllness}
                onChange={e => setHasChronicIllness(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Chronic Medical Condition
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Cardiac conditions, bleeding disorders, uncontrolled diabetes, or hepatitis history.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRecentSurgery}
                onChange={e => setHasRecentSurgery(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Recent Surgery or Dental Procedure
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Major surgical intervention in the past 6 months or dental extraction in past 72 hours.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMedication}
                onChange={e => setHasMedication(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Active Prescription Medication
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Currently on antibiotics, blood thinners, or immuno-suppressants.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Consent & Authorization */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-crimson-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              4. Consent & Privacy
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentStorage}
                onChange={e => setConsentStorage(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                I hereby consent to storing my registration details in the LIFEPOINT local database for blood donation camp scheduling and management. <span className="text-crimson-600">*</span>
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentContact}
                onChange={e => setConsentContact(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-crimson-600 focus:ring-crimson-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                I agree to be contacted via phone or SMS for emergency blood needs or upcoming donation camps.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-crimson-700 hover:bg-crimson-800 text-white shadow-md shadow-crimson-700/20 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            {submitting ? (
              <span>Registering Record...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Complete Volunteer Registration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
