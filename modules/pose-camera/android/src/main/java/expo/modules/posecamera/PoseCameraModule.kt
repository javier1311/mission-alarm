package expo.modules.posecamera

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PoseCameraModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PoseCamera")

    Function("isAvailable") { true }

    View(PoseCameraView::class) {
      Events("onPose")
      Prop("facing") { view: PoseCameraView, facing: String -> view.facing = facing }
    }
  }
}
