// ═══════════════════════════════════════════════════════
// 🛡️ MINIATURA FORJA AI — Dev Server (localhost:3001)
// ═══════════════════════════════════════════════════════
// Este arquivo é APENAS para desenvolvimento local (`npm run dev` via proxy do Vite).
// Em produção, é `api/generate.js` que serve o tráfego — esta auditoria 2026-05-23
// eliminou a divergência: ambos os entrypoints usam o mesmo módulo compartilhado
// (`api/_lib/generator.js`), e o handler Vercel é importado diretamente aqui via
// um adapter Express → Vercel.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  BODY_LIMIT_BYTES,
} from './api/_lib/generator.js';
import handler from './api/generate.js';

const PORT = 3001;
const app = express();

// [SEGURANÇA] Headers HTTP de proteção (Helmet) — apenas para dev local.
// Em produção, headers são setados pelo vercel.json (frontend) + api/generate.js (API).
app.use(helmet());

// [SEGURANÇA] CORS estrito (dev) — bloqueia origens não-allowlist com erro.
const allowedOrigins = [
  'https://thumbnail-forge-one.vercel.app',
  'http://localhost:5173', // Vite dev server (porta padrão)
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Bloqueado pela política de CORS'));
  },
}));

// [SEGURANÇA] Rate limit em camada Express (dev). Em prod, o api/generate.js
// faz isso via Map in-memory porque express-rate-limit não é prático em
// serverless function. Threshold compartilhado via constante.
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de geração atingido. Aguarde 1 minuto.' },
}));

// [SEGURANÇA] Body limit (anti payload bomb) — mesma constante do prod.
app.use(express.json({ limit: BODY_LIMIT_BYTES }));

// Delegação ao mesmo handler de produção (zero duplicação de lógica de negócio).
app.post('/api/generate', (req, res) => handler(req, res));

app.listen(PORT, () => {
  console.log(`\n🚀 Dev server rodando em http://localhost:${PORT}`);
  console.log(`📡 POST /api/generate (handler compartilhado com api/generate.js)\n`);
});
