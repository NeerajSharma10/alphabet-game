import { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import HighwayBackground from './HighwayBackground';
import HitZone from './HitZone';
import HighwayLetter from './HighwayLetter';
import { generateRandomLetter, assignLane } from '../constants/game';

let nextId = 0;

export default function HighwayView({ onLetterPress, lettersCompleted, removedIds, strikes, gameConfig }) {
  const {
    characters,
    specialChars,
    travelTimeBase,
    travelTimeDecrease,
    travelTimeMin,
    spawnInterval,
    hitZoneGrabMin,
    hitZoneGrabMax,
  } = gameConfig;

  const [letters, setLetters] = useState([]);
  const [grabbedIds, setGrabbedIds] = useState({});
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const intervalRef = useRef(null);
  const recentLanesRef = useRef([]);
  const lettersRef = useRef([]);
  const lettersCompletedRef = useRef(lettersCompleted);

  lettersCompletedRef.current = lettersCompleted;
  lettersRef.current = letters;

  const getTravelTime = useCallback(() => {
    const completed = lettersCompletedRef.current;
    return Math.max(
      travelTimeMin,
      travelTimeBase - Math.floor(completed / 5) * travelTimeDecrease
    );
  }, [travelTimeBase, travelTimeDecrease, travelTimeMin]);

  const spawnLetter = useCallback(() => {
    const id = nextId++;
    const nextExpected = characters[lettersCompletedRef.current];
    const char = generateRandomLetter(nextExpected, characters, specialChars);

    // Smart lane assignment: avoid 3 in a row in same lane
    let lane = assignLane();
    const recent = recentLanesRef.current;
    if (
      recent.length >= 2 &&
      recent[recent.length - 1] === lane &&
      recent[recent.length - 2] === lane
    ) {
      lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    }
    recentLanesRef.current = [...recent.slice(-4), lane];

    const spawnTime = Date.now();
    setLetters((prev) => [...prev.slice(-15), { id, char, lane, spawnTime }]);
  }, [characters, specialChars]);

  useEffect(() => {
    nextId = 0;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnLetter(), i * 500);
    }
    intervalRef.current = setInterval(spawnLetter, spawnInterval);
    return () => clearInterval(intervalRef.current);
  }, [spawnLetter, spawnInterval]);

  const handlePassedBottom = useCallback((id) => {
    setLetters((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Remove grabbed letters after animation completes
  useEffect(() => {
    if (removedIds.length > 0) {
      const lastId = removedIds[removedIds.length - 1];
      setGrabbedIds((prev) => ({ ...prev, [lastId]: true }));
      setTimeout(() => {
        setLetters((prev) => prev.filter((l) => l.id !== lastId));
        setGrabbedIds((prev) => {
          const next = { ...prev };
          delete next[lastId];
          return next;
        });
      }, 350);
    }
  }, [removedIds]);

  // Lane tap handler — find the nearest letter in the hit zone for that lane
  const handleLaneTap = useCallback(
    (laneIndex) => {
      const now = Date.now();
      const travelTime = getTravelTime();
      const currentLetters = lettersRef.current;

      let bestLetter = null;
      let bestDistance = Infinity;
      const center = (hitZoneGrabMin + hitZoneGrabMax) / 2;

      for (const letter of currentLetters) {
        if (letter.lane !== laneIndex) continue;
        if (grabbedIds[letter.id]) continue;

        const elapsed = now - letter.spawnTime;
        const progress = Math.min(1, elapsed / travelTime);

        if (progress >= hitZoneGrabMin && progress <= hitZoneGrabMax) {
          const dist = Math.abs(progress - center);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestLetter = letter;
          }
        }
      }

      if (bestLetter) {
        onLetterPress(bestLetter.char, bestLetter.id);
      }
    },
    [onLetterPress, getTravelTime, grabbedIds, hitZoneGrabMin, hitZoneGrabMax]
  );

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setAreaSize({ width, height });
  }, []);

  const travelTime = getTravelTime();

  return (
    <View style={styles.container} onLayout={onLayout}>
      {areaSize.width > 0 && (
        <>
          <HighwayBackground width={areaSize.width} height={areaSize.height} />
          {letters.map((item) => (
            <HighwayLetter
              key={item.id}
              item={item}
              travelTime={travelTime}
              areaWidth={areaSize.width}
              areaHeight={areaSize.height}
              onPassedBottom={handlePassedBottom}
              grabbed={!!grabbedIds[item.id]}
              characters={characters}
            />
          ))}
          <HitZone
            width={areaSize.width}
            height={areaSize.height}
            strikes={strikes}
            onLaneTap={handleLaneTap}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
