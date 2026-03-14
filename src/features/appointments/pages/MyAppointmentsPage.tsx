import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material'
import {
  FilterList as FilterIcon,

  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'

import { RootState, AppDispatch } from '../../../store'
import {
  getAppointments,
  cancelAppointment,
  requestReschedule,
  getAvailableSlots,
  clearAvailableSlots
} from '../appointmentSlice'

const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'error'
} as const

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled'
} as const

const MyAppointmentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const location = useLocation()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState<Dayjs | null>(null)
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleReasonText, setRescheduleReasonText] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const {
    appointments,
    loading,
    error,
    cancelling,
    rescheduling,
    availableSlots,
    loadingSlots,
    slotsError
  } = useSelector((state: RootState) => state.appointments)

  const [page, setPage] = useState(1)
  const limit = 5
  const appointmentsArray = (appointments as any)?.items || []
  const totalPages = (appointments as any)?.pagination?.totalPages || 1

  // Load appointments on component mount and when filters change
  useEffect(() => {
    loadAppointments()
  }, [statusFilter, startDate, endDate, page, limit])

  // Show success message if redirected from booking
  useEffect(() => {
    if (location.state?.message) {
      setSnackbarMessage(location.state.message)
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      // Clear the message from location state
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const loadAppointments = () => {
    const params: any = {
      page,
      limit
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter
    }

    if (startDate) {
      params.startDate = startDate.format('YYYY-MM-DD')
    }

    if (endDate) {
      params.endDate = endDate.format('YYYY-MM-DD')
    }

    dispatch(getAppointments(params))
  }

  const handleCancelAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) return

    try {
      await dispatch(cancelAppointment({
        appointmentId: selectedAppointment.id,
        reason: cancelReason
      })).unwrap()

      setCancelDialogOpen(false)
      setCancelReason('')
      setSelectedAppointment(null)
      setSnackbarMessage('Appointment cancelled successfully')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)

      // Reload appointments
      loadAppointments()
    } catch (error) {
      setSnackbarMessage('Failed to cancel appointment')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleRescheduleAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setRescheduleDialogOpen(true)
    setRescheduleDate(null)
    setRescheduleTime('')
    setRescheduleReasonText('')
    dispatch(clearAvailableSlots())
  }

  // Load available slots when reschedule date changes
  useEffect(() => {
    if (rescheduleDialogOpen && rescheduleDate && selectedAppointment?.doctorId) {
      // Handle both string ID and populated object
      let doctorId: string | undefined
      if (typeof selectedAppointment.doctorId === 'string') {
        doctorId = selectedAppointment.doctorId
      } else if (selectedAppointment.doctorId) {
        // Populated object - try _id (MongoDB) or id (transformed)
        doctorId = (selectedAppointment.doctorId as any)._id || (selectedAppointment.doctorId as any).id
      }
      
      if (doctorId) {
        dispatch(getAvailableSlots({
          doctorId: String(doctorId),
          date: rescheduleDate.format('YYYY-MM-DD')
        }))
      }
    } else if (rescheduleDialogOpen && !rescheduleDate) {
      dispatch(clearAvailableSlots())
    }
  }, [rescheduleDate, rescheduleDialogOpen, selectedAppointment, dispatch])

  // Clear slots when dialog closes
  useEffect(() => {
    if (!rescheduleDialogOpen) {
      dispatch(clearAvailableSlots())
      setRescheduleTime('')
    }
  }, [rescheduleDialogOpen, dispatch])

  const handleConfirmReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime || !rescheduleReasonText.trim()) return

    try {
      await dispatch(requestReschedule({
        appointmentId: selectedAppointment.id,
        rescheduleData: {
          newDate: rescheduleDate.format('YYYY-MM-DD'),
          newTime: rescheduleTime,
          reason: rescheduleReasonText
        }
      })).unwrap()

      setRescheduleDialogOpen(false)
      setRescheduleDate(null)
      setRescheduleTime('')
      setRescheduleReasonText('')
      setSelectedAppointment(null)
      setSnackbarMessage('Reschedule request submitted successfully')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)

      // Reload appointments
      loadAppointments()
    } catch (error) {
      setSnackbarMessage('Failed to request reschedule')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const canCancelAppointment = (appointment: any) => {
    const status = appointment.status
    return status === 'pending' || status === 'confirmed'
  }

  const canRescheduleAppointment = (appointment: any) => {
    const status = appointment.status
    // Prevent duplicate reschedule requests while one is pending
    if (appointment.rescheduleStatus === 'pending') return false
    return status === 'pending' || status === 'confirmed'
  }

  // Shared button styles for consistency
  const btnSx = {
    borderRadius: '10px',
    textTransform: 'none' as const,
    fontWeight: 600,
    px: 2,
    py: 0.75,
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
    '&:hover': { transform: 'translateY(-1px)' },
  }

  const getAppointmentActions = (appointment: any) => {
    const actions = []

    if (canCancelAppointment(appointment)) {
      actions.push(
        <Button
          key="cancel"
          size="small"
          variant="outlined"
          color="error"
          startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.currentTarget.blur()
            handleCancelAppointment(appointment)
          }}
          sx={{ ...btnSx, borderWidth: 1.5 }}
        >
          Cancel
        </Button>
      )
    }

    if (canRescheduleAppointment(appointment)) {
      actions.push(
        <Button
          key="reschedule"
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.currentTarget.blur()
            handleRescheduleAppointment(appointment)
          }}
          sx={{ ...btnSx, borderWidth: 1.5 }}
        >
          Reschedule
        </Button>
      )
    }

    // Add "Pay Now" button for pending appointments with a consultation fee
    if (appointment.status === 'pending' && appointment.doctorId?.consultationFee > 0) {
      actions.push(
        <Button
          key="pay"
          size="small"
          variant="contained"
          color="success"
          startIcon={<PaymentIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/payment', {
            state: {
              appointmentId: appointment.id,
              doctorId: appointment.doctorId.id || appointment.doctorId._id,
              doctorName: appointment.doctorId.name,
              amount: appointment.doctorId.consultationFee,
              date: appointment.date,
              time: appointment.time
            }
          })}
          sx={{
            ...btnSx,
            boxShadow: '0 2px 8px rgba(46,125,50,0.3)',
            '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(46,125,50,0.4)' },
          }}
        >
          Pay Now
        </Button>
      )
    }

    actions.push(
      <Button
        key="view"
        size="small"
        variant="contained"
        startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
        onClick={() => navigate(`/appointments/${appointment.id || appointment._id}`)}
        sx={{
          ...btnSx,
          bgcolor: 'primary.main',
          boxShadow: '0 2px 8px rgba(30,41,59,0.25)',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(30,41,59,0.35)' },
        }}
      >
        View Details
      </Button>
    )

    return actions
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
            flexShrink: 0,
          }}
        >
          <EventNoteIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            My Appointments
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your upcoming and past appointments
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(59,130,246,0.08)', color: 'primary.main', mr: 1.5,
            }}>
              <FilterIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Filters</Typography>
            <Button
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={loadAppointments}
              sx={{
                ml: 'auto', borderRadius: '10px', textTransform: 'none',
                fontWeight: 600, px: 2, fontSize: '0.85rem',
              }}
            >
              Refresh
            </Button>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } } } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '10px' } } } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStatusFilter('all')
                  setStartDate(null)
                  setEndDate(null)
                  setPage(1)
                }}
                fullWidth
                sx={{
                  height: '40px',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: 1.5,
                  borderColor: 'divider',
                  '&:hover': { borderWidth: 1.5 },
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Results Count */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={appointmentsArray.length}
              size="small"
              color="primary"
              sx={{ fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px', minWidth: 32 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              appointment{appointmentsArray.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>

          {/* Appointments List */}
          {appointmentsArray.length === 0 ? (
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: '20px', mx: 'auto', mb: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 100%)',
                }}>
                  <EventNoteIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  No appointments found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
                  {statusFilter !== 'all' || startDate || endDate
                    ? 'Try adjusting your filters or clearing them to see all appointments.'
                    : 'You haven\'t booked any appointments yet. Find a doctor to get started!'}
                </Typography>
                {(statusFilter !== 'all' || startDate || endDate) && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setStatusFilter('all')
                      setStartDate(null)
                      setEndDate(null)
                    }}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3 }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
          <Grid container spacing={2.5}>
            {appointmentsArray.map((appointment: any) => {
              // Status-to-border-color mapping
              const borderColorMap: Record<string, string> = {
                pending: '#f59e0b',
                confirmed: '#22c55e',
                completed: '#3b82f6',
                cancelled: '#ef4444',
              }
              const leftBorder = borderColorMap[appointment.status] || '#94a3b8'

              return (
              <Grid size={{ xs: 12 }} key={appointment.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: `4px solid ${leftBorder}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)',
                    },
                    overflow: 'hidden',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      {/* Doctor Info */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              mr: 2,
                              width: 48,
                              height: 48,
                              background: `linear-gradient(135deg, ${leftBorder}CC, ${leftBorder})`,
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              boxShadow: `0 3px 10px ${leftBorder}33`,
                            }}
                          >
                            {appointment.doctorId?.name?.charAt(0) || 'D'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                              Dr. {appointment.doctorId?.name || 'Unknown Doctor'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.3 }}>
                              {appointment.doctorId?.specialization?.replace('-', ' ').toUpperCase() || 'Specialization not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Appointment Details */}
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(appointment.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.time}</Typography>
                        </Box>
                      </Grid>

                      {/* Status and Reason */}
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            label={statusLabels[appointment.status as keyof typeof statusLabels]}
                            color={statusColors[appointment.status as keyof typeof statusColors]}
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '0.75rem' }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{
                          fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {appointment.reason}
                        </Typography>

                        {/* Reschedule Status */}
                        {appointment.rescheduleStatus === 'pending' && (
                          <Chip label="Reschedule pending" size="small" color="warning" variant="outlined"
                            sx={{ mt: 1, fontWeight: 600, fontSize: '0.7rem', borderRadius: '6px' }} />
                        )}
                        {appointment.rescheduleStatus === 'approved' && (
                          <Chip label="Reschedule approved" size="small" color="success" variant="outlined"
                            sx={{ mt: 1, fontWeight: 600, fontSize: '0.7rem', borderRadius: '6px' }} />
                        )}
                        {appointment.rescheduleStatus === 'rejected' && (
                          <Chip label="Reschedule rejected" size="small" color="error" variant="outlined"
                            sx={{ mt: 1, fontWeight: 600, fontSize: '0.7rem', borderRadius: '6px' }} />
                        )}
                      </Grid>

                      {/* Actions */}
                      <Grid size={{ xs: 12, sm: 2 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {getAppointmentActions(appointment)}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
            </Grid>
          )}

          {/* Pagination */}
          {!loading && !error && appointmentsArray.length > 0 && totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 1 }}>
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                sx={{
                  borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                  minWidth: 40, px: 2,
                }}
              >
                &laquo; Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  size="small"
                  variant={page === pageNum ? 'contained' : 'text'}
                  onClick={() => setPage(pageNum)}
                  sx={{
                    minWidth: 40, borderRadius: '10px', fontWeight: 700,
                    ...(page === pageNum && {
                      boxShadow: '0 2px 8px rgba(30,41,59,0.25)',
                    }),
                  }}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                sx={{
                  borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                  minWidth: 40, px: 2,
                }}
              >
                Next &raquo;
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Cancel Appointment Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Are you sure you want to cancel your appointment with Dr. {selectedAppointment?.doctorId?.name}?
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason (Optional)"
            placeholder="Please provide a reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            Keep Appointment
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelling}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Appointment Dialog */}
      <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Request Reschedule</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Request to reschedule your appointment with Dr. {selectedAppointment?.doctorId?.name}.
            The doctor will need to approve your request.
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="New Date"
              value={rescheduleDate}
              onChange={(newDate) => {
                setRescheduleDate(newDate)
                setRescheduleTime('') // Clear time when date changes
              }}
              minDate={dayjs()}
              maxDate={dayjs().add(90, 'day')}
              slotProps={{
                textField: { fullWidth: true, sx: { mb: 2 }, autoFocus: true }
              }}
            />
          </LocalizationProvider>

          {/* Available Time Slots */}
          {rescheduleDate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                <TimeIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                Available Time Slots
              </Typography>

              {loadingSlots ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : slotsError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {slotsError}
                </Alert>
              ) : availableSlots.length > 0 ? (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                  gap: 1,
                  mb: 2
                }}>
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={rescheduleTime === slot ? 'contained' : 'outlined'}
                      onClick={() => setRescheduleTime(slot)}
                      size="small"
                      sx={{
                        minHeight: 36,
                        fontSize: '0.875rem'
                      }}
                    >
                      {slot}
                    </Button>
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No available slots for the selected date. Please choose a different date.
                </Alert>
              )}
            </Box>
          )}

          {!rescheduleDate && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Please select a date to view available time slots.
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Reschedule"
            placeholder="Please explain why you need to reschedule..."
            value={rescheduleReasonText}
            onChange={(e) => setRescheduleReasonText(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRescheduleDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReschedule}
            variant="contained"
            disabled={rescheduling || !rescheduleDate || !rescheduleTime || !rescheduleReasonText.trim()}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 2px 8px rgba(30,41,59,0.25)' }}
          >
            {rescheduling ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default MyAppointmentsPage
