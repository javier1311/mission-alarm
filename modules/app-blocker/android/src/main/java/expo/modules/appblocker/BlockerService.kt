package expo.modules.appblocker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

/**
 * Foreground service that watches which app is in the foreground (UsageStats)
 * and brings this app back to the front whenever a non-allowed app appears.
 *
 * Safety: blocking always ends at `until` (hard-capped at MAX_DURATION_MS)
 * so a bug can never lock the phone permanently.
 */
class BlockerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastForeground: String? = null
  private var lastLaunch = 0L

  private val tick = object : Runnable {
    override fun run() {
      if (System.currentTimeMillis() >= until) {
        stopSelf()
        return
      }
      checkForeground()
      handler.postDelayed(this, POLL_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    intent?.let {
      until = minOf(it.getLongExtra(EXTRA_UNTIL, 0L), System.currentTimeMillis() + MAX_DURATION_MS)
      allowed = it.getStringArrayListExtra(EXTRA_ALLOWED)?.toSet() ?: emptySet()
      launchExtra = it.getStringExtra(EXTRA_LAUNCH_EXTRA) ?: "locked"
    }
    startForegroundCompat()
    running = true
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  override fun onDestroy() {
    running = false
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  private fun startForegroundCompat() {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_ID) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "App lock", NotificationManager.IMPORTANCE_LOW))
    }
    val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 1, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setContentTitle("Apps are locked")
      .setContentText("Complete the mission in Mission Alarm to unlock")
      .setOngoing(true)
      .setContentIntent(open)
      .build()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun checkForeground() {
    val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val events = usm.queryEvents(now - 3000, now)
    val event = UsageEvents.Event()
    var latest: String? = null
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val type = event.eventType
      if (type == UsageEvents.Event.ACTIVITY_RESUMED || type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
        latest = event.packageName
      }
    }
    val fg = latest ?: lastForeground ?: return
    lastForeground = fg
    if (fg == packageName || fg in allowed || fg in SYSTEM_ALLOWED) return
    if (now - lastLaunch < 1500) return
    lastLaunch = now
    bringAppToFront()
  }

  private fun bringAppToFront() {
    val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return
    intent.putExtra(launchExtra, true)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    try {
      startActivity(intent)
    } catch (_: Exception) {}
  }

  companion object {
    const val EXTRA_UNTIL = "until"
    const val EXTRA_ALLOWED = "allowed"
    const val EXTRA_LAUNCH_EXTRA = "launchExtra"
    const val CHANNEL_ID = "mission_alarm_lock"
    const val NOTIFICATION_ID = 4243
    const val POLL_MS = 400L
    const val MAX_DURATION_MS = 3 * 60 * 60 * 1000L

    @Volatile var running = false
    @Volatile var until = 0L
    @Volatile var allowed: Set<String> = emptySet()
    @Volatile var launchExtra = "locked"

    /** Packages that must never be blocked (launcher-independent system UI, dialer for emergencies). */
    val SYSTEM_ALLOWED = setOf(
      "com.android.systemui",
      "com.android.phone",
      "com.android.dialer",
      "com.google.android.dialer",
      "com.android.emergency",
      "com.android.incallui",
      "com.samsung.android.dialer",
      "com.samsung.android.incallui",
      "android",
    )
  }
}
