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

---

#### 2. Update FCM Token
**Event:** `updateFcmToken`

**When:** After getting FCM token for push notifications

**Data:**
```dart
socket.emit('updateFcmToken', {
  'userId': userId,
  'fcmToken': fcmToken
});
```

**Response:** `fcmTokenUpdated`
```dart
socket.on('fcmTokenUpdated', (data) {
  if (data['success']) {
    print('FCM token updated successfully');
  }
});
```

---

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
  'senderId': myUserId,
  'receiverId': partnerId,
  'message': 'Hello!'
});
```

**Purpose:** Send text messages instantly without REST API

**Note:** For images/audio, use REST API endpoints instead

---

#### 5. Mark as Read
**Event:** `markAsRead`

**When:** User opens chat and reads messages

**Data:**
```dart
socket.emit('markAsRead', {
  'senderId': chatPartnerId,  // Who sent the messages
  'receiverId': myUserId      // You (who's reading)
});
```

**Purpose:** Mark all messages from a user as read

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
  //   "_id": "message_id",
  //   "senderId": "sender_id",
  //   "receiverId": "your_id",
  //   "message": "Hello!",
  //   "messageType": "text",
  //   "isRead": false,
  //   "createdAt": "2025-01-01T10:00:00Z"
  // }
  
  // Add message to chat
  // Update UI
  // Show notification if not in chat
});
```

**Purpose:** Receive messages in real-time

---

#### 3. Message Sent Confirmation
**Event:** `message-sent`

**When:** Your message is successfully sent

**Data:**
```dart
socket.on('message-sent', (data) {
  // {
  //   "_id": "message_id",
  //   "senderId": "your_id",
  //   "receiverId": "partner_id",
  //   "message": "Hello!",
  //   "messageType": "text",
  //   "status": "sent",
  //   "createdAt": "2025-01-01T10:00:00Z"
  // }
  
  // Update message status to "sent"
  // Show checkmark in UI
});
```

**Purpose:** Confirm message delivery

---

#### 4. Messages Read
**Event:** `messages-read`

**When:** Other user reads your messages

**Data:**
```dart
socket.on('messages-read', (data) {
  // {
  //   "senderId": "your_id",
  //   "receiverId": "partner_id",
  //   "isRead": true
  // }
  
  // Update all messages to this user as "read"
  // Show double checkmark in UI
});
```

**Purpose:** Show read receipts

---

#### 5. Error
**Event:** `error`

**When:** Something goes wrong with socket operation

**Data:**
```dart
socket.on('error', (data) {
  print('Socket error: ${data['message']}');
  // Show error to user
});
```

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
- Update UI to show read status

### 5. Online Status
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
