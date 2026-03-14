import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Button } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import CreatePrescriptionForm from '../components/CreatePrescriptionForm'

const CreatePrescriptionPage: React.FC = () => {
  const { patientId } = useParams<{ patientId?: string }>()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(true)

  const handleClose = () => {
    setDialogOpen(false)
    navigate(-1)
  }

  const handleSuccess = () => {
    navigate('/prescriptions')
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Prescription
        </Typography>
      </Box>

      <CreatePrescriptionForm
        open={dialogOpen}
        onClose={handleClose}
        patientId={patientId}
        onSuccess={handleSuccess}
      />
    </Container>
  )
}

export default CreatePrescriptionPage
