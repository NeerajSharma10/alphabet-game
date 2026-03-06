import { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VANISHING_POINT_Y, LANE_POSITIONS_BOTTOM } from '../constants/game';

const DASH_COUNT = 25;
const STAR_COUNT = 40;
const BAT_COUNT = 4;

function TwinkleStar({ x, y, size, delay }) {
  const opacity = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 1200 + Math.random() * 800,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: 1200 + Math.random() * 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#e0d0ff',
        opacity,
        shadowColor: '#e0d0ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size * 2,
      }}
    />
  );
}

function FlyingBat({ width, height, delay }) {
  const translateX = useRef(new Animated.Value(-40)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const startY = useRef(30 + Math.random() * height * 0.4).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(-40);
      translateY.setValue(0);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width + 40,
          duration: 6000 + Math.random() * 3000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        // Wavy vertical movement
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -25,
              duration: 800,
              delay,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 25,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start(({ finished }) => {
        if (finished) {
          setTimeout(animate, Math.random() * 5000);
        }
      });
    };
    animate();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        top: startY,
        left: 0,
        fontSize: 16,
        transform: [{ translateX }, { translateY }],
        opacity,
      }}
    >
      {'\uD83E\uDD87'}
    </Animated.Text>
  );
}

export default function HighwayBackground({ width, height }) {
  const vanishY = height * VANISHING_POINT_Y;
  const vanishX = width * 0.5;
  const bottomY = height;

  const { dashes, edgeLines, starData } = useMemo(() => {
    const dashes = [];
    const laneEndXs = [
      width * ((LANE_POSITIONS_BOTTOM[0] + LANE_POSITIONS_BOTTOM[1]) / 2),
      width * ((LANE_POSITIONS_BOTTOM[1] + LANE_POSITIONS_BOTTOM[2]) / 2),
    ];

    laneEndXs.forEach((endX, lineIdx) => {
      for (let i = 2; i < DASH_COUNT; i++) {
        const t = i / DASH_COUNT;
        const x = vanishX + (endX - vanishX) * t;
        const y = vanishY + (bottomY - vanishY) * t;
        const dashHeight = 3 + t * 12;
        const dashWidth = 1 + t * 2;
        const dashOpacity = 0.06 + t * 0.2;
        dashes.push({ x, y, dashHeight, dashWidth, dashOpacity, key: `lane-${lineIdx}-${i}` });
      }
    });

    const edgeEndXs = [width * 0.02, width * 0.98];
    const edgeLines = [];
    edgeEndXs.forEach((endX, lineIdx) => {
      for (let i = 1; i < DASH_COUNT; i++) {
        const t = i / DASH_COUNT;
        const x = vanishX + (endX - vanishX) * t;
        const y = vanishY + (bottomY - vanishY) * t;
        const dashHeight = 4 + t * 14;
        const dashWidth = 1 + t * 3;
        const dashOpacity = 0.1 + t * 0.3;
        edgeLines.push({ x, y, dashHeight, dashWidth, dashOpacity, key: `edge-${lineIdx}-${i}` });
      }
    });

    const starData = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      starData.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.65,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 3000,
        key: `star-${i}`,
      });
    }

    return { dashes, edgeLines, starData };
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#05000d', '#0d0018', '#08000f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Twinkling stars */}
      {starData.map((s) => (
        <TwinkleStar key={s.key} x={s.x} y={s.y} size={s.size} delay={s.delay} />
      ))}

      {/* Flying bats */}
      {Array.from({ length: BAT_COUNT }).map((_, i) => (
        <FlyingBat key={`bat-${i}`} width={width} height={height} delay={i * 2000} />
      ))}

      {/* Moon */}
      <View style={{ position: 'absolute', right: width * 0.12, top: height * 0.02 }}>
        <Text style={{ fontSize: 32, opacity: 0.35 }}>{'\uD83C\uDF15'}</Text>
      </View>

      {/* Vanishing point portal glow */}
      <View
        style={{
          position: 'absolute',
          left: vanishX - 40,
          top: vanishY - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(57, 255, 20, 0.04)',
          borderWidth: 1,
          borderColor: 'rgba(57, 255, 20, 0.08)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: vanishX - 20,
          top: vanishY - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(179, 102, 255, 0.06)',
        }}
      />

      {/* Road surface */}
      <View
        style={{
          position: 'absolute',
          top: vanishY,
          left: width * 0.02,
          right: width * 0.02,
          bottom: 0,
          backgroundColor: 'rgba(8, 0, 16, 0.5)',
        }}
      />

      {/* Lane dashes — ghostly green */}
      {dashes.map((d) => (
        <View
          key={d.key}
          style={{
            position: 'absolute',
            left: d.x - d.dashWidth / 2,
            top: d.y,
            width: d.dashWidth,
            height: d.dashHeight,
            backgroundColor: `rgba(100, 255, 100, ${d.dashOpacity})`,
            borderRadius: 1,
          }}
        />
      ))}

      {/* Road edges — purple */}
      {edgeLines.map((d) => (
        <View
          key={d.key}
          style={{
            position: 'absolute',
            left: d.x - d.dashWidth / 2,
            top: d.y,
            width: d.dashWidth,
            height: d.dashHeight,
            backgroundColor: `rgba(150, 80, 200, ${d.dashOpacity})`,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}
