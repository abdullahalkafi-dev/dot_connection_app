# Chat System Flow Documentation

## Overview
This documentation explains the complete messaging system flow for matched users in the dating app. It covers user journeys, technical flows, and system behaviors from a user experience perspective.

## 🎯 Core Concept
The chat system is activated only when **both users have mutual love** (both users liked each other). This ensures meaningful connections and prevents unwanted messaging.

## � User Flow Journey

### 1. Match Creation Flow
```
User A likes User B → User B likes User A → Mutual Match Created → Chat Becomes Available
```

**What Happens:**
- When mutual match occurs, both users can now see each other in their "Matches" section
- Chat option becomes available for both users
- System creates a chat record automatically when first message is sent

### 2. Chat Discovery Flow
```
User opens app → Goes to Matches/Chat section → Sees list of matched users → Clicks on a user → Chat opens
```

**Chat List Display:**
- User's profile image
- User's name (firstName + lastName)
- Last message preview (max 100 characters)
- Time of last message
- Unread message count (red badge)
- Read/Unread status indicator

### 3. Messaging Flow

#### 3.1 Opening a Chat
```
User clicks on matched user → Frontend connects to Socket.IO → User registers for real-time messaging → Chat history loads → User sees conversation
```

**Technical Flow:**
1. Frontend establishes Socket.IO connection with JWT token
2. User registration: `socket.emit('register', userId)`
3. Fetch chat history via REST API: `GET /api/message/chat/{otherUserId}`
4. Display messages in chronological order
5. Mark messages as read automatically when chat opens

#### 3.2 Sending Text Messages
```
User types message → Clicks send → Message sent via Socket.IO → Real-time delivery → Confirmation received
```

**Technical Flow:**
1. User types in message input
2. Frontend validates message (not empty, length limits)
3. Send via Socket.IO: `socket.emit('sendMessage', {senderId, receiverId, message})`
4. Server processes and broadcasts to receiver
5. Sender receives confirmation: `socket.on('message-sent')`
6. Receiver gets message instantly: `socket.on('receiver-{userId}')`

#### 3.3 Sending Files (Images/Audio)
```
User selects file → File validation → Upload via REST API → File processing → Message created → Real-time notification
```

**File Types Supported:**
- **Single Image:** JPG, PNG, WEBP (auto-converted to WEBP)
- **Multiple Images:** Up to multiple files in one message
- **Audio:** MP3, WAV, M4A files

**Technical Flow:**
1. User clicks attachment button
2. File picker opens (camera/gallery for images, microphone for audio)
3. Frontend validates file type and size
4. Upload via REST API with FormData
5. Server processes file (compression, format conversion)
6. Message record created in database
7. Real-time notification sent to receiver via Socket.IO

### 4. Real-Time Features Flow

#### 4.1 Online Status
```
User opens app → Connects to Socket.IO → Status becomes "online" → Other users see online indicator → User closes app → Status becomes "offline"
```

**What Users See:**
- Green dot = Online (actively using app)
- Gray dot = Offline (app closed or no internet)
- Last seen time (if offline)

#### 4.2 Read Receipts
```
Message delivered → Receiver opens chat → Messages marked as read → Sender sees double checkmark (✓✓)
```

**Visual Indicators:**
- Single checkmark (✓) = Message sent
- Double checkmark (✓✓) = Message read
- Blue double checkmark = Read (optional styling)

#### 4.3 Typing Indicators (Future Enhancement)
```
User starts typing → "User is typing..." appears for other user → User stops typing → Indicator disappears
```

## 🔄 System Behavior Flows

### 1. New Message Notification Flow
```
Message sent → Real-time check if receiver is active in chat → If active: instant delivery → If inactive: push notification sent → Unread count updated
```

### 2. Chat List Update Flow
```
New message received → Chat list reorders (most recent first) → Unread badge updates → Last message preview updates → Timestamp updates
```

### 3. Message Status Flow
```
Message created → Status: "sending" → Message saved to database → Status: "sent" → Receiver opens chat → Status: "read"
```

## 🎨 User Interface Flow

### 1. Chat List Screen
**What User Sees:**
```
┌─────────────────────────────────┐
│ Chats                     [New] │
├─────────────────────────────────┤
│ [👤] Sarah Johnson        [🔴2] │
│      Hey, how are you?      2h  │
├─────────────────────────────────┤
│ [👤] Emily Davis           [✓✓] │
│      Thanks for the coffee  1d  │
├─────────────────────────────────┤
│ [👤] Jessica Wilson             │
│      [📷 Image]            3d   │
└─────────────────────────────────┘
```

**Elements:**
- Profile picture (circular)
- Name (firstName + lastName)
- Last message preview (truncated to 100 chars)
- Time ago (2h, 1d, 3d, etc.)
- Unread count badge (red circle with number)
- Read status (✓ or ✓✓)

### 2. Chat Screen
**What User Sees:**
```
┌─────────────────────────────────┐
│ ← Sarah Johnson        ● Online │
├─────────────────────────────────┤
│                                 │
│     Hello there! ✓✓             │
│                    3:45 PM      │
│                                 │
│ Hey! How are you?               │
│ 3:46 PM                         │
│                                 │
│         [📷 Image] ✓            │
│                    3:50 PM      │
│                                 │
├─────────────────────────────────┤
│ [Type message...] [📎] [Send]   │
└─────────────────────────────────┘
```

**Elements:**
- Header with name and online status
- Messages aligned (right = sent, left = received)
- Timestamps for each message
- Read receipts on sent messages
- Media messages (images, audio players)
- Input area with attachment button

## 📊 Data Flow Architecture

### 1. Real-Time Communication (Socket.IO)
```
Text Messages Only
├── User A types message
├── Frontend → Socket.IO → Backend
├── Backend validates & saves to DB
├── Backend → Socket.IO → User B (if online)
└── User B receives instantly
```

### 2. File Upload Communication (REST API)
```
Files (Images/Audio)
├── User A selects file
├── Frontend → REST API → Backend
├── Backend processes & saves file
├── Backend saves message record to DB
├── Backend → Socket.IO notification → User B
└── User B sees new message notification
```

### 3. Data Synchronization
```
When User Opens App
├── Connect to Socket.IO (real-time)
├── Fetch chat list via REST API
├── Load recent messages for active chats
├── Subscribe to real-time updates
└── Keep data synchronized
```

## 🔔 Notification Flow

### 1. Push Notification Trigger
```
Message sent → Check if receiver is online → If offline → Queue push notification → Send to FCM/APNS → User's device receives notification
```

### 2. In-App Notification
```
Message received → Check if user is in different screen → Show in-app banner → Play notification sound → Update badge counts
```

## 🚫 Error Handling Flows

### 1. Connection Issues
```
Network Lost → Show "Connecting..." → Attempt reconnection → Success: Resume normal flow → Failure: Show offline mode
```

### 2. Message Delivery Failure
```
Message failed → Show retry option → User clicks retry → Attempt resend → Success: Update status → Failure: Show error message
```

### 3. File Upload Failure
```
Upload failed → Show error message → Option to retry → User retries → Check file size/type → Success or show specific error
```

## 📱 Screen Navigation Flow

### Primary Navigation:
```
Home → Matches → Chat List → Individual Chat → Back to Chat List
```

### Alternative Flows:
```
Match Notification → Direct to Chat
Push Notification → Open Specific Chat
Profile View → Send Message → Open Chat
```

## 🔧 Technical Integration Points

### 1. Authentication Flow
```
User logs in → JWT token received → Store token → Use for all API calls → Socket.IO connection with token → Register user for real-time messaging
```

### 2. File Handling Flow
```
File selected → Validate type/size → Show upload progress → Compress if needed → Upload to server → Server processes → Message created → Real-time update
```

### 3. Caching Strategy
```
Chat list → Cache locally → Update with real-time data → Message history → Cache recent messages → Load more on scroll → File downloads → Cache media files
```

## 🎯 Key User Experience Points

### 1. Instant Messaging Feel
- Text messages appear immediately via Socket.IO
- No loading delays for text communication
- Smooth animations for message appearance

### 2. Rich Media Support
- Images are automatically compressed and optimized
- Audio messages with playback controls
- Multiple image galleries in single message

### 3. Clear Communication Status
- Always know if your message was delivered and read
- See when others are online
- Clear timestamps and message organization

### 4. Seamless File Sharing
- Easy attachment button
- Support for camera, gallery, and microphone
- Progress indicators during upload
- Automatic file optimization

This flow-based documentation helps frontend developers understand the complete user journey and technical implementation without getting lost in specific code examples! 🚀
