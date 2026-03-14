import React, { useEffect } from 'react'
import { Box, Container,  Grid, Paper, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { AppDispatch, RootState } from '../../../store'
import ConversationList from '../components/ConversationList'
import ChatWindow from '../components/ChatWindow'
import { setActiveConversation } from '../chatSlice'
import chatApi from '../api/chatApi'

const ChatPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const conversationId = searchParams.get('conversationId')
    const doctorId = searchParams.get('doctorId')
    const appointmentId = searchParams.get('appointmentId')

    if (conversationId) {
      dispatch(setActiveConversation(conversationId))
      return
    }

    // If navigated from an appointment with doctor context, create/get a conversation first
    if (doctorId && user) {
      ;(async () => {
        try {
          const { conversation } = await chatApi.createOrGetConversation({
            participantIds: [doctorId],
            metadata: appointmentId ? { appointmentId } : {},
          })
          const convId = conversation.id || (conversation as any)._id
          dispatch(setActiveConversation(convId))
          // Replace URL with stable conversationId-based URL
          const params = new URLSearchParams()
          params.set('conversationId', convId)
          navigate(`/chat?${params.toString()}`, { replace: true })
        } catch (error) {
          console.error('Failed to create or get conversation from appointment context', error)
        }
      })()
    }
  }, [dispatch, navigate, searchParams, user])

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Messages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Secure messaging between patients and doctors, with real-time updates.
      </Typography>

      <Paper
        sx={{
          mt: 2,
          height: { xs: 500, md: 600 },
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <Grid container sx={{ flex: 1, minHeight: 0 }}>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
              height: '100%',
              minHeight: 0,
            }}
          >
            <ConversationList />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} sx={{ height: '100%', minHeight: 0 }}>
            <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ChatWindow />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default ChatPage

