# How to Upload widget.js and MapView to Hostinger (Non-WordPress Hosting)

## Prerequisites
- You have a Hostinger web hosting plan (not just WordPress).
- You have access to the Hostinger control panel (hPanel).

## Step-by-Step Instructions

### 1. Log in to Hostinger
- Go to https://hpanel.hostinger.com/
- Log in with your account credentials.

### 2. Open the File Manager
- In the hPanel dashboard, find and click on "File Manager" under the "Files" section.

### 3. Navigate to the public_html Directory
- In File Manager, open the `public_html` folder. This is the root directory for your website (https://www.prestimate.io/).

### 4. Upload widget.js
- Click the "Upload Files" button (usually at the top).
- Select your `widget.js` file from your computer.
- After upload, you should see `widget.js` inside `public_html`.
- It will now be accessible at: https://www.prestimate.io/widget.js

### 5. Upload MapView Files
- If you have a folder called `Mapview` (with an `index.html` and any other files), upload the entire folder to `public_html`.
- After upload, you should have: `public_html/Mapview/index.html`
- The tool will be accessible at: https://www.prestimate.io/Mapview/index.html

### 6. (Optional) Upload Other Assets
- If your MapView or widget needs images, CSS, or JS files, upload those as well (keep the same folder structure as on your computer).

### 7. Test Your Files
- Visit https://www.prestimate.io/widget.js in your browser. You should see the JavaScript code.
- Visit https://www.prestimate.io/Mapview/index.html to make sure the tool loads.

---

## If You Only Have WordPress Hosting
- You cannot upload and serve these files directly.
- You will need to upgrade to a web hosting plan or use a different service (like Vercel or Netlify) to host your static files.

---

## Need Help?
- Contact Hostinger support for help with the File Manager.
- For technical help with your files, contact your developer or support@prestimate.io.
