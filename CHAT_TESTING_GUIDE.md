# Chat System Testing Guide

## Prerequisites for Testing

1. **Two users with mutual love match**:
   - User A likes User B
   - User B likes User A
   - This creates a connection in the database

2. **Authentication tokens** for both users

## Testing REST API Endpoints

### 1. Test Chat List
```bash
curl -X GET "http://localhost:3000/api/chat" \
  -H "Authorization: Bearer <user_token>"
```

### 2. Test Get Messages
```bash
curl -X GET "http://localhost:3000/api/message/chat/{other_user_id}?page=1&limit=20" \
  -H "Authorization: Bearer <user_token>"
```

### 3. Test Send Image Message
```bash
curl -X POST "http://localhost:3000/api/message/image" \
  -H "Authorization: Bearer <user_token>" \
  -F 'image=@/path/to/image.jpg' \
  -F 'data={"senderId":"your_user_id","receiverId":"other_user_id","message":"Check this out!"}'
```

### 4. Test Send Audio Message
```bash
curl -X POST "http://localhost:3000/api/message/audio" \
  -H "Authorization: Bearer <user_token>" \
  -F 'audio=@/path/to/audio.mp3' \
  -F 'data={"senderId":"your_user_id","receiverId":"other_user_id"}'
```

### 5. Test Send Multiple Images
```bash
curl -X POST "http://localhost:3000/api/message/images" \
  -H "Authorization: Bearer <user_token>" \
  -F 'images=@/path/to/image1.jpg' \
  -F 'images=@/path/to/image2.jpg' \
  -F 'data={"senderId":"your_user_id","receiverId":"other_user_id","message":"Multiple photos!"}'
```

### 6. Test Mark as Read
```bash
curl -X PATCH "http://localhost:3000/api/message/mark-read" \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"senderId":"other_user_id","receiverId":"your_user_id"}'
```

## Testing Socket.IO

### HTML Test Client
```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Test</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>

    <script>
        const socket = io('http://localhost:3000');
        const userId = 'your_user_id'; // Replace with actual user ID
        const otherUserId = 'other_user_id'; // Replace with other user ID

        // Register user
        socket.emit('register', userId);

        // Listen for online users
        socket.on('onlineUsers', (users) => {
            console.log('Online users:', users);
        });

        // Listen for incoming messages
        socket.on(`receiver-${userId}`, (messageData) => {
            console.log('Message received:', messageData);
            displayMessage(messageData);
        });

        // Listen for message sent confirmation
        socket.on('message-sent', (messageData) => {
            console.log('Message sent:', messageData);
            displayMessage(messageData);
        });

        // Listen for read receipts
        socket.on('messages-read', (data) => {
            console.log('Messages read:', data);
        });

        // Send text message
        function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (message) {
                socket.emit('sendMessage', {
                    senderId: userId,
                    receiverId: otherUserId,
                    message: message
                });
                messageInput.value = '';
            }
        }

        // Display message in UI
        function displayMessage(messageData) {
            const messagesDiv = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `
                <strong>${messageData.senderId === userId ? 'You' : 'Other'}:</strong> 
                ${messageData.message || '[File]'} 
                <small>${new Date(messageData.createdAt).toLocaleTimeString()}</small>
            `;
            messagesDiv.appendChild(messageElement);
        }

        // Mark messages as read
        function markAsRead() {
            socket.emit('markAsRead', {
                senderId: otherUserId,
                receiverId: userId
            });
        }

        // Enter key to send message
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## Verification Checklist

### Database Verification
1. **Check Connection exists**:
   ```javascript
   db.connections.find({
     userIds: { $all: ["user1_id", "user2_id"] }
   })
   ```

2. **Check Messages are created**:
   ```javascript
   db.messages.find({
     $or: [
       { sender: "user1_id", receiver: "user2_id" },
       { sender: "user2_id", receiver: "user1_id" }
     ]
   }).sort({ createdAt: -1 })
   ```

### File Upload Verification
1. **Check uploads folder structure**:
   ```
   uploads/
   ├── images/
   └── audio/
   ```

2. **Verify file processing**:
   - Images should be converted to WebP format
   - Files should have unique names with user ID prefix

### Socket.IO Verification
1. **Connection**: Users should appear in online users list
2. **Real-time messaging**: Text messages should arrive instantly
3. **Read receipts**: Mark as read should trigger events
4. **File notifications**: REST API file uploads should trigger socket events

## Expected Response Times
- **Text messages**: < 100ms
- **File uploads**: < 5 seconds (depending on file size)
- **Chat list**: < 500ms
- **Message history**: < 1 second

## Common Issues and Solutions

### 1. "No mutual connection found"
- Verify both users have liked each other
- Check Connection collection in database

### 2. File upload fails
- Check file format is supported
- Verify file size is under 50MB
- Ensure uploads directory exists and is writable

### 3. Socket connection issues
- Verify CORS settings
- Check network connectivity
- Ensure user is registered with socket

### 4. Messages not appearing in chat list
- Verify lastMessage and lastMessageTime are updated
- Check Connection document exists

### 5. Real-time messages not received
- Ensure both users are registered with socket
- Check user is online in users Map
- Verify event names match exactly
