import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from './Theme';
import { Eye, EyeOff } from 'lucide-react-native';

export const Input = ({ label, icon: Icon, secureTextEntry, style, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        {Icon && <Icon size={16} color="#fff" style={styles.icon} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          selectionColor={Colors.primary}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            {showPassword
              ? <EyeOff size={18} color="#fff" />
              : <Eye size={18} color="#fff" />
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { color: Colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeBtn: { padding: 4 },
});
