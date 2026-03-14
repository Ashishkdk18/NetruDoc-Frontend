import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import notificationService, { GetNotificationsParams } from '../../services/notificationService'
import { NotificationResponse, PaginatedResponse } from '../../types/api'

interface NotificationState {
  notifications: PaginatedResponse<NotificationResponse> | null
  unreadCount: number
  loading: boolean
  loadingUnreadCount: boolean
  markingAsRead: boolean
  markingAllAsRead: boolean
  deleting: boolean
  error: string | null
}

const initialState: NotificationState = {
  notifications: null,
  unreadCount: 0,
  loading: false,
  loadingUnreadCount: false,
  markingAsRead: false,
  markingAllAsRead: false,
  deleting: false,
  error: null,
}

// Async thunks
export const getNotifications = createAsyncThunk<
  PaginatedResponse<NotificationResponse>,
  GetNotificationsParams | undefined,
  { rejectValue: string }
>(
  'notifications/getNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications<NotificationResponse>(params)
      return response.data
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch notifications'
      return rejectWithValue(message)
    }
  }
)

export const getUnreadCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>(
  'notifications/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadCount()
      return response.data.count
    } catch (error: any) {
      const message = error?.message || 'Failed to fetch unread count'
      return rejectWithValue(message)
    }
  }
)

export const markAsRead = createAsyncThunk<
  NotificationResponse,
  string,
  { rejectValue: string }
>(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAsRead(notificationId)
      return response.data.notification
    } catch (error: any) {
      const message = error?.message || 'Failed to mark notification as read'
      return rejectWithValue(message)
    }
  }
)

export const markAllAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead()
    } catch (error: any) {
      const message = error?.message || 'Failed to mark all notifications as read'
      return rejectWithValue(message)
    }
  }
)

export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId)
      return notificationId
    } catch (error: any) {
      const message = error?.message || 'Failed to delete notification'
      return rejectWithValue(message)
    }
  }
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    notificationReceived: (state, action: PayloadAction<NotificationResponse>) => {
      const notification = action.payload

      // Prepend to notifications list if already loaded
      if (state.notifications?.items) {
        state.notifications.items = [notification, ...state.notifications.items]
        if (state.notifications.pagination) {
          state.notifications.pagination.total += 1
        }
      }

      // Increment unread count for unread notifications
      if (!notification.isRead) {
        state.unreadCount += 1
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get notifications
      .addCase(getNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.notifications = action.payload
        state.error = null
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch notifications'
      })

      // Get unread count
      .addCase(getUnreadCount.pending, (state) => {
        state.loadingUnreadCount = true
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.loadingUnreadCount = false
        state.unreadCount = action.payload
      })
      .addCase(getUnreadCount.rejected, (state) => {
        state.loadingUnreadCount = false
      })

      // Mark as read
      .addCase(markAsRead.pending, (state) => {
        state.markingAsRead = true
        state.error = null
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.markingAsRead = false
        if (state.notifications?.items) {
          const index = state.notifications.items.findIndex(
            (n) => n.id === action.payload.id || n.id === (action.payload as any)._id
          )
          if (index !== -1) {
            const wasUnread = !state.notifications.items[index].isRead
            state.notifications.items[index] = action.payload
            // Decrement unread count if notification was previously unread
            if (wasUnread) {
              state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
          }
        }
        state.error = null
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.markingAsRead = false
        state.error = action.payload || 'Failed to mark notification as read'
      })

      // Mark all as read
      .addCase(markAllAsRead.pending, (state) => {
        state.markingAllAsRead = true
        state.error = null
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.markingAllAsRead = false
        if (state.notifications?.items) {
          state.notifications.items = state.notifications.items.map((n) => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        }
        state.unreadCount = 0
        state.error = null
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.markingAllAsRead = false
        state.error = action.payload || 'Failed to mark all notifications as read'
      })

      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.deleting = true
        state.error = null
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleting = false
        if (state.notifications?.items) {
          state.notifications.items = state.notifications.items.filter(
            (n) => n.id !== action.payload && n.id !== (action.payload as any)
          )
          // Update pagination total
          if (state.notifications.pagination) {
            state.notifications.pagination.total = Math.max(
              0,
              state.notifications.pagination.total - 1
            )
          }
        }
        state.error = null
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleting = false
        state.error = action.payload || 'Failed to delete notification'
      })
  },
})

export const { clearError, notificationReceived } = notificationSlice.actions
export default notificationSlice.reducer
