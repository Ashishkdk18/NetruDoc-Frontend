export type MedicalRecordType = 'consultation' | 'prescription' | 'appointment' | 'medical_history'

export interface ConsultationRecord {
  recordType: 'consultation'
  _id: string
  id?: string
  appointmentId: any
  patientId: any
  doctorId: {
    _id: string
    name: string
    email: string
    specialization?: string
  }
  startTime: string
  endTime?: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  notes?: string
  diagnosis?: string[]
  symptoms?: string[]
  createdAt: string
  updatedAt: string
}

export interface PrescriptionRecord {
  recordType: 'prescription'
  _id: string
  id?: string
  patientId: any
  doctorId: {
    _id: string
    name: string
    email: string
    specialization?: string
  }
  appointmentId?: any
  consultationId?: any
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }>
  diagnoses: Array<{
    condition: string
    icdCode?: string
    notes?: string
  }>
  notes?: string
  followUpDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AppointmentRecord {
  recordType: 'appointment'
  _id: string
  id?: string
  patientId: any
  doctorId: {
    _id: string
    name: string
    email: string
    specialization?: string
  }
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  reason: string
  preConsultationForm?: {
    symptoms?: string[]
    currentMedications?: string[]
    allergies?: string[]
    medicalHistory?: string
    additionalNotes?: string
  }
  createdAt: string
  updatedAt: string
}

export interface MedicalHistoryRecord {
  recordType: 'medical_history'
  condition: string
  diagnosedDate?: string
  notes?: string
}

export type MedicalRecord = ConsultationRecord | PrescriptionRecord | AppointmentRecord | MedicalHistoryRecord

export interface MedicalRecordsResponse {
  patientId: string
  patientName: string
  records: MedicalRecord[]
  summary: {
    totalConsultations: number
    totalPrescriptions: number
    totalAppointments: number
    medicalHistoryItems: number
  }
}
