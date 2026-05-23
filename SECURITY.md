# 🛡️ Política de Segurança — Miniatura Forja AI

## Versão suportada

A versão suportada é a publicada em [`thumbnail-forge-one.vercel.app`](https://thumbnail-forge-one.vercel.app/) (branch `main`).

## Como reportar uma vulnerabilidade

**Não abra issue pública** para vulnerabilidades.

- **E-mail:** [silvajeanderson165@gmail.com](mailto:silvajeanderson165@gmail.com) com assunto `[SECURITY] Miniatura Forja AI:`
- **GitHub Security Advisories:** aba Security do repositório

Inclua: descrição, impacto estimado, passos para reproduzir (PoC se possível), versão/commit observado, sugestão de mitigação (opcional).

## SLA informal

- Resposta inicial: até 5 dias úteis
- Avaliação e plano: até 14 dias
- Correção em produção: crítico = prioridade; médio = próximo ciclo

## Escopo

**Dentro:** `/api/generate`, frontend em `thumbnail-forge-one.vercel.app`, repositório do projeto.

**Fora:** infraestrutura da Vercel / fal.ai (reporte direto aos vendors); ausência de autenticação ([decisão consciente em ADR-001](docs/adr/ADR-001-sem-autenticacao.md)); rate limit best effort em serverless ([ADR-002](docs/adr/ADR-002-rate-limit-in-memory.md)); CSP com `'unsafe-inline'` em `script-src` por limitação do Vite ([ADR-003](docs/adr/ADR-003-csp-unsafe-inline.md)).

## Práticas implementadas (resumo)

Detalhamento + evidência no [relatório de auditoria](docs/AUDIT_REPORT_2026-05-23.md):

| Camada | Implementação |
|---|---|
| Single source of truth | `api/_lib/generator.js` com validação, sanitização e chamada à fal.ai compartilhados entre dev (`server.js`) e prod (`api/generate.js`) |
| IP confiável | `extractClientIp` usa `x-vercel-forwarded-for` (não-fakeável pelo cliente) + trata array de proxies |
| Sanitização de prompt | Remove control chars, escapa aspas, colapsa whitespace, limita tamanho (`api/_lib/generator.js:sanitizeString`) |
| Validação | Allowlist explícita de `style` e `emotion`; obrigatoriedade de `title` OU `topic` |
| Headers HTTP (API) | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`, `Cache-Control: no-store` setados manualmente em `api/generate.js` |
| Headers HTTP (frontend) | `vercel.json` com CSP, HSTS preload, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` |
| CORS | Allowlist explícita; bloqueia origin não-permitido com 403 (era silencioso antes) |
| Rate limit | 5 req/min por IP (best effort em serverless — ver ADR-002) |
| Body limit | 10 KB (anti payload bomb) |
| Erros | Resposta genérica ao cliente; status interno só no log; ErrorBoundary diferenciado por `import.meta.env.DEV` |
| Segredos | `.env` no `.gitignore`; FAL_KEY apenas via env vars da Vercel |
| Dependências | `npm audit` limpo (0 vulnerabilidades) |

## Histórico de auditorias

- **2026-05-23** — auditoria paranoica (2 passadas integradas) aplicando o framework [Protocolo de Segurança](https://github.com/jeanderson-silva8/protocolo-de-seguranca) — [relatório](docs/AUDIT_REPORT_2026-05-23.md). Resultado: 1 crítico (FAL_KEY no histórico do git) + 7 importantes + 8 qualidade. **A FAL_KEY foi rotacionada no dashboard fal.ai e os 🟠/🟡 foram corrigidos em código no mesmo dia.**
