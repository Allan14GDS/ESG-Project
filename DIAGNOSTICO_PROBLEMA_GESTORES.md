# DIAGNÓSTICO TÉCNICO: Por que Gestores NÃO veem respostas

## 🔴 PROBLEMA IDENTIFICADO

**Log crítico:** `[v0] Existing answers count: 0`

O gestor logado como `holding_admin` não está conseguindo buscar NENHUMA resposta do banco de dados Supabase.

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### Arquivo: `app/dashboard/questionnaire/[templateId]/page.tsx`

**Linha 193-206: Query de respostas**
\`\`\`typescript
let answersQuery = adminClient
    .from("book_answers")
    .select("question_id, value, value_jsonb, evidence_url, status, user_id, profiles:user_id(id, full_name, email)")
    .eq("template_id", templateId)

if (!isGestor) {
    answersQuery = answersQuery.eq("user_id", user.id)
} else if (holdingIdForSave) {
    // Gestores veem todas as respostas da holding
    answersQuery = answersQuery.eq("holding_id", holdingIdForSave)
} else if (companyIdForSave) {
    answersQuery = answersQuery.or(`company_id.eq.${companyIdForSave},company_id.is.null`)
}

console.log("[v0] Fetching answers - isGestor:", isGestor, "holdingId:", holdingIdForSave, "companyId:", companyIdForSave)

const { data: existingAnswers, error: answersError } = await answersQuery

console.log("[v0] Existing answers count:", existingAnswers?.length || 0)
\`\`\`

**Valores do log:**
- `isGestor: true` ✅
- `holdingId: null` ⚠️ **PROBLEMA AQUI**
- `companyId: d03a766c-6d48-465e-9e5c-da2ccca39537` ✅

---

## 🐛 CAUSA RAIZ DO PROBLEMA

### O que está acontecendo:

1. **O gestor é `holding_admin`** mas `holdingIdForSave = null`
2. **O código entra no `else if (holdingIdForSave)`** que é falso
3. **Depois entra no `else if (companyIdForSave)`** que aplica o filtro:
   \`\`\`sql
   WHERE company_id = 'd03a766c-6d48-465e-9e5c-da2ccca39537' OR company_id IS NULL
   \`\`\`

### Por que retorna 0 respostas:

**Cenário 1: Respostas não têm `company_id`**
- Se as respostas na tabela `book_answers` foram salvas com `company_id = NULL`, a query funcionaria
- Mas provavelmente as respostas têm um `company_id` diferente

**Cenário 2: Respostas têm outro `company_id`**
- Se as respostas foram salvas com um `company_id` diferente de `d03a766c-6d48-465e-9e5c-da2ccca39537`
- A query não retorna nada

**Cenário 3: Respostas têm `holding_id` mas o filtro não usa**
- Se as respostas têm `holding_id` preenchido na tabela
- Mas o código está usando `holdingIdForSave = null` (não busca do perfil corretamente)

---

## 🔧 ONDE BUSCAR `holdingIdForSave`

**Linha 152-176 da página:**
\`\`\`typescript
const { data: profile, error: profileError } = await adminClient
  .from("profiles")
  .select(
    `
    id,
    role,
    company_id,
    holding_id,
    companies!profiles_company_id_fkey(id, name, holding_id),
    holdings!profiles_holding_id_fkey(id, name)
  `
  )
  .eq("id", user.id)
  .single()

const userRole = profile?.role || "usuario"
const isGestor = userRole === "gestor" || userRole === "holding_admin" || userRole === "admin"

const companyId = (profile?.companies as any)?.id || profile?.company_id || null
const companyIdForSave = companyId
const holdingIdForSave = 
  (profile?.companies as any)?.holding_id || 
  (profile?.holdings as any)?.id || 
  profile?.holding_id || 
  null

console.log("[v0] Questionnaire IDs:", {
  companyId,
  companyIdForSave,
  holdingIdForSave,
  userId: user.id,
})
\`\`\`

**O log mostra:** `holdingIdForSave: null`

Isso significa que:
- `profile?.companies?.holding_id` = null
- `profile?.holdings?.id` = null  
- `profile?.holding_id` = null

---

## 🔬 VERIFICAÇÕES NECESSÁRIAS NO SUPABASE

### 1. Verificar estrutura do perfil do gestor

\`\`\`sql
SELECT 
  id,
  email,
  role,
  company_id,
  holding_id
FROM profiles
WHERE email = 'caio.moreno@grupocopa.com';
\`\`\`

**Esperado:** Ver se `holding_id` está preenchido

### 2. Verificar respostas existentes

\`\`\`sql
SELECT 
  id,
  question_id,
  user_id,
  company_id,
  holding_id,
  value,
  status
FROM book_answers
WHERE template_id = '{templateId}';
\`\`\`

**Esperado:** Ver quais `company_id` e `holding_id` as respostas têm

### 3. Verificar join com companies

\`\`\`sql
SELECT 
  p.id,
  p.email,
  p.role,
  p.company_id,
  p.holding_id,
  c.id as company_id_from_join,
  c.name as company_name,
  c.holding_id as holding_id_from_company
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email = 'caio.moreno@grupocopa.com';
\`\`\`

**Esperado:** Ver se o join está funcionando

---

## ✅ SOLUÇÕES POSSÍVEIS

### Solução 1: Remover filtro de holding/company para gestores (TEMPORÁRIA)

\`\`\`typescript
if (!isGestor) {
    answersQuery = answersQuery.eq("user_id", user.id)
}
// Se for gestor, busca TODAS as respostas do template (sem filtro)
\`\`\`

**Prós:** Gestor vê todas as respostas
**Contras:** Pode ver respostas de outras holdings (problema de segurança)

### Solução 2: Consertar o `holdingIdForSave`

Adicionar mais logs para debugar:
\`\`\`typescript
console.log("[v0] Profile data:", {
  companies: profile?.companies,
  holdings: profile?.holdings,
  company_id: profile?.company_id,
  holding_id: profile?.holding_id,
})
\`\`\`

### Solução 3: Usar `holding_id` da tabela `companies`

Se o perfil tem `company_id`, buscar o `holding_id` dessa company:
\`\`\`typescript
let finalHoldingId = holdingIdForSave

if (!finalHoldingId && companyId) {
  const { data: companyData } = await adminClient
    .from("companies")
    .select("holding_id")
    .eq("id", companyId)
    .single()
  
  finalHoldingId = companyData?.holding_id || null
}

console.log("[v0] Final holding ID:", finalHoldingId)

if (isGestor && finalHoldingId) {
  answersQuery = answersQuery.eq("holding_id", finalHoldingId)
}
\`\`\`

---

## 🎯 RECOMENDAÇÃO IMEDIATA

**Execute esta query no Supabase SQL Editor para confirmar:**

\`\`\`sql
-- 1. Dados do perfil
SELECT 'PROFILE DATA' as tipo, * FROM profiles WHERE email = 'caio.moreno@grupocopa.com';

-- 2. Company do perfil
SELECT 'COMPANY DATA' as tipo, c.* 
FROM profiles p
JOIN companies c ON c.id = p.company_id
WHERE p.email = 'caio.moreno@grupocopa.com';

-- 3. Respostas do template
SELECT 'ANSWERS DATA' as tipo, 
  ba.*,
  p.email as user_email,
  p.full_name as user_name
FROM book_answers ba
JOIN profiles p ON p.id = ba.user_id
WHERE ba.template_id = 'SEU_TEMPLATE_ID_AQUI'
LIMIT 10;
\`\`\`

Isso vai mostrar **EXATAMENTE** onde estão os dados e qual filtro usar.

---

## 📊 LABEL "Resposta do Usuário:" - O QUE FAZ

**Localização:** `components/questionnaire/questionnaire-form.tsx` linha 722

\`\`\`typescript
<Label className="text-sm font-medium">Resposta do Usuário:</Label>
{renderQuestionInputWithValue(question, answerValue)}
\`\`\`

**O que acontece:**
1. Loop em `userAnswers.map()` (linha 650)
2. Para cada answer, extrai `answerValue = answer.value`
3. Renderiza label "Resposta do Usuário:"
4. Chama `renderQuestionInputWithValue(question, answerValue)` que renderiza o input apropriado (texto, número, moeda, etc) com o valor

**POR QUE NÃO APARECE NADA:**
- `userAnswers.length = 0` porque a query retornou 0 respostas
- O código nem entra no `map()` 
- Nada é renderizado

**A lógica está correta**, o problema é que **`existingAnswers` está vazio** devido ao filtro SQL errado.

---

## 🚨 AÇÃO IMEDIATA

Vou implementar **Solução 3** agora + mais logs para diagnosticar.
