import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Switch as RNSwitch,
  Text as RNText,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.text} />;
}

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'caption' | 'time';

export function Text({ variant = 'body', style, color, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  const t = useTheme();
  const base = {
    title: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5, color: t.text },
    heading: { fontSize: 17, fontWeight: '600' as const, color: t.text },
    body: { fontSize: 16, color: t.text },
    muted: { fontSize: 15, color: t.muted },
    caption: { fontSize: 13, color: t.muted },
    time: { fontSize: 56, fontWeight: '300' as const, letterSpacing: -2, color: t.text, fontVariant: ['tabular-nums' as const] },
  }[variant];
  return <RNText {...rest} style={[base, color ? { color } : null, style]} />;
}

export function Screen({ children, style, padded = true, ...rest }: ViewProps & { padded?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      {...rest}
      style={[
        { flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: padded ? insets.bottom : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Header({
  title,
  left,
  right,
  large,
}: {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <View style={[styles.header, large && { paddingVertical: spacing.md }]}>
      {left || !large ? <View style={styles.headerSide}>{left}</View> : null}
      <Text variant={large ? 'title' : 'heading'} style={{ flex: 1, textAlign: large ? 'left' : 'center' }} numberOfLines={1}>
        {title}
      </Text>
      {right || !large ? <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View> : null}
    </View>
  );
}

export function IconButton({ name, onPress, size = 24, color, style }: { name: IconName; onPress?: () => void; size?: number; color?: string; style?: PressableProps['style'] }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={(state) => [
        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', opacity: state.pressed ? 0.5 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? t.text} />
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: IconName;
  style?: ViewProps['style'];
}) {
  const t = useTheme();
  const bg = { primary: t.accent, secondary: t.surface, ghost: 'transparent', danger: t.danger }[kind];
  const fg = { primary: t.accentText, secondary: t.text, ghost: t.text, danger: '#fff' }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} /> : null}
      <RNText style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</RNText>
    </Pressable>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View {...rest} style={[{ backgroundColor: t.surface, borderRadius: radius.md, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
      <Text variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}>
        {children}
      </Text>
      {hint ? <Text variant="caption" style={{ marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}

export function Row({
  title,
  subtitle,
  value,
  onPress,
  right,
  icon,
  chevron,
  last,
  danger,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  icon?: IconName;
  chevron?: boolean;
  last?: boolean;
  danger?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }]}
    >
      {icon ? <Ionicons name={icon} size={22} color={danger ? t.danger : t.muted} style={{ marginRight: spacing.md }} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={danger ? { color: t.danger } : undefined}>{title}</Text>
        {subtitle ? <Text variant="caption" style={{ marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {value ? <Text variant="muted" style={{ marginLeft: spacing.sm }}>{value}</Text> : null}
      {right}
      {chevron || (onPress && !right && chevron !== false) ? (
        <Ionicons name="chevron-forward" size={18} color={t.muted} style={{ marginLeft: spacing.sm }} />
      ) : null}
    </Pressable>
  );
}

export function Switch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: t.surface2, true: t.scheme === 'dark' ? '#3DD68C' : '#111113' }}
      thumbColor="#fff"
      ios_backgroundColor={t.surface2}
    />
  );
}

export function Chip({ label, selected, onPress, style }: { label: string; selected?: boolean; onPress?: () => void; style?: ViewProps['style'] }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? t.accent : t.surface, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <RNText style={{ color: selected ? t.accentText : t.text, fontSize: 14, fontWeight: '600' }}>{label}</RNText>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 1, max = 100, step = 1, format }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; format?: (v: number) => string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <IconButton name="remove" onPress={() => onChange(Math.max(min, value - step))} color={value <= min ? t.border : t.text} />
      <Text style={{ minWidth: 48, textAlign: 'center', fontVariant: ['tabular-nums'] }}>{format ? format(value) : value}</Text>
      <IconButton name="add" onPress={() => onChange(Math.min(max, value + step))} color={value >= max ? t.border : t.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 52 },
  headerSide: { minWidth: 40, flexDirection: 'row', alignItems: 'center' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: spacing.lg, borderRadius: radius.full },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 52 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full },
});
