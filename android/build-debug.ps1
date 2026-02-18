# Build Android debug APK (sets JAVA_HOME for this session)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "$PSScriptRoot\gradlew.bat" assembleDebug
