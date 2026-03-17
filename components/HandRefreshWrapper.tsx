import React, { createContext, useContext } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  withDelay,
  withTiming,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';

const MAX_DRAG = 75;
const DRAG_DAMPING = 0.22;

interface PullContextValue {
  dragY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  nativeGesture: ReturnType<typeof Gesture.Native>;
}

const PullContext = createContext<PullContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function HandRefreshWrapper({ children }: { children: React.ReactNode }) {
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const nativeGesture = Gesture.Native();

  const panGesture = Gesture.Pan()
    .simultaneousWithExternalGesture(nativeGesture)
    .onUpdate((e) => {
      if (scrollY.value <= 2 && e.translationY > 0) {
        isDragging.value = true;
        dragY.value = Math.min(e.translationY * DRAG_DAMPING, MAX_DRAG);
      }
    })
    .onEnd(() => {
      // Set isDragging false first so each layer's snap-back reaction fires
      // before the dragY=0 reaction can interfere.
      isDragging.value = false;
      dragY.value = 0;
    });

  return (
    <PullContext.Provider value={{ dragY, isDragging, scrollHandler, nativeGesture }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={{ flex: 1 }}>
          {children}
        </Animated.View>
      </GestureDetector>
    </PullContext.Provider>
  );
}

// ─── PullLayer ────────────────────────────────────────────────────────────────
// Wrap each UI section with this. Multiplier controls how far the layer moves,
// dragDelay controls the "mass lag" during pull, snapDelay controls the
// staggered return (reversed order — grid first, header last).

interface PullLayerProps {
  children: React.ReactNode;
  multiplier: number;
  dragDelay: number;
  snapDelay: number;
  // Header-only: a subtle scaleX breath at max drag to suggest the lightest
  // layer stretching under tension (1.0 → 1.015).
  breathe?: boolean;
  style?: object;
}

export function PullLayer({
  children,
  multiplier,
  dragDelay,
  snapDelay,
  breathe = false,
  style,
}: PullLayerProps) {
  const ctx = useContext(PullContext);
  if (!ctx) throw new Error('PullLayer must be inside HandRefreshWrapper');

  const { dragY, isDragging } = ctx;
  const layerY = useSharedValue(0);

  // ── Drag phase ──────────────────────────────────────────────────────────
  // Each frame we reschedule "arrive at target in dragDelay ms", so the layer
  // perpetually lags behind the finger by exactly dragDelay milliseconds.
  // withTiming(duration:0) makes the arrival instant (no easing on top).
  useAnimatedReaction(
    () => dragY.value,
    (y) => {
      if (isDragging.value && y > 0) {
        layerY.value = withDelay(
          dragDelay,
          withTiming(y * multiplier, { duration: 0 }),
        );
      }
    },
  );

  // ── Snap-back phase ─────────────────────────────────────────────────────
  // Fires once when isDragging flips false. Reversed snap delay (heavy layers
  // snap first, light layers last) creates a "cloth pulled from the bottom".
  useAnimatedReaction(
    () => isDragging.value,
    (dragging, prev) => {
      if (!dragging && prev === true) {
        // Heavier layers (lower multiplier) get softer springs to feel denser.
        const damping = 12 + (1 - multiplier) * 8;
        const stiffness = 140 + (1 - multiplier) * 60;
        layerY.value = withDelay(
          snapDelay,
          withSpring(0, { damping, stiffness }),
        );
      }
    },
  );

  const animStyle = useAnimatedStyle(() => {
    type Transform = { translateY: number } | { scaleX: number };
    const transforms: Transform[] = [{ translateY: layerY.value }];

    if (breathe) {
      const progress = Math.min(Math.max(dragY.value, 0), MAX_DRAG) / MAX_DRAG;
      transforms.push({ scaleX: 1 + progress * 0.015 });
    }

    return { transform: transforms };
  });

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePullContext() {
  const ctx = useContext(PullContext);
  if (!ctx) throw new Error('usePullContext must be inside HandRefreshWrapper');
  return ctx;
}
