# ADR-003 — CSP com `'unsafe-inline'` em `script-src` por limitação do Vite

**Status:** Aceito · **Data:** 2026-05-23
**Origem:** auditoria 2026-05-23 (item 33 do checklist universal)

---

## Contexto

A CSP definida em `vercel.json` permite `script-src 'self' 'unsafe-inline'`. O `'unsafe-inline'` em `script-src` anula a principal proteção XSS do CSP — qualquer `<script>` injetado executaria.

A escolha é forçada pelo bootstrap do Vite: o build produzido injeta um pequeno `<script>` inline no `index.html` para o handshake do módulo ES e o estado inicial do HMR (mesmo em build de produção). Sem `'unsafe-inline'`, o app não carrega.

---

## Decisão

Aceitar `'unsafe-inline'` em `script-src` por enquanto. Mesmo trade-off do Nexus Portal e Organiza (outros projetos do mesmo portfólio).

---

## Defesas em profundidade que compensam

- `frame-ancestors 'none'` — sem clickjacking
- `object-src 'none'` — sem `<object>`/`<embed>`/`<applet>`
- `base-uri 'self'` — sem injeção de `<base href>` redirecionando recursos
- `form-action 'self'` — sem exfiltração via `<form action>`
- Código React não usa `dangerouslySetInnerHTML` com input do usuário (auditado)
- Nenhum input de usuário é renderizado como HTML — tudo via JSX (escapado por padrão)

A superfície real de XSS deste projeto é essencialmente **nula** porque (a) não há entrada de usuário renderizada como HTML, (b) não há banco que armazene conteúdo de terceiros, (c) não há comentários/posts/perfis. A `'unsafe-inline'` é teórica, não tem vetor concreto neste código.

---

## Quando reabrir

- Vite habilitar nonce ou hash automaticamente em production build (acompanhar release notes)
- Vite suportar nativamente CSP estrita via plugin oficial
- Projeto adicionar feature que renderize HTML de terceiros (comentários, perfis, etc) — aí passa a ter vetor concreto de XSS e o `'unsafe-inline'` deixa de ser aceitável

---

## Ferramentas avaliadas

- `vite-plugin-csp-guard` — injeta nonces, mas exige ajustes no `index.html` e é experimental
- Middleware da Vercel para injetar nonce — possível, mas adiciona complexidade desproporcional ao risco real
