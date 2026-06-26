# AI Production Risk Assessment Generator
## Final Presentation Slides - Review 3
**Company:** DigiQuest Studio  
**Presenter:** Student Team (Frontend, Backend, QA)

---

### Slide 1: Project Overview
* **Title:** AI Production Risk Assessment Generator
* **Target Company:** DigiQuest Studio
* **Core Goal:** Build a working prototype that inputs project parameters (scope, timeline, resource plan) and utilizes LLM models to identify risks and suggest mitigation steps.
* **Tech Stack:** HTML5, Vanilla CSS, JS (Frontend) | Express, Node.js (Backend) | JSON File Storage with memory-fallback.

---

### Slide 2: Problem Statement
* **Operational Issues:** Production teams at DigiQuest currently assess risks manually via phone, WhatsApp, and spreadsheets.
* **Consequences:** Late-stage VFX rendering delays, translation/dubbing script mismatches, scope creep from revision loops.
* **Solution:** An automated, persistent platform that leverages role-defined prompt engineering.

---

### Slide 3: Architecture & Data Flow
* **Frontend SPA:** Form inputs, validation, dynamic markdown parser, and Chart.js dashboards.
* **REST APIs:** Endpoints `/generate`, `/history`, `/feedback`, `/templates`, and `/presets`.
* **AI Pipelines:**
  - Gemini SDK (`gemini-1.5-pro`)
  - OpenAI SDK (`gpt-4o`)
  - Rule-based simulator fallback.
* **Database Layer:** `database.js` file-backed storage (Vercel serverless compatible).

---

### Slide 4: Prompt Engineering Evolution
* **v1 (Basic):** List general risks.
* **v2 (Categorized):** Segment by Schedule, Technical, Resource, Financial.
* **v3 (Severity):** Added [Low/Medium/High] severity indicators.
* **v4 (Active - Target Score >= 4.0):** Roleplays as DigiQuest Lead Producer, enforcing markdown layouts, CSS badges, and media-production mitigations.

---

### Slide 5: System Features Demo
* **Preset Templates:** Quick autofills for VFX, Dubbing, and Corporate video.
* **Export Utilities:** Clipboard Copying, TXT file downloading, and print-friendly PDF layouts.
* **Feedback Engine:** Star-ratings and commentary audits stored directly in the history ledger.
* **Live Prompt Controller:** Admin control to edit active prompts dynamically in the UI.

---

### Slide 6: QA Auditing & Testing
* **Test cases:** 12 validation/edge scenarios + 5 adversarial injections.
* **Integration suite:** Programmatic Node.js tester verifying all API endpoints.
* **Results:**
  - Total assertions: 19
  - Passed: 19
  - Failed: 0
  - Quality Rating average: >= 4.0 / 5.0

---

### Slide 7: Conclusion & Future Scope
* **Achievements:** Delivered a production-ready risk assessment prototype with fully integrated analytics and dynamic prompt controls.
* **Next Steps:**
  1. Add Single Sign-On (SSO) security.
  2. Implement webhooks to automatically push assessments to Jira.
  3. Support multi-user collaborative editing.
