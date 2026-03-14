import React from 'react'
import { Card, CardContent, Box, Typography } from '@mui/material'

export interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  helperText?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, helperText }) => {
  return (
    <Card
      sx={{
        borderRadius: 4,
        border: 'none',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)',
        },
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.50',
                color: 'primary.main',
                boxShadow: '0 4px 12px rgba(var(--mui-palette-primary-mainChannel) / 0.15)',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
          {value}
        </Typography>
        {helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
            {helperText}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard

