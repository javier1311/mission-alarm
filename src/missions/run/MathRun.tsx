import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import type { MathDifficulty, MathMission } from '@/store/types';
import { radius, spacing } from '@/theme';

import type { MissionRunProps } from './types';

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateProblem(d: MathDifficulty): { text: string; answer: number } {
  switch (d) {
    case 'easy': {
      const a = rnd(10, 60), b = rnd(10, 40);
      return { text: `${a} + ${b}`, answer: a + b };
    }
    case 'medium': {
      if (Math.random() < 0.5) {
        const a = rnd(3, 12), b = rnd(11, 30);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      const a = rnd(50, 150), b = rnd(10, 49);
      return { text: `${a} − ${b}`, answer: a - b };
    }
    case 'hard': {
      const a = rnd(12, 40), b = rnd(12, 30), c = rnd(10, 99);
      return { text: `${a} × ${b} + ${c}`, answer: a * b + c };
    }
  }
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '⌫'];

export function MathRun({ mission, onActivity, onComplete, fg }: MissionRunProps<MathMission>) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(0);
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const problem = useMemo(() => generateProblem(mission.difficulty), [index, seed]);

  const submit = () => {
    if (!input || input === '-') return;
    if (Number(input) === problem.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onActivity();
      setInput('');
      if (index + 1 >= mission.count) onComplete();
      else setIndex(index + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrong(true);
      setInput('');
      setSeed((s) => s + 1);
      setTimeout(() => setWrong(false), 900);
    }
  };

  const press = (k: string) => {
    Haptics.selectionAsync();
    if (k === '⌫') setInput((v) => v.slice(0, -1));
    else if (k === '-') setInput((v) => (v.startsWith('-') ? v.slice(1) : '-' + v));
    else if (input.replace('-', '').length < 6) setInput((v) => v + k);
  };

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <Text variant="caption" style={{ color: fg, opacity: 0.7 }}>{`${index + 1} / ${mission.count}`}</Text>
      <RNText style={[styles.problem, { color: fg }]}>{problem.text}</RNText>
      <View style={[styles.answer, { borderColor: wrong ? '#FF6369' : fg + '55' }]}>
        <RNText style={[styles.answerText, { color: wrong ? '#FF6369' : fg }]}>{wrong ? t('ring.wrongAnswer') : input || ' '}</RNText>
      </View>
      <View style={styles.pad}>
        {KEYS.map((k) => (
          <Pressable key={k} onPress={() => press(k)} style={({ pressed }) => [styles.key, { backgroundColor: fg + (pressed ? '33' : '18') }]}>
            <RNText style={{ color: fg, fontSize: 26, fontWeight: '500' }}>{k}</RNText>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={submit} style={({ pressed }) => [styles.check, { backgroundColor: fg, opacity: pressed ? 0.8 : 1 }]}>
        <RNText style={{ color: fg === '#FFFFFF' ? '#111' : '#fff', fontSize: 16, fontWeight: '600' }}>{t('ring.check')}</RNText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  problem: { fontSize: 44, fontWeight: '300', letterSpacing: -1, marginTop: spacing.sm, fontVariant: ['tabular-nums'] },
  answer: { marginTop: spacing.md, minWidth: 180, borderBottomWidth: 2, paddingBottom: 6, alignItems: 'center' },
  answerText: { fontSize: 34, fontWeight: '500', fontVariant: ['tabular-nums'] },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: 12, marginTop: spacing.lg, justifyContent: 'center' },
  key: { width: 80, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  check: { marginTop: spacing.lg, paddingHorizontal: 40, paddingVertical: 14, borderRadius: radius.full },
});
