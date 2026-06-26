# System Architecture: AI Production Risk Assessment Generator

The application is structured as a full-stack Single Page Application (SPA). It uses a lightweight file-backed database layer and runs serverless functions on Vercel or locally via an Express server.

## Architecture Diagram

```
+--------------------------------------------------------------+
|                    Browser Interface (SPA)                   |
|  - HTML5, Vanilla CSS (Glassmorphism), JavaScript            |
|  - Chart.js (Analytics), Print stylesheet (PDF Printing)     |
+-------------------------------------------+------------------+
                                            |
                                  REST APIs | (JSON)
                                            v
+--------------------------------------------------------------+
|                 Backend API Server (Express)                 |
|  - server.js: Routing, key handling, and fallback logic      |
|  - api/index.js: Vercel serverless entrypoint                |
+-------------------+-----------------------+------------------+
                    |                       |
     Local Queries  |                       | LLM API Request
                    v                       v
+-------------------+-----+   +-------------+------------------+
|    Database Layer       |   |         AI Engine APIs         |
|  - database.js          |   |  - Google Gemini AI SDK        |
|  - data/database.json   |   |  - OpenAI Client Library       |
|  - In-memory fallback   |   |  - Custom Simulator Fallback   |
+-------------------------+   +--------------------------------+
```

## Data Flow (Risk Assessment Request)
1. **Input Submission**: The user fills the form or clicks a Preset.
2. **Key Extraction**: The client app checks if custom API keys are present in `localStorage` and appends them to request headers/body.
3. **Prompt Compilation**: The backend reads the active prompt template (v4 by default) from the database, compiling input variables `{{projectName}}`, `{{projectManager}}`, `{{productionScope}}`, `{{timeline}}`, and `{{resourcePlan}}`.
4. **API Execution**:
   - If a Gemini key is present, calls `gemini-1.5-pro` using `@google/generative-ai`.
   - If an OpenAI key is present, calls `gpt-4o` using `openai`.
   - Otherwise, triggers the keyword-matching `Simulator` mode (with simulated network delay).
5. **Persistence**: The server saves inputs, generated markdown, prompt version, response times, and timestamps to the JSON file database.
6. **Reporting**: The client parses returned markdown using a custom regex parser, renders risk tags/severity levels as colored CSS badges, and updates the history list and admin graphs.
