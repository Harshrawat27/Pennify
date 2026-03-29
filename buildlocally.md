Here's the full step by step:

Step 1 — Run in VS Code terminal (Pennify folder)
npx expo prebuild --platform ios --clean
This generates the ios/ folder with the Xcode project.

Step 2 — Open Xcode
open ios/Spendler.xcworkspace
Make sure you open .xcworkspace not .xcodeproj.

Step 3 — Set Signing in Xcode

- Click on Spendler in the left sidebar (top level)
- Go to Signing & Capabilities tab
- Set Team to your Apple Developer account
- Make sure Automatically manage signing is checked

Step 4 — Select destination

- At the top where it shows device/simulator selector
- Select "Any iOS Device (arm64)" — not a simulator

Step 5 — Archive

- In Xcode menu → Product → Archive
- Wait for it to build (5-10 mins)
- Organizer window opens automatically when done

Step 6 — Submit to App Store Connect

- In Organizer → select your archive → click Distribute App
- Choose App Store Connect
- Choose Upload
- Click through the defaults → Upload
- Done — build appears in App Store Connect in ~10 mins

That's it. Want me to warn you about anything specific before you start?

❯ yes please if there is anything to learn?
