# Getting Started with iBudget

## Prerequisites

### Required
- **Node.js** 18+ (`node --version`)
- **npm** (`npm --version`)
- **Xcode** (for iOS simulator — Mac only)
  - Install from the Mac App Store
  - Open Xcode once to accept the license and install components
  - Install iOS Simulator: Xcode > Settings > Platforms > iOS
- **Watchman** (recommended for Metro file watching)
  ```bash
  brew install watchman
  ```

### For Android
- **Android Studio** — [Download](https://developer.android.com/studio)
  - During setup, ensure these are installed via SDK Manager:
    - Android SDK Platform 34 (or latest)
    - Android SDK Build-Tools
    - Android Emulator
    - Android SDK Platform-Tools
  - Set the `ANDROID_HOME` environment variable. Add to `~/.zshrc`:
    ```bash
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    ```
  - Then `source ~/.zshrc`

---

## Setup

```bash
cd ~/github.com/chaz8081/ibudget

# Install dependencies (already done, but run if pulling fresh)
npm install
```

No Supabase or PowerSync accounts are needed — the app runs in **local-only mode** using PowerSync as a local SQLite database.

---

## Running on iOS Simulator (Mac)

```bash
# Generate the native iOS project
npx expo prebuild --platform ios

# Build and launch on the iOS simulator
npx expo run:ios
```

The first build takes a few minutes. Subsequent runs are much faster.

> **Tip:** If you want to pick a specific simulator:
> ```bash
> npx expo run:ios --device
> ```
> This will show a list of available simulators to choose from.

---

## Running on Android Emulator (Mac)

```bash
# Generate the native Android project
npx expo prebuild --platform android

# Build and launch on the Android emulator
npx expo run:android
```

Make sure an Android emulator is running first, or it will prompt you to start one. You can launch one from Android Studio > Virtual Device Manager.

---

## Running on a Physical Android Phone

### Option A: USB (Recommended for first-time)

1. **Enable Developer Options** on your phone:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
2. **Enable USB Debugging**:
   - Settings > Developer Options > USB Debugging > On
3. Connect your phone via USB cable
4. Verify the device is detected:
   ```bash
   adb devices
   ```
   You should see your device listed. If prompted on the phone, allow USB debugging.
5. Build and run:
   ```bash
   npx expo prebuild --platform android
   npx expo run:android --device
   ```

### Option B: Wireless (after initial USB setup)

1. Connect via USB first and ensure `adb devices` shows your phone
2. Enable wireless debugging:
   ```bash
   adb tcpip 5555
   adb connect <PHONE_IP>:5555
   ```
   Find your phone's IP under Settings > Wi-Fi > your network > IP address
3. Disconnect the USB cable
4. Run:
   ```bash
   npx expo run:android --device
   ```

---

## Running on a Physical iPhone

Running on a physical iPhone requires an Apple Developer account (free tier works).

1. Open the generated Xcode project:
   ```bash
   npx expo prebuild --platform ios
   open ios/ibudget.xcworkspace
   ```
2. In Xcode:
   - Select your iPhone as the build target (top toolbar)
   - Go to Signing & Capabilities > select your Apple Developer team
   - If you don't have a team, add one via Xcode > Settings > Accounts
3. Build and run from Xcode (Cmd+R), or:
   ```bash
   npx expo run:ios --device
   ```
4. On first launch, your iPhone may require you to trust the developer certificate:
   - Settings > General > VPN & Device Management > trust your developer profile

---

## Daily Development

After the initial `prebuild` and first build, you only need:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

Metro (the JS bundler) starts automatically. Code changes to TypeScript/React files hot-reload instantly. You only need to rebuild if you add a new native dependency.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pod install` fails | `cd ios && pod install --repo-update && cd ..` |
| Android build fails with SDK error | Open Android Studio > SDK Manager > install missing SDK |
| Metro port 8081 in use | `npx expo start --port 8082` or kill the process on 8081 |
| "No development build" error | You need `npx expo prebuild` + `npx expo run:ios/android` (not `expo start`) |
| App crashes on launch | Check Metro terminal for red error screen details |
| Prebuild conflicts | `npx expo prebuild --clean` to regenerate native projects from scratch |

---

## Why Not Expo Go?

This project uses PowerSync's native SQLite driver (`@powersync/op-sqlite`), which requires custom native code. Expo Go only supports the standard Expo SDK modules. That's why we use **dev builds** via `npx expo run:ios/android` instead.
