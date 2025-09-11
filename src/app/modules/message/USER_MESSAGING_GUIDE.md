# Dating App Messaging System

This document explains how to use the messaging system that allows matched users to send private messages to each other in a dating app environment.

## Features

- ✅ Chat only available for mutually matched users (both liked each other)
- ✅ Real-time text messaging via WebSocket
- ✅ Image sharing support (single and multiple images)
- ✅ Audio message support (MP3, WAV, M4A)
- ✅ Message persistence in database
- ✅ Read receipts and message status tracking
- ✅ Online user status tracking
- ✅ Chat list with unread counts
- ✅ File upload with automatic optimization
- ✅ Active chat session management
- ✅ Push notification support (FCM tokens)

## Core Concept

**Mutual Match Requirement:** Users can only chat with people they have mutually matched with. This means:
1. User A likes User B
2. User B likes User A
3. System creates a mutual match
4. Chat becomes available for both users

## Socket Events

### Client to Server Events

#### 1. Register User Online
```javascript
socket.emit("register", "user_id_here");
```
**Purpose:** Registers the user as online and enables real-time messaging.

#### 2. Send Text Message
```javascript
socket.emit("sendMessage", {
  senderId: "sender_id_here",
  receiverId: "receiver_id_here",
  message: "Hello there!"
});
```
**Purpose:** Sends a real-time text message instantly.

#### 3. Mark Messages as Read
```javascript
socket.emit("markAsRead", {
  senderId: "sender_id_here",
  receiverId: "receiver_id_here"
});
```
**Purpose:** Marks all messages from a specific sender as read.

#### 4. Set Active Chat Session
```javascript
// When user opens a chat with someone
socket.emit("activeChat", {
  senderId: "current_user_id",
  receiverId: "chat_partner_id"
});

// When user closes/leaves the chat
socket.emit("activeChat", {
  senderId: null,
  receiverId: "chat_partner_id"
});
```
**Purpose:** Indicates which chat the user is currently viewing for read receipts.

#### 5. Update FCM Token for Push Notifications
```javascript
socket.emit("updateFcmToken", {
  userId: "user_id_here",
  fcmToken: "fcm_token_string_here"
});
```
**Purpose:** Updates the user's push notification token for offline messaging.

### Server to Client Events

#### 1. Online Users List
```javascript
socket.on("onlineUsers", (userIds) => {
  console.log("Online users:", userIds);
  // userIds is an array of user IDs who are currently online
});
```
**Received:** When users come online or go offline.

#### 2. Receive Message
```javascript
socket.on("receiver-{userId}", (data) => {
  console.log("New message received:", data);
  // data contains: _id, senderId, receiverId, message, messageType, image/audio/images, isRead, createdAt
});
```
**Received:** When someone sends you a message (text or file notification).

#### 3. Message Sent Confirmation
```javascript
socket.on("message-sent", (data) => {
  console.log("Message sent successfully:", data);
  // Confirms your message was delivered
});
```
**Received:** Confirmation that your message was successfully sent.

#### 4. Messages Read Confirmation
```javascript
socket.on("messages-read", (data) => {
  console.log("Messages marked as read:", data);
  // data contains: senderId, receiverId, count
});
```
**Received:** When someone reads your messages (for read receipts).

#### 5. FCM Token Update Response
```javascript
socket.on("fcmTokenUpdated", (response) => {
  if (response.success) {
    console.log("Push notifications enabled");
  } else {
    console.error("Failed to enable notifications:", response.error);
  }
});
```
**Received:** Confirmation of push notification setup.

#### 6. Error Handling
```javascript
socket.on("error", (error) => {
  console.error("Message error:", error.message);
});
```
**Received:** When there's an error with messaging operations.

## REST API Endpoints

### 1. Get Chat List
```
GET /api/chat
```
**Purpose:** Get list of all users you have chats with, sorted by most recent message.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "chat_id",
      "participant": {
        "_id": "user_id",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "image": "/uploads/images/profile.webp"
      },
      "lastMessage": "Hey, how are you?",
      "lastMessageTime": "2025-09-09T15:30:00.000Z",
      "unreadCount": 2,
      "isRead": false
    }
  ]
}
```

### 2. Get Messages with Specific User
```
GET /api/message/chat/{userId}?page=1&limit=50
```
**Purpose:** Get message history with a specific user (paginated).

**Response:**
```json
{
  "success": true,
  "message": "Chat messages retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "message_id",
        "sender": {
          "_id": "sender_id",
          "firstName": "John",
          "lastName": "Doe",
          "image": "/uploads/images/profile.webp"
        },
        "receiver": {
          "_id": "receiver_id",
          "firstName": "Jane",
          "lastName": "Smith",
          "image": "/uploads/images/profile2.webp"
        },
        "message": "Hello there!",
        "messageType": "text",
        "isRead": true,
        "createdAt": "2025-09-09T15:30:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 125,
      "totalPage": 3
    }
  }
}
```

### 3. Send Image Message
```
POST /api/message/image
Content-Type: multipart/form-data

Fields:
- data: JSON string with { senderId, receiverId, message }
- image: File upload
```
**Purpose:** Send a message with a single image.

**Example data field:**
```json
{
  "senderId": "user_id_1",
  "receiverId": "user_id_2",
  "message": "Check out this photo!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image message sent successfully",
  "data": {
    "_id": "message_id",
    "senderId": "user_id_1",
    "receiverId": "user_id_2",
    "message": "Check out this photo!",
    "messageType": "image",
    "image": "/uploads/images/photo.webp",
    "isRead": false,
    "createdAt": "2025-09-09T15:30:00.000Z"
  }
}
```

### 4. Send Multiple Images
```
POST /api/message/images
Content-Type: multipart/form-data

Fields:
- data: JSON string with { senderId, receiverId, message }
- images: Multiple file uploads
```
**Purpose:** Send a message with multiple images at once.

**Response:**
```json
{
  "success": true,
  "message": "Multiple images sent successfully",
  "data": {
    "_id": "message_id",
    "messageType": "multipleImages",
    "images": [
      "/uploads/images/photo1.webp",
      "/uploads/images/photo2.webp",
      "/uploads/images/photo3.webp"
    ]
  }
}
```

### 5. Send Audio Message
```
POST /api/message/audio
Content-Type: multipart/form-data

Fields:
- data: JSON string with { senderId, receiverId }
- audio: Audio file upload
```
**Purpose:** Send a voice message or audio file.

**Response:**
```json
{
  "success": true,
  "message": "Audio message sent successfully",
  "data": {
    "_id": "message_id",
    "messageType": "audio",
    "audio": "/uploads/audio/voice_message.mp3",
    "duration": 45000
  }
}
```

### 6. Mark Messages as Read
```
PATCH /api/message/mark-read
Content-Type: application/json

{
  "senderId": "sender_id",
  "receiverId": "receiver_id"
}
```
**Purpose:** Mark all messages from a specific user as read.

## Complete Implementation Example

### Frontend Chat Integration

```javascript
class DatingAppMessaging {
  constructor(serverUrl, currentUser) {
    this.socket = io(serverUrl);
    this.currentUser = currentUser;
    this.activeChat = null;
    this.onlineUsers = [];
    this.baseURL = serverUrl;
    this.paginationInfo = null; // Store pagination metadata
    this.currentPage = 1; // Track current page for infinite scroll
    
    this.initialize();
  }

  initialize() {
    // Connect and register user
    this.socket.emit("register", this.currentUser.id);

    // Set up all event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Online status updates
    this.socket.on("onlineUsers", (userIds) => {
      this.onlineUsers = userIds;
      this.updateOnlineStatusUI(userIds);
    });

    // Incoming messages
    this.socket.on(`receiver-${this.currentUser.id}`, (messageData) => {
      this.handleIncomingMessage(messageData);
    });

    // Message confirmations
    this.socket.on("message-sent", (data) => {
      this.updateMessageStatus(data._id, 'sent');
    });

    // Read receipts
    this.socket.on("messages-read", (data) => {
      this.updateReadReceipts(data);
    });

    // Push notification updates
    this.socket.on("fcmTokenUpdated", (response) => {
      console.log("Push notifications:", response.success ? "enabled" : "failed");
    });

    // Error handling
    this.socket.on("error", (error) => {
      this.showError(error.message);
    });
  }

  // Load chat list
  async loadChatList() {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        this.displayChatList(result.data);
      }
    } catch (error) {
      console.error("Failed to load chat list:", error);
    }
  }

  // Open chat with specific user
  async openChat(userId) {
    this.activeChat = userId;
    
    // Set active chat for read receipts
    this.socket.emit("activeChat", {
      senderId: this.currentUser.id,
      receiverId: userId
    });

    // Load chat history
    try {
      const response = await fetch(`${this.baseURL}/api/message/chat/${userId}?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        // Handle paginated response
        this.displayMessages(result.data.data); // Access messages from data.data
        this.updatePaginationInfo(result.data.meta); // Handle pagination metadata
        // Mark messages as read
        this.markMessagesAsRead(userId);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  // Close current chat
  closeChat() {
    if (this.activeChat) {
      // Clear active chat
      this.socket.emit("activeChat", {
        senderId: null,
        receiverId: this.activeChat
      });
      
      this.activeChat = null;
    }
  }

  // Send text message
  sendTextMessage(receiverId, message) {
    if (!message.trim()) return;
    
    this.socket.emit("sendMessage", {
      senderId: this.currentUser.id,
      receiverId: receiverId,
      message: message.trim()
    });
    
    // Add message to UI immediately
    this.addMessageToUI({
      senderId: this.currentUser.id,
      receiverId: receiverId,
      message: message.trim(),
      messageType: 'text',
      status: 'sending',
      createdAt: new Date()
    });
  }

  // Send image message
  async sendImageMessage(receiverId, imageFile, caption = '') {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      senderId: this.currentUser.id,
      receiverId: receiverId,
      message: caption
    }));
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${this.baseURL}/api/message/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        console.log("Image sent successfully");
      }
    } catch (error) {
      console.error("Failed to send image:", error);
      this.showError("Failed to send image");
    }
  }

  // Send multiple images
  async sendMultipleImages(receiverId, imageFiles, caption = '') {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      senderId: this.currentUser.id,
      receiverId: receiverId,
      message: caption
    }));
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${this.baseURL}/api/message/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        console.log("Multiple images sent successfully");
      }
    } catch (error) {
      console.error("Failed to send images:", error);
    }
  }

  // Send audio message
  async sendAudioMessage(receiverId, audioFile) {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      senderId: this.currentUser.id,
      receiverId: receiverId
    }));
    formData.append('audio', audioFile);

    try {
      const response = await fetch(`${this.baseURL}/api/message/audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        console.log("Audio message sent successfully");
      }
    } catch (error) {
      console.error("Failed to send audio:", error);
    }
  }

  // Mark messages as read
  markMessagesAsRead(senderId) {
    this.socket.emit("markAsRead", {
      senderId: senderId,
      receiverId: this.currentUser.id
    });
  }

  // Update FCM token for push notifications
  updateFCMToken(fcmToken) {
    this.socket.emit("updateFcmToken", {
      userId: this.currentUser.id,
      fcmToken: fcmToken
    });
  }

  // Load more messages (pagination)
  async loadMoreMessages(userId, page = 2, limit = 50) {
    try {
      const response = await fetch(`${this.baseURL}/api/message/chat/${userId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        // Prepend older messages to the existing messages
        this.prependMessages(result.data.data);
        return result.data.meta; // Return pagination info
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
      return null;
    }
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.includes(userId);
  }

  // Event handlers
  handleIncomingMessage(messageData) {
    // Add message to current chat if it's active
    if (this.activeChat === messageData.senderId) {
      this.addMessageToUI(messageData);
      // Auto-mark as read
      this.markMessagesAsRead(messageData.senderId);
    } else {
      // Show notification for other chats
      this.showNotification(messageData);
      // Update chat list unread count
      this.updateChatListUnread(messageData.senderId);
    }
  }

  // UI helper methods (implement based on your framework)
  displayChatList(chats) {
    // Render chat list with unread counts, last messages, etc.
    console.log("Chat list:", chats);
  }

  displayMessages(messages) {
    // Render message history
    console.log("Messages:", messages);
  }

  prependMessages(messages) {
    // Add older messages to the beginning of the chat
    console.log("Loading older messages:", messages);
  }

  updatePaginationInfo(meta) {
    // Store pagination info for infinite scrolling
    this.paginationInfo = meta;
    console.log("Pagination info:", meta);
  }

  addMessageToUI(messageData) {
    // Add single message to chat interface
    console.log("New message:", messageData);
  }

  updateMessageStatus(messageId, status) {
    // Update message status (sending -> sent -> read)
    console.log(`Message ${messageId} is now ${status}`);
  }

  updateReadReceipts(data) {
    // Show read receipts for your messages
    console.log("Messages read:", data);
  }

  updateOnlineStatusUI(onlineUserIds) {
    // Update online indicators in chat list and chat headers
    console.log("Online users:", onlineUserIds);
  }

  showNotification(messageData) {
    // Show push notification or in-app notification
    console.log("New message notification:", messageData);
  }

  updateChatListUnread(senderId) {
    // Update unread count in chat list
    console.log("Update unread count for:", senderId);
  }

  showError(message) {
    // Display error message to user
    console.error("Error:", message);
  }
}

// Usage Example
const currentUser = {
  id: "user_12345",
  token: "jwt_token_here",
  firstName: "John",
  lastName: "Doe"
};

const messaging = new DatingAppMessaging("http://localhost:3000", currentUser);

// Load chat list when app starts
messaging.loadChatList();

// Open a chat with a matched user
messaging.openChat("matched_user_id");

// Send different types of messages
messaging.sendTextMessage("matched_user_id", "Hello there!");

// Handle file selection for images
document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    messaging.sendImageMessage("matched_user_id", file, "Check this out!");
  }
});

// Handle multiple image selection
document.getElementById('multipleImagesInput').addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    messaging.sendMultipleImages("matched_user_id", files, "Some photos for you!");
  }
});

// Handle audio recording
document.getElementById('audioInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    messaging.sendAudioMessage("matched_user_id", file);
  }
});

// Handle infinite scroll for loading more messages
document.getElementById('chatContainer').addEventListener('scroll', async (e) => {
  const container = e.target;
  
  // Check if user scrolled to the top (to load older messages)
  if (container.scrollTop === 0 && messaging.paginationInfo) {
    const { page, totalPage } = messaging.paginationInfo;
    
    // Load next page if available
    if (page < totalPage) {
      const nextPage = page + 1;
      const meta = await messaging.loadMoreMessages(messaging.activeChat, nextPage);
      
      if (meta) {
        messaging.updatePaginationInfo(meta);
      }
    }
  }
});

// Close chat when navigating away
window.addEventListener('beforeunload', () => {
  messaging.closeChat();
});
```

## Message Flow Examples

### 1. Starting a Chat
```
User A (sender) -> User B (receiver)

1. User A opens chat list
2. Clicks on matched User B
3. Frontend calls: messaging.openChat("userB_id")
4. Socket emits: activeChat event
5. API call: GET /api/message/chat/userB_id
6. Messages load and display
7. Auto-mark existing messages as read
```

### 2. Sending a Text Message
```
User A -> User B

1. User A types message and clicks send
2. Frontend calls: messaging.sendTextMessage("userB_id", "Hello!")
3. Socket emits: sendMessage event
4. Server validates and saves to database
5. If User B is online: instant delivery via socket
6. If User B is offline: push notification sent
7. User A receives: message-sent confirmation
8. User B receives: receiver-{userB_id} event
```

### 3. Sending an Image
```
User A -> User B

1. User A selects image file
2. Frontend calls: messaging.sendImageMessage("userB_id", file, "caption")
3. HTTP POST: /api/message/image with FormData
4. Server processes image (compression, WebP conversion)
5. Message saved to database
6. Socket notification sent to User B
7. User B sees new message notification
```

### 4. Reading Messages
```
User B receives and reads messages

1. User B opens chat with User A
2. Frontend calls: messaging.openChat("userA_id")
3. Messages are displayed
4. Auto-call: messaging.markMessagesAsRead("userA_id")
5. Socket emits: markAsRead event
6. Server updates message status in database
7. User A receives: messages-read event
8. User A's UI shows read receipts (✓✓)
```

## Security and Validation

### Server-Side Validation
- All messages require valid sender and receiver IDs
- Users can only message their mutual matches
- File uploads are validated for type and size
- Rate limiting prevents spam
- JWT authentication required for all endpoints

### Client-Side Best Practices
- Validate file types before upload
- Show upload progress for large files
- Handle network errors gracefully
- Implement retry mechanisms
- Cache messages locally for offline viewing

## Database Schema

### Message Collection
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,        // Reference to sender
  receiverId: ObjectId,      // Reference to receiver
  message: String,           // Text content (optional)
  messageType: String,       // 'text', 'image', 'audio', 'multipleImages'
  image: String,             // Single image path (optional)
  images: [String],          // Multiple image paths (optional)
  audio: String,             // Audio file path (optional)
  isRead: Boolean,           // Read status
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### Chat Collection
```javascript
{
  _id: ObjectId,
  participants: [ObjectId],  // Exactly 2 user IDs
  lastMessage: String,       // Preview of last message
  lastMessageTime: Date,     // Time of last message
  createdAt: Date,
  updatedAt: Date
}
```

## Testing the System

### Manual Testing Steps

1. **Test Mutual Match Requirement:**
   - Try messaging unmatched user (should fail)
   - Create mutual match
   - Try messaging matched user (should work)

2. **Test Real-time Messaging:**
   - Open two browser tabs with different users
   - Send text messages back and forth
   - Verify instant delivery

3. **Test File Uploads:**
   - Send single image with caption
   - Send multiple images
   - Send audio message
   - Verify file processing and delivery

4. **Test Read Receipts:**
   - Send message from User A to User B
   - User A should see single checkmark (✓)
   - User B opens chat
   - User A should see double checkmark (✓✓)

5. **Test Online Status:**
   - User comes online (green dot appears)
   - User goes offline (gray dot appears)
   - Verify status updates in real-time

### API Testing with curl

```bash
# Get chat list
curl -X GET "http://localhost:3000/api/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get messages with specific user (with pagination)
curl -X GET "http://localhost:3000/api/message/chat/USER_ID?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get second page of messages
curl -X GET "http://localhost:3000/api/message/chat/USER_ID?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send image message
curl -X POST "http://localhost:3000/api/message/image" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "data={\"senderId\":\"SENDER_ID\",\"receiverId\":\"RECEIVER_ID\",\"message\":\"Test caption\"}" \
  -F "image=@/path/to/image.jpg"

# Mark messages as read
curl -X PATCH "http://localhost:3000/api/message/mark-read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"senderId":"SENDER_ID","receiverId":"RECEIVER_ID"}'
```

## Pagination and Infinite Scrolling

### Understanding Pagination Response

When you call the messages API, you'll receive:

```json
{
  "success": true,
  "message": "Chat messages retrieved successfully",
  "data": {
    "data": [...], // Array of messages
    "meta": {
      "page": 1,        // Current page
      "limit": 50,      // Items per page
      "total": 125,     // Total messages
      "totalPage": 3    // Total pages available
    }
  }
}
```

### Implementing Infinite Scroll

```javascript
class ChatPagination {
  constructor(messaging, chatContainer) {
    this.messaging = messaging;
    this.chatContainer = chatContainer;
    this.isLoading = false;
    
    this.setupScrollListener();
  }

  setupScrollListener() {
    this.chatContainer.addEventListener('scroll', async (e) => {
      if (this.isLoading) return;
      
      const container = e.target;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Load more when scrolled to top (for older messages)
      if (scrollTop === 0) {
        await this.loadOlderMessages();
      }
    });
  }

  async loadOlderMessages() {
    const { paginationInfo, activeChat } = this.messaging;
    
    if (!paginationInfo || !activeChat) return;
    
    const { page, totalPage } = paginationInfo;
    
    if (page >= totalPage) return; // No more pages
    
    this.isLoading = true;
    this.showLoadingIndicator();
    
    try {
      const nextPage = page + 1;
      const meta = await this.messaging.loadMoreMessages(activeChat, nextPage);
      
      if (meta) {
        this.messaging.updatePaginationInfo(meta);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  showLoadingIndicator() {
    // Show spinner at top of chat
    console.log('Loading older messages...');
  }

  hideLoadingIndicator() {
    // Hide spinner
    console.log('Loading complete');
  }
}

// Usage
const chatContainer = document.getElementById('chatMessages');
const pagination = new ChatPagination(messaging, chatContainer);
```

## Common Issues and Solutions

### 1. Messages Not Delivering
- **Check:** User authentication (JWT token valid)
- **Check:** Mutual match exists between users
- **Check:** Socket.IO connection is established
- **Check:** User is registered via `socket.emit("register", userId)`

### 2. Files Not Uploading
- **Check:** File size limits (check server configuration)
- **Check:** File type is supported (images: JPG/PNG/WEBP, audio: MP3/WAV/M4A)
- **Check:** FormData is properly constructed
- **Check:** Authorization header is included

### 3. Read Receipts Not Working
- **Check:** Active chat is set via `socket.emit("activeChat", ...)`
- **Check:** Messages are marked as read via `socket.emit("markAsRead", ...)`
- **Check:** Both users are using the same message ID system

### 4. Online Status Not Updating
- **Check:** Socket connection is stable
- **Check:** User registration happens on app start
- **Check:** Event listeners are properly set up

## Performance Optimization

### Frontend Optimizations
- **Message Pagination:** Load messages in chunks (50 per page)
- **Image Lazy Loading:** Load images as user scrolls
- **Local Caching:** Cache recent messages and chat list
- **Debounced Typing:** Prevent excessive typing indicator updates
- **Connection Management:** Reconnect on network changes

### Backend Optimizations
- **Database Indexing:** Index on senderId, receiverId, createdAt
- **File Compression:** Automatic image compression to WebP
- **Rate Limiting:** Prevent message spam
- **Connection Pooling:** Efficient database connections
- **Caching:** Redis caching for frequently accessed data

This comprehensive guide provides everything needed to implement and integrate the dating app messaging system! 🚀
