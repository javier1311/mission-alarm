package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No react context")

  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    Events("onLockLaunch")

    Function("isSupported") { true }

    // --- permissions -------------------------------------------------------
    Function("hasUsageAccess") {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= 29) {
        appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }
    Function("openUsageAccessSettings") { open(Settings.ACTION_USAGE_ACCESS_SETTINGS) }

    Function("hasOverlayPermission") { Settings.canDrawOverlays(context) }
    Function("openOverlaySettings") {
      open(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
    }

    Function("isIgnoringBatteryOptimizations") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }
    Function("openBatterySettings") {
      open(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${context.packageName}"))
    }

    // --- blocking ------------------------------------------------------------
    /** Start blocking every app except this one until `until` (epoch ms). */
    Function("start") { until: Double, allowed: List<String> ->
      val intent = Intent(context, BlockerService::class.java).apply {
        putExtra(BlockerService.EXTRA_UNTIL, until.toLong())
        putStringArrayListExtra(BlockerService.EXTRA_ALLOWED, ArrayList(allowed))
      }
      ContextCompat.startForegroundService(context, intent)
    }

    Function("stop") {
      context.stopService(Intent(context, BlockerService::class.java))
      BlockerService.running = false
    }

    Function("isRunning") { BlockerService.running }

    /** True when the app was brought to front by the blocker; cleared once read. */
    Function("takeLockLaunch") {
      val intent = appContext.currentActivity?.intent
      val locked = intent?.getBooleanExtra("locked", false) ?: false
      if (locked) intent?.removeExtra("locked")
      locked
    }

    OnNewIntent { intent ->
      if (intent.getBooleanExtra("locked", false)) {
        intent.removeExtra("locked")
        sendEvent("onLockLaunch", mapOf("locked" to true))
      }
    }
  }

  private fun open(action: String, data: Uri? = null) {
    val intent = Intent(action)
    if (data != null) intent.data = data
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(intent)
    } catch (_: Exception) {
      val fallback = Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(fallback)
    }
  }
}
