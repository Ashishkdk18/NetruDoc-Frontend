import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { loadUser } from '../../auth/authSlice'
import { User } from '../../auth/models/authModels'

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, loading } = useSelector((state: RootState) => state.auth)
  const [profileUser, setProfileUser] = useState<User | null>(null)

  useEffect(() => {
    if (!user) {
      dispatch(loadUser())
    } else {
      setProfileUser(user)
    }
  }, [user, dispatch])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-md text-center">
            <div className="text-red-500 text-lg mb-4">Failed to load profile</div>
            <p className="text-secondary">Please try refreshing the page or contact support if the problem persists.</p>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div>
              <span className="inline-block text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-4">
                <span className="mr-2 text-accent">+</span>
                Profile
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-medium text-primary leading-[0.9] -ml-1">
                My Profile
              </h1>
            </div>
            <Link
              to="/profile/edit"
              className="inline-flex items-center space-x-3 px-6 py-3 bg-primary text-background hover:bg-secondary transition-colors duration-300 text-lg font-medium rounded-full"
            >
              <span>Edit Profile</span>
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Profile Picture and Basic Info */}
            <div className="lg:col-span-4">
              <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl text-center">
                <div className="space-y-6">
                  <div className="w-32 h-32 bg-accent rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold">
                    {profileUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-medium text-primary mb-4">
                      {profileUser.name}
                    </h3>
                    <div className="space-y-3">
                      <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${
                        profileUser.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : profileUser.role === 'doctor'
                          ? 'bg-primary text-background'
                          : 'bg-secondary/20 text-primary'
                      }`}>
                        {profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)}
                      </span>
                      {profileUser.specialization && (
                        <div className="inline-block px-4 py-2 text-sm font-medium border border-secondary text-primary rounded-full ml-2">
                          {profileUser.specialization.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      )}
                      {profileUser.isVerified && (
                        <span className="inline-block px-4 py-2 text-sm font-medium bg-green-100 text-green-800 rounded-full ml-2">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="lg:col-span-8">
              <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
                <div className="space-y-8">
                  <h3 className="text-2xl font-display font-medium text-primary">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">Email</div>
                      <div className="text-lg text-primary">{profileUser.email}</div>
                    </div>
                    {profileUser.phone && (
                      <div className="space-y-2">
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">Phone</div>
                        <div className="text-lg text-primary">{profileUser.phone}</div>
                      </div>
                    )}
                    {profileUser.address && (
                      <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">Address</div>
                        <div className="text-lg text-primary">
                          {[
                            profileUser.address.street,
                            profileUser.address.city,
                            profileUser.address.state,
                            profileUser.address.zipCode,
                            profileUser.address.country,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          {/* Patient-specific Information */}
          {profileUser.role === 'patient' && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
              {profileUser.dateOfBirth && (
                <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-display font-medium text-primary">Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Date of Birth</div>
                        <div className="text-lg text-primary">{new Date(profileUser.dateOfBirth).toLocaleDateString()}</div>
                      </div>
                      {profileUser.gender && (
                        <div>
                          <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Gender</div>
                          <div className="text-lg text-primary">{profileUser.gender.charAt(0).toUpperCase() + profileUser.gender.slice(1)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {profileUser.emergencyContact && (
                <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-display font-medium text-primary">Emergency Contact</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Name</div>
                        <div className="text-lg text-primary">{profileUser.emergencyContact.name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Phone</div>
                        <div className="text-lg text-primary">{profileUser.emergencyContact.phone}</div>
                      </div>
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Relationship</div>
                        <div className="text-lg text-primary">{profileUser.emergencyContact.relationship}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileUser.medicalHistory && profileUser.medicalHistory.length > 0 && (
                <div className="lg:col-span-2 bg-soft-blue/30 p-8 md:p-12 rounded-2xl mt-12">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-display font-medium text-primary">Medical History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profileUser.medicalHistory.map((item, index) => (
                        <div key={index} className="space-y-3 p-6 bg-white/50 rounded-xl">
                          <h4 className="text-xl font-display font-medium text-primary">{item.condition}</h4>
                          {item.diagnosedDate && (
                            <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                              Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-secondary leading-relaxed">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Doctor-specific Information */}
          {profileUser.role === 'doctor' && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
              <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
                <div className="space-y-6">
                  <h3 className="text-2xl font-display font-medium text-primary">Professional Information</h3>
                  <div className="space-y-4">
                    {profileUser.licenseNumber && (
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">License Number</div>
                        <div className="text-lg text-primary">{profileUser.licenseNumber}</div>
                      </div>
                    )}
                    {profileUser.experience !== undefined && (
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Experience</div>
                        <div className="text-lg text-primary">{profileUser.experience} years</div>
                      </div>
                    )}
                    {profileUser.hospital && (
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Hospital/Clinic</div>
                        <div className="text-lg text-primary">{typeof profileUser.hospital === 'object' ? (profileUser.hospital as any)?.name : profileUser.hospital}</div>
                      </div>
                    )}
                    {profileUser.consultationFee !== undefined && (
                      <div>
                        <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary mb-2">Consultation Fee</div>
                        <div className="text-lg text-primary">NPR {profileUser.consultationFee}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {profileUser.qualifications && profileUser.qualifications.length > 0 && (
                <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-display font-medium text-primary">Qualifications</h3>
                    <div className="flex flex-wrap gap-3">
                      {profileUser.qualifications.map((qual, index) => (
                        <span key={index} className="px-4 py-2 bg-primary text-background text-sm font-medium rounded-full">
                          {qual}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {profileUser.rating !== undefined && profileUser.rating > 0 && (
                <div className="bg-soft-blue/30 p-8 md:p-12 rounded-2xl">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-display font-medium text-primary">Ratings & Reviews</h3>
                    <div className="space-y-2">
                      <div className="text-5xl font-display font-medium text-primary">{profileUser.rating.toFixed(1)}</div>
                      <div className="text-sm font-sans font-medium uppercase tracking-widest text-secondary">
                        {profileUser.totalReviews || 0} reviews
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage