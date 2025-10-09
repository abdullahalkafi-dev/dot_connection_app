# Setting Module API Documentation

## Base URL
```
https://your-api-domain.com/api/setting
```

## Authentication
No authentication required for reading settings.

---

## Setting Module

### 6.1 Get All Settings
- **Endpoint:** `GET /setting`
- **Description:** Get app settings (About Us, Privacy Policy, Terms)
- **Auth Required:** No
- **Success Response:**
```json
{
  "success": true,
  "data": {
    "aboutUs": "About us content...",
    "privacyPolicy": "Privacy policy content...",
    "termsAndConditions": "Terms and conditions content..."
  }
}
```

---

## Important Notes

### 1. Public Endpoint
- No authentication required
- Can be accessed before login
- Useful for showing legal information during registration
- Public data, safe to cache

### 2. Content Format
- All content is in HTML format
- Can contain formatting tags (paragraphs, lists, links)
- Safe to render in WebView or RichText widgets
- Content is sanitized on backend

### 3. Use Cases
- Display in app settings screen
- Show during registration flow
- Link from profile or menu
- Required for app store compliance

### 4. Caching Strategy
- Content changes rarely
- Safe to cache for 24 hours
- Check for updates on app start
- Store locally for offline access

### 5. Response Structure
Always returns all three fields:
- `aboutUs` - Company/app information
- `privacyPolicy` - Privacy policy text
- `termsAndConditions` - Terms of service

### 6. Empty Response
If no settings configured:
```json
{
  "success": true,
  "data": {
    "aboutUs": "",
    "privacyPolicy": "",
    "termsAndConditions": ""
  }
}
```

### 7. Display Recommendations
- Show in dedicated settings screens
- Link from user profile
- Include "Last Updated" date if available
- Make text searchable/scrollable
- Support deep linking to specific sections

### 8. Legal Compliance
- Must show Terms before user registration
- Privacy Policy must be accessible at all times
- Consider version tracking for legal purposes
- Users should acknowledge reading terms

### 9. Flutter Implementation Example
```dart
class SettingsService {
  Future<Settings> getSettings() async {
    final response = await http.get('${baseUrl}/setting');
    return Settings.fromJson(json.decode(response.body));
  }
}
```

### 10. Best Practices
- Cache settings data locally
- Show loading state while fetching
- Handle network errors gracefully
- Provide offline fallback
- Update cache periodically