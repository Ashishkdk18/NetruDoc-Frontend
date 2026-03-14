import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { hospitalApi } from '../api/hospitalApi'
import { userApi } from '../../users/api/userApi'
import { Hospital } from '../models/hospitalModels'
import { User } from '../../users/models/userModels'

const AdminHospitalProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [doctors, setDoctors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (id && isAdmin) {
      loadHospitalProfile()
    }
  }, [id, isAdmin])

  const loadHospitalProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load hospital details
      const hospital = await hospitalApi.getHospitalById(id!)
      setHospital(hospital)

      // Load doctors for this hospital
      // Note: This assumes we have a way to get doctors by hospital
      // For now, we'll get all doctors and filter by hospital name
      const doctorsResponse = await userApi.getDoctors({ page: 1, limit: 100 })
      if (doctorsResponse.status === 'success') {
        const hospitalDoctors = doctorsResponse.data.items.filter(
          (doctor: User) => doctor.hospital && doctor.hospital === hospital.name
        )
        setDoctors(hospitalDoctors)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hospital profile')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-md text-center">
            <div className="text-red-500 text-lg mb-4">Access Denied</div>
            <p className="text-secondary">Admin privileges required to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    )
  }

  if (error || !hospital) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-md text-center">
            <div className="text-red-500 text-lg mb-4">Hospital Not Found</div>
            <p className="text-secondary mb-8">{error || 'The hospital profile you are looking for does not exist.'}</p>
            <Link
              to="/admin/hospitals"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
            >
              Back to Hospitals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <section className="pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <span className="inline-block text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                <span className="mr-2 text-accent">+</span>
                Admin Panel
              </span>
              <Link
                to="/admin/hospitals"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
              >
                ← Back to Hospitals
              </Link>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary leading-[0.9] -ml-1">
              {hospital.name}
            </h1>
            <p className="text-lg text-secondary mt-4">
              Hospital profile and associated doctors
            </p>
          </div>
        </div>
      </section>

      {/* Hospital Details */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hospital Information */}
          <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
            <h2 className="text-2xl font-display font-medium text-primary mb-8">Hospital Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Type</div>
                <div className="text-lg text-primary">{hospital.type}</div>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">City</div>
                <div className="text-lg text-primary">{hospital.address.city}</div>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Emergency Services</div>
                <div className="text-lg text-primary">{hospital.emergencyServices ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Status</div>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  hospital.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Verified</div>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  hospital.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {hospital.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Rating</div>
                <div className="text-lg text-primary">
                  {hospital.averageRating ? `${hospital.averageRating.toFixed(1)} ⭐` : 'No ratings'}
                </div>
              </div>
            </div>

            {hospital.description && (
              <div className="mt-8">
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Description</div>
                <div className="text-secondary leading-relaxed">{hospital.description}</div>
              </div>
            )}
          </div>

          {/* Associated Doctors */}
          <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-medium text-primary">Associated Doctors ({doctors.length})</h2>
              <Link
                to="/admin/doctors"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
              >
                View All Doctors
              </Link>
            </div>

            {doctors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary">No doctors are currently associated with this hospital.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="bg-white/50 p-6 rounded-xl">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-display font-medium text-primary">Dr. {doctor.name}</h3>
                        <p className="text-sm text-secondary">{doctor.email}</p>
                      </div>

                      {doctor.specialization && (
                        <div>
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {doctor.specialization}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>

                        <Link
                          to={`/admin/doctors/${doctor.id}`}
                          className="text-sm text-accent hover:text-primary transition-colors font-medium"
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminHospitalProfilePage
