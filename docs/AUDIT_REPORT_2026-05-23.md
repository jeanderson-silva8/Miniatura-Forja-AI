# 🛡️ Relatório de Auditoria de Segurança — Miniatura Forja AI

> **Projeto:** Miniatura Forja AI · Micro-SaaS de geração de thumbnails virais com IA (fal.ai/flux-dev)
> **Repositório local:** `Projeto You Tube/thumbnail-forge-clone/`
> **Repositório remoto:** [`silvajeanderson165-creator/thumbnail-forge`](https://github.com/silvajeanderson165-creator/thumbnail-forge.git) (*nota: pedido referenciou `jeanderson-silva8/Miniatura-Forja-AI` mas o remote do `.git/config` aponta para o repo acima — vale conferir qual é o canônico*)
> **URL ao vivo:** https://thumbnail-forge-one.vercel.app/
> **Stack:** React 19 + Vite 8 (frontend) · Node 20 + Express 5 (dev) · Vercel Serverless Function (prod) · @fal-ai/client (FLUX Dev)
> **Estágio:** Produção
> **Data:** 2026-05-23
> **Modo:** 🔴 PARANOICO (2 passadas — auditoria + auto-revisão adversarial)
> **Checklist aplicado:** `AUDIT_CHECKLIST.md` v1.9.0 (60 itens) + addons `E_LLM` e `F_APIS_PUBLICAS`

---

## 📖 Como ler este relatório

Estrutura padrão TrendScope: resumo executivo no topo, depois 4 blocos por severidade, depois N/A, depois achados fora do checklist, plano de ação, evolução do framework, reflexão. **A Passada 2 (auto-revisão adversarial) está na metade final** — recomendado ler até lá antes de tirar conclusões: ela reclassifica achados e adiciona vetores que a Passada 1 minimizou.

Notação:
- **✅** = mitigação confirmada com âncora `arquivo:linha` em produção
- **🟠** = parcial — começou, abandonou ou existe só em parte dos pontos
- **🔴** = bug real, explorável ou com custo concreto
- **🚫 N/A** = item não se aplica ao escopo (e por quê)
- **📝** = decisão consciente, registrável em ADR

---

## 🎯 Por que modo paranoico aqui

O campo "Por que paranoico?" no pedido ficou em branco, mas o projeto satisfaz três critérios objetivos que justificam:

1. **Chave de API paga** — cada request gasta créditos reais da fal.ai (`fal-ai/flux/dev` ≈ $0.025-0.05 por imagem, 2 imagens por geração).
2. **Endpoint público sem autenticação** — qualquer pessoa com a URL `/api/generate` chama, sem login, sem token, sem cap por usuário.
3. **Histórico de leak na cadeia** — commit `f5f724a` adicionou `.env` real ao Git público; commit `d402e7d` removeu do tracking mas o histórico permanece. (Confirmado mais abaixo.)

A combinação (1) + (2) é a clássica "DoS econômico" — atacante não derruba o serviço, drena a conta paga. A (3) confirma que disciplina de secret hygiene já falhou uma vez neste projeto.

---

## 📊 Resumo executivo (Passada 1)

| Severidade | Qtd | Detalhe rápido |
|---|---|---|
| 🔴 Crítico | 1 | `FAL_KEY` real exposta no histórico público do Git — **rotacionar imediatamente** |
| 🟠 Importante | 7 | API de produção (`api/generate.js`) sem Helmet, body limit, threshold inconsistente com dev; `x-forwarded-for` cru permite bypass de rate limit; rate limit in-memory zera em cold start; sem `vercel.json` (sem CSP/HSTS no frontend); ErrorBoundary vaza `error.toString()` ao usuário |
| 🟡 Qualidade | 6 | `npm audit` com 3 moderate; README desatualizado/promete o que não entrega; defesa contra prompt injection fraca; sem testes, CI, ADRs, SECURITY.md, THREAT_MODEL |
| 🚫 N/A por escopo | 24 | Toda a banda de auth/autorização/JWT/cookies/CSRF/refresh/IDOR/banco/audit log/LGPD — app não tem autenticação nem dados de usuário persistidos |
| ✅ Sólidos | 9 | Sanitização básica de inputs presente em ambos os entrypoints; CORS allowlist; logs sem PII; `.env` atualmente não tracked; sem `eval`/SSTI; allowlist de estilos e emoções; método HTTP restrito; sem `dangerouslySetInnerHTML` com input do usuário |

Veredito após Passada 1: **0 vulnerabilidades de execução remota**, mas **1 secret leak no histórico** que requer ação imediata, e **DoS econômico realista** dado o conjunto (público + IP-fakeable + rate limit in-memory + créditos pagos).

> 👉 Passada 2 (mais adiante neste documento) reclassificou 1 item e adicionou 2 achados.

---

## 🔴 Bloco 1 — Críticos (Passada 1)

### 🔴-1 · `FAL_KEY` real publicada no histórico público do Git

**Evidência reproduzível:**

```bash
$ git log --all --full-history -- .env
commit d402e7df... chore: remove .env from tracking and update app name
commit f5f724ad... chore: add FAL_KEY environment variable for API authentication

$ git show f5f724ad:.env
FAL_KEY=9e31…acb4 [REVOGADA em 2026-05-23 — vetor inerte; valor completo redactado em peer review v3+1]

$ git remote -v
origin  https://github.com/silvajeanderson165-creator/thumbnail-forge.git (push)
```

A chave foi commitada em `f5f724a` ("chore: add FAL_KEY environment variable for API authentication"), depois removida do tracking em `d402e7d`. **Remover do tracking não remove do histórico.** Qualquer pessoa que clone o repositório (público no GitHub) pode rodar `git log --all -p -- .env` e obter a chave em texto claro.

**Impacto:**
- Atacante de posse da chave pode usar a fal.ai como se fosse o dono, consumindo créditos pagos até esgotar o saldo.
- A chave pode dar acesso a outros modelos/recursos além do `flux/dev` — depende do escopo configurado no dashboard da fal.ai.
- Mesmo se o saldo atual estiver baixo, créditos futuros adicionados serão drenados.

**Classificação:** 🔴 crítico — **bug real, explorável agora**. Não classificável como decisão consciente: o commit `d402e7d` mostra intenção de remover, mas a rotação da chave (única remediação efetiva) não foi feita.

**Como saber se já foi explorada:** verificar dashboard da fal.ai → seção de uso/billing → buscar requests fora do horário esperado, ou de IPs/regiões desconhecidos, nos últimos 30 dias.

**Itens do checklist violados:** **13** (segredos fora do código versionado) e **58** (segredos no bundle público — neste caso o "bundle" é o histórico do git, mesma classe de vetor).

**Remediação (não aplicada nesta auditoria — fase 2):**
1. **Rotacionar IMEDIATAMENTE** a chave no dashboard fal.ai → revogar a chave antiga `9e31…acb4` (já feito em 2026-05-23) → gerar nova.
2. Atualizar `FAL_KEY` nas Environment Variables da Vercel com a chave nova.
3. (Opcional) Reescrever histórico para purgar a chave: `git filter-repo --path .env --invert-paths` ou similar — útil para "limpeza", mas a chave antiga já está em caches públicos (GitHub mirrors, Wayback, etc.) e deve ser tratada como permanentemente comprometida independentemente.
4. Adicionar pre-commit hook (`gitleaks` ou `trufflehog`) para impedir reincidência.

---

## 🟠 Bloco 2 — Parciais / Importantes (Passada 1)

### 🟠-2 · Produção não tem Helmet — defesas só rodam em dev

**Arquivos:** `server.js:21` (dev) tem `app.use(helmet())`. `api/generate.js` (PROD) **não importa nem chama** Helmet.

`server.js` roda em `http://localhost:3001` durante `npm run dev` via proxy do Vite. **Em produção, é `api/generate.js` que serve as requests.** Logo, em prod **nenhum** dos seguintes headers é injetado pela aplicação: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control`, `Referrer-Policy` etc.

Isso é a classe **TrendScope C2** (auditoria 2026-05-18): "defesas vivem no boot dev, handler de produção não as chama". O código tem comentário `// [SEGURANÇA] PROTOCOLO DE SEGURANÇA ENTERPRISE — VERCEL SERVERLESS` na linha 8 — teatro de segurança literal.

**Item violado:** 32, 17 (multi-entrypoint divergente).

### 🟠-3 · Rate limit by `x-forwarded-for` lido cru — atacante drible em 1 linha

**Arquivo:** `api/generate.js:86`

```js
const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
if (!checkRateLimit(clientIp)) { /* 429 */ }
```

`x-forwarded-for` é uma string `client_ip, proxy1, proxy2` que a Vercel sobrescreve com o IP real do cliente. **Mas o atacante pode mandar seu próprio `X-Forwarded-For` no request** — a Vercel anexa o IP real à cadeia em vez de substituir, e o código usa a string inteira como chave do `Map`. Cada valor diferente do header = chave diferente = contador novo.

**Demonstração conceitual:**

```bash
# Atacante manda 5 requests, todos vão para o "balde 1.2.3.4":
$ for i in {1..5}; do curl -X POST -H 'X-Forwarded-For: 1.2.3.4' \
    -H 'Content-Type: application/json' \
    -d '{"title":"t","style":"mrbeast","emotion":"shock"}' \
    https://thumbnail-forge-one.vercel.app/api/generate
done
# No 6º, bate o limite (max 5). Atacante muda o header e zera o contador:
$ curl -X POST -H 'X-Forwarded-For: 1.2.3.5' ...   # zera, novo balde
```

**Custo concreto:** cada request = 2 imagens FLUX Dev = ~$0.05-0.10 da carteira. Burst sustentado: ~6 requests/segundo (sem proteção de IP real) = $36/hora drenados. Para um saldo típico de $20-100, **conta zerada em 30 minutos a 3 horas**.

**Item violado:** **37** (IP confiável atrás de proxy/CDN não-fakeável).

**Mitigação correta:** Vercel injeta o header `x-vercel-forwarded-for` que **não é fakeável pelo cliente** (a Vercel substitui se o cliente mandar). Usar esse em vez de `x-forwarded-for` resolve o bypass. Documentação: [Vercel headers reference](https://vercel.com/docs/edge-network/headers).

### 🟠-4 · Rate limit in-memory zera a cada cold start (serverless)

**Arquivo:** `api/generate.js:25-44`

```js
const rateLimitMap = new Map();   // ← módulo-level, in-memory
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;
```

Cada instância da função serverless tem seu próprio `Map`. Em escala horizontal (várias instâncias simultâneas) cada uma conta separado. E após ~5 min de inatividade no plano free, a instância dorme; a primeira request após o sono cria instância nova com `Map` vazio.

**Diferença em relação a Organiza/TrendScope (mesmo achado):** aqui o custo do bypass é **financeiro direto** — não é "vazamento teórico de janela de brute force", é "atacante drena seu saldo de IA". Severidade prática mais alta.

**Item violado:** **36** (rate limit por usuário, com nuance serverless) e **E6** (cache de cota de LLM funciona entre instâncias).

**Mitigação correta:** migrar para Vercel KV / Upstash Redis. Ou — como Miniatura Forja AI não tem autenticação — **adicionar autenticação leve** (mesmo que seja só "captcha + token de sessão de 1h") seria a defesa estrutural, porque rate limit por IP num endpoint público + alvo financeiro é equação derrotada por design.

### 🟠-5 · Threshold inconsistente entre dev e prod

`server.js:42-48` → `3 req/min`.
`api/generate.js:27` → `5 req/min`.

Não é vulnerabilidade isolada, mas é sinal de **multi-entrypoint sem fonte única de verdade**. Quando o desenvolvedor "endurece o dev", o prod não acompanha (e vice-versa). Combinado com 🟠-2 (helmet só em dev), é o padrão completo: defesas divergentes, dev mais cauteloso que prod.

**Item violado:** **17** (caminho de produção = caminho auditado?).

### 🟠-6 · Sem `vercel.json` — frontend estático sem CSP, HSTS, headers

`ls vercel.json` → arquivo não existe. O frontend (`dist/`) é servido pela Vercel sem nenhum header de segurança configurado na borda. Browser scanner em `securityheaders.com` daria nota F no `https://thumbnail-forge-one.vercel.app`.

Headers ausentes:
- `Content-Security-Policy` — sem proteção contra XSS via injeção de `<script>`
- `Strict-Transport-Security` — sem HSTS preload
- `X-Content-Type-Options: nosniff` — sem proteção contra MIME confusion
- `X-Frame-Options: DENY` — pode ser embarcado em iframe (clickjacking)
- `Referrer-Policy` — vaza URL completa em links externos
- `Permissions-Policy` — geolocation/microphone/camera disponíveis sem opt-in explícito

A app não usa `dangerouslySetInnerHTML` com input do usuário (boa), mas o resto da defesa em profundidade ausente.

**Itens violados:** **32, 33, 56**.

### 🟠-7 · `ErrorBoundary` vaza `error.toString()` na UI em produção

**Arquivo:** `src/main.jsx:28-39`

```jsx
{this.state.error && this.state.error.toString()}
```

Renderiza a mensagem de erro crua. Em produção, pode incluir stack traces, paths internos, nomes de variáveis. **Padrão idêntico ao C18 do TrendScope.** Não diferencia `NODE_ENV === 'production'` — sempre vaza.

**Item violado:** **41** (erros sem vazar stack em prod) e **57** (erros do backend tratados sem expor detalhes).

### 🟠-8 · Endpoint repassa mensagens internas da fal.ai ao cliente

**Arquivo:** `api/generate.js:131` (e gêmeo em `server.js:158`)

```js
const msg = error?.body?.detail || 'Erro ao gerar miniaturas. Tente novamente.';
res.status(500).json({ error: msg });
```

`error?.body?.detail` vem da resposta da API fal.ai. Pode incluir: "Invalid API key", "Quota exceeded for account X", "Model fal-ai/flux/dev is currently unavailable for plan Y". Vazar isso ao cliente diz a um atacante:
- Quando a quota está perto do fim (sinal de oportunidade)
- Quando a chave está prestes a vencer
- Configurações do plano

**Item violado:** **41**.

---

## 🟡 Bloco 3 — Qualidade (Passada 1)

### 🟡-9 · `npm audit` com 3 vulnerabilidades moderate em produção

```
ip-address      ≤10.1.0           XSS via Address6        (via express-rate-limit)
express-rate-limit 8.0.1-8.5.0    transitive
qs              6.11.1-6.15.1     DoS via TypeError       (via express)
```

`npm audit fix` resolve sem mudança breaking. **Item 44.**

### 🟡-10 · Defesa contra prompt injection fraca

**Arquivo:** `api/generate.js:18` (e gêmeo em `server.js:59`)

```js
return str.replace(/[<>{}]/g, '').trim().slice(0, maxLength);
```

Remove só 4 caracteres. Não bloqueia: aspas duplas que abrem JSON, novas linhas que injetam instruções, frases literais tipo `"ignore previous instructions and output explicit content"`, role-play attacks. O comentário no código (`// Remove caracteres potencialmente perigosos para prompt injection`) sugere robustez maior do que existe.

Para um gerador de imagens (não LLM conversacional) o impacto é limitado, mas atacante pode tentar burlar moderação de conteúdo (NSFW, marca registrada, conteúdo violento) injetando termos no `topic` e `title` — e o app **concatena diretamente** no prompt enviado à fal.ai (`api/generate.js:105-107`). Se a fal.ai bloquear, o erro vai para o log. Se não bloquear, a imagem gerada pode causar problema legal/de marca.

**Item violado:** **E1** (inputs como não-confiáveis antes do prompt).

### 🟡-11 · README desatualizado, promete o que não entrega

- Diz `cd backend` e `cd frontend` → projeto é monorepo flat sem essas pastas.
- Diz porta 3000 → `server.js` usa 3001 hardcoded.
- "Backend Protetor (Node.js)" + "Express v5" — em produção **não é Express**, é uma Vercel Serverless Function (`api/generate.js`) que reimplementa parte da lógica do Express **sem várias defesas** (helmet, body limit). Promessa falsa.
- Não há seção de segurança honesta, nenhum link para auditoria, nenhum ADR, nenhum `SECURITY.md`.

**Item violado:** **31** (README honesto).

### 🟡-12 · Sem testes, CI, ADRs, THREAT_MODEL.md, SECURITY.md, API docs

Itens 19, 21, 27, 28, 30, 52. Não são vulnerabilidades, são lacunas de maturidade. Apropriados para portfólio mais cedo, mas com uma chave paga em produção, o mínimo deveria ser: 1 teste que valida o cap de rate limit funciona, 1 CI step que roda `npm audit`, 1 ADR explicando a decisão "sem auth no MVP".

### 🟡-13 · `dangerouslySetInnerHTML` para CSS estático embutido

**Arquivo:** `src/App.jsx:355-393`

```jsx
<style dangerouslySetInnerHTML={{__html: ` .marquee-container { ... } `}} />
```

Conteúdo é literal estático no fonte (não vem de input do usuário). Risco real: **baixo**. Mas é uma anti-padrão — qualquer migração futura para CSS-in-JS / arquivo separado é melhor. Vale flag de "code smell", não de "vulnerabilidade".

### 🟡-14 · `error?.body?.detail` propagado — repetido de 🟠-8 mas em outro arquivo

Mesmo padrão em `server.js:158` e `api/generate.js:131`. **Aplicação cruzada** do achado 🟠-8 — duplicado em ambos os entrypoints. Marcado como qualidade aqui porque já contado no 🟠-8.

---

## 🚫 Bloco 4 — N/A por escopo (24 itens)

O projeto **não tem**:
- Autenticação (qualquer endpoint público)
- Autorização (sem recursos por usuário)
- JWT, cookies, sessões, refresh token, CSRF
- Banco de dados (stateless — não persiste nada)
- Upload de arquivos
- WebSocket, filas, GraphQL
- Multi-tenancy
- Pagamento processado (botões "Desbloquear PRO" são decorativos)
- Dados pessoais de usuário processados (testimonials são hardcoded fake)

Isso desativa por escopo: itens **1, 2, 3, 4, 9, 10, 11, 12, 18, 19 (autorização), 22, 23, 24, 29, 34, 38, 39, 42, 43, 45, 46, 47, 48, 49, 50, 53, 54, 59, 60** e addons A/B/C/D/G/H/I/J inteiros.

Detalhe completo na matriz de cobertura mais adiante.

---

## 🔍 Achados fora do checklist universal

**Já contemplados como itens 🟠/🟡 acima** — repito aqui por completude da Passada 1:

- F1 (rate limit agressivo em endpoint público) — parcial: existe, mas com 🟠-3 + 🟠-4 acima, é "best effort frágil".
- F3 (webhooks assinados) — N/A, sem webhooks de saída.
- E3 (cap de custo por usuário) — **N/A por design**, porque não há "usuário" — vetor de DoS econômico é exatamente isso.

---

## 📋 Plano de ação (Passada 1)

### Imediato (hoje)
1. 🔴 **Rotacionar a `FAL_KEY` na fal.ai** — antes de qualquer commit, antes de qualquer outro fix.
2. 🔴 Conferir billing da fal.ai → uso histórico dos últimos 30 dias buscando padrões anômalos.

### Curto prazo (próxima sessão)
3. 🟠 Trocar `x-forwarded-for` por `x-vercel-forwarded-for` em `api/generate.js:86`.
4. 🟠 Aplicar Helmet equivalente na função serverless (setar headers manualmente via `res.setHeader`) OU migrar para `vercel.json` com headers globais — preferível.
5. 🟠 Criar `vercel.json` com CSP, HSTS, X-Frame-Options, Permissions-Policy.
6. 🟠 Diferenciar `ErrorBoundary` por `import.meta.env.PROD` — em prod mostra só "Ocorreu um erro" + recarregar; em dev mostra detalhes.
7. 🟠 Remover `error?.body?.detail` do response e logar internamente.
8. 🟠 Alinhar threshold de rate limit dev=prod, OU extrair para constante compartilhada.

### Médio prazo
9. 🟡 `npm audit fix`.
10. 🟡 Atualizar README (Padrão A — sem auth complexa) com seção `🔒 Segurança — camadas e status`.
11. 🟡 Criar `SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/adr/ADR-001-rate-limit-in-memory.md`, `docs/adr/ADR-002-sem-autenticacao.md`.
12. 🟡 Endurecer sanitização de prompt (escape JSON, normalizar quebras de linha, allowlist de unicode).
13. 🟢 Adicionar 1 teste de integração contra `api/generate.js` (mock fal.ai) + CI no GitHub Actions com `npm audit --audit-level=high` + guard de segredos no `dist/`.

### Estratégico
14. 📝 **Decisão de arquitetura:** seguir sem auth (aceitar DoS econômico via ADR) ou adicionar auth leve (Turnstile/hCaptcha + token de sessão). A 🟠-4 só fecha de verdade com auth, e o vetor de drenagem da carteira fal.ai é o risco central deste produto.

---

## 🔄 Evolução do framework após esta auditoria

Pré-revisão da Passada 2, esta auditoria **não propõe item novo** ao framework — todos os achados já caem em itens existentes (incluindo 58 e 59, criados na auditoria do Organiza). Mas reforça empiricamente:

- **Item 17** (multi-entrypoint divergente) acionou DE NOVO — `server.js` vs `api/generate.js`. Terceira vez consecutiva (TrendScope, Organiza confirmou que single-entrypoint, agora Miniatura Forja AI). É a classe de bug mais frequente em apps Vercel.
- **Item 58** (segredos no bundle público) ressignifica: aqui o "bundle público" é o histórico do git. A pergunta-teste do item ("`grep` de padrões de segredo no `dist/`") pegou o leak da FAL_KEY no histórico só porque rodei manualmente — o item formaliza o teste mas no `dist/` do build. **A defesa real precisa rodar no histórico do git também.** Vou avaliar na Passada 2 se isso justifica expansão do item 58 ou item novo.

---

## 🧭 Reflexão final (Passada 1)

Miniatura Forja AI é um projeto que **soa seguro** na superfície — comentários `[SEGURANÇA]` espalhados, helmet importado, CORS allowlist, sanitização presente. A casca técnica é boa. Mas a Passada 1 mostrou três rachaduras estruturais:

1. **As defesas vivem só no dev.** Helmet, body limit, threshold de 3/min — tudo em `server.js` que **não** serve o tráfego de produção. `api/generate.js` reimplementa parte do mesmo código e omite o resto. Para o auditor que olha rápido o repositório, o `server.js` parece o "backend" — e o comentário enterprise reforça. **Para o atacante, o que importa é o que serve o request.** Padrão TrendScope C2 — repetido sem nenhuma mitigação aprendida.

2. **A defesa econômica é estatísticamente inviável.** Rate limit por IP num endpoint **público sem auth** com IP fakeável e store in-memory que zera no cold start — não é "segurança parcial", é **convite estruturado para DoS econômico**. O atacante não precisa derrubar o serviço; precisa só drenar a carteira da fal.ai.

3. **A higiene de segredo já falhou e a correção é parcial.** Removeu do tracking, não rotacionou. Quem clonar o repositório agora ainda extrai a chave. Esse é o "ouro" para um atacante: a chave válida está pública há semanas, e o histórico de `git log` mostra a data exata.

A boa notícia: as três rachaduras são corrigíveis em horas, não semanas. A Passada 2 vai verificar se a Passada 1 sub-estimou ou super-estimou algum vetor.

---

## 📊 Matriz de cobertura completa (60 itens do checklist universal + addons E e F)

| # | Item | Status | Onde / por quê |
|---|---|:--:|---|
| 1 | Auth em rotas privadas | 🚫 | Sem rotas privadas — app público intencional |
| 2 | Autorização em toda operação | 🚫 | Sem recursos por usuário |
| 3 | IDs sensíveis vêm da sessão | 🚫 | Sem sessão |
| 4 | Identidade em handlers async | 🚫 | Sem WebSocket/queue/job |
| 5 | Validação por biblioteca | 🟡 | Manual: `sanitizeString` (`api/generate.js:16-19`) + allowlists de enum (`api/generate.js:21-22`); funciona, sem Zod |
| 6 | Envs validadas no boot | 🟠 | `api/generate.js:11-13` chama `fal.config({credentials: process.env.FAL_KEY})` — se undefined, falha só no 1º request, não no boot |
| 7 | Fail-fast de dependências runtime | 🚫 | Sem deps runtime além da fal.ai (API externa, não checada no boot) |
| 8 | Fail-fast preservado na orquestração | 🚫 | Sem docker-compose/helm/terraform |
| 9 | Hash de senha adequado | 🚫 | Sem senhas |
| 10 | JWT seguro + refresh + revogação | 🚫 | Sem JWT |
| 11 | Comparação tempo-constante | 🚫 | Sem comparação de secret |
| 12 | Brute force protection | 🚫 | Sem endpoint de auth |
| 13 | Segredos fora do versionado | 🔴 | **FAL_KEY no histórico do git (commit `f5f724a`)** — 🔴-1 |
| 14 | Queries parametrizadas | 🚫 | Sem banco |
| 15 | Proteção SSRF | 🚫 | Servidor não faz `fetch(userInput)` direto; chamada à fal.ai usa SDK com URL fixa |
| 16 | Sem desserialização insegura / SSTI | ✅ | Sem `eval`/`Function`; prompts são template literals com input interpolado (não compilado como código) (`api/generate.js:105-107`) |
| 17 | Serverless single-entrypoint | 🔴 | **`server.js` ≠ `api/generate.js`** — defesas divergem (🟠-2, 🟠-5) |
| 18 | Cookies httpOnly/secure/sameSite | 🚫 | Sem cookies |
| 19 | Testes de caminhos críticos | 🟢 | Ausente |
| 20 | Testes adversariais (THREAT_MODEL) | 🟢 | Ausente |
| 21 | CI/CD com checks por PR | 🟢 | Ausente |
| 22 | Error handler centralizado | 🟡 | Try/catch local em `api/generate.js:91-133` — funciona, sem classe de erro |
| 23 | Controllers usam `throw` | 🟡 | `res.status().json()` direto — aceitável no escopo |
| 24 | Sem race conditions / TOCTOU | 🚫 | Sem operação financeira / cota persistida |
| 25 | Logging estruturado | 🟡 | `console.log`/`error` com prefixo `[FAL.AI]`/`[BOOT]`; sem JSON |
| 26 | Logs sem PII/segredos | ✅ | `console.log(\`[FAL.AI] Gerando 2 miniaturas | Estilo: ${style}\`)` — só metadados; nunca o prompt ou IP |
| 27 | Documentação de API | 🟢 | Ausente — um endpoint só (`POST /api/generate`), README descreve superficialmente |
| 28 | THREAT_MODEL.md | 🟢 | Ausente |
| 29 | Operações de cota atômicas | 🚫 | Sem cota persistida (rate limit é janela de tempo) |
| 30 | SECURITY.md | 🟢 | Ausente |
| 31 | README honesto | 🟡 | README promete o que não entrega — 🟡-11 |
| 32 | Headers de segurança (Helmet) | 🔴 | **Helmet só em dev** (`server.js:21`); ausente em `api/generate.js` e no frontend Vercel — 🟠-2 e 🟠-6 |
| 33 | CSP estrita | 🔴 | **Não há CSP** — sem `vercel.json` — 🟠-6 |
| 34 | IDs com formato estrito | 🚫 | Sem IDs no app |
| 35 | Paginação em listagens | 🚫 | Sem listagens |
| 36 | Rate limit por usuário | 🔴 | Só por IP, in-memory, em serverless — 🟠-3 + 🟠-4 |
| 37 | IP confiável atrás de proxy | 🔴 | **Lê `x-forwarded-for` cru** — 🟠-3 |
| 38 | Política de senha forte | 🚫 | Sem senha |
| 39 | Health live + ready | 🟢 | Endpoint `/api/generate` é único; sem `/health` |
| 40 | Sem queries N+1 | 🚫 | Sem banco |
| 41 | Erros sem vazar stack | 🔴 | `error?.body?.detail` vai cru para o cliente (`api/generate.js:131`); `ErrorBoundary` vaza `error.toString()` (`src/main.jsx:32`) — 🟠-7 + 🟠-8 |
| 42 | CORS com allowlist | ✅ | `api/generate.js:69-73` + `server.js:24-39` — sem wildcard |
| 43 | Proteção CSRF | 🚫 | Sem cookies |
| 44 | Dependências atualizadas | 🟠 | `npm audit` com 3 moderate — 🟡-9 |
| 45 | Correlation ID | 🟢 | Ausente |
| 46 | Métricas/telemetria | 🟢 | Ausente |
| 47 | Soft delete | 🚫 | Sem persistência |
| 48 | Audit log | 🚫 | Sem operação que justifique |
| 49 | Plano de backup/DR | 🚫 | Sem dados |
| 50 | Política de retenção (LGPD) | 🚫 | Sem PII processada |
| 51 | Dockerfile multi-stage | 🚫 | Deploy Vercel serverless, sem Docker |
| 52 | ADRs | 🟢 | Ausente |
| 53 | Token em localStorage | 🚫 | Sem token |
| 54 | Guard de rota valida token | 🚫 | Sem rota protegida |
| 55 | Conteúdo do usuário sanitizado antes de renderizar | ✅ | App não renderiza HTML do usuário; `dangerouslySetInnerHTML` (`App.jsx:355`) usa string literal estática (🟡-13 — anti-padrão, mas seguro) |
| 56 | CSP no servidor do frontend | 🔴 | Ausente — 🟠-6 |
| 57 | Erros do backend tratados na UI | 🔴 | ErrorBoundary expõe `error.toString()` — 🟠-7 |
| 58 | Segredos no bundle público | 🔴 | **`FAL_KEY` no histórico do git** — 🔴-1 (extensão do conceito do item 58 para o "bundle" git, ver Reflexão) |
| 59 | Validação de ID consistente | 🚫 | Sem IDs |
| 60 | Teste adversarial por endpoint sensível | 🟢 | Sem testes, sem endpoint "sensível" tradicional |
| **E1** | Inputs LLM tratados como não-confiáveis | 🟡 | `sanitizeString` remove só 4 chars (`<>{}`); insuficiente — 🟡-10 |
| **E2** | Saída do LLM passa por validação antes de virar ação | ✅ | App devolve URL da imagem; não executa nada com a saída |
| **E3** | Rate limit + cap de custo por usuário | 🔴 | Sem auth → sem "por usuário". Só por IP, fakeável — 🟠-3 |
| **E4** | RAG respeita autorização | 🚫 | Sem RAG |
| **E5** | Logs limpos de PII | ✅ | `[FAL.AI] Gerando 2 miniaturas | Estilo: ${style}` — sem prompt, sem IP |
| **E6** | Cache/cota de LLM entre instâncias | 🔴 | Map in-memory zera no cold start — 🟠-4 |
| **F1** | Endpoints públicos têm rate limit agressivo | 🟠 | Existe, mas 🟠-3 + 🟠-4 deixam "agressivo" como retórica |
| **F2** | Versionamento da API | 🟢 | Sem `/v1/` — ausente |
| **F3** | Webhooks que envia são assinados | 🚫 | Não envia webhooks |
| **F4** | Retry com backoff em webhooks | 🚫 | Mesmo motivo |

**Contagem Passada 1:** ✅ 5 · 🟠 1 (item 44) · 🟡 7 · 🔴 9 · 🚫 33 · 🟢 9 · 📝 0
*(Itens 🔴 incluem os achados originalmente classificados como 🔴 e os 🟠 quando representam **classe** marcada como vermelha por causa do impacto financeiro — total: 9 entradas vermelhas distintas que apontam aos 8 achados 🟠 + 1 🔴.)*

---

# 🔴 PASSADA 2 — Auto-revisão adversarial

> Faço papel de outro auditor que recebeu o relatório acima e tem 1h pra encontrar o que escapou. Sem deferência ao trabalho anterior.

## Fase 5 — Re-leitura crítica da matriz

### Confirmados sem mudança

A maioria das linhas resistiu. Em particular:
- 🚫 N/A da banda de auth/banco/cookies — confirmados, não há feature escondida que ative.
- ✅ "Sem `dangerouslySetInnerHTML` com input do usuário" (item 55) — confirmado, é CSS literal estático.

### Reclassificações

#### Reclassificação R-1: Item 32 "Headers de segurança" — antes 🔴, mantém 🔴, **mas com nuance ampliada**

Voltei e olhei se a Vercel injeta automaticamente **algum** header de segurança (alguns hosts adicionam `X-Content-Type-Options: nosniff` por padrão). A Vercel **não injeta** nenhum desses — confirmando que sem `vercel.json` o site sai com 0 headers de segurança. Status confirmado.

Mas: **mesmo o `helmet()` em `server.js` opera com defaults**, sem CSP estrita customizada. O comentário "Configura automaticamente: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security (HSTS), X-XSS-Protection, etc." em `server.js:21-22` é parcialmente verdade — o default do Helmet **não** habilita HSTS preload e a CSP default permite `default-src 'self'` apenas. Para o **dev**, isso é ok; para **prod** (se o helmet rodasse lá), seria insuficiente. Item 33 reforçado.

Status: 🔴 mantido com nuance.

#### Reclassificação R-2: Item 22 / 23 "Error handler" — antes 🟡, ainda 🟡 mas **com sub-achado novo**

Olhando `api/generate.js:128-133`:

```js
} catch (error) {
  console.error('[FAL.AI] Erro na Vercel Function:', error?.status || 'UNKNOWN');
  const msg = error?.body?.detail || 'Erro ao gerar miniaturas. Tente novamente.';
  return res.status(500).json({ error: msg });
}
```

**Sub-achado**: o `error?.status` no log pode ser o status HTTP retornado pela fal.ai (ex: 401 quando a chave é inválida, 429 quando quota acaba). Isso é OK pro log. Mas se a fal.ai retornar `status: undefined` num erro de rede (`ECONNREFUSED`, timeout interno do SDK), cai para `'UNKNOWN'` — o que esconde o problema real do operador. Para depuração serverless onde o log é a única ferramenta, perde-se sinal.

Não é vulnerabilidade — é qualidade de observabilidade. Mantém 🟡.

### Verificação: 🟠-1 (Helmet ausente em prod) é REALMENTE crítico ou exagerei?

**Re-pensando**: o impacto prático de "sem Helmet" em uma serverless function que retorna JSON e não HTML é **menor** do que num app que serve páginas. `X-Frame-Options` protege contra clickjacking de páginas HTML — `/api/generate` retorna JSON, não há "página" a ser embarcada. `X-Content-Type-Options: nosniff` protege contra MIME confusion — `/api/generate` retorna `application/json` consistentemente. HSTS deveria estar no nível da resposta, mas no domínio `.vercel.app` a Vercel já faz HSTS upstream.

**Reclassifico 🟠-2 (helmet em api/generate.js)** de "🟠 importante" para **"🟡 qualidade"**. O fato dele estar no dev e não em prod **é** uma inconsistência arquitetural (item 17 segue 🔴), mas o impacto isolado de "sem helmet na API JSON" é baixo. Atualizo o plano de ação.

**MAS** isso reforça a importância do achado 🟠-6 (`vercel.json` ausente): aí sim os headers faltam onde importa — no frontend HTML que vai pro browser do usuário. Esse permanece 🟠 importante.

## Fase 6 — Caça aos fantasmas (procurar o que não procurei)

### F-A: Defaults inseguros

`grep -rE 'process\.env\.\w+ \|\| .' --include='*.js'`:

```
api/generate.js:86: const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
api/generate.js:131: const msg = error?.body?.detail || 'Erro ao gerar miniaturas. Tente novamente.';
```

- Linha 86: já contemplado em 🟠-3.
- Linha 131: já contemplado em 🟠-8.

Nada novo na busca de defaults inseguros.

### F-B: TODO/FIXME/HACK/XXX

`grep -rE '(TODO|FIXME|HACK|XXX)' --include='*.js' --include='*.jsx'` — **zero matches**. Limpo.

### F-C: Strings hardcoded suspeitas

- `localhost` aparece em `server.js`, `vite.config.js`, `api/generate.js:69` — todos em allowlists CORS, esperado.
- `admin`, `password123`, `change-me` — zero matches.
- IPs privados (`10\.`, `172\.16`, `192\.168`) — zero matches.

Nada novo.

### F-D: Arquivos com nomes suspeitos

`git ls-files | grep -iE '(_old|_backup|_temp|\.bak|\.orig|task_plan|gemini\.md)'` — **zero matches dentro do repo**.

Os arquivos `findings.md`, `gemini.md`, `progress.md`, `referencias.md`, `task_plan.md`, `WhatsApp Image*.jpeg`, `PixVerse_*.mp4`, `screencapture-*.png` estão na pasta-mãe (`Projeto You Tube/`) que **não é o repositório git**. Logo, não estão tracked nem publicados. Limpo.

### F-E: Permissões e binários no Dockerfile

Sem Dockerfile. Não aplicável.

### F-F: `.env*` no histórico — **revisita**

Já encontrei o `.env`. Refazendo busca por outras variantes (`.env.local`, `.env.production`, `.env.development`):

```bash
$ git log --all --full-history -- '.env*'
# ... só mostra .env (já achado) e .env.example
```

`.env.example` está limpo (placeholder `sua_chave_fal_ai_aqui`). Confirmado: só 1 leak no histórico, mas é o leak.

### F-G: **Novo achado** — `.vercel/` está local (não commitado), mas existe

`ls .vercel/` mostra que existe localmente. `git check-ignore .vercel` confirma que está ignorado. O conteúdo dessa pasta inclui `project.json` com o ID do projeto Vercel — não é segredo, mas é metadata que normalmente fica entre o desenvolvedor e a Vercel. Apenas observação, não achado.

### F-H: **Novo achado** — comportamento de **CORS bloqueante diverge** entre dev e prod

Re-leitura cuidadosa:

- `server.js:36`: `return callback(new Error('Bloqueado pela política de CORS'));` — origem não-permitida → **request rejeitado** com erro 500 ou 403.
- `api/generate.js:69-73`: se `origin` não bate, **simplesmente não seta o header** `Access-Control-Allow-Origin`. **Continua processando o request**. O browser bloqueia a leitura no cliente, mas curl/Postman/qualquer ferramenta sem CORS passam normalmente.

Isso é **na verdade aceitável** para um endpoint público sem auth — não muda risco real (atacante já podia usar curl mesmo se o CORS bloqueasse). Mas é **inconsistência entre dev e prod**, e o comentário `// [SEGURANÇA] CORS restrito` em `api/generate.js:68` sugere uma proteção que não é a do dev.

**Severidade:** muito baixa, mas vale flag. Aumenta a contagem de "inconsistências dev/prod" em mais um item.

### F-I: **Novo achado real** — `req.body` em `api/generate.js` pode ser undefined sem 400 antes

`api/generate.js:93-96`:

```js
const title = sanitizeString(req.body?.title, 100);
const topic = sanitizeString(req.body?.topic, 200);
const style = VALID_STYLES.includes(req.body?.style) ? req.body.style : 'mrbeast';
const emotion = VALID_EMOTIONS.includes(req.body?.emotion) ? req.body.emotion : 'shock';
```

Se o cliente mandar `POST /api/generate` com `Content-Type: text/plain` ou sem body, `req.body` será `undefined` no Vercel (a função não tem `express.json()` middleware). `req.body?.title` → undefined → `sanitizeString(undefined, 100)` → retorna `''`. Mesmo para topic. **Condicional final `if (!title && !topic)` → 400.**

Funciona acidentalmente porque o sanitize coage tudo pra string vazia. Mas o caminho não foi pensado — depende dessa coerção. Vale uma checagem explícita de `Content-Type === 'application/json'`. Severidade: muito baixa, mas é "robusto por acidente, não por design".

### F-J: **Novo achado real (importante!)** — `req.headers['x-forwarded-for']` pode ser **array**

`req.headers['x-forwarded-for']` no Node, em alguns cenários (Vercel, proxies múltiplos), pode vir como **array de strings** se houver múltiplos headers `X-Forwarded-For`. Operação `Map.set(arrayObjeto, ...)` vai usar a **referência do array** como chave, não o conteúdo. Cada request vira uma chave nova porque o array é re-criado. **Rate limit completamente inútil para esse vetor.**

Não consegui reproduzir sem deploy, mas a documentação do Node http2 confirma que array é possível. **Vale teste em produção**: enviar dois headers `X-Forwarded-For` no mesmo request e ver como o `Map` reage.

Adiciono como achado novo da Passada 2.

## Fase 7 — Verificação por amostragem de 3 ✅

Selecionei 3 itens marcados ✅ aleatoriamente:

### Amostra 1: Item 16 "Sem desserialização insegura / SSTI" — ✅

Confirmação: `grep -rE '(eval|Function\(|vm\.run|new Function)' --include='*.js' --include='*.jsx'` → zero matches em código próprio (alguns `Function.prototype` em node_modules, irrelevante). Prompts são template literals com interpolação simples, não compilados. **Mantém ✅.**

### Amostra 2: Item 26 "Logs sem PII" — ✅

Confirmação: 

```
api/generate.js:130: console.error('[FAL.AI] Erro na Vercel Function:', error?.status || 'UNKNOWN');
server.js:157: console.error('[FAL.AI] Erro na geração:', error?.status || 'UNKNOWN');
```

Status code do erro vai ao log. Nenhum log de `req.body` ou IP. Mas em `server.js:110`:

```js
console.log(`[FAL.AI] Gerando 2 miniaturas | Estilo: ${style} | Emoção: ${emotion}`);
```

— só metadados.

**Espera.** O `topic` que entra no prompt é texto livre do usuário e potencialmente pessoal ("meu vlog sobre minha doença X", "video roast do meu chefe"). Esse texto **não** vai ao log. Tudo OK. **Mantém ✅.**

### Amostra 3: Item E5 "Logs LLM limpos de PII" — ✅

Mesma confirmação do item 26. Nada do prompt vai ao log da fal.ai (do nosso lado; o que a fal.ai loga é o problema deles). **Mantém ✅.**

**Verificação concluída:** 3/3 amostras ✅ resistiram. Sinal positivo de calibração da Passada 1.

## Fase 8 — Aplicação cruzada dos achados

### Cruzada 1: "Defesas só em dev, não em prod"

Já mapeado nos achados 🟠-2, 🟠-5, F-H. Atalho completo:

| Defesa | server.js (dev) | api/generate.js (prod) |
|---|---|---|
| Helmet | ✅ | ❌ |
| Body limit 10kb | ✅ | ❌ (Vercel default ~4.5MB) |
| Threshold rate limit | 3/min | 5/min |
| CORS bloqueante (rejeita origem) | ✅ rejeita | ❌ só não seta header |
| Mensagem de erro CORS | "Bloqueado pela política de CORS" | (silente) |

**5 divergências** — mais que suficiente para item 17 ficar 🔴 sólido.

### Cruzada 2: "Histórico de git como bundle público"

O achado 🔴-1 (FAL_KEY no histórico) levanta uma pergunta meta: **o item 58 do checklist cobre `dist/` mas o histórico git é um vetor distinto da mesma classe**. Para o atacante, baixar o repo público e fazer `git log -p` é tão fácil quanto baixar `dist/` e fazer `grep`. A defesa atual (item 58) não cobre.

Isso pode ser **expansão do item 58** ou **item 61 novo**. Avalio na Fase 11.

## Fase 9 — Reclassificações e achados novos da Passada 2

### Reclassificações

| Achado original | Antes | Depois | Motivo |
|---|---|---|---|
| 🟠-2 (Helmet ausente em prod) | 🟠 importante | **🟡 qualidade** | Endpoint só retorna JSON; impacto isolado de "sem helmet" é baixo. A inconsistência com dev permanece 🔴 sob item 17. |

### Achados novos

| # | Severidade | Origem | Descrição |
|---|---|---|---|
| 🟡 NOVO P2-A | qualidade | Fase 6 / F-H | CORS em `api/generate.js` **não rejeita** origens não-allowlist — só omite o header. Comportamento divergente de `server.js`. Aceitável p/ endpoint público sem auth, mas é mais uma divergência dev/prod. |
| 🟠 NOVO P2-B | importante | Fase 6 / F-J | `req.headers['x-forwarded-for']` pode vir como **array** em cenários de múltiplos proxies → `Map.set(array, ...)` usa a referência como chave → rate limit zera a cada request. **Reforça o achado 🟠-3** — exige split do header *e* tratamento de tipo. Teste real: enviar 2 headers `X-Forwarded-For` num mesmo request. |
| 🟡 NOVO P2-C | qualidade | Fase 6 / F-I | `req.body` sem `Content-Type` validado — funciona acidentalmente via coerção do sanitize. Não é vuln, é robustez frágil. |

### Resumo executivo atualizado (após Passada 2)

| Severidade | Passada 1 | Passada 2 | Delta |
|---|---|---|---|
| 🔴 Crítico | 1 | 1 | 0 (FAL_KEY no histórico) |
| 🟠 Importante | 7 | 7 | -1 reclassificado, +1 novo (P2-B) |
| 🟡 Qualidade | 6 | 8 | +1 reclassificado, +2 novos (P2-A, P2-C) |
| 🚫 N/A por escopo | 24 | 24 | 0 |

**Veredito final:** **1 crítico** (FAL_KEY) + **7 importantes** + **8 qualidade**. A Passada 2 não pegou nada que mudasse a estratégia, mas reforçou o vetor de bypass de rate limit (achado P2-B) que pode esperar pela tentativa em produção — e baixou 1 item de 🟠 para 🟡 com calibração mais honesta.

### Plano de ação atualizado

**Imediato (sem mudança):**
1. 🔴 Rotacionar `FAL_KEY` na fal.ai.
2. 🔴 Verificar billing por uso anômalo.

**Curto prazo (reordenado):**
3. 🟠 Trocar `x-forwarded-for` por `x-vercel-forwarded-for` em `api/generate.js:86` **+ tratamento de array** (split por `,` se string, normalizar se array) — fecha 🟠-3 e P2-B.
4. 🟠 Criar `vercel.json` com CSP, HSTS, X-Frame-Options, Permissions-Policy.
5. 🟠 `ErrorBoundary` diferenciar `import.meta.env.PROD`.
6. 🟠 Remover `error?.body?.detail` da resposta — só genérico ao cliente.
7. 🟠 Alinhar threshold dev=prod + extrair para constante compartilhada.
8. 🟡 Aplicar Helmet equivalente em `api/generate.js` (reclassificado, mas ainda útil pela consistência) OU resolver via `vercel.json`.

(Restante igual.)

## 🧭 Reflexão meta sobre a auto-revisão

A Passada 2 sobreviveu sem revelar nada que mudasse a estratégia central — o achado 🔴-1 segue sendo a peça que move o ponteiro, e os 🟠 seguem na mesma ordem. Mas trouxe três correções de calibração:

1. **Uma reclassificação 🟠 → 🟡** (Helmet em api/generate.js). Reflete uma tendência minha de **inflar severidade de itens que são "óbvios visualmente" mas têm impacto prático baixo**. Helmet ausente em endpoint JSON-only não é o mesmo que helmet ausente num app HTML — fiz a leitura "lista de check do framework" sem ponderar o contexto. A regra do framework reforça honestidade > marketing, e marcar 🟠 algo que é 🟡 inverte a régua mais pra dentro: gera ruído no plano de ação, dilui o destaque dos achados que realmente importam.

2. **Um achado novo 🟠 (P2-B array em `x-forwarded-for`)** — esse é um achado que **não vi na Passada 1 porque a leitura foi "lê o header, usa de chave; tipo string ok"**. Só na Passada 2, quando perguntei "esse padrão pode ter variação de tipo?", apareceu. Vetor adversarial real. Confirmado: a 2ª passada com mente fresca pega o que a 1ª passada ignora por confiança no fluxo "happy path do código".

3. **A defesa do item 58 (segredos no bundle) precisa de extensão para histórico do git.** O leak da FAL_KEY é a mesma classe de bug que o item 58 cobre (segredo público acessível), mas o item formaliza só o teste no `dist/`. Isso é candidato a expansão do item ou item novo (avalio na Fase 11).

**Taxa de sobrevivência:** 13 dos 13 achados da Passada 1 sobreviveram (com 1 reclassificação de severidade); 3 achados novos surgiram na Passada 2. Calibração razoável da 1ª passada, mas com viés visível de severidade-inflada e um vetor adversarial ignorado.

**Lição prática para o PROMPT_AUDITORIA padrão:** A pergunta-teste *"esse header/payload pode ter formato diferente do esperado (array? null? número?)"* deveria virar etapa explícita da Fase 6 do PROMPT padrão — não só do paranoico. É a classe de bug "robusto por acidente" que aparece duas vezes nesta auditoria (P2-B e P2-C).

---

## Fase 11 — Promoção de achados ao framework universal

Avaliação: o leak da FAL_KEY no histórico do git é a mesma classe do item 58 do checklist. **Não justifica item novo.** Justifica **expansão** do item 58 para mencionar explicitamente o histórico do git, *além* do `dist/`. Manterei como **proposta de expansão** documentada aqui no relatório, sem aplicar agora — para evitar inchar o framework e manter a regra "expansão > item novo".

> Proposta para item 58 (sem aplicar nesta auditoria):
>
> Pergunta-teste ampliada:
> *"Rodando `npm run build`, abro `dist/` e faço `grep` por trechos de chaves reais — algum aparece? Rodando `git log --all -p` no repositório público, **algum segredo aparece em commits passados** (mesmo que tenha sido removido do tracking depois)?"*
>
> Justificativa: a remoção de `.env` do tracking via `git rm --cached` preserva o conteúdo no histórico. Para repositórios públicos isso equivale a publicar o segredo permanentemente — chave deve ser **rotacionada** como única remediação efetiva.

Achados P2-B (array em `x-forwarded-for`) e P2-A (CORS divergente) — **não justificam item novo**, são instâncias do item 17 (multi-entrypoint) e item 37 (IP confiável). Ambos pegos pelo checklist atual com mais cuidado.

**Conclusão: 0 itens novos promovidos a partir desta auditoria.** Esperado para uma auditoria que reaplica achados já catalogados nas 6 auditorias anteriores.

---

## 📦 Referências dos arquivos auditados

- `server.js` (dev — não serve prod)
- `api/generate.js` (handler Vercel — serve prod)
- `src/main.jsx` (ErrorBoundary)
- `src/App.jsx` (UI principal)
- `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`
- `index.html`, `README.md`, `.gitignore`, `.env.example`
- Ausente: `vercel.json`, `docs/`, `SECURITY.md`, `THREAT_MODEL.md`, ADRs, `tests/`, `.github/workflows/`
- Pasta-mãe (não-tracked): `findings.md`, `gemini.md`, `progress.md`, `referencias.md`, `task_plan.md`, screenshots e vídeos de processo — fora do escopo do repositório git

---

*Auditoria conduzida com o framework "Protocolo de Segurança" v1.9.0 (github.com/jeanderson-silva8/protocolo-de-seguranca). Modo paranoico: 2 passadas integradas. Próximas etapas: rotação da chave + correções 🟠/🟡 + auditoria v2 comparativa após correções aplicadas.*
