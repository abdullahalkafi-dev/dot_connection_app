# Socket Integration Guide - Dot Connection App

This guide provides comprehensive instructions for integrating real-time messaging features using Socket.IO in your frontend application.

## Table of Contents
- [Overview](#overview)
- [Backend Configuration](#backend-configuration)
- [Frontend Setup](#frontend-setup)
- [Socket Events](#socket-events)
- [REST API Endpoints](#rest-api-endpoints)
- [Complete Implementation Examples](#complete-implementation-examples)

---

## Overview

The Dot Connection App uses Socket.IO for real-time bidirectional communication between the client and server. This enables features like:
- Real-time messaging
- Online/offline user status
- Message read receipts
- Active chat session tracking
- FCM token updates for push notifications

**Backend Socket URL:** `http://localhost:5000` (Update based on your deployment)

---

## Backend Configuration

### CORS Settings
The backend is configured to accept connections from:
- `http://localhost:3000`
- `http://localhost:5173`
- Any origin (`*`)

### Connection Requirements
- Users must be registered (have mutual connections)
- Valid user IDs are required for all operations
- Messages require either text content or an image

---

## Frontend Setup

### Installation

```bash
# Using npm
npm install socket.io-client

# Using yarn
yarn add socket.io-client

# Using pnpm
pnpm add socket.io-client
```

### Basic Initialization

```javascript
import { io } from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to socket server', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## Socket Events

### Client to Server Events

#### 1. Register User Online
Register the current user as online when they connect to the app.

**Event:** `register`

```javascript
// Call this after user logs in or when app starts
const registerUser = (userId) => {
  socket.emit('register', userId);
};

// Example usage
registerUser('507f1f77bcf86cd799439011');
```

**Parameters:**
- `userId` (String): The MongoDB ObjectId of the logged-in user

---

#### 2. Send Direct Message
Send a text or image message to another user.

**Event:** `sendMessage`

```javascript
const sendMessage = (messageData) => {
  socket.emit('sendMessage', {
    senderId: messageData.senderId,
    receiverId: messageData.receiverId,
    message: messageData.text,        // Optional if image is provided
    image: messageData.imageUrl       // Optional if message is provided
  });
};

// Example: Text message
sendMessage({
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f191e810c19729de860ea',
  text: 'Hello! How are you?',
  imageUrl: null
});

// Example: Image message
sendMessage({
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f191e810c19729de860ea',
  text: 'Check this out!',
  imageUrl: '/uploads/images/photo-123.jpg'
});
```

**Parameters:**
- `senderId` (String): MongoDB ObjectId of the sender
- `receiverId` (String): MongoDB ObjectId of the receiver
- `message` (String, optional): Text content of the message
- `image` (String, optional): URL/path to the image

**Note:** At least one of `message` or `image` must be provided.

**Backend Validation:**
- Checks if users have a mutual connection
- Returns error if connection doesn't exist
- Saves message to database before emitting events

---

#### 3. Mark Messages as Read
Mark all unread messages from a specific sender as read.

**Event:** `markAsRead`

```javascript
const markMessagesAsRead = (currentUserId, chatPartnerId) => {
  socket.emit('markAsRead', {
    senderId: chatPartnerId,      // The person who sent the messages
    receiverId: currentUserId     // The current user reading them
  });
};

// Example usage
markMessagesAsRead('507f1f77bcf86cd799439011', '507f191e810c19729de860ea');
```

**Parameters:**
- `senderId` (String): User ID who sent the messages
- `receiverId` (String): User ID who is reading the messages

**Backend Action:**
- Updates all unread messages from sender to receiver
- Sets `isRead: true` and `readAt: new Date()`
- Notifies the sender via `messages-read` event

---

#### 4. Set Active Chat Session
Track when a user is actively viewing a chat with another user.

**Event:** `activeChat`

```javascript
// When user opens a chat
const setActiveChat = (currentUserId, chatPartnerId) => {
  socket.emit('activeChat', {
    senderId: currentUserId,
    receiverId: chatPartnerId
  });
};

// When user closes/leaves the chat
const clearActiveChat = (chatPartnerId) => {
  socket.emit('activeChat', {
    receiverId: chatPartnerId
    // Note: Omitting senderId clears the active chat
  });
};

// Example usage
// User opens chat with another user
setActiveChat('507f1f77bcf86cd799439011', '507f191e810c19729de860ea');

// User closes the chat
clearActiveChat('507f191e810c19729de860ea');
```

**Parameters:**
- `senderId` (String, optional): Current user's ID - presence indicates active chat
- `receiverId` (String): The chat partner's ID

**Use Case:** Can be used to show typing indicators or prevent duplicate notifications.

---

#### 5. Update FCM Token
Update the Firebase Cloud Messaging token for push notifications.

**Event:** `updateFcmToken`

```javascript
const updateFcmToken = (userId, fcmToken) => {
  socket.emit('updateFcmToken', {
    userId: userId,
    fcmToken: fcmToken
  });
};

// Example usage
updateFcmToken('507f1f77bcf86cd799439011', 'fcm_token_xyz123...');
```

**Parameters:**
- `userId` (String): User's MongoDB ObjectId
- `fcmToken` (String): Firebase Cloud Messaging token

**Response Event:** `fcmTokenUpdated`

---

### Server to Client Events

#### 1. Online Users List
Receive updates when users come online or go offline.

**Event:** `onlineUsers`

```javascript
socket.on('onlineUsers', (userIds) => {
  console.log('Currently online users:', userIds);
  // userIds is an array of user IDs who are currently online
  updateOnlineStatus(userIds);
});
```

**Data Structure:**
```javascript
// Example
['507f1f77bcf86cd799439011', '507f191e810c19729de860ea', '507f1f77bcf86cd799439012']
```

**Triggered When:**
- A new user connects and registers
- A user disconnects
- Initial connection

---

#### 2. Receive Direct Message
Receive incoming messages in real-time.

**Event:** `receiver-{userId}`

**Note:** The event name is dynamic and includes your user ID.

```javascript
const setupMessageListener = (currentUserId) => {
  socket.on(`receiver-${currentUserId}`, (data) => {
    console.log('New message received:', data);
    
    // Add message to chat UI
    displayMessage(data);
    
    // Auto-mark as read if user is viewing this chat
    if (isActiveChatWith(data.senderId)) {
      markMessagesAsRead(currentUserId, data.senderId);
    }
    
    // Show notification if user is not in the chat
    if (!isActiveChatWith(data.senderId)) {
      showNotification(data);
    }
  });
};

// Example usage
setupMessageListener('507f1f77bcf86cd799439011');
```

**Data Structure:**
```javascript
{
  _id: '60d5ec49f1b2c72b8c8e4f3a',
  senderId: '507f191e810c19729de860ea',
  receiverId: '507f1f77bcf86cd799439011',
  message: 'Hello there!',
  image: null,
  messageType: 'text',  // 'text' or 'image'
  isRead: false,
  createdAt: '2025-10-09T10:30:00.000Z'
}
```

---

#### 3. Message Sent Confirmation
Confirmation that your message was successfully sent and saved.

**Event:** `message-sent`

```javascript
socket.on('message-sent', (data) => {
  console.log('Message sent successfully:', data);
  
  // Update message status in UI
  updateMessageStatus(data._id, 'sent');
  
  // Add message to chat window
  addMessageToChat(data);
});
```

**Data Structure:**
```javascript
{
  _id: '60d5ec49f1b2c72b8c8e4f3a',
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f191e810c19729de860ea',
  message: 'Hello there!',
  image: null,
  messageType: 'text',
  isRead: false,
  createdAt: '2025-10-09T10:30:00.000Z',
  status: 'sent'
}
```

---

#### 4. Messages Read Confirmation
Notification that your sent messages have been read.

**Event:** `messages-read`

```javascript
socket.on('messages-read', (data) => {
  console.log('Messages marked as read:', data);
  
  // Update UI to show messages as read (e.g., double check marks)
  updateMessagesReadStatus(data.senderId, data.receiverId);
});
```

**Data Structure:**
```javascript
{
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f191e810c19729de860ea',
  isRead: true
}
```

---

#### 5. FCM Token Update Confirmation
Confirmation that FCM token was updated successfully.

**Event:** `fcmTokenUpdated`

```javascript
socket.on('fcmTokenUpdated', (data) => {
  if (data.success) {
    console.log('FCM token updated successfully');
  } else {
    console.error('Failed to update FCM token:', data.error);
  }
});
```

**Data Structure:**
```javascript
// Success
{ success: true }

// Error
{ success: false, error: 'Failed to update FCM token' }
```

---

#### 6. Error Handling
Handle errors from socket operations.

**Event:** `error`

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  // Show user-friendly error message
  if (error.message === 'Invalid message data') {
    showToast('Please provide a message or image');
  } else if (error.message === 'Failed to send message') {
    showToast('Failed to send message. Please try again.');
  } else if (error.message === 'Failed to mark messages as read') {
    console.error('Read receipt error:', error);
  }
});
```

**Possible Error Messages:**
- `"Invalid message data"` - Missing required fields in sendMessage
- `"Failed to send message"` - Server error while processing message
- `"Failed to mark messages as read"` - Server error while updating read status

---

## REST API Endpoints

### 1. Get Messages Between Two Users

**Endpoint:** `GET /api/message/messages`

**Query Parameters:**
- `senderId` (required): ID of one user
- `receiverId` (required): ID of the other user
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Example Request:**
```javascript
const getMessages = async (senderId, receiverId, page = 1, limit = 50) => {
  const response = await fetch(
    `http://localhost:5000/api/message/messages?senderId=${senderId}&receiverId=${receiverId}&page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );
  return response.json();
};

// Usage
const messages = await getMessages(
  '507f1f77bcf86cd799439011',
  '507f191e810c19729de860ea',
  1,
  50
);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f3a",
      "sender": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "image": "/uploads/images/user1.jpg"
      },
      "receiver": {
        "_id": "507f191e810c19729de860ea",
        "firstName": "Jane",
        "lastName": "Smith",
        "image": "/uploads/images/user2.jpg"
      },
      "message": "Hello there!",
      "image": null,
      "messageType": "text",
      "isRead": true,
      "readAt": "2025-10-09T10:35:00.000Z",
      "createdAt": "2025-10-09T10:30:00.000Z",
      "updatedAt": "2025-10-09T10:35:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPage": 1
  }
}
```

---

### 2. Send Message with Image

**Endpoint:** `POST /api/message/message-with-image`

**Content-Type:** `multipart/form-data`

**Fields:**
- `data` (JSON string): `{ senderId, receiverId, message }`
- `image` (File): Image file to upload

**Example Request:**
```javascript
const sendMessageWithImage = async (senderId, receiverId, message, imageFile) => {
  const formData = new FormData();
  
  // Add JSON data
  formData.append('data', JSON.stringify({
    senderId,
    receiverId,
    message
  }));
  
  // Add image file
  formData.append('image', imageFile);
  
  const response = await fetch('http://localhost:5000/api/message/message-with-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });
  
  return response.json();
};

// Usage with file input
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  const result = await sendMessageWithImage(
    '507f1f77bcf86cd799439011',
    '507f191e810c19729de860ea',
    'Check out this image!',
    file
  );
};
```

**Response:**
```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f3a",
    "sender": "507f1f77bcf86cd799439011",
    "receiver": "507f191e810c19729de860ea",
    "message": "Check out this image!",
    "image": "/uploads/images/photo-xyz123.jpg",
    "messageType": "image",
    "isRead": false,
    "createdAt": "2025-10-09T10:30:00.000Z"
  }
}
```

---

## Complete Implementation Examples

### React Implementation

#### 1. Socket Hook Setup

```javascript
// hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      
      // Register user as online
      socket.emit('register', userId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Online users handler
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers
  };
};
```

---

#### 2. Chat Component

```javascript
// components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

const ChatWindow = ({ currentUserId, chatPartnerId, chatPartnerName }) => {
  const { socket, isConnected, onlineUsers } = useSocket(currentUserId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isPartnerOnline = onlineUsers.includes(chatPartnerId);

  // Load chat history on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/message/messages?senderId=${currentUserId}&receiverId=${chatPartnerId}&page=1&limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    if (currentUserId && chatPartnerId) {
      loadMessages();
    }
  }, [currentUserId, chatPartnerId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Set active chat
    socket.emit('activeChat', {
      senderId: currentUserId,
      receiverId: chatPartnerId
    });

    // Listen for incoming messages
    const handleIncomingMessage = (data) => {
      if (data.senderId === chatPartnerId) {
        setMessages(prev => [...prev, data]);
        
        // Auto-mark as read since chat is active
        socket.emit('markAsRead', {
          senderId: chatPartnerId,
          receiverId: currentUserId
        });

        // Scroll to bottom
        scrollToBottom();
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      // Update message status in UI if needed
      console.log('Message sent:', data);
    };

    // Listen for messages read confirmation
    const handleMessagesRead = (data) => {
      if (data.receiverId === chatPartnerId) {
        // Update all messages from current user to partner as read
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId === currentUserId && msg.receiverId === chatPartnerId
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    };

    // Error handler
    const handleError = (error) => {
      console.error('Socket error:', error);
      alert(error.message || 'An error occurred');
    };

    socket.on(`receiver-${currentUserId}`, handleIncomingMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('messages-read', handleMessagesRead);
    socket.on('error', handleError);

    // Mark existing unread messages as read
    socket.emit('markAsRead', {
      senderId: chatPartnerId,
      receiverId: currentUserId
    });

    // Cleanup
    return () => {
      socket.off(`receiver-${currentUserId}`, handleIncomingMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('messages-read', handleMessagesRead);
      socket.off('error', handleError);
      
      // Clear active chat
      socket.emit('activeChat', {
        receiverId: chatPartnerId
      });
    };
  }, [socket, currentUserId, chatPartnerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || isSending) return;

    setIsSending(true);

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: chatPartnerId,
      message: newMessage.trim(),
      image: null
    });

    setNewMessage('');
    setIsSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <h3>{chatPartnerName}</h3>
        <span className={`status ${isPartnerOnline ? 'online' : 'offline'}`}>
          {isPartnerOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={msg._id || index}
            className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
          >
            {msg.image && (
              <img src={`http://localhost:5000${msg.image}`} alt="Message" />
            )}
            {msg.message && <p>{msg.message}</p>}
            <div className="message-meta">
              <span className="time">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
              {msg.senderId === currentUserId && (
                <span className={`read-status ${msg.isRead ? 'read' : 'unread'}`}>
                  {msg.isRead ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!isConnected || isSending}
        />
        <button 
          onClick={sendMessage}
          disabled={!isConnected || isSending || !newMessage.trim()}
        >
          Send
        </button>
      </div>

      {!isConnected && (
        <div className="connection-status">
          Connecting to server...
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
```

---

#### 3. Image Message Component

```javascript
// components/ImageMessageSender.jsx
import React, { useState } from 'react';

const ImageMessageSender = ({ currentUserId, chatPartnerId, onImageSent }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sendImageMessage = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        senderId: currentUserId,
        receiverId: chatPartnerId,
        message: caption
      }));
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:5000/api/message/message-with-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setSelectedFile(null);
        setCaption('');
        setPreview(null);
        
        // Notify parent component
        if (onImageSent) {
          onImageSent(data.data);
        }
      } else {
        alert('Failed to send image');
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Failed to send image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setCaption('');
    setPreview(null);
  };

  return (
    <div className="image-sender">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="image-upload"
      />
      
      {!preview ? (
        <label htmlFor="image-upload" className="upload-button">
          📷 Send Image
        </label>
      ) : (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)..."
          />
          <div className="actions">
            <button onClick={cancelSelection} disabled={uploading}>
              Cancel
            </button>
            <button onClick={sendImageMessage} disabled={uploading}>
              {uploading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageMessageSender;
```

---

### Vue.js Implementation

#### 1. Socket Composable

```javascript
// composables/useSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket(userId) {
  const socket = ref(null);
  const isConnected = ref(false);
  const onlineUsers = ref([]);

  const connect = () => {
    if (!userId.value) return;

    socket.value = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.value.on('connect', () => {
      console.log('Connected to socket server');
      isConnected.value = true;
      socket.value.emit('register', userId.value);
    });

    socket.value.on('disconnect', () => {
      console.log('Disconnected from socket server');
      isConnected.value = false;
    });

    socket.value.on('onlineUsers', (users) => {
      onlineUsers.value = users;
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    onlineUsers,
    connect,
    disconnect
  };
}
```

---

### Vanilla JavaScript Implementation

```javascript
// socket-manager.js
class SocketManager {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.isConnected = false;
    this.onlineUsers = [];
    this.messageHandlers = [];
  }

  connect(userId) {
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.socket.emit('register', userId);
      this.onConnectionChange(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.onConnectionChange(false);
    });

    this.socket.on('onlineUsers', (users) => {
      this.onlineUsers = users;
      this.onOnlineUsersChange(users);
    });

    this.socket.on(`receiver-${userId}`, (data) => {
      this.messageHandlers.forEach(handler => handler(data));
    });

    this.socket.on('message-sent', (data) => {
      console.log('Message sent:', data);
    });

    this.socket.on('messages-read', (data) => {
      console.log('Messages read:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  sendMessage(senderId, receiverId, message, image = null) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('sendMessage', {
      senderId,
      receiverId,
      message,
      image
    });
  }

  markAsRead(senderId, receiverId) {
    if (!this.socket) return;
    
    this.socket.emit('markAsRead', {
      senderId,
      receiverId
    });
  }

  setActiveChat(currentUserId, chatPartnerId) {
    if (!this.socket) return;
    
    this.socket.emit('activeChat', {
      senderId: currentUserId,
      receiverId: chatPartnerId
    });
  }

  clearActiveChat(chatPartnerId) {
    if (!this.socket) return;
    
    this.socket.emit('activeChat', {
      receiverId: chatPartnerId
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onConnectionChange(handler) {
    this.connectionChangeHandler = handler;
  }

  onOnlineUsersChange(handler) {
    this.onlineUsersHandler = handler;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const socketManager = new SocketManager('http://localhost:5000');
socketManager.connect('507f1f77bcf86cd799439011');

socketManager.onMessage((data) => {
  console.log('New message:', data);
  // Update UI
});

socketManager.onOnlineUsersChange((users) => {
  console.log('Online users:', users);
  // Update UI
});

// Send message
socketManager.sendMessage(
  '507f1f77bcf86cd799439011',
  '507f191e810c19729de860ea',
  'Hello!'
);
```

---

## Best Practices

### 1. Connection Management
```javascript
// Always check connection status before emitting
if (socket && socket.connected) {
  socket.emit('sendMessage', data);
} else {
  console.error('Socket not connected');
  // Queue message or show error to user
}
```

### 2. Error Handling
```javascript
// Implement comprehensive error handling
socket.on('error', (error) => {
  // Log error for debugging
  console.error('Socket error:', error);
  
  // Show user-friendly message
  showNotification('Failed to send message. Please try again.');
  
  // Optionally retry or queue the action
});
```

### 3. Reconnection Strategy
```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  
  // Re-register user
  socket.emit('register', userId);
  
  // Refresh data that might have changed
  loadRecentMessages();
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  showNotification('Connection lost. Please refresh the page.');
});
```

### 4. Memory Management
```javascript
// Always clean up event listeners
useEffect(() => {
  const handleMessage = (data) => {
    // Handle message
  };
  
  socket.on(`receiver-${userId}`, handleMessage);
  
  return () => {
    // Cleanup
    socket.off(`receiver-${userId}`, handleMessage);
  };
}, [socket, userId]);
```

### 5. Active Chat Management
```javascript
// Set active chat when opening chat window
useEffect(() => {
  if (chatPartnerId) {
    socket.emit('activeChat', {
      senderId: currentUserId,
      receiverId: chatPartnerId
    });
    
    return () => {
      // Clear when leaving chat
      socket.emit('activeChat', {
        receiverId: chatPartnerId
      });
    };
  }
}, [chatPartnerId]);
```

---

## Troubleshooting

### Connection Issues
```javascript
// Check if socket is connecting
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Check CORS settings
  // Verify server URL
  // Check network connectivity
});
```

### Messages Not Receiving
- Verify user is registered: `socket.emit('register', userId)`
- Check event name matches: `receiver-${userId}`
- Ensure mutual connection exists between users
- Check console for errors

### Messages Not Sending
- Verify both `senderId` and `receiverId` are provided
- Ensure at least one of `message` or `image` is provided
- Check if users have mutual connection
- Monitor `error` event for specific issues

---

## Security Considerations

1. **Authentication**: Always include authentication token in REST API requests
2. **Validation**: Backend validates all socket events and checks user permissions
3. **Connection Check**: Backend verifies mutual connection before allowing messages
4. **Data Sanitization**: Sanitize user input before displaying
5. **Rate Limiting**: Consider implementing rate limiting for message sending

---

## Additional Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React Socket.IO Integration](https://socket.io/how-to/use-with-react)
- [Vue Socket.IO Integration](https://socket.io/how-to/use-with-vue)

---

## Support

For issues or questions:
1. Check this documentation first
2. Review console logs for error messages
3. Verify backend server is running
4. Check network connectivity
5. Contact backend team for server-side issues

---

**Last Updated:** October 9, 2025
**Version:** 1.0.0
