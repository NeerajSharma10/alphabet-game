import { useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text, Easing } from 'react-native';
import { HIT_ZONE_Y, LANE_POSITIONS_BOTTOM } from '../constants/game';

// Bubbling particle for cauldron
function Bubble({ delay, x, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 1800 + Math.random() * 1200,
        delay: delay + Math.random() * 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -45],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0, 0.7, 0.4, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.2],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 12,
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(57, 255, 20, 0.35)',
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    />
  );
}

function CauldronButton({ index, width, height, onLaneTap, strikes }) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  const laneX = width * LANE_POSITIONS_BOTTOM[index];
  const hitZoneTop = height * HIT_ZONE_Y;
  const laneWidth = width * 0.30;
  const barColor =
    strikes >= 2 ? '#ff3333' : strikes >= 1 ? '#ff8800' : '#39ff14';

  const bubbles = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      key: i,
      delay: i * 300,
      x: 8 + Math.random() * 44,
      size: 4 + Math.random() * 6,
    })),
  []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 1500 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: -1,
          duration: 1500 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const cauldronRotate = wobble.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const handlePress = useCallback(() => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
    onLaneTap(index);
  }, [index, onLaneTap]);

  const labels = ['\u{1F9EA}', '\u{1F52E}', '\u{1F9EA}'];

  return (
    <>
      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: laneX - laneWidth / 2,
          top: 0,
          width: laneWidth,
          height: height,
          backgroundColor: barColor,
          opacity: Animated.multiply(flashAnim, new Animated.Value(0.15)),
          zIndex: 5,
        }}
      />

      {/* Lane target ring */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: laneX - 34,
          top: hitZoneTop - 34,
          width: 68,
          height: 68,
          borderRadius: 34,
          borderWidth: 2,
          borderColor: barColor,
          borderStyle: 'dashed',
          opacity: 0.35,
          zIndex: 6,
        }}
      />

      {/* Tappable lane area */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.6}
        style={{
          position: 'absolute',
          left: laneX - laneWidth / 2,
          top: hitZoneTop - 80,
          width: laneWidth,
          bottom: 0,
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 14,
        }}
      >
        <Animated.View
          style={{
            width: 64,
            height: 52,
            borderRadius: 10,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            backgroundColor: 'rgba(20, 0, 40, 0.85)',
            borderWidth: 2,
            borderColor: barColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: [{ rotate: cauldronRotate }],
            shadowColor: barColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.6,
            shadowRadius: 10,
          }}
        >
          {/* Bubbling particles */}
          {bubbles.map((b) => (
            <Bubble key={b.key} delay={b.delay} x={b.x} size={b.size} />
          ))}
          {/* Cauldron icon */}
          <Text style={{ fontSize: 22 }}>{labels[index]}</Text>
          {/* Inner glow rim */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 2,
              right: 2,
              height: 3,
              backgroundColor: barColor,
              borderRadius: 2,
              opacity: 0.5,
            }}
          />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

export default function HitZone({ width, height, strikes, onLaneTap }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const barColor =
    strikes >= 2 ? '#ff3333' : strikes >= 1 ? '#ff8800' : '#39ff14';
  const hitZoneTop = height * HIT_ZONE_Y;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 8 }]}>
      {/* Hit zone bar — glowing line */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: hitZoneTop,
          left: width * 0.03,
          right: width * 0.03,
          height: 3,
          backgroundColor: barColor,
          borderRadius: 2,
          opacity: pulseAnim,
          shadowColor: barColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 16,
          zIndex: 6,
        }}
      />

      {/* Secondary glow line */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: hitZoneTop - 1,
          left: width * 0.06,
          right: width * 0.06,
          height: 5,
          backgroundColor: barColor,
          borderRadius: 3,
          opacity: 0.08,
          zIndex: 5,
        }}
      />

      {[0, 1, 2].map((i) => (
        <CauldronButton
          key={i}
          index={i}
          width={width}
          height={height}
          onLaneTap={onLaneTap}
          strikes={strikes}
        />
      ))}
    </View>
  );
}
