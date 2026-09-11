package expo.modules.posecamera

import android.content.Context
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Front/back camera preview that runs ML Kit pose detection on every frame
 * (stream mode, keep-latest) and emits normalised landmarks to JS.
 */
class PoseCameraView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onPose by EventDispatcher<Map<String, Any>>()

  private val previewView = PreviewView(context).apply {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
    scaleType = PreviewView.ScaleType.FILL_CENTER
  }
  private val analysisExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private var cameraProvider: ProcessCameraProvider? = null
  private var detector: PoseDetector? = null
  private var lastEmit = 0L

  var facing: String = "front"
    set(value) {
      if (field != value) {
        field = value
        if (isAttachedToWindow) bindCamera()
      }
    }

  init {
    addView(previewView)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    bindCamera()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    release()
  }

  private fun bindCamera() {
    val lifecycleOwner = appContext.currentActivity as? LifecycleOwner ?: return
    val future = ProcessCameraProvider.getInstance(context)
    future.addListener({
      try {
        val provider = future.get()
        cameraProvider = provider
        provider.unbindAll()

        val preview = Preview.Builder().build().also { it.surfaceProvider = previewView.surfaceProvider }

        val options = PoseDetectorOptions.Builder()
          .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
          .setPreferredHardwareConfigs(PoseDetectorOptions.CPU_GPU)
          .build()
        detector?.close()
        detector = PoseDetection.getClient(options)

        val analysis = ImageAnalysis.Builder()
          .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
          .build()
        analysis.setAnalyzer(analysisExecutor) { proxy -> analyze(proxy) }

        val wanted = if (facing == "back") CameraSelector.DEFAULT_BACK_CAMERA else CameraSelector.DEFAULT_FRONT_CAMERA
        val other = if (facing == "back") CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
        // Fall back to whichever camera exists (emulators often have only one).
        val selector = if (provider.hasCamera(wanted)) wanted else other
        provider.bindToLifecycle(lifecycleOwner, selector, preview, analysis)
      } catch (e: Exception) {
        Log.e("PoseCamera", "bind failed", e)
      }
    }, ContextCompat.getMainExecutor(context))
  }

  @androidx.camera.core.ExperimentalGetImage
  private fun analyze(proxy: ImageProxy) {
    val mediaImage = proxy.image
    val det = detector
    if (mediaImage == null || det == null) {
      proxy.close()
      return
    }
    val rotation = proxy.imageInfo.rotationDegrees
    val image = InputImage.fromMediaImage(mediaImage, rotation)
    // Dimensions of the upright image that landmark coordinates refer to.
    val upright = rotation == 90 || rotation == 270
    val w = if (upright) proxy.height else proxy.width
    val h = if (upright) proxy.width else proxy.height
    det.process(image)
      .addOnSuccessListener { pose -> emit(pose, w, h) }
      .addOnCompleteListener { proxy.close() }
  }

  private fun emit(pose: Pose, width: Int, height: Int) {
    val now = System.currentTimeMillis()
    if (now - lastEmit < 66) return // ~15 fps max to JS
    lastEmit = now
    val landmarks = HashMap<String, Map<String, Double>>()
    for ((name, type) in LANDMARKS) {
      val lm = pose.getPoseLandmark(type) ?: continue
      landmarks[name] = mapOf(
        "x" to (lm.position.x / width).toDouble(),
        "y" to (lm.position.y / height).toDouble(),
        "score" to lm.inFrameLikelihood.toDouble(),
      )
    }
    onPose(mapOf(
      "landmarks" to landmarks,
      "width" to width,
      "height" to height,
      "mirrored" to (facing != "back"),
    ))
  }

  private fun release() {
    try {
      cameraProvider?.unbindAll()
    } catch (_: Exception) {}
    detector?.close()
    detector = null
  }

  companion object {
    val LANDMARKS = mapOf(
      "nose" to PoseLandmark.NOSE,
      "leftShoulder" to PoseLandmark.LEFT_SHOULDER,
      "rightShoulder" to PoseLandmark.RIGHT_SHOULDER,
      "leftElbow" to PoseLandmark.LEFT_ELBOW,
      "rightElbow" to PoseLandmark.RIGHT_ELBOW,
      "leftWrist" to PoseLandmark.LEFT_WRIST,
      "rightWrist" to PoseLandmark.RIGHT_WRIST,
      "leftHip" to PoseLandmark.LEFT_HIP,
      "rightHip" to PoseLandmark.RIGHT_HIP,
      "leftKnee" to PoseLandmark.LEFT_KNEE,
      "rightKnee" to PoseLandmark.RIGHT_KNEE,
      "leftAnkle" to PoseLandmark.LEFT_ANKLE,
      "rightAnkle" to PoseLandmark.RIGHT_ANKLE,
    )
  }
}
