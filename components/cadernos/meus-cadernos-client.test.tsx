import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  MeusCadernosClient,
  deduplicateHoldingsTree,
  getCadernoKey,
  type CadernoItem,
  type HoldingItem,
} from "./meus-cadernos-client"

const makeCaderno = (overrides: Partial<CadernoItem> = {}): CadernoItem => ({
  id: "template-1",
  name: "Caderno GRI 2026",
  description: "Relatório de sustentabilidade",
  company_id: "company-1",
  organization_id: "org-1",
  questionsCount: 10,
  answeredCount: 5,
  needsCorrection: 0,
  status: "in_progress",
  ...overrides,
})

const makeHolding = (cadernos: CadernoItem[], overrides: Partial<HoldingItem> = {}): HoldingItem => ({
  id: "holding-1",
  name: "Holding Alpha",
  type: "holding",
  totalCadernos: cadernos.length,
  completedCadernos: cadernos.filter((c) => c.status === "completed").length,
  needsCorrection: 0,
  directCadernos: [],
  hasDirectCadernos: false,
  companies: [
    {
      id: "company-1",
      name: "Empresa Beta",
      cnpj: "00.000.000/0001-00",
      totalCadernos: cadernos.length,
      completedCadernos: cadernos.filter((c) => c.status === "completed").length,
      inProgressCadernos: cadernos.filter((c) => c.status === "in_progress").length,
      pendingCadernos: cadernos.filter((c) => c.status === "pending").length,
      needsCorrection: 0,
      cadernos,
    },
  ],
  ...overrides,
})

describe("getCadernoKey", () => {
  it("usa company_id quando disponível", () => {
    expect(getCadernoKey(makeCaderno(), "fallback")).toBe("template-1_company-1")
  })

  it("usa organization_id quando company_id está ausente", () => {
    const caderno = makeCaderno({ company_id: null })
    expect(getCadernoKey(caderno, "fallback")).toBe("template-1_org-1")
  })

  it("usa fallbackCompanyId quando ambos estão ausentes", () => {
    const caderno = makeCaderno({ company_id: null, organization_id: null })
    expect(getCadernoKey(caderno, "company-fallback")).toBe("template-1_company-fallback")
  })
})

describe("deduplicateHoldingsTree", () => {
  it("remove holdings duplicadas pelo id", () => {
    const holding = makeHolding([makeCaderno()])
    const result = deduplicateHoldingsTree([holding, { ...holding, name: "Duplicata" }])

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Holding Alpha")
  })

  it("remove cadernos duplicados com a mesma chave template_id + company_id", () => {
    const duplicateA = makeCaderno({ name: "Caderno Original", answeredCount: 5 })
    const duplicateB = makeCaderno({ name: "Caderno Duplicado", answeredCount: 2 })
    const holding = makeHolding([duplicateA, duplicateB])

    const result = deduplicateHoldingsTree([holding])

    expect(result[0].companies[0].cadernos).toHaveLength(1)
    expect(result[0].companies[0].cadernos[0].name).toBe("Caderno Original")
    expect(result[0].companies[0].totalCadernos).toBe(1)
  })

  it("mantém cadernos distintos com o mesmo template em empresas diferentes", () => {
    const cadernoCompany1 = makeCaderno({ company_id: "company-1" })
    const cadernoCompany2 = makeCaderno({ company_id: "company-2" })

    const holding: HoldingItem = {
      ...makeHolding([cadernoCompany1]),
      companies: [
        {
          id: "company-1",
          name: "Empresa 1",
          totalCadernos: 1,
          completedCadernos: 0,
          inProgressCadernos: 1,
          pendingCadernos: 0,
          needsCorrection: 0,
          cadernos: [cadernoCompany1],
        },
        {
          id: "company-2",
          name: "Empresa 2",
          totalCadernos: 1,
          completedCadernos: 0,
          inProgressCadernos: 1,
          pendingCadernos: 0,
          needsCorrection: 0,
          cadernos: [cadernoCompany2],
        },
      ],
    }

    const result = deduplicateHoldingsTree([holding])

    expect(result[0].companies).toHaveLength(2)
    expect(result[0].companies[0].cadernos).toHaveLength(1)
    expect(result[0].companies[1].cadernos).toHaveLength(1)
  })
})

describe("MeusCadernosClient", () => {
  it("renderiza o nome da holding e da empresa", () => {
    const caderno = makeCaderno()
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding([caderno])]}
        targetYear={2026}
      />
    )

    expect(screen.getByText("Holding Alpha")).toBeInTheDocument()
    expect(screen.getByText("Empresa Beta")).toBeInTheDocument()
  })

  it("renderiza o nome do caderno com link contendo company e year corretos", () => {
    const caderno = makeCaderno()
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding([caderno])]}
        targetYear={2026}
      />
    )

    const link = screen.getByRole("link", { name: /Caderno GRI 2026/i })
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/questionnaire/template-1?company=company-1&year=2026"
    )
  })

  it("propaga o ano correto no link quando targetYear é 2025", () => {
    const caderno = makeCaderno()
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding([caderno])]}
        targetYear={2025}
      />
    )

    const link = screen.getByRole("link", { name: /Caderno GRI 2026/i })
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/questionnaire/template-1?company=company-1&year=2025"
    )
  })

  it("exibe mensagem de vazio quando não há cadernos atribuídos", () => {
    render(<MeusCadernosClient allHoldingsAndOrgs={[]} targetYear={2026} />)

    expect(screen.getByText("Nenhum caderno atribuído")).toBeInTheDocument()
  })

  it("filtra cadernos pelo nome ao digitar na busca", async () => {
    const user = userEvent.setup()
    const cadernos = [
      makeCaderno({ id: "t1", name: "Caderno GRI" }),
      makeCaderno({ id: "t2", name: "Caderno ISO", company_id: "company-1" }),
    ]
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding(cadernos)]}
        targetYear={2026}
      />
    )

    const input = screen.getByPlaceholderText("Buscar cadernos...")
    await user.type(input, "GRI")

    expect(screen.getByText("Caderno GRI")).toBeInTheDocument()
    expect(screen.queryByText("Caderno ISO")).not.toBeInTheDocument()
  })

  it("exibe badge de status 'Em Progresso' para cadernos parcialmente respondidos", () => {
    const caderno = makeCaderno({ status: "in_progress" })
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding([caderno])]}
        targetYear={2026}
      />
    )

    expect(screen.getByText("Em Progresso")).toBeInTheDocument()
  })

  it("exibe badge 'Concluído' para cadernos com status completed", () => {
    const caderno = makeCaderno({ status: "completed", answeredCount: 10 })
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding([caderno])]}
        targetYear={2026}
      />
    )

    expect(screen.getByText("Concluído")).toBeInTheDocument()
  })

  it("renderiza apenas um card quando há cadernos duplicados com a mesma chave", () => {
    const duplicateCadernos = [
      makeCaderno({ name: "Caderno Único", answeredCount: 8 }),
      makeCaderno({ name: "Caderno Único (dup)", answeredCount: 1 }),
    ]

    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[makeHolding(duplicateCadernos)]}
        targetYear={2026}
      />
    )

    expect(screen.getByText("Caderno Único")).toBeInTheDocument()
    expect(screen.queryByText("Caderno Único (dup)")).not.toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(1)
  })

  it("renderiza apenas uma holding quando allHoldingsAndOrgs contém ids duplicados", () => {
    const holding = makeHolding([makeCaderno()])
    render(
      <MeusCadernosClient
        allHoldingsAndOrgs={[holding, { ...holding, name: "Holding Duplicada" }]}
        targetYear={2026}
      />
    )

    expect(screen.getByText("Holding Alpha")).toBeInTheDocument()
    expect(screen.queryByText("Holding Duplicada")).not.toBeInTheDocument()
  })
})
