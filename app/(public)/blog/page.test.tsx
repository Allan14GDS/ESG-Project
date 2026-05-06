import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BlogPage, {
  BlogPostsList,
  BlogPostsSkeleton,
  sortPosts,
  type AllPostsQueryResult,
} from "./page";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

const mockSanityFetch = vi.hoisted(() => vi.fn());

vi.mock("@/sanity/lib/live", () => ({
  sanityFetch: mockSanityFetch,
  SanityLive: () => null,
}));

// Isola BlogCard, FeaturedPost e os skeletons: cada um tem seu próprio arquivo
// de testes. Aqui validamos apenas a responsabilidade da página.
vi.mock("@/components/blog/BlogCard", () => ({
  BlogCard: ({ post }: { post?: { _id: string; title: string } }) =>
    post ? (
      <article data-testid="blog-card" data-post-id={post._id}>
        {post.title}
      </article>
    ) : null,
  FeaturedPost: ({ post }: { post?: { _id: string; title: string } }) =>
    post ? (
      <article data-testid="blog-featured-post" data-post-id={post._id}>
        {post.title}
      </article>
    ) : null,
  BlogCardSkeleton: () => (
    <div data-testid="blog-card-skeleton" aria-label="Carregando post..." />
  ),
  FeaturedPostSkeleton: () => (
    <div
      data-testid="blog-featured-skeleton"
      aria-label="Carregando artigo em destaque..."
    />
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_POSTS: AllPostsQueryResult = [
  {
    _id: "post-001",
    _createdAt: "2026-04-15T12:00:00Z",
    title: "ESG Report: O Futuro da Sustentabilidade",
    slug: { current: "esg-report-futuro" },
    publishedAt: "2026-04-15T12:00:00Z",
    excerpt: "Empresas líderes estão integrando práticas ESG para criar valor.",
    mainImage: {
      _type: "image",
      asset: { _ref: "image-abc-800x450-jpg", _type: "reference" },
      alt: "Sustentabilidade corporativa",
    },
    author: { name: "Allan Ribeiro" },
    categories: [{ _id: "cat-001", title: "ESG" }],
  },
  {
    _id: "post-002",
    _createdAt: "2026-03-10T10:00:00Z",
    title: "GRI 2021: Guia Completo para Iniciantes",
    slug: { current: "gri-2021-guia" },
    publishedAt: "2026-03-10T10:00:00Z",
    excerpt: "Tudo o que você precisa saber sobre o padrão GRI 2021.",
    mainImage: undefined,
    author: { name: "Maria Costa" },
    categories: [{ _id: "cat-002", title: "GRI" }],
  },
  {
    _id: "post-003",
    _createdAt: "2026-02-20T08:00:00Z",
    title: "Divulgação de Escopo 3: Desafios e Soluções",
    slug: { current: "escopo-3-desafios" },
    publishedAt: "2026-02-20T08:00:00Z",
    excerpt: "Como mensurar e reportar as emissões indiretas de forma eficaz.",
    mainImage: undefined,
    author: undefined,
    categories: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Renderiza a parte assíncrona da página (fetch + layout de posts).
async function renderPostsList() {
  const ui = await BlogPostsList();
  return render(ui);
}

beforeEach(() => {
  mockSanityFetch.mockClear();
});

// ─── Test Suites ──────────────────────────────────────────────────────────────

// ── 1. sortPosts — regra de negócio pura ─────────────────────────────────────

describe("sortPosts", () => {
  it("ordena posts do mais recente para o mais antigo por publishedAt", () => {
    const posts: AllPostsQueryResult = [
      {
        _id: "old",
        _createdAt: "2026-01-01T00:00:00Z",
        title: "Post Antigo",
        slug: { current: "post-antigo" },
        publishedAt: "2026-01-01T00:00:00Z",
      },
      {
        _id: "new",
        _createdAt: "2026-06-01T00:00:00Z",
        title: "Post Novo",
        slug: { current: "post-novo" },
        publishedAt: "2026-06-01T00:00:00Z",
      },
    ];

    const sorted = sortPosts(posts);

    expect(sorted[0]._id).toBe("new");
    expect(sorted[1]._id).toBe("old");
  });

  it("desempata pelo _createdAt mais recente quando publishedAt é idêntico", () => {
    const SAME_DATE = "2026-02-26";

    const posts: AllPostsQueryResult = [
      {
        _id: "inserido-primeiro",
        _createdAt: "2026-02-26T09:00:00Z",
        title: "Post Inserido Primeiro",
        slug: { current: "inserido-primeiro" },
        publishedAt: SAME_DATE,
      },
      {
        _id: "inserido-depois",
        _createdAt: "2026-02-26T15:30:00Z",
        title: "Post Inserido Depois",
        slug: { current: "inserido-depois" },
        publishedAt: SAME_DATE,
      },
    ];

    const sorted = sortPosts(posts);

    expect(sorted[0]._id).toBe("inserido-depois");
    expect(sorted[1]._id).toBe("inserido-primeiro");
  });

  it("não muta o array original", () => {
    const posts: AllPostsQueryResult = [
      {
        _id: "b",
        _createdAt: "2026-01-01T00:00:00Z",
        title: "B",
        slug: { current: "b" },
        publishedAt: "2026-01-01T00:00:00Z",
      },
      {
        _id: "a",
        _createdAt: "2026-06-01T00:00:00Z",
        title: "A",
        slug: { current: "a" },
        publishedAt: "2026-06-01T00:00:00Z",
      },
    ];

    const originalOrder = posts.map((p) => p._id);
    sortPosts(posts);

    expect(posts.map((p) => p._id)).toEqual(originalOrder);
  });
});

// ── 2. Estado de Carregamento — Skeleton ──────────────────────────────────────
// Testa o componente que representa o estado de loading (Suspense fallback).

describe("estado de carregamento — skeleton", () => {
  it("deve renderizar o skeleton da página enquanto carrega", () => {
    render(<BlogPostsSkeleton />);
    expect(screen.getByTestId("blog-posts-skeleton")).toBeInTheDocument();
  });

  it("deve renderizar o skeleton do hero em destaque", () => {
    render(<BlogPostsSkeleton />);
    expect(screen.getByTestId("blog-featured-skeleton")).toBeInTheDocument();
  });

  it("deve renderizar múltiplos skeletons de card no grid", () => {
    render(<BlogPostsSkeleton />);
    const cardSkeletons = screen.getAllByTestId("blog-card-skeleton");
    expect(cardSkeletons.length).toBeGreaterThan(0);
  });

  it("não deve renderizar cards reais enquanto carrega", () => {
    render(<BlogPostsSkeleton />);
    expect(screen.queryByTestId("blog-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("blog-featured-post")).not.toBeInTheDocument();
  });
});

// ── 3. Estado de Sucesso — posts carregados ───────────────────────────────────
// Testa que, após o carregamento, os artigos são renderizados e os skeletons sumem.

describe("estado de sucesso — posts carregados", () => {
  it("deve renderizar o hero e os cards após o carregamento", async () => {
    mockSanityFetch.mockResolvedValue({ data: MOCK_POSTS });
    await renderPostsList();

    expect(screen.getByTestId("blog-featured-post")).toBeInTheDocument();
    expect(screen.getAllByTestId("blog-card")).toHaveLength(MOCK_POSTS.length);
  });

  it("não deve exibir nenhum skeleton após o carregamento concluir", async () => {
    mockSanityFetch.mockResolvedValue({ data: MOCK_POSTS });
    await renderPostsList();

    expect(screen.queryByTestId("blog-posts-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("blog-featured-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("blog-card-skeleton")).not.toBeInTheDocument();
  });
});

// ── 4. Segregação estrutural ─────────────────────────────────────────────────

describe("segregação estrutural da página", () => {
  it("o Hero recebe posts[0] e o Grid renderiza o array completo (X cards)", async () => {
    mockSanityFetch.mockResolvedValue({ data: MOCK_POSTS });
    await renderPostsList();

    const featured = screen.getByTestId("blog-featured-post");
    const gridCards = screen.getAllByTestId("blog-card");

    expect(featured).toHaveAttribute("data-post-id", MOCK_POSTS[0]._id);

    expect(gridCards).toHaveLength(MOCK_POSTS.length);
    expect(gridCards[0]).toHaveAttribute("data-post-id", MOCK_POSTS[0]._id);
  });
});

// ── 5. Cabeçalho da página ───────────────────────────────────────────────────
// O cabeçalho é renderizado fora do Suspense: sempre visível, independente do fetch.

describe("cabeçalho da página", () => {
  beforeEach(() => {
    // Promise pendente: mantém o Suspense no fallback sem updates pós-render.
    mockSanityFetch.mockReturnValue(new Promise(() => {}));
    render(<BlogPage />);
  });

  it("deve renderizar o título principal 'Blog ESG'", () => {
    expect(screen.getByTestId("blog-page-title")).toHaveTextContent("Blog ESG");
  });

  it("deve expor o título como um heading acessível", () => {
    expect(screen.getByRole("heading", { name: /Blog ESG/i })).toBeInTheDocument();
  });

  it("deve exibir o rótulo da seção de insights", () => {
    expect(screen.getByText(/Conteúdo & Insights/i)).toBeInTheDocument();
  });
});

// ── 6. Estado vazio ──────────────────────────────────────────────────────────

describe("quando não há posts publicados", () => {
  beforeEach(async () => {
    mockSanityFetch.mockResolvedValue({ data: [] });
    await renderPostsList();
  });

  it("deve exibir o estado vazio", () => {
    expect(screen.getByTestId("blog-empty-state")).toBeInTheDocument();
  });

  it("deve exibir a mensagem 'Nenhum artigo publicado ainda.'", () => {
    expect(screen.getByText("Nenhum artigo publicado ainda.")).toBeInTheDocument();
  });

  it("não deve renderizar o featured post nem o grid", () => {
    expect(screen.queryByTestId("blog-featured-post")).not.toBeInTheDocument();
    expect(screen.queryByTestId("blog-posts-grid")).not.toBeInTheDocument();
  });
});

// ── 7. Integração com sanityFetch ────────────────────────────────────────────

describe("integração com o Sanity", () => {
  it("deve chamar sanityFetch exatamente uma vez ao renderizar", async () => {
    mockSanityFetch.mockResolvedValue({ data: [] });
    await renderPostsList();
    expect(mockSanityFetch).toHaveBeenCalledTimes(1);
  });

  it("deve passar a query GROQ correta com ordenação e desempate", async () => {
    mockSanityFetch.mockResolvedValue({ data: [] });
    await renderPostsList();

    const callArg = mockSanityFetch.mock.calls[0][0] as { query: string };
    expect(callArg.query).toContain('_type == "post"');
    expect(callArg.query).toContain("order(publishedAt desc, _createdAt desc)");
  });
});
