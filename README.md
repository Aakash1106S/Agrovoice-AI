# AgroVoice AI

> **"Critical Agricultural Alerts, Delivered by Voice."**

AgroVoice AI monitors live meteorological telemetry across agricultural districts in Tamil Nadu and automatically phones rural smallholder farmers on their mobile phones to deliver urgent, actionable weather alerts in colloquial Tamil or English. Farmers press **1** on their mobile keypad to acknowledge receipt.

---

## 🌾 The Problem

Rural smallholder farmers in Tamil Nadu lose standing crops (paddy, sugarcane, banana, cotton) to unannounced extreme rainfall, cyclonic wind gusts, and severe heatwaves. Most rural farmers do not check smartphone apps or SMS text alerts, and many rely on basic feature phones. 

**Voice phone calls in their mother tongue with keypad acknowledgment close the last-mile gap.**

---

## 🚀 Key Features

1. **Live Meteorological Monitoring**:
   - Queries Open-Meteo Forecast API with real coordinates for **Thanjavur**, **Madurai**, **Tiruchirappalli**, **Coimbatore**, and **Nagapattinam**.
   - Current surface conditions and 7-day precipitation forecasts.
   - 10-minute in-memory caching to respect API rate limits.
   - Attribution displayed per CC BY 4.0 license.

2. **Rule-Based Anomaly Detection**:
   - Heavy Rain rule: $\ge 45\text{ mm}$ rain in 24h $\rightarrow$ drainage advisory.
   - Strong Wind rule: $\ge 45\text{ km/h}$ gusts $\rightarrow$ banana/sugarcane propping advisory.
   - Drought rule: Low rainfall with persistent high temperatures $\rightarrow$ night micro-irrigation advisory.
   - Configurable in DB via Settings UI.

3. **Strict Human-in-the-Loop Approval**:
   - Detected anomalies are **NEVER called out automatically**.
   - Admin reviews and can edit both colloquial Tamil and Indian English voice scripts.
   - Calls trigger endpoint rejects (409 Conflict) any unapproved alert.

4. **Farmer Consent Vault & Privacy Protection**:
   - Phone numbers are masked in all API responses and UI (`+91 98*** **456`).
   - Opted-out or non-consented farmers are strictly excluded under every code path.
   - Duplicate call prevention enforced by compound unique index.

5. **Exotel Telephony & Simulated Test Rig**:
   - `TELEPHONY_MODE=test`: Full simulation with DTMF keypad simulator (`simulated: true`).
   - `TELEPHONY_MODE=real`: Real outbound SIP trunk calls via Exotel Voice REST API and dynamic ExoML XML instructions.
   - Persistent shell badge clearly indicates active telephony mode.

6. **Bilingual Public Registration Portal (`/register`)**:
   - No login required.
   - Tamil/English toggle.
   - Plain-language voice consent checkbox.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS (custom agricultural palette), React Router v6, Lucide React icons, Recharts, Axios.
- **Backend**: Node.js (ES Modules), Express.js, Mongoose + MongoDB (with zero-config embedded in-memory fallback via `mongodb-memory-server`), Express Rate Limit, Helmet, CORS, node-cron, JWT auth, bcrypt, Vitest + Supertest.
- **External Integrations**: Open-Meteo Forecast API, Exotel Voice API + ExoML.

---

## 🏁 Quick Start (Zero-Config)

### 1. Prerequisites
- Node.js 18+ (tested on Node v20 / v24)
- npm 9+

### 2. Install Dependencies
```bash
npm run install:all
```
*(Or run `npm install && (cd server && npm install) && (cd client && npm install)`)*

### 3. Seed Database
AgroVoice AI automatically uses an embedded in-memory MongoDB if `MONGODB_URI` is left blank in `.env`.
```bash
npm run seed:admin
npm run seed:demo
```
**Default Admin Credentials:**
- Email: `admin@agrovoice.org`
- Password: `AgroAdmin@2026!`

### 4. Run Development Server
```bash
npm run dev
```
- **Backend API**: `http://localhost:5001` (Health: `http://localhost:5001/api/health`)
- **Frontend App**: `http://localhost:5173` (Proxies `/api` to port 5001)
- **Public Portal**: `http://localhost:5173/register`

---

## 🧪 Automated Tests (21 Tests, 4 Suites)

Run the full integration test suite with:
```bash
npm test
```
**Test Coverage Breakdown:**
- `tests/farmer.test.js` (5 tests): Phone validation, mandatory consent, duplicate rejection, opt-out toggle, phone masking.
- `tests/auth.test.js` (5 tests): Login, invalid password, missing token, expired token, bcrypt hashing.
- `tests/telephony.test.js` (6 tests): Simulated call lifecycle, Exotel request headers, webhook idempotency, DTMF 1 ack, DTMF 2 replay, secret verification.
- `tests/alert.test.js` (5 tests): Anomaly detection, unapproved alert dispatch rejection, admin approval audit, recipient filtering, duplicate call prevention.

---

## 📖 Documentation Directory

- [API Specification](docs/API.md) — Complete REST endpoint documentation.
- [Telephony Setup & ExoML](docs/TELEPHONY_SETUP.md) — Exotel integration, ngrok tunneling, and TRAI/DND compliance notes.
- [Deployment Guide](docs/DEPLOYMENT.md) — Production setup for Vercel, Render, and MongoDB Atlas.
- [5-Step Demo Script](docs/DEMO_CHECKLIST.md) — Step-by-step hackathon pitch guide.

---

## ⚖️ License & Attribution

- Weather data provided by [Open-Meteo.com](https://open-meteo.com) under CC BY 4.0.
- Typography: Noto Sans Tamil & Inter via Google Fonts.
