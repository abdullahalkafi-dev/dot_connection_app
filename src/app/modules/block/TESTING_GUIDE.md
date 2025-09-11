# Testing Guide for User Blocking System

## Manual Testing Steps

### Prerequisites
1. Have two user accounts created and matched with each other
2. Both users should have authentication tokens
3. Use a tool like Postman or curl for API testing

### Test Scenarios

#### 1. Block User Successfully
```bash
curl -X POST "http://localhost:5000/api/v1/block/block/:userId" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Status: 201 Created
- User blocked successfully
- Blocked user disappears from chat list

#### 2. Try to Block Same User Again
```bash
curl -X POST "http://localhost:5000/api/v1/block/block/:userId" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "User is already blocked"

#### 3. Try to Block Self
```bash
curl -X POST "http://localhost:5000/api/v1/block/block/:ownUserId" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "Users cannot block themselves"

#### 4. Get Blocked Users List
```bash
curl -X GET "http://localhost:5000/api/v1/block/blocked-users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Array of blocked users with profile information

#### 5. Check Block Status
```bash
curl -X GET "http://localhost:5000/api/v1/block/status/:userId" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- `{ "isBlocked": true }`

#### 6. Try to Send Message to Blocked User
```bash
curl -X GET "http://localhost:5000/api/v1/message/chat/:blockedUserId" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 403 Forbidden
- Error: "Cannot access chat with blocked user"

#### 7. Check Chat List (Blocked User Should Be Hidden)
```bash
curl -X GET "http://localhost:5000/api/v1/chat" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Chat list without the blocked user

#### 8. Unblock User
```bash
curl -X POST "http://localhost:5000/api/v1/block/unblock/:userId" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- User unblocked successfully

#### 9. Try to Unblock Non-Blocked User
```bash
curl -X POST "http://localhost:5000/api/v1/block/unblock/:userId" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "User was not blocked or block relationship not found"

#### 10. Check Chat List After Unblock
```bash
curl -X GET "http://localhost:5000/api/v1/chat" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Chat list includes the previously blocked user

### Database Verification

#### Check Block Records
```javascript
// In MongoDB shell or database tool
db.blocks.find({})

// Should show block relationships
{
  "_id": ObjectId("..."),
  "blocker": ObjectId("..."),
  "blocked": ObjectId("..."),
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

#### Verify Indexes
```javascript
db.blocks.getIndexes()

// Should show:
// 1. _id index
// 2. blocker_1_blocked_1 (unique)
// 3. blocker_1
// 4. blocked_1
```

### Error Testing

#### Invalid User ID Format
```bash
curl -X POST "http://localhost:5000/api/v1/block/block/invalid-id" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 400 Bad Request
- Validation error for invalid user ID format

#### Non-existent User
```bash
curl -X POST "http://localhost:5000/api/v1/block/block/123456789012345678901234" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "User to block not found"

#### Missing Authorization
```bash
curl -X POST "http://localhost:5000/api/v1/block/block/:userId"
```

**Expected Result:**
- Status: 401 Unauthorized
- Authentication error

### Performance Testing

#### Load Test with Multiple Blocks
1. Create multiple test users
2. Block/unblock operations in bulk
3. Monitor response times
4. Check database query performance

#### Chat List Performance
1. Create large number of connections
2. Block several users
3. Measure chat list loading time
4. Verify filtering efficiency

### Integration Testing

#### Socket Events (if applicable)
1. Block user while both are online
2. Verify real-time updates
3. Check message delivery blocking
4. Test unblock real-time updates

#### Frontend Integration
1. Test UI updates after block/unblock
2. Verify error message display
3. Check blocked users list rendering
4. Test chat list auto-refresh

## Automated Testing Script

```javascript
// test-blocking.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const USER1_TOKEN = 'user1_token_here';
const USER2_TOKEN = 'user2_token_here';
const USER1_ID = 'user1_id_here';
const USER2_ID = 'user2_id_here';

async function runTests() {
  console.log('🧪 Starting Block System Tests...\n');
  
  try {
    // Test 1: Block user
    console.log('Test 1: Block user');
    const blockResult = await axios.post(
      `${BASE_URL}/block/block/${USER2_ID}`,
      {},
      { headers: { Authorization: `Bearer ${USER1_TOKEN}` } }
    );
    console.log('✅ Block successful:', blockResult.status === 201);
    
    // Test 2: Check chat list (should not include blocked user)
    console.log('\nTest 2: Check chat list');
    const chatResult = await axios.get(`${BASE_URL}/chat`, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    const hasBlockedUser = chatResult.data.data.some(
      chat => chat.participant._id === USER2_ID
    );
    console.log('✅ Blocked user hidden from chat list:', !hasBlockedUser);
    
    // Test 3: Try to access chat with blocked user
    console.log('\nTest 3: Try to access blocked user chat');
    try {
      await axios.get(`${BASE_URL}/message/chat/${USER2_ID}`, {
        headers: { Authorization: `Bearer ${USER1_TOKEN}` }
      });
      console.log('❌ Should not be able to access blocked user chat');
    } catch (error) {
      console.log('✅ Correctly blocked chat access:', error.response.status === 403);
    }
    
    // Test 4: Get blocked users list
    console.log('\nTest 4: Get blocked users list');
    const blockedList = await axios.get(`${BASE_URL}/block/blocked-users`, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Blocked users list retrieved:', blockedList.status === 200);
    console.log('✅ Contains blocked user:', 
      blockedList.data.data.some(block => block.blocked._id === USER2_ID)
    );
    
    // Test 5: Unblock user
    console.log('\nTest 5: Unblock user');
    const unblockResult = await axios.post(
      `${BASE_URL}/block/unblock/${USER2_ID}`,
      {},
      { headers: { Authorization: `Bearer ${USER1_TOKEN}` } }
    );
    console.log('✅ Unblock successful:', unblockResult.status === 200);
    
    // Test 6: Check chat list after unblock
    console.log('\nTest 6: Check chat list after unblock');
    const chatAfterUnblock = await axios.get(`${BASE_URL}/chat`, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    const hasUnblockedUser = chatAfterUnblock.data.data.some(
      chat => chat.participant._id === USER2_ID
    );
    console.log('✅ Unblocked user appears in chat list:', hasUnblockedUser);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
runTests();
```

## Expected Results Summary

✅ **Working Features:**
- Block user successfully
- Unblock user successfully
- Get blocked users list
- Check block status
- Automatic chat list filtering
- Message sending prevention
- Proper error handling
- Validation for all inputs

❌ **Should Fail (Expected Errors):**
- Blocking already blocked users
- Self-blocking attempts
- Accessing chats with blocked users
- Sending messages to blocked users
- Unblocking non-blocked users

## Notes
- Replace placeholder values (tokens, user IDs) with actual test data
- Ensure test users have mutual connections before testing
- Monitor database performance during testing
- Test with different user roles if applicable
