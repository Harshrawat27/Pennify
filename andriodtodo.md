For now skip it. Android setup is a separate task and you don't even have Android in-app purchases  
 configured yet. When you set up Android, you can revisit this and use the optimistic fallback (status
!== INELIGIBLE) at that point.

Google Play Launch Playbook

1. Developer Account — $25 one-time

- Go to play.google.com/console → sign up
- Pay $25 one-time registration fee
- Takes 24-48 hours to verify

---

2. Create the App in Play Console

- New app → "Spendler" → Android → Free (you'll add subscriptions later)
- Package name: app.spendler (must match your app.json)

---

3. Set Up Subscriptions in Play Console

- Go to Monetize → Subscriptions → Create subscription
- Create two products with the same IDs you used on iOS:
  - spendler_monthly (or whatever your iOS product IDs are)
  - spendler_yearly
- Set prices, trial period (3 days), grace period
- Important: subscription IDs must match what RevenueCat expects

---

4. RevenueCat — Add Android

This is the big one. Your revenuecat.ts currently has if (Platform.OS !==
'ios') return — meaning RevenueCat is completely disabled on Android. You need
to:

- Go to RevenueCat dashboard → Projects → Spendler → Add Android app
- Get your Google Play API key from RevenueCat
- Add EXPO_PUBLIC_REVENUECAT_ANDROID_KEY to eas.json
- Update revenuecat.ts to initialize with Android key on Android
- Add your Play Store subscription products to RevenueCat and map them to the
  "Spendler Pro" entitlement

---

5. Google Play Billing Setup for RevenueCat

RevenueCat needs API access to your Play Store to validate purchases:

- Play Console → Setup → API access → Link to a Google Cloud project
- Create a service account → grant it Financial data permissions
- Download the JSON key → upload to RevenueCat dashboard

---

6. Build — AAB not APK

Update eas.json production profile — remove "buildType": "apk" (revert what we
added for testing) so it outputs .aab for Play Store:
"production": {
"android": {}, // no buildType = defaults to aab
...
}

---

7. Convex — Production Deployment

Right now you're using the dev deployment (posh-kookabura-712). For
production:

- Go to pennifyweb → run npx convex deploy (not dev) to create a production
  deployment
- You'll get a new production URL like confident-mink-763.convex.cloud
- Update eas.json production env vars:
  - EXPO_PUBLIC_CONVEX_URL → production Convex URL
  - EXPO_PUBLIC_CONVEX_SITE_URL → production Convex site URL

---

8. pennifyweb / Vercel — Production

- Make sure pennifyweb is deployed to production on Vercel
- EXPO_PUBLIC_AUTH_URL in eas.json should point to your production domain
  (https://spendler.app)
- Vercel env vars need the production Convex deployment URL too

---

9. Store Listing

Play Console → Store presence → Main store listing:

- App name: Spendler
- Short description (80 chars)
- Full description
- Screenshots: phone (min 2, recommended 8) — 16:9 or 9:16
- Feature graphic: 1024×500px banner
- App icon: 512×512px
- Privacy policy URL: https://spendler.app/privacy
- Category: Finance

---

10. Content Rating

Play Console → Policy → App content → Content rating

- Fill the questionnaire → your app is Finance, no violence/adult content →
  will get "Everyone" rating

---

11. App Access

Play Console → Policy → App content → App access

- If your app requires login → select "All or some functionality is
  restricted" → provide test account credentials for reviewers

---

12. Testing Tracks Before Production

- Upload AAB to Internal testing first (instant, up to 100 testers)
- Then Closed testing (invite testers)
- Then Production (full rollout or staged %)

---

On the Restore Purchases Question

You're right to reconsider. Here's the reality:

- On Android, Google Play subscription is tied to the Google account on the
  device, not your app's login
- Your app login (Better Auth with Google/Apple) is a separate identity
- RevenueCat bridges them via userId (your Convex user ID)

The scenario where it breaks:

1. User buys on iOS (Apple account) → subscription in Convex under their
   userId
2. They install Android → sign in with same account → Convex has their
   subscription ✓ (works via Convex)
3. BUT if they buy on Android → RevenueCat records it under their Google Play
   account → webhook updates Convex ✓

The edge case where restore is needed:

- User buys on Android, uninstalls, reinstalls → Google Play auto-restores the
  purchase BUT RevenueCat may not have synced to Convex yet on the new install
- A restore button calls RevenueCat to re-sync → updates Convex

Google doesn't require a restore button like Apple does, but it's strongly
recommended for subscriptions. Since you already have restorePurchases() in
revenuecat.ts, adding a restore button on Android is just a UI addition — the
logic is already there.

---

The order I'd recommend:

1. Get developer account
2. Set up RevenueCat for Android
3. Set up Convex production deployment
4. Build AAB with production env vars
5. Upload to internal testing
6. Set up store listing
7. Submit for review
