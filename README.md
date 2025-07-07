# Prestimate MVP

This is the minimum viable product (MVP) for **Prestimate**, a web-based drawing tool that allows service businesses to give rough estimates by tracing areas on a map.

## Features

- Draw and measure areas and lines on a map
- Select service type (e.g., house, fence, driveway)
- Estimate pricing based on selected service
- Save data to Supabase
- Email estimate confirmation

## Tech Stack

- OpenLayers
- Supabase
- HTML / CSS / JavaScript

## Pro Tier (AI-Assisted Measuring)

- Pro users can use AI-assisted measuring for roof and house services.
- "AI Detect" button uses OSM building polygons to auto-detect and estimate roof and house areas.
- Future: AI detection for driveways and yards (see TASKS.md for roadmap).

## Subscription Tiers & Feature Gating

- **Trial (first 30 days):**
  - Unlimited estimates
  - Manual and AI-assisted measuring
  - Estimate emails include address
- **Pro:**
  - Unlimited estimates
  - Manual and AI-assisted measuring
  - Estimate emails include address
- **Basic:**
  - Up to 100 estimates per month
  - Manual drawing/measuring only (no AI Detect)
  - Estimate emails do NOT include address
- If trial is expired and user is not subscribed, estimator is blocked.

See `TASKS.md` for implementation details and roadmap.

<!-- Triggered redeploy for Vercel cache clear test -->

