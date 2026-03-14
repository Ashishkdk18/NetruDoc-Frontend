export interface Hospital {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
    coordinates?: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
    emergencyContact?: string;
  };
  type: 'public' | 'private' | 'government' | 'clinic' | 'hospital';
  specializations: string[];
  facilities?: Array<{
    name: string;
    available: boolean;
  }>;
  operatingHours?: {
    monday?: { open: string; close: string; closed: boolean };
    tuesday?: { open: string; close: string; closed: boolean };
    wednesday?: { open: string; close: string; closed: boolean };
    thursday?: { open: string; close: string; closed: boolean };
    friday?: { open: string; close: string; closed: boolean };
    saturday?: { open: string; close: string; closed: boolean };
    sunday?: { open: string; close: string; closed: boolean };
  };
  emergencyServices: boolean;
  ambulanceService?: boolean;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  reviews?: Array<{
    userId: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalFilters {
  city?: string;
  specialization?: string;
  type?: string;
  emergencyServices?: boolean;
  search?: string;
}

export interface HospitalPagination {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface HospitalResponse {
  hospitals: Hospital[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
