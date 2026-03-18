# Pennify TODO

## Scale / Performance

- [ ] **Refactor `processMonthly` cron to fan-out pattern at scale**
  - Current: single mutation loops through ALL users' recurring payments + budgets in one go
  - Problem: Convex mutations have an 8-second execution limit — will time out at ~10K+ users
  - Fix: cron schedules individual per-user mutations using `ctx.scheduler.runAfter(0, internal.recurring.processUser, { userId })`
  - Each user's processing runs independently, failures don't affect others
  - Priority: not urgent now (safe for hundreds of users during beta), revisit before scaling

8. during onboarding whne user press on netflix cursor should go to amount not to edit netflix

// APPROVAL

Overall I'd say very likely approved — the app is clean and well-built. But there are
specific things Apple will flag. Here's my honest assessment:

---

Things working in your favour

- Finance/expense tracker is a well-established App Store category — Apple is  
  comfortable with it
- No camera/microphone/contacts permissions being abused
- Delete account is implemented (Apple hard-requires this since 2022 — you have it ✓)
- Restore Purchase button exists on paywall ✓
- Auto-renewal legal text on paywall ✓
- Clean, professional UI — reviewers notice this

---

Things that WILL cause rejection right now

1. Purchase buttons show an Alert ("Coming Soon") — this is a guaranteed rejection.
   Apple reviewers will tap the purchase buttons and expect them to actually work. You
   must have real RevenueCat purchases wired up before submitting.

2. Only Google sign-in — Apple requires "Sign in with Apple" as an option whenever
   you offer any third-party social login. Google-only will get rejected under
   https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple. This is
   a firm rule, no exceptions.

3. Terms of Service / Privacy Policy links — your sign-in screen says "Terms of
   Service and Privacy Policy" but they're not tappable links. Apple requires these to
   be actual URLs they can visit during review.

4. Replace support@pennify.app with your actual support email in both pages 2. The domain pennify.app — make sure pennifyweb is actually deployed there,
   otherwise the links won't work

---

Things to double-check before submission

- console.log statements everywhere (not a rejection reason but worth cleaning)
- The // TODO comments in paywall — fine for code, just make sure the functionality
  works
- Receipt scanner feature — if you're using the camera, make sure the usage
  description string is in app.json / Info.plist

---

Summary
Fix those 3 things — RevenueCat integration, Sign in with Apple, and real privacy
policy/ToS URLs — and your chances of first-attempt approval are high. The app itself
is solid.

based on pricing model update privacy and terms

----- NOTIFICATIONS --------
So for your current setup, when you submit to the App Store / Play Store via EAS
build, the notifications will just work with your branding. The only thing you might
want to configure is the notification icon in app.json:

"notification": {  
 "icon": "./assets/notification-icon.png",  
 "color": "#000000"  
 }

Update Google OAuth redirect URIs in Google Cloud Console — add spendler:// as an
allowed redirect URI (remove or keep pennify://)
