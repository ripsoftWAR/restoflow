<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4685dfc8-a41d-4915-9317-f747425a1e08

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env` file at the project root and set the following values:
   - `DATABASE_URL` = your Supabase PostgreSQL connection string
   - `ANTHROPIC_API_KEY` = your Anthropi/Claude API key
   - `VITE_API_URL` = your backend API URL, e.g. `https://restoflow-production-fee9.up.railway.app`
   - `PORT` = `3000` or another port for the backend server
   - `APP_URL` = your frontend origin for CORS, if deployed
3. Run the backend server:
   `npm run dev:server`
4. Run the frontend:
   `npm run dev`

If you prefer, copy `.env.example` to `.env` and fill the values.
