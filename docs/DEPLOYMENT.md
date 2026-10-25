# Production Deployment Guide (Vercel + Render + MongoDB Atlas)

This guide walks through deploying the AgroVoice AI full-stack application to production.

---

## 1. Database Setup (MongoDB Atlas)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with read/write privileges.
3. In **Network Access**, whitelist `0.0.0.0/0` (or Render's outbound IP ranges).
4. Obtain the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/agrovoice?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment (Render)

1. Connect your repository to [Render](https://render.com).
2. Create a new **Web Service**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Configure Environment Variables in Render:
   ```env
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=production_super_strong_jwt_secret_key!
   JWT_EXPIRES_IN=7d
   CLIENT_ORIGIN=https://agrovoice.vercel.app
   TELEPHONY_MODE=test
   WEBHOOK_BASE_URL=https://agrovoice-api.onrender.com
   WEBHOOK_SHARED_SECRET=your_secure_webhook_secret
   WEATHER_CRON=*/30 * * * *
   CALLS_PER_SECOND=2
   ```
4. Run Seeding Scripts (via Render SSH or Shell):
   ```bash
   node src/scripts/seedAdmin.js
   node src/scripts/seedDemoData.js
   ```

---

## 3. Frontend Deployment (Vercel)

1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure Environment Variables in Vercel:
   ```env
   VITE_DEMO_MODE=true
   ```
5. Add `vercel.json` rewrites in `client/` for routing and API proxying:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://agrovoice-api.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Post-Deployment Verification

1. Ping health check: `https://agrovoice-api.onrender.com/api/health`
2. Test admin login at `https://agrovoice.vercel.app/login` with `admin@agrovoice.org / AgroAdmin@2026!`
3. Verify public registration at `https://agrovoice.vercel.app/register`
