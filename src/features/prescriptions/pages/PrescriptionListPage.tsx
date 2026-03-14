import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Tooltip,
  Card,
  Avatar,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Medication as MedicationIcon,
  Search as SearchIcon,
  History as HistoryIcon,
} from '@mui/icons-material'
import { AppDispatch, RootState } from '../../../store/index'
import { getPrescriptions, downloadPrescription, clearError } from '../prescriptionSlice'
import { Prescription } from '../api/prescriptionApi'
import dayjs from 'dayjs'

const PrescriptionListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { prescriptions, loading, error, downloading } = useSelector((state: RootState) => state.prescriptions)

  const [page, setPage] = useState(1)
  const limit = 5
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const isDoctor = user?.role === 'doctor'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    loadPrescriptions()
  }, [page, statusFilter])

  const loadPrescriptions = () => {
    const params: any = {
      page,
      limit,
      sort: '-createdAt',
    }

    if (statusFilter !== 'all') {
      // Note: Backend filters by isActive, but we'll filter client-side for now
    }

    dispatch(getPrescriptions(params))
  }

  const handleDownload = async (prescriptionId: string) => {
    try {
      await dispatch(downloadPrescription(prescriptionId)).unwrap()
    } catch (error) {
      console.error('Failed to download prescription:', error)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleResetFilters = () => {
    dispatch(clearError())
    setPage(1)
    setSearchQuery('')
    setStatusFilter('all')
  }

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (statusFilter !== 'all' && prescription.isActive !== (statusFilter === 'active')) {
      return false
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const doctor = typeof prescription.doctorId === 'object' ? prescription.doctorId : null
      const patient = typeof prescription.patientId === 'object' ? prescription.patientId : null
      return (
        prescription.medications?.some((m) => m.name.toLowerCase().includes(query)) ||
        prescription.diagnoses?.some((d: { condition?: string } | string) =>
          typeof d === 'object' ? (d.condition ?? '').toLowerCase().includes(query) : String(d).toLowerCase().includes(query)
        ) ||
        doctor?.name?.toLowerCase().includes(query) ||
        (isAdmin && patient?.name?.toLowerCase().includes(query))
      )
    }

    return true
  })

  const paginationMeta = (prescriptions as any)?.pagination || null
  const totalPages = paginationMeta?.totalPages || 1

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              flexShrink: 0,
            }}
          >
            <MedicationIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {isDoctor ? 'Prescriptions' : 'My Prescriptions'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Track and manage medical prescriptions
            </Typography>
          </Box>
        </Box>
        {isDoctor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/prescriptions/create')}
            sx={{
              ...btnSx,
              py: 1.2,
              px: 3,
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669', transform: 'translateY(-1px)' },
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
            }}
          >
            Create Prescription
          </Button>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by medication, diagnosis or doctor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px' }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Prescriptions</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleResetFilters}
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
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={loadPrescriptions}
              startIcon={<RefreshIcon />}
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
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredPrescriptions.length === 0 ? (
        <Paper
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            textAlign: 'center',
            py: 8,
            px: 3,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              mx: 'auto',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.08) 100%)',
            }}
          >
            <HistoryIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.7 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No prescriptions found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you are looking for.'
              : 'You don\'t have any medical prescriptions in your records yet.'}
          </Typography>
          {(searchQuery || statusFilter !== 'all') && (
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {filteredPrescriptions.map((prescription: Prescription) => {
              const prescriptionId = prescription._id || prescription.id
              const doctor = typeof prescription.doctorId === 'object' ? prescription.doctorId : null
              const patient = typeof prescription.patientId === 'object' ? prescription.patientId : null
              const leftColor = prescription.isActive ? '#10b981' : '#94a3b8'

              return (
                <Grid size={{ xs: 12 }} key={prescriptionId}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderLeft: `4px solid ${leftColor}`,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ p: 2.5 }}>
                      <Grid container spacing={3} alignItems="center">
                        {/* Status & Date */}
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Prescribed On
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {prescription.createdAt ? dayjs(prescription.createdAt).format('MMM D, YYYY') : '—'}
                          </Typography>
                          <Chip
                            label={prescription.isActive ? 'Active' : 'Inactive'}
                            color={prescription.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ mt: 1, fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }}
                          />
                        </Grid>

                        {/* Doctor/Patient Info */}
                        <Grid size={{ xs: 12, sm: 3.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                mr: 2,
                                width: 44,
                                height: 44,
                                background: `linear-gradient(135deg, ${leftColor}CC, ${leftColor})`,
                                fontWeight: 700,
                                fontSize: '1rem',
                                boxShadow: `0 3px 10px ${leftColor}33`,
                              }}
                            >
                              {doctor?.name?.charAt(0) || 'D'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {doctor?.name ? `Dr. ${doctor.name}` : 'Unknown Doctor'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {doctor?.specialization?.replace('-', ' ').toUpperCase() || 'General Practitioner'}
                              </Typography>
                              {isAdmin && patient && (
                                <Typography variant="caption" display="block" color="primary.main" sx={{ mt: 0.5, fontWeight: 600 }}>
                                  Patient: {patient.name}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>

                        {/* Medications */}
                        <Grid size={{ xs: 12, sm: 3.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Medications
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {prescription.medications && prescription.medications.length > 0 ? (
                              <>
                                <Chip
                                  icon={<MedicationIcon sx={{ fontSize: '14px !important' }} />}
                                  label={`${prescription.medications.length} Item(s)`}
                                  size="small"
                                  sx={{ fontWeight: 600, bgcolor: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                                />
                                {prescription.medications.slice(0, 2).map((m, idx) => (
                                  <Typography key={idx} variant="caption" sx={{ display: 'block', color: 'text.secondary', ml: 0.5 }}>
                                    • {m.name}
                                  </Typography>
                                ))}
                                {prescription.medications.length > 2 && (
                                  <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                                    + {prescription.medications.length - 2} more
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="body2" color="text.disabled">No medications listed</Typography>
                            )}
                          </Box>
                        </Grid>

                        {/* Actions */}
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                          <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                            <Tooltip title="Download PDF">
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(prescriptionId!)}
                                disabled={downloading}
                                sx={{
                                  bgcolor: 'rgba(16,185,129,0.08)',
                                  color: '#10b981',
                                  '&:hover': { bgcolor: 'rgba(16,185,129,0.15)' }
                                }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                              onClick={() => navigate(`/prescriptions/${prescriptionId}`)}
                              sx={{
                                ...btnSx,
                                bgcolor: 'primary.main',
                                boxShadow: '0 2px 8px rgba(30,41,59,0.25)',
                                '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(30,41,59,0.35)' },
                              }}
                            >
                              Details
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, gap: 1 }}>
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, minWidth: 40, px: 2 }}
              >
                &laquo; Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  size="small"
                  variant={page === pageNum ? 'contained' : 'text'}
                  onClick={() => handlePageChange(pageNum)}
                  sx={{
                    minWidth: 40, borderRadius: '10px', fontWeight: 700,
                    ...(page === pageNum && { boxShadow: '0 2px 8px rgba(30,41,59,0.25)' }),
                  }}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, minWidth: 40, px: 2 }}
              >
                Next &raquo;
              </Button>
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default PrescriptionListPage

