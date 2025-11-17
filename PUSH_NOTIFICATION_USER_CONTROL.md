# Push Notification Control - User Preference

## Overview
Users have full control over receiving push notifications through the `pushNotification` field in their user profile.

## How It Works

### User Model Field
```typescript
{
  pushNotification: {
    type: Boolean,
    default: true,  // Enabled by default
  }
}
```

### Notification Behavior

#### When `pushNotification = true` (Default)
- ✅ Notifications saved to database
- ✅ Push notifications sent via FCM (if FCM token exists)
- ✅ User receives notifications on their device

#### When `pushNotification = false`
- ✅ Notifications saved to database (user can still see in-app)
- ❌ Push notifications NOT sent via FCM
- ✅ User won't be disturbed on their device
- ✅ Can still view notification history in app

### Implementation Logic

The check happens in `notification.service.ts`:

```typescript
// Get user's FCM token and push notification preference
const user = await User.findById(userId)
  .select('fcmToken pushNotification')
  .lean();

// Save notification to database (always)
const notification = await createNotification({...});

// Check if user has push notifications enabled
if (!user.pushNotification || !user.fcmToken) {
  logger.info(`User ${userId} has push notifications disabled or no FCM token`);
  return { sent: false, notification };
}

// Send FCM notification (only if enabled)
const sent = await FCMService.sendNotification({...});
```

## User API Endpoints

Users can manage their notification preferences through the user/setting endpoints.

### Get Current Preference
```http
GET /api/v1/user/me
Authorization: Bearer <token>
```

Response includes:
```json
{
  "pushNotification": true
}
```

### Update Notification Preference
To disable push notifications:
```http
PATCH /api/v1/user/update
Authorization: Bearer <token>

{
  "pushNotification": false
}
```

To enable push notifications:
```http
PATCH /api/v1/user/update
Authorization: Bearer <token>

{
  "pushNotification": true
}
```

## Complete Flow Example

### Scenario: User Receives a Message While Offline

1. **Sender sends message** to User A
2. **System checks:**
   - Is User A online? → No (offline)
   - Is sender blocked by User A? → No
   - Does User A have `pushNotification` enabled? → Check database
   
3. **If `pushNotification = true`:**
   ```
   ✅ Save to database
   ✅ Send FCM push notification
   ✅ User's phone shows notification
   ```

4. **If `pushNotification = false`:**
   ```
   ✅ Save to database
   ❌ Skip FCM push notification
   ❌ User's phone stays quiet
   ✅ User can see notification when they open app
   ```

## Priority Checks (in order)

When sending a notification, the system checks:

1. **Block Check** - Is sender blocked?
   - If blocked: Stop (no notification at all)
   
2. **User Exists** - Does the user exist?
   - If not: Stop with error
   
3. **Database Save** - Save notification to database
   - Always happens (if checks 1-2 pass)
   
4. **Push Notification Preference** - Is `pushNotification` enabled?
   - If false: Skip FCM, return
   
5. **FCM Token** - Does user have FCM token?
   - If no token: Skip FCM, return
   
6. **Send FCM** - Send push notification to device
   - Only if all above checks pass

## Benefits

### For Users
- 🔕 Can disable notifications during specific times (DND mode)
- 📱 Still receives notifications in-app
- 🎯 Full control over notification experience
- 🔋 Saves battery when notifications disabled

### For System
- 💾 Always maintains notification history
- 📊 Can track notification delivery success
- 🔄 Easy to re-enable notifications
- 💰 Saves FCM quota when user has disabled

## Testing

### Test Push Notification Disabled

1. **Disable notifications for User A:**
   ```bash
   PATCH /api/v1/user/update
   { "pushNotification": false }
   ```

2. **User B sends message to User A** (while A is offline)

3. **Expected Result:**
   - Message saved to database ✅
   - Notification saved to database ✅
   - NO push notification sent ❌
   - User A's device stays quiet ✅

4. **User A opens app:**
   - Can see new message ✅
   - Can see notification in notification list ✅

### Test Push Notification Enabled

1. **Enable notifications for User A:**
   ```bash
   PATCH /api/v1/user/update
   { "pushNotification": true }
   ```

2. **User B sends message to User A** (while A is offline)

3. **Expected Result:**
   - Message saved to database ✅
   - Notification saved to database ✅
   - Push notification sent ✅
   - User A's device shows notification ✅

## Summary

✅ **Implemented:** Full user control over push notifications
✅ **Respect user preference:** No FCM sent if disabled
✅ **Maintain history:** Notifications always saved to database
✅ **Block protection:** Blocked users never get notifications
✅ **Default behavior:** Notifications enabled by default (user-friendly)

The system perfectly balances user control with maintaining a complete notification history!
