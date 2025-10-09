# User Module API Documentation

## Base URL
```
https://your-api-domain.com/api/v1/user
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## User Module

### 1.1 Register/Login (Send OTP)
- **Endpoint:** `POST /user`
- **Description:** Register a new user OR login existing user with email (auto-detects)
- **Auth Required:** No
- **How it works:**
  - If email exists: Sends OTP for login
  - If email doesn't exist: Creates new account and sends OTP
- **Body:**
```json
{
  "email": "user@example.com"
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "email": "user@example.com"
  }
}
```

---

### 1.2 Verify OTP (Complete Login/Registration)
- **Endpoint:** `POST /user/verify-otp`
- **Description:** Verify OTP and complete login or registration
- **Auth Required:** No
- **Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "verified": true,
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "jwt_access_token_here"
  }
}
```

---

### 1.3 Get My Profile
- **Endpoint:** `GET /user/getme`
- **Description:** Get logged-in user's complete profile information
- **Auth Required:** Yes
- **Important:** This endpoint returns different data based on profile completion status. Use `allUserFieldsFilled` and `allProfileFieldsFilled` flags to guide the onboarding flow in the frontend.

#### Response 1: After Account Creation (No Fields Filled)

**State:** User just created account and verified OTP

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "68e76ef88666374c5abacfc6",
    "email": "kafikafi19@gmail.com",
    "image": null,
    "role": "USER",
    "phoneNumber": null,
    "fcmToken": null,
    "status": "active",
    "verified": true,
    "allProfileFieldsFilled": false,
    "allUserFieldsFilled": false,
    "authentication": {
      "loginAttempts": 0,
      "lastLoginAttempt": null
    },
    "lastLoginAt": "2025-10-09T08:15:20.070Z",
    "dateOfBirth": null,
    "pushNotification": true,
    "createdAt": "2025-10-09T08:14:48.465Z",
    "updatedAt": "2025-10-09T08:15:20.070Z"
  }
}
```

**Frontend Action:** Redirect to "Add User Fields" screen

#### Response 2: After User Fields Added

**State:** User completed basic information (`firstName`, `lastName`, `dateOfBirth`)

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "68e76ef88666374c5abacfc6",
    "email": "kafikafi19@gmail.com",
    "image": null,
    "role": "USER",
    "phoneNumber": null,
    "fcmToken": null,
    "status": "active",
    "verified": true,
    "allProfileFieldsFilled": false,
    "allUserFieldsFilled": true,
    "authentication": {
      "loginAttempts": 0,
      "lastLoginAttempt": null
    },
    "lastLoginAt": "2025-10-09T08:15:20.070Z",
    "dateOfBirth": "2000-11-02T00:00:00.000Z",
    "pushNotification": true,
    "createdAt": "2025-10-09T08:14:48.465Z",
    "updatedAt": "2025-10-09T08:16:20.322Z",
    "firstName": "test",
    "lastName": "user"
  }
}
```

**Frontend Action:** Redirect to "Add Profile Fields" screen

#### Response 3: Complete Profile (All Fields Filled)

**State:** User completed both user fields and profile fields

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "68e744f033764ce94f0e9247",
    "firstName": "test",
    "lastName": "user",
    "email": "kafikafi1922@gmail.com",
    "image": null,
    "role": "ADMIN",
    "phoneNumber": "N/A",
    "fcmToken": null,
    "status": "active",
    "verified": true,
    "allProfileFieldsFilled": true,
    "allUserFieldsFilled": true,
    "authentication": {
      "loginAttempts": 0,
      "lastLoginAttempt": null
    },
    "lastLoginAt": "2025-10-09T08:05:57.584Z",
    "dateOfBirth": "2000-11-02T00:00:00.000Z",
    "pushNotification": true,
    "createdAt": "2025-10-09T05:15:28.694Z",
    "updatedAt": "2025-10-09T08:13:02.350Z",
    "profile": {
      "_id": "68e76e91fa09b6b1282b0dca",
      "userId": "68e744f033764ce94f0e9247",
      "ageRangeMax": 24,
      "ageRangeMin": 18,
      "bio": "I am Null",
      "createdAt": "2025-10-09T08:13:02.011Z",
      "drinkingStatus": "No",
      "gender": "male",
      "height": 120,
      "hiddenFields": {
        "religious": true,
        "school": true
      },
      "hometown": "Dhaka",
      "interestedIn": "female",
      "interests": [
        "travel",
        "fitness",
        "photography",
        "cooking",
        "reading",
        "hiking"
      ],
      "jobTitle": "Backend Developer",
      "lastActive": "2025-10-09T08:13:02.015Z",
      "location": {
        "type": "Point",
        "coordinates": [130.5, 29.5],
        "address": "Dhaka,Bangladesh"
      },
      "lookingFor": "dating",
      "maxDistance": 21,
      "photos": [],
      "profileViews": 0,
      "religious": "muslim",
      "school": "SRCS",
      "smokingStatus": "No",
      "studyLevel": "highSchool",
      "updatedAt": "2025-10-09T08:13:02.011Z",
      "workplace": "Mohakhali"
    }
  }
}
```

**Frontend Action:** Allow full app access

#### Frontend Integration Guide

```javascript
// Example frontend flow
const response = await fetch('/user/getme', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

if (!data.allUserFieldsFilled) {
  // Redirect to basic info form (firstName, lastName, dateOfBirth)
  navigate('/onboarding/user-info');
} else if (!data.allProfileFieldsFilled) {
  // Redirect to profile setup form (location, interests, etc.)
  navigate('/onboarding/profile-setup');
} else {
  // Profile complete, proceed to main app
  navigate('/home');
}
```

#### Key Response Fields

- **allUserFieldsFilled** (`boolean`): `true` when `firstName`, `lastName`, and `dateOfBirth` are provided
- **allProfileFieldsFilled** (`boolean`): `true` when complete profile is created via `/add-profile-fields`
- **profile** (`object` or `undefined`): Only present when profile has been created
- **firstName, lastName** (`string` or `undefined`): Only present after calling `/add-user-fields`
- **dateOfBirth** (`string` or `null`): Only present after calling `/add-user-fields`

---

### 1.4 Add User Fields
- **Endpoint:** `PUT /user/add-user-fields`
- **Description:** Complete basic user information (first-time setup)
- **Auth Required:** Yes
- **Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-01-01",
  "pushNotification": true
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "User fields added successfully",
  "data": { ... }
}
```

---

### 1.5 Add Profile Fields
- **Endpoint:** `PUT /user/add-profile-fields`
- **Description:** Complete dating profile information (first-time setup)
- **Auth Required:** Yes
- **Body:**
```json
{
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128],
    "address": "New York, NY"
  },
  "gender": "male",
  "interestedIn": "female",
  "height": 180,
  "interests": ["Travel", "Music", "Fitness"],
  "lookingFor": "relationship",
  "ageRangeMin": 25,
  "ageRangeMax": 35,
  "maxDistance": 50,
  "hometown": "New York",
  "workplace": "Tech Corp",
  "jobTitle": "Software Engineer",
  "school": "MIT",
  "studyLevel": "Bachelor",
  "religious": "Christian",
  "smokingStatus": "Never",
  "drinkingStatus": "Socially",
  "bio": "Looking for someone special...",
  "hiddenFields": {
    "religious": true,
    "smokingStatus": false
  }
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "Profile fields added successfully"
}
```

---

### 1.6 Update User
- **Endpoint:** `PATCH /user/update-user`
- **Description:** Update basic user information
- **Auth Required:** Yes
- **Body (FormData):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "fcmToken": "firebase_token",
  "pushNotification": true,
  "dateOfBirth": "1995-01-01"
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### 1.7 Update Profile
- **Endpoint:** `PATCH /user/update-profile`
- **Description:** Update dating profile information
- **Auth Required:** Yes
- **Body (FormData):**
```json
{
  "gender": "male",
  "interestedIn": "female",
  "height": 180,
  "interests": ["Travel", "Music"],
  "lookingFor": "relationship",
  "ageRangeMin": 25,
  "ageRangeMax": 35,
  "maxDistance": 50,
  "hometown": "New York",
  "workplace": "Tech Corp",
  "jobTitle": "Software Engineer",
  "school": "MIT",
  "studyLevel": "Bachelor",
  "religious": "Christian",
  "smokingStatus": "Never",
  "drinkingStatus": "Socially",
  "bio": "Updated bio...",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128],
    "address": "New York, NY"
  }
}
```
- **Note:** Can also upload profile images as multipart form data
- **Success Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### 1.8 Update Hidden Fields
- **Endpoint:** `PATCH /user/update-hidden-fields`
- **Description:** Control which profile fields are hidden from others
- **Auth Required:** Yes
- **Body:**
```json
{
  "hiddenFields": {
    "gender": false,
    "hometown": true,
    "workplace": false,
    "jobTitle": false,
    "school": true,
    "studyLevel": false,
    "religious": true,
    "drinkingStatus": false,
    "smokingStatus": true
  }
}
```
- **Success Response:**
```json
{
  "success": true,
  "message": "Hidden fields updated successfully"
}
```

---

### 1.9 Delete Profile Image
- **Endpoint:** `DELETE /user/profile/image/:imageIndex`
- **Description:** Delete a specific profile image by index
- **Auth Required:** Yes
- **URL Parameter:**
  - `imageIndex` - Index of the image to delete (0-based)
- **Success Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

### 1.10 Get Nearby Users
- **Endpoint:** `GET /user/nearby`
- **Description:** Find users near your location
- **Auth Required:** Yes
- **Query Parameters:**
  - `radius` - Search radius in km (optional, default: 25)
  - `latitude` - Your latitude (optional)
  - `longitude` - Your longitude (optional)
  - `gender` - Filter by gender: "male", "female", "other" (optional)
  - `interests` - Comma-separated interests (optional)
  - `interestedIn` - "male", "female", "everyone" (optional)
  - `lookingFor` - "friendship", "dating", "relationship", "networking" (optional)
  - `religious` - Filter by religion (optional)
  - `studyLevel` - Filter by education level (optional)
- **Example:** `GET /user/nearby?radius=30&gender=female&interests=Travel,Music`
- **Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "profile": { ... },
      "distance": 5.2
    }
  ]
}
```

---

### 1.11 Get User by ID
- **Endpoint:** `GET /user/:id`
- **Description:** Get specific user's profile by ID
- **Auth Required:** Yes
- **URL Parameter:**
  - `id` - User ID
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "profile": { ... }
  }
}
```

---

### 1.12 Update User Status
- **Endpoint:** `PATCH /user/:id/status`
- **Description:** Activate or delete user account
- **Auth Required:** No
- **URL Parameter:**
  - `id` - User ID
- **Body:**
```json
{
  "status": "active"
}
```
- **Note:** `status` can be "active" or "delete"
- **Success Response:**
```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

---

### 1.13 Delete Account
- **Endpoint:** `DELETE /user/delete`
- **Description:** Soft delete your account (changes status to deleted)
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "message": "User status changed successfully"
}
```

---

### 1.14 Get All Users (Admin)
- **Endpoint:** `GET /user`
- **Description:** Get all users (paginated) - Admin only
- **Auth Required:** Yes (Admin or User role)
- **Query Parameters:**
  - `page` - Page number (optional, default: 1)
  - `limit` - Items per page (optional, default: 10)
  - `searchTerm` - Search by name or email (optional)
  - `sortBy` - Field to sort by (optional)
  - `sortOrder` - "asc" or "desc" (optional)
- **Example:** `GET /user?page=1&limit=20&searchTerm=john`
- **Success Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "verified": true,
      "status": "active"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 1.15 Update User Role (Admin)
- **Endpoint:** `PATCH /user/:id/role`
- **Description:** Update user's role - Admin only
- **Auth Required:** Yes (Admin role)
- **URL Parameter:**
  - `id` - User ID
- **Body:**
```json
{
  "role": "ADMIN"
}
```
- **Note:** `role` can be "USER" or "ADMIN" (uppercase)
- **Success Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

---

## Important Notes

### Profile Constants

#### Interests
```
"travel", "fitness", "photography", "cooking", "reading", "hiking", 
"fashion", "craft_beer", "dancing", "sports", "tango", "music", 
"movies", "gaming", "yoga"
```

#### Looking For
```
"friendship", "dating", "relationship", "networking"
```

#### Gender
```
"male", "female", "other"
```

#### Interested In
```
"male", "female", "everyone"
```

#### Study Level
```
"highSchool", "underGraduation", "postGraduation", "preferNotToSay"
```

#### Religion
```
"buddhist", "christian", "muslim", "atheist", "catholic", "hindu", 
"spiritual", "jewish", "agnostic", "other", "prefer_not_to_say"
```

#### Smoking Status
```
"Yes", "Occasionally", "Prefer Not to Say", "No"
```

#### Drinking Status
```
"Yes", "Occasionally", "Prefer Not to Say", "No"
```

### Location Format
Location must always be in GeoJSON Point format:
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude],
  "address": "Human readable address"
}
```
**Important:** Coordinates are `[longitude, latitude]` NOT `[latitude, longitude]`

### Error Response Format
All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "errorDetails": { ... }
}
```

### Pagination
Endpoints that support pagination accept these query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

Response includes a `meta` object:
```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### File Upload
Endpoints that accept file uploads use `multipart/form-data`:
- **Profile Images:** Max 10 images
- **Chat Images:** Max 10 images per message
- **Audio Messages:** Single audio file

Supported formats:
- **Images:** jpg, jpeg, png, webp
- **Audio:** mp3, wav, m4a

---

## Important Notes

### 1. Profile Completion Flow
- First register with email → Verify OTP → Add user fields → Add profile fields
- User must complete both user fields and profile fields to see matches
- Track completion with `allFieldsFilled` flag

### 2. Location Format
Always use GeoJSON Point format:
```json
{
  "type": "Point",
  "coordinates": [longitude, latitude],
  "address": "Human readable address"
}
```
**Important:** Order is `[longitude, latitude]` NOT `[latitude, longitude]`

### 3. Profile Images
- Upload images using `multipart/form-data`
- Images are processed and stored with unique filenames
- Can upload multiple images in profile
- Use image index (0-based) to delete specific images

### 4. Hidden Fields
Control which profile fields are visible to other users:
- Set `true` to hide a field
- Set `false` to show a field
- Only affects visibility to other users, not your own view

### 5. Nearby Users Search
- Default radius is 25km if not specified
- Maximum allowed distance (maxDistance) in profile is 25km
- If latitude/longitude not provided, uses your profile location
- Both latitude and longitude must be provided together
- Can combine with other filters (gender, interests, etc.)

### 6. Authentication Flow
- **Single endpoint for both login and registration:** `POST /user`
- Backend automatically detects if email exists
- If existing user: Sends login OTP
- If new user: Creates account and sends registration OTP
- Same OTP verification process for both

### 7. OTP Security
- OTP is valid for 10 minutes
- Rate limited to prevent spam
- Old unverified accounts are auto-deleted on re-registration
- No password required - completely passwordless authentication

### 8. Profile Constants Reference

**Interests:**
```
travel, fitness, photography, cooking, reading, hiking, fashion, craft_beer, dancing, sports, tango, music, movies, gaming, yoga
```

**Gender:**
```
male, female, other
```

**Interested In:**
```
male, female, everyone
```

**Looking For:**
```
friendship, dating, relationship, networking
```

**Study Level:**
```
highSchool, underGraduation, postGraduation, preferNotToSay
```

**Religion:**
```
buddhist, christian, muslim, atheist, catholic, hindu, spiritual, jewish, agnostic, other, prefer_not_to_say
```

**Smoking Status:**
```
Yes, Occasionally, Prefer Not to Say, No
```

**Drinking Status:**
```
Yes, Occasionally, Prefer Not to Say, No
```

### 9. Error Handling
All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "errorDetails": { ... }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
