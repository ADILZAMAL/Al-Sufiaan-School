# Building Android App - Al-Sufiaan Attendance

This guide covers different methods to build the Android version of the app.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli` or `npm install -g eas-cli`
- For local builds: Android Studio with Android SDK installed

---

## Method 1: EAS Build (Recommended - Cloud Build)

EAS Build is Expo's cloud-based build service. It's the easiest way to build production-ready Android apps.

### Setup

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account:**
   ```bash
   eas login
   ```
   (Create an account at https://expo.dev if you don't have one)

3. **Configure EAS Build:**
   ```bash
   cd mobile
   eas build:configure
   ```
   This will create an `eas.json` file with build configuration.

4. **Build Android APK (for testing/distribution):**
   ```bash
   eas build --platform android --profile preview
   ```

5. **Build Android App Bundle (AAB) for Google Play Store:**
   ```bash
   eas build --platform android --profile production
   ```

### EAS Build Profiles

After running `eas build:configure`, you can customize profiles in `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Downloading Builds

- Builds are uploaded to Expo's servers
- You'll get a download link when the build completes
- Or download via: `eas build:list` and `eas build:download [build-id]`

---

## Method 2: Local Build (Requires Android Studio)

Build the app locally on your machine. Requires more setup but gives you full control.

### Setup Android Studio

1. **Install Android Studio:**
   - Download from https://developer.android.com/studio
   - Install Android SDK (API level 33 or higher recommended)
   - Install Android SDK Build-Tools
   - Set up Android Virtual Device (AVD) if testing on emulator

2. **Set Environment Variables:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
   Add these to your `~/.zshrc` or `~/.bash_profile` for persistence.

3. **Install Java Development Kit (JDK):**
   ```bash
   # On macOS with Homebrew
   brew install openjdk@17
   ```

### Build Commands

1. **Generate native Android project:**
   ```bash
   cd mobile
   npx expo prebuild --platform android
   ```
   This creates an `android/` directory with native Android code.

2. **Build APK (Debug):**
   ```bash
   npx expo run:android
   ```
   This builds and installs on connected device/emulator.

3. **Build APK (Release) manually:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

4. **Build App Bundle (AAB) for Play Store:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Signing the Release Build

For release builds, you need to sign the APK/AAB:

1. **Generate a keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/keystore.properties`:**
   ```properties
   storePassword=your-store-password
   keyPassword=your-key-password
   keyAlias=my-key-alias
   storeFile=../my-release-key.keystore
   ```

3. **Update `android/app/build.gradle`:**
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                   def keystorePropertiesFile = rootProject.file("keystore.properties")
                   def keystoreProperties = new Properties()
                   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               ...
           }
       }
   }
   ```

---

## Method 3: Development Build (For Testing)

For testing on physical devices during development:

1. **Start Expo development server:**
   ```bash
   cd mobile
   npm start
   ```

2. **Run on Android device/emulator:**
   ```bash
   npm run android
   ```
   Or scan the QR code with Expo Go app (for simple apps) or a development build.

---

## Quick Start (EAS Build - Easiest)

If you just want to build quickly:

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Navigate to mobile directory
cd mobile

# 4. Configure (first time only)
eas build:configure

# 5. Build Android APK
eas build --platform android --profile preview
```

Wait for the build to complete (usually 10-20 minutes), then download the APK from the provided link.

---

## Troubleshooting

### EAS Build Issues

- **Build fails**: Check `eas.json` configuration
- **Missing credentials**: Run `eas credentials` to set up signing keys
- **Timeout**: Free tier has build time limits; consider upgrading

### Local Build Issues

- **Gradle errors**: Run `cd android && ./gradlew clean`
- **SDK not found**: Verify `ANDROID_HOME` environment variable
- **Java version**: Ensure JDK 17 is installed and configured
- **Metro bundler issues**: Clear cache with `expo start -c`

### General Issues

- **Dependencies**: Run `npm install` to ensure all packages are installed
- **Cache**: Clear Expo cache: `expo start -c`
- **Node modules**: Delete `node_modules` and reinstall if needed

---

## Publishing to Google Play Store

1. **Build production AAB:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Download the AAB file**

3. **Go to Google Play Console**: https://play.google.com/console

4. **Create a new app** (if first time) or select existing app

5. **Upload the AAB** in the "Production" or "Internal testing" track

6. **Fill in store listing** (description, screenshots, etc.)

7. **Submit for review**

---

## Notes

- **APK vs AAB**: APK is for direct installation/testing, AAB is required for Google Play Store
- **Signing**: All release builds must be signed. EAS Build handles this automatically.
- **Version**: Update version in `app.json` before each build
- **Package name**: Currently set to `com.alsufiaanschool.attendance` in `app.json`

---

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android App Signing](https://docs.expo.dev/app-signing/app-credentials/)
- [Google Play Console](https://play.google.com/console)
