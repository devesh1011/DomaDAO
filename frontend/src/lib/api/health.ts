/**
 * Health API Service
 * System health and status checks
 */

import { apiClient } from '../api-client'
import type { HealthStatus } from '../api-types'

export const healthApi = {
  /**
   * Get basic health check
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get('/health/health')
  },

  /**
   * Get detailed system status
   */
  async getStatus(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>('/health/status')
  },
}
