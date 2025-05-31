# ZK Prêmios

Sistema profissional de sorteios online, desenvolvido com React, Vite, Tailwind CSS e Supabase.

## ✨ Sobre o Projeto
O ZK Prêmios é uma plataforma moderna para sorteios, onde participantes podem escolher números, acompanhar o status, visualizar ganhadores e participar de campanhas promocionais. O sistema conta com painel administrativo completo, controle de solicitações, sorteio automatizado e experiência otimizada para desktop e mobile.

## 🚀 Funcionalidades Principais
- Escolha de números entre 1 e 1000 para participar do sorteio
- Solicitação e visualização de números extras
- Cadastro rápido via nome e WhatsApp
- Listagem de participantes e status dos números
- Página de ganhadores com histórico de sorteios
- Painel administrativo com:
  - Dashboard de estatísticas
  - Aprovação/rejeição de solicitações
  - Gerenciamento de participantes
  - Realização de sorteio com animação
  - Reset seguro do sistema
  - Controle de permissões (apenas admin pode apagar ganhadores)
- Layout moderno, responsivo e acessível
- Banner promocional dinâmico
- SPA ready para deploy em Netlify/Vercel

## 🛠️ Tecnologias Utilizadas
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Auth, Database, Storage)
- [Framer Motion](https://www.framer.com/motion/) (animações)
- [React Toastify](https://fkhadra.github.io/react-toastify/) (notificações)

## 📦 Como rodar localmente
1. Clone o repositório:
   ```bash
   git clone https://github.com/TALLESGIT/Itallo-zk.git
   cd Itallo-zk/project
   ```
2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```
3. Configure as variáveis de ambiente do Supabase (`.env`):
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Rode o projeto:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
5. Acesse em [http://localhost:5173](http://localhost:5173)

## 🌐 Deploy
- **Netlify/Vercel:**
  - Certifique-se de incluir o arquivo `public/_redirects` com:
    ```
    /*    /index.html   200
    ```
  - Configure as variáveis de ambiente do Supabase no painel da plataforma.

## 👤 Admin Demo
- Login admin padrão:
  - **Email:** admin@zkpremios.com
  - **Senha:** adminZK2025

## 📸 Banner
A imagem do banner deve estar em `public/banner.jpeg`.

## 📞 Contato
Dúvidas, sugestões ou parcerias:
- WhatsApp: (31) 97239-3341
- Email: contato@zkpremios.com

---
Feito com ❤️ por Tales Coelho 