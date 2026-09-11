import ExpoModulesCore

/// Mirrors the @objc static API of AlarmKitBridge (app target). The bridge
/// class conforms to this protocol so the pod can call it without a
/// compile-time dependency on the app target.
@objc public protocol AlarmKitBridgeProtocol {
  static func isSupported() -> Bool
  static func requestAuthorization(_ completion: @escaping (Bool) -> Void)
  static func schedule(_ id: String, timestamp: Double, label: String, stopText: String, missionText: String, completion: @escaping (String?) -> Void)
  static func cancel(_ id: String)
  static func cancelAll()
  static func stop(_ id: String)
  static func takeFiredAlarmId() -> String?
}

/// iOS alarms via AlarmKit (iOS 26+). The AlarmKit code itself lives in the app
/// target (plugins/ios/AlarmKitBridge.swift, added by plugins/withAlarmKit.js)
/// because App Intents must be compiled into the app binary.
public class AlarmNativeModule: Module {
  private var observer: NSObjectProtocol?

  private var bridge: AlarmKitBridgeProtocol.Type? {
    NSClassFromString("AlarmKitBridge") as? AlarmKitBridgeProtocol.Type
  }

  public func definition() -> ModuleDefinition {
    Name("AlarmNative")
    Events("onAlarmLaunch")

    OnCreate {
      self.observer = NotificationCenter.default.addObserver(forName: Notification.Name("missionalarm.fired"), object: nil, queue: .main) { [weak self] note in
        if let id = note.userInfo?["alarmId"] as? String {
          self?.sendEvent("onAlarmLaunch", ["alarmId": id])
        }
      }
    }

    OnDestroy {
      if let o = self.observer { NotificationCenter.default.removeObserver(o) }
    }

    Function("isSupported") { self.bridge?.isSupported() ?? false }

    AsyncFunction("requestAuthorization") { (promise: Promise) in
      guard let bridge = self.bridge else { return promise.resolve(false) }
      bridge.requestAuthorization { granted in promise.resolve(granted) }
    }

    Function("schedule") { (id: String, triggerAt: Double, label: String, stopText: String, missionText: String) in
      self.bridge?.schedule(id, timestamp: triggerAt, label: label, stopText: stopText, missionText: missionText) { error in
        if let error { NSLog("AlarmKit schedule failed: %@", error) }
      }
    }

    Function("cancel") { (id: String) in self.bridge?.cancel(id) }
    Function("cancelAll") { self.bridge?.cancelAll() }
    Function("stop") { (id: String) in self.bridge?.stop(id) }
    Function("takeFiredAlarmId") { () -> String? in self.bridge?.takeFiredAlarmId() }

    Function("dismissNotification") {}
    Function("canScheduleExact") { true }
    Function("openExactAlarmSettings") {}
    Function("showOverLockScreen") { (_: Bool) in }
  }
}
