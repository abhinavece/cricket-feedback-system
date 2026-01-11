import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // Small delay for splash effect
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(app)/(tabs)');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <View className="w-32 h-32 rounded-full bg-emerald-500/20 items-center justify-center mb-8 shadow-lg">
          <View className="w-24 h-24 rounded-full bg-emerald-500/30 items-center justify-center">
            <Text className="text-5xl">🏏</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-4xl font-bold text-white text-center mb-2">
          Mavericks
        </Text>
        <Text className="text-xl text-emerald-400 font-semibold mb-4">
          Cricket Club
        </Text>
        <Text className="text-slate-400 text-center text-base mb-12 leading-6">
          Manage your team, track matches,{'\n'}and stay connected
        </Text>

        {/* Features */}
        <View className="w-full mb-12">
          <FeatureItem icon="📊" text="Match & Squad Management" />
          <FeatureItem icon="💰" text="Payment Tracking" />
          <FeatureItem icon="📝" text="Performance Feedback" />
          <FeatureItem icon="💬" text="WhatsApp Integration" />
        </View>

        {/* CTA Button */}
        {!isAuthenticated && (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            size="lg"
            fullWidth
          />
        )}
      </View>

      {/* Footer */}
      <View className="pb-8 items-center">
        <Text className="text-slate-500 text-sm">
          Version 1.0.0
        </Text>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <Text className="text-2xl mr-4">{icon}</Text>
      <Text className="text-slate-300 text-base">{text}</Text>
    </View>
  );
}
