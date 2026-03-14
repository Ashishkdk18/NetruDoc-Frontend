import apiClient from '../../../services/apiClient';
import { Hospital, HospitalFilters, HospitalPagination } from '../models/hospitalModels';
import { PaginatedApiResponse, PaginatedResponse } from '../../../types/api';

const HOSPITAL_API_BASE = '/hospitals';

/**
 * Hospital API service
 */
export const hospitalApi = {
  /**
   * Get all hospitals with optional filters and pagination
   */
  getHospitals: async (filters?: HospitalFilters, pagination?: HospitalPagination): Promise<PaginatedApiResponse<Hospital>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `${HOSPITAL_API_BASE}?${queryString}` : HOSPITAL_API_BASE;

    return apiClient.get<PaginatedResponse<Hospital>>(url);
  },

  /**
   * Get hospital by ID
   */
  getHospitalById: async (id: string): Promise<Hospital> => {
    const response = await apiClient.get<{ hospital: Hospital }>(`${HOSPITAL_API_BASE}/${id}`);
    return response.data.hospital;
  },

  /**
   * Get hospital by slug
   */
  getHospitalBySlug: async (slug: string): Promise<Hospital> => {
    const response = await apiClient.get<{ hospital: Hospital }>(`${HOSPITAL_API_BASE}/slug/${slug}`);
    return response.data.hospital;
  },

  /**
   * Get nearby hospitals
   */
  getNearbyHospitals: async (
    longitude: number,
    latitude: number,
    maxDistance: number = 10000,
    limit: number = 20
  ): Promise<Hospital[]> => {
    const params = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      maxDistance: String(maxDistance),
      limit: String(limit)
    });

    const response = await apiClient.get<{ hospitals: Hospital[] }>(`${HOSPITAL_API_BASE}/nearby?${params}`);
    return response.data.hospitals;
  },

  /**
   * Get hospital statistics
   */
  getHospitalStats: async (id: string): Promise<any> => {
    const response = await apiClient.get<{ stats: any }>(`${HOSPITAL_API_BASE}/${id}/stats`);
    return response.data.stats;
  },

  /**
   * Create new hospital (Admin only)
   */
  createHospital: async (hospitalData: any): Promise<any> => {
    return apiClient.post(HOSPITAL_API_BASE, hospitalData);
  },

  /**
   * Update hospital details (Admin only)
   */
  updateHospital: async (id: string, hospitalData: any): Promise<any> => {
    return apiClient.put(`${HOSPITAL_API_BASE}/${id}`, hospitalData);
  }
};
