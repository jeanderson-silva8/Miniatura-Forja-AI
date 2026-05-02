# 🎨 Miniatura Forja AI
**Micro-SaaS para Criação de Thumbnails Virais com Inteligência Artificial**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![AI API](https://img.shields.io/badge/Fal.ai-FF5A5F?style=for-the-badge&logo=ai&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> **🟢 LIVE DEMO:** [Acesse o Miniatura Forja AI Aqui](https://thumbnail-forge-one.vercel.app)

<div align="center">
  <video src="assets/demo-thumbnail.mp4" autoplay loop muted playsinline width="100%"></video>
</div>

---

## 🛑 O Problema
Criadores de conteúdo e YouTubers sabem que a **Thumbnail (miniatura)** é o fator número 1 para o sucesso de um vídeo (CTR - Click-Through Rate). No entanto, criar miniaturas profissionais no Photoshop pode levar horas e exige conhecimento avançado em design, atrasando a publicação dos vídeos.

## ✅ A Solução
O **Miniatura Forja AI** é um Micro-SaaS criado para resolver essa dor. Utilizando inteligência artificial generativa de última geração (integrada via `@fal-ai/client`), a plataforma permite que qualquer criador digite um prompt e receba uma thumbnail de altíssima conversão em questão de segundos. 

---

## 🧠 Maior Desafio Técnico Superado
**Orquestração Assíncrona, Segurança de API Keys e tratamento de Imagens.**
Nunca exponha chaves de IA no Frontend! O maior desafio foi construir um fluxo seguro e resiliente:
1. **Middle-tier Seguro:** Criei um servidor Node.js/Express atuando como intermediário. Ele recebe o *prompt* do usuário via React, injeta as chaves de segurança ocultas e faz a chamada à inteligência artificial (`@fal-ai`).
2. **Tratamento de Assincronicidade e CORS:** APIs de geração de imagens podem demorar alguns segundos. Configurei corretamente os headers de CORS e o tráfego de dados assíncrono para que a interface não travasse enquanto a imagem estava sendo "forjada", lidando também com o tratamento de erros caso o servidor da IA falhasse.

---

## ✨ Principais Funcionalidades

- **Geração por Prompt (AI Powered):** Comunicação direta com modelos generativos visuais de alta definição.
- **Backend Protetor (Node.js):** Toda a lógica de comunicação externa e segurança de senhas fica isolada num servidor Express v5.
- **Interface Otimizada:** UI construída em React v19, totalmente responsiva e com ícones elegantes (`Lucide-React`).
- **Feedback em Tempo Real:** Loading states e tratamentos de erro nativos para guiar o usuário enquanto a IA processa o resultado.

---

## 🛠️ Stack Tecnológico & Arquitetura

### 1. Frontend (Interface de Interação)
- **Framework:** React 19 + Vite v8
- **Estilização:** CSS3 Vanilla moderno (Foco em performance sem dependências extras).
- **Ícones:** Lucide-React.

### 2. Backend (Motor e Segurança)
- **Engine:** Node.js + Express.js v5.
- **Middleware:** Configuração estrita de `Cors` para garantir que apenas o frontend autorizado possa bater na rota da IA.
- **Integração de Inteligência Artificial:** Uso do `@fal-ai/client` para consumir o modelo LLM visual e gerar a resposta binária/URL da imagem.

### 3. Deploy
- **Plataforma:** Vercel (Frontend e Backend Serverless Function).

---

## 🚀 Como Executar Localmente

### 1. Requisitos
- Node.js (v18+) instalado na máquina.
- Uma chave de API da Fal.ai (Variável `.env`).

### 2. Rodando o Backend (Servidor Node)
```bash
cd backend
npm install
# Crie um arquivo .env com sua FAL_KEY=sua_chave
npm start
```
> A API estará escutando na porta configurada (ex: `http://localhost:3000`)

### 3. Rodando o Frontend (React)
Abra um novo terminal:
```bash
cd frontend
npm install
npm run dev
```
> Acesse: `http://localhost:5173`

---

## 🤝 Autor

**Jeanderson Silva 😎🤌**

Desenvolvedor focado em unir interfaces modernas com a inteligência e o poder do backend e das APIs de IA. 

Sinta-se livre para dar um fork, contribuir ou testar a aplicação gerando suas próprias miniaturas!
