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


## Avoiding merge conflicts in Codex PRs

If Codex PRs regularly conflict, it is usually because each PR is created from a branch that is not up to date with `main`, and because formatting changes are inconsistent across contributors.

Use this workflow for each new PR:

1. Update local `main` and create a fresh branch from it.
2. Keep PRs small and focused (one concern per PR).
3. Run `npm run format` before committing so file formatting stays deterministic.
4. Rebase your branch onto latest `main` right before opening/merging the PR.

Suggested command sequence:

```bash
git checkout main
git pull --rebase origin main
git checkout -b <feature-branch>
# make changes
npm run format
git add -A
git commit -m "..."
git fetch origin
git rebase origin/main
```

This repository includes `.editorconfig` and Prettier config to reduce whitespace/style-only conflicts.
