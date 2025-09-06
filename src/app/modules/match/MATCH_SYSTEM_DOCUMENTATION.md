# Match System Documentation

## Overview
The Dot Connection App matching system allows users to discover, interact with, and connect with other users through a swiping interface similar to dating apps. The system supports three main actions: **skip**, **love**, and **map**.

## Core Concepts

### Match Actions
- **Skip**: User is not interested in the profile
- **Love**: User is interested and wants to connect
- **Map**: User wants to see the person's location (special action)

### Connection States
1. **No Interaction**: Users haven't seen each other yet
2. **One-way Action**: One user performed an action on another
3. **Mutual Love**: Both users loved each other (instant match)
4. **Connection Request**: One user loved, waiting for response
5. **Connected**: Both users are connected and can communicate

## System Workflow

### 1. Getting Potential Matches
**Endpoint**: `GET /api/v1/match/potential`

**Purpose**: Fetch users that the current user hasn't interacted with yet

**Criteria for potential matches**:
- User is verified (`verified: true`)
- Profile is complete (`allProfileFieldsFilled: true`)
- User details are complete (`allUserFieldsFilled: true`)
- User is active (`status: "active"`)
- User hasn't been interacted with before
- Not the current user themselves

**Frontend Implementation**:
```javascript
// Get potential matches for swiping
const getPotentialMatches = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/v1/match/potential?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 2. Performing Actions (Swiping)
**Endpoint**: `POST /api/v1/match/action`

**Purpose**: Record user's action on another user's profile

**Request Body**:
```json
{
  "toUserId": "user_id_here",
  "action": "skip" | "love" | "map"
}
```

**Workflow**:
1. **Skip Action**:
   - Records the skip in database
   - User won't see this profile again
   - No further action required

2. **Love Action**:
   - Records the love in database
   - Checks if target user also loved current user
   - **If mutual love**: Creates instant connection (match)
   - **If not mutual**: Creates connection request for target user

3. **Map Action**:
   - Records the map action
   - Returns location information if available

**Frontend Implementation**:
```javascript
// Perform action on a user
const performAction = async (toUserId, action) => {
  const response = await fetch('/api/v1/match/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ toUserId, action })
  });
  return response.json();
};

// Handle different responses
const handleSwipe = async (user, action) => {
  const result = await performAction(user._id, action);
  
  if (result.data.isMatch) {
    // Show match popup/animation
    showMatchModal(user);
  } else if (result.data.connectionRequest) {
    // Show love sent notification
    showNotification("Love sent! 💖");
  }
};
```

### 3. Managing Connection Requests

#### 3.1 Viewing Received Requests
**Endpoint**: `GET /api/v1/match/requests`

**Purpose**: See who has sent love/connection requests to you

**Frontend Implementation**:
```javascript
// Get received connection requests
const getConnectionRequests = async () => {
  const response = await fetch('/api/v1/match/requests', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

#### 3.2 Responding to Requests
**Endpoint**: `PATCH /api/v1/match/requests/:requestId`

**Purpose**: Accept or reject connection requests

**Request Body**:
```json
{
  "action": "accept" | "reject"
}
```

**Frontend Implementation**:
```javascript
// Respond to connection request
const respondToRequest = async (requestId, action) => {
  const response = await fetch(`/api/v1/match/requests/${requestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action })
  });
  return response.json();
};
```

#### 3.3 Viewing Sent Requests
**Endpoint**: `GET /api/v1/match/sent-requests`

**Purpose**: See connection requests you've sent to others

### 4. Managing Connections

#### 4.1 Viewing Connections
**Endpoint**: `GET /api/v1/match/connections`

**Purpose**: Get list of users you're connected with (can chat with)

**Frontend Implementation**:
```javascript
// Get user's connections
const getConnections = async () => {
  const response = await fetch('/api/v1/match/connections', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 5. Match History
**Endpoint**: `GET /api/v1/match/history`

**Purpose**: View all actions you've performed (for analytics/review)

## Frontend Workflow Examples

### Complete Swiping Flow
```javascript
// 1. Load potential matches
const loadMatches = async () => {
  const matches = await getPotentialMatches();
  setUsers(matches.data);
};

// 2. Handle swipe actions
const handleSwipeLeft = (user) => {
  performAction(user._id, 'skip');
  // Remove from UI, load next user
};

const handleSwipeRight = async (user) => {
  const result = await performAction(user._id, 'love');
  
  if (result.data.isMatch) {
    // Both users loved each other
    showMatchAnimation();
    // Redirect to chat or show match details
  } else {
    // Love sent, waiting for response
    showLoveSentNotification();
  }
  
  // Remove from UI, load next user
};

const handleMapAction = async (user) => {
  const result = await performAction(user._id, 'map');
  // Show user location on map
  showUserLocation(result.data);
};
```

### Connection Request Management
```javascript
// Check for pending requests
const checkRequests = async () => {
  const requests = await getConnectionRequests();
  if (requests.data.length > 0) {
    showRequestsNotification(requests.data.length);
  }
};

// Handle request response
const handleRequestResponse = async (request, action) => {
  const result = await respondToRequest(request._id, action);
  
  if (action === 'accept') {
    // New connection created
    showConnectionSuccessMessage();
    // Refresh connections list
    loadConnections();
  }
  
  // Refresh requests list
  checkRequests();
};
```

## UI/UX Recommendations

### 1. Swiping Interface
- Show one user at a time
- Implement swipe gestures (left = skip, right = love)
- Add buttons for skip/love/map actions
- Show loading state while performing actions

### 2. Match Notifications
- Animated popup for instant matches
- Toast notification for love sent
- Badge/notification for pending requests

### 3. Request Management
- Separate screen for viewing requests
- Clear accept/reject buttons
- Show requester's profile information

### 4. Connection List
- Grid or list view of connections
- Link to chat functionality
- Show connection date

## Error Handling

### Common Errors
- **User not found**: Target user deleted account or blocked
- **Already interacted**: User trying to swipe same person twice
- **Invalid action**: Malformed request
- **Unauthorized**: Token expired or invalid

### Frontend Error Handling
```javascript
const handleActionError = (error) => {
  switch (error.message) {
    case 'You have already interacted with this user':
      // Remove user from swipe deck
      removeUserFromDeck();
      break;
    case 'User not found or not available for matching':
      // Remove user and show notification
      showUserUnavailableMessage();
      break;
    default:
      showGenericError();
  }
};
```

## Data Models Reference

### Match Object
```typescript
{
  _id: string;
  fromUserId: ObjectId;
  toUserId: ObjectId;
  action: "skip" | "love" | "map";
  createdAt: Date;
}
```

### Connection Request Object
```typescript
{
  _id: string;
  fromUserId: ObjectId;
  toUserId: ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
```

### Connection Object
```typescript
{
  _id: string;
  userIds: ObjectId[];
  createdAt: Date;
}
```

## API Response Format

All responses follow this structure:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* actual data */ },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPage": 5,
    "total": 50
  }
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only act on their own data
3. **Validation**: All inputs are validated server-side
4. **Rate Limiting**: Consider implementing to prevent spam swiping

## Performance Tips

1. **Pagination**: Always use pagination for lists
2. **Caching**: Cache potential matches on frontend
3. **Prefetching**: Load next batch of users in background
4. **Optimistic Updates**: Update UI immediately, handle errors gracefully

## Testing Scenarios

### Frontend Testing
1. **Swiping Flow**: Test all three actions (skip, love, map)
2. **Match Creation**: Test instant match vs connection request
3. **Request Management**: Test accept/reject functionality
4. **Error Handling**: Test with invalid users/expired tokens
5. **Edge Cases**: Empty match lists, network failures

### Integration Testing
1. Test complete user journey from discovery to connection
2. Test mutual love scenario
3. Test request acceptance flow
4. Test pagination and filtering
