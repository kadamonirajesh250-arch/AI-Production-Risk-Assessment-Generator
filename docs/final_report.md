# AI Production Risk Assessment Generator
## Final Project Report
**Company:** DigiQuest Studio  
**Project Title:** AI Production Risk Assessment Generator  
**Academic Year:** 2026  

---

## Chapter 1: Introduction

### 1.1 Project Context
DigiQuest Studio is a leading digital media house providing VFX rendering, 2D/3D character animation, multilingual audio dubbing, and post-production editing services. Coordinating these creative pipelines is highly resource-intensive and sensitive to schedule delays. 

### 1.2 Problem Definition
Prior to this project, project managers at DigiQuest Studio conducted risk assessment manually using unstructured tools (WhatsApp, spreadsheets). This led to:
- Render farm node bottlenecks being discovered late.
- Script revisions clashes in voice translation workflows.
- Scope creep from undocumented client revision iterations.

### 1.3 Project Objectives
- Build a responsive Single Page Application for risk assessments.
- Devise prompt templates (v1-v4) to generate actionable risk analysis reports.
- Support both Gemini and OpenAI APIs, with a rule-based simulation fallback.
- Save assessment history and capture user rating feedback for quality audits.
- Render admin analytics to evaluate system performance and edit prompts dynamically.

---

## Chapter 2: Literature Survey

### 2.1 Theoretical Frameworks
Traditional risk frameworks like PMBOK and ISO 31000 emphasize early risk identification. In creative studios, dynamic scheduling (such as resource-dependent rendering or voice-actor booking) is usually managed via agile project management methodologies.

### 2.2 Comparative Tool Audits
- **Asana/Jira**: Excellent for tracking tasks but lacks proactive predictive analytics.
- **ChatGPT UI**: Highly flexible but lacks contextual templates, historical reference, and dashboard auditing.
- **Enterprise Risk Management (ERM)**: Over-engineered and expensive for mid-sized creative studios.

---

## Chapter 3: System Design & Architecture

### 3.1 Structural Architecture
The system follows a lightweight Client-Server pattern. The frontend is a static web app, and the backend is an Express server. 

### 3.2 Database Schema
Data is persisted in a local JSON file (`backend/data/database.json`) with an in-memory cache to guarantee compatibility with Vercel serverless environments.
- **Generations**: Stores project details, generated markdown, prompt version, response times, and audit ratings.
- **Prompts**: Versioned system instructions and user templates (v1 to v4).
- **Presets**: Predefined project parameters for fast loading.

### 3.3 Prompt Engineering Evolution
- **Prompt v1**: Basic risk listing instructions.
- **Prompt v2**: Segmented risks by category.
- **Prompt v3**: Appended risk severity ratings (Low/Medium/High).
- **Prompt v4 (Active)**: Optimised role-play as DigiQuest Lead Producer, enforcing markdown layouts, severity badges, and media-production mitigations.

---

## Chapter 4: UI and UX Design

### 4.1 Interface Concept
The application features a modern dark-mode glassmorphic interface built using HSL variables, thin borders, and background glowing radial highlights.

### 4.2 Main Panels
1. **Interactive Form Panel**: Inputs for project metadata and scope details. Includes character limits and clear error-validation states.
2. **Output Panel**: Displays markdown reports, colored severity badges, thumbs up/down, and rating stars. Action buttons allow Copying, TXT file downloading, and PDF printing.
3. **Analytics Dashboard**: Aggregates total generations, average ratings, response times, and daily metrics using Chart.js.
4. **History list**: Sidebar list allowing managers to search and reload previous reports.

---

## Chapter 5: System Testing

### 5.1 Test Execution Matrix
An automated script (`tests/integration_tests.js`) was built using Node's standard libraries.

| Test Case ID | Test Category | Target Endpoint | Pass/Fail |
| :--- | :--- | :--- | :--- |
| `tc_val_1` | Preset Verification | `GET /api/presets` | PASS |
| `tc_val_2` | Template Validation | `GET /api/templates` | PASS |
| `tc_val_3` | API Risk Generation | `POST /api/generate` | PASS |
| `tc_val_4` | Rating Submission | `POST /api/feedback` | PASS |
| `tc_val_5` | Dashboard Evaluation | `GET /api/admin/analytics` | PASS |

### 5.2 QA Statistics
- **Total Assertions**: 19
- **Passed**: 19
- **Failed**: 0
- **Average API Response Time (Simulated)**: 1500 ms
- **Target Prompt Quality Score**: >= 4.0 / 5.0 (Passed)

---

## Chapter 6: Conclusion & Future Work

### 6.1 Summary of Accomplishments
We have built and verified a fully operational prototype of the AI Production Risk Assessment Generator. The tool enables DigiQuest Studio to audit production parameters proactively, minimizing mid-production delays.

### 6.2 Future Enhancements
- Integration with Active Directory / SSO for user authentication.
- Webhook triggers to sync assessments directly to JIRA or Monday.com.
- Auto-caching of historical reports using Redis.

---

## References
1. **IEEE (2024)**: *Structured Outputs in Generative AI Pipelines*.
2. **Project Management Institute (2023)**: *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*.
3. **VFX Society Reports (2025)**: *VFX Pipelines and Render Node Allocation Strategies*.
