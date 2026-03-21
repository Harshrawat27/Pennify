Full Launch Process — Start to End

---

What is EAS Build?

expo build (old) ran builds on your machine. EAS Build (Expo Application Services)
runs the build on Expo's cloud servers. You push your code, they build the .ipa (iOS)
or .aab (Android) file and hand it back to you. No Xcode/Android Studio needed on
your machine for the final build.

---

Step 1 — Environment Variables in EAS

No, .env.local does NOT work in EAS builds. EAS runs on a remote server that has no
access to your local files.

You have two options:

Option A — EAS Secrets (recommended, for sensitive keys)  
 eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value "your_value"
eas secret:create --scope project --name EXPO_PUBLIC_AUTH_URL --value "your_value"  
 eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_SITE_URL --value  
 "your_value"  
 These get injected at build time automatically. Do this for each variable in your  
 .env.

Option B — eas.json env block (for non-sensitive)
{  
 "build": {  
 "production": {  
 "env": {  
 "EXPO_PUBLIC_CONVEX_URL": "https://confident-mink-763.convex.cloud"
}  
 }  
 }  
 }

For your app, use Option A (secrets) since these are API URLs — do it once and they
persist.

---

Step 2 — One-time Setup

# Install EAS CLI

npm install -g eas-cli

# Login to your Expo account (create one at expo.dev if needed)

eas login

# Link your project (run from Pennify folder)

eas init

This creates an extra.eas.projectId in app.json.

---

Step 3 — Configure eas.json

Create eas.json in the Pennify root:

{
"cli": {  
 "version": ">= 12.0.0"  
 },  
 "build": {
"production": {  
 "ios": {  
 "resourceClass": "m-medium"
}  
 }
},  
 "submit": {  
 "production": {}
}
}

---

Step 4 — Build

# iOS only (submit to App Store)

eas build --platform ios --profile production

# Android only

eas build --platform android --profile production

# Both at once

eas build --platform all --profile production

First time on iOS it will ask you to log in to your Apple Developer account and will
automatically create provisioning profiles and certificates — just follow the
prompts. This is the magic of EAS.

Build takes ~15-20 minutes. You get a download link when done. You can close your  
 terminal — it runs in the cloud.

---

Step 5 — Submit to App Store

Option A — EAS Submit (easiest)
eas submit --platform ios --latest  
 This takes the build you just made and uploads it directly to App Store Connect.

Option B — Manual  
 Download the .ipa from EAS dashboard → open Transporter app on Mac → drag and drop →
upload.

---

Step 6 — App Store Connect Setup (do this before submitting)

Go to https://appstoreconnect.apple.com:

1. New App → fill bundle ID (com.harshrawat.Spendler), name (Spendler), SKU
2. App Information — description, category (Finance), keywords
3. Pricing — Free
4. Screenshots — required: 6.7" iPhone (iPhone 15 Pro Max size). Minimum 1 per device
   size shown. You can use simulator screenshots.
5. Privacy Policy URL — https://your-pennifyweb-domain/privacy
6. Submit for Review — Apple takes 1-3 days usually, often same day now

---

Step 7 — After Approval

- Apple emails you → set Available date (immediately or scheduled)
- App goes live on App Store

---

Quick Summary Flow

Add EAS secrets (env vars)
↓  
 eas build --platform ios --profile production
↓  
 Wait ~20 min → build ready  
 ↓  
 Set up App Store Connect listing
↓  
 eas submit --platform ios --latest  
 ↓
Apple review (1-3 days)
↓  
 Live 🚀

---

Things to have ready before starting

- Apple Developer Account ($99/year) — needed for iOS
- App icon — 1024×1024 PNG, no alpha, no rounded corners (Apple rounds them)
- Screenshots — at minimum iPhone 6.7" size
- Privacy policy URL — your pennifyweb /privacy page
- App description — what goes on the App Store listing

--- launchign guide 2 -----

---

Step 1 — Install EAS CLI
npm install -g eas-cli

Step 2 — Login to your Expo account  
 eas login  
 Enter your expo.dev email and password.

Step 3 — Link your app to Expo (run from Pennify folder)  
 eas init  
 This adds a projectId to your app.json. If asked "Do you want to create a new  
 project?" → Yes.

Step 4 — Run the production build  
 eas build --platform ios --profile production  
 During this it will ask about Apple credentials — choose "Automatically manage
credentials". Log in with your Apple Developer account when prompted.

Step 5 — Wait for build to finish
EAS builds in the cloud (~15-20 min). You'll get a link to monitor it. When done  
 you'll see a download link.

Step 6 — Submit to App Store  
 eas submit --platform ios --profile production --latest  
 This uploads the build directly to App Store Connect. You'll need to log in with your
Apple ID again.

---

Before running Step 4 — check in expo.dev:

- Go to expo.dev → your project → Secrets — no action needed since env vars are in  
  eas.json directly.  


One thing to change before building:  
 The EXPO_PUBLIC_REVENUECAT_IOS_KEY in eas.json is your sandbox/test key. Do you have
a production RevenueCat key? If yes, replace it before building.
