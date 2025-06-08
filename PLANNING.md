# Prestimate Widget – PLANNING

## 🎯 Goal
Build a customizable backend for Prestimate so service business owners can:
- Embed a visual estimate widget on their website
- Customize services, pricing, units, currencies
- Receive estimates in real-time (email + dashboard)
- Optionally log in to manage past estimates, configure settings, and manage subscriptions

## 🧩 Stack
- **Frontend**: React, OpenLayers, MapTiler, HTML/CSS
- **Backend**: Supabase (DB + Auth), Stripe (billing), GitHub (versioning)
- **Deployment**: WordPress/Elementor for website integration
- **Optional AI**: AI-assisted drawing for roofs/lawns in future

## 🛠️ Core Modules
1. **Estimate Engine**
   - Input: Drawn shapes + selected service type
   - Output: Estimated cost
   - Autosave + send email

2. **Business Settings Backend**
   - Owner login
   - Set services, rates, currencies, units
   - View estimate history by project ID or customer

3. **Authentication**
   - Supabase Auth
   - Business owners login to access settings
   - Optional customer logins (later phase)

4. **Subscription System**
   - Stripe for recurring billing
   - Freemium model (1 estimate/day free? Then paid plan)

5. **Widget Configuration Dashboard**
   - Owner UI for:
     - Adding new services
     - Changing pricing
     - Selecting currencies & units
     - Customizing formspree/email endpoint

6. **AI Drawing Assistance (Phase 2)**
   - Offer AI detection of features (roof, lawn, driveway) using aerial imagery

## 🌎 Multi-Business Scalability
Each subscriber should:
- Have a unique API key or embed code
- Have estimates tagged with their `user_id`
- Customize their instance without affecting others

## 📦 Deliverables
- Public website with embedded widget
- Admin dashboard
- Estimate notification + storage system
- Subscription flow
