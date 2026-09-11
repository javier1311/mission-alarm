package expo.modules.alarmnative

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Fires when an alarm is due: wakes the device, posts a full-screen-intent
 * notification (which launches the app over the lock screen) and remembers
 * the alarm id so JS can open the ring screen.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra(AlarmStore.EXTRA_ALARM_ID) ?: return
    val label = AlarmStore.all(context).optJSONObject(id)?.optString("label").orEmpty()

    // The alarm has fired — drop it from the persisted list (JS reschedules repeats).
    AlarmStore.cancel(context, id)
    AlarmStore.setFired(context, id)

    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    @Suppress("DEPRECATION")
    val wakeLock = pm.newWakeLock(
      PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
      "missionalarm:fire",
    )
    wakeLock.acquire(60_000)

    val launch = launchIntent(context, id)
    val fullScreen = PendingIntent.getActivity(
      context, id.hashCode(), launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    ensureChannel(context, nm)
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(label.ifEmpty { "Alarm" })
      .setContentText("Tap to open")
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(fullScreen)
      .setFullScreenIntent(fullScreen, true)
      .build()
    nm.notify(NOTIFICATION_ID, notification)

    // Also try to start the activity directly (works when the app has the
    // "display over other apps" permission or is already in the foreground).
    try {
      context.startActivity(launch)
    } catch (_: Exception) {}
  }

  companion object {
    const val CHANNEL_ID = "mission_alarm_ring"
    const val NOTIFICATION_ID = 4242

    fun launchIntent(context: Context, alarmId: String): Intent {
      val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)!!
      intent.putExtra(AlarmStore.EXTRA_ALARM_ID, alarmId)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
      return intent
    }

    fun ensureChannel(context: Context, nm: NotificationManager) {
      if (nm.getNotificationChannel(CHANNEL_ID) != null) return
      val channel = NotificationChannel(CHANNEL_ID, "Alarm", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Ringing alarm"
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        setBypassDnd(true)
        enableVibration(true)
        val attrs = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), attrs)
      }
      nm.createNotificationChannel(channel)
    }

    fun dismiss(context: Context) {
      (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(NOTIFICATION_ID)
    }
  }
}
