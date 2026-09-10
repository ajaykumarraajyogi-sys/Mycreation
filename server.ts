import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Gemini AI Video Editing Assistant
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { prompt, projectContext } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are the AI Assistant for "AI Video Studio", a mobile-first video editor.
You help creators optimize videos, generate viral captions, titles, hashtags, format for TikTok/Shorts/Reels (9:16), fit target durations (e.g. 30s or 60s), and generate precise editing instructions.

Given the user's prompt and current project context (clips, aspect ratio, duration, audio, text overlays, captions, filter), respond in clean JSON format with:
{
  "message": "Friendly, expert advice summarizing the suggestions and actions.",
  "suggestedTitle": "Catchy title if relevant",
  "suggestedDescription": "Optimized description with timestamps or hook",
  "suggestedHashtags": ["#Shorts", "#Trending"],
  "actions": [
    // Array of zero or more executable project actions:
    // { "type": "setAspectRatio", "aspectRatio": "9:16" | "16:9" | "1:1" }
    // { "type": "setFilter", "filter": "cinematic" | "warm" | "cool" | "vintage" | "monochrome" | "vivid" | "none" }
    // { "type": "addCaptions", "captions": [{ "text": "...", "startTime": 0.5, "endTime": 2.5 }] }
    // { "type": "addTextOverlay", "text": "...", "startTime": 0, "endTime": 3, "color": "#ffffff", "fontSize": 28, "y": 20 }
    // { "type": "setClipSpeed", "clipIndex": 0, "speed": 1.5 }
    // { "type": "trimClip", "clipIndex": 0, "trimStart": 0, "trimEnd": 15 }
  ]
}

Ensure all durations, start and end times respect the available clip lengths. If the user asks for "YouTube Shorts" or "TikTok", recommend 9:16 aspect ratio, hook text overlay, and catchy captions. If the user asks to "Make the video 30 seconds", calculate trimming or speed adjustments across the clips to reach 30 seconds.
Always return valid JSON only.`;

    const contents = `User Request: "${prompt}"

Current Project State:
${JSON.stringify(projectContext || {}, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback if formatting was slightly off
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in AI video assistant:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process AI assistant request',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
