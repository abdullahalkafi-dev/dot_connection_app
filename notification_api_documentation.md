# Notification API Documentation

## Base URL
```
/api/v1/notification
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Get User Notifications
Retrieve all notifications for the authenticated user with pagination and filtering.

**Endpoint:** `GET /api/v1/notification`

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)
- `isRead` (string, optional) - Filter by read status ('true' or 'false')
- `type` (string, optional) - Filter by type ('match', 'message', 'connection_request', 'general')

**Example Request:**
```http
GET /api/v1/notification?page=1&limit=20&isRead=false&type=message
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "title": "New Message",
      "body": "John sent you a message",
      "type": "message",
      "relatedId": "507f1f77bcf86cd799439012",
      "isRead": false,
      "data": {
        "senderId": "507f191e810c19729de860eb",
        "messageId": "507f1f77bcf86cd799439012",
        "messageType": "text"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPage": 3,
    "unreadCount": 12
  }
}
```

---

### 2. Get Unread Count
Get the count of unread notifications for the authenticated user.

**Endpoint:** `GET /api/v1/notification/unread-count`

**Example Request:**
```http
GET /api/v1/notification/unread-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 12
  }
}
```

---

### 3. Mark Notification as Read
Mark a specific notification as read.

**Endpoint:** `PATCH /api/v1/notification/:notificationId/read`

**URL Parameters:**
- `notificationId` (string, required) - The notification ID

**Example Request:**
```http
PATCH /api/v1/notification/507f1f77bcf86cd799439011/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "title": "New Message",
    "body": "John sent you a message",
    "type": "message",
    "isRead": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Notification not found or unauthorized"
}
```

---

### 4. Mark All Notifications as Read
Mark all unread notifications as read for the authenticated user.

**Endpoint:** `PATCH /api/v1/notification/read-all`

**Example Request:**
```http
PATCH /api/v1/notification/read-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "12 notification(s) marked as read",
  "data": {
    "modifiedCount": 12
  }
}
```

---

### 5. Delete Notification
Delete a specific notification.

**Endpoint:** `DELETE /api/v1/notification/:notificationId`

**URL Parameters:**
- `notificationId` (string, required) - The notification ID

**Example Request:**
```http
DELETE /api/v1/notification/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": null
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Notification not found or unauthorized"
}
```

---

### 6. Delete All Notifications
Delete all notifications for the authenticated user.

**Endpoint:** `DELETE /api/v1/notification`

**Example Request:**
```http
DELETE /api/v1/notification
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "45 notification(s) deleted",
  "data": {
    "deletedCount": 45
  }
}
```

---

## Notification Types

### 1. Match Notification
Sent when two users mutually like each other.

```json
{
  "title": "It's a Match! 🎉",
  "body": "You and John liked each other!",
  "type": "match",
  "data": {
    "matchedUserId": "507f191e810c19729de860eb",
    "connectionId": "507f1f77bcf86cd799439013"
  }
}
```

### 2. Connection Request Notification
Sent when a user likes another user (one-sided).

```json
{
  "title": "New Connection Request ❤️",
  "body": "John likes you!",
  "type": "connection_request",
  "data": {
    "requesterId": "507f191e810c19729de860eb",
    "requestId": "507f1f77bcf86cd799439014"
  }
}
```

### 3. Message Notification
Sent when a user receives a message while offline.

```json
{
  "title": "New Message",
  "body": "John: Hey, how are you?",
  "type": "message",
  "data": {
    "senderId": "507f191e810c19729de860eb",
    "messageId": "507f1f77bcf86cd799439015",
    "messageType": "text"
  }
}
```

### 4. General Notification
Generic notification type for other purposes.

```json
{
  "title": "System Notification",
  "body": "Your profile has been verified!",
  "type": "general",
  "data": {}
}
```

---

## FCM Integration

### Sending FCM Token
Users should send their FCM token during registration or login:

**Registration:**
```json
POST /api/v1/user/create
{
  "email": "user@example.com",
  "fcmToken": "eXaMpLe-FcM-ToKeN-123..."
}
```

**Login:**
```json
POST /api/v1/user/signin
{
  "email": "user@example.com",
  "otp": "123456",
  "fcmToken": "eXaMpLe-FcM-ToKeN-123..."
}
```

### Push Notification Behavior
- Notifications are sent via FCM when:
  - User is offline (not connected via socket)
  - User has `pushNotification` enabled (default: true)
  - User has a valid FCM token
  - Sender is not blocked by receiver

### Block Prevention
- Notifications are **NOT** sent if:
  - Receiver has blocked the sender
  - This applies to all notification types (match, message, connection_request)

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "You are not authorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Notification not found or unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Database Schema

```typescript
{
  _id: ObjectId,
  userId: ObjectId,              // Recipient user ID (indexed)
  title: string,                 // Max 100 characters
  body: string,                  // Max 500 characters
  type: enum,                    // 'match' | 'message' | 'connection_request' | 'general'
  relatedId: ObjectId,           // Optional - ID of related entity
  isRead: boolean,               // Default: false (indexed)
  data: Map<string, string>,     // Additional custom data
  createdAt: Date,               // Auto-generated
  updatedAt: Date                // Auto-generated
}
```

### Indexes
- `{ userId: 1, isRead: 1 }` - Filter unread notifications
- `{ userId: 1, createdAt: -1 }` - Sort by recent
- `{ userId: 1, type: 1, isRead: 1 }` - Filter by type and read status
- `{ createdAt: 1 }` - TTL index (auto-delete after 30 days)

---

## Usage Examples

### React Native Client Example

```javascript
import axios from 'axios';

// Setup axios with auth
const api = axios.create({
  baseURL: 'https://api.yourapp.com/api/v1',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Get notifications
async function getNotifications(page = 1) {
  try {
    const response = await api.get('/notification', {
      params: { page, limit: 20 }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
}

// Get unread count
async function getUnreadCount() {
  const response = await api.get('/notification/unread-count');
  return response.data.data.unreadCount;
}

// Mark as read
async function markAsRead(notificationId) {
  await api.patch(`/notification/${notificationId}/read`);
}

// Delete notification
async function deleteNotification(notificationId) {
  await api.delete(`/notification/${notificationId}`);
}
```

---

## Notes

1. **Auto-Expiration:** Notifications are automatically deleted after 30 days
2. **Pagination:** Default limit is 20, maximum is 100
3. **Real-time Updates:** Consider using Socket.IO for real-time notification updates
4. **FCM Token Management:** Update FCM token on every login to ensure delivery
5. **Privacy:** Users can disable push notifications via `pushNotification` field in user settings
