# Prestimate Widget – BACKEND TASKS

## 🔐 Supabase: Authentication
- [x] Enable Supabase Auth (email + password to start)
- [x] Create `users` table (if not auto-generated)
- [x] Associate estimates with `user_id`
- [x] Restrict `estimates` RLS to only show entries where `user_id = auth.uid()`
  - ✅ Redundant command-specific RLS policies removed. Now using a single, simple ALL policy for user-based row access. (2025-06-09)

## 📊 Supabase: Data Structure
- [x] Confirm `estimates` table structure
- [ ] Add `business_settings` table:
  - `user_id`
  - `service_types` (JSON)
  - `currency`, `units`
  - `formspree_endpoint` (or email)
- [ ] Add `projects` table for grouping estimates

## ⚙️ Backend Customization Engine
- [ ] Create API or Supabase functions to:
  - Get business settings per user
  - Update settings
  - Retrieve estimate history

## 🌐 Admin Dashboard (Phase 1 UI)
- [ ] Build a simple dashboard UI (React or Supabase Studio)
- [ ] Secure with Supabase Auth
- [ ] Display:
  - Estimate history
  - Form to update pricing/services

## 💳 Stripe Integration
- [ ] Add Stripe keys to Supabase environment
- [ ] Setup Stripe customer creation on user signup
- [ ] Enable basic monthly subscription
- [ ] Webhook: restrict access to widget if inactive or unpaid

## 📬 Estimate Delivery
- [x] Formspree sending working
- [ ] Make email destination customizable via business settings
- [ ] Optional: replace Formspree with Supabase edge functions + SendGrid

## 🧪 Testing
- [x] Create test Supabase users
- [x] Ensure RLS is secure and functional
  - ✅ RLS reviewed and redundant policies cleaned up for estimates table (2025-06-09)
- [ ] Test multiple estimates saved by multiple users

## 📦 DevOps
- [ ] Define `.env` structure for local dev
- [ ] Push backend config files to GitHub (no secrets)
- [ ] Add README instructions for backend setup

## 🧠 Optional (LLM-Based Help)
- [ ] Set up GPT-powered assistant to help generate shape-based estimates
- [ ] Allow prompt-based override/edit for estimate (e.g., "change driveway to patio")

---

## ✅ Accomplished in this session:
- Supabase Auth enabled and tested on localhost
- `users` table confirmed/created
- `user_id` associated with `estimates` table and set on insert
- RLS enabled, tested, and redundant policies cleaned up for estimates table
- Step-by-step RLS testing checklist provided and reviewed
- Test users created and instructions for local multi-user testing explained
- Formspree estimate delivery working
