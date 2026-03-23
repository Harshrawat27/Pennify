# Privacy Policy

**Last updated: March 23, 2026**
**App name: Spendler**
**Developer contact: support@spendler.app**

---

## Overview

Spendler is a personal finance app. You trust us with your financial data — we take that seriously. This policy explains exactly what we collect, why we collect it, where it lives, and what we never do with it.

The short version: **your financial data is yours, we do not sell it, we do not use it for advertising, and we do not share it with anyone except the infrastructure providers needed to make the app work.**

---

## 1. What We Collect

### Account & Identity Data

When you create an account, we collect:

- **Email address** — used to authenticate you and to contact you if you reach out for support
- **Name** — displayed in the app; optional
- **Profile photo** — optional; if provided, stored on our servers
- **Authentication tokens** — stored securely on your device via iOS Secure Enclave (SecureStore); never sent to third parties

We do not collect your phone number, date of birth, government ID, or any other personally identifying information.

### Financial Data You Enter

Everything you add to Spendler is stored under your account on our servers:

- **Transactions** — title, amount, date, notes, category, account, bookmark status
- **Receipt images** — photos you take to log receipts; stored on Cloudflare R2 (see Section 4)
- **Accounts** — names, types (cash, bank, credit card, digital wallet), and balances you manually enter
- **Categories** — default and custom categories you create
- **Budgets** — monthly spending limits per category
- **Savings goals** — goal names, target amounts, and saved amounts
- **Recurring payments** — subscription names, amounts, billing dates, and frequencies
- **People & debts** — names and amounts you track for shared expenses

All financial data is **manually entered by you**. We never connect to your bank, read your SMS messages, or access any external financial account.

### Preferences & Settings

- Your selected currency (from 25+ supported currencies)
- Notification preferences (daily reminder on/off, weekly report on/off)
- Income tracking toggle
- Hide balance toggle
- Subscription status (free trial, monthly, or yearly)

### Device & Session Data

- **Device identifiers** — used by RevenueCat to associate your in-app purchase with your account
- **Session tokens** — short-lived tokens that keep you logged in; stored in device SecureStore
- **App version** — used for support and compatibility purposes

### What We Do NOT Collect

- Location data
- Contacts
- Browser history or web activity
- Data from other apps
- Precise or coarse device location
- Advertising identifiers (IDFA/GAID)
- Keystroke logging or behavioral analytics

---

## 2. Why We Collect It

| Data | Purpose |
|------|---------|
| Email & auth tokens | Sign in, account security, support requests |
| Financial data | Core app functionality — displaying your spending, budgets, and goals |
| Receipt images | Receipt scanning and OCR processing |
| Notification preferences | Scheduling local device notifications (no push server — notifications run entirely on your device) |
| Currency selection | Formatting all amounts in your preferred currency |
| Subscription status | Determining access to premium features |
| RevenueCat device ID | Validating and restoring your in-app purchase |

We do not use your data for advertising, profiling, or selling to data brokers — ever.

---

## 3. How Your Data Is Stored

All your data is stored in **Convex**, a serverless cloud database. Data is encrypted in transit (TLS) and at rest. Your data is logically isolated by your user ID — no other user can access your data.

Receipt images are stored on **Cloudflare R2** object storage, with access controlled through our backend. Images are not publicly accessible.

Sensitive items (session tokens, subscription cache) are stored on your device in **iOS SecureStore**, which uses the device Secure Enclave for hardware-backed encryption.

**Offline queuing**: If you add a transaction while offline, it is temporarily stored in device local storage (AsyncStorage) and synced to the cloud when your connection is restored. This local queue is cleared once the sync completes.

---

## 4. Third-Party Services

We use a small number of trusted services to operate the app. Here is what each receives:

### Convex (Database)
**What they receive:** All your financial data, preferences, and account information.
**Why:** This is our backend — all data lives here.
**Their privacy policy:** convex.dev/privacy

### Better Auth (Authentication)
**What they receive:** Your email, name, profile photo (if set), and hashed credentials.
**Why:** Handles secure sign-in and session management.

### RevenueCat (Subscription Management)
**What they receive:** An anonymized user ID and in-app purchase events from Apple.
**Why:** To validate your subscription, restore purchases, and manage trial status.
**Their privacy policy:** revenuecat.com/privacy
**Note:** RevenueCat does not receive your financial data or email address.

### Cloudflare R2 (Receipt Image Storage)
**What they receive:** Receipt images you upload when scanning receipts.
**Why:** To store receipt photos attached to your transactions.
**Their privacy policy:** cloudflare.com/privacypolicy

### Apple App Store
**What they receive:** Purchase transaction records for subscription validation.
**Why:** Required for in-app purchases on iOS.
**Their privacy policy:** apple.com/legal/privacy

We do not use Google Analytics, Firebase Analytics, Mixpanel, Amplitude, Sentry, or any behavioral analytics service.

---

## 5. Data Sharing

**We do not sell your data.**
**We do not share your data with advertisers.**
**We do not share your data with data brokers.**

The only circumstances under which your data leaves our systems:

1. **Infrastructure providers** listed in Section 4 — strictly necessary for the app to function
2. **Legal requirement** — if we receive a valid court order or legal process requiring disclosure, we will notify you to the extent permitted by law
3. **Account transfer** — if Spendler is acquired, your data would transfer to the new owner under the same privacy commitments; you will be notified in advance

---

## 6. Notifications

Spendler sends three types of notifications — all are **local device notifications** scheduled on your device. We do not operate a push notification server.

- **Daily reminder** (8:00 PM) — "Don't forget to track today's spending!"
- **Weekly report** (Sunday 10:00 AM) — "Check how your week went!"
- **Recurring payment reminders** — 1 day before a tracked subscription renews

All notifications can be disabled individually or entirely from Settings → Notifications. Disabling notifications does not affect any app functionality.

---

## 7. Your Rights & Controls

### Delete Your Account
Settings → Delete Account permanently and irreversibly deletes:
- All transactions, accounts, categories, budgets, goals
- All recurring payments, smart rules, and saved debts
- All user preferences and settings
- Your authentication record and session tokens

This deletion is complete. We do not retain soft-deleted records after account deletion.

### Access Your Data
All your data is visible to you directly in the app. There is no hidden data we hold about you that you cannot see.

### Data Export
We do not currently offer a data export feature. If you want a copy of your data before deleting your account, please email support@spendler.app and we will provide it in CSV format within 14 days.

### Correct Your Data
You can edit or delete any transaction, account, category, budget, or goal directly from within the app.

### Withdraw Consent
You can delete your account at any time. Deleting your account terminates data processing under this policy.

---

## 8. Data Retention

- **Active accounts**: Data is retained as long as your account is active
- **Expired subscriptions**: Your data is retained even after your subscription expires; you simply lose access to premium features. Your data is not deleted on expiry.
- **Deleted accounts**: All data is permanently deleted immediately upon account deletion
- **Receipt images**: Deleted when the associated transaction is deleted or when your account is deleted

---

## 9. Children's Privacy

Spendler is not directed at children under 13. We do not knowingly collect data from anyone under 13. If you believe a child has created an account, contact support@spendler.app and we will delete the account immediately.

---

## 10. Security

We protect your data with:
- TLS encryption for all data in transit
- Encryption at rest in Convex and Cloudflare R2
- Hardware-backed SecureStore for device-local sensitive data
- User-scoped database queries (your data is isolated by user ID)
- No third-party analytics or tracking scripts

No system is perfectly secure. If you discover a security vulnerability, please disclose it responsibly to support@spendler.app.

---

## 11. Changes to This Policy

If we make material changes to this policy, we will notify you via an in-app announcement before the changes take effect. Continued use of the app after the effective date constitutes acceptance of the updated policy.

---

## 12. Contact

Questions about this privacy policy: **support@spendler.app**

We aim to respond within 5 business days.
