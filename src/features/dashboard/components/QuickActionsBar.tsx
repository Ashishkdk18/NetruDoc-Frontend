import React from 'react'
import { Box, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export interface QuickAction {
  label: string
  icon?: React.ReactNode
  to?: string
  onClick?: () => void
  variant?: 'contained' | 'outlined' | 'text'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
}

export interface QuickActionsBarProps {
  actions: QuickAction[]
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ actions }) => {
  const navigate = useNavigate()

  const handleClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
      return
    }
    if (action.to) {
      navigate(action.to)
    }
  }

  if (!actions.length) return null

  return (
    <Box
      sx={{
        width: '100%',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: 2,
        px: { xs: 2, md: 4 },
        position: 'sticky',
        top: 64,
        zIndex: (theme) => theme.zIndex.appBar - 1,
        boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          pb: 0.5, // slight padding bottom for focus rings
        }}
      >
        {actions.map((action) => (
          <Button
            key={action.label}
            size="medium"
            variant={action.variant || 'outlined'}
            color={action.color || 'primary'}
            startIcon={action.icon}
            onClick={() => handleClick(action)}
            sx={{
              whiteSpace: 'nowrap',
              borderRadius: '10px',
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: action.variant === 'contained' ? '0 4px 14px rgba(var(--mui-palette-primary-mainChannel) / 0.4)' : 'none',
              '&:hover': {
                 transform: 'translateY(-2px)',
                 boxShadow: action.variant === 'contained' ? '0 6px 20px rgba(var(--mui-palette-primary-mainChannel) / 0.6)' : 'none',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Box>
  )
}

export default QuickActionsBar

