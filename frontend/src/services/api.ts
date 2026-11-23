import { Donor, Camp, BloodGroupAnalytics, DashboardSummary, WarningItem, AuditLog } from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  // Analytics
  getBloodGroupAnalytics: async (filters: Record<string, any> = {}): Promise<BloodGroupAnalytics> => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/analytics/blood-groups?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch blood group analytics');
    return res.json();
  },

  // Donors
  getDonors: async (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/donors?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch donors list');
    return res.json();
  },

  getDonorById: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/donors/${id}`);
    if (!res.ok) throw new Error('Failed to fetch donor details');
    return res.json();
  },

  createDonor: async (data: any) => {
    const res = await fetch(`${API_BASE}/donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.detail || json.message || 'Failed to register donor');
    }
    return json;
  },

  updateDonor: async (id: string | number, data: any) => {
    const res = await fetch(`${API_BASE}/donors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update donor');
    return json;
  },

  updateDonorStatus: async (id: string | number, statusData: any) => {
    const res = await fetch(`${API_BASE}/donors/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update status');
    return json;
  },

  deleteDonor: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/donors/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Failed to delete donor');
    return json;
  },

  restoreDonor: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/donors/${id}/restore`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Failed to restore donor');
    return json;
  },

  recordDonation: async (donorId: string | number, data: any) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to record donation');
    return json;
  },

  // Camps
  getCamps: async (params: Record<string, any> = {}): Promise<Camp[]> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/camps?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch camps');
    return res.json();
  },

  createCamp: async (data: any) => {
    const res = await fetch(`${API_BASE}/camps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to create camp');
    return json;
  },

  updateCamp: async (id: string | number, data: any) => {
    const res = await fetch(`${API_BASE}/camps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update camp');
    return json;
  },

  deleteCamp: async (id: string | number) => {
    const res = await fetch(`${API_BASE}/camps/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Failed to delete camp');
    return json;
  },

  // Warnings
  getWarnings: async (): Promise<WarningItem[]> => {
    const res = await fetch(`${API_BASE}/warnings`);
    if (!res.ok) throw new Error('Failed to fetch warnings');
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Import / Export
  validateCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/import/validate`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  executeImport: async (validRows: any[]) => {
    const res = await fetch(`${API_BASE}/import/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid_rows: validRows }),
    });
    return res.json();
  },

  // Backup & Restore
  createBackup: async () => {
    const res = await fetch(`${API_BASE}/backup`, {
      method: 'POST',
    });
    return res.json();
  },

  listBackups: async () => {
    const res = await fetch(`${API_BASE}/backup/list`);
    return res.json();
  },

  restoreBackup: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/backup/restore`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Restore failed');
    return json;
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  updateSettings: async (settings: any) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  resetSampleData: async () => {
    const res = await fetch(`${API_BASE}/settings/reset-sample-data`, {
      method: 'POST',
    });
    return res.json();
  },
};
