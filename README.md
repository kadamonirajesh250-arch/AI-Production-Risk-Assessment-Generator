# AI Production Risk Assessment Generator

A full-stack web application designed for **DigiQuest Studio** (multilingual film, dubbing, VFX, and post-production studio). This tool assists project managers in identifying schedule, resource, technical, and financial risks at project startup and compiling mitigation plans.

It is built with **Node.js Express** (backend), **Vanilla CSS and HTML5** (frontend), and features a lightweight file-backed database layer.

**Live Production URL**: [https://ai-production-risk-assessment.vercel.app](https://ai-production-risk-assessment.vercel.app)

---

## 🌟 Key Features

1. **Quick Load Presets**: Click on pre-seeded scenarios (VFX short film, Multilingual dubbing, Corporate brand video) to auto-populate production scope, timelines, and resources.
2. **AI Analysis Engine**: Connects to **Google Gemini (gemini-1.5-pro)** or **OpenAI (gpt-4o)** using tested, role-specific system instructions.
3. **Keyword-Aware Simulator**: If no API keys are provided, the application switches to Simulator Mode, using keywords (e.g. VFX, dubbing, animation, rendering) to construct realistic risk assessments.
4. **Report Actions**:
   - **Copy**: Copy raw markdown report text.
   - **TXT**: Download as a text file.
   - **PDF**: Uses native browser print engines with a custom `@media print` style to save a clean, distraction-free PDF.
   - **Regenerate**: Trigger a fresh AI request with identical variables.
5. **Quality Auditing & Stars feedback**: Star rating (1-5 stars) and comment system to assess prompt performance.
6. **Admin Dashboard**:
   - Usage counters (Total Generations, Average Quality rating, Avg Response time).
   - Dynamic charts (Daily generations counts & quality trends over time) powered by Chart.js.
   - **Live Prompt Editor**: Modify active system instructions and templates directly from the UI without editing code.

---

## 📂 Project Structure

```
├── api/
│   └── index.js             # Vercel Serverless Function entrypoint
├── backend/
│   ├── data/
│   │   └── database.json    # JSON storage file (Generations history, prompts, presets)
│   ├── database.js          # File-backed database manager with Vercel in-memory fallback
│   └── server.js            # Express server (APIs & static serving)
├── docs/
│   ├── problem_statement.md # Business case and problems faced by DigiQuest Studio
│   ├── abstract.md          # Project summary and key objectives
│   ├── literature_survey.md # Competitive tool studies and citations
│   └── architecture.md      # System data-flow and architectural diagram
├── frontend/
│   ├── index.html           # SPA structure, inputs, controls, analytics tabs
│   ├── styles.css           # Premium Glassmorphism dark UI & responsiveness styles
│   └── app.js               # Client controller (tab switching, regex parser, chart loader)
├── tests/
│   ├── test_cases.json      # 12 core test cases & 5 adversarial prompt injection cases
│   └── integration_tests.js # Programmatic API endpoint validation test runner
├── .env.example             # Configuration and key templates
├── package.json             # Root NPM dependencies and scripts
└── vercel.json              # Vercel serverless routing configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **NPM** (installed with Node)

### 2. Installation
Clone the repository, open a terminal in the root directory, and run:
```bash
npm install
```

### 3. API Key Configuration
Create a `.env` file in the root directory (or copy `.env.example`):
```bash
cp .env.example .env
```
Open `.env` and fill in your keys:
```env
PORT=3000
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
```
*Note: If no keys are specified in `.env`, the application automatically falls back to Simulator Mode so you can immediately explore and test the dashboard.*

You can also input your API keys directly in the **API Configuration** section in the frontend sidebar for testing.

### 4. Running Locally
Start the server in development mode:
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

We have built an integration test suite to verify endpoints and database logic. To run the automated tests:
```bash
npm test
```
This runs `tests/integration_tests.js` which:
1. Spins up a temporary server on port 3001.
2. Checks that presets load correctly.
3. Tests generating an assessment report.
4. Submits a star rating and comment feedback.
5. Verifies admin analytics reflect the new rating.
6. Shuts down the temporary server and logs the results.

---

## ☁️ Deploying to Vercel

This repository is optimized for deployment to Vercel in a single command. 

1. Install the Vercel CLI: `npm i -g vercel`
2. Run the deployment command from the project root:
   ```bash
   vercel
   ```
3. Set your production environment variables (e.g., `GEMINI_API_KEY`) in the Vercel Dashboard under Project Settings -> Environment Variables.
