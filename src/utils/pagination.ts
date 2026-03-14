import { useState, useCallback } from 'react'
import { PaginationMeta, PaginatedResponse } from '../types/api'

/**
 * Generic pagination parameters interface
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  [key: string]: any // Allow additional filter params
}

/**
 * Generic pagination state hook
 * @param initialPage - Initial page number (default: 1)
 * @param initialLimit - Initial items per page (default: 20)
 * @returns Pagination state and handlers
 */
export function usePagination<_T = any>(
  initialPage: number = 1,
  initialLimit: number = 20
) {
  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1))
  }, [])

  const resetPagination = useCallback(() => {
    setPage(initialPage)
  }, [initialPage])

  const updateLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when limit changes
  }, [])

  return {
    page,
    limit,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    updateLimit,
  }
}

/**
 * Generic pagination metadata helper
 */
export function getPaginationMeta<T>(
  paginatedData: PaginatedResponse<T> | null
): PaginationMeta | null {
  if (!paginatedData?.pagination) return null
  return paginatedData.pagination
}

/**
 * Generic function to check if pagination has next page
 */
export function hasNextPage<T>(
  paginatedData: PaginatedResponse<T> | null
): boolean {
  const meta = getPaginationMeta(paginatedData)
  return meta?.hasNextPage ?? false
}

/**
 * Generic function to check if pagination has previous page
 */
export function hasPrevPage<T>(
  paginatedData: PaginatedResponse<T> | null
): boolean {
  const meta = getPaginationMeta(paginatedData)
  return meta?.hasPrevPage ?? false
}

/**
 * Generic function to get items from paginated response
 */
export function getPaginatedItems<T>(
  paginatedData: PaginatedResponse<T> | null
): T[] {
  return paginatedData?.items ?? []
}

/**
 * Generic function to get total count from paginated response
 */
export function getTotalCount<T>(
  paginatedData: PaginatedResponse<T> | null
): number {
  const meta = getPaginationMeta(paginatedData)
  return meta?.total ?? 0
}

/**
 * Generic function to get total pages from paginated response
 */
export function getTotalPages<T>(
  paginatedData: PaginatedResponse<T> | null
): number {
  const meta = getPaginationMeta(paginatedData)
  return meta?.totalPages ?? 0
}
