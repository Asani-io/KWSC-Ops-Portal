import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { authUtils } from '../utils/auth'

// Types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    token: string
    role: string
    employee: {
      id: string
      fullName: string
      email: string
      role: string
      status: string
    }
  }
}

export interface DashboardMetrics {
  success: boolean
  data: {
    pendingReviews: number
    assignedReviews: number
    pendingTickets: number
    resolvedToday: number
    totalUsers: number
    activeUsers: number
  }
}

export interface RecentActivity {
  success: boolean
  data: Array<{
    type: string
    message: string
    siteId?: string
    createdAt: string
  }>
}

export interface PendingReviews {
  success: boolean
  data: Array<{
    id: string
    siteId: string
    status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    createdAt: string
    reviewType: 'MANUAL_VERIFICATION' | 'NEW_SITE_VERIFICATION'
    existingSiteId?: string | null
    createdByUserName: string
    fullAddress: string
  }>
}

export interface ReviewDetails {
  success: boolean
  data: {
    id: string
    siteId: string
    fullAddress: string
    status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    createdAt: string
    createdByUserName: string
    createdByConsumerNo?: string | null
    createdByUserType: string
    site: {
      areaId: number
      areaName: string
      blockId: number
      blockName: string
      houseNo?: string
      street?: string
      nearestLandmark?: string
      additionalDirections?: string
      pinLat?: number
      pinLng?: number
      pinAccuracyM?: number
      pinCapturedAt?: string
      plotKey?: string
    }
    documents: Array<{
      id: string
      imageData: string | null // Base64 format: "data:image/png;base64,..."
    }>
  }
}

export interface ReviewActionResponse {
  success: boolean
  data: {
    status: 'APPROVED' | 'REJECTED'
  }
}

export interface UpdateSiteDetailsRequest {
  areaId?: number
  blockId?: number
  houseNo?: string
  street?: string
  nearestLandmark?: string
  additionalDirections?: string
  pinLat?: number
  pinLng?: number
  pinAccuracyM?: number
}

export interface UpdateSiteDetailsResponse {
  success: boolean
  data: {
    id: string
    areaId: number
    blockId: number
    houseNo?: string
    street?: string
    nearestLandmark?: string
    additionalDirections?: string
    pinLat?: number
    pinLng?: number
    pinAccuracyM?: number
    area: {
      id: number
      name: string
    }
    block: {
      id: number
      name: string
    }
    status: string
    updatedAt: string
  }
}

export interface ApiError {
  success: false
  error: string
  message: string
}

// API Client
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Build headers as a plain object
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Convert options.headers to plain object if it exists
    if (options.headers) {
      if (options.headers instanceof Headers) {
        // If it's a Headers object, convert to plain object
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        // If it's an array of tuples, convert to plain object
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        // If it's already a plain object, spread it
        Object.assign(headers, options.headers)
      }
    }

    // Add authorization token if required
    if (requireAuth) {
      const token = authUtils.getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      console.log('API Request:', { url, method: config.method, body: config.body })
      
      const response = await fetch(url, config)
      
      console.log('API Response:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      // Try to parse JSON response
      let data: any
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
        console.log('API Response Data:', data)
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.ok) {
        // Handle error response
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
        
        // Don't log 404 errors to console - they're expected in some cases
        if (response.status !== 404) {
          console.error('API Error:', errorMessage)
        }
        
        throw new Error(errorMessage)
      }

      return data as T
    } catch (error) {
      console.error('API Request Failed:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred')
    }
  }

  // Login API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('Login request:', { 
      url: `${this.baseURL}${API_ENDPOINTS.LOGIN}`,
      credentials: { ...credentials, password: '***' } 
    })
    
    return this.request<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
      credentials: 'include', // Include cookies if needed
    })
  }

  // Dashboard Metrics API
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>(
      API_ENDPOINTS.DASHBOARD_METRICS,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Recent Activity API
  async getRecentActivity(limit: number = 20): Promise<RecentActivity> {
    return this.request<RecentActivity>(
      `${API_ENDPOINTS.DASHBOARD_RECENT_ACTIVITY}?limit=${limit}`,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Get Reviewer Overview API
  async getReviewerOverview(): Promise<any> {
    return this.request<any>(
      API_ENDPOINTS.REVIEWER_OVERVIEW,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Get Pending Reviews API (Reviewer Module)
  async getPendingReviews(): Promise<PendingReviews> {
    return this.request<PendingReviews>(
      API_ENDPOINTS.PENDING_REVIEWS,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Get Review Details API (Reviewer Module)
  async getReviewDetails(reviewId: string): Promise<ReviewDetails> {
    return this.request<ReviewDetails>(
      `${API_ENDPOINTS.REVIEW_DETAILS}/${reviewId}`,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Approve Review API (Reviewer Module)
  async approveReview(reviewId: string, notes: string = ''): Promise<ReviewActionResponse> {
    return this.request<ReviewActionResponse>(
      `${API_ENDPOINTS.REVIEW_ACTION}/${reviewId}/action`,
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve',
          notes: notes || 'Site approved by reviewer',
        }),
      },
      true // Require authentication
    )
  }

  // Reject Review API (Reviewer Module)
  async rejectReview(reviewId: string, notes: string): Promise<ReviewActionResponse> {
    return this.request<ReviewActionResponse>(
      `${API_ENDPOINTS.REVIEW_ACTION}/${reviewId}/action`,
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          notes: notes,
        }),
      },
      true // Require authentication
    )
  }

  // Update Site Details API (Reviewer Module)
  async updateSiteDetails(siteId: string, updates: UpdateSiteDetailsRequest): Promise<UpdateSiteDetailsResponse> {
    return this.request<UpdateSiteDetailsResponse>(
      `${API_ENDPOINTS.UPDATE_SITE_DETAILS}/${siteId}/update-details`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      true // Require authentication
    )
  }

  // Get All Areas API
  async getAllAreas(): Promise<any> {
    return this.request<any>(
      API_ENDPOINTS.GET_AREAS,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Get Blocks by Area API
  async getBlocksByArea(areaId: number): Promise<any> {
    return this.request<any>(
      `${API_ENDPOINTS.GET_BLOCKS_BY_AREA}/${areaId}/blocks`,
      {
        method: 'GET',
      },
      true // Require authentication
    )
  }

  // Logout API - Silently handles errors since we always want to clear local auth
  async logout(): Promise<{ success: boolean }> {
    const url = `${this.baseURL}${API_ENDPOINTS.LOGOUT}`
    const token = authUtils.getToken()
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
      })
      
      // Try to parse response, but don't throw errors
      if (response.ok) {
        try {
          const data = await response.json()
          return data as { success: boolean }
        } catch {
          return { success: true }
        }
      } else {
        // Even if response is not ok, return success: false but don't throw
        return { success: false }
      }
    } catch (error) {
      // Silently handle any errors - we'll still clear local auth
      return { success: false }
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

