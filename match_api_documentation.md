# Match Module API Documentation

## Base URL
```
https://your-api-domain.com/api/v1/match
```

## Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Match Module

### 2.1 Get Potential Matches
- **Endpoint:** `GET /match/potential`
- **Description:** Get list of users to swipe on
- **Auth Required:** Yes
- **Query Parameters:**
  - `page` - Page number (optional)
  - `limit` - Results per page (optional)
- **Success Response:**
```json
{
  "success": true,
  "message": "Potential matches retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "68be7282a0db89cc44e432d6",
      "email": "user8@example.com",
      "image": null,
      "phoneNumber": null,
      "lastLoginAt": "2025-09-08T06:07:23.096Z",
      "dateOfBirth": "2001-03-28T00:00:00.000Z",
      "firstName": "Lina",
      "lastName": "Rahman",
      "profile": {
        "_id": "68be741b610226cf5ddbbbf6",
        "userId": "68be7282a0db89cc44e432d6",
        "bio": "Test user 9",
        "gender": "male",
        "interests": [
          "fitness",
          "movies",
          "travel"
        ],
        "jobTitle": "Developer"
      }
    },
    {
      "_id": "68be743da0db89cc44e432e4",
      "email": "user9@example.com",
      "image": null,
      "phoneNumber": null,
      "lastLoginAt": "2025-09-08T06:14:50.424Z",
      "dateOfBirth": "1994-07-10T00:00:00.000Z",
      "firstName": "Sam",
      "lastName": "Taylor",
      "profile": {
        "_id": "68be950f610226cf5ddbc8db",
        "userId": "68be743da0db89cc44e432e4",
        "bio": "Test user 9",
        "gender": "male",
        "interests": [
          "fitness",
          "photography",
          "travel"
        ],
        "jobTitle": "Developer",
        "hiddenFields": {
          "school": false
        }
      }
    }
  ]
}
```

---

### 2.2 Perform Action (Swipe)
- **Endpoint:** `POST /match/action`
- **Description:** Swipe on a user (skip or love)
- **Auth Required:** Yes
- **Body:**
```json
{
  "toUserId": "user_id_here",
  "action": "love"
}
```
- **Note:** `action` can be "skip" or "love"
- **Success Response (Mutual Match - Both users loved each other):**
```json
{
  "success": true,
  "message": "It's a match! 🎉 Connection created automatically",
  "data": {
    "isMatch": true,
    "connection": {
      "userIds": [
        "68be6aeba0db89cc44e4328c",
        "68be64b2a0db89cc44e43270"
      ],
      "_id": "68bfb443309c7bb4c611f393",
      "createdAt": "2025-09-09T04:59:47.224Z",
      "updatedAt": "2025-09-09T04:59:47.224Z"
    }
  }
}
```
- **Success Response (Love Sent - Waiting for their response):**
```json
{
  "success": true,
  "message": "Love sent! Waiting for their response ❤️",
  "data": {
    "connectionRequest": {
      "fromUserId": "68be64b2a0db89cc44e43270",
      "toUserId": "68be7282a0db89cc44e432d6",
      "status": "pending",
      "_id": "68bfad208ec44ff5c24be206",
      "createdAt": "2025-09-09T04:29:20.379Z",
      "updatedAt": "2025-09-09T04:29:20.379Z"
    }
  }
}
```
- **Success Response (Skip Action):**
```json
{
  "success": true,
  "message": "Action 'skip' performed successfully",
  "data": {}
}
```

---

### 2.3 Get Connection Requests
- **Endpoint:** `GET /match/requests`
- **Description:** Get all connection requests you received
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "message": "Connection requests retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 9999,
    "total": 1,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "68bfba00309c7bb4c611f3a9",
      "fromUserId": {
        "_id": "68be64b2a0db89cc44e43270",
        "image": null,
        "verified": true,
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe"
      },
      "toUserId": "68be6aeba0db89cc44e4328c",
      "status": "pending",
      "createdAt": "2025-09-09T05:24:16.109Z",
      "updatedAt": "2025-09-09T05:24:16.109Z"
    }
  ]
}
```

---

### 2.4 Respond to Connection Request
- **Endpoint:** `PATCH /match/requests/:requestId`
- **Description:** Accept or reject a connection request
- **Auth Required:** Yes
- **URL Parameter:**
  - `requestId` - Request ID (e.g., 68bfba00309c7bb4c611f3a9)
- **Body:**
```json
{
  "action": "accept"
}
```
- **Note:** `action` can be "accept" or "reject"
- **Success Response:**
```json
{
  "success": true,
  "message": "Connection request accepted! 🎉",
  "data": {
    "message": "Connection request accepted! 🎉",
    "connection": {
      "userIds": [
        "68be64b2a0db89cc44e43270",
        "68be6aeba0db89cc44e4328c"
      ],
      "_id": "68bfc125309c7bb4c611f3bd",
      "createdAt": "2025-09-09T05:54:45.519Z",
      "updatedAt": "2025-09-09T05:54:45.519Z"
    }
  }
}
```

---

### 2.5 Get Connections (Matches)
- **Endpoint:** `GET /match/connections`
- **Description:** Get all your matched connections
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "message": "Connections retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 9999,
    "total": 1,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "68bfc125309c7bb4c611f3bd",
      "userIds": [
        {
          "_id": "68be64b2a0db89cc44e43270",
          "image": null,
          "verified": true,
          "firstName": "John",
          "lastName": "Doe",
          "fullName": "John Doe"
        },
        {
          "_id": "68be6aeba0db89cc44e4328c",
          "image": null,
          "verified": true,
          "firstName": "Rahim",
          "lastName": "Khan",
          "fullName": "Rahim Khan"
        }
      ],
      "createdAt": "2025-09-09T05:54:45.519Z",
      "updatedAt": "2025-09-09T05:54:45.519Z"
    }
  ]
}
```

---

### 2.6 Get Sent Requests
- **Endpoint:** `GET /match/sent-requests`
- **Description:** Get all connection requests you sent
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "message": "Sent requests retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 9999,
    "total": 1,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "68bfba00309c7bb4c611f3a9",
      "fromUserId": "68be64b2a0db89cc44e43270",
      "toUserId": {
        "_id": "68be6aeba0db89cc44e4328c",
        "image": null,
        "verified": true,
        "firstName": "Rahim",
        "lastName": "Khan",
        "fullName": "Rahim Khan"
      },
      "status": "pending",
      "createdAt": "2025-09-09T05:24:16.109Z",
      "updatedAt": "2025-09-09T05:24:16.109Z"
    }
  ]
}
```

---

## Important Notes

### 1. Matching Algorithm
- Only shows verified users with complete profiles
- Excludes users you've already swiped on (skip or love)
- Excludes users you've blocked or who blocked you
- Respects your age range and distance preferences

### 2. Connection Flow
1. **Skip Action:** User is removed from your potential matches, no notification sent
2. **Love Action:** 
   - If they already loved you → Instant match 🎉
   - If they haven't → Connection request sent, waiting for response ❤️
3. **Accept Request:** Creates mutual connection (match)
4. **Reject Request:** Removes the request, they won't know

### 3. Match vs Connection Request
- **Match:** Both users loved each other (mutual connection)
- **Connection Request:** One-sided love, waiting for response
- Only matches can message each other

### 4. Request Status
- `pending` - Waiting for response
- `accepted` - Now a match (can chat)
- `rejected` - Request declined

### 5. Swipe Actions
Only two actions are supported:
- `skip` - Pass on this user
- `love` - Send love/like to this user

### 6. Pagination Support
- Use `page` and `limit` query parameters for potential matches
- Default: page 1, limit 10
- Response includes `meta` object with total count

### 7. Match Notifications
- When you get a match, you should receive it via Socket.IO
- Connection requests appear in `/match/requests` endpoint
- Check Socket documentation for real-time match events

### 8. Important Checks
- Users must have mutual connection to send messages
- Cannot swipe on the same user twice
- Cannot send connection request if already connected
- Blocked users won't appear in potential matches

### 9. Error Responses

All errors follow this structure:
```json
{
  "success": false,
  "message": "Error message here",
  "errorSources": [
    {
      "path": "fieldName",
      "message": "Field-specific error message"
    }
  ],
  "err": { "issues": [...], "name": "ZodError" },
  "stack": "..."
}
```

**HTTP Status Codes:**
- `400` - Invalid action type, user ID, or validation error
- `403` - Cannot perform action (blocked, no profile, etc.)
- `404` - User not found or request not found
- `409` - Already interacted with this user