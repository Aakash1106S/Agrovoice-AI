# AgroVoice AI — 5-Step Hackathon Pitch Demo Script

Follow this exact 5-step walkthrough to present the end-to-end functionality of AgroVoice AI in 3 minutes.

---

### Step 1: Meteorological Telemetry & District Surveillance
1. Navigate to **Weather Monitoring** (`/weather`).
2. Show the live district selector tabs: **Thanjavur**, **Madurai**, **Tiruchirappalli**, **Coimbatore**, and **Nagapattinam**.
3. Highlight that weather telemetry is fetched in real-time from the **Open-Meteo API** (using exact district latitude/longitude coordinates) and cached for 10 minutes.
4. Point out the **24-Hour Rainfall Threshold Gauge** (45 mm) and **Wind Gust Propping Marker** (45 km/h).

> **Pitch Line:** *"Smallholder farmers across rural Tamil Nadu don't check text messages or mobile apps. AgroVoice AI continuously monitors live weather sensors across all 5 agrarian districts to detect dangerous weather anomalies before crops are ruined."*

---

### Step 2: Anomaly Detected as `pending_review` (Strict Pause)
1. On the Dashboard (`/`), click **"Run Weather Check Now"** (or view the existing seeded demo alerts).
2. Point out the prominent amber banner: **"Alert Pending Human Approval — Automatic calling is strictly paused."**
3. Emphasize that per design requirements, detected anomalies are **NEVER** called out automatically.

> **Pitch Line:** *"We never want false alarms or panic in rural villages. The system automatically creates a `pending_review` draft, pauses all outbound calling, and requires an authenticated human administrator to verify and approve the advisory first."*

---

### Step 3: Admin Reviews Tamil/English Scripts & Approves
1. Click **"Review & Approve"** on the banner (or navigate to `/alerts`).
2. Show the **Bilingual Voice Script Editor**:
   - Colloquial Tamil script (பேச்சுத் தமிழ் / Kongu-Delta style)
   - Indian English script
3. Click the **Audio Player** to listen to the generated speech preview.
4. Click **"Approve Advisory"**.
5. The **ConfirmModal** pops up displaying:
   - **Eligible Farmers to Call**: (e.g. 12 farmers)
   - **Strictly Excluded**: (e.g. 2 opted-out, 1 non-consented)
   - Language breakdown (Tamil vs. English)

> **Pitch Line:** *"Administrators can fine-tune colloquial phrasing in seconds. Before dialing, the system enforces our Consent Vault—strictly filtering out any farmers who haven't opted in or have requested an opt-out."*

---

### Step 4: Outbound Voice Campaign Dispatched
1. Click **"Approve & Dispatch Voice Calls"** in the ConfirmModal.
2. The alert transitions to `sending` -> `sent`.
3. Calls pass through the rate-controlled queue (2 calls/sec) respecting carrier bounds.
4. The persistent app header clearly indicates: **"TEST MODE (SIMULATED)"** or **"LIVE CARRIER (EXOTEL)"**.

> **Pitch Line:** *"Calls are dispatched in parallel in each farmer's preferred language, speaking the advisory and prompting them to press 1 to confirm they received the warning."*

---

### Step 5: Press 1 on Handset Keypad & Watch Dashboard Update
1. Navigate to **Voice Calls & Test** (`/voice-calls`).
2. Show the **Interactive Handset & Keypad Simulator**.
3. Point to the active call: status is `Answered`.
4. Click button **"1" (ACK)** on the virtual dialer.
5. Watch the feedback update instantaneously to **"Acknowledged (Key 1)"**.
6. Switch back to the **Dashboard** (`/`) and **Analytics** (`/analytics`):
   - Notice the **Farmer Acknowledgment Rate** increase.
   - Notice the **7-Day Trend Chart** and **District Acknowledgment Bars** update immediately from the live database aggregation!

> **Pitch Line:** *"With a single keypad press, the farmer acknowledges the emergency advisory, closing the last-mile loop between meteorological satellites and smallholder fields."*
