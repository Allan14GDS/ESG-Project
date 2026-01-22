# Estrutura de Governança de Usuários - GRI 2 ESG App

## ⚠️ IMPORTANTE: Estrutura Real do Banco de Dados

**NÃO existe tabela `holdings` no Supabase!**

A estrutura real é:
```
organizations (empresas/organizações)
    ↓ (tem campo holding_id como UUID de referência)
    ↓
book_templates via company_templates (cadernos atribuídos)
    ↓
book_questions via book_question_junction (questões)
```

## 📊 Hierarquia de Dados Real

```
organizations (empresas com holding_id)
    ↓
Templates/Cadernos (book_templates)
    ↓
Questions (book_questions)
```

## 🗂️ Tabelas Principais de Governança

### 1. **organizations** - Empresas/Organizações
Armazena as organizações do sistema (ex: ESPM, teste123)

**Colunas principais:**
- `id` (uuid) - ID único da organização
- `name` (text) - Nome da organização (ex: "ESPM", "teste123")
- `holding_id` (uuid) - Referência UUID para a holding (pode ser null)
- `type` (user-defined) - Tipo de organização
- `cnpj` (text) - CNPJ da organização
- `industry` (text) - Setor
- `size` (text) - Tamanho

**Exemplo:**
```sql
-- Buscar todas as organizações
SELECT * FROM organizations ORDER BY name;

-- Buscar organizações de uma holding específica
SELECT * FROM organizations WHERE holding_id = 'uuid-da-holding';
```

---

### 2. **profiles** - Usuários do Sistema
Armazena os perfis dos usuários

**Colunas principais:**
- `id` (uuid) - ID do usuário (mesmo ID do Supabase Auth)
- `email` (text) - Email do usuário
- `full_name` (text) - Nome completo
- `role` (text) - Role do usuário: `admin_main`, `holding_admin`, `user`, `revisor`, `responder`
- `organization_id` (uuid) - FK para organizations (empresa principal do usuário)
- `is_active` (boolean) - Se o usuário está ativo

**Exemplo:**
```sql
SELECT p.*, o.name as organization_name
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.email = 'usuario@exemplo.com';
```

---

### 3. **organization_members** - Vínculo Usuário ↔ Organizações
**TABELA CHAVE PARA GOVERNANÇA!**

Tabela de junção que permite que um usuário tenha acesso a múltiplas organizações.

**Colunas principais:**
- `user_id` (uuid) - FK para profiles
- `organization_id` (uuid) - FK para organizations
- `role_in_org` (text) - Role específico na organização
- `created_at` (timestamp) - Data de criação

**Exemplo:**
```sql
-- Ver todas as organizações que um usuário tem acesso
SELECT om.*, o.name as organization_name, p.email
FROM organization_members om
LEFT JOIN organizations o ON o.id = om.organization_id
LEFT JOIN profiles p ON p.id = om.user_id
WHERE p.email = 'gestor@exemplo.com';
```

---

### 4. **companies** - Empresas (Tabela Legada)
Nota: Existe também uma tabela `companies` com estrutura similar. O sistema usa principalmente `organizations`.

**Colunas principais:**
- `id` (uuid) - ID único
- `name` (text) - Nome da empresa
- `holding_id` (uuid) - Referência para holding
- `cnpj` (text) - CNPJ

---

### 5. **book_templates** - Cadernos/Templates
Armazena os templates de cadernos (ex: GRI 2-1, GRI 2-2)

**Colunas principais:**
- `id` (uuid) - ID único do template
- `name` (text) - Nome do caderno (ex: "GRI 2-1")
- `description` (text) - Descrição
- `type` (text) - Tipo do caderno
- `created_by` (uuid) - Quem criou

**Exemplo:**
```sql
SELECT * FROM book_templates ORDER BY name;
```

---

### 6. **company_templates** - Atribuição de Cadernos às Empresas
Tabela de junção que vincula cadernos às organizações

**Colunas principais:**
- `id` (uuid) - ID único
- `company_id` (uuid) - FK para organizations
- `template_id` (uuid) - FK para book_templates
- `active` (boolean) - Se está ativo
- `assigned_by` (uuid) - Quem atribuiu

**Exemplo:**
```sql
SELECT ct.*, o.name as company_name, bt.name as template_name
FROM company_templates ct
LEFT JOIN organizations o ON o.id = ct.company_id
LEFT JOIN book_templates bt ON bt.id = ct.template_id
WHERE o.name = 'teste123' AND ct.active = true;
```

---

### 7. **book_questions** - Questões Únicas
Armazena as questões do banco de questões

**Colunas principais:**
- `id` (uuid) - ID único da questão
- `label` (text) - Label da questão (ex: "GRI 2-1")
- `type` (text) - Tipo de questão
- `unique_identifier` (text) - Identificador único
- `metadata` (jsonb) - Metadados adicionais

---

### 8. **book_question_junction** - Atribuição de Questões aos Cadernos
Tabela de junção que vincula questões aos cadernos

**Colunas principais:**
- `id` (uuid) - ID único
- `book_template_id` (uuid) - FK para book_templates
- `question_template_id` (uuid) - FK para book_questions
- `sort_order` (integer) - Ordem de exibição

**Exemplo:**
```sql
SELECT bqj.*, bt.name as template_name, bq.label as question_label
FROM book_question_junction bqj
LEFT JOIN book_templates bt ON bt.id = bqj.book_template_id
LEFT JOIN book_questions bq ON bq.id = bqj.question_template_id
WHERE bt.name = 'GRI 2-1'
ORDER BY bqj.sort_order;
```

---

## 🔐 Como Funciona a Governança

### Para Gestores (holding_admin):

1. **Acesso a Questões:**
   ```sql
   -- Busca todas as questões dos cadernos atribuídos às empresas do gestor
   SELECT DISTINCT bq.*
   FROM profiles p
   INNER JOIN organization_members om ON om.user_id = p.id
   INNER JOIN company_templates ct ON ct.company_id = om.organization_id
   INNER JOIN book_question_junction bqj ON bqj.book_template_id = ct.template_id
   INNER JOIN book_questions bq ON bq.id = bqj.question_template_id
   WHERE p.email = 'gestor@exemplo.com'
     AND ct.active = true;
   ```

2. **Acesso a Cadernos:**
   ```sql
   -- Busca todos os cadernos atribuídos às empresas do gestor
   SELECT DISTINCT bt.*
   FROM profiles p
   INNER JOIN organization_members om ON om.user_id = p.id
   INNER JOIN company_templates ct ON ct.company_id = om.organization_id
   INNER JOIN book_templates bt ON bt.id = ct.template_id
   WHERE p.email = 'gestor@exemplo.com'
     AND ct.active = true;
   ```

3. **Acesso a Usuários:**
   ```sql
   -- Busca todos os usuários das mesmas organizações do gestor
   SELECT DISTINCT p2.*
   FROM profiles p
   INNER JOIN organization_members om ON om.user_id = p.id
   INNER JOIN organization_members om2 ON om2.organization_id = om.organization_id
   INNER JOIN profiles p2 ON p2.id = om2.user_id
   WHERE p.email = 'gestor@exemplo.com'
     AND p2.role IN ('user', 'revisor', 'responder');
   ```

---

## 📝 Como Atribuir Acesso a um Gestor

### Exemplo: Atribuir holding ESPM → empresa teste123 a um gestor

### Passo 1: Verificar se a organização existe
```sql
-- Verificar se existe a organização
SELECT * FROM organizations WHERE name = 'teste123';

-- Se não existir, criar
INSERT INTO organizations (id, name, holding_id, type, cnpj)
VALUES (
  gen_random_uuid(),
  'teste123',
  'uuid-referencia-espm', -- UUID de referência para ESPM
  'company',
  '12.345.678/0001-90'
);
```

### Passo 2: Criar o perfil do gestor
```sql
INSERT INTO profiles (id, email, full_name, role, organization_id, is_active)
VALUES (
  'uuid-do-usuario-auth',
  'gestor@exemplo.com',
  'Nome do Gestor',
  'holding_admin',
  (SELECT id FROM organizations WHERE name = 'teste123'),
  true
);
```

### Passo 3: Adicionar o gestor à organização (TABELA CHAVE!)
```sql
-- Adiciona o gestor à organização teste123
INSERT INTO organization_members (user_id, organization_id, role_in_org)
VALUES (
  'uuid-do-usuario-auth',
  (SELECT id FROM organizations WHERE name = 'teste123'),
  'holding_admin'
);
```

### Passo 4: Atribuir cadernos à empresa
```sql
-- Atribui o caderno "GRI 2-1" à empresa teste123
INSERT INTO company_templates (company_id, template_id, active, assigned_by)
VALUES (
  (SELECT id FROM organizations WHERE name = 'teste123'),
  (SELECT id FROM book_templates WHERE name = 'GRI 2-1'),
  true,
  'uuid-do-admin-que-atribuiu'
);
```

### Passo 5: Verificar o acesso
```sql
-- Verifica quais cadernos o gestor tem acesso
SELECT DISTINCT 
  bt.name as caderno, 
  o.name as empresa,
  p.email as gestor_email
FROM profiles p
INNER JOIN organization_members om ON om.user_id = p.id
INNER JOIN organizations o ON o.id = om.organization_id
INNER JOIN company_templates ct ON ct.company_id = o.id
INNER JOIN book_templates bt ON bt.id = ct.template_id
WHERE p.email = 'gestor@exemplo.com'
  AND ct.active = true;
```

---

## 🎯 Resumo da Estrutura

**Para dar acesso a um gestor à empresa teste123 (com referência à holding ESPM):**

1. ✅ Certifique-se que a organização "teste123" existe em `organizations`
2. ✅ O campo `holding_id` em `organizations` pode conter um UUID de referência para ESPM
3. ✅ Crie o perfil do gestor em `profiles` com `role = 'holding_admin'`
4. ✅ **CRUCIAL**: Adicione o vínculo em `organization_members` entre o gestor e a empresa teste123
5. ✅ Atribua os cadernos à empresa em `company_templates`
6. ✅ As questões já estarão vinculadas aos cadernos através de `book_question_junction`

---

## 🔍 Queries Úteis para Debug

### Ver toda a estrutura de organizações
```sql
SELECT 
  o.name as organizacao,
  o.holding_id,
  bt.name as caderno,
  COUNT(DISTINCT bq.id) as total_questoes
FROM organizations o
LEFT JOIN company_templates ct ON ct.company_id = o.id AND ct.active = true
LEFT JOIN book_templates bt ON bt.id = ct.template_id
LEFT JOIN book_question_junction bqj ON bqj.book_template_id = bt.id
LEFT JOIN book_questions bq ON bq.id = bqj.question_template_id
GROUP BY o.name, o.holding_id, bt.name
ORDER BY o.name, bt.name;
```

### Ver todos os acessos de um usuário
```sql
SELECT 
  p.email,
  p.role,
  o.name as organization,
  om.role_in_org
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'usuario@exemplo.com';
```

### Ver quantos cadernos cada empresa tem
```sql
SELECT 
  o.name as empresa,
  COUNT(DISTINCT ct.template_id) as total_cadernos
FROM organizations o
LEFT JOIN company_templates ct ON ct.company_id = o.id AND ct.active = true
GROUP BY o.name
ORDER BY total_cadernos DESC;
```

### Verificar se um usuário tem acesso a uma organização
```sql
SELECT 
  p.email,
  o.name as organizacao,
  om.role_in_org,
  om.created_at
FROM profiles p
INNER JOIN organization_members om ON om.user_id = p.id
INNER JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'gestor@exemplo.com' 
  AND o.name = 'teste123';
