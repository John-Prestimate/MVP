# Instructions for Horizons (Hostinger AI) to Set Up Prestimate.io

## 1. Website Content & Customer Instructions
- Add the instructions from `README.md` to a public page (e.g., "How to Embed" or "For Customers").
- Make sure customers can easily copy the embed code (both the button and iframe options).
- Include the support contact email: support@prestimate.io.

## 2. Widget and Embed Code
- Ensure `widget.js` is hosted at `https://www.prestimate.io/widget.js` and is accessible to the public.
- Ensure the MapView tool is available at `https://www.prestimate.io/Mapview/index.html` and accepts a `customer` query parameter.

## 3. Customer Dashboard Access
- Add a clear link or button to the dashboard at `https://www.prestimate.io/app` for customer login and registration.

## 4. Subscription Access Control (IMPORTANT)
- The backend (Supabase/Stripe) controls whether a customer is active or not.
- When a customer loads the measuring tool (via widget or iframe), the backend must check if their subscription is active.
- If the subscription is expired or canceled, the tool should display a message like: "Subscription expired. Please renew to use this tool."
- Do NOT rely on removing the embed code from the customer’s website. Access must be controlled by the backend.

## 5. Customer IDs
- Each customer must have a unique ID (provided by Prestimate).
- The embed code must include this ID as shown in the README.

## 6. Support
- If you need help with backend logic or customer ID management, contact the Prestimate development team.

---

**Summary:**
Horizons should set up the website to display instructions, make the widget and MapView available, and ensure customers know how to embed the tool. All access control is handled by the backend, not by changing the code on customer websites.
