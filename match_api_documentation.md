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
  "data": [
    {
      "_id": "user_id",
      "firstName": "Jane",
      "age": 28,
      "profile": {
        "bio": "...",
        "photos": [...],
        "interests": [...]
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
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
- **Success Response (Match):**
```json
{
  "success": true,
  "message": "It's a match! 🎉",
  "data": {
    "isMatch": true,
    "message": "It's a match! 🎉"
  }
}
```
- **Success Response (No Match):**
```json
{
  "success": true,
  "message": "Love sent! Waiting for their response ❤️",
  "data": {
    "connectionRequest": {
      "_id": "request_id",
      "fromUserId": "your_id",
      "toUserId": "their_id",
      "status": "pending"
    }
  }
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
  "data": [
    {
      "_id": "request_id",
      "fromUserId": {
        "_id": "user_id",
        "firstName": "John",
        "profile": { ... }
      },
      "status": "pending",
      "createdAt": "2025-01-01T10:00:00Z"
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
  - `requestId` - Request ID
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
  "message": "Request accepted successfully",
  "data": {
    "_id": "request_id",
    "status": "accepted"
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
  "data": [
    {
      "_id": "user_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "profile": { ... },
      "matchedAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

### 2.6 Get Match History
- **Endpoint:** `GET /match/history`
- **Description:** Get your swipe history (all actions)
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "history_id",
      "toUserId": {
        "_id": "user_id",
        "firstName": "Jane"
      },
      "action": "love",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

### 2.7 Get Sent Requests
- **Endpoint:** `GET /match/sent-requests`
- **Description:** Get all connection requests you sent
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "request_id",
      "toUserId": {
        "_id": "user_id",
        "firstName": "Jane"
      },
      "status": "pending",
      "createdAt": "2025-01-01T10:00:00Z"
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
Common errors:
- `400` - Invalid action type or user ID
- `404` - User not found or request not found
- `409` - Already interacted with this user
- `403` - Cannot perform action (blocked, no profile, etc.)