import { useState, useCallback } from 'react'
import { ApiResponse, ApiError } from '../types/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<ApiResponse<T> | void>
  reset: () => void
}

/**
 * Custom hook for handling API calls with consistent error handling
 * @param apiFunction - The API service function to call
 * @param initialData - Initial data value
 * @returns Object with data, loading, error states and execute function
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiFunction(...args)
      setState({
        data: response.data,
        loading: false,
        error: null,
      })
      return response
    } catch (error) {
      const apiError = error as ApiError
      setState({
        data: initialData,
        loading: false,
        error: apiError,
      })
      throw apiError
    }
  }, [apiFunction, initialData])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    })
  }, [initialData])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Hook for handling multiple API calls
 */
export function useMultiApi() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, ApiError | null>>({})

  const execute = useCallback(async (
    key: string,
    apiFunction: (...args: any[]) => Promise<ApiResponse<any>>,
    ...args: any[]
  ) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }))
    setErrors(prev => ({ ...prev, [key]: null }))

    try {
      const response = await apiFunction(...args)
      setLoadingStates(prev => ({ ...prev, [key]: false }))
      return response
    } catch (error) {
      const apiError = error as ApiError
      setLoadingStates(prev => ({ ...prev, [key]: false }))
      setErrors(prev => ({ ...prev, [key]: apiError }))
      throw apiError
    }
  }, [])

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }))
      setErrors(prev => ({ ...prev, [key]: null }))
    } else {
      setLoadingStates({})
      setErrors({})
    }
  }, [])

  return {
    loadingStates,
    errors,
    execute,
    reset,
    isLoading: (key: string) => loadingStates[key] || false,
    getError: (key: string) => errors[key],
  }
}

/**
 * Hook for handling form submissions with API calls
 */
export function useApiForm<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  onSuccess?: (data: T) => void,
  onError?: (error: ApiError) => void
) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<ApiError | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const submit = useCallback(async (...args: any[]) => {
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const response = await apiFunction(...args)
      setSubmitSuccess(true)
      onSuccess?.(response.data)
      return response
    } catch (error) {
      const apiError = error as ApiError
      setSubmitError(apiError)
      onError?.(apiError)
      throw apiError
    } finally {
      setSubmitting(false)
    }
  }, [apiFunction, onSuccess, onError])

  const reset = useCallback(() => {
    setSubmitting(false)
    setSubmitError(null)
    setSubmitSuccess(false)
  }, [])

  return {
    submit,
    submitting,
    submitError,
    submitSuccess,
    reset,
  }
}
