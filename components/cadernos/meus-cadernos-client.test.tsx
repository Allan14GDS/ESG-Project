import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MeusCadernosClient } from "./meus-cadernos-client"

const makeCaderno = (overrides: Record<string, unknown> = {}) => ({
  id: "template-1",
  name: "Caderno GRI 2026",
  description: "Relatório de sustentabilidade",
  company_id: "company-1",
  organization_id: "org-1",
  questionsCount: 10,
  answeredCount: 5,
  needsCorrection: 0,
  status: "in_progress" as const,
  ...overrides,
})

const makeHolding = (cadernos: ReturnType<typeof makeCaderno>[]) => ({
  id: "holding-1",
  name: "Holding Alpha",
  type: "holding",
  totalCadernos: cadernos.length,
  completedCadernos: cadernos.filter((c) => c.status === "completed").length,
  inProgressCadernos: cadernos.filter((c) => c.status === "in_progress").length,
  pendingCadernos: cadernos.filter((c) => c.status === "pending").length,
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
})
