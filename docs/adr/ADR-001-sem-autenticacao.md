# ADR-001 — Endpoint público sem autenticação (DoS econômico aceito como dívida)

**Status:** Aceito · **Data:** 2026-05-23
**Origem:** auditoria 2026-05-23 ([relatório](../AUDIT_REPORT_2026-05-23.md), achados 🟠-3/🟠-4)

---

## Contexto

Miniatura Forja AI é um micro-SaaS de portfólio que dispara chamadas pagas à fal.ai (cada request = 2 imagens FLUX Dev ≈ $0.05-0.10). O endpoint `POST /api/generate` é público — qualquer pessoa com a URL chama, sem login, sem token.

A auditoria identificou o vetor central: **drenar a conta da fal.ai via burst de requests**, mesmo com rate limit por IP, porque:
1. Rate limit in-memory zera no cold start da função serverless
2. IP é fakeável via header (corrigido — agora usamos `x-vercel-forwarded-for`), mas atacante ainda pode rotacionar IPs reais via proxies/Tor

Sem autenticação, **não há "por usuário"** — só por IP. E IP em escala é barato de rotacionar.

---

## Decisão

**Manter o endpoint público sem autenticação.** A defesa contra DoS econômico fica em camadas best effort:

1. **Rate limit por IP via `x-vercel-forwarded-for`** (não-fakeável pela borda da Vercel) — corrigido na auditoria.
2. **Promoção fica gratuita.** Se o saldo da fal.ai zerar, o serviço quebra naturalmente e o impacto é "indisponibilidade temporária", não "vazamento de dados".
3. **Monitorar billing manualmente** — alerta no dashboard da fal.ai se uso ultrapassar limiar diário.

---

## Alternativas consideradas

### Adicionar Cloudflare Turnstile / hCaptcha (rejeitado por ora)

**A favor:** torna o burst por bot inviável; mantém endpoint público para humanos legítimos.

**Contra:** complica o fluxo "abrir, digitar, gerar" — adiciona fricção sensorial. Para portfólio, conversão > segurança contra ataques teóricos. **Gatilho de reabertura:** se houver evento de drenagem real, implementar imediatamente.

### Adicionar conta de usuário + token de sessão (rejeitado)

**Contra:** Miniatura Forja AI é showcase técnico — adicionar auth aumenta superfície (registro, JWT, banco) sem entregar valor de produto. Mudaria a natureza do projeto.

### Migrar rate limit para Vercel KV / Upstash Redis (futuro)

Resolve o problema de "in-memory zera no cold start", mas **não fecha o vetor de rotação de IP**. Está como trabalho futuro no [ADR-002](ADR-002-rate-limit-in-memory.md), não como solução definitiva.

---

## Trade-offs assumidos

| Aspecto | Custo aceito |
|---|---|
| Drenagem da conta paga | Aceito. Mitigação: monitorar billing diariamente e setar alerta. |
| Indisponibilidade temporária se saldo zerar | Aceito. Reposição manual de créditos resolve. |
| Sem "por usuário" no rate limit | Aceito enquanto não houver auth. |

---

## Quando reabrir

- Primeiro evento de drenagem real observado no billing
- Quando produto for monetizado (botão "Desbloquear PRO" deixar de ser decorativo)
- Migração para um nível pago da fal.ai com SLA crítico
