import React, { useState } from 'react'
import { Box, IconButton, TextField } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

interface MessageInputProps {
  disabled?: boolean
  onSend: (content: string) => void
}

const MessageInput: React.FC<MessageInputProps> = ({ disabled, onSend }) => {
  const [value, setValue] = useState('')

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Type a message..."
        multiline
        maxRows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <SendIcon />
      </IconButton>
    </Box>
  )
}

export default MessageInput

