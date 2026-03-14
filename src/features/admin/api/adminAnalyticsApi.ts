import apiClient from '../../../services/apiClient';

const BASE = '/admin';

export interface AnalyticsSummary {
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  completedAppointments: number
  revenue: { NPR: number; USD: number }
}

export interface AppointmentByStatus {
  status: string
  count: number
}

export interface RevenueByMonth {
  year: number
  month: number
  currency: string
  total: number
}

export interface TopSpecialty {
  specialization: string
  count: number
}

export interface AppointmentsByMonth {
  year: number
  month: number
  count: number
}

export const adminAnalyticsApi = {
  getSummary() {
    return apiClient.get<AnalyticsSummary>(`${BASE}/analytics/summary`);
  },
  getAppointmentsByStatus() {
    return apiClient.get<{ items: AppointmentByStatus[] }>(`${BASE}/analytics/appointments-by-status`);
  },
  getAppointmentsByMonth(months = 12) {
    return apiClient.get<{ items: AppointmentsByMonth[] }>(`${BASE}/analytics/appointments-by-month?months=${months}`);
  },
  getRevenueByMonth() {
    return apiClient.get<{ items: RevenueByMonth[] }>(`${BASE}/analytics/revenue-by-month`);
  },
  getTopSpecialties(limit = 5) {
    return apiClient.get<{ items: TopSpecialty[] }>(`${BASE}/analytics/top-specialties?limit=${limit}`);
  }
};
