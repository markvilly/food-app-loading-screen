import React, { createContext, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  withDelay,
  withTiming,
  withSpring,
  Easing,
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

// ─── HandView ─────────────────────────────────────────────────────────────────
// Pure visual — owns zero animation logic.
// To swap in a Rive asset: replace only the JSX inside this component.
// All transforms (translateY, scaleX/Y) are applied by RefreshZone's
// Animated.View wrapper, so the Rive runtime will receive them automatically.

function HandView() {
  return (
    <View style={handStyles.root}>
      <Text style={handStyles.emoji}>🤌</Text>
    </View>
  );
}

const handStyles = StyleSheet.create({
  root: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
});

// ─── RefreshZone ──────────────────────────────────────────────────────────────
// Tablecloth that reveals from the top as the user pulls down.
// Drop <RefreshZone /> as an absolute-positioned sibling of the ScrollView
// inside the scrollWrapper — it reads from PullContext so no props needed.
//
// 4-beat release sequence (all on UI thread via Reanimated):
//   Beat 1 – Compress   hand squashes wide & flat   (0 → 80 ms)
//   Beat 2 – Stretch    hand elongates tall          (80 → 135 ms)
//   Beat 3 – Flick      hand whips upward, cloth snaps away (135 ms+, spring)
//   Beat 4 – Settle     hand floats back, spring decays     (implicit)

export function RefreshZone() {
  const { dragY, isDragging } = usePullContext();

  // Cloth tracks dragY directly during pull; springs to 0 on release.
  const clothHeight = useSharedValue(0);

  // Hand transform values — all start neutral.
  const handOpacity = useSharedValue(0);
  const handY      = useSharedValue(0);
  const handScaleX = useSharedValue(1);
  const handScaleY = useSharedValue(1);

  // ── Track drag ────────────────────────────────────────────────────────────
  useAnimatedReaction(
    () => dragY.value,
    (y) => {
      if (isDragging.value) {
        clothHeight.value = y;
        // Fade the hand in over the first 28 px of drag.
        handOpacity.value = Math.min(y / 28, 1);
      }
    },
  );

  // ── Reset on new drag (so stale state from a cancelled sequence is cleared) ─
  useAnimatedReaction(
    () => isDragging.value,
    (dragging, prev) => {
      if (dragging && !prev) {
        handScaleX.value = 1;
        handScaleY.value = 1;
        handY.value      = 0;
      }

      // ── 4-beat release sequence ───────────────────────────────────────────
      if (!dragging && prev === true) {
        // Beat 1 – Compress: squash wide and flat
        handScaleX.value = withTiming(1.35, {
          duration: 80,
          easing: Easing.out(Easing.quad),
        });
        handScaleY.value = withTiming(0.6, {
          duration: 80,
          easing: Easing.out(Easing.quad),
        }, (done) => {
          if (!done) return;

          // Beat 2 – Stretch: elongate tall (anticipation)
          handScaleX.value = withTiming(0.72, { duration: 55, easing: Easing.in(Easing.quad) });
          handScaleY.value = withTiming(1.5, {
            duration: 55,
            easing: Easing.in(Easing.quad),
          }, (done2) => {
            if (!done2) return;

            // Beat 3 – Flick: whip upward, cloth collapses
            handScaleX.value = withSpring(1, { damping: 5, stiffness: 400 });
            handScaleY.value = withSpring(1, { damping: 5, stiffness: 400 });
            handY.value = withSpring(-30, { damping: 4, stiffness: 580 }, (done3) => {
              if (!done3) return;

              // Beat 4 – Settle: float back to rest
              handY.value = withSpring(0, { damping: 14, stiffness: 140 });
            });

            // Cloth snaps away slightly after the flick begins
            clothHeight.value = withDelay(
              30,
              withSpring(0, { damping: 16, stiffness: 190 }),
            );

            // Hand fades out mid-settle so it doesn't linger
            handOpacity.value = withDelay(140, withTiming(0, { duration: 120 }));
          });
        });
      }
    },
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const clothStyle = useAnimatedStyle(() => ({
    // Clamp so a spring overshoot never goes negative.
    height: Math.max(0, clothHeight.value),
  }));

  const handStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, handOpacity.value)),
    transform: [
      { translateY: handY.value },
      { scaleX: handScaleX.value },
      { scaleY: handScaleY.value },
    ],
  }));

  return (
    // pointerEvents="none" — purely decorative, must not block scroll/gestures.
    <View style={zoneStyles.root} pointerEvents="none">
      <Animated.View style={[zoneStyles.cloth, clothStyle]}>
        <Animated.View style={zoneStyles.handWrapper}>
          {/* HandView is the Rive swap point — replace only its contents */}
          <Animated.View style={handStyle}>
            <HandView />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const CLOTH_BG = '#DDD6D0'; // slightly darker & warmer than app bg (#F2EEEC)

const zoneStyles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  cloth: {
    backgroundColor: CLOTH_BG,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    // Shadow gives the cloth an elevated, draped feel.
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    // Hand sits flush at the bottom of the cloth.
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  handWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
