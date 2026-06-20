# Drishti AI — Next.js Dashboard Frontend Client

This is the Next.js 15 frontend client for **Drishti AI** — AI-Powered Parking Enforcement Intelligence. It provides a visual dashboard to interact with the FastAPI backend, displaying interactive Leaflet hotspot maps, Recharts violation charts, weekly calendar pre-deployments, and event simulators.

---

## 🚀 Key Features & Screens

1. **Dashboard command Center (`/`)**: Shows key metrics (Total violations analyzed, Top hotspots, Peak windows, Event multiplier effects) and interactive charts. Select any hotspot junction in the list to update its 24-hour historical trend area chart dynamically.
2. **Live Heatmap (`/heatmap`)**: Interactive dark-themed map using Leaflet. Change the hour slider from 0-23 to dynamically reload hotspot marker layers scaling and coloring based on density (Red = High, Orange = Medium, Yellow = Low).
3. **Enforcement Planner (`/enforcement`)**: Select weekdays to load predicted active force deployment schedules and total police officer requirements.
4. **What-If Event Simulator (`/simulate`)**: Run event transit projections (processions, VIP transits, public gathers) and inspect adjusted severity loads and required staffing.

---

## 🛠️ Tech Stack & Libraries

* **Framework**: Next.js 15 (App Router) + TypeScript
* **Styling**: Tailwind CSS (dark mode theme and custom layouts)
* **Charts**: Recharts (with mounted hydration locks and resize debounce parameters to support React 19 sizing)
* **Maps**: Leaflet + React Leaflet (SSR-disabled dynamic loading wrapper to prevent window-object errors)
* **Icons**: Lucide React

---

## ⚙️ Installation & Running

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### Setup Steps

1. **Navigate to the Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Configure Environment Variables**:
   Verify or create a `.env.local` file in the root of the `frontend/` folder:
   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```
   *Note: When deploying to production (e.g. Vercel), replace this URL with your hosted Railway/Render backend URL.*

3. **Install Packages**:
   Since the project uses React 19, install packages using the `--legacy-peer-deps` flag to ensure that React 19 peer dependency warnings are bypassed successfully:
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the client dashboard.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🧬 Key Component Guide

* **[Navbar.tsx](components/Navbar.tsx)**: Glowing header layout showing current active route tabs.
* **[StatCard.tsx](components/StatCard.tsx)**: Modern widgets using glassmorphic gradients.
* **[ViolationChart.tsx](components/ViolationChart.tsx)**: Area charts mapping hourly distributions, featuring a hydration mounted-check to avoid Next.js compilation issues.
* **[HeatmapView.tsx](components/HeatmapView.tsx)** & **[MapInner.tsx](components/MapInner.tsx)**: Maps leaf coordinates using CartoDB Dark Matter tiles. Bundled using `next/dynamic` with `ssr: false` to ensure client-side rendering.
* **[SimulatorForm.tsx](components/SimulatorForm.tsx)**: Scenario form handler connecting inputs directly to backend simulation API endpoints.
* **[api.ts](lib/api.ts)**: Shared fetch client utility wrapper defining types and API call methods.
