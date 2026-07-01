# Restoflow

Restoflow is a full‑stack restaurant management application built with **React 19**, **Vite**, **Express**, **TypeScript**, and **PostgreSQL**. It provides a modern UI for managing inventory, recipes, sales, staff movements, and integrates **Google Gemini AI** for intelligent assistance.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [AI Assistant](#ai-assistant)
- [Testing & Linting](#testing--linting)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **Dashboard** with real‑time metrics, sales charts, and inventory insights.
- **Inventory Management** – add, edit, delete ingredients, view stock levels, and generate shopping lists.
- **Recipe System** – create recipes, calculate costs, and link ingredients.
- **Sales & POS** – process orders, generate receipts, and view sales reports.
- **Staff Movements** – track shift logs and employee activities.
- **Voucher Management** – create and redeem discount vouchers.
- **AI Chat Assistant** – powered by Google Gemini for quick queries, cost estimations, and suggestions.
- **Authentication** – secure login with JWT and role‑based access.
- **Responsive Layouts** – desktop, tablet, and mobile layouts using Tailwind CSS.

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Express, TypeScript, tsx (dev), esbuild (prod) |
| Database | PostgreSQL (via `pg` library) |
| AI | Google Gemini (`@google/genai`), integrated in `src/AIChatAssistant.tsx` |
| Auth | bcryptjs, JWT |
| State Management | React hooks, context API |
| Testing | jest (if present), TypeScript type‑checking |

---

## Project Structure
```
restoflow/
├─ server/                 # Express backend
│  ├─ db/                 # Database connection & migrations
│  ├─ routes/             # REST API endpoints
│  ├─ utils/              # Helper functions (auth, conversion, etc.)
│  └─ index.ts            # Server entry point
├─ src/                    # React frontend
│  ├─ components/         # UI components (dashboard, inventory, sales, …)
│  ├─ hooks/              # Custom React hooks
│  ├─ utils/              # API client, math helpers, etc.
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ types.ts
├─ .env.example           # Template for environment variables
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md               # <‑ you are reading it!
```

---

## Setup & Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/restoflow.git
   cd restoflow
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create a `.env` file** based on `.env.example` (see below).
4. **Set up the PostgreSQL database**
   - Create a database (e.g., `restoflow`).
   - Run the migration located at `server/db/migrations/001_create_shifts.sql`.
   - The connection string goes into `DATABASE_URL`.

---

## Running the Application
### Development
```bash
# Terminal 1 – backend (watch mode)
npm run dev:server

# Terminal 2 – frontend (Vite dev server)
npm run dev
```
The frontend will be available at `http://localhost:5173` and the backend at the port defined in `.env` (default `3000`).

### Production Build
```bash
npm run build   # builds both frontend and backend into the dist folder
npm start       # runs the compiled server
```

---

## Environment Variables
Create a `.env` file in the project root:
```
# PostgreSQL connection string
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# Google Gemini API key
GEMINI_API_KEY=your-gemini-api-key

# Backend configuration
PORT=3000
APP_URL=http://localhost:5173   # used for CORS

# Optional – if you use Anthropic/Claude elsewhere
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Available Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Starts Vite dev server (frontend) |
| `npm run dev:server` | Starts backend with tsx watch |
| `npm run build` | Builds frontend and backend for production |
| `npm run lint` | Runs TypeScript type‑checking (`tsc --noEmit`) |
| `npm run test` *(if configured)* | Runs test suite |

---

## API Overview
The backend exposes REST endpoints under `/api`. Key groups:
- **Auth** – `POST /auth/login`, `POST /auth/register`
- **Inventory** – CRUD routes under `/ingredients`
- **Recipes** – `/recipes` for creating and calculating costs
- **Sales** – `/sales` for order processing and reports
- **Movements** – `/movements` for shift logs
- **Vouchers** – `/vouchers` for discount management
- **OCR** – `/ocr` for receipt scanning (uses Google Vision under the hood)

All routes return JSON with a `{ success: boolean, data?: any, error?: string }` payload.

---

## AI Assistant
`src/AIChatAssistant.tsx` integrates Google Gemini. The assistant can:
- Answer operational questions (e.g., *"What is today’s total sales?"*)
- Suggest inventory reorder quantities
- Estimate recipe cost based on current ingredient prices
- Provide quick troubleshooting tips for the UI

Make sure `GEMINI_API_KEY` is set; otherwise the component will fallback to a disabled state.

---

## Testing & Linting
```bash
npm run lint   # TypeScript compile‑time checks
npm run test   # Run Jest tests (if present)
```
Fix any type errors before committing.

---

## Deployment
The app can be deployed to Vercel, Railway, Render, or any Node‑compatible host.
1. Build the project (`npm run build`).
2. Upload the `dist/` folder.
3. Set the same environment variables on the hosting platform.
4. Ensure the host forwards API requests to the backend (or run the backend as a separate service).

---

## Contributing
Contributions are welcome! Please:
1. Fork the repo.
2. Create a feature branch (`git checkout -b feat/your-feature`).
3. Write tests for new functionality.
4. Submit a pull request with a clear description of changes.

---

## License
This project is licensed under the MIT License.

---

*Happy coding!*