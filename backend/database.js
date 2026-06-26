const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const admin = require('firebase-admin');

const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Default initial state
const DEFAULT_PROMPTS = [
  {
    version: 'v1',
    description: 'Basic Prompt',
    systemInstruction: 'You are an AI production risk assistant. Identify risks and suggest mitigation steps for the project details provided.',
    userPromptTemplate: 'Project Name: {{projectName}}\nProject Manager: {{projectManager}}\nScope: {{productionScope}}\nTimeline: {{timeline}}\nResources: {{resourcePlan}}\n\nList the risks and mitigation steps.',
    isActive: false
  },
  {
    version: 'v2',
    description: 'Structured Category Prompt',
    systemInstruction: 'You are a Production Risk Analyst. Classify identified risks into categories: Schedule, Technical/VFX, Resource/Personnel, and Budget/Scope. Suggest mitigation plans for each.',
    userPromptTemplate: 'Please analyze the following production details:\nProject: {{projectName}}\nManager: {{projectManager}}\nScope: {{productionScope}}\nTimeline: {{timeline}}\nResource Plan: {{resourcePlan}}\n\nProvide a structured breakdown of risks by category with mitigation steps for each.',
    isActive: false
  },
  {
    version: 'v3',
    description: 'Severity & Risk Rating Prompt',
    systemInstruction: 'You are a Senior VFX & Content Production Manager. For each identified risk, assign a severity level (High, Medium, Low) and provide actionable, studio-specific mitigations. Provide an overall Project Risk Score (Low/Medium/High).',
    userPromptTemplate: 'Analyze these production parameters:\nProject: {{projectName}}\nManager: {{projectManager}}\nScope: {{productionScope}}\nTimeline: {{timeline}}\nResource Plan: {{resourcePlan}}\n\nIdentify risks, assign severity, suggest mitigation steps, and provide an overall risk score.',
    isActive: false
  },
  {
    version: 'v4',
    description: 'DigiQuest Studio Optimized Prompt (Target Quality >= 4.0)',
    systemInstruction: `You are the Lead Executive Producer at DigiQuest Studio, a full-service film, VFX, animation, and multilingual dubbing production company. Your job is to conduct a rigorous, proactive Production Risk Assessment.

Analyze the user's project parameters and output a highly structured, professional assessment. 

Structure the response exactly as follows:
# AI Production Risk Assessment
## Project Overview
Briefly summarize the project, duration, and key focus areas.

## Overall Project Risk Rating: [LOW / MEDIUM / HIGH]
Provide a rating and a 2-3 sentence justification explaining the main drivers of this rating.

## Identified Production Risks & Mitigation Plans
Divide this section into 4 specific categories:
1. **Schedule & Timeline Risks** (Milestones, delay impacts, dubbing tracks sync, VFX rendering deadlines)
2. **Technical & Pipeline Risks** (Render farm availability, software compatibility, VFX asset specs, post-production pipeline bottlenecks)
3. **Resource & Personnel Risks** (Voice actor availability, animator bottlenecks, specialized supervisor constraints)
4. **Scope Creep & Financial Risks** (Revision cycles, client approvals delay, budget overrun drivers)

For each risk, include:
- **Risk Name**: Clear description
- **Severity**: [HIGH / MEDIUM / LOW]
- **Impact**: What happens if this risk occurs at DigiQuest Studio
- **Actionable Mitigation Steps**: 2-3 specific, concrete steps to prevent or resolve this risk

Use markdown formatting, bold headers, and bullet points. Focus on studio-specific content production realities (e.g. dubbing, VFX rendering, animation, translation, video edits) rather than generic business jargon.`,
    userPromptTemplate: `Conduct a Risk Assessment for:
Project Name: {{projectName}}
Project Manager: {{projectManager}}
Production Scope: {{productionScope}}
Timeline Details: {{timeline}}
Resource & Team Plan: {{resourcePlan}}`,
    isActive: true
  }
];

const DEFAULT_PRESETS = [
  {
    id: 'preset-vfx',
    name: 'VFX-Heavy Sci-Fi Short Film',
    projectName: 'Chronos Awakening - Sci-Fi Short',
    projectManager: 'Sarah Jenkins',
    productionScope: '15-minute sci-fi short containing 45 high-end VFX shots, including CGI space environments, robotic character models, and complex energy FX. Multilingual dubbing required for English, Spanish, and French release.',
    timeline: 'June 1, 2026 to June 30, 2026. 26 working days. Strict release date on July 5.',
    resourcePlan: '3 animators, 2 VFX compositors, 1 sound editor. Render farm has 10 dedicated nodes. Voice actors booked for dubbing on June 22-24.'
  },
  {
    id: 'preset-dubbing',
    name: 'Multilingual Dubbing & Audio Localization',
    projectName: 'Cyber City Chronicles - Season 1 Dub',
    projectManager: 'David Cho',
    productionScope: 'Dubbing 10 episodes of an animated web series from English to Hindi, Tamil, Telugu, and Bengali. Script translation, voice casting, recording, and stereo audio mixing/mastering.',
    timeline: 'June 10, 2026 to June 28, 2026. Tight schedules with rolling episode deliveries every 3 days.',
    resourcePlan: '2 translation supervisors, 4 voice directors, 1 recording engineer. Recording studio booked 8 hours daily. Need to coordinate with 12 voice actors across 4 languages.'
  },
  {
    id: 'preset-corporate',
    name: 'Corporate Brand Video',
    projectName: 'TechCorp 2026 Annual Vision Video',
    projectManager: 'Marcus Vance',
    productionScope: '3-minute high-end corporate brand video. Includes 2 days of on-site interview filming at client headquarters, b-roll shooting, motion graphics overlays, and music scoring.',
    timeline: 'June 5, 2026 to June 22, 2026. Filming scheduled for June 10-11.',
    resourcePlan: '1 director/cameraman, 1 assistant, 1 editor/motion designer. Basic camera gear, drone for aerial b-roll, standard desktop editing suite.'
  }
];

// Helper to generate dates relative to today
function getSampleDates() {
  const dates = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getSampleGenerations() {
  const dates = getSampleDates();
  return [
    {
      id: 'gen_sample_1',
      projectName: 'Aether VFX Commercial',
      projectManager: 'Sarah Jenkins',
      productionScope: '30-second commercial with heavy 3D CGI products and liquid simulations.',
      timeline: '2 weeks duration, tight feedback loops.',
      resourcePlan: '1 senior 3D artist, 1 compositor, standard render setup.',
      promptVersion: 'v4',
      responseText: `# AI Production Risk Assessment
## Project Overview
Aether VFX Commercial is a high-profile 3D CGI product commercial featuring complex liquid simulations. It has a short 2-week duration.

## Overall Project Risk Rating: HIGH
The combination of advanced fluid simulations and a short timeline creates a high probability of bottlenecking, especially during render and feedback stages.

## Identified Production Risks & Mitigation Plans
### 1. Schedule & Timeline Risks
- **Risk Name**: Simulation delays
- **Severity**: HIGH
- **Impact**: Delays the start of lighting, rendering, and compositing, risking client delivery date.
- **Actionable Mitigation Steps**:
  - Run low-resolution simulation tests on Day 1.
  - Approve visual style guide with client early to avoid simulation re-runs.

### 2. Technical & Pipeline Risks
- **Risk Name**: Liquid render time bottle-necks
- **Severity**: HIGH
- **Impact**: Rendering fluid simulations can consume render-farm nodes, stopping other production.
- **Actionable Mitigation Steps**:
  - Optimize particle counts and use denoising techniques.
  - Queue overnight renders and monitor node usage.`,
      responseTimeMs: 2450,
      timestamp: dates[0] + 'T14:20:00.000Z',
      rating: 5,
      feedback: 'Excellent risk assessment. Extremely accurate for fluid simulations.'
    },
    {
      id: 'gen_sample_2',
      projectName: 'Global Launch Dubbing',
      projectManager: 'David Cho',
      productionScope: 'Audio localization for 5 promotional videos into 3 languages.',
      timeline: '10 working days.',
      resourcePlan: '3 translators, 2 voice actors, 1 mixing engineer.',
      promptVersion: 'v4',
      responseText: `# AI Production Risk Assessment
## Project Overview
Localizing audio assets for promo campaigns into Spanish, German, and Japanese.

## Overall Project Risk Rating: MEDIUM
Main challenges lie in coordinating foreign language voice talents and ensuring accurate translation matching visual beats.

## Identified Production Risks & Mitigation Plans
### 1. Resource & Personnel Risks
- **Risk Name**: Voice talent availability
- **Severity**: HIGH
- **Impact**: Recording delay pushes editing and final master.
- **Actionable Mitigation Steps**:
  - Book backup voice talents for each language.
  - Complete script translations and approvals 3 days before recording.

### 2. Scope Creep & Financial Risks
- **Risk Name**: Script changes after recording
- **Severity**: MEDIUM
- **Impact**: Recording re-takes double cost and delay delivery.
- **Actionable Mitigation Steps**:
  - Lock script with client sign-off before voice talents enter the booth.`,
      responseTimeMs: 3100,
      timestamp: dates[2] + 'T09:15:00.000Z',
      rating: 4,
      feedback: 'Good mitigations, although voice actors booking went smoothly.'
    },
    {
      id: 'gen_sample_3',
      projectName: 'Legacy Documentary Edit',
      projectManager: 'Marcus Vance',
      productionScope: 'Editing historical documentary with archival footage and sound restoration.',
      timeline: '4 weeks duration.',
      resourcePlan: '1 editor, 1 sound designer, archival researcher.',
      promptVersion: 'v3',
      responseText: `# AI Production Risk Assessment
## Overall Project Risk Rating: LOW
Low risk overall as the timeline is generous and dependencies are standard.

## Identified Production Risks & Mitigation Plans
### 1. Schedule & Timeline Risks
- **Risk Name**: Archival footage licensing delays
- **Severity**: MEDIUM
- **Impact**: Cannot export final video if licenses are missing.
- **Actionable Mitigation Steps**:
  - Start clearance applications on Day 1.`,
      responseTimeMs: 1850,
      timestamp: dates[4] + 'T11:00:00.000Z',
      rating: 4,
      feedback: 'Simple but correct.'
    }
  ];
}

// Database Connection Config
let pool = null;
let usePostgres = false;
let firestore = null;
let useFirebase = false;

// Initialize Firebase if credentials exist
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
  try {
    console.log('Firebase env detected. Configuring Cloud Firestore...');
    const privateKey = firebasePrivateKey.replace(/\\n/g, '\n');
    
    // Check if Firebase app is already initialized to prevent duplicate errors
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: privateKey
        })
      });
    }
    
    firestore = admin.firestore();
    useFirebase = true;
    console.log('Firebase Cloud Firestore database initialized successfully.');
  } catch (error) {
    console.error('Firebase Cloud Firestore initialization failed:', error.message);
  }
}

// Initialize Postgres if active and not using Firebase
if (!useFirebase && process.env.DATABASE_URL) {
  console.log('PostgreSQL DATABASE_URL detected. Configuring database connection pool...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('neon') || process.env.DATABASE_URL.includes('railway')
      ? { rejectUnauthorized: false }
      : false
  });
  usePostgres = true;
}

// In-Memory Database (for JSON / Local storage mode)
let localDb = {
  generations: [],
  prompts: [],
  presets: []
};

// Initialize File-based Database
function initializeLocalDb() {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const rawData = fs.readFileSync(DB_PATH, 'utf8');
      localDb = JSON.parse(rawData);
      if (!localDb.generations) localDb.generations = [];
      if (!localDb.prompts || localDb.prompts.length === 0) localDb.prompts = DEFAULT_PROMPTS;
      if (!localDb.presets || localDb.presets.length === 0) localDb.presets = DEFAULT_PRESETS;
    } else {
      localDb.generations = getSampleGenerations();
      localDb.prompts = DEFAULT_PROMPTS;
      localDb.presets = DEFAULT_PRESETS;
      saveLocalToFile();
    }
    console.log('JSON File database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize JSON database, using in-memory mode:', error.message);
    localDb.generations = getSampleGenerations();
    localDb.prompts = DEFAULT_PROMPTS;
    localDb.presets = DEFAULT_PRESETS;
  }
}

function saveLocalToFile() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(localDb, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.warn('JSON database write skipped (read-only environment or write error):', error.message);
    return false;
  }
}

// Initialize PostgreSQL Database & Create Tables
async function initializePostgresDb() {
  const client = await pool.connect();
  try {
    console.log('Running PostgreSQL schema migrations...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        version VARCHAR(50) PRIMARY KEY,
        description VARCHAR(255),
        system_instruction TEXT NOT NULL,
        user_prompt_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS presets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        project_manager VARCHAR(255) NOT NULL,
        production_scope TEXT NOT NULL,
        timeline TEXT NOT NULL,
        resource_plan TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id VARCHAR(50) PRIMARY KEY,
        project_name VARCHAR(255) NOT NULL,
        project_manager VARCHAR(255) NOT NULL,
        production_scope TEXT NOT NULL,
        timeline TEXT NOT NULL,
        resource_plan TEXT NOT NULL,
        prompt_version VARCHAR(50) NOT NULL,
        response_text TEXT NOT NULL,
        response_time_ms INTEGER DEFAULT 0,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        rating INTEGER,
        feedback TEXT
      )
    `);

    // Seed defaults...
    const promptCount = await client.query('SELECT COUNT(*) FROM prompts');
    if (parseInt(promptCount.rows[0].count, 10) === 0) {
      for (const p of DEFAULT_PROMPTS) {
        await client.query(
          `INSERT INTO prompts (version, description, system_instruction, user_prompt_template, is_active) 
           VALUES ($1, $2, $3, $4, $5)`,
          [p.version, p.description, p.systemInstruction, p.userPromptTemplate, p.isActive]
        );
      }
    }

    const presetCount = await client.query('SELECT COUNT(*) FROM presets');
    if (parseInt(presetCount.rows[0].count, 10) === 0) {
      for (const pr of DEFAULT_PRESETS) {
        await client.query(
          `INSERT INTO presets (id, name, project_name, project_manager, production_scope, timeline, resource_plan) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pr.id, pr.name, pr.projectName, pr.projectManager, pr.productionScope, pr.timeline, pr.resourcePlan]
        );
      }
    }

    const genCount = await client.query('SELECT COUNT(*) FROM generations');
    if (parseInt(genCount.rows[0].count, 10) === 0) {
      const samples = getSampleGenerations();
      for (const g of samples) {
        await client.query(
          `INSERT INTO generations (id, project_name, project_manager, production_scope, timeline, resource_plan, prompt_version, response_text, response_time_ms, timestamp, rating, feedback) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [g.id, g.projectName, g.projectManager, g.productionScope, g.timeline, g.resourcePlan, g.promptVersion, g.responseText, g.responseTimeMs, g.timestamp, g.rating, g.feedback]
        );
      }
    }

    console.log('PostgreSQL database initialized and seeded successfully.');
  } catch (error) {
    console.error('PostgreSQL initialization failed. Falling back to JSON local file storage.', error);
    usePostgres = false;
    initializeLocalDb();
  } finally {
    client.release();
  }
}

// Initialize Firebase Database & Seed Collections
async function initializeFirebaseDb() {
  try {
    console.log('Checking Firebase Firestore collections...');
    
    // Seed prompts
    const promptRef = firestore.collection('prompts');
    const promptSnapshot = await promptRef.limit(1).get();
    if (promptSnapshot.empty) {
      console.log('Seeding default prompts into Cloud Firestore...');
      for (const p of DEFAULT_PROMPTS) {
        await promptRef.doc(p.version).set(p);
      }
    }

    // Seed presets
    const presetRef = firestore.collection('presets');
    const presetSnapshot = await presetRef.limit(1).get();
    if (presetSnapshot.empty) {
      console.log('Seeding default presets into Cloud Firestore...');
      for (const pr of DEFAULT_PRESETS) {
        await presetRef.doc(pr.id).set(pr);
      }
    }

    // Seed sample generations
    const genRef = firestore.collection('generations');
    const genSnapshot = await genRef.limit(1).get();
    if (genSnapshot.empty) {
      console.log('Seeding sample generations into Cloud Firestore...');
      const samples = getSampleGenerations();
      for (const g of samples) {
        await genRef.doc(g.id).set(g);
      }
    }

    console.log('Firebase Cloud Firestore database initialized and seeded successfully.');
  } catch (error) {
    console.error('Firebase Firestore check/seeding failed. Falling back to next DB.', error);
    useFirebase = false;
    if (process.env.DATABASE_URL) {
      usePostgres = true;
      initializePostgresDb();
    } else {
      initializeLocalDb();
    }
  }
}

// Auto Initialize Database
if (useFirebase) {
  initializeFirebaseDb();
} else if (usePostgres) {
  initializePostgresDb();
} else {
  initializeLocalDb();
}

// Database Helpers
module.exports = {
  // Generations API
  getHistory: async () => {
    if (useFirebase) {
      try {
        const snapshot = await firestore.collection('generations').orderBy('timestamp', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Firebase error in getHistory:', error);
        return [];
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query('SELECT * FROM generations ORDER BY timestamp DESC');
        return res.rows.map(row => ({
          id: row.id,
          projectName: row.project_name,
          projectManager: row.project_manager,
          productionScope: row.production_scope,
          timeline: row.timeline,
          resourcePlan: row.resource_plan,
          promptVersion: row.prompt_version,
          responseText: row.response_text,
          responseTimeMs: row.response_time_ms,
          timestamp: row.timestamp,
          rating: row.rating,
          feedback: row.feedback
        }));
      } catch (error) {
        console.error('Postgres error in getHistory:', error);
        return [];
      }
    } else {
      return [...localDb.generations].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  },

  getGenerationById: async (id) => {
    if (useFirebase) {
      try {
        const doc = await firestore.collection('generations').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error('Firebase error in getGenerationById:', error);
        return null;
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query('SELECT * FROM generations WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          projectName: row.project_name,
          projectManager: row.project_manager,
          productionScope: row.production_scope,
          timeline: row.timeline,
          resourcePlan: row.resource_plan,
          promptVersion: row.prompt_version,
          responseText: row.response_text,
          responseTimeMs: row.response_time_ms,
          timestamp: row.timestamp,
          rating: row.rating,
          feedback: row.feedback
        };
      } catch (error) {
        console.error('Postgres error in getGenerationById:', error);
        return null;
      }
    } else {
      return localDb.generations.find(g => g.id === id) || null;
    }
  },

  saveGeneration: async (gen) => {
    const newGen = {
      id: gen.id || `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectName: gen.projectName,
      projectManager: gen.projectManager,
      productionScope: gen.productionScope,
      timeline: gen.timeline,
      resourcePlan: gen.resourcePlan,
      promptVersion: gen.promptVersion,
      responseText: gen.responseText,
      responseTimeMs: gen.responseTimeMs || 0,
      timestamp: gen.timestamp || new Date().toISOString(),
      rating: gen.rating || null,
      feedback: gen.feedback || ''
    };

    if (useFirebase) {
      try {
        await firestore.collection('generations').doc(newGen.id).set(newGen);
      } catch (error) {
        console.error('Firebase error in saveGeneration:', error);
      }
    } else if (usePostgres) {
      try {
        await pool.query(
          `INSERT INTO generations (id, project_name, project_manager, production_scope, timeline, resource_plan, prompt_version, response_text, response_time_ms, timestamp, rating, feedback) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [newGen.id, newGen.projectName, newGen.projectManager, newGen.productionScope, newGen.timeline, newGen.resourcePlan, newGen.promptVersion, newGen.responseText, newGen.responseTimeMs, newGen.timestamp, newGen.rating, newGen.feedback]
        );
      } catch (error) {
        console.error('Postgres error in saveGeneration:', error);
      }
    } else {
      localDb.generations.push(newGen);
      saveLocalToFile();
    }
    return newGen;
  },

  saveFeedback: async (id, rating, feedback) => {
    const rateVal = parseInt(rating, 10);
    const commentVal = feedback || '';

    if (useFirebase) {
      try {
        await firestore.collection('generations').doc(id).update({
          rating: rateVal,
          feedback: commentVal
        });
        const doc = await firestore.collection('generations').doc(id).get();
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error('Firebase error in saveFeedback:', error);
        return null;
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query(
          `UPDATE generations SET rating = $2, feedback = $3 WHERE id = $1 RETURNING *`,
          [id, rateVal, commentVal]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          projectName: row.project_name,
          projectManager: row.project_manager,
          productionScope: row.production_scope,
          timeline: row.timeline,
          resourcePlan: row.resource_plan,
          promptVersion: row.prompt_version,
          responseText: row.response_text,
          responseTimeMs: row.response_time_ms,
          timestamp: row.timestamp,
          rating: row.rating,
          feedback: row.feedback
        };
      } catch (error) {
        console.error('Postgres error in saveFeedback:', error);
        return null;
      }
    } else {
      const gen = localDb.generations.find(g => g.id === id);
      if (gen) {
        gen.rating = rateVal;
        gen.feedback = commentVal;
        saveLocalToFile();
        return gen;
      }
      return null;
    }
  },

  deleteGeneration: async (id) => {
    // Delete from Firebase if configured
    if (useFirebase) {
      try {
        await firestore.collection('generations').doc(id).delete();
      } catch (error) {
        console.error('Firebase error in deleteGeneration:', error);
      }
    }

    // Delete from Postgres if configured
    if (usePostgres) {
      try {
        await pool.query('DELETE FROM generations WHERE id = $1', [id]);
      } catch (error) {
        console.error('Postgres error in deleteGeneration:', error);
      }
    }

    // Delete from Local JSON array
    const idx = localDb.generations.findIndex(g => g.id === id);
    if (idx !== -1) {
      localDb.generations.splice(idx, 1);
      saveLocalToFile();
    }
    return true;
  },

  // Prompts API
  getPrompts: async () => {
    if (useFirebase) {
      try {
        const snapshot = await firestore.collection('prompts').get();
        const list = snapshot.docs.map(doc => doc.data());
        return list.sort((a, b) => a.version.localeCompare(b.version));
      } catch (error) {
        console.error('Firebase error in getPrompts:', error);
        return [];
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query('SELECT * FROM prompts ORDER BY version ASC');
        return res.rows.map(row => ({
          version: row.version,
          description: row.description,
          systemInstruction: row.system_instruction,
          userPromptTemplate: row.user_prompt_template,
          isActive: row.is_active
        }));
      } catch (error) {
        console.error('Postgres error in getPrompts:', error);
        return [];
      }
    } else {
      return localDb.prompts;
    }
  },

  getActivePrompt: async () => {
    if (useFirebase) {
      try {
        const snapshot = await firestore.collection('prompts').where('isActive', '==', true).limit(1).get();
        if (!snapshot.empty) {
          return snapshot.docs[0].data();
        }
        const fallback = await firestore.collection('prompts').get();
        const list = fallback.docs.map(doc => doc.data());
        list.sort((a, b) => b.version.localeCompare(a.version));
        if (list.length > 0) return list[0];
        return DEFAULT_PROMPTS[DEFAULT_PROMPTS.length - 1];
      } catch (error) {
        console.error('Firebase error in getActivePrompt:', error);
        return DEFAULT_PROMPTS[DEFAULT_PROMPTS.length - 1];
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query('SELECT * FROM prompts WHERE is_active = TRUE');
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            version: row.version,
            description: row.description,
            systemInstruction: row.system_instruction,
            userPromptTemplate: row.user_prompt_template,
            isActive: row.is_active
          };
        }
        const fallbackRes = await pool.query('SELECT * FROM prompts ORDER BY version DESC LIMIT 1');
        if (fallbackRes.rows.length > 0) {
          const row = fallbackRes.rows[0];
          return {
            version: row.version,
            description: row.description,
            systemInstruction: row.system_instruction,
            userPromptTemplate: row.user_prompt_template,
            isActive: row.is_active
          };
        }
        return DEFAULT_PROMPTS[DEFAULT_PROMPTS.length - 1];
      } catch (error) {
        console.error('Postgres error in getActivePrompt:', error);
        return DEFAULT_PROMPTS[DEFAULT_PROMPTS.length - 1];
      }
    } else {
      const active = localDb.prompts.find(p => p.isActive);
      return active || localDb.prompts[localDb.prompts.length - 1];
    }
  },

  setActivePrompt: async (version) => {
    if (useFirebase) {
      try {
        const promptsRef = firestore.collection('prompts');
        const batch = firestore.batch();
        const snapshot = await promptsRef.get();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isActive: doc.id === version });
        });
        await batch.commit();
        const updated = await promptsRef.get();
        const list = updated.docs.map(doc => doc.data());
        return list.sort((a, b) => a.version.localeCompare(b.version));
      } catch (error) {
        console.error('Firebase error in setActivePrompt:', error);
        return [];
      }
    } else if (usePostgres) {
      try {
        await pool.query('UPDATE prompts SET is_active = FALSE');
        await pool.query('UPDATE prompts SET is_active = TRUE WHERE version = $1', [version]);
        const res = await pool.query('SELECT * FROM prompts ORDER BY version ASC');
        return res.rows.map(row => ({
          version: row.version,
          description: row.description,
          systemInstruction: row.system_instruction,
          userPromptTemplate: row.user_prompt_template,
          isActive: row.is_active
        }));
      } catch (error) {
        console.error('Postgres error in setActivePrompt:', error);
        return [];
      }
    } else {
      localDb.prompts.forEach(p => {
        p.isActive = (p.version === version);
      });
      saveLocalToFile();
      return localDb.prompts;
    }
  },

  updatePrompt: async (version, systemInstruction, userPromptTemplate) => {
    if (useFirebase) {
      try {
        await firestore.collection('prompts').doc(version).update({
          systemInstruction,
          userPromptTemplate
        });
        const doc = await firestore.collection('prompts').doc(version).get();
        return doc.data();
      } catch (error) {
        console.error('Firebase error in updatePrompt:', error);
        return null;
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query(
          `UPDATE prompts SET system_instruction = $2, user_prompt_template = $3 WHERE version = $1 RETURNING *`,
          [version, systemInstruction, userPromptTemplate]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          version: row.version,
          description: row.description,
          systemInstruction: row.system_instruction,
          userPromptTemplate: row.user_prompt_template,
          isActive: row.is_active
        };
      } catch (error) {
        console.error('Postgres error in updatePrompt:', error);
        return null;
      }
    } else {
      const prompt = localDb.prompts.find(p => p.version === version);
      if (prompt) {
        prompt.systemInstruction = systemInstruction;
        prompt.userPromptTemplate = userPromptTemplate;
        saveLocalToFile();
        return prompt;
      }
      return null;
    }
  },

  // Presets API
  getPresets: async () => {
    if (useFirebase) {
      try {
        const snapshot = await firestore.collection('presets').get();
        const list = snapshot.docs.map(doc => doc.data());
        return list.sort((a, b) => a.id.localeCompare(b.id));
      } catch (error) {
        console.error('Firebase error in getPresets:', error);
        return [];
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query('SELECT * FROM presets ORDER BY id ASC');
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          projectName: row.project_name,
          projectManager: row.project_manager,
          productionScope: row.production_scope,
          timeline: row.timeline,
          resourcePlan: row.resource_plan
        }));
      } catch (error) {
        console.error('Postgres error in getPresets:', error);
        return [];
      }
    } else {
      return localDb.presets;
    }
  },

  savePreset: async (preset) => {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name: preset.name,
      projectName: preset.projectName,
      projectManager: preset.projectManager,
      productionScope: preset.productionScope,
      timeline: preset.timeline,
      resourcePlan: preset.resourcePlan
    };

    if (useFirebase) {
      try {
        await firestore.collection('presets').doc(newPreset.id).set(newPreset);
      } catch (error) {
        console.error('Firebase error in savePreset:', error);
      }
    } else if (usePostgres) {
      try {
        await pool.query(
          `INSERT INTO presets (id, name, project_name, project_manager, production_scope, timeline, resource_plan) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newPreset.id, newPreset.name, newPreset.projectName, newPreset.projectManager, newPreset.productionScope, newPreset.timeline, newPreset.resourcePlan]
        );
      } catch (error) {
        console.error('Postgres error in savePreset:', error);
      }
    } else {
      localDb.presets.push(newPreset);
      saveLocalToFile();
    }
    return newPreset;
  },

  // Analytics API
  getAnalytics: async () => {
    let gens = [];
    if (useFirebase) {
      try {
        const snapshot = await firestore.collection('generations').get();
        gens = snapshot.docs.map(doc => doc.data());
      } catch (error) {
        console.error('Firebase error in getAnalytics:', error);
        gens = [];
      }
    } else if (usePostgres) {
      try {
        const res = await pool.query('SELECT rating, response_time_ms, timestamp, production_scope, project_name FROM generations');
        gens = res.rows.map(row => ({
          rating: row.rating,
          responseTimeMs: row.response_time_ms,
          timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
          productionScope: row.production_scope,
          projectName: row.project_name
        }));
      } catch (error) {
        console.error('Postgres error in getAnalytics:', error);
        gens = [];
      }
    } else {
      gens = localDb.generations;
    }

    const total = gens.length;
    const ratedGens = gens.filter(g => g.rating !== null);
    const avgRating = ratedGens.length > 0
      ? ratedGens.reduce((sum, g) => sum + g.rating, 0) / ratedGens.length
      : 0;

    const avgResponseTime = total > 0
      ? gens.reduce((sum, g) => sum + g.responseTimeMs, 0) / total
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedGens.forEach(g => {
      ratingDistribution[g.rating] = (ratingDistribution[g.rating] || 0) + 1;
    });

    const dailyStats = {};
    gens.forEach(g => {
      const dateStr = g.timestamp ? g.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = { count: 0, totalRating: 0, ratedCount: 0 };
      }
      dailyStats[dateStr].count += 1;
      if (g.rating !== null) {
        dailyStats[dateStr].totalRating += g.rating;
        dailyStats[dateStr].ratedCount += 1;
      }
    });

    const dailyCounts = Object.keys(dailyStats).sort().map(date => ({
      date,
      count: dailyStats[date].count,
      avgRating: dailyStats[date].ratedCount > 0 ? (dailyStats[date].totalRating / dailyStats[date].ratedCount).toFixed(1) : null
    }));

    const keywordCounts = {};
    const commonStopwords = new Set(['the', 'a', 'and', 'of', 'to', 'for', 'in', 'is', 'on', 'with', 'at', 'by', 'an', 'this', 'that', 'from', 'it', 'for', 'are', 'required', 'required.', 'has', 'have']);
    
    gens.forEach(g => {
      const words = ((g.productionScope || '') + ' ' + (g.projectName || ''))
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/);
      words.forEach(w => {
        if (w && w.length > 2 && !commonStopwords.has(w)) {
          keywordCounts[w] = (keywordCounts[w] || 0) + 1;
        }
      });
    });

    const topKeywords = Object.keys(keywordCounts)
      .map(k => ({ word: k, count: keywordCounts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalGenerations: total,
      averageRating: parseFloat(avgRating.toFixed(2)),
      averageResponseTimeMs: Math.round(avgResponseTime),
      ratingDistribution,
      dailyCounts,
      topKeywords
    };
  }
};
