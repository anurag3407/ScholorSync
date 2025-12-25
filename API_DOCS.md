# 📡 ScholarSync API Documentation

> **Complete API Reference for ScholarSync Platform**

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Scholarships API](#scholarships-api)
4. [Profile API](#profile-api)
5. [Chatbot API](#chatbot-api)
6. [Analytics API](#analytics-api)
7. [Stacking API](#stacking-api)
8. [Calendar API](#calendar-api)
9. [Community API](#community-api)
10. [Intelligence API](#intelligence-api)
11. [Scraper API](#scraper-api)
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)

---

## 🌐 Overview

### Base URL
```
Production: https://scholarsync.vercel.app/api
Development: http://localhost:3000/api
```

### Response Format
All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Or for errors:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Headers

```http
Content-Type: application/json
Authorization: Bearer <firebase_id_token>
```

---

## 🔐 Authentication

All authenticated endpoints require a Firebase ID token.

### Get User Token

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const token = await auth.currentUser?.getIdToken();
```

### Include in Request

```javascript
fetch('/api/scholarships', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🎓 Scholarships API

### List All Scholarships

```http
GET /api/scholarships
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category (merit, need, minority) |
| `state` | string | - | Filter by state |
| `minAmount` | number | 0 | Minimum amount |
| `maxAmount` | number | - | Maximum amount |
| `limit` | number | 50 | Results per page |
| `offset` | number | 0 | Pagination offset |

**Example Request:**
```bash
curl -X GET "https://scholarsync.vercel.app/api/scholarships?state=Maharashtra&limit=10"
```

**Example Response:**
```json
{
  "success": true,
  "scholarships": [
    {
      "id": "sch_001",
      "name": "Maharashtra State Scholarship",
      "provider": "Maharashtra Government",
      "type": "government",
      "amount": {
        "min": 10000,
        "max": 25000
      },
      "deadline": "2025-03-15",
      "eligibility": {
        "categories": ["SC", "ST", "OBC"],
        "incomeLimit": 250000,
        "minPercentage": 60,
        "states": ["Maharashtra"]
      }
    }
  ],
  "total": 45,
  "hasMore": true
}
```

---

### Match Scholarships

```http
POST /api/scholarships/match
```

**Request Body:**

```json
{
  "uid": "user_firebase_uid",
  "filters": {
    "minMatch": 70,
    "limit": 20
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "scholarships": [
    {
      "id": "sch_001",
      "name": "NSP Post Matric",
      "matchPercentage": 95,
      "matchReasons": [
        "Income eligible",
        "Category matches",
        "State eligible"
      ],
      "missingCriteria": []
    }
  ],
  "totalMatched": 15
}
```

---

### Save Scholarship

```http
POST /api/scholarships/save
```

**Request Body:**

```json
{
  "userId": "user_firebase_uid",
  "scholarshipId": "sch_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scholarship saved successfully",
  "savedAt": "2025-01-29T10:30:00Z"
}
```

---

### Get Scholarship Explanation

```http
POST /api/scholarships/explain
```

**Request Body:**

```json
{
  "scholarshipId": "sch_001",
  "userId": "user_firebase_uid"
}
```

**Response:**
```json
{
  "success": true,
  "explanation": {
    "summary": "This scholarship is ideal for you because...",
    "eligibility": "You meet 4 out of 5 criteria...",
    "applicationTips": [
      "Focus on your academic achievements",
      "Highlight extracurricular activities"
    ],
    "deadline": "Apply before March 15, 2025",
    "documentsNeeded": [
      "Income Certificate",
      "Marksheet",
      "Caste Certificate"
    ]
  }
}
```

---

### Why Not Me Analysis

```http
POST /api/scholarships/why-not-me
```

**Request Body:**

```json
{
  "scholarshipId": "sch_001",
  "userId": "user_firebase_uid"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "matchScore": 45,
    "blockers": [
      {
        "criterion": "Category",
        "required": "Minority",
        "yours": "General",
        "impact": "high"
      }
    ],
    "suggestions": [
      "Consider these alternative scholarships instead..."
    ],
    "alternatives": [
      {
        "id": "sch_002",
        "name": "General Merit Scholarship",
        "matchScore": 85
      }
    ]
  }
}
```

---

## 👤 Profile API

### Get User Profile

```http
GET /api/profile?uid=<user_uid>
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "name": "Rahul Kumar",
    "category": "OBC",
    "income": 350000,
    "percentage": 85,
    "branch": "Computer Science",
    "year": 2,
    "state": "Maharashtra",
    "college": "IIT Bombay",
    "gender": "Male",
    "achievements": ["State Chess Champion"],
    "isComplete": true
  },
  "savedScholarships": ["sch_001", "sch_002"],
  "appliedScholarships": [
    {
      "id": "sch_001",
      "status": "applied",
      "appliedOn": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### Update Profile

```http
PATCH /api/profile/update
```

**Request Body:**

```json
{
  "uid": "user_firebase_uid",
  "updates": {
    "income": 400000,
    "percentage": 88,
    "achievements": ["State Chess Champion", "Hackathon Winner"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

---

## 🤖 Chatbot API

### Send Message

```http
POST /api/chatbot
```

**Request Body:**

```json
{
  "message": "What scholarships are available for SC students in Karnataka?",
  "userId": "user_firebase_uid",
  "sessionId": "session_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Here are the top scholarships for SC students in Karnataka:\n\n1. **Karnataka Post Matric SC Scholarship** - ₹20,000/year\n   - Deadline: March 15, 2025\n   - For: SC students with income < 2.5 lakhs\n\n2. **Central Sector Scheme** - ₹20,000/year\n   - Deadline: December 31, 2025\n   - For: SC students with 80%+ marks",
  "sources": [
    {
      "title": "Karnataka Post Matric SC",
      "similarity": 0.94,
      "url": "https://..."
    }
  ],
  "followUpQuestions": [
    "Would you like eligibility details?",
    "How do I apply for these scholarships?"
  ]
}
```

---

### Check Eligibility

```http
POST /api/chatbot/eligibility
```

**Request Body:**

```json
{
  "scholarshipId": "sch_001",
  "userId": "user_firebase_uid"
}
```

**Response:**
```json
{
  "success": true,
  "eligibility": {
    "isEligible": true,
    "score": 85,
    "criteria": [
      { "name": "Category", "status": "pass", "message": "SC matches" },
      { "name": "Income", "status": "pass", "message": "₹2L < ₹2.5L limit" },
      { "name": "Percentage", "status": "pass", "message": "75% > 60% required" },
      { "name": "State", "status": "pass", "message": "Karnataka eligible" }
    ],
    "recommendation": "You are highly eligible. Apply before the deadline!"
  }
}
```

---

## 📊 Analytics API

### Get Dashboard Analytics

```http
GET /api/analytics?userId=<user_uid>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "overview": {
      "totalScholarships": 150,
      "matchedScholarships": 45,
      "savedScholarships": 12,
      "appliedScholarships": 5
    },
    "amounts": {
      "totalPotential": 2500000,
      "appliedValue": 350000,
      "approvedValue": 80000
    },
    "deadlines": {
      "upcoming": 8,
      "thisWeek": 2,
      "expired": 3
    },
    "progress": {
      "profileCompletion": 85,
      "documentUploads": 60,
      "applicationProgress": 42
    },
    "trends": {
      "matchScoreHistory": [
        { "date": "2025-01-01", "score": 75 },
        { "date": "2025-01-15", "score": 82 },
        { "date": "2025-01-29", "score": 85 }
      ]
    }
  }
}
```

---

## 📚 Stacking API

### Analyze Scholarship Combinations

```http
POST /api/stacking
```

**Request Body:**

```json
{
  "scholarshipIds": ["sch_001", "sch_002", "sch_003", "sch_004"],
  "userId": "user_firebase_uid"
}
```

**Response:**
```json
{
  "success": true,
  "combinations": [
    {
      "id": "combo_1",
      "scholarships": ["sch_001", "sch_002", "sch_004"],
      "totalAmount": 160000,
      "isOptimal": true,
      "conflicts": [],
      "applicationOrder": ["sch_002", "sch_001", "sch_004"],
      "timeline": {
        "sch_002": "2025-02-15",
        "sch_001": "2025-03-01",
        "sch_004": "2025-03-31"
      }
    },
    {
      "id": "combo_2",
      "scholarships": ["sch_001", "sch_003"],
      "totalAmount": 100000,
      "isOptimal": false,
      "conflicts": [
        {
          "between": ["sch_002", "sch_003"],
          "reason": "Same funding source (Central Government)"
        }
      ]
    }
  ],
  "recommendation": "Combo 1 provides maximum benefit with no conflicts."
}
```

---

## 📅 Calendar API

### Get Deadlines

```http
GET /api/calendar?userId=<user_uid>
```

**Response:**
```json
{
  "success": true,
  "deadlines": [
    {
      "id": "dl_001",
      "scholarshipId": "sch_001",
      "scholarshipName": "NSP Post Matric",
      "deadline": "2025-03-15",
      "daysLeft": 45,
      "priority": "high",
      "status": "upcoming"
    }
  ],
  "reminders": [
    {
      "id": "rem_001",
      "type": "deadline",
      "message": "NSP Post Matric deadline in 7 days",
      "date": "2025-03-08"
    }
  ]
}
```

---

### Export ICS Calendar

```http
POST /api/calendar/export
```

**Request Body:**

```json
{
  "userId": "user_firebase_uid",
  "scholarshipIds": ["sch_001", "sch_002"],
  "includeReminders": true
}
```

**Response:**
```json
{
  "success": true,
  "icsContent": "BEGIN:VCALENDAR\nVERSION:2.0\n...",
  "downloadUrl": "https://..."
}
```

---

## 👥 Community API

### Get Posts

```http
GET /api/community?type=<stories|discussions>&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "post_001",
      "type": "story",
      "title": "How I got the INSPIRE scholarship",
      "content": "Here are my tips...",
      "author": {
        "id": "user_001",
        "name": "Priya Sharma",
        "avatar": "PS"
      },
      "likes": 42,
      "comments": 12,
      "tags": ["INSPIRE", "Science", "Tips"],
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasMore": true
  }
}
```

---

### Create Post

```http
POST /api/community
```

**Request Body:**

```json
{
  "type": "story",
  "title": "My scholarship journey",
  "content": "I want to share my experience...",
  "tags": ["NSP", "Tips", "Success"],
  "userId": "user_firebase_uid"
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post_002",
    "type": "story",
    "title": "My scholarship journey",
    "createdAt": "2025-01-29T10:30:00Z"
  }
}
```

---

### Vote on Post

```http
PATCH /api/community/<post_id>/vote
```

**Request Body:**

```json
{
  "userId": "user_firebase_uid",
  "vote": "up"
}
```

**Response:**
```json
{
  "success": true,
  "newScore": 43
}
```

---

## 📈 Intelligence API

### Get Market Insights

```http
GET /api/intelligence?userId=<user_uid>
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "trends": {
      "totalScholarshipValue": 50000000000,
      "growthRate": 12,
      "popularCategories": [
        { "name": "Merit", "count": 450, "growth": 15 },
        { "name": "Need-based", "count": 380, "growth": 8 }
      ]
    },
    "regional": {
      "topStates": [
        { "state": "Maharashtra", "scholarships": 120, "value": 5000000000 },
        { "state": "Karnataka", "scholarships": 95, "value": 4200000000 }
      ]
    },
    "competition": {
      "averageApplicants": 50000,
      "successRate": 15,
      "bestTimeToApply": "First 2 weeks"
    },
    "recommendations": [
      "Apply early - first week applicants have 30% higher success",
      "Focus on state scholarships - less competition",
      "Complete profile for 40% better matching"
    ]
  }
}
```

---

## 🕷️ Scraper API

### Trigger Scrape (Admin Only)

```http
POST /api/scraper/run
```

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "portals": ["maharashtra", "karnataka"],
  "fullScrape": false
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "scrape_001",
  "status": "started",
  "estimatedTime": "10 minutes"
}
```

---

## ⚠️ Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": "User profile not found",
  "code": "NOT_FOUND",
  "details": {
    "userId": "user_123"
  }
}
```

---

## 🚦 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/chatbot` | 30 | 1 minute |
| `/api/scholarships/match` | 10 | 1 minute |
| `/api/scholarships/*` | 100 | 1 minute |
| `/api/community` | 50 | 1 minute |
| All others | 100 | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706523600
```

---

## 📦 SDKs & Libraries

### JavaScript/TypeScript

```typescript
import { ScholarSyncClient } from '@scholarsync/sdk';

const client = new ScholarSyncClient({
  apiKey: 'your_api_key'
});

// Get scholarships
const scholarships = await client.scholarships.list({
  state: 'Maharashtra',
  limit: 10
});

// Match scholarships
const matches = await client.scholarships.match({
  userId: 'user_123'
});
```

### Python

```python
from scholarsync import ScholarSyncClient

client = ScholarSyncClient(api_key='your_api_key')

# Get scholarships
scholarships = client.scholarships.list(state='Maharashtra', limit=10)

# Match scholarships
matches = client.scholarships.match(user_id='user_123')
```

---

## 🔗 Webhooks

Configure webhooks to receive real-time updates:

### Events

| Event | Description |
|-------|-------------|
| `scholarship.new` | New scholarship added |
| `scholarship.updated` | Scholarship details updated |
| `deadline.approaching` | Deadline within 7 days |
| `application.status` | Application status changed |

### Webhook Payload

```json
{
  "event": "deadline.approaching",
  "timestamp": "2025-01-29T10:30:00Z",
  "data": {
    "scholarshipId": "sch_001",
    "scholarshipName": "NSP Post Matric",
    "deadline": "2025-02-05",
    "daysLeft": 7
  }
}
```

---

<p align="center">
  <strong>ScholarSync API v1.0</strong><br/>
  Need help? Contact support@scholarsync.in
</p>
