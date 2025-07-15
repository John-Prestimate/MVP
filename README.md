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
<!-- Email config test for Vercel deploy -->

# Embedding Prestimate Measuring Tool on Your Website

You can easily add the Prestimate measuring tool to your own website. No coding experience needed!

## Option 1: Floating Button (Recommended)

Adds a blue "Open Measuring Tool" button to the bottom right of your site. When clicked, a pop-up window will appear with the measuring tool.

Paste this code into your website's HTML, right before the closing `</body>` tag:

```html
<script src="https://www.prestimate.io/widget.js" data-customer="CUSTOMER_ID_HERE"></script>
```
- Replace `CUSTOMER_ID_HERE` with your unique customer ID (provided by Prestimate).

## Option 2: Direct Embed (Always Visible)

Shows the measuring tool directly on your page, like a YouTube video embed. The tool is always visible.

Paste this code where you want the tool to appear:

```html
<iframe src="https://www.prestimate.io/Mapview/index.html?customer=CUSTOMER_ID_HERE"
        width="100%" height="500" style="border:none;border-radius:12px;"></iframe>
```
- Replace `CUSTOMER_ID_HERE` with your unique customer ID.

## Example
```html
<!-- Button Example for customer ID 12345 -->
<script src="https://www.prestimate.io/widget.js" data-customer="12345"></script>

<!-- Direct Embed Example for customer ID 12345 -->
<iframe src="https://www.prestimate.io/Mapview/index.html?customer=12345"
        width="100%" height="500" style="border:none;border-radius:12px;"></iframe>
```

## Need Help?
If you have any questions or need your customer ID, contact support at [support@prestimate.io](mailto:support@prestimate.io).

---

# Customer Dashboard Access

To sign up or log in to your dashboard:
1. Go to [https://www.prestimate.io/app](https://www.prestimate.io/app)
2. Click "Register" to create an account, or "Login" if you already have one.
3. After logging in, you can manage your services, view estimates, and more.

---

