# Firebase Setup Guide for InterviewAI

## Firebase Console Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `interviewai-[your-name]`
4. Enable Google Analytics (optional)
5. Create project

### 2. Configure Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the following providers:
   - **Email/Password**: Click "Enable" toggle
   - **Google**: Click "Enable" toggle
     - You'll need to set up OAuth consent screen
     - Add your domain to authorized domains

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. In "Your apps" section, click "Web" icon (</>)
3. Register app with nickname: "InterviewAI Web"
4. Copy the config object values to your `.env` file

### 4. Set up Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll update rules later)
4. Select your preferred location

## Environment Variables (.env)

Update your `.env` file with actual values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-actual-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

## Firestore Security Rules

Replace the default rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Interview sessions - users can only access their own sessions
    match /interview_sessions/{sessionId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // User practice history - users can only access their own history
    match /practice_history/{historyId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Database Structure

The app creates the following Firestore collections:

### Users Collection (`/users/{userId}`)
```javascript
{
  displayName: "John Doe",
  email: "john@example.com",
  photoURL: "https://...", // Optional, for Google sign-in
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### Interview Sessions Collection (`/interview_sessions/{sessionId}`)
```javascript
{
  userId: "user_uid",
  sessionType: "practice", // practice, mock, etc.
  questions: [...], // Array of questions asked
  responses: [...], // Array of user responses
  feedback: {...}, // AI feedback and scoring
  startTime: timestamp,
  endTime: timestamp,
  duration: number, // in seconds
  overallScore: number, // 0-100
  createdAt: timestamp
}
```

### Practice History Collection (`/practice_history/{historyId}`)
```javascript
{
  userId: "user_uid",
  sessionId: "session_id", // Reference to interview_sessions
  score: number,
  improvementAreas: [...], // Array of areas to improve
  strengths: [...], // Array of strengths
  date: timestamp
}
```

## Google OAuth Setup

### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Credentials"
4. Click "Configure consent screen"
5. Fill out required fields:
   - App name: "InterviewAI"
   - User support email: your email
   - App domain: your domain (for production)

### 2. Authorized Domains
In Firebase Console > Authentication > Settings > Authorized domains:
- Add `localhost` (for development)
- Add your production domain when deploying

## Security Considerations

1. **Never commit `.env` file** - it's already in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Firestore rules** ensure users can only access their own data
4. **Regular security audits** - review Firebase security rules periodically

## Testing Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/signup` to create a test account
3. Try both email/password and Google sign-in
4. Verify user data is created in Firestore
5. Test protected routes redirect to login when not authenticated

## Production Deployment

1. Update authorized domains in Firebase Console
2. Set environment variables in your hosting platform
3. Deploy updated Firestore security rules
4. Test authentication flows in production environment

## Troubleshooting

### Common Issues:
1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check your API key in `.env` file

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Firebase Console

3. **Google Sign-in popup blocked**
   - Browser is blocking popups, user needs to allow popups

4. **Firestore permission denied**
   - Check security rules are properly configured
   - Verify user is authenticated before accessing Firestore