# WALKTHROUGH - Nyaya Setu (AI Legal Copilot Platform)

Welcome to the **Nyaya Setu** demonstration walkthrough. This document outlines the complete architectural layout, database structures, security protocols, and step-by-step user journeys implemented on the platform for Demo Day.

---

## 1. Architectural Highlights

### 🔐 Secure Role-Based Access Control (RBAC)
- Implemented **four distinct roles** across the database schema and application router:
  1. **Client (Citizen)**: Simplified portal to describe issues in plain language, find advocates, check hearing schedules, and track active cases.
  2. **Advocate**: Manage calendars, appointments, case briefs, and draft written statements. Cannot access verification centers.
  3. **Verification Officer**: Review credentials, verify selfies against IDs, review OCR extraction match scores, and issue clearances.
  4. **Super Admin**: Audit system transactions, monitor session volumes, check pool status, and toggle settings.
- Exposed a **Demo Portal Console** on the Welcome Screen to cycle through roles instantly for evaluation.

### 📷 Web Camera Selfie Capture
- Built native integration with browser webcams using the HTML5 `MediaDevices` API.
- Captures active streaming frames directly inside canvas elements, saving base64 representations secure against data-truncation limits.

### 📁 Upload Progress & OCR Extraction
- Custom drag-and-drop document selectors with upload progress indicators from 0% to 100%.
- Triggers simulated OCR scanning on files to parse registration names and numbers, presenting summaries side-by-side with profile names.

### 🤖 Native SDK LLM Integrations (Nyaya Copilot)
- **Official SDK Integrations**: Completely removed all custom REST fetch integrations in favor of:
  - `@google/generative-ai` package for native Google Gemini API interactions.
  - `openai` package for native OpenAI completions.
- **Provider Switching**: Configure the selected model engine inside `backend/.env`:
  - `AI_PROVIDER`: Set to `gemini` or `openai`.
  - `GEMINI_API_KEY`: API access token for Google Gemini.
  - `OPENAI_API_KEY`: API access token for OpenAI.
  - `OPENAI_BASE_URL`: Custom completions base endpoint (optional).
  - `AI_MODEL`: Set custom models (defaults to `gemini-1.5-flash` or `gpt-4o-mini`).
- **Configuration Detection**: If the API key is missing or set to placeholder values, the backend returns:
  `{ success: false, message: "AI is not configured. Please configure the API key." }`
  This warning is captured by the frontend context and printed directly onto the chat messages.
- **Retry Once**: Implemented a retry cycle that attempts the LLM request up to 2 times before throwing.
- **Developer Trace Logs**: Detailed logs are output to the server terminal:
  - Selected provider type and native SDK model name.
  - Calculated prompt length.
  - Full raw response details from the provider.
  - Custom exceptions and stack trace logs.

---

## 2. Step-by-Step User Journeys

### Journey A: Client Registration & Onboarding
1. Open [http://localhost:5173](http://localhost:5173).
2. Choose a preferred language (English, Telugu, or Hindi).
3. Select the **Client** access role and click **Create New Account**.
4. Enter name, email, password, location details, and phone.
5. In the OTP Modal, enter `123456` to pass the verification step.
6. The client is immediately logged in and redirected to the **Client Dashboard**.

### Journey B: Advocate Registration & Onboarding (Pending Verification)
1. Select the **Advocate** access role and click **Create New Account**.
2. Fill in the credentials, practice areas (select multiple specializations), and office address.
3. Scroll to the **Selfie Capture** card, grant browser camera permissions, and click **Capture Frame**.
4. Upload files for the required certificates. The system displays upload progress bars and scans them using simulated OCR text extraction.
5. Enter OTP `123456` in the modal overlay.
6. **Success Screen**: A confirmation screen displays:
   - ✅ **Registration Successful**
   - Status: **Pending**
   - Application ID: **NS-ADV-XXXX**
   - Estimated Review: **1–2 Business Days**
7. Click **Proceed to Sign In** to return to the portal. The profile remains unverified until reviewed.

### Journey C: Verification Officer Review & Approval
1. Go directly to [http://localhost:5173/verification-login](http://localhost:5173/verification-login) or click **Demo Officer** from the demo portal.
2. Enter the designated officer credentials:
   - **Email**: `ndhivija3@gmail.com`
   - **Password**: `ndhivijia@2038`
3. The Verification Dashboard opens, displaying:
   - Pending applications list.
   - Live selfie preview matched side-by-side with uploaded Govt IDs.
   - Match similarity percentages, duplicates flag status, and OCR summaries.
4. Click **Approve Profile** to verify the advocate.
5. Sign out of the portal. The browser history path cleanses back to `/`.

### Journey D: Verified Advocate Experience
1. Sign in with the newly registered advocate credentials.
2. The Advocate Dashboard opens.
3. The badge immediately updates to show: **Verified Advocate** • **Verified by Nyaya Setu** • **Officer ID: OFFICER-99**.
4. The advocate can now register case files, review appointments, and utilize the AI Draft Assistant.

### Journey E: Nyaya Copilot Legal Consultation
1. Log in as a Client and select **Nyaya Copilot** from the Sidebar or Navbar.
2. Describe a legal situation in natural language (e.g. *"Neighbor is building on my wall"*).
3. The Copilot evaluates the issue:
   - Identifies the category (e.g. Property Dispute / Nuisance).
   - Generates next steps, required documents, fee structures, and timelines.
   - Maps out a **5-Step Stepper Action Roadmap**.
4. To speak instead of typing, click the **Microphone** button.
5. To hear the response spoken out loud, click **🔊 Listen** under the bubble response.
6. To purge the memory log, click **🗑️ Clear Conversation** in the top navigation bar.

---

## 3. Database Table Registry (10 Required Tables)
All of the following tables are verified and generated automatically at backend server startup:
1. `users`: Citizen credentials, hashed passwords, state, district, city, and preferred language.
2. `advocates`: Bar registration registry, consultation fees, verification statuses, and base64 live selfies.
3. `verification_requests`: Review status queue and audit clearances.
4. `documents`: Uploaded certificates and parsed OCR metadata logs.
5. `selfies`: Captured webcam logs and face similarity match indexes.
6. `appointments`: Time slot schedules for consultations.
7. `cases`: Digital lawsuit briefs and health progress charts.
8. `notifications`: Event dispatches sent to client and advocate profiles.
9. `otp_logs`: One-Time-Password audit logs.
10. `verification_logs`: Officer action transaction logs.
11. `ai_chat_history`: Hashed conversation history for context preservation.
