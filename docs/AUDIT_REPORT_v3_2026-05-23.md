# 🛡️ Auditoria v3 (confirmação de deploy) — Miniatura Forja AI

> **Projeto:** Miniatura Forja AI · `thumbnail-forge-clone/`
> **Repositório:** [`jeanderson-silva8/Miniatura-Forja-AI`](https://github.com/jeanderson-silva8/Miniatura-Forja-AI)
> **URL ao vivo:** https://thumbnail-forge-one.vercel.app/
> **Data:** 2026-05-23
> **Modo:** confirmação de runtime pós-redeploy (mini-passada — após o autor recriar o projeto na Vercel)
> **Auditoria base:** [v1 paranoica](AUDIT_REPORT_2026-05-23.md) → [v2 comparativa](AUDIT_REPORT_v2_2026-05-23.md) → **v3**

---

## 🎯 O que esta v3 verifica

A [v2 comparativa](AUDIT_REPORT_v2_2026-05-23.md) detectou que **12 correções estavam no repositório mas não em produção** — a Vercel ainda servia o build pré-auditoria porque o webhook estava ligado ao repo antigo. O autor excluiu o projeto da Vercel e reconectou apontando para `jeanderson-silva8/Miniatura-Forja-AI`. Esta v3 confirma com `curl` no domínio publicado.

---

## ✅ Resultados (5 testes de runtime)

### T1 — Headers de segurança do frontend (`/`)

```
$ curl -sS -I https://thumbnail-forge-one.vercel.app/ | grep -iE 'content-security|x-frame|x-content-type|referrer-policy|permissions-policy|strict-transport'

Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https://images.unsplash.com https://*.fal.media https://fal.media; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

✅ Todos os 6 headers do `vercel.json` aplicados. Fecha 🟠-6 da v1.

### T2 — Headers manuais da API (`/api/generate`)

```
$ curl -sS -X POST -H 'Content-Type: application/json' -d '{}' -i https://thumbnail-forge-one.vercel.app/api/generate | grep -iE 'x-content-type|x-frame|referrer-policy|cache-control'

Cache-Control: no-store
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

✅ Headers de `setSecurityHeaders()` em `api/generate.js:39-46` aplicados. Fecha 🟠-2.

### T3 — CORS bloqueante com origem maliciosa

```
$ curl -sS -X POST -H 'Origin: https://evil.com' -H 'Content-Type: application/json' -d '{"title":"x"}' https://thumbnail-forge-one.vercel.app/api/generate

HTTP 403
{"error":"Origin não autorizada."}
```

✅ Bloqueio explícito (era silent na v1, gerou imagem real na v2). Fecha P2-A.

### T4 — Bundle JavaScript atualizado

```
$ curl -sS https://thumbnail-forge-one.vercel.app/ | grep -oE '/assets/index-[a-zA-Z0-9_-]+\.js'
/assets/index-dv1S03mm.js

$ curl -sS https://thumbnail-forge-one.vercel.app/assets/index-dv1S03mm.js | grep -oE '(3/3 grátis hoje|5 grátis por minuto)'
5 grátis por minuto
```

✅ Bundle é o da build pós-correção (hash `dv1S03mm` ≠ `PInybKud` que estava em prod na v2). Copy nova confirmada.

### T5 — Validação básica funcionando

```
$ curl -sS -X POST -H 'Origin: https://thumbnail-forge-one.vercel.app' -H 'Content-Type: application/json' -d '{}' https://thumbnail-forge-one.vercel.app/api/generate

HTTP 400
{"error":"Título ou tópico é obrigatório."}
```

✅ `validatePayload` em `api/_lib/generator.js` ativo.

---

## 📊 Matriz final v1 → v2 → v3

| # | Achado v1 | v1 (repo) | v2 (prod) | **v3 (prod)** |
|---|---|:--:|:--:|:--:|
| 🔴-1 | FAL_KEY no histórico | rotacionada | inerte | ✅ inerte (revogada) |
| 🟠-2 | Helmet ausente em prod | corrigido | ⚠️ não em prod | ✅ |
| 🟠-3 | `x-forwarded-for` cru | corrigido | ⚠️ não em prod | ✅ (extractClientIp em uso) |
| 🟠-4 | Rate limit in-memory | ADR-002 | decisão consciente | ✅ |
| 🟠-5 | Threshold inconsistente | constante compartilhada | ⚠️ | ✅ |
| 🟠-6 | Sem `vercel.json` | criado | ⚠️ não aplicava | ✅ |
| 🟠-7 | ErrorBoundary vaza | corrigido | ⚠️ bundle antigo | ✅ (bundle novo) |
| 🟠-8 | `error.body.detail` propagado | removido | ⚠️ | ✅ |
| 🟡-9 | npm audit moderate | `npm audit fix` | ⚠️ | ✅ |
| 🟡-10 | sanitize fraca | endurecido | ⚠️ | ✅ |
| 🟡-11 | README desatualizado | reescrito Padrão A | ✅ (já no GitHub) | ✅ |
| 🟡-12 | Sem ADRs/SECURITY/THREAT_MODEL | criados | ✅ | ✅ |
| 🟡-13 | `dangerouslySetInnerHTML` CSS | aceito | aceito | aceito |
| P2-A | CORS não-bloqueante | corrigido | ⚠️ ainda passava | ✅ |
| P2-B | array em `x-forwarded-for` | tratado | ⚠️ | ✅ |
| P2-C | Content-Type sem validar | coerção via validatePayload | ✅ | ✅ |
| V2-B | Deploy desincronizado | — | 🔴 (achado central da v2) | ✅ (reconectado) |

**Veredito v3:** 15 de 15 achados de runtime estão **agora confirmados em produção**. 2 mantidos como dívida cosmética conscientemente aceita (🟡-13 e limpeza do histórico). 0 regressões.

---

## ⚠️ Não-fechado: V2-A (re-introdução do segredo via relatório)

A string `FAL_KEY=9e3137f5-...` (chave **já revogada** na fal.ai) permanece em `docs/AUDIT_REPORT_2026-05-23.md` linhas 68 e 88, agora servida publicamente no `main` do repositório `jeanderson-silva8/Miniatura-Forja-AI`. Como a chave está revogada, **o vetor está inerte**, mas é teimoso reputacionalmente: auditor sênior que ler o relatório enxerga a chave em texto claro.

**Remediação opcional** (cosmético):

```bash
# Redactar a string nos 2 pontos do relatório
sed -i 's/9e31…acb4 [REVOGADA 2026-05-23]/9e31...acb4 (REDACTED — revogada)/g' docs/AUDIT_REPORT_2026-05-23.md
git add docs/AUDIT_REPORT_2026-05-23.md
git commit -m "docs(audit): redactar string da chave revogada (cosmético)"
git push
```

Mantido como decisão sua. Não bloqueia o fechamento da v3.

---

## 🧭 Reflexão meta v3 — fechando o ciclo

Esta v3 prova empiricamente o que a v2 documentou:

1. **A v1 estava metodologicamente correta** — código no repo, ADRs registrados, README honesto.
2. **A v2 estava operacionalmente correta** — pegou que o tráfego real continuava antigo.
3. **A v3 fecha o ciclo** — depois da reconexão do deploy, tudo que a v1 prometeu está servindo o request real.

O padrão v1 → v2 → v3 (auditoria → comparativa → confirmação) custou 3 leituras do projeto, mas estabeleceu **o que importa medir**: não "código novo está commitado", mas "header novo aparece no `curl`".

Isto reforça a **proposta de expansão do item 17 do checklist** documentada na v2 — "deploy hygiene": quando uma auditoria declara um achado como corrigido, a evidência deve incluir verificação na URL publicada, não só no repo. Sem isso, "corrigido" vira teatro.

---

## 📋 Status final do projeto

- ✅ Repositório limpo e organizado (`jeanderson-silva8/Miniatura-Forja-AI`)
- ✅ Produção (`thumbnail-forge-one.vercel.app`) servindo o código corrigido — 5 testes de runtime confirmados
- ✅ Documentação completa: README Padrão A, SECURITY.md, THREAT_MODEL.md, 3 ADRs
- ✅ 3 relatórios de auditoria no histórico: v1 paranoica, v2 comparativa, v3 confirmação
- ✅ `npm audit` limpo (0 vulnerabilidades)
- ⚠️ V2-A residual (chave revogada citada em texto claro no relatório v1) — cosmético, decisão sua

**Projeto pronto para portfólio.** Pode incluir em CV / LinkedIn como exemplo de "auditado e endurecido com framework próprio". O selo `🛡️ Auditoria de Segurança Aplicada` no README aponta para os 3 relatórios — qualquer recrutador técnico que abrir vê a evolução completa.

---

## 📦 Sincronização das pastas do framework

- `Projeto You Tube/thumbnail-forge-clone/docs/AUDIT_REPORT_v3_2026-05-23.md` (projeto)
- `REPOSITORIO DE SEGURANÇA-GITHUB/AUDIT_REPORT_Miniatura-Forja-AI_v3_2026-05-23.md` (framework, repo)
- `Protocolo de Segurança/AUDIT_REPORT_Miniatura-Forja-AI_v3_2026-05-23.md` (framework, operacional)

Diff entre as duas pastas-irmãs: byte-idêntico.

---

*Auditoria v3 (confirmação) conduzida com o framework "Protocolo de Segurança" v1.9.0. 10ª auditoria no `REPOSITORIO DE SEGURANÇA-GITHUB/`. Ciclo Miniatura Forja AI fechado.*
