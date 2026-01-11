import React, { useState } from 'react';
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getPayments } from '@/services/api';
import { Card, LoadingSpinner, EmptyState } from '@/components/ui';
import { Colors } from '@/constants/colors';
import type { MatchPayment } from '@/types';

export default function PaymentsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({ queryKey: ['payments'] });
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View className="flex-1 bg-slate-900">
      {/* Summary Header */}
      {payments && payments.length > 0 && (
        <View className="p-4 border-b border-white/10">
          <View className="flex-row gap-3">
            <SummaryCard
              label="Total"
              value={`₹${payments.reduce((sum: number, p: MatchPayment) => sum + p.totalAmount, 0).toLocaleString()}`}
              color={Colors.text.primary}
            />
            <SummaryCard
              label="Collected"
              value={`₹${payments.reduce((sum: number, p: MatchPayment) => sum + p.collectedAmount, 0).toLocaleString()}`}
              color={Colors.primary.green}
            />
            <SummaryCard
              label="Pending"
              value={`₹${payments.reduce((sum: number, p: MatchPayment) => sum + p.pendingAmount, 0).toLocaleString()}`}
              color={Colors.accent.yellow}
            />
          </View>
        </View>
      )}

      {/* Payment List */}
      <FlashList
        data={payments || []}
        renderItem={({ item }) => <PaymentCard payment={item} />}
        estimatedItemSize={150}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={() => (
          <EmptyState
            icon="wallet-outline"
            title="No Payments"
            message="No payment records found"
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

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 bg-slate-800/50 rounded-xl p-3">
      <Text className="text-slate-400 text-xs mb-1">{label}</Text>
      <Text style={{ color }} className="text-lg font-bold">{value}</Text>
    </View>
  );
}

function PaymentCard({ payment }: { payment: MatchPayment }) {
  const match = typeof payment.matchId === 'object' ? payment.matchId : null;
  const progress = payment.totalAmount > 0 
    ? (payment.collectedAmount / payment.totalAmount) * 100 
    : 0;

  return (
    <Card>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {match?.opponent || 'Match Payment'}
          </Text>
          <Text className="text-slate-400 text-sm mt-1">
            {payment.squadMembers?.length || 0} players
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          payment.status === 'completed' ? 'bg-emerald-500/20' :
          payment.status === 'partial' ? 'bg-yellow-500/20' : 'bg-slate-700'
        }`}>
          <Text className={`text-xs font-medium capitalize ${
            payment.status === 'completed' ? 'text-emerald-400' :
            payment.status === 'partial' ? 'text-yellow-400' : 'text-slate-400'
          }`}>
            {payment.status}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <View 
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-slate-400 text-sm">
            ₹{payment.collectedAmount.toLocaleString()} collected
          </Text>
          <Text className="text-slate-400 text-sm">
            ₹{payment.totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Amount Details */}
      <View className="flex-row gap-4 pt-3 border-t border-white/10">
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary.green} />
          <Text className="text-emerald-400 text-sm font-medium">
            ₹{payment.collectedAmount.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="time" size={16} color={Colors.accent.yellow} />
          <Text className="text-yellow-400 text-sm font-medium">
            ₹{payment.pendingAmount.toLocaleString()}
          </Text>
        </View>
      </View>
    </Card>
  );
}
