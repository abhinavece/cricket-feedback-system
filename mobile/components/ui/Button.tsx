import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const handlePress = (e: any) => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(e);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-emerald-500',
          text: 'text-white',
          border: '',
        };
      case 'secondary':
        return {
          bg: 'bg-slate-700',
          text: 'text-white',
          border: '',
        };
      case 'outline':
        return {
          bg: 'bg-transparent',
          text: 'text-emerald-500',
          border: 'border border-emerald-500',
        };
      case 'danger':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          border: '',
        };
      case 'ghost':
        return {
          bg: 'bg-transparent',
          text: 'text-slate-300',
          border: '',
        };
      default:
        return {
          bg: 'bg-emerald-500',
          text: 'text-white',
          border: '',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'px-3 py-2',
          text: 'text-sm',
        };
      case 'md':
        return {
          padding: 'px-4 py-3',
          text: 'text-base',
        };
      case 'lg':
        return {
          padding: 'px-6 py-4',
          text: 'text-lg',
        };
      default:
        return {
          padding: 'px-4 py-3',
          text: 'text-base',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      className={`
        ${variantStyles.bg}
        ${variantStyles.border}
        ${sizeStyles.padding}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl
        flex-row
        items-center
        justify-center
        ${isDisabled ? 'opacity-50' : 'active:opacity-80'}
      `}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary.green : '#fff'}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && iconPosition === 'left' && icon}
          <Text
            className={`
              ${variantStyles.text}
              ${sizeStyles.text}
              font-semibold
              text-center
            `}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </View>
      )}
    </TouchableOpacity>
  );
}
