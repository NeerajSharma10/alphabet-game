import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GAME_MODES,
  DIFFICULTIES,
  MODE_ORDER,
  DIFFICULTY_ORDER,
  buildGameConfig,
} from '../constants/modes';
import { getBestScore, getStats } from '../utils/storage';

const { width } = Dimensions.get('window');

function FloatingLetter({ char, delay, startX, startY }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -20,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingLetter,
        {
          left: startX,
          top: startY,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

export default function HomeScreen({ navigation }) {
  const [selectedMode, setSelectedMode] = useState('english');
  const [selectedRange, setSelectedRange] = useState('A-Z');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [bestScore, setBestScore] = useState(null);
  const [stats, setStats] = useState(null);

  const titleScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(titleScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load best score whenever selections change
  useEffect(() => {
    const scoreKey = `${selectedMode}_${selectedRange}_${selectedDifficulty}`;
    getBestScore(scoreKey).then((score) => setBestScore(score));
  }, [selectedMode, selectedRange, selectedDifficulty]);

  // Load lifetime stats on mount and when screen re-focuses
  useEffect(() => {
    getStats().then((s) => setStats(s));
    const unsubscribe = navigation.addListener('focus', () => {
      getStats().then((s) => setStats(s));
      const scoreKey = `${selectedMode}_${selectedRange}_${selectedDifficulty}`;
      getBestScore(scoreKey).then((score) => setBestScore(score));
    });
    return unsubscribe;
  }, [navigation, selectedMode, selectedRange, selectedDifficulty]);

  // Floating background chars derived from selected mode
  const floatingChars = useMemo(() => {
    const mode = GAME_MODES[selectedMode];
    const sample = mode.characters.slice(0, 6);
    const curses = mode.specialChars.slice(0, 4);
    return [...sample, ...curses];
  }, [selectedMode]);

  const currentRanges = GAME_MODES[selectedMode].ranges;

  const handleModeChange = useCallback((modeId) => {
    setSelectedMode(modeId);
    setSelectedRange(GAME_MODES[modeId].ranges[0].id);
  }, []);

  const handlePlay = useCallback(() => {
    const config = buildGameConfig(selectedMode, selectedRange, selectedDifficulty);
    navigation.replace('Game', { gameConfig: config });
  }, [selectedMode, selectedRange, selectedDifficulty, navigation]);

  return (
    <LinearGradient colors={['#0a0010', '#120020', '#0a000a']} style={styles.container}>
      {floatingChars.map((char, i) => (
        <FloatingLetter
          key={`${selectedMode}-${i}`}
          char={char}
          delay={i * 300}
          startX={((i * 37) % (width - 40)) + 10}
          startY={80 + ((i * 73) % 350)}
        />
      ))}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View style={[styles.titleContainer, { transform: [{ scale: titleScale }] }]}>
          <Text style={styles.titleIcon}>{'\uD83E\uDDD9'}</Text>
          <Text style={styles.title}>Alphabet</Text>
          <Text style={styles.titleAccent}>Witchway</Text>
          <Text style={styles.subtitle}>Dodge the curses! Catch your letters!</Text>
        </Animated.View>

        {/* Mode selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>MODE</Text>
          <View style={styles.selectorRow}>
            {MODE_ORDER.map((modeId) => {
              const mode = GAME_MODES[modeId];
              const active = selectedMode === modeId;
              return (
                <TouchableOpacity
                  key={modeId}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => handleModeChange(modeId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {mode.icon} {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Range selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>RANGE</Text>
          <View style={styles.selectorRow}>
            {currentRanges.map((range) => {
              const active = selectedRange === range.id;
              return (
                <TouchableOpacity
                  key={range.id}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedRange(range.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Difficulty selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorLabel}>DIFFICULTY</Text>
          <View style={styles.selectorRow}>
            {DIFFICULTY_ORDER.map((diffId) => {
              const diff = DIFFICULTIES[diffId];
              const active = selectedDifficulty === diffId;
              return (
                <TouchableOpacity
                  key={diffId}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedDifficulty(diffId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {diff.icon} {diff.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Best score */}
        {bestScore !== null && (
          <View style={styles.bestScoreContainer}>
            <Text style={styles.bestScoreLabel}>BEST SCORE</Text>
            <Text style={styles.bestScoreValue}>{bestScore}</Text>
          </View>
        )}

        {/* Lifetime stats */}
        {stats && stats.totalGamesPlayed > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>LIFETIME STATS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalGamesPlayed}</Text>
                <Text style={styles.statLabel}>Games</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalCorrectCatches}</Text>
                <Text style={styles.statLabel}>Catches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statCombo]}>x{stats.longestComboEver}</Text>
                <Text style={styles.statLabel}>Best Combo</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalScoreAllGames}</Text>
                <Text style={styles.statLabel}>Total Score</Text>
              </View>
            </View>
          </View>
        )}

        {/* Play button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlay}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#39ff14', '#1a8a0a']}
            style={styles.playButtonInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.playButtonText}>PLAY</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
    minHeight: '100%',
    justifyContent: 'center',
  },
  floatingLetter: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(57, 255, 20, 0.10)',
    zIndex: 0,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleIcon: {
    fontSize: 42,
    marginBottom: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: '#b366ff',
    letterSpacing: 3,
    textShadowColor: 'rgba(179, 102, 255, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    textAlign: 'center',
  },
  selectorSection: {
    width: '100%',
    marginBottom: 18,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(200, 180, 255, 0.45)',
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.2)',
    backgroundColor: 'rgba(18, 0, 32, 0.6)',
  },
  pillActive: {
    borderColor: '#b366ff',
    backgroundColor: 'rgba(107, 47, 160, 0.35)',
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  pillTextActive: {
    color: '#d9a6ff',
    fontWeight: '700',
  },
  bestScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 0, 20, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
  },
  bestScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(200, 180, 255, 0.4)',
    letterSpacing: 3,
    marginBottom: 2,
  },
  bestScoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#39ff14',
    textShadowColor: 'rgba(57, 255, 20, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  statsContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 0, 20, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.15)',
  },
  statsTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(200, 180, 255, 0.4)',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#b366ff',
    textShadowColor: 'rgba(179, 102, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statCombo: {
    color: '#ffee58',
    textShadowColor: 'rgba(255, 238, 88, 0.3)',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1,
    marginTop: 2,
  },
  playButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginTop: 8,
  },
  playButtonInner: {
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a0010',
    letterSpacing: 4,
  },
});
