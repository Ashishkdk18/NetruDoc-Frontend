import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../../../store'
import { userApi } from '../api/userApi'
import { User } from '../models/userModels'
import { hospitalApi } from '../../hospitals/api/hospitalApi'
import { Hospital } from '../../hospitals/models/hospitalModels'


const AdminDoctorsPage: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const [doctors, setDoctors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDoctorData, setEditDoctorData] = useState<any>(null)

  useEffect(() => {
    loadHospitals()
  }, [])

  const loadHospitals = async () => {
    try {
      const response = await hospitalApi.getHospitals({}, { limit: 100 }) as any
      if (response.status === 'success') {
        setHospitals(response.data.items || [])
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err)
    }
  }

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      return
    }
    loadDoctors()
  }, [page, searchTerm, currentUser])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userApi.getDoctors({
        page,
        limit: 10,
        search: searchTerm || undefined
      }) as any

      if (response.status === 'success') {
        setDoctors(response.data.items || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotal(response.data.pagination?.total || 0)
      } else {
        setError(response.message || 'Failed to load doctors')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const viewCredentials = (doctor: User) => {
    setSelectedDoctor(doctor)
    setShowCredentialsModal(true)
  }

  const verifyDoctor = async (doctorId: string) => {
    try {
      const response = await userApi.updateUser(doctorId, { isVerified: true }) as any

      if (response.status === 'success') {
        setShowCredentialsModal(false)
        setSelectedDoctor(null)
        // Refresh the doctors list
        loadDoctors()
      } else {
        setError(response.message || 'Failed to verify doctor')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify doctor')
    }
  }

  if (currentUser?.role !== 'admin') {
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <section className="pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <span className="inline-block text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-4">
              <span className="mr-2 text-accent">+</span>
              Admin Panel
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary leading-[0.9] -ml-1">
              Doctor<br />
              <span className="text-secondary opacity-60">Management</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-700 hover:text-red-900 ml-4"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-soft-blue/30 p-6 rounded-2xl mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search doctors by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 pl-12 border border-secondary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary">
                🔍
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          ) : (
            <>
              {/* Doctors Table */}
              <div className="bg-soft-blue/30 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Specialization</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Hospital</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Experience</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Rating</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Verified</th>
                        <th className="px-6 py-4 text-right text-sm font-sans font-medium uppercase tracking-widest text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-secondary">
                            No doctors found
                          </td>
                        </tr>
                      ) : (
                        doctors.map((doctor) => (
                          <tr key={doctor.id} className="border-t border-secondary/10 hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4 text-primary font-medium">{doctor.name}</td>
                            <td className="px-6 py-4 text-secondary">{doctor.email}</td>
                            <td className="px-6 py-4">
                              {doctor.specialization ? (
                                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {doctor.specialization}
                                </span>
                              ) : (
                                <span className="text-secondary">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-secondary">
                              {typeof doctor.hospital === 'object' ? (doctor.hospital as any).name : doctor.hospital || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-secondary">
                              {doctor.experience ? `${doctor.experience} years` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-secondary">
                              {doctor.rating ? (
                                <span>{doctor.rating.toFixed(1)} ⭐</span>
                              ) : (
                                <span className="text-secondary">No rating</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {doctor.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                doctor.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {doctor.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col space-y-2">
                                {!doctor.isVerified && (
                                  <button
                                    onClick={() => viewCredentials(doctor)}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors duration-300 text-sm font-medium rounded-full"
                                  >
                                    Review Credentials
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditDoctorData({
                                      id: doctor.id,
                                      name: doctor.name,
                                      hospital: typeof doctor.hospital === 'object' ? (doctor.hospital as any)._id || (doctor.hospital as any).id : doctor.hospital
                                    })
                                    setShowEditModal(true)
                                  }}
                                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 text-sm font-medium rounded-full"
                                >
                                  Move Hospital
                                </button>
                                <Link
                                  to={`/admin/doctors/${doctor.id}`}
                                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
                                >
                                  View Profile
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-background'
                            : 'bg-soft-blue/30 text-primary hover:bg-soft-blue/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results count */}
              <div className="mt-6 text-center">
                <p className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                  Showing {doctors.length} of {total} doctors
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Credentials Review Modal */}
      {showCredentialsModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Review Doctor Credentials - {selectedDoctor.name}
              </h2>
              <button
                onClick={() => {
                  setShowCredentialsModal(false)
                  setSelectedDoctor(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Doctor Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedDoctor.name}</p>
                  <p><strong>Email:</strong> {selectedDoctor.email}</p>
                  <p><strong>Phone:</strong> {selectedDoctor.phone || 'Not provided'}</p>
                  <p><strong>Specialization:</strong> {selectedDoctor.specialization || 'Not provided'}</p>
                  <p><strong>License Number:</strong> {selectedDoctor.licenseNumber || 'Not provided'}</p>
                  <p><strong>Experience:</strong> {selectedDoctor.experience ? `${selectedDoctor.experience} years` : 'Not provided'}</p>
                  <p><strong>Hospital:</strong> {typeof selectedDoctor.hospital === 'object' ? (selectedDoctor.hospital as any)?.name : selectedDoctor.hospital || 'Not provided'}</p>
                </div>
              </div>

              {/* Qualification Documents */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Qualification Documents</h3>
                {selectedDoctor.qualificationDocuments && selectedDoctor.qualificationDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDoctor.qualificationDocuments.map((doc: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{doc.type}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => window.open(doc.url, '_blank')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No qualification documents uploaded</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCredentialsModal(false)
                  setSelectedDoctor(null)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyDoctor(selectedDoctor.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Verify Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal (Move Hospital) */}
      {showEditModal && editDoctorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Move Doctor to Hospital</h2>
            <p className="mb-4 text-secondary">Change hospital for <strong>{editDoctorData.name}</strong></p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Hospital</label>
              <select
                value={editDoctorData.hospital || ''}
                onChange={(e) => setEditDoctorData({ ...editDoctorData, hospital: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">None / Private Practice</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditDoctorData(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await userApi.updateUser(editDoctorData.id, { hospital: editDoctorData.hospital || null }) as any
                    if (response.status === 'success') {
                      setShowEditModal(false)
                      setEditDoctorData(null)
                      loadDoctors()
                    } else {
                      alert(response.message || 'Failed to update doctor hospital')
                    }
                  } catch (err: any) {
                    alert(err.message || 'Failed to update doctor hospital')
                  }
                }}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDoctorsPage

