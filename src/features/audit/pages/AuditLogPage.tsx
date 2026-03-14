import React, { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Stack
} from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import apiClient from '../../../services/apiClient'

interface AuditLog {
  _id: string
  entityType: string
  entityId: string
  action: string
  userId?: {
    _id: string
    name: string
    email: string
    role: string
  }
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp: string
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [rowCount, setRowCount] = useState(0)
  const [entityType, setEntityType] = useState<string>('') 
  const [action, setAction] = useState<string>('') 
  const [search, setSearch] = useState<string>('') 

  const fetchLogs = async (pageParam = page, pageSizeParam = pageSize) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (pageParam + 1).toString())
      params.append('limit', pageSizeParam.toString())
      if (entityType) params.append('entityType', entityType)
      if (action) params.append('action', action)
      if (search) params.append('search', search)

      const res = await apiClient.get<{ items: AuditLog[]; pagination: { total?: number } }>(`/audit/logs?${params.toString()}`)
      const payload = (res as any).data
      const items = payload?.items ?? []
      const pagination = payload?.pagination ?? {}

      setLogs(items)
      setRowCount(pagination.total || 0)
    } catch (error) {
      console.error('Failed to fetch audit logs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setPage(0)
    fetchLogs(0, pageSize)
  }

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPage(model.page)
    setPageSize(model.pageSize)
    fetchLogs(model.page, model.pageSize)
  }

  const columns: GridColDef<AuditLog>[] = [
    { field: 'timestamp', headerName: 'Time', flex: 1, valueGetter: (_value, row) => new Date(row.timestamp).toLocaleString() },
    {
      field: 'user',
      headerName: 'User',
      flex: 1.4,
      valueGetter: (_value, row) => {
        const u = row.userId
        if (!u) return 'System'
        return `${u.name} (${u.role})`
      }
    },
    { field: 'action', headerName: 'Action', flex: 0.8 },
    { field: 'entityType', headerName: 'Entity', flex: 0.8 },
    { field: 'entityId', headerName: 'Entity ID', flex: 1.2 },
    {
      field: 'ipAddress',
      headerName: 'IP',
      flex: 0.8
    }
  ]

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search (action, entity, IP)"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
          />
          <TextField
            label="Entity Type"
            select
            size="small"
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="appointment">Appointment</MenuItem>
            <MenuItem value="prescription">Prescription</MenuItem>
            <MenuItem value="consultation">Consultation</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            label="Action"
            select
            size="small"
            value={action}
            onChange={e => setAction(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="create">Create</MenuItem>
            <MenuItem value="view">View</MenuItem>
            <MenuItem value="update">Update</MenuItem>
            <MenuItem value="delete">Delete</MenuItem>
            <MenuItem value="download">Download</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleSearch}>
            Apply Filters
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={logs}
          getRowId={(row) => row._id}
          columns={columns}
          loading={loading}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={handlePaginationChange}
          rowCount={rowCount}
          pageSizeOptions={[10, 20, 50]}
        />
      </Paper>
    </Container>
  )
}

export default AuditLogPage

