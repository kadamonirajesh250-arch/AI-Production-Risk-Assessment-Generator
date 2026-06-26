# QA Bug Audit Report: AI Production Risk Assessment Generator

This report documents the issues found, tracked, and resolved during the integration and performance testing phases of the AI Production Risk Assessment Generator.

---

### Bug 1: Prompt Variable Replacement Error
* **Severity:** HIGH
* **Description:** Prompt template variable replacements failed when the template string contained multiple variables on a single line. The `String.prototype.replace` method only replaced the first occurrence.
* **Impact:** User variables were not bound to prompt calls, resulting in generic outputs.
* **Resolution:** Replaced simple string replacement with global Regular Expressions: `new RegExp('{{' + key + '}}', 'g')`.

### Bug 2: Vercel Read-Only File System Crash
* **Severity:** HIGH
* **Description:** When deployed as a serverless function, writing new risk generations to `backend/data/database.json` crashed the app with a `Read-only file system` error.
* **Impact:** Users could not generate assessments or save feedback in production.
* **Resolution:** Added try-catch blocks inside the file database manager. If file writes fail, the manager logs a warning and stores records in-memory, ensuring serverless execution remains active.

### Bug 3: PDF Print Cuts Off Left Text
* **Severity:** MEDIUM
* **Description:** Printing the generated report to PDF via native browser actions cut off the left margin because the container had absolute padding coordinates.
* **Impact:** Print outcomes were illegible.
* **Resolution:** Configured a dedicated CSS print-media override (`@media print`) that removes backgrounds, overlays, headers, and sidebars, resetting text margins to `0` and using native device margins.

### Bug 4: Star Rating Hover Flickering
* **Severity:** LOW
* **Description:** Hovering over the rating stars caused them to flicker rapidly, resetting the active selections.
* **Impact:** Poor user experience during audits.
* **Resolution:** Refined the mouseover/mouseout listeners in `app.js` to correctly capture values from `data-value` attributes rather than parent containers.

### Bug 5: Chart.js Rendering Crash on Empty Data
* **Severity:** MEDIUM
* **Description:** If the database was empty, Chart.js failed to initialize date scales, causing a script execution halt.
* **Impact:** The Admin Dashboard remained blank and other interactive buttons froze.
* **Resolution:** Implemented checks in `renderCharts`. If data lists are empty, the dashboard displays helper texts instead of trying to render empty axes.
