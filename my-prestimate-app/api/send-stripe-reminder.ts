import { supabase } from '../src/supabaseClient';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// This API route should be called by a scheduled job (e.g. Vercel Cron) once per day
export default async function handler(req, res) {
  // 1. Find customers whose trial expires in 3 days or less and are not paid
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, email, trial_expiry, subscription_active')
    .eq('subscription_active', false)
    .lt('trial_expiry', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 2. For each customer, send a Stripe payment link email
  for (const customer of customers) {
    // Generate Stripe payment link (replace with your product/price IDs)
    const paymentLink = 'https://buy.stripe.com/test_8wM8yQ7wA7gQeRa6oo';
    // Send email (use your email provider or Supabase function)
    await fetch('https://stripe-webhook-vercel-hazel.vercel.app/api/send-onboarding-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer.email,
        customerId: customer.id,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        embedInstructions: '',
        paymentLink,
        trialExpiry: customer.trial_expiry,
      }),
    });
  }

  return res.status(200).json({ sent: customers.length });
}
