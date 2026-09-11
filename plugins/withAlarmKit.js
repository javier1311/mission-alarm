const fs = require('fs');
const path = require('path');
const { withInfoPlist, withXcodeProject, IOSConfig } = require('expo/config-plugins');

/**
 * iOS AlarmKit support:
 *  - NSAlarmKitUsageDescription in Info.plist
 *  - copies plugins/ios/AlarmKitBridge.swift into the app target (App Intents
 *    must be compiled in the app target, not in a pod)
 */
module.exports = function withAlarmKit(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSAlarmKitUsageDescription =
      config.modResults.NSAlarmKitUsageDescription ?? 'Mission Alarm schedules your alarms so they ring even in silent mode and Focus.';
    return config;
  });

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const src = path.join(config.modRequest.projectRoot, 'plugins', 'ios', 'AlarmKitBridge.swift');
    const destDir = path.join(config.modRequest.platformProjectRoot, projectName);
    const dest = path.join(destDir, 'AlarmKitBridge.swift');
    fs.copyFileSync(src, dest);

    const relative = `${projectName}/AlarmKitBridge.swift`;
    if (!project.hasFile(relative)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: relative,
        groupName: projectName,
        project,
      });
    }
    return config;
  });

  return config;
};
