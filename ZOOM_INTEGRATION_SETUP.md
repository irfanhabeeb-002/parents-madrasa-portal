# Zoom Integration Setup Guide

This guide explains how to enable and configure Zoom integration in the Parents Madrasa Portal.

## Current Status

Zoom integration is currently **DISABLED** by default. The application includes placeholder functions that return mock responses when Zoom is disabled, ensuring the app remains stable and functional.

## Enabling Zoom Integration

### Step 1: Obtain Zoom Credentials

1. Create a Zoom Developer Account at [marketplace.zoom.us](https://marketplace.zoom.us)
2. Create a new "Meeting SDK" app
3. Obtain the following credentials:
   - API Key
   - API Secret
   - Account ID
   - Client ID
   - Client Secret

### Step 2: Update Environment Variables

Update your `.env` file with the following variables:

```env
# Enable Zoom integration
VITE_ZOOM_ENABLED=true

# Zoom API credentials
VITE_ZOOM_API_KEY=your_actual_api_key_here
VITE_ZOOM_API_SECRET=your_actual_api_secret_here
VITE_ZOOM_ACCOUNT_ID=your_actual_account_id_here
VITE_ZOOM_CLIENT_ID=your_actual_client_id_here
VITE_ZOOM_CLIENT_SECRET=your_actual_client_secret_here
VITE_ZOOM_REDIRECT_URL=http://localhost:5173/auth/zoom/callback
```

### Step 3: Install Zoom SDK Dependencies

Install the required Zoom Meeting SDK package:

```bash
npm install @zoom/meetingsdk
```

### Step 4: Update Zoom Service Implementation

Once you have valid credentials, update the `src/services/zoomService.js` file to implement actual Zoom SDK calls instead of mock responses.

#### Example Implementation Updates:

```javascript
// In initializeZoomSDK function
export async function initializeZoomSDK() {
  if (!zoomEnabled) {
    return disabledResponse;
  }

  try {
    // Import Zoom SDK dynamically
    const ZoomMtgEmbedded = await import('@zoom/meetingsdk/embedded');

    // Initialize with actual SDK
    const client = ZoomMtgEmbedded.createClient();
    await client.init({
      debug: false,
      leaveOnPageUnload: true,
      // ... other configuration options
    });

    return {
      status: 'success',
      message: 'Zoom SDK initialized successfully',
      data: { initialized: true },
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to initialize Zoom SDK',
      error: error.message,
    };
  }
}
```

### Step 5: Test the Integration

1. Restart your development server
2. Navigate to the Live Class page
3. The Zoom integration banner should no longer appear
4. Join buttons should now use actual Zoom functionality
5. Visit the Recordings page to see actual Zoom cloud recordings

## Features Available When Enabled

### Live Class Integration

- Direct Zoom meeting join functionality
- Real-time meeting status updates
- Automatic attendance tracking
- Meeting status banners with visual indicators
- Error handling for meeting join failures

### Recordings Page

- Fetch and display Zoom cloud recordings
- Play recordings directly in browser
- Download recordings
- Search and filter functionality
- Automatic sync with Zoom cloud storage

### Attendance Tracking

- Automatic attendance logging to Firestore
- Join time and leave time tracking
- Duration calculation
- Integration with existing attendance system

## Disabled State Behavior

When `VITE_ZOOM_ENABLED=false` (default):

- All Zoom service functions return `{ status: "disabled", message: "Zoom feature is currently unavailable." }`
- LiveClass page shows: "Zoom integration will be available soon. Please check back later."
- Recordings page shows: "Zoom recordings are not available at the moment."
- No Zoom SDK dependencies are loaded
- App builds and runs perfectly without any Zoom-related errors

## Security Considerations

1. **Never expose API secrets in client-side code**
   - API secrets should only be used on your backend server
   - Use JWT tokens generated on your server for client authentication

2. **Implement proper authentication**
   - Verify user permissions before allowing meeting creation/join
   - Implement rate limiting for API calls

3. **Secure credential storage**
   - Store credentials in secure environment variables
   - Use different credentials for development and production

## Troubleshooting

### Common Issues

1. **"Zoom feature is currently unavailable" message**
   - Check that `VITE_ZOOM_ENABLED=true` in your `.env` file
   - Restart your development server after changing environment variables

2. **SDK initialization fails**
   - Verify your API credentials are correct
   - Check browser console for detailed error messages
   - Ensure you're using the correct Zoom SDK version

3. **Meeting join failures**
   - Verify meeting IDs and passwords are correct
   - Check that meetings are scheduled and active
   - Ensure proper JWT signature generation

### Debug Mode

Enable debug mode by setting `debug: true` in the Zoom SDK initialization to get detailed logs.

## Production Deployment

1. Update production environment variables
2. Ensure your domain is whitelisted in Zoom app settings
3. Use HTTPS for all Zoom-related functionality
4. Implement proper error monitoring and logging

## Support

For Zoom SDK specific issues, refer to:

- [Zoom Meeting SDK Documentation](https://marketplace.zoom.us/docs/sdk/native-sdks/web)
- [Zoom Developer Forum](https://devforum.zoom.us/)

For application-specific issues, check the application logs and error boundaries.
