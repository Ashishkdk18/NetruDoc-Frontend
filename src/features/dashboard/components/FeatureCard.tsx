import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardActionArea, CardContent, Box, Typography, Chip } from '@mui/material'

export interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  to?: string
  statsLabel?: string
  statsValue?: string | number
  actionLabel?: string
  onClick?: () => void
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  to,
  statsLabel,
  statsValue,
  actionLabel,
  onClick,
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    if (to) {
      navigate(to)
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
          borderColor: 'primary.main',
        },
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          height: '100%',
          alignItems: 'stretch',
          '&:hover .action-label': {
            transform: 'translateX(4px)',
          }
        }}
      >
        <CardContent
          sx={{
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: '100%'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: '0 4px 12px rgba(var(--mui-palette-primary-mainChannel) / 0.3)',
              }}
            >
              {icon}
            </Box>

            {typeof statsValue !== 'undefined' && (
              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  label={statsValue}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px' }}
                />
                {statsLabel && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                    {statsLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              {title}
            </Typography>

            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                {description}
              </Typography>
            )}

            {actionLabel && (
              <Typography
                className="action-label"
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  transition: 'transform 0.2s ease',
                }}
              >
                {actionLabel} <span style={{ fontSize: '1.2em' }}>→</span>
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default FeatureCard

