# Block Module API Documentation

## Base URL
```
https://your-api-domain.com/api/v1/block
```

## Authentication
All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Block Module

### 5.1 Block User
- **Endpoint:** `POST /block/block/:userId`
- **Description:** Block a specific user
- **Auth Required:** Yes
- **URL Parameter:**
  - `userId` - User ID to block
- **Success Response:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### 5.2 Unblock User
- **Endpoint:** `POST /block/unblock/:userId`
- **Description:** Unblock a previously blocked user
- **Auth Required:** Yes
- **URL Parameter:**
  - `userId` - User ID to unblock
- **Success Response:**
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

### 5.3 Get Blocked Users
- **Endpoint:** `GET /block/blocked-users`
- **Description:** Get list of all users you blocked
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "profile": { ... }
    }
  ]
}
```

---

### 5.4 Check Block Status
- **Endpoint:** `GET /block/status/:userId`
- **Description:** Check if you and another user are blocking each other
- **Auth Required:** Yes
- **URL Parameter:**
  - `userId` - User ID to check
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "youBlockedThem": false,
    "theyBlockedYou": false,
    "anyBlocked": false
  }
}
```

---

## Important Notes

### 1. Block Behavior
- Blocking is one-sided (they won't know you blocked them)
- Blocked user cannot see your profile in matches
- Blocked user cannot send you messages
- Existing chat history is hidden
- Previous match/connection is preserved in database

### 2. Effects of Blocking
When you block someone:
- They disappear from your potential matches
- They disappear from your connections list
- You can't see their messages
- They can't see you in their potential matches
- Any pending connection requests are hidden

### 3. Unblock Behavior
- Unblocking restores visibility
- Previous match status is NOT restored
- Need to match again if you want to reconnect
- Chat history becomes visible again

### 4. Block Status Response
- `youBlockedThem: true` - You have blocked this user
- `theyBlockedYou: true` - This user has blocked you
- `anyBlocked: true` - Either of you blocked the other

### 5. Privacy & Notifications
- No notification sent when you block someone
- Blocked user won't know they're blocked
- They just won't see you in their feed anymore
- Subtle and private blocking mechanism

### 6. Blocked Users List
- Shows all users you've blocked
- Includes basic profile information
- Can unblock directly from this list
- List is private (only you can see it)

### 7. Match System Integration
- Blocked users never appear in potential matches
- System filters them out automatically
- Applies to both parties (if mutual block)
- Cannot swipe on blocked users

### 8. Messaging Integration
- Cannot send messages to blocked users
- Cannot receive messages from blocked users
- Message attempts return error
- Existing messages are hidden (not deleted)

### 9. Use Cases
- Block inappropriate users
- Block after bad experience
- Block spam or fake accounts
- Temporary block (can unblock later)

### 10. Error Responses
Common errors:
- `400` - Invalid user ID format
- `404` - User not found
- `409` - User already blocked (when blocking)
- `409` - User not blocked (when unblocking)

### 11. Best Practices
- Always check block status before showing user profile
- Handle blocked users gracefully in UI
- Don't reveal block status to the blocked user
- Implement report feature alongside blocking
- Cache blocked users list on client side