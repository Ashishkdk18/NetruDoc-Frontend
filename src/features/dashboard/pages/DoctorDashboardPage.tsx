import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  EventAvailable as EventIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Medication as MedicationIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Videocam as VideocamIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { RootState, AppDispatch } from '../../../store'
import { getAppointments } from '../../appointments/appointmentSlice'
import { getPrescriptions } from '../../prescriptions/prescriptionSlice'
import { getUnreadCount } from '../../notifications/notificationSlice'
import { getConsultations } from '../../consultations/consultationSlice'
import { Appointment } from '../../appointments/appointmentSlice'
import StatCard from '../components/StatCard'
import FeatureCard from '../components/FeatureCard'
import QuickActionsBar from '../components/QuickActionsBar'
import RecentActivity, { RecentActivityItem } from '../components/RecentActivity'

dayjs.extend(relativeTime)

const DoctorDashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const { user } = useSelector((state: RootState) => state.auth)
  const { appointments, loading: loadingAppointments } = useSelector((state: RootState) => state.appointments)
  const { prescriptions, loading: loadingPrescriptions } = useSelector((state: RootState) => state.prescriptions)
  const { unreadCount, loadingUnreadCount } = useSelector((state: RootState) => state.notifications)
  const { consultations, loading: loadingConsultations } = useSelector((state: RootState) => state.consultations)

  const [stats, setStats] = useState({
    totalToday: 0,
    upcoming: 0,
    pending: 0,
    totalPatients: 0,
    activePrescriptions: 0,
    unreadNotifications: 0,
    pendingReschedule: 0,
  })

  useEffect(() => {
    dispatch(getAppointments({ limit: 50 }))
    dispatch(getPrescriptions({ limit: 100 }))
    dispatch(getUnreadCount())
    dispatch(getConsultations())
  }, [dispatch])

  useEffect(() => {
    const items: Appointment[] = (appointments as any)?.items || (appointments as unknown as Appointment[])
    const prescriptionsArray = prescriptions || []

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const uniquePatients = new Set<string>()
    let pendingRescheduleCount = 0

    const data = items.reduce(
      (acc: any, apt: Appointment) => {
        const dateStr = new Date(apt.date).toISOString().split('T')[0]
        if (dateStr === todayStr) {
          acc.totalToday++
        }
        if (apt.status === 'pending') {
          acc.pending++
        }
        if (apt.rescheduleStatus === 'pending') {
          pendingRescheduleCount++
        }

        const aptDateTime = new Date(`${apt.date}T${apt.time}`)
        if (aptDateTime > now && apt.status !== 'cancelled' && apt.status !== 'completed') {
          acc.upcoming++
        }

        // Track unique patients
        const patientId =
          typeof apt.patientId === 'object' && apt.patientId
            ? (apt.patientId as any)._id || (apt.patientId as any).id
            : apt.patientId
        if (patientId) {
          uniquePatients.add(String(patientId))
        }

        return acc
      },
      { totalToday: 0, upcoming: 0, pending: 0 }
    )

    // Count active prescriptions created this month
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()
    const activePrescriptionsCount = prescriptionsArray.filter((p: any) => {
      if (!p.isActive) return false
      if (p.createdAt) {
        const createdDate = new Date(p.createdAt)
        return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear
      }
      return false
    }).length

    setStats({
      ...data,
      totalPatients: uniquePatients.size,
      activePrescriptions: activePrescriptionsCount,
      unreadNotifications: unreadCount,
      pendingReschedule: pendingRescheduleCount,
    })
  }, [appointments, prescriptions, unreadCount, consultations])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getUpcomingAppointments = (): Appointment[] => {
    const items: Appointment[] = (appointments as any)?.items || (appointments as unknown as Appointment[])
    const now = new Date()
    return items
      .filter((apt) => {
        const aptDateTime = new Date(`${apt.date}T${apt.time}`)
        return aptDateTime > now && apt.status !== 'cancelled'
      })
      .slice(0, 5)
  }

  const getPendingToday = (): Appointment[] => {
    const items = (appointments as any)?.items || (appointments as unknown as Appointment[])
    const todayStr = new Date().toISOString().split('T')[0]
    return items.filter((apt: Appointment) => {
      const dateStr = new Date(apt.date).toISOString().split('T')[0]
      return dateStr === todayStr && apt.status === 'pending'
    })
  }

  const getPendingRescheduleRequests = (): Appointment[] => {
    const items = (appointments as any)?.items || (appointments as unknown as Appointment[])
    return items.filter((apt: Appointment) => apt.rescheduleStatus === 'pending')
  }

  const getRecentPrescriptions = () => {
    return (prescriptions || []).slice(0, 3)
  }

  // Quick actions for doctor
  const quickActions = [
    {
      label: 'View Schedule',
      icon: <ScheduleIcon />,
      to: '/appointments/doctor/schedule',
      variant: 'contained' as const,
      color: 'primary' as const,
    },
    {
      label: 'Start Consultation',
      icon: <VideocamIcon />,
      onClick: () => {
        const upcoming = getUpcomingAppointments()
        if (upcoming.length > 0) {
          navigate(`/consultation/${upcoming[0].id || (upcoming[0] as { _id?: string })._id}`)
        } else {
          navigate('/appointments/doctor/schedule')
        }
      },
      variant: 'outlined' as const,
    },
    {
      label: 'Create Prescription',
      icon: <AddIcon />,
      to: '/prescriptions/create',
      variant: 'outlined' as const,
    },
    {
      label: 'Chat',
      icon: <ChatIcon />,
      to: '/chat',
      variant: 'outlined' as const,
    },
  ]

  // Feature cards for doctor
  const featureCards = [
    {
      icon: <ScheduleIcon />,
      title: 'Schedule',
      description: 'Manage your appointments',
      to: '/appointments/doctor/schedule',
      statsValue: stats.totalToday,
      statsLabel: stats.totalToday > 0 ? "Today's" : undefined,
      actionLabel: 'View Schedule',
    },
    {
      icon: <VideocamIcon />,
      title: 'Consultations',
      description: 'Video and chat consultations',
      to: '/appointments/doctor/schedule',
      statsValue: consultations?.filter((c: any) => c.status === 'active').length || 0,
      statsLabel: 'Active',
      actionLabel: 'Start Consultation',
    },
    {
      icon: <MedicationIcon />,
      title: 'Prescriptions',
      description: 'Create and manage prescriptions',
      to: '/prescriptions',
      statsValue: stats.activePrescriptions,
      statsLabel: stats.activePrescriptions > 0 ? 'This month' : undefined,
      actionLabel: 'Create New',
    },
    {
      icon: <PeopleIcon />,
      title: 'Patients',
      description: 'View your patients',
      to: '/appointments/doctor/schedule',
      statsValue: stats.totalPatients,
      statsLabel: stats.totalPatients > 0 ? 'Total' : undefined,
      actionLabel: 'View Patients',
    },
    {
      icon: <NotificationsIcon />,
      title: 'Notifications',
      description: 'Stay updated with alerts',
      to: '/notifications',
      statsValue: stats.unreadNotifications > 0 ? stats.unreadNotifications : undefined,
      statsLabel: stats.unreadNotifications > 0 ? 'Unread' : undefined,
      actionLabel: 'View All',
    },
    {
      icon: <ChatIcon />,
      title: 'Chat',
      description: 'Message your patients',
      to: '/chat',
      actionLabel: 'Open Chat',
    },
    {
      icon: <TimeIcon />,
      title: 'Availability',
      description: 'Manage your schedule',
      to: '/profile/availability',
      actionLabel: 'Manage',
    },
    {
      icon: <PaymentIcon />,
      title: 'Payment History',
      description: 'View your payments',
      to: '/payments/history',
      actionLabel: 'View Payments',
    },
    {
      icon: <PersonIcon />,
      title: 'Profile',
      description: 'Manage your account',
      to: '/profile',
      actionLabel: 'Edit Profile',
    },
  ]

  // Recent activity items
  const recentAppointments: RecentActivityItem[] = getUpcomingAppointments().map((apt: Appointment & { _id?: string }) => ({
    id: apt.id || apt._id || '',
    title: (apt.patientId as any)?.name || 'Patient',
    subtitle: `${formatDate(apt.date)} at ${formatTime(apt.time)}`,
    statusLabel: apt.status === 'confirmed' ? 'Confirmed' : 'Pending',
    statusColor: apt.status === 'confirmed' ? 'success' : 'warning',
    link: `/appointments/${apt.id || apt._id}`,
  }))

  const recentPrescriptions: RecentActivityItem[] = getRecentPrescriptions().map((prescription: any) => ({
    id: prescription._id || prescription.id,
    title: `${prescription.medications?.length || 0} medication(s)`,
    subtitle: prescription.createdAt ? dayjs(prescription.createdAt).format('MMM D, YYYY') : '',
    statusLabel: prescription.isActive ? 'Active' : 'Inactive',
    statusColor: prescription.isActive ? 'success' : 'default',
    link: `/prescriptions/${prescription._id || prescription.id}`,
  }))

  const pendingActions: RecentActivityItem[] = [
    ...getPendingRescheduleRequests().slice(0, 3).map((apt: Appointment & { _id?: string }) => ({
      id: apt.id || apt._id || '',
      title: `Reschedule: ${(apt.patientId as any)?.name || 'Patient'}`,
      subtitle: `Requested: ${formatDate(apt.rescheduleNewDate as any)} at ${apt.rescheduleNewTime}`,
      statusLabel: 'Pending',
      statusColor: 'warning' as const,
      link: `/appointments/${apt.id || apt._id}`,
    })),
    ...getPendingToday().slice(0, 2).map((apt: Appointment & { _id?: string }) => ({
      id: apt.id || apt._id || '',
      title: `Confirm: ${(apt.patientId as any)?.name || 'Patient'}`,
      subtitle: `${formatTime(apt.time)} • ${formatDate(apt.date)}`,
      statusLabel: 'Pending',
      statusColor: 'warning' as const,
      link: `/appointments/${apt.id || apt._id}`,
    })),
  ]

  const isLoading = loadingAppointments || loadingPrescriptions || loadingUnreadCount || loadingConsultations

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Box sx={{ pt: { xs: 8, md: 12 }, pb: 6, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="overline"
              sx={{ display: 'block', mb: 2, letterSpacing: 2, color: 'text.secondary' }}
            >
              Doctor Dashboard
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome back, Dr. {user?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review your schedule, manage upcoming consultations, and stay prepared for your patients.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Quick Actions Bar */}
      <QuickActionsBar actions={quickActions} />

      {/* Statistics Cards */}
      <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Today's Appointments" value={stats.totalToday} icon={<CalendarIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Pending Confirmations" value={stats.pending} icon={<ScheduleIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Upcoming" value={stats.upcoming} icon={<EventIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Total Patients" value={stats.totalPatients} icon={<PeopleIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Prescriptions (Month)" value={stats.activePrescriptions} icon={<MedicationIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Unread Notifications"
                value={stats.unreadNotifications}
                icon={<NotificationsIcon />}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Pending Reschedule" value={stats.pendingReschedule} icon={<TimeIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Consultations" value={consultations?.length || 0} icon={<VideocamIcon />} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Feature Navigation Cards */}
      <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Quick Access
          </Typography>
          <Grid container spacing={3}>
            {featureCards.map((card, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FeatureCard {...card} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Recent Activity Section */}
      <Box sx={{ py: 4, px: { xs: 2, md: 4 }, pb: 8 }}>
        <Container maxWidth="xl">
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <RecentActivity
                title="Recent Appointments"
                items={recentAppointments}
                emptyMessage="No upcoming appointments"
              />
              {recentAppointments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to="/appointments/doctor/schedule"
                    variant="text"
                    size="small"
                    fullWidth
                  >
                    View All Appointments →
                  </Button>
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RecentActivity
                title="Recent Prescriptions"
                items={recentPrescriptions}
                emptyMessage="No prescriptions created yet"
              />
              {recentPrescriptions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button component={Link} to="/prescriptions" variant="text" size="small" fullWidth>
                    View All Prescriptions →
                  </Button>
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RecentActivity
                title="Pending Actions"
                items={pendingActions}
                emptyMessage="No pending actions"
              />
              {pendingActions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to="/appointments/doctor/schedule"
                    variant="text"
                    size="small"
                    fullWidth
                  >
                    View All →
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  )
}

export default DoctorDashboardPage
