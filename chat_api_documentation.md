# Chat Module API Documentation

## Base URL
```
https://your-api-domain.com/api/v1/chat
```

## Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Chat Module

### 3.1 Get Chat List
- **Endpoint:** `GET /chat`
- **Description:** Get list of all your conversations with matched users
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "message": "Chat list retrieved successfully",
  "data": [
    {
      "_id": "68bfc125309c7bb4c611f3bd",
      "participant": {
        "_id": "68be6aeba0db89cc44e4328c",
        "firstName": "Rahim",
        "lastName": "Khan",
        "image": ""
      },
      "lastMessage": "",
      "lastMessageTime": "2025-09-09T05:54:45.519Z",
      "unreadCount": 0,
      "isRead": true
    }
  ]
}
```

---

## Important Notes

### 1. Chat List Behavior
- Only shows chats with users you've matched with (mutual connections)
- Sorted by most recent message first
- Each chat includes:
  - `_id` - Chat conversation ID
  - `participant` - The other user's details (id, firstName, lastName, image)
  - `lastMessage` - Preview of the last message text (empty string if no messages yet)
  - `lastMessageTime` - Timestamp of the last message
  - `unreadCount` - Number of unread messages from this user
  - `isRead` - Boolean indicating if the last message has been read

### 2. Unread Count
- Counts messages from the other user that you haven't read
- Updates automatically when you mark messages as read
- Resets to 0 after using mark-read endpoint

### 3. Real-time Updates
- Chat list updates in real-time via Socket.IO
- New messages update `lastMessage` and `unreadCount`
- Listen to socket events for live updates (see Socket documentation)

### 4. Chat Availability
- Can only chat with matched users
- Blocked users won't appear in chat list
- If user unmatches, chat may become unavailable

### 5. Message Types
Last message can be:
- `text` - Text message
- `image` - Image message (shows "📷 Image" in preview)
- `audio` - Voice message (shows "🎤 Voice message" in preview)

### 6. Empty Chat List
If no chats available:
```json
{
  "success": true,
  "data": []
}
```

### 7. Performance
- Chat list is optimized for fast loading
- Limited to last 100 conversations
- Older chats may not appear but messages are preserved

### 8. Privacy & Security
- Can only see chats with mutual matches
- Blocked users are automatically filtered out
- Deleted messages still show in chat list until new message arrives

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
- `400` - Validation error
- `401` - Unauthorized (invalid/missing token)
- `403` - No mutual connection exists OR Cannot access chat with blocked user
- `404` - Chat or user not found

**Common Error Examples:**

Blocked User Error:
```json
{
  "success": false,
  "message": "Cannot access chat with blocked user",
  "errorSources": [
    {
      "path": "",
      "message": "Cannot access chat with blocked user"
    }
  ],
  "err": {
    "statusCode": 403
  }
}
```
