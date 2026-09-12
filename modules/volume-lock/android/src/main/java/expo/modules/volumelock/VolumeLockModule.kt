package expo.modules.volumelock

import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Keeps the media (and alarm) stream volume at a fixed level while the alarm
 * rings, so the hardware volume buttons can't silence it.
 */
class VolumeLockModule : Module() {
  private val handler = Handler(Looper.getMainLooper())
  private var target = -1.0
  private val streams = intArrayOf(AudioManager.STREAM_MUSIC, AudioManager.STREAM_ALARM)

  private val audio: AudioManager
    get() = (appContext.reactContext ?: throw IllegalStateException("No context"))
      .getSystemService(Context.AUDIO_SERVICE) as AudioManager

  private val tick = object : Runnable {
    override fun run() {
      if (target < 0) return
      apply()
      handler.postDelayed(this, 200)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("VolumeLock")

    Function("lock") { volume: Double ->
      target = volume.coerceIn(0.05, 1.0)
      handler.removeCallbacks(tick)
      handler.post(tick)
    }

    Function("unlock") {
      target = -1.0
      handler.removeCallbacks(tick)
    }

    Function("isSupported") { true }
  }

  private fun apply() {
    try {
      val am = audio
      for (stream in streams) {
        val max = am.getStreamMaxVolume(stream)
        val wanted = max(1, (target * max).roundToInt())
        if (am.getStreamVolume(stream) != wanted) am.setStreamVolume(stream, wanted, 0)
      }
    } catch (_: Exception) {}
  }
}
