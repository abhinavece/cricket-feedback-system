# Mobile App

React Native mobile application for the Cricket Match Feedback & Team Management System.

## Overview

Native mobile app providing match management, payment tracking, team statistics, and user profiles with Google OAuth authentication.

## Features

- **Match Management**: View upcoming and past matches
- **Payment Tracking**: Track match payments and dues
- **Team Stats**: View team performance statistics
- **Profile Management**: User profile and settings
- **Google Sign-In**: Secure authentication

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Mobile framework |
| **Expo SDK 52+** | Development platform |
| **Expo Router** | File-based navigation |
| **NativeWind** | Tailwind CSS for React Native |
| **Zustand** | State management |
| **TanStack Query** | Data fetching |
| **expo-auth-session** | Google OAuth |
| **expo-secure-store** | Secure storage |

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli eas-cli`
- For iOS: macOS with Xcode 15+
- For Android: Android Studio with SDK 34+

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Google OAuth Web Client ID
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` - Google OAuth iOS Client ID
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` - Google OAuth Android Client ID

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Navigate to **APIs & Services > Credentials**
4. Create OAuth 2.0 Client IDs for:
   - **iOS**: Bundle ID = `com.mavericks.cricket`
   - **Android**: Package name = `com.mavericks.cricket` + SHA-1 fingerprint
   - **Web**: For backend verification

### 4. Run Development Server

```bash
# Start Expo development server
npx expo start

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Splash/landing screen
│   ├── (auth)/             # Authentication screens
│   │   └── login.tsx
│   └── (app)/              # Main app screens
│       └── (tabs)/         # Tab navigation
│           ├── index.tsx   # Home
│           ├── matches/    # Matches screens
│           ├── payments.tsx
│           ├── admin.tsx
│           └── profile.tsx
├── components/
│   └── ui/                 # Reusable UI components
├── services/
│   └── api.ts              # API service layer
├── stores/
│   └── authStore.ts        # Zustand auth store
├── types/
│   └── index.ts            # TypeScript types
├── constants/
│   ├── config.ts           # App configuration
│   └── colors.ts           # Color palette
└── assets/                 # Images and fonts
```

## Building for Production

### iOS (App Store)

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android (Play Store)

```bash
# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Preview Build (Testing)

```bash
# Build preview APK for Android
eas build --platform android --profile preview

# Build for iOS TestFlight
eas build --platform ios --profile preview
```

## Over-the-Air Updates

Push JavaScript/asset updates without app store review:

```bash
eas update --branch production --message "Bug fix description"
```

## Backend Requirements

The mobile app requires the backend to have the `/api/auth/google/mobile` endpoint for mobile OAuth authentication. This endpoint uses access tokens instead of ID tokens.

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start -c  # Clear cache
   ```

2. **iOS build fails**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build fails**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

### Lint Errors During Development

The lint errors you see before running `npm install` are expected - they will resolve once dependencies are installed.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## Related Documentation

- [Backend README](../backend/README.md) - Backend API service
- [Frontend README](../frontend/README.md) - Web application
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [Architecture](../ARCHITECTURE.md) - System architecture

## License

Private - Mavericks Cricket Club
