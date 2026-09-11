import { useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

/** Wraps a camera mission: asks for permission, renders children only when granted. */
export function CameraGate({ children, fg }: { children: React.ReactNode; fg: string }) {
  const { t } = useTranslation();
  const [perm, request] = useCameraPermissions();

  useEffect(() => {
    if (perm && !perm.granted && perm.canAskAgain) request();
  }, [perm, request]);

  if (!perm) return null;
  if (perm.granted) return <>{children}</>;
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
      <Text style={{ color: fg, textAlign: 'center' }}>{t('ring.permissionCamera')}</Text>
      <Button title={t('ring.openSettings')} kind="secondary" onPress={() => (perm.canAskAgain ? request() : Linking.openSettings())} />
    </View>
  );
}
