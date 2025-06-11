# Prestimate Widget – BACKEND TASKS

## 📨 Supabase: Authentication
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

## ✅ Accomplished in this session:
- Diagnosed and fixed Supabase environment variable loading issue by placing `.env` in the project root
- Confirmed app now loads environment variables and connects to Supabase without console errors
- Verified basic app functionality restored and app launches successfully