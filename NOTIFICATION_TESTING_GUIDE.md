# 🔔 Notification Testing Guide

This guide explains how to test and verify that notifications are working properly in the Parents Madrasa Portal.

## 🚀 Quick Start Testing

### 1. **Using the Debug Panel (Easiest)**

1. Open the app in your browser
2. Look for a yellow "🔔 Debug" button in the bottom-right corner
3. Click it to open the debug panel
4. Use the test buttons to try different notification types

### 2. **Using Browser Console (Advanced)**

Open browser DevTools (F12) and run:

```javascript
// Test all notifications at once
NotificationTester.runAllTests();

// Or test individual components:
NotificationTester.testPermission();
NotificationTester.testBrowserNotification();
NotificationTester.testAppNotifications();
NotificationTester.checkNotificationStatus();
```

## 📋 Step-by-Step Testing Checklist

### ✅ **Step 1: Check Browser Support**
```javascript
// In browser console:
console.log('Notifications supported:', 'Notification' in window);
console.log('Current permission:', Notification.permission);
```

**Expected Results:**
- Should show `true` for modern browsers
- Permission should be `default`, `granted`, or `denied`

### ✅ **Step 2: Request Permission**
```javascript
// In browser console:
Notification.requestPermission().then(permission => {
  console.log('Permission result:', permission);
});
```

**Expected Results:**
- Browser should show permission dialog
- Result should be `granted` or `denied`

### ✅ **Step 3: Test Basic Browser Notification**
```javascript
// In browser console (only works if permission granted):
new Notification('Test', {
  body: 'This is a test notification',
  icon: '/icons/icon-192x192.png'
});
```

**Expected Results:**
- Should see a desktop notification
- Should hear notification sound (if enabled)
- Should see notification in system notification center

### ✅ **Step 4: Test App Notification Service**

Use the debug panel or console:

```javascript
// Test class reminder (will trigger in 3 seconds)
notificationService.scheduleClassReminder('test-123', 'Test Class', new Date(Date.now() + 3000));

// Test new content notification
notificationService.notifyNewRecording('rec-123', 'New Recording Available');

// Test announcement
notificationService.notifyAnnouncement('Test', 'This is a test announcement');
```

**Expected Results:**
- Should see notifications appear in system
- Should see notifications in app's notification list
- Should update unread count

### ✅ **Step 5: Test Notification Preferences**

1. Go to Profile page
2. Find "Notification Settings" section
3. Toggle different notification types
4. Test notifications - disabled types shouldn't show

### ✅ **Step 6: Test In-App Notifications**

Look for these visual indicators:
- **Daily Banner**: "Your class today at [time]" on dashboard
- **Alert Banners**: Success/error messages with ✅/❌ icons
- **Scrolling Announcements**: Bottom banner on dashboard
- **Notification Badges**: Red dots on navigation items

## 🔍 How to Check if Notifications Are Working

### **Visual Indicators:**

1. **Desktop Notifications**: Should appear in system notification area
2. **Browser Tab**: May show notification count in title
3. **App UI**: 
   - Red badges on navigation items
   - Alert banners with messages
   - Notification list in profile/settings

### **Console Logs:**

Open DevTools Console and look for:
```
🔔 Testing Notification Permission...
✅ Browser supports notifications
✅ Test notification sent
📊 Notification Service Status:
```

### **Local Storage:**

Check browser DevTools > Application > Local Storage:
- `madrasa-portal-notifications`: Stored notifications
- `madrasa-portal-notification-preferences`: User preferences
- `madrasa-portal-scheduled-notifications`: Scheduled notifications

## 🐛 Troubleshooting Common Issues

### **Issue: No Permission Dialog**
```javascript
// Check if already decided:
console.log('Permission:', Notification.permission);

// Force request (may not work if previously denied):
Notification.requestPermission();
```

**Solutions:**
- Clear browser data for the site
- Check browser settings for notification permissions
- Try in incognito/private mode

### **Issue: Notifications Not Appearing**
```javascript
// Check service status:
NotificationTester.checkNotificationStatus();

// Check preferences:
console.log('Preferences:', notificationService.getPreferences());
```

**Solutions:**
- Verify permission is granted
- Check notification preferences are enabled
- Verify browser/OS notification settings
- Check Do Not Disturb mode

### **Issue: Notifications Appear But No Sound**
- Check browser notification settings
- Check system volume/notification sounds
- Check Do Not Disturb mode
- Test with `payload.silent: false`

### **Issue: Scheduled Notifications Not Working**
```javascript
// Check scheduled notifications:
console.log('Scheduled:', notificationService.getScheduledNotifications());
```

**Solutions:**
- Verify system time is correct
- Check if browser tab is active (some browsers limit background notifications)
- Check browser power saving modes

## 📱 Testing on Different Devices

### **Desktop Browsers:**
- Chrome: Full support
- Firefox: Full support  
- Safari: Full support
- Edge: Full support

### **Mobile Browsers:**
- Chrome Mobile: Limited (requires user interaction)
- Safari iOS: Limited (requires PWA installation)
- Firefox Mobile: Limited

### **PWA (Installed App):**
- Better notification support
- Background notifications
- Push notifications (with service worker)

## 🔧 Advanced Testing

### **Test Service Worker Notifications:**
```javascript
// Register service worker notification
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('SW Test', {
    body: 'This is from service worker',
    icon: '/icons/icon-192x192.png'
  });
});
```

### **Test Push Notifications (Future):**
```javascript
// This would be for Firebase Cloud Messaging
// Currently not implemented but prepared for
```

### **Performance Testing:**
```javascript
// Test many notifications
for(let i = 0; i < 10; i++) {
  notificationService.notifyAnnouncement(`Test ${i}`, `Message ${i}`);
}

// Check performance
console.log('Total notifications:', notificationService.getNotifications().length);
```

## 📊 Expected Behavior Summary

| Notification Type | Trigger | Expected Result |
|------------------|---------|-----------------|
| Class Reminder | 15 min before class | Desktop notification + in-app banner |
| New Recording | Content uploaded | Desktop notification + badge |
| New Notes | Notes uploaded | Desktop notification + badge |
| Exam Reminder | Before exam | Desktop notification + in-app alert |
| Announcement | Admin posts | Desktop notification + scrolling banner |

## 🎯 Success Criteria

✅ **Notifications are working if:**
- Permission dialog appears and can be granted
- Desktop notifications appear when triggered
- In-app visual indicators show (banners, badges)
- Notification preferences can be toggled
- Scheduled notifications trigger at correct time
- Notification history is maintained
- Malayalam translations appear correctly

❌ **Notifications need fixing if:**
- No permission dialog appears
- Desktop notifications don't show
- Console shows errors
- Preferences don't affect behavior
- Scheduled notifications don't trigger
- App crashes when testing notifications

## 🔄 Reset for Fresh Testing

To reset notification state for testing:

```javascript
// Clear all notification data
localStorage.removeItem('madrasa-portal-notifications');
localStorage.removeItem('madrasa-portal-notification-preferences');
localStorage.removeItem('madrasa-portal-scheduled-notifications');

// Reset browser permission (requires manual browser reset)
// Go to browser settings > Site settings > Notifications
```

---

**Need Help?** 
- Check browser console for error messages
- Use the debug panel for visual testing
- Test in different browsers/devices
- Verify system notification settings