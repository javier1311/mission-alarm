package expo.modules.alarmnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Re-registers alarms with AlarmManager after reboot, app update or clock changes. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    AlarmStore.rescheduleAll(context)
  }
}
