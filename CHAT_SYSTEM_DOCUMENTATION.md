# Chat System API Documentation

## Overview
The chat system allows users who have mutual love matches to communicate through text messages, images, audio files, and multiple images. The system uses Socket.IO for real-time text messaging and REST API for file uploads.

## Prerequisites
- Users must have a mutual love match (both users must have liked each other)
- Users must be authenticated

## REST API Endpoints

### 1. Get Chat List
**GET** `/api/chat`

Returns a list of all chats for the authenticated user with connection information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Chat list retrieved successfully",
  "data": [
    {
      "_id": "connection_id",
      "participant": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "image": "/images/profile.webp"
      },
      "lastMessage": "Hello, how are you?",
      "lastMessageTime": "2023-12-07T10:30:00.000Z",
      "unreadCount": 3,
      "isRead": false
    }
  ]
}
```

### 2. Get Chat Messages
**GET** `/api/message/chat/:userId`

Retrieves messages between authenticated user and specified user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Chat messages retrieved successfully",
  "data": [
    {
      "_id": "message_id",
      "sender": {
        "_id": "sender_id",
        "firstName": "John",
        "lastName": "Doe",
        "image": "/images/profile.webp"
      },
      "receiver": {
        "_id": "receiver_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "image": "/images/profile2.webp"
      },
      "message": "Hello there!",
      "messageType": "text",
      "isRead": true,
      "createdAt": "2023-12-07T10:30:00.000Z"
    }
  ]
}
```

### 3. Send Message with Image
**POST** `/api/message/image`

Send a message with a single image.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `image`: Image file (jpg, png, webp, etc.)
- `data`: JSON string containing:
  ```json
  {
    "senderId": "sender_user_id",
    "receiverId": "receiver_user_id",
    "message": "Optional text message"
  }
  ```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Message created successfully",
  "data": {
    "_id": "message_id",
    "sender": "sender_id",
    "receiver": "receiver_id",
    "message": "Check out this image!",
    "image": "/images/filename.webp",
    "messageType": "image",
    "isRead": false,
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 4. Send Audio Message
**POST** `/api/message/audio`

Send an audio message.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `audio`: Audio file (mp3, wav, m4a, etc.)
- `data`: JSON string containing:
  ```json
  {
    "senderId": "sender_user_id",
    "receiverId": "receiver_user_id"
  }
  ```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Audio message created successfully",
  "data": {
    "_id": "message_id",
    "sender": "sender_id",
    "receiver": "receiver_id",
    "audio": "/audio/filename.mp3",
    "messageType": "audio",
    "isRead": false,
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 5. Send Multiple Images
**POST** `/api/message/images`

Send a message with multiple images (up to 10).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `images`: Multiple image files (up to 10)
- `data`: JSON string containing:
  ```json
  {
    "senderId": "sender_user_id",
    "receiverId": "receiver_user_id",
    "message": "Optional text message"
  }
  ```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Multiple images message created successfully",
  "data": {
    "_id": "message_id",
    "sender": "sender_id",
    "receiver": "receiver_id",
    "message": "Check out these photos!",
    "images": ["/images/photo1.webp", "/images/photo2.webp"],
    "messageType": "multipleImages",
    "isRead": false,
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 6. Mark Messages as Read
**PATCH** `/api/message/mark-read`

Mark messages from a specific sender as read.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "senderId": "sender_user_id",
  "receiverId": "receiver_user_id"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Messages marked as read",
  "data": null
}
```

## Socket.IO Events

### Client-side Events (Emit)

#### 1. Register User
```javascript
socket.emit('register', userId);
```
Registers the user for real-time communication.

#### 2. Send Text Message
```javascript
socket.emit('sendMessage', {
  senderId: 'sender_user_id',
  receiverId: 'receiver_user_id',
  message: 'Hello there!',
  image: null // optional
});
```

#### 3. Mark as Read
```javascript
socket.emit('markAsRead', {
  senderId: 'sender_user_id',
  receiverId: 'receiver_user_id'
});
```

#### 4. Active Chat
```javascript
// Notify when user enters a chat
socket.emit('activeChat', {
  senderId: 'current_user_id',
  receiverId: 'other_user_id'
});

// Notify when user leaves a chat
socket.emit('activeChat', {
  senderId: null,
  receiverId: 'other_user_id'
});
```

#### 5. Update FCM Token
```javascript
socket.emit('updateFcmToken', {
  userId: 'user_id',
  fcmToken: 'fcm_token_string'
});
```

### Server-side Events (Listen)

#### 1. Online Users
```javascript
socket.on('onlineUsers', (userIds) => {
  console.log('Online users:', userIds);
});
```

#### 2. Receive Message
```javascript
socket.on('receiver-{userId}', (messageData) => {
  console.log('New message received:', messageData);
  // messageData contains: _id, senderId, receiverId, message, image, messageType, isRead, createdAt
});
```

#### 3. Message Sent Confirmation
```javascript
socket.on('message-sent', (messageData) => {
  console.log('Message sent successfully:', messageData);
  // messageData contains: _id, senderId, receiverId, message, image, messageType, isRead, createdAt, status
});
```

#### 4. Messages Read Notification
```javascript
socket.on('messages-read', (data) => {
  console.log('Messages marked as read:', data);
  // data contains: senderId, receiverId, isRead
});
```

#### 5. FCM Token Update Response
```javascript
socket.on('fcmTokenUpdated', (response) => {
  if (response.success) {
    console.log('FCM token updated successfully');
  } else {
    console.log('FCM token update failed:', response.error);
  }
});
```

#### 6. Error Handling
```javascript
socket.on('error', (error) => {
  console.log('Socket error:', error.message);
});
```

## Message Types

1. **text**: Plain text message
2. **image**: Single image with optional text
3. **audio**: Audio file (mp3, wav, m4a, etc.)
4. **multipleImages**: Multiple images with optional text

## File Constraints

### Images
- **Formats**: JPEG, PNG, JPG, HEIF, HEIC, TIFF, WebP, AVIF
- **Max size**: 50MB per file
- **Output format**: WebP (compressed to 80% quality)
- **Max count**: 10 images per message

### Audio
- **Formats**: MP3, WAV, M4A, AAC, OGG
- **Max size**: 50MB per file
- **Max count**: 1 audio file per message

## Error Responses

### Authentication Error
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

### No Mutual Connection
```json
{
  "statusCode": 403,
  "success": false,
  "message": "You can only chat with connected users",
  "data": null
}
```

### File Upload Error
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Only image files are allowed for image upload",
  "data": null
}
```

## Usage Flow

1. **Authentication**: User logs in and gets JWT token
2. **Check Matches**: User can only chat with users they have mutual love matches with
3. **Get Chat List**: Retrieve list of all available chats
4. **Real-time Connection**: Establish Socket.IO connection and register user
5. **Send Messages**: 
   - Text messages via Socket.IO
   - Files (images/audio) via REST API
6. **Receive Messages**: Listen for real-time message events
7. **Mark as Read**: Update read status of messages

## Database Models

### Message Schema
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  message: String (optional),
  image: String (optional),
  audio: String (optional),
  images: [String] (optional),
  messageType: enum ['text', 'image', 'audio', 'multipleImages'],
  isRead: Boolean (default: false),
  readAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Schema
```javascript
{
  participants: [ObjectId] (exactly 2 users),
  lastMessage: ObjectId (ref: Message),
  lastMessageTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```
