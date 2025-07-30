# Prestimate Widget – BACKEND TASKS

## � Frontend: Embed Instructions Page
- [x] Create centralized Embed Instructions page for prestimate.io covering major platforms and both embed methods (iframe, script) — 2025-07-29


## �📨 Supabase: Authentication
- [x] Enable Supabase Auth (email + password to start)
- [x] Create `users` table (if not auto-generated)
- [ ] Associate estimates with `user_id`
- [ ] Restrict `estimates` RLS to only show entries where `user_id = auth.uid()`
  - ✅ Redundant command-specific RLS policies removed. Now using a single, simple ALL policy for user-based row access. (2025-06-09)

## 🗄️ Supabase: Data Structure
- [x] Confirm `estimates` table structure
- [x] Add `business_settings` table:
   - `user_id`
   - `service_types` (JSON)
   - `currency`, `units`
   - `formspree_endpoint` (or email)
- [x] Add `projects` table for grouping estimates

## 🛠️ Backend Customization Engine
- [ ] Create API or Supabase functions to:
   - Get business settings per user
   - Update settings
   - Retrieve estimate history

## 🖥️ Admin Dashboard (Phase 1 UI)
- [x] Build a simple dashboard UI (React or Supabase Studio)
- [ ] Secure with Supabase Auth
- [ ] Display:
   - Estimate history
   - Form to update pricing/services

## 🏷️ Stripe Integration
- [ ] Add Stripe keys to Supabase environment
- [ ] Setup Stripe customer creation on user signup
- [ ] Enable basic monthly subscription
- [ ] Webhook: restrict access to widget if inactive or unpaid

## 🚚 Estimate Delivery
- [ ] Formspree sending working
- [ ] Make email destination customizable via business settings
- [ ] Optional: replace Formspree with Supabase edge functions + SendGrid

## 🧪 Testing
- [x] Create test Supabase users
- [x] Ensure RLS is secure and functional
  - ✅ RLS reviewed and redundant policies cleaned up for estimates table (2025-06-09)
- [ ] Test multiple estimates saved by multiple users

## 📝 DevOps
- [x] Define `.env` structure for local dev
- [x] Push backend config files to GitHub (no secrets)
- [ ] Add README instructions for backend setup

## 🧑‍💻 Optional (LLM-Based Help)
- [ ] Set up GPT-powered assistant to help generate shape-based estimates
- [ ] Allow prompt-based override/edit for estimate (e.g., "change driveway to patio")

---

# Discovered During Work
- [ ] Implement AI-assisted detection for driveways and yards (future ML integration) — 2025-06-29
- [ ] Consider integrating a cloud AI API for more accurate feature detection (future)

- [ ] Add more platforms and update instructions as new website builders become popular (Embed Instructions page)

# Added 2025-06-29
- [ ] Pro tier: Add AI-assisted measuring for roof and house using OSM building polygons (MVP)

# Feature Gating and Estimate Limits
- [ ] Implement feature gating in MapView.tsx for estimator UI and logic (see June 30, 2025):
  - [ ] Block estimator if trial expired and not subscribed.
  - [ ] Limit Basic to 100 estimates/month.
  - [ ] Hide AI for non-Pro/Trial.
  - [ ] Remove address for Basic users in emails.
  - [ ] Show estimate count for Basic users.
- [ ] TODO: Implement robust monthly estimate tracking per user in backend (for Basic plan enforcement).
- [ ] TODO: Add tests for feature gating and estimate limits in /tests.
- [x] DONE: Feature gating logic and UI in MapView.tsx (2025-06-30).

## ✅ Accomplished in this session:
- Diagnosed and fixed Supabase environment variable loading issue by placing `.env` in the project root
- Confirmed app now loads environment variables and connects to Supabase without console errors
- Verified basic app functionality restored and app launches successfully