# Firebase Setup Instructions

## Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password and Phone providers)
   - Firestore Database
   - Storage
   - Cloud Messaging

## Configuration Steps

### 1. Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration values from the Firebase Console:

```bash
cp .env.example .env
```

Get your config values from Firebase Console > Project Settings > General > Your apps > Web app

### 2. Authentication Setup

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable **Phone** provider
3. Configure authorized domains if needed
4. For testing, you can add test phone numbers in the Phone authentication settings

### 3. Firestore Database Setup

1. Go to Firebase Console > Firestore Database
2. Create database in **production mode**
3. Deploy the security rules:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 4. Storage Setup

1. Go to Firebase Console > Storage
2. Set up Cloud Storage
3. Deploy storage rules:

```bash
firebase deploy --only storage
```

### 5. Cloud Messaging Setup (for notifications)

1. Go to Firebase Console > Cloud Messaging
2. Generate a new key pair for web push certificates
3. Add the public key to your environment variables

## Security Rules

The project includes pre-configured security rules:

- **firestore.rules**: Controls access to Firestore collections
- **storage.rules**: Controls access to Cloud Storage

### Key Security Features

1. **User Isolation**: Users can only access their own profile data
2. **Read-Only Content**: Educational content (classes, notes, recordings) is read-only for all users
3. **Authenticated Access**: All resources require authentication
4. **Personal Data Access**: Users can read/write their own exam results, attendance, and notifications

## Testing

To test the authentication system:

1. Start the development server: `npm run dev`
2. Navigate to `/auth` to see the phone authentication form
3. Enter a Bangladeshi phone number (format: 01XXXXXXXXX)
4. Receive and enter the OTP code
5. For new users, complete the name registration
6. Verify that protected routes redirect to auth when not logged in
7. Verify that authenticated users can access the dashboard and stay logged in

## Troubleshooting

### Common Issues

1. **Firebase config not found**: Make sure `.env` file exists and contains valid Firebase config
2. **Phone authentication errors**: Check that Phone provider is enabled in Firebase Console
3. **reCAPTCHA errors**: Ensure your domain is added to authorized domains in Firebase Console
4. **OTP not received**: Check phone number format and ensure it's a valid Bangladeshi number
5. **Firestore permission errors**: Ensure security rules are deployed correctly

### Debug Mode

Enable Firebase debug mode by adding to your `.env`:

```
VITE_FIREBASE_DEBUG=true
```

This will enable additional logging for troubleshooting.