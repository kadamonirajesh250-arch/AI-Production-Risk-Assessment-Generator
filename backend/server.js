const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper to replace template tags
function compilePrompt(template, variables) {
  let prompt = template;
  Object.keys(variables).forEach(key => {
    const value = variables[key] || '';
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return prompt;
}

// Simulated High-Quality Risk Assessment Generator
function generateMockAssessment(projectName, projectManager, productionScope, timeline, resourcePlan) {
  const scopeLower = productionScope.toLowerCase();
  const resourceLower = resourcePlan.toLowerCase();
  
  let rating = 'MEDIUM';
  let justification = 'The project has standard complexity but requires close monitoring of timelines and client feedback cycles.';
  
  const scheduleRisks = [];
  const technicalRisks = [];
  const resourceRisks = [];
  const scopeRisks = [];

  // VFX keywords
  if (scopeLower.includes('vfx') || scopeLower.includes('cgi') || scopeLower.includes('effect') || scopeLower.includes('render')) {
    rating = 'HIGH';
    justification = 'VFX rendering pipelines require heavy compute power and complex asset tracking. The tight delivery schedule and potential render queue blockages elevate risk.';
    
    technicalRisks.push({
      name: 'VFX Render Node Congestion',
      severity: 'HIGH',
      impact: 'Render queue backups prevent compositors from receiving final frames, delaying final QC and delivery.',
      mitigations: [
        'Establish automated render optimization passes and limit preview renders to low-res proxies.',
        'Arrange a backup cloud rendering subscription (e.g. AWS Thinkbox) to scale nodes dynamically if local queues exceed 4 hours.',
        'Implement strict file-naming conventions and automated ingestion validation to avoid bad render jobs.'
      ]
    });
    
    resourceRisks.push({
      name: 'VFX Supervisor Bottleneck',
      severity: 'MEDIUM',
      impact: 'Review cycles are delayed as all assets must pass a single supervisor, creating idle time for animators.',
      mitigations: [
        'Appoint a senior compositor as Assistant VFX Supervisor to handle initial review passes.',
        'Define clear technical specs for "Good Enough for Review" to screen out incomplete renders.'
      ]
    });
  }

  // Dubbing & localization keywords
  if (scopeLower.includes('dub') || scopeLower.includes('localiz') || scopeLower.includes('translation') || scopeLower.includes('audio') || scopeLower.includes('voice')) {
    if (rating !== 'HIGH') rating = 'MEDIUM';
    justification = 'Audio dubbing requires strict coordination with voice talents across multiple languages. Delay in script approvals or casting directly halts recording.';
    
    scheduleRisks.push({
      name: 'Multilingual Script Translation Delay',
      severity: 'HIGH',
      impact: 'Translators deliver late, causing recording booth slots to be missed and rescheduling fees to apply.',
      mitigations: [
        'Lock source scripts and initiate translating 5 days before recording session.',
        'Use pre-cast voice talents who have flexible studio availability.',
        'Establish a digital portal (e.g. Google Sheets) for real-time script adjustments during translation.'
      ]
    });

    resourceRisks.push({
      name: 'Voice Actor No-Shows',
      severity: 'MEDIUM',
      impact: 'Recording studio remains idle while booking costs are incurred, shifting the entire localization schedule.',
      mitigations: [
        'Confirm bookings 48 hours and 24 hours prior; keep pre-screened backup voice talents on standby.',
        'Arrange remote recording capabilities (e.g., Source-Connect) for voice actors who cannot travel to the booth.'
      ]
    });
  }

  // Animation keywords
  if (scopeLower.includes('animat') || scopeLower.includes('3d') || scopeLower.includes('character')) {
    rating = 'HIGH';
    
    technicalRisks.push({
      name: '3D Rigging and Model Errors',
      severity: 'HIGH',
      impact: 'Broken skeletal rigs or texture maps found late in the pipeline force animators to redo complete scenes.',
      mitigations: [
        'Enforce a mandatory Rig Sign-Off milestone before any animation begins.',
        'Use asset management tools to ensure all team members access correct model versions.'
      ]
    });
  }

  // Corporate Video keywords
  if (scopeLower.includes('corporate') || scopeLower.includes('brand') || scopeLower.includes('interview') || scopeLower.includes('shoot')) {
    scheduleRisks.push({
      name: 'Corporate Executive Schedule Shifts',
      severity: 'MEDIUM',
      impact: 'Key executives reschedule interview times at the last minute, delaying filming and extending camera crew booking costs.',
      mitigations: [
        'Schedule a 4-hour flexible window for executive interviews rather than a single fixed slot.',
        'Prepare alternative B-roll shoots to execute immediately if the interview is delayed.'
      ]
    });

    scopeRisks.push({
      name: 'Excessive Revision Cycles from Client Stakeholders',
      severity: 'HIGH',
      impact: 'Multiple department managers request contradictory changes to the video edit, causing scope creep and missing final deadlines.',
      mitigations: [
        'Designate a single client point-of-contact with final sign-off authority.',
        'Include a maximum of two revision rounds in the project agreement; charge additional fees for subsequent edits.'
      ]
    });
  }

  // Fallbacks if no keywords matched
  if (scheduleRisks.length === 0) {
    scheduleRisks.push({
      name: 'Unrealistic Milestone Deadlines',
      severity: 'MEDIUM',
      impact: 'Overlapping deadlines create team burnout and lead to rushed, sub-standard deliverables.',
      mitigations: [
        'Define a clear Gantt chart with 15% buffer time built-in for creative review.',
        'Hold weekly status standups to re-prioritize items.'
      ]
    });
  }

  if (technicalRisks.length === 0) {
    technicalRisks.push({
      name: 'Data Loss and File Corruption',
      severity: 'MEDIUM',
      impact: 'VFX project files or edits are lost due to hardware failure, requiring hours of rebuild work.',
      mitigations: [
        'Enable automatic hourly backups to local servers and daily cloud backups.',
        'Define a project archiving structure.'
      ]
    });
  }

  if (resourceRisks.length === 0) {
    resourceRisks.push({
      name: 'Core Talent Absences',
      severity: 'MEDIUM',
      impact: 'Key editor or sound mixer falls ill, halting progress on critical path tasks.',
      mitigations: [
        'Maintain detailed project documentation and source code/assets in a shared workspace (e.g. NAS/Google Drive).',
        'Cross-train staff to ensure a backup team member can step in.'
      ]
    });
  }

  if (scopeRisks.length === 0) {
    scopeRisks.push({
      name: 'Client Feedback Delays',
      severity: 'MEDIUM',
      impact: 'Client takes several days to review project drafts, freezing the production pipeline.',
      mitigations: [
        'Establish a SLA (Service Level Agreement) requiring client feedback within 24 hours.',
        'Inform the client that late feedback will automatically push the final delivery date.'
      ]
    });
  }

  // Assemble into final markdown
  let md = `# AI Production Risk Assessment
## Project Overview
This assessment covers **${projectName}**, managed by **${projectManager}**. The scope details: ${productionScope}. Timeline details: ${timeline}.

## Overall Project Risk Rating: ${rating}
${justification}

## Identified Production Risks & Mitigation Plans

### 1. Schedule & Timeline Risks
${scheduleRisks.map(r => `- **Risk Name**: ${r.name}\n  - **Severity**: ${r.severity}\n  - **Impact**: ${r.impact}\n  - **Actionable Mitigation Steps**:\n${r.mitigations.map(m => `    - ${m}`).join('\n')}`).join('\n\n')}

### 2. Technical & Pipeline Risks
${technicalRisks.map(r => `- **Risk Name**: ${r.name}\n  - **Severity**: ${r.severity}\n  - **Impact**: ${r.impact}\n  - **Actionable Mitigation Steps**:\n${r.mitigations.map(m => `    - ${m}`).join('\n')}`).join('\n\n')}

### 3. Resource & Personnel Risks
${resourceRisks.map(r => `- **Risk Name**: ${r.name}\n  - **Severity**: ${r.severity}\n  - **Impact**: ${r.impact}\n  - **Actionable Mitigation Steps**:\n${r.mitigations.map(m => `    - ${m}`).join('\n')}`).join('\n\n')}

### 4. Scope Creep & Financial Risks
${scopeRisks.map(r => `- **Risk Name**: ${r.name}\n  - **Severity**: ${r.severity}\n  - **Impact**: ${r.impact}\n  - **Actionable Mitigation Steps**:\n${r.mitigations.map(m => `    - ${m}`).join('\n')}`).join('\n\n')}

> **[Simulator Mode Note]** This output was generated by the built-in DigiQuest Risk Simulator because no active Gemini or OpenAI API keys were found. Configure keys in the project environment to unlock live AI generation.`;

  return md;
}

// API: Generate Risk Assessment
app.post('/api/generate', async (req, res) => {
  const { projectName, projectManager, productionScope, timeline, resourcePlan, userApiKey, apiType } = req.body;

  if (!projectName || !projectManager || !productionScope || !timeline || !resourcePlan) {
    return res.status(400).json({ error: 'All fields (projectName, projectManager, productionScope, timeline, resourcePlan) are required.' });
  }

  const startTime = Date.now();
  const activePrompt = await db.getActivePrompt();
  
  const compiledUserPrompt = compilePrompt(activePrompt.userPromptTemplate, {
    projectName,
    projectManager,
    productionScope,
    timeline,
    resourcePlan
  });

  const sysInstruction = activePrompt.systemInstruction;
  let responseText = '';
  let usedModel = 'Simulator (Keyword Rule-based)';

  // Choose the API key (1. UI input -> 2. Environment config)
  const geminiKey = userApiKey && apiType === 'gemini' ? userApiKey : process.env.GEMINI_API_KEY;
  const openaiKey = userApiKey && apiType === 'openai' ? userApiKey : process.env.OPENAI_API_KEY;

  try {
    if (apiType === 'openai' && openaiKey) {
      // Call OpenAI API
      usedModel = 'gpt-4o';
      const openai = new OpenAI({ apiKey: openaiKey });
      
      const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: sysInstruction },
          { role: 'user', content: compiledUserPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1800
      });
      responseText = chatCompletion.choices[0].message.content;
    } else if ((apiType === 'gemini' && geminiKey) || (!openaiKey && geminiKey)) {
      // Call Gemini API (default to Gemini if both keys are set or only Gemini is set)
      usedModel = 'gemini-1.5-pro';
      const genAI = new GoogleGenerativeAI(geminiKey);
      
      // Use gemini-1.5-pro for complex structured reasoning as per docs
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: sysInstruction
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: compiledUserPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      });
      responseText = result.response.text();
    } else {
      // Simulator Fallback (Simulate network lag)
      await new Promise(resolve => setTimeout(resolve, 1500));
      responseText = generateMockAssessment(projectName, projectManager, productionScope, timeline, resourcePlan);
    }

    const responseTimeMs = Date.now() - startTime;
    
    // Save to Database
    const savedGen = await db.saveGeneration({
      projectName,
      projectManager,
      productionScope,
      timeline,
      resourcePlan,
      promptVersion: activePrompt.version,
      responseText,
      responseTimeMs
    });

    res.json({
      success: true,
      data: savedGen,
      model: usedModel,
      responseTimeMs
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate risk assessment: ' + error.message,
      model: usedModel,
      responseTimeMs: Date.now() - startTime
    });
  }
});

// API: History
app.get('/api/history', async (req, res) => {
  try {
    const history = await db.getHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const record = await db.getGenerationById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/history/:id', async (req, res) => {
  try {
    const record = await db.getGenerationById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    await db.deleteGeneration(req.params.id);
    res.json({ success: true, message: 'Assessment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Feedback / Rating
app.post('/api/feedback', async (req, res) => {
  const { id, rating, feedback } = req.body;
  if (!id || rating === undefined) {
    return res.status(400).json({ error: 'Both id and rating are required.' });
  }
  try {
    const updated = await db.saveFeedback(id, rating, feedback);
    if (!updated) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Presets
app.get('/api/presets', async (req, res) => {
  try {
    const presets = await db.getPresets();
    res.json(presets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/presets', async (req, res) => {
  const { name, projectName, projectManager, productionScope, timeline, resourcePlan } = req.body;
  if (!name || !projectName || !projectManager || !productionScope || !timeline || !resourcePlan) {
    return res.status(400).json({ error: 'All fields are required to create a template preset.' });
  }
  try {
    const newPreset = await db.savePreset({ name, projectName, projectManager, productionScope, timeline, resourcePlan });
    res.json({ success: true, data: newPreset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Prompts/Templates for Admin Dashboard
app.get('/api/templates', async (req, res) => {
  try {
    const prompts = await db.getPrompts();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates/active', async (req, res) => {
  const { version } = req.body;
  if (!version) return res.status(400).json({ error: 'Version is required.' });
  try {
    const updated = await db.setActivePrompt(version);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates/update', async (req, res) => {
  const { version, systemInstruction, userPromptTemplate } = req.body;
  if (!version || !systemInstruction || !userPromptTemplate) {
    return res.status(400).json({ error: 'Version, systemInstruction, and userPromptTemplate are required.' });
  }
  try {
    const updated = await db.updatePrompt(version, systemInstruction, userPromptTemplate);
    if (!updated) return res.status(404).json({ error: 'Prompt version not found.' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Admin Analytics
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback to HTML for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Export or listen
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI Production Risk Assessment Generator server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
