package expo.modules.alarmnative

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AlarmNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No react context")

  override fun definition() = ModuleDefinition {
    Name("AlarmNative")

    Events("onAlarmLaunch")

    Function("isSupported") { true }

    Function("schedule") { id: String, triggerAt: Double, label: String, _: String, _: String ->
      AlarmStore.schedule(context, id, triggerAt.toLong(), label)
    }

    Function("cancel") { id: String -> AlarmStore.cancel(context, id) }

    Function("cancelAll") { AlarmStore.cancelAll(context) }

    /** Alarm id that launched (or is launching) the app, if any. Cleared once read. */
    Function("takeFiredAlarmId") {
      val fromIntent = appContext.currentActivity?.intent?.getStringExtra(AlarmStore.EXTRA_ALARM_ID)
      if (fromIntent != null) appContext.currentActivity?.intent?.removeExtra(AlarmStore.EXTRA_ALARM_ID)
      AlarmStore.takeFired(context) ?: fromIntent
    }

    Function("dismissNotification") { AlarmReceiver.dismiss(context) }

    Function("stop") { _: String -> AlarmReceiver.dismiss(context) }

    AsyncFunction("requestAuthorization") { true }

    Function("canScheduleExact") { AlarmStore.canScheduleExact(context) }

    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= 31) {
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    /** Show the activity over the lock screen and turn the screen on (call from the ring screen). */
    Function("showOverLockScreen") { enabled: Boolean ->
      val activity = appContext.currentActivity ?: return@Function
      activity.runOnUiThread {
        if (Build.VERSION.SDK_INT >= 27) {
          activity.setShowWhenLocked(enabled)
          activity.setTurnScreenOn(enabled)
          if (enabled) {
            val km = activity.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            km.requestDismissKeyguard(activity, null)
          }
        }
      }
    }

    OnNewIntent { intent ->
      val id = intent.getStringExtra(AlarmStore.EXTRA_ALARM_ID)
      if (id != null) {
        AlarmStore.setFired(context, null)
        sendEvent("onAlarmLaunch", mapOf("alarmId" to id))
      }
    }
  }
}
