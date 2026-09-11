import ExpoModulesCore

/// iOS: app blocking needs the Screen Time (FamilyControls) entitlement, which
/// requires a paid Apple Developer account. Stubbed until then.
public class AppBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppBlocker")
    Events("onLockLaunch")
    Function("isSupported") { false }
    Function("hasUsageAccess") { false }
    Function("openUsageAccessSettings") {}
    Function("hasOverlayPermission") { false }
    Function("openOverlaySettings") {}
    Function("isIgnoringBatteryOptimizations") { true }
    Function("openBatterySettings") {}
    Function("start") { (_: Double, _: [String]) in }
    Function("stop") {}
    Function("isRunning") { false }
    Function("takeLockLaunch") { false }
  }
}
