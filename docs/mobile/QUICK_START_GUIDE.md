# Quick Start Guide - React Native Mobile App

## Prerequisites Checklist

### Required Software
- [ ] **Node.js 18+** - `node --version`
- [ ] **npm 9+** or yarn - `npm --version`
- [ ] **Git** - `git --version`
- [ ] **Expo CLI** - `npm install -g expo-cli eas-cli`

### For iOS Development (macOS only)
- [ ] **macOS** (required for iOS builds)
- [ ] **Xcode 15+** from App Store
- [ ] **Xcode Command Line Tools** - `xcode-select --install`
- [ ] **CocoaPods** - `sudo gem install cocoapods`
- [ ] **iOS Simulator** (installed with Xcode)

### For Android Development
- [ ] **Android Studio** (latest)
- [ ] **Android SDK** (API 34+)
- [ ] **Android Emulator** or physical device
- [ ] **Java 17** - `java --version`

### Accounts Required
- [ ] **Expo Account** - https://expo.dev/signup (free)
- [ ] **Apple Developer Account** - $99/year (for App Store)
- [ ] **Google Play Developer Account** - $25 one-time (for Play Store)
- [ ] **Google Cloud Console** - OAuth credentials

---

## Step 1: Initialize Project

```bash
# Navigate to project root
cd /Users/abhinav/Documents/FUN_PROJECTS/survey-project

# Create mobile directory
npx create-expo-app@latest mobile --template expo-template-blank-typescript

cd mobile
```

## Step 2: Install Dependencies

```bash
# Core dependencies
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens

# Styling (NativeWind - Tailwind for RN)
npx expo install nativewind
npm install --save-dev tailwindcss@3.3.2

# State & Data
npm install @tanstack/react-query zustand axios

# Authentication
npx expo install expo-secure-store expo-auth-session expo-web-browser expo-crypto

# UI Components
npx expo install @react-native-community/datetimepicker
npx expo install expo-blur expo-haptics expo-linear-gradient

# Media
npx expo install expo-image-picker expo-camera

# Push Notifications
npx expo install expo-notifications expo-device

# Performance
npx expo install @shopify/flash-list
npx expo install react-native-reanimated react-native-gesture-handler
```

## Step 3: Configure Project

### 3.1 Update `package.json`
```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  }
}
```

### 3.2 Create `tailwind.config.js`
```javascript
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          dark: '#047857',
          light: 'rgba(16, 185, 129, 0.1)',
        },
        surface: {
          DEFAULT: '#1E293B',
          dark: '#0F172A',
          hover: '#334155',
        },
        accent: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
        },
      },
    },
  },
  plugins: [],
};
```

### 3.3 Update `babel.config.js`
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

### 3.4 Create `nativewind-env.d.ts`
```typescript
/// <reference types="nativewind/types" />
```

### 3.5 Update `app.json`
```json
{
  "expo": {
    "name": "Mavericks Cricket",
    "slug": "mavericks-cricket",
    "scheme": "mavericks",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.mavericks.cricket",
      "infoPlist": {
        "NSCameraUsageDescription": "Used to capture payment screenshots",
        "NSPhotoLibraryUsageDescription": "Used to select payment screenshots"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.mavericks.cricket",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "VIBRATE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#10B981"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Step 4: Create Initial File Structure

```bash
# Create directories
mkdir -p app/\(auth\)
mkdir -p app/\(app\)/\(tabs\)/matches
mkdir -p app/\(app\)/\(tabs\)/payments
mkdir -p app/\(app\)/\(tabs\)/admin
mkdir -p components/ui
mkdir -p components/feedback
mkdir -p components/matches
mkdir -p components/payments
mkdir -p services
mkdir -p stores
mkdir -p hooks
mkdir -p types
mkdir -p utils
mkdir -p constants
```

## Step 5: Run Development Server

```bash
# Start Expo development server
npx expo start

# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go app for physical device
```

---

## Google OAuth Setup for Mobile

### Step 1: Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select your existing project (Cricket Feedback)
3. Navigate to **APIs & Services > Credentials**

### Step 2: Create OAuth Client IDs

#### iOS Client
1. Click **Create Credentials > OAuth client ID**
2. Application type: **iOS**
3. Name: `Mavericks Cricket iOS`
4. Bundle ID: `com.mavericks.cricket`
5. Save the **Client ID**

#### Android Client
1. Click **Create Credentials > OAuth client ID**
2. Application type: **Android**
3. Name: `Mavericks Cricket Android`
4. Package name: `com.mavericks.cricket`
5. SHA-1 fingerprint: Get from EAS or debug keystore
   ```bash
   # Debug fingerprint
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
   ```
6. Save the **Client ID**

### Step 3: Update Environment Variables

Create `.env` in mobile directory:
```bash
EXPO_PUBLIC_API_URL=https://mavericks11.duckdns.org/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-existing-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-new-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-new-android-client-id
```

---

## Backend Changes Required

### Add Mobile Auth Endpoint

Add to `backend/routes/auth.js`:

```javascript
// Mobile Google OAuth (uses access token instead of credential)
router.post('/google/mobile', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }
    
    // Fetch user info from Google using access token
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    
    const googleUser = await response.json();
    
    // Find or create user (same logic as web auth)
    let user = await User.findOne({ email: googleUser.email });
    
    if (!user) {
      // Check if user is pre-authorized
      const isAdmin = ['your-admin-email@gmail.com'].includes(googleUser.email);
      
      user = new User({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        googleId: googleUser.id,
        role: isAdmin ? 'admin' : 'viewer',
      });
      await user.save();
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Mobile auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

### Add Push Token Endpoint

Add to `backend/routes/auth.js` or create `backend/routes/notifications.js`:

```javascript
// Register push notification token
router.post('/push-token', auth, async (req, res) => {
  try {
    const { pushToken, platform } = req.body;
    
    await User.findByIdAndUpdate(req.user.userId, {
      pushToken,
      pushPlatform: platform,
      pushTokenUpdatedAt: new Date(),
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Push token error:', error);
    res.status(500).json({ error: 'Failed to save push token' });
  }
});
```

---

## Testing Commands

```bash
# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android

# Run on physical device (Expo Go)
npx expo start --tunnel

# Build preview APK (Android)
eas build --platform android --profile preview

# Build for TestFlight (iOS)
eas build --platform ios --profile production
```

---

## Common Issues & Solutions

### Issue: "Unable to resolve module"
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### Issue: iOS Simulator not launching
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

### Issue: Android build fails
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Issue: NativeWind styles not applying
1. Check `babel.config.js` has NativeWind preset
2. Ensure `nativewind-env.d.ts` exists
3. Restart Metro bundler with cache clear: `npx expo start -c`

---

## Next Steps After Setup

1. **Copy types** from `frontend/src/types/` to `mobile/types/`
2. **Create API service** based on `frontend/src/services/api.ts`
3. **Build auth flow** with Google Sign-In
4. **Create first screen** (Feedback Form)
5. **Test on both platforms**

See `REACT_NATIVE_MIGRATION_PLAN.md` for detailed component migration guide.
