import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header() {
  return (
    <View style={styles.container}>
      {/* Search Icon */}
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="search-outline" size={24} color="#9E9E9E" />
      </TouchableOpacity>

      {/* Location */}
      <View style={styles.locationWrapper}>
        <Text style={styles.locationLabel}>location:</Text>
        <Text style={styles.locationCity}>New York</Text>
      </View>

      {/* Avatar with notification dot */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>👩‍🦱</Text>
        </View>
        <View style={styles.notificationDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  locationWrapper: {
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontFamily: 'DMSans_400Regular',
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'DMSans_700Bold',
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D0E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  notificationDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#F2EEEC',
  },
});
