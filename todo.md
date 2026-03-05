# Pennify TODO

## Scale / Performance

- [ ] **Refactor `processMonthly` cron to fan-out pattern at scale**
  - Current: single mutation loops through ALL users' recurring payments + budgets in one go
  - Problem: Convex mutations have an 8-second execution limit — will time out at ~10K+ users
  - Fix: cron schedules individual per-user mutations using `ctx.scheduler.runAfter(0, internal.recurring.processUser, { userId })`
  - Each user's processing runs independently, failures don't affect others
  - Priority: not urgent now (safe for hundreds of users during beta), revisit before scaling
