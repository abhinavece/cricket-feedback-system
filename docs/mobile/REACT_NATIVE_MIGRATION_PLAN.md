# React Native Mobile App Migration Plan

## Cricket Feedback System - Mobile Application

**Document Version:** 1.0  
**Date:** January 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Web App Analysis](#2-current-web-app-analysis)
3. [Technology Stack Decision](#3-technology-stack-decision)
4. [Architecture Design](#4-architecture-design)
5. [Feature Migration Matrix](#5-feature-migration-matrix)
6. [Mobile-Specific Features](#6-mobile-specific-features)
7. [Development Phases](#7-development-phases)
8. [Catches & Challenges](#8-catches--challenges)
9. [Project Structure](#9-project-structure)
10. [Build & Deployment Guide](#10-build--deployment-guide)
11. [Testing Strategy](#11-testing-strategy)
12. [Timeline & Effort Estimation](#12-timeline--effort-estimation)

---

## 1. Executive Summary

### Objective
Convert the existing React web application (Cricket Feedback System) into native mobile apps for **Android** and **iOS** using **React Native** with **Expo**.

### Scope
- Full feature parity with web application
- Native mobile experience (push notifications, offline support, camera)
- Single codebase for both platforms
- Reuse existing Node.js/Express backend (no backend changes required)

### Recommendation: Expo (Managed Workflow)

| Factor | Expo | React Native CLI |
|--------|------|------------------|
| Setup Complexity | ✅ Simple | ❌ Complex |
| Build Infrastructure | ✅ EAS Build (cloud) | ❌ Local setup needed |
| OTA Updates | ✅ Built-in | ❌ CodePush needed |
| Native Modules | ⚠️ Limited (but sufficient) | ✅ Full access |
| App Store Submission | ✅ EAS Submit | ❌ Manual |
| Learning Curve | ✅ Easier | ❌ Steeper |

**Verdict:** Use **Expo** with **Expo Router** for navigation. Can eject to bare workflow later if needed.

---

## 2. Current Web App Analysis

### Existing Features to Migrate

| Feature | Component | Complexity | Mobile Considerations |
|---------|-----------|------------|----------------------|
| **Feedback Form** | `FeedbackForm.tsx` | Medium | Date picker, star rating |
| **Admin Dashboard** | `AdminDashboard.tsx` | High | Tab navigation, data visualization |
| **Match Management** | `MatchManagement.tsx` | High | CRUD, squad selection |
| **Payment Management** | `PaymentManagement.tsx` | High | Payment tracking, screenshots |
| **WhatsApp Messaging** | `WhatsAppMessagingTab.tsx` | High | Deep linking to WhatsApp |
| **User Management** | `UserManagement.tsx` | Medium | Role management |
| **Google Auth** | `GoogleAuth.tsx` | Medium | Native Google Sign-In |
| **Match Cards** | `MatchCard.tsx` | Low | List rendering |
| **Player History** | `PlayerPaymentHistory.tsx` | Medium | Data tables |

### Current Tech Stack (Web)

```
Frontend:
├── React 19 + TypeScript
├── Tailwind CSS (styling)
├── Axios (API calls)
├── React DatePicker
├── Lucide React (icons)
└── Google OAuth (@react-oauth/google)

Backend (unchanged):
├── Node.js + Express
├── MongoDB + Mongoose
├── JWT Authentication
├── WhatsApp Cloud API
└── OCI Cloud Infrastructure
```

### Data Flow
```
Mobile App → HTTPS → Backend API → MongoDB
                 ↓
            WhatsApp Cloud API
```

---

## 3. Technology Stack Decision

### Mobile Stack

```
Mobile App:
├── React Native 0.76+ (New Architecture)
├── Expo SDK 52+
├── Expo Router v4 (file-based navigation)
├── TypeScript 5.x
├── NativeWind v4 (Tailwind for RN)
├── React Query / TanStack Query (data fetching)
├── Zustand (state management)
├── Expo SecureStore (auth tokens)
├── expo-auth-session (Google OAuth)
├── expo-notifications (push notifications)
├── expo-image-picker (camera/gallery)
└── React Native Reanimated (animations)
```

### Why These Choices?

| Library | Reason |
|---------|--------|
| **Expo Router** | File-based routing (similar to Next.js), deep linking built-in |
| **NativeWind** | Reuse Tailwind classes from web, familiar syntax |
| **TanStack Query** | Caching, background refetch, offline support |
| **Zustand** | Simpler than Redux, good TypeScript support |
| **SecureStore** | Encrypted storage for tokens (vs AsyncStorage) |

---

## 4. Architecture Design

### App Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Screens   │  │  Components │  │      Services       │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────┤  │
│  │ (tabs)      │  │ FeedbackCard│  │ api.ts (axios)      │  │
│  │ ├─ index    │  │ MatchCard   │  │ auth.ts             │  │
│  │ ├─ matches  │  │ PaymentCard │  │ notifications.ts    │  │
│  │ ├─ payments │  │ PlayerSelect│  │ storage.ts          │  │
│  │ ├─ admin    │  │ DatePicker  │  │                     │  │
│  │ └─ profile  │  │ StarRating  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    State Management                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ││
│  │  │  Auth Store  │  │ Query Cache  │  │  UI Store    │  ││
│  │  │  (Zustand)   │  │(TanStack)    │  │  (Zustand)   │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Native Modules                        ││
│  │  Push Notifications │ Camera │ SecureStore │ Haptics   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Existing Backend API                      │
│              https://mavericks11.duckdns.org/api            │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Structure (Expo Router)

```
app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Landing/splash screen
├── (auth)/                  # Auth group (unauthenticated)
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (app)/                   # Main app (authenticated)
│   ├── _layout.tsx          # Tab navigator
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab bar configuration
│   │   ├── index.tsx        # Home/Feedback tab
│   │   ├── matches/
│   │   │   ├── index.tsx    # Match list
│   │   │   └── [id].tsx     # Match detail
│   │   ├── payments/
│   │   │   ├── index.tsx    # Payment list
│   │   │   └── [id].tsx     # Payment detail
│   │   ├── admin/
│   │   │   ├── index.tsx    # Admin dashboard
│   │   │   ├── users.tsx
│   │   │   └── whatsapp.tsx
│   │   └── profile.tsx      # User profile
│   └── modals/
│       ├── match-form.tsx
│       ├── payment-form.tsx
│       └── feedback-detail.tsx
└── +not-found.tsx           # 404 screen
```

---

## 5. Feature Migration Matrix

### Component Mapping (Web → Mobile)

| Web Component | Mobile Component | Changes Required |
|---------------|------------------|------------------|
| `Navigation.tsx` | Tab Navigator + Header | Complete rewrite |
| `AdminDashboard.tsx` | Multiple screens | Split into screens |
| `FeedbackForm.tsx` | `screens/FeedbackForm.tsx` | DatePicker, inputs |
| `FeedbackCard.tsx` | `components/FeedbackCard.tsx` | NativeWind styles |
| `MatchCard.tsx` | `components/MatchCard.tsx` | FlatList item |
| `MatchManagement.tsx` | `screens/matches/*` | Split CRUD |
| `MatchDetailModal.tsx` | `screens/matches/[id].tsx` | Full screen |
| `PaymentManagement.tsx` | `screens/payments/*` | Split screens |
| `WhatsAppMessagingTab.tsx` | `screens/admin/whatsapp.tsx` | Deep linking |
| `UserManagement.tsx` | `screens/admin/users.tsx` | Table → List |
| `GoogleAuth.tsx` | `components/GoogleAuth.tsx` | expo-auth-session |
| `ProtectedRoute.tsx` | Route groups + middleware | Expo Router |

### API Service Migration

```typescript
// Web (localStorage)
const token = localStorage.getItem('authToken');

// Mobile (SecureStore)
import * as SecureStore from 'expo-secure-store';
const token = await SecureStore.getItemAsync('authToken');
```

### Styling Migration (Tailwind → NativeWind)

```tsx
// Web (Tailwind CSS)
<div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">

// Mobile (NativeWind) - Most classes work directly!
<View className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
// Note: backdrop-blur requires extra setup or native module
```

---

## 6. Mobile-Specific Features

### 6.1 Push Notifications

**Use Case:** Notify users about:
- New match availability requests
- Payment reminders
- Squad selection updates
- Match day reminders

**Implementation:**
```typescript
// Backend: Add push token storage
// POST /api/users/push-token
{
  "pushToken": "ExponentPushToken[xxxxxx]",
  "platform": "ios" | "android"
}

// Backend: Send notification
import { Expo } from 'expo-server-sdk';
const expo = new Expo();
await expo.sendPushNotificationsAsync([{
  to: pushToken,
  title: "Match Tomorrow!",
  body: "Don't forget: Mavericks vs Warriors at 9 AM",
  data: { matchId: "123", screen: "matches" }
}]);
```

### 6.2 Offline Support

**Strategy:** Cache-first with background sync

```typescript
// Using TanStack Query
const { data: matches } = useQuery({
  queryKey: ['matches'],
  queryFn: fetchMatches,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
  networkMode: 'offlineFirst',
});
```

### 6.3 Camera/Gallery Access

**Use Case:** Payment screenshot uploads

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    base64: true,
  });
  
  if (!result.canceled) {
    await uploadPaymentScreenshot(paymentId, memberId, result.assets[0]);
  }
};
```

### 6.4 Deep Linking

**WhatsApp Integration:**
```typescript
import { Linking } from 'react-native';

const sendWhatsApp = (phone: string, message: string) => {
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
  Linking.openURL(url);
};
```

**App Deep Links:**
```
mavericks://matches/123
mavericks://payments/456
```

### 6.5 Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const authenticate = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access Mavericks',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
};
```

### 6.6 Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

// On button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// On success
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

## 7. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize Expo project with TypeScript
- [ ] Set up NativeWind (Tailwind)
- [ ] Configure Expo Router navigation
- [ ] Set up auth flow (Google Sign-In)
- [ ] Create API service layer
- [ ] Implement secure token storage
- [ ] Create base UI components (Button, Card, Input)

### Phase 2: Core Features (Week 3-4)
- [ ] Feedback submission form
- [ ] Feedback list with cards
- [ ] Match list and detail screens
- [ ] Match availability response
- [ ] Basic admin dashboard

### Phase 3: Advanced Features (Week 5-6)
- [ ] Payment management screens
- [ ] Player payment history
- [ ] WhatsApp messaging integration
- [ ] User management (admin)
- [ ] Image picker for screenshots

### Phase 4: Mobile Enhancements (Week 7-8)
- [ ] Push notifications setup
- [ ] Offline support with caching
- [ ] Deep linking configuration
- [ ] Biometric authentication
- [ ] Pull-to-refresh everywhere
- [ ] Skeleton loaders

### Phase 5: Polish & Testing (Week 9-10)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] App Store assets (screenshots, descriptions)

### Phase 6: Deployment (Week 11-12)
- [ ] Beta testing (TestFlight / Internal Testing)
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)
- [ ] Production monitoring setup

---

## 8. Catches & Challenges

### 🚨 Critical Challenges

#### 1. Google OAuth on Mobile
**Problem:** `@react-oauth/google` is web-only.

**Solution:** Use `expo-auth-session` with Google provider:
```typescript
import * as Google from 'expo-auth-session/providers/google';

const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID', // Same as current
});
```

**Backend Change Required:**
```javascript
// backend/routes/auth.js
// Add mobile token verification alongside web
const { OAuth2Client } = require('google-auth-library');

// For mobile, verify the access token differently
router.post('/google/mobile', async (req, res) => {
  const { accessToken } = req.body;
  
  // Fetch user info using access token
  const userInfoResponse = await fetch(
    'https://www.googleapis.com/userinfo/v2/me',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const userInfo = await userInfoResponse.json();
  
  // Rest of auth logic...
});
```

#### 2. Date Picker
**Problem:** `react-datepicker` is web-only.

**Solution:** Use `@react-native-community/datetimepicker`:
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';

<DateTimePicker
  value={date}
  mode="date"
  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
  onChange={(event, selectedDate) => setDate(selectedDate)}
/>
```

#### 3. Backdrop Blur
**Problem:** NativeWind's `backdrop-blur` doesn't work natively.

**Solution:** Use `expo-blur`:
```typescript
import { BlurView } from 'expo-blur';

<BlurView intensity={50} style={styles.container}>
  {/* Content */}
</BlurView>
```

#### 4. Large Lists Performance
**Problem:** Web uses simple `.map()`, mobile needs virtualization.

**Solution:** Always use `FlatList` or `FlashList`:
```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={feedback}
  renderItem={({ item }) => <FeedbackCard item={item} />}
  estimatedItemSize={150}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

#### 5. WhatsApp Web UI
**Problem:** Web app has inline WhatsApp messaging UI.

**Solution:** On mobile, open WhatsApp directly:
```typescript
// Can't embed WhatsApp UI, but can:
// 1. Compose message in app
// 2. Open WhatsApp with pre-filled message
Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`);
```

#### 6. Complex Tables
**Problem:** Payment tables with many columns don't fit mobile.

**Solution:** 
- Use cards instead of tables
- Implement expandable rows
- Add horizontal scroll for essential tables
- Create detail screens for full data

### ⚠️ Medium Challenges

| Challenge | Impact | Solution |
|-----------|--------|----------|
| **File uploads** | Payment screenshots | `expo-image-picker` + `FormData` |
| **Pull to refresh** | UX expectation | `RefreshControl` on ScrollView/FlatList |
| **Keyboard avoiding** | Form usability | `KeyboardAvoidingView` wrapper |
| **Safe area** | Notch/dynamic island | `SafeAreaView` from react-native-safe-area-context |
| **Status bar** | Theme consistency | `expo-status-bar` |
| **App state** | Background/foreground | `AppState` API for token refresh |

### ℹ️ Minor Adjustments

| Web | Mobile |
|-----|--------|
| `onClick` | `onPress` |
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<Pressable>` or `<TouchableOpacity>` |
| `className` (string) | `className` (NativeWind) or `style` |
| `window.alert()` | `Alert.alert()` |
| `localStorage` | `SecureStore` / `AsyncStorage` |
| CSS hover states | Remove (no hover on touch) |

---

## 9. Project Structure

```
mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry/splash
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   └── (app)/
│       ├── _layout.tsx
│       └── (tabs)/
│           ├── _layout.tsx
│           ├── index.tsx         # Feedback
│           ├── matches/
│           ├── payments/
│           ├── admin/
│           └── profile.tsx
├── components/
│   ├── ui/                       # Base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── feedback/
│   │   ├── FeedbackCard.tsx
│   │   ├── FeedbackForm.tsx
│   │   └── StarRating.tsx
│   ├── matches/
│   │   ├── MatchCard.tsx
│   │   ├── MatchForm.tsx
│   │   └── SquadSelector.tsx
│   ├── payments/
│   │   ├── PaymentCard.tsx
│   │   └── PaymentForm.tsx
│   └── common/
│       ├── Header.tsx
│       ├── EmptyState.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── api.ts                    # Axios instance
│   ├── auth.ts                   # Auth service
│   ├── notifications.ts          # Push notifications
│   └── storage.ts                # SecureStore wrapper
├── stores/
│   ├── authStore.ts              # Zustand auth store
│   └── uiStore.ts                # UI state
├── hooks/
│   ├── useAuth.ts
│   ├── useFeedback.ts
│   ├── useMatches.ts
│   └── usePayments.ts
├── types/
│   └── index.ts                  # TypeScript types (reuse from web)
├── utils/
│   ├── date.ts
│   ├── format.ts
│   └── validation.ts
├── constants/
│   ├── colors.ts
│   └── config.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tailwind.config.js            # NativeWind config
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 10. Build & Deployment Guide

### 10.1 Development Setup

#### Prerequisites
```bash
# Node.js 18+ required
node --version  # v18.x or higher

# Install Expo CLI
npm install -g expo-cli eas-cli

# Install Xcode (macOS, for iOS)
# Install Android Studio (for Android)
```

#### Initialize Project
```bash
# Create new Expo project
npx create-expo-app@latest mobile --template expo-template-blank-typescript

cd mobile

# Install dependencies
npx expo install expo-router expo-linking expo-constants expo-status-bar
npx expo install nativewind tailwindcss
npx expo install @tanstack/react-query zustand axios
npx expo install expo-secure-store expo-auth-session expo-web-browser
npx expo install expo-notifications expo-device
npx expo install expo-image-picker expo-camera
npx expo install expo-haptics expo-blur
npx expo install @react-native-community/datetimepicker
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install @shopify/flash-list
npx expo install react-native-safe-area-context
```

#### Configure NativeWind
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          dark: '#047857',
        },
        surface: {
          DEFAULT: '#1E293B',
          hover: '#334155',
        },
      },
    },
  },
  plugins: [],
};
```

#### Configure Expo Router
```json
// app.json
{
  "expo": {
    "name": "Mavericks Cricket",
    "slug": "mavericks-cricket",
    "scheme": "mavericks",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mavericks.cricket",
      "infoPlist": {
        "NSCameraUsageDescription": "Used to capture payment screenshots",
        "NSPhotoLibraryUsageDescription": "Used to select payment screenshots"
      }
    },
    "android": {
      "package": "com.mavericks.cricket",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "VIBRATE"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#10B981"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Mavericks to access your photos for payment screenshots"
        }
      ]
    ]
  }
}
```

### 10.2 Running Locally

```bash
# Start development server
npx expo start

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android

# Run on physical device
# Scan QR code with Expo Go app
```

### 10.3 Building for Production

#### Setup EAS Build
```bash
# Login to Expo account
eas login

# Configure EAS
eas build:configure
```

#### EAS Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

#### Build Commands
```bash
# Build for iOS (App Store)
eas build --platform ios --profile production

# Build for Android (Play Store)
eas build --platform android --profile production

# Build both
eas build --platform all --profile production
```

### 10.4 App Store Submission

#### iOS (App Store Connect)
```bash
# Submit to App Store
eas submit --platform ios --profile production

# Or manually:
# 1. Download .ipa from EAS dashboard
# 2. Upload via Transporter app or Application Loader
# 3. Complete App Store Connect metadata
```

**Required Assets:**
- App Icon: 1024x1024 PNG (no alpha)
- Screenshots: 6.7", 6.5", 5.5" iPhone sizes
- iPad screenshots (if supporting tablets)
- App description, keywords, privacy policy URL

#### Android (Play Console)
```bash
# Submit to Play Store
eas submit --platform android --profile production

# Or manually:
# 1. Download .aab from EAS dashboard
# 2. Upload to Google Play Console
# 3. Complete store listing
```

**Required Assets:**
- App Icon: 512x512 PNG
- Feature Graphic: 1024x500
- Screenshots: Phone and tablet (if applicable)
- Store listing description
- Privacy policy URL

### 10.5 OTA Updates

```bash
# Push update to published apps (no app store review!)
eas update --branch production --message "Bug fix for payment screen"

# Updates JS/assets only, not native code
```

---

## 11. Testing Strategy

### 11.1 Unit Testing
```bash
npm install --save-dev jest @testing-library/react-native
```

```typescript
// __tests__/FeedbackCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import FeedbackCard from '../components/feedback/FeedbackCard';

describe('FeedbackCard', () => {
  it('renders player name', () => {
    const { getByText } = render(
      <FeedbackCard item={mockFeedback} onPress={jest.fn()} />
    );
    expect(getByText('John Doe')).toBeTruthy();
  });
});
```

### 11.2 E2E Testing (Detox)
```bash
npm install --save-dev detox
```

```typescript
// e2e/login.test.ts
describe('Login Flow', () => {
  it('should login with Google', async () => {
    await element(by.id('google-login-button')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

### 11.3 Manual Testing Checklist

#### iOS Specific
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 15 Pro Max (large screen)
- [ ] Test on iPad (if supported)
- [ ] Test with Dynamic Island
- [ ] Test in Dark Mode
- [ ] Test with VoiceOver (accessibility)
- [ ] Test push notifications
- [ ] Test deep links

#### Android Specific
- [ ] Test on small screen (5")
- [ ] Test on large screen (6.7")
- [ ] Test on tablet (if supported)
- [ ] Test with different navigation styles (gesture/buttons)
- [ ] Test with TalkBack (accessibility)
- [ ] Test push notifications
- [ ] Test deep links
- [ ] Test on Android 10, 12, 14

### 11.4 Beta Testing

#### iOS TestFlight
```bash
# Build and submit to TestFlight
eas build --platform ios --profile production
eas submit --platform ios

# Add testers in App Store Connect
# Testers receive invite via email
```

#### Android Internal Testing
```bash
# Build and submit to internal track
eas build --platform android --profile production
eas submit --platform android

# Add testers in Play Console
# Share opt-in link with testers
```

---

## 12. Timeline & Effort Estimation

### Estimated Timeline: 10-12 Weeks

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | 2 weeks | Project setup, auth, navigation |
| **Phase 2: Core Features** | 2 weeks | Feedback, matches, basic admin |
| **Phase 3: Advanced Features** | 2 weeks | Payments, WhatsApp, user mgmt |
| **Phase 4: Mobile Features** | 2 weeks | Push, offline, camera, deep links |
| **Phase 5: Polish & Test** | 2 weeks | UI polish, testing, bug fixes |
| **Phase 6: Deployment** | 2 weeks | Beta testing, store submission |

### Team Requirements
- **1 React Native Developer** (full-time)
- **Backend Developer** (part-time, for push notifications)
- **QA Tester** (part-time)

### Cost Considerations

| Item | Cost |
|------|------|
| **Apple Developer Account** | $99/year |
| **Google Play Developer Account** | $25 one-time |
| **EAS Build (Expo)** | Free tier: 30 builds/month |
| **Push Notifications** | Free with Expo |

---

## Appendix A: Environment Variables

```bash
# .env (mobile)
EXPO_PUBLIC_API_URL=https://mavericks11.duckdns.org/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

## Appendix B: Backend Changes Required

### New Endpoints Needed

```javascript
// 1. Mobile auth endpoint
POST /api/auth/google/mobile
Body: { accessToken: string }

// 2. Push token registration
POST /api/users/push-token
Body: { pushToken: string, platform: 'ios' | 'android' }

// 3. Send push notification (internal)
POST /api/notifications/send
Body: { userId: string, title: string, body: string, data: object }
```

### Existing Endpoints (No Changes)
All current API endpoints work as-is with mobile app.

---

## Appendix C: Google OAuth Setup for Mobile

### Google Cloud Console Setup

1. **Create OAuth 2.0 Client IDs:**
   - iOS: Bundle ID = `com.mavericks.cricket`
   - Android: Package name = `com.mavericks.cricket`, SHA-1 fingerprint
   - Web: Already exists (for backend verification)

2. **Get SHA-1 Fingerprint (Android):**
   ```bash
   # For debug
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release (EAS managed)
   eas credentials --platform android
   ```

3. **iOS URL Scheme:**
   - Reversed client ID as URL scheme
   - Example: `com.googleusercontent.apps.123456789-abcdefg`

---

## Next Steps

1. **Review this document** and confirm approach
2. **Set up Google Cloud Console** OAuth clients for mobile
3. **Create the mobile project** following Phase 1
4. **Start incremental development** with feedback form first

---

*This document will be updated as development progresses.*
