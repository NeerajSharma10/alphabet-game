import { useRef, useEffect, useMemo } from 'react';
import { Animated, Text, View, StyleSheet, Easing } from 'react-native';
import { isValidChar, LANE_POSITIONS_BOTTOM, VANISHING_POINT_Y } from '../constants/game';

const LETTER_SIZE = 56;
const HALF = LETTER_SIZE / 2;
const WOBBLE = 25;

// Sparkle burst particles
function SparkBurst({ color }) {
  const particles = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      anim: new Animated.Value(0),
      angle: (i * 60) * (Math.PI / 180),
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(
      30,
      particles.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <>
      {particles.map((p, i) => {
        const dist = 40;
        const tx = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * dist],
        });
        const ty = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * dist],
        });
        const op = p.anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 0.8, 0],
        });
        const sc = p.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.3],
        });
        return (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              top: LETTER_SIZE / 2 + 10,
              left: LETTER_SIZE / 2 - 4,
              fontSize: 10,
              color,
              transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
              opacity: op,
            }}
          >
            {'\u2728'}
          </Animated.Text>
        );
      })}
    </>
  );
}

export default function HighwayLetter({
  item,
  travelTime,
  areaWidth,
  areaHeight,
  onPassedBottom,
  grabbed,
  characters,
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const grabScale = useRef(new Animated.Value(1)).current;
  const grabOpacity = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  const vanishX = areaWidth * 0.5;
  const vanishY = areaHeight * VANISHING_POINT_Y;
  const laneX = areaWidth * LANE_POSITIONS_BOTTOM[item.lane];

  const translateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.15, 0.35, 0.55, 0.75, 0.90, 1.0],
        outputRange: [
          vanishY - HALF,
          vanishY + areaHeight * 0.06,
          vanishY + areaHeight * 0.18,
          vanishY + areaHeight * 0.38,
          vanishY + areaHeight * 0.58,
          vanishY + areaHeight * 0.74,
          areaHeight * 1.05,
        ],
      }),
    [areaHeight, vanishY]
  );

  const translateX = useMemo(() => {
    const w = WOBBLE;
    return progress.interpolate({
      inputRange:  [0, 0.12, 0.25, 0.38, 0.50, 0.62, 0.75, 0.88, 1.0],
      outputRange: [
        vanishX - HALF,
        laneX - HALF - w,
        laneX - HALF + w,
        laneX - HALF - w,
        laneX - HALF + w,
        laneX - HALF - w,
        laneX - HALF + w * 0.5,
        laneX - HALF - w * 0.3,
        laneX - HALF,
      ],
    });
  }, [areaWidth, vanishX, laneX]);

  const scale = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.25, 0.50, 0.75, 1.0],
        outputRange: [0.25, 0.35, 0.55, 0.85, 1.1],
      }),
    []
  );

  const letterOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.25, 0.70, 0.92, 1.0],
        outputRange: [0.3, 0.6, 1.0, 1.0, 0.0],
      }),
    []
  );

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Glow pulse intensity (increases as letter approaches)
  const glowIntensity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.5, 0.8, 1.0],
        outputRange: [0, 0.3, 0.8, 0],
      }),
    []
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: travelTime,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onPassedBottom(item.id);
    });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (grabbed) {
      progress.stopAnimation();
      spin.stopAnimation();
      Animated.parallel([
        Animated.spring(grabScale, {
          toValue: 2.2,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(grabOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [grabbed]);

  const isLetter = isValidChar(item.char, characters);
  const bgColor = isLetter ? '#2d1054' : '#4a0000';
  const borderColor = isLetter ? '#b366ff' : '#ff3333';
  const textColor = isLetter ? '#d9a6ff' : '#ff6b6b';
  const hatColor = isLetter ? '#6b2fa0' : '#8b0000';
  const sparkColor = isLetter ? '#b366ff' : '#ff3333';

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: [
          { translateX },
          { translateY },
          { scale: Animated.multiply(scale, grabScale) },
          { rotate },
        ],
        opacity: Animated.multiply(letterOpacity, grabOpacity),
        zIndex: item.id,
      }}
    >
      {/* Sparkle burst on grab */}
      {grabbed && <SparkBurst color={sparkColor} />}

      {/* Witch hat */}
      <View style={styles.hatContainer}>
        <View style={[styles.hatTip, { borderBottomColor: hatColor }]} />
        <View style={[styles.hatBrim, { backgroundColor: hatColor }]}>
          {/* Hat buckle */}
          <View style={styles.hatBuckle} />
        </View>
      </View>

      {/* Ambient glow behind letter */}
      <Animated.View
        style={[
          styles.glowOrb,
          {
            backgroundColor: isLetter ? 'rgba(179,102,255,0.15)' : 'rgba(255,50,50,0.15)',
            opacity: glowIntensity,
          },
        ]}
      />

      {/* Letter block */}
      <View
        style={[
          styles.letterBlock,
          {
            backgroundColor: bgColor,
            borderColor: grabbed ? '#39ff14' : borderColor,
            borderWidth: grabbed ? 3 : 2,
            shadowColor: grabbed ? '#39ff14' : borderColor,
            shadowRadius: grabbed ? 28 : 12,
            shadowOpacity: grabbed ? 1 : 0.7,
          },
        ]}
      >
        {/* Sparkle decorations */}
        <Text style={[styles.sparkle, { top: -4, right: -6 }]}>{'\u2728'}</Text>
        <Text style={[styles.sparkle, { bottom: -4, left: -6 }]}>{'\u2728'}</Text>
        <Text style={[styles.sparkle, { top: -4, left: -6 }]}>{'\u2B50'}</Text>

        <Text style={[styles.letterText, { color: textColor, fontSize: item.char.length > 1 ? 20 : 26 }]}>{item.char}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hatContainer: {
    alignItems: 'center',
    marginBottom: -4,
  },
  hatTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hatBrim: {
    width: 38,
    height: 6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hatBuckle: {
    width: 8,
    height: 4,
    backgroundColor: '#ffee58',
    borderRadius: 1,
  },
  glowOrb: {
    position: 'absolute',
    top: 5,
    left: -10,
    width: LETTER_SIZE + 20,
    height: LETTER_SIZE + 30,
    borderRadius: 40,
  },
  letterBlock: {
    width: LETTER_SIZE,
    height: LETTER_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  letterText: {
    fontSize: 26,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 8,
  },
});
