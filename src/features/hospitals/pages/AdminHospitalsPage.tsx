import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../../../store'
import { hospitalApi } from '../api/hospitalApi'
import { Hospital } from '../models/hospitalModels'


const AdminHospitalsPage: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editHospitalData, setEditHospitalData] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newHospitalData, setNewHospitalData] = useState({
    name: '',
    type: 'hospital',
    city: '',
    street: '',
    state: '',
    phone: ''
  })

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      return
    }
    loadHospitals()
  }, [page, searchTerm, currentUser])

  const loadHospitals = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: any = {}
      if (searchTerm) filters.search = searchTerm

      const response = await hospitalApi.getHospitals(filters, { page, limit: 10 }) as any

      if (response.status === 'success') {
        setHospitals(response.data.items || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotal(response.data.pagination?.total || 0)
      } else {
        setError(response.message || 'Failed to load hospitals')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hospitals')
    } finally {
      setLoading(false)
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
              Hospital<br />
              <span className="text-secondary opacity-60">Management</span>
            </h1>
          </div>
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 bg-accent text-white rounded-full font-display font-medium hover:bg-accent/90 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add New Hospital</span>
            </button>
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
                placeholder="Search hospitals..."
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
              {/* Hospitals Table */}
              <div className="bg-soft-blue/30 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">City</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Emergency</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Verified</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Rating</th>
                        <th className="px-6 py-4 text-right text-sm font-sans font-medium uppercase tracking-widest text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hospitals.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-secondary">
                            No hospitals found
                          </td>
                        </tr>
                      ) : (
                        hospitals.map((hospital) => (
                          <tr key={hospital.id} className="border-t border-secondary/10 hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4 text-primary font-medium">{hospital.name}</td>
                            <td className="px-6 py-4 text-secondary">{hospital.address.city}</td>
                            <td className="px-6 py-4">
                              <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {hospital.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                hospital.emergencyServices ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {hospital.emergencyServices ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                hospital.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {hospital.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                hospital.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {hospital.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-secondary">
                              {hospital.averageRating ? (
                                <span>{hospital.averageRating.toFixed(1)} ⭐ ({hospital.totalReviews || 0})</span>
                              ) : (
                                <span className="text-secondary">No ratings</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => {
                                    setEditHospitalData({
                                      id: hospital.id,
                                      name: hospital.name,
                                      type: hospital.type,
                                      city: hospital.address.city,
                                      isActive: hospital.isActive
                                    })
                                    setShowEditModal(true)
                                  }}
                                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 text-sm font-medium rounded-full"
                                >
                                  Edit
                                </button>
                                <Link
                                  to={`/admin/hospitals/${hospital.id}`}
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
                  Showing {hospitals.length} of {total} hospitals
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Edit Hospital Modal */}
      {showEditModal && editHospitalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit Hospital</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={editHospitalData.name}
                  onChange={(e) => setEditHospitalData({ ...editHospitalData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editHospitalData.type}
                  onChange={(e) => setEditHospitalData({ ...editHospitalData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="government">Government</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editHospitalData.city}
                  onChange={(e) => setEditHospitalData({ ...editHospitalData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editHospitalData.isActive}
                  onChange={(e) => setEditHospitalData({ ...editHospitalData, isActive: e.target.checked })}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditHospitalData(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await hospitalApi.updateHospital(editHospitalData.id, {
                      name: editHospitalData.name,
                      type: editHospitalData.type,
                      'address.city': editHospitalData.city,
                      isActive: editHospitalData.isActive
                    }) as any
                    if (response.status === 'success') {
                      setShowEditModal(false)
                      setEditHospitalData(null)
                      loadHospitals()
                    } else {
                      alert(response.message || 'Failed to update hospital')
                    }
                  } catch (err: any) {
                    alert(err.message || 'Failed to update hospital')
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

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add New Hospital</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  value={newHospitalData.name}
                  onChange={(e) => setNewHospitalData({ ...newHospitalData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newHospitalData.type}
                  onChange={(e) => setNewHospitalData({ ...newHospitalData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="government">Government</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={newHospitalData.city}
                  onChange={(e) => setNewHospitalData({ ...newHospitalData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street *</label>
                <input
                  type="text"
                  required
                  value={newHospitalData.street}
                  onChange={(e) => setNewHospitalData({ ...newHospitalData, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={newHospitalData.state}
                  onChange={(e) => setNewHospitalData({ ...newHospitalData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={newHospitalData.phone}
                  onChange={(e) => setNewHospitalData({ ...newHospitalData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newHospitalData.name || !newHospitalData.city || !newHospitalData.street || !newHospitalData.state || !newHospitalData.phone) {
                    alert('Please fill in all required fields')
                    return
                  }
                  try {
                    const response = await hospitalApi.createHospital({
                      name: newHospitalData.name,
                      type: newHospitalData.type,
                      address: {
                        street: newHospitalData.street,
                        city: newHospitalData.city,
                        state: newHospitalData.state,
                        coordinates: { type: 'Point', coordinates: [85.3, 27.7] } // Default for Kathmandu
                      },
                      contact: {
                        phone: newHospitalData.phone
                      }
                    }) as any
                    if (response.status === 'success') {
                      setShowAddModal(false)
                      setNewHospitalData({
                        name: '',
                        type: 'hospital',
                        city: '',
                        street: '',
                        state: '',
                        phone: ''
                      })
                      loadHospitals()
                    } else {
                      alert(response.message || 'Failed to create hospital')
                    }
                  } catch (err: any) {
                    alert(err.message || 'Failed to create hospital')
                  }
                }}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90"
              >
                Create Hospital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminHospitalsPage

