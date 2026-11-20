import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  CAMPUS_LANDMARKS,
  CAMPUS_NPCS,
  INSPECTABLE_ITEMS,
  TimeOfDayPreset,
  WeatherPreset,
} from './src/campus/campusData.ts';
import {
  computeCampusDirections,
  findNearbyLandmarks,
  findNearestLandmark,
  getNpcScheduleSlot,
  matchLandmarkFromQuery,
} from './src/campus/campusLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildCampusFactsSummary(): string {
  return CAMPUS_LANDMARKS.map(
    (l) =>
      `- ${l.name} [id=${l.id}, enterable=${l.enterable ? 'yes' : 'no'}, status=${l.verificationStatus}]: ${l.summary} Connected walkways: ${l.connectedTo.join(', ')}.`,
  ).join('\n');
}

interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  text: string;
}

function formatConversationContents(history: ChatHistoryEntry[], latestMessage: string) {
  const trimmed = Array.isArray(history) ? history.slice(-10) : [];
  const contents = trimmed.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(msg.text ?? '').slice(0, 1200) }],
  }));
  contents.push({
    role: 'user',
    parts: [{ text: latestMessage.slice(0, 1200) }],
  });
  return contents;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Verified campus knowledge base endpoint
  app.get('/api/campus/knowledge', (_req, res) => {
    res.json({
      campus: 'Polytechnic University of the Philippines (PUP) — A. Mabini Main Campus, Sta. Mesa, Manila',
      landmarks: CAMPUS_LANDMARKS,
      npcs: CAMPUS_NPCS.map((n) => ({
        id: n.id,
        name: n.name,
        role: n.role,
        roleCategory: n.roleCategory,
        department: n.department,
        homeLandmarkId: n.homeLandmarkId,
      })),
      inspectables: INSPECTABLE_ITEMS,
    });
  });

  // AI-Powered NPC Dialogue endpoint
  app.post('/api/npc/chat', async (req, res) => {
    try {
      const {
        npcId,
        message,
        history = [],
        playerPosition = { x: 70, z: -10 },
        timeOfDay = 'morning',
        weather = 'clear',
      } = req.body ?? {};

      const npc = CAMPUS_NPCS.find((n) => n.id === npcId);
      if (!npc) {
        return res.status(404).json({ error: 'NPC profile not found.' });
      }
      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      const ai = createGeminiClient();
      const nearest = findNearestLandmark(playerPosition);
      const nearby = findNearbyLandmarks(playerPosition, 5);
      const scheduleSlot = getNpcScheduleSlot(npc, timeOfDay as TimeOfDayPreset);
      const matchedTarget = matchLandmarkFromQuery(message);
      const routeHint =
        matchedTarget && matchedTarget.id !== nearest.landmark.id
          ? computeCampusDirections(nearest.landmark.id, matchedTarget.id).summary
          : '';

      const nearbyLines = nearby
        .map((n) => `  • ${n.landmark.shortName} (${n.distance}m to the ${n.direction})`)
        .join('\n');

      const systemInstruction = [
        `You are roleplaying as ${npc.name}, ${npc.role} (${npc.roleCategory}) in the ${npc.department} at the Polytechnic University of the Philippines (PUP) A. Mabini Main Campus in Sta. Mesa, Manila.`,
        `Personality: ${npc.personality}`,
        `Knowledge scope: ${npc.knowledgeScope}`,
        `Current simulated campus time: ${timeOfDay}. Current weather: ${weather as WeatherPreset}.`,
        `Your current activity right now: ${scheduleSlot.activity}.`,
        `The player is currently standing near: ${nearest.landmark.name}.`,
        `Landmarks around the player's current position:\n${nearbyLines}`,
        routeHint ? `Verified simulated walking route if relevant: ${routeHint}` : '',
        `Verified PUP Main Campus locations in this simulation:\n${buildCampusFactsSummary()}`,
        'STRICT GROUNDING RULES:',
        '1. Respond naturally in character as a real person on campus (concise 2 to 4 sentences, conversational, warm, human—no markdown headers or bullet walls).',
        '2. Maintain continuity with the conversation history.',
        '3. Use ONLY verified campus landmarks, directions, and your role’s knowledge above. Never invent room numbers, fake university memos, tuition numbers, or unverified policies.',
        '4. If asked something outside your role or unavailable in the campus knowledge base, politely admit you do not know rather than fabricating an answer.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: formatConversationContents(history, message.trim()),
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        return res.status(502).json({ error: 'The model returned an empty dialogue response.' });
      }

      return res.json({
        reply,
        suggestedLandmarkId: matchedTarget?.id ?? null,
        suggestedLandmarkName: matchedTarget?.shortName ?? null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate NPC dialogue.';
      console.error('[NPC Chat Error]', msg);
      return res.status(500).json({
        error: msg.includes('GEMINI_API_KEY')
          ? 'Gemini API key is not configured on the server. Configure GEMINI_API_KEY in Settings > Secrets.'
          : `Unable to reach the AI dialogue service: ${msg}`,
      });
    }
  });

  // AI-Powered PUP Campus Assistant endpoint
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        playerPosition = { x: 70, z: -10 },
        timeOfDay = 'morning',
        weather = 'clear',
      } = req.body ?? {};

      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Question text is required.' });
      }

      const ai = createGeminiClient();
      const nearest = findNearestLandmark(playerPosition);
      const nearby = findNearbyLandmarks(playerPosition, 6);

      // Detect origin & destination if user asks "from X to Y"
      const lower = message.toLowerCase();
      let fromLandmark = nearest.landmark;
      let toLandmark = matchLandmarkFromQuery(message);

      const fromToMatch = lower.match(/from\s+(.+?)\s+to\s+(.+)/i);
      if (fromToMatch) {
        const parsedFrom = matchLandmarkFromQuery(fromToMatch[1]);
        const parsedTo = matchLandmarkFromQuery(fromToMatch[2]);
        if (parsedFrom) fromLandmark = parsedFrom;
        if (parsedTo) toLandmark = parsedTo;
      }

      const computedRoute =
        toLandmark ? computeCampusDirections(fromLandmark.id, toLandmark.id) : null;

      const systemInstruction = [
        'You are the PUP Sta. Mesa Campus Assistant inside an interactive 3D simulation of the Polytechnic University of the Philippines (A. Mabini Main Campus, Sta. Mesa, Manila).',
        `Player’s live location: near ${nearest.landmark.name} (x=${Math.round(playerPosition.x)}, z=${Math.round(playerPosition.z)}).`,
        `Current simulated time: ${timeOfDay}, weather: ${weather}.`,
        `Nearest landmarks to player:\n${nearby.map((n) => `- ${n.landmark.name}: ${n.distance}m ${n.direction}`).join('\n')}`,
        computedRoute && computedRoute.found
          ? `VERIFIED SIMULATED ROUTE (${fromLandmark.shortName} -> ${toLandmark?.shortName}):\n${computedRoute.summary}`
          : '',
        `VERIFIED CAMPUS KNOWLEDGE BASE:\n${buildCampusFactsSummary()}`,
        'STRICT ACCURACY RULES:',
        '1. Base all directions, descriptions, and enterable building details strictly on the Verified Campus Knowledge Base and Verified Simulated Route above.',
        '2. Never fabricate building locations, room numbers, official university announcements, tuition policies, or unverified schedules.',
        '3. If the user asks about a building or policy not present in the verified knowledge base (for example, satellite campuses like CEA NDC Compound or Hasmin Hostel outside the core A. Mabini Main Campus map), explicitly clarify that it is outside this simulated core campus area or not in your verified records.',
        '4. Keep replies clear, well-structured, concise (3–5 sentences or short numbered steps), and helpful for navigating the 3D world.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: formatConversationContents(history, message.trim()),
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        return res.status(502).json({ error: 'The assistant returned an empty response.' });
      }

      return res.json({
        reply,
        waypointLandmarkId: toLandmark?.id ?? null,
        waypointLandmarkName: toLandmark?.shortName ?? null,
        routeSummary: computedRoute?.found ? computedRoute.summary : null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate assistant response.';
      console.error('[Assistant Chat Error]', msg);
      return res.status(500).json({
        error: msg.includes('GEMINI_API_KEY')
          ? 'Gemini API key is not configured on the server. Configure GEMINI_API_KEY in Settings > Secrets.'
          : `Unable to reach the Campus Assistant AI: ${msg}`,
      });
    }
  });

  // Mount Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PUP Sta. Mesa 3D Campus server listening on http://localhost:${PORT}`);
  });
}

startServer();
