# Frontend Integration Guide for User Blocking

## Quick Implementation Steps

### 1. API Integration

#### Block User
```javascript
const blockUser = async (userId) => {
  try {
    const response = await fetch(`/api/v1/block/block/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Remove user from chat list
      // Show success message
      // Update UI state
    }
  } catch (error) {
    console.error('Block user error:', error);
  }
};
```

#### Unblock User
```javascript
const unblockUser = async (userId) => {
  try {
    const response = await fetch(`/api/v1/block/unblock/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Refresh chat list
      // Show success message
      // Update UI state
    }
  } catch (error) {
    console.error('Unblock user error:', error);
  }
};
```

#### Get Blocked Users
```javascript
const getBlockedUsers = async () => {
  try {
    const response = await fetch('/api/v1/block/blocked-users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Get blocked users error:', error);
  }
};
```

### 2. UI Components

#### Block Button Component
```jsx
const BlockButton = ({ userId, onBlock }) => {
  const [loading, setLoading] = useState(false);
  
  const handleBlock = async () => {
    setLoading(true);
    try {
      await blockUser(userId);
      onBlock(userId);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleBlock} 
      disabled={loading}
      className="block-button"
    >
      {loading ? 'Blocking...' : 'Block User'}
    </button>
  );
};
```

#### Blocked Users List
```jsx
const BlockedUsersList = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  
  useEffect(() => {
    loadBlockedUsers();
  }, []);
  
  const loadBlockedUsers = async () => {
    const users = await getBlockedUsers();
    setBlockedUsers(users);
  };
  
  const handleUnblock = async (userId) => {
    await unblockUser(userId);
    loadBlockedUsers(); // Refresh list
  };
  
  return (
    <div className="blocked-users-list">
      <h3>Blocked Users</h3>
      {blockedUsers.map(block => (
        <div key={block._id} className="blocked-user-item">
          <img src={block.blocked.image} alt="Profile" />
          <span>{block.blocked.firstName} {block.blocked.lastName}</span>
          <button onClick={() => handleUnblock(block.blocked._id)}>
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. Chat List Integration

#### Update Chat List Component
```jsx
const ChatList = () => {
  const [chats, setChats] = useState([]);
  
  const refreshChats = async () => {
    try {
      const response = await fetch('/api/v1/chat', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setChats(result.data); // Blocked users automatically filtered
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };
  
  const handleUserBlocked = (blockedUserId) => {
    // Remove the chat with blocked user from the list
    setChats(prevChats => 
      prevChats.filter(chat => chat.participant._id !== blockedUserId)
    );
  };
  
  return (
    <div className="chat-list">
      {chats.map(chat => (
        <ChatItem 
          key={chat._id} 
          chat={chat} 
          onUserBlocked={handleUserBlocked}
        />
      ))}
    </div>
  );
};
```

### 4. Error Handling

```javascript
const handleBlockError = (error) => {
  if (error.message.includes('already blocked')) {
    showToast('User is already blocked');
  } else if (error.message.includes('cannot block themselves')) {
    showToast('You cannot block yourself');
  } else if (error.message.includes('User not found')) {
    showToast('User not found');
  } else {
    showToast('An error occurred. Please try again.');
  }
};
```

### 5. State Management (Redux/Context)

```javascript
// Block actions
const blockActions = {
  BLOCK_USER_START: 'BLOCK_USER_START',
  BLOCK_USER_SUCCESS: 'BLOCK_USER_SUCCESS',
  BLOCK_USER_ERROR: 'BLOCK_USER_ERROR',
  UNBLOCK_USER_SUCCESS: 'UNBLOCK_USER_SUCCESS',
  LOAD_BLOCKED_USERS: 'LOAD_BLOCKED_USERS'
};

// Block reducer
const blockReducer = (state = initialState, action) => {
  switch (action.type) {
    case blockActions.BLOCK_USER_SUCCESS:
      return {
        ...state,
        blockedUsers: [...state.blockedUsers, action.payload]
      };
    case blockActions.UNBLOCK_USER_SUCCESS:
      return {
        ...state,
        blockedUsers: state.blockedUsers.filter(
          block => block.blocked._id !== action.payload.userId
        )
      };
    case blockActions.LOAD_BLOCKED_USERS:
      return {
        ...state,
        blockedUsers: action.payload
      };
    default:
      return state;
  }
};
```

### 6. Socket Integration

```javascript
// Listen for real-time block events
socket.on('user-blocked', (data) => {
  // Remove chat from UI
  removeChatFromList(data.blockedUserId);
});

socket.on('user-unblocked', (data) => {
  // Refresh chat list
  refreshChats();
});
```

### 7. Navigation Integration

```jsx
// Add to user profile or settings
const UserProfile = ({ userId }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  
  const checkBlockStatus = async () => {
    try {
      const response = await fetch(`/api/v1/block/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      setIsBlocked(result.data.isBlocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };
  
  useEffect(() => {
    checkBlockStatus();
  }, [userId]);
  
  return (
    <div className="user-profile">
      {/* Profile content */}
      {!isBlocked ? (
        <BlockButton userId={userId} onBlock={() => setIsBlocked(true)} />
      ) : (
        <button onClick={() => unblockUser(userId)}>
          Unblock User
        </button>
      )}
    </div>
  );
};
```

## Key Points to Remember

1. **Automatic Filtering**: The backend automatically filters blocked users from chat lists, so no additional frontend filtering is needed.

2. **Real-time Updates**: Update the UI immediately when blocking/unblocking to provide good user experience.

3. **Error Handling**: Implement comprehensive error handling for all block-related operations.

4. **State Management**: Keep the blocked users state synchronized across your application.

5. **User Feedback**: Always provide clear feedback to users about the success or failure of block operations.

6. **Confirmation Dialogs**: Consider adding confirmation dialogs for block actions to prevent accidental blocks.

7. **Bulk Operations**: You might want to add bulk unblock functionality for better user experience.
