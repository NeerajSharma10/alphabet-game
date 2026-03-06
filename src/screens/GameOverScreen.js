import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { saveBestScore, updateStats } from '../utils/storage';

export default function GameOverScreen({ navigation, route }) {
  const { score = 0, won = false, gameConfig, maxCombo = 0, correctCatches = 0 } = route.params || {};
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [bestScore, setBestScore] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (gameConfig?.scoreKey) {
      saveBestScore(gameConfig.scoreKey, score).then((result) => {
        setBestScore(result.bestScore);
        setIsNewBest(result.isNewBest);
      });
    }
    updateStats({ score, correctCatches, maxCombo });
  }, []);

  const handleShare = useCallback(async () => {
    const diffLabel = gameConfig?.difficultyId
      ? gameConfig.difficultyId.charAt(0).toUpperCase() + gameConfig.difficultyId.slice(1)
      : '';
    const rangeLabel = gameConfig?.rangeId || '';
    const message = `I scored ${score} on Alphabet Witchway (${diffLabel}, ${rangeLabel})! Can you beat me? \uD83E\uDDD9\u2728`;

    try {
      await Share.share({ message });
    } catch (e) {
      // User cancelled or share failed
    }
  }, [score, gameConfig]);

  return (
    <LinearGradient
      colors={won ? ['#001a00', '#002a10', '#001a00'] : ['#200010', '#300020', '#200010']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.emoji}>{won ? '\uD83E\uDDD9' : '\uD83D\uDC80'}</Text>
        <Text style={[styles.title, won && styles.titleWin]}>
          {won ? 'YOU WIN!' : 'GAME OVER'}
        </Text>
        {won && (
          <Text style={styles.winSubtitle}>
            You completed {gameConfig?.label || 'the challenge'}!
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.scoreContainer, { opacity: fadeAnim }]}>
        <Text style={styles.scoreLabel}>FINAL SCORE</Text>
        <Text style={[styles.scoreValue, won && styles.scoreValueWin]}>{score}</Text>

        {maxCombo > 0 && (
          <Text style={styles.comboStat}>Best combo: x{maxCombo}</Text>
        )}

        {bestScore !== null && (
          <View style={styles.bestScoreRow}>
            {isNewBest && <Text style={styles.newBestBadge}>NEW BEST!</Text>}
            <Text style={styles.bestScoreText}>BEST: {bestScore}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Game', { gameConfig })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={won ? ['#39ff14', '#1a8a0a'] : ['#b366ff', '#6b2fa0']}
            style={styles.buttonInner}
          >
            <Text style={styles.buttonText}>PLAY AGAIN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <View style={styles.shareButtonInner}>
            <Text style={styles.shareButtonText}>{'\uD83D\uDCE4'} SHARE SCORE</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.replace('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>HOME</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ff3333',
    letterSpacing: 4,
    textShadowColor: 'rgba(255,51,51,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  titleWin: {
    color: '#39ff14',
    textShadowColor: 'rgba(57,255,20,0.5)',
  },
  winSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#b366ff',
  },
  scoreValueWin: {
    color: '#39ff14',
  },
  comboStat: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffee58',
    marginTop: 6,
  },
  bestScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  newBestBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffee58',
    textShadowColor: 'rgba(255, 238, 88, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bestScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonInner: {
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
  },
  shareButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.4)',
  },
  shareButtonInner: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(107, 47, 160, 0.25)',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d9a6ff',
    letterSpacing: 2,
  },
  homeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
});
