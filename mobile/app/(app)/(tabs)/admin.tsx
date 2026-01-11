import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { getStats, getUsers } from '@/services/api';
import { Card, LoadingSpinner } from '@/components/ui';
import { Colors } from '@/constants/colors';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const handleMenuPress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action) {
      case 'users':
        Alert.alert('Coming Soon', 'User management screen coming soon!');
        break;
      case 'whatsapp':
        Alert.alert('Coming Soon', 'WhatsApp messaging coming soon!');
        break;
      case 'feedback':
        Alert.alert('Coming Soon', 'Feedback management coming soon!');
        break;
      case 'settings':
        Alert.alert('Coming Soon', 'Settings coming soon!');
        break;
      default:
        break;
    }
  };

  const openWebDashboard = () => {
    Linking.openURL('https://mavericks11.duckdns.org');
  };

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="p-4">
        {/* Admin Info */}
        <Card className="mb-6">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-emerald-500/20 items-center justify-center">
              <Ionicons name="shield-checkmark" size={28} color={Colors.primary.green} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">{user?.name}</Text>
              <Text className="text-emerald-400 text-sm capitalize">{user?.role} Access</Text>
            </View>
          </View>
        </Card>

        {/* Quick Stats */}
        <Text className="text-white text-lg font-semibold mb-3">Dashboard Stats</Text>
        <View className="flex-row gap-3 mb-6">
          {statsLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <StatCard
                icon="chatbubbles"
                label="Feedback"
                value={stats?.totalFeedback?.toString() || '0'}
                color={Colors.accent.blue}
              />
              <StatCard
                icon="people"
                label="Users"
                value={users?.length?.toString() || '0'}
                color={Colors.accent.purple}
              />
            </>
          )}
        </View>

        {/* Admin Menu */}
        <Text className="text-white text-lg font-semibold mb-3">Admin Actions</Text>
        <View className="gap-3 mb-6">
          <AdminMenuItem
            icon="people-outline"
            label="User Management"
            description="Manage user roles and permissions"
            onPress={() => handleMenuPress('users')}
          />
          <AdminMenuItem
            icon="logo-whatsapp"
            label="WhatsApp Messaging"
            description="Send team notifications"
            onPress={() => handleMenuPress('whatsapp')}
          />
          <AdminMenuItem
            icon="chatbox-outline"
            label="Feedback Management"
            description="Review and manage feedback"
            onPress={() => handleMenuPress('feedback')}
          />
          <AdminMenuItem
            icon="settings-outline"
            label="Settings"
            description="App configuration"
            onPress={() => handleMenuPress('settings')}
          />
        </View>

        {/* Web Dashboard Link */}
        <Card className="mb-6">
          <TouchableOpacity
            onPress={openWebDashboard}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                <Ionicons name="globe-outline" size={20} color={Colors.accent.blue} />
              </View>
              <View>
                <Text className="text-white font-medium">Open Web Dashboard</Text>
                <Text className="text-slate-400 text-sm">Full admin features</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="flex-1">
      <View className="items-center">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text className="text-white text-2xl font-bold">{value}</Text>
        <Text className="text-slate-400 text-sm">{label}</Text>
      </View>
    </Card>
  );
}

function AdminMenuItem({ icon, label, description, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-4">
        <View className="w-12 h-12 rounded-xl bg-slate-700 items-center justify-center">
          <Ionicons name={icon} size={24} color={Colors.text.secondary} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium">{label}</Text>
          <Text className="text-slate-400 text-sm">{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      </View>
    </Card>
  );
}
