// ═══════════════════════════════════════════════════════
// 🛡️ MINIATURA FORJA AI — Vercel Serverless Handler
// ═══════════════════════════════════════════════════════
// Auditoria 2026-05-23 (modo paranoico) endureceu este handler.
// Correções aplicadas:
//   1. Lógica de negócio importada de api/_lib/generator.js (fonte única)
//   2. extractClientIp usa x-vercel-forwarded-for (não-fakeável) + trata array
//   3. Headers de segurança setados manualmente (helmet equivalente)
//   4. Resposta de erro não vaza error.body.detail (mensagem genérica)
//   5. CORS responde 403 em origin não-allowlist (era silent antes)
//   6. Rate limit usa constantes compartilhadas (era diferente do dev)

import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  validatePayload,
  generateThumbnails,
  extractClientIp,
} from './_lib/generator.js';

export const config = { maxDuration: 60 };

// ─── Rate limit in-memory (best effort em serverless — ver docs/adr/ADR-002) ─
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const ALLOWED_ORIGINS = ['https://thumbnail-forge-one.vercel.app', 'http://localhost:5173'];

function setSecurityHeaders(res) {
  // [SEGURANÇA] Equivalente ao helmet() para um endpoint JSON-only.
  // O frontend HTML recebe headers complementares via vercel.json.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  // [SEGURANÇA] CORS — agora BLOQUEIA origens não-allowlist (era silent na v1).
  const origin = req.headers.origin;
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return res.status(403).json({ error: 'Origin não autorizada.' });
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // [SEGURANÇA] Rate limit por IP (best effort — ver ADR-002).
  // IP vem do x-vercel-forwarded-for que a Vercel injeta e não pode ser forjado pelo cliente.
  const clientIp = extractClientIp(req.headers);
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Limite de geração atingido. Aguarde 1 minuto.' });
  }

  // [SEGURANÇA] Validação + sanitização vêm do módulo compartilhado.
  const validation = validatePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await generateThumbnails(validation.input);
    return res.status(200).json(result);
  } catch (error) {
    // [SEGURANÇA] Log Seguro — status interno só no log, nunca ao cliente.
    // Antes propagava error.body.detail (vazava "Quota exceeded", "Invalid API key").
    console.error('[FAL.AI] Erro:', error?.status || error?.code || 'UNKNOWN');
    return res.status(500).json({ error: 'Erro ao gerar miniaturas. Tente novamente em alguns instantes.' });
  }
}
