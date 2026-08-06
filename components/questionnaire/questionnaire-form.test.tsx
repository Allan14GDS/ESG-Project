import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QuestionnaireForm } from "./questionnaire-form"

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockSaveQuestionnaireResponse = vi.hoisted(() => vi.fn())
const mockDeleteUserAnswer = vi.hoisted(() => vi.fn())
const mockClearRevision = vi.hoisted(() => vi.fn())
const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockToastSuccess = vi.hoisted(() => vi.fn())
const mockToastError = vi.hoisted(() => vi.fn())

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/app/actions/questionnaire-actions", () => ({
  saveQuestionnaireResponse: mockSaveQuestionnaireResponse,
  deleteUserAnswer: mockDeleteUserAnswer,
}))

vi.mock("@/app/actions/review-actions", () => ({
  clearRevision: mockClearRevision,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

vi.mock("@/components/questionnaire/review-panel", () => ({
  ReviewPanel: () => <div data-testid="review-panel" />,
}))

vi.mock("@/components/questionnaire/gap-analysis-input", () => ({
  GapAnalysisInput: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="gap-analysis-input" data-disabled={String(disabled)} />
  ),
  GapAnalysisReadOnly: () => <div data-testid="gap-analysis-readonly" />,
  GAP_ISO_EMPTY: {
    conformidade: null,
    gap_identificado: "",
    acao_necessaria: "",
    prioridade: null,
    responsavel: "",
    prazo: "",
  },
}))

// ─── Test data ────────────────────────────────────────────────────────────────

const baseQuestion = {
  id: "q1",
  label: "Pergunta de teste",
  type: "texto",
  unique_identifier: "Q001",
  metadata: {},
  junction_id: "junc1",
  comment: null,
  comment_author_name: null,
  comment_author_role: null,
}

const defaultProps = {
  questions: [baseQuestion],
  templateId: "template-1",
  userId: "user-1",
  companyId: "company-1",
  holdingId: null,
  userRole: "user",
  isGestor: false,
  existingAnswers: {},
  answersByQuestion: {},
  anoReferencia: 2025,
  previousYearAnswers: {},
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderForm(overrides: Partial<typeof defaultProps> = {}) {
  return render(<QuestionnaireForm {...defaultProps} {...overrides} />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("QuestionnaireForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Renderização básica", () => {
    it("renderiza o label da questão", () => {
      renderForm()
      expect(screen.getByText("Pergunta de teste")).toBeInTheDocument()
    })

    it("renderiza o badge 'Questão 1'", () => {
      renderForm()
      expect(screen.getByText("Questão 1")).toBeInTheDocument()
    })

    it("não exibe o indicador de salvamento em estado idle", () => {
      renderForm()
      expect(screen.queryByTestId("saving-status-badge")).not.toBeInTheDocument()
    })
  })

  describe("Indicador global de salvamento (savingStatus)", () => {
    it("exibe 'Salvo' após salvamento bem-sucedido", async () => {
      mockSaveQuestionnaireResponse.mockResolvedValue({ success: true })

      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText("Digite sua resposta..."), "Minha resposta")
      await user.click(screen.getByRole("button", { name: /salvar resposta/i }))

      await waitFor(() => {
        expect(screen.getByTestId("saving-status-badge")).toHaveTextContent("Salvo")
      })
    })

    it("exibe 'Erro ao salvar' quando o salvamento falha", async () => {
      mockSaveQuestionnaireResponse.mockResolvedValue({ error: "Falha de rede" })

      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText("Digite sua resposta..."), "Resposta")
      await user.click(screen.getByRole("button", { name: /salvar resposta/i }))

      await waitFor(() => {
        expect(screen.getByTestId("saving-status-badge")).toHaveTextContent("Erro ao salvar")
      })
    })

    it("retorna ao estado idle após 3 segundos do status 'saved'", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })

      mockSaveQuestionnaireResponse.mockResolvedValue({ success: true })

      const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
      renderForm()

      await user.type(screen.getByPlaceholderText("Digite sua resposta..."), "Minha resposta")
      await user.click(screen.getByRole("button", { name: /salvar resposta/i }))

      await waitFor(() => {
        expect(screen.getByTestId("saving-status-badge")).toHaveTextContent("Salvo")
      })

      await act(async () => {
        vi.advanceTimersByTime(3100)
      })

      await waitFor(() => {
        expect(screen.queryByTestId("saving-status-badge")).not.toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe("Badge 'Última edição por [Nome]'", () => {
    it("exibe o nome do último editor quando existingAnswers contém last_edited_by_name", () => {
      renderForm({
        existingAnswers: {
          q1: {
            value: "Resposta existente",
            status: "rascunho",
            last_edited_by_name: "Maria Silva",
          },
        },
      })

      expect(screen.getByText(/Última edição por/i)).toBeInTheDocument()
      expect(screen.getByText("Maria Silva")).toBeInTheDocument()
    })

    it("não exibe o texto de última edição quando last_edited_by_name é nulo", () => {
      renderForm({
        existingAnswers: {
          q1: {
            value: "Resposta existente",
            status: "rascunho",
            last_edited_by_name: null,
          },
        },
      })

      expect(screen.queryByText(/Última edição por/i)).not.toBeInTheDocument()
    })

    it("não exibe o texto de última edição quando não há existingAnswers para a questão", () => {
      renderForm({ existingAnswers: {} })
      expect(screen.queryByText(/Última edição por/i)).not.toBeInTheDocument()
    })

    it("exibe o email como fallback quando full_name não está disponível", () => {
      renderForm({
        existingAnswers: {
          q1: {
            value: "Resposta existente",
            status: "rascunho",
            last_edited_by_name: "joao@empresa.com",
          },
        },
      })

      expect(screen.getByText("joao@empresa.com")).toBeInTheDocument()
    })

    it("exibe a data formatada em pt-BR quando last_edited_at está presente", () => {
      renderForm({
        existingAnswers: {
          q1: {
            value: "Resposta existente",
            status: "rascunho",
            last_edited_by_name: "danibkick@gmail.com",
            last_edited_at: "2026-08-06T14:30:00.000Z",
          },
        },
      })

      expect(screen.getByText(/Última edição por/i)).toBeInTheDocument()
      expect(screen.getByText("danibkick@gmail.com")).toBeInTheDocument()
      // A data deve ser formatada em algum formato dd/mm/yyyy com hora
      expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument()
    })

    it("não exibe a data quando last_edited_at é nulo, mesmo com nome presente", () => {
      renderForm({
        existingAnswers: {
          q1: {
            value: "Resposta existente",
            status: "rascunho",
            last_edited_by_name: "Carlos Souza",
            last_edited_at: null,
          },
        },
      })

      expect(screen.getByText(/Última edição por/i)).toBeInTheDocument()
      expect(screen.getByText("Carlos Souza")).toBeInTheDocument()
      // Nenhum padrão de data deve aparecer
      expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).not.toBeInTheDocument()
    })

    it("não exibe a data quando last_edited_at está ausente (undefined)", () => {
      renderForm({
        existingAnswers: {
          q1: {
            value: "Resposta existente",
            status: "rascunho",
            last_edited_by_name: "Ana Lima",
          },
        },
      })

      expect(screen.getByText("Ana Lima")).toBeInTheDocument()
      expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).not.toBeInTheDocument()
    })
  })

  describe("Estado de salvamento por questão", () => {
    it("chama saveQuestionnaireResponse com os parâmetros corretos", async () => {
      mockSaveQuestionnaireResponse.mockResolvedValue({ success: true })

      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText("Digite sua resposta..."), "Minha resposta de teste")
      await user.click(screen.getByRole("button", { name: /salvar resposta/i }))

      await waitFor(() => {
        expect(mockSaveQuestionnaireResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            templateId: "template-1",
            questionId: "q1",
            userId: "user-1",
            companyId: "company-1",
            holdingId: null,
            responseValue: "Minha resposta de teste",
          })
        )
      })
    })

    it("exibe toast de sucesso após salvar", async () => {
      mockSaveQuestionnaireResponse.mockResolvedValue({ success: true })

      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText("Digite sua resposta..."), "Resposta válida")
      await user.click(screen.getByRole("button", { name: /salvar resposta/i }))

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Resposta salva com sucesso!")
      })
    })

    it("exibe toast de erro quando a action retorna erro", async () => {
      mockSaveQuestionnaireResponse.mockResolvedValue({ error: "Erro interno" })

      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByPlaceholderText("Digite sua resposta..."), "Resposta que vai falhar")
      await user.click(screen.getByRole("button", { name: /salvar resposta/i }))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Erro interno")
      })
    })

    it("desabilita o botão de salvar quando o campo está vazio", () => {
      renderForm()
      const saveButton = screen.getByRole("button", { name: /salvar resposta/i })
      expect(saveButton).toBeDisabled()
    })
  })

  describe("Questão aprovada (locked)", () => {
    it("renderiza o badge 'Aprovada' para questões aprovadas", () => {
      renderForm({
        existingAnswers: {
          q1: { value: "Aprovada", status: "aprovado" },
        },
      })

      expect(screen.getByText("Aprovada")).toBeInTheDocument()
    })
  })

  describe("Collapse / Accordion", () => {
    it("exibe o botão de collapse em cada questão", () => {
      renderForm()
      expect(screen.getByRole("button", { name: /minimizar questão/i })).toBeInTheDocument()
    })

    it("questão sem resposta começa expandida", () => {
      renderForm({ existingAnswers: {} })
      // Campo de resposta deve estar visível
      expect(screen.getByPlaceholderText("Digite sua resposta...")).toBeInTheDocument()
    })

    it("questão com resposta existente começa minimizada (campo oculto pelo CSS grid)", () => {
      renderForm({
        existingAnswers: {
          q1: { value: "Resposta existente", status: "rascunho" },
        },
      })
      // O botão deve indicar "expandir" (questão está colapsada)
      expect(screen.getByRole("button", { name: /expandir questão/i })).toBeInTheDocument()
    })

    it("clicar no botão expande uma questão colapsada", async () => {
      const user = userEvent.setup()
      renderForm({
        existingAnswers: {
          q1: { value: "Resposta existente", status: "rascunho" },
        },
      })

      const expandBtn = screen.getByRole("button", { name: /expandir questão/i })
      await user.click(expandBtn)

      expect(screen.getByRole("button", { name: /minimizar questão/i })).toBeInTheDocument()
    })

    it("clicar no botão colapsa uma questão expandida", async () => {
      const user = userEvent.setup()
      renderForm({ existingAnswers: {} })

      const collapseBtn = screen.getByRole("button", { name: /minimizar questão/i })
      await user.click(collapseBtn)

      expect(screen.getByRole("button", { name: /expandir questão/i })).toBeInTheDocument()
    })

    it("questão com ajuste pendente NÃO começa colapsada", () => {
      renderForm({
        questions: [
          {
            ...baseQuestion,
            comment: "Precisa de ajuste nesta resposta",
            comment_author_name: "Gestor",
          },
        ],
        existingAnswers: {
          q1: { value: "Resposta com problema", status: "rascunho" },
        },
      })

      // Deve iniciar expandida (botão mostra "minimizar")
      expect(screen.getByRole("button", { name: /minimizar questão/i })).toBeInTheDocument()
    })
  })
})
