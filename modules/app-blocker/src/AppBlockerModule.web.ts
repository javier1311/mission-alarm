export const AppBlocker = {
  isSupported: () => false,
  hasUsageAccess: () => false,
  openUsageAccessSettings: () => {},
  hasOverlayPermission: () => false,
  openOverlaySettings: () => {},
  isIgnoringBatteryOptimizations: () => true,
  openBatterySettings: () => {},
  start: () => {},
  stop: () => {},
  isRunning: () => false,
  takeLockLaunch: () => false,
  addLockListener: () => ({ remove() {} }),
};
export default AppBlocker;
