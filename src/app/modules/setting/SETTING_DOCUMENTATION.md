# Setting Module Documentation

## Overview
The Setting module manages application-wide settings including About Us, Privacy Policy, and Terms and Conditions. This module allows admins to create and update these settings, while making them publicly accessible for users.

## Features

### 1. About Us Management
- Admins can create/update the About Us content
- Publicly accessible for all users
- Rich text content support

### 2. Privacy Policy Management
- Admins can create/update the Privacy Policy content
- Publicly accessible for all users
- Rich text content support

### 3. Terms and Conditions Management
- Admins can create/update the Terms and Conditions content
- Publicly accessible for all users
- Rich text content support

### 4. Settings Retrieval
- Public endpoint to get all settings
- No authentication required for reading
- Returns all three settings in one response

## API Endpoints

### Create/Update About Us
```
POST /api/v1/setting/about-us
```
**Headers:**
- Authorization: Bearer {admin_token}
- Content-Type: application/json

**Body:**
```json
{
  "aboutUs": "This is our company's about us content..."
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "About us created/updated successfully",
  "data": {
    "_id": "setting_id",
    "aboutUs": "This is our company's about us content...",
    "privacyPolicy": "Previous privacy policy...",
    "termsAndConditions": "Previous terms and conditions...",
    "createdAt": "2025-09-11T10:00:00.000Z",
    "updatedAt": "2025-09-11T10:05:00.000Z"
  }
}
```

### Create/Update Privacy Policy
```
POST /api/v1/setting/privacy-policy
```
**Headers:**
- Authorization: Bearer {admin_token}
- Content-Type: application/json

**Body:**
```json
{
  "privacyPolicy": "This is our privacy policy content..."
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Privacy policy created/updated successfully",
  "data": {
    "_id": "setting_id",
    "aboutUs": "Previous about us...",
    "privacyPolicy": "This is our privacy policy content...",
    "termsAndConditions": "Previous terms and conditions...",
    "createdAt": "2025-09-11T10:00:00.000Z",
    "updatedAt": "2025-09-11T10:05:00.000Z"
  }
}
```

### Create/Update Terms and Conditions
```
POST /api/v1/setting/terms-and-conditions
```
**Headers:**
- Authorization: Bearer {admin_token}
- Content-Type: application/json

**Body:**
```json
{
  "termsAndConditions": "These are our terms and conditions..."
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Terms and conditions created/updated successfully",
  "data": {
    "_id": "setting_id",
    "aboutUs": "Previous about us...",
    "privacyPolicy": "Previous privacy policy...",
    "termsAndConditions": "These are our terms and conditions...",
    "createdAt": "2025-09-11T10:00:00.000Z",
    "updatedAt": "2025-09-11T10:05:00.000Z"
  }
}
```

### Get All Settings
```
GET /api/v1/setting/
```
**Headers:** None required (Public endpoint)

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "_id": "setting_id",
    "aboutUs": "This is our company's about us content...",
    "privacyPolicy": "This is our privacy policy content...",
    "termsAndConditions": "These are our terms and conditions...",
    "createdAt": "2025-09-11T10:00:00.000Z",
    "updatedAt": "2025-09-11T10:05:00.000Z"
  }
}
```

## Database Schema

### Setting Model
```typescript
{
  aboutUs?: string,           // About us content
  privacyPolicy?: string,     // Privacy policy content
  termsAndConditions?: string, // Terms and conditions content
  createdAt: Date,           // When the setting was created
  updatedAt: Date            // When the setting was last updated
}
```

**Features:**
- All fields are optional (can be updated independently)
- Automatic timestamps (createdAt, updatedAt)
- Singleton pattern (only one setting document exists)
- Upsert functionality (create if doesn't exist, update if exists)

## Business Logic

### Setting Management Rules
1. Only admins can create/update settings
2. Settings are publicly readable (no auth required for GET)
3. Each setting field can be updated independently
4. Only one setting document exists in the database
5. If no setting exists, a new one is created automatically

### Validation Rules
1. **About Us**: Minimum 10 characters
2. **Privacy Policy**: Minimum 10 characters  
3. **Terms and Conditions**: Minimum 10 characters
4. All fields are trimmed automatically
5. Rich text/HTML content is allowed

### Upsert Behavior
- If no setting document exists, it creates a new one
- If a setting document exists, it updates only the specified field
- Other fields remain unchanged during partial updates

## Error Handling

### Common Error Responses

**Validation Error (Content too short):**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "aboutUs",
      "message": "About us must be at least 10 characters long"
    }
  ]
}
```

**Unauthorized (Non-admin trying to update):**
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Unauthorized access"
}
```

**Missing Content:**
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "aboutUs",
      "message": "About us content is required"
    }
  ]
}
```

## Implementation Details

### Backend Architecture
- **Model**: MongoDB schema with upsert functionality
- **Service**: Business logic for CRUD operations
- **Controller**: Request/response handling
- **Routes**: API endpoint definitions
- **Validation**: Zod schema validation

### Database Performance
- Single document storage (efficient)
- Automatic indexing on _id
- Minimal storage footprint

### Security Considerations
- Admin-only write access
- Public read access
- Input validation and sanitization
- Content length limits

## Usage Examples

### Admin Dashboard Integration
```javascript
// Update About Us
const updateAboutUs = async (content) => {
  const response = await fetch('/api/v1/setting/about-us', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ aboutUs: content })
  });
  
  const result = await response.json();
  return result;
};

// Get all settings for display
const getSettings = async () => {
  const response = await fetch('/api/v1/setting/');
  const result = await response.json();
  return result.data;
};
```

### Mobile App Integration
```javascript
// Get settings for app display
const loadAppSettings = async () => {
  try {
    const response = await fetch('/api/v1/setting/');
    const result = await response.json();
    
    if (result.success) {
      return {
        aboutUs: result.data.aboutUs || 'About us content not available',
        privacyPolicy: result.data.privacyPolicy || 'Privacy policy not available',
        termsAndConditions: result.data.termsAndConditions || 'Terms not available'
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
};
```

### Frontend Component Example
```jsx
const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/v1/setting/');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (!settings) return <div>Settings not available</div>;
  
  return (
    <div className="settings-page">
      <section>
        <h2>About Us</h2>
        <div dangerouslySetInnerHTML={{ __html: settings.aboutUs || 'Content not available' }} />
      </section>
      
      <section>
        <h2>Privacy Policy</h2>
        <div dangerouslySetInnerHTML={{ __html: settings.privacyPolicy || 'Content not available' }} />
      </section>
      
      <section>
        <h2>Terms and Conditions</h2>
        <div dangerouslySetInnerHTML={{ __html: settings.termsAndConditions || 'Content not available' }} />
      </section>
    </div>
  );
};
```

## Testing

### Manual Testing
1. **Create Settings** - Test creating each setting type
2. **Update Settings** - Test updating existing settings
3. **Get Settings** - Test public access to settings
4. **Validation** - Test with invalid data
5. **Authorization** - Test admin-only access for updates

### Test Data
```json
{
  "aboutUs": "We are a leading technology company focused on connecting people through innovative solutions...",
  "privacyPolicy": "This Privacy Policy describes how we collect, use, and protect your personal information...",
  "termsAndConditions": "By using our service, you agree to the following terms and conditions..."
}
```

## Notes
- Settings are designed to be simple and straightforward
- Only three setting fields as requested
- Public read access for better user experience
- Admin-only write access for security
- Supports rich text/HTML content for better formatting
