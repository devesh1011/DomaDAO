/**
 * API Client Configuration
 * Centralized API setup with error handling and type safety
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export interface ApiError {
  message: string
  status: number
  data?: unknown
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText || 'API request failed',
        status: response.status,
      }

      try {
        const errorData = await response.json()
        error.data = errorData
        error.message = errorData.message || error.message
      } catch {
        // If parsing error response fails, use default message
      }

      throw error
    }

    const jsonResponse = await response.json()
    
    // Handle backend API response format { success: true, data: ... }
    if (jsonResponse && typeof jsonResponse === 'object' && 'success' in jsonResponse && 'data' in jsonResponse) {
      return jsonResponse.data as T
    }

    return jsonResponse as T
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseURL}${path}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return this.handleResponse<T>(response)
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return this.handleResponse<T>(response)
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()
