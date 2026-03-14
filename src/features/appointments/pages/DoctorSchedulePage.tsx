import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  CalendarViewMonth as CalendarIcon,
  List as ListIcon,
  CheckCircle as ConfirmIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  EventAvailable as ApproveIcon,
  EventBusy as DenyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'

import { RootState, AppDispatch } from '../../../store'
import {
  getDoctorSchedule,
  confirmAppointment,
  handleRescheduleRequest,
  clearError
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

const DoctorSchedulePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf('week'))
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('week'))
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)

  const {
    doctorSchedule,
    loadingSchedule,
    error,
    confirming,
    updating
  } = useSelector((state: RootState) => state.appointments)

  // Load schedule when dates change
  useEffect(() => {
    loadSchedule()
  }, [startDate, endDate])

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const loadSchedule = () => {
    dispatch(getDoctorSchedule({
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD')
    }))
  }

  const handleConfirmAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setConfirmDialogOpen(true)
  }

  const handleConfirmConfirm = async () => {
    if (!selectedAppointment) return

    try {
      await dispatch(confirmAppointment(selectedAppointment.id)).unwrap()
      setConfirmDialogOpen(false)
      setSelectedAppointment(null)
      loadSchedule() // Reload schedule
    } catch (error) {
      console.error('Failed to confirm appointment:', error)
    }
  }

  const handleRescheduleRequestAction = (appointment: any, action: 'approve' | 'reject') => {
    setSelectedAppointment({ ...appointment, action })
    setRescheduleDialogOpen(true)
  }

  const handleConfirmRescheduleAction = async () => {
    if (!selectedAppointment) return

    try {
      await dispatch(handleRescheduleRequest({
        appointmentId: selectedAppointment.id,
        action: selectedAppointment.action
      })).unwrap()

      setRescheduleDialogOpen(false)
      setSelectedAppointment(null)
      loadSchedule() // Reload schedule
    } catch (error) {
      console.error('Failed to handle reschedule request:', error)
    }
  }

  const filteredAppointments = (doctorSchedule as any[]).filter((appointment: any) => {
    if (statusFilter === 'all') return true
    return appointment.status === statusFilter
  })

  const getAppointmentActions = (appointment: any) => {
    const actions = []

    actions.push(
      <Tooltip key="view-details" title="View Details">
        <IconButton
          color="primary"
          onClick={() => navigate(`/appointments/${appointment.id || appointment._id}`)}
          size="small"
        >
          <ViewIcon />
        </IconButton>
      </Tooltip>
    )

    // Confirm pending appointments
    if (appointment.status === 'pending') {
      actions.push(
        <Tooltip key="confirm" title="Confirm Appointment">
          <IconButton
            color="success"
            onClick={() => handleConfirmAppointment(appointment)}
            size="small"
          >
            <ConfirmIcon />
          </IconButton>
        </Tooltip>
      )
    }

    // Handle reschedule requests
    if (appointment.rescheduleStatus === 'pending') {
      actions.push(
        <Tooltip key="approve-reschedule" title="Approve Reschedule">
          <IconButton
            color="success"
            onClick={() => handleRescheduleRequestAction(appointment, 'approve')}
            size="small"
          >
            <ApproveIcon />
          </IconButton>
        </Tooltip>
      )
      actions.push(
        <Tooltip key="reject-reschedule" title="Reject Reschedule">
          <IconButton
            color="error"
            onClick={() => handleRescheduleRequestAction(appointment, 'reject')}
            size="small"
          >
            <DenyIcon />
          </IconButton>
        </Tooltip>
      )
    }

    return actions
  }

  const renderCalendarView = () => {
    // Group appointments by date
    const appointmentsByDate: { [key: string]: any[] } = {}

    filteredAppointments.forEach(appointment => {
      const dateKey = appointment.date
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = []
      }
      appointmentsByDate[dateKey].push(appointment)
    })

    const weekDays = []
    const current = startDate.clone()

    for (let i = 0; i < 7; i++) {
      const dayAppointments = appointmentsByDate[current.format('YYYY-MM-DD')] || []
      weekDays.push({
        date: current.format('YYYY-MM-DD'),
        displayDate: current.format('MMM D'),
        dayName: current.format('dddd'),
        appointments: dayAppointments
      })
      current.add(1, 'day')
    }

    return (
      <Grid container spacing={2}>
        {weekDays.map((day) => (
          <Grid size={{ xs: 12, sm: 6, md: 12 / 7 }} key={day.date}>
            <Card sx={{
              height: 300,
              display: 'flex',
              flexDirection: 'column',
              opacity: day.appointments.length === 0 ? 0.7 : 1
            }}>
              <CardContent sx={{ flex: 1, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {day.displayDate}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                  {day.dayName}
                </Typography>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {day.appointments.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No appointments
                    </Typography>
                  ) : (
                    day.appointments.map((appointment) => (
                      <Box
                        key={appointment.id}
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {appointment.time}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {appointment.patientId?.name || 'Unknown Patient'}
                        </Typography>
                        <Chip
                          label={statusLabels[appointment.status as keyof typeof statusLabels]}
                          color={statusColors[appointment.status as keyof typeof statusColors]}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 18 }}
                        />
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Date & Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAppointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No appointments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your date range or filters
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredAppointments.map((appointment) => (
              <TableRow key={appointment.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                      {appointment.patientId?.name?.charAt(0) || 'P'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {appointment.patientId?.name || 'Unknown Patient'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointment.patientId?.email || 'No email'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {new Date(appointment.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <TimeIcon sx={{ mr: 0.5, fontSize: 14, verticalAlign: 'middle' }} />
                    {appointment.time}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[appointment.status as keyof typeof statusLabels]}
                    color={statusColors[appointment.status as keyof typeof statusColors]}
                    size="small"
                  />
                  {appointment.rescheduleStatus === 'pending' && (
                    <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                      Reschedule pending
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {appointment.reason}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {getAppointmentActions(appointment)}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Schedule
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your appointments and patient consultations
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => newValue && setStartDate(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => newValue && setEndDate(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  startIcon={<ListIcon />}
                  onClick={() => setViewMode('list')}
                  size="small"
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                  startIcon={<CalendarIcon />}
                  onClick={() => setViewMode('calendar')}
                  size="small"
                >
                  Calendar
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadSchedule}
                variant="outlined"
                fullWidth
                size="small"
              >
                Refresh
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
      {loadingSchedule ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ p: 3, pb: 0 }}>
              Appointments ({filteredAppointments.length})
            </Typography>

            {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
          </CardContent>
        </Card>
      )}

      {/* Confirm Appointment Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to confirm this appointment?
          </Typography>
          {selectedAppointment && (
            <Box>
              <Typography variant="body2">
                <strong>Patient:</strong> {selectedAppointment.patientId?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}
              </Typography>
              <Typography variant="body2">
                <strong>Reason:</strong> {selectedAppointment.reason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmConfirm}
            variant="contained"
            color="success"
            disabled={confirming}
          >
            {confirming ? 'Confirming...' : 'Confirm Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Handle Reschedule Request Dialog */}
      <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAppointment?.action === 'approve' ? 'Approve' : 'Reject'} Reschedule Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedAppointment?.action === 'approve'
              ? 'Are you sure you want to approve this reschedule request?'
              : 'Are you sure you want to reject this reschedule request?'}
          </Typography>
          {selectedAppointment && (
            <Box>
              <Typography variant="body2">
                <strong>Patient:</strong> {selectedAppointment.patientId?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Current:</strong> {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}
              </Typography>
              <Typography variant="body2">
                <strong>Requested:</strong> {new Date(selectedAppointment.rescheduleNewDate).toLocaleDateString()} at {selectedAppointment.rescheduleNewTime}
              </Typography>
              <Typography variant="body2">
                <strong>Reason:</strong> {selectedAppointment.rescheduleReason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmRescheduleAction}
            variant="contained"
            color={selectedAppointment?.action === 'approve' ? 'success' : 'error'}
            disabled={updating}
          >
            {updating
              ? 'Processing...'
              : selectedAppointment?.action === 'approve'
                ? 'Approve'
                : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default DoctorSchedulePage