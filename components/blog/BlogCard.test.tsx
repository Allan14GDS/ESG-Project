import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlogCard, type BlogPost } from "./BlogCard";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

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
    sizes: _sizes,
    ...rest
  }: {
    src: string;
    alt: string;
    "data-testid"?: string;
    fill?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid={testId} {...(rest as object)} />
  ),
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_POST: BlogPost = {
  _id: "post-001",
  title: "ESG Report: O Futuro da Sustentabilidade Corporativa",
  slug: { current: "esg-report-futuro-sustentabilidade" },
  excerpt:
    "Descubra como as empresas líderes estão integrando práticas ESG para criar valor a longo prazo e atrair investidores responsáveis.",
  publishedAt: "2026-04-15T12:00:00Z",
  mainImage: {
    _type: "image",
    asset: { _ref: "image-abc123-800x450-jpg", _type: "reference" },
    alt: "Imagem de sustentabilidade corporativa",
  },
  author: { name: "Allan Ribeiro" },
  categories: [
    { _id: "cat-001", title: "ESG" },
    { _id: "cat-002", title: "Sustentabilidade" },
  ],
};

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe("BlogCard", () => {
  // ── Skeleton State ──────────────────────────────────────────────────────────

  describe("quando isLoading é true", () => {
    beforeEach(() => {
      render(<BlogCard isLoading />);
    });

    it("deve renderizar o skeleton sem quebrar", () => {
      expect(screen.getByTestId("blog-card-skeleton")).toBeInTheDocument();
    });

    it("deve exibir o aria-label de carregamento", () => {
      expect(screen.getByLabelText("Carregando post...")).toBeInTheDocument();
    });

    it("não deve renderizar o card de post enquanto carrega", () => {
      expect(screen.queryByTestId("blog-card")).not.toBeInTheDocument();
    });
  });

  describe("quando nenhum post é fornecido", () => {
    it("deve exibir o skeleton como fallback seguro", () => {
      render(<BlogCard />);
      expect(screen.getByTestId("blog-card-skeleton")).toBeInTheDocument();
    });
  });

  // ── Post Content ────────────────────────────────────────────────────────────

  describe("quando post é fornecido com dados completos", () => {
    beforeEach(() => {
      render(<BlogCard post={MOCK_POST} />);
    });

    it("deve renderizar o card principal sem quebrar", () => {
      expect(screen.getByTestId("blog-card")).toBeInTheDocument();
    });

    it("não deve exibir o skeleton quando os dados estão disponíveis", () => {
      expect(screen.queryByTestId("blog-card-skeleton")).not.toBeInTheDocument();
    });

    it("deve exibir o título do post", () => {
      expect(screen.getByTestId("blog-card-title")).toHaveTextContent(
        "ESG Report: O Futuro da Sustentabilidade Corporativa",
      );
    });

    it("deve exibir o resumo (excerpt) do post", () => {
      expect(screen.getByTestId("blog-card-excerpt")).toHaveTextContent(
        "Descubra como as empresas líderes estão integrando práticas ESG",
      );
    });

    it("deve exibir o nome do autor", () => {
      expect(screen.getByTestId("blog-card-author")).toHaveTextContent("Allan Ribeiro");
    });

    it("deve exibir a data de publicação formatada em pt-BR", () => {
      const dateElement = screen.getByTestId("blog-card-date");
      expect(dateElement).toBeInTheDocument();
      expect(dateElement.querySelector("time")).toHaveAttribute(
        "dateTime",
        "2026-04-15T12:00:00Z",
      );
    });

    it("deve renderizar a imagem com a URL gerada pelo urlFor", () => {
      const img = screen.getByTestId("blog-card-image");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://cdn.sanity.io/mock-image.jpg");
      expect(img).toHaveAttribute("alt", "Imagem de sustentabilidade corporativa");
    });

    it("deve renderizar todas as categorias", () => {
      const categories = screen.getByTestId("blog-card-categories");
      expect(categories).toHaveTextContent("ESG");
      expect(categories).toHaveTextContent("Sustentabilidade");
    });

    it("deve vincular o título ao slug correto do post", () => {
      const links = screen.getAllByRole("link");
      const postLinks = links.filter((link) =>
        link.getAttribute("href")?.includes("esg-report-futuro-sustentabilidade"),
      );
      expect(postLinks.length).toBeGreaterThan(0);
    });
  });

  // ── Post sem imagem ─────────────────────────────────────────────────────────

  describe("quando o post não tem imagem de capa", () => {
    it("deve exibir o placeholder no lugar da imagem", () => {
      const postSemImagem: BlogPost = { ...MOCK_POST, mainImage: undefined };
      render(<BlogCard post={postSemImagem} />);
      expect(screen.getByTestId("blog-card-image-placeholder")).toBeInTheDocument();
      expect(screen.queryByTestId("blog-card-image")).not.toBeInTheDocument();
    });
  });

  // ── Post sem campos opcionais ───────────────────────────────────────────────

  describe("quando o post não tem autor nem categorias", () => {
    it("deve renderizar sem quebrar mesmo com campos opcionais ausentes", () => {
      const postMinimo: BlogPost = {
        _id: "post-002",
        title: "Post Mínimo",
        slug: { current: "post-minimo" },
      };
      render(<BlogCard post={postMinimo} />);

      expect(screen.getByTestId("blog-card")).toBeInTheDocument();
      expect(screen.getByTestId("blog-card-title")).toHaveTextContent("Post Mínimo");
      expect(screen.queryByTestId("blog-card-author")).not.toBeInTheDocument();
      expect(screen.queryByTestId("blog-card-categories")).not.toBeInTheDocument();
      expect(screen.queryByTestId("blog-card-excerpt")).not.toBeInTheDocument();
    });
  });
});
