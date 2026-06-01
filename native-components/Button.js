import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from './Theme';

export const Button = ({ title, onPress, variant = 'primary', loading = false, style, textStyle, icon: Icon }) => {
  const isSecondary = variant === 'secondary';
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading}
      style={[
        styles.button, 
        isSecondary ? styles.secondary : styles.primary,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text} />
      ) : (
        <>
          {Icon && <Icon size={18} color={Colors.text} style={{ marginRight: 8 }} />}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
