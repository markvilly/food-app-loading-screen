import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CategoryPillProps {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function CategoryPill({ emoji, label, active, onPress }: CategoryPillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  pillActive: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emoji: {
    fontSize: 18,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: 'DMSans_400Regular',
  },
  labelActive: {
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'DMSans_700Bold',
  },
});
