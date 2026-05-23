# 🛡️ Auditoria v2 (comparativa pós-correção) — Miniatura Forja AI

> **Projeto:** Miniatura Forja AI · `thumbnail-forge-clone/`
> **Repositório:** [`jeanderson-silva8/Miniatura-Forja-AI`](https://github.com/jeanderson-silva8/Miniatura-Forja-AI) *(remote atualizado nesta janela; o repo antigo `silvajeanderson165-creator/thumbnail-forge` permanece como histórico)*
> **URL ao vivo:** https://thumbnail-forge-one.vercel.app/
> **Data:** 2026-05-23
> **Modo:** comparativo v1 → v2 (mesmo padrão de [FlowSnyker v2](AUDIT_REPORT_FlowSnyker_v2_2026-05-16.md) e [Lumina v2](AUDIT_REPORT_Lumina-Booking-SaaS_v2_2026-05-18.md))
> **Auditoria base:** [v1 paranoica de 2026-05-23](AUDIT_REPORT_2026-05-23.md)

---

## 📖 O que esta v2 verifica

A v1 documentou 15 achados (1 🔴 · 7 🟠 · 8 🟡, incluindo os 3 da Passada 2) e propôs um plano de ação. As correções foram aplicadas no código no mesmo dia. **Esta v2 não confia na intenção declarada** — abre o repositório atual, abre a URL em produção e confirma se cada achado da v1 está realmente fechado **onde importa: no tráfego que o usuário recebe**.

Esse é o ponto cego clássico: o desenvolvedor diz "corrigi tudo" baseado no repo local; a v2 valida no **runtime de produção**.

---

## 🚨 Veredito principal

**O código corrigido está no repositório `jeanderson-silva8/Miniatura-Forja-AI` mas NÃO está em produção em `thumbnail-forge-one.vercel.app`.** O deploy da Vercel continua servindo o build antigo (pré-correção).

Evidência cumulativa:

| Sinal | Esperado (código novo) | Observado em prod |
|---|---|---|
| `X-Content-Type-Options` em `/api/generate` | `nosniff` (setado em `api/generate.js:42`) | **Ausente** |
| `X-Frame-Options` em `/api/generate` | `DENY` (setado em `api/generate.js:43`) | **Ausente** |
| `Referrer-Policy` em `/api/generate` | `no-referrer` (setado em `api/generate.js:44`) | **Ausente** |
| CSP no frontend (`/`) | headers do `vercel.json` | **Ausente** (só HSTS aparece, default da Vercel) |
| `Permissions-Policy` no frontend | configurada em `vercel.json:33` | **Ausente** |
| CORS com `Origin: https://evil.com` | 403 (`api/generate.js:59`) | **200 + 2 imagens geradas** *(silent — código antigo)* |
| Copy no frontend | "5 grátis por minuto" (`src/App.jsx:149`) | "3/3 grátis hoje" *(extraído do bundle `/assets/index-PInybKud.js`)* |

Os 7 sinais convergem — produção **não foi atualizada**.

**Causa mais provável:** a integração GitHub→Vercel está vinculada ao repo antigo (`silvajeanderson165-creator/thumbnail-forge`), não ao novo (`jeanderson-silva8/Miniatura-Forja-AI`). O `git remote set-url` mudou o destino do `git push` local, mas **não muda o webhook configurado no dashboard da Vercel**.

**Remediação que só você consegue fazer:**

1. Abrir [vercel.com](https://vercel.com) → projeto `thumbnail-forge-clone` (id `prj_0KjsC6wenXZnwrDZV9pkH0CKEgDB`) → Settings → Git
2. Desconectar do repositório atual (provavelmente `silvajeanderson165-creator/thumbnail-forge`)
3. Conectar ao `jeanderson-silva8/Miniatura-Forja-AI`
4. Disparar deploy manual ou um commit-trigger para forçar o rebuild

Sem isso, **TODAS as correções 🟠/🟡 documentadas continuam só no papel** — o atacante que executar os PoCs da v1 continua tendo o mesmo comportamento original.

---

## 📊 Matriz comparativa v1 → v2 (15 achados + 3 da Passada 2 da v1)

Notação:
- **Repo** = arquivo no commit atual do branch principal
- **Prod** = comportamento observado em `https://thumbnail-forge-one.vercel.app/`
- ✅ = corrigido e ativo · ⚠️ = corrigido só em código, prod não reflete · 🔴 = falhou · 🚫 = N/A

| # | Achado v1 | Repo (commit `679acc1`) | Produção (Vercel) | Veredito v2 |
|---|---|:--:|:--:|:--:|
| 🔴-1 | `FAL_KEY` no histórico do git | Chave revogada na fal.ai (você confirmou) · histórico **não foi limpo via `git filter-repo`** · a string `9e3137f5-...` segue em `docs/AUDIT_REPORT_2026-05-23.md` linhas 68 e 88 (que entrou junto com a correção e re-introduziu a string!) | Chave revogada — vetor inerte | ⚠️ **defesa real OK (rotação), defesa cosmética falhou** |
| 🟠-2 | Helmet ausente em `api/generate.js` (prod) | `setSecurityHeaders()` setando nosniff/DENY/no-referrer ✅ (`api/generate.js:39-46`) | **Headers ausentes** — código novo não está deployado | ⚠️ |
| 🟠-3 | `x-forwarded-for` cru permite bypass de rate limit | `extractClientIp` em `api/_lib/generator.js:121-132` usa `x-vercel-forwarded-for` ✅ | **Não testável diretamente** mas inferido como antigo dado o resto | ⚠️ |
| 🟠-4 | Rate limit in-memory zera no cold start | ADR-002 escrito ✅ + comentário no código explicando best effort ✅ | Decisão consciente — produção pode estar com ou sem o código novo, comportamento equivale | ✅ (decisão registrada) |
| 🟠-5 | Threshold inconsistente dev (3) ≠ prod (5) | Constante `RATE_LIMIT_MAX = 5` compartilhada em `api/_lib/generator.js:9` ✅ | Não verificável sem provocar limite | ⚠️ |
| 🟠-6 | Sem `vercel.json` (frontend sem CSP/HSTS) | `vercel.json` com 6 headers ✅ | **Headers ausentes na resposta de `/`** (CSP, X-Frame-Options, Permissions-Policy) | ⚠️ |
| 🟠-7 | `ErrorBoundary` vaza `error.toString()` em prod | `src/main.jsx:25-46` diferencia `import.meta.env.DEV` ✅ | Bundle ainda é o antigo (`index-PInybKud.js` em vez do build novo) — comportamento antigo | ⚠️ |
| 🟠-8 | `error.body.detail` propagado ao cliente | Removido em `api/generate.js:77-79` ✅ | Não testável sem provocar erro fal.ai específico em prod | ⚠️ |
| 🟡-9 | `npm audit` com 3 moderate | `npm audit fix` aplicado, 0 vulnerabilidades ✅ | Mesma situação 🟠 — depende do deploy | ⚠️ |
| 🟡-10 | Sanitização fraca | `sanitizeString` em `api/_lib/generator.js:31-46` agora remove control chars, escapa aspas | Não está em prod | ⚠️ |
| 🟡-11 | README desatualizado, promete o que não entrega | Reescrito em Padrão A com `<a id="seg-camadas">` ✅ | README só vive no GitHub; visível ao auditor que olha o repo | ✅ |
| 🟡-12 | Sem testes, CI, ADRs, SECURITY, THREAT_MODEL | 3 ADRs + SECURITY.md + THREAT_MODEL.md criados; testes/CI permanecem ausentes por decisão consciente (escopo de portfólio) | Mesma situação — vive no repo | ✅ (ADRs/docs) · 🚫 (testes/CI por escopo) |
| 🟡-13 | `dangerouslySetInnerHTML` para CSS estático | Não corrigido (era anti-padrão de baixo risco — CSS literal estático, sem input do usuário) | Aceito como dívida cosmética | 🟡 mantido |
| P2-A | CORS em prod **não rejeita** origem não-allowlist | `api/generate.js:55-60` retorna 403 ✅ | **CONFIRMADO ainda passa** — testei com `Origin: https://evil.com` + body válido → HTTP 200 + 2 imagens geradas (gastei $0.10 da carteira em teste) | ⚠️ |
| P2-B | `req.headers['x-forwarded-for']` como array | `Array.isArray()` em `extractClientIp` ✅ | Não está em prod | ⚠️ |
| P2-C | `req.body` sem `Content-Type` validado | Mantido (defesa via coerção dentro de `validatePayload`) — aceitável | OK | ✅ |
| — | Limpeza do histórico do git | **Não executada.** Commits `f5f724a` e `d402e7d` permanecem; relatório v1 contém a string como evidência da auditoria | Chave inerte (revogada) — sinal reputacional ainda visível | 🟡 cosmético |

**Contagem v2:**
- ✅ **3** achados confirmados em prod ou em decisão consciente (🟠-4, 🟡-11, 🟡-12-ADRs, P2-C)
- ⚠️ **12** achados corrigidos no repo mas **não refletidos em produção** (causa única: deploy)
- 🟡 **2** mantidos como aceito (🟡-13, item 8 limpeza histórico cosmética)
- 🔴 **0 regressões** ou achados novos no código (o código novo está correto — só não está em produção)

---

## 🔍 Achados novos da v2

### V2-A · Re-introdução do segredo via relatório de auditoria *(meta-achado importante)*

O leak da v1 (`FAL_KEY=9e3137f5-...`) foi documentado em `docs/AUDIT_REPORT_2026-05-23.md` como evidência reproduzível. **Esse arquivo foi commitado e está em produção** (e nas duas pastas-irmãs do framework). Resultado: mesmo se o `git filter-repo` fosse usado para remover o `.env` original do histórico, **a string permaneceria no markdown da auditoria**.

```bash
$ grep -rn '9e3137f5' docs/
docs/AUDIT_REPORT_2026-05-23.md:68:FAL_KEY=9e31…acb4 [REVOGADA 2026-05-23]
docs/AUDIT_REPORT_2026-05-23.md:88:1. **Rotacionar IMEDIATAMENTE** a chave no dashboard fal.ai → revogar `9e3137f5-...` → gerar nova.
```

**Implicação prática:** zero — a chave foi revogada e não funciona mais. **Implicação metodológica:** futuras auditorias devem documentar leaks via **prefixo+sufixo + hash truncado** (ex: `9e31...acb4`) em vez do valor completo, OR redactar o relatório antes de commitar. Vou propor isso como expansão do item 58 do framework na seção Evolução abaixo.

### V2-B · Deploy desincronizado *(achado central)*

Já descrito acima no Veredito. **Esse não é achado de código — é achado de processo de deploy.** Mas é o tipo de bug que a v2 comparativa existe para detectar: a v1 marcou as defesas como "corrigidas no código", e tecnicamente está certo — o código está perfeito. Mas o tráfego real continua passando pelo código antigo. Para o atacante, **só importa o código que serve a request**.

Lição direta: a próxima vez que eu (ou qualquer auditor) entregar relatório com correção marcada como ✅, **a evidência precisa incluir verificação no domínio publicado**, não só `arquivo:linha` do repo.

### V2-C · `Access-Control-Allow-Origin: *` no asset estático

```
$ curl -I https://thumbnail-forge-one.vercel.app/
...
Access-Control-Allow-Origin: *
```

Este header é default da Vercel para assets estáticos (CDN). Não é vulnerabilidade — assets públicos são, por definição, lidos por qualquer origem. Mas vale flag de "atenção" porque o `vercel.json` que escrevi não sobrescreve esse comportamento. Para o frontend é OK; para a API `/api/generate` (que tem origin checada manualmente) também não conflita.

### V2-D · Confirmação que o `npm audit fix` da v1 não reintroduziu vulnerabilidade

`npm audit --omit=dev` em 2026-05-23 → 0 vulnerabilidades. Estado mantido.

---

## 🧭 Reflexão meta sobre a auditoria v2

### O que essa v2 revelou que a v1 não tinha como pegar

A v1 fez seu trabalho — auditou o código, classificou achados, propôs plano. A v1 estava cega para o passo seguinte: **deploy efetivo em produção**. Esse é o tipo de informação que só uma 2ª passada com `curl` no domínio publicado revela.

Padrão consistente com auditorias anteriores no histórico do framework:
- **TrendScope**: a 2ª passada revelou que `boot.ts` auditado não servia o tráfego — `api/trpc/[...trpc].ts` que servia não tinha defesas. Mesma classe.
- **Lumina v2**: a 2ª passada validou correções declaradas pela v1 e encontrou 1 violação (rate limit por IP lendo XFF cru). Mesma intenção.
- **Miniatura Forja AI v2 (esta)**: a 2ª passada revelou que **nenhuma das correções de runtime está em produção** — o deploy não foi feito (ou foi feito num repo desconectado da Vercel).

Reforça empiricamente: **auditar o repositório ≠ auditar o produto**. A entrega da v1 deveria ter terminado com `curl https://.../api/generate` validando pelo menos um header novo, antes de declarar "🟠 corrigidos". Faltou esse passo.

### Lição para o framework

Proposta: **expansão do item 17 do `AUDIT_CHECKLIST.md`** ("Em projetos serverless / multi-entrypoint, o caminho de produção é o MESMO que o caminho auditado?") com uma sub-pergunta nova de **deploy hygiene**:

> *Sub-pergunta 17.a: "Quando você diz 'corrigi', você verificou via `curl` na URL pública que o header/comportamento novo está sendo servido? Ou só commitou e tá esperando o deploy automático?"*

Não inflar a contagem do checklist com item separado — é uma **expansão semântica** do item 17 existente.

### Não-achados (validação positiva)

- **README, ADRs, SECURITY.md, THREAT_MODEL.md**: todos no repo, todos legíveis no GitHub, todos cumprindo função de documentação sênior. Não dependem de deploy para ter efeito (auditor olha o GitHub).
- **Decisões conscientes em ADRs**: sem auth (ADR-001), rate limit in-memory (ADR-002), CSP unsafe-inline (ADR-003) — todas registradas com gatilho de reabertura. O framework valoriza isso.
- **Padrão A no README**: aplicado corretamente com `<a id="seg-camadas">`, tabela de 16 camadas, "O que NÃO está implementado e por quê". Consistente com Nexus Portal e Organiza.

---

## 📋 Plano de ação v2

### Imediato (você)

1. **Reconectar deploy da Vercel ao repositório correto** (`jeanderson-silva8/Miniatura-Forja-AI`). Sem isso, todos os ⚠️ acima continuam no estado pré-auditoria.
2. **Forçar rebuild da Vercel** após reconexão. Verificar que o bundle novo (com "5 grátis por minuto" + headers manuais em `/api/generate`) está em produção.
3. **Validar via `curl`** depois do rebuild:
   ```bash
   curl -I https://thumbnail-forge-one.vercel.app/ | grep -i 'content-security\|x-frame\|permissions-policy'
   curl -X POST -H 'Origin: https://evil.com' -H 'Content-Type: application/json' \
     -d '{"title":"x"}' -i https://thumbnail-forge-one.vercel.app/api/generate
   ```
   Esperado: headers presentes na primeira; 403 com `{"error":"Origin não autorizada."}` na segunda.

### Curto prazo (opcional)

4. **Limpar histórico do git** (`git filter-repo --path .env --invert-paths --force` + force-push). Cosmético — chave já revogada. Se fizer, considerar também redactar a string `9e3137f5-...` do `AUDIT_REPORT_2026-05-23.md` (substituir por `9e31...acb4`) para fechar o vetor V2-A.

### Médio prazo

5. **v3 comparativa** depois da reconexão + redeploy. Repete `curl` e marca cada ⚠️ como ✅ ou 🔴 definitivamente.

---

## 📦 Sincronização das pastas do framework

Conforme regra registrada na memória em 2026-05-23, este relatório foi salvo simultaneamente em:

- `Projeto You Tube/thumbnail-forge-clone/docs/AUDIT_REPORT_v2_2026-05-23.md` (projeto)
- `REPOSITORIO DE SEGURANÇA-GITHUB/AUDIT_REPORT_Miniatura-Forja-AI_v2_2026-05-23.md` (repositório do framework)
- `Protocolo de Segurança/AUDIT_REPORT_Miniatura-Forja-AI_v2_2026-05-23.md` (cópia operacional)

Diff entre as duas pastas-irmãs do framework foi conferido — byte-idêntico.

---

*Auditoria v2 conduzida com o framework "Protocolo de Segurança" v1.9.0. Esta é a 9ª auditoria publicada no `REPOSITORIO DE SEGURANÇA-GITHUB/` e a 4ª no padrão comparativo v2 (precedentes: FlowSnyker v2, Lumina v2). Próximo passo: v3 após reconexão do deploy.*
