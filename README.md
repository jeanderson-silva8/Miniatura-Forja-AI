# 🎨 Miniatura Forja AI

> Micro-SaaS para gerar **thumbnails virais de YouTube** com IA generativa (`fal-ai/flux-dev`) — descreva seu vídeo, escolha um estilo, receba 2 variações em ~15 segundos. Frontend React + Vite, backend serverless na Vercel, fonte única de verdade compartilhada entre dev e produção.

[![Acessar App](https://img.shields.io/badge/🌐_ACESSAR_APP-thumbnail--forge--one.vercel.app-7C3AED?style=for-the-badge)](https://thumbnail-forge-one.vercel.app)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel_Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white)
![fal.ai](https://img.shields.io/badge/AI-fal.ai_FLUX_Dev-FF5A5F?style=for-the-badge)

🟢 **LIVE DEMO:** [Acesse o Miniatura Forja AI Ao Vivo Aqui](https://thumbnail-forge-one.vercel.app)
🛡️ **Auditoria de Segurança Aplicada:** [Veja a auditoria 2026-05-23](docs/AUDIT_REPORT_2026-05-23.md)

---

## 💻 Sobre o Projeto

Criar thumbnail viral no Photoshop leva 1-2 horas e exige conhecimento de design — atrasa publicação, custa atenção. O **Miniatura Forja AI** resolve em ~15 segundos: usuário digita título + tópico, escolhe estilo (MrBeast, gaming, tech, reaction, minimalista) + emoção (choque, excitação, curiosidade, urgência, neutra), e a API gera **duas variações** em paralelo via `fal-ai/flux-dev`.

A engenharia interessante está em outro lugar: como manter **uma fonte única de verdade** quando o app roda em dois contextos diferentes (dev local com Express + Vite proxy + produção serverless na Vercel). A auditoria de segurança 2026-05-23 identificou que a versão anterior tinha **5 divergências** entre os dois entrypoints — defesas que existiam só no dev. A refatoração extraiu a lógica para `api/_lib/generator.js`, e ambos os caminhos (`server.js` para dev, `api/generate.js` para Vercel) agora importam dali. **Zero divergência funcional, defesas aplicadas onde realmente importa.**

---

## 🎯 Destaques Técnicos & Desafios Superados

**Manter segurança e fonte única de verdade num app que tem dois entrypoints com ambientes muito diferentes (Express local vs Vercel serverless).**

A complexidade não está nem na chamada à fal.ai nem no React — está na arquitetura. Vercel functions não permitem `app.use(helmet())` do Express; Express local não tem `x-vercel-forwarded-for`. A tentação é manter duas implementações e "lembrar de sincronizar" — exatamente a armadilha que a auditoria pegou.

Três decisões resolveram:

1. **Módulo neutro de domínio (`api/_lib/generator.js`)** — toda a lógica de validação, sanitização, construção de prompts e chamada à fal.ai mora aqui. Sem dependência de Express ou de Vercel. Dois clientes possíveis (handler Vercel ou app Express) consomem o mesmo módulo.
2. **`server.js` como adapter, não como reimplementação** — o dev server importa o handler Vercel (`api/generate.js`) e o envelopa com middleware Express (Helmet, rate-limit, body-limit). Lógica de negócio = uma cópia só. Camadas de defesa = adequadas ao ambiente.
3. **IP confiável via `x-vercel-forwarded-for`, com fallback defensivo** — Vercel injeta o header e sobrescreve qualquer tentativa do cliente de forjar. A função `extractClientIp` ainda trata o caso de array (múltiplos proxies podem entregar `x-forwarded-for` como array de strings — bug sutil que zera o rate limit quando usado como chave de `Map`).

---

## 📐 Decisões Arquiteturais (Trade-offs)

- **Endpoint público sem autenticação** — registro/login adicionaria fricção sensorial num produto de "geração one-shot". Aceito como dívida em [`ADR-001`](docs/adr/ADR-001-sem-autenticacao.md), com gatilhos de reabertura (drenagem real do billing, monetização).
- **Rate limit in-memory em vez de Vercel KV** — store compartilhado resolveria 100% do problema técnico, mas adiciona conta externa + 2 env vars para um projeto sem tráfego real. Trade-off em [`ADR-002`](docs/adr/ADR-002-rate-limit-in-memory.md).
- **CSP com `'unsafe-inline'` em `script-src`** — limitação do bootstrap do Vite. Compensado por ausência de input de usuário renderizado como HTML. Trade-off em [`ADR-003`](docs/adr/ADR-003-csp-unsafe-inline.md).

---

## <a id="seg-camadas"></a>🔒 Segurança — camadas e status

> *Auditoria 2026-05-23 (modo paranoico, 2 passadas integradas): **1 crítico** identificado (`FAL_KEY` no histórico público do git — chave rotacionada em seguida); **7 importantes** corrigidos no código; **8 de qualidade** tratados. [Relatório completo](docs/AUDIT_REPORT_2026-05-23.md) · [Threat model STRIDE](docs/THREAT_MODEL.md) · [Política de reporte](SECURITY.md).*

| Camada | Implementação | Status |
|---|---|:--:|
| Single source of truth | `api/_lib/generator.js` (validação, sanitização, geração) importado por dev (`server.js`) e prod (`api/generate.js`); zero duplicação | ✅ |
| Sanitização de prompt | `sanitizeString` remove control chars, escapa aspas, colapsa whitespace, limita tamanho — endurecido na auditoria (antes só removia `<>{}`) | ✅ |
| Validação de input | Allowlist explícita de `style` e `emotion`; `title` ou `topic` obrigatório; payload extra descartado | ✅ |
| IP confiável | `extractClientIp` usa `x-vercel-forwarded-for` (não-fakeável pela Vercel) com tratamento de array para múltiplos proxies | ✅ |
| Rate limit | 5 req/min por IP via `Map` in-memory — best effort em serverless ([`ADR-002`](docs/adr/ADR-002-rate-limit-in-memory.md)) | 🟡 |
| Headers HTTP (API) | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `HSTS`, `Cache-Control: no-store` setados manualmente em `api/generate.js` | ✅ |
| Headers HTTP (frontend) | `vercel.json` com CSP, HSTS preload, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | ✅ |
| CSP | `default-src 'self'` + allowlist por tipo; `'unsafe-inline'` em `script-src` por Vite ([`ADR-003`](docs/adr/ADR-003-csp-unsafe-inline.md)) | 🟡 |
| CORS | Allowlist explícita; origem não-permitida → **403** (era silencioso na v1) | ✅ |
| Body limit | 10 KB (anti payload bomb) | ✅ |
| Erros sem vazar internals | Resposta genérica ao cliente; `error.body.detail` da fal.ai **não** propagado; só status interno no log | ✅ |
| ErrorBoundary | Detalhes só em `import.meta.env.DEV`; em produção, mensagem genérica + botão de recarregar | ✅ |
| Dependências | `npm audit` limpo (0 vulnerabilidades após `npm audit fix` em 2026-05-23) | ✅ |
| Segredos | `.env*` em `.gitignore`; FAL_KEY rotacionada após detecção do leak no histórico do git | ✅ |
| Logs sem PII | Só metadados (`style`, `emotion`, `status`) — `title`/`topic` do usuário nunca vão ao log | ✅ |
| Frontend XSS | Sem `dangerouslySetInnerHTML` com input do usuário; JSX escapa por padrão | ✅ |

### O que NÃO está implementado (e por quê)

- **Autenticação** — decisão consciente ([`ADR-001`](docs/adr/ADR-001-sem-autenticacao.md)). O vetor central de DoS econômico depende de monitoramento de billing + rate limit best effort.
- **Cloudflare Turnstile / hCaptcha** — fricção sensorial alta para um app de "abrir, digitar, gerar". Reservado para reabertura se houver drenagem real.
- **Vercel KV / Upstash Redis para rate limit** — trabalho futuro ([`ADR-002`](docs/adr/ADR-002-rate-limit-in-memory.md)).
- **Testes automatizados + CI** — endpoint único, lógica simples; manutenção manual sustentável no escopo de portfólio.

---

## ✨ Principais Funcionalidades

- 🎨 **5 estilos visuais** — MrBeast (saturação extrema), Gaming (cyberpunk neon), Tech (Apple-style minimalista), Reaction (expressão dramática + arrows), Minimalista (geometria flat)
- 😱 **5 modificadores de emoção** — choque, excitação, curiosidade, urgência, neutro
- 🔄 **Duas variações em paralelo** — cada geração devolve 2 thumbnails com seeds e composições diferentes
- 📊 **Score CTR estimado** — heurística simples (placeholder — ver "O que NÃO está implementado" no relatório de auditoria)
- ⚡ **Geração em ~15 segundos** — FLUX Dev com 28 inference steps, paralelizado via `Promise.all`
- 💾 **Download direto** — sem watermark, link da fal.ai com `download` attribute

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19 + Vite 8** — base reativa + dev server com hot reload
- **CSS3 vanilla** — sem Tailwind/Bootstrap, todas as animações em CSS puro
- **Lucide React** — biblioteca de ícones SVG

### Backend (dev + prod)
- **Node 20 + Express 5** (dev local `server.js`)
- **Vercel Serverless Function** (prod `api/generate.js`)
- **`api/_lib/generator.js`** — módulo neutro de domínio compartilhado entre os dois
- **`@fal-ai/client`** — SDK oficial da fal.ai, modelo `fal-ai/flux/dev`

### Deploy
- **Vercel** — frontend estático na CDN + função serverless para `/api/generate`
- **`vercel.json`** — headers de segurança aplicados na borda

---

## 📂 Estrutura

```text
thumbnail-forge-clone/
├── vercel.json                 # Headers de segurança do frontend (CSP, HSTS, etc.)
├── SECURITY.md                 # Política de reporte de vulnerabilidades
├── api/
│   ├── generate.js             # Handler Vercel (prod) — usa generator + headers + rate limit
│   └── _lib/
│       └── generator.js        # 🎯 Fonte única de verdade — sanitização, validação, fal.ai
├── server.js                   # Dev server (localhost:3001) — adapter Express → handler Vercel
├── src/
│   ├── main.jsx                # ErrorBoundary diferenciado por DEV/PROD
│   └── App.jsx                 # UI principal
└── docs/
    ├── AUDIT_REPORT_2026-05-23.md   # Auditoria paranoica (2 passadas integradas)
    ├── THREAT_MODEL.md              # STRIDE + ameaças residuais
    └── adr/
        ├── ADR-001-sem-autenticacao.md
        ├── ADR-002-rate-limit-in-memory.md
        └── ADR-003-csp-unsafe-inline.md
```

---

## 🚀 Como Executar Localmente

### Requisitos
- Node.js 20+
- npm 10+
- Conta na [fal.ai](https://fal.ai/dashboard/keys) com `FAL_KEY` gerada

### Variáveis de ambiente

Crie um `.env` na raiz a partir do `.env.example`:

```dotenv
FAL_KEY=sua_chave_da_fal_ai_aqui
```

⚠️ **Nunca commite o `.env`.** A auditoria 2026-05-23 detectou um vazamento histórico desta chave no git — a chave antiga foi revogada na fal.ai. Use sempre a env var, nunca hardcode.

### Rodando

```bash
git clone https://github.com/silvajeanderson165-creator/thumbnail-forge.git
cd thumbnail-forge
npm install
npm run dev     # frontend Vite em http://localhost:5173
node server.js  # backend Express em http://localhost:3001
```

O Vite faz proxy de `/api/*` para `localhost:3001`, então o frontend consome a API local de forma transparente.

### Build

```bash
npm run build    # produz dist/
npm run lint     # ESLint
npm run preview  # preview da build
```

---

## 👑 Autor

**Jeanderson Silva** 🤓✍️

*Desenvolvedor Full-Stack | Engenheiro Frontend | Integrador de IA*

Do prompt-engineering dos 5 estilos visuais à arquitetura de single-source-of-truth que sobreviveu a uma auditoria paranoica de 2 passadas — incluindo a lição custosa de que **selo de segurança no comentário não é mitigação**: a v1 deste projeto tinha o cabeçalho `// 🛡️ PROTOCOLO DE SEGURANÇA ENTERPRISE` no dev *e* no prod, mas as defesas só rodavam no dev. A auditoria identificou, e a v2 corrigiu — agora ambos os entrypoints derivam do mesmo módulo neutro de domínio.

Sinta-se à vontade para auditar `api/_lib/generator.js`, explorar a estratégia de `extractClientIp` com tratamento de array, ou ler o [relatório completo de auditoria](docs/AUDIT_REPORT_2026-05-23.md) para entender o que foi encontrado, o que foi corrigido e o que ficou como dívida consciente.
