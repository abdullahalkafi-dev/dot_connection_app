# Dot Connection App API Documentation

This is a dating/social networking application with email-based OTP authentication (no passwords required).

## App Flow

1. **Email Registration** → User enters only email
2. **OTP Verification** → 6-digit code sent to email
3. **Profile Completion** → User fills all required fields
4. **Matching System** → Swipe through potential matches
5. **Connections** → Send love requests and accept/reject them

### Key Features:
- **Passwordless Authentication** - Only email required
- **Auto-deletion** of unverified accounts on re-registration
- **Profile Completeness** tracking with `allFieldsFilled` flag
- **Matching System** with skip, love, and map actions
- **Connection Requests** that can be accepted or rejected

## Authentication Flow

### 1. Email-Only Registration
- **Endpoint:** `POST /api/user`
- **Description:** Register with email only
- **Body:**
```json
{
  "email": "user@example.com"
}
```

### 2. OTP Verification  
- **Endpoint:** `POST /api/user/verify-otp`
- **Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 3. Complete Profile
- **Endpoint:** `PATCH /api/user/profile`
- **Description:** Fill all required fields (sets `allFieldsFilled: true`)
- **Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1995-01-01",
  "address": "New York, NY"
}
```

## Matching System

### 4. Get Potential Matches
- **Endpoint:** `GET /api/match/potential`
- **Description:** Get users to swipe on (only verified users with complete profiles)
- **Query Parameters:**
  - `page`, `limit` for pagination
  - `age_min`, `age_max` for filtering

### 5. Perform Action on User
- **Endpoint:** `POST /api/match/action`
- **Description:** Swipe actions - skip, love, or map view
- **Body:**
```json
{
  "toUserId": "user_id_here",
  "action": "love" // or "skip" or "map"
}
```

**Response for Love Action:**
```json
{
  "success": true,
  "message": "It's a match! 🎉", // or "Love sent! Waiting for their response ❤️"
  "data": {
    "isMatch": true, // true if mutual love
    "connectionRequest": {...} // if one-sided love
  }
}
```

### 6. Get Connection Requests
- **Endpoint:** `GET /api/match/requests`
- **Description:** See who sent you love requests

### 7. Respond to Connection Request  
- **Endpoint:** `PATCH /api/match/requests/:requestId`
- **Body:**
```json
{
  "action": "accept" // or "reject"
}
```

### 8. View User on Map
- **Endpoint:** `GET /api/match/location/:userId`
- **Description:** Get user's location for map view (requires map action first)

### 9. Get Your Connections
- **Endpoint:** `GET /api/match/connections`
- **Description:** See all your matched connections

## Profile Management

### 10. Create Dating Profile
- **Endpoint:** `POST /api/profile`
- **Body:**
```json
{
  "bio": "Looking for someone special...",
  "age": 28,
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128], // [longitude, latitude]
    "address": "New York, NY"
  },
  "photos": [
    {
      "url": "https://example.com/photo1.jpg",
      "order": 1,
      "isMain": true
    }
  ],
  "interests": ["Travel", "Music", "Fitness"],
  "lookingFor": "relationship", // "friendship", "dating", "relationship" 
  "gender": "male", // "male", "female", "other"
  "interestedIn": "female", // "male", "female", "everyone"
  "height": 180,
  "ageRangeMin": 25,
  "ageRangeMax": 35,
  "maxDistance": 50,
  "occupation": "Software Engineer",
  "lifestyle": {
    "smoking": "never",
    "drinking": "socially", 
    "exercise": "regularly"
  },
  "hobbies": ["Reading", "Cooking", "Hiking"],
  "languages": ["English", "Spanish"]
}
```

## Advanced Features

### User Status Tracking
- **`verified`** - Email verified via OTP
- **`allFieldsFilled`** - All required user fields completed
- **Profile completeness** - Calculated based on profile data

### Match Algorithm
- Only shows **verified** users with **complete profiles**
- Excludes users you've already interacted with
- Supports distance-based filtering
- Age range filtering

### Security Features
- **Unverified account cleanup** - Old unverified accounts deleted on re-registration
- **Rate limiting** on OTP requests
- **JWT authentication** for all protected routes
- **Profile privacy** controls

## API Endpoints Summary

### Authentication
- `POST /api/user` - Register with email
- `POST /api/user/send-otp` - Send login OTP
- `POST /api/user/verify-otp` - Verify OTP and login
- `POST /api/user/resend-otp` - Resend OTP
- `PATCH /api/user/profile` - Complete user profile

### Matching
- `GET /api/match/potential` - Get users to swipe on
- `POST /api/match/action` - Perform swipe action
- `GET /api/match/requests` - Get connection requests received
- `PATCH /api/match/requests/:id` - Accept/reject request
- `GET /api/match/connections` - Get your matches
- `GET /api/match/history` - Get your swipe history
- `GET /api/match/location/:userId` - Get user location

### Profile
- `POST /api/profile` - Create dating profile
- `GET /api/profile/my-profile` - Get my profile
- `PATCH /api/profile` - Update profile
- `GET /api/profile/:id` - Get profile by ID

## Response Examples

### Successful Match
```json
{
  "success": true,
  "message": "It's a match! 🎉",
  "data": {
    "isMatch": true,
    "message": "It's a match! 🎉"
  }
}
```

### One-sided Love
```json
{
  "success": true, 
  "message": "Love sent! Waiting for their response ❤️",
  "data": {
    "connectionRequest": {
      "_id": "request_id",
      "fromUserId": "your_id",
      "toUserId": "their_id", 
      "status": "pending"
    }
  }
}
```

This completes the dating app backend with email-only registration, profile completion tracking, and a full matching system! 🎉
