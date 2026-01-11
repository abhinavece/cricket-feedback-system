import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { getStats, getMatches } from '@/services/api';
import { Card, Button, LoadingSpinner, EmptyState } from '@/components/ui';
import { Colors } from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', { status: 'upcoming' }],
    queryFn: () => getMatches({ status: 'upcoming' }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
      queryClient.invalidateQueries({ queryKey: ['matches'] }),
    ]);
    setRefreshing(false);
  };

  const upcomingMatches = matches?.slice(0, 3) || [];

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary.green}
          colors={[Colors.primary.green]}
        />
      }
    >
      {/* Welcome Section */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.2)', 'transparent']}
        className="px-4 pt-4 pb-6"
      >
        <Text className="text-slate-400 text-base">Welcome back,</Text>
        <Text className="text-white text-2xl font-bold">{user?.name || 'Player'}</Text>
      </LinearGradient>

      <View className="px-4 pb-8">
        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 bg-emerald-500/20 rounded-xl p-4 items-center border border-emerald-500/30"
            onPress={() => router.push('/(app)/(tabs)/matches')}
          >
            <Ionicons name="calendar" size={28} color={Colors.primary.green} />
            <Text className="text-emerald-400 font-medium mt-2">Matches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-blue-500/20 rounded-xl p-4 items-center border border-blue-500/30"
            onPress={() => Alert.alert('Coming Soon', 'Feedback form coming soon!')}
          >
            <Ionicons name="chatbox" size={28} color={Colors.accent.blue} />
            <Text className="text-blue-400 font-medium mt-2">Feedback</Text>
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity
              className="flex-1 bg-purple-500/20 rounded-xl p-4 items-center border border-purple-500/30"
              onPress={() => router.push('/(app)/(tabs)/admin')}
            >
              <Ionicons name="stats-chart" size={28} color={Colors.accent.purple} />
              <Text className="text-purple-400 font-medium mt-2">Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : stats ? (
          <Card className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Team Stats</Text>
            <View className="flex-row flex-wrap gap-4">
              <StatItem
                label="Feedback"
                value={stats.totalFeedback?.toString() || '0'}
                icon="chatbubbles"
              />
              <StatItem
                label="Avg Batting"
                value={stats.avgBatting?.toFixed(1) || '0'}
                icon="baseball"
              />
              <StatItem
                label="Avg Bowling"
                value={stats.avgBowling?.toFixed(1) || '0'}
                icon="disc"
              />
              <StatItem
                label="Team Spirit"
                value={stats.avgTeamSpirit?.toFixed(1) || '0'}
                icon="heart"
              />
            </View>
          </Card>
        ) : null}

        {/* Upcoming Matches */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">Upcoming Matches</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/matches')}>
              <Text className="text-emerald-400">See All</Text>
            </TouchableOpacity>
          </View>

          {matchesLoading ? (
            <LoadingSpinner />
          ) : upcomingMatches.length > 0 ? (
            <View className="gap-3">
              {upcomingMatches.map((match: any) => (
                <MatchPreviewCard key={match._id} match={match} />
              ))}
            </View>
          ) : (
            <Card>
              <View className="items-center py-4">
                <Ionicons name="calendar-outline" size={40} color={Colors.text.muted} />
                <Text className="text-slate-400 mt-2">No upcoming matches</Text>
              </View>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="flex-1 min-w-[45%] bg-slate-700/50 rounded-xl p-3">
      <View className="flex-row items-center gap-2 mb-1">
        <Ionicons name={icon} size={16} color={Colors.primary.green} />
        <Text className="text-slate-400 text-sm">{label}</Text>
      </View>
      <Text className="text-white text-xl font-bold">{value}</Text>
    </View>
  );
}

function MatchPreviewCard({ match }: { match: any }) {
  const router = useRouter();
  const matchDate = new Date(match.date);
  
  return (
    <Card onPress={() => router.push(`/(app)/(tabs)/matches/${match._id}`)}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{match.opponent}</Text>
          <Text className="text-slate-400 text-sm mt-1">{match.venue}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <Ionicons name="calendar-outline" size={14} color={Colors.text.muted} />
            <Text className="text-slate-400 text-sm">
              {matchDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text className="text-slate-500">•</Text>
            <Text className="text-slate-400 text-sm">{match.time}</Text>
          </View>
        </View>
        <View className="bg-slate-700 px-3 py-1 rounded-full">
          <Text className="text-emerald-400 text-xs font-medium capitalize">
            {match.matchType}
          </Text>
        </View>
      </View>
    </Card>
  );
}
