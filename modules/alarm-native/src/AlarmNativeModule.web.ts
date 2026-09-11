export const AlarmNative = {
  isSupported: () => false,
  schedule: () => {},
  cancel: () => {},
  cancelAll: () => {},
  takeFiredAlarmId: () => null as string | null,
  dismissNotification: () => {},
  stop: () => {},
  requestAuthorization: () => Promise.resolve(false),
  canScheduleExact: () => true,
  openExactAlarmSettings: () => {},
  showOverLockScreen: () => {},
  addLaunchListener: () => ({ remove() {} }),
};
export default AlarmNative;
