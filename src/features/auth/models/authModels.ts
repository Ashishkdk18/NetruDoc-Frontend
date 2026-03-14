/**
 * Authentication Models
 * Type definitions for authentication feature
 */

export type UserRole = 'patient' | 'doctor' | 'admin'

export type Gender = 'male' | 'female' | 'other'

export type Specialization = 
  | 'general-medicine'
  | 'cardiology'
  | 'dermatology'
  | 'neurology'
  | 'orthopedics'
  | 'pediatrics'
  | 'psychiatry'
  | 'radiology'
  | 'surgery'
  | 'urology'
  | 'gynecology'
  | 'ophthalmology'

export interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface MedicalHistoryItem {
  condition: string
  diagnosedDate?: string
  notes?: string
}

export interface QualificationDocument {
  name: string
  url: string
  type: 'license' | 'degree' | 'certificate' | 'other'
  uploadedAt?: string
}

export interface Availability {
  start: string
  end: string
  available: boolean
}

export interface DoctorAvailability {
  monday?: Availability
  tuesday?: Availability
  wednesday?: Availability
  thursday?: Availability
  friday?: Availability
  saturday?: Availability
  sunday?: Availability
}

// Base User Model
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  address?: Address
  profilePicture?: string
  dateOfBirth?: string
  gender?: Gender
  
  // Patient-specific fields
  emergencyContact?: EmergencyContact
  medicalHistory?: MedicalHistoryItem[]
  
  // Doctor-specific fields
  specialization?: Specialization
  licenseNumber?: string
  experience?: number
  qualifications?: string[]
  qualificationDocuments?: QualificationDocument[]
  hospital?: string
  consultationFee?: number
  availability?: DoctorAvailability
  rating?: number
  totalReviews?: number
  
  // Status fields
  isVerified?: boolean
  isActive?: boolean
  emailVerified?: boolean
  
  createdAt?: string
  updatedAt?: string
}

// Registration Models
export interface PatientRegistrationData {
  name: string
  email: string
  password: string
  role: 'patient'
  phone?: string
  address?: Address
  dateOfBirth?: string
  gender?: Gender
  emergencyContact?: EmergencyContact
  medicalHistory?: MedicalHistoryItem[]
}

export interface DoctorRegistrationData {
  name: string
  email: string
  password: string
  role: 'doctor'
  phone?: string
  address?: Address
  licenseNumber: string
  specialization: Specialization
  qualifications?: string[]
  qualificationDocuments?: QualificationDocument[]
  experience?: number
  hospital?: string
  consultationFee?: number
  availability?: DoctorAvailability
}

export type RegistrationData = PatientRegistrationData | DoctorRegistrationData

// Login Models
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// OTP Response for registration/login when OTP is required
export interface OTPResponse {
  otpRequired: boolean
  message: string
  email: string
  userId?: string
}

// Profile Update Models
export interface PatientProfileUpdate {
  name?: string
  email?: string
  phone?: string
  address?: Address
  dateOfBirth?: string
  gender?: Gender
  emergencyContact?: EmergencyContact
  medicalHistory?: MedicalHistoryItem[]
}

export interface DoctorProfileUpdate {
  name?: string
  email?: string
  phone?: string
  address?: Address
  specialization?: Specialization
  licenseNumber?: string
  qualifications?: string[]
  qualificationDocuments?: QualificationDocument[]
  experience?: number
  hospital?: string
  consultationFee?: number
  availability?: DoctorAvailability
}

export type ProfileUpdate = PatientProfileUpdate | DoctorProfileUpdate

// Password Models
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

// Auth State
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  otpRequired?: boolean
  otpEmail?: string | null
}
