import React from 'react'
import { Box, Container, Typography, Grid, Link } from '@mui/material'
import { LocalHospital, Phone, Email, LocationOn } from '@mui/icons-material'

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" color="text.primary">
                NetruDoc
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Smart Healthcare Appointment & Consultation System
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <Link href="/doctors" color="inherit" display="block" sx={{ mb: 1 }}>
              Find Doctors
            </Link>
            <Link href="/appointments" color="inherit" display="block" sx={{ mb: 1 }}>
              Book Appointment
            </Link>
            <Link href="/consultations" color="inherit" display="block">
              Virtual Consultation
            </Link>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Services
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Online Appointments
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Video Consultations
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Digital Prescriptions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Payment Processing
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                +977-1234567890
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                support@netrudoc.com
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                Kathmandu, Nepal
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} NetruDoc. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
