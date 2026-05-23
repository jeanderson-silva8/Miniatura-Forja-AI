// ═══════════════════════════════════════════════════════
// 🛡️ MINIATURA FORJA AI — LÓGICA COMPARTILHADA
// ═══════════════════════════════════════════════════════
// Fonte única de verdade para ambos os entrypoints (api/generate.js em prod
// na Vercel + server.js em dev local). Antes existiam duas implementações
// divergentes — auditoria 2026-05-23 identificou 5 divergências entre elas
// (Helmet, body limit, threshold, CORS, mensagem de erro).
//
// Agora esta camada só faz:
//   1. validação de input
//   2. construção do prompt (template literal)
//   3. chamada à fal.ai
//
// O resto (rate limit, headers, body limit) fica no entrypoint — diferentes
// porque o ambiente é diferente, mas os valores vêm desta constante.

import { fal } from '@fal-ai/client';

// [SEGURANÇA] Configuração compartilhada — fonte única
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const BODY_LIMIT_BYTES = 10 * 1024; // 10 KB

export const VALID_STYLES = ['mrbeast', 'gaming', 'tech', 'reaction', 'minimalist'];
export const VALID_EMOTIONS = ['shock', 'excitement', 'curiosity', 'urgency', 'neutral'];

// [SEGURANÇA] Sanitização endurecida (auditoria 2026-05-23 — antes só removia
// `<>{}`, insuficiente para template literal que vai num prompt de imagem).
// Agora: remove control chars / quebras de linha, escapa aspas, limita a
// caracteres imprimíveis ASCII estendido + acentos comuns pt-BR.
export function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str
    // remove control chars + quebras de linha (impede injeção de "system: ...")
    .replace(new RegExp('[\u0000-\u001F\u007F]', 'g'), ' ')
    // remove caracteres já bloqueados antes
    .replace(/[<>{}]/g, '')
    // escapa aspas duplas (que abrem e fecham strings no prompt)
    .replace(/"/g, "'")
    // colapsa whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

const STYLE_PROMPTS = {
  mrbeast:
    'photorealistic YouTube thumbnail, ultra high contrast, extremely vibrant saturated colors, dramatic studio lighting with colored gels, person with exaggerated shocked open-mouth expression looking at camera, bold thick 3D text with neon glow outline and drop shadow, large yellow arrows pointing at subject, cinematic composition, professional photography, 8k ultra HD resolution, highly clickable viral YouTube thumbnail aesthetic, trending on YouTube',
  gaming:
    'epic gaming YouTube thumbnail, neon cyberpunk lighting with purple and cyan glow, dynamic dramatic action camera angle from below, high contrast with glowing particles and light rays, Unreal Engine 5 cinematic graphics quality, character with intense expression, bold glowing neon text overlay, vibrant gamer aesthetic with RGB lighting, 8k ultra HD, professional esports tournament style, trending gaming thumbnail',
  tech:
    'premium tech review YouTube thumbnail, clean professional studio lighting with soft gradient background, high quality product photography with dramatic rim lighting, sleek modern tech minimalist aesthetic, shallow depth of field with bokeh, person holding product with excited expression, bold clean sans-serif text overlay, sharp focus macro detail shot, 8k ultra HD, Apple-style product photography, professional tech reviewer thumbnail',
  reaction:
    'viral reaction YouTube thumbnail, extremely surprised dramatic face with wide eyes and open mouth, large thick glowing white stroke outline around person cutout, heavily blurred colorful background with bokeh, dramatic cinematic rim lighting from behind, bold impactful 3D text with shadow, large bright yellow arrows, diagonal split composition, 8k ultra HD, highly emotional clickable thumbnail, trending viral reaction video',
  minimalist:
    'clean minimalist YouTube thumbnail, bold flat design with strong geometric shapes, ample negative space, vibrant bold pastel color palette, elegant modern minimalist aesthetic, large bold typography as main element, subtle gradient background, vector illustration style with clean edges, professional graphic design quality, 8k resolution, trendy modern design thumbnail',
};

const EMOTION_MODIFIERS = {
  shock: 'extremely shocked surprised expression, wide eyes, dropped jaw, gasping face, dramatic lighting on face',
  excitement: 'ecstatic excited happy expression, big genuine smile, raised eyebrows, energetic dynamic pose, warm golden lighting',
  curiosity: 'mysterious intriguing atmosphere, person with curious questioning look, raised eyebrow, pointing at something hidden, suspenseful moody lighting with shadows',
  urgency: 'intense urgent high-stakes feeling, countdown timer visual, red warning colors, person with serious determined intense expression, dramatic red backlighting',
  neutral: 'confident calm professional look, direct eye contact with camera, clean balanced composition, soft even professional lighting',
};

let falConfigured = false;
function ensureFalConfigured() {
  if (falConfigured) return;
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is required');
  }
  fal.config({ credentials: process.env.FAL_KEY });
  falConfigured = true;
}

/**
 * Valida e normaliza o payload do cliente.
 * @returns {{ ok: true, input: object } | { ok: false, error: string }}
 */
export function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Payload inválido.' };
  }
  const title = sanitizeString(body.title, 100);
  const topic = sanitizeString(body.topic, 200);
  const style = VALID_STYLES.includes(body.style) ? body.style : 'mrbeast';
  const emotion = VALID_EMOTIONS.includes(body.emotion) ? body.emotion : 'shock';

  if (!title && !topic) {
    return { ok: false, error: 'Título ou tópico é obrigatório.' };
  }
  return { ok: true, input: { title, topic, style, emotion } };
}

/**
 * Gera 2 miniaturas via fal.ai/flux/dev em paralelo.
 * Lança em caso de erro — caller faz o tratamento.
 */
export async function generateThumbnails({ title, topic, style, emotion }) {
  ensureFalConfigured();
  const stylePrompt = STYLE_PROMPTS[style];
  const emotionMod = EMOTION_MODIFIERS[emotion];

  const prompt1 = `Professional viral YouTube thumbnail, 1280x720 landscape. Scene: ${topic}. The thumbnail MUST feature GIANT, MASSIVE, bold stylized 3D text saying "${title}" with thick outline, glow effects and drop shadow. The text MUST be the largest element in the image, extremely prominent and highly legible. ${emotionMod}. ${stylePrompt}. No borders, no mockup frames, no watermarks, perfectly rendered typography.`;

  const prompt2 = `Professional viral YouTube thumbnail, 1280x720 landscape. Theme: ${topic}. A dramatic photorealistic scene with expressive person reacting, large yellow arrows pointing at the main subject, and MASSIVE bold impactful text "${title.split(' ').slice(0, 3).join(' ')}" with thick 3D outline and glow. The text MUST be huge and take up at least 30% of the image. ${emotionMod}. ${stylePrompt}. Ultra detailed, cinematic, no borders, no mockup frames, perfect typography.`;

  const [result1, result2] = await Promise.all([
    fal.subscribe('fal-ai/flux/dev', {
      input: { prompt: prompt1, image_size: 'landscape_16_9', num_images: 1, num_inference_steps: 28, guidance_scale: 3.5 },
    }),
    fal.subscribe('fal-ai/flux/dev', {
      input: { prompt: prompt2, image_size: 'landscape_16_9', num_images: 1, num_inference_steps: 28, guidance_scale: 3.5 },
    }),
  ]);

  return {
    title,
    thumbnails: [
      { imageUrl: result1.data.images[0].url, ctrScore: Math.floor(Math.random() * 16) + 70 },
      { imageUrl: result2.data.images[0].url, ctrScore: Math.floor(Math.random() * 16) + 75 },
    ],
  };
}

/**
 * Extrai o IP do cliente de forma não-fakeável quando atrás da Vercel.
 * Auditoria 2026-05-23 (achados 🟠-3 e P2-B):
 *   - `x-forwarded-for` cru permite bypass via header forjado
 *   - pode vir como array em múltiplos proxies
 * Solução: `x-vercel-forwarded-for` (não-fakeável pela Vercel) com fallback
 * defensivo que normaliza tipo e pega o PRIMEIRO IP da chain.
 */
export function extractClientIp(headers) {
  const vercelIp = headers['x-vercel-forwarded-for'];
  if (vercelIp) {
    const value = Array.isArray(vercelIp) ? vercelIp[0] : vercelIp;
    return value.split(',')[0].trim();
  }
  // Fallback para dev / fora da Vercel
  const xff = headers['x-forwarded-for'];
  if (xff) {
    const value = Array.isArray(xff) ? xff[0] : xff;
    return value.split(',')[0].trim();
  }
  return 'unknown';
}
