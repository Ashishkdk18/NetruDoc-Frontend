import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

import { RootState, AppDispatch } from '../../../store'
import { getNotifications, getUnreadCount, markAsRead, notificationReceived } from '../notificationSlice'
import { getPaginatedItems } from '../../../utils/pagination'
import { NotificationResponse } from '../../../types/api'
import { useSocketEvent } from '../../../hooks/useSocket'

const NotificationDropdown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const {
    notifications,
    unreadCount,
    loading,
  } = useSelector((state: RootState) => state.notifications)

  const notificationItems = getPaginatedItems(notifications)
  const latestNotifications = notificationItems.slice(0, 5) // Show latest 5 in dropdown

  // Load unread count on mount and periodically
  useEffect(() => {
    dispatch(getUnreadCount())
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      dispatch(getUnreadCount())
    }, 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  // Subscribe to real-time notifications via Socket.IO
  useSocketEvent<NotificationResponse>('notification', (notification) => {
    dispatch(notificationReceived(notification))
  })

  // Load notifications when dropdown opens
  useEffect(() => {
    if (open) {
      dispatch(getNotifications({ page: 1, limit: 5, sort: '-createdAt' }))
    }
  }, [open, dispatch])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = async (notification: NotificationResponse) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await dispatch(markAsRead(notification.id))
      dispatch(getUnreadCount()) // Refresh count
    }

    handleClose()

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const handleViewAll = () => {
    handleClose()
    navigate('/notifications')
  }

  const formatNotificationTime = (dateString: string): string => {
    try {
      return dayjs(dateString).fromNow()
    } catch {
      return dateString
    }
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label="notifications"
          aria-controls={open ? 'notification-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="notification-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 500,
            overflow: 'auto',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                {unreadCount} new
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : latestNotifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No notifications
                </Typography>
              }
            />
          </MenuItem>
        ) : (
          latestNotifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                '&:hover': {
                  bgcolor: notification.isRead ? 'action.hover' : 'action.selected',
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: notification.isRead ? 'transparent' : 'primary.main',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: notification.isRead ? 400 : 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {notification.title}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {notification.message}
                    <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                      {formatNotificationTime(notification.createdAt)}
                    </Box>
                  </Typography>
                }
              />
            </MenuItem>
          ))
        )}

        <Divider />

        <MenuItem onClick={handleViewAll}>
          <ListItemIcon>
            <ArrowForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View All Notifications" />
        </MenuItem>
      </Menu>
    </>
  )
}

export default NotificationDropdown
