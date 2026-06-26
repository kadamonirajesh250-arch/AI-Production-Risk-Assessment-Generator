// API Base URL
const API_BASE = '/api';

// Active Session Variables
let currentGenerationId = null;
let currentReportMarkdown = '';
let selectedRating = 0;
let charts = {};

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const tabs = document.querySelectorAll('.tab-content');


// Character counters
const scopeInput = document.getElementById('production-scope');
const timelineInput = document.getElementById('production-timeline');
const resourceInput = document.getElementById('resource-plan');

const scopeCount = document.getElementById('scope-char-count');
const timelineCount = document.getElementById('timeline-char-count');
const resourceCount = document.getElementById('resource-char-count');

// Form & Buttons
const riskForm = document.getElementById('risk-form');
const btnGenerate = document.getElementById('btn-generate');
const btnClearForm = document.getElementById('btn-clear-form');

// Output Containers & States
const outputIdle = document.getElementById('output-idle');
const outputGenerating = document.getElementById('output-generating');
const outputSuccess = document.getElementById('output-success');
const reportView = document.getElementById('report-view');
const progressBar = document.getElementById('progress-bar');
const loaderTitle = document.getElementById('loader-title');
const loaderDesc = document.getElementById('loader-desc');

// Success Actions
const btnCopy = document.getElementById('btn-copy');
const btnDownloadTxt = document.getElementById('btn-download-txt');
const btnDownloadPdf = document.getElementById('btn-download-pdf');
const btnRegenerate = document.getElementById('btn-regenerate');

// Feedback & Rating
const ratingStarsContainer = document.getElementById('rating-stars-container');
const starIcons = document.querySelectorAll('.star-icon');
const btnThumbUp = document.getElementById('btn-thumb-up');
const btnThumbDown = document.getElementById('btn-thumb-down');
const feedbackCommentArea = document.getElementById('feedback-comment-area');
const feedbackComment = document.getElementById('feedback-comment');
const btnSubmitFeedback = document.getElementById('btn-submit-feedback');
const feedbackSuccessMsg = document.getElementById('feedback-success');

// History Elements
const historySearchInput = document.getElementById('history-search-input');
const historySidebarList = document.getElementById('history-sidebar-list');
const historyDetailView = document.getElementById('history-detail-view');

// Admin Elements
const statTotalGens = document.getElementById('stat-total-gens');
const statAvgRating = document.getElementById('stat-avg-rating');
const statAvgTime = document.getElementById('stat-avg-time');

// Presets
const presetsList = document.getElementById('presets-list');

/* ==========================================================================
   Initialize Application
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

  
  // Initialize Tab Navigation
  initTabs();
  
  // Set up character counters
  setupCounter(scopeInput, scopeCount, 1000);
  setupCounter(timelineInput, timelineCount, 500);
  setupCounter(resourceInput, resourceCount, 500);
  
  // Load initial content
  loadPresets();
  loadHistoryList();
  
  // Setup Event Listeners
  setupFormEvents();
  setupFeedbackEvents();

  setupActionEvents();

});

/* ==========================================================================
   Tab Navigation
   ========================================================================== */
function initTabs() {
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      navButtons.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      
      // Page specific loading/refreshing
      if (tabId === 'history') {
        loadHistoryList();
      } else if (tabId === 'admin') {
        loadAnalytics();
      }
      
      // Update header titles
      const pageTitles = {
        'generator': { title: 'AI Risk Generator', subtitle: 'Input production specs to assess potential risks and compile mitigations.' },
        'history': { title: 'Assessment History', subtitle: 'Audit, search, and reload previous production risk analyses.' },
        'admin': { title: 'Admin Analyse', subtitle: 'System metrics and quality trend audits.' }
      };
      
      document.getElementById('page-title').textContent = pageTitles[tabId].title;
      document.getElementById('page-subtitle').textContent = pageTitles[tabId].subtitle;
    });
  });
}



/* ==========================================================================
   Character Counters
   ========================================================================== */
function setupCounter(input, counter, max) {
  const update = () => {
    const len = input.value.length;
    counter.textContent = `${len} / ${max}`;
    if (len >= max) {
      counter.style.color = 'var(--danger)';
    } else if (len >= max * 0.9) {
      counter.style.color = 'var(--warning)';
    } else {
      counter.style.color = 'var(--text-muted)';
    }
  };
  
  input.addEventListener('input', update);
  // Run initially
  update();
}

/* ==========================================================================
   Presets Panel Loading & Population
   ========================================================================== */
async function loadPresets() {
  try {
    const response = await fetch(`${API_BASE}/presets`);
    const data = await response.json();
    
    presetsList.innerHTML = '';
    
    data.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.innerHTML = `
        <h4>${escapeHtml(preset.name)}</h4>
        <p>${escapeHtml(preset.productionScope)}</p>
      `;
      
      card.addEventListener('click', () => {
        populateForm(preset);
      });
      
      presetsList.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading presets:', error);
    presetsList.innerHTML = '<p class="error-msg">Failed to load templates presets.</p>';
  }
}

function populateForm(preset) {
  document.getElementById('project-name').value = preset.projectName;
  document.getElementById('project-manager').value = preset.projectManager;
  scopeInput.value = preset.productionScope;
  timelineInput.value = preset.timeline;
  resourceInput.value = preset.resourcePlan;
  
  // Trigger counters update
  scopeInput.dispatchEvent(new Event('input'));
  timelineInput.dispatchEvent(new Event('input'));
  resourceInput.dispatchEvent(new Event('input'));
  
  // Clear error messages
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}

/* ==========================================================================
   Form Handling & Validation
   ========================================================================== */
function setupFormEvents() {
  btnClearForm.addEventListener('click', (e) => {
    e.preventDefault();
    riskForm.reset();
    scopeInput.dispatchEvent(new Event('input'));
    timelineInput.dispatchEvent(new Event('input'));
    resourceInput.dispatchEvent(new Event('input'));
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  });

  riskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await generateAssessment();
    }
  });
}

function validateForm() {
  let isValid = true;
  const fields = [
    { id: 'project-name', errId: 'err-project-name', name: 'Project Name' },
    { id: 'project-manager', errId: 'err-project-manager', name: 'Project Manager' },
    { id: 'production-scope', errId: 'err-production-scope', name: 'Production Scope', min: 10 },
    { id: 'production-timeline', errId: 'err-production-timeline', name: 'Timeline details', min: 10 },
    { id: 'resource-plan', errId: 'err-resource-plan', name: 'Resource & team details', min: 10 }
  ];

  fields.forEach(field => {
    const el = document.getElementById(field.id);
    const errEl = document.getElementById(field.errId);
    errEl.textContent = '';
    
    const val = el.value.trim();
    if (!val) {
      errEl.textContent = `${field.name} is required.`;
      isValid = false;
    } else if (field.min && val.length < field.min) {
      errEl.textContent = `${field.name} must be at least ${field.min} characters.`;
      isValid = false;
    }
  });

  return isValid;
}

/* ==========================================================================
   AI Risk Assessment Generation
   ========================================================================== */
async function generateAssessment() {
  // Show generating layout
  outputIdle.style.display = 'none';
  outputSuccess.style.display = 'none';
  outputGenerating.style.display = 'flex';
  btnGenerate.classList.add('loading');
  
  progressBar.style.width = '0%';
  loaderTitle.textContent = 'DigiQuest Risk Engine Active';
  loaderDesc.textContent = 'Initializing assessment templates...';

  const variables = {
    projectName: document.getElementById('project-name').value.trim(),
    projectManager: document.getElementById('project-manager').value.trim(),
    productionScope: scopeInput.value.trim(),
    timeline: timelineInput.value.trim(),
    resourcePlan: resourceInput.value.trim()
  };

  // Progress Bar Simulation
  let progress = 0;
  const progressSteps = [
    { val: 15, title: 'Parsing Input Metrics', desc: 'Validating scope details and resources...' },
    { val: 35, title: 'Triggering AI Prompt', desc: 'Synthesizing templates & loading custom directives...' },
    { val: 55, title: 'Analysing Timelines', desc: 'Auditing bottlenecks & milestone dependency trees...' },
    { val: 75, title: 'Structuring Mitigations', desc: 'Mapping risk weights and assigning mitigations...' },
    { val: 90, title: 'Formatting Output Markdown', desc: 'Compiling risk factors and severity badges...' }
  ];

  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += 1;
      progressBar.style.width = `${progress}%`;
      
      const step = progressSteps.find(s => progress <= s.val);
      if (step) {
        loaderTitle.textContent = step.title;
        loaderDesc.textContent = step.desc;
      }
    }
  }, 100);

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variables)
    });

    const result = await response.json();
    clearInterval(progressInterval);

    if (response.ok && result.success) {
      progressBar.style.width = '100%';
      setTimeout(() => {
        displayReport(result.data);
      }, 300);
    } else {
      throw new Error(result.error || 'Failed to generate risk assessment report.');
    }
  } catch (error) {
    clearInterval(progressInterval);
    console.error('Generation failure:', error);
    displayError(error.message);
  } finally {
    btnGenerate.classList.remove('loading');
  }
}

function displayReport(generation) {
  currentGenerationId = generation.id;
  currentReportMarkdown = generation.responseText;
  
  // Reset rating feedback box
  resetFeedbackBox();

  // Render markdown to HTML
  reportView.innerHTML = parseMarkdown(generation.responseText);
  
  outputGenerating.style.display = 'none';
  outputSuccess.style.display = 'block';
  
  // Clear the input form for new assessment creation
  riskForm.reset();
  
  // Reset character counters
  scopeInput.dispatchEvent(new Event('input'));
  timelineInput.dispatchEvent(new Event('input'));
  resourceInput.dispatchEvent(new Event('input'));
  
  // Smooth scroll to output
  document.getElementById('output-container').scrollIntoView({ behavior: 'smooth' });
}

function displayError(message) {
  outputGenerating.style.display = 'none';
  outputSuccess.style.display = 'none';
  
  // Show error in idle screen or build a custom error state
  outputIdle.style.display = 'flex';
  outputIdle.querySelector('h3').textContent = 'Generation Failed';
  outputIdle.querySelector('h3').style.color = 'var(--danger)';
  outputIdle.querySelector('p').textContent = message;
  outputIdle.querySelector('p').style.color = 'var(--danger)';
}

/* ==========================================================================
   Custom Markdown Parser
   ========================================================================== */
function parseMarkdown(md) {
  let html = md;

  // Escape HTML tags to prevent XSS
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Re-enable blocked specific tags that we inject ourselves
  
  // Blockquotes: > text
  html = html.replace(/^\s*&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');

  // Headers: # Title, ## Subtitle, ### Title3
  html = html.replace(/^\s*#\s+(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/^\s*##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^\s*###\s+(.*)$/gm, '<h3>$1</h3>');

  // Overall Risk Level highlight badges
  // Matches "Overall Project Risk Rating: HIGH" or similar
  html = html.replace(/(Overall Project Risk Rating:\s*)([a-zA-Z]+)/gi, (match, p1, p2) => {
    const level = p2.toLowerCase();
    return `<strong>${p1}</strong><span class="risk-rating-badge ${level}">${p2}</span>`;
  });

  // Severity badges: e.g. "- **Severity**: HIGH" or "**Severity**: [HIGH]"
  html = html.replace(/(Severity:\s*\*?\*?\s*\[?)(HIGH|MEDIUM|LOW)(\]?\*?\*?)/gi, (match, p1, p2, p3) => {
    const level = p2.toLowerCase();
    return `Severity: <span class="risk-rating-badge ${level}">${p2}</span>`;
  });

  // Bold text: **bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Unordered list items: - item
  // Split into lines to parse list items
  const lines = html.split('\n');
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const listMatch = lines[i].match(/^\s*-\s+(.*)$/);
    if (listMatch) {
      let content = listMatch[1];
      if (!inList) {
        lines[i] = '<ul><li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i - 1] = lines[i - 1] + '</ul>';
        inList = false;
      }
    }
  }
  
  if (inList) {
    lines[lines.length - 1] = lines[lines.length - 1] + '</ul>';
  }
  
  html = lines.join('\n');

  // Line breaks
  html = html.replace(/\n/g, '<br>');
  // Cleanup multiple brs
  html = html.replace(/(<br>){2,}/g, '<br><br>');

  return html;
}

/* ==========================================================================
   Report Action Handlers (Copy, TXT, PDF, Regenerate)
   ========================================================================== */
function setupActionEvents() {
  // Copy to Clipboard
  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(currentReportMarkdown)
      .then(() => {
        const originalText = btnCopy.innerHTML;
        btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btnCopy.style.borderColor = 'var(--success)';
        setTimeout(() => {
          btnCopy.innerHTML = originalText;
          btnCopy.style.borderColor = '';
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
      });
  });

  // Download TXT File
  btnDownloadTxt.addEventListener('click', () => {
    const projectName = document.getElementById('project-name').value || 'Risk_Assessment';
    const blob = new Blob([currentReportMarkdown], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_Risk_Assessment.txt`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Download/Print PDF
  btnDownloadPdf.addEventListener('click', () => {
    const projectName = document.getElementById('project-name').value || 'Risk_Assessment';
    
    // Create print window containing report only
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(projectName)} - AI Risk Assessment Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Roboto, sans-serif;
              color: #111;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1, h2, h3 {
              color: #000;
              margin-top: 20px;
            }
            h1 {
              font-size: 24px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            h2 {
              font-size: 18px;
              margin-top: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            h3 {
              font-size: 14px;
            }
            ul {
              padding-left: 20px;
            }
            li {
              margin-bottom: 6px;
            }
            strong {
              color: #000;
            }
            blockquote {
              border-left: 4px solid #6366f1;
              padding: 10px 15px;
              background: #f9f9f9;
              margin: 15px 0;
              font-style: italic;
            }
            .risk-rating-badge {
              display: inline-block;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 8px;
              border-radius: 4px;
              text-transform: uppercase;
              margin-left: 10px;
              border: 1px solid #111;
            }
            .risk-rating-badge.low {
              color: #047857;
              background: #ecfdf5;
              border-color: #a7f3d0;
            }
            .risk-rating-badge.medium {
              color: #b45309;
              background: #fffbeb;
              border-color: #fde68a;
            }
            .risk-rating-badge.high {
              color: #b91c1c;
              background: #fef2f2;
              border-color: #fca5a5;
            }
          </style>
        </head>
        <body>
          <div class="report-content">
            ${reportView.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  });

  // Regenerate Button
  btnRegenerate.addEventListener('click', async () => {
    await generateAssessment();
  });
}

/* ==========================================================================
   Feedback, Star Rating & Comments
   ========================================================================== */
function setupFeedbackEvents() {
  // Stars hover & click handlers
  starIcons.forEach(star => {
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.getAttribute('data-value'), 10);
      highlightStars(val);
    });
    
    star.addEventListener('mouseout', () => {
      highlightStars(selectedRating);
    });

    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-value'), 10);
      highlightStars(selectedRating);
      feedbackCommentArea.style.display = 'flex';
      feedbackSuccessMsg.style.display = 'none';
    });
  });

  // Thumbs Up (Quick 5 Stars)
  btnThumbUp.addEventListener('click', () => {
    selectedRating = 5;
    highlightStars(5);
    btnThumbUp.classList.add('voted');
    btnThumbDown.classList.remove('voted');
    submitRatingFeedback('Thumbs Up vote');
  });

  // Thumbs Down (Quick 1 Star)
  btnThumbDown.addEventListener('click', () => {
    selectedRating = 1;
    highlightStars(1);
    btnThumbDown.classList.add('voted');
    btnThumbUp.classList.remove('voted');
    feedbackCommentArea.style.display = 'flex';
    feedbackSuccessMsg.style.display = 'none';
  });

  // Detailed Comment Submit Button
  btnSubmitFeedback.addEventListener('click', () => {
    const comment = feedbackComment.value.trim();
    submitRatingFeedback(comment);
  });
}

function highlightStars(val) {
  starIcons.forEach(star => {
    const starVal = parseInt(star.getAttribute('data-value'), 10);
    if (starVal <= val) {
      star.className = 'star-icon selected';
      star.querySelector('i').className = 'fa-solid fa-star';
    } else {
      star.className = 'star-icon';
      star.querySelector('i').className = 'fa-regular fa-star';
    }
  });
}

async function submitRatingFeedback(comment) {
  if (!currentGenerationId || selectedRating === 0) return;
  
  try {
    const response = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentGenerationId,
        rating: selectedRating,
        feedback: comment
      })
    });
    
    if (response.ok) {
      feedbackCommentArea.style.display = 'none';
      feedbackSuccessMsg.style.display = 'flex';
      

      loadAnalytics();
      loadHistoryList();
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
  }
}

function resetFeedbackBox() {
  selectedRating = 0;
  highlightStars(0);
  btnThumbUp.classList.remove('voted');
  btnThumbDown.classList.remove('voted');
  feedbackComment.value = '';
  feedbackCommentArea.style.display = 'none';
  feedbackSuccessMsg.style.display = 'none';
}

/* ==========================================================================
   History Module
   ========================================================================== */
let historyData = [];

async function loadHistoryList() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    historyData = await response.json();
    renderHistorySidebar(historyData);
  } catch (error) {
    console.error('Error fetching history:', error);
    historySidebarList.innerHTML = '<p class="error-msg">Failed to load history list.</p>';
  }
}

function renderHistorySidebar(data) {
  historySidebarList.innerHTML = '';
  
  if (data.length === 0) {
    historySidebarList.innerHTML = '<div class="history-item-empty">No assessments created yet.</div>';
    return;
  }

  data.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.setAttribute('data-id', item.id);
    
    const formattedDate = new Date(item.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const ratingBadge = item.rating 
      ? `<span class="rating-badge-sm"><i class="fa-solid fa-star"></i> ${item.rating}</span>`
      : '';

    el.innerHTML = `
      <div class="history-item-header">
        <h4>${escapeHtml(item.projectName)}</h4>
        <span>${formattedDate}</span>
      </div>
      <div class="history-item-preview">${escapeHtml(item.productionScope)}</div>
      <div class="history-item-footer">
        <span>By: ${escapeHtml(item.projectManager)}</span>
        ${ratingBadge}
      </div>
    `;

    el.addEventListener('click', () => {
      document.querySelectorAll('.history-item').forEach(hi => hi.classList.remove('active'));
      el.classList.add('active');
      loadHistoryDetail(item.id);
    });

    historySidebarList.appendChild(el);
  });
}

// Search Filter
historySearchInput.addEventListener('input', () => {
  const query = historySearchInput.value.toLowerCase().trim();
  const filtered = historyData.filter(item => 
    item.projectName.toLowerCase().includes(query) ||
    item.projectManager.toLowerCase().includes(query)
  );
  renderHistorySidebar(filtered);
});

async function loadHistoryDetail(id) {
  historyDetailView.innerHTML = `
    <div class="output-state-generating">
      <span class="spinner"></span>
      <p style="margin-top:10px;">Loading historical analysis record...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`${API_BASE}/history/${id}`);
    const record = await response.json();
    
    if (!response.ok) throw new Error(record.error);

    const formattedDate = new Date(record.timestamp).toLocaleString();
    
    // Store variables to allow copy/download of historical records too!
    currentGenerationId = record.id;
    currentReportMarkdown = record.responseText;

    historyDetailView.innerHTML = `
      <div class="viewer-header">
        <div class="viewer-meta">
          <h3>${escapeHtml(record.projectName)}</h3>
          <div class="viewer-meta-row">
            <span><i class="fa-regular fa-clock"></i> Generated: ${formattedDate}</span>
            <span><i class="fa-regular fa-user"></i> Mgr: ${escapeHtml(record.projectManager)}</span>
            <span><i class="fa-solid fa-code-commit"></i> Prompt Version: ${record.promptVersion}</span>
          </div>
        </div>
        <div class="success-actions">
          <button class="action-btn" id="hist-btn-copy"><i class="fa-regular fa-copy"></i> Copy</button>
          <button class="action-btn" id="hist-btn-txt"><i class="fa-solid fa-file-arrow-down"></i> TXT</button>
          <button class="action-btn" id="hist-btn-pdf"><i class="fa-solid fa-file-pdf"></i> PDF</button>
          <button class="action-btn highlight-btn" id="hist-btn-load-form"><i class="fa-solid fa-pencil"></i> Edit Details</button>
          <button class="action-btn delete-btn" id="hist-btn-delete" title="Delete assessment permanently"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>

      <div class="report-render markdown-body">
        ${parseMarkdown(record.responseText)}
      </div>

      ${record.rating ? `
      <div class="feedback-box card" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2);">
        <h4 style="color:#34d399;"><i class="fa-solid fa-circle-check"></i> Quality Audit Submitted</h4>
        <p style="margin-bottom:8px;">This output was audited for precision during review cycles.</p>
        <div style="font-size:13px; font-weight:600; display:flex; gap:10px; align-items:center;">
          <span>Rating: </span>
          <span style="color:#fbbf24;">
            ${'<i class="fa-solid fa-star"></i>'.repeat(record.rating)}
            ${'<i class="fa-regular fa-star"></i>'.repeat(5 - record.rating)}
          </span>
        </div>
        ${record.feedback ? `<p style="font-style:italic; font-size:12px; margin-top:6px; color:#e5e7eb;">" ${escapeHtml(record.feedback)} "</p>` : ''}
      </div>
      ` : `
      <div class="feedback-box card" id="history-feedback-box">
        <h4>Quality Audit Missing</h4>
        <p>No feedback score is registered for this generation. Add audit score below.</p>
        <div class="feedback-interactive">
          <div class="rating-stars" id="history-stars-container">
            <span class="star-icon" data-value="1"><i class="fa-regular fa-star"></i></span>
            <span class="star-icon" data-value="2"><i class="fa-regular fa-star"></i></span>
            <span class="star-icon" data-value="3"><i class="fa-regular fa-star"></i></span>
            <span class="star-icon" data-value="4"><i class="fa-regular fa-star"></i></span>
            <span class="star-icon" data-value="5"><i class="fa-regular fa-star"></i></span>
          </div>
        </div>
        <div class="feedback-comment-wrapper" id="history-feedback-comment-area" style="display:none;">
          <textarea id="history-feedback-comment" rows="2" placeholder="Submit evaluation notes..."></textarea>
          <button class="submit-feedback-btn" id="history-btn-submit-feedback">Save Audit Score</button>
        </div>
      </div>
      `}
    `;

    // Hook events inside historical viewer
    document.getElementById('hist-btn-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(record.responseText);
      const btn = document.getElementById('hist-btn-copy');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 1500);
    });

    document.getElementById('hist-btn-txt').addEventListener('click', () => {
      const blob = new Blob([record.responseText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${record.projectName.replace(/\s+/g, '_')}_Risk_Report.txt`;
      link.click();
    });

    document.getElementById('hist-btn-pdf').addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${escapeHtml(record.projectName)} - Risk Report</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              blockquote { border-left: 4px solid #6366f1; padding-left: 15px; font-style: italic; }
              .risk-rating-badge { display: inline-block; font-size: 10px; border: 1px solid #111; padding: 2px 8px; border-radius: 4px; }
              .risk-rating-badge.low { color: green; }
              .risk-rating-badge.medium { color: orange; }
              .risk-rating-badge.high { color: red; }
            </style>
          </head>
          <body>
            ${parseMarkdown(record.responseText)}
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });

    document.getElementById('hist-btn-load-form').addEventListener('click', () => {
      populateForm(record);
      // Navigate to generator tab
      document.querySelector('.nav-btn[data-tab="generator"]').click();
    });

    document.getElementById('hist-btn-delete').addEventListener('click', async () => {
      if (confirm(`Are you sure you want to permanently delete this risk assessment ("${record.projectName}")?`)) {
        try {
          const btn = document.getElementById('hist-btn-delete');
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
          btn.disabled = true;
          
          const response = await fetch(`${API_BASE}/history/${record.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            historyDetailView.innerHTML = `
              <div class="history-viewer-idle">
                <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 48px; margin-bottom: 16px;"></i>
                <h3>Assessment Deleted</h3>
                <p>The record has been permanently removed from the database.</p>
              </div>
            `;
            await loadHistoryList();
            await loadAnalytics();
          } else {
            const errData = await response.json();
            alert(`Failed to delete record: ${errData.error || 'Unknown error'}`);
            btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
            btn.disabled = false;
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert(`Error deleting record: ${error.message}`);
          const btn = document.getElementById('hist-btn-delete');
          btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
          btn.disabled = false;
        }
      }
    });

    // Rating handles for historical records (if unrated)
    const histFeedbackBox = document.getElementById('history-feedback-box');
    if (histFeedbackBox) {
      const histStars = document.querySelectorAll('#history-stars-container .star-icon');
      const histCommentArea = document.getElementById('history-feedback-comment-area');
      let histSelectedRating = 0;

      const highlightHistStars = (val) => {
        histStars.forEach(star => {
          const starVal = parseInt(star.getAttribute('data-value'), 10);
          if (starVal <= val) {
            star.className = 'star-icon selected';
            star.querySelector('i').className = 'fa-solid fa-star';
          } else {
            star.className = 'star-icon';
            star.querySelector('i').className = 'fa-regular fa-star';
          }
        });
      };

      histStars.forEach(star => {
        star.addEventListener('mouseover', () => highlightHistStars(parseInt(star.getAttribute('data-value'), 10)));
        star.addEventListener('mouseout', () => highlightHistStars(histSelectedRating));
        star.addEventListener('click', () => {
          histSelectedRating = parseInt(star.getAttribute('data-value'), 10);
          highlightHistStars(histSelectedRating);
          histCommentArea.style.display = 'flex';
        });
      });

      document.getElementById('history-btn-submit-feedback').addEventListener('click', async () => {
        const comment = document.getElementById('history-feedback-comment').value.trim();
        try {
          const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: record.id,
              rating: histSelectedRating,
              feedback: comment
            })
          });
          if (response.ok) {
            loadHistoryDetail(record.id);
            loadHistoryList();
            loadAnalytics();
          }
        } catch (error) {
          console.error(error);
        }
      });
    }

  } catch (error) {
    console.error(error);
    historyDetailView.innerHTML = `<div class="error-msg">Failed to retrieve assessment details: ${error.message}</div>`;
  }
}



/* ==========================================================================
   Admin Analytics Dashboard
   ========================================================================== */
async function loadAnalytics() {
  try {
    const response = await fetch(`${API_BASE}/admin/analytics`);
    const data = await response.json();

    // Set metrics counters
    if (statTotalGens) statTotalGens.textContent = data.totalGenerations;
    if (statAvgRating) statAvgRating.textContent = data.totalGenerations > 0 
      ? `${data.averageRating.toFixed(1)} / 5.0`
      : 'No Ratings';
    if (statAvgTime) statAvgTime.textContent = `${(data.averageResponseTimeMs / 1000).toFixed(2)} s`;
    renderCharts(data);
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

function renderCharts(data) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Format date helper (e.g. "2026-06-15" -> "Jun 15")
  const formatDateLabel = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${monthNames[monthIdx]} ${day}`;
    }
    return dateStr;
  };

  const dates = data.dailyCounts.map(item => formatDateLabel(item.date));
  const counts = data.dailyCounts.map(item => item.count);

  // Filter out dates that have no ratings to prevent the line chart from plunging to 0 or null
  const ratedDailyCounts = data.dailyCounts.filter(item => item.avgRating !== null);
  const qualityDates = ratedDailyCounts.map(item => formatDateLabel(item.date));
  const quality = ratedDailyCounts.map(item => parseFloat(item.avgRating));

  // Style helper for chart fonts
  const fontStyle = {
    family: 'Inter',
    size: 11
  };

  // Chart 1: Generations Counts
  if (charts.generations) charts.generations.destroy();
  
  const chartGenEl = document.getElementById('chart-generations');
  if (chartGenEl) {
    const ctxGen = chartGenEl.getContext('2d');
    charts.generations = new Chart(ctxGen, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          label: 'Assessments Created',
          data: counts,
          backgroundColor: 'rgba(99, 102, 241, 0.4)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: fontStyle, color: '#9ca3af' } },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { font: fontStyle, color: '#9ca3af', stepSize: 1 } 
          }
        }
      }
    });
  }

  // Chart 2: Quality Trends over time
  if (charts.quality) charts.quality.destroy();

  const chartQualEl = document.getElementById('chart-quality');
  if (chartQualEl) {
    const ctxQual = chartQualEl.getContext('2d');
    charts.quality = new Chart(ctxQual, {
      type: 'line',
      data: {
        labels: qualityDates,
        datasets: [{
          label: 'Average Score',
          data: quality,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
          spanGaps: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: fontStyle, color: '#9ca3af' } },
          y: { 
            min: 1,
            max: 5,
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { font: fontStyle, color: '#9ca3af', stepSize: 1 } 
          }
        }
      }
    });
  }
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
