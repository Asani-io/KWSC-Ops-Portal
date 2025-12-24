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
    status: string
    priority: string
    createdAt: string
    site: {
      id: string
      houseNo: string
      street: string
      area: { id: number; name: string }
      block: { id: number; name: string }
    }
    currentAssigneeEmployeeId?: string
  }>
}

export interface ReviewDetails {
  success: boolean
  data: any // Will be properly typed based on API response
}

export interface ReviewActionResponse {
  success: boolean
  data: {
    id: string
    status: string
    site?: {
      id: string
      status: string
    }
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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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
  async updateSiteDetails(siteId: string, updates: {
    areaId?: number
    blockId?: number
    houseNo?: string
    street?: string
    nearestLandmark?: string
    additionalDirections?: string
    pinLat?: number
    pinLng?: number
    pinAccuracyM?: number
  }): Promise<any> {
    return this.request<any>(
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
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

