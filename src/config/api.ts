// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  LOGIN: '/employee/login',
  DASHBOARD_METRICS: '/employee/dashboard/metrics',
  DASHBOARD_RECENT_ACTIVITY: '/employee/dashboard/recent-activity',
  // Site Review APIs (using employee endpoints until reviewer module is fully deployed)
  PENDING_REVIEWS: '/employee/reviews/pending',
  REVIEW_DETAILS: '/employee/reviews',
  REVIEW_ACTION: '/employee/reviews',
  // Reviewer Module APIs (for future use when backend is ready)
  REVIEWER_OVERVIEW: '/reviewer/overview',
  UPDATE_SITE_DETAILS: '/reviewer/sites',
  GET_AREAS: '/reviewer/geo/areas',
  GET_BLOCKS_BY_AREA: '/reviewer/geo/areas',
  CREATE_OR_UPDATE_BLOCK: '/reviewer/blocks/create-or-update',
} as const

