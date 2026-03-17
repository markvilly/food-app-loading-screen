import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import Animated from 'react-native-reanimated';

import Header from '../components/Header';
import CategoryPill from '../components/CategoryPill';
import PromoBanner from '../components/PromoBanner';
import FoodCard from '../components/FoodCard';
import {
  HandRefreshWrapper,
  PullLayer,
  usePullContext,
} from '../components/HandRefreshWrapper';

const CATEGORIES = [
  { id: 'ramen', emoji: '🍜', label: 'Ramen' },
  { id: 'sushi', emoji: '🍣', label: 'Sushi' },
  { id: 'rolls', emoji: '🥙', label: 'Rolls' },
  { id: 'soup', emoji: '🍲', label: 'Soup' },
];

const FOOD_ITEMS = [
  { name: 'Ichiraku Ramen', price: '$15.00', rating: 4.5, emoji: '🍜' },
  { name: 'Philadelphia roll', price: '$9.50', rating: 4.8, emoji: '🥙' },
  { name: 'Salmon sushi', price: '$7.00', rating: 5.0, emoji: '🍣' },
  { name: 'Miso soup', price: '$4.50', rating: 4.3, emoji: '🍲' },
];

// ─── Inner screen ─────────────────────────────────────────────────────────────
// Separate component so it can call usePullContext() while sitting inside
// the HandRefreshWrapper provider.

function HomeContent() {
  const { scrollHandler, nativeGesture } = usePullContext();
  const [activeCategory, setActiveCategory] = useState('ramen');

  const [_fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
  });

  return (
    <View style={styles.scrollWrapper}>
      {/* Native gesture registered here so the outer Pan can be simultaneous */}
      <GestureDetector gesture={nativeGesture}>
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Header — lightest, moves almost immediately, subtle scaleX breath */}
          <PullLayer multiplier={0.42} dragDelay={0} snapDelay={60} breathe>
            <Header />
          </PullLayer>

          {/* Category row — medium lag */}
          <PullLayer multiplier={0.32} dragDelay={15} snapDelay={40}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Popular Food</Text>
              <Text style={styles.viewAll}>view all</Text>
            </View>

            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContainer}
              style={styles.pillsScroll}
              scrollEventThrottle={16}
            >
              {CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  emoji={cat.emoji}
                  label={cat.label}
                  active={activeCategory === cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                />
              ))}
            </Animated.ScrollView>
          </PullLayer>

          {/* Promo Banner — heavier */}
          <PullLayer multiplier={0.25} dragDelay={30} snapDelay={20}>
            <PromoBanner />
          </PullLayer>

          {/* Food Grid — heaviest, lags the most, snaps back first */}
          <PullLayer multiplier={0.17} dragDelay={50} snapDelay={0}>
            <View style={styles.gridContainer}>
              {FOOD_ITEMS.map((item) => (
                <FoodCard
                  key={item.name}
                  name={item.name}
                  price={item.price}
                  rating={item.rating}
                  emoji={item.emoji}
                />
              ))}
            </View>
          </PullLayer>
        </Animated.ScrollView>
      </GestureDetector>

      <LinearGradient
        colors={['rgba(242, 238, 236, 1)', 'rgba(242, 238, 236, 0)']}
        style={styles.topFade}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <HandRefreshWrapper>
          <HomeContent />
        </HandRefreshWrapper>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: {
    paddingTop: 24,
    flex: 1,
    backgroundColor: '#F2EEEC',
  },
  scrollWrapper: {
    flex: 1,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F2EEEC',
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: 'DMSans_700Bold',
  },
  viewAll: {
    fontSize: 13,
    color: '#9E9E9E',
    fontFamily: 'DMSans_400Regular',
  },
  pillsScroll: {
    marginBottom: 18,
  },
  pillsContainer: {
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
  },
});
