/**
 * User Models
 * Type definitions for user feature
 */

import { User, UserRole, Gender, Specialization, Address, EmergencyContact, MedicalHistoryItem, QualificationDocument, DoctorAvailability } from '../../auth/models/authModels'

// Re-export User model from auth
export type { User, UserRole, Gender, Specialization, Address, EmergencyContact, MedicalHistoryItem, QualificationDocument, DoctorAvailability }

// User list response
export interface UserListResponse {
  docs: User[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// User filters
export interface UserFilters {
  role?: UserRole
  specialization?: Specialization
  city?: string
  isActive?: boolean
  isVerified?: boolean
}

// User update data
export interface UserUpdateData {
  name?: string
  email?: string
  phone?: string
  address?: Address
  isActive?: boolean
  isVerified?: boolean
}
