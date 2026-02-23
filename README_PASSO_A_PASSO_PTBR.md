# Edu App Atípicos — passo a passo (bem simples)

Você tem um **projeto completo** (site/app) dentro deste ZIP. Para publicar no Railway, você **não escolhe um arquivo só** — você envia **a pasta inteira do projeto** (tudo que está aqui dentro).

## 0) O que você vai precisar
- Uma conta no **GitHub** (gratuita)
- Sua conta no **Railway** (você já criou)

## 1) Colocar o projeto no GitHub (sem programação)
1. Abra o GitHub e clique em **New repository**.
2. Nome sugerido: `edu-app-atipicos`.
3. Clique em **Create repository**.
4. Dentro do repositório, clique em **Add file → Upload files**.
5. **Descompacte** este ZIP no seu computador.
6. Agora selecione **TODOS os arquivos e pastas** descompactados (por exemplo: `client/`, `server/`, `drizzle/`, `package.json` etc.) e arraste para o GitHub.
7. Clique em **Commit changes**.

✅ Pronto: seu projeto está no GitHub.

## 2) Criar o projeto no Railway
1. No Railway: **New Project**
2. Escolha **Deploy from GitHub repo**
3. Selecione o repositório que você acabou de criar.

## 3) Criar o banco MySQL no Railway
1. Dentro do projeto no Railway, clique em **New**
2. Escolha **Database → MySQL**

## 4) Configurar variáveis (Railway → Variables)
No Railway, abra o serviço do app e vá em **Variables**.

Adicione (no mínimo):
- `DATABASE_URL`  
  - Você pega no MySQL do Railway (geralmente aparece como connection string).
  - Formato típico: `mysql://USER:SENHA@HOST:PORT/NOME_DO_BANCO`
- `JWT_SECRET`  
  - Pode ser uma senha grande. Ex.: `minha-chave-super-grande-123-abc-...`
- `NODE_ENV=production`

(Stripe e outros a gente ativa depois, quando o site estiver no ar.)

## 5) Build / Start (caso o Railway peça)
Em **Settings → Deploy** (ou Build & Start), use:
- **Build command:** `pnpm install && pnpm build`
- **Start command:** `pnpm start`

Se ele pedir versão do Node, use 20:
- Variável: `NIXPACKS_NODE_VERSION=20`

## 6) Criar as tabelas do banco (migrations)
Depois do deploy, rode as migrations **uma vez**:
1. No Railway, abra o serviço do app
2. Vá em **Shell**
3. Rode:
   - `pnpm db:push`

✅ Isso cria as tabelas no banco.

## 7) Abrir o link do site
No Railway, clique em **View** (ou abra a URL do serviço).

---

# Importante (sobre login / OAuth)
Este projeto veio de um ambiente de desenvolvimento que usa variáveis como `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` e `OAUTH_SERVER_URL`.

➡️ Para publicar para outras pessoas, normalmente você vai querer trocar isso por um login seu (e-mail/senha ou Google). Quando seu site estiver no ar, eu te guio no passo a passo para ajustar isso.

---

# Se algo der erro
Me mande:
1) print do erro do Railway (Deploy logs)
2) quais variáveis você colocou em Variables

Aí eu te digo exatamente o que corrigir.
