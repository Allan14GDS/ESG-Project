# Guia de Instalação - Sistema ESG

Este documento contém todas as instruções necessárias para instalar e configurar o projeto ESG em sua máquina local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

### 1. Node.js e npm/pnpm
- **Node.js**: Versão 18.x ou superior
- **npm**: Versão 9.x ou superior (ou pnpm 8.x ou superior)

**Instalação no Windows:**
1. Baixe o instalador em: https://nodejs.org/
2. Execute o instalador e siga as instruções
3. Verifique a instalação:
```bash
node --version
npm --version
```

**Instalação no macOS:**
```bash
# Usando Homebrew
brew install node

# Verificar instalação
node --version
npm --version
```

**Instalação no Linux (Ubuntu/Debian):**
```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. Git
**Windows:** Baixe em https://git-scm.com/download/win

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt-get install git
```

### 3. Conta Supabase
- Crie uma conta gratuita em: https://supabase.com/
- Será necessária para configurar o banco de dados

---

## 🚀 Instalação do Projeto

### Passo 1: Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/caioasmiras/esg-project.git

# Entre no diretório do projeto
cd esg-project
```

### Passo 2: Instalar Dependências

O projeto usa **pnpm** como gerenciador de pacotes. Você pode usar npm ou pnpm:

**Usando pnpm (recomendado):**
```bash
# Instalar pnpm globalmente se ainda não tiver
npm install -g pnpm

# Instalar dependências do projeto
pnpm install
```

**Usando npm:**
```bash
npm install
```

### Passo 3: Configurar Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto:
```bash
touch .env.local
```

2. Adicione as seguintes variáveis de ambiente:
```env
# Supabase - Client Side (Public)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Supabase - Server Side (Private)
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
```

**Como obter as credenciais do Supabase:**

1. Acesse https://app.supabase.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **Project Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (cuidado, é uma chave secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Criar as Tabelas no Supabase

1. Acesse o **SQL Editor** no painel do Supabase
2. Execute os seguintes scripts SQL na ordem:

#### 1. Criar Tabela de Perfis (Profiles)
```sql
-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin_main', 'admin_holding', 'admin_empresa', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios perfis" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### 2. Criar Tabela de Organizações (Holdings)
```sql
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

#### 3. Criar Tabela de Empresas (Companies)
```sql
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  holding_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

#### 4. Criar Tabelas de Questões e Cadernos
```sql
-- Tabela de questões
CREATE TABLE IF NOT EXISTS book_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  type TEXT,
  unique_identifier TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de cadernos
CREATE TABLE IF NOT EXISTS book_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de junção questões-cadernos
CREATE TABLE IF NOT EXISTS book_question_junction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_template_id UUID REFERENCES book_questions(id) ON DELETE CASCADE,
  book_template_id UUID REFERENCES book_templates(id) ON DELETE CASCADE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de respostas
CREATE TABLE IF NOT EXISTS book_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES book_templates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES book_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  value TEXT,
  value_jsonb JSONB,
  status TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atribuições de cadernos
CREATE TABLE IF NOT EXISTS book_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  caderno_id UUID REFERENCES book_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE book_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_question_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_assignments ENABLE ROW LEVEL SECURITY;
```

#### 5. Criar Função RPC para Buscar Todas as Questões
```sql
CREATE OR REPLACE FUNCTION get_all_questions_with_templates()
RETURNS TABLE (
  id UUID,
  label TEXT,
  type TEXT,
  unique_identifier TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  book_question_junction JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bq.id,
    bq.label,
    bq.type,
    bq.unique_identifier,
    bq.metadata,
    bq.created_at,
    bq.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'book_template_id', bqj.book_template_id,
          'book_templates', jsonb_build_object(
            'id', bt.id,
            'name', bt.name
          )
        )
      ) FILTER (WHERE bqj.id IS NOT NULL),
      '[]'::jsonb
    ) as book_question_junction
  FROM book_questions bq
  LEFT JOIN book_question_junction bqj ON bqj.question_template_id = bq.id
  LEFT JOIN book_templates bt ON bt.id = bqj.book_template_id
  GROUP BY bq.id, bq.label, bq.type, bq.unique_identifier, bq.metadata, bq.created_at, bq.updated_at
  ORDER BY bq.created_at DESC;
END;
$$;
```

### Passo 2: Configurar Autenticação

1. No painel do Supabase, vá em **Authentication** → **Providers**
2. Configure os provedores de autenticação que deseja usar (Email/Password já vem habilitado)

### Passo 3: Configurar Storage (opcional)

Se o projeto usa upload de arquivos:

1. Vá em **Storage** no painel do Supabase
2. Crie um bucket chamado `evidences` ou conforme necessário
3. Configure as políticas de acesso

---

## ▶️ Executar o Projeto

### Modo Desenvolvimento

```bash
# Usando pnpm
pnpm dev

# Usando npm
npm run dev
```

O projeto estará disponível em: **http://localhost:3000**

### Build para Produção

```bash
# Criar build de produção
pnpm build

# Executar versão de produção
pnpm start
```

---

## 👤 Criar Primeiro Usuário Admin

Após iniciar o projeto:

1. Acesse http://localhost:3000
2. Faça o registro de um novo usuário
3. No Supabase, vá em **Table Editor** → **profiles**
4. Encontre o usuário recém-criado e edite o campo `role` para `admin_main`
5. Faça logout e login novamente para aplicar as permissões

---

## 📁 Estrutura do Projeto

```
esg-project/
├── app/                          # App Router do Next.js
│   ├── admin/                    # Páginas administrativas
│   │   ├── questions/            # Gestão de questões
│   │   ├── templates/            # Gestão de cadernos
│   │   └── holdings/             # Gestão de holdings
│   ├── company/                  # Área da empresa
│   ├── api/                      # API Routes
│   └── auth/                     # Páginas de autenticação
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── admin/                    # Componentes administrativos
│   ├── company/                  # Componentes de empresa
│   └── questions/                # Componentes de questões
├── lib/                          # Bibliotecas e utilidades
│   ├── supabase/                 # Configuração Supabase
│   └── utils.ts                  # Funções utilitárias
├── public/                       # Arquivos estáticos
└── scripts/                      # Scripts SQL e utilitários
```

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 15.3.8** - Framework React com App Router
- **React 19** - Biblioteca JavaScript para UI
- **TypeScript 5** - Superset tipado do JavaScript
- **Tailwind CSS 4** - Framework CSS utilitário
- **Supabase** - Backend as a Service (PostgreSQL + Auth)
- **Radix UI** - Componentes acessíveis headless
- **shadcn/ui** - Biblioteca de componentes
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Lucide React** - Ícones
- **Recharts** - Biblioteca de gráficos
- **xlsx** - Exportação de planilhas Excel
- **papaparse** - Parser de CSV

---

## 🐛 Solução de Problemas

### Erro: "Cannot find module"
```bash
# Remova node_modules e reinstale
rm -rf node_modules package-lock.json
pnpm install
```

### Erro: "Supabase connection failed"
- Verifique se as variáveis de ambiente estão corretas no `.env.local`
- Certifique-se de que o projeto Supabase está ativo
- Verifique se as políticas RLS estão configuradas corretamente

### Erro: "Port 3000 already in use"
```bash
# Use outra porta
pnpm dev -- -p 3001
```

### Erro ao importar CSV/Excel
- Verifique se as colunas do arquivo correspondem às esperadas
- Certifique-se de que o encoding do arquivo é UTF-8

---

## 📝 Próximos Passos

Após a instalação:

1. Crie organizações (holdings)
2. Crie empresas vinculadas às holdings
3. Importe ou crie questões
4. Crie cadernos (templates) e atribua questões
5. Atribua cadernos às empresas
6. Convide usuários para responder os cadernos

---

## 🤝 Suporte

Se encontrar problemas durante a instalação:

1. Verifique se todos os pré-requisitos foram instalados
2. Confirme que as variáveis de ambiente estão corretas
3. Verifique os logs no terminal para mensagens de erro específicas
4. Consulte a documentação do Supabase: https://supabase.com/docs

---

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.
