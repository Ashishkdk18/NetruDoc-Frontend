import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ApiResponse, ApiError, ApiConfig } from '../types/api'

// Default API configuration
const defaultConfig: ApiConfig = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
}

// Log current API configuration for debugging
if (import.meta.env.DEV) {
    console.log('API Client configured with baseURL:', defaultConfig.baseURL)
}

class ApiClient {
    private client: AxiosInstance

    constructor(config: Partial<ApiConfig> = {}) {
        const mergedConfig = { ...defaultConfig, ...config }

        this.client = axios.create({
            baseURL: mergedConfig.baseURL,
            timeout: mergedConfig.timeout,
            headers: mergedConfig.headers,
        })

        this.setupInterceptors()
    }

    // Setup axios interceptors for request/response handling
    private setupInterceptors(): void {
        // Request interceptor - add auth token if available
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token')
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // Response interceptor - handle standardized responses
        this.client.interceptors.response.use(
            (response: AxiosResponse<ApiResponse>) => {
                // Return the data directly since it's already in our standardized format
                return response
            },
            (error: AxiosError) => {
                // Handle different types of errors
                if (error.response) {
                    // Server responded with error status
                    const apiError = error.response.data as ApiError
                    return Promise.reject(apiError)
                } else if (error.request) {
                    // Network error
                    const networkError: ApiError = {
                        status: 'error',
                        message: 'Network error - please check your connection',
                        data: {}
                    }
                    return Promise.reject(networkError)
                } else {
                    // Something else happened
                    const unknownError: ApiError = {
                        status: 'error',
                        message: error.message || 'An unknown error occurred',
                        data: {}
                    }
                    return Promise.reject(unknownError)
                }
            }
        )
    }

    // Generic request method
    private async request<T = any>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.request<ApiResponse<T>>({
                method,
                url,
                data,
                ...config,
            })
            return response.data
        } catch (error) {
            throw error
        }
    }

    // HTTP method wrappers
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('GET', url, undefined, config)
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('POST', url, data, config)
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', url, data, config)
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', url, data, config)
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', url, undefined, config)
    }

    // Utility methods for common operations
    setAuthToken(token: string): void {
        try {
            if (!token || typeof token !== 'string') {
                throw new Error('Invalid token provided');
            }
            localStorage.setItem('token', token)
        } catch (error) {
            console.error('Failed to store token:', error);
            throw error;
        }
    }

    removeAuthToken(): void {
        localStorage.removeItem('token')
    }

    getAuthToken(): string | null {
        return localStorage.getItem('token')
    }

    // Health check
    async healthCheck(): Promise<ApiResponse<{ timestamp: string; environment: string; version: string }>> {
        return this.get('/health')
    }
}

// Create and export a default instance
const apiClient = new ApiClient()

export default apiClient
export { ApiClient }
