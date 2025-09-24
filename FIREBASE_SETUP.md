# Firebase Setup Guide

This guide will help you set up Firebase Authentication for the Parents Madrasa Portal.

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "parents-madrasa-portal")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started" if this is your first time
3. Go to the "Sign-in method" tab
4. Enable the following sign-in providers:
   - **Phone**: Click on "Phone" and toggle "Enable". This is required for phone number authentication.
   - **Email/Password**: Click on "Email/Password" and toggle "Enable". This serves as a fallback authentication method.

## Step 3: Set up Firestore Database

1. Click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can update security rules later)
4. Select a location for your database (choose the closest to your users)

## Step 4: Get Your Firebase Configuration

1. Click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (`</>`) to add a web app
5. Enter an app nickname (e.g., "Parents Madrasa Portal Web")
6. Check "Also set up Firebase Hosting" if you plan to deploy with Firebase Hosting
7. Click "Register app"
8. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: 'your-api-key-here',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-app-id',
  measurementId: 'your-measurement-id',
};
```

## Step 5: Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace the placeholder values with your actual Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Development settings
VITE_USE_FIREBASE_EMULATOR=false
```

## Step 6: Configure Phone Authentication

### For Development (Testing)

1. In Firebase Console, go to Authentication > Sign-in method
2. Click on "Phone" provider
3. Scroll down to "Phone numbers for testing"
4. Add test phone numbers with their corresponding verification codes:
   - Phone: `+919876543210`, Code: `123456`
   - Phone: `+919123456780`, Code: `123456`

### For Production

1. You'll need to set up reCAPTCHA verification
2. Add your domain to the authorized domains list in Authentication > Settings > Authorized domains

## Step 7: Set up Firestore Security Rules

1. Go to Firestore Database > Rules
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Class sessions are read-only for authenticated users
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    // Recordings are read-only for authenticated users
    match /recordings/{recordingId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    // Notes are read-only for authenticated users
    match /notes/{noteId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    // Students can read exercises and write their own results
    match /exercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    match /examResults/{resultId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Students can write their own attendance
    match /attendance/{attendanceId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Announcements are read-only for students
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }
  }
}
```

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the authentication page
3. Try logging in with:
   - Phone number: `9876543210` with OTP: `123456` (if you set up test numbers)
   - Or create a new email account

## Troubleshooting

### Common Issues

1. **"Firebase configuration incomplete" error**
   - Make sure all environment variables are set correctly
   - Ensure no placeholder values remain in your `.env` file

2. **reCAPTCHA errors during phone authentication**
   - Make sure your domain is added to authorized domains
   - Check that phone authentication is enabled in Firebase Console

3. **Permission denied errors**
   - Verify that Firestore security rules are set up correctly
   - Make sure the user is authenticated before accessing protected data

4. **Phone authentication not working**
   - Ensure phone provider is enabled in Firebase Console
   - For testing, add test phone numbers in Firebase Console
   - For production, verify reCAPTCHA is working correctly

### Getting Help

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Firebase project settings
3. Ensure all required services (Authentication, Firestore) are enabled
4. Check that your environment variables match your Firebase configuration exactly

## Security Considerations

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use test phone numbers only in development**
3. **Set up proper Firestore security rules before going to production**
4. **Enable App Check for additional security in production**
5. **Regularly review your Firebase usage and billing**

## Next Steps

Once Firebase is set up:

1. Test the authentication flow thoroughly
2. Set up Firebase Cloud Messaging for push notifications
3. Configure Firebase Storage for file uploads
4. Set up Firebase Hosting for deployment (optional)
