# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Cricket Feedback application.

## 🚀 Features Implemented

### Role-Based Permissions
- **👀 Viewer**: Can only submit feedback
- **✏️ Editor**: Can submit feedback + view dashboard + edit feedback
- **👑 Admin**: Full access including user management

### Authentication Features
- **🔐 Google OAuth Integration**: Secure Google sign-in
- **🎫 JWT Tokens**: Secure session management
- **👥 User Management**: Track users and roles
- **🛡️ Protected Routes**: Permission-based access control
- **📱 Responsive UI**: Works on all devices

## 📋 Setup Instructions

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add authorized origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Add authorized redirect URIs:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)

4. **Get Your Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Keep them secure!

### 2. Backend Configuration

Update `backend/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Frontend Configuration

Update `frontend/.env`:

```env
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

### 4. Restart Services

```bash
# Restart backend
cd backend && npm start

# Restart frontend
cd frontend && npm start
```

## 🎯 How It Works

### User Registration Flow
1. **First Time User**: Signs in with Google
2. **Auto-Registration**: User is created with 'viewer' role
3. **Default Permissions**: Can only submit feedback
4. **Admin Upgrade**: Admin can promote users to higher roles

### Permission System
```javascript
const permissions = {
  viewer: ['submit_feedback'],
  editor: ['submit_feedback', 'view_dashboard', 'edit_feedback'],
  admin: ['submit_feedback', 'view_dashboard', 'edit_feedback', 'manage_users', 'delete_feedback'],
};
```

### Access Control
- **Feedback Form**: All authenticated users
- **Admin Dashboard**: Editor and Admin roles only
- **User Management**: Admin role only
- **Delete Feedback**: Admin role only

## 🧪 Testing the System

### 1. Test Google Sign-In
```bash
# Navigate to http://localhost:3000
# Click "Sign in with Google"
# Complete Google authentication
```

### 2. Test Role-Based Access
```bash
# Test as Viewer (default):
- Can submit feedback ✅
- Cannot access admin dashboard ❌

# Test as Editor (admin promotion needed):
- Can submit feedback ✅
- Can access admin dashboard ✅
- Cannot manage users ❌

# Test as Admin (admin promotion needed):
- Full access to all features ✅
```

### 3. Test User Management (Admin Only)
```bash
# Access admin dashboard
# Look for user management section
# Promote users to different roles
# Test permission changes
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:id/role` - Update user role (admin only)

### Protected Resources
- All feedback endpoints now require authentication
- Admin endpoints require appropriate permissions

## 🛡️ Security Features

### JWT Token Management
- **24-hour expiration**: Auto-logout after 24 hours
- **Secure storage**: Tokens stored in localStorage
- **Automatic refresh**: Token verification on each request

### Role-Based Access
- **Permission checks**: Server-side validation
- **Route protection**: Client-side guards
- **API security**: All endpoints protected

### Google OAuth Security
- **Verified tokens**: Google token verification
- **Secure flow**: OAuth 2.0 implementation
- **No password storage**: Google handles authentication

## 📱 User Experience

### Sign-In Flow
1. **Welcome Screen**: Clean Google sign-in button
2. **One-Click Auth**: No password required
3. **Profile Display**: User avatar and name in navigation
4. **Role Indicator**: User role shown in UI

### Navigation Updates
- **User Profile**: Avatar, name, and role display
- **Smart Navigation**: Admin dashboard only shows for authorized users
- **Easy Logout**: One-click logout with Google session cleanup

## 🚀 Production Deployment

### Environment Variables
```env
# Production .env
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
JWT_SECRET=your-production-jwt-secret
REACT_APP_GOOGLE_CLIENT_ID=your-production-client-id
```

### Security Considerations
- **HTTPS Required**: Google OAuth requires HTTPS in production
- **Domain Whitelist**: Add your production domain to Google Console
- **Secret Management**: Use environment variables, never commit secrets
- **JWT Security**: Use strong, unique JWT secret

## 🎉 Benefits

### For Users
- **No Passwords**: Secure Google authentication
- **Single Sign-On**: Use existing Google account
- **Professional UI**: Clean, modern interface

### For Administrators
- **Role Management**: Granular permission control
- **User Tracking**: See who submitted feedback
- **Security**: Google-verified identities
- **Scalability**: Easy to add new permissions

### For Developers
- **Secure Authentication**: Industry-standard OAuth
- **Maintainable**: Clean permission system
- **Extensible**: Easy to add new roles and permissions
- **Modern**: React + JWT best practices

## 🆘 Troubleshooting

### Common Issues
1. **"Invalid Client"**: Check Google Client ID configuration
2. **"Redirect URI Mismatch"**: Verify authorized origins in Google Console
3. **"Token Expired"**: Users need to sign in again after 24 hours
4. **"Access Denied"**: Check user role permissions

### Debug Tips
- Check browser console for errors
- Verify environment variables are set
- Ensure Google OAuth is properly configured
- Check network requests in browser dev tools

---

**🎯 Next Steps**: Set up your Google OAuth credentials and test the authentication system!
