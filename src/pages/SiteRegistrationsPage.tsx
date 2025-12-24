import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Page from '../components/Page'
import Table, { type TableColumn } from '../components/Table'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import RejectModal from '../components/RejectModal'
import { apiClient } from '../services/api'
import { authUtils } from '../utils/auth'

interface SiteReview {
  id?: string
  reviewId?: string  // API sometimes returns reviewId instead of id
  siteId: string
  status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  site: {
    id: string
    houseNo: string
    street: string
    nearestLandmark?: string
    additionalDirections?: string
    pinLat?: number
    pinLng?: number
    pinAccuracyM?: number
    pinCapturedAt?: string
    area: { id: number; name: string }
    block: { id: number; name: string }
    documents?: Array<{
      id: string
      type: string
      fileUri: string
      uploadedBy?: { id: string; firstName: string; lastName?: string }
      uploadedAt?: string
    }>
    memberships?: Array<{
      id: string
      role?: string
      isActive: boolean
      user: {
        id: string
        firstName: string
        lastName: string
        email: string
        primaryPhone: string
        cnic?: string
        documents?: Array<{
          id: string
          type: string
          fileUri: string
        }>
      }
    }>
    createdBy?: {
      id: string
      firstName: string
      lastName: string
      email: string
      primaryPhone?: string
    }
  }
  currentAssigneeEmployeeId?: string
  assignee?: {
    id: string
    fullName: string
  }
  events?: Array<{
    id: string
    action: string
    fromStatus: string | null
    toStatus: string
    note: string
    createdAt: string
  }>
}

export default function SiteRegistrationsPage() {
  const [reviews, setReviews] = useState<SiteReview[]>([])
  const [selectedReview, setSelectedReview] = useState<SiteReview | null>(null)
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
          // Normalize reviews - ensure all have id (use reviewId if id is missing)
          const normalizedReviews = response.data.map((review: any) => ({
            ...review,
            id: review.id || review.reviewId,
          }))
          setReviews(normalizedReviews)
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
        // Normalize reviews - ensure all have id (use reviewId if id is missing)
        const normalizedReviews = response.data.map((review: any) => ({
          ...review,
          id: review.id || review.reviewId,
        }))
        setReviews(normalizedReviews)
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
              // Normalize reviews - ensure all have id (use reviewId if id is missing)
              const normalizedReviews = response.data.map((review: any) => ({
                ...review,
                id: review.id || review.reviewId,
              }))
              setReviews(normalizedReviews)
            }
            setIsRejectModalOpen(false)
            setRejectReviewId(null)
            const selectedReviewId = selectedReview?.id || selectedReview?.reviewId
            if (isModalOpen && selectedReviewId === rejectReviewId) {
              closeModal()
            }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        }
      }
    }
  }

  const handleRowClick = async (review: SiteReview) => {
    // Normalize review ID - API may return reviewId instead of id
    const reviewId = review.id || review.reviewId
    
    // Check if review has an id
    if (!review || !reviewId) {
      console.error('Review object missing id:', review)
      return
    }

    // Normalize the review object to always have id
    const normalizedReview = { ...review, id: reviewId }

    // First, show the data we already have from the list
    setSelectedReview(normalizedReview as any)
    setEditedData(null)
    setIsEditMode(false)
    setIsModalOpen(true)
    setError(null)
    
    // Then try to fetch full details in the background
    setIsLoadingDetails(true)
    try {
      const response = await apiClient.getReviewDetails(reviewId)
      if (response.success && response.data) {
        // Update with full details if available
        setSelectedReview(response.data as any)
      }
    } catch (err) {
      // Silently handle "not found" errors - this is expected for some reviews
      // Only show error if it's not a "not found" or 404 error
      if (err instanceof Error) {
        const isNotFoundError = 
          err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('404') ||
          err.message.toLowerCase().includes('review case not found')
        
        if (!isNotFoundError) {
          // Only show non-404 errors
          console.warn('Could not load full details:', err.message)
        }
        // Don't set error state for "not found" - it's expected
      }
      // Keep showing the basic data we have
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedReview(null)
    setEditedData(null)
    setIsEditMode(false)
  }

  const handleEditClick = () => {
    if (selectedReview) {
      // Create a deep copy for editing
      setEditedData(JSON.parse(JSON.stringify(selectedReview)))
      setIsEditMode(true)
    }
  }

  const handleCancelEdit = () => {
    setEditedData(null)
    setIsEditMode(false)
  }

  const handleSave = async () => {
    if (!selectedReview || !editedData || !editedData.site) return

    setIsSaving(true)
    setError(null)

    try {
      // Prepare update data
      const updateData: any = {}
      
      if (editedData.site.houseNo !== selectedReview.site?.houseNo) {
        updateData.houseNo = editedData.site.houseNo
      }
      if (editedData.site.street !== selectedReview.site?.street) {
        updateData.street = editedData.site.street
      }
      if (editedData.site.area?.id !== selectedReview.site?.area?.id) {
        updateData.areaId = editedData.site.area?.id
      }
      if (editedData.site.block?.id !== selectedReview.site?.block?.id) {
        updateData.blockId = editedData.site.block?.id
      }
      if (editedData.site.nearestLandmark !== selectedReview.site?.nearestLandmark) {
        updateData.nearestLandmark = editedData.site.nearestLandmark
      }
      if (editedData.site.additionalDirections !== selectedReview.site?.additionalDirections) {
        updateData.additionalDirections = editedData.site.additionalDirections
      }
      if (editedData.site.pinLat !== selectedReview.site?.pinLat) {
        updateData.pinLat = editedData.site.pinLat
      }
      if (editedData.site.pinLng !== selectedReview.site?.pinLng) {
        updateData.pinLng = editedData.site.pinLng
      }
      if (editedData.site.pinAccuracyM !== selectedReview.site?.pinAccuracyM) {
        updateData.pinAccuracyM = editedData.site.pinAccuracyM
      }

      // Call update API if there are changes
      if (Object.keys(updateData).length > 0 && selectedReview.siteId) {
        await apiClient.updateSiteDetails(selectedReview.siteId, updateData)
      }

      // Get the review ID (normalized)
      const reviewId = selectedReview.id || selectedReview.reviewId
      
      // Refresh review details to get updated data
      if (reviewId) {
        const detailsResponse = await apiClient.getReviewDetails(reviewId)
        if (detailsResponse.success && detailsResponse.data) {
          setSelectedReview(detailsResponse.data as any)
        }
      }

      // Refresh the list
      const listResponse = await apiClient.getPendingReviews()
      if (listResponse.success && listResponse.data) {
        // Normalize reviews - ensure all have id (use reviewId if id is missing)
        const normalizedReviews = listResponse.data.map((review: any) => ({
          ...review,
          id: review.id || review.reviewId,
        }))
        setReviews(normalizedReviews)
      }

      setIsEditMode(false)
      setEditedData(null)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setIsSaving(false)
    }
  }


  const updateEditedField = (path: string, value: any) => {
    if (!editedData) return

    const keys = path.split('.')
    const newData = JSON.parse(JSON.stringify(editedData))
    let current: any = newData

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setEditedData(newData)
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

  const columns: TableColumn<SiteReview>[] = [
    {
      key: 'siteDetails',
      header: 'Site Details',
      render: (review) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {review.site?.houseNo || 'N/A'}, {review.site?.street || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {review.site?.area?.name || 'N/A'}, {review.site?.block?.name || 'N/A'}
          </div>
        </div>
      ),
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
      render: (review) => (
        <div className="text-sm text-gray-900">{formatDate(review.createdAt)}</div>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      render: (review) => <StatusBadge status={getStatusForBadge(review.status)} />,
      className: 'whitespace-nowrap',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (review) => (
        <div className="text-sm font-medium" onClick={(e) => e.stopPropagation()}>
          {review.status === 'PENDING_REVIEW' || review.status === 'UNDER_REVIEW' ? (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const reviewId = review.id || review.reviewId
                  if (reviewId) handleApprove(reviewId)
                }}
                className="text-green-600 hover:text-green-900 font-semibold"
                disabled={!review.id && !review.reviewId}
              >
                Approve
              </button>
              <button
                onClick={() => {
                  const reviewId = review.id || review.reviewId
                  if (reviewId) handleRejectClick(reviewId)
                }}
                className="text-red-600 hover:text-red-900 font-semibold"
                disabled={!review.id && !review.reviewId}
              >
                Reject
              </button>
            </div>
          ) : (
            <span className="text-gray-400">No action</span>
          )}
        </div>
      ),
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={pendingReviews}
                emptyMessage="No pending site registrations found"
                getRowKey={(review) => review.id || review.reviewId || `review-${Math.random()}`}
                onRowClick={handleRowClick}
              />

              {/* Detail Modal */}
              <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Site Registration Details"
                size="5xl"
              >
                {selectedReview && (
                  <div className="space-y-6">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        {!isEditMode && (
                          <button
                            onClick={handleEditClick}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                      {isEditMode && (
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
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </div>

                    {isLoadingDetails && (
                      <div className="flex items-center justify-center py-4 bg-blue-50 rounded-lg">
                        <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-blue-600">Loading full details...</span>
                      </div>
                    )}

                    {/* Site Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                          {isEditMode && editedData ? (
                            <input
                              type="text"
                              value={editedData.site?.houseNo || ''}
                              onChange={(e) => updateEditedField('site.houseNo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.houseNo || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                          {isEditMode && editedData ? (
                            <input
                              type="text"
                              value={editedData.site?.street || ''}
                              onChange={(e) => updateEditedField('site.street', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.street || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                          {isEditMode && editedData ? (
                            <input
                              type="text"
                              value={editedData.site?.area?.name || ''}
                              onChange={(e) => {
                                const newData = JSON.parse(JSON.stringify(editedData))
                                if (!newData.site.area) newData.site.area = { id: 0, name: '' }
                                newData.site.area.name = e.target.value
                                setEditedData(newData)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.area?.name || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                          {isEditMode && editedData ? (
                            <input
                              type="text"
                              value={editedData.site?.block?.name || ''}
                              onChange={(e) => {
                                const newData = JSON.parse(JSON.stringify(editedData))
                                if (!newData.site.block) newData.site.block = { id: 0, name: '' }
                                newData.site.block.name = e.target.value
                                setEditedData(newData)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site?.block?.name || 'N/A'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Map & Site Documents Side by Side */}
                    {((isEditMode ? editedData?.site?.pinLat && editedData?.site?.pinLng : selectedReview.site?.pinLat && selectedReview.site?.pinLng) || (selectedReview.site?.documents && Array.isArray(selectedReview.site.documents) && selectedReview.site.documents.length > 0)) && (
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
                                        height="300"
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
                              {(isEditMode ? editedData?.site?.pinLat && editedData?.site?.pinLng : selectedReview.site?.pinLat && selectedReview.site?.pinLng) && (
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
                              )}
                            </div>
                          )}

                          {/* Site Documents & Pictures - Right Side */}
                          {selectedReview.site?.documents && Array.isArray(selectedReview.site.documents) && selectedReview.site.documents.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Documents & Pictures</h3>
                              <div className="space-y-4 h-[300px] overflow-y-auto">
                                {selectedReview.site.documents.map((doc, docIndex) => {
                                  const isImage = doc?.fileUri && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUri)
                                  return (
                                    <div key={doc?.id || `site-doc-${docIndex}`} className="bg-gray-50 p-4 rounded-lg">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <span className="text-sm font-medium text-gray-900">{doc?.type || 'Unknown'}</span>
                                          {doc?.uploadedBy?.firstName && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              Uploaded by: {doc.uploadedBy.firstName} {doc.uploadedBy.lastName || ''}
                                            </p>
                                          )}
                                          {doc?.uploadedAt && (
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(doc.uploadedAt)}</p>
                                          )}
                                        </div>
                                      </div>
                                      {doc?.fileUri && (
                                        <div className="mt-3">
                                          {isImage ? (
                                            <div>
                                              <img
                                                src={doc.fileUri}
                                                alt={doc.type || 'Document'}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 mb-2"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                              />
                                              <a
                                                href={doc.fileUri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>View Full Image</span>
                                              </a>
                                            </div>
                                          ) : (
                                            <a
                                              href={doc.fileUri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                              </svg>
                                              <span>View Document</span>
                                            </a>
                                          )}
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

                    {/* User Information */}
                    {(isEditMode ? editedData?.site?.memberships : selectedReview.site?.memberships) && Array.isArray(isEditMode ? editedData?.site?.memberships : selectedReview.site?.memberships) && (isEditMode ? editedData?.site?.memberships : selectedReview.site?.memberships).length > 0 && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                        {(isEditMode ? editedData?.site?.memberships : selectedReview.site?.memberships).map((membership: any, index: number) => {
                          const membershipData = isEditMode ? editedData?.site?.memberships[index] : membership
                          return (
                            <div key={membershipData?.id || index} className="mb-6 last:mb-0">
                              {membershipData?.user && (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                      {isEditMode && editedData ? (
                                        <input
                                          type="text"
                                          value={editedData.site?.memberships?.[index]?.user?.firstName || ''}
                                          onChange={(e) => {
                                            const newData = JSON.parse(JSON.stringify(editedData))
                                            if (!newData.site.memberships[index].user) newData.site.memberships[index].user = {}
                                            newData.site.memberships[index].user.firstName = e.target.value
                                            setEditedData(newData)
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                          {membershipData.user.firstName || ''}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                      {isEditMode && editedData ? (
                                        <input
                                          type="text"
                                          value={editedData.site?.memberships?.[index]?.user?.lastName || ''}
                                          onChange={(e) => {
                                            const newData = JSON.parse(JSON.stringify(editedData))
                                            if (!newData.site.memberships[index].user) newData.site.memberships[index].user = {}
                                            newData.site.memberships[index].user.lastName = e.target.value
                                            setEditedData(newData)
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                          {membershipData.user.lastName || ''}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                      {isEditMode && editedData ? (
                                        <input
                                          type="email"
                                          value={editedData.site?.memberships?.[index]?.user?.email || ''}
                                          onChange={(e) => {
                                            const newData = JSON.parse(JSON.stringify(editedData))
                                            if (!newData.site.memberships[index].user) newData.site.memberships[index].user = {}
                                            newData.site.memberships[index].user.email = e.target.value
                                            setEditedData(newData)
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{membershipData.user.email || 'N/A'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                      {isEditMode && editedData ? (
                                        <input
                                          type="tel"
                                          value={editedData.site?.memberships?.[index]?.user?.primaryPhone || ''}
                                          onChange={(e) => {
                                            const newData = JSON.parse(JSON.stringify(editedData))
                                            if (!newData.site.memberships[index].user) newData.site.memberships[index].user = {}
                                            newData.site.memberships[index].user.primaryPhone = e.target.value
                                            setEditedData(newData)
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{membershipData.user.primaryPhone || 'N/A'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                                      {isEditMode && editedData ? (
                                        <input
                                          type="text"
                                          value={editedData.site?.memberships?.[index]?.user?.cnic || ''}
                                          onChange={(e) => {
                                            const newData = JSON.parse(JSON.stringify(editedData))
                                            if (!newData.site.memberships[index].user) newData.site.memberships[index].user = {}
                                            newData.site.memberships[index].user.cnic = e.target.value
                                            setEditedData(newData)
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                      ) : (
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{membershipData.user.cnic || 'N/A'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Membership Status</label>
                                      {isEditMode && editedData ? (
                                        <select
                                          value={editedData.site?.memberships?.[index]?.isActive ? 'true' : 'false'}
                                          onChange={(e) => {
                                            const newData = JSON.parse(JSON.stringify(editedData))
                                            newData.site.memberships[index].isActive = e.target.value === 'true'
                                            setEditedData(newData)
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        >
                                          <option value="true">Active</option>
                                          <option value="false">Inactive</option>
                                        </select>
                                      ) : (
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                          {membershipData.isActive ? 'Active' : 'Inactive'}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                {/* User Documents */}
                                {membershipData.user.documents && Array.isArray(membershipData.user.documents) && membershipData.user.documents.length > 0 && (
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">User Documents</label>
                                    <div className="space-y-2">
                                      {membershipData.user.documents.map((doc: any, docIndex: number) => (
                                        <div key={doc?.id || `doc-${index}-${docIndex}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                          <span className="text-sm text-gray-900">{doc?.type || 'Unknown'}</span>
                                          {doc?.fileUri && (
                                            <a
                                              href={doc.fileUri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                              View Document
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    )}

                    {/* Created By */}
                    {(isEditMode ? editedData?.site?.createdBy : selectedReview.site?.createdBy) && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Created By</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            {isEditMode && editedData ? (
                              <input
                                type="text"
                                value={editedData.site?.createdBy?.firstName || ''}
                                onChange={(e) => {
                                  const newData = JSON.parse(JSON.stringify(editedData))
                                  if (!newData.site.createdBy) newData.site.createdBy = {}
                                  newData.site.createdBy.firstName = e.target.value
                                  setEditedData(newData)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                {selectedReview.site.createdBy.firstName || 'N/A'}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            {isEditMode && editedData ? (
                              <input
                                type="text"
                                value={editedData.site?.createdBy?.lastName || ''}
                                onChange={(e) => {
                                  const newData = JSON.parse(JSON.stringify(editedData))
                                  if (!newData.site.createdBy) newData.site.createdBy = {}
                                  newData.site.createdBy.lastName = e.target.value
                                  setEditedData(newData)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                {selectedReview.site.createdBy.lastName || 'N/A'}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            {isEditMode && editedData ? (
                              <input
                                type="email"
                                value={editedData.site?.createdBy?.email || ''}
                                onChange={(e) => {
                                  const newData = JSON.parse(JSON.stringify(editedData))
                                  if (!newData.site.createdBy) newData.site.createdBy = {}
                                  newData.site.createdBy.email = e.target.value
                                  setEditedData(newData)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                            ) : (
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.site.createdBy.email || 'N/A'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Review Information */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(isEditMode ? editedData?.priority : selectedReview.priority) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            {isEditMode && editedData ? (
                              <select
                                value={editedData.priority || 'NORMAL'}
                                onChange={(e) => updateEditedField('priority', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              >
                                <option value="LOW">LOW</option>
                                <option value="NORMAL">NORMAL</option>
                                <option value="HIGH">HIGH</option>
                                <option value="URGENT">URGENT</option>
                              </select>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                {getPriorityBadge(selectedReview.priority)}
                              </div>
                            )}
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
                        {selectedReview.assignee?.fullName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReview.assignee.fullName}</p>
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

                    {/* Events/History */}
                    {selectedReview.events && Array.isArray(selectedReview.events) && selectedReview.events.length > 0 && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review History</h3>
                        <div className="space-y-3">
                          {selectedReview.events.map((event, eventIndex) => (
                            <div key={event?.id || `event-${eventIndex}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{event?.action || 'Unknown Action'}</p>
                                {event?.note && (
                                  <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                                )}
                                {event?.createdAt && (
                                  <p className="text-xs text-gray-500 mt-1">{formatDate(event.createdAt)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(selectedReview.status === 'PENDING_REVIEW' || selectedReview.status === 'UNDER_REVIEW') && (
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const reviewId = selectedReview.id || selectedReview.reviewId
                            if (reviewId) {
                              handleApprove(reviewId)
                              closeModal()
                            }
                          }}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!selectedReview.id && !selectedReview.reviewId}
                        >
                          Approve Registration
                        </button>
                        <button
                          onClick={() => {
                            const reviewId = selectedReview.id || selectedReview.reviewId
                            if (reviewId) {
                              closeModal()
                              handleRejectClick(reviewId)
                            }
                          }}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!selectedReview.id && !selectedReview.reviewId}
                        >
                          Reject Registration
                        </button>
                      </div>
                    )}
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
                itemName={rejectReviewId ? reviews.find(r => (r.id || r.reviewId) === rejectReviewId)?.site?.houseNo : undefined}
              />
            </>
          )}
        </div>
      </DashboardLayout>
    </Page>
  )
}

