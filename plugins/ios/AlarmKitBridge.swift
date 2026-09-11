// Added to the app target by plugins/withAlarmKit.js.
// Lives in the app target (not the pod) so App Intents metadata is extracted
// correctly and the alarm buttons can open the app.
import AlarmKit
import AlarmNative
import AppIntents
import CryptoKit
import Foundation
import SwiftUI

/// Intent run by the system alarm's buttons: remembers which alarm fired and
/// opens the app, where the JS ring screen takes over (sound + missions).
@available(iOS 26.0, *)
struct OpenMissionAlarmIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Open Mission Alarm"
  static var openAppWhenRun: Bool = true
  static var isDiscoverable: Bool = false

  @Parameter(title: "Alarm ID")
  var alarmId: String

  init() {}
  init(alarmId: String) { self.alarmId = alarmId }

  func perform() async throws -> some IntentResult {
    UserDefaults.standard.set(alarmId, forKey: "missionalarm.firedAlarmId")
    NotificationCenter.default.post(name: Notification.Name("missionalarm.fired"), object: nil, userInfo: ["alarmId": alarmId])
    return .result()
  }
}

@available(iOS 26.0, *)
struct MissionAlarmMetadata: AlarmMetadata {
  var alarmId: String
}

/// Called from the AlarmNative Expo module via the Objective-C runtime.
@objc(AlarmKitBridge)
public class AlarmKitBridge: NSObject, AlarmKitBridgeProtocol {
  @objc public static func isSupported() -> Bool {
    if #available(iOS 26.0, *) { return true }
    return false
  }

  @objc public static func requestAuthorization(_ completion: @escaping (Bool) -> Void) {
    guard #available(iOS 26.0, *) else { return completion(false) }
    Task {
      do {
        let state = try await AlarmManager.shared.requestAuthorization()
        completion(state == .authorized)
      } catch {
        completion(false)
      }
    }
  }

  @objc public static func schedule(_ id: String, timestamp: Double, label: String, stopText: String, missionText: String, completion: @escaping (String?) -> Void) {
    guard #available(iOS 26.0, *) else { return completion("unsupported") }
    Task {
      do {
        let manager = AlarmManager.shared
        if manager.authorizationState != .authorized {
          let state = try await manager.requestAuthorization()
          if state != .authorized { return completion("unauthorized") }
        }
        let alert = AlarmPresentation.Alert(
          title: LocalizedStringResource(stringLiteral: label.isEmpty ? "Alarm" : label),
          stopButton: AlarmButton(text: LocalizedStringResource(stringLiteral: stopText), textColor: .white, systemImageName: "xmark"),
          secondaryButton: AlarmButton(text: LocalizedStringResource(stringLiteral: missionText), textColor: .white, systemImageName: "figure.run"),
          secondaryButtonBehavior: .custom
        )
        let attributes = AlarmAttributes<MissionAlarmMetadata>(
          presentation: AlarmPresentation(alert: alert),
          metadata: MissionAlarmMetadata(alarmId: id),
          tintColor: Color(red: 0.24, green: 0.84, blue: 0.55)
        )
        let intent = OpenMissionAlarmIntent(alarmId: id)
        let configuration = AlarmManager.AlarmConfiguration(
          schedule: .fixed(Date(timeIntervalSince1970: timestamp / 1000)),
          attributes: attributes,
          stopIntent: intent,
          secondaryIntent: intent,
          sound: .default
        )
        _ = try await manager.schedule(id: uuid(for: id), configuration: configuration)
        completion(nil)
      } catch {
        completion(String(describing: error))
      }
    }
  }

  @objc public static func cancel(_ id: String) {
    guard #available(iOS 26.0, *) else { return }
    try? AlarmManager.shared.cancel(id: uuid(for: id))
  }

  @objc public static func cancelAll() {
    guard #available(iOS 26.0, *) else { return }
    let manager = AlarmManager.shared
    for alarm in (try? manager.alarms) ?? [] {
      try? manager.cancel(id: alarm.id)
    }
  }

  /// Stop the system alert (called once the JS ring screen has taken over).
  @objc public static func stop(_ id: String) {
    guard #available(iOS 26.0, *) else { return }
    try? AlarmManager.shared.stop(id: uuid(for: id))
  }

  @objc public static func takeFiredAlarmId() -> String? {
    let id = UserDefaults.standard.string(forKey: "missionalarm.firedAlarmId")
    if id != nil { UserDefaults.standard.removeObject(forKey: "missionalarm.firedAlarmId") }
    return id
  }

  /// Deterministic UUID for a JS alarm id (AlarmKit requires UUIDs).
  static func uuid(for id: String) -> UUID {
    let digest = Insecure.MD5.hash(data: Data(id.utf8))
    var bytes = Array(digest)
    bytes[6] = (bytes[6] & 0x0f) | 0x30
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    let u = uuid_t(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7], bytes[8], bytes[9], bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15])
    return UUID(uuid: u)
  }
}
