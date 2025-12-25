// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  // Employee Module APIs
  LOGIN: '/employee/login',
  DASHBOARD_METRICS: '/employee/dashboard/metrics',
  DASHBOARD_RECENT_ACTIVITY: '/employee/dashboard/recent-activity',
  // Auth APIs
  LOGOUT: '/auth/logout',
  // Reviewer Module APIs
  REVIEWER_OVERVIEW: '/reviewer/overview',
  PENDING_REVIEWS: '/reviewer/reviews/pending',
  REVIEW_DETAILS: '/reviewer/reviews',
  REVIEW_ACTION: '/reviewer/reviews',
  UPDATE_SITE_DETAILS: '/reviewer/sites',
  GET_AREAS: '/reviewer/geo/areas',
  GET_BLOCKS_BY_AREA: '/reviewer/geo/areas',
  CREATE_OR_UPDATE_BLOCK: '/reviewer/blocks/create-or-update',
  MANUAL_VERIFICATION: '/reviewer/sites',
  LINK_EXISTING_SITE: '/reviewer/sites/link-existing',
} as const

