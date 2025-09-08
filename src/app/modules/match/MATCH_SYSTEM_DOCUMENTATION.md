# Match System Documentation

## Overview
The Dot Connection App matching system allows users to discover, interact with, and connect with other users. The system supports two main backend actions: **skip** and **love**. The **map** feature is frontend-only for viewing user locations.

## Core Concepts

### Match Actions
- **Skip (X Icon)**: User permanently passes on the profile (Backend action)
- **Love (Heart Icon)**: User is interested and wants to connect (Backend action) 
- **Map (Location Icon)**: Frontend-only feature to view user's location on map (No backend action)
- **Swipe Left/Right**: Just browse through profiles - NO backend action, can see same user again

### User Preferences
Users set preferences in their profile that affect who they see:
- **interestedIn**: `["male", "female", "everyone"]` - Gender preference for potential matches
- **lookingFor**: `["friendship", "dating", "relationship", "networking"]` - Type of connection
- **maxDistance**: 1-25 km radius for location-based matching
- **ageRangeMin/Max**: Age range preferences

### Connection States
1. **No Interaction**: Users haven't acted on each other (can see each other again through swiping)
2. **Skipped**: One user skipped the other (won't see them again)
3. **Love Sent**: One user loved, waiting for response (connection request created)
4. **Mutual Love**: Both users loved each other (instant match/connection)
5. **Connected**: Both users are connected and can communicate

## Technical Implementation

### Aggregation Pipeline for Potential Matches

The `getPotentialMatches` function uses MongoDB aggregation pipeline for optimal performance and accurate filtering:

```javascript
const aggregationPipeline = [
  // 1. Initial user filtering
  {
    $match: {
      _id: { $nin: interactedUserIds },
      verified: true,
      allProfileFieldsFilled: true,
      allUserFieldsFilled: true,
      status: "active",
    },
  },
  
  // 2. Join with profiles collection
  {
    $lookup: {
      from: "profiles",
      localField: "_id",
      foreignField: "userId",
      as: "profile",
    },
  },
  
  // 3. Unwind profile data
  {
    $unwind: "$profile",
  },
  
  // 4. Apply preference filters
  {
    $match: {
      $and: [
        // Current user's gender preference
        currentUserProfile.interestedIn === "everyone"
          ? {}
          : { "profile.gender": currentUserProfile.interestedIn },
        // Mutual interest - target users must be interested in current user's gender
        {
          $or: [
            { "profile.interestedIn": "everyone" },
            { "profile.interestedIn": currentUserProfile.gender },
          ],
        },
      ],
    },
  },
  
  // 5. Remove sensitive data
  {
    $project: {
      authentication: 0,
    },
  },
];
```

**Why Aggregation Pipeline?**
1. **Database-level filtering**: More efficient than loading all users and filtering in memory
2. **Proper joins**: Correctly handles the relationship between User and Profile collections
3. **Accurate pagination**: Total count reflects actual filtered results
4. **Performance**: Reduces data transfer and memory usage
5. **Scalability**: Works efficiently even with large user bases

**Previous Issues Fixed**:
- ❌ **Old approach**: Used `"profile.gender"` in User query (field doesn't exist until population)
- ❌ **Memory filtering**: Loaded all users then filtered in application code
- ❌ **Incorrect pagination**: Total count didn't reflect actual filtered results
- ✅ **New approach**: Database-level filtering with proper field references after join

## API Endpoints

### 1. Get Potential Matches
**Endpoint**: `GET /api/v1/match/potential`

**Purpose**: Fetch users that the current user hasn't interacted with yet

**Criteria for potential matches**:
- User is verified (`verified: true`)
- Profile is complete (`allProfileFieldsFilled: true`)
- User details are complete (`allUserFieldsFilled: true`)
- User is active (`status: "active"`)
- User hasn't been skipped or loved before
- Not the current user themselves
- Matches user's `interestedIn` preferences

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Potential matches retrieved successfully",
  "data": [
    {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe", 
      "image": "profile.jpg",
      "bio": "Love hiking and coffee",
      "interests": ["hiking", "coffee"],
      "distance": 5.2
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPage": 5,
    "total": 47
  }
}
```

**How Preference Filtering Works**:

The system implements **bidirectional preference matching** to ensure compatibility:

1. **Your Gender Preference** (what you want to see):
   - **Your interestedIn: "male"** → System shows only male users
   - **Your interestedIn: "female"** → System shows only female users  
   - **Your interestedIn: "everyone"** → System shows all genders

2. **Mutual Interest Filter** (ensuring they could be interested in you):
   - **Target user's interestedIn: "everyone"** → They can see any gender (including you)
   - **Target user's interestedIn: [your gender]** → They are specifically interested in your gender
   - **If target user's interestedIn doesn't match your gender and isn't "everyone"** → They won't see you, so they're filtered out

**Example Scenarios**:
- **You (male, interestedIn: "female")** will see **female users** who have **interestedIn: "male" OR "everyone"**
- **You (female, interestedIn: "everyone")** will see **all users** who have **interestedIn: "female" OR "everyone"**
- **You (male, interestedIn: "male")** will see **male users** who have **interestedIn: "male" OR "everyone"**

This ensures both users are potentially compatible before showing them to each other.

### 2. Perform Actions
**Endpoint**: `POST /api/v1/match/action`

**Purpose**: Record user's action on another user's profile

**Request Body**:
```json
{
  "toUserId": "user_id_here",
  "action": "skip" | "love"
}
```

**Skip Action Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Action 'skip' performed successfully"
}
```

**Love Action Response (No mutual love)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Love sent! Waiting for their response ❤️",
  "data": {
    "connectionRequest": {
      "_id": "request_id",
      "fromUserId": "your_user_id",
      "toUserId": "target_user_id",
      "status": "pending"
    }
  }
}
```

**Love Action Response (Mutual love - Instant match)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "It's a match! 🎉",
  "data": {
    "isMatch": true,
    "connection": {
      "_id": "connection_id",
      "userIds": ["user1_id", "user2_id"]
    }
  }
}
```

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

## Frontend Implementation Examples

### Complete User Interaction Flow
```javascript
// 1. Load potential matches
const loadMatches = async () => {
  const matches = await getPotentialMatches();
  setUsers(matches.data);
};

// 2. Handle swipe navigation (NO backend calls)
const handleSwipeLeft = (user) => {
  // Just navigate to previous user - no API call
  navigateToPreviousUser();
};

const handleSwipeRight = (user) => {
  // Just navigate to next user - no API call  
  navigateToNextUser();
};

// 3. Handle action buttons (Backend calls)
const handleSkipClick = async (user) => {
  try {
    await performAction(user._id, 'skip');
    
    // Remove from UI permanently, load next user
    removeUserFromUI(user._id);
    loadNextUser();
    showSkipNotification();
  } catch (error) {
    showError('Failed to skip user');
  }
};

const handleLoveClick = async (user) => {
  try {
    const result = await performAction(user._id, 'love');
    
    if (result.data.isMatch) {
      // Both users loved each other - Instant match!
      showMatchAnimation(user);
      setTimeout(() => {
        navigateToChat(result.data.connection._id);
      }, 2000);
    } else {
      // Love sent, waiting for response
      showLoveSentNotification(user.firstName);
    }
    
    // Remove from current UI, load next user
    removeUserFromUI(user._id);
    loadNextUser();
  } catch (error) {
    showError('Failed to send love');
  }
};

// 4. Handle map view (Frontend only - no backend call)
const handleMapClick = async (user) => {
  try {
    // Get user's profile with location data
    const userProfile = await getUserProfile(user._id);
    
    if (userProfile.location && userProfile.location.coordinates) {
      // Show user location on map (frontend only)
      showUserLocationOnMap({
        name: `${user.firstName} ${user.lastName}`,
        coordinates: userProfile.location.coordinates,
        address: userProfile.location.address,
        photo: user.image
      });
    } else {
      showMessage('Location not available for this user');
    }
  } catch (error) {
    showError('Failed to load user location');
  }
};

// Helper function to get user profile (this would be a profile API call)
const getUserProfile = async (userId) => {
  const response = await fetch(`/api/v1/profile/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// API call function for skip/love actions only
const performAction = async (targetUserId, action) => {
  const response = await fetch('/api/v1/match/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ toUserId: targetUserId, action })
  });
  
  return await response.json();
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

### User Card Component Example
```javascript
const UserCard = ({ user, onSkip, onLove, onMap, onSwipeLeft, onSwipeRight }) => {
  return (
    <div className="user-card" 
         onSwipeLeft={() => onSwipeLeft(user)} 
         onSwipeRight={() => onSwipeRight(user)}>
      
      <div className="user-photos">
        {user.photos?.map((photo, index) => (
          <img key={index} src={photo} alt={`${user.firstName} photo ${index + 1}`} />
        ))}
      </div>
      
      <div className="user-info">
        <h3>{user.firstName} {user.lastName}, {user.age}</h3>
        <p className="bio">{user.bio}</p>
        <p className="distance">{user.distance}km away</p>
        <div className="interests">
          {user.interests?.map(interest => (
            <span key={interest} className="interest-tag">{interest}</span>
          ))}
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="skip-btn" onClick={() => onSkip(user)} title="Skip">
          ✕
        </button>
        <button className="map-btn" onClick={() => onMap(user)} title="View Location">
          📍
        </button>
        <button className="love-btn" onClick={() => onLove(user)} title="Love">
          ❤️
        </button>
      </div>
    </div>
  );
};

// Usage
<UserCard 
  user={currentUser}
  onSkip={handleSkipClick}
  onLove={handleLoveClick}  
  onMap={handleMapClick}
  onSwipeLeft={handleSwipeLeft}
  onSwipeRight={handleSwipeRight}
/>
```

## UI/UX Recommendations

### 1. Swiping Interface
- **Swipe Left/Right**: Only for navigation, no API calls
- **Visual Feedback**: Show it's just browsing, not an action
- **Smooth Animation**: Quick transitions between users
- **Gesture Recognition**: Detect swipe vs tap correctly

### 2. Action Buttons
- **Clear Icons**: ✕ for skip, ❤️ for love, 📍 for map
- **Different Colors**: Red for skip, pink/red for love, blue for map
- **Loading States**: Show spinner when API call is in progress
- **Success Feedback**: Quick animation on successful action

### 3. Map Feature (Frontend Only)
- **Location Permission**: Request user's location permission
- **Map Integration**: Use Google Maps, Apple Maps, or similar
- **Privacy**: Only show approximate location, not exact address
- **Fallback**: Show message if location not available

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

## Troubleshooting

### Empty Results from getPotentialMatches

If the API returns empty results, check these common issues:

1. **Profile Data Issues**:
   ```javascript
   // Check if users have required profile fields
   db.users.find({ 
     verified: true,
     allProfileFieldsFilled: true,
     allUserFieldsFilled: true,
     status: "active"
   }).count()
   
   // Check if profiles exist and have gender/interestedIn
   db.profiles.find({
     $or: [
       { gender: { $exists: false } },
       { interestedIn: { $exists: false } }
     ]
   })
   ```

2. **Collection Name Mismatch**:
   - Ensure MongoDB collection is named `"profiles"` (lowercase, plural)
   - Check actual collection name: `db.runCommand("listCollections")`

3. **Data Type Issues**:
   ```javascript
   // Verify gender/interestedIn values are correct
   db.profiles.distinct("gender")      // Should return: ["male", "female", "other"]
   db.profiles.distinct("interestedIn") // Should return: ["male", "female", "everyone"]
   ```

4. **User Interaction History**:
   ```javascript
   // Check if user has interacted with too many people
   db.matches.find({ fromUserId: ObjectId("your_user_id") }).count()
   
   // Check total available users
   db.users.find({ 
     verified: true,
     allProfileFieldsFilled: true,
     allUserFieldsFilled: true,
     status: "active"
   }).count()
   ```

5. **Current User Profile Issues**:
   ```javascript
   // Verify current user has a profile with required fields
   db.profiles.findOne({ userId: ObjectId("your_user_id") })
   ```

### Debug Mode

Add temporary logging to the service to debug:

```javascript
// In getPotentialMatches function, add these logs:
console.log("Current user profile:", currentUserProfile);
console.log("Interacted user IDs:", interactedUserIds);
console.log("Total users before filtering:", await User.countDocuments({
  _id: { $nin: interactedUserIds },
  verified: true,
  allProfileFieldsFilled: true,
  allUserFieldsFilled: true,
  status: "active",
}));
console.log("Final aggregation result count:", result.length);
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only act on their own data
3. **Validation**: All inputs are validated server-side
4. **Rate Limiting**: Consider implementing to prevent spam swiping

## Performance Tips

### Database Optimization
1. **Indexes**: Ensure proper indexes exist for efficient queries:
   ```javascript
   // User collection indexes
   db.users.createIndex({ verified: 1, allProfileFieldsFilled: 1, allUserFieldsFilled: 1, status: 1 })
   db.users.createIndex({ _id: 1 })
   
   // Profile collection indexes  
   db.profiles.createIndex({ userId: 1 })
   db.profiles.createIndex({ gender: 1 })
   db.profiles.createIndex({ interestedIn: 1 })
   
   // Match collection indexes
   db.matches.createIndex({ fromUserId: 1 })
   db.matches.createIndex({ toUserId: 1 })
   db.matches.createIndex({ fromUserId: 1, toUserId: 1 })
   ```

2. **Aggregation Pipeline Optimization**:
   - Filters are applied early to reduce data processed in later stages
   - `$lookup` only happens after initial user filtering
   - Projection removes authentication data to reduce transfer size

### Frontend Optimization
1. **Pagination**: Always use pagination for lists - default limit is 10 users
2. **Caching**: Cache potential matches on frontend to reduce API calls
3. **Prefetching**: Load next batch of users in background while user browses current batch
4. **Optimistic Updates**: Update UI immediately, handle errors gracefully
5. **Image Optimization**: Use appropriate image sizes for profile photos

### Memory Management
- **Aggregation approach**: Processes data at database level instead of loading everything into memory
- **Streaming**: Consider streaming results for very large datasets
- **Connection pooling**: Ensure proper MongoDB connection pooling

### Monitoring
- **Response times**: Monitor API endpoint performance
- **Cache hit rates**: Track frontend caching effectiveness  
- **Database query performance**: Use MongoDB profiler to identify slow queries
- **User behavior**: Track swipe patterns to optimize matching algorithms

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
