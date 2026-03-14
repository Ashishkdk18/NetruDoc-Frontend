import apiClient from './apiClient'
import { NotificationResponse, ApiResponse, PaginatedApiResponse, NotificationType } from '../types/api'
import { PaginationParams } from '../utils/pagination'

interface CreateNotificationRequest {
  userId: string
  title: string
  message: string
  type: NotificationType
}

export interface GetNotificationsParams extends PaginationParams {
  unreadOnly?: boolean
  type?: NotificationType
}

class NotificationService {
  // Get user's notifications with pagination
  async getNotifications<T = NotificationResponse>(
    params?: GetNotificationsParams
  ): Promise<PaginatedApiResponse<T>> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly.toString())
    if (params?.type) queryParams.append('type', params.type)

    const queryString = queryParams.toString()
    const url = queryString ? `/notifications?${queryString}` : '/notifications'
    
    return apiClient.get<{ items: T[]; pagination: any }>(url)
  }

  // Get notification by ID
  async getNotification(notificationId: string): Promise<ApiResponse<NotificationResponse>> {
    return apiClient.get<NotificationResponse>(`/notifications/${notificationId}`)
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<{ notification: NotificationResponse }>> {
    return apiClient.put<{ notification: NotificationResponse }>(`/notifications/${notificationId}/read`)
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse> {
    return apiClient.put('/notifications/read-all')
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse> {
    return apiClient.delete(`/notifications/${notificationId}`)
  }

  // Create notification (Admin only)
  async createNotification(notificationData: CreateNotificationRequest): Promise<ApiResponse<NotificationResponse>> {
    return apiClient.post<NotificationResponse>('/notifications', notificationData)
  }

  // Get unread notification count
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>('/notifications/unread-count')
  }

  // Get notifications by type (with pagination)
  async getNotificationsByType<T = NotificationResponse>(
    type: NotificationType,
    params?: PaginationParams
  ): Promise<PaginatedApiResponse<T>> {
    return this.getNotifications<T>({ ...params, type })
  }
}

const notificationService = new NotificationService()
export default notificationService
