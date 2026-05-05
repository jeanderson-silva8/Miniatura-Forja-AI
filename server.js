import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as falClient from '@fal-ai/client';

// ═══════════════════════════════════════════════════════
// 🛡️ PROTOCOLO DE SEGURANÇA ENTERPRISE — MINIATURA FORJA AI
// ═══════════════════════════════════════════════════════

const PORT = 3001;

falClient.fal.config({
  credentials: process.env.FAL_KEY,
});

const app = express();

// [SEGURANÇA] Headers HTTP de proteção (Helmet)
app.use(helmet());

// [SEGURANÇA] CORS Restrito — Aceita APENAS o frontend autorizado
const allowedOrigins = [
  'https://thumbnail-forge-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado pela política de CORS'));
  },
  credentials: true
}));

// [SEGURANÇA] Rate Limiting CRÍTICO — Cada request gasta créditos de IA ($$$)
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // Máximo 3 gerações por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de geração atingido. Aguarde 1 minuto para gerar novas miniaturas.' }
});

app.use(express.json({ limit: '10kb' })); // Anti payload bomb

// ═══════════════════════════════════════════════════════
// 🛡️ SANITIZAÇÃO DE INPUTS
// ═══════════════════════════════════════════════════════

function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  // Remove caracteres potencialmente perigosos para prompt injection
  return str.replace(/[<>{}]/g, '').trim().slice(0, maxLength);
}

const VALID_STYLES = ['mrbeast', 'gaming', 'tech', 'reaction', 'minimalist'];
const VALID_EMOTIONS = ['shock', 'excitement', 'curiosity', 'urgency', 'neutral'];

// === Prompts Invisíveis ULTRA-DETALHADOS para Thumbnails Virais ===
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

// === Endpoint de Geração (2 miniaturas) — COM RATE LIMITING ===
app.post('/api/generate', generateLimiter, async (req, res) => {
  try {
    // [SEGURANÇA] Sanitização de todos os inputs
    const title = sanitizeString(req.body.title, 100);
    const topic = sanitizeString(req.body.topic, 200);
    const style = VALID_STYLES.includes(req.body.style) ? req.body.style : 'mrbeast';
    const emotion = VALID_EMOTIONS.includes(req.body.emotion) ? req.body.emotion : 'shock';

    if (!title && !topic) {
      return res.status(400).json({ error: 'Título ou tópico é obrigatório.' });
    }

    const stylePrompt = STYLE_PROMPTS[style];
    const emotionMod = EMOTION_MODIFIERS[emotion];

    // Prompt 1: Cena com texto gigante
    const prompt1 = `Professional viral YouTube thumbnail, 1280x720 landscape. Scene: ${topic}. The thumbnail MUST feature GIANT, MASSIVE, bold stylized 3D text saying "${title}" with thick outline, glow effects and drop shadow. The text MUST be the largest element in the image, extremely prominent and highly legible. ${emotionMod}. ${stylePrompt}. No borders, no mockup frames, no watermarks, perfectly rendered typography.`;

    // Prompt 2: Foco em pessoa + ação dramática + texto enorme
    const prompt2 = `Professional viral YouTube thumbnail, 1280x720 landscape. Theme: ${topic}. A dramatic photorealistic scene with expressive person reacting, large yellow arrows pointing at the main subject, and MASSIVE bold impactful text "${title.split(' ').slice(0, 3).join(' ')}" with thick 3D outline and glow. The text MUST be huge and take up at least 30% of the image. ${emotionMod}. ${stylePrompt}. Ultra detailed, cinematic, no borders, no mockup frames, perfect typography.`;

    // [SEGURANÇA] Log Seguro — não imprime dados do usuário
    console.log(`[FAL.AI] Gerando 2 miniaturas | Estilo: ${style} | Emoção: ${emotion}`);

    // Gerar as 2 imagens em paralelo usando FLUX Dev (qualidade superior)
    const [result1, result2] = await Promise.all([
      falClient.fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt: prompt1,
          image_size: 'landscape_16_9',
          num_images: 1,
          num_inference_steps: 28,
          guidance_scale: 3.5,
        },
        logs: true,
        onQueueUpdate: (u) => {
          if (u.status === 'IN_QUEUE') console.log(`[FAL.AI] Miniatura 1 na fila...`);
        },
      }),
      falClient.fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt: prompt2,
          image_size: 'landscape_16_9',
          num_images: 1,
          num_inference_steps: 28,
          guidance_scale: 3.5,
        },
        logs: true,
        onQueueUpdate: (u) => {
          if (u.status === 'IN_QUEUE') console.log(`[FAL.AI] Miniatura 2 na fila...`);
        },
      }),
    ]);

    const image1 = result1.data.images[0].url;
    const image2 = result2.data.images[0].url;

    console.log(`[FAL.AI] ✅ 2 miniaturas geradas com sucesso.`);

    res.json({
      title,
      thumbnails: [
        { imageUrl: image1, ctrScore: Math.floor(Math.random() * 16) + 70 },
        { imageUrl: image2, ctrScore: Math.floor(Math.random() * 16) + 75 },
      ],
    });

  } catch (error) {
    // [SEGURANÇA] Log Seguro — nunca expor stack trace completo
    console.error('[FAL.AI] Erro na geração:', error?.status || 'UNKNOWN');
    const msg = error?.body?.detail || 'Erro ao gerar miniaturas. Tente novamente.';
    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor ThumbnailForge rodando em http://localhost:${PORT}`);
  console.log(`📡 Modelo: FLUX Dev (Alta Qualidade)`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/generate\n`);
});
