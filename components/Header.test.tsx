import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Header from "./Header";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <button className={className}>{children}</button>,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock("lucide-react", () => ({
  Menu: () => <svg data-testid="menu-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

describe("Header", () => {
  describe("desktop navigation", () => {
    it("renders all nav links", () => {
      render(<Header />);

      expect(screen.getByRole("link", { name: "Sobre" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Funcionalidades" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Jornada ESG" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Metodologias" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Contato" })
      ).toBeInTheDocument();
    });

    it("renders the Blog link with the correct href", () => {
      render(<Header />);

      const blogLinks = screen.getAllByRole("link", { name: "Blog" });
      expect(blogLinks.length).toBeGreaterThanOrEqual(1);
      expect(blogLinks[0]).toHaveAttribute("href", "/blog");
    });

    it("positions Blog after Contato in the nav order", () => {
      render(<Header />);

      const nav = document.querySelector("nav");
      if (!nav) throw new Error("nav element not found");

      const links = Array.from(nav.querySelectorAll("a")).map(
        (a) => a.textContent
      );
      const contatoIndex = links.indexOf("Contato");
      const blogIndex = links.indexOf("Blog");

      expect(contatoIndex).toBeGreaterThanOrEqual(0);
      expect(blogIndex).toBe(contatoIndex + 1);
    });

    it("applies consistent Tailwind classes to the Blog link", () => {
      render(<Header />);

      const nav = document.querySelector("nav");
      if (!nav) throw new Error("nav element not found");

      const navAnchors = Array.from(nav.querySelectorAll("a"));
      const blogLink = navAnchors.find((a) => a.textContent === "Blog");
      const sobreLink = navAnchors.find((a) => a.textContent === "Sobre");

      expect(blogLink).toBeDefined();
      expect(sobreLink).toBeDefined();
      expect(blogLink!.className).toBe(sobreLink!.className);
    });

    it("renders the login button", () => {
      render(<Header />);

      expect(screen.getByText("Fazer Login")).toBeInTheDocument();
    });
  });

  // ── Roteamento — hrefs dos links principais ──────────────────────────────
  // Garante hrefs absolutos para que os links funcionem a partir de qualquer rota (ex: /blog).

  describe("roteamento — hrefs dos links principais", () => {
    it("o link 'Blog' aponta para /blog", () => {
      render(<Header />);
      const blogLinks = screen.getAllByRole("link", { name: "Blog" });
      expect(blogLinks[0]).toHaveAttribute("href", "/blog");
    });

    it("o link 'Fazer Login' aponta para /auth/login", () => {
      render(<Header />);
      const loginLink = screen.getByText("Fazer Login").closest("a");
      expect(loginLink).toHaveAttribute("href", "/auth/login");
    });

    it("o link 'Sobre' aponta para /#sobre (rota absoluta para funcionar em qualquer página)", () => {
      render(<Header />);
      expect(screen.getByRole("link", { name: "Sobre" })).toHaveAttribute("href", "/#sobre");
    });

    it("o link 'Funcionalidades' aponta para /#funcionalidades", () => {
      render(<Header />);
      expect(
        screen.getByRole("link", { name: "Funcionalidades" })
      ).toHaveAttribute("href", "/#funcionalidades");
    });

    it("o link 'Jornada ESG' aponta para /#jornada", () => {
      render(<Header />);
      expect(
        screen.getByRole("link", { name: "Jornada ESG" })
      ).toHaveAttribute("href", "/#jornada");
    });

    it("o link 'Metodologias' aponta para /#metodologias", () => {
      render(<Header />);
      expect(
        screen.getByRole("link", { name: "Metodologias" })
      ).toHaveAttribute("href", "/#metodologias");
    });

    it("o link 'Contato' aponta para /#contato", () => {
      render(<Header />);
      expect(screen.getByRole("link", { name: "Contato" })).toHaveAttribute("href", "/#contato");
    });

    it("nenhum link de âncora usa href relativo sem a rota raiz (regressão cross-route)", () => {
      render(<Header />);
      const nav = document.querySelector("nav");
      if (!nav) throw new Error("nav element not found");

      const anchorLinks = Array.from(nav.querySelectorAll("a")).filter((a) =>
        a.getAttribute("href")?.startsWith("#")
      );
      expect(anchorLinks).toHaveLength(0);
    });
  });

  describe("mobile navigation", () => {
    it("is hidden by default", () => {
      render(<Header />);

      const mobileMenu = document.querySelector(".md\\:hidden.border-t");
      expect(mobileMenu).not.toBeInTheDocument();
    });

    it("opens mobile menu when hamburger button is clicked", () => {
      render(<Header />);

      const menuButton = screen.getByTestId("menu-icon").closest("button");
      if (!menuButton) throw new Error("hamburger button not found");

      fireEvent.click(menuButton);

      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    });

    it("renders the Blog link in the mobile menu after opening", () => {
      render(<Header />);

      const menuButton = screen.getByTestId("menu-icon").closest("button");
      if (!menuButton) throw new Error("hamburger button not found");

      fireEvent.click(menuButton);

      const blogLinks = screen.getAllByRole("link", { name: "Blog" });
      const mobileBlogLink = blogLinks.find((link) =>
        link.className.includes("block")
      );
      expect(mobileBlogLink).toBeInTheDocument();
      expect(mobileBlogLink).toHaveAttribute("href", "/blog");
    });

    it("closes mobile menu when a nav link is clicked", () => {
      render(<Header />);

      const menuButton = screen.getByTestId("menu-icon").closest("button");
      if (!menuButton) throw new Error("hamburger button not found");

      fireEvent.click(menuButton);
      expect(screen.getByTestId("x-icon")).toBeInTheDocument();

      const blogLinks = screen.getAllByRole("link", { name: "Blog" });
      const mobileBlogLink = blogLinks.find((link) =>
        link.className.includes("block")
      );
      if (!mobileBlogLink) throw new Error("mobile Blog link not found");

      fireEvent.click(mobileBlogLink);

      expect(screen.queryByTestId("x-icon")).not.toBeInTheDocument();
    });
  });
});
