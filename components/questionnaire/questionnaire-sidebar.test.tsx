import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  QuestionnaireSidebar,
  extractCategory,
  slugifyCategory,
  type SidebarQuestion,
} from "./questionnaire-sidebar"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/questionnaire/template-1",
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

// ─── Test data ────────────────────────────────────────────────────────────────

const makeQuestion = (
  id: string,
  uid: string,
  disclosure?: string
): SidebarQuestion => ({
  id,
  unique_identifier: uid,
  metadata: disclosure ? { disclosure } : {},
})

const ITEMS_PER_PAGE = 10

const defaultProps = {
  templateId: "template-1",
  companyId: "company-1",
  currentPage: 1,
  itemsPerPage: ITEMS_PER_PAGE,
}

// ─── Unit tests: utility functions ───────────────────────────────────────────

describe("extractCategory", () => {
  it("retorna o disclosure quando disponível nos metadados", () => {
    const q = makeQuestion("q1", "GRI 2-1", "GRI 2: Divulgações Gerais")
    expect(extractCategory(q)).toBe("GRI 2: Divulgações Gerais")
  })

  it("extrai o prefixo do unique_identifier quando não há disclosure", () => {
    const q = makeQuestion("q1", "GRI 302-1")
    expect(extractCategory(q)).toBe("GRI 302")
  })

  it("extrai prefixo alfanumérico curto (ex: E1)", () => {
    const q = makeQuestion("q1", "E1-4")
    expect(extractCategory(q)).toBe("E1")
  })

  it("retorna 'Geral' quando o unique_identifier não tem padrão reconhecível", () => {
    const q = makeQuestion("q1", "pergunta-livre")
    expect(extractCategory(q)).toBe("Geral")
  })

  it("retorna 'Geral' quando unique_identifier está vazio", () => {
    const q = makeQuestion("q1", "")
    expect(extractCategory(q)).toBe("Geral")
  })
})

describe("slugifyCategory", () => {
  it("converte para minúsculas e substitui espaços por hífens", () => {
    expect(slugifyCategory("GRI 302")).toBe("gri-302")
  })

  it("remove acentos e caracteres especiais", () => {
    expect(slugifyCategory("Divulgações Gerais")).toBe("divulgacoes-gerais")
  })

  it("remove hífens duplicados nas bordas", () => {
    expect(slugifyCategory("  GRI 2  ")).toBe("gri-2")
  })

  it("lida com dois-pontos e outros símbolos", () => {
    expect(slugifyCategory("GRI 2: Governança")).toBe("gri-2-governanca")
  })
})

// ─── Component tests ─────────────────────────────────────────────────────────

describe("QuestionnaireSidebar", () => {
  const questionsGRI2: SidebarQuestion[] = [
    makeQuestion("q1", "GRI 2-1", "GRI 2: Divulgações Gerais"),
    makeQuestion("q2", "GRI 2-2", "GRI 2: Divulgações Gerais"),
    makeQuestion("q3", "GRI 2-3", "GRI 2: Divulgações Gerais"),
  ]

  const questionsGRI302: SidebarQuestion[] = [
    makeQuestion("q4", "GRI 302-1", "GRI 302: Energia"),
    makeQuestion("q5", "GRI 302-2", "GRI 302: Energia"),
  ]

  const allQuestions = [...questionsGRI2, ...questionsGRI302]

  it("renderiza a seção de progresso total", () => {
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={{}}
      />
    )
    expect(screen.getByText("Progresso Total")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("exibe 100% quando todas as questões estão respondidas", () => {
    const existingAnswers = Object.fromEntries(
      allQuestions.map((q) => [q.id, { value: "Sim" }])
    )
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={existingAnswers}
      />
    )
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("exibe o contagem correta de respondidas (ex: 3/5)", () => {
    const existingAnswers = {
      q1: { value: "Sim" },
      q2: { value: "Não" },
      q4: { value: "100" },
    }
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={existingAnswers}
      />
    )
    expect(screen.getByText("3/5")).toBeInTheDocument()
  })

  it("renderiza todos os nomes de categoria únicos", () => {
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={{}}
      />
    )
    expect(screen.getByText("GRI 2: Divulgações Gerais")).toBeInTheDocument()
    expect(screen.getByText("GRI 302: Energia")).toBeInTheDocument()
  })

  it("exibe progresso por categoria (respondidas/total)", () => {
    const existingAnswers = {
      q1: { value: "Sim" },
      q2: { value: "Não" },
    }
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={existingAnswers}
      />
    )
    // GRI 2: 2 de 3 respondidas
    expect(screen.getByText("2/3")).toBeInTheDocument()
    // GRI 302: 0 de 2 respondidas
    expect(screen.getByText("0/2")).toBeInTheDocument()
  })

  it("gera link de âncora (#) para categorias na página atual", () => {
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={{}}
        currentPage={1}
      />
    )
    // Ambas as categorias estão na página 1 (5 questões no total < 10)
    const links = screen.getAllByRole("link")
    const anchorLinks = links.filter((l) => l.getAttribute("href")?.startsWith("#"))
    expect(anchorLinks.length).toBeGreaterThanOrEqual(2)
  })

  it("gera link de navegação para categorias em outras páginas", () => {
    // Cria 12 questões: GRI 2 (10) e GRI 302 (2)
    const manyQ = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeQuestion(`q${i + 1}`, `GRI 2-${i + 1}`, "GRI 2: Divulgações Gerais")
      ),
      makeQuestion("q11", "GRI 302-1", "GRI 302: Energia"),
      makeQuestion("q12", "GRI 302-2", "GRI 302: Energia"),
    ]

    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={manyQ}
        existingAnswers={{}}
        currentPage={1}
        itemsPerPage={10}
      />
    )

    // GRI 302 começa na página 2, deve gerar link de navegação
    const links = screen.getAllByRole("link")
    const navLink = links.find((l) =>
      l.getAttribute("href")?.includes("page=2")
    )
    expect(navLink).toBeDefined()
  })

  it("renderiza a legenda de cores", () => {
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={{}}
      />
    )
    expect(screen.getByText("Legenda")).toBeInTheDocument()
    expect(screen.getByText("Não iniciada")).toBeInTheDocument()
    expect(screen.getByText("Em progresso")).toBeInTheDocument()
    expect(screen.getByText("Quase concluída")).toBeInTheDocument()
    expect(screen.getByText("Completa")).toBeInTheDocument()
  })

  it("não conta respostas com value vazio como respondidas", () => {
    const existingAnswers = {
      q1: { value: "" },
      q2: { value: "   " },
    }
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={allQuestions}
        existingAnswers={existingAnswers}
      />
    )
    // Nenhuma deve ser contada como respondida
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByText("0/5")).toBeInTheDocument()
  })

  it("renderiza corretamente com lista vazia de questões", () => {
    render(
      <QuestionnaireSidebar
        {...defaultProps}
        allQuestions={[]}
        existingAnswers={{}}
      />
    )
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByText("0/0")).toBeInTheDocument()
  })
})

// ─── Testes de Collapse da Sidebar ───────────────────────────────────────────

describe("QuestionnaireSidebar — collapse", () => {
  const questionsSimple: SidebarQuestion[] = [
    makeQuestion("q1", "GRI 2-1", "GRI 2: Divulgações Gerais"),
    makeQuestion("q2", "GRI 2-2", "GRI 2: Divulgações Gerais"),
  ]

  const defaultCollapseProps = {
    templateId: "template-1",
    companyId: null,
    currentPage: 1,
    itemsPerPage: 10,
    allQuestions: questionsSimple,
    existingAnswers: {},
  }

  it("começa expandida por padrão (data-collapsed='false')", () => {
    render(<QuestionnaireSidebar {...defaultCollapseProps} />)
    const aside = screen.getByTestId("questionnaire-sidebar")
    expect(aside).toHaveAttribute("data-collapsed", "false")
  })

  it("exibe o botão 'Recolher painel lateral' quando expandida", () => {
    render(<QuestionnaireSidebar {...defaultCollapseProps} />)
    expect(screen.getByRole("button", { name: /recolher painel lateral/i })).toBeInTheDocument()
  })

  it("colapsa ao clicar no botão (data-collapsed='true')", async () => {
    const user = userEvent.setup()
    render(<QuestionnaireSidebar {...defaultCollapseProps} />)

    await user.click(screen.getByRole("button", { name: /recolher painel lateral/i }))

    const aside = screen.getByTestId("questionnaire-sidebar")
    expect(aside).toHaveAttribute("data-collapsed", "true")
  })

  it("exibe o botão 'Expandir painel lateral' quando recolhida", async () => {
    const user = userEvent.setup()
    render(<QuestionnaireSidebar {...defaultCollapseProps} />)

    await user.click(screen.getByRole("button", { name: /recolher painel lateral/i }))

    expect(screen.getByRole("button", { name: /expandir painel lateral/i })).toBeInTheDocument()
  })

  it("expande novamente ao clicar no botão pela segunda vez", async () => {
    const user = userEvent.setup()
    render(<QuestionnaireSidebar {...defaultCollapseProps} />)

    await user.click(screen.getByRole("button", { name: /recolher painel lateral/i }))
    await user.click(screen.getByRole("button", { name: /expandir painel lateral/i }))

    const aside = screen.getByTestId("questionnaire-sidebar")
    expect(aside).toHaveAttribute("data-collapsed", "false")
  })

  it("exibe mini-indicador de progresso quando recolhida", async () => {
    const user = userEvent.setup()
    render(
      <QuestionnaireSidebar
        {...defaultCollapseProps}
        existingAnswers={{ q1: { value: "Sim" } }}
      />
    )

    await user.click(screen.getByRole("button", { name: /recolher painel lateral/i }))

    // O mini-indicador deve aparecer quando recolhida
    const miniIndicator = screen.getByTestId("sidebar-mini-indicator")
    expect(miniIndicator).toBeInTheDocument()
    // Com 1 de 2 respondidas → 50% e contador 1/2 dentro do mini-indicador
    expect(within(miniIndicator).getByText("50%")).toBeInTheDocument()
    expect(within(miniIndicator).getByText("1/2")).toBeInTheDocument()
  })

  it("mantém o botão de toggle visível mesmo quando recolhida", async () => {
    const user = userEvent.setup()
    render(<QuestionnaireSidebar {...defaultCollapseProps} />)

    await user.click(screen.getByRole("button", { name: /recolher painel lateral/i }))

    expect(screen.getByRole("button", { name: /expandir painel lateral/i })).toBeVisible()
  })
})
