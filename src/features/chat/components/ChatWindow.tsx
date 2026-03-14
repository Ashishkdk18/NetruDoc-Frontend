import React, { useEffect, useMemo, useRef } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../../store'
import { fetchMessages, messageReceived } from '../chatSlice'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { useSocket, useSocketEvent } from '../../../hooks/useSocket'

const ChatWindow: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { activeConversationId, messagesByConversation, loadingMessages, conversations } = useSelector(
    (state: RootState) => state.chat
  )
  const { user } = useSelector((state: RootState) => state.auth)
  const lastLoadedConversationIdRef = useRef<string | null>(null)

  const currentMessages = useMemo(() => {
    if (!activeConversationId) return []
    const data = messagesByConversation[activeConversationId]
    return data?.items || []
  }, [activeConversationId, messagesByConversation])

  const conversationTitle = useMemo(() => {
    if (!activeConversationId) return 'Conversation'
    const currentUserId =
      (user as any)?.id || (user as any)?._id || (user as any)?.userId || (user as any)?.user?.id

    const conv =
      conversations?.items?.find(
        (c: any) => (c as any).id === activeConversationId || (c as any)._id === activeConversationId
      ) || null

    const participants = (conv?.participants || []).map((p: any) => {
      if (typeof p === 'string') return { id: p, name: undefined }
      return { id: p.id || p._id, name: p.name }
    })

    const others = participants.filter((p) => p.id && String(p.id) !== String(currentUserId))
    if (others.length === 1) return others[0].name || 'Conversation'
    if (others.length > 1) {
      const names = others.map((p) => p.name).filter(Boolean) as string[]
      return names.length > 0 ? names.join(', ') : 'Group conversation'
    }
    return 'Conversation'
  }, [activeConversationId, conversations, user])

  const { emit } = useSocket()

  // Load initial messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return
    // Guard against StrictMode double-invocation and avoid refetching already loaded conversations
    if (lastLoadedConversationIdRef.current !== activeConversationId) {
      lastLoadedConversationIdRef.current = activeConversationId
      dispatch(fetchMessages({ conversationId: activeConversationId, params: { page: 1, limit: 50 } }))
    }

    // Join conversation room on server
    emit('chat:joinConversation', { conversationId: activeConversationId })
  }, [activeConversationId, dispatch, emit])

  // Listen for real-time messages
  useSocketEvent<{ conversationId: string; message: any }>('chat:messageCreated', (payload) => {
    if (!payload?.conversationId || !payload.message) return
    dispatch(
      messageReceived({
        conversationId: payload.conversationId,
        message: {
          ...payload.message,
          id: payload.message.id || payload.message._id,
        },
      })
    )
  })

  const handleSend = (content: string) => {
    if (!activeConversationId) return
    emit('chat:sendMessage', {
      conversationId: activeConversationId,
      content,
      contentType: 'text',
    })
  }

  if (!activeConversationId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a conversation to start chatting.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {conversationTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Secure, real-time chat between you and your doctor/patient.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {loadingMessages ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <MessageList messages={currentMessages} />
        )}
      </Box>

      <MessageInput onSend={handleSend} />
    </Box>
  )
}

export default ChatWindow

