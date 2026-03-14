import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { userApi } from '../api/userApi'
import { User, UserRole } from '../models/userModels'

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      return
    }
    loadUsers()
  }, [page, roleFilter, statusFilter, currentUser])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await userApi.getUsers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      })

      if (response.status === 'success') {
        setUsers(response.data.items || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      } else {
        setError(response.message || 'Failed to load users')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      const response = await userApi.activateUser(userId)
      if (response.status === 'success') {
        loadUsers()
        setDialogOpen(false)
      } else {
        setError(response.message || 'Failed to activate user')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to activate user')
    }
  }

  const handleDeactivate = async (userId: string) => {
    try {
      const response = await userApi.deactivateUser(userId)
      if (response.status === 'success') {
        loadUsers()
        setDialogOpen(false)
      } else {
        setError(response.message || 'Failed to deactivate user')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate user')
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      const response = await userApi.deleteUser(userId)
      if (response.status === 'success') {
        loadUsers()
        setDialogOpen(false)
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
    }
  }

  const openDialog = (user: User, action: 'activate' | 'deactivate' | 'delete') => {
    setSelectedUser(user)
    setActionType(action)
    setDialogOpen(true)
  }

  const handleDialogConfirm = () => {
    if (!selectedUser) return

    switch (actionType) {
      case 'activate':
        handleActivate(selectedUser.id)
        break
      case 'deactivate':
        handleDeactivate(selectedUser.id)
        break
      case 'delete':
        handleDelete(selectedUser.id)
        break
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
              User<br />
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

          {/* Filters */}
          <div className="bg-soft-blue/30 p-6 rounded-2xl mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-secondary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary">
                  🔍
                </div>
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="px-4 py-3 border border-secondary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white min-w-[150px]"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-3 border border-secondary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="bg-soft-blue/30 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Role</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-sans font-medium uppercase tracking-widest text-secondary">Verified</th>
                        <th className="px-6 py-4 text-right text-sm font-sans font-medium uppercase tracking-widest text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="border-t border-secondary/10 hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4 text-primary font-medium">{user.name}</td>
                            <td className="px-6 py-4 text-secondary">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : user.role === 'doctor'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                user.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {user.isActive ? (
                                <button
                                  onClick={() => openDialog(user, 'deactivate')}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
                                  title="Deactivate"
                                >
                                  🚫
                                </button>
                              ) : (
                                <button
                                  onClick={() => openDialog(user, 'activate')}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                                  title="Activate"
                                >
                                  ✅
                                </button>
                              )}
                              <button
                                onClick={() => openDialog(user, 'delete')}
                                className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
                                title="Delete"
                              >
                                🗑️
                              </button>
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
            </>
          )}

          {/* Confirmation Modal */}
          {dialogOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-2xl max-w-md w-full p-6 space-y-6">
                <div>
                  <h3 className="text-2xl font-display font-medium text-primary">
                    {actionType === 'activate' && 'Activate User'}
                    {actionType === 'deactivate' && 'Deactivate User'}
                    {actionType === 'delete' && 'Delete User'}
                  </h3>
                </div>

                <div className="space-y-4">
                  <p className="text-secondary">
                    Are you sure you want to {actionType} {selectedUser?.name}?
                  </p>

                  {actionType === 'delete' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      ⚠️ This action cannot be undone. The user will be permanently deleted.
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 px-6 py-3 border border-secondary/30 text-primary rounded-xl hover:bg-soft-blue/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDialogConfirm}
                    className={`flex-1 px-6 py-3 text-background rounded-xl font-medium transition-colors ${
                      actionType === 'delete'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-primary hover:bg-secondary'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default UserManagementPage
