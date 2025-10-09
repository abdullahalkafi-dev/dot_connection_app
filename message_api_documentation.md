# Message Module API Documentation

## Base URL
```
https://your-api-domain.com/api/v1/message
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
  - `page` - Page number (optional, default: 1)
  - `limit` - Messages per page (optional, default: 50)
- **Success Response:**
```json
{
  "success": true,
  "message": "Chat messages retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPage": 1
  },
  "data": [
    {
      "_id": "68c0faee08089cbc8be60e26",
      "sender": {
        "_id": "68be64b2a0db89cc44e43270",
        "image": null,
        "firstName": "John",
        "lastName": "Doe"
      },
      "receiver": {
        "_id": "68be6aeba0db89cc44e4328c",
        "image": null,
        "firstName": "Rahim",
        "lastName": "Khan"
      },
      "message": "Hello there! 123",
      "images": [],
      "messageType": "text",
      "isRead": true,
      "createdAt": "2025-09-10T04:13:34.066Z",
      "updatedAt": "2025-09-10T06:23:48.675Z",
      "readAt": "2025-09-10T06:23:48.669Z"
    }
  ]
}
```
- **Error Response (Blocked User):**
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
  },
  "stack": "Error: Cannot access chat with blocked user\n    at /app/src/app/modules/message/message.controller.ts:20:11\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at /app/src/shared/catchAsync.ts:7:7"
}
```

---

### 4.2 Send Message with Image
- **Endpoint:** `POST /message/image`
- **Description:** Send message with image(s) - supports single or multiple images
- **Auth Required:** Yes
- **Body (FormData):**
  - `data` - JSON string containing:
    - `senderId` - Sender's user ID (required)
    - `receiverId` - Receiver's user ID (required)
    - `message` - Text message (optional)
  - `images` - Array of image files (required, can send single or multiple images, always in array format)
- **Example FormData:**
```json
{
  "data": "{\"senderId\": \"68be64b2a0db89cc44e43270\", \"receiverId\": \"68be6aeba0db89cc44e4328c\", \"message\": \"Check out this photo!\"}",
  "images": ["file1.jpg", "file2.png"]
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "Image message created successfully",
  "data": {
    "sender": "68be64b2a0db89cc44e43270",
    "receiver": "68be6aeba0db89cc44e4328c",
    "message": "Check out this photo!",
    "images": ["/images/screenshot-2025-07-29-162123-3FtQZ.webp"],
    "messageType": "image",
    "isRead": false,
    "_id": "68c258a333d1d4dbbbaed9a5",
    "createdAt": "2025-09-11T05:05:39.699Z",
    "updatedAt": "2025-09-11T05:05:39.699Z"
  }
}
```

---

### 4.3 Send Message with Audio
- **Endpoint:** `POST /message/audio`
- **Description:** Send voice/audio message
- **Auth Required:** Yes
- **Body (FormData):**
  - `data` - JSON string containing:
    - `senderId` - Sender's user ID (required)
    - `receiverId` - Receiver's user ID (required)
    - `message` - Text message (optional)
  - `audio` - Audio file (required)
- **Example FormData:**
```json
{
  "data": "{\"senderId\": \"68be64b2a0db89cc44e43270\", \"receiverId\": \"68be6aeba0db89cc44e4328c\", \"message\": \"Check out this audio!\"}",
  "audio": "file_example.mp3"
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "Audio message created successfully",
  "data": {
    "sender": "68be64b2a0db89cc44e43270",
    "receiver": "68be6aeba0db89cc44e4328c",
    "audio": "/audio/file_example_mp3_2mg-jswwt.mp3",
    "images": [],
    "messageType": "audio",
    "isRead": false,
    "_id": "68c258a333d1d4dbbbaed9a5",
    "createdAt": "2025-09-11T05:05:39.699Z",
    "updatedAt": "2025-09-11T05:05:39.699Z"
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
- Can send single or multiple images per message
- Images are always sent as an array in the `images` field
- Use FormData with `data` field (JSON string) and `images` field (file array)
- Can include text caption with images via `message` field in data
- Supported formats: jpg, jpeg, png, webp
- Images are automatically compressed and optimized
- Maximum 10 images per message recommended

### 4. Audio Messages
- Single audio file per message
- Use FormData with `data` field (JSON string) and `audio` field (file)
- Can include optional text with audio via `message` field in data
- Supported formats: mp3, wav, m4a
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
- `400` - Invalid message data or validation error
- `403` - No mutual connection exists OR Cannot access chat with blocked user
- `404` - Receiver user not found
- `413` - File too large
- `415` - Unsupported file format

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

### 12. Best Practices
- Mark messages as read when user views them
- Use Socket.IO for text messages (faster)
- Use REST API for media messages (images/audio)
- Implement message caching on client side
- Show delivery/read receipts using socket events