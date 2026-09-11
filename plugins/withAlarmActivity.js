const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Lets MainActivity appear over the lock screen and wake the display when an
 * alarm fires (launched by AlarmReceiver's full-screen intent).
 */
module.exports = function withAlarmActivity(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const main = app?.activity?.find((a) => a.$['android:name'] === '.MainActivity');
    if (main) {
      main.$['android:showWhenLocked'] = 'true';
      main.$['android:turnScreenOn'] = 'true';
      main.$['android:excludeFromRecents'] = 'false';
    }
    return config;
  });
};
