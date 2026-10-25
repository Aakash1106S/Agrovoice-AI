# AgroVoice AI - REST API Documentation

Base URL: `/api`  
Default Port: `5001`  
Authentication: HTTP Bearer Token (`Authorization: Bearer <JWT>`)

All responses adhere to a consistent JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```
Error format:
```json
{
  "success": false,
  "error": "Error description message"
}
```

---

## 1. System Health

### `GET /api/health`
Health check reporting uptime, database status, and active telephony mode.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "service": "AgroVoice AI API",
  "uptime": 124.5,
  "telephonyMode": "test",
  "database": "connected",
  "timestamp": "2026-10-24T15:30:00.000Z"
}
```

---

## 2. Authentication

### `POST /api/auth/login`
Admin user authentication with bcrypt password verification and JWT issuance.
- **Auth**: None (Rate limited: 20 req / 15m)
- **Body**:
```json
{
  "email": "admin@agrovoice.org",
  "password": "AgroAdmin@2026!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "671a5...",
    "name": "AgroVoice SuperAdmin",
    "email": "admin@agrovoice.org",
    "role": "super_admin"
  }
}
```

### `GET /api/auth/me`
Retrieves currently authenticated admin profile.
- **Auth**: Bearer Token
- **Response**: `200 OK`

### `POST /api/auth/register-admin`
Registers a new administrator (super_admin role required).
- **Auth**: Bearer Token (super_admin)
- **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "admin" }`
- **Response**: `201 Created`

---

## 3. Meteorological Monitoring

### `GET /api/weather/overview`
Returns live meteorological summaries across all 5 agricultural districts (Thanjavur, Madurai, Tiruchirappalli, Coimbatore, Nagapattinam) with current conditions, 24h rainfall sums, max wind gusts, and threshold warning states.
- **Auth**: Bearer Token
- **Response**: `200 OK`

### `GET /api/weather/district/:districtId`
Returns live 7-day Open-Meteo forecast and current surface observations for a specified district.
- **Auth**: Bearer Token
- **Params**: `districtId` (`thanjavur`, `madurai`, `tiruchirappalli`, `coimbatore`, `nagapattinam`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "districtId": "thanjavur",
    "districtName": "Thanjavur",
    "current": { "temperature_2m": 29.5, "precipitation": 0.0, "wind_gusts_10m": 22.4 },
    "daily": { "precipitation_sum": [12.0, 5.0, ...], "wind_gusts_10m_max": [...] },
    "thresholds": { ... },
    "attribution": "Weather data by Open-Meteo.com under CC BY 4.0"
  }
}
```

### `POST /api/weather/check`
Forces an immediate meteorological anomaly scan across all districts, compares observations against configured rules, and drafts `pending_review` alerts for newly detected anomalies.
- **Auth**: Bearer Token
- **Response**: `200 OK`

---

## 4. Emergency Alerts (Human-In-The-Loop)

### `GET /api/alerts`
Lists meteorological alerts with status filtering.
- **Auth**: Bearer Token
- **Query Params**: `status` (`pending_review`, `approved`, `sending`, `sent`, `dismissed`), `district`, `page`, `limit`
- **Response**: `200 OK`

### `GET /api/alerts/:id`
Retrieves full details of an alert, including forecast evidence and voice scripts.
- **Auth**: Bearer Token
- **Response**: `200 OK`

### `GET /api/alerts/:id/preview-recipients`
Pre-calculates eligible recipients vs excluded farmers (opted out, no consent, crop mismatch) before approving or sending.
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "district": "Thanjavur",
    "totalInDistrict": 15,
    "eligibleCount": 12,
    "excludedCount": 3,
    "breakdown": {
      "optedOut": 2,
      "noConsent": 1,
      "tamilRecipients": 10,
      "englishRecipients": 2
    }
  }
}
```

### `PUT /api/alerts/:id/scripts`
Allows an administrator to edit both the colloquial Tamil voice script and English advisory text before approving.
- **Auth**: Bearer Token
- **Body**: `{ "tamilScript": "...", "englishScript": "..." }`
- **Response**: `200 OK`

### `POST /api/alerts/:id/approve`
Approves an alert. Records approving admin ID and timestamp.
- **Auth**: Bearer Token
- **Body**: Optional `{ "tamilScript": "...", "englishScript": "..." }`
- **Response**: `200 OK`

### `POST /api/alerts/:id/dismiss`
Dismisses a pending alert advisory.
- **Auth**: Bearer Token
- **Response**: `200 OK`

### `POST /api/alerts/:id/send`
Initiates outbound voice calls to eligible farmers.
- **Auth**: Bearer Token
- **Enforcement**: Must be in `approved` status, otherwise strictly returns `409 Conflict`.
- **Response**: `200 OK`

---

## 5. Voice Calls & Telephony Testing

### `POST /api/calls`
Places an ad-hoc single outbound call to a registered farmer or allow-listed test number.
- **Auth**: Bearer Token
- **Body**:
```json
{
  "farmerId": "671a5...",
  "testPhone": "+919842100001",
  "language": "ta",
  "scriptText": "...",
  "alertId": "..."
}
```
- **Response**: `201 Created`

### `GET /api/calls/history`
Paginated call logs with status, DTMF response, duration, and simulated provider flags.
- **Auth**: Bearer Token
- **Query Params**: `page`, `limit`, `status`, `dtmfResult`, `district`, `simulated`
- **Response**: `200 OK`

### `GET /api/calls/export-csv`
Streams full call history as a downloadable CSV file.
- **Auth**: Bearer Token
- **Response**: `text/csv`

### `POST /api/calls/:id/simulate-dtmf`
Simulates a farmer pressing keys (1 = Acknowledge, 2 = Replay, 9 = Opt-out) on their mobile keypad for testing.
- **Auth**: Bearer Token
- **Body**: `{ "digit": "1" }`
- **Response**: `200 OK`

---

## 6. Exotel Webhooks

### `GET / POST /api/webhooks/exotel/voice`
Serves dynamic ExoML XML instructions to Exotel carrier:
- Tamil: `<Response><Play>...</Play><Gather finishOnKey="#" numDigits="1">...</Gather></Response>`
- English: `<Response><Say voice="female" language="en-IN">...</Say><Gather>...</Gather></Response>`
- **Auth**: Query parameter `secret` matching `WEBHOOK_SHARED_SECRET`
- **Response**: `application/xml`

### `POST /api/webhooks/exotel/status`
Receives terminal call status callbacks from Exotel (completed, busy, no-answer). Persists raw payload into `WebhookEvent` idempotently.
- **Auth**: Query parameter `secret`
- **Response**: `200 OK`

### `POST /api/webhooks/exotel/dtmf`
Receives keypad DTMF digits pressed by farmer:
- Digit 1 -> `acknowledged`
- Digit 2 -> `replay_requested`
- Digit 9 -> `opt_out`
- **Auth**: Query parameter `secret`
- **Response**: `application/xml` (Confirmation message and hangup)

---

## 7. Public Farmer Self-Registration

### `POST /api/public/register`
Public registration portal for rural farmers.
- **Auth**: None (Rate limited: 30 req / 15m)
- **Body**:
```json
{
  "name": "Murugan S.",
  "phone": "9842100001",
  "village": "Thiruvaiyaru",
  "district": "Thanjavur",
  "crops": ["Paddy", "Sugarcane"],
  "language": "ta",
  "consent": true
}
```
- **Validation**: Strict Indian mobile validation (+91 or 10 digits starting with 6-9). Consent is mandatory. Privacy-safe duplicate handling prevents leaking whether a number already exists.
- **Response**: `201 Created`
```json
{
  "success": true,
  "messageEn": "Registration successful. You will get a call when weather danger is near.",
  "messageTa": "பதிவு வெற்றிகரமாக முடிந்தது. தீவிர வானிலை ஏற்படும் போது உங்களுக்கு குரல் அழைப்பு வரும்."
}
```
