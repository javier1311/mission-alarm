import ExpoModulesCore

public class PoseCameraModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PoseCamera")

    Function("isAvailable") { true }

    View(PoseCameraView.self) {
      Events("onPose")
      Prop("facing") { (view: PoseCameraView, facing: String) in
        view.facing = facing
      }
    }
  }
}
