import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../../../store'
import { userApi } from '../api/userApi'
import { User } from '../models/userModels'


const AdminPatientsPage: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const [patients, setPatients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      return
    }
    loadPatients()
  }, [page, searchTerm, currentUser])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userApi.getPatients({
        page,
        limit: 5,
        search: searchTerm || undefined
      }) as any

      if (response.status === 'success') {
        setPatients(response.data.items || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotal(response.data.pagination?.total || 0)
      } else {
        setError(response.message || 'Failed to load patients')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patients')
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
              Patient<br />
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
                placeholder="Search patients by name, email, or phone..."
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
              {/* Patients Table */}
              <div className="bg-soft-blue/30 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">City</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Gender</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Verified</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Joined</th>
                        <th className="px-6 py-4 text-right text-sm font-sans font-medium uppercase tracking-widest text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-secondary">
                            No patients found
                          </td>
                        </tr>
                      ) : (
                        patients.map((patient) => (
                          <tr key={patient.id} className="border-t border-secondary/10 hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4 text-primary font-medium">{patient.name}</td>
                            <td className="px-6 py-4 text-secondary">{patient.email}</td>
                            <td className="px-6 py-4 text-secondary">{patient.phone || 'N/A'}</td>
                            <td className="px-6 py-4 text-secondary">{patient.address?.city || 'N/A'}</td>
                            <td className="px-6 py-4">
                              {patient.gender ? (
                                <span className="inline-block px-3 py-1 text-xs font-medium bg-secondary/20 text-primary rounded-full">
                                  {patient.gender}
                                </span>
                              ) : (
                                <span className="text-secondary">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${patient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {patient.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${patient.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {patient.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-secondary">
                              {patient.createdAt ? (
                                new Date(patient.createdAt).toLocaleDateString()
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                to={`/admin/patients/${patient.id}`}
                                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-sm font-medium rounded-full"
                              >
                                View Profile
                              </Link>
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
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg font-medium transition-colors bg-soft-blue/30 text-primary hover:bg-soft-blue/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      &laquo; Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === pageNum
                            ? 'bg-primary text-background'
                            : 'bg-soft-blue/30 text-primary hover:bg-soft-blue/50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg font-medium transition-colors bg-soft-blue/30 text-primary hover:bg-soft-blue/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next &raquo;
                    </button>
                  </div>
                </div>
              )}

              {/* Results count */}
              <div className="mt-6 text-center">
                <p className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                  Showing {patients.length} of {total} patients
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminPatientsPage

