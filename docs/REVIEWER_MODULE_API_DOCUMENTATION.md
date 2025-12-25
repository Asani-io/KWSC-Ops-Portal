# Reviewer Module API Documentation

## Overview

The Reviewer Module is **exclusively focused on site-related operations**. Reviewers manage site verifications, handle address corrections, manage blocks/areas, perform manual verifications, and link existing sites to users. All actions are logged in audit logs for tracking and compliance.

**Key Focus Areas:**
- Site Verification & Review
- Address Management (Area, Block, House, Street)
- Manual Verification
- Site Details Updates
- Block/Area Management
- Site-to-User Linking

## Authentication

All endpoints require:
- **JWT Token** in `Authorization` header: `Bearer <token>`
- **Employee Role**: User must be authenticated as an employee with `REVIEWER`, `MANAGER`, or `ADMIN` role

## Base URL

```
/reviewer
```

**Note:** Reviewer module is completely separate from employee module. Login remains the same (`/employee/login`), but all reviewer operations use `/reviewer` prefix.

---

## API Endpoints

### OVERVIEW & DASHBOARD

#### 1. Get Reviewer Overview

Retrieves comprehensive overview data for reviewer dashboard including summary statistics, KPIs, and recent reviews.

**Endpoint:** `GET /reviewer/overview`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPending": 25,
      "totalUnderReview": 5,
      "totalApproved": 150,
      "totalRejected": 20,
      "pendingToday": 3,
      "approvedToday": 8,
      "rejectedToday": 2,
      "pendingThisWeek": 15,
      "approvedThisWeek": 45,
      "rejectedThisWeek": 10
    },
    "kpis": {
      "reviewerId": "bb0e8400-e29b-41d4-a716-446655440001",
      "totalAssigned": 200,
      "totalClosed": 170,
      "currentlyAssigned": 30,
      "pendingUnassigned": 25,
      "overdueReviews": 2,
      "today": {
        "closed": 8,
        "approved": 6,
        "rejected": 2,
        "target": 100,
        "achievement": 8,
        "status": "BELOW_TARGET"
      },
      "thisWeek": {
        "closed": 45,
        "approved": 35,
        "rejected": 10,
        "target": 700,
        "achievement": 6.43,
        "dailyAverage": 6.43
      },
      "thisMonth": {
        "closed": 120,
        "approved": 95,
        "rejected": 25
      },
      "reviewStats": {
        "approvalRate": 79.17,
        "rejectionRate": 20.83,
        "averageReviewTimeSeconds": 5400,
        "averageReviewTimeFormatted": "1.5 hours"
      },
      "performance": {
        "dailyAverage": 6.43,
        "targetDailyAverage": 100,
        "efficiency": 6.43,
        "slaCompliance": {
          "rate": 95.5,
          "compliantReviews": 95,
          "totalEvaluated": 100,
          "thresholdHours": 24
        }
      },
      "reviewsByStatus": {
        "pending": 5,
        "underReview": 10,
        "approved": 95,
        "rejected": 25
      }
    },
    "recentReviews": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "siteId": "550e8400-e29b-41d4-a716-446655440000",
        "status": "PENDING_REVIEW",
        "site": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "areaId": 1,
          "blockId": 3,
          "houseNo": "123",
          "status": "PENDING_REVIEW",
          "area": {
            "id": 1,
            "name": "Gulshan-e-Iqbal"
          },
          "block": {
            "id": 3,
            "name": "Block 1"
          },
          "createdBy": {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "createdAt": "2025-01-15T08:00:00.000Z"
      }
    ]
  }
}
```

**Use Case:**
- Reviewer dashboard/overview page
- Shows all key metrics at a glance
- Recent reviews for quick access
- Performance KPIs

---

### SITE VERIFICATION & REVIEW


#### 1. Get Pending Reviews

Retrieves all pending site verification cases. Since there's only one reviewer, all pending reviews are available without assignment.

**Endpoint:** `GET /reviewer/reviews/pending`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "siteId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "PENDING_REVIEW",
      "priority": "NORMAL",
      "createdAt": "2025-01-15T08:00:00.000Z",
      "reviewType": "MANUAL_VERIFICATION",
      "existingSiteId": "550e8400-e29b-41d4-a716-446655440001",
      "createdByUserName": "John Doe",
      "fullAddress": "123 Main Street, Block 1, Gulshan-e-Iqbal"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440002",
      "siteId": "660e8400-e29b-41d4-a716-446655440002",
      "status": "PENDING_REVIEW",
      "priority": "HIGH",
      "createdAt": "2025-01-15T09:00:00.000Z",
      "reviewType": "NEW_SITE_VERIFICATION",
      "existingSiteId": null,
      "createdByUserName": "Jane Smith",
      "fullAddress": "456 Park Avenue, Block 2, Defence"
    }
  ]
}
```

**Note:** 
- Simplified response with only top-level fields for easy frontend consumption.
- No nested `site` object - all required fields are at the top level.
- No `documents` array - use `/reviewer/reviews/:reviewId` to get full details with documents.
- `reviewType` indicates the type of review: `"MANUAL_VERIFICATION"` (site claiming) or `"NEW_SITE_VERIFICATION"` (new site).
- `existingSiteId` is only present when `reviewType === "MANUAL_VERIFICATION"` (site claiming case).
- `createdAt` represents the review case creation date (submission date).
- `fullAddress` is formatted as: `"{houseNo} {street}, {blockName}, {areaName}"`.

---

#### 3. Get Review Details

Retrieves complete details of a site verification case including site information and documents with base64 image data.

**Endpoint:** `GET /reviewer/reviews/:reviewId`

**URL Parameters:**
- `reviewId` (string, required): Site Verification Case UUID

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "siteId": "550e8400-e29b-41d4-a716-446655440000",
    "fullAddress": "123 Main Street, Block 1, Gulshan-e-Iqbal",
    "status": "PENDING_REVIEW",
    "priority": "NORMAL",
    "createdAt": "2025-01-15T08:00:00.000Z",
    "createdByUserName": "John Doe",
    "createdByConsumerNo": "123456789",
    "createdByUserType": "CONSUMER",
    "site": {
      "areaId": 1,
      "areaName": "Gulshan-e-Iqbal",
      "blockId": 3,
      "blockName": "Block 1",
      "houseNo": "123",
      "street": "Main Street",
      "nearestLandmark": "Near Park",
      "additionalDirections": "Behind the mosque",
      "pinLat": 24.8607,
      "pinLng": 67.0011,
      "pinAccuracyM": 10.5,
      "pinCapturedAt": "2025-01-15T09:00:00.000Z",
      "plotKey": "AREA-1-BLOCK-3-HOUSE-123"
    },
    "documents": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACiI..."
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACiI..."
      }
    ]
  }
}
```

**Note:**
- `fullAddress` is at the top level, right after `siteId`.
- `areaName` and `blockName` are included in the `site` object (not nested area/block objects).
- `createdByUserName`, `createdByConsumerNo`, and `createdByUserType` are at the top level.
- `createdByConsumerNo` will be `null` if the user is not a consumer or doesn't have a consumer number.
- Documents only include `id` and `imageData` (base64 format) - no URLs, no metadata.
- `imageData` is in the format: `data:image/png;base64,<base64string>` - can be directly used in HTML `<img>` tags or React components.
- If image loading fails, `imageData` will be `null` and `imageError` field will contain the error message.
- No `memberships` or `events` arrays - removed for simplified response.

---

#### 4. Review Action (Approve/Reject)

Approves or rejects a site verification case.

**Endpoint:** `POST /reviewer/reviews/:reviewId/action`

**URL Parameters:**
- `reviewId` (string, required): Site Verification Case UUID

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Site verified. All documents and location are correct."
}
```

**Actions:**
- `"approve"`: Approves the site verification
- `"reject"`: Rejects the site verification

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "status": "APPROVED"
  }
}
```

**Note:** When a site is approved, all users with active memberships are automatically updated to onboarding stage A2 (CONSUMER) or B2 (NON_CONSUMER).

---

#### 5. Get Review History

Retrieves review history with optional filters.

**Endpoint:** `GET /reviewer/reviews/history`

**Query Parameters:**
- `siteId` (string, optional): Filter by site ID
- `employeeId` (string, optional): Filter by employee ID
- `status` (string, optional): Filter by status
- `limit` (number, optional): Limit results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "siteId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "APPROVED",
      "site": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "houseNo": "123",
        "street": "Main Street"
      },
      "assignee": {
        "id": "bb0e8400-e29b-41d4-a716-446655440001",
        "fullName": "Reviewer Name"
      },
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 6. Get Review Statistics

Retrieves statistics about site verifications.

**Endpoint:** `GET /reviewer/reviews/stats`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 20,
    "underReview": 15,
    "approved": 50,
    "rejected": 15,
    "averageReviewTime": "2.5 hours"
  }
}
```

---

#### 7. Get Reviewer KPIs

Retrieves personal performance metrics for the current reviewer.

**Endpoint:** `GET /reviewer/reviews/kpis`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "reviewerId": "bb0e8400-e29b-41d4-a716-446655440001",
    "totalAssigned": 150,
    "totalClosed": 120,
    "currentlyAssigned": 10,
    "pendingUnassigned": 5,
    "overdueReviews": 2,
    "today": {
      "closed": 8,
      "approved": 6,
      "rejected": 2,
      "target": 10,
      "achievement": 80,
      "status": "BELOW_TARGET"
    },
    "thisWeek": {
      "closed": 45,
      "approved": 35,
      "rejected": 10,
      "target": 70,
      "achievement": 64.29,
      "dailyAverage": 6.43
    },
    "thisMonth": {
      "closed": 120,
      "approved": 95,
      "rejected": 25
    },
    "reviewStats": {
      "approvalRate": 79.17,
      "rejectionRate": 20.83,
      "averageReviewTimeSeconds": 5400,
      "averageReviewTimeFormatted": "1.5 hours"
    },
    "performance": {
      "dailyAverage": 6.43,
      "targetDailyAverage": 10,
      "efficiency": 64.3,
      "slaCompliance": {
        "rate": 95.5,
        "compliantReviews": 95,
        "totalEvaluated": 100,
        "thresholdHours": 24
      }
    },
    "reviewsByStatus": {
      "pending": 5,
      "underReview": 10,
      "approved": 95,
      "rejected": 25
    }
  }
}
```

---

### ADDRESS & BLOCK MANAGEMENT

#### 9. Create or Update Block

Creates a new block or updates an existing block when user enters a block that doesn't exist in the system but the area exists.

**Endpoint:** `POST /reviewer/blocks/create-or-update`

**Request Body:**
```json
{
  "areaId": 1,
  "blockName": "Block A-123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "areaId": 1,
    "name": "Block A-123",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Use Case:**
- User enters block "A-123" which doesn't exist
- Area exists in system
- Reviewer creates/updates the block
- Action is logged in audit logs

**Error Responses:**
- `404`: Area not found
- `400`: Validation error

---

### GEO DATA FETCHING

#### 8. Get All Areas

Fetches all active areas in the system. Used by reviewer to see available areas when reviewing sites or creating blocks.

**Endpoint:** `GET /reviewer/geo/areas`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "areas": [
      {
        "id": 1,
        "name": "Gulshan-e-Iqbal",
        "allowsNonConsumer": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Clifton",
        "allowsNonConsumer": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

**Response Fields:**
- `areas`: Array of area objects
  - `id`: Area ID (integer)
  - `name`: Area name
  - `allowsNonConsumer`: Whether area allows non-consumer users
  - `createdAt`: Creation timestamp
- `total`: Total number of areas

---

#### 9. Get Blocks by Area

Fetches all active blocks in a specific area. Used by reviewer to see available blocks when reviewing sites or creating new blocks.

**Endpoint:** `GET /reviewer/geo/areas/:areaId/blocks`

**Path Parameters:**
- `areaId` (integer, required): The ID of the area

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "area": {
      "id": 1,
      "name": "Gulshan-e-Iqbal"
    },
    "blocks": [
      {
        "id": 1,
        "name": "Block 1",
        "areaId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Block 2",
        "areaId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

**Response Fields:**
- `area`: Area information
  - `id`: Area ID
  - `name`: Area name
- `blocks`: Array of block objects
  - `id`: Block ID (integer)
  - `name`: Block name
  - `areaId`: Parent area ID
  - `createdAt`: Creation timestamp
- `total`: Total number of blocks in the area

**Error Responses:**
- `404 NOT_FOUND`: Area not found
- `400 BAD_INPUT`: Area is not active

---

### ADMIN REQUESTS

#### 10. Request Admin to Add Missing Area

When reviewer encounters a site with an area that doesn't exist in the system, they can request admin to add it. The request is logged in audit logs for admin review.

**Endpoint:** `POST /reviewer/requests/add-area`

**Request Body:**
```json
{
  "areaName": "New Area Name",
  "allowsNonConsumer": false,
  "notes": "User submitted site with this area but it doesn't exist in system"
}
```

**Request Fields:**
- `areaName` (string, required): Name of the area to be added
- `allowsNonConsumer` (boolean, required): Whether the area should allow non-consumer users
- `notes` (string, optional): Additional notes about the request

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Request submitted to admin to add area \"New Area Name\"",
    "request": {
      "areaName": "New Area Name",
      "allowsNonConsumer": false,
      "notes": "User submitted site with this area but it doesn't exist in system",
      "requestedBy": "bb0e8400-e29b-41d4-a716-446655440001",
      "requestedAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400 BAD_INPUT`: Area with the same name already exists in the system

**Note:** The request is logged in audit logs with action `REQUEST_ADD_AREA`. Admin can review these requests and add the area manually.

---

#### 11. Request Admin to Add Missing Block

When reviewer encounters a site with a block that doesn't exist in the system (but the area exists), they can request admin to add it. The request is logged in audit logs for admin review.

**Endpoint:** `POST /reviewer/requests/add-block`

**Request Body:**
```json
{
  "areaId": 1,
  "blockName": "New Block Name",
  "notes": "User submitted site with this block but it doesn't exist in area"
}
```

**Request Fields:**
- `areaId` (integer, required): ID of the area where block should be added
- `blockName` (string, required): Name of the block to be added
- `notes` (string, optional): Additional notes about the request

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Request submitted to admin to add block \"New Block Name\" in area \"Gulshan-e-Iqbal\"",
    "request": {
      "areaId": 1,
      "areaName": "Gulshan-e-Iqbal",
      "blockName": "New Block Name",
      "notes": "User submitted site with this block but it doesn't exist in area",
      "requestedBy": "bb0e8400-e29b-41d4-a716-446655440001",
      "requestedAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404 NOT_FOUND`: Area not found
- `400 BAD_INPUT`: Area is not active, or block with the same name already exists in the area

**Note:** The request is logged in audit logs with action `REQUEST_ADD_BLOCK`. Admin can review these requests and add the block manually.

---

### SITE DETAILS MANAGEMENT

#### 12. Update Site Details

Allows reviewer to edit and fix site information (address, block, area, pin location, etc.).

**Endpoint:** `PUT /reviewer/sites/:siteId/update-details`

**URL Parameters:**
- `siteId` (string, required): Site UUID

**Request Body:**
```json
{
  "areaId": 2,
  "blockId": 5,
  "houseNo": "456",
  "street": "Updated Street Name",
  "nearestLandmark": "Near Park",
  "additionalDirections": "Behind the mosque",
  "pinLat": 24.8607,
  "pinLng": 67.0011,
  "pinAccuracyM": 10.5
}
```

**Note:** All fields are optional. Only include fields that need to be updated.

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "areaId": 2,
    "blockId": 5,
    "houseNo": "456",
    "street": "Updated Street Name",
    "nearestLandmark": "Near Park",
    "additionalDirections": "Behind the mosque",
    "pinLat": 24.8607,
    "pinLng": 67.0011,
    "pinAccuracyM": 10.5,
    "area": {
      "id": 2,
      "name": "Clifton"
    },
    "block": {
      "id": 5,
      "name": "Block A-123"
    },
    "status": "UNDER_REVIEW",
    "updatedAt": "2025-01-15T10:40:00.000Z"
  }
}
```

**Use Case:**
- Reviewer notices incorrect address in site details
- Reviewer updates address, block, or other details
- Changes are logged in audit logs with before/after states
- SiteVerificationEvent is created for tracking

**Validation:**
- If `blockId` is updated, it must belong to the specified `areaId` (or current site's area)
- If both `areaId` and `blockId` are updated, block must belong to the new area

**Error Responses:**
- `404`: Site, Area, or Block not found
- `400`: Block does not belong to the specified area

---

### MANUAL VERIFICATION

#### 13. Get Site for Manual Verification Review

Retrieves structured site data for manual verification review, including pin location, bills, documents, and verification history.

**Endpoint:** `GET /reviewer/sites/:siteId/manual-verification`

**URL Parameters:**
- `siteId` (string, required): Site UUID

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "site": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "plotKey": "AREA-1-BLOCK-3-HOUSE-123",
      "status": "PENDING_REVIEW",
      "address": {
        "area": {
          "id": 1,
          "name": "Gulshan-e-Iqbal"
        },
        "block": {
          "id": 3,
          "name": "Block 1"
        },
        "houseNo": "123",
        "street": "Main Street",
        "nearestLandmark": "Near Park",
        "additionalDirections": "Behind the mosque"
      },
      "pinLocation": {
        "lat": 24.8607,
        "lng": 67.0011,
        "accuracy": 10.5,
        "capturedAt": "2025-01-15T09:00:00.000Z"
      },
      "consumerNo": "123456789",
      "documents": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440003",
          "type": "SSGC_BILL",
          "fileUri": "https://storage.googleapis.com/bucket/file.pdf",
          "imageData": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy...",
          "imageUrl": "/documents/880e8400-e29b-41d4-a716-446655440003?view=true",
          "uploadedBy": {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "firstName": "John",
            "lastName": "Doe"
          },
          "uploadedAt": "2025-01-15T08:30:00.000Z"
        },
        {
          "id": "990e8400-e29b-41d4-a716-446655440004",
          "type": "KE_BILL",
          "fileUri": "https://storage.googleapis.com/bucket/file2.pdf",
          "imageData": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy...",
          "imageUrl": "/documents/990e8400-e29b-41d4-a716-446655440004?view=true",
          "uploadedBy": {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "firstName": "John",
            "lastName": "Doe"
          },
          "uploadedAt": "2025-01-15T08:35:00.000Z"
        }
      ],
      "createdBy": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "firstName": "John",
        "lastName": "Doe",
        "primaryPhone": "+923001234567",
        "email": "john.doe@example.com",
        "userType": "CONSUMER"
      },
      "members": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "firstName": "John",
          "lastName": "Doe",
          "primaryPhone": "+923001234567",
          "userType": "CONSUMER"
        }
      ],
      "verificationHistory": [
        {
          "id": "aa0e8400-e29b-41d4-a716-446655440005",
          "action": "APPROVE",
          "fromStatus": "PENDING_REVIEW",
          "toStatus": "APPROVED",
          "note": "Manually verified",
          "createdAt": "2025-01-15T10:45:00.000Z",
          "employee": {
            "id": "bb0e8400-e29b-41d4-a716-446655440006",
            "fullName": "Reviewer Name"
          }
        }
      ]
    }
  }
}
```

**Use Case:**
- Reviewer needs to review site details for manual verification
- Returns all structured data: address, pin location, bills, documents
- Shows verification history
- Helps reviewer make informed decision

**Error Responses:**
- `404`: Site not found

---

#### 14. Approve Manual Verification

Approves manual verification with area and block approval. Used when existing site is found and needs manual verification.

**Endpoint:** `POST /reviewer/sites/:siteId/approve-manual-verification`

**URL Parameters:**
- `siteId` (string, required): Site UUID

**Request Body:**
```json
{
  "areaApproved": true,
  "blockApproved": true,
  "notes": "Verified via documents and location pin. All details match."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "site": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "APPROVED",
      "statusReason": "Verified via documents and location pin. All details match.",
      "updatedAt": "2025-01-15T10:45:00.000Z"
    },
    "area": {
      "id": 1,
      "name": "Gulshan-e-Iqbal"
    },
    "block": {
      "id": 3,
      "name": "Block 1"
    },
    "approved": true
  }
}
```

**Use Case:**
- Manual verification has 3 data points: area, block, and reviewer approval
- Reviewer reviews pin location, bills, and other structured data
- Reviewer approves both area and block
- Site status changes to APPROVED
- User onboarding stages are updated (A2 for CONSUMER, B2 for NON_CONSUMER)

**Validation:**
- Both `areaApproved` and `blockApproved` must be `true`
- If either is `false`, request will be rejected

**Error Responses:**
- `404`: Site not found
- `400`: Both area and block must be approved for manual verification

---

#### 15. Link Existing Site to User

Links an existing site to a user when an existing site is found (e.g., when user enters block/area/house that matches an existing site).

**Endpoint:** `POST /reviewer/sites/link-existing`

**Request Body:**
```json
{
  "siteId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440001",
  "notes": "User verified ownership via documents"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "membership": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "siteId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "660e8400-e29b-41d4-a716-446655440001",
      "role": "MEMBER",
      "isActive": true,
      "startedAt": "2025-01-15T10:35:00.000Z"
    },
    "site": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "address": {
        "area": "Gulshan-e-Iqbal",
        "block": "Block 1",
        "houseNo": "123",
        "street": "Main Street"
      }
    }
  }
}
```

**Use Case:**
- User enters address that matches existing site (e.g., "A-123 already exists")
- Reviewer verifies user's ownership
- Reviewer links site to user via manual verification
- Creates SiteMembership and updates user's currentSiteId

**Error Responses:**
- `404`: Site or User not found
- `400`: User is already a member of this site

---

## Workflow Examples

### Workflow 1: Complete Site Review Process

1. Reviewer gets pending reviews
2. Reviewer assigns review to themselves
3. Reviewer gets review details (site, documents, address)
4. Reviewer reviews pin location, bills, documents
5. If address is incorrect, reviewer updates site details
6. Reviewer approves or rejects the site

**API Calls:**
```javascript
// 1. Get pending reviews (no assignment needed - single reviewer)
GET /reviewer/reviews/pending

// 2. Get review details
GET /reviewer/reviews/:reviewId

// 3. Update site details if needed
PUT /reviewer/sites/:siteId/update-details
{
  "houseNo": "456",
  "street": "Correct Street Name"
}

// 4. Approve site
POST /reviewer/reviews/:reviewId/action
{
  "action": "approve",
  "notes": "Site verified and approved"
}
```

### Workflow 2: User Enters Non-Existent Block

1. User submits site with block "A-123" that doesn't exist
2. Area exists in system
3. Reviewer calls create block endpoint
4. Reviewer updates site with new blockId
5. Reviewer approves site

**API Calls:**
```javascript
// 1. Request admin to add block
POST /reviewer/requests/add-block
{
  "areaId": 1,
  "blockName": "A-123",
  "notes": "User submitted site with this block but it doesn't exist"
}

// 2. After admin approves, update site with new block
PUT /reviewer/sites/:siteId/update-details
{
  "blockId": 5  // ID from admin-created block
}

// 3. Approve site
POST /reviewer/reviews/:reviewId/action
{
  "action": "approve",
  "notes": "Block added and verified"
}
```

### Workflow 3: Existing Site Found - Manual Verification

1. User enters address that matches existing site
2. System detects existing site (e.g., "A-123 already exists")
3. Reviewer calls get site for manual verification
4. Reviewer verifies documents, pin location, bills
5. Reviewer approves manual verification (area + block)
6. Reviewer links site to user

**API Calls:**
```javascript
// 1. Get site details for review
GET /reviewer/sites/:siteId/manual-verification

// 2. Approve manual verification
POST /reviewer/sites/:siteId/approve-manual-verification
{
  "areaApproved": true,
  "blockApproved": true,
  "notes": "Verified via documents"
}

// 3. Link site to user
POST /reviewer/sites/link-existing
{
  "siteId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440001",
  "notes": "User verified ownership"
}
```

### Workflow 4: Fix Incorrect Site Details

1. Reviewer notices incorrect address in site
2. Reviewer calls update site details endpoint
3. Changes are automatically logged in audit logs
4. Reviewer approves site after verification

**API Calls:**
```javascript
// 1. Update site details
PUT /reviewer/sites/:siteId/update-details
{
  "houseNo": "456",
  "street": "Correct Street Name",
  "nearestLandmark": "Updated Landmark"
}

// 2. Approve after verification
POST /reviewer/reviews/:reviewId/action
{
  "action": "approve",
  "notes": "Details corrected and verified"
}
```

---

## Data Structures

### Site Verification Case
```typescript
{
  id: string; // UUID
  siteId: string; // UUID
  status: "SUBMITTED" | "PENDING_REVIEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ARCHIVED";
  currentAssigneeEmployeeId?: string; // UUID
  priority: string; // "LOW" | "NORMAL" | "HIGH" | "URGENT"
  slaDueAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Site Object (Detailed)
```typescript
{
  id: string; // UUID
  plotKey: string;
  status: "SUBMITTED" | "PENDING_REVIEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ARCHIVED";
  areaId: number;
  blockId: number;
  houseNo?: string;
  street?: string;
  nearestLandmark?: string;
  additionalDirections?: string;
  pinLat?: number;
  pinLng?: number;
  pinAccuracyM?: number;
  pinCapturedAt?: string; // ISO 8601
  consumerNoClaimed?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  area: {
    id: number;
    name: string;
  };
  block: {
    id: number;
    name: string;
  };
}
```

### Block Object
```typescript
{
  id: number;
  areaId: number;
  name: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Document Object
```typescript
{
  id: string; // UUID
  type: "SSGC_BILL" | "KE_BILL" | "OTHER_UTILITY" | "OTHER";
  fileUri: string; // Original file URI (GCS URL or processed URI)
  imageData: string | null; // Base64 encoded image/file data (format: "data:{mimeType};base64,{base64String}")
  imageUrl: string; // Direct URL to view/download image (format: "/documents/{id}?view=true")
  uploadedBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  uploadedAt: string; // ISO 8601 timestamp
}
```

**Image Viewing:**
- `imageData`: Base64 encoded image/file that can be used directly in `<img>` tags: `<img src={document.imageData} />`
- `imageUrl`: Direct URL endpoint to get the binary image/file. Use `GET /documents/:documentId?view=true` to retrieve the actual file.
- If image cannot be loaded, `imageData` will be `null` but `imageUrl` will still be available.
- For large files, prefer using `imageUrl` instead of `imageData` to reduce response size.

### SiteMembership Object
```typescript
{
  id: string; // UUID
  siteId: string;
  userId: string;
  role: "OWNER" | "REGISTRANT" | "MEMBER";
  isActive: boolean;
  startedAt: string; // ISO 8601
}
```

### SiteVerificationEvent Object
```typescript
{
  id: string; // UUID
  siteId: string;
  caseId?: string;
  action: "ASSIGN" | "UNASSIGN" | "REQUEST_CORRECTION" | "APPROVE" | "REJECT" | "SUSPEND" | "UNSUSPEND" | "ARCHIVE" | "UNARCHIVE";
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  evidence?: object;
  createdAt: string; // ISO 8601
  employee?: {
    id: string;
    fullName: string;
  };
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

- `NOT_FOUND` (404): Resource not found (Site, User, Area, Block, Review Case)
- `VALIDATION_ERROR` (400): Invalid input data or business rule violation
- `UNAUTHORIZED` (401): Missing or invalid authentication token
- `FORBIDDEN` (403): Insufficient permissions
- `DATABASE_ERROR` (500): Database operation failed
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

### Example Error Response
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Block does not belong to the specified area"
}
```

---

## Audit Logging

All reviewer actions are automatically logged in the `audit_log` table with:
- **Actor**: Employee ID and type
- **Entity**: Type and ID of affected entity (Site, GeoBlock, SiteMembership, SiteVerificationCase)
- **Action**: Action performed (CREATE_BLOCK, UPDATE_BLOCK, LINK_EXISTING_SITE, UPDATE_SITE_DETAILS, APPROVE_MANUAL_VERIFICATION, APPROVE, REJECT, etc.)
- **Before/After**: State changes (JSON)
- **Timestamp**: When action was performed

Additionally, `SiteVerificationEvent` records are created for all site-related actions to maintain a complete verification history.

---

## Notes for Frontend Developers

1. **Authentication**: Always include JWT token in `Authorization` header
2. **Base URL**: All reviewer endpoints use `/reviewer` prefix (not `/employees`)
3. **Login**: Use `/employee/login` for authentication (same as before)
4. **Single Reviewer**: No assignment needed - all pending reviews are available directly
5. **Overview API**: Use `GET /reviewer/overview` for dashboard page
6. **Error Handling**: Check `success` field in response before accessing `data`
7. **Validation**: Validate required fields before making API calls
8. **Loading States**: Show loading indicators during API calls
9. **Success Messages**: Display success messages after successful operations
10. **Error Messages**: Show user-friendly error messages from `message` field
11. **Form Handling**: Use partial updates - only send fields that need to be updated
12. **Manual Verification**: Ensure both `areaApproved` and `blockApproved` are `true` before submitting
13. **Site Details**: Use `GET /reviewer/sites/:siteId/manual-verification` to get complete site data for review
14. **Audit Trail**: All changes are logged automatically - no need to handle logging on frontend
15. **Status Flow**: Site status flows: SUBMITTED → PENDING_REVIEW → UNDER_REVIEW → APPROVED/REJECTED

---

## Testing

### Test Scenarios

1. **Get Pending Reviews**: Test retrieving unassigned reviews
2. **Assign Review**: Test assigning review to current reviewer
3. **Get Review Details**: Test getting complete site verification details
4. **Update Site Details**: Test partial updates (only some fields)
5. **Create Block**: Test with new block name and existing area
6. **Approve Manual Verification**: Test with both approvals true
7. **Link Existing Site**: Test with valid siteId and userId
8. **Review Action**: Test approve and reject actions
9. **Error Cases**: Test with invalid IDs, missing fields, validation errors

### Sample cURL Commands

```bash
# Get Reviewer Overview
curl -X GET http://localhost:3000/reviewer/overview \
  -H "Authorization: Bearer <token>"

# Get Pending Reviews
curl -X GET http://localhost:3000/reviewer/reviews/pending \
  -H "Authorization: Bearer <token>"

# Get Review Details
curl -X GET http://localhost:3000/reviewer/reviews/aa0e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"

# Get All Areas
curl -X GET http://localhost:3000/reviewer/geo/areas \
  -H "Authorization: Bearer <token>"

# Get Blocks by Area
curl -X GET http://localhost:3000/reviewer/geo/areas/1/blocks \
  -H "Authorization: Bearer <token>"

# Request Add Area
curl -X POST http://localhost:3000/reviewer/requests/add-area \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"areaName": "New Area", "allowsNonConsumer": false, "notes": "Request to add new area"}'

# Request Add Block
curl -X POST http://localhost:3000/reviewer/requests/add-block \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"areaId": 1, "blockName": "New Block", "notes": "Request to add new block"}'

# Get All Areas
curl -X GET http://localhost:3000/reviewer/geo/areas \
  -H "Authorization: Bearer <token>"

# Get Blocks by Area
curl -X GET http://localhost:3000/reviewer/geo/areas/1/blocks \
  -H "Authorization: Bearer <token>"

# Request Add Area
curl -X POST http://localhost:3000/reviewer/requests/add-area \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"areaName": "New Area", "allowsNonConsumer": false, "notes": "Request to add new area"}'

# Request Add Block
curl -X POST http://localhost:3000/reviewer/requests/add-block \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"areaId": 1, "blockName": "New Block", "notes": "Request to add new block"}'

# Get Site for Manual Verification
curl -X GET http://localhost:3000/reviewer/sites/550e8400-e29b-41d4-a716-446655440000/manual-verification \
  -H "Authorization: Bearer <token>"

# Update Site Details
curl -X PUT http://localhost:3000/reviewer/sites/550e8400-e29b-41d4-a716-446655440000/update-details \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"houseNo": "456", "street": "Updated Street"}'

# Approve Manual Verification
curl -X POST http://localhost:3000/reviewer/sites/550e8400-e29b-41d4-a716-446655440000/approve-manual-verification \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"areaApproved": true, "blockApproved": true, "notes": "Verified"}'

# Review Action (Approve)
curl -X POST http://localhost:3000/reviewer/reviews/aa0e8400-e29b-41d4-a716-446655440000/action \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "notes": "Site verified"}'
```

---

## Support

For questions or issues, contact the backend team or refer to the main API documentation.

**Last Updated:** January 2025
