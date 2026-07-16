import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockRevalidatePath = vi.hoisted(() => vi.fn())

// Chainable Supabase builder mock
const mockEq = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())
const mockInsert = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

const mockGetCurrentUserProfile = vi.hoisted(() => vi.fn())

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUserProfile: mockGetCurrentUserProfile,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Cria um builder Supabase encadeável que registra cada chamada .eq()
 * e resolve com o objeto `resolveWith` no final da cadeia.
 */
function buildChainableMock(resolveWith: object) {
  const chain: Record<string, unknown> = {}

  // Registra todas as chamadas de .eq para inspeção posterior
  const eqCalls: Array<[string, unknown]> = []
  chain.eq = vi.fn((_col: string, _val: unknown) => {
    eqCalls.push([_col, _val])
    return chain
  })
  chain.is = vi.fn(() => chain)
  chain.or = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  // Ao final da cadeia, retorna o resultado configurado
  chain._resolveWith = resolveWith
  chain._eqCalls = eqCalls

  // Faz com que o mock retorne o próprio chain (que é um "thenable")
  Object.defineProperty(chain, "then", {
    get() {
      return (resolve: (v: unknown) => void) => resolve(resolveWith)
    },
  })

  return chain as typeof chain & {
    _eqCalls: Array<[string, unknown]>
    eq: ReturnType<typeof vi.fn>
  }
}

/** Perfil admin padrão usado nos testes de sucesso. */
const adminProfile = {
  id: "user-abc",
  role: "admin_main",
  organization_id: "org-xyz",
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Imports dinâmicos (após os mocks estarem registrados) ────────────────────

const {
  requestRevision,
  approveQuestion,
  rejectQuestion,
  submitCorrection,
  clearRevision,
} = await import("./review-actions")

// ─── Suíte: requestRevision ───────────────────────────────────────────────────

describe("requestRevision", () => {
  it("retorna erro quando usuário não está autenticado", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(null)

    const result = await requestRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      comment: "ajuste necessário",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/não autenticado/i)
  })

  it("retorna erro quando o role não tem permissão", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({ ...adminProfile, role: "user" })

    const result = await requestRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      comment: "ajuste",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/gestores/i)
  })

  it("inclui filtro ano_referencia na query de update de status", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const junctionChain = buildChainableMock({ error: null })
    const historyChain = buildChainableMock({ error: null })
    const answersChain = buildChainableMock({ error: null, count: 1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_question_junction") return { update: () => junctionChain }
      if (table === "comment_history") return { insert: () => historyChain }
      if (table === "book_answers") return { update: () => answersChain }
    })

    const result = await requestRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      comment: "precisa de ajuste",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(true)

    const eqArgs = answersChain._eqCalls.map(([col]) => col)
    expect(eqArgs).toContain("ano_referencia")

    const yearCall = answersChain._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall?.[1]).toBe(2025)
  })

  it("NÃO contamina respostas de 2024 ao solicitar revisão em 2025", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const answersChain2025 = buildChainableMock({ error: null, count: 1 })
    const answersChain2024 = buildChainableMock({ error: null, count: 99 })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_question_junction") return { update: () => buildChainableMock({ error: null }) }
      if (table === "comment_history") return { insert: () => buildChainableMock({ error: null }) }
      if (table === "book_answers") return { update: () => answersChain2025 }
    })

    await requestRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      comment: "ajuste",
      anoReferencia: 2025,
    })

    // A chain de 2024 nunca deve ter sido iniciada
    expect(answersChain2024._eqCalls.length).toBe(0)
    // A chain de 2025 deve ter o filtro correto
    const yearCall = answersChain2025._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall?.[1]).toBe(2025)
  })
})

// ─── Suíte: approveQuestion ───────────────────────────────────────────────────

describe("approveQuestion", () => {
  it("retorna erro quando usuário não está autenticado", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(null)

    const result = await approveQuestion({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/não autenticado/i)
  })

  it("inclui filtro ano_referencia na query de aprovação", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const answersChain = buildChainableMock({ error: null, count: 1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_question_junction") return { update: () => buildChainableMock({ error: null }) }
      if (table === "comment_history") return { insert: () => buildChainableMock({ error: null }) }
      if (table === "book_answers") return { update: () => answersChain }
    })

    const result = await approveQuestion({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      anoReferencia: 2026,
    })

    expect(result.success).toBe(true)

    const yearCall = answersChain._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall?.[1]).toBe(2026)
  })

  it("chama revalidatePath após aprovação bem-sucedida", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    mockFrom.mockImplementation(() => ({
      update: () => buildChainableMock({ error: null, count: 1 }),
      insert: () => buildChainableMock({ error: null }),
    }))

    await approveQuestion({
      junctionId: "j1",
      questionId: "q1",
      templateId: "template-gri",
      anoReferencia: 2025,
    })

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/questionnaire/template-gri")
  })
})

// ─── Suíte: rejectQuestion ────────────────────────────────────────────────────

describe("rejectQuestion", () => {
  it("inclui filtro ano_referencia na query de rejeição", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const answersChain = buildChainableMock({ error: null, count: 1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_question_junction") return { update: () => buildChainableMock({ error: null }) }
      if (table === "comment_history") return { insert: () => buildChainableMock({ error: null }) }
      if (table === "book_answers") return { update: () => answersChain }
    })

    const result = await rejectQuestion({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      reason: "resposta incompleta",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(true)

    const yearCall = answersChain._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall?.[1]).toBe(2025)
  })
})

// ─── Suíte: submitCorrection ──────────────────────────────────────────────────

describe("submitCorrection", () => {
  it("retorna erro quando usuário não está autenticado", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(null)

    const result = await submitCorrection({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      newValue: "resposta corrigida",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/não autenticado/i)
  })

  it("filtra por user_id E ano_referencia na query de correção", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const answersChain = buildChainableMock({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_answers") return { update: () => answersChain }
      if (table === "comment_history") return { insert: () => buildChainableMock({ error: null }) }
    })

    const result = await submitCorrection({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      newValue: "nova resposta",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(true)

    const eqCols = answersChain._eqCalls.map(([col]) => col)
    expect(eqCols).toContain("user_id")
    expect(eqCols).toContain("ano_referencia")

    const userCall = answersChain._eqCalls.find(([col]) => col === "user_id")
    expect(userCall?.[1]).toBe("user-abc")

    const yearCall = answersChain._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall?.[1]).toBe(2025)
  })
})

// ─── Suíte: clearRevision ─────────────────────────────────────────────────────

describe("clearRevision", () => {
  it("retorna erro quando role não tem permissão", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({ ...adminProfile, role: "collaborator" })

    const result = await clearRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/gestores/i)
  })

  it("inclui filtro ano_referencia ao resetar status para rascunho", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const answersChain = buildChainableMock({ error: null, count: 1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_question_junction") return { update: () => buildChainableMock({ error: null }) }
      if (table === "comment_history") return { insert: () => buildChainableMock({ error: null }) }
      if (table === "book_answers") return { update: () => answersChain }
    })

    const result = await clearRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      anoReferencia: 2025,
    })

    expect(result.success).toBe(true)

    const yearCall = answersChain._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall?.[1]).toBe(2025)
  })

  it("NÃO reseta status de respostas de outro ano ao limpar revisão", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(adminProfile)

    const answersChain = buildChainableMock({ error: null, count: 1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_question_junction") return { update: () => buildChainableMock({ error: null }) }
      if (table === "comment_history") return { insert: () => buildChainableMock({ error: null }) }
      if (table === "book_answers") return { update: () => answersChain }
    })

    await clearRevision({
      junctionId: "j1",
      questionId: "q1",
      templateId: "t1",
      anoReferencia: 2026,
    })

    // Garante que o filtro de ano NUNCA é omitido e aponta para 2026
    const yearCall = answersChain._eqCalls.find(([col]) => col === "ano_referencia")
    expect(yearCall).toBeDefined()
    expect(yearCall?.[1]).toBe(2026)
    expect(yearCall?.[1]).not.toBe(2025)
  })
})
