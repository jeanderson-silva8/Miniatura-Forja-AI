# 🎯 THREAT_MODEL — Miniatura Forja AI

**Última revisão:** 2026-05-23 · alinhada com [`AUDIT_REPORT_2026-05-23.md`](AUDIT_REPORT_2026-05-23.md).

---

## Ativos protegidos

| Ativo | Por quê |
|---|---|
| **Saldo / créditos da fal.ai** | É o único ativo financeiro do produto — cada request gasta dinheiro real |
| `FAL_KEY` em produção (env var na Vercel) | Compromisso = uso ilimitado da conta paga |
| Disponibilidade do serviço | Imagem do portfólio do autor |
| Reputação técnica do autor | README + comentários `[SEGURANÇA]` no código sugerem competência; vazamento da FAL_KEY teve custo reputacional |

**Não há:**
- Dados pessoais de usuários (não há registro/login)
- Banco de dados (app stateless)
- Token de sessão / credenciais por usuário

---

## Atores de ameaça

| Ator | Capacidades | Motivação |
|---|---|---|
| **Atacante econômico** | Conhece a URL pública + pode rotacionar IPs (Tor, proxies pagos) | Drenar saldo da fal.ai para sabotagem ou diversão |
| Visitante anônimo | Acesso público à URL | Curiosidade |
| Scanner automatizado | Ferramentas públicas (nuclei, dirb) | Encontrar low-hanging fruit |
| **Quem clonou o repositório antes da rotação da FAL_KEY** | Posse da chave antiga | Usar a chave em produção concorrente até ser revogada |

Atores estatais e supply chain comprometendo `npm` direto estão **fora do modelo** — Organiza não tem valor que atraia esse nível.

---

## Superfícies de ataque

1. **`POST /api/generate`** — endpoint público, sem auth, dispara chamadas pagas à fal.ai
2. **Frontend estático** (`thumbnail-forge-one.vercel.app`) — HTML/JS público, sem `<script>` inline além do bootstrap do Vite
3. **Environment vars na Vercel** — superfície administrativa (não acessível por atacante externo)
4. **Repositório git público** — código-fonte + histórico

---

## STRIDE aplicado

### S — Spoofing (passar-se por outro)

| Ameaça | Mitigação | Status |
|---|---|:--:|
| Atacante forja `X-Forwarded-For` para multiplicar slots de rate limit | `extractClientIp` usa `x-vercel-forwarded-for` (Vercel sobrescreve, não-fakeável) + trata array | ✅ |
| Atacante envia múltiplos headers `X-Forwarded-For` para virar array → bypass | `extractClientIp` normaliza array via `Array.isArray()` antes do split | ✅ |

### T — Tampering (alterar dados)

| Ameaça | Mitigação | Status |
|---|---|:--:|
| Atacante injeta texto malicioso no prompt (jailbreak/role-play) | `sanitizeString` remove control chars, escapa aspas, colapsa whitespace, limita tamanho. Defesa adicional fica no provedor (fal.ai) — não é responsabilidade da app | ✅ (best effort) |
| Atacante envia `Content-Type` não-JSON com body forjado | `req.body` defensivamente sanitizado em `validatePayload`; coerção de tipo neutraliza payloads não-string | ✅ |
| Mass-assignment (campo extra no body) | `validatePayload` só lê 4 campos da allowlist; ignora extras | ✅ |

### R — Repudiation (negar ação)

| Ameaça | Mitigação | Status |
|---|---|:--:|
| Usuário/atacante nega ter gerado uma imagem específica | Audit log de ações | 🚫 N/A — sem usuários autenticados, nada para repudiar |

### I — Information Disclosure (vazamento)

| Ameaça | Mitigação | Status |
|---|---|:--:|
| Stack trace ao cliente em produção | `ErrorBoundary` diferenciado por `import.meta.env.DEV` (`src/main.jsx:22-46`); API responde só mensagem genérica em 500 (`api/generate.js:79`) | ✅ |
| Mensagens internas da fal.ai vazadas (`error.body.detail`) | Removido — só status interno vai ao log, cliente recebe mensagem genérica | ✅ |
| FAL_KEY no histórico do git | **Mitigação real:** rotacionar a chave no dashboard fal.ai (ação manual do autor). Limpeza de histórico via `git filter-repo` é cosmética — a chave antiga deve ser tratada como permanentemente comprometida | ✅ (após rotação) |
| Prompt do usuário vazado em log | Log só registra metadados (`style`, `emotion`), nunca o `topic` ou `title` | ✅ |
| Source maps de produção | Vite com `sourcemap: false` (default) | ✅ |
| Segredos no bundle frontend | App não usa `VITE_*` para nenhum valor sensível; apenas paths e a URL `/api/generate` (mesma origem) | ✅ |

### D — Denial of Service

| Ameaça | Mitigação | Status |
|---|---|:--:|
| **Drenagem econômica da fal.ai** | Rate limit 5/min por IP (best effort — [ADR-002](adr/ADR-002-rate-limit-in-memory.md)) + monitoramento manual de billing ([ADR-001](adr/ADR-001-sem-autenticacao.md)) | 🟡 best effort |
| Payload bomb (body grande) | `express.json({ limit: BODY_LIMIT_BYTES })` no dev; Vercel default ~4.5MB em prod (Vercel rejeita acima) | ✅ |
| Burst pós-cold-start | Aceito em ADR-002 — migração para Vercel KV é trabalho futuro | 🟡 documentado |
| DDoS volumétrico | Proteção de borda da Vercel — fora do app | ✅ (por infra) |

### E — Elevation of Privilege

| Ameaça | Mitigação | Status |
|---|---|:--:|
| Bypass de autenticação | 🚫 N/A — não há autenticação, todo endpoint é público intencionalmente |
| Acessar endpoint admin escondido | 🚫 N/A — só existe `/api/generate` |
| Injeção que execute código no servidor | Sem `eval`/`Function`/`vm.run`; prompts são template literals (não compilados como código) | ✅ |

---

## Ameaças residuais aceitas

1. **Drenagem econômica via rotação de IPs reais.** Sem auth + rate limit por IP é estruturalmente vulnerável a atacante com proxies. Aceito em [ADR-001](adr/ADR-001-sem-autenticacao.md); mitigação: monitoramento de billing.
2. **Rate limit zera em cold start.** Aceito em [ADR-002](adr/ADR-002-rate-limit-in-memory.md); mitigação real seria Vercel KV.
3. **CSP com `'unsafe-inline'` em `script-src`.** Aceito em [ADR-003](adr/ADR-003-csp-unsafe-inline.md); compensado por ausência de input de usuário renderizado como HTML.
4. **Sem testes automatizados, sem CI.** Trade-off de escopo de portfólio — endpoint único, lógica simples, manutenção manual.

---

## Próximas revisões

Atualizar este documento quando:
- Houver evento de drenagem real observado no billing → reabrir ADR-001/ADR-002
- Adicionar feature que renderize HTML de terceiros → reabrir ADR-003
- Adicionar autenticação → revisar toda a banda STRIDE
