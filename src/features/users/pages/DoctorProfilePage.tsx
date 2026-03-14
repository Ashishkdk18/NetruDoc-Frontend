import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { userApi } from '../api/userApi'
import { User, Specialization } from '../../auth/models/authModels'
import { ApiResponse } from '../../../types/api'

const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const [doctor, setDoctor] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = currentUser?.role === 'admin'

  const specializationLabels: Record<Specialization, string> = {
    'general-medicine': 'General Medicine',
    'cardiology': 'Cardiology',
    'dermatology': 'Dermatology',
    'neurology': 'Neurology',
    'orthopedics': 'Orthopedics',
    'pediatrics': 'Pediatrics',
    'psychiatry': 'Psychiatry',
    'radiology': 'Radiology',
    'surgery': 'Surgery',
    'urology': 'Urology',
    'gynecology': 'Gynecology',
    'ophthalmology': 'Ophthalmology'
  }

  useEffect(() => {
    if (id) {
      loadDoctor()
    }
  }, [id])

  const loadDoctor = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userApi.getUserById(id!) as ApiResponse<{ user: User }>

      if (response.status === 'success') {
        setDoctor(response.data.user)
      } else {
        setError(response.message || 'Failed to load doctor profile')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor profile')
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = () => {
    navigate(`/appointments/book/${id}`)
  }

  const formatAvailability = (availability: any) => {
    if (!availability) return null

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    return days.map((day, index) => {
      const dayData = availability[day]
      if (!dayData || !dayData.available) return null

      return {
        day: dayNames[index],
        start: dayData.start,
        end: dayData.end
      }
    }).filter(Boolean)
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

  if (error || !doctor) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-md text-center">
            <div className="text-red-500 text-lg mb-4">Profile Not Found</div>
            <p className="text-secondary mb-8">{error || 'The profile you are looking for does not exist.'}</p>
            <Link
              to={isAdmin ? '/admin/doctors' : '/doctors'}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
            >
              Back to {isAdmin ? 'Admin Doctors' : 'Doctors'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const availability = formatAvailability(doctor.availability)

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <section className="pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <span className="inline-block text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                <span className="mr-2 text-accent">+</span>
                {isAdmin ? 'Admin Panel' : 'Doctor Profile'}
              </span>
              <Link
                to={isAdmin ? '/admin/doctors' : '/doctors'}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
              >
                ← Back to {isAdmin ? 'Doctors' : 'Find Doctors'}
              </Link>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary leading-[0.9] -ml-1">
              Dr. {doctor.name}
            </h1>
            {isAdmin && (
              <p className="text-lg text-secondary mt-4">
                Admin view of doctor profile and details
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Doctor Info */}
            <div className="lg:col-span-2 space-y-8">

                {doctor.specialization && (
                  <p className="text-xl text-accent font-medium mb-4">
                    {specializationLabels[doctor.specialization]}
                  </p>
                )}

                {/* Rating */}
                {doctor.rating && (
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="flex text-2xl">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.floor(doctor.rating!)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-secondary">
                      {doctor.rating.toFixed(1)} ({doctor.totalReviews || 0} reviews)
                    </span>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {doctor.experience && (
                    <div className="text-center">
                      <div className="text-2xl font-display font-medium text-primary">{doctor.experience}</div>
                      <div className="text-sm text-secondary">Years Experience</div>
                    </div>
                  )}
                  {doctor.consultationFee && (
                    <div className="text-center">
                      <div className="text-2xl font-display font-medium text-primary">Rs. {doctor.consultationFee}</div>
                      <div className="text-sm text-secondary">Consultation Fee</div>
                    </div>
                  )}
                  {doctor.totalReviews && (
                    <div className="text-center">
                      <div className="text-2xl font-display font-medium text-primary">{doctor.totalReviews}</div>
                      <div className="text-sm text-secondary">Reviews</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-display font-medium text-primary">
                      {availability?.length || 0}
                    </div>
                    <div className="text-sm text-secondary">Days Available</div>
                  </div>
                </div>

                {/* CTA Button */}
                {!isAdmin && (
                  <button
                    onClick={handleBookAppointment}
                    className="px-8 py-4 bg-accent text-white hover:bg-accent/90 transition-colors rounded-lg font-medium text-lg"
                  >
                    Book Appointment
                  </button>
                )}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <div className="w-32 h-32 bg-soft-blue rounded-full flex items-center justify-center text-primary font-display font-medium text-4xl mx-auto mb-4">
                  {doctor.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-secondary">📍</span>
                    <span className="text-sm text-secondary">
                      {doctor.address?.city || 'Location not specified'}
                    </span>
                  </div>
                  {doctor.hospital && (
                    <div className="text-sm text-primary font-medium">
                      {typeof doctor.hospital === 'object' ? (doctor.hospital as any)?.name : doctor.hospital}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-display font-medium text-primary mb-6">Contact Information</h2>
            <div className="space-y-4">
              {doctor.phone && (
                <div className="flex items-center space-x-3">
                  <span className="text-accent">📞</span>
                  <span className="text-secondary">{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center space-x-3">
                  <span className="text-accent">✉️</span>
                  <span className="text-secondary">{doctor.email}</span>
                </div>
              )}
              {doctor.address && (
                <div className="flex items-start space-x-3">
                  <span className="text-accent mt-0.5">📍</span>
                  <div className="text-secondary text-sm">
                    {doctor.address.street && <div>{doctor.address.street}</div>}
                    {doctor.address.city && <div>{doctor.address.city}</div>}
                    {doctor.address.state && <div>{doctor.address.state} {doctor.address.zipCode}</div>}
                    {doctor.address.country && <div>{doctor.address.country}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="mt-8 space-y-3">
              {doctor.isVerified && (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  ✓ Verified Doctor
                </span>
              )}
              {doctor.isActive && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  ✓ Currently Active
                </span>
              )}
            </div>
          </div>

          {/* Availability & Qualifications */}
          <div className="lg:col-span-2 space-y-8">
            {/* Availability */}
            {availability && availability.length > 0 && (
              <div>
                <h3 className="text-xl font-display font-medium text-primary mb-4 flex items-center">
                  <span className="text-accent mr-2">🕒</span>
                  Availability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availability.map((slot: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-primary">{slot.day}</div>
                      <div className="text-sm text-secondary">{slot.start} - {slot.end}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {doctor.qualifications && doctor.qualifications.length > 0 && (
              <div>
                <h3 className="text-xl font-display font-medium text-primary mb-4">Qualifications</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.qualifications.map((qual, index) => (
                    <span key={index} className="px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full">
                      {qual}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {doctor.licenseNumber && (
              <div>
                <h3 className="text-xl font-display font-medium text-primary mb-4">License & Registration</h3>
                <p className="text-secondary">
                  License Number: <span className="font-medium text-primary">{doctor.licenseNumber}</span>
                </p>
              </div>
            )}

            {/* Medical History - Only show if doctor has medical conditions to disclose */}
            {doctor.medicalHistory && doctor.medicalHistory.length > 0 && (
              <div>
                <h3 className="text-xl font-display font-medium text-primary mb-4">Medical Disclosures</h3>
                <div className="space-y-3">
                  {doctor.medicalHistory.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="font-medium text-primary">{item.condition}</div>
                      <div className="text-sm text-secondary mt-1">{item.notes}</div>
                      {item.diagnosedDate && (
                        <div className="text-xs text-secondary mt-2">
                          Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-medium mb-6">
            Ready to consult with Dr. {doctor.name.split(' ')[0]}?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Book your appointment now and experience personalized healthcare through secure video consultations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBookAppointment}
              className="px-8 py-4 bg-accent text-white hover:bg-accent/90 transition-colors rounded-lg font-medium text-lg"
            >
              Book Appointment
            </button>
            <button
              onClick={() => navigate('/doctors')}
              className="px-8 py-4 border border-white/20 text-white hover:bg-white/10 transition-colors rounded-lg font-medium text-lg"
            >
              View Other Doctors
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DoctorProfilePage
