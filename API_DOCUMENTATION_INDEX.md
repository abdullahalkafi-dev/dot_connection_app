# Dot Connection App - API Documentation Index

Welcome to the Dot Connection App API documentation for Flutter developers.

## About the App

This is a dating/social networking application with email-based OTP authentication (no passwords required).

**Base API URL:** `https://your-api-domain.com/api/v1`

---

## 📚 Documentation Files

### Module-wise API Documentation

1. **[User Module](./user_api_documentation.md)**
   - Registration & Authentication
   - Profile Management
   - User Fields & Profile Fields
   - Nearby Users Search
   - Hidden Fields Control

2. **[Match Module](./match_api_documentation.md)**
   - Get Potential Matches
   - Swipe Actions (Skip/Love)
   - Connection Requests
   - Accept/Reject Requests
   - View Matches & History

3. **[Chat Module](./chat_api_documentation.md)**
   - Get Chat List
   - Unread Counts
   - Real-time Updates

4. **[Message Module](./message_api_documentation.md)**
   - Get Chat Messages
   - Send Text Messages
   - Send Image Messages
   - Send Audio Messages
   - Mark Messages as Read

5. **[Block Module](./block_api_doccumentation.md)**
   - Block Users
   - Unblock Users
   - Get Blocked Users List
   - Check Block Status

6. **[Setting Module](./setting_api_documentation.md)**
   - Get App Settings
   - About Us
   - Privacy Policy
   - Terms & Conditions

7. **[Socket.IO Integration](./socket_integration_guide.md)**
   - Complete Socket.IO setup guide for Flutter
   - Real-time messaging
   - Online status tracking
   - Read receipts
   - Connection management

---

## 🚀 Quick Start

### 1. Authentication Flow
```
Register → Verify OTP → Add User Fields → Add Profile Fields → Start Matching
```

### 2. Required Setup
- Base URL configuration
- JWT token management
- Socket.IO connection
- File upload handling

### 3. Essential Endpoints
```dart
// Registration
POST /api/user
POST /api/user/verify-otp

// Profile Setup
PUT /api/user/add-user-fields
PUT /api/user/add-profile-fields

// Matching
GET /api/match/potential
POST /api/match/action

// Messaging
GET /api/chat
GET /api/message/chat/:userId
Socket: sendMessage event
```

---

## 🔐 Authentication

Most endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

Store the token after OTP verification and include it in all subsequent requests.

---

## 📡 Real-time Features

The app uses Socket.IO for:
- ✅ Instant messaging
- ✅ Online/offline status
- ✅ Read receipts
- ✅ Match notifications
- ✅ Typing indicators

See [Socket Integration Guide](./socket_integration_guide.md) for complete implementation.

---

## 📋 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errorDetails": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 🎯 Common Use Cases

### Complete User Registration
1. Register with email: `POST /api/user`
2. Verify OTP: `POST /api/user/verify-otp`
3. Add user fields: `PUT /api/user/add-user-fields`
4. Add profile fields: `PUT /api/user/add-profile-fields`

### Matching Flow
1. Get potential matches: `GET /api/match/potential`
2. Perform swipe action: `POST /api/match/action`
3. Check connection requests: `GET /api/match/requests`
4. Accept/reject request: `PATCH /api/match/requests/:id`

### Messaging Flow
1. Connect to Socket.IO
2. Get chat list: `GET /api/chat`
3. Get messages: `GET /api/message/chat/:userId`
4. Send message: Socket `sendMessage` event
5. Mark as read: Socket `markAsRead` event

---

## 📦 Required Packages for Flutter

```yaml
dependencies:
  http: ^1.1.0                    # REST API calls
  socket_io_client: ^2.0.3+1      # Real-time messaging
  image_picker: ^1.0.4            # Image selection
  file_picker: ^6.1.1             # File selection
  cached_network_image: ^3.3.0   # Image caching
  flutter_secure_storage: ^9.0.0 # Secure token storage
```

---

## 🌐 API Modules Overview

| Module | Endpoints | Auth Required | Real-time |
|--------|-----------|---------------|-----------|
| User | 13 | Partial | ❌ |
| Match | 7 | Yes | ✅ |
| Chat | 1 | Yes | ✅ |
| Message | 4 | Yes | ✅ |
| Block | 4 | Yes | ❌ |
| Setting | 1 | No | ❌ |

---

## 🔥 Important Notes

### Profile Completion
- Users must complete both user fields and profile fields
- Track with `allFieldsFilled` flag
- Incomplete profiles won't appear in matches

### Location Format
Always use GeoJSON format:
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude],
  "address": "Human readable address"
}
```
⚠️ **Important:** Order is `[longitude, latitude]` NOT `[latitude, longitude]`

### File Uploads
- Use `multipart/form-data` for file uploads
- Max 10 images per upload
- Supported formats: jpg, jpeg, png, webp, mp3, wav, m4a
- Images are auto-compressed

### Matching Rules
- Only verified users with complete profiles appear
- Blocked users are filtered out
- Users you've already swiped won't appear again
- Respects age range and distance preferences

### Message Restrictions
- Can only message users you've matched with
- Both users must have accepted the connection
- Blocked users cannot message each other

---

## 🛠️ Error Handling

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate/already exists)
- `500` - Internal Server Error

---

## 📱 Flutter Implementation Tips

### 1. State Management
Use Provider, Riverpod, or Bloc for managing:
- Authentication state
- Socket connection
- Online users list
- Message history

### 2. Caching Strategy
Cache these data locally:
- User profile
- Match list
- Chat list
- Settings content
- Blocked users

### 3. Offline Support
- Queue messages when offline
- Sync on reconnection
- Show cached data
- Indicate offline status

### 4. Performance
- Implement lazy loading for lists
- Use pagination for messages
- Cache images locally
- Debounce search queries

---

## 🔒 Security Best Practices

1. **Token Storage:** Use `flutter_secure_storage` for JWT token
2. **HTTPS Only:** Always use HTTPS/WSS in production
3. **Token Refresh:** Implement token refresh mechanism
4. **Validate Inputs:** Validate all user inputs
5. **Handle Errors:** Never expose sensitive error details
6. **Rate Limiting:** Respect API rate limits
7. **Logout:** Clear all data on logout

---

## 🧪 Testing Recommendations

### Test Scenarios
- [ ] Registration with valid/invalid email
- [ ] OTP verification flow
- [ ] Profile completion
- [ ] Matching and swiping
- [ ] Sending different message types
- [ ] Online/offline transitions
- [ ] Block/unblock functionality
- [ ] Connection loss and recovery
- [ ] Multiple device login

---

## 📞 Support & Resources

- **Backend Repository:** Contact your backend team
- **API Issues:** Report to backend developers
- **Socket.IO Docs:** https://socket.io/docs/v4/
- **Flutter Package:** https://pub.dev/packages/socket_io_client

---

## 🎓 Learning Path

### For New Developers

1. **Start Here:**
   - Read [User Module](./user_api_documentation.md)
   - Implement registration & OTP
   - Test authentication flow

2. **Profile Setup:**
   - Implement user fields form
   - Implement profile fields form
   - Test with valid/invalid data

3. **Core Features:**
   - Read [Match Module](./match_api_documentation.md)
   - Implement swipe interface
   - Handle connection requests

4. **Real-time:**
   - Read [Socket Integration Guide](./socket_integration_guide.md)
   - Implement socket connection
   - Test messaging flow

5. **Polish:**
   - Implement [Block Module](./block_api_doccumentation.md)
   - Add [Settings](./setting_api_documentation.md)
   - Test edge cases

---

## 📝 Change Log

Track API changes and updates here:

- **v1.0** - Initial documentation
- All modules documented
- Socket.IO guide added
- Important notes included

---

## ✅ Implementation Checklist

### Must-Have Features
- [ ] User registration & OTP verification
- [ ] Profile completion flow
- [ ] JWT token management
- [ ] Potential matches display
- [ ] Swipe functionality
- [ ] Connection requests handling
- [ ] Socket.IO connection
- [ ] Real-time messaging
- [ ] Chat list
- [ ] Message history
- [ ] Image upload
- [ ] Block/unblock users
- [ ] Settings pages

### Nice-to-Have Features
- [ ] Voice messages
- [ ] Push notifications (FCM)
- [ ] Message search
- [ ] Profile verification
- [ ] Report user
- [ ] Advanced filters
- [ ] Location-based search

---

**Last Updated:** October 9, 2025

**Documentation Version:** 1.0

**Maintained By:** Backend Development Team
