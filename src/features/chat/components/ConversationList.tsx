import React, { useEffect } from 'react'
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Typography,
  CircularProgress,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../../store'
import { fetchConversations, setActiveConversation } from '../chatSlice'
import type { ChatConversation } from '../api/chatApi'

interface ConversationListProps {
  onConversationSelected?: (conversation: ChatConversation) => void
}

const ConversationList: React.FC<ConversationListProps> = ({ onConversationSelected }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { conversations, activeConversationId, loadingConversations } = useSelector(
    (state: RootState) => state.chat
  )
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    dispatch(fetchConversations({ page: 1, limit: 20 }))
  }, [dispatch])

  const handleSelect = (conv: ChatConversation) => {
    dispatch(setActiveConversation(conv.id || (conv as any)._id))
    if (onConversationSelected) {
      onConversationSelected(conv)
    }
  }

  const renderParticipantLabel = (conversation: ChatConversation) => {
    const currentUserId =
      (user as any)?.id || (user as any)?._id || (user as any)?.userId || (user as any)?.user?.id

    const participants = (conversation.participants || []).map((p: any) => {
      if (typeof p === 'string') return { id: p, name: undefined }
      return { id: p.id || p._id, name: p.name, role: p.role, specialization: p.specialization }
    })

    const others = participants.filter((p) => p.id && String(p.id) !== String(currentUserId))

    if (others.length === 1) {
      const other = others[0]
      return other?.name || 'Conversation'
    }

    if (others.length > 1) {
      const names = others.map((p) => p.name).filter(Boolean) as string[]
      return names.length > 0 ? names.join(', ') : `Group chat (${others.length})`
    }

    return 'Conversation'
  }

  return (
    <Box
      sx={{
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'background.paper' }}>
            Conversations
          </ListSubheader>
        }
        sx={{ flex: 1, overflowY: 'auto' }}
      >
        {loadingConversations && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loadingConversations && (!conversations || conversations.items.length === 0) && (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet. Start a chat from an appointment or doctor profile.
            </Typography>
          </Box>
        )}

        {conversations?.items.map((conversation) => {
          const id = conversation.id || (conversation as any)._id
          const selected = activeConversationId === id
          return (
            <ListItemButton
              key={id}
              selected={selected}
              onClick={() => handleSelect(conversation)}
              sx={{
                alignItems: 'flex-start',
                py: 1.5,
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{ fontWeight: selected ? 600 : 500 }}
                  >
                    {renderParticipantLabel(conversation)}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {conversation.lastMessagePreview || 'No messages yet'}
                  </Typography>
                }
              />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}

export default ConversationList

