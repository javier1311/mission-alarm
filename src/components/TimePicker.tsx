import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { useStore } from '@/store';
import { spacing, useTheme } from '@/theme';
import { formatClock } from '@/utils/format';

export function TimePicker({ hour, minute, onChange }: { hour: number; minute: number; onChange: (h: number, m: number) => void }) {
  const t = useTheme();
  const use24h = useStore((s) => s.settings.use24h);
  const [open, setOpen] = useState(false);
  const date = new Date(2000, 0, 1, hour, minute);

  if (Platform.OS === 'web') {
    const field = (value: number, max: number, set: (v: number) => void) => (
      <TextInput
        defaultValue={value.toString().padStart(2, '0')}
        keyboardType="number-pad"
        maxLength={2}
        onEndEditing={(e) => {
          const n = Math.min(max, Math.max(0, parseInt(e.nativeEvent.text, 10) || 0));
          set(n);
        }}
        onBlur={(e: any) => {
          const n = Math.min(max, Math.max(0, parseInt(e.nativeEvent?.text ?? e.target?.value, 10) || 0));
          set(n);
        }}
        style={{ fontSize: 64, fontWeight: '300', color: t.text, width: 100, textAlign: 'center' }}
      />
    );
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg }}>
        {field(hour, 23, (h) => onChange(h, minute))}
        <Text variant="time">:</Text>
        {field(minute, 59, (m) => onChange(hour, m))}
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour={use24h}
          themeVariant={t.scheme}
          onChange={(_, d) => d && onChange(d.getHours(), d.getMinutes())}
          style={{ height: 180, width: 300 }}
        />
      </View>
    );
  }

  const { time, suffix } = formatClock(hour, minute, use24h);
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 })}>
        <Text variant="time" style={{ fontSize: 72, lineHeight: 80 }}>{time}</Text>
        {suffix ? <Text variant="muted" style={{ marginBottom: 14, fontSize: 20 }}>{suffix}</Text> : null}
      </Pressable>
      {open ? (
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour={use24h}
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(d.getHours(), d.getMinutes());
          }}
        />
      ) : null}
    </View>
  );
}
