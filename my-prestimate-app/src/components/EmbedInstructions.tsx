import React from "react";

/**
 * Centralized Embed Instructions for prestimate.io
 * Covers popular platforms and two embed methods (iframe & script)
 * # Reason: Centralizes onboarding for widget embedding across platforms
 */
const platforms = [
  {
    name: "WordPress (Elementor, Gutenberg, Classic)",
    instructions: (
      <>
        <p>
          <b>Elementor:</b> Drag the <code>HTML</code> widget into your page, then paste the embed code below.
        </p>
        <p>
          <b>Gutenberg:</b> Add a <code>Custom HTML</code> block and paste the code.
        </p>
        <p>
          <b>Classic Editor:</b> Switch to the <code>Text</code> tab and paste the code.
        </p>
      </>
    ),
  },
  {
    name: "Wix",
    instructions: (
      <p>
        Use the <b>Embed HTML</b> widget and paste the code below.
      </p>
    ),
  },
  {
    name: "Squarespace",
    instructions: (
      <p>
        Add a <b>Code Block</b> to your section and paste the code below.
      </p>
    ),
  },
  {
    name: "Shopify",
    instructions: (
      <p>
        Add to a custom page or theme file using the code below (<code>&lt;iframe&gt;</code> recommended).
      </p>
    ),
  },
  {
    name: "Webflow",
    instructions: (
      <p>
        Use the <b>Embed</b> component and paste the code below.
      </p>
    ),
  },
  {
    name: "GoDaddy Website Builder",
    instructions: (
      <p>
        Use the <b>HTML Section</b> block and paste the code below.
      </p>
    ),
  },
  {
    name: "Custom HTML sites",
    instructions: (
      <p>
        Paste the code directly into your HTML where you want the widget to appear.
      </p>
    ),
  },
];

const IFRAME_EXAMPLE = `<iframe src="https://prestimate-frontend.vercel.app/embed?id=your-client-id" width="100%" height="600" style="border:none;"></iframe>`;
const SCRIPT_EXAMPLE = `<script src="https://prestimate-frontend.vercel.app/widget.js" data-customer="your-client-id"></script>`;

export default function EmbedInstructions() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>Embed Instructions for prestimate.io</h1>
      <p>
        Easily add the Prestimate widget to your website. Choose your platform below and follow the steps.
      </p>
      <h2>Embed Methods</h2>
      <ol>
        <li>
          <b>Iframe Embed (Recommended for most users)</b>
          <pre>
            <code>{IFRAME_EXAMPLE}</code>
          </pre>
        </li>
        <li>
          <b>Script Embed (Advanced/custom use)</b>
          <pre>
            <code>{SCRIPT_EXAMPLE}</code>
          </pre>
        </li>
      </ol>
      <h2>Platform-Specific Instructions</h2>
      {platforms.map((platform) => (
        <div key={platform.name} style={{ marginBottom: 32 }}>
          <h3>{platform.name}</h3>
          {platform.instructions}
          <details>
            <summary>Show Embed Code</summary>
            <pre>
              <code>{IFRAME_EXAMPLE}</code>
            </pre>
            <pre>
              <code>{SCRIPT_EXAMPLE}</code>
            </pre>
          </details>
        </div>
      ))}
      <h2>Need Help?</h2>
      <p>
        If you need help embedding the widget, contact our support team at <a href="mailto:support@prestimate.io">support@prestimate.io</a>.
      </p>
    </div>
  );
}
