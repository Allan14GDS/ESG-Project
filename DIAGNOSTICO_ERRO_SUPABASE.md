# DIAGNÓSTICO COMPLETO: Por que as respostas não aparecem para gestores

## ❌ ERRO IDENTIFICADO NOS LOGS

\`\`\`
[v0] Query error: Could not embed because more than one relationship was found for 'book_answers' and 'user_id'
\`\`\`

**Tradução:** O Supabase não conseguiu executar a query porque há AMBIGUIDADE na relação entre as tabelas `book_answers` e `profiles`.

---

## 🔍 ANÁLISE DO PROBLEMA

### **1. Query Problemática (linha 195 do page.tsx)**

\`\`\`typescript
const { data: existingAnswers, error: answersError } = await adminClient
  .from("book_answers")
  .select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id, profiles:user_id(id, full_name, email)")
  //                                                                                               ^^^^^^^^^^^^^^
  //                                                                                        ESTE É O PROBLEMA
  .eq("template_id", templateId)
\`\`\`

### **2. Por que o erro acontece?**

A sintaxe `profiles:user_id(...)` está tentando fazer um **JOIN** entre `book_answers.user_id` e `profiles.id`.

**Problema:** No schema do Supabase, provavelmente existem **DUAS foreign keys** apontando para `profiles`:
- `book_answers.user_id` → `profiles.id`
- `book_answers.created_by` → `profiles.id` (ou outro campo similar)

Quando há múltiplas FKs para a mesma tabela, o Supabase **não sabe qual usar** e retorna esse erro.

### **3. Prova do problema**

\`\`\`
[v0] Answers count: 0  ← Query retornou ZERO resultados devido ao erro
[v0] Query error: Could not embed because more than one relationship was found...
\`\`\`

Mas quando buscamos sem o JOIN:

\`\`\`
[v0] Amostra de respostas no banco (qualquer template): [
  {"template_id":"4442ce21-715d-4891-b6bc-27aec281be16","user_id":"a2a38405-..."}
]
\`\`\`

As respostas **EXISTEM** no banco! O problema é a query JOIN.

---

## ✅ SOLUÇÃO

### **Opção 1: Remover o JOIN (Solução Rápida)**

Buscar as respostas **SEM** os dados do perfil, e depois buscar perfis separadamente se necessário.

\`\`\`typescript
// REMOVER ISTO:
.select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id, profiles:user_id(id, full_name, email)")

// USAR ISTO:
.select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id")
\`\`\`

**Depois**, buscar perfis em query separada:

\`\`\`typescript
const uniqueUserIds = [...new Set(existingAnswers.map(a => a.user_id))]
const { data: profiles } = await adminClient
  .from("profiles")
  .select("id, full_name, email")
  .in("id", uniqueUserIds)

// Mapear perfis para respostas
const profilesMap = {}
for (const profile of profiles) {
  profilesMap[profile.id] = profile
}

// Adicionar perfil a cada resposta
for (const answer of existingAnswers) {
  answer.profiles = profilesMap[answer.user_id]
}
\`\`\`

### **Opção 2: Especificar a FK correta (Solução Ideal)**

Se soubermos o nome exato da FK, podemos especificá-la:

\`\`\`typescript
.select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id, profiles!book_answers_user_id_fkey(id, full_name, email)")
//                                                                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                                                                        Nome exato da constraint FK
\`\`\`

**Como descobrir o nome da FK?**

Execute no Supabase SQL Editor:

\`\`\`sql
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS referenced_table,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND conrelid = 'book_answers'::regclass
  AND confrelid = 'profiles'::regclass;
\`\`\`

Resultado esperado:
\`\`\`
constraint_name              | table_name    | column_name | referenced_table | referenced_column
----------------------------+---------------+-------------+------------------+------------------
book_answers_user_id_fkey   | book_answers  | user_id     | profiles         | id
book_answers_created_by_fkey| book_answers  | created_by  | profiles         | id
\`\`\`

---

## 🔄 FLUXO ATUAL (QUEBRADO)

\`\`\`
1. SERVIDOR (page.tsx linha 195)
   ↓
   Query: SELECT ... profiles:user_id(...) FROM book_answers
   ↓
2. SUPABASE
   ↓
   ERRO: "more than one relationship was found"
   ↓
3. RESULTADO
   ↓
   existingAnswers = [] (VAZIO devido ao erro)
   ↓
4. TRANSFORMAÇÃO (linha 251-283)
   ↓
   answersByQuestion = {} (VAZIO)
   responsesMap = {} (VAZIO)
   ↓
5. COMPONENTE
   ↓
   userAnswers = answersByQuestion[question.id] = undefined = []
   ↓
6. RENDERIZAÇÃO
   ↓
   {isGestor && userAnswers.length > 0 ? (...) }
              ^^^^^^^^^^^^^^^^^^^^
              FALSE porque userAnswers = []
   ↓
7. RESULTADO FINAL
   ↓
   NADA APARECE para gestores
\`\`\`

---

## 📊 DADOS DO LOG QUE CONFIRMAM

\`\`\`javascript
// SERVIDOR
[v0] User Role: holding_admin
[v0] Is Gestor: true  ✅
[v0] Template ID: 4442ce21-715d-4891-b6bc-27aec281be16  ✅
[v0] FILTRO: Gestor - SEM FILTROS  ✅
[v0] Answers count: 0  ❌ (Erro na query)
[v0] Query error: Could not embed...  ❌ (ESTE É O PROBLEMA)
[v0] Respostas mapeadas: 0  ❌
[v0] Questões agrupadas: 0  ❌

// CLIENTE
[v0] existingAnswersKeys: []  ❌ (Recebeu objeto vazio)
[v0] answersByQuestionKeys: []  ❌ (Recebeu objeto vazio)
[v0] Estado inicial de responses: {}  ❌ (Não há dados para inicializar)
\`\`\`

---

## 🛠️ IMPLEMENTAÇÃO DA SOLUÇÃO (Opção 1 - Rápida)

### **Mudança no código (page.tsx)**

\`\`\`typescript
// ANTES (QUEBRADO)
let answersQuery = adminClient
  .from("book_answers")
  .select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id, profiles:user_id(id, full_name, email)")
  .eq("template_id", templateId)

// DEPOIS (FUNCIONANDO)
let answersQuery = adminClient
  .from("book_answers")
  .select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id")
  .eq("template_id", templateId)

const { data: existingAnswers, error: answersError } = await answersQuery

// Buscar perfis separadamente
if (existingAnswers && existingAnswers.length > 0) {
  const uniqueUserIds = [...new Set(existingAnswers.map(a => a.user_id))]
  
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniqueUserIds)
  
  // Criar mapa de perfis
  const profilesMap = {}
  if (profiles) {
    for (const profile of profiles) {
      profilesMap[profile.id] = profile
    }
  }
  
  // Adicionar perfil a cada resposta
  for (const answer of existingAnswers) {
    answer.profiles = profilesMap[answer.user_id] || null
  }
}
\`\`\`

---

## 📈 FLUXO APÓS CORREÇÃO

\`\`\`
1. SERVIDOR
   ↓
   Query: SELECT * FROM book_answers (SEM JOIN)
   ↓
2. SUPABASE
   ↓
   ✅ Retorna 10 respostas
   ↓
3. SERVIDOR (busca perfis)
   ↓
   Query: SELECT * FROM profiles WHERE id IN (user_ids)
   ↓
4. SUPABASE
   ↓
   ✅ Retorna 3 perfis
   ↓
5. TRANSFORMAÇÃO
   ↓
   answersByQuestion = {
     "q1": [{user_id: "abc", value: "Sim", profiles: {...}}],
     "q2": [{user_id: "abc", value: "42", profiles: {...}}],
   }
   responsesMap = {
     "q1": {value: "Sim", evidence_url: "..."},
     "q2": {value: "42", evidence_url: "..."},
   }
   ↓
6. COMPONENTE
   ↓
   userAnswers = answersByQuestion["q1"] = [{...}]
   userAnswers.length = 1  ✅
   ↓
7. RENDERIZAÇÃO
   ↓
   {isGestor && userAnswers.length > 0 ? (
     // AREA DE GESTORES APARECE ✅
     <div>
       <Label>Resposta do Usuário:</Label>
       {renderQuestionInputWithValue(question, "Sim")}
     </div>
   )}
\`\`\`

---

## 🎯 RESUMO EXECUTIVO

**PROBLEMA RAIZ:** Query com JOIN ambíguo falha silenciosamente, retornando 0 resultados.

**SINTOMA:** Gestores não veem respostas dos usuários.

**CAUSA TÉCNICA:** `profiles:user_id(...)` gera erro "more than one relationship" porque há múltiplas FKs apontando para `profiles`.

**SOLUÇÃO:** Remover JOIN da query principal e buscar perfis em query separada.

**IMPACTO:** Após correção, gestores verão TODAS as respostas do template nos campos preenchidos.

**TEMPO ESTIMADO:** 5 minutos para implementar solução Opção 1.
