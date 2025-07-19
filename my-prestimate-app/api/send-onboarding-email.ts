// /api/send-onboarding-email.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, customerId, dashboardUrl, embedInstructions } = req.body;

  if (!email || !customerId || !dashboardUrl || !embedInstructions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'onboarding@prestimate.io',
      to: email,
      subject: 'Welcome to Prestimate! Your Account Details & Widget Instructions',
      html: `
        <h2>Welcome to Prestimate!</h2>
        <p>Your customer ID: <b>${customerId}</b></p>
        <p>Dashboard: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
        <h3>Widget Embed Instructions</h3>
        <pre>${embedInstructions}</pre>
        <p>Need help? Reply to this email.</p>
      `,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
