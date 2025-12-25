import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Page from '../components/Page'
import StatsCard from '../components/MatricsCard'
import { apiClient } from '../services/api'
import { authUtils } from '../utils/auth'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    pendingReviews: 0,
    assignedReviews: 0,
    pendingTickets: 0,
    resolvedToday: 0,
    totalUsers: 0,
    activeUsers: 0,
  })
  const [, setRecentActivity] = useState<Array<{
    type: string
    message: string
    siteId?: string
    createdAt: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Prevent double fetch in StrictMode
    if (fetchingRef.current) {
      return
    }
    fetchingRef.current = true

    let isCancelled = false

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch metrics and recent activity in parallel
        const [metricsResponse, activityResponse] = await Promise.all([
          apiClient.getDashboardMetrics(),
          apiClient.getRecentActivity(10),
        ])

        // Don't update state if component unmounted or cancelled
        if (isCancelled) return

        if (metricsResponse.success && metricsResponse.data) {
          setMetrics(metricsResponse.data)
        }

        if (activityResponse.success && activityResponse.data) {
          setRecentActivity(activityResponse.data)
        }
      } catch (err) {
        // Don't update state if component unmounted or cancelled
        if (isCancelled) return

        if (err instanceof Error) {
          setError(err.message)
          // If unauthorized, clear auth and redirect
          if (err.message.includes('Unauthorized') || err.message.includes('401')) {
            authUtils.clearAuth()
            window.location.href = '/login'
          }
        } else {
          setError('Failed to load dashboard data')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboardData()

    // Cleanup function
    return () => {
      isCancelled = true
      fetchingRef.current = false
    }
  }, [])

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleString('en-PK', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //   })
  // }

  const user = authUtils.getUser()

  return (
    <Page>
      <DashboardLayout>
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.fullName || 'User'}!
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {isLoading ? (
              // Skeleton Cards
              Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-card-${index}`} className="bg-white rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-24"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="bg-gray-100 rounded-full p-3">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <StatsCard
                  title="Pending Reviews"
                  value={metrics.pendingReviews}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <StatsCard
                  title="Pending Tickets"
                  value={metrics.pendingTickets}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                />

                <StatsCard
                  title="Resolved Today"
                  value={metrics.resolvedToday}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />

                <StatsCard
                  title="Total Users"
                  value={metrics.totalUsers}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                  iconBgColor="bg-indigo-100"
                  iconColor="text-indigo-600"
                />

                <StatsCard
                  title="Active Users"
                  value={metrics.activeUsers}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />
              </>
            )}
          </div>

          {/* Recent Activity */}
          {/* {isLoading ? (
            // Skeleton Recent Activity
            <div className="bg-white rounded-lg shadow-soft p-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-40"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`skeleton-activity-${index}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-full"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            recentActivity.length > 0 && (
              <div className="bg-white rounded-lg shadow-soft p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )} */}
        </div>
      </DashboardLayout>
    </Page>
  )
}

