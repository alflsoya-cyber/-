import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Persistent storage setup for family trip synchronization
const DATA_DIR = path.resolve(__dirname, 'data');
const TRIP_FILE = path.resolve(DATA_DIR, 'active_trip.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let activeTripCache: any = null;
let lastUpdatedTimestamp = Date.now();

if (fs.existsSync(TRIP_FILE)) {
  try {
    activeTripCache = JSON.parse(fs.readFileSync(TRIP_FILE, 'utf-8'));
    console.log('Loaded persisted trip from active_trip.json:', activeTripCache?.title);
  } catch (e) {
    console.error('Failed to read active_trip.json:', e);
  }
}

// 1. Get Shared Active Family Trip
app.get('/api/trip', (req, res) => {
  return res.json({
    success: true,
    trip: activeTripCache,
    updatedAt: lastUpdatedTimestamp,
  });
});

// 2. Save/Update Shared Active Family Trip
app.post('/api/trip', (req, res) => {
  try {
    const { trip } = req.body;
    if (trip && trip.id && trip.title) {
      activeTripCache = trip;
      lastUpdatedTimestamp = Date.now();
      fs.writeFileSync(TRIP_FILE, JSON.stringify(trip, null, 2), 'utf-8');
      console.log('Saved trip to active_trip.json:', trip.title, 'Budget:', trip.totalBudget);
      return res.json({ success: true, updatedAt: lastUpdatedTimestamp });
    }
    return res.status(400).json({ success: false, message: 'Invalid trip data' });
  } catch (error: any) {
    console.error('Failed to save trip:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Status check for real-time polling
app.get('/api/trip/status', (req, res) => {
  return res.json({
    success: true,
    updatedAt: lastUpdatedTimestamp,
  });
});

// API route for AI suggestions
app.post('/api/recommend-itinerary', async (req, res) => {
  try {
    const { destination, members, days, style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'GEMINI_API_KEY가 설정되지 않아 사전 큐레이션된 추천 정보를 제공합니다.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const memberDesc = Array.isArray(members)
      ? members.map((m: any) => `${m.name} (${m.role}, ${m.ageGroup || ''})`).join(', ')
      : '온 가족';

    const prompt = `당신은 대한민국 최고의 가족여행 전문 컨설턴트입니다. 다음 조건에 맞추어 가족 모두가 만족할 수 있는 여행 추천지 및 코스 3곳과 가족여행 팁 3가지를 JSON 형식으로 작성해주세요.
여행지: ${destination || '제주도'}
여행 기간: ${days || 3}박 ${(days ? days + 1 : 4)}일
가족 구성원: ${memberDesc}
선호 스타일: ${style || '휴식, 맛집, 아이 및 어르신 배려'}

응답 형식은 반드시 다음 JSON 구조를 따라야 합니다:
{
  "recommendations": [
    {
      "title": "장소/활동명",
      "category": "관광" | "식사" | "체험" | "휴식",
      "description": "추천 이유 및 특징 설명 (2~3문장)",
      "location": "위치/지역명",
      "familyNote": "어린이나 어르신 동반 시 팁 (예: 유모차 대여 가능, 완만한 산책로, 주차 용이)"
    }
  ],
  "tips": [
    "가족 여행 꿀팁 1",
    "가족 여행 꿀팁 2",
    "가족 여행 꿀팁 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: error?.message || '추천 생성 중 오류 발생',
    });
  }
});

// Vite middleware in dev or static files in prod
if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
