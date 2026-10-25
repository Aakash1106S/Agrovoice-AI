# Exotel Telephony Integration & Regulatory Compliance Guide

AgroVoice AI bridges meteorological telemetry with Indian mobile networks using the Exotel Voice REST API and dynamic ExoML XML flows.

---

## 1. Exotel Account Setup & Virtual Number

1. **Sign Up & KYC**:
   - Register an enterprise or trial account at [my.exotel.com](https://my.exotel.com).
   - Complete Company / NGO KYC verification required by the Department of Telecommunications (DoT) and TRAI.
2. **Obtain Caller ID (Virtual Landline / DID)**:
   - Request an Indian landline DID (e.g. Bangalore `08047100000` or Chennai `04448100000`).
   - This number will be passed as the `From` and `CallerId` parameter on outbound voice calls.
3. **Retrieve API Credentials**:
   - Navigate to **API Settings** in the Exotel dashboard:
     - `Account SID` (e.g. `agrovoice123`)
     - `API Key` (e.g. `a4b9...`)
     - `API Token` (e.g. `c7f2...`)
     - `Subdomain` (typically `api.exotel.com`)

---

## 2. ExoML Dynamic Flow Architecture

When an outbound call is answered by a farmer, Exotel makes an HTTP GET/POST request to your backend URL:
```
${WEBHOOK_BASE_URL}/api/webhooks/exotel/voice?callLogId=<ID>&secret=<SECRET>
```

### Tamil Advisory Flow (Audio File Playback)
Because Exotel TTS voices do not natively support colloquial Tamil phonetics, AgroVoice AI pre-renders audio or uses telephony-grade 8 kHz WAV files served from `/api/audio/tts/:hash`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>https://your-domain.com/api/audio/tts/abc123hash</Play>
  <Gather finishOnKey="#" numDigits="1" action="https://your-domain.com/api/webhooks/exotel/dtmf?callLogId=...&amp;secret=..." method="POST" timeout="10">
    <Play>https://your-domain.com/api/audio/tts/abc123hash</Play>
  </Gather>
  <Say voice="female" language="en-IN">No input received. Thank you.</Say>
</Response>
```

### English Advisory Flow (Indian English Voice)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="en-IN">Urgent weather alert for Thanjavur farmers: Heavy rainfall expected...</Say>
  <Gather finishOnKey="#" numDigits="1" action="https://your-domain.com/api/webhooks/exotel/dtmf?callLogId=...&amp;secret=..." method="POST" timeout="10">
    <Say voice="female" language="en-IN">Press 1 to acknowledge this advisory, or press 2 to replay.</Say>
  </Gather>
  <Say voice="female" language="en-IN">No input received. Thank you.</Say>
</Response>
```

---

## 3. Local Development with ngrok

During local development, Exotel requires a publicly accessible HTTPS endpoint to deliver webhooks.

1. Start AgroVoice AI on port 5001:
   ```bash
   npm run dev
   ```
2. Start an ngrok tunnel targeting port 5001:
   ```bash
   ngrok http 5001
   ```
3. Copy the forwarding URL (e.g. `https://1234-56-78.ngrok-free.app`).
4. Update `.env`:
   ```env
   TELEPHONY_MODE=real
   WEBHOOK_BASE_URL=https://1234-56-78.ngrok-free.app
   WEBHOOK_SHARED_SECRET=agrovoice_webhook_secret_key_tn_2026
   ```

---

## 4. Going Live Checklist

- [ ] **Verify Outbound Caller ID**: Ensure caller ID is active and provisioned on your Exotel account.
- [ ] **Configure Shared Secret**: Ensure `WEBHOOK_SHARED_SECRET` in `.env` matches the secret configured in Exotel app URLs.
- [ ] **Set Outbound Rate Bounds**: Configure `CALLS_PER_SECOND=2` (or your Exotel contract limit) to avoid HTTP 429 throttling.
- [ ] **TTS Audio Storage**: Ensure `WEBHOOK_BASE_URL` points to a high-availability HTTPS server with valid SSL certificate.
- [ ] **Audit Trail Verification**: Verify incoming callbacks are logged in MongoDB `webhookevents` collection.

---

## 5. TRAI / DND & Consent Compliance

In India, commercial telemarketing is strictly regulated under the Telecom Commercial Communications Customer Preference Regulations (TCCCPR, 2018).

AgroVoice AI implements strict compliance measures:
1. **Disaster Management & Emergency Exemption**: Critical weather advisories warning of crop destruction, flood waterlogging, or cyclonic wind hazard fall under emergency agrarian broadcasts.
2. **Explicit Prior Consent**: No farmer is dialed unless an active `consent: true` flag is recorded in the Farmer model. Registration without consent is rejected.
3. **Instant Keypad Opt-Out**: Pressing Key 9 during any call immediately marks `optedOut: true`, permanently excluding the number from future campaigns.
4. **Number Masking**: All phone numbers are masked (`+91 98*** **456`) in logs and UI displays to prevent data scraping.
