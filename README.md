# Nyaya Setu – AI Legal Copilot

> **Justice Made Simple for Everyone.**

Nyaya Setu is a premium, world-class AI-powered Legal Assistance platform designed for Indian citizens (including rural, senior, and semi-literate users) and advocates. It simplifies complex legal terms, maps step-by-step resolution roadmaps, audits agreements/FIRs, tracks court hearings, and translates legal orders into plain, local languages (English, Telugu, and Hindi).

---

## 🌟 Key Features

1. **AI Legal Copilot**: ChatGPT-style conversational assistant that identifies legal categories, gives jargon-free explanations, lists required papers, details fee/timeline estimates, and designs **5-Step Action Roadmaps**.
2. **AI Document Checker**: Drag-and-drop vault scanner that summarises legal documents, highlights key obligations/dates, and translates complex legal jargon (e.g., *alimony*, *cognizable*, *indemnity*) into plain language.
3. **AI Hearing Explainer**: Dynamic translator that converts advocate court notes (e.g., *"Matter adjourned for filing counter"*) into simple citizen-friendly explanations (*"The hearing was postponed because the other party needs time to submit their response"*).
4. **Multilingual Interface**: Full interface toggle supporting English, Telugu, and Hindi. AI responses are generated in the chosen language.
5. **Voice-First Experience**: High-fidelity simulated microphone input enabling citizens to speak their problem instead of typing.
6. **AI Case Health Score**: Beautiful circular gauge displaying readiness (e.g. 85/100) based on assigned counsel, uploaded evidence, and pending payments.
7. **Resilient Demo Mode**: A client-side fallback mode that allows judges to immediately experience advocates, case dashboards, document checkers, and chat roadmaps directly in the browser, even without a local MySQL server or active AI API keys.

---

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript (Vite-powered SPA), styled with **Vanilla CSS** for Apple/Linear-inspired premium aesthetics (glassmorphism, skeleton loaders, floating controls).
- **Backend**: Node.js + Express (ES Modules) handling secure authentication, case logs, and document registry.
- **Database**: MySQL (connecting to the existing `nyaya_setu` database via port 3306).
- **Authentication**: JWT (JSON Web Tokens).
- **AI Engine**: OpenAI-compatible client (configurable via `.env` variables) with a smart local keyword-heuristic fallback engine.

---

## 📂 Project Structure

```
nyaya_setu/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # API Controllers (Auth, Advocates, Cases, AI)
│   ├── middleware/auth.js    # JWT verification middlewares
│   ├── routes/api.js         # REST endpoints mappings
│   ├── services/aiService.js # AI engine (OpenAI & local fallback translators)
│   ├── db_setup.js           # Database tables setup & sample seeds
│   └── server.js             # Express server entry point
├── frontend/ (React TS SPA)
│   ├── src/
│   │   ├── components/       # Reusable components (Navbar, etc.)
│   │   ├── context/          # State managers (Auth, Language, Speech, Data)
│   │   ├── views/            # Screen views (Welcome, Dashboards, Copilot, Search)
│   │   ├── App.tsx           # State-based router
│   │   ├── App.css           # Vanilla CSS Design System Tokens
│   │   └── main.tsx          # Wrapped providers entry
│   └── package.json
├── package.json              # Root package.json running scripts
└── README.md
```

---

## ⚙️ Setup & Execution

### 1. Database Setup
Ensure your local MySQL service is running on port `3306` with the database `nyaya_setu`. 
Configure credentials in `backend/.env`.

To set up the MySQL tables and automatically seed the sample data (10 Advocates, 5 Clients, 10 Reviews, 5 Cases, 15 Case Updates, 15 Appointments):
```bash
npm run db:setup
```

### 2. Install Dependencies
Install all package dependencies in the root, backend, and frontend folders:
```bash
npm run install:all
```

### 3. Run Applications
To start the Node backend server (on `http://localhost:5000`) and the Vite React frontend (on `http://localhost:5173`) concurrently:

- Run Backend:
  ```bash
  npm run dev:backend
  ```

- Run Frontend:
  ```bash
  npm run dev:frontend
  ```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 💡 Quick Demo Credentials (If bypassing direct Demo Mode)

To sign in with password validation (bypassing browser-only Demo Mode):
- **Client Profile**:
  - Email: `ramesh@example.com`
  - Password: `password123`
- **Advocate Profile**:
  - Email: `aditi@example.com`
  - Password: `password123`
