import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  showLabel?: boolean;
  label?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 32,
  onChange,
  readonly = false,
  showLabel = false,
  label,
}: StarRatingProps) {
  const handlePress = (value: number) => {
    if (!readonly && onChange) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value);
    }
  };

  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= rating;
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => handlePress(i)}
        disabled={readonly}
        className="mx-1"
        activeOpacity={readonly ? 1 : 0.7}
      >
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={size}
          color={filled ? Colors.accent.yellow : Colors.text.muted}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {(showLabel || label) && (
        <Text className="text-slate-300 text-sm font-medium mb-2">
          {label || `Rating: ${rating}/${maxRating}`}
        </Text>
      )}
      <View className="flex-row items-center">{stars}</View>
    </View>
  );
}
