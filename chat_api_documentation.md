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
  "data": [
    {
      "user": {
        "_id": "user_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "profile": {
          "photos": ["photo_url"],
          "bio": "..."
        }
      },
      "lastMessage": {
        "message": "Hello!",
        "createdAt": "2025-01-01T10:00:00Z",
        "messageType": "text",
        "senderId": "sender_id"
      },
      "unreadCount": 3
    }
  ]
}
```

---

## Important Notes

### 1. Chat List Behavior
- Only shows chats with users you've matched with (mutual connections)
- Sorted by most recent message first
- Includes unread count for each conversation
- Shows last message preview

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
