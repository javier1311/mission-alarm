import AVFoundation
import ExpoModulesCore
import MediaPlayer

/// Keeps the media volume at a fixed level while the alarm rings, so the
/// hardware volume buttons can't silence it. Uses the (hidden) MPVolumeView
/// slider, which is the only public way to set the system volume on iOS.
public class VolumeLockModule: Module {
  private var volumeView: MPVolumeView?
  private var target: Float = -1
  private var observation: NSKeyValueObservation?

  public func definition() -> ModuleDefinition {
    Name("VolumeLock")

    Function("lock") { (volume: Double) in
      self.target = Float(max(0.05, min(1.0, volume)))
      DispatchQueue.main.async {
        if self.volumeView == nil {
          let view = MPVolumeView(frame: CGRect(x: -2000, y: -2000, width: 10, height: 10))
          view.alpha = 0.01
          view.isUserInteractionEnabled = false
          let window = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
          window?.addSubview(view)
          self.volumeView = view
        }
        self.apply()
      }
      let session = AVAudioSession.sharedInstance()
      try? session.setActive(true)
      self.observation = session.observe(\.outputVolume, options: [.new]) { [weak self] _, _ in
        self?.apply()
      }
    }

    Function("unlock") {
      self.target = -1
      self.observation = nil
      DispatchQueue.main.async {
        self.volumeView?.removeFromSuperview()
        self.volumeView = nil
      }
    }

    Function("isSupported") { true }
  }

  private func apply() {
    guard target >= 0 else { return }
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
      guard self.target >= 0,
            let slider = self.volumeView?.subviews.compactMap({ $0 as? UISlider }).first else { return }
      if abs(slider.value - self.target) > 0.02 {
        slider.value = self.target
        slider.sendActions(for: .touchUpInside)
      }
    }
  }
}
