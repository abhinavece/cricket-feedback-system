import React, { useState } from 'react';
import { View, Text, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { loginWithGoogle } from '@/services/api';
import { Button } from '@/components/ui';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
} from '@/constants/config';
import { Colors } from '@/constants/colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        await authenticateWithBackend(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  const authenticateWithBackend = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle(accessToken);
      await setAuth(result.token, result.user);
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert(
        'Authentication Failed',
        error.response?.data?.error || 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    promptAsync();
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 rounded-full bg-emerald-500/20 items-center justify-center mb-6">
            <Text className="text-4xl">🏏</Text>
          </View>
          <Text className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </Text>
          <Text className="text-slate-400 text-center">
            Sign in to access your team dashboard
          </Text>
        </View>

        {/* Login Button */}
        <View className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
          <Button
            title={isLoading ? 'Signing in...' : 'Continue with Google'}
            onPress={handleGoogleSignIn}
            loading={isLoading}
            disabled={!request || isLoading}
            variant="primary"
            size="lg"
            fullWidth
            icon={
              !isLoading && (
                <Ionicons name="logo-google" size={20} color="white" />
              )
            }
          />

          <Text className="text-slate-500 text-center text-sm mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Help Text */}
        <View className="mt-8 items-center">
          <Text className="text-slate-400 text-sm text-center">
            Only authorized team members can access the app.
          </Text>
          <Text className="text-slate-400 text-sm text-center mt-1">
            Contact your admin if you need access.
          </Text>
        </View>
      </View>

      {/* Back Button */}
      <View className="absolute top-16 left-4">
        <Button
          title=""
          variant="ghost"
          onPress={() => router.back()}
          icon={<Ionicons name="arrow-back" size={24} color={Colors.text.primary} />}
        />
      </View>
    </LinearGradient>
  );
}
