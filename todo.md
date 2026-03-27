# Pennify TODO

## Scale / Performance

- [ ] **Refactor `processMonthly` cron to fan-out pattern at scale**
  - Current: single mutation loops through ALL users' recurring payments + budgets in one go
  - Problem: Convex mutations have an 8-second execution limit — will time out at ~10K+ users
  - Fix: cron schedules individual per-user mutations using `ctx.scheduler.runAfter(0, internal.recurring.processUser, { userId })`
  - Each user's processing runs independently, failures don't affect others
  - Priority: not urgent now (safe for hundreds of users during beta), revisit before scaling

------- OFFLINE BANNER -------

Saved to memory so we don't forget it. When you're ready, it'll be a clean
addition — a /offline screen with an illustration and a big "Add Transaction"
button, routing there instead of straight to tabs when offline.

------- NOTIFICATION FOR TRIAL PERIOD ---------

Yes, completely doable but there's a catch — you can't schedule a notification at  
 purchase time saying "remind me in exactly 2 days" because:

1. Local notifications — you'd schedule it at purchase time with a 2-day delay.  
   Simple, but it gets cancelled if user deletes the app, clears notifications, or  
   reinstalls. Also doesn't account if they cancel the subscription before day 2.
2. Server-side push (better) — RevenueCat has webhooks. When a trial starts, it fires
   a INITIAL_PURCHASE event to your backend (pennifyweb). Your backend receives it,  
   stores the trial start date, then at day 2 sends a push notification via Expo Push
   API. This is reliable and you can check if they're still subscribed before sending.

The server-side approach is the right way — you already have pennifyweb as a backend,
Convex can store the trial start date, and you already use Expo notifications. It's
maybe 1-2 hours of work once RevenueCat webhooks are set up.

For now local notification at purchase time is fine as a quick solution — just call  
 scheduleNotificationAsync with a 2-day trigger right after the RevenueCat purchase
succeeds.
