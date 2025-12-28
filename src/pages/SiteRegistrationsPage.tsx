import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Page from '../components/Page'
import Table, { type TableColumn } from '../components/Table'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import RejectModal from '../components/RejectModal'
import SearchableSelect from '../components/SearchableSelect'
import { apiClient } from '../services/api'
import { authUtils } from '../utils/auth'

// Simplified interface for pending reviews (from getPendingReviews API)
interface PendingReview {
  id: string
  siteId: string
  status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  reviewType: string
  existingSiteId?: string | null
  createdByUserName: string
  fullAddress: string
}

// Detailed interface for review details (from getReviewDetails API)
interface SiteReviewDetail {
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
    imageData: string | null // Base64 format
  }>
}

export default function SiteRegistrationsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([])
  const [selectedReview, setSelectedReview] = useState<SiteReviewDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rejectReviewId, setRejectReviewId] = useState<string | null>(null)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  // Areas and Blocks state for dropdowns
  const [areas, setAreas] = useState<Array<{ id: number; name: string }>>([])
  const [blocks, setBlocks] = useState<Array<{ id: number; name: string; areaId: number }>>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false)

  // Fetch areas on component mount (after login)
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasResponse = await apiClient.getAllAreas()
        if (areasResponse.success && areasResponse.data?.areas) {
          setAreas(areasResponse.data.areas)
        }
      } catch (err) {
        console.error('Failed to fetch areas:', err)
      }
    }

    fetchAreas()
  }, [])

  useEffect(() => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    let isCancelled = false

    const fetchPendingReviews = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiClient.getPendingReviews()

        if (isCancelled) return

        if (response.success && response.data) {
          setReviews(response.data)
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
          setError('Failed to load site registrations')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPendingReviews()

    return () => {
      isCancelled = true
      fetchingRef.current = false
    }
  }, [])

  const handleApprove = async (reviewId: string) => {
    try {
      await apiClient.approveReview(reviewId, 'All documents verified. Site approved.')
      // Refresh the list
      const response = await apiClient.getPendingReviews()
      if (response.success && response.data) {
        setReviews(response.data)
      }
      if (isModalOpen) {
        closeModal()
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const handleRejectClick = (reviewId: string) => {
    setRejectReviewId(reviewId)
    setIsRejectModalOpen(true)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (rejectReviewId) {
      try {
        await apiClient.rejectReview(rejectReviewId, reason)
        // Refresh the list
        const response = await apiClient.getPendingReviews()
        if (response.success && response.data) {
          setReviews(response.data)
        }
        setIsRejectModalOpen(false)
        setRejectReviewId(null)
        if (isModalOpen && selectedReview?.id === rejectReviewId) {
          closeModal()
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        }
      }
    }
  }

  const handleRowClick = async (review: PendingReview) => {
    // Check if review has an id
    if (!review || !review.id) {
      console.error('Review object missing id:', review)
      return
    }

    // Open modal immediately with basic data
    setIsModalOpen(true)
    setIsLoadingDetails(true)
    setError(null)
    setEditedData(null)
    setIsEditMode(false)

    try {
      // Fetch full review details
      const detailsResponse = await apiClient.getReviewDetails(review.id)

      if (detailsResponse.success && detailsResponse.data) {
        setSelectedReview(detailsResponse.data)
      } else {
        setError('Failed to load review details')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        // If it's a 404 or "not found" error, don't show it as critical
        if (err.message.includes('not found') || err.message.includes('404')) {
          console.warn('Review details not found:', err.message)
        } else {
          console.error('Failed to fetch review details:', err)
        }
      } else {
        setError('Failed to load review details')
      }
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedReview(null)
    setEditedData(null)
    setIsEditMode(false)
    // Don't clear areas anymore since we want to keep them cached
    setBlocks([])
  }

  const handleEditClick = async () => {
    if (selectedReview) {
      // If areas are not already loaded, fetch them
      if (areas.length === 0) {
        setIsLoadingAreas(true)
        try {
          const areasResponse = await apiClient.getAllAreas()
          if (areasResponse.success && areasResponse.data?.areas) {
            setAreas(areasResponse.data.areas)
          }
        } catch (err) {
          console.error('Failed to fetch areas:', err)
          setError('Failed to load areas. Please try again.')
          setIsLoadingAreas(false)
          return
        } finally {
          setIsLoadingAreas(false)
        }
      }

      // Create a deep copy for editing - convert areaName/blockName structure to area/block objects for compatibility
      const copy = JSON.parse(JSON.stringify(selectedReview))
      // Convert to editable format with area and block objects
      if (copy.site) {
        copy.site.area = { id: selectedReview.site.areaId, name: selectedReview.site.areaName }
        copy.site.block = { id: selectedReview.site.blockId, name: selectedReview.site.blockName }
      }
      setEditedData(copy)
      setIsEditMode(true)

      // Fetch blocks for the current area in background (non-blocking)
      if (selectedReview.site?.areaId) {
        fetchBlocksForArea(selectedReview.site.areaId)
      }
    }
  }

  const fetchBlocksForArea = async (areaId: number) => {
    setIsLoadingBlocks(true)
    try {
      const blocksResponse = await apiClient.getBlocksByArea(areaId)
      if (blocksResponse.success && blocksResponse.data?.blocks) {
        setBlocks(blocksResponse.data.blocks)
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err)
      setError('Failed to load blocks. Please try again.')
      setBlocks([])
    } finally {
      setIsLoadingBlocks(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedData(null)
    setIsEditMode(false)
    // Don't clear areas anymore since we want to keep them cached
    setBlocks([])
  }

  const handleSave = async () => {
    if (!selectedReview || !editedData || !editedData.site) return

    setIsSaving(true)
    setError(null)

    try {
      // Prepare update data - only Area and Block can be edited
      const updateData: any = {}

      // Check if Area ID changed
      const areaIdChanged = editedData.site.area?.id !== selectedReview.site?.areaId
      if (areaIdChanged && editedData.site.area?.id) {
        updateData.areaId = editedData.site.area.id
        console.log('Area changed:', {
          old: selectedReview.site?.areaId,
          new: editedData.site.area.id
        })
      }

      // Check if Block ID changed
      const blockIdChanged = editedData.site.block?.id !== selectedReview.site?.blockId
      if (blockIdChanged && editedData.site.block?.id) {
        updateData.blockId = editedData.site.block.id
        console.log('Block changed:', {
          old: selectedReview.site?.blockId,
          new: editedData.site.block.id
        })
      }

      // Call update API if there are changes
      if (Object.keys(updateData).length > 0 && selectedReview.siteId) {
        console.log('Calling updateSiteDetails with:', updateData, 'for siteId:', selectedReview.siteId)
        await apiClient.updateSiteDetails(selectedReview.siteId, updateData)
      } else {
        console.warn('No changes detected or missing siteId. updateData:', updateData, 'siteId:', selectedReview.siteId)
        // If no changes, just close edit mode
        setIsEditMode(false)
        setEditedData(null)
        setAreas([])
        setBlocks([])
        setIsSaving(false)
        return
      }

      // Refresh the review details to get updated data
      if (selectedReview.id) {
        try {
          const detailsResponse = await apiClient.getReviewDetails(selectedReview.id)
          if (detailsResponse.success && detailsResponse.data) {
            setSelectedReview(detailsResponse.data)
          }
        } catch (err) {
          console.error('Failed to refresh review details:', err)
        }
      }

      // Refresh the list
      const listResponse = await apiClient.getPendingReviews()
      if (listResponse.success && listResponse.data) {
        setReviews(listResponse.data)
      }

      setIsEditMode(false)
      setEditedData(null)
      setAreas([])
      setBlocks([])
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-yellow-100 text-yellow-800',
      URGENT: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[priority as keyof typeof styles] || styles.NORMAL}`}>
        {priority}
      </span>
    )
  }

  const getStatusForBadge = (status: string): 'pending' | 'approved' | 'rejected' => {
    if (status === 'APPROVED') return 'approved'
    if (status === 'REJECTED') return 'rejected'
    return 'pending'
  }

  const columns: TableColumn<PendingReview>[] = [
    {
      key: 'siteDetails',
      header: 'Site Details',
      render: (review) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {review.fullAddress || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {review.createdByUserName || 'N/A'}
          </div>
        </div>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'reviewType',
      header: 'Review Type',
      render: (review) => {
        const reviewType = review.reviewType || 'N/A'
        const displayText = reviewType === 'MANUAL_VERIFICATION'
          ? 'Manual Verification'
          : reviewType === 'NEW_SITE_VERIFICATION'
            ? 'New Site Verification'
            : reviewType
        return (
          <div className="text-sm text-gray-900">{displayText}</div>
        )
      },
      className: 'whitespace-nowrap',
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (review) => getPriorityBadge(review.priority),
      className: 'whitespace-nowrap',
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (review) => {
        return (
          <div className="text-sm text-gray-900">
            {review.createdAt ? formatDate(review.createdAt).split(',')[0] : 'N/A'}
          </div>
        )
      },
      className: 'whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      render: (review) => <StatusBadge status={getStatusForBadge(review.status)} />,
      className: 'whitespace-nowrap',
    },
  ]

  // Filter only pending reviews
  const pendingReviews = reviews.filter(review =>
    review.status === 'PENDING_REVIEW' || review.status === 'UNDER_REVIEW'
  )

  return (
    <Page>
      <DashboardLayout>
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Registrations</h1>
              <p className="text-gray-600">Review and approve site registration requests</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            data={pendingReviews}
            emptyMessage="No pending site registrations found"
            getRowKey={(review) => review.id || `review-${Math.random()}`}
            onRowClick={handleRowClick}
            isLoading={isLoading}
            skeletonRows={10}
          />

          {!isLoading && (
            <>

              {/* Detail Modal */}
              <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Site Registration Details"
                size="5xl"
                headerActions={
                  !isEditMode ? (
                    <button
                      onClick={handleEditClick}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#4388BC] text-white rounded-lg text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#4388BC] text-white rounded-lg hover:bg-[#4388BC] transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )
                }
              >
                {isLoadingDetails ? (
                  <div className="space-y-6">
                    {/* Site Information Skeleton */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Location Map & Documents Skeleton */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Map Skeleton */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h3>
                          <div className="h-[365px] bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        {/* Documents Skeleton */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Documents & Pictures</h3>
                          <div className="space-y-4 h-[365px] overflow-y-auto">
                            {[1, 2].map((i) => (
                              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                                <div className="h-[300px] bg-gray-200 rounded-lg animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Created By Skeleton */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Created By</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Number</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Review Information Skeleton */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedReview ? (
                  <div className="space-y-6">
                    {/* Site Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.houseNo || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.street || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                          {isEditMode && editedData ? (
                            <SearchableSelect
                              options={areas}
                              value={editedData.site?.area?.id || ''}
                              onChange={(selectedId, selectedOption) => {
                                const newData = JSON.parse(JSON.stringify(editedData))
                                if (!newData.site.area) newData.site.area = { id: 0, name: '' }
                                newData.site.area.id = selectedId
                                newData.site.area.name = selectedOption?.name || ''
                                // Reset block when area changes
                                newData.site.block = { id: 0, name: '' }
                                setEditedData(newData)
                                // Fetch blocks for the selected area
                                if (selectedId) {
                                  fetchBlocksForArea(selectedId)
                                } else {
                                  setBlocks([])
                                }
                              }}
                              placeholder="Select Area"
                              disabled={isLoadingAreas}
                              isLoading={isLoadingAreas}
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.areaName || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                          {isEditMode && editedData ? (
                            <SearchableSelect
                              options={blocks}
                              value={editedData.site?.block?.id || ''}
                              onChange={(selectedId, selectedOption) => {
                                const newData = JSON.parse(JSON.stringify(editedData))
                                if (!newData.site.block) newData.site.block = { id: 0, name: '' }
                                newData.site.block.id = selectedId
                                newData.site.block.name = selectedOption?.name || ''
                                setEditedData(newData)
                              }}
                              placeholder="Select Block"
                              disabled={isLoadingBlocks || !editedData.site?.area?.id}
                              isLoading={isLoadingBlocks}
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.blockName || 'N/A'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Map & Site Documents Side by Side */}
                    {((isEditMode ? editedData?.site?.pinLat && editedData?.site?.pinLng : selectedReview.site?.pinLat && selectedReview.site?.pinLng) || (selectedReview.documents && Array.isArray(selectedReview.documents) && selectedReview.documents.length > 0)) && (
                      <div className="border-t border-gray-200 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Location Map - Left Side */}
                          {(isEditMode ? editedData?.site?.pinLat && editedData?.site?.pinLng : selectedReview.site?.pinLat && selectedReview.site?.pinLng) && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h3>
                              <div className="rounded-lg overflow-hidden border border-gray-200">
                                {(() => {
                                  const pinLat = isEditMode ? editedData?.site?.pinLat : selectedReview.site?.pinLat
                                  const pinLng = isEditMode ? editedData?.site?.pinLng : selectedReview.site?.pinLng
                                  if (pinLat && pinLng) {
                                    // Using Google Maps embed (no API key required for basic embeds)
                                    const mapUrl = `https://www.google.com/maps?q=${pinLat},${pinLng}&z=15&output=embed`
                                    return (
                                      <iframe
                                        width="100%"
                                        height="365"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={mapUrl}
                                        className="w-full"
                                      ></iframe>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                              {/* {(isEditMode ? editedData?.site?.pinLat && editedData?.site?.pinLng : selectedReview.site?.pinLat && selectedReview.site?.pinLng) && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Coordinates:</span>{' '}
                                  {isEditMode 
                                    ? `${editedData?.site?.pinLat?.toFixed(6)}, ${editedData?.site?.pinLng?.toFixed(6)}`
                                    : `${selectedReview.site?.pinLat?.toFixed(6)}, ${selectedReview.site?.pinLng?.toFixed(6)}`
                                  }
                                  {(isEditMode ? editedData?.site?.pinAccuracyM : selectedReview.site?.pinAccuracyM) && (
                                    <span className="ml-2">
                                      (Accuracy: {(isEditMode ? editedData?.site?.pinAccuracyM : selectedReview.site?.pinAccuracyM)?.toFixed(2)}m)
                                    </span>
                                  )}
                                </div>
                              )} */}
                            </div>
                          )}

                          {/* Site Documents & Pictures - Right Side */}
                          {selectedReview.documents && Array.isArray(selectedReview.documents) && selectedReview.documents.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Documents & Pictures</h3>
                              <div className="space-y-4 h-[365px] overflow-y-auto">
                                {selectedReview.documents.map((doc, docIndex) => {
                                  // Use imageData from API response (base64 format)
                                  let imageData = doc?.imageData

                                  // Convert application/octet-stream to image/jpeg for proper rendering
                                  // Browsers may not render application/octet-stream as images
                                  if (imageData && imageData.startsWith('data:application/octet-stream')) {
                                    // Extract the base64 data part (everything after the comma)
                                    const base64Data = imageData.split(',')[1]
                                    if (base64Data) {
                                      // Convert to image/jpeg format (octet-stream is often used for JPEGs)
                                      imageData = `data:image/jpeg;base64,${base64Data}`
                                    }
                                  }

                                  // Check if it's a valid image data URI
                                  const isImage = imageData && imageData.startsWith('data:image/')

                                  return (
                                    <div key={doc?.id || `site-doc-${docIndex}`} className="bg-gray-50 p-4 rounded-lg">
                                      {imageData && (
                                        <div className="mt-3">
                                          {isImage ? (
                                            <div className="relative bg-white rounded-lg border-2 border-gray-200 p-3 flex items-center justify-center h-[365px] overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                              onClick={() => {
                                                // Open base64 image in new tab
                                                const newWindow = window.open()
                                                if (newWindow) {
                                                  newWindow.document.write(`<img src="${imageData}" style="max-width: 100%; height: auto;" />`)
                                                }
                                              }}
                                              title="Click to view full image"
                                            >
                                              <img
                                                src={imageData}
                                                alt="Document"
                                                className="max-w-full max-h-full w-auto h-auto object-contain rounded pointer-events-none"
                                                style={{ display: 'block' }}
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement
                                                  target.style.display = 'none'
                                                  const parent = target.parentElement
                                                  if (parent && !parent.querySelector('.image-error-fallback')) {
                                                    const fallback = document.createElement('div')
                                                    fallback.className = 'image-error-fallback text-sm text-gray-500 text-center py-4 w-full'
                                                    fallback.innerHTML = `
                                                      <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                      </svg>
                                                      <p class="mb-2">Image could not be loaded</p>
                                                    `
                                                    parent.appendChild(fallback)
                                                  }
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div className="text-sm text-gray-500 p-4 text-center">
                                              <p>Document preview not available</p>
                                              <p className="text-xs mt-1">Document ID: {doc.id}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {!imageData && (
                                        <div className="text-sm text-gray-500 p-4 text-center">
                                          <p>No image data available</p>
                                          <p className="text-xs mt-1">Document ID: {doc.id}</p>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Created By Information */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Created By</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {selectedReview.createdByUserName || 'N/A'}
                          </p>
                        </div>
                        {selectedReview.createdByConsumerNo && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Number</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {selectedReview.createdByConsumerNo}
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {selectedReview.createdByUserType || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Review Information */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedReview.priority && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              {getPriorityBadge(selectedReview.priority)}
                            </div>
                          </div>
                        )}
                        {selectedReview.status && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <StatusBadge status={getStatusForBadge(selectedReview.status)} />
                            </div>
                          </div>
                        )}
                        {selectedReview.createdAt && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{formatDate(selectedReview.createdAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {(selectedReview.status === 'PENDING_REVIEW' || selectedReview.status === 'UNDER_REVIEW') && (
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            if (selectedReview.id) {
                              handleApprove(selectedReview.id)
                              closeModal()
                            }
                          }}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!selectedReview.id}
                        >
                          Approve Registration
                        </button>
                        <button
                          onClick={() => {
                            if (selectedReview.id) {
                              closeModal()
                              handleRejectClick(selectedReview.id)
                            }
                          }}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!selectedReview.id}
                        >
                          Reject Registration
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No review details available</p>
                  </div>
                )}
              </Modal>

              {/* Reject Modal */}
              <RejectModal
                isOpen={isRejectModalOpen}
                onClose={() => {
                  setIsRejectModalOpen(false)
                  setRejectReviewId(null)
                }}
                onConfirm={handleRejectConfirm}
                title="Reject Site Registration"
                itemName={rejectReviewId ? reviews.find(r => r.id === rejectReviewId)?.fullAddress : undefined}
              />
            </>
          )}
        </div>
      </DashboardLayout>
    </Page>
  )
}

