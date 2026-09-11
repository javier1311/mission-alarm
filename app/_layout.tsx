import '@/i18n';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAlarmTicker } from '@/alarm/useAlarmTicker';
import { applyLanguage } from '@/i18n';
import { useStore } from '@/store';
import { dark, light, ThemeContext } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const system = useColorScheme();
  const themeMode = useStore((s) => s.settings.themeMode);
  const language = useStore((s) => s.settings.language);
  const hydrated = useStore((s) => s.hydrated);

  const scheme = themeMode === 'system' ? (system ?? 'dark') : themeMode;
  const palette = useMemo(() => (scheme === 'dark' ? dark : light), [scheme]);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  useAlarmTicker();

  return (
    <ThemeContext.Provider value={palette}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="alarm/[id]" />
        <Stack.Screen name="alarm/sound" />
        <Stack.Screen name="alarm/wallpaper" />
        <Stack.Screen name="alarm/mission" />
        <Stack.Screen name="alarm/unlock" />
        <Stack.Screen name="ring/[id]" options={{ gestureEnabled: false, animation: 'fade', presentation: 'fullScreenModal' }} />
      </Stack>
    </ThemeContext.Provider>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Root />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
