import React from 'react';
import { View, ViewProps, TouchableOpacity } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  className?: string;
}

export default function Card({
  children,
  variant = 'default',
  onPress,
  className = '',
  style,
  ...props
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return 'bg-slate-800/50 border border-white/10';
      case 'elevated':
        return 'bg-slate-800 shadow-lg shadow-black/20';
      case 'outlined':
        return 'bg-transparent border border-slate-700';
      default:
        return 'bg-slate-800/50 border border-white/10';
    }
  };

  const baseStyles = `rounded-2xl p-4 ${getVariantStyles()} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={baseStyles}
        style={style}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseStyles} style={style} {...props}>
      {children}
    </View>
  );
}
