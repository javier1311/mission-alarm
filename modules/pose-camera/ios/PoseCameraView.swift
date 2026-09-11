import AVFoundation
import ExpoModulesCore
import MLKitPoseDetection
import MLKitVision

/// Camera preview that runs ML Kit pose detection (stream mode) and emits
/// normalised landmarks to JS. Frames are rotated to portrait by the capture
/// connection so landmark coordinates are always upright.
class PoseCameraView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {
  let onPose = EventDispatcher()

  private let session = AVCaptureSession()
  private let sessionQueue = DispatchQueue(label: "posecamera.session")
  private let videoQueue = DispatchQueue(label: "posecamera.video")
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var detector: PoseDetector?
  private var lastEmit: TimeInterval = 0
  private var configured = false

  var facing: String = "front" {
    didSet {
      if oldValue != facing && configured {
        sessionQueue.async { self.configureInputs() }
      }
    }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    let options = PoseDetectorOptions()
    options.detectorMode = .stream
    detector = PoseDetector.poseDetector(options: options)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    previewLayer?.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      start()
    } else {
      stop()
    }
  }

  private func start() {
    sessionQueue.async {
      if !self.configured {
        self.configureSession()
        self.configured = true
      }
      if !self.session.isRunning { self.session.startRunning() }
    }
  }

  private func stop() {
    sessionQueue.async {
      if self.session.isRunning { self.session.stopRunning() }
    }
  }

  private func configureSession() {
    session.beginConfiguration()
    session.sessionPreset = .vga640x480
    configureInputs()

    let output = AVCaptureVideoDataOutput()
    output.alwaysDiscardsLateVideoFrames = true
    output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
    output.setSampleBufferDelegate(self, queue: videoQueue)
    if session.canAddOutput(output) { session.addOutput(output) }
    orientConnection(output.connection(with: .video))
    session.commitConfiguration()

    DispatchQueue.main.async {
      let layer = AVCaptureVideoPreviewLayer(session: self.session)
      layer.videoGravity = .resizeAspectFill
      layer.frame = self.bounds
      self.layer.addSublayer(layer)
      self.previewLayer = layer
    }
  }

  private func configureInputs() {
    for input in session.inputs { session.removeInput(input) }
    let position: AVCaptureDevice.Position = facing == "back" ? .back : .front
    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
          let input = try? AVCaptureDeviceInput(device: device),
          session.canAddInput(input) else { return }
    session.addInput(input)
    for output in session.outputs { orientConnection(output.connection(with: .video)) }
  }

  private func orientConnection(_ connection: AVCaptureConnection?) {
    guard let connection else { return }
    if #available(iOS 17.0, *) {
      if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
    } else if connection.isVideoOrientationSupported {
      connection.videoOrientation = .portrait
    }
    if connection.isVideoMirroringSupported {
      connection.automaticallyAdjustsVideoMirroring = false
      connection.isVideoMirrored = facing != "back"
    }
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    let now = Date().timeIntervalSince1970
    if now - lastEmit < 0.066 { return } // ~15 fps
    guard let detector, let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    let width = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
    let height = CGFloat(CVPixelBufferGetHeight(pixelBuffer))
    let image = VisionImage(buffer: sampleBuffer)
    image.orientation = .up

    var poses: [Pose] = []
    do {
      poses = try detector.results(in: image)
    } catch {
      return
    }
    lastEmit = now
    guard let pose = poses.first else {
      emit(landmarks: [:], width: width, height: height)
      return
    }
    var landmarks: [String: [String: Double]] = [:]
    for (name, type) in PoseCameraView.landmarkTypes {
      let lm = pose.landmark(ofType: type)
      landmarks[name] = [
        "x": Double(lm.position.x / width),
        "y": Double(lm.position.y / height),
        "score": Double(lm.inFrameLikelihood),
      ]
    }
    emit(landmarks: landmarks, width: width, height: height)
  }

  private func emit(landmarks: [String: [String: Double]], width: CGFloat, height: CGFloat) {
    DispatchQueue.main.async {
      self.onPose([
        "landmarks": landmarks,
        "width": Int(width),
        "height": Int(height),
        "mirrored": self.facing != "back",
      ])
    }
  }

  static let landmarkTypes: [(String, PoseLandmarkType)] = [
    ("nose", .nose),
    ("leftShoulder", .leftShoulder),
    ("rightShoulder", .rightShoulder),
    ("leftElbow", .leftElbow),
    ("rightElbow", .rightElbow),
    ("leftWrist", .leftWrist),
    ("rightWrist", .rightWrist),
    ("leftHip", .leftHip),
    ("rightHip", .rightHip),
    ("leftKnee", .leftKnee),
    ("rightKnee", .rightKnee),
    ("leftAnkle", .leftAnkle),
    ("rightAnkle", .rightAnkle),
  ]
}
