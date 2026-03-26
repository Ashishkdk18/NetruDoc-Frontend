import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People as PeopleIcon,
  MedicalServices as DoctorIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  adminAnalyticsApi,
  AnalyticsSummary,
  AppointmentByStatus,
  RevenueByMonth,
  TopSpecialty,
  AppointmentsByMonth,
} from '../api/adminAnalyticsApi'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  completed: '#4caf50',
  cancelled: '#f44336',
}

function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

const AdminAnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [byStatus, setByStatus] = useState<AppointmentByStatus[]>([])
  const [byMonth, setByMonth] = useState<AppointmentsByMonth[]>([])
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([])
  const [topSpecialties, setTopSpecialties] = useState<TopSpecialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [sumRes, statusRes, monthRes, revRes, specRes] = await Promise.all([
          adminAnalyticsApi.getSummary(),
          adminAnalyticsApi.getAppointmentsByStatus(),
          adminAnalyticsApi.getAppointmentsByMonth(12),
          adminAnalyticsApi.getRevenueByMonth(),
          adminAnalyticsApi.getTopSpecialties(8),
        ])
        const sumData = (sumRes as { data?: AnalyticsSummary })?.data
        if (sumData) setSummary(sumData)
        const statusItems = (statusRes as { data?: { items?: AppointmentByStatus[] } })?.data?.items
        if (Array.isArray(statusItems)) setByStatus(statusItems)
        const monthItems = (monthRes as { data?: { items?: AppointmentsByMonth[] } })?.data?.items
        if (Array.isArray(monthItems)) setByMonth(monthItems)
        const revItems = (revRes as { data?: { items?: RevenueByMonth[] } })?.data?.items
        if (Array.isArray(revItems)) setRevenueByMonth(revItems)
        const specItems = (specRes as { data?: { items?: TopSpecialty[] } })?.data?.items
        if (Array.isArray(specItems)) setTopSpecialties(specItems)
      } catch (e: unknown) {
        setError((e as { message?: string })?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', minHeight: 320 }}>
        <CircularProgress size={48} />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  const kpis = summary
    ? [
        { label: 'Total Users', value: summary.totalUsers, icon: <PeopleIcon />, color: '#1976d2' },
        { label: 'Doctors', value: summary.totalDoctors, icon: <DoctorIcon />, color: '#2e7d32' },
        { label: 'Patients', value: summary.totalPatients, icon: <PeopleIcon />, color: '#ed6c02' },
        { label: 'Total Appointments', value: summary.totalAppointments, icon: <EventIcon />, color: '#9c27b0' },
        {
          label: 'Completed',
          value: summary.completedAppointments,
          icon: <TrendingIcon />,
          color: '#0288d1',
        },
      ]
    : []

  const revenueNpr = summary?.revenue?.NPR ?? 0
  const revenueUsd = summary?.revenue?.USD ?? 0

  // Chart data: appointments by month with label
  const appointmentsChartData = byMonth.map((d) => ({
    ...d,
    name: formatMonthLabel(d.year, d.month),
  }))

  // Revenue by month: group by year-month, separate NPR and USD for stacked/dual axis
  const revenueByMonthKey: Record<string, { name: string; NPR: number; USD: number }> = {}
  revenueByMonth.forEach((r) => {
    const key = `${r.year}-${r.month}`
    if (!revenueByMonthKey[key]) {
      revenueByMonthKey[key] = {
        name: formatMonthLabel(r.year, r.month),
        NPR: 0,
        USD: 0,
      }
    }
    if (r.currency === 'NPR') revenueByMonthKey[key].NPR = r.total
    else revenueByMonthKey[key].USD = r.total
  })
  const revenueChartData = Object.values(revenueByMonthKey).slice(-12)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Analytics Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Platform usage, appointments, and revenue at a glance
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={kpi.label}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ color: kpi.color, display: 'flex', alignItems: 'center' }}>{kpi.icon}</Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {kpi.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {kpi.value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <MoneyIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Revenue (NPR)
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                Rs. {revenueNpr.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <MoneyIcon sx={{ color: '#1976d2' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Revenue (USD)
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                $ {revenueUsd.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1: Appointments by Status (Bar) + Top Specialties (Bar) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2, height: 360, borderRadius: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Appointments by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {byStatus.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <BarChart data={byStatus} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [Number(value) || 0, 'Count']} />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {byStatus.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || '#757575'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2, height: 360, borderRadius: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Top Specialties (by appointments)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {topSpecialties.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <BarChart
                  data={topSpecialties.map((s) => ({ ...s, name: s.specialization || '—' }))}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 80, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [Number(value) || 0, 'Appointments']} />
                  <Bar dataKey="count" name="Appointments" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2: Appointments over time (Line) + Revenue by month (Bar) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2, height: 360, borderRadius: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Appointments Over Time (last 12 months)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {appointmentsChartData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <LineChart data={appointmentsChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [Number(value) || 0, 'Appointments']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Appointments"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2, height: 360, borderRadius: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Revenue by Month
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {revenueChartData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <ComposedChart data={revenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}K` : v)} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'NPR' ? `Rs. ${Number(value || 0).toLocaleString()}` : `$ ${Number(value || 0).toLocaleString()}`,
                      name ?? '',
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="NPR" name="NPR" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="USD" name="USD" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Pie: Status distribution */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 360, borderRadius: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Appointment Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {byStatus.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value ?? 0}`}
                    labelLine
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || '#757575'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, _name, props) => [Number(value) || 0, (props as { payload?: { status?: string } })?.payload?.status ?? '']} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 360, borderRadius: 2 }} elevation={0} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Top Specialties (pie)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              {topSpecialties.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data</Typography>
                </Box>
              ) : (
                <PieChart>
                  <Pie
                    data={topSpecialties}
                    dataKey="count"
                    nameKey="specialization"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }: { name?: string; value?: number }) => `${name || '—'}: ${value ?? 0}`}
                    labelLine
                  >
                    {topSpecialties.map((_, index) => (
                      <Cell key={index} fill={['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#faf5ff'][index % 8]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, _name, props) => [Number(value) || 0, (props as { payload?: TopSpecialty })?.payload?.specialization || '—']} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminAnalyticsPage
