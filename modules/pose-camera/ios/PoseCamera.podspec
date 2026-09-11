Pod::Spec.new do |s|
  s.name           = 'PoseCamera'
  s.version        = '1.0.0'
  s.summary        = 'Camera preview with ML Kit pose detection'
  s.description    = 'Camera preview view that streams ML Kit pose landmarks to JS'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMLKit/PoseDetection', '~> 8.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
