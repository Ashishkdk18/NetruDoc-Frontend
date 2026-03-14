import React from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Box,
  TextField,
  Typography,
  Chip,
  Autocomplete,
  FormControl,
  FormLabel,
  FormHelperText
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

export interface PreConsultationFormData {
  symptoms: string[]
  currentMedications: string[]
  allergies: string[]
  medicalHistory: string
  additionalNotes: string
}

interface PreConsultationFormProps {
  initialValues?: Partial<PreConsultationFormData>
  onSubmit: (values: PreConsultationFormData) => void
  onCancel?: () => void
  submitButtonText?: string
  showCancelButton?: boolean
  disabled?: boolean
}

// Common symptoms list for autocomplete
const commonSymptoms = [
  'Fever', 'Headache', 'Cough', 'Sore throat', 'Runny nose', 'Fatigue',
  'Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Chest pain',
  'Shortness of breath', 'Joint pain', 'Muscle pain', 'Dizziness',
  'Insomnia', 'Anxiety', 'Depression', 'Back pain', 'Skin rash'
]

// Common medications list for autocomplete
const commonMedications = [
  'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
  'Metformin', 'Lisinopril', 'Amlodipine', 'Omeprazole', 'Simvastatin',
  'Levothyroxine', 'Warfarin', 'Insulin', 'Prednisone', 'Albuterol'
]

// Common allergies list for autocomplete
const commonAllergies = [
  'Penicillin', 'Sulfa drugs', 'Aspirin', 'NSAIDs', 'Latex', 'Shellfish',
  'Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Soy', 'Wheat', 'Dust mites',
  'Pollen', 'Animal dander', 'Mold', 'Insect stings'
]

const validationSchema = Yup.object({
  symptoms: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one symptom is required')
    .required('Symptoms are required'),
  currentMedications: Yup.array()
    .of(Yup.string()),
  allergies: Yup.array()
    .of(Yup.string()),
  medicalHistory: Yup.string()
    .max(2000, 'Medical history cannot exceed 2000 characters'),
  additionalNotes: Yup.string()
    .max(1000, 'Additional notes cannot exceed 1000 characters')
})

const PreConsultationForm: React.FC<PreConsultationFormProps> = ({
  initialValues = {},
  onSubmit,
  onCancel,
  submitButtonText = 'Submit',
  showCancelButton = false,
  disabled = false
}) => {
  const formik = useFormik<PreConsultationFormData>({
    initialValues: {
      symptoms: initialValues.symptoms || [],
      currentMedications: initialValues.currentMedications || [],
      allergies: initialValues.allergies || [],
      medicalHistory: initialValues.medicalHistory || '',
      additionalNotes: initialValues.additionalNotes || ''
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values)
    }
  })

  const handleAddCustomItem = (
    field: keyof PreConsultationFormData,
    value: string,
    currentArray: string[]
  ) => {
    if (value.trim() && !currentArray.includes(value.trim())) {
      formik.setFieldValue(field, [...currentArray, value.trim()])
    }
  }

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Pre-Consultation Information
      </Typography>

      {/* Symptoms */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 2, fontWeight: 600 }}>
          Symptoms <Typography component="span" color="error">*</Typography>
        </FormLabel>
        <Autocomplete
          multiple
          freeSolo
          options={commonSymptoms}
          value={formik.values.symptoms}
          onChange={(_, newValue) => {
            formik.setFieldValue('symptoms', newValue)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
              e.preventDefault()
              handleAddCustomItem('symptoms', (e.target as HTMLInputElement).value, formik.values.symptoms)
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              return (
                <Chip
                  key={key}
                  variant="outlined"
                  label={option}
                  {...tagProps}
                  deleteIcon={<CloseIcon />}
                  sx={{ mr: 1, mb: 1 }}
                />
              )
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Type or select symptoms..."
              error={formik.touched.symptoms && Boolean(formik.errors.symptoms)}
              disabled={disabled}
            />
          )}
          disabled={disabled}
        />
        {formik.touched.symptoms && formik.errors.symptoms && (
          <FormHelperText error>{formik.errors.symptoms}</FormHelperText>
        )}
      </FormControl>

      {/* Current Medications */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 2, fontWeight: 600 }}>
          Current Medications
        </FormLabel>
        <Autocomplete
          multiple
          freeSolo
          options={commonMedications}
          value={formik.values.currentMedications}
          onChange={(_, newValue) => {
            formik.setFieldValue('currentMedications', newValue)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
              e.preventDefault()
              handleAddCustomItem('currentMedications', (e.target as HTMLInputElement).value, formik.values.currentMedications)
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              return (
                <Chip
                  key={key}
                  variant="outlined"
                  label={option}
                  {...tagProps}
                  deleteIcon={<CloseIcon />}
                  sx={{ mr: 1, mb: 1 }}
                />
              )
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Type or select current medications..."
              disabled={disabled}
            />
          )}
          disabled={disabled}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          List any medications you are currently taking, including dosage and frequency
        </Typography>
      </FormControl>

      {/* Allergies */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 2, fontWeight: 600 }}>
          Allergies
        </FormLabel>
        <Autocomplete
          multiple
          freeSolo
          options={commonAllergies}
          value={formik.values.allergies}
          onChange={(_, newValue) => {
            formik.setFieldValue('allergies', newValue)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
              e.preventDefault()
              handleAddCustomItem('allergies', (e.target as HTMLInputElement).value, formik.values.allergies)
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              return (
                <Chip
                  key={key}
                  variant="outlined"
                  label={option}
                  {...tagProps}
                  deleteIcon={<CloseIcon />}
                  sx={{ mr: 1, mb: 1 }}
                />
              )
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Type or select known allergies..."
              disabled={disabled}
            />
          )}
          disabled={disabled}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Include allergies to medications, foods, environmental factors, etc.
        </Typography>
      </FormControl>

      {/* Medical History */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 2, fontWeight: 600 }}>
          Medical History
        </FormLabel>
        <TextField
          multiline
          rows={4}
          name="medicalHistory"
          value={formik.values.medicalHistory}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Please describe your relevant medical history, including past illnesses, surgeries, chronic conditions, etc."
          error={formik.touched.medicalHistory && Boolean(formik.errors.medicalHistory)}
          helperText={formik.touched.medicalHistory && formik.errors.medicalHistory}
          disabled={disabled}
          fullWidth
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {formik.values.medicalHistory.length}/2000 characters
        </Typography>
      </FormControl>

      {/* Additional Notes */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 2, fontWeight: 600 }}>
          Additional Notes
        </FormLabel>
        <TextField
          multiline
          rows={3}
          name="additionalNotes"
          value={formik.values.additionalNotes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Any additional information you'd like to share with your doctor..."
          error={formik.touched.additionalNotes && Boolean(formik.errors.additionalNotes)}
          helperText={formik.touched.additionalNotes && formik.errors.additionalNotes}
          disabled={disabled}
          fullWidth
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {formik.values.additionalNotes.length}/1000 characters
        </Typography>
      </FormControl>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
        {showCancelButton && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            style={{
              padding: '12px 24px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#666',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || formik.isSubmitting}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#1976d2',
            color: 'white',
            cursor: (disabled || formik.isSubmitting) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {formik.isSubmitting ? 'Submitting...' : submitButtonText}
        </button>
      </Box>
    </Box>
  )
}

export default PreConsultationForm