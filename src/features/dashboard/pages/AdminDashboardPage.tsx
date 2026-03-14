import React from 'react'
import { useNavigate } from 'react-router-dom'

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()

  const adminCards = [
    {
      title: 'Analytics',
      description: 'View platform analytics and KPIs',
      icon: '📊',
      path: '/admin/analytics',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Audit Logs',
      description: 'View system audit logs',
      icon: '📋',
      path: '/admin/audit-logs',
      color: 'bg-gray-100 text-gray-800'
    },
    {
      title: 'All Users',
      description: 'View and manage all users',
      icon: '👥',
      path: '/admin/users',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Doctors',
      description: 'View and manage all doctors',
      icon: '👨‍⚕️',
      path: '/admin/doctors',
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Patients',
      description: 'View and manage all patients',
      icon: '🏥',
      path: '/admin/patients',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      title: 'Hospitals',
      description: 'View and manage all hospitals',
      icon: '🏥',
      path: '/admin/hospitals',
      color: 'bg-red-100 text-red-800'
    },
    {
      title: 'Payments',
      description: 'View platform transactions',
      icon: '💳',
      path: '/payments/history',
      color: 'bg-green-100 text-green-800'
    }
  ]

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
              Admin<br />
              <span className="text-secondary opacity-60">Dashboard</span>
            </h1>
            <p className="text-lg text-secondary mt-6 max-w-2xl">
              Manage users, doctors, patients, and hospitals
            </p>
          </div>
        </div>
      </section>

      {/* Admin Cards Grid */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {adminCards.map((card, index) => (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                className="group bg-soft-blue/30 p-8 rounded-2xl hover:bg-soft-blue/40 transition-all duration-500 cursor-pointer hover:scale-105"
              >
                <div className="space-y-6 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-accent text-2xl group-hover:text-primary transition-colors duration-300">0{index + 1}</span>
                    <span className="text-4xl">{card.icon}</span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-display font-medium text-primary group-hover:translate-x-2 transition-transform duration-300">{card.title}</h3>
                    <p className="text-secondary leading-relaxed">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboardPage
