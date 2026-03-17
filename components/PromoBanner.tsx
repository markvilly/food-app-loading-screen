import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function PromoBanner() {
  return (
    <View style={styles.card}>
      {/* Left food visual */}
      <View style={styles.imageSection}>
        <Text style={styles.foodEmoji}>🍱</Text>
      </View>

      {/* Right text */}
      <View style={styles.textSection}>
        <Text style={styles.discountTitle}>Discount 50%</Text>
        <Text style={styles.learnMore}>learn more...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    height: 130,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  imageSection: {
    width: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2E',
  },
  foodEmoji: {
    fontSize: 64,
    transform: [{ rotate: '-10deg' }],
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 12,
  },
  discountTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 30,
    fontFamily: 'DMSans_400Regular',
  },
  learnMore: {
    marginTop: 6,
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'DMSans_400Regular',
  },
});
