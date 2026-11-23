export interface Donor {
  id: number;
  donor_id: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  blood_group: string;
  weight_kg: number;
  last_donation_date?: string;
  total_donations: number;
  preferred_camp_id?: number;
  preferred_camp_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  screening_status: 'PRELIMINARY_ELIGIBLE' | 'VERIFIED_ELIGIBLE' | 'TEMPORARILY_DEFERRED' | 'PERMANENTLY_DEFERRED';
  deferral_reason?: string;
  deferral_until?: string;
  medical_notes?: string;
  has_chronic_illness: boolean;
  has_recent_surgery: boolean;
  has_medication: boolean;
  consent_data_storage: boolean;
  consent_contact: boolean;
  is_active: boolean;
  registration_date: string;
  updated_at: string;
  donations?: DonationRecord[];
}

export interface DonationRecord {
  id: number;
  donation_date: string;
  units_donated: number;
  camp_name?: string;
  blood_pressure?: string;
  hemoglobin_level?: number;
  pulse_rate?: number;
  phlebotomist_name?: string;
  remarks?: string;
  created_at: string;
}

export interface Camp {
  id: number;
  camp_code: string;
  name: string;
  venue: string;
  address: string;
  city: string;
  start_date: string;
  end_date: string;
  organizer: string;
  contact_phone: string;
  contact_email?: string;
  capacity: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  registered_donors_count: number;
  completed_donations_count: number;
  created_at: string;
  updated_at: string;
}

export interface BloodGroupStat {
  blood_group: string;
  total_donors: number;
  eligible_donors: number;
  temporarily_deferred: number;
  permanently_deferred: number;
  completed_donations: number;
  percentage: number;
}

export interface BloodGroupAnalytics {
  blood_groups: BloodGroupStat[];
  total_registered: number;
  most_common_blood_group?: string;
  least_common_blood_group?: string;
  most_common_count: number;
  least_common_count: number;
}

export interface DashboardSummary {
  total_volunteers: number;
  eligible_donors: number;
  temporarily_deferred: number;
  permanently_deferred: number;
  completed_donations: number;
  upcoming_camps: number;
  active_camps: number;
  new_registrations_this_month: number;
  most_common_blood_group?: string;
  blood_group_counts: Record<string, number>;
  registration_trends: { date: string; count: number }[];
  eligibility_distribution: Record<string, number>;
  recent_donors: any[];
  recent_activities: any[];
}

export interface WarningItem {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  category: string;
  action_url?: string;
}

export interface AuditLog {
  id: number;
  activity_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  details_json?: string;
  timestamp: string;
}
