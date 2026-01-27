# Documentação Completa - GRI 2 ESG App (b.kick Platform)

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Controles de Telas e Navegação](#controles-de-telas-e-navegação)
3. [Governança e Hierarquia de Usuários](#governança-e-hierarquia-de-usuários)
4. [Regras de Adição de Cadernos, Holdings, Companies e Questões](#regras-de-adição)
5. [Fluxos de Trabalho Principais](#fluxos-de-trabalho-principais)
6. [Arquitetura de Banco de Dados](#arquitetura-de-banco-de-dados)

---

## 1. Visão Geral do Sistema

### Propósito
O **b.kick Platform** (GRI 2 ESG App) é uma plataforma de gestão ESG (Environmental, Social, Governance) que permite:
- Organizar empresas em holdings e companies
- Atribuir cadernos/templates de questões ESG (baseados no GRI - Global Reporting Initiative)
- Gerenciar usuários com diferentes níveis de acesso
- Acompanhar preenchimento de questões por diferentes respondentes
- Revisar e aprovar respostas através de um sistema de governança
- Exportar relatórios de conformidade ESG

### Tecnologias Principais
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js Server Actions, Supabase (PostgreSQL)
- **UI**: Tailwind CSS, shadcn/ui
- **Autenticação**: Supabase Auth
- **Database**: Supabase (PostgreSQL com Row Level Security)

---

## 2. Controles de Telas e Navegação

### 2.1 Estrutura de Rotas

#### Rotas Públicas (Autenticação)
\`\`\`
/auth/login          → Login page
/auth/signup         → Signup page (criar conta)
/auth/logout         → Logout handler
/auth/forgot-password → Reset de senha (se implementado)
\`\`\`

#### Rotas do Dashboard (Usuários Autenticados)
\`\`\`
/dashboard                           → Dashboard principal com KPIs
/dashboard/meus-cadernos            → Lista de cadernos atribuídos ao usuário
/dashboard/cadernos-gestao          → Gestão de cadernos (gestor+)
/dashboard/questionnaire/[templateId] → Preencher questões de um caderno
/dashboard/cadernos/[id]            → Detalhes de um caderno
/dashboard/cadernos/gri2-7-401-ifrs → Caderno GRI específico
/dashboard/historico                → Histórico de revisões e auditoria
/dashboard/questions                → Gerenciar questões (gestor+)
/dashboard/users                    → Gerenciar usuários (gestor+)
/dashboard/status                   → Kanban board (acompanhamento)
/dashboard/analytics                → Analytics e métricas
/dashboard/export                   → Exportar relatórios
/dashboard/employees                → Dados de funcionários
/dashboard/governance               → Seção de governança
/dashboard/disclosures/[id]         → Disclosure específico
/dashboard/organization             → Configurar organização
\`\`\`

#### Rotas Administrativas (Admin Main + Holding Admin)
\`\`\`
/admin                                    → Central de comando admin
/admin/holdings                           → Gerenciar holdings
/admin/holdings/[holdingId]              → Detalhes de uma holding
/admin/holdings/[holdingId]/create-company → Criar empresa em holding
/admin/templates                          → Gerenciar templates de cadernos
/admin/templates/[templateId]            → Editar template
/admin/templates/[templateId]/edit       → Editar template (form)
/admin/templates/[templateId]/questions  → Gerenciar questões do template
/admin/templates/create                  → Criar novo template
/admin/templates/books/[bookId]          → Gerenciar book template
/admin/questions                         → Biblioteca de questões
/admin/users                             → Gerenciar todos os usuários
/admin/users/[userId]/access            → Gerenciar acessos do usuário
/admin/users/invite                     → Convidar novos usuários
\`\`\`

### 2.2 Navegação por Perfil de Usuário

#### Usuário Regular (user, revisor, responder, company_admin)
**Menu Principal: Cadernos**
- Meus Cadernos → `/dashboard/meus-cadernos`
- Histórico → `/dashboard/historico`

#### Gestor (holding_admin)
**Menu Principal: Cadernos**
- Meus Cadernos → `/dashboard/meus-cadernos`
- Gerenciar Cadernos → `/dashboard/cadernos-gestao`
- Gerenciar Questões → `/dashboard/questions`
- Gerenciar Usuários → `/dashboard/users`
- Histórico de Revisões → `/dashboard/historico`

#### Admin Principal (admin_main)
**Seção 1: Central de Comando**
- Dashboard Admin → `/admin`
- Holdings → `/admin/holdings`
- Templates → `/admin/templates`
- Questões Admin → `/admin/questions`
- Usuários Admin → `/admin/users`

**Seção 2: Visão e Acompanhamento**
- Kanban → `/dashboard/status`
- Analytics → `/dashboard/analytics`
- Exportação → `/dashboard/export`
- Histórico de Revisões → `/dashboard/historico`

**Seção 3: Cadernos**
- Meus Cadernos → `/dashboard/meus-cadernos`
- Gerenciar Cadernos → `/dashboard/cadernos-gestao`
- Gerenciar Questões → `/dashboard/questions`
- Gerenciar Usuários → `/dashboard/users`

### 2.3 Proteção de Rotas

#### Dashboard Layout (`/app/dashboard/layout.tsx`)
- **Proteção**: Requer autenticação via Supabase Auth
- **Comportamento**: 
  - Se não autenticado → redirect para `/auth/login`
  - Busca perfil do usuário com retry (3 tentativas)
  - **Não há restrição de role** - todos os usuários autenticados podem acessar o dashboard

#### Admin Layout (`/app/admin/layout.tsx`)
- **Proteção**: Requer autenticação + role específica
- **Roles permitidas**: `admin_main` ou `holding_admin`
- **Comportamento**:
  - Se não autenticado → redirect para `/auth/login`
  - Se não possui role adequada → redirect para `/dashboard`
  - Se `is_active = false` → redirect para `/dashboard`
  - Usa `getAdminClient()` para bypass RLS policies

#### Funções de Proteção (`lib/auth-utils.ts`)
\`\`\`typescript
requireAdmin()      // Admin_main apenas
requireGestor()     // Admin_main ou holding_admin
requireAuth()       // Qualquer usuário autenticado
\`\`\`

---

## 3. Governança e Hierarquia de Usuários

### 3.1 Roles do Sistema

O sistema define 6 tipos de usuários:

\`\`\`typescript
type UserRole = 
  | "admin_main"      // Administrador principal (super-admin)
  | "holding_admin"   // Gestor de holding/corporate
  | "company_admin"   // Administrador de empresa
  | "revisor"         // Revisor/auditor de respostas
  | "user"            // Usuário padrão/respondente
  | "responder"       // Respondente de dados
\`\`\`

### 3.2 Hierarquia e Permissões

#### Admin Main (admin_main)
**Acesso Total ao Sistema**
- ✅ Criar/editar/deletar holdings
- ✅ Criar/editar/deletar companies/organizations
- ✅ Criar/editar/deletar templates de cadernos
- ✅ Criar/editar/deletar questões
- ✅ Atribuir cadernos a qualquer empresa
- ✅ Criar/convidar/gerenciar todos os usuários
- ✅ Ver respostas de todos os usuários
- ✅ Aprovar/rejeitar/solicitar revisão de qualquer resposta
- ✅ Acesso completo ao painel admin (`/admin`)
- ✅ Exportar relatórios de qualquer organização

**Navegação**: 3 seções completas (Central de Comando, Visão, Cadernos)

#### Holding Admin (holding_admin) - Gestor
**Acesso Limitado a Suas Holdings e Companies**
- ✅ Ver companies vinculadas às suas holdings
- ✅ Atribuir cadernos às suas companies
- ✅ Ver/gerenciar questões dos cadernos atribuídos
- ✅ Convidar/gerenciar usuários das suas organizations
- ✅ Ver respostas dos usuários das suas companies
- ✅ Aprovar/rejeitar/solicitar revisão nas suas companies
- ✅ Acesso ao painel admin (`/admin`) - limitado aos seus dados
- ❌ NÃO pode criar holdings ou templates globais
- ❌ NÃO pode ver dados de outras holdings

**Navegação**: Seção de Cadernos com gestão

#### Company Admin (company_admin)
**Acesso Limitado à Sua Company**
- ✅ Ver cadernos atribuídos à sua empresa
- ✅ Responder questões dos cadernos
- ✅ Ver respostas da sua empresa
- ❌ NÃO pode aprovar/rejeitar respostas
- ❌ NÃO pode gerenciar outros usuários
- ❌ NÃO pode atribuir cadernos

**Navegação**: Menu básico de usuário

#### Revisor (revisor)
**Foco em Revisão e Auditoria**
- ✅ Ver respostas da sua organization
- ✅ Solicitar ajustes em respostas
- ✅ Aprovar respostas (se tiver permissão)
- ✅ Comentar em questões
- ✅ Ver histórico de revisões
- ❌ NÃO pode responder questões
- ❌ NÃO pode atribuir cadernos

**Navegação**: Menu básico de usuário

#### User (user) / Responder (responder)
**Respondentes de Questões**
- ✅ Ver cadernos atribuídos a eles
- ✅ Responder questões dos cadernos
- ✅ Upload de evidências
- ✅ Ver histórico das suas respostas
- ❌ NÃO pode ver respostas de outros usuários
- ❌ NÃO pode aprovar/rejeitar
- ❌ NÃO pode gerenciar nada

**Navegação**: Menu básico (Meus Cadernos + Histórico)

### 3.3 Governança de Respostas

#### Sistema de Status de Respostas
Cada resposta (`book_answers`) pode ter um dos seguintes status:

\`\`\`typescript
type AnswerStatus = 
  | "rascunho"        // Draft - em preenchimento
  | "aguardando_revisao"  // Enviado para revisão
  | "revisao"         // Gestor solicitou ajustes
  | "aprovado"        // Gestor aprovou
  | "rejeitado"       // Gestor rejeitou (deprecated)
\`\`\`

#### Fluxo de Aprovação

1. **Usuário Preenche Questão**
   - Status inicial: `rascunho`
   - Usuário pode editar livremente

2. **Usuário Envia para Revisão**
   - Status muda para: `aguardando_revisao`
   - Gestor é notificado

3. **Gestor Revisa**
   - **Aprovar**: Status → `aprovado`
   - **Solicitar Ajuste**: Status → `revisao` + adiciona comentário
   - ~~**Reprovar**: (removido do sistema)~~

4. **Usuário Corrige**
   - Se status = `revisao`, usuário vê alerta
   - Usuário corrige e reenvia
   - Status volta para `aguardando_revisao`

#### Review Panel (Painel de Revisão)
**Componente**: `components/questionnaire/review-panel.tsx`

**Para Gestores**:
- Mostra resposta do usuário
- Campo para observações
- Botões:
  - 🟡 **Solicitar Ajuste** (exige comentário)
  - 🟢 **Aprovar Questão**

**Regras**:
- Comentário obrigatório para solicitar ajuste
- Comentário opcional para aprovar
- Ações registradas em `comment_history`

### 3.4 Controle de Acesso via organization_members

**Tabela Chave**: `organization_members`

Essa tabela vincula usuários a múltiplas organizations:

\`\`\`sql
organization_members (
  user_id         uuid,  -- FK profiles
  organization_id uuid,  -- FK organizations
  role_in_org     text   -- Role específica nesta org
)
\`\`\`

**Exemplo de Verificação de Acesso**:

\`\`\`typescript
// lib/auth-utils.ts
async function getUserOrganizationIds(userId: string): Promise<string[]> {
  const { data } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
  
  return data?.map(m => m.organization_id) || []
}
\`\`\`

---

## 4. Regras de Adição de Cadernos, Holdings, Companies e Questões

### 4.1 Criar Holdings

**Quem pode**: Apenas `admin_main`
**Onde**: `/admin/holdings` → botão "Criar Holding"
**Rota**: `/admin/create-holding`

**Campos obrigatórios**:
- Nome da Holding
- CNPJ (único no sistema)

**Processo**:
1. Admin preenche formulário
2. Sistema valida CNPJ único
3. Cria registro em `organizations` com:
   - `type = 'holding'`
   - `holding_id = NULL` (é a holding raiz)

**Peculiaridades**:
- ⚠️ **NÃO existe tabela `holdings` separada**
- Holdings são registros na tabela `organizations` com `type = 'holding'`
- O campo `holding_id` em organizations serve apenas como referência UUID

### 4.2 Criar Companies

**Quem pode**: `admin_main` ou `holding_admin` (da holding pai)
**Onde**: 
- Admin: `/admin/holdings/[holdingId]/create-company`
- Holding: `/holding/[holdingId]/create-company`

**Campos obrigatórios**:
- Nome da Empresa
- CNPJ (único no sistema)
- Setor (industry)
- Tamanho (size)

**Processo**:
1. Seleciona holding pai
2. Preenche formulário
3. Sistema cria registro em `organizations` com:
   - `type = 'company'`
   - `holding_id = UUID da holding` (referência)

**Peculiaridades**:
- Company é filha da holding via campo `holding_id`
- **Observação**: Existe também tabela `companies` legacy, mas o sistema usa `organizations`
- Um gestor só pode criar companies nas holdings onde tem acesso via `organization_members`

### 4.3 Criar Templates de Cadernos (book_templates)

**Quem pode**: Apenas `admin_main`
**Onde**: `/admin/templates` → botão "Criar Template"
**Rota**: `/admin/templates/create`

**Campos obrigatórios**:
- Nome do Template (ex: "GRI 2-1")
- Descrição
- Tipo do caderno

**Processo**:
1. Admin cria template vazio
2. Sistema cria registro em `book_templates`
3. Admin adiciona questões ao template via `/admin/templates/[templateId]/questions`

**Peculiaridades**:
- Template é global - pode ser atribuído a qualquer company
- Template sem questões não aparece para usuários
- Cada template tem ID único UUID

### 4.4 Criar Questões (book_questions)

**Quem pode**: Apenas `admin_main`
**Onde**: `/admin/questions` → botão "Criar Questão"
**Rota**: `/admin/templates/create-question`

**Campos obrigatórios**:
- Label da questão (ex: "GRI 2-1")
- Tipo de questão (text, number, select, etc.)
- Identificador único (unique_identifier)

**Processo**:
1. Admin cria questão na biblioteca global
2. Sistema cria registro em `book_questions`
3. Admin atribui questão a templates via `book_question_junction`

**Peculiaridades**:
- Questão é reutilizável - pode estar em múltiplos templates
- **Importante**: `unique_identifier` deve ser único no sistema
- Questões têm metadados em JSONB para flexibilidade
- Ordem de exibição controlada por `sort_order` na junction

### 4.5 Atribuir Cadernos a Companies

**Quem pode**: `admin_main` ou `holding_admin` (gestores)
**Onde**: 
- `/dashboard/cadernos-gestao` (para gestores)
- `/company/[companyId]/assign-template` (admin)

**Processo**:
1. Gestor/admin seleciona company
2. Escolhe template da lista disponível
3. Sistema cria vínculo em `company_templates`:
   \`\`\`sql
   INSERT INTO company_templates (
     company_id,
     template_id,
     active,
     assigned_by
   ) VALUES (...)
   \`\`\`

**Peculiaridades**:
- Um template pode ser atribuído a múltiplas companies
- Atribuição cria "instância" do template para a company
- `active = false` pode desativar atribuição sem deletar
- Holding_admin só atribui para companies das suas holdings

### 4.6 Atribuir Usuários a Questões

**Quem pode**: `admin_main` ou `holding_admin`
**Onde**: `/dashboard/cadernos-gestao` ou `/admin/users/[userId]/access`

**Processo**:
1. Gestor seleciona usuário
2. Atribui cadernos específicos ao usuário
3. Sistema cria vínculo em `user_book_assignments`:
   \`\`\`sql
   INSERT INTO user_book_assignments (
     user_id,
     template_id,
     company_id,
     assigned_by
   ) VALUES (...)
   \`\`\`

**Peculiaridades**:
- Usuário vê apenas cadernos atribuídos a ele
- Atribuição é por (usuário + template + company)
- Um usuário pode ter múltiplas atribuições

---

## 5. Fluxos de Trabalho Principais

### 5.1 Fluxo de Onboarding de Empresa

\`\`\`
1. Admin_main cria Holding
   ↓
2. Admin_main cria Company vinculada à Holding
   ↓
3. Admin_main atribui Templates à Company
   ↓
4. Admin_main convida Holding_admin para gerenciar
   ↓
5. Admin_main adiciona Holding_admin à organization via organization_members
   ↓
6. Holding_admin convida usuários respondentes
   ↓
7. Holding_admin atribui cadernos aos usuários
\`\`\`

### 5.2 Fluxo de Preenchimento de Caderno

\`\`\`
1. Usuário acessa /dashboard/meus-cadernos
   ↓
2. Vê lista de cadernos atribuídos a ele
   ↓
3. Clica em caderno → /dashboard/questionnaire/[templateId]
   ↓
4. Preenche questões uma por uma
   ↓
5. Sistema salva automaticamente (status: rascunho)
   ↓
6. Usuário clica "Enviar para Revisão"
   ↓
7. Status muda para "aguardando_revisao"
\`\`\`

### 5.3 Fluxo de Revisão de Respostas

\`\`\`
1. Gestor acessa /dashboard/cadernos-gestao
   ↓
2. Vê lista de cadernos com respostas pendentes
   ↓
3. Clica em caderno → /dashboard/questionnaire/[templateId]
   ↓
4. Sistema mostra respostas de TODOS os usuários (gestor mode)
   ↓
5. Gestor abre Review Panel para cada questão
   ↓
6. Opção A: Aprovar (status → aprovado)
   OU
   Opção B: Solicitar Ajuste (status → revisao + comentário)
   ↓
7. Usuário recebe alerta de correção pendente
   ↓
8. Usuário corrige e reenvia (status → aguardando_revisao)
\`\`\`

### 5.4 Fluxo de Criação de Template

\`\`\`
1. Admin_main acessa /admin/templates
   ↓
2. Clica "Criar Template"
   ↓
3. Preenche nome, descrição, tipo
   ↓
4. Template criado (vazio)
   ↓
5. Admin acessa /admin/templates/[templateId]/questions
   ↓
6. Adiciona questões do banco de questões global
   ↓
7. Define ordem de exibição (sort_order)
   ↓
8. Template pronto para ser atribuído
\`\`\`

---

## 6. Arquitetura de Banco de Dados

### 6.1 Tabelas Principais

#### profiles (Usuários)
\`\`\`sql
profiles (
  id              uuid PRIMARY KEY,
  email           text UNIQUE NOT NULL,
  full_name       text,
  role            text NOT NULL, -- user_role enum
  is_active       boolean DEFAULT true,
  organization_id uuid REFERENCES organizations(id),
  created_at      timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- `id` é o mesmo ID do Supabase Auth
- `organization_id` é a organização "principal" do usuário
- Role define permissões globais

#### organizations (Holdings + Companies)
\`\`\`sql
organizations (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  cnpj        text UNIQUE,
  type        text, -- 'holding' ou 'company'
  holding_id  uuid, -- Referência UUID para holding pai
  industry    text,
  size        text,
  created_at  timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- **NÃO existe tabela holdings separada**
- `type = 'holding'` indica que é holding
- `type = 'company'` indica que é empresa
- `holding_id` é apenas referência UUID, não FK

#### organization_members (Vínculo Usuário ↔ Organização)
\`\`\`sql
organization_members (
  user_id         uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  role_in_org     text,
  created_at      timestamp DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
)
\`\`\`

**Observações**:
- **TABELA CHAVE** para governança
- Permite usuário ter acesso a múltiplas organizations
- Gestor deve estar em `organization_members` para ver dados

#### book_templates (Templates de Cadernos)
\`\`\`sql
book_templates (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  description text,
  type        text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- Template global, reutilizável
- Exemplos: "GRI 2-1", "GRI 2-2", etc.

#### book_questions (Banco de Questões)
\`\`\`sql
book_questions (
  id                uuid PRIMARY KEY,
  label             text NOT NULL,
  type              text NOT NULL, -- text, number, select, etc.
  unique_identifier text UNIQUE NOT NULL,
  metadata          jsonb,
  created_at        timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- Questão global, reutilizável
- `unique_identifier` deve ser único
- `metadata` armazena configurações específicas do tipo

#### book_question_junction (Questões ↔ Templates)
\`\`\`sql
book_question_junction (
  id                   uuid PRIMARY KEY,
  book_template_id     uuid REFERENCES book_templates(id),
  question_template_id uuid REFERENCES book_questions(id),
  sort_order           integer,
  comment              text,
  created_at           timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- Vincula questões a templates
- `sort_order` define ordem de exibição
- `comment` pode ter observações do gestor

#### company_templates (Templates ↔ Companies)
\`\`\`sql
company_templates (
  id          uuid PRIMARY KEY,
  company_id  uuid REFERENCES organizations(id),
  template_id uuid REFERENCES book_templates(id),
  active      boolean DEFAULT true,
  assigned_by uuid REFERENCES profiles(id),
  created_at  timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- Atribui template a uma company
- `active = false` desativa sem deletar

#### book_answers (Respostas dos Usuários)
\`\`\`sql
book_answers (
  id           uuid PRIMARY KEY,
  template_id  uuid REFERENCES book_templates(id),
  question_id  uuid REFERENCES book_questions(id),
  user_id      uuid REFERENCES profiles(id),
  company_id   uuid REFERENCES organizations(id),
  holding_id   uuid, -- Referência UUID
  value        text,
  value_jsonb  jsonb,
  evidence_url text,
  status       text DEFAULT 'rascunho',
  updated_at   timestamp DEFAULT now(),
  created_at   timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- Armazena respostas dos usuários
- `value` para respostas simples
- `value_jsonb` para respostas complexas
- `status`: rascunho, aguardando_revisao, revisao, aprovado
- `company_id` e `holding_id` podem ser NULL

#### comment_history (Histórico de Revisões)
\`\`\`sql
comment_history (
  id                      uuid PRIMARY KEY,
  book_template_id        uuid REFERENCES book_templates(id),
  question_template_id    uuid REFERENCES book_questions(id),
  user_id                 uuid REFERENCES profiles(id),
  company_id              uuid,
  comment                 text NOT NULL,
  question_generated_at   timestamp DEFAULT now(),
  created_at              timestamp DEFAULT now()
)
\`\`\`

**Observações**:
- Registra todas as ações de revisão
- Formato do comentário: `[AÇÃO] mensagem`
- Exemplos: "[APROVADO]", "[REVISÃO SOLICITADA]", etc.

### 6.2 Relacionamentos Importantes

\`\`\`
profiles
  ↓ (1:N via organization_members)
organizations
  ↓ (1:N via company_templates)
book_templates
  ↓ (N:M via book_question_junction)
book_questions
  ↓ (1:N via book_answers)
book_answers (respostas dos usuários)
\`\`\`

### 6.3 Queries Críticas para Gestores

#### Buscar todas as companies de um gestor
\`\`\`sql
SELECT DISTINCT o.*
FROM profiles p
INNER JOIN organization_members om ON om.user_id = p.id
INNER JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'gestor@exemplo.com'
  AND o.type = 'company';
\`\`\`

#### Buscar cadernos atribuídos às companies do gestor
\`\`\`sql
SELECT DISTINCT bt.*
FROM profiles p
INNER JOIN organization_members om ON om.user_id = p.id
INNER JOIN company_templates ct ON ct.company_id = om.organization_id
INNER JOIN book_templates bt ON bt.id = ct.template_id
WHERE p.email = 'gestor@exemplo.com'
  AND ct.active = true;
\`\`\`

#### Buscar respostas dos usuários nas companies do gestor
\`\`\`sql
SELECT ba.*, bq.label, p.full_name
FROM profiles p_gestor
INNER JOIN organization_members om ON om.user_id = p_gestor.id
INNER JOIN book_answers ba ON ba.company_id = om.organization_id
INNER JOIN book_questions bq ON bq.id = ba.question_id
INNER JOIN profiles p ON p.id = ba.user_id
WHERE p_gestor.email = 'gestor@exemplo.com';
\`\`\`

---

## Resumo Executivo

### Para Adicionar Nova Empresa ao Sistema:
1. Admin cria holding (se não existir)
2. Admin cria company vinculada à holding
3. Admin atribui templates à company
4. Admin convida gestor
5. Admin adiciona gestor em `organization_members`
6. Gestor atribui cadernos aos usuários

### Para Novo Usuário Preencher Cadernos:
1. Gestor convida usuário
2. Gestor atribui cadernos ao usuário
3. Usuário acessa `/dashboard/meus-cadernos`
4. Usuário preenche e envia para revisão
5. Gestor aprova ou solicita ajustes

### Hierarquia de Permissões:
\`\`\`
admin_main (super-admin)
  ↓
holding_admin (gestor de holding)
  ↓
company_admin (gestor de empresa)
  ↓
revisor (revisor/auditor)
  ↓
user/responder (respondentes)
\`\`\`
