import { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ScoreBoard from '../components/ScoreBoard';
import HighwayView from '../components/HighwayView';
import {
  SCORING,
  MAX_STRIKES,
  isValidChar,
  isSpecialChar,
  getComboMultiplier,
} from '../constants/game';
import { playSound } from '../utils/sound';

export default function GameScreen({ navigation, route }) {
  const { gameConfig } = route.params || {};

  if (!gameConfig) {
    navigation.replace('Home');
    return null;
  }

  const { characters, specialChars, totalCount } = gameConfig;

  const [score, setScore] = useState(0);
  const [letterIndex, setLetterIndex] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [removedIds, setRemovedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [combo, setCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);

  const maxComboRef = useRef(0);

  const screenShake = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(0)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;

  const showFeedback = useCallback((type, text) => {
    setFeedback({ type, text });
    feedbackOpacity.setValue(1);
    feedbackScale.setValue(0.3);
    Animated.parallel([
      Animated.spring(feedbackScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 1000,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showComboPopup = useCallback((multiplier) => {
    comboScale.setValue(0.3);
    comboOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(comboScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(comboOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const shakeScreen = useCallback(() => {
    Animated.sequence([
      Animated.timing(screenShake, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLetterPress = useCallback(
    (char, id) => {
      const nextExpected = characters[letterIndex];

      if (isValidChar(char, characters)) {
        if (char === nextExpected) {
          const newCombo = combo + 1;
          const prevMult = getComboMultiplier(combo);
          const newMult = getComboMultiplier(newCombo);
          const points = SCORING.CORRECT * newMult;

          if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;

          setCombo(newCombo);
          setComboMultiplier(newMult);
          setScore((s) => s + points);
          setLetterIndex((i) => i + 1);
          setRemovedIds((prev) => [...prev, id]);

          const feedbackText = newMult > 1
            ? `\u2728 +${points} x${newMult}`
            : `\u2728 +${points}`;
          showFeedback('correct', feedbackText);

          playSound('correct');
          if (newMult > prevMult) {
            showComboPopup(newMult);
            playSound('comboUp');
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (letterIndex + 1 >= totalCount) {
            playSound('win');
            setTimeout(() => {
              navigation.replace('GameOver', {
                score: score + points,
                won: true,
                gameConfig,
                maxCombo: maxComboRef.current,
                correctCatches: letterIndex + 1,
              });
            }, 500);
          }
        } else {
          setCombo(0);
          setComboMultiplier(1);
          setScore((s) => s + SCORING.WRONG_ALPHABET);
          showFeedback('wrong', `\uD83D\uDCA8 ${SCORING.WRONG_ALPHABET}`);
          playSound('wrong');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else if (isSpecialChar(char, specialChars)) {
        setCombo(0);
        setComboMultiplier(1);
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        setRemovedIds((prev) => [...prev, id]);
        shakeScreen();
        showFeedback('strike', '\uD83D\uDCA5 CURSED!');
        playSound('curse');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        if (newStrikes >= MAX_STRIKES) {
          playSound('gameOver');
          setTimeout(() => {
            navigation.replace('GameOver', {
              score,
              won: false,
              gameConfig,
              maxCombo: maxComboRef.current,
              correctCatches: letterIndex,
            });
          }, 800);
        }
      }
    },
    [letterIndex, strikes, score, combo, navigation, characters, specialChars, totalCount, gameConfig]
  );

  const nextLetter = letterIndex < totalCount ? characters[letterIndex] : '-';

  return (
    <Animated.View style={[styles.flex, { transform: [{ translateX: screenShake }] }]}>
      <LinearGradient colors={['#0a0010', '#120020', '#0a000a']} style={styles.flex}>
        <View style={styles.safeTop} />

        <ScoreBoard
          score={score}
          nextLetter={nextLetter}
          strikes={strikes}
          letterIndex={letterIndex}
          totalCount={totalCount}
          comboMultiplier={comboMultiplier}
        />

        {/* Feedback popup */}
        <Animated.View
          style={[
            styles.feedbackContainer,
            {
              opacity: feedbackOpacity,
              transform: [{ scale: feedbackScale }],
            },
          ]}
          pointerEvents="none"
        >
          {feedback && (
            <View style={styles.feedbackBubble}>
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'correct' && styles.feedbackCorrect,
                  feedback.type === 'wrong' && styles.feedbackWrong,
                  feedback.type === 'strike' && styles.feedbackStrike,
                ]}
              >
                {feedback.text}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Combo popup */}
        <Animated.View
          style={[
            styles.comboContainer,
            {
              opacity: comboOpacity,
              transform: [{ scale: comboScale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={[
            styles.comboText,
            comboMultiplier >= 4 && styles.comboTextMax,
          ]}>
            x{comboMultiplier} COMBO!
          </Text>
        </Animated.View>

        {/* 3D Highway */}
        <HighwayView
          onLetterPress={handleLetterPress}
          lettersCompleted={letterIndex}
          removedIds={removedIds}
          strikes={strikes}
          gameConfig={gameConfig}
        />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeTop: {
    height: 50,
  },
  feedbackContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  feedbackBubble: {
    backgroundColor: 'rgba(10, 0, 20, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.3)',
  },
  feedbackText: {
    fontSize: 34,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  feedbackCorrect: {
    color: '#39ff14',
    textShadowColor: 'rgba(57, 255, 20, 0.6)',
  },
  feedbackWrong: {
    color: '#ff6b6b',
    textShadowColor: 'rgba(255, 107, 107, 0.5)',
  },
  feedbackStrike: {
    color: '#ff8800',
    textShadowColor: 'rgba(255, 136, 0, 0.6)',
    fontSize: 38,
  },
  comboContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 101,
  },
  comboText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffee58',
    textShadowColor: 'rgba(255, 238, 88, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 14,
    letterSpacing: 4,
  },
  comboTextMax: {
    color: '#ff6600',
    fontSize: 48,
    textShadowColor: 'rgba(255, 102, 0, 0.8)',
  },
});
