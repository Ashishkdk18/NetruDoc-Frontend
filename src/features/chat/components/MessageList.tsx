import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import type { ChatMessage } from '../api/chatApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store'

interface MessageListProps {
  messages: ChatMessage[]
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { user } = useSelector((state: RootState) => state.auth)

  const currentUserId =
    (user as any)?.id || (user as any)?._id || (user as any)?.userId || (user as any)?.user?.id

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        px: 2,
        py: 2,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 1,
      }}
    >
      {messages.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No messages yet. Start the conversation.
          </Typography>
        </Box>
      )}

      {messages.map((message) => {
        const isOwn = message.senderId === currentUserId
        const alignment = isOwn ? 'flex-end' : 'flex-start'

        return (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: alignment,
              mb: 1,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                maxWidth: '70%',
                px: 1.5,
                py: 1,
                bgcolor: isOwn ? 'primary.main' : 'background.paper',
                color: isOwn ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 0.5, opacity: 0.7, textAlign: 'right' }}
              >
                {new Date(message.sentAt || message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Paper>
          </Box>
        )
      })}
    </Box>
  )
}

export default MessageList

