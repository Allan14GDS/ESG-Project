import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BlogPostPage, { type SinglePost } from "./page";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

// vi.hoisted garante que as variáveis existam antes do hoist do vi.mock()
const mockSanityFetch = vi.hoisted(() => vi.fn());
const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    // Replica o comportamento do Next.js: lança um erro especial que
    // interrompe a execução do Server Component, causando a página 404.
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/sanity/lib/live", () => ({
  sanityFetch: mockSanityFetch,
  SanityLive: () => null,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({
    width: () => ({
      height: () => ({
        fit: () => ({
          url: () => "https://cdn.sanity.io/mock-image.jpg",
        }),
      }),
    }),
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    "data-testid": testId,
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...rest
  }: {
    src: string;
    alt: string;
    "data-testid"?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} data-testid={testId} {...(rest as object)} />,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...(rest as object)}>
      {children}
    </a>
  ),
}));

// Mock do PortableText: renderiza o texto dos spans para que os testes possam
// assertar que o conteúdo do corpo está presente no DOM.
vi.mock("@portabletext/react", () => ({
  PortableText: ({
    value,
  }: {
    value: Array<{
      _key: string;
      _type: string;
      children?: Array<{ text: string }>;
    }>;
  }) => (
    <div data-testid="portable-text-body">
      {value.map((block) => (
        <p key={block._key}>
          {block.children?.map((span) => span.text).join("") ?? ""}
        </p>
      ))}
    </div>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_BODY: SinglePost["body"] = [
  {
    _key: "block-001",
    _type: "block",
    style: "normal",
    children: [
      {
        _key: "span-001",
        _type: "span",
        text: "As práticas ESG estão transformando o mercado financeiro global.",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _key: "block-002",
    _type: "block",
    style: "h2",
    children: [
      {
        _key: "span-002",
        _type: "span",
        text: "Por que o ESG importa para investidores",
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _key: "block-003",
    _type: "block",
    style: "normal",
    children: [
      {
        _key: "span-003",
        _type: "span",
        text: "Empresas com melhor rating ESG apresentam menor risco de longo prazo.",
        marks: [],
      },
    ],
    markDefs: [],
  },
];

const MOCK_POST: SinglePost = {
  _id: "post-001",
  title: "O Guia Definitivo de ESG para Investidores",
  slug: { current: "guia-definitivo-esg-investidores" },
  publishedAt: "2026-04-15T12:00:00Z",
  excerpt: "Tudo o que você precisa saber sobre critérios ESG e como eles impactam seus investimentos.",
  mainImage: {
    _type: "image",
    asset: { _ref: "image-abc123-1400x700-jpg", _type: "reference" },
    alt: "Gráfico de crescimento ESG",
  },
  author: { name: "Allan Ribeiro" },
  categories: [
    { _id: "cat-001", title: "ESG" },
    { _id: "cat-002", title: "Investimentos" },
  ],
  body: MOCK_BODY,
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function renderPage(slug = "guia-definitivo-esg-investidores") {
  const ui = await BlogPostPage({ params: Promise.resolve({ slug }) });
  return render(ui);
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe("BlogPostPage", () => {
  beforeEach(() => {
    mockSanityFetch.mockClear();
    mockNotFound.mockClear();
  });

  // ── Cenário: post encontrado ─────────────────────────────────────────────

  describe("quando o post existe", () => {
    beforeEach(async () => {
      mockSanityFetch.mockResolvedValue({ data: MOCK_POST });
      await renderPage();
    });

    it("deve renderizar o título do post", () => {
      expect(screen.getByTestId("post-title")).toHaveTextContent(
        "O Guia Definitivo de ESG para Investidores",
      );
    });

    it("deve expor o título como heading acessível", () => {
      expect(
        screen.getByRole("heading", {
          name: /Guia Definitivo de ESG para Investidores/i,
        }),
      ).toBeInTheDocument();
    });

    it("deve renderizar o nome do autor", () => {
      expect(screen.getByTestId("post-author")).toHaveTextContent("Allan Ribeiro");
    });

    it("deve renderizar a data de publicação formatada", () => {
      const dateEl = screen.getByTestId("post-date");
      expect(dateEl).toBeInTheDocument();
      expect(dateEl.querySelector("time")).toHaveAttribute(
        "dateTime",
        "2026-04-15T12:00:00Z",
      );
    });

    it("deve renderizar a imagem de capa com a URL gerada pelo urlFor", () => {
      const img = screen.getByTestId("post-cover-image");
      expect(img).toHaveAttribute("src", "https://cdn.sanity.io/mock-image.jpg");
      expect(img).toHaveAttribute("alt", "Gráfico de crescimento ESG");
    });

    it("deve renderizar o corpo do artigo via PortableText", () => {
      expect(screen.getByTestId("post-body")).toBeInTheDocument();
      expect(screen.getByTestId("portable-text-body")).toBeInTheDocument();
    });

    it("deve renderizar o texto do primeiro parágrafo do corpo", () => {
      expect(
        screen.getByText(
          "As práticas ESG estão transformando o mercado financeiro global.",
        ),
      ).toBeInTheDocument();
    });

    it("deve renderizar o subtítulo H2 do corpo", () => {
      expect(
        screen.getByText("Por que o ESG importa para investidores"),
      ).toBeInTheDocument();
    });

    it("deve renderizar as categorias do post", () => {
      expect(screen.getByTestId("post-categories")).toHaveTextContent("ESG");
      expect(screen.getByTestId("post-categories")).toHaveTextContent("Investimentos");
    });

    it("deve exibir o link de retorno para a listagem do blog", () => {
      const backLink = screen.getByRole("link", { name: /Voltar para o blog/i });
      expect(backLink).toHaveAttribute("href", "/blog");
    });

    it("não deve chamar notFound quando o post existe", () => {
      expect(mockNotFound).not.toHaveBeenCalled();
    });
  });

  // ── Cenário: post sem imagem de capa ────────────────────────────────────

  describe("quando o post não tem imagem de capa", () => {
    it("deve renderizar o placeholder no lugar da imagem", async () => {
      mockSanityFetch.mockResolvedValue({
        data: { ...MOCK_POST, mainImage: undefined },
      });
      await renderPage();
      expect(screen.getByTestId("post-cover-placeholder")).toBeInTheDocument();
      expect(screen.queryByTestId("post-cover-image")).not.toBeInTheDocument();
    });
  });

  // ── Cenário: post sem body ───────────────────────────────────────────────

  describe("quando o post não tem corpo", () => {
    it("deve renderizar sem quebrar e ocultar a secção do body", async () => {
      mockSanityFetch.mockResolvedValue({
        data: { ...MOCK_POST, body: undefined },
      });
      await renderPage();
      expect(screen.getByTestId("post-title")).toBeInTheDocument();
      expect(screen.queryByTestId("post-body")).not.toBeInTheDocument();
    });
  });

  // ── Cenário: post não encontrado (404) ──────────────────────────────────

  describe("quando o slug não corresponde a nenhum post", () => {
    it("deve chamar notFound() exactamente uma vez", async () => {
      mockSanityFetch.mockResolvedValue({ data: null });
      await expect(() => renderPage("slug-inexistente")).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("não deve tentar renderizar conteúdo quando post é null", async () => {
      mockSanityFetch.mockResolvedValue({ data: null });
      try {
        await renderPage("slug-inexistente");
      } catch {
        // Expected NEXT_NOT_FOUND throw — nothing was rendered
      }
      expect(screen.queryByTestId("post-title")).not.toBeInTheDocument();
      expect(screen.queryByTestId("post-body")).not.toBeInTheDocument();
    });
  });

  // ── Integração com sanityFetch ──────────────────────────────────────────

  describe("integração com o Sanity", () => {
    it("deve chamar sanityFetch exactamente uma vez", async () => {
      mockSanityFetch.mockResolvedValue({ data: MOCK_POST });
      await renderPage();
      expect(mockSanityFetch).toHaveBeenCalledTimes(1);
    });

    it("deve passar o slug correcto nos params da query GROQ", async () => {
      mockSanityFetch.mockResolvedValue({ data: MOCK_POST });
      await renderPage("guia-definitivo-esg-investidores");
      const callArg = mockSanityFetch.mock.calls[0][0] as {
        query: string;
        params: { slug: string };
      };
      expect(callArg.params.slug).toBe("guia-definitivo-esg-investidores");
      expect(callArg.query).toContain("slug.current == $slug");
    });
  });
});
