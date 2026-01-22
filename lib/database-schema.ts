/**
 * ============================================
 * DATABASE SCHEMA DOCUMENTATION
 * ============================================
 *
 * ESTRUTURA CLARA DO BANCO DE DADOS:
 *
 * 1. book_templates (CADERNOS)
 *    Todos os cadernos criados para relatórios ESG.
 *    Ex: "GRI 2 + Aneel", "GRI 201-207 + IFRS"
 *
 * 2. master_questions (BANCO DE QUESTÕES)
 *    Todas as questões criadas. Uma questão pode estar em múltiplos cadernos.
 *    Contém: frameworks, disclosure, linha_coleta, tipo_resposta, etc.
 *
 * 3. book_questions (JUNÇÃO: questões ↔ cadernos)
 *    Liga questões aos cadernos. Uma questão pode pertencer a vários cadernos.
 *    Colunas: template_id (FK -> book_templates.id), question_id (FK -> master_questions.id)
 *
 * 4. company_templates (JUNÇÃO: cadernos ↔ empresas)
 *    Atribui cadernos às empresas para os usuários responderem.
 *
 * FLUXO:
 * 1. Admin cria CADERNOS em book_templates
 * 2. Admin cria QUESTÕES em master_questions
 * 3. Admin vincula QUESTÕES aos CADERNOS via book_questions
 * 4. Admin atribui CADERNOS às EMPRESAS via company_templates
 * 5. Usuários respondem as questões dos cadernos atribuídos
 */

// ============================================
// NOMES DAS TABELAS (para queries Supabase)
// ============================================

export const TABLES = {
  /** Cadernos/Books - Ex: "GRI 2 + Aneel" */
  BOOKS: "book_templates",

  /** Banco master de questões */
  QUESTIONS: "master_questions",

  /** Junção: questões ↔ cadernos */
  BOOK_QUESTIONS: "book_questions",

  /** Junção: cadernos ↔ empresas */
  COMPANY_BOOKS: "company_templates",
} as const

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * BOOK (Caderno)
 * Um caderno contendo múltiplas questões para relatórios ESG
 */
export interface Book {
  id: string
  name: string
  description: string | null
  type: string | null // Categoria: "governanca", "ambiental", "social", "organizacional"
  responsable_name: string | null
  responsable_id: string | null
  created_by: string | null
  created_at: string
}

/**
 * QUESTION (Questão Master)
 * Uma questão no banco master de questões
 * Pode ser vinculada a múltiplos cadernos
 */
export interface Question {
  id: string
  frameworks: Array<{
    name: string // "GRI", "ANEEL", "IFRS"
    sub1?: string // Sub-framework nível 1
    sub2?: string // Sub-framework nível 2
    sub3?: string // Sub-framework nível 3
  }> | null
  disclosure: string | null // Ex: "2-1 Detalhes organizacionais"
  linha_coleta: string | null // Texto da questão - Ex: "Informe a razão social"
  tipo_resposta: string | null // "Texto", "Número", "Data", "Booleano", "Arquivo", "Seleção"
  evidencias: string | null // Ex: "Contrato social"
  obs_nao_aplicavel: string | null
  created_by: string | null
  created_at: string
  updated_at: string | null
}

/**
 * BOOK_QUESTION (Junção)
 * Vincula uma questão a um caderno
 *
 * IMPORTANTE: A coluna é "template_id" (não "book_template_id")
 */
export interface BookQuestion {
  id: string
  template_id: string // book_templates.id (O CADERNO) - ATENÇÃO: coluna real é "template_id"
  question_id: string // master_questions.id (A QUESTÃO)
  sort_order: number
  created_at: string
}

/**
 * COMPANY_BOOK (Junção)
 * Atribui um caderno a uma empresa
 */
export interface CompanyBook {
  id: string
  template_id: string // book_templates.id
  company_id: string // companies.id
  assigned_by: string | null
  assigned_at: string
  active: boolean
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retorna a cor da categoria baseada no tipo do caderno
 */
export function getCategoryColor(type: string | null): string {
  const colors: Record<string, string> = {
    governanca: "bg-purple-100 text-purple-800 border-purple-300",
    ambiental: "bg-teal-100 text-teal-800 border-teal-300",
    social: "bg-pink-100 text-pink-800 border-pink-300",
    organizacional: "bg-blue-100 text-blue-800 border-blue-300",
    economico: "bg-amber-100 text-amber-800 border-amber-300",
  }
  return colors[type?.toLowerCase() || ""] || "bg-gray-100 text-gray-800 border-gray-300"
}

/**
 * Retorna a cor da borda da categoria para cards
 */
export function getCategoryBorderColor(type: string | null): string {
  const colors: Record<string, string> = {
    governanca: "border-l-purple-500",
    ambiental: "border-l-teal-500",
    social: "border-l-pink-500",
    organizacional: "border-l-blue-500",
    economico: "border-l-amber-500",
  }
  return colors[type?.toLowerCase() || ""] || "border-l-gray-500"
}
