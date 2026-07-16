import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockRevalidatePath = vi.hoisted(() => vi.fn())
const mockGetCurrentUserProfile = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))

vi.mock("@/lib/auth-utils", () => ({
  getCurrentUserProfile: mockGetCurrentUserProfile,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EqCall = [string, unknown]

/**
 * Cria um builder Supabase encadeável que registra chamadas de .eq() e .is()
 * e resolve com o valor configurado em `resolveWith`.
 */
function makeChain(resolveWith: object) {
  const eqCalls: EqCall[] = []
  const isCalls: EqCall[] = []

  const chain: Record<string, unknown> = {}
  chain.eq = vi.fn((col: string, val: unknown) => { eqCalls.push([col, val]); return chain })
  chain.is = vi.fn((col: string, val: unknown) => { isCalls.push([col, val]); return chain })
  chain.select = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => Promise.resolve(resolveWith))
  chain.single = vi.fn(() => Promise.resolve(resolveWith))
  chain._eqCalls = eqCalls
  chain._isCalls = isCalls

  Object.defineProperty(chain, "then", {
    get() {
      return (resolve: (v: unknown) => void) => resolve(resolveWith)
    },
  })

  return chain as typeof chain & { _eqCalls: EqCall[]; _isCalls: EqCall[] }
}

/** Perfil autenticado padrão. */
const userProfile = { id: "user-111", role: "user", organization_id: "org-aaa" }

/** Parâmetros base válidos para saveQuestionnaireResponse. */
const baseParams = {
  templateId: "tmpl-1",
  questionId: "quest-1",
  userId: "user-111",
  companyId: "company-abc",
  holdingId: "holding-xyz",
  responseValue: "Resposta da empresa",
  anoReferencia: 2026,
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Importação dinâmica (após os mocks) ──────────────────────────────────────

const { saveQuestionnaireResponse } = await import("./questionnaire-actions")

// ─── Suíte: autenticação e autorização ────────────────────────────────────────

describe("saveQuestionnaireResponse — autenticação e autorização", () => {
  it("retorna erro quando o usuário não está autenticado", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(null)

    const result = await saveQuestionnaireResponse(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/não autenticado/i)
  })

  it("retorna erro quando userId passado é diferente do perfil autenticado", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({ ...userProfile, id: "outro-usuario" })

    const result = await saveQuestionnaireResponse(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/permissão/i)
  })
})

// ─── Suíte: modelo compartilhado — lookup por empresa (não por usuário) ────────

describe("saveQuestionnaireResponse — modelo compartilhado por empresa", () => {
  it("NÃO inclui user_id como filtro na query de busca do registro existente", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const companiesChain = makeChain({ data: { id: "company-abc" }, error: null })
    const lookupChain = makeChain({ data: null, error: null })
    const insertChain = makeChain({ data: [{ id: "new-answer-id" }], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return { select: () => companiesChain }
      if (table === "book_answers") {
        return {
          select: vi.fn(() => lookupChain),
          insert: vi.fn(() => insertChain),
        }
      }
    })

    await saveQuestionnaireResponse(baseParams)

    const eqCols = lookupChain._eqCalls.map(([col]) => col)
    expect(eqCols).not.toContain("user_id")
  })

  it("inclui template_id, question_id e ano_referencia na query de lookup", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const companiesChain = makeChain({ data: { id: "company-abc" }, error: null })
    const lookupChain = makeChain({ data: null, error: null })
    const insertChain = makeChain({ data: [{ id: "new-id" }], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return { select: () => companiesChain }
      if (table === "book_answers") {
        return { select: () => lookupChain, insert: () => insertChain }
      }
    })

    await saveQuestionnaireResponse(baseParams)

    const eqCols = lookupChain._eqCalls.map(([col]) => col)
    expect(eqCols).toContain("template_id")
    expect(eqCols).toContain("question_id")
    expect(eqCols).toContain("ano_referencia")
    expect(eqCols).toContain("company_id")
  })

  it("usa .is('company_id', null) quando companyId não é fornecido", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const lookupChain = makeChain({ data: null, error: null })
    const insertChain = makeChain({ data: [{ id: "new-id" }], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "book_answers") {
        return { select: () => lookupChain, insert: () => insertChain }
      }
    })

    await saveQuestionnaireResponse({ ...baseParams, companyId: null })

    const isCols = lookupChain._isCalls.map(([col]) => col)
    expect(isCols).toContain("company_id")

    const eqCols = lookupChain._eqCalls.map(([col]) => col)
    expect(eqCols).not.toContain("company_id")
  })
})

// ─── Suíte: trilha de auditoria — user_id salvo no payload ───────────────────

describe("saveQuestionnaireResponse — auditoria de user_id no payload", () => {
  it("inclui user_id no dataToSave mesmo com lookup compartilhado", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const companiesChain = makeChain({ data: { id: "company-abc" }, error: null })
    const lookupChain = makeChain({ data: null, error: null })

    let capturedInsertData: Record<string, unknown> | null = null
    const insertFn = vi.fn((data: Record<string, unknown>) => {
      capturedInsertData = data
      return makeChain({ data: [{ id: "new-id" }], error: null })
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return { select: () => companiesChain }
      if (table === "book_answers") {
        return { select: () => lookupChain, insert: insertFn }
      }
    })

    await saveQuestionnaireResponse(baseParams)

    expect(capturedInsertData).not.toBeNull()
    expect(capturedInsertData?.user_id).toBe("user-111")
  })

  it("registra o user_id do colaborador que editou por último (update path)", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const companiesChain = makeChain({ data: { id: "company-abc" }, error: null })

    // Simula que já existe um registro criado por user-999
    const lookupChain = makeChain({ data: { id: "existing-answer-id" }, error: null })

    let capturedUpdateData: Record<string, unknown> | null = null
    const updateMock = vi.fn((data: Record<string, unknown>) => {
      capturedUpdateData = data
      return makeChain({ data: [{ id: "existing-answer-id" }], error: null })
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return { select: () => companiesChain }
      if (table === "book_answers") {
        return {
          select: () => lookupChain,
          update: updateMock,
        }
      }
    })

    await saveQuestionnaireResponse(baseParams)

    expect(capturedUpdateData?.user_id).toBe("user-111")
  })
})

// ─── Suíte: cenários de erro do banco ────────────────────────────────────────

describe("saveQuestionnaireResponse — erros do banco", () => {
  it("retorna mensagem amigável para erro de company_id inválido (FK violation 23503)", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const companiesChain = makeChain({ data: null, error: null })
    const orgsChain = makeChain({ data: null, error: null })
    const lookupChain = makeChain({ data: null, error: null })
    const insertChain = makeChain({
      data: null,
      error: { code: "23503", message: "company_id violates FK", details: "" },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return { select: () => companiesChain }
      if (table === "organizations") return { select: () => orgsChain }
      if (table === "book_answers") {
        return { select: () => lookupChain, insert: () => insertChain }
      }
    })

    const result = await saveQuestionnaireResponse({ ...baseParams, companyId: "id-invalido" })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/empresa/i)
  })

  it("retorna mensagem amigável para conflito de unicidade (23505)", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(userProfile)

    const companiesChain = makeChain({ data: { id: "company-abc" }, error: null })
    const lookupChain = makeChain({ data: null, error: null })
    const insertChain = makeChain({
      data: null,
      error: { code: "23505", message: "unique constraint violation", details: "" },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "companies") return { select: () => companiesChain }
      if (table === "book_answers") {
        return { select: () => lookupChain, insert: () => insertChain }
      }
    })

    const result = await saveQuestionnaireResponse(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/já foi registrada/i)
  })
})
