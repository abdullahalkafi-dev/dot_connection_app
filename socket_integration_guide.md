# Socket.IO Integration Guide for Flutter

## Overview
This app uses Socket.IO for real-time features like messaging, online status, and match notifications.

## Socket Server URL
```
wss://your-api-domain.com
```
Or for development:
```
ws://localhost:5000
```

---

## Flutter Package
Add to your `pubspec.yaml`:
```yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

---

## Initial Connection Setup

### 1. Connect to Socket Server

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? socket;
  
  void connect(String userId, String token) {
    socket = IO.io('https://your-api-domain.com', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'extraHeaders': {
        'Authorization': 'Bearer $token'
      }
    });
    
    socket!.connect();
    
    socket!.onConnect((_) {
      print('Connected to socket server');
      registerUser(userId);
    });
    
    socket!.onDisconnect((_) => print('Disconnected from socket'));
    
    socket!.onConnectError((data) => print('Connection Error: $data'));
    
    socket!.onError((data) => print('Socket Error: $data'));
  }
  
  void disconnect() {
    socket?.disconnect();
    socket?.dispose();
  }
}
```

---

## Socket Events Reference

### Client → Server Events (Emit)

#### 1. Register User
**Event:** `register`

**When:** Immediately after socket connection

**Data:**
```dart
socket.emit('register', userId);
```

**Purpose:** Register your user ID with the socket server to receive targeted events


#### 3. Active Chat
**Event:** `activeChat`

**When:** When user opens/closes a chat screen

**Data:**
```dart
// When opening chat
socket.emit('activeChat', {
  'receiverId': currentUserId,
  'senderId': chatPartnerId
});

// When closing chat
socket.emit('activeChat', {
  'receiverId': currentUserId,
  'senderId': null
});
```

**Purpose:** Prevents push notifications when user is actively chatting

---

#### 4. Send Message
**Event:** `sendMessage`

**When:** Sending a text message in real-time

**Data:**
```dart
socket.emit('sendMessage', {
  'senderId': '68be64b2a0db89cc44e43270',
  'receiverId': '68be6aeba0db89cc44e4328c',
  'message': 'Hello there!'
});
```

**Purpose:** Send text messages instantly via socket connection

**Response Events:**
- Sender receives: `message-sent` (confirmation)
- Receiver receives: `receiver-{receiverId}` (the actual message)

**Important Notes:**
- Only for **text messages** (no files)
- For images: Use `POST /message/image` REST API endpoint
- For audio: Use `POST /message/audio` REST API endpoint
- Requires mutual connection between users (will fail if no connection exists)
- Message is saved to database before being sent to receiver

---

#### 5. Mark as Read
**Event:** `markAsRead`

**When:** User opens chat and views unread messages

**Data:**
```dart
socket.emit('markAsRead', {
  'senderId': '68be6aeba0db89cc44e4328c',  // Who sent the messages to you
  'receiverId': '68be64b2a0db89cc44e43270'  // You (who's reading them)
});
```

**Purpose:** Mark all unread messages from a specific user as read

**Response:**
- Updates all unread messages in database: `isRead: true`, `readAt: timestamp`
- Sender receives `messages-read` event notification

**When to emit:**
- When user opens a chat screen
- When user views messages in the chat
- Can be called when scrolling through old messages to update read status

---

### Server → Client Events (Listen)

#### 1. Online Users
**Event:** `onlineUsers`

**When:** User connects/disconnects, or after you register

**Data:** Array of online user IDs
```dart
socket.on('onlineUsers', (data) {
  List<String> onlineUserIds = List<String>.from(data);
  print('Online users: $onlineUserIds');
  // Update UI to show online indicators
});
```

**Purpose:** Show who's currently online

---

#### 2. Receive Message
**Event:** `receiver-{userId}`

**When:** Someone sends you a message

**Dynamic Event:** Event name includes your user ID

**Data:**
```dart
socket.on('receiver-$myUserId', (data) {
  Message message = Message.fromJson(data);
  // {
  //   "_id": "68c0faee08089cbc8be60e26",
  //   "senderId": "68be64b2a0db89cc44e43270",
  //   "receiverId": "68be6aeba0db89cc44e4328c",
  //   "message": "Hello there!",
  //   "image": null,      // For single image messages
  //   "images": [],       // For multiple image messages
  //   "audio": null,      // For audio messages
  //   "messageType": "text",  // "text", "image", or "audio"
  //   "isRead": false,
  //   "createdAt": "2025-09-10T04:13:34.066Z"
  // }
  
  // Add message to chat
  // Update UI
  // Show notification if not in chat
  // Play notification sound if app is in background
});
```

**Purpose:** Receive messages in real-time

**Note:** 
- Only text messages are sent via socket
- Image and audio messages should be fetched via REST API after receiving notification
- The `messageType` field indicates: `text`, `image`, or `audio`

---

#### 3. Message Sent Confirmation
**Event:** `message-sent`

**When:** Your message is successfully sent and saved to database

**Data:**
```dart
socket.on('message-sent', (data) {
  // {
  //   "_id": "68c0faee08089cbc8be60e26",
  //   "senderId": "68be64b2a0db89cc44e43270",
  //   "receiverId": "68be6aeba0db89cc44e4328c",
  //   "message": "Hello there!",
  //   "image": null,
  //   "images": [],
  //   "audio": null,
  //   "messageType": "text",
  //   "isRead": false,
  //   "createdAt": "2025-09-10T04:13:34.066Z",
  //   "status": "sent"
  // }
  
  // Update message status to "sent" (single checkmark)
  // Replace temporary local message with server message (with _id)
  // Show checkmark in UI
});
```

**Purpose:** Confirm message was saved to database and delivered to server

---

#### 4. Messages Read
**Event:** `messages-read`

**When:** Other user reads your messages (after they emit `markAsRead`)

**Data:**
```dart
socket.on('messages-read', (data) {
  // {
  //   "senderId": "68be64b2a0db89cc44e43270",  // You (the sender)
  //   "receiverId": "68be6aeba0db89cc44e4328c",  // The reader
  //   "isRead": true
  // }
  
  // Update all messages you sent to this user as "read"
  // Change single checkmark to double checkmark
  // Update message status in local database/cache
});
```

**Purpose:** Show read receipts (double checkmark) when recipient reads your messages

**Note:** This event is triggered when the receiver emits `markAsRead` event

---

#### 5. Error
**Event:** `error`

**When:** Something goes wrong with socket operation (validation error, server error, etc.)

**Data:**
```dart
socket.on('error', (data) {
  // {
  //   "message": "Invalid message data" 
  //   // OR
  //   "message": "Failed to send message"
  //   // OR
  //   "message": "Failed to mark messages as read"
  // }
  
  print('Socket error: ${data['message']}');
  // Show user-friendly error message
  // Log error for debugging
});
```

**Common error messages:**
- `"Invalid message data"` - Missing required fields in sendMessage
- `"Failed to send message"` - Database or connection error
- `"Failed to mark messages as read"` - Database error
- `"No mutual connection found between users"` - Users not matched

**Purpose:** Handle errors gracefully and inform user of issues

---

## Complete Flutter Implementation Example

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? socket;
  String? currentUserId;
  
  // Callbacks
  Function(List<String>)? onOnlineUsersUpdate;
  Function(Map<String, dynamic>)? onMessageReceived;
  Function(Map<String, dynamic>)? onMessageSent;
  Function(Map<String, dynamic>)? onMessagesRead;

  void connect(String userId, String token) {
    currentUserId = userId;
    
    socket = IO.io(
      'https://your-api-domain.com',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .build(),
    );

    socket!.connect();
    
    _setupListeners();
  }

  void _setupListeners() {
    socket!.onConnect((_) {
      print('✅ Connected to socket');
      if (currentUserId != null) {
        registerUser(currentUserId!);
      }
    });

    socket!.onDisconnect((_) {
      print('❌ Disconnected from socket');
    });

    socket!.on('onlineUsers', (data) {
      List<String> onlineUsers = List<String>.from(data);
      onOnlineUsersUpdate?.call(onlineUsers);
    });

    socket!.on('receiver-$currentUserId', (data) {
      onMessageReceived?.call(Map<String, dynamic>.from(data));
    });

    socket!.on('message-sent', (data) {
      onMessageSent?.call(Map<String, dynamic>.from(data));
    });

    socket!.on('messages-read', (data) {
      onMessagesRead?.call(Map<String, dynamic>.from(data));
    });

    socket!.on('error', (data) {
      print('Socket error: $data');
    });
  }

  void registerUser(String userId) {
    socket?.emit('register', userId);
  }

  void updateFCMToken(String userId, String fcmToken) {
    socket?.emit('updateFcmToken', {
      'userId': userId,
      'fcmToken': fcmToken,
    });
  }

  void setActiveChat(String receiverId, String? chatPartnerId) {
    socket?.emit('activeChat', {
      'receiverId': receiverId,
      'senderId': chatPartnerId,
    });
  }

  void sendMessage({
    required String senderId,
    required String receiverId,
    required String message,
  }) {
    socket?.emit('sendMessage', {
      'senderId': senderId,
      'receiverId': receiverId,
      'message': message,
    });
  }

  void markAsRead({
    required String senderId,
    required String receiverId,
  }) {
    socket?.emit('markAsRead', {
      'senderId': senderId,
      'receiverId': receiverId,
    });
  }

  void disconnect() {
    socket?.disconnect();
    socket?.dispose();
    socket = null;
  }
}
```

---

## Usage in Flutter App

### 1. Initialize on Login
```dart
void onLoginSuccess(String userId, String token) {
  SocketService().connect(userId, token);
  
  // Set up callbacks
  SocketService().onOnlineUsersUpdate = (users) {
    setState(() {
      onlineUserIds = users;
    });
  };
  
  SocketService().onMessageReceived = (data) {
    // Handle new message
    handleNewMessage(Message.fromJson(data));
  };
}
```

### 2. Send Message in Chat
```dart
void sendMessage(String message) {
  SocketService().sendMessage(
    senderId: currentUserId,
    receiverId: chatPartnerId,
    message: message,
  );
}
```

### 3. Mark Messages as Read
```dart
@override
void initState() {
  super.initState();
  // Mark as read when opening chat
  SocketService().markAsRead(
    senderId: chatPartnerId,
    receiverId: currentUserId,
  );
  
  // Set active chat
  SocketService().setActiveChat(currentUserId, chatPartnerId);
}

@override
void dispose() {
  // Clear active chat
  SocketService().setActiveChat(currentUserId, null);
  super.dispose();
}
```

### 4. Show Online Status
```dart
bool isUserOnline(String userId) {
  return onlineUserIds.contains(userId);
}

Widget buildOnlineIndicator(String userId) {
  return Container(
    width: 12,
    height: 12,
    decoration: BoxDecoration(
      color: isUserOnline(userId) ? Colors.green : Colors.grey,
      shape: BoxShape.circle,
      border: Border.all(color: Colors.white, width: 2),
    ),
  );
}
```

### 5. Disconnect on Logout
```dart
void logout() {
  SocketService().disconnect();
  // Clear user data
  // Navigate to login
}
```

---

## Important Notes

### 1. Connection Lifecycle
- Connect after successful login
- Disconnect on logout
- Auto-reconnect on connection loss (handled by socket.io-client)
- Register user immediately after connection

### 2. Message Types
- **Text messages:** Can use Socket.IO or REST API
- **Image messages:** Must use REST API (`POST /message/image`)
- **Audio messages:** Must use REST API (`POST /message/audio`)

### 3. Active Chat
- Emit `activeChat` when entering chat screen
- Clear (send null) when leaving chat screen
- Prevents unnecessary push notifications
- Improves user experience

### 4. Read Receipts
- Mark messages as read when user opens chat
- Listen to `messages-read` event for double checkmarks
- Update UI to show read status (single vs double checkmark)
- `readAt` timestamp is stored in database for each message

### 5. Blocked Users
- Cannot send messages to blocked users
- Chat list automatically filters out blocked users
- API returns 403 error: "Cannot access chat with blocked user"
- Socket connections won't receive messages from blocked users
- Check block status before attempting to send messages

### 6. Online Status
- Updates automatically when users connect/disconnect
- Use for showing green dot indicators
- Cache online status in app state
- Update UI reactively

### 6. Error Handling
- Always listen to `error` event
- Show user-friendly error messages
- Retry failed operations
- Handle connection errors gracefully

### 7. Performance
- Don't emit events too frequently
- Batch read receipts when possible
- Use efficient state management
- Avoid rebuilding entire chat on each message

### 8. Security
- Always include JWT token in connection
- Validate user permissions on server
- Never trust client-side data
- Use HTTPS/WSS in production

### 9. Testing
- Test with slow/unstable network
- Test connection loss and recovery
- Test with multiple devices
- Test background/foreground transitions

### 10. Background Handling
- Socket may disconnect in background
- Use FCM push notifications for background messages
- Reconnect when app comes to foreground
- Sync messages on reconnection

---

## Troubleshooting

### Connection Issues
```dart
// Check connection status
print('Socket connected: ${socket?.connected}');

// Manual reconnect
socket?.connect();
```

### Messages Not Receiving
- Verify user is registered: `socket.emit('register', userId)`
- Check event name matches: `receiver-{yourUserId}`
- Ensure mutual connection exists between users
- Check server logs for errors

### Read Receipts Not Working
- Verify `senderId` is the message sender (not you)
- Verify `receiverId` is you (the reader)
- Check if messages-read event is properly listened to
- Ensure socket is connected

### Blocked User Errors
- Error 403: "Cannot access chat with blocked user"
- Check if users have blocked each other
- Blocked users won't appear in chat list
- Socket won't deliver messages between blocked users
- Handle block/unblock functionality gracefully in UI

---

## Production Checklist

- [ ] Use WSS (secure WebSocket) in production
- [ ] Include JWT token in connection
- [ ] Handle reconnection automatically
- [ ] Implement offline message queue
- [ ] Add connection status indicator in UI
- [ ] Test on real devices and networks
- [ ] Implement proper error handling
- [ ] Add logging for debugging
- [ ] Test with multiple concurrent users
- [ ] Monitor socket connection in analytics

---

## Support

For Socket.IO Flutter package documentation:
https://pub.dev/packages/socket_io_client

For backend implementation details, check:
`src/socket/socket.ts` in the backend repository
