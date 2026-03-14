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
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  Divider,
  Pagination,
  Tooltip,
  Snackbar,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

import { RootState, AppDispatch } from '../../../store'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearError,
} from '../notificationSlice'
import { usePagination, getPaginatedItems, getTotalPages } from '../../../utils/pagination'
import { NotificationResponse, NotificationType } from '../../../types/api'

const typeColors: Record<NotificationType, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  appointment_created: 'primary',
  appointment_confirmed: 'success',
  appointment_cancelled: 'error',
  appointment_reminder: 'warning',
  appointment_reschedule_requested: 'warning',
  appointment_reschedule_approved: 'success',
  appointment_reschedule_rejected: 'error',
  consultation_started: 'primary',
  consultation_ended: 'primary',
  prescription_created: 'success',
  payment_success: 'success',
  payment_failed: 'error',
  system_announcement: 'primary',
  message: 'primary',
  other: 'default',
} as const

const typeIcons: Record<NotificationType, React.ReactNode> = {
  appointment_created: <InfoIcon />,
  appointment_confirmed: <SuccessIcon />,
  appointment_cancelled: <ErrorIcon />,
  appointment_reminder: <WarningIcon />,
  appointment_reschedule_requested: <WarningIcon />,
  appointment_reschedule_approved: <SuccessIcon />,
  appointment_reschedule_rejected: <ErrorIcon />,
  consultation_started: <InfoIcon />,
  consultation_ended: <InfoIcon />,
  prescription_created: <SuccessIcon />,
  payment_success: <SuccessIcon />,
  payment_failed: <ErrorIcon />,
  system_announcement: <InfoIcon />,
  message: <InfoIcon />,
  other: <InfoIcon />,
} as const

const typeLabels: Record<NotificationType, string> = {
  appointment_created: 'Appointment Created',
  appointment_confirmed: 'Appointment Confirmed',
  appointment_cancelled: 'Appointment Cancelled',
  appointment_reminder: 'Appointment Reminder',
  appointment_reschedule_requested: 'Reschedule Requested',
  appointment_reschedule_approved: 'Reschedule Approved',
  appointment_reschedule_rejected: 'Reschedule Rejected',
  consultation_started: 'Consultation Started',
  consultation_ended: 'Consultation Ended',
  prescription_created: 'Prescription Created',
  payment_success: 'Payment Success',
  payment_failed: 'Payment Failed',
  system_announcement: 'System Announcement',
  message: 'Message',
  other: 'Other',
} as const

const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const { page, limit, goToPage } = usePagination<NotificationResponse>(1, 20)
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const {
    notifications,
    unreadCount,
    loading,
    markingAsRead,
    markingAllAsRead,
    deleting,
    error,
  } = useSelector((state: RootState) => state.notifications)

  const notificationItems = getPaginatedItems(notifications)
  const totalPages = getTotalPages(notifications)

  // Load notifications and unread count on mount and when filters/page change
  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, readFilter, typeFilter])

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const loadNotifications = () => {
    const params: any = {
      page,
      limit,
      sort: '-createdAt', // Latest first
    }

    if (readFilter === 'unread') {
      params.unreadOnly = true
    } else if (readFilter === 'read') {
      // Backend doesn't have readOnly filter, so we'll filter client-side
      // Or we could add a backend filter for this
    }

    if (typeFilter !== 'all') {
      params.type = typeFilter
    }

    dispatch(getNotifications(params)).catch((error) => {
      console.error('Failed to load notifications:', error)
    })
  }

  const loadUnreadCount = () => {
    dispatch(getUnreadCount())
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap()
      setSnackbarMessage('Notification marked as read')
      setSnackbarOpen(true)
      loadUnreadCount() // Refresh unread count
    } catch (error) {
      setSnackbarMessage('Failed to mark notification as read')
      setSnackbarOpen(true)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap()
      setSnackbarMessage('All notifications marked as read')
      setSnackbarOpen(true)
      loadNotifications() // Refresh list
      loadUnreadCount() // Refresh unread count
    } catch (error) {
      setSnackbarMessage('Failed to mark all notifications as read')
      setSnackbarOpen(true)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap()
      setSnackbarMessage('Notification deleted')
      setSnackbarOpen(true)
      loadNotifications() // Refresh list
      loadUnreadCount() // Refresh unread count
    } catch (error) {
      setSnackbarMessage('Failed to delete notification')
      setSnackbarOpen(true)
    }
  }

  const handleNotificationClick = (notification: NotificationResponse) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const formatNotificationTime = (dateString: string): string => {
    try {
      return dayjs(dateString).fromNow()
    } catch {
      return dateString
    }
  }

  // Filter read/unread client-side if needed (when backend doesn't support it)
  const filteredNotifications =
    readFilter === 'read'
      ? notificationItems.filter((n) => n.isRead)
      : readFilter === 'unread'
      ? notificationItems.filter((n) => !n.isRead)
      : notificationItems

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {filteredNotifications.some((n) => !n.isRead) && (
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handleMarkAllAsRead}
              disabled={markingAllAsRead}
            >
              {markingAllAsRead ? 'Marking...' : 'Mark All as Read'}
            </Button>
          )}
          <Button startIcon={<RefreshIcon />} onClick={loadNotifications} variant="outlined">
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={readFilter}
                  label="Status"
                  onChange={(e) => {
                    setReadFilter(e.target.value as 'all' | 'read' | 'unread')
                    goToPage(1) // Reset to first page when filter changes
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="unread">Unread</MenuItem>
                  <MenuItem value="read">Read</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => {
                    setTypeFilter(e.target.value as NotificationType | 'all')
                    goToPage(1) // Reset to first page when filter changes
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {(Object.keys(typeLabels) as NotificationType[]).map((type) => (
                    <MenuItem key={type} value={type}>
                      {typeLabels[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {readFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters to see more notifications.'
                : "You're all caught up! No notifications at the moment."}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Notifications List */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <List>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                        cursor: notification.link ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: notification.isRead ? 'action.hover' : 'action.selected',
                        },
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                        <Box
                          sx={{
                            color: typeColors[notification.type] || 'default',
                            mt: 0.5,
                          }}
                        >
                          {typeIcons[notification.type] || <InfoIcon />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                              {notification.title}
                            </Typography>
                            {!notification.isRead && (
                              <Chip label="New" color="primary" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                            )}
                            {notification.priority && notification.priority !== 'medium' && (
                              <Chip
                                label={notification.priority}
                                size="small"
                                color={notification.priority === 'urgent' ? 'error' : notification.priority === 'high' ? 'warning' : 'default'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatNotificationTime(notification.createdAt)}
                            </Typography>
                            {notification.type && (
                              <Chip
                                label={typeLabels[notification.type] || notification.type}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {!notification.isRead && (
                              <Tooltip title="Mark as read">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.id)
                                  }}
                                  disabled={markingAsRead}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton
                                edge="end"
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(notification.id)
                                }}
                                disabled={deleting}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </Box>
                    </ListItem>
                    {index < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => goToPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default NotificationsPage
