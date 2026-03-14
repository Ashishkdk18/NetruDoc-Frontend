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
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  EventAvailable as EventIcon,
  MedicalServices as MedicalIcon,
  Medication as MedicationIcon,
  LocalHospital as HospitalIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Videocam as VideocamIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { RootState, AppDispatch } from '../../../store'
import { getAppointments } from '../../appointments/appointmentSlice'
import { getPrescriptions } from '../../prescriptions/prescriptionSlice'
import { getUnreadCount } from '../../notifications/notificationSlice'
import { getConsultations } from '../../consultations/consultationSlice'
import { getMedicalRecords } from '../../medical-records/medicalRecordsSlice'
import StatCard from '../components/StatCard'
import FeatureCard from '../components/FeatureCard'
import QuickActionsBar from '../components/QuickActionsBar'
import RecentActivity, { RecentActivityItem } from '../components/RecentActivity'

dayjs.extend(relativeTime)

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const { user } = useSelector((state: RootState) => state.auth)
  const { appointments, loading: loadingAppointments } = useSelector((state: RootState) => state.appointments)
  const { prescriptions, loading: loadingPrescriptions } = useSelector((state: RootState) => state.prescriptions)
  const { unreadCount, loadingUnreadCount } = useSelector((state: RootState) => state.notifications)
  const { consultations, loading: loadingConsultations } = useSelector((state: RootState) => state.consultations)
  const { records: medicalRecordsData, loading: loadingMedicalRecords } = useSelector((state: RootState) => state.medicalRecords)

  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
    completed: 0,
    activePrescriptions: 0,
    unreadNotifications: 0,
    recentConsultations: 0,
    medicalRecords: 0,
  })

  // Load all data on component mount
  useEffect(() => {
    dispatch(getAppointments({ limit: 20 }))
    dispatch(getPrescriptions({ limit: 100 }))
    dispatch(getUnreadCount())
    dispatch(getConsultations())
    if (user?.id || (user as any)?._id) {
      dispatch(getMedicalRecords(user?.id || (user as any)?._id))
    }
  }, [dispatch, user])

  // Calculate statistics
  useEffect(() => {
    const appointmentsArray = (appointments as any)?.items || []
    const prescriptionsArray = prescriptions || []
    const consultationsArray = consultations || []
    const recordsArray = medicalRecordsData?.records || []

    const now = new Date()
    const statsData = appointmentsArray.reduce(
      (acc: any, appointment: any) => {
        acc.total++
        if (appointment.status === 'pending') acc.pending++
        if (appointment.status === 'completed') acc.completed++

        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
        if (appointmentDateTime > now && appointment.status !== 'cancelled' && appointment.status !== 'completed') {
          acc.upcoming++
        }
        return acc
      },
      { total: 0, upcoming: 0, pending: 0, completed: 0 }
    )

    setStats({
      ...statsData,
      activePrescriptions: prescriptionsArray.filter((p: any) => p.isActive).length,
      unreadNotifications: unreadCount,
      recentConsultations: consultationsArray.length,
      medicalRecords: recordsArray.length,
    })
  }, [appointments, prescriptions, unreadCount, consultations, medicalRecordsData])

  const getUpcomingAppointments = () => {
    const appointmentsArray = (appointments as any)?.items || []
    const now = new Date()
    return appointmentsArray
      .filter((appointment: any) => {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
        return appointmentDateTime > now && appointment.status !== 'cancelled' && appointment.status !== 'completed'
      })
      .slice(0, 5)
  }

  const getRecentPrescriptions = () => {
    return (prescriptions || []).slice(0, 3)
  }

  const getRecentConsultations = () => {
    return (consultations || []).slice(0, 3)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Quick actions for patient
  const quickActions = [
    {
      label: 'Book Appointment',
      icon: <AddIcon />,
      onClick: () => navigate('/doctors'),
      variant: 'contained' as const,
      color: 'primary' as const,
    },
    {
      label: 'View Appointments',
      icon: <CalendarIcon />,
      to: '/appointments/my',
      variant: 'outlined' as const,
    },
    {
      label: 'Find Doctors',
      icon: <SearchIcon />,
      to: '/doctors',
      variant: 'outlined' as const,
    },
    {
      label: 'Chat',
      icon: <ChatIcon />,
      to: '/chat',
      variant: 'outlined' as const,
    },
  ]

  // Feature cards for patient
  const featureCards = [
    {
      icon: <CalendarIcon />,
      title: 'Appointments',
      description: 'Manage your healthcare appointments',
      to: '/appointments/my',
      statsValue: stats.upcoming,
      statsLabel: stats.upcoming > 0 ? 'Upcoming' : undefined,
      actionLabel: 'View All',
    },
    {
      icon: <VideocamIcon />,
      title: 'Consultations',
      description: 'Video and chat consultations',
      to: '/appointments/my',
      statsValue: stats.recentConsultations,
      statsLabel: stats.recentConsultations > 0 ? 'Recent' : undefined,
      actionLabel: 'View History',
    },
    {
      icon: <MedicationIcon />,
      title: 'Prescriptions',
      description: 'View and download prescriptions',
      to: '/prescriptions',
      statsValue: stats.activePrescriptions,
      statsLabel: stats.activePrescriptions > 0 ? 'Active' : undefined,
      actionLabel: 'View All',
    },
    {
      icon: <HospitalIcon />,
      title: 'Medical Records',
      description: 'Your complete health history',
      to: '/medical-records',
      statsValue: stats.medicalRecords,
      statsLabel: stats.medicalRecords > 0 ? 'Records' : undefined,
      actionLabel: 'View Records',
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
      description: 'Message your doctors',
      to: '/chat',
      actionLabel: 'Open Chat',
    },
    {
      icon: <PersonIcon />,
      title: 'Profile',
      description: 'Manage your account',
      to: '/profile',
      actionLabel: 'Edit Profile',
    },
    {
      icon: <PaymentIcon />,
      title: 'Payment History',
      description: 'View your payments',
      to: '/payments/history',
      actionLabel: 'View Payments',
    },
    {
      icon: <SearchIcon />,
      title: 'Find Doctors',
      description: 'Browse available doctors',
      to: '/doctors',
      actionLabel: 'Browse Doctors',
    },
  ]

  // Recent activity items
  const recentAppointments: RecentActivityItem[] = getUpcomingAppointments().map((apt: any) => ({
    id: apt.id || apt._id,
    title: `Dr. ${apt.doctorId?.name || 'Unknown Doctor'}`,
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

  const recentConsultations: RecentActivityItem[] = getRecentConsultations().map((consultation: any) => ({
    id: consultation._id || consultation.id,
    title: 'Consultation',
    subtitle: consultation.startTime ? dayjs(consultation.startTime).format('MMM D, YYYY h:mm A') : '',
    statusLabel: consultation.status,
    statusColor: consultation.status === 'completed' ? 'success' : consultation.status === 'active' ? 'primary' : 'default',
    link: `/consultations/${consultation._id || consultation.id}`,
  }))

  const isLoading =
    loadingAppointments || loadingPrescriptions || loadingUnreadCount || loadingConsultations || loadingMedicalRecords

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
              Dashboard
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your healthcare appointments and stay connected with your doctors.
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
              <StatCard title="Total Appointments" value={stats.total} icon={<MedicalIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Upcoming" value={stats.upcoming} icon={<EventIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Pending" value={stats.pending} icon={<ScheduleIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Completed" value={stats.completed} icon={<CheckCircleIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Active Prescriptions" value={stats.activePrescriptions} icon={<MedicationIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Unread Notifications"
                value={stats.unreadNotifications}
                icon={<NotificationsIcon />}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Consultations" value={stats.recentConsultations} icon={<VideocamIcon />} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard title="Medical Records" value={stats.medicalRecords} icon={<HospitalIcon />} />
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
                  <Button component={Link} to="/appointments/my" variant="text" size="small" fullWidth>
                    View All Appointments →
                  </Button>
                </Box>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RecentActivity
                title="Recent Prescriptions"
                items={recentPrescriptions}
                emptyMessage="No prescriptions yet"
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
                title="Recent Consultations"
                items={recentConsultations}
                emptyMessage="No consultations yet"
              />
              {recentConsultations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Button component={Link} to="/appointments/my" variant="text" size="small" fullWidth>
                    View All Consultations →
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

export default DashboardPage
