# ADR-002 — Rate limit in-memory aceito como best effort em ambiente serverless

**Status:** Aceito · **Data:** 2026-05-23
**Origem:** auditoria 2026-05-23 ([relatório](../AUDIT_REPORT_2026-05-23.md), achado 🟠-4 / addon E6)

---

## Contexto

`api/generate.js` usa um `Map` in-memory para rate limit (5 req/min por IP). Em deploy tradicional o `Map` viveria pelo tempo do processo; em Vercel Serverless cada função tem ciclo curto — após ~5 min de inatividade dorme, e a primeira request após o sono cria instância nova com `Map` vazio. Em escala horizontal (várias instâncias simultâneas), cada uma tem seu próprio `Map`.

Resultado: **rate limit é best effort, não garantido**. Atacante que sincronize com cold start ou cause escala consegue burst superior ao threshold nominal.

---

## Decisão

**Manter `Map` in-memory.** O ADR registra a limitação. Solução real (Vercel KV / Upstash Redis) fica como trabalho futuro.

Justificativa: defesa primária contra drenagem da conta fal.ai está em [ADR-001](ADR-001-sem-autenticacao.md) (monitoramento de billing + reposição manual). Rate limit é fricção adicional, não garantia.

---

## Alternativas consideradas

### Vercel KV (rejeitado por ora)

**A favor:** store compartilhado entre instâncias; contadores persistem entre cold starts. Resolve 100% do problema técnico.

**Contra:** requer ativar Vercel KV (limites no plano free), 2 env vars novas, mais 1 dep no `package.json`. Para portfólio sem tráfego real, custo > benefício. **Gatilho de reabertura:** ver ADR-001.

### Upstash Redis com `@upstash/ratelimit` (alternativa equivalente)

Mesma análise — adiar até haver tráfego/incidente.

---

## Trade-offs assumidos

| Aspecto | Custo aceito |
|---|---|
| Burst pós-cold-start | Atacante consegue 5 req/min × N instâncias revividas. Em prática, ~1-2 cold starts por hora no free tier → janela limitada. |
| Sem coordenação entre instâncias | Aceito. Tráfego real do projeto é baixo o suficiente para múltiplas instâncias serem raras. |

---

## Quando reabrir

- Drenagem real observada no billing da fal.ai
- Tráfego sustentado que cause escala horizontal regular
- Adição de auth (ADR-001 reaberto) — aí rate limit por usuário com store persistente passa a fazer sentido
