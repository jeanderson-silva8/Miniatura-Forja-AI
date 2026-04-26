# 🎨 Miniatura Forja AI— Gerador de Miniaturas

> Aplicação **Full Stack** para criação e geração de thumbnails profissionais, construída com **React**, **Vite** e backend **Node.js** — com vídeo de fundo cinematográfico e ErrorBoundary para resiliência.

[![Acessar App](https://img.shields.io/badge/🌐_ACESSAR_APP-thumbnail--forge.vercel.app-F97316?style=for-the-badge)](https://thumbnail-forge-one.vercel.app)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-API-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 🖼️ Sobre o Projeto

O **Thumbnail Forge** é uma ferramenta para criação de thumbnails profissionais. Combinando um frontend React com um backend Node.js e API serverless, o projeto permite gerar, personalizar e exportar thumbnails de alta qualidade para uso em vídeos, redes sociais e conteúdo digital.

### ✨ Features

- 🎬 **Vídeo de Fundo** — Hero com vídeo em loop para experiência cinematográfica
- 🖼️ **Geração de Thumbnails** — Criação e exportação de imagens profissionais
- 🛡️ **ErrorBoundary** — Tratamento robusto de erros para resiliência da aplicação
- 📱 **Mobile-First** — Fix específico para iOS Safari (keyboard overflow)
- ⚡ **Performance** — Detecção de dispositivo para otimização (vídeo removido no mobile)
- 🌐 **API Serverless** — Backend com funções serverless na Vercel
- 🎨 **CSS Artesanal** — Design premium construído do zero

---

## 🛠️ Stack Tecnológico

| Camada | Tech |
|---|---|
| **Frontend** | React 19, JavaScript ES6+, CSS3 Custom, Vite |
| **Backend** | Node.js, Express, API Serverless |
| **Deploy** | Vercel (frontend + serverless functions) |

---

## 📁 Estrutura

```
├── src/              # Código fonte React
│   ├── components/   # Componentes da aplicação
│   └── App.jsx       # Componente raiz com ErrorBoundary
├── api/              # Serverless functions (Vercel)
├── public/           # Assets estáticos e vídeo de fundo
├── server.js         # Servidor Node.js local
└── vite.config.js    # Configuração do Vite
```

---

## 🚀 Como Rodar

```bash
git clone https://github.com/silvajeanderson165-creator/thumbnail-forge.git
cd thumbnail-forge
npm install
npm run dev
```

---

## 🎯 Destaques Técnicos

- **Adaptive Media** — Vídeo de background removido automaticamente em mobile para performance
- **iOS Safari Fix** — Correção de overflow de teclado específica para Safari
- **Error Recovery** — ErrorBoundary com fallback gracioso para crash recovery

---

Desenvolvido por **Jeanderson Silva** — Full Stack Developer
