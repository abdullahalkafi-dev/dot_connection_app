# Enhanced Nearby Users API Documentation

## Endpoint
`GET /api/v1/user/nearby`

## Description
This endpoint retrieves nearby users within a specified radius with advanced filtering capabilities. The endpoint supports both location-based search using the current user's profile location or custom coordinates.

## Authentication
Requires authentication token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Query Parameters

### Location Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `radius` | number | No | 25 | Search radius in kilometers (must be positive) |
| `latitude` | number | No* | User's profile latitude | Custom latitude for search center (-90 to 90) |
| `longitude` | number | No* | User's profile longitude | Custom longitude for search center (-180 to 180) |

**Note:** Both `latitude` and `longitude` must be provided together, or neither should be provided. You cannot provide only one of them.

### Profile Filter Parameters
| Parameter | Type | Required | Description | Valid Values |
|-----------|------|----------|-------------|--------------|
| `gender` | string | No | Filter by gender | `male`, `female`, `other` |
| `interests` | string | No | Filter by interests (comma-separated) | See interests list below |
| `interestedIn` | string | No | Filter by interested in preference | `male`, `female`, `everyone` |
| `lookingFor` | string | No | Filter by relationship goal | `friendship`, `dating`, `relationship`, `networking` |
| `religious` | string | No | Filter by religion | See religion list below |
| `studyLevel` | string | No | Filter by education level | See study level list below |

### Valid Interest Values
- `travel`, `fitness`, `photography`, `cooking`, `reading`, `hiking`
- `fashion`, `craft_beer`, `dancing`, `sports`, `tango`, `music`
- `movies`, `gaming`, `yoga`

### Valid Religion Values
- `buddhist`, `christian`, `muslim`, `atheist`, `catholic`
- `hindu`, `spiritual`, `jewish`, `agnostic`, `other`, `prefer_not_to_say`

### Valid Study Level Values
- `highSchool`, `underGraduation`, `postGraduation`, `preferNotToSay`

## Example Requests

### Basic Request (using user's profile location)
```http
GET /api/v1/user/nearby?radius=10
```

### Custom Location Request
```http
GET /api/v1/user/nearby?latitude=40.7128&longitude=-74.0060&radius=15
```

### Filtered Request
```http
GET /api/v1/user/nearby?radius=20&gender=female&interests=travel,fitness&lookingFor=relationship&religious=christian
```

### Complex Filtering
```http
GET /api/v1/user/nearby?latitude=40.7128&longitude=-74.0060&radius=25&gender=male&interestedIn=everyone&studyLevel=postGraduation&interests=music,photography,travel
```

## Response Format

### Success Response (200 OK)
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Nearby users retrieved successfully",
  "data": [
    {
      "userId": "64f123456789abcdef123456",
      "distance": 2340,
      "distanceKm": 2.34,
      "image": "https://example.com/profile.jpg",
      "location": {
        "latitude": 40.7589,
        "longitude": -73.9851
      },
      "name": "John Doe",
      "age": 28,
      "gender": "male",
      "interests": ["travel", "fitness", "photography"],
      "interestedIn": "female",
      "lookingFor": "relationship",
      "religious": "christian",
      "studyLevel": "postGraduation",
      "bio": "Love to travel and explore new places...",
      "height": 180,
      "workplace": "Tech Company",
      "school": "University of Technology"
    }
  ]
}
```

### Error Responses

#### 400 Bad Request - Missing Location
```json
{
  "statusCode": 400,
  "success": false,
  "message": "User location not found. Please provide both latitude and longitude or update your profile location."
}
```

#### 400 Bad Request - Incomplete Coordinates
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Both latitude and longitude must be provided together, or neither should be provided."
}
```

#### 400 Bad Request - Invalid Parameters
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "latitude",
      "message": "Both latitude and longitude must be provided together, or neither should be provided"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Unauthorized access"
}
```

## Implementation Notes

### Performance Optimizations
- Uses MongoDB's `$geoNear` aggregation for efficient geospatial queries
- Includes indexes on location (2dsphere), gender, interests, and other filtered fields
- Results are sorted by distance (closest first)
- Only returns active and verified users

### Default Behavior
- If no custom coordinates are provided, uses the current user's profile location
- Excludes the requesting user from results
- Only includes users with complete location data
- Filters out non-active and unverified users

### Data Returned
The response includes both basic user information and detailed profile data to support rich user interfaces and matching algorithms.

## Error Handling
- All numeric parameters are validated for proper ranges
- Enum parameters are validated against predefined values
- Location parameters are required either from query or user profile
- Comprehensive error messages help with debugging

## Rate Limiting
This endpoint may be subject to rate limiting. Check response headers for rate limit information.