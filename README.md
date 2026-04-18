# astrology-me
Astrology super app

## Android APK (beginner-friendly guide)

If you are new to coding, the **least confusing best practice** is:

1. Keep **one repository** (this one) for now.
2. Keep building your web app normally.
3. Use Capacitor only as a wrapper to turn the same app into Android.

This avoids having separate web/mobile codebases.

---

## What does “run Capacitor / Gradle commands” mean?

- **Capacitor commands** (`npx cap ...`) copy your built web files into an Android project and manage the native wrapper.
- **Gradle commands** (`./gradlew ...`) are Android build commands that produce the APK file.

So in plain terms:
- Capacitor prepares the Android app project.
- Gradle compiles that project into an installable APK.

---

## One-time setup

### 1) Install dependencies

```bash
npm install
```

### 2) Create Android project files (only once)

```bash
npx cap add android
```

After this, an `android/` folder is created.

---

## Build an APK you can install on your phone

### Fast path (already scripted)

```bash
npm run android:apk:debug
```

This does 3 things:
1. Builds web app (`vite build`)
2. Syncs into Android (`cap sync android`)
3. Builds debug APK (`./gradlew assembleDebug`)

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Codespaces troubleshooting (common build errors)

### Error 1: `Unsupported class file major version 69`

This means Java 25 is being used. For Android/Gradle here, use JDK 21.

```bash
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

> If you see `Could not open lock file /var/lib/dpkg/lock-frontend ... are you root?`, you ran `apt-get` without `sudo`.

### Error 2: `SDK location not found`

This means Android SDK is not installed/configured in Codespaces yet.

Install Android command-line tools:

```bash
mkdir -p "$HOME/android-sdk/cmdline-tools"
cd "$HOME/android-sdk/cmdline-tools"
curl -L -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip
unzip -q cmdline-tools.zip
mv cmdline-tools latest
```

Configure environment + install required SDK packages:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Point Gradle to your SDK:

```bash
printf "sdk.dir=%s\n" "$ANDROID_HOME" > android/local.properties
```

Retry build:

```bash
npm run android:apk:debug
```

Optional (persist settings for every new terminal):

```bash
echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> ~/.bashrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.bashrc
echo 'export ANDROID_HOME="$HOME/android-sdk"' >> ~/.bashrc
echo 'export ANDROID_SDK_ROOT="$ANDROID_HOME"' >> ~/.bashrc
echo 'export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"' >> ~/.bashrc
source ~/.bashrc
```

---

## Install the APK directly on your phone

### Option A (USB from your computer)

1. On phone: enable **Developer options** and **USB debugging**.
2. Connect phone by USB.
3. Run:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B (download on phone)

1. Copy `app-debug.apk` to cloud storage (Google Drive/Dropbox) or email it to yourself.
2. Open it on the phone and install.
3. If prompted, allow installs from that source.

> Note: Some phones block unknown apps by default; that is expected.

---

## Important: debug APK vs true store-ready app

- `app-debug.apk` is fine for personal install/testing.
- For a “true production app” (Play Store or wider sharing), build a **signed release** APK/AAB in Android Studio.

To open Android Studio project:

```bash
npm run cap:open:android
```

Then use Android Studio:
- **Build > Generate Signed Bundle / APK**

---

## Will this conflict with the web version?

No.

- Your web app still works as normal.
- Android packaging is an additional output from the same code.
- You can keep web + Android together in this repo (recommended while learning).

---

## Do APKs update automatically after code changes?

Short answer: **no**.

- If you change `App.jsx` (or any web code), your already-installed APK on the phone does **not** auto-update.
- You need to rebuild and reinstall a new APK to get those changes on your phone.

Typical update flow after code changes:

```bash
npm run android:apk:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The `-r` flag tells `adb` to replace/update the existing app install on your phone.

If you later publish through the Play Store, updates can be delivered automatically through the store update system.
