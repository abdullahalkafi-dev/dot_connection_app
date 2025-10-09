# Message Module API Documentation

## Base URL
```
https://your-api-domain.com/api/message
```

## Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Message Module

### 4.1 Get Chat Messages
- **Endpoint:** `GET /message/chat/:userId`
- **Description:** Get conversation messages with a specific user
- **Auth Required:** Yes
- **URL Parameter:**
  - `userId` - User ID to get messages with
- **Query Parameters:**
  - `page` - Page number (optional)
  - `limit` - Messages per page (optional)
- **Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "message_id",
      "senderId": "user_id",
      "receiverId": "user_id",
      "message": "Hello!",
      "messageType": "text",
      "isRead": false,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 120
  }
}
```

---

### 4.2 Send Message with Image
- **Endpoint:** `POST /message/image`
- **Description:** Send message with image(s)
- **Auth Required:** Yes
- **Body (FormData):**
  - `receiverId` - Receiver's user ID
  - `message` - Text message (optional)
  - `image` - Single image file (optional)
  - `images` - Multiple image files, max 10 (optional)
- **Success Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "message_id",
    "senderId": "your_id",
    "receiverId": "receiver_id",
    "message": "Check this out!",
    "messageType": "image",
    "images": ["url1.jpg", "url2.jpg"]
  }
}
```

---

### 4.3 Send Message with Audio
- **Endpoint:** `POST /message/audio`
- **Description:** Send voice message
- **Auth Required:** Yes
- **Body (FormData):**
  - `receiverId` - Receiver's user ID
  - `audio` - Audio file
  - `message` - Text message (optional)
- **Success Response:**
```json
{
  "success": true,
  "message": "Audio message sent successfully",
  "data": {
    "_id": "message_id",
    "senderId": "your_id",
    "receiverId": "receiver_id",
    "messageType": "audio",
    "audioUrl": "audio_url.mp3"
  }
}
```

---

### 4.4 Mark Messages as Read
- **Endpoint:** `PATCH /message/mark-read`
- **Description:** Mark all messages from a user as read
- **Auth Required:** Yes
- **Body:**
```json
{
  "senderId": "sender_user_id",
  "receiverId": "your_user_id"
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

## Important Notes

### 1. Message Types
Three types of messages are supported:
- **text** - Plain text message
- **image** - Image message (can include text caption)
- **audio** - Voice/audio message

### 2. Sending Messages
- Use REST API for sending messages with files (images/audio)
- Use Socket.IO for sending text messages in real-time
- Both methods work, Socket.IO is faster for text-only messages

### 3. Image Messages
- Can send 1-10 images per message
- Use `image` field for single image
- Use `images` field for multiple images (array)
- Can include text caption with images
- Supported formats: jpg, jpeg, png, webp
- Images are automatically compressed and optimized

### 4. Audio Messages
- Single audio file per message
- Supported formats: mp3, wav, m4a
- Can include optional text with audio
- Max audio duration: 5 minutes (recommended)

### 5. Message Pagination
- Default: 50 messages per page
- Messages sorted by newest first
- Use `page` and `limit` for pagination
- Response includes `meta` object with total count

### 6. Read Status
- `isRead: false` - Message not read yet
- `isRead: true` - Message has been read
- `readAt` - Timestamp when message was read
- Mark messages as read when user opens chat

### 7. Real-time Messaging
- Messages sent via Socket.IO appear instantly
- Both sender and receiver get real-time updates
- Use `receiver-{userId}` event to receive messages
- Use `message-sent` event to confirm message sent

### 8. Connection Required
- Can only message users you're matched with
- API returns error if no mutual connection exists
- Check match status before attempting to send message

### 9. Active Chat Detection
- System tracks when users are actively in a chat
- Prevents unnecessary push notifications
- Use `activeChat` socket event to indicate active chat

### 10. Message Validation
- At least one of `message`, `image`, or `audio` is required
- Cannot send empty message
- `receiverId` and `senderId` are mandatory
- Files must be valid format and size

### 11. Error Responses
Common errors:
- `400` - Invalid message data or missing required fields
- `403` - No mutual connection exists
- `404` - Receiver user not found
- `413` - File too large
- `415` - Unsupported file format

### 12. Best Practices
- Mark messages as read when user views them
- Use Socket.IO for text messages (faster)
- Use REST API for media messages (images/audio)
- Implement message caching on client side
- Show delivery/read receipts using socket events