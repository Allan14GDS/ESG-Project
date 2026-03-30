# Guia de Migracao Completa — ESG B.kick

Este guia documenta o passo a passo para migrar toda a infraestrutura do projeto ESG
para um email centralizado, garantindo que o sistema funcione identicamente ao atual.

---

## Pre-requisitos

- Acesso ao repositorio GitHub: `caioasmiras/esg-project`
- Acesso ao Supabase Dashboard do projeto atual (`lhwwqykueiwywutwrlnj`)
- Acesso ao Registro.br do dominio
- Navegador com acesso a internet

---

## ETAPA 1 — Criar Gmail Centralizado

1. Acesse [accounts.google.com](https://accounts.google.com) → "Criar conta"
2. Crie um email que identifique o projeto (ex: `esg.bkick@gmail.com`)
3. Anote email e senha em local seguro
4. Este email sera o dono de: **Supabase, Vercel, e colaborador do GitHub**

---

## ETAPA 2 — Criar Conta no Vercel

1. Acesse [vercel.com](https://vercel.com) → "Sign Up"
2. **Recomendado:** Cadastre com o novo Gmail (nao com GitHub)
3. Escolha plano **Hobby** (gratuito)
4. Apos o cadastro, conecte sua conta GitHub:
   - Settings → Git Integrations → Connect GitHub
   - Autorize o acesso ao repositorio `caioasmiras/esg-project`

---

## ETAPA 3 — Criar Projeto no Vercel

1. Dashboard Vercel → **"Add New"** → **"Project"**
2. Selecione **"Import Git Repository"** → escolha `caioasmiras/esg-project`
3. Configuracoes do projeto:
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `.` (raiz — NAO use a subpasta `esg-project/`)
   - **Build Command:** `pnpm build` (padrao)
   - **Install Command:** `pnpm install`

4. **ANTES de clicar Deploy**, adicione as Environment Variables:

   | Nome | Valor |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://lhwwqykueiwywutwrlnj.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(copie do .env.local atual ou do Supabase Dashboard → Settings → API)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(copie do .env.local atual ou do Supabase Dashboard → Settings → API)* |
   | `NEXT_PUBLIC_SITE_URL` | `https://seu-dominio.com.br` *(substituir pelo dominio real)* |

   > **IMPORTANTE:** Marque todas as variaveis para os 3 ambientes: Production, Preview, Development

5. Clique **"Deploy"**
6. Aguarde o build completar (2-5 minutos)
7. O projeto ficara acessivel em: `nome-do-projeto.vercel.app`

### Verificacao rapida
- Acesse `https://nome-do-projeto.vercel.app` — deve carregar a pagina inicial
- Acesse `https://nome-do-projeto.vercel.app/auth/login` — deve mostrar a tela de login

---

## ETAPA 4 — Deploy Automatico (GitHub → Vercel)

Isso ja esta configurado automaticamente apos a Etapa 3:
- Cada **push na branch `main`** dispara um deploy automatico
- Cada **Pull Request** ganha um preview deployment
- Para verificar: Project → Settings → Git → deve mostrar `caioasmiras/esg-project`

### Adicionar o outro desenvolvedor
Para que os deploys do outro dev tambem disparem automaticamente:
1. Ele ja faz push para o mesmo repo — o deploy e automatico
2. Se quiser que ele veja o dashboard do Vercel:
   - Vercel → Settings → Members → Invite
   - Convide pelo email dele

---

## ETAPA 5 — Apontar Dominio (Registro.br → Vercel)

### 5a. No Vercel — adicionar dominio
1. Project → **Settings** → **Domains**
2. Digite o dominio (ex: `meuprojeto.com.br`) → **Add**
3. O Vercel mostrara os registros DNS necessarios. Anote-os.

### 5b. No Registro.br — configurar DNS
1. Acesse [registro.br](https://registro.br) → **Meus Dominios** → selecione o dominio
2. Clique em **"DNS"** ou **"Editar zona"**
3. Configure os registros:

   | Tipo | Host | Valor |
   |------|------|-------|
   | **A** | `@` | `76.76.21.21` |
   | **CNAME** | `www` | `cname.vercel-dns.com` |

4. **Remova** registros A ou CNAME antigos que apontem para outro servidor
5. Salve as alteracoes
6. Aguarde propagacao DNS (15 min a 2 horas, maximo 48h)

### 5c. SSL/HTTPS
- O Vercel gera certificado SSL **automaticamente** apos o DNS propagar
- Nao precisa configurar nada manualmente
- Verifique em: Project → Settings → Domains → deve mostrar "Valid Configuration"

### Como verificar se o DNS propagou
```bash
# No terminal (Windows PowerShell ou CMD)
nslookup seu-dominio.com.br
# Deve retornar 76.76.21.21

nslookup www.seu-dominio.com.br
# Deve retornar cname.vercel-dns.com
```

---

## ETAPA 6 — Configurar Supabase

### 6a. Transferir ownership para o novo email (RECOMENDADO)

Manter o mesmo projeto Supabase evita migrar dados, tabelas, RLS e funcoes.

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Va em **Organization Settings** → **Members**
3. Clique **"Invite"** → digite o novo Gmail → selecione role **"Owner"**
4. Abra o novo Gmail → aceite o convite
5. Apos aceitar, no dashboard do novo email:
   - Organization Settings → Members → transfira o ownership
   - Opcionalmente, remova o email antigo

### 6b. Configurar URLs de autenticacao (OBRIGATORIO)

**Sem isso, emails de confirmacao e recuperacao de senha NAO funcionam em producao.**

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL:** `https://seu-dominio.com.br`
   - **Redirect URLs:** adicione `https://seu-dominio.com.br/auth/callback`
3. Se tiver o dominio `.vercel.app` tambem, adicione:
   - `https://nome-do-projeto.vercel.app/auth/callback`

### 6c. Conexoes no codigo (referencia)

Nenhum arquivo tem URLs hardcoded. Tudo vem de variaveis de ambiente:

| Arquivo | Variaveis usadas |
|---------|-----------------|
| `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `lib/supabase/admin.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |
| `app/auth/signup/actions.ts` | `NEXT_PUBLIC_SITE_URL` (para redirect de email) |

Se um dia criar um novo projeto Supabase, basta trocar as 3 variaveis de ambiente
no Vercel e no `.env.local` local.

---

## ETAPA 7 — Testar Migracao

### Checklist completo

**Acesso basico:**
- [ ] `https://seu-dominio.com.br` carrega a pagina inicial (landing page)
- [ ] `https://www.seu-dominio.com.br` redireciona para o dominio principal
- [ ] HTTPS ativo (cadeado verde no navegador)
- [ ] Pagina carrega sem erros no console do navegador (F12)

**Autenticacao:**
- [ ] `/auth/login` — tela de login carrega
- [ ] Login com usuario existente funciona
- [ ] Apos login, redireciona para `/dashboard/meus-cadernos`
- [ ] Logout funciona

**Signup (se aplicavel):**
- [ ] `/auth/signup` — tela de cadastro carrega
- [ ] Criar novo usuario — email de confirmacao chega
- [ ] Link no email aponta para `https://seu-dominio.com.br/auth/callback` (NAO localhost)
- [ ] Clicar no link confirma o usuario e redireciona corretamente

**Funcionalidades principais:**
- [ ] Dashboard carrega cadernos/templates
- [ ] Admin panel (`/admin`) funciona para usuarios admin
- [ ] Criacao e edicao de templates funciona
- [ ] Respostas de questionarios salvam corretamente
- [ ] Kanban board funciona

**Deploy automatico:**
- [ ] Fazer um push de teste na branch `main`
- [ ] Verificar no Vercel se o deploy dispara automaticamente
- [ ] Apos deploy, verificar se o site atualiza

**Mobile:**
- [ ] Acessar pelo celular — layout responsivo funciona

---

## Troubleshooting

### "Failed to fetch" / "ERR_NAME_NOT_RESOLVED"
- **Causa:** Variaveis de ambiente nao configuradas no Vercel
- **Solucao:** Vercel → Project → Settings → Environment Variables → verificar as 4 variaveis

### Email de confirmacao aponta para localhost:3000
- **Causa:** `NEXT_PUBLIC_SITE_URL` nao configurada ou Supabase Site URL incorreta
- **Solucao:**
  1. Vercel: adicionar `NEXT_PUBLIC_SITE_URL=https://seu-dominio.com.br`
  2. Supabase: Authentication → URL Configuration → Site URL = `https://seu-dominio.com.br`

### Dominio mostra "DNS_PROBE_FINISHED_NXDOMAIN"
- **Causa:** DNS ainda nao propagou ou registros incorretos
- **Solucao:** Verificar registros no Registro.br e aguardar propagacao

### Build falha no Vercel
- **Causa provavel:** Dependencias ou variaveis faltando
- **Solucao:** Verificar logs do build no Vercel → Deployments → clicar no deploy com erro

---

## Resumo de Credenciais Necessarias

Guarde estas informacoes em local seguro:

```
# Gmail centralizado
Email: [novo-email@gmail.com]
Senha: [senha]

# Vercel
Login: [novo-email@gmail.com]
Projeto: [nome-do-projeto]

# Supabase
Login: [novo-email@gmail.com]
Projeto: lhwwqykueiwywutwrlnj
URL: https://lhwwqykueiwywutwrlnj.supabase.co

# Dominio
Registrador: registro.br
Dominio: [seu-dominio.com.br]

# GitHub
Repo: caioasmiras/esg-project
```

---

*Documento criado em 29/03/2026 para a migracao do projeto ESG B.kick*
