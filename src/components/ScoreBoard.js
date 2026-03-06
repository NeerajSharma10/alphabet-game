import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MAX_STRIKES } from '../constants/game';

function PulsingNext({ letter }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.nextLetterBox, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.nextLetterText}>{letter}</Text>
    </Animated.View>
  );
}

export default function ScoreBoard({ score, nextLetter, strikes, letterIndex = 0, totalCount = 26, comboMultiplier = 1 }) {
  const progress = Math.min(letterIndex / totalCount, 1);

  return (
    <View style={styles.container}>
      {/* Top row: score, next, lives */}
      <View style={styles.topRow}>
        <View style={styles.scoreSection}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          {comboMultiplier > 1 && (
            <Text style={styles.comboIndicator}>x{comboMultiplier}</Text>
          )}
        </View>

        <View style={styles.nextSection}>
          <Text style={styles.label}>CATCH</Text>
          <PulsingNext letter={nextLetter} />
        </View>

        <View style={styles.strikesSection}>
          <Text style={styles.label}>LIVES</Text>
          <View style={styles.strikesRow}>
            {Array.from({ length: MAX_STRIKES }).map((_, i) => (
              <Text key={i} style={styles.strikeIcon}>
                {i < strikes ? '\uD83D\uDC80' : '\uD83D\uDC9C'}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {letterIndex}/{totalCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: 'rgba(8, 0, 18, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 80, 200, 0.25)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    minWidth: 60,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(200, 180, 255, 0.45)',
    letterSpacing: 2,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#39ff14',
    textShadowColor: 'rgba(57, 255, 20, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  nextSection: {
    alignItems: 'center',
  },
  nextLetterBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 47, 160, 0.25)',
    borderWidth: 2,
    borderColor: '#b366ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  nextLetterText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#d9a6ff',
  },
  strikesSection: {
    alignItems: 'center',
    minWidth: 60,
  },
  strikesRow: {
    flexDirection: 'row',
    gap: 3,
  },
  strikeIcon: {
    fontSize: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(100, 60, 160, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#39ff14',
    borderRadius: 3,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(200, 180, 255, 0.4)',
    minWidth: 30,
    textAlign: 'right',
  },
  comboIndicator: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffee58',
    textShadowColor: 'rgba(255, 238, 88, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginTop: 2,
  },
});
