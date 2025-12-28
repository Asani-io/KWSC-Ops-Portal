import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Page from '../components/Page'
import StatsCard from '../components/MatricsCard'
import ReviewsByStatusChart from '../components/ReviewsByStatusChart'
import WeeklyPerformanceChart from '../components/WeeklyPerformanceChart'
import { apiClient } from '../services/api'
import { authUtils } from '../utils/auth'

interface ReviewerOverview {
  summary: {
    totalPending: number
    totalUnderReview: number
    totalApproved: number
    totalRejected: number
    pendingToday: number
    approvedToday: number
    rejectedToday: number
    pendingThisWeek: number
    approvedThisWeek: number
    rejectedThisWeek: number
  }
  kpis: {
    reviewerId: string
    totalAssigned: number
    totalClosed: number
    currentlyAssigned: number
    pendingUnassigned: number
    overdueReviews: number
    today: {
      closed: number
      approved: number
      rejected: number
      target: number
      achievement: number
      status: string
    }
    thisWeek: {
      closed: number
      approved: number
      rejected: number
      target: number
      achievement: number
      dailyAverage: number
    }
    thisMonth: {
      closed: number
      approved: number
      rejected: number
    }
    reviewStats: {
      approvalRate: number
      rejectionRate: number
      averageReviewTimeSeconds: number
      averageReviewTimeFormatted: string
    }
    performance: {
      dailyAverage: number
      targetDailyAverage: number
      efficiency: number
      slaCompliance: {
        rate: number
        compliantReviews: number
        totalEvaluated: number
        thresholdHours: number
      }
    }
    reviewsByStatus: {
      pending: number
      underReview: number
      approved: number
      rejected: number
    }
  }
  recentReviews: Array<{
    id: string
    siteId: string
    status: string
    site: {
      id: string
      areaId: number
      blockId: number
      houseNo?: string
      status: string
      area: {
        id: number
        name: string
      }
      block: {
        id: number
        name: string
      }
      createdBy: {
        id: string
        firstName?: string
        lastName?: string
      }
    }
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<ReviewerOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    if (fetchingRef.current) {
      return
    }
    fetchingRef.current = true

    let isCancelled = false

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await apiClient.getReviewerOverview()

        if (isCancelled) return

        if (response.success && response.data) {
          setOverview(response.data)
        }
      } catch (err) {
        if (isCancelled) return

        if (err instanceof Error) {
          setError(err.message)
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

    return () => {
      isCancelled = true
      fetchingRef.current = false
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Prepare chart data - filter out zero values
  const statusChartData = overview ? [
    { name: 'Approved', value: overview.kpis.reviewsByStatus.approved, color: '#10b981' },
    { name: 'Rejected', value: overview.kpis.reviewsByStatus.rejected, color: '#ef4444' },
    { name: 'Under Review', value: overview.kpis.reviewsByStatus.underReview, color: '#3b82f6' },
    { name: 'Pending', value: overview.kpis.reviewsByStatus.pending, color: '#f59e0b' },
  ].filter(item => item.value > 0) : []

  const weeklyPerformanceData = overview ? [
    {
      name: 'This Week',
      Approved: overview.kpis.thisWeek.approved,
      Rejected: overview.kpis.thisWeek.rejected,
    },
  ] : []

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

          {isLoading ? (
            // Skeleton Loading
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
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
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ) : overview ? (
            <>
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Pending"
                  value={overview.summary.totalPending}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                />

                <StatsCard
                  title="Under Review"
                  value={overview.summary.totalUnderReview}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />

                <StatsCard
                  title="Total Approved"
                  value={overview.summary.totalApproved}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <StatsCard
                  title="Total Rejected"
                  value={overview.summary.totalRejected}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                />
              </div>

              {/* Today's Performance Cards */}
              {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Pending Today"
                  value={overview.summary.pendingToday}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                />

                <StatsCard
                  title="Approved Today"
                  value={overview.summary.approvedToday}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                />

                <StatsCard
                  title="Rejected Today"
                  value={overview.summary.rejectedToday}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                />

                <StatsCard
                  title="Closed Today"
                  value={overview.kpis.today.closed}
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />
              </div> */}

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ReviewsByStatusChart data={statusChartData} />
                <WeeklyPerformanceChart data={weeklyPerformanceData} />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance KPIs</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Efficiency</span>
                        <span className="text-lg font-bold text-gray-900">
                          {overview.kpis.performance.efficiency.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(overview.kpis.performance.efficiency, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">SLA Compliance</span>
                        <span className="text-lg font-bold text-gray-900">
                          {overview.kpis.performance.slaCompliance.rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${overview.kpis.performance.slaCompliance.rate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {overview.kpis.performance.slaCompliance.compliantReviews} / {overview.kpis.performance.slaCompliance.totalEvaluated} reviews
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Daily Average</span>
                        <span className="text-lg font-bold text-gray-900">
                          {overview.kpis.performance.dailyAverage.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Target: {overview.kpis.performance.targetDailyAverage} reviews/day
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Statistics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Approval Rate</span>
                        <span className="text-lg font-bold text-green-600">
                          {overview.kpis.reviewStats.approvalRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${overview.kpis.reviewStats.approvalRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Rejection Rate</span>
                        <span className="text-lg font-bold text-red-600">
                          {overview.kpis.reviewStats.rejectionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${overview.kpis.reviewStats.rejectionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Avg Review Time</span>
                        <span className="text-lg font-bold text-gray-900">
                          {overview.kpis.reviewStats.averageReviewTimeFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Assigned</span>
                      <span className="text-lg font-bold text-gray-900">{overview.kpis.totalAssigned}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Closed</span>
                      <span className="text-lg font-bold text-gray-900">{overview.kpis.totalClosed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Currently Assigned</span>
                      <span className="text-lg font-bold text-blue-600">{overview.kpis.currentlyAssigned}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Pending Unassigned</span>
                      <span className="text-lg font-bold text-yellow-600">{overview.kpis.pendingUnassigned}</span>
                    </div>
                    {overview.kpis.overdueReviews > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-red-600">Overdue Reviews</span>
                        <span className="text-lg font-bold text-red-600">{overview.kpis.overdueReviews}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Today's Achievement</span>
                        <span className={`text-lg font-bold ${
                          overview.kpis.today.status === 'BELOW_TARGET' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {overview.kpis.today.achievement}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Target: {overview.kpis.today.target} reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reviews */}
              {overview.recentReviews && overview.recentReviews.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
                  <div className="space-y-3">
                    {overview.recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(review.status)}`}>
                              {review.status.replace('_', ' ')}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {review.site.houseNo ? `${review.site.houseNo}, ` : ''}
                                {review.site.block?.name}, {review.site.area?.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created by: {review.site.createdBy?.firstName} {review.site.createdBy?.lastName}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-soft text-center py-12">
              <p className="text-gray-600">No data available</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </Page>
  )
}
