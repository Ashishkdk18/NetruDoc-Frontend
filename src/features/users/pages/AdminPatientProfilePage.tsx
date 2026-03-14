import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { userApi } from '../api/userApi'
import { User } from '../models/userModels'
import { getPatientAppointmentsByAdmin, clearError } from '../../appointments/appointmentSlice'
import { getMedicalRecords } from '../../medical-records/medicalRecordsSlice'

const AdminPatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const { patientAppointments, loadingPatientAppointments } = useSelector((state: RootState) => state.appointments)
  const { records: medicalRecords, loading: loadingMedicalRecords } = useSelector((state: RootState) => state.medicalRecords)
  const [patient, setPatient] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (id && isAdmin) {
      loadPatientProfile()
      loadPatientAppointments()
      dispatch(getMedicalRecords(id))
    }
    return () => {
      dispatch(clearError())
    }
  }, [id, isAdmin, statusFilter])

  const loadPatientProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userApi.getUserById(id!)
      if (response.status === 'success') {
        setPatient(response.data.user)
      } else {
        setError(response.message || 'Failed to load patient profile')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patient profile')
    } finally {
      setLoading(false)
    }
  }

  const loadPatientAppointments = () => {
    if (!id) return
    const params: any = {
      page: 1,
      limit: 50, // Show more appointments
      sort: '-date'
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter
    }
    dispatch(getPatientAppointmentsByAdmin({ patientId: id, params }))
  }

  const appointmentsArray = (patientAppointments as any)?.items || []
  
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
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

  if (error || !patient) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-md text-center">
            <div className="text-red-500 text-lg mb-4">Patient Not Found</div>
            <p className="text-secondary mb-8">{error || 'The patient profile you are looking for does not exist.'}</p>
            <Link
              to="/admin/patients"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
            >
              Back to Patients
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
                to="/admin/patients"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
              >
                ← Back to Patients
              </Link>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary leading-[0.9] -ml-1">
              {patient.name}
            </h1>
            <p className="text-lg text-secondary mt-4">
              Patient profile and medical information
            </p>
          </div>
        </div>
      </section>

      {/* Patient Details */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Basic Information */}
          <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
            <h2 className="text-2xl font-display font-medium text-primary mb-8">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Email</div>
                <div className="text-lg text-primary">{patient.email}</div>
              </div>
              {patient.phone && (
                <div>
                  <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Phone</div>
                  <div className="text-lg text-primary">{patient.phone}</div>
                </div>
              )}
              {patient.dateOfBirth && (
                <div>
                  <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Date of Birth</div>
                  <div className="text-lg text-primary">{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
                </div>
              )}
              {patient.gender && (
                <div>
                  <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Gender</div>
                  <div className="text-lg text-primary">{patient.gender}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Status</div>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  patient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {patient.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Verified</div>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  patient.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {patient.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>

            {patient.address && (
              <div className="mt-8">
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Address</div>
                <div className="text-lg text-primary">
                  {[
                    patient.address.street,
                    patient.address.city,
                    patient.address.state,
                    patient.address.zipCode,
                    patient.address.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
              <h2 className="text-2xl font-display font-medium text-primary mb-8">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Name</div>
                  <div className="text-lg text-primary">{patient.emergencyContact.name}</div>
                </div>
                <div>
                  <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Phone</div>
                  <div className="text-lg text-primary">{patient.emergencyContact.phone}</div>
                </div>
                <div>
                  <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Relationship</div>
                  <div className="text-lg text-primary">{patient.emergencyContact.relationship}</div>
                </div>
              </div>
            </div>
          )}

          {/* Medical History */}
          {patient.medicalHistory && patient.medicalHistory.length > 0 && (
            <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
              <h2 className="text-2xl font-display font-medium text-primary mb-8">Medical History</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {patient.medicalHistory.map((item, index) => (
                  <div key={index} className="bg-white/50 p-6 rounded-xl">
                    <div className="space-y-3">
                      <h3 className="text-lg font-display font-medium text-primary">{item.condition}</h3>
                      {item.diagnosedDate && (
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                          Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-secondary leading-relaxed">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
            <h2 className="text-2xl font-display font-medium text-primary mb-8">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Joined Date</div>
                <div className="text-lg text-primary">
                  {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Last Updated</div>
                <div className="text-lg text-primary">
                  {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Section */}
          <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-medium text-primary">Appointments</h2>
              <div className="flex items-center gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-sans text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={loadPatientAppointments}
                  className="px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
                  disabled={loadingPatientAppointments}
                >
                  {loadingPatientAppointments ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {loadingPatientAppointments ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : appointmentsArray.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-secondary text-lg mb-2">No appointments found</div>
                <p className="text-secondary text-sm">
                  {statusFilter !== 'all' ? 'Try changing the status filter' : 'This patient has no appointments yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-sans font-medium uppercase tracking-widest text-secondary">Date & Time</th>
                      <th className="text-left py-4 px-4 text-sm font-sans font-medium uppercase tracking-widest text-secondary">Doctor</th>
                      <th className="text-left py-4 px-4 text-sm font-sans font-medium uppercase tracking-widest text-secondary">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-sans font-medium uppercase tracking-widest text-secondary">Reason</th>
                      <th className="text-left py-4 px-4 text-sm font-sans font-medium uppercase tracking-widest text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentsArray.map((appointment: any) => {
                      const doctor = typeof appointment.doctorId === 'object' ? appointment.doctorId : null
                      const appointmentId = appointment.id || appointment._id
                      return (
                        <tr key={appointmentId} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="text-primary font-medium">
                              {appointment.date ? new Date(appointment.date).toLocaleDateString() : '—'}
                            </div>
                            <div className="text-secondary text-sm">
                              {appointment.time || '—'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-primary">
                              {doctor?.name ? `Dr. ${doctor.name}` : '—'}
                            </div>
                            {doctor?.specialization && (
                              <div className="text-secondary text-sm">
                                {String(doctor.specialization).replace('-', ' ')}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              statusColors[appointment.status] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {statusLabels[appointment.status] || appointment.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-primary text-sm max-w-xs truncate">
                              {appointment.reason || '—'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              to={`/appointments/${appointmentId}`}
                              className="inline-flex items-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Medical Records Section */}
          <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-medium text-primary">Medical Records</h2>
              <Link
                to={`/medical-records/${id}`}
                className="inline-flex items-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
              >
                View Full Records
              </Link>
            </div>

            {loadingMedicalRecords ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : !medicalRecords || medicalRecords.records.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-secondary text-lg mb-2">No medical records found</div>
                <p className="text-secondary text-sm">
                  This patient has no medical records yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-display font-medium text-primary">
                      {medicalRecords.summary.totalConsultations}
                    </div>
                    <div className="text-sm text-secondary mt-1">Consultations</div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-display font-medium text-primary">
                      {medicalRecords.summary.totalPrescriptions}
                    </div>
                    <div className="text-sm text-secondary mt-1">Prescriptions</div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-display font-medium text-primary">
                      {medicalRecords.summary.totalAppointments}
                    </div>
                    <div className="text-sm text-secondary mt-1">Appointments</div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl text-center">
                    <div className="text-2xl font-display font-medium text-primary">
                      {medicalRecords.summary.medicalHistoryItems}
                    </div>
                    <div className="text-sm text-secondary mt-1">History Items</div>
                  </div>
                </div>
                <div className="text-center">
                  <Link
                    to={`/medical-records/${id}`}
                    className="inline-flex items-center px-6 py-3 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
                  >
                    View Complete Medical Records Timeline
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminPatientProfilePage
