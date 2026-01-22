// =============================================================================
// TIPOS DO BANCO DE DADOS - GRI ESG APP
// =============================================================================
//
// NOMENCLATURA CLARA:
//
// 1. Book     = Caderno/Template (GRI 2+Aneel, GRI 201-207, etc.)
// 2. Question = Questão do banco master
// 3. BookQuestion = Junção: conecta questões aos cadernos
//
// =============================================================================

export interface Book {
  id: string
  name: string // "GRI 2 + Aneel"
  description: string | null // "Bases Gerais e de Governança..."
  category: string | null // "governanca", "social", "ambiental", "organizacional"
  responsible_ids: string[] | null // Array de IDs dos responsáveis
  created_at: string
  updated_at: string
}

export interface Question {
  id: string

  // Frameworks (cadernos onde esta questão aparece)
  framework_aneel: string | null // "Aneel"
  subframework_aneel: string | null // "Cadastro de agentes / Outorgas"
  framework_ifrs: string | null // "IFRS"
  subframework_ifrs: string | null // "S1"
  framework_gri: string | null // "GRI"
  subframework_gri_1: string | null // "GRI 2"
  subframework_gri_2: string | null // "2-1 Detalhes organizacionais"
  subframework_gri_3: string | null // null

  // Conteúdo da questão
  disclosure: string | null // "2-1 Detalhes organizacionais"
  linha_coleta: string // "Informe a razão social"
  tipo_resposta: string // "texto", "numero", "data", "selecao", "multipla_escolha"

  // Campos de resposta
  evidencias: string | null // "Contrato social"
  obs_nao_aplicavel: string | null // "Os disclosures do GRI 2..."
  justificativa: string | null // Opcional

  created_at: string
  updated_at: string
}

export interface BookQuestion {
  id: string
  book_id: string
  question_id: string
  sort_order: number
  created_at: string
}

// Tipos expandidos para queries com joins
export interface BookWithQuestions extends Book {
  book_questions: (BookQuestion & { questions: Question })[]
  question_count?: number
}

export interface QuestionWithBooks extends Question {
  book_questions: (BookQuestion & { books: Book })[]
}

// Categorias de cadernos
export const BOOK_CATEGORIES = {
  governanca: { label: "Governança", color: "bg-purple-100 text-purple-800 border-purple-300" },
  social: { label: "Social", color: "bg-pink-100 text-pink-800 border-pink-300" },
  ambiental: { label: "Ambiental", color: "bg-teal-100 text-teal-800 border-teal-300" },
  organizacional: { label: "Organizacional", color: "bg-blue-100 text-blue-800 border-blue-300" },
} as const

// Tipos de resposta
export const QUESTION_TYPES = {
  texto: { label: "Texto", description: "Resposta em texto livre" },
  numero: { label: "Número", description: "Resposta numérica" },
  data: { label: "Data", description: "Resposta com data" },
  selecao: { label: "Seleção única", description: "Escolha uma opção" },
  multipla_escolha: { label: "Múltipla escolha", description: "Escolha várias opções" },
} as const
