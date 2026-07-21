import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {colors, font, radius, spacing} from '../theme';

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}) {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.btn,
        isOutline ? styles.btnOutline : styles.btnPrimary,
        isDisabled && {opacity: 0.6},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.textOnPrimary} />
      ) : (
        <Text style={[styles.btnText, isOutline && {color: colors.primary}]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function TextField({
  label,
  error,
  style,
  ...props
}: TextInputProps & {label?: string; error?: string}) {
  return (
    <View style={{marginBottom: spacing.md}}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && {borderColor: colors.danger}, style]}
        {...props}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimary: {backgroundColor: colors.primary},
  btnOutline: {backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary},
  btnText: {color: colors.textOnPrimary, fontSize: font.size.md, fontWeight: font.weight.bold},
  label: {fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: font.weight.medium},
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.size.md,
    color: colors.text,
    backgroundColor: colors.inputBg,
  },
  errorText: {color: colors.danger, fontSize: font.size.xs, marginTop: spacing.xs},
});
