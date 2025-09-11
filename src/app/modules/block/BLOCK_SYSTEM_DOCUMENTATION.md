# User Blocking System Documentation

## Overview
The User Blocking System allows users to block and unblock other users in the chat application. When users block each other, they will be hidden from each other's chat lists and cannot send messages to each other.

## Features

### 1. Block User
- Users can block other users they have matched with
- Blocked users disappear from the chat list for both users
- No messages can be sent between blocked users
- Users cannot block themselves

### 2. Unblock User
- Users can unblock previously blocked users
- After unblocking, chat functionality is restored
- Users will appear in each other's chat lists again

### 3. Block List Management
- Users can view their list of blocked users
- Easy access to unblock users from the list

### 4. Block Status Check
- API endpoint to check if two users are blocking each other
- Used by the frontend to show appropriate UI states

## API Endpoints

### Block a User
```
POST /api/v1/block/block/:userId
```
**Headers:**
- Authorization: Bearer {token}

**Parameters:**
- userId: MongoDB ObjectId of the user to block

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "_id": "block_id",
    "blocker": "blocker_user_id",
    "blocked": "blocked_user_id",
    "createdAt": "2025-09-11T10:00:00.000Z",
    "updatedAt": "2025-09-11T10:00:00.000Z"
  }
}
```

### Unblock a User
```
POST /api/v1/block/unblock/:userId
```
**Headers:**
- Authorization: Bearer {token}

**Parameters:**
- userId: MongoDB ObjectId of the user to unblock

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "success": true,
    "message": "User unblocked successfully"
  }
}
```

### Get Blocked Users List
```
GET /api/v1/block/blocked-users
```
**Headers:**
- Authorization: Bearer {token}

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Blocked users retrieved successfully",
  "data": [
    {
      "_id": "block_id",
      "userId": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "image": "profile_image_url",
      "createdAt": "2025-09-11T10:00:00.000Z"
    }
  ]
}
```

### Check Block Status
```
GET /api/v1/block/status/:userId
```
**Headers:**
- Authorization: Bearer {token}

**Parameters:**
- userId: MongoDB ObjectId of the other user

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Block status retrieved successfully",
  "data": {
    "isBlocked": true
  }
}
```

## Database Schema

### Block Model
```typescript
{
  blocker: ObjectId,     // User who is blocking
  blocked: ObjectId,     // User who is being blocked
  createdAt: Date,       // When the block was created
  updatedAt: Date        // When the block was last updated
}
```

**Indexes:**
- Compound unique index on (blocker, blocked)
- Index on blocker field
- Index on blocked field

## Business Logic

### Blocking Rules
1. Users cannot block themselves
2. Users can only block other users once (duplicate blocks prevented)
3. Blocking is one-directional but affects both users' chat experience
4. When User A blocks User B:
   - User A will not see User B in chat list
   - User B will not see User A in chat list
   - Neither can send messages to the other

### Unblocking Rules
1. Only the user who initiated the block can unblock
2. Unblocking immediately restores chat functionality
3. Previous chat history is preserved

### Chat List Filtering
- The chat service automatically filters out conversations with blocked users
- No additional frontend filtering required

### Message Sending Prevention
- Message controllers check for blocking before allowing message creation
- Applies to all message types (text, image, audio)

## Error Handling

### Common Error Responses

**User Not Found:**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "User to block not found"
}
```

**Already Blocked:**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "User is already blocked"
}
```

**Self Blocking Attempt:**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Users cannot block themselves"
}
```

**Block Not Found (Unblock):**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "User was not blocked or block relationship not found"
}
```

**Blocked User Message Attempt:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Cannot send message to blocked user"
}
```

**Blocked User Chat Access:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Cannot access chat with blocked user"
}
```

## Implementation Details

### Backend Integration
- Block model is integrated with the chat service
- Message controllers include block checking
- Real-time socket events respect blocking rules

### Database Performance
- Efficient indexing for fast block status lookups
- Optimized queries to filter blocked users from chat lists

### Security Considerations
- User authentication required for all block operations
- Users can only manage their own blocks
- Input validation on all user IDs

## Frontend Integration Notes

### UI Considerations
1. Add block/unblock buttons in user profiles and chat interfaces
2. Show blocked status in user interfaces
3. Provide easy access to blocked users list
4. Handle error states gracefully

### State Management
1. Update chat lists when users are blocked/unblocked
2. Refresh UI state after block operations
3. Handle socket disconnections during block operations

### User Experience
1. Confirm block actions with user
2. Provide clear feedback on block/unblock success
3. Explain blocking consequences to users
4. Easy unblock process from blocked users list
