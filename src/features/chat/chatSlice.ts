import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import chatApi, { ChatConversation, ChatMessage, GetConversationsParams, GetMessagesParams } from './api/chatApi'
import { PaginatedResponse } from '../../types/api'

export interface ChatState {
  conversations: PaginatedResponse<ChatConversation> | null
  activeConversationId: string | null
  messagesByConversation: Record<string, PaginatedResponse<ChatMessage> | null>
  loadingConversations: boolean
  loadingMessages: boolean
  sending: boolean
  error: string | null
}

const initialState: ChatState = {
  conversations: null,
  activeConversationId: null,
  messagesByConversation: {},
  loadingConversations: false,
  loadingMessages: false,
  sending: false,
  error: null,
}

const getMessageId = (message: ChatMessage): string | undefined => {
  return (message as any)?.id || (message as any)?._id
}

const hasMessage = (items: ChatMessage[] | undefined, messageId: string): boolean => {
  if (!items || items.length === 0) return false
  return items.some((m) => getMessageId(m) === messageId)
}

export const fetchConversations = createAsyncThunk<
  PaginatedResponse<ChatConversation>,
  GetConversationsParams | undefined,
  { rejectValue: string }
>('chat/fetchConversations', async (params, { rejectWithValue }) => {
  try {
    return await chatApi.getConversations(params)
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch conversations'
    return rejectWithValue(message)
  }
})

export const fetchMessages = createAsyncThunk<
  { conversationId: string; response: PaginatedResponse<ChatMessage> },
  { conversationId: string; params?: GetMessagesParams },
  { rejectValue: string }
>('chat/fetchMessages', async ({ conversationId, params }, { rejectWithValue }) => {
  try {
    const response = await chatApi.getMessages(conversationId, params)
    return { conversationId, response }
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch messages'
    return rejectWithValue(message)
  }
})

export const sendMessageHttp = createAsyncThunk<
  { conversationId: string; message: ChatMessage },
  { conversationId: string; content: string; contentType?: string },
  { rejectValue: string }
>('chat/sendMessageHttp', async ({ conversationId, content, contentType }, { rejectWithValue }) => {
  try {
    const { message } = await chatApi.sendMessageHttp(conversationId, { content, contentType })
    return { conversationId, message }
  } catch (error: any) {
    const message = error?.message || 'Failed to send message'
    return rejectWithValue(message)
  }
})

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload
    },
    clearChatError: (state) => {
      state.error = null
    },
    messageReceived: (
      state,
      action: PayloadAction<{ conversationId: string; message: ChatMessage }>
    ) => {
      const { conversationId, message } = action.payload

      const existing = state.messagesByConversation[conversationId]
      const messageId = getMessageId(message)

      if (existing?.items) {
        if (messageId && hasMessage(existing.items, messageId)) {
          return
        }
        // Prepend newest message if messages are sorted descending by sentAt
        existing.items.unshift(message)
      } else {
        state.messagesByConversation[conversationId] = {
          items: [message],
          pagination: {
            page: 1,
            limit: 50,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        }
      }

      // Update conversation preview if available
      if (state.conversations?.items) {
        const idx = state.conversations.items.findIndex(
          (c) => c.id === conversationId || (c as any)._id === conversationId
        )
        if (idx !== -1) {
          const conv = state.conversations.items[idx]
          state.conversations.items[idx] = {
            ...conv,
            lastMessagePreview: message.content,
            lastMessageAt: message.sentAt || new Date().toISOString(),
          }
        }
      }
    },
    conversationRead: (
      _state,
      _action: PayloadAction<{ conversationId: string; userId: string; modifiedCount?: number }>
    ) => {
      // For now we don't track per-user read state in detail on the frontend.
      // This reducer exists to support future UI indicators if needed.
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false
        state.conversations = action.payload
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false
        state.error = action.payload || 'Failed to fetch conversations'
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false
        const { conversationId, response } = action.payload
        // Ensure we don't render duplicate keys (can happen when a socket event inserts a message
        // that also exists in the fetched history, or if the backend returns duplicates).
        const seen = new Set<string>()
        const dedupedItems = (response.items || []).filter((m) => {
          const id = getMessageId(m)
          if (!id) return true
          if (seen.has(id)) return false
          seen.add(id)
          return true
        })
        state.messagesByConversation[conversationId] = { ...response, items: dedupedItems }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false
        state.error = action.payload || 'Failed to fetch messages'
      })
      .addCase(sendMessageHttp.pending, (state) => {
        state.sending = true
        state.error = null
      })
      .addCase(sendMessageHttp.fulfilled, (state, action) => {
        state.sending = false
        const { conversationId, message } = action.payload
        const existing = state.messagesByConversation[conversationId]
        if (existing?.items) {
          const messageId = getMessageId(message)
          if (messageId && hasMessage(existing.items, messageId)) {
            return
          }
          existing.items.unshift(message)
        } else {
          state.messagesByConversation[conversationId] = {
            items: [message],
            pagination: {
              page: 1,
              limit: 50,
              total: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }
        }
      })
      .addCase(sendMessageHttp.rejected, (state, action) => {
        state.sending = false
        state.error = action.payload || 'Failed to send message'
      })
  },
})

export const { setActiveConversation, clearChatError, messageReceived, conversationRead } =
  chatSlice.actions

export default chatSlice.reducer

