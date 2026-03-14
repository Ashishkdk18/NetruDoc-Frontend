import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  InputAdornment,
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab'
import {
  LocalHospital as ConsultationIcon,
  Medication as PrescriptionIcon,
  Event as AppointmentIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Description as RecordsIcon,
} from '@mui/icons-material'
import { AppDispatch, RootState } from '../../../store/index'
import { getMedicalRecords, clearError } from '../medicalRecordsSlice'
import {
  ConsultationRecord,
  PrescriptionRecord,
  AppointmentRecord,
  MedicalHistoryRecord,
  MedicalRecord,
  MedicalRecordType,
} from '../types/medicalRecordsTypes'
import dayjs from 'dayjs'

const MedicalRecordsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId?: string }>()
  const dispatch = useDispatch<AppDispatch>()

  const { records, loading, error } = useSelector((state: RootState) => state.medicalRecords)

  const [filterType, setFilterType] = useState<MedicalRecordType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(getMedicalRecords(patientId || undefined))
    return () => {
      dispatch(clearError())
    }
  }, [dispatch, patientId])

  const getRecordIcon = (type: MedicalRecordType) => {
    switch (type) {
      case 'consultation':
        return <ConsultationIcon />
      case 'prescription':
        return <PrescriptionIcon />
      case 'appointment':
        return <AppointmentIcon />
      case 'medical_history':
        return <HistoryIcon />
      default:
        return null
    }
  }

  const getRecordColor = (type: MedicalRecordType) => {
    switch (type) {
      case 'consultation':
        return 'primary'
      case 'prescription':
        return 'success'
      case 'appointment':
        return 'info'
      case 'medical_history':
        return 'warning'
      default:
        return 'grey'
    }
  }

  const getRecordDate = (record: MedicalRecord): Date => {
    if (record.recordType === 'consultation') {
      return new Date((record as ConsultationRecord).startTime || (record as ConsultationRecord).createdAt)
    }
    if (record.recordType === 'prescription') {
      return new Date((record as PrescriptionRecord).createdAt)
    }
    if (record.recordType === 'appointment') {
      return new Date((record as AppointmentRecord).date || (record as AppointmentRecord).createdAt)
    }
    if (record.recordType === 'medical_history') {
      return new Date((record as MedicalHistoryRecord).diagnosedDate || new Date(0))
    }
    return new Date(0)
  }

  const btnSx = {
    borderRadius: '10px',
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
  }

  const cardSx = {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'all 0.25s ease',
    '&:hover': {
      boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
      transform: 'translateY(-2px)',
    },
    overflow: 'hidden',
  }

  const filteredRecords = records?.records.filter((record) => {
    // Filter by type
    if (filterType !== 'all' && record.recordType !== filterType) {
      return false
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      if (record.recordType === 'consultation') {
        const r = record as ConsultationRecord
        return (
          r.notes?.toLowerCase().includes(query) ||
          r.diagnosis?.some((d) => d.toLowerCase().includes(query)) ||
          r.symptoms?.some((s) => s.toLowerCase().includes(query)) ||
          r.doctorId?.name?.toLowerCase().includes(query)
        )
      }
      if (record.recordType === 'prescription') {
        const r = record as PrescriptionRecord
        return (
          r.medications?.some((m) => m.name.toLowerCase().includes(query)) ||
          r.diagnoses?.some((d) => d.condition.toLowerCase().includes(query)) ||
          r.doctorId?.name?.toLowerCase().includes(query)
        )
      }
      if (record.recordType === 'appointment') {
        const r = record as AppointmentRecord
        return (
          r.reason?.toLowerCase().includes(query) ||
          r.doctorId?.name?.toLowerCase().includes(query)
        )
      }
      if (record.recordType === 'medical_history') {
        const r = record as MedicalHistoryRecord
        return (
          r.condition?.toLowerCase().includes(query) ||
          r.notes?.toLowerCase().includes(query)
        )
      }
      return false
    }

    return true
  }) || []

  const renderRecordContent = (record: MedicalRecord) => {
    switch (record.recordType) {
      case 'consultation': {
        const r = record as ConsultationRecord
        return (
          <Card sx={{ ...cardSx, borderLeft: '4px solid #8b5cf6' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Consultation</Typography>
                <Chip label={r.status} size="small" sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem', bgcolor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Doctor:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{r.doctorId?.name || 'N/A'}</Typography>
              </Box>
              {r.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{r.notes.length > 150 ? `${r.notes.substring(0, 150)}...` : r.notes}"
                </Typography>
              )}
              {r.diagnosis && r.diagnosis.length > 0 && (
                <Box sx={{ mt: 1, mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    DIAGNOSIS
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {r.diagnosis.map((d, idx) => (
                      <Chip key={idx} label={d} size="small" sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }} />
                    ))}
                  </Box>
                </Box>
              )}
              {r.symptoms && r.symptoms.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    SYMPTOMS
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {r.symptoms.map((s, idx) => (
                      <Chip key={idx} label={s} size="small" variant="outlined" sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }} />
                    ))}
                  </Box>
                </Box>
              )}
              {r._id && (
                <Button
                  component={Link}
                  to={`/consultations/${r._id}`}
                  size="small"
                  sx={{ ...btnSx, p: 0, minWidth: 0, mt: 1.5, color: '#8b5cf6', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                >
                  View full report →
                </Button>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'prescription': {
        const r = record as PrescriptionRecord
        return (
          <Card sx={{ ...cardSx, borderLeft: '4px solid #10b981' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Prescription</Typography>
                <Chip label={r.isActive ? 'Active' : 'Inactive'} size="small" color={r.isActive ? 'success' : 'default'} sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Doctor:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{r.doctorId?.name || 'N/A'}</Typography>
              </Box>
              {r.medications && r.medications.length > 0 && (
                <Box sx={{ mt: 1.5, mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    MEDICATIONS
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {r.medications.map((med, idx) => (
                      <Typography key={idx} variant="body2" sx={{ fontSize: '0.85rem' }}>
                        • <strong>{med.name}</strong> • {med.dosage} ({med.frequency})
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
              {r.diagnoses && r.diagnoses.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {r.diagnoses.map((d, idx) => (
                      <Chip key={idx} label={d.condition} size="small" variant="outlined" sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'appointment': {
        const r = record as AppointmentRecord
        return (
          <Card sx={{ ...cardSx, borderLeft: '4px solid #3b82f6' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Appointment</Typography>
                <Chip label={r.status} size="small" sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem', bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Doctor:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{r.doctorId?.name || 'N/A'}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                {dayjs(r.date).format('MMMM D, YYYY')} at {r.time}
              </Typography>
              {r.reason && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Reason: {r.reason}
                </Typography>
              )}
              {r._id && (
                <Button
                  component={Link}
                  to={`/appointments/${r._id}`}
                  size="small"
                  sx={{ ...btnSx, p: 0, minWidth: 0, mt: 1.5, color: '#3b82f6', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                >
                  View appointment details →
                </Button>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'medical_history': {
        const r = record as MedicalHistoryRecord
        return (
          <Card sx={{ ...cardSx, borderLeft: '4px solid #f59e0b', bgcolor: 'rgba(245,158,11,0.02)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#f59e0b' }}>
                Medical History
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{r.condition}</Typography>
              {r.diagnosedDate && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                  DIAGNOSED: {dayjs(r.diagnosedDate).format('MMMM D, YYYY')}
                </Typography>
              )}
              {r.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2, borderLeft: '3px solid #f59e0b' }}>
                  {r.notes}
                </Typography>
              )}
            </CardContent>
          </Card>
        )
      }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      </Container>
    )
  }

  if (!records) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">No medical records found</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
            flexShrink: 0,
          }}
        >
          <RecordsIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Medical Records
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {patientId ? `Viewing records for ${records.patientName}` : 'Your complete medical history and timeline'}
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        {[
          { label: 'Consultations', value: records.summary.totalConsultations, color: '#8b5cf6', icon: <ConsultationIcon /> },
          { label: 'Prescriptions', value: records.summary.totalPrescriptions, color: '#10b981', icon: <PrescriptionIcon /> },
          { label: 'Appointments', value: records.summary.totalAppointments, color: '#3b82f6', icon: <AppointmentIcon /> },
          { label: 'History Items', value: records.summary.medicalHistoryItems, color: '#f59e0b', icon: <HistoryIcon /> },
        ].map((item, idx) => (
          <Grid key={idx} size={{ xs: 6, sm: 3 }}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '4px',
                  bgcolor: item.color,
                }
              }}
            >
              <Box sx={{ color: item.color, opacity: 0.8, mb: 0.5 }}>
                {item.icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
                {item.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                {item.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
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
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by diagnosis, symptoms, medications, or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                label="Filter by Type"
                onChange={(e) => setFilterType(e.target.value as MedicalRecordType | 'all')}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="all">All Records</MenuItem>
                <MenuItem value="consultation">Consultations Only</MenuItem>
                <MenuItem value="prescription">Prescriptions Only</MenuItem>
                <MenuItem value="appointment">Appointments Only</MenuItem>
                <MenuItem value="medical_history">Medical History Items</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Timeline */}
      {filteredRecords.length === 0 ? (
        <Alert severity="info">No records found matching your filters</Alert>
      ) : (
        <Timeline sx={{ p: 0 }}>
          {filteredRecords.map((record, index) => {
            const date = getRecordDate(record)
            const color = getRecordColor(record.recordType) as any
            return (
              <TimelineItem key={index}>
                <TimelineOppositeContent sx={{ flex: { xs: 0, sm: 0.15 }, px: 0, pt: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block' }}>
                    {dayjs(date).format('MMM D')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {dayjs(date).format('YYYY')}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot
                    color={color}
                    sx={{
                      p: 1.2,
                      boxShadow: `0 0 0 4px rgba(${color === 'primary' ? '139,92,246' : color === 'success' ? '16,185,129' : '59,130,246'}, 0.1)`,
                    }}
                  >
                    {React.isValidElement(getRecordIcon(record.recordType)) && 
                      React.cloneElement(getRecordIcon(record.recordType) as React.ReactElement<any>, { 
                        sx: { fontSize: 18 } 
                      })
                    }
                  </TimelineDot>
                  {index < filteredRecords.length - 1 && <TimelineConnector sx={{ bgcolor: 'divider', width: 2 }} />}
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: { xs: 1, sm: 3 } }}>
                  {renderRecordContent(record)}
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      )}
    </Container>
  )
}

export default MedicalRecordsPage
