import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const GAP = 8;
const H_PADDING = 20;
const CARD_WIDTH = (width - H_PADDING * 2 - GAP) / 2;

interface FoodCardProps {
  name: string;
  price: string;
  rating: number;
  emoji: string;
}

export default function FoodCard({ name, price, rating, emoji }: FoodCardProps) {
  const [liked, setLiked] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleHeartPress = () => {
    scale.value = withSpring(1.35, { damping: 4, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 6, stiffness: 200 });
    });
    setLiked((prev) => !prev);
  };

  return (
    <View style={styles.card}>
      {/* Heart button */}
      <TouchableOpacity onPress={handleHeartPress} style={styles.heartButton} activeOpacity={0.8}>
        <Animated.View style={animatedStyle}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? '#FF3B30' : '#B0B0B0'}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Food emoji */}
      <View style={styles.imageContainer}>
        <Text style={styles.foodEmoji}>{emoji}</Text>
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>{name}</Text>

      {/* Price + Rating */}
      <View style={styles.footer}>
        <Text style={styles.price}>{price}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color="#FFB800" />
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 12,
  },
  heartButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    marginVertical: 6,
  },
  foodEmoji: {
    fontSize: 68,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'DMSans_700Bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'DMSans_700Bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: 'DMSans_400Regular',
  },
});
