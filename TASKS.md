# Prestimate Widget – BACKEND TASKS

## 🔐 Supabase: Authentication
- [ ] Enable Supabase Auth (email + password to start)
- [ ] Create `users` table (if not auto-generated)
- [ ] Associate estimates with `user_id`
- [ ] Restrict `estimates` RLS to only show entries where `user_id = auth.uid()`

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
- [ ] Create test Supabase users
- [ ] Ensure RLS is secure and functional
- [ ] Test multiple estimates saved by multiple users

## 📦 DevOps
- [ ] Define `.env` structure for local dev
- [ ] Push backend config files to GitHub (no secrets)
- [ ] Add README instructions for backend setup

## 🧠 Optional (LLM-Based Help)
- [ ] Set up GPT-powered assistant to help generate shape-based estimates
- [ ] Allow prompt-based override/edit for estimate (e.g., "change driveway to patio")
