# HANDOFF - Projeto ESG (b.kick Platform)

> Documento de passagem de bastao para novo desenvolvedor.
> Data: Marco 2026

---

## Setup Rapido (5 minutos)

```bash
# 1. Clonar o repositorio
git clone https://github.com/caioasmiras/esg-project.git
cd esg-project

# 2. Instalar dependencias (usa pnpm)
npm install -g pnpm
pnpm install

# 3. Criar arquivo de ambiente
cp .env.example .env.local
# Edite .env.local com as credenciais abaixo

# 4. Rodar o projeto
pnpm dev
# Acesse http://localhost:3000
```

---

## Credenciais Supabase (Projeto Atual)

Cole estas credenciais no seu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lhwwqykueiwywutwrlnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3dxeWt1ZWl3eXd1dHdybG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDc4MTAsImV4cCI6MjA3NTg4MzgxMH0.E61ueHWOM67VgHXC_6YwG6L3XMvvwC3Y0wsHbK9UbjM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3dxeWt1ZWl3eXd1dHdybG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNzgxMCwiZXhwIjoyMDc1ODgzODEwfQ.yDsvPrv5fbatNxugT2MWPNZh7PfcKly-MvaWJTwe5YA
```

**Painel Supabase:** https://app.supabase.com/ (pedir acesso ao projeto `lhwwqykueiwywutwrlnj`)

**IMPORTANTE:** A `SUPABASE_SERVICE_ROLE_KEY` e uma chave secreta com acesso total ao banco. NUNCA exponha no frontend ou commite no Git.

---

## Acesso ao Repositorio GitHub

Repositorio: https://github.com/caioasmiras/esg-project (privado)

Para ter acesso de push, voce precisa:
1. Pedir para ser adicionado como colaborador no GitHub
2. Configurar autenticacao via SSH key ou Personal Access Token (PAT)

```bash
# Opcao 1: SSH (recomendado)
git remote set-url origin git@github.com:caioasmiras/esg-project.git

# Opcao 2: HTTPS com PAT
git remote set-url origin https://SEU-PAT@github.com/caioasmiras/esg-project.git
```

---

## Banco de Dados

- **Tecnologia:** PostgreSQL hospedado no Supabase
- **Status:** Banco ja configurado com todas as tabelas e RLS policies
- **Scripts SQL:** Pasta `/scripts/` contem os scripts que JA FORAM executados. NAO execute novamente a menos que esteja criando um projeto Supabase novo do zero

### Tabelas Principais
| Tabela | Descricao |
|--------|-----------|
| `profiles` | Perfis de usuario com roles |
| `organizations` | Holdings (grupos de empresas) |
| `companies` | Empresas vinculadas a holdings |
| `book_questions` | Questoes ESG |
| `book_templates` | Cadernos/templates de questoes |
| `book_question_junction` | Relacao questao-caderno |
| `book_answers` | Respostas das questoes |
| `book_assignments` | Atribuicao de cadernos a usuarios |
| `comment_history` | Historico de comentarios/revisoes |

### Roles de Usuario
| Role | Descricao |
|------|-----------|
| `admin_main` | Super admin - acesso total |
| `admin` | Admin geral |
| `holding_admin` | Admin de holding |
| `company_admin` | Admin de empresa |
| `revisor` | Revisor de respostas |
| `responder` | Respondente de questoes |
| `user` | Usuario basico |

### Criar Primeiro Admin
1. Acesse http://localhost:3000 e registre um usuario
2. Va no Supabase → Table Editor → `profiles`
3. Encontre o usuario e mude o campo `role` para `admin_main`
4. Faca logout e login novamente

---

## Estrutura do Projeto

```
esg-project/
├── app/                    # Next.js App Router (paginas e rotas)
│   ├── admin/              # Area administrativa
│   ├── api/                # API routes (REST endpoints)
│   ├── auth/               # Login e signup
│   ├── dashboard/          # Area do usuario logado
│   │   ├── meus-cadernos/  # Cadernos atribuidos
│   │   ├── questionnaire/  # Preenchimento de questoes
│   │   ├── status/         # Kanban board
│   │   ├── analytics/      # Graficos e metricas
│   │   └── export/         # Exportar relatorios
│   └── middleware.ts       # Protecao de rotas (auth)
├── components/             # Componentes React (~86 arquivos)
│   ├── ui/                 # shadcn/ui (base components)
│   ├── admin/              # Componentes admin
│   ├── questionnaire/      # Componentes de questionario
│   └── ...                 # Demais componentes por feature
├── lib/                    # Logica de negocio e utilidades
│   ├── supabase/
│   │   ├── admin.ts        # Client com service_role (server only)
│   │   ├── client.ts       # Client com anon key (browser)
│   │   └── server.ts       # Client server-side (PKCE)
│   └── ...                 # Services, data, utils
├── scripts/                # Scripts SQL (ja executados)
├── types/                  # TypeScript types
├── hooks/                  # React hooks customizados
├── public/                 # Assets estaticos
└── styles/                 # CSS adicional
```

---

## Tech Stack

| Tecnologia | Versao | Uso |
|-----------|--------|-----|
| Next.js | 15.3.8 | Framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5 | Linguagem |
| Tailwind CSS | 4.1.9 | Estilizacao |
| Supabase | 2.87.1 | Backend (DB + Auth) |
| shadcn/ui + Radix | - | Componentes UI |
| React Hook Form + Zod | - | Formularios + validacao |
| Recharts | 2.15.4 | Graficos |
| xlsx + papaparse | - | Export Excel/CSV |

---

## Scripts Disponiveis

```bash
pnpm dev      # Servidor de desenvolvimento (http://localhost:3000)
pnpm build    # Build de producao
pnpm start    # Rodar build de producao
pnpm lint     # Verificar codigo com ESLint
```

---

## Deploy

O projeto esta preparado para deploy na **Vercel**:
1. Conecte o repo GitHub na Vercel
2. Configure as variaveis de ambiente (mesmas do .env.local)
3. Deploy automatico a cada push na main

---

## VS Code

Ao abrir o projeto no VS Code, sera sugerido instalar as extensoes recomendadas.
Se nao aparecer, instale manualmente:
- **ESLint** - Linting de codigo
- **Tailwind CSS IntelliSense** - Autocomplete de classes Tailwind
- **Prettier** - Formatacao de codigo

---

## Documentacao Existente

| Arquivo | Conteudo |
|---------|----------|
| `DOCUMENTACAO_COMPLETA_APP.md` | Visao geral, rotas, governanca, regras de negocio, arquitetura do banco |
| `GOVERNANCE_STRUCTURE.md` | Hierarquia de usuarios e permissoes |
| `INSTALACAO.md` | Guia detalhado de instalacao (tambem em `esg-project/esg-project/`) |
| `DIAGNOSTICO_ERRO_SUPABASE.md` | Troubleshooting de erros Supabase |
| `DIAGNOSTICO_PROBLEMA_GESTORES.md` | Troubleshooting de permissoes de gestores |

---

## Notas Importantes

1. **O `.gitignore` ignora TODOS os arquivos `.env*`** - nunca serao commitados
2. **Este arquivo (HANDOFF.md) contem credenciais** - NAO commite no Git. Adicione ao `.gitignore` ou envie separadamente
3. **O build ignora erros de ESLint e TypeScript** (configurado em `next.config.mjs`) - isso e intencional para agilizar dev
4. **Imagens estao com `unoptimized: true`** no next.config - pode ser otimizado em producao
5. **Ha um subdiretorio `esg-project/esg-project/`** com uma copia antiga de configs - pode ser ignorado, o codigo real esta na raiz
6. **Nao ha testes automatizados** - nao ha suite de testes configurada
7. **Nao ha CI/CD** - deploy e manual via Vercel
