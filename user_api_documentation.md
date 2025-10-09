# User Module API Documentation

## Base URL
```
https://your-api-domain.com/api/user
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
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "verified": true
    }
  }
}
```

---

### 1.3 Get My Profile
- **Endpoint:** `GET /user/getme`
- **Description:** Get logged-in user's profile
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1995-01-01",
    "phoneNumber": "+1234567890",
    "verified": true,
    "allFieldsFilled": true,
    "profile": { ... }
  }
}
```

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
- **Description:** Soft delete your account
- **Auth Required:** Yes
- **Success Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```


## Important Notes

### Profile Constants

#### Interests
```
"Travel", "Music", "Sports", "Reading", "Cooking", "Gaming", 
"Fitness", "Movies", "Art", "Photography", "Dancing"
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
"High School", "Bachelor", "Master", "PhD", "Diploma", "Other"
```

#### Religion
```
"Christian", "Muslim", "Hindu", "Buddhist", "Jewish", "Atheist", 
"Agnostic", "Other", "Prefer not to say"
```

#### Smoking Status
```
"Never", "Sometimes", "Regular", "Trying to quit"
```

#### Drinking Status
```
"Never", "Socially", "Regular", "Prefer not to say"
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
Travel, Music, Sports, Reading, Cooking, Gaming, Fitness, Movies, Art, Photography, Dancing
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
High School, Bachelor, Master, PhD, Diploma, Other
```

**Religion:**
```
Christian, Muslim, Hindu, Buddhist, Jewish, Atheist, Agnostic, Other, Prefer not to say
```

**Smoking Status:**
```
Never, Sometimes, Regular, Trying to quit
```

**Drinking Status:**
```
Never, Socially, Regular, Prefer not to say
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
