package expo.modules.alarmnative

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject

/**
 * Persists scheduled alarms (id -> trigger time, label) so they can be
 * re-registered after reboot / app update, and wraps AlarmManager.
 */
object AlarmStore {
  private const val PREFS = "mission_alarm_native"
  private const val KEY_ALARMS = "alarms"
  private const val KEY_FIRED = "firedAlarmId"
  const val EXTRA_ALARM_ID = "alarmId"
  const val ACTION_FIRE = "expo.modules.alarmnative.FIRE"

  private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun all(ctx: Context): JSONObject =
    try { JSONObject(prefs(ctx).getString(KEY_ALARMS, "{}") ?: "{}") } catch (_: Exception) { JSONObject() }

  private fun save(ctx: Context, obj: JSONObject) {
    prefs(ctx).edit().putString(KEY_ALARMS, obj.toString()).apply()
  }

  fun schedule(ctx: Context, id: String, triggerAt: Long, label: String) {
    val all = all(ctx)
    all.put(id, JSONObject().put("triggerAt", triggerAt).put("label", label))
    save(ctx, all)
    register(ctx, id, triggerAt)
  }

  fun cancel(ctx: Context, id: String) {
    val all = all(ctx)
    all.remove(id)
    save(ctx, all)
    alarmManager(ctx).cancel(firePendingIntent(ctx, id))
  }

  fun cancelAll(ctx: Context) {
    val all = all(ctx)
    for (id in all.keys()) alarmManager(ctx).cancel(firePendingIntent(ctx, id))
    save(ctx, JSONObject())
  }

  /** Re-register every stored alarm that is still in the future (used after reboot). */
  fun rescheduleAll(ctx: Context) {
    val all = all(ctx)
    val now = System.currentTimeMillis()
    for (id in all.keys()) {
      val triggerAt = all.getJSONObject(id).getLong("triggerAt")
      if (triggerAt > now) register(ctx, id, triggerAt)
    }
  }

  fun setFired(ctx: Context, id: String?) {
    prefs(ctx).edit().putString(KEY_FIRED, id).apply()
  }

  fun takeFired(ctx: Context): String? {
    val id = prefs(ctx).getString(KEY_FIRED, null)
    if (id != null) prefs(ctx).edit().remove(KEY_FIRED).apply()
    return id
  }

  fun canScheduleExact(ctx: Context): Boolean =
    if (Build.VERSION.SDK_INT >= 31) alarmManager(ctx).canScheduleExactAlarms() else true

  private fun alarmManager(ctx: Context) = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun firePendingIntent(ctx: Context, id: String): PendingIntent {
    val intent = Intent(ctx, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
      putExtra(EXTRA_ALARM_ID, id)
      data = android.net.Uri.parse("missionalarm://alarm/$id") // makes the PendingIntent unique per id
    }
    return PendingIntent.getBroadcast(ctx, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun register(ctx: Context, id: String, triggerAt: Long) {
    val am = alarmManager(ctx)
    val fire = firePendingIntent(ctx, id)
    val showIntent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let {
      PendingIntent.getActivity(ctx, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    if (canScheduleExact(ctx)) {
      // setAlarmClock: exact, survives Doze, shows the alarm icon in the status bar.
      am.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAt, showIntent), fire)
    } else {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, fire)
    }
  }
}
