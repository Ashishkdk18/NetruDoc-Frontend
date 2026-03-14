import apiClient from '../../../services/apiClient'
import { PaginatedResponse } from '../../../types/api'

export interface Conversation {
  id: string
  participants: Array<
    | string
    | {
        id?: string
        _id?: string
        name?: string
        role?: 'patient' | 'doctor' | 'admin'
        profilePicture?: string
        specialization?: string
      }
  >
  lastMessageAt?: string
  lastMessagePreview?: string
  metadata?: Record<string, any>
  isArchived?: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  contentType: 'text' | 'image' | 'file' | 'system'
  status: 'sent' | 'delivered' | 'read'
  sentAt: string
  deliveredAt?: string
  readAt?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface GetConversationsParams {
  page?: number
  limit?: number
  sort?: string
  search?: string
}

export interface GetMessagesParams {
  page?: number
  limit?: number
}

class ChatApi {
  async getConversations(
    params?: GetConversationsParams
  ): Promise<PaginatedResponse<Conversation>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.search) queryParams.append('search', params.search)

    const response = await apiClient.get<PaginatedResponse<Conversation>>(
      `/chat/conversations?${queryParams.toString()}`
    )
    return response.data
  }

  async createOrGetConversation(payload: {
    participantIds: string[]
    metadata?: Record<string, any>
  }): Promise<{ conversation: Conversation }> {
    const response = await apiClient.post<{ conversation: Conversation }>(
      '/chat/conversations',
      payload
    )
    return response.data
  }

  async getMessages(
    conversationId: string,
    params?: GetMessagesParams
  ): Promise<PaginatedResponse<Message>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get<PaginatedResponse<Message>>(
      `/chat/conversations/${conversationId}/messages?${queryParams.toString()}`
    )
    return response.data
  }

  // Optional HTTP fallback for sending messages (useful for testing or non-socket flows)
  async sendMessageHttp(
    conversationId: string,
    payload: { content: string; contentType?: string; metadata?: Record<string, any> }
  ): Promise<{ message: Message }> {
    const response = await apiClient.post<{ message: Message }>(
      `/chat/conversations/${conversationId}/messages`,
      payload
    )
    return response.data
  }
}

const chatApi = new ChatApi()
export default chatApi
export type { Conversation as ChatConversation, Message as ChatMessage }

