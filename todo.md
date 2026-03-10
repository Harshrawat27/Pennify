# Pennify TODO

## Scale / Performance

- [ ] **Refactor `processMonthly` cron to fan-out pattern at scale**
  - Current: single mutation loops through ALL users' recurring payments + budgets in one go
  - Problem: Convex mutations have an 8-second execution limit — will time out at ~10K+ users
  - Fix: cron schedules individual per-user mutations using `ctx.scheduler.runAfter(0, internal.recurring.processUser, { userId })`
  - Each user's processing runs independently, failures don't affect others
  - Priority: not urgent now (safe for hundreds of users during beta), revisit before scaling

2. improve some UI on how we are asking for date for recurring payments in onboarding screen.
3. recurrning payment - there are lots of issues in it. while onboarding we are not able to set date, if date is coming in few days still duducting money for it.
