import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  Pagination,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs'

import { RootState, AppDispatch } from '../../../store'
import {
  getAppointments as getAllAppointments,
  deleteAppointment,
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

const AdminAppointmentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)

  const {
    appointments,
    loading,
    error,
    deleting
  } = useSelector((state: RootState) => state.appointments)

  // Load appointments on component mount and when filters change
  useEffect(() => {
    loadAppointments()
  }, [statusFilter, startDate, endDate, currentPage])

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const loadAppointments = () => {
    const params: any = {
      page: currentPage,
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

    dispatch(getAllAppointments(params))
  }

  const handleDeleteAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedAppointment) return

    try {
      await dispatch(deleteAppointment(selectedAppointment.id)).unwrap()
      setDeleteDialogOpen(false)
      setSelectedAppointment(null)
      loadAppointments() // Reload appointments
    } catch (error) {
      console.error('Failed to delete appointment:', error)
    }
  }

  const appointmentsArray = (appointments as any)?.items || []
  const totalPages = (appointments as any)?.pagination?.totalPages ?? 1
  const filteredAppointments = appointmentsArray.filter((appointment: any) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      appointment.patientId?.name?.toLowerCase().includes(searchLower) ||
      appointment.doctorId?.name?.toLowerCase().includes(searchLower) ||
      appointment.reason?.toLowerCase().includes(searchLower) ||
      appointment.doctorId?.specialization?.toLowerCase().includes(searchLower)
    )
  })

  // Calculate statistics
  const stats = filteredAppointments.reduce((acc: any, appointment: any) => {
    acc.total++
    if (appointment.status === 'pending') acc.pending++
    if (appointment.status === 'confirmed') acc.confirmed++
    if (appointment.status === 'completed') acc.completed++
    if (appointment.status === 'cancelled') acc.cancelled++
    return acc
  }, { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and oversee all appointments in the system
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MedicalIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Appointments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 40, height: 40, bgcolor: 'warning.main', borderRadius: '50%', mx: 'auto', mb: 1 }} />
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 40, height: 40, bgcolor: 'success.main', borderRadius: '50%', mx: 'auto', mb: 1 }} />
              <Typography variant="h4" color="success.main">{stats.confirmed}</Typography>
              <Typography variant="body2" color="text.secondary">Confirmed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 40, height: 40, bgcolor: 'info.main', borderRadius: '50%', mx: 'auto', mb: 1 }} />
              <Typography variant="h4" color="info.main">{stats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FilterIcon sx={{ mr: 2 }} />
            <Typography variant="h6">Filters & Search</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadAppointments}
              sx={{ ml: 'auto' }}
            >
              Refresh
            </Button>
          </Box>

          <Grid container spacing={2} alignItems="center">
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
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by patient, doctor, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStatusFilter('all')
                  setStartDate(null)
                  setEndDate(null)
                  setSearchTerm('')
                }}
                fullWidth
              >
                Clear Filters
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

      {/* Appointments Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No appointments found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or search criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment: any) => (
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {appointment.doctorId?.name?.charAt(0) || 'D'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Dr. {appointment.doctorId?.name || 'Unknown Doctor'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointment.doctorId?.specialization?.replace('-', ' ').toUpperCase() || 'No specialization'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatDate(appointment.date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <CalendarIcon sx={{ mr: 0.5, fontSize: 14, verticalAlign: 'middle' }} />
                          {formatTime(appointment.time)}
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
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/appointments/${appointment.id || appointment._id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Appointment">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAppointment(appointment)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, p) => setCurrentPage(p)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete this appointment? This action cannot be undone.
          </Typography>
          {selectedAppointment && (
            <Box>
              <Typography variant="body2">
                <strong>Patient:</strong> {selectedAppointment.patientId?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Doctor:</strong> Dr. {selectedAppointment.doctorId?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminAppointmentsPage