import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { Card, Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { APP_VERSION } from '@/constants/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleMenuPress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action) {
      case 'notifications':
        Alert.alert('Coming Soon', 'Notification settings coming soon!');
        break;
      case 'privacy':
        Linking.openURL('https://mavericks11.duckdns.org/privacy');
        break;
      case 'terms':
        Linking.openURL('https://mavericks11.duckdns.org/terms');
        break;
      case 'support':
        Linking.openURL('mailto:support@mavericks11.com');
        break;
      case 'rate':
        Alert.alert('Coming Soon', 'App Store rating coming soon!');
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="p-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <View className="items-center py-4">
            <View className="w-24 h-24 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
              {user?.avatar ? (
                <Text className="text-4xl">👤</Text>
              ) : (
                <Text className="text-4xl">{user?.name?.charAt(0) || '?'}</Text>
              )}
            </View>
            <Text className="text-white text-xl font-bold">{user?.name}</Text>
            <Text className="text-slate-400">{user?.email}</Text>
            <View className="mt-2 px-3 py-1 rounded-full bg-emerald-500/20">
              <Text className="text-emerald-400 text-sm font-medium capitalize">
                {user?.role}
              </Text>
            </View>
          </View>
        </Card>

        {/* Menu Sections */}
        <Text className="text-white text-lg font-semibold mb-3">Settings</Text>
        <View className="gap-3 mb-6">
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => handleMenuPress('notifications')}
          />
        </View>

        <Text className="text-white text-lg font-semibold mb-3">About</Text>
        <View className="gap-3 mb-6">
          <MenuItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => handleMenuPress('privacy')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => handleMenuPress('terms')}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Support"
            onPress={() => handleMenuPress('support')}
          />
          <MenuItem
            icon="star-outline"
            label="Rate the App"
            onPress={() => handleMenuPress('rate')}
          />
        </View>

        {/* App Info */}
        <Card className="mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center">
                <Text className="text-xl">🏏</Text>
              </View>
              <View>
                <Text className="text-white font-medium">Mavericks Cricket</Text>
                <Text className="text-slate-400 text-sm">Version {APP_VERSION}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          fullWidth
          icon={<Ionicons name="log-out-outline" size={20} color="white" />}
        />

        {/* Footer */}
        <View className="items-center mt-8 mb-4">
          <Text className="text-slate-500 text-sm">
            Made with ❤️ for Mavericks Cricket Club
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, showBadge }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showBadge?: boolean;
}) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-4">
        <View className="w-10 h-10 rounded-xl bg-slate-700 items-center justify-center">
          <Ionicons name={icon} size={20} color={Colors.text.secondary} />
        </View>
        <Text className="flex-1 text-white font-medium">{label}</Text>
        {showBadge && (
          <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
        )}
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      </View>
    </Card>
  );
}
