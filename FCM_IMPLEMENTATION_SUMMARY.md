# FCM Push Notification Setup - Implementation Summary

## Overview
This document summarizes the complete FCM (Firebase Cloud Messaging) push notification setup for the Dot Connection App backend.

## ✅ Completed Tasks

### 1. Firebase Admin SDK Initialization
**File:** `src/server.ts`
- Added FCM initialization after database and Redis connection
- Uses Firebase credentials from environment variables (`config.firebase`)
- Properly handles private key formatting (replaces escaped newlines)
- Includes error handling for initialization failures

### 2. FCM Service Module
**File:** `src/shared/fcm.service.ts`
Created a complete FCM service with the following methods:
- `initialize()` - Initialize Firebase Admin SDK
- `sendNotification()` - Send push notification to single device
- `sendMulticastNotification()` - Send to multiple devices
- `validateToken()` - Validate FCM token
- `subscribeToTopic()` - Subscribe tokens to topics
- `unsubscribeFromTopic()` - Unsubscribe from topics

### 3. User Model & Authentication Updates
**Files:** 
- `src/app/modules/user/user.model.ts` - Already has `fcmToken` field
- `src/app/modules/user/user.service.ts` - Updated login and registration
- `src/app/modules/user/user.controller.ts` - Updated controllers

**Changes:**
- `verifyOTPAndLogin()` - Now accepts optional `fcmToken` parameter
- `createUser()` - Accepts and stores `fcmToken` during registration
- Updates existing user's FCM token on login if provided
- Controller methods updated to pass `fcmToken` from request body

### 4. Complete Notification Module
**Files Created:**
- `src/app/modules/notification/notification.interfae.ts` - TypeScript interfaces
- `src/app/modules/notification/notification.model.ts` - Mongoose schema
- `src/app/modules/notification/notification.service.ts` - Business logic
- `src/app/modules/notification/notification.controller.ts` - HTTP handlers
- `src/app/modules/notification/notification.route.ts` - API routes

**Features:**
- Store notifications in database with type (match, message, connection_request, general)
- Send push notifications via FCM
- Block checking - notifications not sent if sender is blocked by receiver
- Get user notifications with pagination and filters
- Mark notifications as read (single or all)
- Delete notifications (single or all)
- Get unread count

**API Endpoints:**
```
GET    /api/v1/notification                    - Get user's notifications
GET    /api/v1/notification/unread-count       - Get unread count
PATCH  /api/v1/notification/:id/read           - Mark as read
PATCH  /api/v1/notification/read-all           - Mark all as read
DELETE /api/v1/notification/:id                - Delete notification
DELETE /api/v1/notification                     - Delete all
```

### 5. Match Notification Implementation
**File:** `src/app/modules/match/match.service.ts`

**When notifications are sent:**
1. **Mutual Match** - When both users love each other:
   - Title: "It's a Match! 🎉"
   - Body: "You and [Name] liked each other!"
   - Type: `match`
   - Includes: matchedUserId, connectionId

2. **Connection Request** - When one user loves another:
   - Title: "New Connection Request ❤️"
   - Body: "[Name] likes you!"
   - Type: `connection_request`
   - Includes: requesterId, requestId

**Block checking:** Automatically checks if sender is blocked before sending

### 6. Message Notification Implementation
**File:** `src/socket/userMessage/message.ts`

**When notifications are sent:**
- Only when receiver is OFFLINE (not in socket connection map)
- Checks if sender is blocked by receiver (won't send if blocked)
- Title: "New Message"
- Body: Shows message preview, or "sent you an image/voice message"
- Type: `message`
- Includes: senderId, messageId, messageType

**Process:**
1. Message saved to database
2. Check if receiver is online in socket users map
3. If online: emit via socket
4. If offline: send push notification (unless blocked)
5. Confirmation sent to sender

### 7. Block Checking Integration
**File:** `src/app/modules/notification/notification.service.ts`

**Method:** `sendNotificationIfNotBlocked()`
- Checks `Block.isUserBlocked()` before sending
- Returns `{ sent, notification, blocked }` status
- Used by both match and message notifications
- Ensures blocked users never receive notifications from blocker

## 📋 Configuration Requirements

### Environment Variables (.env)
```env
# Firebase Admin SDK Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

### User Model Fields
```typescript
{
  fcmToken?: string;           // Device FCM token
  pushNotification: boolean;   // Enable/disable notifications (default: true)
}
```

### Notification Model Schema
```typescript
{
  userId: ObjectId;            // Notification recipient
  title: string;               // Notification title
  body: string;                // Notification body
  type: 'match' | 'message' | 'connection_request' | 'general';
  relatedId?: ObjectId;        // ID of related entity
  isRead: boolean;             // Read status
  data?: Map<string, string>;  // Additional custom data
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔄 User Flow

### Registration/Login with FCM Token
```json
POST /api/v1/user/create
{
  "email": "user@example.com",
  "fcmToken": "device-fcm-token-here"  // Optional
}

POST /api/v1/user/signin
{
  "email": "user@example.com",
  "otp": "123456",
  "fcmToken": "device-fcm-token-here"  // Optional
}
```

### When Match Occurs
1. User A loves User B
2. If mutual: Both receive "It's a Match!" notification
3. If one-sided: User B receives "Connection Request" notification
4. Notification saved to database
5. Push notification sent via FCM (if not blocked and has token)

### When Message is Sent
1. User A sends message to User B
2. Message saved to database
3. Check if User B is online (in socket map)
4. If online: Deliver via socket
5. If offline: Send push notification (if not blocked)

## 🛡️ Security Features

1. **Block Checking:**
   - All notifications check block status before sending
   - Blocked users never receive notifications from blocker
   - Messages from blocked users are rejected at socket level

2. **Authentication:**
   - All notification endpoints require authentication
   - Users can only access their own notifications

3. **Rate Limiting:**
   - General rate limiter applied via middleware
   - Login attempts tracked and limited

4. **Data Privacy:**
   - Hidden profile fields respected in user data
   - FCM tokens stored securely
   - Notifications auto-expire after 30 days

## 📱 Client Integration Guide

### 1. Get FCM Token (Client-side)
```javascript
// React Native / Expo
import * as Notifications from 'expo-notifications';

async function getFCMToken() {
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
```

### 2. Send Token During Login
```javascript
const fcmToken = await getFCMToken();

// During registration
await fetch('/api/v1/user/create', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    fcmToken: fcmToken
  })
});

// During login
await fetch('/api/v1/user/signin', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456',
    fcmToken: fcmToken
  })
});
```

### 3. Handle Push Notifications
```javascript
// Listen for notifications
Notifications.addNotificationReceivedListener(notification => {
  const { title, body, data } = notification.request.content;
  
  switch(data.type) {
    case 'match':
      // Navigate to match screen
      navigation.navigate('Match', { userId: data.matchedUserId });
      break;
    case 'message':
      // Navigate to chat
      navigation.navigate('Chat', { userId: data.senderId });
      break;
    case 'connection_request':
      // Navigate to requests
      navigation.navigate('ConnectionRequests');
      break;
  }
});
```

### 4. Fetch Notifications
```javascript
// Get notifications with pagination
const response = await fetch('/api/v1/notification?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Get unread count
const count = await fetch('/api/v1/notification/unread-count', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Mark as read
await fetch(`/api/v1/notification/${notificationId}/read`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

## 🧪 Testing

### Test Notification Manually
You can test by calling the service directly:
```typescript
import { NotificationServices } from './app/modules/notification/notification.service';

await NotificationServices.sendPushNotification(
  userId,
  'Test Notification',
  'This is a test message',
  'general'
);
```

### Test Match Notification
1. Create two users
2. User A loves User B
3. User B loves User A
4. Both should receive match notification

### Test Message Notification
1. User A sends message to User B
2. Ensure User B is offline (not connected to socket)
3. User B should receive push notification
4. If User B has blocked User A, no notification sent

## 📊 Database Indexes

Notification collection has indexes for optimal performance:
- `{ userId: 1, isRead: 1 }` - Filter unread
- `{ userId: 1, createdAt: -1 }` - Sort by recent
- `{ userId: 1, type: 1, isRead: 1 }` - Filter by type
- `{ createdAt: 1 }` - TTL index (auto-delete after 30 days)

## 🚀 Deployment Notes

1. Ensure all Firebase environment variables are set in production
2. Private key must have proper newline characters
3. Test FCM initialization on server startup
4. Monitor FCM quota and usage in Firebase Console
5. Set up error alerting for failed notification sends
6. Consider implementing retry logic for failed notifications

## 📝 Additional Features to Consider

1. **Notification Preferences:**
   - Allow users to customize which notifications they receive
   - Different sounds for different notification types

2. **Notification Grouping:**
   - Group multiple messages from same user
   - Summary notifications

3. **Rich Notifications:**
   - Add images to match notifications
   - Action buttons (Accept/Reject connection)

4. **Analytics:**
   - Track notification delivery rates
   - Monitor user engagement with notifications

5. **Multi-device Support:**
   - Store multiple FCM tokens per user
   - Send to all user's devices

## ✨ Summary

The FCM notification system is now fully integrated with:
- ✅ Automatic notifications on mutual matches
- ✅ Push notifications for offline message recipients
- ✅ Block checking preventing unwanted notifications
- ✅ Complete notification history in database
- ✅ Full CRUD API for notification management
- ✅ User control via pushNotification toggle
- ✅ FCM token management during auth flow

All notifications respect user privacy settings, block status, and are properly logged and stored.
