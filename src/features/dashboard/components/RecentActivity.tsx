import React from 'react'
import { Box, Typography, Chip, IconButton } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import VisibilityIcon from '@mui/icons-material/Visibility'

export interface RecentActivityItem {
  id: string
  title: string
  subtitle?: string
  timestamp?: string
  statusLabel?: string
  statusColor?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  link?: string
}

export interface RecentActivityProps {
  title: string
  items: RecentActivityItem[]
  emptyMessage: string
}

const RecentActivity: React.FC<RecentActivityProps> = ({ title, items, emptyMessage }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                {item.subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {item.subtitle}
                  </Typography>
                )}
                {item.timestamp && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.timestamp}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.statusLabel && (
                  <Chip
                    size="small"
                    label={item.statusLabel}
                    color={item.statusColor || 'default'}
                    variant="filled"
                    sx={{ fontWeight: 600, borderRadius: '6px' }}
                  />
                )}
                {item.link && (
                  <IconButton
                    size="small"
                    component={RouterLink}
                    to={item.link}
                    aria-label="View details"
                    sx={{
                       bgcolor: 'background.default',
                       '&:hover': { bgcolor: 'primary.50', color: 'primary.main' }
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default RecentActivity

