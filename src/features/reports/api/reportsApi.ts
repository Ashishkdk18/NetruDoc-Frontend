/**
 * Medical reports API – list, upload, download
 */
import apiClient from '../../../services/apiClient';

const BASE = '/reports';

const getBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface MedicalReport {
  _id: string
  appointmentId: string
  patientId: string
  doctorId: string
  uploadedBy?: { _id: string; name: string; role: string }
  fileName: string
  originalName: string
  mimeType: string
  size: number
  description?: string
  createdAt: string
}

export const reportsApi = {
  getByAppointmentId(appointmentId: string) {
    return apiClient.get<{ items: MedicalReport[]; pagination?: unknown }>(`${BASE}/${appointmentId}`);
  },

  async upload(appointmentId: string, file: File, description?: string): Promise<{ status: string; data: { report: MedicalReport } }> {
    const form = new FormData();
    form.append('file', file);
    if (description) form.append('description', description);

    const token = localStorage.getItem('token');
    const res = await fetch(`${getBaseUrl()}${BASE}/${appointmentId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error(data?.message || 'Upload failed'), { response: { data } });
    }
    return data;
  },

  async download(reportId: string, originalName: string): Promise<void> {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const res = await fetch(`${base}${BASE}/file/${reportId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName || 'report';
    a.click();
    URL.revokeObjectURL(url);
  }
};
