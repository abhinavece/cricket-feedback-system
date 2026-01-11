import React, { useState } from 'react';
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getMatches } from '@/services/api';
import { Card, LoadingSpinner, EmptyState } from '@/components/ui';
import { Colors } from '@/constants/colors';
import type { Match } from '@/types';

type FilterType = 'all' | 'upcoming' | 'completed';

export default function MatchesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', { status: filter === 'all' ? undefined : filter }],
    queryFn: () => getMatches(filter === 'all' ? {} : { status: filter }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({ queryKey: ['matches'] });
    setRefreshing(false);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    Haptics.selectionAsync();
    setFilter(newFilter);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View className="flex-1 bg-slate-900">
      {/* Filter Tabs */}
      <View className="flex-row px-4 py-3 gap-2 border-b border-white/10">
        <FilterTab
          label="All"
          active={filter === 'all'}
          onPress={() => handleFilterChange('all')}
        />
        <FilterTab
          label="Upcoming"
          active={filter === 'upcoming'}
          onPress={() => handleFilterChange('upcoming')}
        />
        <FilterTab
          label="Completed"
          active={filter === 'completed'}
          onPress={() => handleFilterChange('completed')}
        />
      </View>

      {/* Match List */}
      <FlashList
        data={matches || []}
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => router.push(`/(app)/(tabs)/matches/${item._id}`)} />
        )}
        estimatedItemSize={120}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={() => (
          <EmptyState
            icon="calendar-outline"
            title="No Matches Found"
            message={filter === 'all' ? 'No matches scheduled yet' : `No ${filter} matches`}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.green}
            colors={[Colors.primary.green]}
          />
        }
      />
    </View>
  );
}

function FilterTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-800'}`}
    >
      <Text className={`font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MatchCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const matchDate = new Date(match.date);
  const isUpcoming = match.status === 'upcoming';
  
  const stats = match.squadStats || {
    total: 0,
    yes: 0,
    no: 0,
    tentative: 0,
    pending: 0,
  };

  return (
    <Card onPress={onPress}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">{match.opponent}</Text>
          <Text className="text-slate-400 text-sm mt-1">{match.venue}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          match.status === 'completed' ? 'bg-slate-700' :
          match.status === 'cancelled' ? 'bg-red-500/20' : 'bg-emerald-500/20'
        }`}>
          <Text className={`text-xs font-medium capitalize ${
            match.status === 'completed' ? 'text-slate-400' :
            match.status === 'cancelled' ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {match.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={14} color={Colors.text.muted} />
          <Text className="text-slate-400 text-sm">
            {matchDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={14} color={Colors.text.muted} />
          <Text className="text-slate-400 text-sm">{match.time}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="trophy-outline" size={14} color={Colors.text.muted} />
          <Text className="text-slate-400 text-sm capitalize">{match.matchType}</Text>
        </View>
      </View>

      {/* Squad Status */}
      {isUpcoming && stats.total > 0 && (
        <View className="flex-row items-center gap-3 pt-3 border-t border-white/10">
          <SquadStat icon="checkmark-circle" color="#10B981" value={stats.yes} />
          <SquadStat icon="close-circle" color="#EF4444" value={stats.no} />
          <SquadStat icon="help-circle" color="#F59E0B" value={stats.tentative} />
          <SquadStat icon="time" color="#64748B" value={stats.pending} />
          <View className="flex-1" />
          <Text className="text-slate-500 text-sm">{stats.total} players</Text>
        </View>
      )}
    </Card>
  );
}

function SquadStat({ icon, color, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color }} className="font-medium">{value}</Text>
    </View>
  );
}
